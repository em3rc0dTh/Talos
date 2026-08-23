import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
  IMAGE_PERCEPTION_RUNTIME_ENV,
  type AsyncImagePerceptionTransportEnvelope,
} from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';

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
    providerId: 'I9_02_ONE_APP_MODEL',
    providerVersion: '1.0.0',
    providerClass: 'MODEL_PROVIDER',
    modelRef: 'model:i9-02-one-app-image',
    modelVersion: '2026-08-23',
    pipelineVersion: 'talos-i9-02-one-app-image-v0.1',
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
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('I9-02 provider did not bind');
  return {
    endpoint: `http://127.0.0.1:${address.port}/vision`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

function runtimeEnv(endpoint: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: endpoint,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'I9_02_ONE_APP_MODEL',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'model:i9-02-one-app-image',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-23',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-i9-02-one-app-image-v0.1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
    [IMAGE_PERCEPTION_RUNTIME_ENV.bearerToken]: 'i9-02-secret-must-not-leak',
  };
}

async function post(baseUrl: string, pathname: string, payload: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json() as any;
  return { response, body };
}

test('I9-02 one app runs image perception through confirmed canonical truth and the same I8/I9 Temporal-design authority chain', async () => {
  const provider = await startProvider();
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-i9-02-one-app-image-'));
  const app = await startTalosOneApp({
    port: 0,
    runtimeDir,
    imagePerceptionEnv: runtimeEnv(provider.endpoint),
  });
  try {
    const statusResponse = await fetch(`${app.baseUrl}/api/status`);
    assert.equal(statusResponse.status, 200);
    const status = await statusResponse.json() as any;
    assert.equal(status.releaseGate, 'I9-02_ONE_APP_IMAGE_BPMN_E2E');
    assert.deepEqual(status.inputRoutes, ['IMAGE_PNG', 'NATIVE_BPMN']);
    assert.equal(status.imageInputIntegratedIntoOneApp, true);
    assert.equal(status.image.liveVisionInterpretation, true);
    assert.equal(status.image.provider.providerId, 'I9_02_ONE_APP_MODEL');
    assert.equal(status.image.provider.authConfigured, true);
    assert.equal(JSON.stringify(status).includes('i9-02-secret-must-not-leak'), false);

    const uploaded = await post(app.baseUrl, '/api/input/image', {
      fileName: 'i9-02-process.png',
      imageBase64: PNG.toString('base64'),
      initiatedBy: 'i9-image-user',
    });
    assert.equal(uploaded.response.status, 201);
    assert.equal(uploaded.body.status, 'BPMN_READY_FOR_PROCESS_REVIEW');
    assert.equal(uploaded.body.perceptionDecision, 'ADMITTED_FOR_REVIEW');
    assert.equal(uploaded.body.revision.sourceRoute, 'IMAGE_INTERPRETATION');
    assert.equal(uploaded.body.revision.state, 'DRAFT');
    assert.equal(uploaded.body.reconciliation.status, 'RECONCILED');
    assert.equal(uploaded.body.reconciliation.processRevision.semanticClaims.every((claim: any) => claim.truthClass === 'INFERRED'), true);
    assert.equal(uploaded.body.reconciliation.validation.assessment.executionReadiness, 'NEEDS_CONFIRMATION');
    assert.equal(uploaded.body.automaticConfirmationAuthorized, false);
    assert.equal(uploaded.body.automaticFreezeAuthorized, false);
    assert.equal(uploaded.body.automaticExecutionAuthorized, false);

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: uploaded.body.revision.id,
      canonicalProcessRevisionId: uploaded.body.revision.canonicalProcessRevisionId,
      confirmedBy: 'i9-image-user',
      authorityRef: 'authority:i9-image-process-owner',
      rationale: 'This interpreted BPMN is the business process I intend Talos to automate.',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.revision.state, 'CONFIRMED');
    assert.equal(confirmed.body.revision.sourceRoute, 'IMAGE_INTERPRETATION');
    assert.equal(confirmed.body.reconciliation.processRevision.derivationKind, 'HUMAN_CONFIRMATION');
    assert.equal(confirmed.body.reconciliation.processRevision.semanticClaims.every((claim: any) => claim.truthClass === 'CONFIRMED'), true);
    assert.equal(confirmed.body.reconciliation.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
    assert.equal(confirmed.body.canonicalConfirmation.confirmedClaimCount > 0, true);
    assert.equal(confirmed.body.automaticAutomationDesignAuthorized, false);

    const frozen = await post(app.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId: confirmed.body.revision.id,
      confirmationId: confirmed.body.confirmation.id,
      approvedBy: 'i9-image-user',
      authorityRef: 'authority:i9-image-automation-design-freeze',
    });
    assert.equal(frozen.response.status, 201);
    assert.equal(frozen.body.handoff.result, 'FROZEN');
    assert.equal(frozen.body.automationDesignOpened, true);
    assert.equal(frozen.body.automationDesign.workspace.createsBinding, false);
    assert.equal(frozen.body.capabilitySelectionCreated, false);

    const workspace = frozen.body.automationDesign.workspace;
    const selections = workspace.requirements.map((requirement: any, index: number) => ({
      source: 'EXPLICIT_OFFERING',
      requirementRef: requirement.capabilityRequirementRef,
      family: 'SYSTEM_OPERATION',
      offeringCanonicalName: `I9 Image Operation ${index + 1}`,
      offeringLifecycleStatus: 'TEST_ONLY',
      implementationKind: 'INTERNAL_SERVICE',
      implementationRef: `i9:image-operation:${index + 1}`,
      decidedBy: 'i9-image-automation-designer',
      authorityRef: 'authority:i9-image-explicit-capability-selection',
      rationale: 'Explicit capability selection after human confirmation of the image-derived process.',
    }));
    const selected = await post(app.baseUrl, '/api/automation/capability/select', {
      workspaceId: workspace.id,
      selections,
    });
    assert.equal(selected.response.status, 201);
    assert.equal(selected.body.createsCapabilitySelection, true);
    assert.equal(selected.body.createsBinding, true);
    assert.equal(selected.body.temporalMappingAuthorized, false);

    const reviewed = await post(app.baseUrl, '/api/automation/execution-plan/review', {
      workspaceId: workspace.id,
      decisions: {},
    });
    assert.equal(reviewed.response.status, 201);
    assert.equal(reviewed.body.review.state, 'READY_FOR_AUTOMATION_APPROVAL');
    assert.equal(reviewed.body.review.temporalDesignAuthorized, false);

    const approved = await post(app.baseUrl, '/api/automation/approve', {
      reviewId: reviewed.body.review.id,
      approvedBy: 'i9-image-automation-owner',
      authorityRef: 'authority:i9-image-explicit-automation-approval',
      rationale: 'Approve this exact image-derived confirmed ExecutionPlan for Temporal mapping design only.',
    });
    assert.equal(approved.response.status, 201);
    assert.equal(approved.body.temporalDesignAuthorized, true);
    assert.equal(approved.body.deploymentAuthorized, false);
    assert.equal(approved.body.executionAuthorized, false);

    const mapped = await post(app.baseUrl, '/api/automation/temporal-mapping', {
      approvalId: approved.body.id,
      waits: [],
      humans: [],
    });
    assert.equal(mapped.response.status, 201);
    assert.equal(mapped.body.mapping.assessment.readiness, 'READY_FOR_RUNTIME_POLICY_DESIGN');
    assert.equal(mapped.body.runtimePolicyAuthorized, false);
    assert.equal(mapped.body.deploymentAuthorized, false);
    assert.equal(mapped.body.executionAuthorized, false);
  } finally {
    await app.close();
    await provider.close();
  }

  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-one-app.sqlite'));
  try {
    assert.ok(repo.listByKind('SourceArtifact').length > 0);
    assert.ok(repo.listByKind('AdapterResult').length > 0);
    assert.equal(repo.listByKind('BusinessProcessConfirmationRecord').length, 1);
    assert.equal(repo.listByKind('SemanticFreezeRecord').length, 1);
    assert.ok(repo.listByKind('CapabilitySelectionDecision').length > 0);
    assert.ok(repo.listByKind('CapabilityBindingRevision').length > 0);
    assert.equal(repo.listByKind('AutomationExecutionPlanReview').length, 1);
    assert.equal(repo.listByKind('AutomationDesignApprovalRecord').length, 1);
    assert.equal(repo.listByKind('TemporalMappingRevision').length, 1);
    assert.equal(repo.listByKind('RuntimePolicyRevision').length, 0);
    assert.equal(repo.listByKind('DeploymentRevision').length, 0);
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length, 0);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('I9-02 preserves image bytes without inventing interpretation when live vision is not configured', async () => {
  const app = await startTalosOneApp({ port: 0, imagePerceptionEnv: {} });
  try {
    const status = await (await fetch(`${app.baseUrl}/api/status`)).json() as any;
    assert.equal(status.releaseGate, 'I9-01_ONE_APP_NATIVE_BPMN_E2E');
    assert.deepEqual(status.inputRoutes, ['NATIVE_BPMN']);
    assert.equal(status.imageInputIntegratedIntoOneApp, false);
    assert.equal(status.image.liveVisionInterpretation, false);

    const uploaded = await post(app.baseUrl, '/api/input/image', {
      fileName: 'uninterpreted.png',
      imageBase64: PNG.toString('base64'),
      initiatedBy: 'i9-image-user',
    });
    assert.equal(uploaded.response.status, 202);
    assert.equal(uploaded.body.interpretation.status, 'NOT_CONFIGURED');
    assert.equal(uploaded.body.automaticConfirmationAuthorized, false);
    assert.equal(uploaded.body.automaticAutomationDesignAuthorized, false);
  } finally {
    await app.close();
  }
});
