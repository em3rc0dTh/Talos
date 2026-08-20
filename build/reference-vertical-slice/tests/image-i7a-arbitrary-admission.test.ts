import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  LocalImageByteStore,
  QUARRY_02_VERIFIED_SHA256,
  ReferenceQuarryPerceptionProvider,
  intakePngUpload,
  runImagePerceptionAdmission,
  type ImagePerceptionProvider,
  type ImagePerceptionProviderRequest,
} from '../packages/image-perception/src/index.ts';
import { QUARRY_01_VERIFIED_SHA256 } from '../packages/image-perception/src/reference-quarry01-provider.ts';

const ARBITRARY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=',
  'base64',
);
const ARBITRARY_SHA256 = '658e796317e9d94e0b7665744fd93a4e1a9e98f7c3ae9ddb91700e74015225e9';

function withRuntime<T>(fn: (ctx: { repo: SqliteDocumentStore; byteStore: LocalImageByteStore }) => T): T {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i7a-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  try { return fn({ repo, byteStore }); }
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
    assert.equal(repo.listByKind(kind).length, 0, `${kind} must remain absent in I7A`);
  }
}

test('I7A arbitrary PNG preserves exact bytes and separate upload/source identity before provider admission', () => {
  withRuntime(({ repo, byteStore }) => {
    assert.equal(createHash('sha256').update(ARBITRARY_PNG).digest('hex'), ARBITRARY_SHA256);
    assert.notEqual(ARBITRARY_SHA256, QUARRY_01_VERIFIED_SHA256);
    assert.notEqual(ARBITRARY_SHA256, QUARRY_02_VERIFIED_SHA256);

    const first = intakePngUpload(repo, byteStore, ARBITRARY_PNG, { receivedAt: '2026-08-20T16:20:00.000Z', declaredName: 'I7A arbitrary fixture A' });
    const second = intakePngUpload(repo, byteStore, ARBITRARY_PNG, { receivedAt: '2026-08-20T16:20:01.000Z', declaredName: 'I7A arbitrary fixture B' });

    assert.equal(first.storage.sha256, ARBITRARY_SHA256);
    assert.equal(second.storage.sha256, ARBITRARY_SHA256);
    assert.equal(first.coordinateSpace.width, 1);
    assert.equal(first.coordinateSpace.height, 1);
    assert.equal(first.representation.byteIdentityStatus, 'EXACT_VERIFIED');
    assert.notEqual(first.session.id, second.session.id);
    assert.notEqual(first.artifact.id, second.artifact.id);
    assert.notEqual(first.representation.id, second.representation.id);
    assert.equal(first.storage.relativePath, second.storage.relativePath, 'byte storage may deduplicate while source identity must not');
  });
});

