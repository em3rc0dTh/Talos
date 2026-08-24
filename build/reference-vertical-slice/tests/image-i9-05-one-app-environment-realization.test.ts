import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const bpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_I905" targetNamespace="https://talos.local/i9-05">
  <bpmn:process id="Process_I905" name="Environment Realization Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="DoWork" name="Perform work"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="DoWork" />
    <bpmn:sequenceFlow id="F2" sourceRef="DoWork" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

async function post(baseUrl: string, pathname: string, payload: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json() as any;
  return { response, body };
}

async function reachDeploymentDesign(baseUrl: string) {
  const imported = await post(baseUrl, '/api/input/bpmn', {
    fileName: 'i9-05.bpmn',
    bpmnXml: bpmn,
    initiatedBy: 'i9-05-user',
  });
  assert.equal(imported.response.status, 201);

  const confirmed = await post(baseUrl, '/api/bpmn/confirm', {
    revisionId: imported.body.revision.id,
    canonicalProcessRevisionId: imported.body.revision.canonicalProcessRevisionId,
    confirmedBy: 'i9-05-user',
    authorityRef: 'authority:i9-05-process-owner',
    rationale: 'Confirm the exact process before automation design.',
  });
  assert.equal(confirmed.response.status, 201);

  const frozen = await post(baseUrl, '/api/bpmn/automation-design-approval', {
    revisionId: confirmed.body.revision.id,
    confirmationId: confirmed.body.confirmation.id,
    approvedBy: 'i9-05-user',
    authorityRef: 'authority:i9-05-freeze',
  });
  assert.equal(frozen.response.status, 201);
  const workspace = frozen.body.automationDesign.workspace;

  const selections = workspace.requirements.map((requirement: any, index: number) => ({
    source: 'EXPLICIT_OFFERING',
    requirementRef: requirement.capabilityRequirementRef,
    family: 'SYSTEM_OPERATION',
    offeringCanonicalName: `I9-05 Operation ${index + 1}`,
    offeringLifecycleStatus: 'TEST_ONLY',
    implementationKind: 'INTERNAL_SERVICE',
    implementationRef: `i9-05:operation:${index + 1}`,
    decidedBy: 'i9-05-designer',
    authorityRef: 'authority:i9-05-capability-selection',
    rationale: 'Explicit capability selection before environment realization.',
  }));
  const selected = await post(baseUrl, '/api/automation/capability/select', {
    workspaceId: workspace.id,
    selections,
  });
  assert.equal(selected.response.status, 201);

  const reviewed = await post(baseUrl, '/api/automation/execution-plan/review', {
    workspaceId: workspace.id,
    decisions: {},
  });
  assert.equal(reviewed.response.status, 201);

  const approved = await post(baseUrl, '/api/automation/approve', {
    reviewId: reviewed.body.review.id,
    approvedBy: 'i9-05-owner',
    authorityRef: 'authority:i9-05-automation-approval',
    rationale: 'Approve the exact ExecutionPlan for Temporal design only.',
  });
  assert.equal(approved.response.status, 201);

  const mapped = await post(baseUrl, '/api/automation/temporal-mapping', {
    approvalId: approved.body.id,
    waits: [],
    humans: [],
  });
  assert.equal(mapped.response.status, 201);

  const activities = reviewed.body.execution.capabilityUses.map((use: any) => ({
    capabilityUseOccurrenceRef: use.id,
    authorityRef: 'authority:i9-05-runtime-policy',
    decidedBy: 'i9-05-runtime-designer',
    rationale: 'Explicit Activity runtime policy before environment realization.',
    policyBasis: 'REFERENCE_TEST_DESIGN',
    retry: {
      initialIntervalMs: 100,
      backoffCoefficient: 2,
      maximumIntervalMs: 1000,
      maximumAttempts: 3,
      nonRetryableFailureTypes: ['INVALID_REQUEST'],
    },
    timeout: { startToCloseMs: 5000, scheduleToCloseMs: 10000 },
    idempotency: {
      requirement: 'REQUIRED',
      strategyKind: 'IDEMPOTENCY_KEY',
      keyContract: 'sha256(executionId + capabilityUseOccurrenceRef)',
      enforcementRef: 'ONE_APP_EFFECT_LEDGER',
    },
    failureClassifications: [
      { failureType: 'TRANSIENT_FAILURE', retryable: true, businessFailure: false },
      { failureType: 'INVALID_REQUEST', retryable: false, businessFailure: false },
    ],
  }));
  const runtimePolicy = await post(baseUrl, '/api/automation/runtime-policy', {
    approvalId: approved.body.id,
    temporalMappingRevisionId: mapped.body.mapping.revision.id,
    activities,
    workflow: {
      authorityRef: 'authority:i9-05-workflow-policy',
      decidedBy: 'i9-05-runtime-designer',
      rationale: 'Explicitly prevent implicit whole-workflow retries.',
      maximumAttempts: 1,
      policyBasis: 'REFERENCE_TEST_DESIGN',
    },
  });
  assert.equal(runtimePolicy.response.status, 201);

  const deployment = await post(baseUrl, '/api/automation/deployment-design', {
    approvalId: approved.body.id,
    runtimePolicyRevisionId: runtimePolicy.body.runtimePolicy.revision.id,
    environmentKey: 'talos-i9-05-test',
    environmentClass: 'TEST',
    temporalPlatformRef: 'TEMPORAL_LOCAL_TEST',
    desiredNamespaceKey: 'talos-i9-05',
    desiredTaskQueueKey: 'talos-i9-05-queue',
    desiredWorkflowTypeName: 'TalosGenericWorkflow',
    desiredActivityTypeName: 'executeGenericCapability',
    desiredWorkerLogicalName: 'talos-i9-05-worker',
    authorityRef: 'authority:i9-05-deployment-designer',
    decidedBy: 'i9-05-deployment-designer',
    rationale: 'Design the exact local Temporal target before realizing environment evidence.',
  });
  assert.equal(deployment.response.status, 201);
  assert.equal(deployment.body.deploymentDesign.assessment.readiness, 'INCOMPLETE_ENVIRONMENT_REALIZATION');

  return {
    approved: approved.body,
    selected: selected.body,
    deploymentDesign: deployment.body.deploymentDesign,
  };
}

