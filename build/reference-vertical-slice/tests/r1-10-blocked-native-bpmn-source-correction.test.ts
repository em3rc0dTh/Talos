import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';

const BLOCKED_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R110_Blocked" targetNamespace="https://talos.local/r1-10">
  <bpmn:process id="Process_R110_Blocked" name="Blocked native BPMN" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:intermediateCatchEvent id="WaitForSomething" name="Unsupported intermediate catch"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:intermediateCatchEvent>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="WaitForSomething" />
    <bpmn:sequenceFlow id="F2" sourceRef="WaitForSomething" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

const CORRECTED_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R110_Corrected" targetNamespace="https://talos.local/r1-10">
  <bpmn:process id="Process_R110_Corrected" name="Corrected native BPMN" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="ReviewCar" name="Review car"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="ReviewCar" />
    <bpmn:sequenceFlow id="F2" sourceRef="ReviewCar" targetRef="End" />
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

test('R1-10 blocked native BPMN stays source-correctable and can create its first Canonical review after a semantic correction', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-10-blocked-bpmn-'));
  const app = await startTalosOneApp({ port: 0, runtimeDir, imagePerceptionEnv: {} });
  try {
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'blocked-native.bpmn',
      bpmnXml: BLOCKED_BPMN,
      initiatedBy: 'r1-10-owner',
    });
    assert.equal(imported.response.status, 200);
    assert.equal(imported.body.reconciliation.status, 'BLOCKED');
    assert.equal(imported.body.reconciliation.diagnostics[0].code, 'UNSUPPORTED_BPMN_ELEMENT');
    assert.equal(imported.body.automaticConfirmationAuthorized, false);
    assert.equal(imported.body.automaticAutomationDesignAuthorized, false);
    const blockedRevisionId = imported.body.revision.id as string;

    const prematureReview = await fetch(`${app.baseUrl}/api/process-review?revisionId=${encodeURIComponent(blockedRevisionId)}`);
    assert.equal(prematureReview.status, 409, 'a blocked source must not manufacture an active Canonical review');

    const corrected = await post(app.baseUrl, '/api/bpmn/edit', {
      baseRevisionId: blockedRevisionId,
      bpmnXml: CORRECTED_BPMN,
      editMode: 'XML_EDIT',
      editedBy: 'r1-10-owner',
    });
    assert.equal(corrected.response.status, 201);
    assert.equal(corrected.body.status, 'CORRECTED_PROCESS_REVIEW_REQUIRED');
    assert.equal(corrected.body.createdCanonicalReviewFromSourceCorrection, true);
    assert.equal(corrected.body.requiresProcessReconfirmation, false);
    assert.equal(corrected.body.reconciliation.status, 'RECONCILED');
    assert.equal(corrected.body.automaticConfirmationAuthorized, false);
    assert.equal(corrected.body.automaticExecutionAuthorized, false);

    const review = await fetch(`${app.baseUrl}/api/process-review?revisionId=${encodeURIComponent(corrected.body.revision.id)}`);
    assert.equal(review.status, 200);
    const reviewBody = await review.json() as any;
    assert.equal(reviewBody.status, 'PROCESS_REVIEW_REQUIRED');
    assert.equal(reviewBody.state, 'ACTIVE');
    assert.equal(reviewBody.reconciliation.status, 'RECONCILED');
    assert.equal(reviewBody.requiresBusinessProcessConfirmation, true);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-10 product page renders blocked native BPMN as source-correction state and does not repeat stale human-runtime copy', () => {
  assert.match(ONE_APP_PRODUCT_PAGE, /RECONCILIATION BLOCKED · SOURCE PRESERVED/);
  assert.match(ONE_APP_PRODUCT_PAGE, /R1_BPMN_RECONCILIATION_BLOCKED/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Source correction available · no business authority exists/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Human UPDATE\/SIGNAL runtime is implemented/);
});