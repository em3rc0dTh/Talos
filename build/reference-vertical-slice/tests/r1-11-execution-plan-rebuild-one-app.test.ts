import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const COLLABORATION_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R111_Rebuild" targetNamespace="https://talos.local/r1-11/rebuild">
  <bpmn:collaboration id="Collaboration_CarWash_Rebuild">
    <bpmn:participant id="Participant_Customer" name="Customer" processRef="Process_Customer" />
    <bpmn:participant id="Participant_Machine" name="Car Wash Machine" processRef="Process_Machine" />
    <bpmn:messageFlow id="Message_Payment" sourceRef="Task_Pay" targetRef="Task_Wash" />
    <bpmn:messageFlow id="Message_Done" sourceRef="Task_Dry" targetRef="Task_Leave" />
  </bpmn:collaboration>
  <bpmn:process id="Process_Customer" name="Customer" isExecutable="false">
    <bpmn:startEvent id="Start_Customer"><bpmn:outgoing>CF1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Task_Pay" name="Pay"><bpmn:incoming>CF1</bpmn:incoming><bpmn:outgoing>CF2</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_Leave" name="Drive away"><bpmn:incoming>CF2</bpmn:incoming><bpmn:outgoing>CF3</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End_Customer"><bpmn:incoming>CF3</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="CF1" sourceRef="Start_Customer" targetRef="Task_Pay" />
    <bpmn:sequenceFlow id="CF2" sourceRef="Task_Pay" targetRef="Task_Leave" />
    <bpmn:sequenceFlow id="CF3" sourceRef="Task_Leave" targetRef="End_Customer" />
  </bpmn:process>
  <bpmn:process id="Process_Machine" name="Car Wash Machine" isExecutable="false">
    <bpmn:startEvent id="Start_Machine"><bpmn:outgoing>MF1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Task_Wash" name="Soft Cloth Wash"><bpmn:incoming>MF1</bpmn:incoming><bpmn:outgoing>MF2</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Task_Dry" name="Dry"><bpmn:incoming>MF2</bpmn:incoming><bpmn:outgoing>MF3</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End_Machine"><bpmn:incoming>MF3</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="MF1" sourceRef="Start_Machine" targetRef="Task_Wash" />
    <bpmn:sequenceFlow id="MF2" sourceRef="Task_Wash" targetRef="Task_Dry" />
    <bpmn:sequenceFlow id="MF3" sourceRef="Task_Dry" targetRef="End_Machine" />
  </bpmn:process>
