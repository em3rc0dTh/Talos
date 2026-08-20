import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  LocalImageByteStore,
  intakePngUpload,
  runAsyncHttpImagePerceptionAdmission,
  type AsyncHttpImagePerceptionProviderConfig,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';

const ARBITRARY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=',
  'base64',
);
const ARBITRARY_SHA256 = '658e796317e9d94e0b7665744fd93a4e1a9e98f7c3ae9ddb91700e74015225e9';

interface RuntimeContext {
  repo: SqliteDocumentStore;
  byteStore: LocalImageByteStore;
}

async function withRuntime<T>(fn: (ctx: RuntimeContext) => Promise<T>): Promise<T> {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i7b01-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  try { return await fn({ repo, byteStore }); }
  finally { repo.close(); rmSync(runtimeDir, { recursive: true, force: true }); }
}

function assertNoExecutionAuthority(repo: SqliteDocumentStore): void {
  for (const kind of [
    'ProcessRevision',
    'SemanticFreezeRecord',
    'CapabilityDesignRevision',
    'CapabilityBindingRevision',
    'ExecutionPlanRevision',
    'TemporalMappingRevision',
    'RuntimePolicyRevision',
    'DeploymentRevision',
    'WorkflowExecutionObservation',
  ]) {
    assert.equal(repo.listByKind(kind).length, 0, `${kind} must remain absent in I7B-01`);
  }
}

