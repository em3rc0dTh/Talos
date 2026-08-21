import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BpmnCanonicalReconciliationService,
  NativeBpmnCanonicalReconciliationService,
  confirmImageInterpretedBusinessProcess,
} from '../packages/application/src/index.ts';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/index.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  createBpmnProcessRevision,
  inspectBpmnXml,
} from '../packages/review/src/index.ts';

const IMAGE_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_I7C05" targetNamespace="urn:talos:i7c05">
  <bpmn:process id="Process_Image" name="Image Interpreted Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Task" name="Review request"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End" name="Complete"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Task" />
    <bpmn:sequenceFlow id="F2" sourceRef="Task" targetRef="End" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="D"><bpmndi:BPMNPlane id="P" bpmnElement="Process_Image">
    <bpmndi:BPMNShape id="Start_di" bpmnElement="Start"><dc:Bounds x="100" y="100" width="36" height="36" /></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="Task_di" bpmnElement="Task"><dc:Bounds x="200" y="78" width="120" height="80" /></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="End_di" bpmnElement="End"><dc:Bounds x="390" y="100" width="36" height="36" /></bpmndi:BPMNShape>
    <bpmndi:BPMNEdge id="F1_di" bpmnElement="F1"><di:waypoint x="136" y="118" /><di:waypoint x="200" y="118" /></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F2_di" bpmnElement="F2"><di:waypoint x="320" y="118" /><di:waypoint x="390" y="118" /></bpmndi:BPMNEdge>
  </bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`;

function harness() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-i7c05-'));
  const repo = new SqliteDocumentStore(path.join(dir, 'state.sqlite'));
  const bytes = new LocalImageByteStore(path.join(dir, 'bytes'));
  return {
    repo,
    bytes,
    close() {
      repo.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

async function appendImageBpmn(repo: SqliteDocumentStore) {
  const inspection = await inspectBpmnXml(IMAGE_BPMN);
  const sourceArtifactId = createOpaqueId('source', 'i7c05-image-artifact');
  const sourceRepresentationId = createOpaqueId('source', 'i7c05-image-representation');
  const revision = createBpmnProcessRevision({
    revisionNumber: 1,
    sourceRoute: 'IMAGE_INTERPRETATION',
    editMode: 'GRAPH_EDIT',
    sourceArtifactRefs: [sourceArtifactId],
    sourceRepresentationRefs: [sourceRepresentationId],
    canonicalAlignmentStatus: 'REQUIRES_CANONICAL_RECONCILIATION',
    bpmnXml: IMAGE_BPMN,
    semanticDigest: inspection.modelSemanticDigest,
    diagramDigest: inspection.modelDiagramDigest,
    createdAt: '2026-08-20T23:00:00.000Z',
    createdBy: 'business-user',
  });
  repo.append({
    id: revision.id,
    aggregateKind: 'BpmnProcessRevision',
    schemaVersion: 'talos-bpmn-workspace-v0.1',
    payload: revision,
    createdAt: revision.createdAt,
  });
  return { revision, sourceArtifactId, sourceRepresentationId };
}

test('I7C-05 historical native reconciler still rejects an image-origin BPMN revision', async () => {
  const h = harness();
  try {
    const { revision } = await appendImageBpmn(h.repo);
    const native = await new NativeBpmnCanonicalReconciliationService(h.repo).reconcile({
      bpmnRevisionId: revision.id,
      reconciledBy: 'native-adapter',
      reconciledAt: '2026-08-20T23:01:00.000Z',
    });
    assert.equal(native.status, 'BLOCKED');
    if (native.status !== 'BLOCKED') throw new Error('expected native-only block');
    assert.equal(native.diagnostics[0]?.code, 'SOURCE_REVISION_NOT_NATIVE_BPMN');
    assert.equal(h.repo.listByKind('ProcessRevision').length, 0);
  } finally {
    h.close();
  }
});

test('I7C-05 source-aware structured reconciler accepts image BPMN but preserves INFERRED truth and exact source lineage', async () => {
  const h = harness();
  try {
    const { revision, sourceArtifactId, sourceRepresentationId } = await appendImageBpmn(h.repo);
    const result = await new BpmnCanonicalReconciliationService(h.repo).reconcile({
      bpmnRevisionId: revision.id,
      reconciledBy: 'structured-bpmn-reconciler',
      reconciledAt: '2026-08-20T23:01:00.000Z',
    });
    assert.equal(result.status, 'RECONCILED');
    if (result.status !== 'RECONCILED') throw new Error('expected reconciliation');
    assert.equal(result.processRevision.nodes.length, 3);
    assert.equal(result.processRevision.edges.length, 2);
    assert.equal(result.processRevision.nodes.every((node) => node.truthClass === 'INFERRED'), true);
    assert.equal(result.processRevision.edges.every((edge) => edge.truthClass === 'INFERRED'), true);
    assert.equal(result.processRevision.semanticClaims.length > 0, true);
    assert.equal(result.processRevision.semanticClaims.every((claim) => claim.truthClass === 'INFERRED'), true);
    assert.deepEqual(result.processRevision.sourceArtifactIds, [sourceArtifactId]);
    assert.deepEqual(result.alignedBpmnRevision.sourceRepresentationRefs, [sourceRepresentationId]);
    assert.equal(result.alignedBpmnRevision.sourceRoute, 'IMAGE_INTERPRETATION');
    assert.equal(result.alignedBpmnRevision.canonicalAlignmentStatus, 'ALIGNED_TO_CANONICAL');
    assert.equal(result.alignedBpmnRevision.canonicalProcessRevisionId, result.processRevision.id);
    assert.equal(result.validation.assessment.executionReadiness, 'NEEDS_CONFIRMATION');
    assert.equal(result.validation.findings.some((finding) => finding.code === 'SV-SRC-001'), true);
  } finally {
    h.close();
  }
});

test('I7C-05 Confirm Process converts exact image-inferred claims into a new HUMAN_CONFIRMATION canonical revision before BPMN confirmation', async () => {
  const h = harness();
  try {
    const { revision } = await appendImageBpmn(h.repo);
    const reconciled = await new BpmnCanonicalReconciliationService(h.repo).reconcile({
      bpmnRevisionId: revision.id,
      reconciledBy: 'structured-bpmn-reconciler',
      reconciledAt: '2026-08-20T23:01:00.000Z',
    });
    assert.equal(reconciled.status, 'RECONCILED');
    if (reconciled.status !== 'RECONCILED') throw new Error('expected reconciliation');

    const confirmed = confirmImageInterpretedBusinessProcess(h.repo, {
      currentBpmnRevision: reconciled.alignedBpmnRevision,
      currentProcessRevision: reconciled.processRevision,
      currentValidation: reconciled.validation,
      currentReviewContext: reconciled.review.context,
      confirmedBy: 'business-owner',
      authorityRef: 'authority:business-owner',
      confirmedAt: '2026-08-20T23:02:00.000Z',
      rationale: 'This BPMN represents my business process.',
    });

    assert.equal(confirmed.confirmedProcessRevision.parentRevisionIds[0], reconciled.processRevision.id);
    assert.equal(confirmed.confirmedProcessRevision.derivationKind, 'HUMAN_CONFIRMATION');
    assert.equal(confirmed.confirmedProcessRevision.semanticClaims.every((claim) => claim.truthClass === 'CONFIRMED'), true);
    assert.equal(confirmed.confirmedProcessRevision.nodes.every((node) => node.truthClass === 'CONFIRMED'), true);
    assert.equal(confirmed.confirmedProcessRevision.edges.every((edge) => edge.truthClass === 'CONFIRMED'), true);
    assert.equal(confirmed.confirmedValidation.findings.some((finding) => finding.code === 'SV-SRC-001'), false);
    assert.equal(confirmed.confirmedValidation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');

    assert.equal(confirmed.confirmedBpmnRevision.state, 'CONFIRMED');
    assert.equal(confirmed.confirmedBpmnRevision.sourceRoute, 'IMAGE_INTERPRETATION');
    assert.equal(confirmed.confirmedBpmnRevision.bpmnXmlSha256, reconciled.alignedBpmnRevision.bpmnXmlSha256);
    assert.equal(confirmed.confirmedBpmnRevision.semanticDigest, reconciled.alignedBpmnRevision.semanticDigest);
    assert.equal(confirmed.confirmedBpmnRevision.canonicalProcessRevisionId, confirmed.confirmedProcessRevision.id);
    assert.equal(confirmed.confirmation.canonicalProcessRevisionId, confirmed.confirmedProcessRevision.id);
    assert.equal(confirmed.confirmation.bpmnRevisionId, confirmed.confirmedBpmnRevision.id);

    const historical = h.repo.get<any>(reconciled.processRevision.id)?.payload;
    assert.equal(historical.semanticClaims.every((claim: any) => claim.truthClass === 'INFERRED'), true);
    assert.equal(h.repo.listByKind('SemanticFreezeRecord').length, 0);
    assert.equal(h.repo.listByKind('CapabilityDesignRevision').length, 0);
    assert.equal(h.repo.listByKind('ExecutionPlanRevision').length, 0);
    assert.equal(h.repo.listByKind('TemporalMappingRevision').length, 0);
    assert.equal(h.repo.listByKind('DeploymentRevision').length, 0);
  } finally {
    h.close();
  }
});
