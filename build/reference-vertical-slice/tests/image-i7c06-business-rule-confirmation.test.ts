import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BpmnCanonicalReconciliationService,
  confirmImageInterpretedBusinessProcess,
} from '../packages/application/src/index.ts';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { createBpmnProcessRevision, inspectBpmnXml } from '../packages/review/src/index.ts';

const BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="D" targetNamespace="urn:talos:i7c06:rules">
  <bpmn:process id="P" name="Reviewed image decision" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:exclusiveGateway id="Credit" name="Credit OK?"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing><bpmn:outgoing>F3</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:endEvent id="Approved" name="Approved"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:endEvent id="Rejected" name="Rejected"><bpmn:incoming>F3</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Credit" />
    <bpmn:sequenceFlow id="F2" sourceRef="Credit" targetRef="Approved"><bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">creditOk == true</bpmn:conditionExpression></bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="F3" sourceRef="Credit" targetRef="Rejected"><bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">creditOk == false</bpmn:conditionExpression></bpmn:sequenceFlow>
  </bpmn:process>
</bpmn:definitions>`;

function harness() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7c06-rule-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'bytes'));
  return { repo, bytes, close() { repo.close(); rmSync(dir, { recursive: true, force: true }); } };
}

test('I7C-06 structured decision rules on an image-origin BPMN remain INFERRED until Confirm Process then become CONFIRMED', async () => {
  const h = harness();
  try {
    const inspection = await inspectBpmnXml(BPMN);
    const artifact = createOpaqueId('source', 'i7c06-reviewed-image-artifact');
    const representation = createOpaqueId('source', 'i7c06-reviewed-image-representation');
    const revision = createBpmnProcessRevision({
      revisionNumber: 1,
      sourceRoute: 'IMAGE_INTERPRETATION',
      editMode: 'XML_EDIT',
      sourceArtifactRefs: [artifact],
      sourceRepresentationRefs: [representation],
      canonicalAlignmentStatus: 'REQUIRES_CANONICAL_RECONCILIATION',
      bpmnXml: BPMN,
      semanticDigest: inspection.modelSemanticDigest,
      diagramDigest: inspection.modelDiagramDigest,
      createdAt: '2026-08-20T23:40:00.000Z',
      createdBy: 'business-owner',
    });
    h.repo.append({ id: revision.id, aggregateKind: 'BpmnProcessRevision', schemaVersion: 'talos-bpmn-workspace-v0.1', payload: revision, createdAt: revision.createdAt });

    const reconciled = await new BpmnCanonicalReconciliationService(h.repo).reconcile({
      bpmnRevisionId: revision.id,
      reconciledBy: 'structured-bpmn-reconciler',
      reconciledAt: '2026-08-20T23:40:01.000Z',
    });
    assert.equal(reconciled.status, 'RECONCILED');
    if (reconciled.status !== 'RECONCILED') throw new Error('expected reconciliation');
    assert.equal(reconciled.processRevision.rules.length, 2);
    assert.equal(reconciled.processRevision.rules.every((rule) => rule.truthClass === 'INFERRED'), true);
    assert.equal(reconciled.processRevision.edges.filter((edge) => edge.kind === 'CONDITIONAL').every((edge) => Boolean(edge.conditionRuleRef)), true);
    assert.equal(reconciled.validation.findings.some((finding) => finding.code === 'SV-CFL-001'), false);
    assert.equal(reconciled.validation.assessment.executionReadiness, 'NEEDS_CONFIRMATION');

    const confirmed = confirmImageInterpretedBusinessProcess(h.repo, {
      currentBpmnRevision: reconciled.alignedBpmnRevision,
      currentProcessRevision: reconciled.processRevision,
      currentValidation: reconciled.validation,
      currentReviewContext: reconciled.review.context,
      confirmedBy: 'business-owner',
      authorityRef: 'authority:business-owner',
      confirmedAt: '2026-08-20T23:40:02.000Z',
    });
    assert.equal(confirmed.confirmedProcessRevision.rules.length, 2);
    assert.equal(confirmed.confirmedProcessRevision.rules.every((rule) => rule.truthClass === 'CONFIRMED'), true);
    assert.equal(confirmed.confirmedProcessRevision.nodes.every((node) => node.truthClass === 'CONFIRMED'), true);
    assert.equal(confirmed.confirmedProcessRevision.edges.every((edge) => edge.truthClass === 'CONFIRMED'), true);
    assert.equal(confirmed.confirmedValidation.findings.some((finding) => finding.code === 'SV-SRC-001'), false);
    assert.equal(confirmed.confirmedValidation.findings.some((finding) => finding.code === 'SV-CFL-001'), false);
    assert.equal(confirmed.confirmedValidation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
  } finally {
    h.close();
  }
});
