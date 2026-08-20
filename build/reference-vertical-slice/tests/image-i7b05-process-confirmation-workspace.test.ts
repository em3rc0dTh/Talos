import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startProcessConfirmationWorkspace } from '../apps/reference-api/src/workspace-server.ts';
import { BpmnWorkspaceService } from '../packages/application/src/bpmn-workspace.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { alignBpmnRevisionToCanonical } from '../packages/review/src/bpmn-confirmation.ts';

const nativeBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_User_Input" targetNamespace="https://talos.local/i7b05">
  <bpmn:process id="Process_User_Input" isExecutable="false">
    <bpmn:startEvent id="Start_1"><bpmn:outgoing>Flow_1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Task_1" name="Receive Order"><bpmn:incoming>Flow_1</bpmn:incoming><bpmn:outgoing>Flow_2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End_1"><bpmn:incoming>Flow_2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="End_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_User_Input">
      <bpmndi:BPMNShape id="Start_1_di" bpmnElement="Start_1"><dc:Bounds x="100" y="120" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="190" y="98" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_1_di" bpmnElement="End_1"><dc:Bounds x="350" y="120" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="136" y="138" /><di:waypoint x="190" y="138" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="290" y="138" /><di:waypoint x="350" y="138" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

async function post(baseUrl: string, route: string, payload: unknown) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json() as Record<string, any>;
  return { response, body };
}

test('I7B-05 browser workspace requires actual user input and never treats image intake as process confirmation', async () => {
  const app = await startProcessConfirmationWorkspace({ port: 0 });
  try {
    const page = await fetch(app.baseUrl).then((response) => response.text());
    assert.match(page, /Process Confirmation/);
    assert.match(page, /Upload image/);
    assert.match(page, /Open BPMN/);
    assert.match(page, /Confirm Process/);
    assert.match(page, /bpmn-modeler\.development\.js/);

    const status = await fetch(`${app.baseUrl}/api/workspace/status`).then((response) => response.json()) as Record<string, any>;
    assert.equal(status.status, 'READY_FOR_PROCESS_INPUT');
    assert.equal(status.image.exactSourceIntake, true);
    assert.equal(status.image.liveVisionInterpretation, false);
    assert.equal(status.confirmation.automatic, false);
    assert.equal(status.execution.automatic, false);

    const vendor = await fetch(`${app.baseUrl}/vendor/bpmn-js/bpmn-modeler.development.js`);
    assert.equal(vendor.status, 200);
    assert.match(vendor.headers.get('content-type') ?? '', /javascript/);

    const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-01-order-process/imagen_2026-08-18_204857678.png');
    const uploadedBytes = readFileSync(fixturePath);
    const image = await post(app.baseUrl, '/api/input/image', {
      fileName: 'user-explicitly-uploaded-process.png',
      imageBase64: uploadedBytes.toString('base64'),
      initiatedBy: 'i7b05-test-user',
    });
    assert.equal(image.response.status, 201);
    assert.equal(image.body.status, 'SOURCE_PRESERVED_INTERPRETATION_PENDING');
    assert.equal(image.body.sourceContentSha256, '8ede24c9f1162ed83c10d8c62063d8d19813c993965378acf1a2e36113218bd9');
    assert.equal(image.body.automaticConfirmationAuthorized, false);
    assert.equal(image.body.automaticExecutionAuthorized, false);
    assert.equal(image.body.nextRequiredStage, 'IMAGE_PERCEPTION');
    assert.equal('revision' in image.body, false);
  } finally {
    await app.close();
  }
});

test('I7B-05 native BPMN opens directly as an editable DRAFT but confirmation remains blocked before canonical reconciliation', async () => {
  const app = await startProcessConfirmationWorkspace({ port: 0 });
  try {
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'my-real-process.bpmn',
      bpmnXml: nativeBpmn,
      initiatedBy: 'i7b05-test-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.status, 'BPMN_READY_FOR_REVIEW');
    assert.equal(imported.body.hasDiagramInterchange, true);
    assert.equal(imported.body.revision.sourceRoute, 'NATIVE_BPMN');
    assert.equal(imported.body.revision.editMode, 'NATIVE_BPMN_IMPORT');
    assert.equal(imported.body.revision.state, 'DRAFT');
    assert.equal(imported.body.revision.canonicalAlignmentStatus, 'REQUIRES_CANONICAL_RECONCILIATION');
    assert.equal(imported.body.automaticConfirmationAuthorized, false);

    const visualXml = nativeBpmn.replace('x="190" y="98"', 'x="230" y="98"');
    const visual = await post(app.baseUrl, '/api/bpmn/edit', {
      baseRevisionId: imported.body.revision.id,
      bpmnXml: visualXml,
      editMode: 'XML_EDIT',
      editedBy: 'i7b05-test-user',
    });
    assert.equal(visual.response.status, 201);
    assert.equal(visual.body.changeClass, 'VISUAL_ONLY');
    assert.equal(visual.body.revision.parentBpmnRevisionId, imported.body.revision.id);
    assert.equal(visual.body.revision.canonicalAlignmentStatus, 'REQUIRES_CANONICAL_RECONCILIATION');

    const semanticXml = visualXml.replace('Receive Order', 'Validate Order');
    const semantic = await post(app.baseUrl, '/api/bpmn/edit', {
      baseRevisionId: visual.body.revision.id,
      bpmnXml: semanticXml,
      editMode: 'XML_EDIT',
      editedBy: 'i7b05-test-user',
    });
    assert.equal(semantic.response.status, 201);
    assert.equal(semantic.body.changeClass, 'SEMANTIC');
    assert.equal(semantic.body.requiresCanonicalReconciliation, true);
    assert.equal(semantic.body.revision.canonicalProcessRevisionId, undefined);

    const confirm = await post(app.baseUrl, '/api/bpmn/confirm', {
      revisionId: semantic.body.revision.id,
      canonicalProcessRevisionId: 'canonical_fake_for_negative_test',
      confirmedBy: 'i7b05-test-user',
      authorityRef: 'business-process-owner',
    });
    assert.equal(confirm.response.status, 409);
    assert.equal(confirm.body.code, 'PROCESS_CONFIRMATION_BLOCKED');
    assert.match(confirm.body.error, /reconciled|canonical/i);
  } finally {
    await app.close();
  }
});

