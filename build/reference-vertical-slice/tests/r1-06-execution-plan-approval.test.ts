import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

const bpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R106" targetNamespace="https://talos.local/r1-06">
  <bpmn:process id="Process_R106" name="R1-06 Approval Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Work" name="Perform reviewed work"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Work" />
    <bpmn:sequenceFlow id="F2" sourceRef="Work" targetRef="End" />
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

async function reachR106(baseUrl: string) {
  const imported = await post(baseUrl, '/api/input/bpmn', {
    fileName: 'r1-06.bpmn',
    bpmnXml: bpmn,
    initiatedBy: 'r1-06-user',
  });
  assert.equal(imported.response.status, 201);

  const confirmed = await post(baseUrl, '/api/bpmn/confirm', {
    revisionId: imported.body.revision.id,
    canonicalProcessRevisionId: imported.body.revision.canonicalProcessRevisionId,
    confirmedBy: 'r1-06-user',
    authorityRef: 'authority:r1-06-process-owner',
    rationale: 'Confirm this exact reviewed business process.',
  });
  assert.equal(confirmed.response.status, 201);

  const opened = await post(baseUrl, '/api/bpmn/automation-design-approval', {
    revisionId: confirmed.body.revision.id,
    confirmationId: confirmed.body.confirmation.id,
    approvedBy: 'r1-06-user',
    authorityRef: 'authority:r1-06-automation-design',
  });
  assert.equal(opened.response.status, 201);
  const workspace = opened.body.automationDesign.workspace;

  const selections = workspace.requirements.map((requirement: any, index: number) => ({
    source: 'EXPLICIT_OFFERING',
    requirementRef: requirement.capabilityRequirementRef,
    family: 'SYSTEM_OPERATION',
    offeringCanonicalName: `R1-06 Explicit Operation ${index + 1}`,
    offeringLifecycleStatus: 'TEST_ONLY',
    implementationKind: 'INTERNAL_SERVICE',
    implementationRef: `r1-06:operation:${index + 1}`,
    decidedBy: 'r1-06-automation-designer',
    authorityRef: 'authority:r1-06-capability-selection',
    rationale: 'Explicit capability choice after Automation Design review.',
  }));
  const selected = await post(baseUrl, '/api/automation/capability/select', {
    workspaceId: workspace.id,
    selections,
  });
  assert.equal(selected.response.status, 201);
  assert.equal(selected.body.createsCapabilitySelection, true);
  assert.equal(selected.body.createsBinding, true);
  assert.equal(selected.body.executionPlanAuthorized, false);

  const reviewed = await post(baseUrl, '/api/automation/execution-plan/review', {
    workspaceId: workspace.id,
    decisions: {},
  });
  assert.equal(reviewed.response.status, 201);
  return { imported, confirmed, opened, workspace, selected, reviewed };
}

test('R1-06 product surface exposes explicit capability selection, ExecutionPlan review and automation approval without R1-07 authority', async () => {
  const extensionPath = path.resolve(process.cwd(), 'apps/reference-api/src/one-app-r1-06-execution-plan-extension.ts');
  const source = readFileSync(extensionPath, 'utf8');
  assert.match(source, /\/api\/automation\/capability\/select/);
  assert.match(source, /\/api\/automation\/execution-plan\/review/);
  assert.match(source, /\/api\/automation\/approve/);
  assert.match(source, /retry policy: <code>UNSET — R1-07 REQUIRED<\/code>/);
  assert.match(source, /idempotency policy: <code>UNSET — R1-07 REQUIRED<\/code>/);
  assert.match(source, /timeouts: <code>UNSET — R1-07 REQUIRED<\/code>/);
  for (const forbidden of [
    '/api/automation/temporal-mapping',
    '/api/automation/runtime-policy',
    '/api/automation/deployment-design',
    '/api/automation/environment-realization',
    '/api/automation/deployment/approve',
    '/api/automation/deployment/attempt',
    '/api/automation/execution/approve',
    '/api/automation/execution/start',
  ]) assert.equal(source.includes(forbidden), false, `${forbidden} belongs to R1-07, not R1-06`);

  const app = await startTalosOneAppProduct({ port: 0, oneApp: { imagePerceptionEnv: {} } });
  try {
    const html = await fetch(app.baseUrl).then((response) => response.text());
    assert.match(html, /id="r105AutomationDesign"/);
    assert.match(html, /id="r106ExecutionPlan"/);
    assert.match(html, /Select & bind capabilities/);
    assert.match(html, /Review ExecutionPlan/);
    assert.match(html, /Approve exact ExecutionPlan/);
  } finally {
    await app.close();
  }
});

