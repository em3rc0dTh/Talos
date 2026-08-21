import test from 'node:test';
import assert from 'node:assert/strict';
import { startProcessConfirmationWorkspace } from '../apps/reference-api/src/workspace-server.ts';

const simpleBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_Browser" targetNamespace="https://talos.local/i7b08/browser">
  <bpmn:process id="Process_Order" name="Order Handling" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Receive" name="Receive Order"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End" name="Order Complete"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Receive" />
    <bpmn:sequenceFlow id="F2" sourceRef="Receive" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

const unresolvedDecisionBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_Browser_Decision" targetNamespace="https://talos.local/i7b08/browser/decision">
  <bpmn:process id="Process_Decision" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:exclusiveGateway id="Decision" name="Credit OK?"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing><bpmn:outgoing>F3</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Approve" name="Fulfill Order"><bpmn:incoming>F2</bpmn:incoming><bpmn:outgoing>F4</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="Rejected"><bpmn:incoming>F3</bpmn:incoming></bpmn:endEvent>
    <bpmn:endEvent id="Done"><bpmn:incoming>F4</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Decision" />
    <bpmn:sequenceFlow id="F2" sourceRef="Decision" targetRef="Approve" />
    <bpmn:sequenceFlow id="F3" sourceRef="Decision" targetRef="Rejected" />
    <bpmn:sequenceFlow id="F4" sourceRef="Approve" targetRef="Done" />
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

test('I7B-08 browser product surface runs native BPMN → reconcile → confirm → automation-design freeze without deployment authority', async () => {
  const app = await startProcessConfirmationWorkspace({ port: 0 });
  try {
    const page = await fetch(app.baseUrl);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /TALOS/);
    assert.match(html, /Process Confirmation/);
    assert.match(html, /Original source/);
    assert.match(html, /BPMN · What Talos understands/);
    assert.match(html, /Approve for Automation Design/);
    assert.doesNotMatch(html, /Quarry-0[1-9]/);

    const statusResponse = await fetch(`${app.baseUrl}/api/workspace/status`);
    const status = await statusResponse.json() as any;
    assert.equal(status.status, 'READY_FOR_PROCESS_INPUT');
    assert.equal(status.nativeBpmn.deterministicCanonicalReconciliation, true);
    assert.equal(status.image.liveVisionInterpretation, false);
    assert.equal(status.naturalLanguageCorrection.configured, false);
    assert.equal(status.automationDesign.deploymentAuthorized, false);
    assert.equal(status.automationDesign.executionAuthorized, false);

    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'order-handling.bpmn',
      bpmnXml: simpleBpmn,
      initiatedBy: 'browser-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    assert.equal(imported.body.reconciliation.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
    assert.equal(imported.body.revision.canonicalAlignmentStatus, 'ALIGNED_TO_CANONICAL');
    assert.equal(imported.body.revision.state, 'DRAFT');

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: imported.body.revision.id,
      canonicalProcessRevisionId: imported.body.revision.canonicalProcessRevisionId,
      confirmedBy: 'browser-user',
      authorityRef: 'browser:business-process-owner',
      rationale: 'This BPMN represents the business process.',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.revision.state, 'CONFIRMED');

    const approved = await post(app.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId: imported.body.revision.id,
      confirmationId: confirmed.body.confirmation.id,
      approvedBy: 'browser-user',
      authorityRef: 'browser:automation-design-authority',
    });
    assert.equal(approved.response.status, 201);
    assert.equal(approved.body.handoff.result, 'FROZEN');
    assert.equal(approved.body.freeze.freezeApplication.result, 'FROZEN');
    assert.equal(approved.body.deploymentAuthorized, false);
    assert.equal(approved.body.executionAuthorized, false);
    assert.notEqual(approved.body.freezeRecord.authorityRef, confirmed.body.confirmation.authorityRef);

    const correction = await post(app.baseUrl, '/api/bpmn/correction/propose', {
      baseRevisionId: imported.body.revision.id,
      instruction: 'Rename Receive Order to Capture Order',
      requestedBy: 'browser-user',
    });
    assert.equal(correction.response.status, 409);
    assert.equal(correction.body.code, 'BPMN_CORRECTION_PROVIDER_NOT_CONFIGURED');
  } finally {
    await app.close();
  }
});

test('I7B-08 Process Confirmation may succeed while the separate automation-design gate remains blocked by exact semantic validation', async () => {
  const app = await startProcessConfirmationWorkspace({ port: 0 });
  try {
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'unresolved-decision.bpmn',
      bpmnXml: unresolvedDecisionBpmn,
      initiatedBy: 'browser-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    assert.equal(imported.body.reconciliation.validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.ok(imported.body.reconciliation.validation.findings.some((finding: any) => finding.code === 'SV-CFL-001'));

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: imported.body.revision.id,
      canonicalProcessRevisionId: imported.body.revision.canonicalProcessRevisionId,
      confirmedBy: 'browser-user',
      authorityRef: 'browser:business-process-owner',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.revision.state, 'CONFIRMED');

    const approved = await post(app.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId: imported.body.revision.id,
      confirmationId: confirmed.body.confirmation.id,
      approvedBy: 'browser-user',
      authorityRef: 'browser:automation-design-authority',
    });
    assert.equal(approved.response.status, 200);
    assert.equal(approved.body.handoff.result, 'REJECTED_VALIDATION_GATE');
    assert.equal(approved.body.freezeRecord, undefined);
    assert.equal(approved.body.deploymentAuthorized, false);
    assert.equal(approved.body.executionAuthorized, false);
  } finally {
    await app.close();
  }
});