function workerEvidence(actualNamespace: string) {
  const artifactPath = path.resolve(
    process.cwd(),
    'workers/reference-temporal-worker/src/generic-worker-runtime.ts',
  );
  const artifactBytes = readFileSync(artifactPath);
  const packageJson = JSON.parse(readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
  const sdkVersion = packageJson.dependencies['@temporalio/worker'];
  return {
    actualNamespace,
    taskQueue: 'talos-i9-05-queue',
    workflowTypeName: 'TalosGenericWorkflow',
    activityTypeName: 'executeGenericCapability',
    workerLogicalName: 'talos-i9-05-worker',
    executableArtifactRef: 'workers/reference-temporal-worker/src/generic-worker-runtime.ts',
    artifactDigest: createHash('sha256').update(artifactBytes).digest('hex'),
    sdkFamily: 'TEMPORAL_TYPESCRIPT_SDK',
    sdkVersionRef: sdkVersion,
    authorityRef: 'authority:i9-05-environment-realizer',
    realizedBy: 'i9-05-environment-realizer',
  };
}

test('I9-05 realizes exact environment evidence after Deployment Design but creates no deployment attempt or execution authority', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-i9-05-realization-'));
  const app = await startTalosOneApp({ port: 0, runtimeDir, imagePerceptionEnv: {} });
  let temporal: TestWorkflowEnvironment | undefined;
  let expectedBindingRefs: string[] = [];
  try {
    const status = await (await fetch(`${app.baseUrl}/api/status`)).json() as any;
    assert.equal(status.releaseGate, 'I9-01_ONE_APP_NATIVE_BPMN_E2E');
    assert.equal(status.currentAuthorityStage, 'I9-03_EXPLICIT_RUNTIME_POLICY_DESIGN');
    assert.equal(status.latestAuthorityStage, 'I9-04_DEPLOYMENT_DESIGN');
    assert.equal(status.environmentRealizationStage, 'I9-05_ENVIRONMENT_REALIZATION');
    assert.equal(status.authorityChain.includes('ENVIRONMENT_REALIZATION'), true);
    assert.equal(status.automaticDeploymentRealizationAuthorized, false);
    assert.equal(status.automaticDeploymentAttemptAuthorized, false);
    assert.equal(status.deploymentAuthorized, false);
    assert.equal(status.executionAuthorized, false);

    const x = await reachDeploymentDesign(app.baseUrl);
    expectedBindingRefs = x.selected.resolution.bindingRevisions.map((item: any) => item.id).sort();
    assert.ok(expectedBindingRefs.length > 0);

    const stale = await post(app.baseUrl, '/api/automation/environment-realization', {
      approvalId: x.approved.id,
      deploymentRevisionId: 'deployment:wrong-revision',
      ...workerEvidence('talos-i9-05'),
    });
    assert.equal(stale.response.status, 409);
    assert.equal(stale.body.code, 'ONE_APP_AUTHORITY_ORDER_VIOLATION');

    temporal = await TestWorkflowEnvironment.createLocal({
      server: { namespace: 'talos-i9-05' },
    });

    const realized = await post(app.baseUrl, '/api/automation/environment-realization', {
      approvalId: x.approved.id,
      deploymentRevisionId: x.deploymentDesign.revision.id,
      ...workerEvidence(temporal.namespace),
    });
    assert.equal(realized.response.status, 201);

    const deployment = realized.body.deploymentRealization;
    assert.equal(deployment.revision.parentDeploymentRevisionRef, x.deploymentDesign.revision.id);
    assert.equal(deployment.revision.revisionNumber, x.deploymentDesign.revision.revisionNumber + 1);
    assert.equal(deployment.assessment.readiness, 'READY_FOR_DEPLOYMENT_ATTEMPT');
    assert.equal(deployment.namespaceResolution.resolutionState, 'RESOLVED');
    assert.equal(deployment.namespaceResolution.actualNamespaceLocatorRef, `temporal-namespace:${temporal.namespace}`);
    assert.equal(deployment.namingIntent.bindingState, 'REALIZED');
    assert.equal(deployment.requirements.every((item: any) => item.state === 'RESOLVED'), true);
    assert.equal(deployment.environmentRealizations.length, expectedBindingRefs.length);
    assert.deepEqual(
      deployment.environmentRealizations.map((item: any) => item.capabilityBindingRevisionRef).sort(),
      expectedBindingRefs,
    );
    assert.deepEqual(
      [...deployment.revision.environmentBindingRealizationRefs].sort(),
      deployment.environmentRealizations.map((item: any) => item.id).sort(),
    );
    assert.equal(deployment.taskQueueBindings.length, 1);
    assert.equal(deployment.workflowTypeBindings.length, 1);
    assert.ok(deployment.activityTypeBindings.length > 0);
    assert.equal(deployment.workerArtifactBindings.length, 1);
    assert.equal(deployment.workerArtifactBindings[0].sdkVersionRef, '1.22.0');
    assert.deepEqual(deployment.attempts, []);
    assert.deepEqual(deployment.observations, []);
    assert.deepEqual(deployment.workflowExecutions, []);
    assert.equal(realized.body.deploymentAttemptAuthorized, false);
    assert.equal(realized.body.deploymentAuthorized, false);
    assert.equal(realized.body.executionAuthorized, false);

    const duplicate = await post(app.baseUrl, '/api/automation/environment-realization', {
      approvalId: x.approved.id,
      deploymentRevisionId: x.deploymentDesign.revision.id,
      ...workerEvidence(temporal.namespace),
    });
    assert.equal(duplicate.response.status, 409);
  } finally {
    if (temporal) await temporal.teardown().catch(() => undefined);
    await app.close();
  }

  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-one-app.sqlite'));
  try {
    assert.equal(repo.listByKind('DeploymentDefinition').length, 1);
    assert.equal(repo.listByKind('DeploymentRevision').length, 2);
    assert.equal(repo.listByKind('EnvironmentBindingRealization').length, expectedBindingRefs.length);
    assert.equal(repo.listByKind('TaskQueueBinding').length, 1);
    assert.equal(repo.listByKind('WorkflowTypeBinding').length, 1);
    assert.ok(repo.listByKind('ActivityTypeBinding').length > 0);
    assert.equal(repo.listByKind('WorkerArtifactBinding').length, 1);
    assert.equal(repo.listByKind('DeploymentAttempt').length, 0);
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length, 0);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('I9-05 refuses environment realization before an explicit Deployment Design exists', async () => {
  const app = await startTalosOneApp({ port: 0, imagePerceptionEnv: {} });
  try {
    const result = await post(app.baseUrl, '/api/automation/environment-realization', {
      approvalId: 'execution:missing-approval',
      deploymentRevisionId: 'deployment:missing-design',
      ...workerEvidence('talos-i9-05'),
    });
    assert.equal(result.response.status, 409);
    assert.equal(result.body.code, 'ONE_APP_AUTHORITY_ORDER_VIOLATION');
  } finally {
    await app.close();
  }
});
