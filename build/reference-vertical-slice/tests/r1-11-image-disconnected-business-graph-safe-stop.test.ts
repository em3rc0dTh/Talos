import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildImageBpmnReviewCandidate } from '../packages/application/src/image-bpmn-review.ts';
import {
  assessImagePerceptionSufficiency,
  LocalImageByteStore,
  resolveImagePerceptionRuntimeBinding,
  type AsyncImagePerceptionTransportEnvelope,
  type ImagePerceptionProviderResult,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

function tinyPng(width = 574, height = 157): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12, 'ascii');
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function occurrence(key: string, kind: string, anchor: string, observation: string) {
  return {
    providerOccurrenceKey: key,
    anchorKeys: [anchor],
    occurrenceKind: 'NODE',
    literalLabelObservationKey: observation,
    candidateSemanticType: kind,
    sourcePlaneKind: 'BUSINESS_GRAPH' as const,
    supportingObservationKeys: [observation],
    confidence: 0.96,
  };
}

function relation(key: string, source: string, target: string, anchor: string, stroke: string) {
  return {
    providerRelationKey: key,
    strokeObservationKeys: [stroke],
    anchorKeys: [anchor],
    existenceConfidence: 0.96,
    sourceEndpointCandidates: [{ occurrenceCandidateKey: source, endpointState: 'SET_CANDIDATE' as const, confidence: 0.96 }],
    targetEndpointCandidates: [{ occurrenceCandidateKey: target, endpointState: 'SET_CANDIDATE' as const, confidence: 0.96 }],
    directionCandidates: [{ value: 'SOURCE_TO_TARGET' as const, confidence: 0.96 }],
  };
}

function disconnectedCreateCustomerResult(): ImagePerceptionProviderResult {
  const nodes = [
    ['start', 'EVENT', 'a-start', 'o-start', ''],
    ['name', 'ACTION', 'a-name', 'o-name', 'Request name'],
    ['phone', 'ACTION', 'a-phone', 'o-phone', 'Request Phone number'],
    ['id', 'ACTION', 'a-id', 'o-id', 'Request ID (optional)'],
    ['end', 'END', 'a-end', 'o-end', 'END'],
  ] as const;
  const connectorDefs = [
    ['r-start-name', 'start', 'name', 'a-r1', 's-r1'],
    ['r-name-phone', 'name', 'phone', 'a-r2', 's-r2'],
    ['r-phone-id', 'phone', 'id', 'a-r3', 's-r3'],
  ] as const;
  return {
    providerId: 'PRIMARY',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:PRIMARY',
    modelVersion: '1',
    pipelineVersion: 'test-v1',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'SUCCEEDED',
    anchors: [
      ...nodes.map(([, , anchor]) => ({ providerAnchorKey: anchor, geometryKind: 'BOX' as const, geometry: { x: 0, y: 0, width: 10, height: 10 }, visibilityState: 'VISIBLE' as const })),
      ...connectorDefs.map(([, , , anchor]) => ({ providerAnchorKey: anchor, geometryKind: 'BOX' as const, geometry: { x: 0, y: 0, width: 10, height: 10 }, visibilityState: 'VISIBLE' as const })),
    ],
    observations: [
      ...nodes.map(([, , anchor, observation, label]) => ({ providerObservationKey: observation, anchorKey: anchor, observationKind: 'TEXT_LITERAL_CANDIDATE' as const, observedValue: label, confidence: 0.96 })),
      ...connectorDefs.map(([, , , anchor, stroke]) => ({ providerObservationKey: stroke, anchorKey: anchor, observationKind: 'CONNECTOR_STROKE' as const, confidence: 0.96 })),
    ],
    occurrenceCandidates: nodes.map(([key, kind, anchor, observation]) => occurrence(key, kind, anchor, observation)),
    alternativeSets: [],
    relationCandidates: connectorDefs.map(([key, source, target, anchor, stroke]) => relation(key, source, target, anchor, stroke)),
    diagnostics: [{ code: 'STRUCTURED_VISUAL_EXTRACTION', description: 'Provider claimed complete structured evidence.' }],
  };
}

function bindingEnv() {
  return {
    TALOS_IMAGE_PERCEPTION_PROVIDER_URL: 'http://primary.invalid/vision',
    TALOS_IMAGE_PERCEPTION_PROVIDER_ID: 'PRIMARY',
    TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION: '1.0.0',
    TALOS_IMAGE_PERCEPTION_MODEL_REF: 'model:PRIMARY',
    TALOS_IMAGE_PERCEPTION_MODEL_VERSION: '1',
    TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION: 'test-v1',
  };
}

function correlatedFetch(result: ImagePerceptionProviderResult): typeof fetch {
  return (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const envelope = JSON.parse(String(init?.body)) as AsyncImagePerceptionTransportEnvelope;
    return new Response(JSON.stringify({
      ...result,
      requestCorrelation: {
        schemaVersion: 'talos-image-perception-correlation-v0.1',
        sourceRepresentationId: envelope.sourceRepresentationId,
        contentSha256: envelope.contentSha256,
        coordinateSpace: { ...envelope.coordinateSpace },
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

test('R1-11 disconnected create-customer perception is insufficient even when provider claims SUCCEEDED', () => {
  const assessment = assessImagePerceptionSufficiency(disconnectedCreateCustomerResult());
  assert.equal(assessment.status, 'INSUFFICIENT');
  assert.ok(assessment.reasonCodes.includes('DISCONNECTED_BUSINESS_GRAPH'));
  assert.ok(assessment.reasonCodes.includes('END_WITHOUT_INCOMING_RELATION'));
  assert.ok(assessment.reasonCodes.includes('NON_TERMINAL_WITHOUT_OUTGOING_RELATION'));
});

test('R1-11 single-provider image path applies sufficiency gate and safe-stops before canonical normalization', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-disconnected-image-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'source-bytes'));
  try {
    const runtime = resolveImagePerceptionRuntimeBinding(bindingEnv());
    assert.equal(runtime.status, 'CONFIGURED');
    if (runtime.status !== 'CONFIGURED') return;
    const result = await buildImageBpmnReviewCandidate(
      repo,
      bytes,
      tinyPng(),
      runtime.binding,
      {
        initiatedBy: 'field-user',
        declaredName: 'create-customer.png',
        fetchImpl: correlatedFetch(disconnectedCreateCustomerResult()),
      },
    );
    assert.equal(result.status, 'SAFE_STOP_BEFORE_CANONICAL');
    assert.equal(result.perceptionSufficiency?.status, 'INSUFFICIENT');
    assert.ok(result.perceptionSufficiency?.reasonCodes.includes('DISCONNECTED_BUSINESS_GRAPH'));
    assert.equal(repo.listByKind('ProcessRevision').length, 0, 'insufficient perception must not create canonical business meaning');
    assert.equal(repo.listByKind('BpmnProcessRevision').length, 0, 'insufficient perception must not create a BPMN review candidate');
  } finally {
    repo.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
