import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  IMAGE_PERCEPTION_RUNTIME_ENV,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';
import { startTalosProcessConfirmationProduct } from '../apps/reference-api/src/workspace-server.ts';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=', 'base64');

async function readJson(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function correlatedProcessResponse(envelope: AsyncImagePerceptionTransportEnvelope) {
  const correlation = {
    schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
    sourceRepresentationId: envelope.sourceRepresentationId,
    contentSha256: envelope.contentSha256,
    coordinateSpace: { ...envelope.coordinateSpace },
  };
  return {
    providerId: 'I7C05_PRODUCT_MODEL',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:product-image-workspace',
    modelVersion: '2026-08-20',
    pipelineVersion: 'talos-product-image-perception-v0.1',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'SUCCEEDED',
    requestCorrelation: correlation,
    anchors: [
      { providerAnchorKey: 'a-start', geometryKind: 'BOX', geometry: { x: .05, y: .3, width: .1, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-task', geometryKind: 'BOX', geometry: { x: .35, y: .25, width: .2, height: .2 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-end', geometryKind: 'BOX', geometry: { x: .8, y: .3, width: .1, height: .1 }, visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-flow-1', geometryKind: 'POLYLINE', geometry: [{ x: .15, y: .35 }, { x: .35, y: .35 }], visibilityState: 'VISIBLE' },
      { providerAnchorKey: 'a-flow-2', geometryKind: 'POLYLINE', geometry: [{ x: .55, y: .35 }, { x: .8, y: .35 }], visibilityState: 'VISIBLE' },
    ],
    observations: [
      { providerObservationKey: 'o-start', anchorKey: 'a-start', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Start', confidence: .95 },
      { providerObservationKey: 'o-task', anchorKey: 'a-task', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Review request', confidence: .94 },
      { providerObservationKey: 'o-end', anchorKey: 'a-end', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Complete', confidence: .95 },
      { providerObservationKey: 'o-flow-1', anchorKey: 'a-flow-1', observationKind: 'CONNECTOR_STROKE', confidence: .92 },
      { providerObservationKey: 'o-flow-2', anchorKey: 'a-flow-2', observationKind: 'CONNECTOR_STROKE', confidence: .92 },
    ],
    occurrenceCandidates: [
      { providerOccurrenceKey: 'start', anchorKeys: ['a-start'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-start', candidateSemanticType: 'EVENT', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-start'], confidence: .94 },
      { providerOccurrenceKey: 'task', anchorKeys: ['a-task'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-task', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-task'], confidence: .93 },
      { providerOccurrenceKey: 'end', anchorKeys: ['a-end'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-end', candidateSemanticType: 'END', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-end'], confidence: .94 },
    ],
    alternativeSets: [
      { providerAlternativeSetKey: 'role-1', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'control-1', value: 'CONTROL_FLOW', confidence: .94, anchorKeys: ['a-flow-1'], supportingObservationKeys: ['o-flow-1'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'control-1', modelPreferenceConfidence: .94 },
      { providerAlternativeSetKey: 'role-2', propertyPath: 'relationshipRole', alternatives: [{ providerAlternativeKey: 'control-2', value: 'CONTROL_FLOW', confidence: .94, anchorKeys: ['a-flow-2'], supportingObservationKeys: ['o-flow-2'] }], exclusivityMode: 'MUTUALLY_EXCLUSIVE', modelPreferredAlternativeKey: 'control-2', modelPreferenceConfidence: .94 },
    ],
    relationCandidates: [
      { providerRelationKey: 'flow-1', strokeObservationKeys: ['o-flow-1'], anchorKeys: ['a-flow-1'], existenceConfidence: .94, sourceEndpointCandidates: [{ occurrenceCandidateKey: 'start', anchorKey: 'a-start', endpointState: 'SET_CANDIDATE', confidence: .95 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'task', anchorKey: 'a-task', endpointState: 'SET_CANDIDATE', confidence: .95 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .95 }], roleAlternativeSetKey: 'role-1' },
      { providerRelationKey: 'flow-2', strokeObservationKeys: ['o-flow-2'], anchorKeys: ['a-flow-2'], existenceConfidence: .94, sourceEndpointCandidates: [{ occurrenceCandidateKey: 'task', anchorKey: 'a-task', endpointState: 'SET_CANDIDATE', confidence: .95 }], targetEndpointCandidates: [{ occurrenceCandidateKey: 'end', anchorKey: 'a-end', endpointState: 'SET_CANDIDATE', confidence: .95 }], directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: .95 }], roleAlternativeSetKey: 'role-2' },
    ],
    diagnostics: [],
  };
}

async function startProvider(): Promise<{ endpoint: string; close(): Promise<void> }> {
  const server = createServer(async (req, res) => {
    const envelope = await readJson(req) as AsyncImagePerceptionTransportEnvelope;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(correlatedProcessResponse(envelope)));
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('provider did not bind');
  return {
    endpoint: `http://127.0.0.1:${address.port}/vision`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function runtimeEnv(endpoint: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'I7C05_PRODUCT_MODEL',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'model:product-image-workspace',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-20',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-product-image-perception-v0.1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
    [IMAGE_PERCEPTION_RUNTIME_ENV.bearerToken]: 'i7c05-secret-must-not-leak',
  };
}

async function post(baseUrl: string, route: string, body: unknown) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { response, payload };
}

test('I7C-05 product HTTP surface runs image upload → BPMN edit → process confirmation → independent automation-design freeze', async () => {
  const provider = await startProvider();
  const app = await startTalosProcessConfirmationProduct({
    port: 0,
    imagePerceptionEnv: runtimeEnv(provider.endpoint),
  });
  try {
    const statusResponse = await fetch(`${app.baseUrl}/api/workspace/status`);
    assert.equal(statusResponse.status, 200);
    const status: any = await statusResponse.json();
    assert.equal(status.image.liveVisionInterpretation, true);
    assert.equal(status.image.correlatedProviderResponsesRequired, true);
    assert.equal(status.image.provider.providerId, 'I7C05_PRODUCT_MODEL');
    assert.equal(status.image.provider.authConfigured, true);
    assert.equal(JSON.stringify(status).includes('i7c05-secret-must-not-leak'), false);

    const uploaded = await post(app.baseUrl, '/api/input/image', {
      fileName: 'unregistered-process.png',
      imageBase64: PNG.toString('base64'),
      initiatedBy: 'browser-user',
    });
    assert.equal(uploaded.response.status, 201);
    assert.equal(uploaded.payload.status, 'BPMN_READY_FOR_PROCESS_REVIEW');
    assert.equal(uploaded.payload.perceptionDecision, 'ADMITTED_FOR_REVIEW');
    assert.equal(uploaded.payload.revision.sourceRoute, 'IMAGE_INTERPRETATION');
    assert.equal(uploaded.payload.revision.state, 'DRAFT');
    assert.equal(uploaded.payload.revision.sourceRepresentationRefs.includes(uploaded.payload.sourceRepresentationId), true);
    assert.match(uploaded.payload.revision.bpmnXml, /isExecutable="false"/);
    assert.equal(uploaded.payload.reconciliation.status, 'RECONCILED');
    assert.equal(uploaded.payload.reconciliation.processRevision.semanticClaims.every((claim: any) => claim.truthClass === 'INFERRED'), true);
    assert.equal(uploaded.payload.reconciliation.validation.assessment.executionReadiness, 'NEEDS_CONFIRMATION');
    assert.equal(uploaded.payload.reconciliation.validation.findings.some((finding: any) => finding.code === 'SV-SRC-001'), true);

    const editedXml = String(uploaded.payload.revision.bpmnXml).replace('Review request', 'Review request carefully');
    assert.notEqual(editedXml, uploaded.payload.revision.bpmnXml);
    const edited = await post(app.baseUrl, '/api/bpmn/edit', {
      baseRevisionId: uploaded.payload.revision.id,
      bpmnXml: editedXml,
      editMode: 'XML_EDIT',
      editedBy: 'browser-user',
    });
    assert.equal(edited.response.status, 201);
    assert.equal(edited.payload.changeClass, 'SEMANTIC');
    assert.equal(edited.payload.revision.sourceRoute, 'IMAGE_INTERPRETATION');
    assert.equal(edited.payload.revision.canonicalAlignmentStatus, 'ALIGNED_TO_CANONICAL');
    assert.equal(edited.payload.reconciliation.status, 'RECONCILED');
    assert.equal(edited.payload.reconciliation.processRevision.nodes.some((node: any) => node.name === 'Review request carefully'), true);
    assert.equal(edited.payload.reconciliation.processRevision.semanticClaims.every((claim: any) => claim.truthClass === 'INFERRED'), true);
    assert.equal(edited.payload.reconciliation.validation.assessment.executionReadiness, 'NEEDS_CONFIRMATION');

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: edited.payload.revision.id,
      canonicalProcessRevisionId: edited.payload.revision.canonicalProcessRevisionId,
      confirmedBy: 'browser-user',
      authorityRef: 'ui:business-process-confirmation',
      rationale: 'This BPMN is my business process.',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.payload.revision.state, 'CONFIRMED');
    assert.equal(confirmed.payload.revision.sourceRoute, 'IMAGE_INTERPRETATION');
    assert.equal(confirmed.payload.reconciliation.processRevision.derivationKind, 'HUMAN_CONFIRMATION');
    assert.equal(confirmed.payload.reconciliation.processRevision.semanticClaims.every((claim: any) => claim.truthClass === 'CONFIRMED'), true);
    assert.equal(confirmed.payload.reconciliation.validation.findings.some((finding: any) => finding.code === 'SV-SRC-001'), false);
    assert.equal(confirmed.payload.reconciliation.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
    assert.equal(confirmed.payload.canonicalConfirmation.confirmedClaimCount > 0, true);

    const approved = await post(app.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId: confirmed.payload.revision.id,
      confirmationId: confirmed.payload.confirmation.id,
      approvedBy: 'browser-user',
      authorityRef: 'ui:automation-design-approval',
    });
    assert.equal(approved.response.status, 201);
    assert.equal(approved.payload.handoff.result, 'FROZEN');
    assert.equal(Boolean(approved.payload.freezeRecord), true);
    assert.equal(approved.payload.deploymentAuthorized, false);
    assert.equal(approved.payload.executionAuthorized, false);
  } finally {
    await app.close();
    await provider.close();
  }
});
