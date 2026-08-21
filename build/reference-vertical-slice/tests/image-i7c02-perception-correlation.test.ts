import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  IMAGE_PERCEPTION_RUNTIME_ENV,
  LocalImageByteStore,
  intakePngUpload,
  resolveImagePerceptionRuntimeBinding,
  runCorrelatedConfiguredImagePerceptionAdmission,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=',
  'base64',
);

async function withRuntime<T>(fn: (repo: SqliteDocumentStore, bytes: LocalImageByteStore) => Promise<T>) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7c02-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'bytes'));
  try { return await fn(repo, bytes); }
  finally { repo.close(); rmSync(dir, { recursive: true, force: true }); }
}

async function readJson(request: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function withServer<T>(handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>, fn: (endpoint: string) => Promise<T>): Promise<T> {
  const server = createServer((req, res) => void handler(req, res));
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('server bind failed');
  try { return await fn(`http://127.0.0.1:${address.port}/vision`); }
  finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
}

function runtimeEnv(endpoint: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'I7C_CORRELATED_PROVIDER',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'vision:model:correlated',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-20',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-process-diagram-perception-v0.2',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
  };
}

function correlatedResponse(envelope: AsyncImagePerceptionTransportEnvelope, override: Record<string, unknown> = {}) {
  return {
    providerId: 'I7C_CORRELATED_PROVIDER',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'vision:model:correlated',
    modelVersion: '2026-08-20',
    pipelineVersion: 'talos-process-diagram-perception-v0.2',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'PARTIAL',
    requestCorrelation: {
      schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
      sourceRepresentationId: envelope.sourceRepresentationId,
      contentSha256: envelope.contentSha256,
      coordinateSpace: { ...envelope.coordinateSpace },
      ...override,
    },
    anchors: [{ providerAnchorKey: 'a1', geometryKind: 'WHOLE_IMAGE', geometry: { x: 0, y: 0, width: 1, height: 1 }, visibilityState: 'VISIBLE' }],
    observations: [{ providerObservationKey: 'o1', anchorKey: 'a1', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Receive order', confidence: 0.8 }],
    occurrenceCandidates: [{ providerOccurrenceKey: 'n1', anchorKeys: ['a1'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o1', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o1'], confidence: 0.8 }],
    alternativeSets: [],
    relationCandidates: [],
    diagnostics: [],
  };
}

function assertNoEvidence(repo: SqliteDocumentStore) {
  assert.equal(repo.listByKind('SourceEvidenceGraph').length, 0);
  assert.equal(repo.listByKind('CandidateSemanticScope').length, 0);
  assert.equal(repo.listByKind('PerceptionObservation').length, 0);
  assert.equal(repo.listByKind('AdapterResult').length, 0);
}

async function runMismatch(overrideFactory: (envelope: AsyncImagePerceptionTransportEnvelope) => Record<string, unknown>) {
  await withRuntime(async (repo, byteStore) => {
    const intake = intakePngUpload(repo, byteStore, PNG, { receivedAt: '2026-08-20T21:20:00.000Z' });
    await withServer(async (req, res) => {
      const envelope = await readJson(req) as AsyncImagePerceptionTransportEnvelope;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(correlatedResponse(envelope, overrideFactory(envelope))));
    }, async (endpoint) => {
      const resolution = resolveImagePerceptionRuntimeBinding(runtimeEnv(endpoint));
      assert.equal(resolution.status, 'CONFIGURED');
      if (resolution.status !== 'CONFIGURED') throw new Error('expected provider');
      const result = await runCorrelatedConfiguredImagePerceptionAdmission(repo, byteStore, intake, resolution.binding, { now: '2026-08-20T21:20:01.000Z' });
      assert.equal(result.admission.decision, 'SAFE_STOP_PROVIDER_FAILURE');
      assert.equal(result.providerResult.status, 'NO_RESULT');
      assertNoEvidence(repo);
      const diagnostic = result.attempt.diagnostics.find((item) => item.code === 'IMAGE_PERCEPTION_PROVIDER_FAILURE');
      assert.ok(diagnostic);
      assert.match(diagnostic!.description, /IMAGE_PERCEPTION_RESPONSE_CORRELATION/);
    });
  });
}

test('I7C-02 exact response correlation admits only the response belonging to the exact PNG request', async () => {
  await withRuntime(async (repo, byteStore) => {
    const intake = intakePngUpload(repo, byteStore, PNG, { receivedAt: '2026-08-20T21:10:00.000Z' });
    await withServer(async (req, res) => {
      const envelope = await readJson(req) as AsyncImagePerceptionTransportEnvelope;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(correlatedResponse(envelope)));
    }, async (endpoint) => {
      const resolution = resolveImagePerceptionRuntimeBinding(runtimeEnv(endpoint));
      assert.equal(resolution.status, 'CONFIGURED');
      if (resolution.status !== 'CONFIGURED') throw new Error('expected configured provider');
      const result = await runCorrelatedConfiguredImagePerceptionAdmission(repo, byteStore, intake, resolution.binding, { now: '2026-08-20T21:10:01.000Z' });
      assert.equal(result.admission.decision, 'ADMITTED_FOR_REVIEW');
      assert.equal(result.providerResult.providerClass, 'MODEL_PROVIDER');
      assert.equal(result.providerResult.evidenceMode, 'MODEL_INFERENCE');
      assert.equal(result.commonEvidence?.classification.truthClass, 'INFERRED');
      assert.equal(result.admission.semanticAuthority, 'NONE');
      assert.equal(result.admission.automaticFreezeAuthorized, false);
      assert.equal(result.admission.automaticExecutionAuthorized, false);
      assert.equal(repo.listByKind('SourceEvidenceGraph').length, 1);
    });
  });
});

test('I7C-02 wrong source representation correlation safe-stops before evidence materialization', async () => {
  await runMismatch(() => ({ sourceRepresentationId: 'source:wrong-representation' }));
});

test('I7C-02 wrong image digest correlation safe-stops before evidence materialization', async () => {
  await runMismatch(() => ({ contentSha256: '0'.repeat(64) }));
});

test('I7C-02 wrong coordinate-space correlation safe-stops before evidence materialization', async () => {
  await runMismatch((envelope) => ({ coordinateSpace: { ...envelope.coordinateSpace, width: envelope.coordinateSpace.width + 1 } }));
});

test('I7C-02 missing correlation block safe-stops before evidence materialization', async () => {
  await withRuntime(async (repo, byteStore) => {
    const intake = intakePngUpload(repo, byteStore, PNG, { receivedAt: '2026-08-20T21:30:00.000Z' });
    await withServer(async (req, res) => {
      const envelope = await readJson(req) as AsyncImagePerceptionTransportEnvelope;
      const payload = correlatedResponse(envelope) as any;
      delete payload.requestCorrelation;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
    }, async (endpoint) => {
      const resolution = resolveImagePerceptionRuntimeBinding(runtimeEnv(endpoint));
      assert.equal(resolution.status, 'CONFIGURED');
      if (resolution.status !== 'CONFIGURED') throw new Error('expected provider');
      const result = await runCorrelatedConfiguredImagePerceptionAdmission(repo, byteStore, intake, resolution.binding, { now: '2026-08-20T21:30:01.000Z' });
      assert.equal(result.admission.decision, 'SAFE_STOP_PROVIDER_FAILURE');
      assertNoEvidence(repo);
    });
  });
});
