import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';
import {
  R1_04_BUSINESS_CONFIRMATION_EXTENSION,
  renderR104BusinessConfirmationPage,
} from '../apps/reference-api/src/one-app-r1-04-confirmation-extension.ts';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';

const NATIVE_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_R104" targetNamespace="urn:talos:r1-04">
  <bpmn:process id="Process_R104" name="R1-04 Confirmation Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Task" name="Review request"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End" name="Complete"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Task" />
    <bpmn:sequenceFlow id="F2" sourceRef="Task" targetRef="End" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="D"><bpmndi:BPMNPlane id="P" bpmnElement="Process_R104">
    <bpmndi:BPMNShape id="Start_di" bpmnElement="Start"><dc:Bounds x="100" y="100" width="36" height="36" /></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="Task_di" bpmnElement="Task"><dc:Bounds x="200" y="78" width="120" height="80" /></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="End_di" bpmnElement="End"><dc:Bounds x="390" y="100" width="36" height="36" /></bpmndi:BPMNShape>
    <bpmndi:BPMNEdge id="F1_di" bpmnElement="F1"><di:waypoint x="136" y="118" /><di:waypoint x="200" y="118" /></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F2_di" bpmnElement="F2"><di:waypoint x="320" y="118" /><di:waypoint x="390" y="118" /></bpmndi:BPMNEdge>
  </bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`;

async function post(baseUrl: string, route: string, body: unknown) {
  return fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('R1-04 product shell exposes one explicit business-process confirmation and no later authority action', () => {
  const rendered = renderR104BusinessConfirmationPage(ONE_APP_PRODUCT_PAGE);
  assert.match(rendered, /Business-process confirmation/);
  assert.match(rendered, /Confirm business process/);
  assert.match(rendered, /\/api\/bpmn\/confirm/);
  assert.match(rendered, /process confirmation ≠ automation approval ≠ deployment approval ≠ execution approval/);
  assert.match(rendered, /exact BPMN review revision and exact Canonical ProcessRevision/);
  assert.match(rendered, /Automation design remains unauthorized/);
  assert.doesNotMatch(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /\/api\/bpmn\/automation-design-approval/);
  assert.doesNotMatch(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /\/api\/automation\/approve/);
  assert.doesNotMatch(R1_04_BUSINESS_CONFIRMATION_EXTENSION, /\/api\/automation\/execution\/start/);
});

test('R1-04 product server actually serves the confirmation surface over the certified One-App backend', async () => {
  const product = await startTalosOneAppProduct({ port: 0 });
  try {
    const response = await fetch(product.baseUrl);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /id="r104ConfirmProcess"/);
    assert.match(html, /authority:talos-product:r1-04-business-process-confirmation/);
    assert.match(html, /This action cannot freeze semantics, deploy, or start a workflow/);
  } finally {
    await product.close();
  }
});

test('R1-04 confirmation pins the exact BPMN and Canonical revisions and grants no automatic downstream authority', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-04-confirmation-'));
  const app = await startTalosOneApp({ port: 0, runtimeDir });
  try {
    const importedResponse = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'r1-04-process.bpmn',
      bpmnXml: NATIVE_BPMN,
      initiatedBy: 'r1-04-business-owner',
    });
    assert.equal(importedResponse.status, 201);
    const imported = await importedResponse.json() as any;
    assert.equal(imported.reconciliation.status, 'RECONCILED');
    assert.equal(imported.automaticConfirmationAuthorized, false);
    assert.equal(imported.automaticAutomationDesignAuthorized, false);

    const revisionId = imported.revision.id as string;
    const canonicalId = imported.reconciliation.processRevision.id as string;

    const mismatchedResponse = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId,
      canonicalProcessRevisionId: 'canonical:wrong-r1-04-revision',
      confirmedBy: 'r1-04-business-owner',
      authorityRef: 'authority:r1-04:mismatch-must-fail',
    });
    assert.equal(mismatchedResponse.status, 409, 'canonical revision mismatch is an authority/version conflict');

    const confirmationResponse = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId,
      canonicalProcessRevisionId: canonicalId,
      confirmedBy: 'r1-04-business-owner',
      authorityRef: 'authority:r1-04:business-owner',
      rationale: 'I reviewed this exact BPMN and confirm that it represents the intended business process.',
    });
    assert.equal(confirmationResponse.status, 201);
    const confirmed = await confirmationResponse.json() as any;

    assert.equal(confirmed.revision.id, revisionId);
    assert.equal(confirmed.revision.state, 'CONFIRMED');
    assert.equal(confirmed.confirmation.bpmnRevisionId, revisionId);
    assert.equal(confirmed.confirmation.canonicalProcessRevisionId, canonicalId);
    assert.equal(confirmed.confirmation.authorityRef, 'authority:r1-04:business-owner');
    assert.equal(confirmed.confirmation.status, 'CONFIRMED');
    assert.equal(confirmed.automaticAutomationDesignAuthorized, false);
    assert.equal(confirmed.automaticExecutionAuthorized, false);

    const duplicateResponse = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId,
      canonicalProcessRevisionId: canonicalId,
      confirmedBy: 'r1-04-business-owner',
      authorityRef: 'authority:r1-04:duplicate-must-fail',
    });
    assert.equal(duplicateResponse.status, 400);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
