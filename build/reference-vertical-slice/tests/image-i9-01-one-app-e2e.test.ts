import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const simpleBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_I9" targetNamespace="https://talos.local/i9/one-app">
  <bpmn:process id="Process_Order" name="Order Handling" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Receive" name="Receive Order"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End" name="Order Complete"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Receive" />
    <bpmn:sequenceFlow id="F2" sourceRef="Receive" targetRef="End" />
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

test('I9-01 one app runs native BPMN through explicit automation approval and approved Temporal mapping in one immutable store', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-i9-01-one-app-'));
  const app = await startTalosOneApp({ port: 0, runtimeDir });
  try {
    const statusResponse = await fetch(`${app.baseUrl}/api/status`);
    assert.equal(statusResponse.status, 200);
    const status = await statusResponse.json() as any;
    assert.equal(status.releaseGate, 'I9-01_ONE_APP_NATIVE_BPMN_E2E');
    assert.deepEqual(status.inputRoutes, ['NATIVE_BPMN']);
    assert.equal(status.imageInputIntegratedIntoOneApp, false);
    assert.equal(status.automaticCapabilityBindingAuthorized, false);
    assert.equal(status.automaticTemporalDesignAuthorized, false);
    assert.equal(status.deploymentAuthorized, false);
    assert.equal(status.executionAuthorized, false);

    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'i9-order.bpmn',
      bpmnXml: simpleBpmn,
      initiatedBy: 'i9-business-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    assert.equal(imported.body.reconciliation.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
    assert.equal(imported.body.revision.state, 'DRAFT');
    assert.equal(imported.body.automaticConfirmationAuthorized, false);

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: imported.body.revision.id,
      canonicalProcessRevisionId: imported.body.revision.canonicalProcessRevisionId,
      confirmedBy: 'i9-business-user',
      authorityRef: 'authority:i9-business-process-owner',
      rationale: 'This is the business process I want Talos to automate.',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.revision.state, 'CONFIRMED');
    assert.equal(confirmed.body.automaticAutomationDesignAuthorized, false);

    const frozen = await post(app.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId: imported.body.revision.id,
      confirmationId: confirmed.body.confirmation.id,
      approvedBy: 'i9-business-user',
      authorityRef: 'authority:i9-automation-design-freeze',
    });
    assert.equal(frozen.response.status, 201);
    assert.equal(frozen.body.handoff.result, 'FROZEN');
    assert.equal(frozen.body.automationDesignOpened, true);
    assert.equal(frozen.body.automationDesign.workspace.createsBinding, false);
    assert.equal(frozen.body.automationDesign.workspace.capabilitySelectionCreated, false);
    assert.equal(frozen.body.capabilitySelectionCreated, false);
    assert.equal(frozen.body.deploymentAuthorized, false);
    assert.equal(frozen.body.executionAuthorized, false);

    const workspace = frozen.body.automationDesign.workspace;
    assert.ok(workspace.requirements.length > 0);
    const selections = workspace.requirements.map((requirement: any, index: number) => ({
      source: 'EXPLICIT_OFFERING',
      requirementRef: requirement.capabilityRequirementRef,
      family: 'SYSTEM_OPERATION',
      offeringCanonicalName: `I9 Order Operation ${index + 1}`,
      offeringLifecycleStatus: 'TEST_ONLY',
      implementationKind: 'INTERNAL_SERVICE',
      implementationRef: `i9:order-operation:${index + 1}`,
      decidedBy: 'i9-automation-designer',
      authorityRef: 'authority:i9-explicit-capability-selection',
      rationale: 'Explicit test selection; Talos must not infer implementation from the task label.',
    }));

    const selected = await post(app.baseUrl, '/api/automation/capability/select', {
      workspaceId: workspace.id,
      selections,
    });
    assert.equal(selected.response.status, 201);
    assert.equal(selected.body.createsCapabilitySelection, true);
    assert.equal(selected.body.createsBinding, true);
    assert.equal(selected.body.executionPlanAuthorized, false);
    assert.equal(selected.body.temporalMappingAuthorized, false);
    assert.equal(selected.body.deploymentAuthorized, false);

    const reviewed = await post(app.baseUrl, '/api/automation/execution-plan/review', {
      workspaceId: workspace.id,
      decisions: {},
    });
    assert.equal(reviewed.response.status, 201);
    assert.equal(reviewed.body.review.state, 'READY_FOR_AUTOMATION_APPROVAL');
    assert.equal(reviewed.body.review.technicalReadiness, 'READY_FOR_TEMPORAL_MAPPING_DESIGN');
    assert.equal(reviewed.body.review.automationApprovalRequired, true);
    assert.equal(reviewed.body.review.temporalDesignAuthorized, false);
    assert.equal(reviewed.body.review.deploymentAuthorized, false);
    assert.equal(reviewed.body.review.executionAuthorized, false);

    const approved = await post(app.baseUrl, '/api/automation/approve', {
      reviewId: reviewed.body.review.id,
      approvedBy: 'i9-business-automation-owner',
      authorityRef: 'authority:i9-explicit-automation-approval',
      rationale: 'Approve this exact reviewed ExecutionPlan for Temporal design only.',
    });
    assert.equal(approved.response.status, 201);
    assert.equal(approved.body.temporalDesignAuthorized, true);
    assert.equal(approved.body.deploymentAuthorized, false);
    assert.equal(approved.body.executionAuthorized, false);
    assert.equal(approved.body.executionPlanRevisionRef, reviewed.body.execution.revision.id);
    assert.equal(approved.body.executionDigest, reviewed.body.execution.revision.executionDigest);

    const mapped = await post(app.baseUrl, '/api/automation/temporal-mapping', {
      approvalId: approved.body.id,
      waits: [],
      humans: [],
    });
    assert.equal(mapped.response.status, 201);
    assert.equal(mapped.body.mapping.revision.executionPlanRevisionRef, reviewed.body.execution.revision.id);
    assert.equal(mapped.body.mapping.assessment.readiness, 'READY_FOR_RUNTIME_POLICY_DESIGN');
    assert.equal(mapped.body.runtimePolicyAuthorized, false);
    assert.equal(mapped.body.deploymentAuthorized, false);
    assert.equal(mapped.body.executionAuthorized, false);
  } finally {
    await app.close();
  }

  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-one-app.sqlite'));
  try {
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

test('I9-01 one app rejects downstream authority calls when earlier explicit gates do not exist', async () => {
  const app = await startTalosOneApp({ port: 0 });
  try {
    const selection = await post(app.baseUrl, '/api/automation/capability/select', {
      workspaceId: 'capability:missing-workspace',
      selections: [],
    });
    assert.equal(selection.response.status, 409);
    assert.equal(selection.body.code, 'ONE_APP_AUTHORITY_ORDER_VIOLATION');

    const approval = await post(app.baseUrl, '/api/automation/approve', {
      reviewId: 'execution:missing-review',
      approvedBy: 'i9-user',
      authorityRef: 'authority:i9-user',
      rationale: 'This must not bypass review.',
    });
    assert.equal(approval.response.status, 409);
    assert.equal(approval.body.code, 'ONE_APP_AUTHORITY_ORDER_VIOLATION');

    const mapping = await post(app.baseUrl, '/api/automation/temporal-mapping', {
      approvalId: 'execution:missing-approval',
      waits: [],
      humans: [],
    });
    assert.equal(mapping.response.status, 409);
    assert.equal(mapping.body.code, 'ONE_APP_AUTHORITY_ORDER_VIOLATION');
  } finally {
    await app.close();
  }
});
