import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildImageBpmnReviewCandidate,
  confirmImageInterpretedBusinessProcess,
  initializeReview,
} from '../packages/application/src/index.ts';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  IMAGE_PERCEPTION_RUNTIME_ENV,
  LocalImageByteStore,
  resolveImagePerceptionRuntimeBinding,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const UNSEEN_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR4nGP8////fwYGBgYmBigAAD34BADaOyqcAAAAAElFTkSuQmCC', 'base64');
const UNSEEN_SHA256 = '168b8b2e81aec05759d67532d962380f5df5006429479777dea01a0b7296e4bf';

async function withRuntime<T>(fn: (repo: SqliteDocumentStore, bytes: LocalImageByteStore) => Promise<T>): Promise<T> {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7c06-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'bytes'));
  try { return await fn(repo, bytes); }
  finally { repo.close(); rmSync(dir, { recursive: true, force: true }); }
}

async function readJson(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function correlation(envelope: AsyncImagePerceptionTransportEnvelope, overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
    sourceRepresentationId: envelope.sourceRepresentationId,
    contentSha256: envelope.contentSha256,
    coordinateSpace: { ...envelope.coordinateSpace },
    ...overrides,
  };
}

function baseResponse(envelope: AsyncImagePerceptionTransportEnvelope, body: Record<string, unknown>) {
  return {
    providerId: 'I7C06_ADVERSARIAL_MODEL',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:adversarial-process-diagram',
    modelVersion: '2026-08-20',
    pipelineVersion: 'talos-adversarial-perception-v0.1',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'SUCCEEDED',
    requestCorrelation: correlation(envelope),
    diagnostics: [],
    ...body,
  };
}

function env(endpoint: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'I7C06_ADVERSARIAL_MODEL',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'model:adversarial-process-diagram',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-20',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-adversarial-perception-v0.1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
  };
}