test('I7B-05 invalid XML never replaces the current valid BPMN revision', async () => {
  const app = await startProcessConfirmationWorkspace({ port: 0 });
  try {
    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'valid-before-invalid-edit.bpmn',
      bpmnXml: nativeBpmn,
      initiatedBy: 'i7b05-test-user',
    });
    assert.equal(imported.response.status, 201);

    const invalid = await post(app.baseUrl, '/api/bpmn/edit', {
      baseRevisionId: imported.body.revision.id,
      bpmnXml: '<bpmn:definitions>',
      editMode: 'XML_EDIT',
      editedBy: 'i7b05-test-user',
    });
    assert.equal(invalid.response.status, 400);
    assert.equal(invalid.body.code, 'WORKSPACE_REQUEST_REJECTED');

    const secondEdit = await post(app.baseUrl, '/api/bpmn/edit', {
      baseRevisionId: imported.body.revision.id,
      bpmnXml: nativeBpmn.replace('Receive Order', 'Receive Customer Order'),
      editMode: 'XML_EDIT',
      editedBy: 'i7b05-test-user',
    });
    assert.equal(secondEdit.response.status, 201);
    assert.equal(secondEdit.body.revision.parentBpmnRevisionId, imported.body.revision.id);
    assert.equal(secondEdit.body.changeClass, 'SEMANTIC');
  } finally {
    await app.close();
  }
});

test('I7B-05 importing the same native BPMN twice creates distinct immutable review revisions', async () => {
  const app = await startProcessConfirmationWorkspace({ port: 0 });
  try {
    const first = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'same-process.bpmn',
      bpmnXml: nativeBpmn,
      initiatedBy: 'i7b05-test-user',
    });
    const second = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'same-process.bpmn',
      bpmnXml: nativeBpmn,
      initiatedBy: 'i7b05-test-user',
    });
    assert.equal(first.response.status, 201);
    assert.equal(second.response.status, 201);
    assert.notEqual(second.body.revision.id, first.body.revision.id);
    assert.ok(second.body.revision.revisionNumber > first.body.revision.revisionNumber);
    assert.equal(second.body.revision.bpmnXmlSha256, first.body.revision.bpmnXmlSha256);
  } finally {
    await app.close();
  }
});

test('I7B-05 confirmation persists as independent authority evidence without mutating the stored BPMN revision', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7b05-confirmation-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const workspace = new BpmnWorkspaceService(repo, byteStore);
  try {
    const imported = await workspace.importNativeBpmn({
      bpmnXml: nativeBpmn,
      declaredName: 'confirmation-proof.bpmn',
      initiatedBy: 'i7b05-test-user',
      importedAt: '2026-08-20T22:20:00.000Z',
    });
    const canonicalProcessRevisionId = 'canonical_i7b05_confirmation' as any;
    const aligned = alignBpmnRevisionToCanonical(imported.revision, {
      canonicalProcessRevisionId,
      alignedBy: 'canonical-reconciliation-test',
      alignedAt: '2026-08-20T22:20:01.000Z',
      authorityRef: 'business-process-owner',
      revisionNumber: imported.revision.revisionNumber + 1,
    });
    repo.append({
      id: aligned.id as any,
      aggregateKind: 'BpmnProcessRevision',
      schemaVersion: 'talos-bpmn-workspace-v0.1',
      payload: aligned,
      parentId: imported.revision.id as any,
      createdAt: aligned.createdAt,
    });

    const result = workspace.confirm({
      revisionId: aligned.id,
      canonicalProcessRevisionId,
      confirmedBy: 'i7b05-test-user',
      confirmedAt: '2026-08-20T22:20:02.000Z',
      authorityRef: 'business-process-owner',
    });
    assert.equal(result.revision.state, 'CONFIRMED');
    assert.equal(result.confirmation.status, 'CONFIRMED');

    const stored = repo.get<any>(aligned.id as any);
    assert.equal(stored?.payload.state, 'DRAFT');
    assert.equal(workspace.getRevision(aligned.id)?.state, 'CONFIRMED');
    assert.equal(repo.listByKind('BusinessProcessConfirmationRecord').length, 1);
    assert.equal(repo.listByKind('BpmnProcessRevision').length, 2);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
