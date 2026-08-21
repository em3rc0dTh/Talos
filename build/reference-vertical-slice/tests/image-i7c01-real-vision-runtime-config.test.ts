import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  IMAGE_PERCEPTION_RUNTIME_ENV,
  LocalImageByteStore,
  intakePngUpload,
  resolveImagePerceptionRuntimeBinding,
  runConfiguredImagePerceptionAdmission,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const ARBITRARY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=',
  'base64',
);
const SECRET = 'talos-i7c01-secret-token-never-persist';

interface Runtime {
  repo: SqliteDocumentStore;
  byteStore: LocalImageByteStore;
}

async function withRuntime<T>(fn: (runtime: Runtime) => Promise<T>): Promise<T> {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7c01-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(dir, 'source-bytes'));
  try { return await fn({ repo, byteStore }); }
  finally { repo.close(); rmSync(dir, { recursive: true, force: true }); }
}

async function readJson(request: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function withServer<T>(
  handler: (request: IncomingMessage, response: ServerResponse) => Promise<void> | void,
  fn: (endpoint: string) => Promise<T>,
): Promise<T> {
  const server = createServer((request, response) => {
    Promise.resolve(handler(request, response)).catch((error) => {
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('I7C-01 provider server failed to bind');
  try { return await fn(`http://127.0.0.1:${address.port}/vision`); }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

function env(endpoint?: string): Record<string, string> {
  return {
    ...(endpoint ? { [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint } : {}),
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'I7C_REAL_PROVIDER_GATEWAY',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'vision:model:configured',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-20',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-process-diagram-perception-v0.1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
    [IMAGE_PERCEPTION_RUNTIME_ENV.bearerToken]: SECRET,
  };
}

function partialResponse() {
  return {
    providerId: 'I7C_REAL_PROVIDER_GATEWAY',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'vision:model:configured',
    modelVersion: '2026-08-20',
    pipelineVersion: 'talos-process-diagram-perception-v0.1',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'PARTIAL',
    anchors: [{
      providerAnchorKey: 'whole',
      geometryKind: 'WHOLE_IMAGE',
      geometry: { x: 0, y: 0, width: 1, height: 1 },
      visibilityState: 'LOW_LEGIBILITY',
    }],
    observations: [{
      providerObservationKey: 'text',
      anchorKey: 'whole',
      observationKind: 'TEXT_LITERAL_CANDIDATE',
      observedValue: 'Candidate process activity',
      confidence: 0.44,
    }],
    occurrenceCandidates: [{
      providerOccurrenceKey: 'node',
      anchorKeys: ['whole'],
      occurrenceKind: 'NODE',
      literalLabelObservationKey: 'text',
      candidateSemanticType: 'ACTION',
      sourcePlaneKind: 'BUSINESS_GRAPH',
      supportingObservationKeys: ['text'],
      confidence: 0.44,
    }],
    alternativeSets: [],
    relationCandidates: [],
    diagnostics: [{ code: 'PARTIAL_PROCESS_IMAGE', description: 'Only partial process evidence was recovered.' }],
  };
}

function persistedPerceptionJson(repo: SqliteDocumentStore): string {
  const kinds = [
    'AdapterAttemptStart',
    'AdapterAttemptCompletion',
    'AdapterDiagnostic',
    'AdapterResult',
    'VisualEvidenceAnchor',
    'PerceptionObservation',
    'PerceptionAlternativeSet',
    'PerceptionRelationCandidate',
    'SourceEvidenceGraph',
    'CandidateSemanticScope',
    'ArtifactClassification',
    'ImagePerceptionAdmissionRecord',
  ];
  return JSON.stringify(kinds.flatMap((kind) => repo.listByKind(kind)));
}

test('I7C-01 absent real provider endpoint is DISABLED and never falls through to a fixture provider', () => {
  const resolution = resolveImagePerceptionRuntimeBinding({});
  assert.deepEqual(resolution, {
    status: 'DISABLED',
    reason: 'ENDPOINT_NOT_CONFIGURED',
    configVersion: 'talos-image-perception-runtime-config-v0.1',
  });
  assert.equal('binding' in resolution, false);
});

test('I7C-01 partially configured or credential-bearing provider URLs fail closed', () => {
  assert.throws(
    () => resolveImagePerceptionRuntimeBinding({ [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: 'https://vision.example.test/perceive' }),
    /TALOS_IMAGE_PERCEPTION_PROVIDER_ID/,
  );
  assert.throws(
    () => resolveImagePerceptionRuntimeBinding(env('https://user:password@vision.example.test/perceive')),
    /credentials are forbidden/,
  );
  assert.throws(
    () => resolveImagePerceptionRuntimeBinding(env('https://vision.example.test/perceive?api_key=secret')),
    /query parameters are forbidden/,
  );
  assert.throws(
    () => resolveImagePerceptionRuntimeBinding(env('https://vision.example.test/perceive#token')),
    /fragments are forbidden/,
  );
});

test('I7C-01 bearer credential remains closure-held while exact PNG bytes cross the real HTTP transport boundary', async () => {
  await withRuntime(async ({ repo, byteStore }) => {
    const intake = intakePngUpload(repo, byteStore, ARBITRARY_PNG, {
      receivedAt: '2026-08-20T20:10:00.000Z',
      declaredName: 'previously-unregistered-runtime-config-test.png',
    });
    let capturedBody: AsyncImagePerceptionTransportEnvelope | undefined;
    let capturedAuthorization: string | undefined;

    await withServer(async (request, response) => {
      capturedAuthorization = request.headers.authorization;
      capturedBody = await readJson(request) as AsyncImagePerceptionTransportEnvelope;
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(partialResponse()));
    }, async (endpoint) => {
      const resolution = resolveImagePerceptionRuntimeBinding(env(endpoint));
      assert.equal(resolution.status, 'CONFIGURED');
      if (resolution.status !== 'CONFIGURED') throw new Error('expected configured real provider');

      const descriptorJson = JSON.stringify(resolution.binding.descriptor);
      const bindingJson = JSON.stringify(resolution.binding);
      assert.equal(descriptorJson.includes(SECRET), false);
      assert.equal(bindingJson.includes(SECRET), false);
      assert.equal(resolution.binding.descriptor.configurationFingerprint.includes(SECRET), false);
      assert.equal(resolution.binding.descriptor.authConfigured, true);
      assert.equal(resolution.binding.descriptor.authMode, 'BEARER');

      const result = await runConfiguredImagePerceptionAdmission(repo, byteStore, intake, resolution.binding, {
        now: '2026-08-20T20:10:01.000Z',
      });

      assert.equal(capturedAuthorization, `Bearer ${SECRET}`);
      assert.ok(capturedBody);
      assert.equal(capturedBody!.contentSha256, intake.representation.contentHash);
      assert.equal(capturedBody!.sourceRepresentationId, intake.representation.id);
      assert.ok(Buffer.from(capturedBody!.imageBase64, 'base64').equals(ARBITRARY_PNG));
      assert.equal(JSON.stringify(capturedBody).includes(SECRET), false);

      assert.equal(result.providerResult.providerClass, 'MODEL_PROVIDER');
      assert.equal(result.providerResult.evidenceMode, 'MODEL_INFERENCE');
      assert.equal(result.admission.decision, 'ADMITTED_FOR_REVIEW');
      assert.equal(result.admission.semanticAuthority, 'NONE');
      assert.equal(result.admission.automaticFreezeAuthorized, false);
      assert.equal(result.admission.automaticExecutionAuthorized, false);
      assert.equal(result.commonEvidence?.classification.truthClass, 'INFERRED');
      assert.equal(persistedPerceptionJson(repo).includes(SECRET), false);

      for (const forbiddenKind of [
        'ProcessRevision',
        'SemanticFreezeRecord',
        'CapabilityDesignRevision',
        'ExecutionPlanRevision',
        'TemporalMappingRevision',
        'DeploymentRevision',
      ]) {
        assert.equal(repo.listByKind(forbiddenKind).length, 0, `${forbiddenKind} must not be created by I7C-01`);
      }
    });
  });
});
