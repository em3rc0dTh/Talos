import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  IMAGE_PERCEPTION_RUNTIME_ENV,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=',
  'base64',
);

async function readJson(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function correlatedProcessResponse(envelope: AsyncImagePerceptionTransportEnvelope) {
  return {
    providerId: 'R1_03_REVIEW_MODEL',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:r1-03-process-review',
    modelVersion: '2026-08-25',
    pipelineVersion: 'talos-r1-03-review-v0.1',
    evidenceMode: 'MODEL_INFERENCE',
    status: 'SUCCEEDED',
    requestCorrelation: {
      schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
      sourceRepresentationId: envelope.sourceRepresentationId,
      contentSha256: envelope.contentSha256,
      coordinateSpace: { ...envelope.coordinateSpace },
    },
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

async function startModelProvider(): Promise<{ endpoint: string; close(): Promise<void> }> {
  const server = createServer(async (req, res) => {
    const envelope = await readJson(req) as AsyncImagePerceptionTransportEnvelope;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(correlatedProcessResponse(envelope)));
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('R1-03 model provider did not bind');
  return {
    endpoint: `http://127.0.0.1:${address.port}/vision`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function configuredEnv(endpoint: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'R1_03_REVIEW_MODEL',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'model:r1-03-process-review',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-25',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-r1-03-review-v0.1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
  };
}

test('R1-03 image-derived process can be reviewed, corrected append-only, revalidated, and stale authority is closed', async () => {
  const provider = await startModelProvider();
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-03-review-'));
  const app = await startTalosOneApp({
    port: 0,
    runtimeDir,
    imagePerceptionEnv: configuredEnv(provider.endpoint),
  });

  try {
    const intakeResponse = await fetch(`${app.baseUrl}/api/input/image`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageBase64: tinyPng.toString('base64'),
        fileName: 'r1-03-real-process.png',
        initiatedBy: 'r1-03-user',
      }),
    });
    assert.equal(intakeResponse.status, 201);
    const intake = await intakeResponse.json() as any;
    assert.equal(intake.status, 'BPMN_READY_FOR_PROCESS_REVIEW');
    assert.equal(intake.reconciliation.processRevision.semanticClaims.every((claim: any) => claim.truthClass === 'INFERRED'), true);
    assert.equal(intake.reconciliation.validation.assessment.executionReadiness, 'NEEDS_CONFIRMATION');

    const originalRevisionId = intake.revision.id as string;
    const originalCanonicalId = intake.reconciliation.processRevision.id as string;
    const originalSourceRepresentationId = intake.sourceRepresentationId as string;
    const originalSourceSha = intake.sourceContentSha256 as string;

    const reviewResponse = await fetch(`${app.baseUrl}/api/process-review?revisionId=${encodeURIComponent(originalRevisionId)}`);
    assert.equal(reviewResponse.status, 200);
    const review = await reviewResponse.json() as any;
    assert.equal(review.status, 'PROCESS_REVIEW_REQUIRED');
    assert.equal(review.state, 'ACTIVE');
    assert.equal(review.reconciliation.processRevision.id, originalCanonicalId);
    assert.equal(review.review.sourceRepresentationRefs.includes(originalSourceRepresentationId), true);
    assert.equal(review.requiresBusinessProcessConfirmation, true);
    assert.equal(review.automaticAutomationDesignAuthorized, false);
    assert.equal(review.automaticExecutionAuthorized, false);

    const correctedXml = String(intake.revision.bpmnXml).replace('name="Review request"', 'name="Review customer request"');
    assert.notEqual(correctedXml, intake.revision.bpmnXml, 'test must make a semantic BPMN correction');

    const editResponse = await fetch(`${app.baseUrl}/api/bpmn/edit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        baseRevisionId: originalRevisionId,
        bpmnXml: correctedXml,
        editMode: 'XML_EDIT',
        editedBy: 'r1-03-user',
      }),
    });
    assert.equal(editResponse.status, 201);
    const edited = await editResponse.json() as any;
    assert.equal(edited.status, 'CORRECTED_PROCESS_REVIEW_REQUIRED');
    assert.equal(edited.changeClass, 'SEMANTIC');
    assert.notEqual(edited.revision.id, originalRevisionId);
    assert.notEqual(edited.reconciliation.processRevision.id, originalCanonicalId);
    assert.equal(edited.reconciliation.processRevision.nodes.some((node: any) => node.name === 'Review customer request'), true);
    assert.equal(edited.reconciliation.processRevision.semanticClaims.every((claim: any) => claim.truthClass === 'INFERRED'), true);
    assert.equal(edited.reconciliation.validation.assessment.executionReadiness, 'NEEDS_CONFIRMATION');
    assert.equal(edited.revision.sourceRepresentationRefs.includes(originalSourceRepresentationId), true);
    assert.equal(edited.sourceTruthChanged, false);
    assert.equal(edited.requiresProcessReconfirmation, true);
    assert.equal(edited.automaticConfirmationAuthorized, false);
    assert.equal(edited.automaticFreezeAuthorized, false);
    assert.equal(edited.automaticAutomationDesignAuthorized, false);
    assert.equal(edited.automaticDeploymentAuthorized, false);
    assert.equal(edited.automaticExecutionAuthorized, false);

    const oldReviewResponse = await fetch(`${app.baseUrl}/api/process-review?revisionId=${encodeURIComponent(originalRevisionId)}`);
    assert.equal(oldReviewResponse.status, 200);
    const oldReview = await oldReviewResponse.json() as any;
    assert.equal(oldReview.state, 'SUPERSEDED');
    assert.deepEqual(oldReview.allowedReviewActions, ['INSPECT_EVIDENCE']);

    const staleEditResponse = await fetch(`${app.baseUrl}/api/bpmn/edit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        baseRevisionId: originalRevisionId,
        bpmnXml: correctedXml,
        editMode: 'XML_EDIT',
        editedBy: 'r1-03-user',
      }),
    });
    assert.equal(staleEditResponse.status, 409);

    const staleConfirmResponse = await fetch(`${app.baseUrl}/api/bpmn/confirm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        revisionId: originalRevisionId,
        canonicalProcessRevisionId: originalCanonicalId,
        confirmedBy: 'r1-03-user',
        authorityRef: 'authority:r1-03-stale-confirmation-must-fail',
      }),
    });
    assert.equal(staleConfirmResponse.status, 409, 'retired binding must prevent stale confirmation');

    const currentReviewResponse = await fetch(`${app.baseUrl}/api/process-review?revisionId=${encodeURIComponent(edited.revision.id)}`);
    assert.equal(currentReviewResponse.status, 200);
    const currentReview = await currentReviewResponse.json() as any;
    assert.equal(currentReview.state, 'ACTIVE');
    assert.equal(currentReview.reconciliation.processRevision.id, edited.reconciliation.processRevision.id);
    assert.equal(currentReview.review.sourceRepresentationRefs.includes(originalSourceRepresentationId), true);

    // The source identity captured before review/correction is evidence, not mutable process state.
    assert.equal(intake.sourceContentSha256, originalSourceSha);
    assert.equal(intake.sourceRepresentationId, originalSourceRepresentationId);
  } finally {
    await app.close();
    await provider.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