test('R1-06 exact reviewed ExecutionPlan requires explicit automation approval and authorizes Temporal design only', async () => {
  const app = await startTalosOneAppProduct({ port: 0, oneApp: { imagePerceptionEnv: {} } });
  try {
    const x = await reachR106(app.baseUrl);
    assert.equal(x.reviewed.body.review.state, 'READY_FOR_AUTOMATION_APPROVAL');
    assert.equal(x.reviewed.body.review.automationApprovalRequired, true);
    assert.equal(x.reviewed.body.review.temporalDesignAuthorized, false);
    assert.equal(x.reviewed.body.review.deploymentAuthorized, false);
    assert.equal(x.reviewed.body.review.executionAuthorized, false);
    assert.ok(x.reviewed.body.execution.elements.length > 0);
    assert.ok(x.reviewed.body.execution.capabilityUses.length > 0);

    const approved = await post(app.baseUrl, '/api/automation/approve', {
      reviewId: x.reviewed.body.review.id,
      approvedBy: 'r1-06-business-automation-owner',
      authorityRef: 'authority:r1-06-exact-automation-approval',
      rationale: 'Approve this exact reviewed ExecutionPlan for Temporal design only.',
    });
    assert.equal(approved.response.status, 201);
    assert.equal(approved.body.executionPlanRevisionRef, x.reviewed.body.execution.revision.id);
    assert.equal(approved.body.executionPlanAssessmentRef, x.reviewed.body.execution.assessment.id);
    assert.equal(approved.body.executionDigest, x.reviewed.body.execution.revision.executionDigest);
    assert.deepEqual(new Set(approved.body.capabilityBindingRevisionRefs), new Set(x.reviewed.body.review.capabilityBindingRevisionRefs));
    assert.equal(approved.body.temporalDesignAuthorized, true);
    assert.equal(approved.body.deploymentAuthorized, false);
    assert.equal(approved.body.executionAuthorized, false);

    const secondSource = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'r1-06-changed.bpmn',
      bpmnXml: bpmn.replace('Perform reviewed work', 'Perform semantically changed work'),
      initiatedBy: 'r1-06-user',
    });
    assert.equal(secondSource.response.status, 201);
    assert.notEqual(secondSource.body.revision.id, x.imported.body.revision.id);
    assert.notEqual(secondSource.body.revision.canonicalProcessRevisionId, x.imported.body.revision.canonicalProcessRevisionId);
    assert.equal(secondSource.body.automaticConfirmationAuthorized, false);
    assert.equal(secondSource.body.automaticAutomationDesignAuthorized, false);
  } finally {
    await app.close();
  }
});

test('R1-06 downstream authority calls still fail closed when their required explicit predecessor does not exist', async () => {
  const app = await startTalosOneAppProduct({ port: 0, oneApp: { imagePerceptionEnv: {} } });
  try {
    const review = await post(app.baseUrl, '/api/automation/execution-plan/review', {
      workspaceId: 'capability:missing-r1-06-workspace',
      decisions: {},
    });
    assert.equal(review.response.status, 409);
    assert.equal(review.body.code, 'ONE_APP_AUTHORITY_ORDER_VIOLATION');

    const approval = await post(app.baseUrl, '/api/automation/approve', {
      reviewId: 'execution:missing-r1-06-review',
      approvedBy: 'r1-06-user',
      authorityRef: 'authority:r1-06-user',
      rationale: 'This must not bypass ExecutionPlan review.',
    });
    assert.equal(approval.response.status, 409);
    assert.equal(approval.body.code, 'ONE_APP_AUTHORITY_ORDER_VIOLATION');
  } finally {
    await app.close();
  }
});
