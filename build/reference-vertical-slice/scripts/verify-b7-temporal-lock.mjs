import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const baseline = readJson('dependencies/dependency-baseline.json');
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const requireReady = process.argv.includes('--require-ready');
const errors = [];

const expected = baseline.dependencies
  .filter((d) => d.name.startsWith('@temporalio/'))
  .map((d) => ({ name: d.name, version: d.version, kind: d.kind }));
const expectedVersionSet = new Set(expected.map((d) => d.version));
if (expected.length !== 6) errors.push(`expected six Temporal package pins, found ${expected.length}`);
if (expectedVersionSet.size !== 1 || !expectedVersionSet.has('1.22.0')) {
  errors.push(`Temporal baseline must be one exact 1.22.0 family, got ${[...expectedVersionSet].join(',')}`);
}

const manifestDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
const promoted = expected.filter((d) => manifestDeps[d.name] !== undefined);
const nonePromoted = promoted.length === 0;
const allPromoted = promoted.length === expected.length;
if (!nonePromoted && !allPromoted) {
  errors.push(`partial Temporal package promotion: ${promoted.map((d) => d.name).join(', ')}`);
}
for (const item of promoted) {
  if (manifestDeps[item.name] !== item.version) {
    errors.push(`${item.name} package.json version ${manifestDeps[item.name]} != ${item.version}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  );
}
const sourceRoots = ['workers/reference-temporal-worker', 'apps/reference-api'];
const temporalImportFiles = [];
for (const relRoot of sourceRoots) {
  for (const file of walk(path.join(root, relRoot)).filter((p) => /\.(?:[cm]?[jt]sx?)$/.test(p))) {
    const text = fs.readFileSync(file, 'utf8');
    if (/['"]@temporalio\//.test(text)) temporalImportFiles.push(path.relative(root, file).replaceAll(path.sep, '/'));
  }
}

let lockReady = false;
if (allPromoted) {
  const rootLock = lock.packages?.[''] ?? {};
  const rootDeclared = { ...(rootLock.dependencies ?? {}), ...(rootLock.devDependencies ?? {}) };
  for (const item of expected) {
    if (rootDeclared[item.name] !== item.version) {
      errors.push(`${item.name} missing/exact mismatch in package-lock root manifest`);
    }
    const entry = lock.packages?.[`node_modules/${item.name}`];
    if (!entry) {
      errors.push(`${item.name} missing from package-lock packages`);
      continue;
    }
    if (entry.version !== item.version) errors.push(`${item.name} lock version ${entry.version} != ${item.version}`);
    if (entry.link === true) errors.push(`${item.name} must not be a workspace link`);
    if (typeof entry.resolved !== 'string' || !entry.resolved) errors.push(`${item.name} lock entry missing resolved`);
    if (typeof entry.integrity !== 'string' || !entry.integrity) errors.push(`${item.name} lock entry missing integrity`);
  }
  lockReady = errors.length === 0;
}

if (temporalImportFiles.length > 0 && !lockReady) {
  errors.push(`Temporal source import exists before trustworthy lock: ${temporalImportFiles.join(', ')}`);
}

let status;
if (errors.length) status = 'FAIL';
else if (lockReady) status = 'READY';
else status = 'PENDING_SAFE';

console.log(JSON.stringify({
  status,
  expectedTemporalVersion: expectedVersionSet.size === 1 ? [...expectedVersionSet][0] : null,
  expectedPackages: expected.map((d) => d.name),
  promotedPackages: promoted.map((d) => d.name),
  temporalImportFiles,
  lockReady,
  errors,
}, null, 2));

if (errors.length) process.exit(1);
if (requireReady && status !== 'READY') process.exit(2);
