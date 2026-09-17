import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';
import { renderR104BusinessConfirmationPage } from '../apps/reference-api/src/one-app-r1-04-confirmation-extension.ts';
import {
  R1_05_AUTOMATION_DESIGN_EXTENSION,
  renderR105AutomationDesignPage,
} from '../apps/reference-api/src/one-app-r1-05-automation-design-extension.ts';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';

const SIMPLE_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R105" targetNamespace="urn:talos:r1-05">
  <bpmn:process id="Process_R105" name="R1-05 Automation Design" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Task" name="Receive request"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End" name="Complete"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Task" />
    <bpmn:sequenceFlow id="F2" sourceRef="Task" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

async function post(baseUrl: string, route: string, body: unknown) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : {} };
}

test('R1-05 product shell exposes user-facing automation setup but no downstream authority actions', () => {
  const withConfirmation = renderR104BusinessConfirmationPage(ONE_APP_PRODUCT_PAGE);
  const rendered = renderR105AutomationDesignPage(withConfirmation);

  assert.match(rendered, /Set up the automation/);
  assert.match(rendered, /Continue to automation setup/);
  assert.match(rendered, /\/api\/bpmn\/automation-design-approval/);
  assert.match(rendered, /\/api\/automation\/suggestion\/decide/);
  assert.match(rendered, /Capability selection, ExecutionPlan review, automation approval, deployment and execution remain separate explicit gates/);
  assert.match(rendered, /proposal only · creates binding: NO/);

  assert.doesNotMatch(R1_05_AUTOMATION_DESIGN_EXTENSION, /\/api\/automation\/capability\/select/);
  assert.doesNotMatch(R1_05_AUTOMATION_DESIGN_EXTENSION, /\/api\/automation\/execution-plan\/review/);
  assert.doesNotMatch(R1_05_AUTOMATION_DESIGN_EXTENSION, /\/api\/automation\/approve/);
  assert.doesNotMatch(R1_05_AUTOMATION_DESIGN_EXTENSION, /\/api\/automation\/deployment/);
  assert.doesNotMatch(R1_05_AUTOMATION_DESIGN_EXTENSION, /\/api\/automation\/execution\/start/);
});

test('R1-05 product server serves client-side confirmation followed by user-facing automation setup', async () => {
  const product = await startTalosOneAppProduct({ port: 0 });
  try {
    const response = await fetch(product.baseUrl);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /r104BusinessConfirmation/);
    assert.match(html, /r105AutomationDesign/);
    assert.match(html, /Confirm this process before automation setup/);
    assert.match(html, /Binding: NO/);
    assert.match(html, /ExecutionPlan authority: NO/);
  } finally {
    await product.close();
  }
});

test('R1-05 backend opens design only from the exact confirmed process and creates no capability selection or execution authority', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-05-design-'));
  const app = await startTalosOneApp({ port: 0, runtimeDir });
  try {
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'r1-05-process.bpmn',
      bpmnXml: SIMPLE_BPMN,
      initiatedBy: 'r1-05-business-owner',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    assert.equal(imported.body.reconciliation.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');

    const beforeConfirmation = await post(app.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId: imported.body.revision.id,
      confirmationId: 'bpmn:missing-r1-05-confirmation',
      approvedBy: 'r1-05-designer',
      authorityRef: 'authority:r1-05:must-fail-before-confirmation',
    });
    assert.equal(beforeConfirmation.response.status, 409);

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: imported.body.revision.id,
      canonicalProcessRevisionId: imported.body.reconciliation.processRevision.id,
      confirmedBy: 'r1-05-business-owner',
      authorityRef: 'authority:r1-05:business-confirmation',
      rationale: 'This exact process is the semantic basis for Automation Design.',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.automaticAutomationDesignAuthorized, false);
    assert.equal(confirmed.body.automaticExecutionAuthorized, false);

    const opened = await post(app.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId: imported.body.revision.id,
      confirmationId: confirmed.body.confirmation.id,
      approvedBy: 'r1-05-business-owner',
      authorityRef: 'authority:r1-05:automation-design-handoff',
    });
    assert.equal(opened.response.status, 201);
    assert.equal(opened.body.handoff.result, 'FROZEN');
    assert.equal(opened.body.automationDesignOpened, true);
    assert.equal(opened.body.capabilitySelectionCreated, false);
    assert.equal(opened.body.deploymentAuthorized, false);
    assert.equal(opened.body.executionAuthorized, false);

    const design = opened.body.automationDesign;
    assert.equal(design.workspace.revisionNumber, 1);
    assert.equal(design.workspace.processRevisionRef, confirmed.body.confirmation.canonicalProcessRevisionId);
    assert.equal(design.workspace.createsBinding, false);
    assert.equal(design.workspace.capabilitySelectionCreated, false);
    assert.equal(design.workspace.bindingAuthorized, false);
    assert.equal(design.workspace.executionPlanAuthorized, false);
    assert.ok(design.workspace.requirements.length > 0);
    assert.deepEqual(design.decisions, []);
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-05 keeps append-only suggestion decisions in the existing I8-03 engine and never converts them into selection', async () => {
  const source = R1_05_AUTOMATION_DESIGN_EXTENSION;
  assert.match(source, /ACCEPT/);
  assert.match(source, /REPLACE/);
  assert.match(source, /REJECT/);
  assert.match(source, /DEFER/);
  assert.match(source, /capabilitySelectionCreated!==false/);
  assert.match(source, /executionPlanAuthorized!==false/);
  assert.match(source, /records a design direction only and creates no capability binding/);
});
