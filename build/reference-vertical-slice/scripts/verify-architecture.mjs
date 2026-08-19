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
const modules = boundaries.modules;
const moduleByName = new Map(modules.map((m) => [m.name, m]));
const moduleByRoot = [...modules].sort((a, b) => b.root.length - a.root.length);

const allPinned = [...manifest.contracts, ...manifest.phaseConsolidations, ...manifest.buildGovernance];
for (const item of allPinned) {
  ok(/^[0-9a-f]{40}$/.test(item.blobSha), `invalid pinned sha ${item.path}`);
  if (process.env.TALOS_SKIP_CONTRACT_HASH !== '1') {
    const absolute = path.join(repoRoot, item.path);
    ok(fs.existsSync(absolute), `pinned file missing ${item.path}`);
    if (fs.existsSync(absolute)) {
      const actual = execFileSync('git', ['hash-object', absolute], { encoding: 'utf8' }).trim();
      ok(actual === item.blobSha, `frozen contract drift ${item.path}`);
    }
  }
}

ok(pkg.private === true, 'workspace must remain private');
ok(lock.lockfileVersion === 3, 'npm lockfile v3 required');
const exactSemver = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
for (const dep of baseline.dependencies) ok(exactSemver.test(dep.version), `dependency baseline must use exact semver ${dep.name}`);
ok(!baseline.dependencies.some((d) => d.name === 'temporalio'), 'deprecated temporalio meta-package is forbidden');

const visiting = new Set();
const visited = new Set();
function visit(name, stack = []) {
  if (visited.has(name)) return;
  if (visiting.has(name)) {
    errors.push(`module dependency cycle ${[...stack, name].join(' -> ')}`);
    return;
  }
  visiting.add(name);
  const mod = moduleByName.get(name);
  for (const child of mod.allowedInternalImports) {
    ok(moduleByName.has(child), `${name} allows unknown internal module ${child}`);
    if (moduleByName.has(child)) visit(child, [...stack, name]);
  }
  visiting.delete(name);
  visited.add(name);
}
for (const name of moduleByName.keys()) visit(name);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function moduleForAbsolute(abs) {
  const rel = path.relative(sliceRoot, abs).replaceAll(path.sep, '/');
  return moduleByRoot.find((m) => rel === m.root || rel.startsWith(`${m.root}/`));
}
function externalPackageName(spec) {
  return spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
}
const sourceExt = /\.(?:[cm]?[jt]sx?)$/;
const importRegex = /(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
for (const mod of modules) {
  const root = path.join(sliceRoot, mod.root);
  for (const file of walk(root).filter((p) => sourceExt.test(p))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(importRegex)) {
      const spec = match[1];
      if (spec === 'node:sqlite') {
        ok(boundaries.globalRules.sqliteAllowedModules.includes(mod.name), `${mod.name} may not import node:sqlite`);
        continue;
      }
      if (spec.startsWith('node:')) continue;
      if (spec.startsWith('@talos/')) {
        const target = spec.slice('@talos/'.length).split('/')[0];
        ok(mod.allowedInternalImports.includes(target), `${mod.name} forbidden workspace import ${spec}`);
        continue;
      }
      if (spec.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), spec);
        const targetMod = moduleForAbsolute(resolved);
        if (targetMod && targetMod.name !== mod.name) {
          ok(mod.allowedInternalImports.includes(targetMod.name), `${mod.name} forbidden relative cross-module import ${targetMod.name} from ${path.relative(sliceRoot, file)}`);
        }
        continue;
      }
      const packageName = externalPackageName(spec);
      ok(mod.allowedExternalPackages.includes(packageName), `${mod.name} forbidden external import ${packageName}`);
      if (packageName.startsWith('@temporalio/')) {
        ok(boundaries.globalRules.temporalSdkAllowedModules.includes(mod.name), `${mod.name} is outside Temporal SDK boundary`);
      }
    }
  }
}

const result = {
  status: errors.length ? 'FAIL' : 'PASS',
  checks: {
    pinnedArtifacts: allPinned.length,
    moduleBoundaries: modules.length,
    contractHashVerification: process.env.TALOS_SKIP_CONTRACT_HASH === '1' ? 'SKIPPED_BY_ENV' : 'ENFORCED'
  },
  errors
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
