import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const SUBPROCESS_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R111_Rebuild" targetNamespace="https://talos.local/r1-11/rebuild">
  <bpmn:process id="Process_Rebuild" name="Rebuild Boundary" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:subProcess id="SubProcess_Work" name="Confirmed business subprocess">
      <bpmn:incoming>F1</bpmn:incoming>
      <bpmn:outgoing>F2</bpmn:outgoing>
    </bpmn:subProcess>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="SubProcess_Work" />
    <bpmn:sequenceFlow id="F2" sourceRef="SubProcess_Work" targetRef="End" />
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
  try {
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'execution-plan-rebuild.bpmn',
      bpmnXml: SUBPROCESS_BPMN,
      initiatedBy: 'r1-11-field-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    assert.equal(imported.body.reconciliation.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');

    const subprocess = imported.body.reconciliation.processRevision.nodes
      .find((node: any) => node.kind === 'SUBPROCESS');
    assert.ok(subprocess, 'fixture must expose an explicit execution-boundary decision');

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: imported.body.revision.id,
      canonicalProcessRevisionId: imported.body.reconciliation.processRevision.id,
      confirmedBy: 'r1-11-field-user',
      authorityRef: 'authority:r1-11:rebuild-confirmation',
      rationale: 'Field user confirms this exact business process before automation design.',
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
    assert.equal(
      workspace.requirements.length,
      0,
      'fixture intentionally isolates ExecutionPlan coordination from capability-binding semantics',
    );

    const selected = await post(app.baseUrl, '/api/automation/capability/select', {
      workspaceId: workspace.id,
      selections: [],
    });
    assert.equal(selected.response.status, 201);
    assert.equal(selected.body.createsBinding, true);
    assert.equal(selected.body.traces.length, 0);

    const blocked = await post(app.baseUrl, '/api/automation/execution-plan/review', {
      workspaceId: workspace.id,
      decisions: {},
    });
    assert.equal(blocked.response.status, 201);
    assert.equal(blocked.body.review.state, 'BLOCKED_EXECUTION_DESIGN');
    assert.equal(blocked.body.execution.revision.revision, 1);
    assert.deepEqual(blocked.body.execution.revision.parentRevisionRefs, []);
    assert(blocked.body.review.incompleteExecutionElementRefs.length > 0);

    const decisions = {
      subprocessResolutions: [{
        semanticSubjectRef: subprocess.id,
        boundaryKind: 'INLINE_COORDINATION',
        authorityRef: 'authority:r1-11:subprocess-boundary',
        decidedBy: 'r1-11-field-user',
        rationale: 'Explicitly keep the confirmed subprocess inside the current workflow boundary; no Child Workflow is inferred.',
      }],
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
    assert.equal(repo.listByKind('CapabilityBindingRevision').length, 0);
    assert.equal(repo.listByKind('AutomationDesignApprovalRecord').length, 0);
    assert.equal(repo.listByKind('TemporalMappingRevision').length, 0);
    assert.equal(repo.listByKind('DeploymentRevision').length, 0);
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length, 0);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
