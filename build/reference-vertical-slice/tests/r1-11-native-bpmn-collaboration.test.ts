import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';
import { ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-review-resolution-page.ts';

const COLLABORATION_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R111_Collaboration" targetNamespace="https://talos.local/r1-11">
  <bpmn:collaboration id="Collaboration_CarWash">
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

async function getJson(baseUrl: string, pathname: string) {
  const response = await fetch(`${baseUrl}${pathname}`);
  return { response, body: await response.json() as any };
}

test('R1-11 native BPMN Collaboration preserves ownership and a confirmed active head may derive a new DRAFT that requires reconfirmation', async () => {
  assert.match(ONE_APP_PRODUCT_PAGE, /SOURCE TRUTH · NOT BUSINESS-CONFIRMED/);
  assert.match(ONE_APP_PRODUCT_PAGE, /INFERRED · NOT BUSINESS-CONFIRMED/);
  assert.match(ONE_APP_PRODUCT_PAGE, /No BPMN changes to save/);
  assert.match(ONE_APP_PRODUCT_PAGE, /body\.confirmation\.canonicalProcessRevisionId/);
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /SV-CFL-001/);
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /Apply branch conditions to BPMN correction/);
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /R1_AUTOMATION_DESIGN_SEMANTIC_BLOCK/);
  assert.match(ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT, /No correction created automatically/);

  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11-collaboration-'));
  const app = await startTalosOneApp({ runtimeDir });
  try {
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'Car-Wash.bpmn',
      bpmnXml: COLLABORATION_BPMN,
      initiatedBy: 'r1-11-field-user',
    });

    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    assert.equal(imported.body.automaticConfirmationAuthorized, false);
    assert.equal(imported.body.automaticAutomationDesignAuthorized, false);

    const process = imported.body.reconciliation.processRevision;
    assert.equal(imported.body.reconciliation.processDefinition.canonicalName, 'Customer ↔ Car Wash Machine');
    assert.equal(process.nodes.length, 8);
    assert.equal(process.edges.filter((edge: any) => edge.kind === 'MESSAGE').length, 2);
    assert.deepEqual(
      process.actors.map((actor: any) => actor.name).sort(),
      ['Car Wash Machine', 'Customer'],
    );

    const customerActor = process.actors.find((actor: any) => actor.name === 'Customer');
    const machineActor = process.actors.find((actor: any) => actor.name === 'Car Wash Machine');
    assert.ok(customerActor);
    assert.ok(machineActor);

    for (const node of process.nodes.filter((candidate: any) => candidate.details?.bpmnProcessId === 'Process_Customer')) {
      assert.ok(node.actorRefs.includes(customerActor.id));
    }
    for (const node of process.nodes.filter((candidate: any) => candidate.details?.bpmnProcessId === 'Process_Machine')) {
      assert.ok(node.actorRefs.includes(machineActor.id));
    }

    const paymentMessage = process.edges.find((edge: any) => edge.kind === 'MESSAGE' && edge.id);
    assert.ok(paymentMessage);

    const initialReview = await getJson(app.baseUrl, `/api/process-review?revisionId=${encodeURIComponent(imported.body.revision.id)}`);
    assert.equal(initialReview.response.status, 200);
    assert.equal(initialReview.body.status, 'PROCESS_REVIEW_REQUIRED');
    assert.equal(initialReview.body.reconciliation.processRevision.id, process.id);
    assert.equal(initialReview.body.requiresBusinessProcessConfirmation, true);
    assert.equal(initialReview.body.automaticConfirmationAuthorized, false);

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: imported.body.revision.id,
      canonicalProcessRevisionId: process.id,
      confirmedBy: 'r1-11-field-user',
      authorityRef: 'authority:r1-11:car-wash-business-confirmation',
      rationale: 'Field user reviewed the imported collaboration and confirms the intended business meaning.',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.revision.state, 'CONFIRMED');
    assert.equal(confirmed.body.confirmation.status, 'CONFIRMED');
    assert.equal(confirmed.body.confirmation.canonicalProcessRevisionId, process.id);
    assert.equal(confirmed.body.automaticAutomationDesignAuthorized, false);
    assert.equal(confirmed.body.automaticExecutionAuthorized, false);

    // A second confirmation never creates another authority record for the same revision.
    const duplicate = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: imported.body.revision.id,
      canonicalProcessRevisionId: process.id,
      confirmedBy: 'r1-11-field-user',
      authorityRef: 'authority:r1-11:duplicate-click',
      rationale: 'Duplicate UI click must not create a second authority record.',
    });
    assert.equal(duplicate.response.status, 409);
    assert.match(String(duplicate.body.error), /Only a DRAFT BPMN revision may be confirmed/);

    // A confirmed active review is not a dead end. Editing it derives a new DRAFT
    // lineage; the old confirmation remains immutable and never transfers.
    const correctedXml = COLLABORATION_BPMN.replace('name="Pay"', 'name="Pay at kiosk"');
    const corrected = await post(app.baseUrl, '/api/bpmn/edit', {
      baseRevisionId: imported.body.revision.id,
      bpmnXml: correctedXml,
      editMode: 'XML_EDIT',
      editedBy: 'r1-11-field-user',
    });
    assert.equal(corrected.response.status, 201);
    assert.equal(corrected.body.status, 'CORRECTED_PROCESS_REVIEW_REQUIRED');
    assert.equal(corrected.body.changeClass, 'SEMANTIC');
    assert.equal(corrected.body.revision.state, 'DRAFT');
    assert.equal(corrected.body.requiresProcessReconfirmation, true);
    assert.equal(corrected.body.previousConfirmationStillApplies, false);
    assert.notEqual(corrected.body.revision.id, imported.body.revision.id);
    assert.notEqual(corrected.body.reconciliation.processRevision.id, process.id);

    const oldReview = await getJson(app.baseUrl, `/api/process-review?revisionId=${encodeURIComponent(imported.body.revision.id)}`);
    assert.equal(oldReview.response.status, 200);
    assert.equal(oldReview.body.status, 'PROCESS_REVIEW_SUPERSEDED');
    assert.equal(oldReview.body.state, 'SUPERSEDED');

    const nextReview = await getJson(app.baseUrl, `/api/process-review?revisionId=${encodeURIComponent(corrected.body.revision.id)}`);
    assert.equal(nextReview.response.status, 200);
    assert.equal(nextReview.body.status, 'PROCESS_REVIEW_REQUIRED');
    assert.equal(nextReview.body.revision.state, 'DRAFT');
    assert.equal(nextReview.body.requiresBusinessProcessConfirmation, true);

    const reconfirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: corrected.body.revision.id,
      canonicalProcessRevisionId: corrected.body.reconciliation.processRevision.id,
      confirmedBy: 'r1-11-field-user',
      authorityRef: 'authority:r1-11:corrected-business-confirmation',
      rationale: 'Field user explicitly reconfirms the corrected immutable business process revision.',
    });
    assert.equal(reconfirmed.response.status, 201);
    assert.equal(reconfirmed.body.revision.state, 'CONFIRMED');
    assert.equal(reconfirmed.body.confirmation.status, 'CONFIRMED');
    assert.notEqual(reconfirmed.body.confirmation.id, confirmed.body.confirmation.id);
    assert.equal(reconfirmed.body.confirmation.bpmnRevisionId, corrected.body.revision.id);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
