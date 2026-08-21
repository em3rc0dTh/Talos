import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BpmnWorkspaceService } from '../packages/application/src/bpmn-workspace.ts';
import { NativeBpmnCanonicalReconciliationService } from '../packages/application/src/bpmn-canonical-import.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';

const simpleBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_I7B08" targetNamespace="https://talos.local/i7b08">
  <bpmn:process id="Process_Order" name="Order Handling" isExecutable="false">
    <bpmn:startEvent id="Start_1"><bpmn:outgoing>Flow_1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Task_1" name="Receive Order"><bpmn:incoming>Flow_1</bpmn:incoming><bpmn:outgoing>Flow_2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End_1" name="Order Complete"><bpmn:incoming>Flow_2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="End_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_1"><bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_Order">
    <bpmndi:BPMNShape id="Start_1_di" bpmnElement="Start_1"><dc:Bounds x="100" y="120" width="36" height="36" /></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="190" y="98" width="100" height="80" /></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="End_1_di" bpmnElement="End_1"><dc:Bounds x="350" y="120" width="36" height="36" /></bpmndi:BPMNShape>
    <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="136" y="138" /><di:waypoint x="190" y="138" /></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="290" y="138" /><di:waypoint x="350" y="138" /></bpmndi:BPMNEdge>
  </bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const unresolvedDecisionBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_Decision" targetNamespace="https://talos.local/i7b08/decision">
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

const unsupportedBpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_Unsupported" targetNamespace="https://talos.local/i7b08/unsupported">
  <bpmn:process id="Process_Unsupported" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:intermediateCatchEvent id="Wait"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing><bpmn:messageEventDefinition /></bpmn:intermediateCatchEvent>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Wait" />
    <bpmn:sequenceFlow id="F2" sourceRef="Wait" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

function harness() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7b08-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(dir, 'bytes'));
  return {
    repo,
    workspace: new BpmnWorkspaceService(repo, byteStore),
    reconciliation: new NativeBpmnCanonicalReconciliationService(repo),
    close() {
      repo.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test('I7B-08 simple native BPMN deterministically becomes canonical, validated, aligned, and confirmable', async () => {
  const h = harness();
  try {
    const imported = await h.workspace.importNativeBpmn({
      bpmnXml: simpleBpmn,
      declaredName: 'order-handling.bpmn',
      initiatedBy: 'browser-user',
      importedAt: '2026-08-20T23:30:00.000Z',
    });
    assert.equal(imported.revision.canonicalAlignmentStatus, 'REQUIRES_CANONICAL_RECONCILIATION');

    const reconciled = await h.reconciliation.reconcile({
      bpmnRevisionId: imported.revision.id,
      reconciledBy: 'talos-native-bpmn-adapter',
      reconciledAt: '2026-08-20T23:31:00.000Z',
    });
    assert.equal(reconciled.status, 'RECONCILED');
    if (reconciled.status !== 'RECONCILED') return;
    assert.equal(reconciled.processRevision.nodes.length, 3);
    assert.equal(reconciled.processRevision.edges.length, 2);
    assert.equal(reconciled.processRevision.nodes.find((node) => node.name === 'Receive Order')?.kind, 'ACTION');
    assert.equal(reconciled.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
    assert.equal(reconciled.alignedBpmnRevision.canonicalAlignmentStatus, 'ALIGNED_TO_CANONICAL');
    assert.equal(reconciled.alignedBpmnRevision.canonicalProcessRevisionId, reconciled.processRevision.id);
    assert.equal(reconciled.alignedBpmnRevision.bpmnXmlSha256, imported.revision.bpmnXmlSha256);
    assert.equal(reconciled.alignedBpmnRevision.semanticDigest, imported.revision.semanticDigest);

    const confirmed = h.workspace.confirm({
      revisionId: reconciled.alignedBpmnRevision.id,
      canonicalProcessRevisionId: reconciled.processRevision.id,
      confirmedBy: 'business-user',
      authorityRef: 'business-process-owner',
      confirmedAt: '2026-08-20T23:32:00.000Z',
    });
    assert.equal(confirmed.revision.state, 'CONFIRMED');
    assert.equal(confirmed.confirmation.canonicalProcessRevisionId, reconciled.processRevision.id);
  } finally {
    h.close();
  }
});

test('I7B-08 native exclusive decision without branch conditions aligns but remains blocked by semantic validation', async () => {
  const h = harness();
  try {
    const imported = await h.workspace.importNativeBpmn({
      bpmnXml: unresolvedDecisionBpmn,
      initiatedBy: 'browser-user',
    });
    const reconciled = await h.reconciliation.reconcile({
      bpmnRevisionId: imported.revision.id,
      reconciledBy: 'talos-native-bpmn-adapter',
    });
    assert.equal(reconciled.status, 'RECONCILED');
    if (reconciled.status !== 'RECONCILED') return;
    assert.equal(reconciled.alignedBpmnRevision.canonicalAlignmentStatus, 'ALIGNED_TO_CANONICAL');
    assert.equal(reconciled.validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.ok(reconciled.validation.findings.some((finding) => finding.code === 'SV-CFL-001'));
    assert.equal(reconciled.processRevision.edges.filter((edge) => edge.kind === 'CONDITIONAL').length, 2);
    assert.equal(reconciled.processRevision.rules.length, 0);
  } finally {
    h.close();
  }
});

test('I7B-08 unsupported BPMN semantics safe-stop canonical reconciliation and create no ProcessRevision', async () => {
  const h = harness();
  try {
    const imported = await h.workspace.importNativeBpmn({
      bpmnXml: unsupportedBpmn,
      initiatedBy: 'browser-user',
    });
    const reconciled = await h.reconciliation.reconcile({
      bpmnRevisionId: imported.revision.id,
      reconciledBy: 'talos-native-bpmn-adapter',
    });
    assert.equal(reconciled.status, 'BLOCKED');
    assert.ok(reconciled.diagnostics.some((diagnostic) => diagnostic.code === 'UNSUPPORTED_BPMN_ELEMENT'));
    assert.equal(h.repo.listByKind('ProcessRevision').length, 0);
    assert.equal(h.repo.listByKind('ValidationAssessment').length, 0);
    assert.equal(h.repo.listByKind('BusinessProcessConfirmationRecord').length, 0);
  } finally {
    h.close();
  }
});
