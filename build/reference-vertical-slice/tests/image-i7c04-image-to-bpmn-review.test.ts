import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildImageBpmnReviewCandidate } from '../packages/application/src/index.ts';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  IMAGE_PERCEPTION_RUNTIME_ENV,
  LocalImageByteStore,
  resolveImagePerceptionRuntimeBinding,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=', 'base64');

async function readJson(req: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function withRuntime<T>(fn: (repo: SqliteDocumentStore, bytes: LocalImageByteStore) => Promise<T>) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7c04-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'bytes'));
  try { return await fn(repo, bytes); }
  finally { repo.close(); rmSync(dir, { recursive: true, force: true }); }
}

function env(endpoint: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'I7C04_HTTP_MODEL',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'model:image-to-bpmn-review',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-20',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-process-diagram-perception-v0.4',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
  };
}

function correlation(envelope: AsyncImagePerceptionTransportEnvelope) {
  return {
    schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
    sourceRepresentationId: envelope.sourceRepresentationId,
    contentSha256: envelope.contentSha256,
    coordinateSpace: { ...envelope.coordinateSpace },
  };
}

function processResponse(envelope: AsyncImagePerceptionTransportEnvelope) {
  return {
    providerId: 'I7C04_HTTP_MODEL',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:image-to-bpmn-review',
    modelVersion: '2026-08-20',
    pipelineVersion: 'talos-process-diagram-perception-v0.4',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'SUCCEEDED',
    requestCorrelation: correlation(envelope),
    anchors: [
      { providerAnchorKey: 'a-start', geometryKind: 'BOX', geometry: { x: .05, y: .3, width: .1, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-task', geometryKind: 'BOX', geometry: { x: .35, y: .25, width: .2, height: .2 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-end', geometryKind: 'BOX', geometry: { x: .8, y: .3, width: .1, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-flow-1', geometryKind: 'POLYLINE', geometry: [{ x: .15, y: .35 }, { x: .35, y: .35 }], visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-flow-2', geometryKind: 'POLYLINE', geometry: [{ x: .55, y: .35 }, { x: .8, y: .35 }], visibilityState: 'VISIBLE' },
    ],
    observations: [
      { providerObservationKey: 'o-start', anchorKey: 'a-start', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Start', confidence: .92 },
      { providerObservationKey: 'o-task', anchorKey: 'a-task', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Receive request', confidence: .91 },
      { providerObservationKey: 'o-end', anchorKey: 'a-end', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Complete', confidence: .93 },
      { providerObservationKey: 'o-flow-1', anchorKey: 'a-flow-1', observationKind: 'CONNECTOR_STROKE', confidence: .86 },
      { providerObservationKey: 'o-flow-2', anchorKey: 'a-flow-2', observationKind: 'CONNECTOR_STROKE', confidence: .87 },
    ],
    occurrenceCandidates: [
      { providerOccurrenceKey: 'start', anchorKeys: ['a-start'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-start', candidateSemanticType: 'EVENT', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-start'], confidence: .9 },
      { providerOccurrenceKey: 'task', anchorKeys: ['a-task'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-task', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-task'], confidence: .89 },
      { providerOccurrenceKey: 'end', anchorKeys: ['a-end'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-end', candidateSemanticType: 'END', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-end'], confidence: .91 },
    ],
    alternativeSets: [
      { providerAlternativeSetKey: 'role-1', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'control-1', value: 'CONTROL_FLOW', confidence: .9, anchorKeys: ['a-flow-1'], supportingObservationKeys: ['o-flow-1'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'control-1', modelPreferenceConfidence: .9 },
      { providerAlternativeSetKey: 'role-2', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'control-2', value: 'CONTROL_FLOW', confidence: .9, anchorKeys: ['a-flow-2'], supportingObservationKeys: ['o-flow-2'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'control-2', modelPreferenceConfidence: .9 },
    ],
    relationCandidates: [
      { providerRelationKey: 'flow-1', strokeObservationKeys: ['o-flow-1'], anchorKeys: ['a-flow-1'], existenceConfidence: .9, sourceEndpointCandidates: [{ occurrenceCandidateKey: 'start', anchorKey: 'a-start', endpointState: 'SET_CANDIDATE', confidence: .91 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'task', anchorKey: 'a-task', endpointState: 'SET_CANDIDATE', confidence: .91 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .92 }], roleAlternativeSetKey: 'role-1' },
      { providerRelationKey: 'flow-2', strokeObservationKeys: ['o-flow-2'], anchorKeys: ['a-flow-2'], existenceConfidence: .9, sourceEndpointCandidates: [{ occurrenceCandidateKey: 'task', anchorKey: 'a-task', endpointState: 'SET_CANDIDATE', confidence: .91 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'end', anchorKey: 'a-end', endpointState: 'SET_CANDIDATE', confidence: .91 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .92 }], roleAlternativeSetKey: 'role-2' },
    ],
    diagnostics: [],
  };
}

function explicitDurationWaitResponse(envelope: AsyncImagePerceptionTransportEnvelope) {
  const response = processResponse(envelope);
  response.observations = response.observations.map((item: any) => item.providerObservationKey === 'o-task'
    ? { ...item, observedValue: 'Dejar actuar 5 minutos' }
    : item);
  return response;
}

function noResultResponse(envelope: AsyncImagePerceptionTransportEnvelope) {
  return {
    providerId: 'I7C04_HTTP_MODEL', providerVersion: '1.0.0', providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:image-to-bpmn-review', modelVersion: '2026-08-20', pipelineVersion: 'talos-process-diagram-perception-v0.4',
    evidenceMode: 'MODEL_INFERENCE', status: 'NO_RESULT', requestCorrelation: correlation(envelope),
    anchors: [], observations: [], occurrenceCandidates: [], alternativeSets: [], relationCandidates: [],
    diagnostics: [{ code: 'NO_PROCESS_EVIDENCE', description: 'No business-process evidence could be established.' }],
  };
}

async function provider<T>(responseFactory: (envelope: AsyncImagePerceptionTransportEnvelope) => any, fn: (endpoint: string) => Promise<T>): Promise<T> {
  const server = createServer(async (req, res) => {
    const envelope = await readJson(req) as AsyncImagePerceptionTransportEnvelope;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(responseFactory(envelope)));
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('provider failed to bind');
  try { return await fn(`http://127.0.0.1:${address.port}/vision`); }
  finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
}

test('I7C-04 arbitrary image evidence normalizes, validates and projects into a persisted non-executable DRAFT BPMN review revision', async () => {
  await withRuntime(async (repo, byteStore) => {
    await provider(processResponse, async (endpoint) => {
      const resolution = resolveImagePerceptionRuntimeBinding(env(endpoint));
      assert.equal(resolution.status, 'CONFIGURED');
      if (resolution.status !== 'CONFIGURED') throw new Error('expected provider');
      const result = await buildImageBpmnReviewCandidate(repo, byteStore, PNG, resolution.binding, {
        declaredName: 'arbitrary-order-flow.png', initiatedBy: 'i7c04-test-user',
        receivedAt: '2026-08-20T22:00:00.000Z', perceivedAt: '2026-08-20T22:00:01.000Z',
        normalizedAt: '2026-08-20T22:00:02.000Z', assessedAt: '2026-08-20T22:00:03.000Z', projectedAt: '2026-08-20T22:00:04.000Z',
      });

      assert.equal(result.status, 'BPMN_READY_FOR_PROCESS_REVIEW');
      if (result.status !== 'BPMN_READY_FOR_PROCESS_REVIEW') throw new Error('expected BPMN review candidate');
      const process = result.semantic.normalization.processRevision;
      assert.deepEqual(process.nodes.map((n) => n.kind).sort(), ['ACTION','END','EVENT']);
      assert.equal(process.nodes.every((node) => node.truthClass === 'INFERRED'), true);
      assert.equal(process.edges.length, 2);
      assert.equal(process.edges.every((edge) => edge.kind === 'SEQUENCE' && edge.truthClass === 'INFERRED'), true);
      assert.equal(process.semanticClaims.every((claim) => claim.truthClass === 'INFERRED'), true);
      assert.equal(process.provenanceLinks.every((link) => link.truthClass === 'INFERRED' && link.extractionMethod === 'VISUAL_PERCEPTION'), true);
      assert.equal(result.semantic.normalization.evidenceFragments.every((fragment) => fragment.fragmentKind === 'IMAGE_REGION' || fragment.fragmentKind === 'EDGE_REGION'), true);
      assert.equal(result.semantic.validation.assessment.processRevisionId, process.id);
      assert.notEqual(result.semantic.validation.assessment.executionReadiness, 'EXECUTABLE');

      const projection = result.projection;
      assert.equal(projection.sourceRoute, 'IMAGE_INTERPRETATION');
      assert.equal(projection.processRevisionId, process.id);
      assert.equal(projection.bpmnRevision.state, 'DRAFT');
      assert.equal(projection.bpmnRevision.canonicalProcessRevisionId, process.id);
      assert.equal(projection.bpmnRevision.sourceRoute, 'IMAGE_INTERPRETATION');
      assert.deepEqual(projection.bpmnRevision.sourceArtifactRefs, [result.intake.artifact.id]);
      assert.deepEqual(projection.bpmnRevision.sourceRepresentationRefs, [result.intake.representation.id]);
      assert.match(projection.bpmnRevision.bpmnXml, /isExecutable="false"/);
      assert.match(projection.bpmnRevision.bpmnXml, /bpmn:startEvent/);
      assert.match(projection.bpmnRevision.bpmnXml, /bpmn:task/);
      assert.match(projection.bpmnRevision.bpmnXml, /bpmn:endEvent/);
      assert.equal(projection.unprojectableCanonicalRefs.length, 0);
      assert.equal(repo.listByKind('ProcessRevision').length, 1);
      assert.equal(repo.listByKind('BpmnProcessRevision').length, 1);
      assert.equal(repo.listByKind('BusinessProcessConfirmationRecord').length, 0);
      assert.equal(repo.listByKind('SemanticFreezeRecord').length, 0);
      assert.equal(result.automaticConfirmationAuthorized, false);
      assert.equal(result.automaticFreezeAuthorized, false);
      assert.equal(result.automaticExecutionAuthorized, false);
    });
  });
});

test('I7C-04 explicit duration literal upgrades an ACTION candidate to a canonical WAIT without asking the user again', async () => {
  await withRuntime(async (repo, byteStore) => {
    await provider(explicitDurationWaitResponse, async (endpoint) => {
      const resolution = resolveImagePerceptionRuntimeBinding(env(endpoint));
      assert.equal(resolution.status, 'CONFIGURED');
      if (resolution.status !== 'CONFIGURED') throw new Error('expected provider');
      const result = await buildImageBpmnReviewCandidate(repo, byteStore, PNG, resolution.binding, {
        declaredName: 'explicit-wait.png', initiatedBy: 'i7c04-test-user',
        receivedAt: '2026-08-20T22:05:00.000Z', perceivedAt: '2026-08-20T22:05:01.000Z',
        normalizedAt: '2026-08-20T22:05:02.000Z', assessedAt: '2026-08-20T22:05:03.000Z', projectedAt: '2026-08-20T22:05:04.000Z',
      });
      assert.equal(result.status, 'BPMN_READY_FOR_PROCESS_REVIEW');
      if (result.status !== 'BPMN_READY_FOR_PROCESS_REVIEW') throw new Error('expected BPMN review candidate');
      const wait = result.semantic.normalization.processRevision.nodes.find((node) => node.name === 'Dejar actuar 5 minutos');
      assert.ok(wait);
      assert.equal(wait.kind, 'WAIT');
      assert.equal(wait.details?.waitKind, 'DURATION');
      assert.equal(wait.details?.expression, '5 minutes');
      assert.equal(wait.details?.sourceTemporalLiteral, 'Dejar actuar 5 minutos');
      assert.equal(result.semantic.validation.findings.some((finding) => finding.code === 'SV-EVT-003' && finding.targetRefs.includes(wait.id)), false);
      assert.equal(result.semantic.validation.findings.some((finding) => finding.code === 'SV-EVT-002' && finding.targetRefs.includes(wait.id)), false);
      assert.match(result.projection.bpmnRevision.bpmnXml, /bpmn:intermediateCatchEvent|bpmn:task/);
    });
  });
});

test('I7C-04 provider NO_RESULT safe-stops before canonical normalization and BPMN projection', async () => {
  await withRuntime(async (repo, byteStore) => {
    await provider(noResultResponse, async (endpoint) => {
      const resolution = resolveImagePerceptionRuntimeBinding(env(endpoint));
      assert.equal(resolution.status, 'CONFIGURED');
      if (resolution.status !== 'CONFIGURED') throw new Error('expected provider');
      const result = await buildImageBpmnReviewCandidate(repo, byteStore, PNG, resolution.binding, {
        declaredName: 'no-result.png', initiatedBy: 'i7c04-test-user', receivedAt: '2026-08-20T22:10:00.000Z', perceivedAt: '2026-08-20T22:10:01.000Z',
      });
      assert.equal(result.status, 'SAFE_STOP_BEFORE_CANONICAL');
      assert.equal(result.perception.admission.decision, 'SAFE_STOP_NO_RESULT');
      assert.equal(repo.listByKind('ProcessRevision').length, 0);
      assert.equal(repo.listByKind('BpmnProcessRevision').length, 0);
      assert.equal(repo.listByKind('BusinessProcessConfirmationRecord').length, 0);
      assert.equal(repo.listByKind('SemanticFreezeRecord').length, 0);
    });
  });
});