test('I7A passes only preserved representation identity/digest/dimensions into a provider and admits PARTIAL evidence for review without semantic authority', () => {
  withRuntime(({ repo, byteStore }) => {
    const intake = intakePngUpload(repo, byteStore, ARBITRARY_PNG, { receivedAt: '2026-08-20T16:21:00.000Z', declaredName: 'I7A partial arbitrary image' });
    let requestSeen: ImagePerceptionProviderRequest | undefined;
    const provider: ImagePerceptionProvider = {
      providerId: 'I7A_PARTIAL_TEST_PROVIDER',
      providerVersion: '0.1.0-test',
      perceive: (request) => {
        requestSeen = request;
        return {
          providerId: 'I7A_PARTIAL_TEST_PROVIDER',
          providerVersion: '0.1.0-test',
          providerClass: 'MODEL_PROVIDER',
          modelRef: 'test:i7a-partial-model',
          modelVersion: '0.1.0',
          pipelineVersion: 'i7a-test-pipeline',
          evidenceMode: 'MODEL_INFERENCE',
          status: 'PARTIAL',
          anchors: [{ providerAnchorKey: 'whole', geometryKind: 'WHOLE_IMAGE', geometry: { x: 0, y: 0, width: 1, height: 1 }, visibilityState: 'LOW_LEGIBILITY' }],
          observations: [{ providerObservationKey: 'label', anchorKey: 'whole', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Candidate work', confidence: 0.4 }],
          occurrenceCandidates: [{ providerOccurrenceKey: 'candidate-work', anchorKeys: ['whole'], occurrenceKind: 'NODE', literalLabelObservationKey: 'label', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['label'], confidence: 0.4 }],
          alternativeSets: [],
          relationCandidates: [],
          diagnostics: [{ code: 'LOW_CONFIDENCE_IMAGE', description: 'Only partial low-confidence process evidence was recovered.' }],
        };
      },
    };

    const result = runImagePerceptionAdmission(repo, intake, provider, { now: '2026-08-20T16:21:01.000Z' });

    assert.ok(requestSeen);
    assert.equal(requestSeen!.sourceRepresentationId, intake.representation.id);
    assert.equal(requestSeen!.contentSha256, ARBITRARY_SHA256);
    assert.equal(requestSeen!.mediaType, 'image/png');
    assert.equal(requestSeen!.coordinateSpace.id, intake.coordinateSpace.id);
    assert.equal(requestSeen!.coordinateSpace.width, 1);
    assert.equal(requestSeen!.coordinateSpace.height, 1);

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

test('I7A arbitrary digest cannot fall through to the Quarry fixture provider and SAFE_STOP_NO_RESULT fabricates no semantic candidate', () => {
  withRuntime(({ repo, byteStore }) => {
    const intake = intakePngUpload(repo, byteStore, ARBITRARY_PNG, { receivedAt: '2026-08-20T16:22:00.000Z' });
    const result = runImagePerceptionAdmission(repo, intake, new ReferenceQuarryPerceptionProvider(), { now: '2026-08-20T16:22:01.000Z' });

    assert.equal(result.providerResult.status, 'NO_RESULT');
    assert.equal(result.admission.decision, 'SAFE_STOP_NO_RESULT');
    assert.equal(result.admission.requiresHumanReview, false);
    assert.equal(result.admission.commonEvidenceGraphRefs.length, 0);
    assert.equal(result.attempt.result, undefined);
    assert.equal(repo.listByKind('PerceptionObservation').length, 0);
    assert.equal(repo.listByKind('SourceEvidenceGraph').length, 0);
    assert.equal(repo.listByKind('CandidateSemanticScope').length, 0);
    assert.ok(result.attempt.diagnostics.some((item) => item.code === 'NO_PERCEPTION_PROVIDER_RESULT'));
    assertNoExecutionAuthority(repo);
  });
});

test('I7A provider exception becomes terminal append-only failure evidence and repeated attempts never mutate or fabricate results', () => {
  withRuntime(({ repo, byteStore }) => {
    const intake = intakePngUpload(repo, byteStore, ARBITRARY_PNG, { receivedAt: '2026-08-20T16:23:00.000Z' });
    const provider: ImagePerceptionProvider = {
      providerId: 'I7A_THROWING_PROVIDER',
      providerVersion: '0.1.0-test',
      perceive: () => { throw new Error('provider unavailable'); },
    };

    const first = runImagePerceptionAdmission(repo, intake, provider, { now: '2026-08-20T16:23:01.000Z' });
    const second = runImagePerceptionAdmission(repo, intake, provider, { now: '2026-08-20T16:24:01.000Z' });

    for (const result of [first, second]) {
      assert.equal(result.admission.decision, 'SAFE_STOP_PROVIDER_FAILURE');
      assert.equal(result.providerResult.status, 'NO_RESULT');
      assert.equal(result.attempt.completion?.status, 'PARTIAL');
      assert.equal(result.attempt.result, undefined);
      assert.ok(result.attempt.diagnostics.some((item) => item.code === 'IMAGE_PERCEPTION_PROVIDER_FAILURE'));
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