async function provider<T>(factory: (envelope: AsyncImagePerceptionTransportEnvelope) => any, fn: (endpoint: string) => Promise<T>): Promise<T> {
  const server = createServer(async (req, res) => {
    const envelope = await readJson(req) as AsyncImagePerceptionTransportEnvelope;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(factory(envelope)));
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('provider did not bind');
  try { return await fn(`http://127.0.0.1:${address.port}/vision`); }
  finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
}

function decisionResponse(envelope: AsyncImagePerceptionTransportEnvelope) {
  return baseResponse(envelope, {
    anchors: [
      { providerAnchorKey: 'a-start', geometryKind: 'BOX', geometry: { x: .02, y: .4, width: .08, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-decision', geometryKind: 'BOX', geometry: { x: .25, y: .35, width: .12, height: .16 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-yes', geometryKind: 'BOX', geometry: { x: .65, y: .15, width: .1, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-no', geometryKind: 'BOX', geometry: { x: .65, y: .65, width: .1, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-f1', geometryKind: 'POLYLINE', geometry: [{ x: .1, y: .45 }, { x: .25, y: .43 }], visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-f2', geometryKind: 'POLYLINE', geometry: [{ x: .37, y: .4 }, { x: .65, y: .2 }], visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-f3', geometryKind: 'POLYLINE', geometry: [{ x: .37, y: .46 }, { x: .65, y: .7 }], visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-guard-yes', geometryKind: 'BOX', geometry: { x: .48, y: .22, width: .08, height: .05 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-guard-no', geometryKind: 'BOX', geometry: { x: .48, y: .62, width: .08, height: .05 }, visibilityState: 'VISIBLE' },
    ],
    observations: [
      { providerObservationKey: 'o-start', anchorKey: 'a-start', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Start', confidence: .99 },
      { providerObservationKey: 'o-decision', anchorKey: 'a-decision', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Credit OK?', confidence: .99 },
      { providerObservationKey: 'o-yes-end', anchorKey: 'a-yes', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Approved', confidence: .99 },
      { providerObservationKey: 'o-no-end', anchorKey: 'a-no', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Rejected', confidence: .99 },
      { providerObservationKey: 'o-f1', anchorKey: 'a-f1', observationKind: 'CONNECTOR_STROKE', confidence: .95 },
      { providerObservationKey: 'o-f2', anchorKey: 'a-f2', observationKind: 'CONNECTOR_STROKE', confidence: .95 },
      { providerObservationKey: 'o-f3', anchorKey: 'a-f3', observationKind: 'CONNECTOR_STROKE', confidence: .95 },
      { providerObservationKey: 'o-guard-yes', anchorKey: 'a-guard-yes', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Yes', confidence: .99 },
      { providerObservationKey: 'o-guard-no', anchorKey: 'a-guard-no', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'No', confidence: .99 },
    ],
    occurrenceCandidates: [
      { providerOccurrenceKey: 'start', anchorKeys: ['a-start'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-start', candidateSemanticType: 'EVENT', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-start'], confidence: .99 },
      { providerOccurrenceKey: 'decision', anchorKeys: ['a-decision'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-decision', candidateSemanticType: 'DECISION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-decision'], confidence: .99 },
      { providerOccurrenceKey: 'approved', anchorKeys: ['a-yes'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-yes-end', candidateSemanticType: 'END', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-yes-end'], confidence: .99 },
      { providerOccurrenceKey: 'rejected', anchorKeys: ['a-no'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-no-end', candidateSemanticType: 'END', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-no-end'], confidence: .99 },
    ],
    alternativeSets: [
      { providerAlternativeSetKey: 'r1', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'r1-flow', value: 'CONTROL_FLOW', confidence: .99, anchorKeys: ['a-f1'], supportingObservationKeys: ['o-f1'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'r1-flow', modelPreferenceConfidence: .99 },
      { providerAlternativeSetKey: 'r2', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'r2-conditional', value: 'CONDITIONAL_FLOW', confidence: .99, anchorKeys: ['a-f2'], supportingObservationKeys: ['o-f2','o-guard-yes'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'r2-conditional', modelPreferenceConfidence: .99 },
      { providerAlternativeSetKey: 'r3', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'r3-conditional', value: 'CONDITIONAL_FLOW', confidence: .99, anchorKeys: ['a-f3'], supportingObservationKeys: ['o-f3','o-guard-no'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'r3-conditional', modelPreferenceConfidence: .99 },
    ],
    relationCandidates: [
      { providerRelationKey: 'f1', strokeObservationKeys: ['o-f1'], anchorKeys: ['a-f1'], sourceEndpointCandidates: [{ occurrenceCandidateKey: 'start', anchorKey: 'a-start', endpointState: 'SET_CANDIDATE', confidence: .99 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'decision', anchorKey: 'a-decision', endpointState: 'SET_CANDIDATE', confidence: .99 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .99 }], roleAlternativeSetKey: 'r1' },
      { providerRelationKey: 'f2', strokeObservationKeys: ['o-f2'], anchorKeys: ['a-f2'], sourceEndpointCandidates: [{ occurrenceCandidateKey: 'decision', anchorKey: 'a-decision', endpointState: 'SET_CANDIDATE', confidence: .99 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'approved', anchorKey: 'a-yes', endpointState: 'SET_CANDIDATE', confidence: .99 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .99 }], roleAlternativeSetKey: 'r2', guardTextObservationKeys: ['o-guard-yes'] },
      { providerRelationKey: 'f3', strokeObservationKeys: ['o-f3'], anchorKeys: ['a-f3'], sourceEndpointCandidates: [{ occurrenceCandidateKey: 'decision', anchorKey: 'a-decision', endpointState: 'SET_CANDIDATE', confidence: .99 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'rejected', anchorKey: 'a-no', endpointState: 'SET_CANDIDATE', confidence: .99 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .99 }], roleAlternativeSetKey: 'r3', guardTextObservationKeys: ['o-guard-no'] },
    ],
  });
}

function waitResponse(envelope: AsyncImagePerceptionTransportEnvelope) {
  return baseResponse(envelope, {
    anchors: [
      { providerAnchorKey: 's', geometryKind: 'BOX', geometry: { x: .05, y: .4, width: .08, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'w', geometryKind: 'BOX', geometry: { x: .35, y: .35, width: .2, height: .16 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'e', geometryKind: 'BOX', geometry: { x: .8, y: .4, width: .08, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'f1', geometryKind: 'POLYLINE', geometry: [{ x: .13, y: .45 }, { x: .35, y: .43 }], visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'f2', geometryKind: 'POLYLINE', geometry: [{ x: .55, y: .43 }, { x: .8, y: .45 }], visibilityState: 'VISIBLE' },
    ],
    observations: [
      { providerObservationKey: 'os', anchorKey: 's', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Start', confidence: .99 },
      { providerObservationKey: 'ow', anchorKey: 'w', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'On Next Wednesday', confidence: .99 },
      { providerObservationKey: 'oe', anchorKey: 'e', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Complete', confidence: .99 },
      { providerObservationKey: 'of1', anchorKey: 'f1', observationKind: 'CONNECTOR_STROKE', confidence: .99 },
      { providerObservationKey: 'of2', anchorKey: 'f2', observationKind: 'CONNECTOR_STROKE', confidence: .99 },
    ],
    occurrenceCandidates: [
      { providerOccurrenceKey: 'start', anchorKeys: ['s'], occurrenceKind: 'NODE', literalLabelObservationKey: 'os', candidateSemanticType: 'EVENT', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['os'], confidence: .99 },
      { providerOccurrenceKey: 'wait', anchorKeys: ['w'], occurrenceKind: 'NODE', literalLabelObservationKey: 'ow', candidateSemanticType: 'WAIT', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['ow'], confidence: .99 },
      { providerOccurrenceKey: 'end', anchorKeys: ['e'], occurrenceKind: 'NODE', literalLabelObservationKey: 'oe', candidateSemanticType: 'END', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['oe'], confidence: .99 },
    ],
    alternativeSets: [
      { providerAlternativeSetKey: 'r1', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'c1', value: 'CONTROL_FLOW', confidence: .99, anchorKeys: ['f1'], supportingObservationKeys: ['of1'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'c1', modelPreferenceConfidence: .99 },
      { providerAlternativeSetKey: 'r2', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'c2', value: 'CONTROL_FLOW', confidence: .99, anchorKeys: ['f2'], supportingObservationKeys: ['of2'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'c2', modelPreferenceConfidence: .99 },
    ],
    relationCandidates: [
      { providerRelationKey: 'f1', strokeObservationKeys: ['of1'], anchorKeys: ['f1'], sourceEndpointCandidates: [{ occurrenceCandidateKey: 'start', anchorKey: 's', endpointState: 'SET_CANDIDATE', confidence: .99 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'wait', anchorKey: 'w', endpointState: 'SET_CANDIDATE', confidence: .99 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .99 }], roleAlternativeSetKey: 'r1' },
      { providerRelationKey: 'f2', strokeObservationKeys: ['of2'], anchorKeys: ['f2'], sourceEndpointCandidates: [{ occurrenceCandidateKey: 'wait', anchorKey: 'w', endpointState: 'SET_CANDIDATE', confidence: .99 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'end', anchorKey: 'e', endpointState: 'SET_CANDIDATE', confidence: .99 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .99 }], roleAlternativeSetKey: 'r2' },
    ],
  });
}

function unresolvedEndpointResponse(envelope: AsyncImagePerceptionTransportEnvelope) {
  return baseResponse(envelope, {
    anchors: [
      { providerAnchorKey: 's', geometryKind: 'BOX', geometry: { x: .1, y: .4, width: .1, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'f', geometryKind: 'POLYLINE', geometry: [{ x: .2, y: .45 }, { x: .7, y: .45 }], visibilityState: 'VISIBLE' },
    ],
    observations: [
      { providerObservationKey: 'os', anchorKey: 's', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Start', confidence: .99 },
      { providerObservationKey: 'of', anchorKey: 'f', observationKind: 'CONNECTOR_STROKE', confidence: .99 },
    ],
    occurrenceCandidates: [
      { providerOccurrenceKey: 'start', anchorKeys: ['s'], occurrenceKind: 'NODE', literalLabelObservationKey: 'os', candidateSemanticType: 'EVENT', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['os'], confidence: .99 },
    ],
    alternativeSets: [
      { providerAlternativeSetKey: 'role', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'flow', value: 'CONTROL_FLOW', confidence: .99, anchorKeys: ['f'], supportingObservationKeys: ['of'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'flow', modelPreferenceConfidence: .99 },
    ],
    relationCandidates: [
      { providerRelationKey: 'flow', strokeObservationKeys: ['of'], anchorKeys: ['f'], sourceEndpointCandidates: [{ occurrenceCandidateKey: 'start', anchorKey: 's', endpointState: 'SET_CANDIDATE', confidence: .99 }], targetEndpointCandidates: [{ endpointState: 'UNRESOLVED', confidence: .99 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .99 }], roleAlternativeSetKey: 'role' },
    ],
  });
}

async function build(factory: (envelope: AsyncImagePerceptionTransportEnvelope) => any) {
  return withRuntime(async (repo, byteStore) => provider(factory, async (endpoint) => {
    const resolution = resolveImagePerceptionRuntimeBinding(env(endpoint));
    assert.equal(resolution.status, 'CONFIGURED');
    if (resolution.status !== 'CONFIGURED') throw new Error('provider expected');
    const result = await buildImageBpmnReviewCandidate(repo, byteStore, UNSEEN_PNG, resolution.binding, {
      declaredName: 'unseen-adversarial-process.png',
      initiatedBy: 'i7c06-reviewer',
      receivedAt: '2026-08-20T23:30:00.000Z',
      perceivedAt: '2026-08-20T23:30:01.000Z',
      normalizedAt: '2026-08-20T23:30:02.000Z',
      assessedAt: '2026-08-20T23:30:03.000Z',
      projectedAt: '2026-08-20T23:30:04.000Z',
    });
    return { repo, result };
  }));
}

test('I7C-06 Yes/No guard text remains evidence only and cannot fabricate structured BusinessRules', async () => {
  await withRuntime(async (repo, byteStore) => provider(decisionResponse, async (endpoint) => {
    const resolution = resolveImagePerceptionRuntimeBinding(env(endpoint));
    if (resolution.status !== 'CONFIGURED') throw new Error('provider expected');
    const result = await buildImageBpmnReviewCandidate(repo, byteStore, UNSEEN_PNG, resolution.binding, {
      declaredName: 'unseen-decision.png', initiatedBy: 'reviewer',
      receivedAt: '2026-08-20T23:31:00.000Z', perceivedAt: '2026-08-20T23:31:01.000Z', normalizedAt: '2026-08-20T23:31:02.000Z', assessedAt: '2026-08-20T23:31:03.000Z', projectedAt: '2026-08-20T23:31:04.000Z',
    });
    assert.equal(result.status, 'BPMN_READY_FOR_PROCESS_REVIEW');
    if (result.status !== 'BPMN_READY_FOR_PROCESS_REVIEW') throw new Error('review candidate expected');
    assert.equal(result.intake.representation.contentHash, UNSEEN_SHA256);
    assert.equal(result.semantic.normalization.processRevision.rules.length, 0);
    const conditional = result.semantic.normalization.processRevision.edges.filter((edge) => edge.kind === 'CONDITIONAL');
    assert.equal(conditional.length, 2);
    assert.equal(conditional.every((edge) => edge.conditionRuleRef === undefined), true);
    assert.equal(result.semantic.validation.findings.filter((finding) => finding.code === 'SV-CFL-001').length, 2);
    assert.equal(result.semantic.validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.equal(result.projection.bpmnRevision.bpmnXml.includes('conditionExpression'), false);

    const review = initializeReview(repo, result.semantic.normalization.processRevision, result.semantic.validation, { createdBy: 'reviewer', sourceRepresentationRefs: [result.intake.representation.id] });
    const confirmed = confirmImageInterpretedBusinessProcess(repo, {
      currentBpmnRevision: result.projection.bpmnRevision,
      currentProcessRevision: result.semantic.normalization.processRevision,
      currentValidation: result.semantic.validation,
      currentReviewContext: review.context,
      confirmedBy: 'reviewer',
      authorityRef: 'business-owner',
      confirmedAt: '2026-08-20T23:31:05.000Z',
    });
    assert.equal(confirmed.confirmedValidation.findings.filter((finding) => finding.code === 'SV-CFL-001').length, 2);
    assert.equal(confirmed.confirmedValidation.findings.some((finding) => finding.code === 'SV-SRC-001'), false);
    assert.equal(confirmed.confirmedValidation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.equal(repo.listByKind('SemanticFreezeRecord').length, 0);
  }));
});

test('I7C-06 textual Wednesday wait is preserved for review but cannot become timer semantics without a wait kind/timezone/expression', async () => {
  await withRuntime(async (repo, byteStore) => provider(waitResponse, async (endpoint) => {
    const resolution = resolveImagePerceptionRuntimeBinding(env(endpoint));
    if (resolution.status !== 'CONFIGURED') throw new Error('provider expected');
    const result = await buildImageBpmnReviewCandidate(repo, byteStore, UNSEEN_PNG, resolution.binding, {
      declaredName: 'unseen-wait.png', initiatedBy: 'reviewer',
      receivedAt: '2026-08-20T23:32:00.000Z', perceivedAt: '2026-08-20T23:32:01.000Z', normalizedAt: '2026-08-20T23:32:02.000Z', assessedAt: '2026-08-20T23:32:03.000Z', projectedAt: '2026-08-20T23:32:04.000Z',
    });
    assert.equal(result.status, 'BPMN_READY_FOR_PROCESS_REVIEW');
    if (result.status !== 'BPMN_READY_FOR_PROCESS_REVIEW') throw new Error('review candidate expected');
    const wait = result.semantic.normalization.processRevision.nodes.find((node) => node.kind === 'WAIT');
    assert.equal(wait?.name, 'On Next Wednesday');
    assert.equal(wait?.details?.waitKind, undefined);
    assert.equal(result.semantic.validation.findings.some((finding) => finding.code === 'SV-EVT-003'), true);
    assert.equal(result.semantic.validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.equal(result.projection.diagnostics.some((diagnostic) => diagnostic.code === 'WAIT_EXECUTION_TIMING_NOT_MATERIALIZED'), true);
    assert.match(result.projection.bpmnRevision.bpmnXml, /intermediateCatchEvent/);
    assert.equal(result.projection.bpmnRevision.bpmnXml.includes('timerEventDefinition'), false);
  }));
});

test('I7C-06 unresolved relation endpoint becomes incomplete relationship evidence, never a fabricated ProcessEdge', async () => {
  await withRuntime(async (repo, byteStore) => provider(unresolvedEndpointResponse, async (endpoint) => {
    const resolution = resolveImagePerceptionRuntimeBinding(env(endpoint));
    if (resolution.status !== 'CONFIGURED') throw new Error('provider expected');
    const result = await buildImageBpmnReviewCandidate(repo, byteStore, UNSEEN_PNG, resolution.binding, {
      declaredName: 'unseen-unresolved-edge.png', initiatedBy: 'reviewer',
      receivedAt: '2026-08-20T23:33:00.000Z', perceivedAt: '2026-08-20T23:33:01.000Z', normalizedAt: '2026-08-20T23:33:02.000Z', assessedAt: '2026-08-20T23:33:03.000Z', projectedAt: '2026-08-20T23:33:04.000Z',
    });
    assert.equal(result.status, 'BPMN_READY_FOR_PROCESS_REVIEW');
    if (result.status !== 'BPMN_READY_FOR_PROCESS_REVIEW') throw new Error('review candidate expected');
    assert.equal(result.semantic.normalization.processRevision.edges.length, 0);
    assert.equal(result.semantic.normalization.processRevision.sourceExtensions.some((extension) => extension.extensionType === 'INCOMPLETE_RELATIONSHIP'), true);
    assert.equal(result.semantic.validation.findings.some((finding) => finding.code === 'SV-CFL-002'), true);
    assert.equal(result.semantic.validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
  }));
});

test('I7C-06 correlation mismatch safe-stops before canonical normalization or BPMN even when response body otherwise looks successful', async () => {
  await withRuntime(async (repo, byteStore) => provider((envelope) => {
    const response = decisionResponse(envelope);
    return { ...response, requestCorrelation: correlation(envelope, { contentSha256: '0'.repeat(64) }) };
  }, async (endpoint) => {
    const resolution = resolveImagePerceptionRuntimeBinding(env(endpoint));
    if (resolution.status !== 'CONFIGURED') throw new Error('provider expected');
    const result = await buildImageBpmnReviewCandidate(repo, byteStore, UNSEEN_PNG, resolution.binding, {
      declaredName: 'unseen-correlation-mismatch.png', initiatedBy: 'reviewer', receivedAt: '2026-08-20T23:34:00.000Z', perceivedAt: '2026-08-20T23:34:01.000Z',
    });
    assert.equal(result.status, 'SAFE_STOP_BEFORE_CANONICAL');
    assert.equal(result.perception.admission.decision, 'SAFE_STOP_PROVIDER_FAILURE');
    assert.equal(repo.listByKind('SourceEvidenceGraph').length, 0);
    assert.equal(repo.listByKind('ProcessRevision').length, 0);
    assert.equal(repo.listByKind('BpmnProcessRevision').length, 0);
  }));
});
