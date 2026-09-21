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
const gateway = read('build/reference-vertical-slice/apps/reference-api/src/ollama-gemini-perception-gateway.ts');
const workerRuntime = read('build/reference-vertical-slice/workers/reference-temporal-worker/src/generic-worker-runtime.ts');
const combined = [dockerfile, compose, runbook, host, gateway, workerRuntime].join('\n');

test('R1-11 Docker image serves the dedicated field-trial product host with durable runtime state', () => {
  assert.match(dockerfile, /FROM node:22-/);
  assert.match(dockerfile, /npm ci\b/);
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
  assert.match(compose, /TEMPORAL_ADDRESS:\s*temporal:7233/);
  assert.match(host, /Connection\.connect\(\{ address: temporalAddress \}\)/);
  assert.match(host, /connectGenericTemporalWorker\(/);
  assert.doesNotMatch(host, /@temporalio\/worker/);
  assert.match(workerRuntime, /NativeConnection\.connect\(\{address:options\.address\}\)/);
});

test('R1-11 field-trial Docker starts persistent Ollama vision and routes Talos through the local perception gateway', () => {
  assert.match(compose, /image:\s*ollama\/ollama:latest/);
  assert.match(compose, /11434:11434/);
  assert.match(compose, /talos_ollama_models:\/root\/\.ollama/);
  assert.match(compose, /command:\s*\["pull", "qwen2\.5vl:7b"\]/);
  assert.match(compose, /ollama-gemini-perception-gateway\.ts/);
  assert.match(compose, /OLLAMA_MODEL:\s*qwen2\.5vl:7b/);
  assert.match(compose, /GEMINI_API_KEY:\s*\$\{GEMINI_API_KEY:-\}/);
  assert.match(compose, /TALOS_IMAGE_PERCEPTION_PROVIDER_URL:\s*http:\/\/perception:8790\/perceive/);
  assert.match(compose, /condition:\s*service_completed_successfully/);
  assert.match(compose, /condition:\s*service_healthy/);
  assert.match(gateway, /OLLAMA_PRIMARY_GEMINI_FALLBACK_FAIL_CLOSED/);
  assert.match(gateway, /UPSTREAM_PROVIDER_SELECTED/);
});

test('R1-11 field-trial host configures trusted local deployment and workflow executors without bypassing authority gates', () => {
  assert.match(host, /deploymentAttemptExecutor:/);
  assert.match(host, /workflowExecutionExecutor:/);
  assert.match(host, /compileGenericRuntimeProgram/);
  assert.match(host, /connectGenericTemporalWorker/);
  assert.match(host, /temporalClient\.workflow\.start\(TalosGenericWorkflow/);
  assert.match(host, /runtimeWaitSnapshot/);
  assert.match(host, /currently requires DURATION waits/);
  assert.match(host, /cannot safely parse duration/);
  assert.match(host, /realizedNamespaceLocator\.startsWith\('temporal-namespace:'\)/);
  assert.match(host, /slice\('temporal-namespace:'\.length\)/);
  assert.match(host, /executionStatus: 'RUNNING'/);
  assert.doesNotMatch(host, /automaticDeploymentAttemptAuthorized\s*:\s*true/);
  assert.doesNotMatch(host, /automaticWorkflowExecutionAuthorized\s*:\s*true/);
});

test('R1-11 runbook preserves the real-field-trial and fail-closed truth boundary', () => {
  assert.match(runbook, /real operational\/customer process/);
  assert.match(runbook, /external participant/);
  assert.match(runbook, /BLOCKED_BY_OPERATOR/);
  assert.match(runbook, /NOT_ATTEMPTED/);
  assert.match(runbook, /Ollama/);
  assert.match(runbook, /Gemini/);
  assert.match(runbook, /qwen2\.5vl:7b/);
  assert.match(runbook, /does not authorize `Talos 1\.0 — PRODUCT READY`/);
  assert.match(runbook, /docker compose -f docker-compose\.field-trial\.yml up --build/);
});

test('R1-11 Docker artifacts contain no committed token-like secret material', () => {
  assert.doesNotMatch(combined, /gh[pousr]_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(combined, /github_pat_[A-Za-z0-9_]{20,}/);
  assert.doesNotMatch(combined, /Bearer\s+[A-Za-z0-9._-]{20,}/i);
  assert.doesNotMatch(combined, /AIza[0-9A-Za-z_-]{30,}/);
  assert.doesNotMatch(combined, /-----BEGIN [A-Z ]*PRIVATE KEY-----/);
});
