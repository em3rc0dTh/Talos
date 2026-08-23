import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const bpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_I903" targetNamespace="https://talos.local/i9-03">
  <bpmn:process id="Process_I903" name="Runtime Policy Process" isExecutable="false">
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

async function reachTemporalMapping(baseUrl: string) {
  const imported = await post(baseUrl, '/api/input/bpmn', {
    fileName: 'i9-03.bpmn',
    bpmnXml: bpmn,
    initiatedBy: 'i9-03-user',
  });
  assert.equal(imported.response.status, 201);

  const confirmed = await post(baseUrl, '/api/bpmn/confirm', {
    revisionId: imported.body.revision.id,
    canonicalProcessRevisionId: imported.body.revision.canonicalProcessRevisionId,
    confirmedBy: 'i9-03-user',
    authorityRef: 'authority:i9-03-process-owner',
    rationale: 'Confirm the exact process before automation design.',
  });
  assert.equal(confirmed.response.status, 201);

  const frozen = await post(baseUrl, '/api/bpmn/automation-design-approval', {
    revisionId: confirmed.body.revision.id,
    confirmationId: confirmed.body.confirmation.id,
    approvedBy: 'i9-03-user',
    authorityRef: 'authority:i9-03-freeze',
  });
  assert.equal(frozen.response.status, 201);
  const workspace = frozen.body.automationDesign.workspace;

  const selections = workspace.requirements.map((requirement: any, index: number) => ({
    source: 'EXPLICIT_OFFERING',
    requirementRef: requirement.capabilityRequirementRef,
    family: 'SYSTEM_OPERATION',
    offeringCanonicalName: `I9-03 Operation ${index + 1}`,
    offeringLifecycleStatus: 'TEST_ONLY',
    implementationKind: 'INTERNAL_SERVICE',
    implementationRef: `i9-03:operation:${index + 1}`,
    decidedBy: 'i9-03-designer',
    authorityRef: 'authority:i9-03-capability-selection',
    rationale: 'Explicit capability selection; no implementation is inferred from the BPMN label.',
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
  assert.equal(reviewed.body.review.state, 'READY_FOR_AUTOMATION_APPROVAL');

  const approved = await post(baseUrl, '/api/automation/approve', {
    reviewId: reviewed.body.review.id,
    approvedBy: 'i9-03-owner',
    authorityRef: 'authority:i9-03-automation-approval',
    rationale: 'Approve this exact ExecutionPlan for Temporal design only.',
  });
  assert.equal(approved.response.status, 201);

  const mapped = await post(baseUrl, '/api/automation/temporal-mapping', {
    approvalId: approved.body.id,
    waits: [],
    humans: [],
  });
  assert.equal(mapped.response.status, 201);
  assert.equal(mapped.body.mapping.assessment.readiness, 'READY_FOR_RUNTIME_POLICY_DESIGN');
  assert.equal(mapped.body.runtimePolicyAuthorized, false);
  return { reviewed: reviewed.body, approved: approved.body, mapped: mapped.body };
}

function activityPolicy(use: any) {
  return {
    capabilityUseOccurrenceRef: use.id,
    authorityRef: 'authority:i9-03-runtime-policy',
    decidedBy: 'i9-03-runtime-designer',
    rationale: 'Explicit retry, timeout, idempotency and failure policy for this capability use.',
    policyBasis: 'REFERENCE_TEST_DESIGN',
    retry: {
      initialIntervalMs: 100,
      backoffCoefficient: 2,
      maximumIntervalMs: 1000,
      maximumAttempts: 3,
      nonRetryableFailureTypes: ['INVALID_REQUEST', 'IDEMPOTENCY_CONFLICT'],
    },
    timeout: {
      startToCloseMs: 5000,
      scheduleToCloseMs: 10000,
    },
    idempotency: {
      requirement: 'REQUIRED',
      strategyKind: 'IDEMPOTENCY_KEY',
      keyContract: 'sha256(executionId + capabilityUseOccurrenceRef)',
      enforcementRef: 'ONE_APP_EFFECT_LEDGER',
    },
    failureClassifications: [
      { failureType: 'TRANSIENT_FAILURE', retryable: true, businessFailure: false },
      { failureType: 'INVALID_REQUEST', retryable: false, businessFailure: false },
      { failureType: 'IDEMPOTENCY_CONFLICT', retryable: false, businessFailure: false },
    ],
  };
}

test('I9-03 one app requires explicit RuntimePolicy decisions after approved Temporal mapping and still creates no deployment authority', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-i9-03-runtime-policy-'));
  const app = await startTalosOneApp({ port: 0, runtimeDir, imagePerceptionEnv: {} });
  try {
    const status = await (await fetch(`${app.baseUrl}/api/status`)).json() as any;
    assert.equal(status.automaticRuntimePolicyDefaultsAuthorized, false);
    assert.equal(status.deploymentAuthorized, false);
    assert.equal(status.executionAuthorized, false);

    const x = await reachTemporalMapping(app.baseUrl);
    const activities = x.reviewed.execution.capabilityUses.map(activityPolicy);
    const designed = await post(app.baseUrl, '/api/automation/runtime-policy', {
      approvalId: x.approved.id,
      temporalMappingRevisionId: x.mapped.mapping.revision.id,
      activities,
      workflow: {
        authorityRef: 'authority:i9-03-workflow-policy',
        decidedBy: 'i9-03-runtime-designer',
        rationale: 'Workflow-level retry is explicitly limited so the full business execution is not duplicated implicitly.',
        maximumAttempts: 1,
        policyBasis: 'REFERENCE_TEST_DESIGN',
      },
    });
    assert.equal(designed.response.status, 201);
    assert.equal(designed.body.runtimePolicy.revision.temporalMappingRevisionRef, x.mapped.mapping.revision.id);
    assert.equal(designed.body.runtimePolicy.assessment.readiness, 'READY_FOR_DEPLOYMENT_DESIGN');
    assert.equal(designed.body.runtimePolicy.defaultEntries.length, 0, 'I9-03 must not rely on implicit Temporal defaults');
    assert.equal(designed.body.runtimePolicy.defaultAcceptances.length, 0, 'I9-03 must not manufacture default acceptances');
    assert.equal(designed.body.runtimePolicy.activityPolicies.length, activities.length);
    assert.equal(designed.body.deploymentAuthorized, false);
    assert.equal(designed.body.executionAuthorized, false);
  } finally {
    await app.close();
  }

  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-one-app.sqlite'));
  try {
    assert.equal(repo.listByKind('RuntimePolicyRevision').length, 1);
    assert.ok(repo.listByKind('RetryPolicyDesign').length > 0);
    assert.ok(repo.listByKind('TimeoutPolicyDesign').length > 0);
    assert.ok(repo.listByKind('IdempotencyPolicyDesign').length > 0);
    assert.ok(repo.listByKind('FailureClassificationPolicy').length > 0);
    assert.equal(repo.listByKind('DeploymentRevision').length, 0);
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length, 0);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('I9-03 refuses RuntimePolicy design when approved Temporal mapping does not exist', async () => {
  const app = await startTalosOneApp({ port: 0, imagePerceptionEnv: {} });
  try {
    const result = await post(app.baseUrl, '/api/automation/runtime-policy', {
      approvalId: 'execution:missing-approval',
      temporalMappingRevisionId: 'temporalMapping:missing-mapping',
      activities: [],
      workflow: {
        authorityRef: 'authority:i9-03',
        decidedBy: 'i9-03-user',
        rationale: 'This request must not bypass approved Temporal mapping.',
        maximumAttempts: 1,
        policyBasis: 'REFERENCE_TEST_DESIGN',
      },
    });
    assert.equal(result.response.status, 409);
    assert.equal(result.body.code, 'ONE_APP_AUTHORITY_ORDER_VIOLATION');
  } finally {
    await app.close();
  }
});