async function readJsonBody(request: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function withProviderServer<T>(
  handler: (request: IncomingMessage, response: ServerResponse) => Promise<void> | void,
  fn: (endpoint: string) => Promise<T>,
): Promise<T> {
  const server = createServer((request, response) => {
    Promise.resolve(handler(request, response)).catch((error) => {
      if (!response.headersSent) response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('I7B test provider failed to bind TCP address');
  try { return await fn(`http://127.0.0.1:${address.port}/perceive`); }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

function providerConfig(endpoint: string): AsyncHttpImagePerceptionProviderConfig {
  return {
    endpoint,
    providerId: 'I7B_HTTP_TEST_PROVIDER',
    providerVersion: '0.1.0-test',
    modelRef: 'model:i7b-http-test',
    modelVersion: '2026-08-20-test',
    pipelineVersion: 'i7b-http-pipeline-v0.1',
    timeoutMs: 5_000,
  };
}

function validPartialResponse() {
  return {
    providerId: 'I7B_HTTP_TEST_PROVIDER',
    providerVersion: '0.1.0-test',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:i7b-http-test',
    modelVersion: '2026-08-20-test',
    pipelineVersion: 'i7b-http-pipeline-v0.1',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'PARTIAL',
    anchors: [{
      providerAnchorKey: 'whole-image',
      geometryKind: 'WHOLE_IMAGE',
      geometry: { x: 0, y: 0, width: 1, height: 1 },
      visibilityState: 'LOW_LEGIBILITY',
    }],
    observations: [{
      providerObservationKey: 'text-1',
      anchorKey: 'whole-image',
      observationKind: 'TEXT_LITERAL_CANDIDATE',
      observedValue: 'Candidate work',
      confidence: 0.41,
    }],
    occurrenceCandidates: [{
      providerOccurrenceKey: 'work-1',
      anchorKeys: ['whole-image'],
      occurrenceKind: 'NODE',
      literalLabelObservationKey: 'text-1',
      candidateSemanticType: 'ACTION',
      sourcePlaneKind: 'BUSINESS_GRAPH',
      supportingObservationKeys: ['text-1'],
      confidence: 0.41,
    }],
    alternativeSets: [],
    relationCandidates: [],
    diagnostics: [{ code: 'LOW_CONFIDENCE_IMAGE', description: 'Only partial model evidence is available.' }],
  };
}

test('I7B-01 sends exact verified arbitrary PNG bytes over a real async HTTP boundary and admits only INFERRED review evidence', async () => {
  await withRuntime(async ({ repo, byteStore }) => {
    assert.equal(createHash('sha256').update(ARBITRARY_PNG).digest('hex'), ARBITRARY_SHA256);
    const intake = intakePngUpload(repo, byteStore, ARBITRARY_PNG, {
      receivedAt: '2026-08-20T16:30:00.000Z',
      declaredName: 'I7B arbitrary HTTP image',
    });
    let capturedEnvelope: AsyncImagePerceptionTransportEnvelope | undefined;

    await withProviderServer(async (request, response) => {
      assert.equal(request.method, 'POST');
      assert.equal(request.url, '/perceive');
      capturedEnvelope = await readJsonBody(request) as AsyncImagePerceptionTransportEnvelope;
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(validPartialResponse()));
    }, async (endpoint) => {
      const result = await runAsyncHttpImagePerceptionAdmission(repo, byteStore, intake, providerConfig(endpoint), {
        now: '2026-08-20T16:30:01.000Z',
      });

      assert.ok(capturedEnvelope);
      assert.equal(capturedEnvelope!.schemaVersion, 'talos-image-perception-request-v0.1');
      assert.equal(capturedEnvelope!.sourceRepresentationId, intake.representation.id);
      assert.equal(capturedEnvelope!.contentSha256, ARBITRARY_SHA256);
      assert.equal(capturedEnvelope!.mediaType, 'image/png');
      assert.equal(capturedEnvelope!.coordinateSpace.width, 1);
      assert.equal(capturedEnvelope!.coordinateSpace.height, 1);
      const transportedBytes = Buffer.from(capturedEnvelope!.imageBase64, 'base64');
      assert.ok(transportedBytes.equals(ARBITRARY_PNG));
      assert.equal(createHash('sha256').update(transportedBytes).digest('hex'), intake.representation.contentHash);

      assert.equal(result.providerResult.providerClass, 'MODEL_PROVIDER');
      assert.equal(result.providerResult.evidenceMode, 'MODEL_INFERENCE');
      assert.equal(result.providerResult.status, 'PARTIAL');
      assert.equal(result.admission.decision, 'ADMITTED_FOR_REVIEW');
      assert.equal(result.admission.requiresHumanReview, true);
      assert.equal(result.admission.semanticAuthority, 'NONE');
      assert.equal(result.admission.automaticFreezeAuthorized, false);
      assert.equal(result.admission.automaticExecutionAuthorized, false);
      assert.ok(result.admission.reasonCodes.includes('PROVIDER_PARTIAL_EVIDENCE'));
      assert.equal(result.commonEvidence?.classification.truthClass, 'INFERRED');
      assert.equal(result.commonEvidence?.scope.truthClass, 'INFERRED');
      assert.equal(result.commonEvidence?.scope.kind, 'PROCESS_CANDIDATE');
      assert.equal(repo.listByKind('SourceEvidenceGraph').length, 1);
      assert.equal(repo.listByKind('CandidateSemanticScope').length, 1);
      assert.equal(repo.listByKind('ImagePerceptionAdmissionRecord').length, 1);
      assertNoExecutionAuthority(repo);
    });
  });
});

test('I7B-01 rejects malformed untrusted provider response before evidence materialization and records terminal provider failure', async () => {
  await withRuntime(async ({ repo, byteStore }) => {
    const intake = intakePngUpload(repo, byteStore, ARBITRARY_PNG, { receivedAt: '2026-08-20T16:31:00.000Z' });

    await withProviderServer(async (_request, response) => {
      const malformed = validPartialResponse();
      malformed.observations[0].anchorKey = 'missing-anchor';
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(malformed));
    }, async (endpoint) => {
      const result = await runAsyncHttpImagePerceptionAdmission(repo, byteStore, intake, providerConfig(endpoint), {
        now: '2026-08-20T16:31:01.000Z',
      });

      assert.equal(result.admission.decision, 'SAFE_STOP_PROVIDER_FAILURE');
      assert.equal(result.providerResult.status, 'NO_RESULT');
      assert.equal(result.attempt.result, undefined);
      assert.equal(result.admission.commonEvidenceGraphRefs.length, 0);
      const diagnostic = result.attempt.diagnostics.find((item) => item.code === 'IMAGE_PERCEPTION_PROVIDER_FAILURE');
      assert.ok(diagnostic);
      assert.match(diagnostic!.description, /INVALID_IMAGE_PERCEPTION_PROVIDER_RESPONSE/);
      assert.equal(repo.listByKind('PerceptionObservation').length, 0);
      assert.equal(repo.listByKind('SourceEvidenceGraph').length, 0);
      assert.equal(repo.listByKind('CandidateSemanticScope').length, 0);
      assert.equal(repo.listByKind('AdapterResult').length, 0);
      assertNoExecutionAuthority(repo);
    });
  });
});

test('I7B-01 HTTP provider failure becomes terminal append-only evidence with no hidden result', async () => {
  await withRuntime(async ({ repo, byteStore }) => {
    const intake = intakePngUpload(repo, byteStore, ARBITRARY_PNG, { receivedAt: '2026-08-20T16:32:00.000Z' });

    await withProviderServer(async (_request, response) => {
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'model gateway unavailable' }));
    }, async (endpoint) => {
      const first = await runAsyncHttpImagePerceptionAdmission(repo, byteStore, intake, providerConfig(endpoint), {
        now: '2026-08-20T16:32:01.000Z',
      });
      const second = await runAsyncHttpImagePerceptionAdmission(repo, byteStore, intake, providerConfig(endpoint), {
        now: '2026-08-20T16:33:01.000Z',
      });

      for (const result of [first, second]) {
        assert.equal(result.admission.decision, 'SAFE_STOP_PROVIDER_FAILURE');
        assert.equal(result.attempt.result, undefined);
        const diagnostic = result.attempt.diagnostics.find((item) => item.code === 'IMAGE_PERCEPTION_PROVIDER_FAILURE');
        assert.ok(diagnostic);
        assert.match(diagnostic!.description, /IMAGE_PERCEPTION_PROVIDER_HTTP_500/);
        assert.equal(result.admission.automaticFreezeAuthorized, false);
        assert.equal(result.admission.automaticExecutionAuthorized, false);
      }

      assert.notEqual(first.attempt.start.id, second.attempt.start.id);
      assert.notEqual(first.admission.id, second.admission.id);
      assert.equal(first.attempt.start.inputFingerprint, second.attempt.start.inputFingerprint);
      assert.equal(repo.listByKind('AdapterAttemptStart').length, 2);
      assert.equal(repo.listByKind('AdapterAttemptCompletion').length, 2);
      assert.equal(repo.listByKind('ImagePerceptionAdmissionRecord').length, 2);
      assert.equal(repo.listByKind('AdapterResult').length, 0);
      assertNoExecutionAuthority(repo);
    });
  });
});

test('I7B-01 structurally valid MODEL_PROVIDER NO_RESULT stays a safe stop with no hidden evidence', async () => {
  await withRuntime(async ({ repo, byteStore }) => {
    const intake = intakePngUpload(repo, byteStore, ARBITRARY_PNG, { receivedAt: '2026-08-20T16:34:00.000Z' });

    await withProviderServer(async (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({
        providerId: 'I7B_HTTP_TEST_PROVIDER',
        providerVersion: '0.1.0-test',
        providerClass: 'MODEL_PROVIDER',
        modelRef: 'model:i7b-http-test',
        modelVersion: '2026-08-20-test',
        pipelineVersion: 'i7b-http-pipeline-v0.1',
        evidenceMode: 'MODEL_INFERENCE',
        status: 'NO_RESULT',
        anchors: [],
        observations: [],
        occurrenceCandidates: [],
        alternativeSets: [],
        relationCandidates: [],
        diagnostics: [{ code: 'NO_PROCESS_EVIDENCE', description: 'No process evidence was recovered from the arbitrary image.' }],
      }));
    }, async (endpoint) => {
      const result = await runAsyncHttpImagePerceptionAdmission(repo, byteStore, intake, providerConfig(endpoint), {
        now: '2026-08-20T16:34:01.000Z',
      });
      assert.equal(result.admission.decision, 'SAFE_STOP_NO_RESULT');
      assert.equal(result.providerResult.status, 'NO_RESULT');
      assert.equal(result.attempt.result, undefined);
      assert.equal(repo.listByKind('SourceEvidenceGraph').length, 0);
      assert.equal(repo.listByKind('CandidateSemanticScope').length, 0);
      assertNoExecutionAuthority(repo);
    });
  });
});
