import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';

const UNRESOLVED = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="Definitions_R111_Branches" targetNamespace="https://talos.local/r1-11-branches">
  <bpmn:process id="Process_WashChoice" name="Wash choice" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:exclusiveGateway id="Choose" name="Which wash program?"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F_ECO</bpmn:outgoing><bpmn:outgoing>F_POLISH</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="Eco" name="ECO wash"><bpmn:incoming>F_ECO</bpmn:incoming><bpmn:outgoing>F_ECO_END</bpmn:outgoing></bpmn:task>
    <bpmn:task id="Polish" name="Polish Plus wash"><bpmn:incoming>F_POLISH</bpmn:incoming><bpmn:outgoing>F_POLISH_END</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="EcoEnd"><bpmn:incoming>F_ECO_END</bpmn:incoming></bpmn:endEvent>
    <bpmn:endEvent id="PolishEnd"><bpmn:incoming>F_POLISH_END</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Choose" />
    <bpmn:sequenceFlow id="F_ECO" name="ECO" sourceRef="Choose" targetRef="Eco" />
    <bpmn:sequenceFlow id="F_POLISH" name="Polish Plus" sourceRef="Choose" targetRef="Polish" />
    <bpmn:sequenceFlow id="F_ECO_END" sourceRef="Eco" targetRef="EcoEnd" />
    <bpmn:sequenceFlow id="F_POLISH_END" sourceRef="Polish" targetRef="PolishEnd" />
  </bpmn:process>
</bpmn:definitions>`;

const RESOLVED = UNRESOLVED
  .replace(
    '<bpmn:sequenceFlow id="F_ECO" name="ECO" sourceRef="Choose" targetRef="Eco" />',
    '<bpmn:sequenceFlow id="F_ECO" name="ECO" sourceRef="Choose" targetRef="Eco"><bpmn:conditionExpression xsi:type="bpmn:tFormalExpression" language="urn:talos:natural-language-condition">ECO</bpmn:conditionExpression></bpmn:sequenceFlow>',
  )
  .replace(
    '<bpmn:sequenceFlow id="F_POLISH" name="Polish Plus" sourceRef="Choose" targetRef="Polish" />',
    '<bpmn:sequenceFlow id="F_POLISH" name="Polish Plus" sourceRef="Choose" targetRef="Polish"><bpmn:conditionExpression xsi:type="bpmn:tFormalExpression" language="urn:talos:natural-language-condition">Polish Plus</bpmn:conditionExpression></bpmn:sequenceFlow>',
  );

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

test('R1-11 named BPMN decision branches remain review blockers until explicit natural-language conditions are saved, then Automation Design can open', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11-branch-resolution-'));
  const app = await startTalosOneApp({ runtimeDir });
  try {
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'wash-choice.bpmn',
      bpmnXml: UNRESOLVED,
      initiatedBy: 'r1-11-field-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');

    const firstReview = await getJson(app.baseUrl, `/api/process-review?revisionId=${encodeURIComponent(imported.body.revision.id)}`);
    assert.equal(firstReview.response.status, 200);
    const initialBranchFindings = firstReview.body.review.findings.filter((finding: any) => finding.code === 'SV-CFL-001');
    assert.equal(initialBranchFindings.length, 2);
    assert.deepEqual(
      firstReview.body.reconciliation.processRevision.edges
        .filter((edge: any) => edge.kind === 'CONDITIONAL')
        .map((edge: any) => edge.label)
        .sort(),
      ['ECO', 'Polish Plus'],
    );

    const corrected = await post(app.baseUrl, '/api/bpmn/edit', {
      baseRevisionId: imported.body.revision.id,
      bpmnXml: RESOLVED,
      editMode: 'XML_EDIT',
      editedBy: 'r1-11-field-user',
    });
    assert.equal(corrected.response.status, 201);
    assert.equal(corrected.body.status, 'CORRECTED_PROCESS_REVIEW_REQUIRED');
    assert.equal(corrected.body.changeClass, 'SEMANTIC');
    assert.equal(corrected.body.requiresProcessReconfirmation, false);

    const nextReview = await getJson(app.baseUrl, `/api/process-review?revisionId=${encodeURIComponent(corrected.body.revision.id)}`);
    assert.equal(nextReview.response.status, 200);
    assert.equal(nextReview.body.review.findings.filter((finding: any) => finding.code === 'SV-CFL-001').length, 0);
    const rules = nextReview.body.reconciliation.processRevision.rules;
    assert.deepEqual(rules.map((rule: any) => rule.naturalLanguage).sort(), ['ECO', 'Polish Plus']);
    assert.ok(rules.every((rule: any) => rule.truthClass === 'SOURCE_TRUTH'));
    assert.ok(rules.every((rule: any) => rule.expression?.language === 'urn:talos:natural-language-condition'));

    const confirmed = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: corrected.body.revision.id,
      canonicalProcessRevisionId: corrected.body.reconciliation.processRevision.id,
      confirmedBy: 'r1-11-field-user',
      authorityRef: 'authority:r1-11:branch-business-confirmation',
      rationale: 'The field user explicitly confirmed the reviewed branch meanings.',
    });
    assert.equal(confirmed.response.status, 201);
    assert.equal(confirmed.body.confirmation.status, 'CONFIRMED');

    const design = await post(app.baseUrl, '/api/bpmn/automation-design-approval', {
      revisionId: corrected.body.revision.id,
      confirmationId: confirmed.body.confirmation.id,
      approvedBy: 'r1-11-field-user',
      authorityRef: 'authority:r1-11:automation-design-handoff',
    });
    assert.equal(design.response.status, 201);
    assert.equal(design.body.automationDesignOpened, true);
    assert.ok(design.body.automationDesign?.workspace?.id);
    assert.ok(Array.isArray(design.body.automationDesign?.requirements));
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
