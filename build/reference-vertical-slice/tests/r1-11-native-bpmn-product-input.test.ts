import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { R1_04_BUSINESS_CONFIRMATION_EXTENSION } from '../apps/reference-api/src/one-app-r1-04-confirmation-extension.ts';
import { R1_11_NATIVE_BPMN_SOURCE_EXTENSION } from '../apps/reference-api/src/one-app-r1-11-native-bpmn-source-extension.ts';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

const simpleBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R111" targetNamespace="https://talos.local/r1-11/native-bpmn">
  <bpmn:process id="Process_FieldTrial" name="Field Trial Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Receive" name="Receive Request"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End" name="Request Complete"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
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

test('R1-11 product extension exposes native BPMN without claiming image perception', () => {
  assert.match(R1_11_NATIVE_BPMN_SOURCE_EXTENSION, /Choose BPMN/);
  assert.match(R1_11_NATIVE_BPMN_SOURCE_EXTENSION, /Preserve BPMN/);
  assert.match(R1_11_NATIVE_BPMN_SOURCE_EXTENSION, /\/api\/input\/bpmn/);
  assert.match(R1_11_NATIVE_BPMN_SOURCE_EXTENSION, /Not required · structured source/);
  assert.match(R1_11_NATIVE_BPMN_SOURCE_EXTENSION, /\/api\/process-review\?revisionId=/);
  assert.match(R1_11_NATIVE_BPMN_SOURCE_EXTENSION, /Native BPMN is available without vision/);
  assert.doesNotMatch(R1_11_NATIVE_BPMN_SOURCE_EXTENSION, /automaticConfirmationAuthorized\s*:\s*true/);
  assert.doesNotMatch(R1_11_NATIVE_BPMN_SOURCE_EXTENSION, /automaticDeploymentAuthorized\s*:\s*true/);
  assert.doesNotMatch(R1_11_NATIVE_BPMN_SOURCE_EXTENSION, /automaticWorkflowExecutionAuthorized\s*:\s*true/);
});

test('R1-04 confirmation observes native BPMN through the existing exact-review boundary', () => {
  assert.match(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /\/api\/input\/bpmn/);
  assert.match(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /canonicalProcessRevisionId/);
  assert.match(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /\/api\/bpmn\/confirm/);
  assert.match(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /automation design still requires a separate authority/i);
});

test('R1-11 product page renders native BPMN controls while preserving PNG fail-closed messaging', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11-native-ui-'));
  const app = await startTalosOneAppProduct({
    port: 0,
    oneApp: { runtimeDir, imagePerceptionEnv: {} },
  });
  try {
    const response = await fetch(`${app.baseUrl}/`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Choose PNG/);
    assert.match(html, /Choose BPMN/);
    assert.match(html, /Preserve BPMN/);
    assert.match(html, /Native BPMN is available without vision/);
    assert.match(html, /Business-process confirmation/);
    assert.ok(html.indexOf('Choose BPMN') < html.indexOf('Business-process confirmation'));
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-11 native BPMN traverses product proxy to review and exact confirmation without vision', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11-native-flow-'));
  const app = await startTalosOneAppProduct({
    port: 0,
    oneApp: { runtimeDir, imagePerceptionEnv: {} },
  });
  try {
    const statusResponse = await fetch(`${app.baseUrl}/api/status`);
    assert.equal(statusResponse.status, 200);
    const status = await statusResponse.json() as any;
    assert.deepEqual(status.inputRoutes, ['NATIVE_BPMN']);
    assert.equal(status.image.liveVisionInterpretation, false);
    assert.equal(status.automaticWorkflowExecutionAuthorized, false);

    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'r1-11-real-process.bpmn',
      bpmnXml: simpleBpmn,
      initiatedBy: 'r1-11-field-trial-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    assert.equal(imported.body.revision.state, 'DRAFT');
    assert.equal(imported.body.automaticConfirmationAuthorized, false);
    assert.equal(imported.body.automaticAutomationDesignAuthorized, false);

    const reviewResponse = await fetch(`${app.baseUrl}/api/process-review?revisionId=${encodeURIComponent(imported.body.revision.id)}`);
    assert.equal(reviewResponse.status, 200);
    const review = await reviewResponse.json() as any;
    assert.equal(review.status, 'PROCESS_REVIEW_REQUIRED');
    assert.equal(review.state, 'ACTIVE');
    assert.equal(review.revision.id, imported.body.revision.id);
    assert.equal(review.reconciliation.processRevision.id, imported.body.reconciliation.processRevision.id);
    assert.equal(review.requiresBusinessProcessConfirmation, true);
    assert.equal(review.automaticConfirmationAuthorized, false);
    assert.equal(review.automaticDeploymentAuthorized, false);
    assert.equal(review.automaticExecutionAuthorized, false);

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: review.revision.id,
      canonicalProcessRevisionId: review.reconciliation.processRevision.id,
      confirmedBy: 'r1-11-field-trial-user',
      authorityRef: 'authority:r1-11-real-process-owner',
      rationale: 'Field-trial operator reviewed and explicitly confirmed this exact business-process revision.',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.revision.state, 'CONFIRMED');
    assert.equal(confirmed.body.confirmation.canonicalProcessRevisionId, review.reconciliation.processRevision.id);
    assert.equal(confirmed.body.automaticAutomationDesignAuthorized, false);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
