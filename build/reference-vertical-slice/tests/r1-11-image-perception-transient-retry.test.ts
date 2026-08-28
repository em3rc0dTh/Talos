import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  intakePngUpload,
  LocalImageByteStore,
  runAsyncHttpImagePerceptionAdmission,
  type AsyncHttpImagePerceptionProviderConfig,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

function tinyPng(width = 640, height = 480): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(bytes,0);
  bytes.writeUInt32BE(13,8);
  bytes.write('IHDR',12,'ascii');
  bytes.writeUInt32BE(width,16);
  bytes.writeUInt32BE(height,20);
  return bytes;
}

function config(fetchImpl: typeof fetch): AsyncHttpImagePerceptionProviderConfig {
  return {
    endpoint: 'http://provider.invalid/vision',
    providerId: 'R1_RETRY_PROVIDER',
    providerVersion: '1.0.0',
    modelRef: 'model:r1-retry',
    modelVersion: '1',
    pipelineVersion: 'r1-retry-test-v1',
    timeoutMs: 5_000,
    fetchImpl,
    providerClass: 'MODEL_PROVIDER',
    evidenceMode: 'MODEL_INFERENCE',
  };
}

function noResultBody() {
  return {
    providerId: 'R1_RETRY_PROVIDER',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:r1-retry',
    modelVersion: '1',
    pipelineVersion: 'r1-retry-test-v1',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'NO_RESULT',
    anchors: [],
    observations: [],
    occurrenceCandidates: [],
    alternativeSets: [],
    relationCandidates: [],
    diagnostics: [{ code: 'NO_RESULT', description: 'Intentional retry-test no-result response.' }],
  };
}

async function withRuntime<T>(fn: (repo: SqliteDocumentStore, bytes: LocalImageByteStore) => Promise<T>): Promise<T> {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-provider-retry-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'source-bytes'));
  try {
    return await fn(repo, bytes);
  } finally {
    repo.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

test('transient 503 responses are retried and a later provider response is admitted normally', async () => withRuntime(async (repo, bytes) => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    if (calls < 3) {
      return new Response('temporarily unavailable', { status: 503, headers: { 'retry-after': '0' } });
    }
    return new Response(JSON.stringify(noResultBody()), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  const intake = intakePngUpload(repo, bytes, tinyPng(), { initiatedBy: 'r1-retry-test' });
  const result = await runAsyncHttpImagePerceptionAdmission(repo, bytes, intake, config(fetchImpl));

  assert.equal(calls, 3);
  assert.equal(result.admission.decision, 'SAFE_STOP_NO_RESULT');
  assert.equal(result.providerResult.status, 'NO_RESULT');
}));

test('permanent HTTP errors are not retried', async () => withRuntime(async (repo, bytes) => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    return new Response('bad request', { status: 400 });
  }) as typeof fetch;

  const intake = intakePngUpload(repo, bytes, tinyPng(), { initiatedBy: 'r1-retry-test' });
  const result = await runAsyncHttpImagePerceptionAdmission(repo, bytes, intake, config(fetchImpl));

  assert.equal(calls, 1);
  assert.equal(result.admission.decision, 'SAFE_STOP_PROVIDER_FAILURE');
  assert.match(result.attempt.diagnostics[0]?.description ?? '', /IMAGE_PERCEPTION_PROVIDER_HTTP_400/);
}));

test('persistent 503 exhausts the bounded retry count and still fails closed', async () => withRuntime(async (repo, bytes) => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    return new Response('still unavailable', { status: 503, headers: { 'retry-after': '0' } });
  }) as typeof fetch;

  const intake = intakePngUpload(repo, bytes, tinyPng(), { initiatedBy: 'r1-retry-test' });
  const result = await runAsyncHttpImagePerceptionAdmission(repo, bytes, intake, config(fetchImpl));

  assert.equal(calls, 3);
  assert.equal(result.admission.decision, 'SAFE_STOP_PROVIDER_FAILURE');
  assert.match(result.attempt.diagnostics[0]?.description ?? '', /IMAGE_PERCEPTION_PROVIDER_HTTP_503/);
  assert.equal(result.admission.automaticFreezeAuthorized, false);
  assert.equal(result.admission.automaticExecutionAuthorized, false);
}));
