import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sliceRoot = path.resolve(here, '..');
const repoRoot = path.resolve(sliceRoot, '..', '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(sliceRoot, p), 'utf8'));
const errors = [];
const ok = (condition, message) => { if (!condition) errors.push(message); };

const manifest = readJson('contracts/frozen-contract-manifest.json');
const baseline = readJson('dependencies/dependency-baseline.json');
const boundaries = readJson('architecture/module-boundaries.json');
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');

ok(manifest.schemaVersion === 'talos.contract-manifest.v1', 'unexpected contract manifest schema');
ok(manifest.buildAuthorizationScope === 'build/reference-vertical-slice/', 'build authorization scope drift');
ok(Array.isArray(manifest.contracts) && manifest.contracts.length >= 17, 'frozen contract manifest is incomplete');

const allPinned = [...manifest.contracts, ...manifest.phaseConsolidations, ...manifest.buildGovernance];
const seenPaths = new Set();
for (const item of allPinned) {
  ok(/^[0-9a-f]{40}$/.test(item.blobSha), `invalid blob sha: ${item.path}`);
  ok(!seenPaths.has(item.path), `duplicate pinned path: ${item.path}`);
  seenPaths.add(item.path);
}

if (process.env.TALOS_SKIP_CONTRACT_HASH !== '1') {
  for (const item of allPinned) {
    const absolute = path.join(repoRoot, item.path);
    ok(fs.existsSync(absolute), `pinned file missing: ${item.path}`);
    if (!fs.existsSync(absolute)) continue;
    try {
      const sha = execFileSync('git', ['hash-object', absolute], { encoding: 'utf8' }).trim();
      ok(sha === item.blobSha, `frozen blob drift: ${item.path} expected=${item.blobSha} actual=${sha}`);
    } catch (error) {
      errors.push(`unable to hash ${item.path}: ${error.message}`);
    }
  }
}

ok(pkg.private === true, 'reference workspace must remain private');
ok(pkg.type === 'module', 'workspace must use ESM module mode');
ok(Array.isArray(pkg.workspaces) && pkg.workspaces.join('|') === 'packages/*|apps/*|workers/*', 'workspace roots drift');
ok(pkg.scripts?.['b0:verify'] === 'node ./scripts/verify-b0.mjs', 'B0 verification script missing');
ok(lock.lockfileVersion === 3, 'npm lockfile v3 required');
ok(lock.packages?.['']?.name === pkg.name, 'package-lock root does not match package.json');

const forbiddenSpec = /^(?:\^|~|>|<|\*|latest$|next$)/;
const depNames = new Set();
for (const dep of baseline.dependencies) {
  ok(!depNames.has(dep.name), `duplicate dependency baseline entry: ${dep.name}`);
  depNames.add(dep.name);
  ok(typeof dep.version === 'string' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(dep.version), `dependency must be exact semver: ${dep.name}@${dep.version}`);
  ok(!forbiddenSpec.test(dep.version), `dependency range/dist-tag forbidden: ${dep.name}@${dep.version}`);
}
ok(!depNames.has('temporalio'), 'deprecated temporalio meta package is forbidden');
const temporalVersions = baseline.dependencies.filter((d) => d.name.startsWith('@temporalio/')).map((d) => d.version);
ok(new Set(temporalVersions).size <= 1, 'Temporal SDK package versions must be aligned in reference baseline');

ok(Object.keys(pkg.dependencies ?? {}).length === 0, 'B0 package.json must not install runtime dependencies yet');
ok(Object.keys(pkg.devDependencies ?? {}).length === 0, 'B0 package.json must not install dev dependencies yet');

const modulesByName = new Map(boundaries.modules.map((m) => [m.name, m]));
ok(modulesByName.size === boundaries.modules.length, 'duplicate module names');
const roots = new Set();
for (const mod of boundaries.modules) {
  ok(!roots.has(mod.root), `duplicate module root: ${mod.root}`);
  roots.add(mod.root);
  for (const allowed of mod.allowedInternalImports) ok(modulesByName.has(allowed), `${mod.name} references unknown internal module ${allowed}`);
}

const visiting = new Set();
const visited = new Set();
const visit = (name, stack = []) => {
  if (visited.has(name)) return;
  if (visiting.has(name)) {
    errors.push(`internal dependency cycle: ${[...stack, name].join(' -> ')}`);
    return;
  }
  visiting.add(name);
  const mod = modulesByName.get(name);
  for (const child of mod.allowedInternalImports) visit(child, [...stack, name]);
  visiting.delete(name);
  visited.add(name);
};
for (const name of modulesByName.keys()) visit(name);

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
};
const sourceExt = /\.(?:[cm]?[jt]sx?)$/;
const importRegex = /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
for (const mod of boundaries.modules) {
  const absRoot = path.join(sliceRoot, mod.root);
  for (const file of walk(absRoot).filter((p) => sourceExt.test(p))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(importRegex)) {
      const spec = match[1];
      if (spec.startsWith('@talos/')) {
        const target = spec.slice('@talos/'.length).split('/')[0];
        ok(mod.allowedInternalImports.includes(target), `${mod.name} forbidden internal import ${spec} in ${path.relative(sliceRoot, file)}`);
      } else if (!spec.startsWith('.') && !spec.startsWith('node:')) {
        const packageName = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        ok(mod.allowedExternalPackages.includes(packageName), `${mod.name} forbidden external import ${packageName} in ${path.relative(sliceRoot, file)}`);
      }
    }
  }
}

const implementationFiles = walk(sliceRoot).filter((p) => /\.(?:ts|tsx|mts|cts)$/.test(p));
ok(implementationFiles.length === 0, `B0 must not contain implementation TypeScript yet: ${implementationFiles.map((p) => path.relative(sliceRoot, p)).join(', ')}`);

const result = {
  status: errors.length ? 'FAIL' : 'PASS',
  checks: {
    pinnedArtifacts: allPinned.length,
    contractEntries: manifest.contracts.length,
    plannedDependencies: baseline.dependencies.length,
    moduleBoundaries: boundaries.modules.length,
    contractHashVerification: process.env.TALOS_SKIP_CONTRACT_HASH === '1' ? 'SKIPPED_BY_ENV' : 'ENFORCED'
  },
  errors
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
