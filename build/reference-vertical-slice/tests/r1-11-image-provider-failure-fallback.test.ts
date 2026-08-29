import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  intakePngUpload,
  LocalImageByteStore,
  resolveImagePerceptionFallbackRuntimeBinding,
  resolveImagePerceptionRuntimeBinding,
  runCorrelatedImagePerceptionWithFallback,
  type AsyncImagePerceptionTransportEnvelope,
  type ImagePerceptionProviderResult,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

function tinyPng(): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12, 'ascii');
  bytes.writeUInt32BE(1000, 16);
  bytes.writeUInt32BE(600, 20);
  return bytes;
}

function fallbackResult(): ImagePerceptionProviderResult {
  return {
    providerId: 'FALLBACK',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:FALLBACK',
    modelVersion: '1',
    pipelineVersion: 'test-v1',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'SUCCEEDED',
    anchors: [
      { providerAnchorKey: 'a1', geometryKind: 'BOX', geometry: { x: 10, y: 10, width: 100, height: 60 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a2', geometryKind: 'BOX', geometry: { x: 300, y: 10, width: 100, height: 60 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'e1', geometryKind: 'BOX', geometry: { x: 110, y: 20, width: 190, height: 30 }, visibilityState: 'VISIBLE' },
    ],
    observations: [
      { providerObservationKey: 'o1', anchorKey: 'a1', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Receive request', confidence: 0.95 },
      { providerObservationKey: 'o2', anchorKey: 'a2', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Approve request', confidence: 0.95 },
      { providerObservationKey: 's1', anchorKey: 'e1', observationKind: 'CONNECTOR_STROKE', confidence: 0.95 },
    ],
    occurrenceCandidates: [
      { providerOccurrenceKey: 'n1', anchorKeys: ['a1'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o1', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o1'], confidence: 0.95 },
      { providerOccurrenceKey: 'n2', anchorKeys: ['a2'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o2', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o2'], confidence: 0.95 },
    ],
    alternativeSets: [{
      providerAlternativeSetKey: 'role1',
      propertyPath: 'relationshipRole',
      alternatives: [{ providerAlternativeKey: 'control', value: 'CONTROL_FLOW', confidence: 0.95, anchorKeys: ['e1'], supportingObservationKeys: ['s1'] }],
      exclusivityMode: 'MUTUALLY_EXCLUSIVE',
      modelPreferredAlternativeKey: 'control',
      modelPreferenceConfidence: 0.95,
    }],
    relationCandidates: [{
      providerRelationKey: 'r1',
      strokeObservationKeys: ['s1'],
      anchorKeys: ['e1'],
      existenceConfidence: 0.95,
      sourceEndpointCandidates: [{ occurrenceCandidateKey: 'n1', endpointState: 'SET_CANDIDATE', confidence: 0.95 }],
      targetEndpointCandidates: [{ occurrenceCandidateKey: 'n2', endpointState: 'SET_CANDIDATE', confidence: 0.95 }],
      directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: 0.95 }],
      roleAlternativeSetKey: 'role1',
    }],
    diagnostics: [{ code: 'STRUCTURED_VISUAL_EXTRACTION', description: 'Complete independent fallback evidence.' }],
  };
}

function correlation(envelope: AsyncImagePerceptionTransportEnvelope) {
  return {
    schemaVersion: 'talos-image-perception-correlation-v0.1' as const,
    sourceRepresentationId: envelope.sourceRepresentationId,
    contentSha256: envelope.contentSha256,
    coordinateSpace: { ...envelope.coordinateSpace },
  };
}

test('R1-11 primary HTTP 429 failure triggers one independent configured fallback after bounded primary retries', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-provider-failure-fallback-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(dir, 'source-bytes'));
  try {
    const primary = resolveImagePerceptionRuntimeBinding({
      TALOS_IMAGE_PERCEPTION_PROVIDER_URL: 'http://primary.invalid/vision',
      TALOS_IMAGE_PERCEPTION_PROVIDER_ID: 'PRIMARY',
      TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION: '1.0.0',
      TALOS_IMAGE_PERCEPTION_MODEL_REF: 'model:PRIMARY',
      TALOS_IMAGE_PERCEPTION_MODEL_VERSION: '1',
      TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION: 'test-v1',
    });
    const fallback = resolveImagePerceptionFallbackRuntimeBinding({
      TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_URL: 'http://fallback.invalid/vision',
      TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_ID: 'FALLBACK',
      TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_VERSION: '1.0.0',
      TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_REF: 'model:FALLBACK',
      TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_VERSION: '1',
      TALOS_IMAGE_PERCEPTION_FALLBACK_PIPELINE_VERSION: 'test-v1',
    });
    assert.equal(primary.status, 'CONFIGURED');
    assert.equal(fallback.status, 'CONFIGURED');
    if (primary.status !== 'CONFIGURED' || fallback.status !== 'CONFIGURED') return;

    const intake = intakePngUpload(repo, byteStore, tinyPng(), { initiatedBy: 'r1-provider-failure-fallback-test' });
    let primaryCalls = 0;
    let fallbackCalls = 0;
    const primaryFetch = (async () => {
      primaryCalls += 1;
      return new Response('rate limited', { status: 429, headers: { 'retry-after': '0' } });
    }) as typeof fetch;
    const fallbackFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      fallbackCalls += 1;
      const envelope = JSON.parse(String(init?.body)) as AsyncImagePerceptionTransportEnvelope;
      return new Response(JSON.stringify({ ...fallbackResult(), requestCorrelation: correlation(envelope) }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const routed = await runCorrelatedImagePerceptionWithFallback(
      repo,
      byteStore,
      intake,
      primary.binding,
      fallback.binding,
      { primaryFetch, fallbackFetch },
    );

    assert.equal(primaryCalls, 3);
    assert.equal(routed.primary.admission.decision, 'SAFE_STOP_PROVIDER_FAILURE');
    assert.match(routed.primary.attempt.diagnostics[0]?.description ?? '', /IMAGE_PERCEPTION_PROVIDER_HTTP_429/);
    assert.equal(fallbackCalls, 1);
    assert.equal(routed.routing.automaticFallbackTriggered, true);
    assert.equal(routed.routing.decision, 'FALLBACK_ACCEPTED');
    assert.equal(routed.selected?.providerResult.providerId, 'FALLBACK');
    assert.equal(routed.routing.automaticConfirmationAuthorized, false);
    assert.equal(routed.routing.automaticExecutionAuthorized, false);
  } finally {
    repo.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