</bpmn:definitions>`;

async function post(baseUrl: string, pathname: string, payload: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { response, body: await response.json() as any };
}

test('R1-11 One-App rebuild endpoint persists a child ExecutionPlan revision instead of conflicting with immutable v1', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11-one-app-rebuild-'));
  const app = await startTalosOneApp({ port: 0, runtimeDir });
  let bindingCount = 0;
  try {
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'car-wash-rebuild.bpmn',
      bpmnXml: COLLABORATION_BPMN,
      initiatedBy: 'r1-11-field-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    assert.equal(imported.body.reconciliation.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');

    const messageEdges = imported.body.reconciliation.processRevision.edges
      .filter((edge: any) => edge.kind === 'MESSAGE');
    assert.equal(messageEdges.length, 2, 'fixture must expose explicit cross-participant relation decisions');

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: imported.body.revision.id,
      canonicalProcessRevisionId: imported.body.reconciliation.processRevision.id,
      confirmedBy: 'r1-11-field-user',
      authorityRef: 'authority:r1-11:car-wash-confirmation',
      rationale: 'Field user confirms this exact collaboration before automation design.',
    });
    assert.equal(confirmed.response.status, 201);

    const frozen = await post(app.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId: imported.body.revision.id,
      confirmationId: confirmed.body.confirmation.id,
      approvedBy: 'r1-11-field-user',
      authorityRef: 'authority:r1-11:automation-design-freeze',
    });
    assert.equal(frozen.response.status, 201);
    assert.equal(frozen.body.handoff.result, 'FROZEN');
    assert.equal(frozen.body.automationDesignOpened, true);

    const workspace = frozen.body.automationDesign.workspace;
    assert.ok(workspace.requirements.length > 0);
    const selections = workspace.requirements.map((requirement: any, index: number) => ({
      source: 'EXPLICIT_OFFERING',
      requirementRef: requirement.capabilityRequirementRef,
      family: 'SYSTEM_OPERATION',
      offeringCanonicalName: `Car Wash Operation ${index + 1}`,
      offeringLifecycleStatus: 'TEST_ONLY',
      implementationKind: 'INTERNAL_SERVICE',
      implementationRef: `r1-11:car-wash-operation:${index + 1}`,
      decidedBy: 'r1-11-automation-designer',
      authorityRef: 'authority:r1-11:capability-selection',
      rationale: 'Explicit field-trial binding; no implementation meaning is inferred from the BPMN label.',
    }));
    bindingCount = selections.length;

    const selected = await post(app.baseUrl, '/api/automation/capability/select', {
      workspaceId: workspace.id,
      selections,
    });
    assert.equal(selected.response.status, 201);
    assert.equal(selected.body.createsBinding, true);

    const blocked = await post(app.baseUrl, '/api/automation/execution-plan/review', {
      workspaceId: workspace.id,
      decisions: {},
    });
    assert.equal(blocked.response.status, 201);
    assert.equal(blocked.body.review.state, 'BLOCKED_EXECUTION_DESIGN');
    assert.equal(blocked.body.execution.revision.revision, 1);
    assert.deepEqual(blocked.body.execution.revision.parentRevisionRefs, []);
    assert(blocked.body.review.incompleteExecutionRelationRefs.length > 0);

    const decisions = {
      relationResolutions: messageEdges.map((edge: any, index: number) => ({
        semanticRelationRef: edge.id,
        executionRelationKind: 'SEQUENCE',
        authorityRef: `authority:r1-11:message-relation:${index + 1}`,
        decidedBy: 'r1-11-field-user',
        rationale: 'Explicitly coordinate this confirmed MESSAGE relation as in-workflow sequence without changing canonical MESSAGE truth.',
      })),
    };

    const rebuilt = await post(app.baseUrl, '/api/automation/execution-plan/review', {
      workspaceId: workspace.id,
      decisions,
    });
    assert.equal(rebuilt.response.status, 201);
    assert.equal(rebuilt.body.review.state, 'READY_FOR_AUTOMATION_APPROVAL');
    assert.equal(rebuilt.body.review.technicalReadiness, 'READY_FOR_TEMPORAL_MAPPING_DESIGN');
    assert.notEqual(rebuilt.body.execution.revision.id, blocked.body.execution.revision.id);
    assert.equal(rebuilt.body.execution.revision.revision, 2);
    assert.deepEqual(
      rebuilt.body.execution.revision.parentRevisionRefs,
      [blocked.body.execution.revision.id],
    );
    assert.equal(rebuilt.body.execution.definition.id, blocked.body.execution.definition.id);
    assert.deepEqual(rebuilt.body.execution.definition, blocked.body.execution.definition);

    const duplicate = await post(app.baseUrl, '/api/automation/execution-plan/review', {
      workspaceId: workspace.id,
      decisions,
    });
    assert.equal(duplicate.response.status, 201);
    assert.equal(duplicate.body.execution.revision.id, rebuilt.body.execution.revision.id);
    assert.equal(duplicate.body.execution.revision.revision, 2);
  } finally {
    await app.close();
  }

  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-one-app.sqlite'));
  try {
    assert.equal(repo.listByKind('ExecutionPlanDefinition').length, 1);
    assert.equal(repo.listByKind('ExecutionPlanRevision').length, 2);
    assert.equal(repo.listByKind('AutomationExecutionPlanReview').length, 2);
    assert.equal(
      repo.listByKind('CapabilityBindingRevision').length,
      bindingCount,
      'ExecutionPlan rebuild must preserve the original explicit capability bindings exactly once',
    );
    assert.equal(repo.listByKind('AutomationDesignApprovalRecord').length, 0);
    assert.equal(repo.listByKind('TemporalMappingRevision').length, 0);
    assert.equal(repo.listByKind('DeploymentRevision').length, 0);
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length, 0);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
