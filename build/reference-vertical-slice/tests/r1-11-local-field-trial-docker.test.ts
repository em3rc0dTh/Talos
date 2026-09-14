import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '../..');
const read = (relative: string) => readFileSync(path.join(repoRoot, relative), 'utf8');

const dockerfile = read('Dockerfile.field-trial');
const compose = read('docker-compose.field-trial.yml');
const runbook = read('FIELD-TRIAL-LOCAL.md');
const host = read('build/reference-vertical-slice/apps/reference-api/src/field-trial-product-server.ts');
const combined = [dockerfile, compose, runbook, host].join('\n');

test('R1-11 Docker image serves the dedicated field-trial product host with durable runtime state', () => {
  assert.match(dockerfile, /FROM node:22-/);
  assert.match(dockerfile, /RUN npm ci/);
  assert.match(dockerfile, /field-trial-product-server\.ts/);
  assert.match(dockerfile, /TALOS_RUNTIME_DIR=\/data\/talos-runtime/);
  assert.match(compose, /8787:8787/);
  assert.match(compose, /talos_field_trial_runtime:\/data\/talos-runtime/);
  assert.match(compose, /\.\/evidence\/field-trials:\/workspace\/evidence\/field-trials/);
});

test('R1-11 local stack exposes Temporal on the Windows-safe host ports already used by Talos development', () => {
  assert.match(compose, /temporalio\/temporal:/);
  assert.match(compose, /17233:7233/);
  assert.match(compose, /18233:8233/);
  assert.match(compose, /TEMPORAL_ADDRESS=temporal:7233/);
  assert.match(host, /NativeConnection\.connect\(\{ address: temporalAddress \}\)/);
  assert.match(host, /Connection\.connect\(\{ address: temporalAddress \}\)/);
});

test('R1-11 field-trial host configures trusted local deployment and workflow executors without bypassing authority gates', () => {
  assert.match(host, /deploymentAttemptExecutor:/);
  assert.match(host, /workflowExecutionExecutor:/);
  assert.match(host, /compileGenericRuntimeProgram/);
  assert.match(host, /createGenericTemporalWorker/);
  assert.match(host, /temporalClient\.workflow\.start\(TalosGenericWorkflow/);
  assert.match(host, /does not invent wait durations/);
  assert.doesNotMatch(host, /automaticDeploymentAttemptAuthorized\s*:\s*true/);
  assert.doesNotMatch(host, /automaticWorkflowExecutionAuthorized\s*:\s*true/);
});

test('R1-11 runbook preserves the real-field-trial and fail-closed truth boundary', () => {
  assert.match(runbook, /real operational\/customer process/);
  assert.match(runbook, /external participant/);
  assert.match(runbook, /BLOCKED_BY_OPERATOR/);
  assert.match(runbook, /NOT_ATTEMPTED/);
  assert.match(runbook, /does not authorize `Talos 1\.0 — PRODUCT READY`/);
  assert.match(runbook, /docker compose -f docker-compose\.field-trial\.yml up --build/);
});

test('R1-11 Docker artifacts contain no committed token-like secret material', () => {
  assert.doesNotMatch(combined, /gh[pousr]_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(combined, /github_pat_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(combined, /Bearer\s+[A-Za-z0-9._-]{20,}/i);
  assert.doesNotMatch(combined, /-----BEGIN [A-Z ]*PRIVATE KEY-----/);
});
