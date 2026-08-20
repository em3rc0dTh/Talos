import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import type { ProcessEdge, ProcessNode, ProcessRevision } from '../packages/semantic-core/src/types.ts';
import {
  alignBpmnRevisionToCanonical,
  confirmBusinessProcess,
} from '../packages/review/src/bpmn-confirmation.ts';
import { projectCanonicalProcessToBpmn } from '../packages/review/src/bpmn-projector.ts';
import {
  createBpmnRoundTripEdit,
  createNativeBpmnImportRevision,
  inspectBpmnXml,
} from '../packages/review/src/bpmn-roundtrip.ts';

const cid = (seed: string) => createOpaqueId('canonical', seed);
const pid = (seed: string) => createOpaqueId('provenance', seed);
const sid = (seed: string) => createOpaqueId('source', seed);

function node(seed: string, kind: ProcessNode['kind'], name: string): ProcessNode {
  return {
    id: cid(seed),
    kind,
    name,
    actorRefs: [],
    inputRefs: [],
    outputRefs: [],
    ruleRefs: [],
    truthClass: 'CONFIRMED',
    provenanceRefs: [pid(`prov-${seed}`)],
    sourceExtensionRefs: [],
  };
}

function edge(seed: string, source: ProcessNode, target: ProcessNode): ProcessEdge {
  return {
    id: cid(seed),
    sourceNodeId: source.id,
    targetNodeId: target.id,
    kind: 'SEQUENCE',
    truthClass: 'CONFIRMED',
    provenanceRefs: [pid(`prov-${seed}`)],
    sourceExtensionRefs: [],
  };
}

function simpleProcess(): ProcessRevision {
  const start = node('rt-start', 'EVENT', 'Start');
  const receive = node('rt-receive', 'ACTION', 'Receive Order');
  const end = node('rt-end', 'END', 'Order complete');
  return {
    id: cid('rt-process-v1'),
    processDefinitionId: cid('rt-definition'),
    revision: 1,
    createdAt: '2026-08-20T18:30:00.000Z',
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: [sid('rt-source')],
    nodes: [start, receive, end],
    edges: [edge('rt-e1', start, receive), edge('rt-e2', receive, end)],
    actors: [],
    variables: [],
    dataObjects: [],
    rules: [],
    semanticClaims: [],
    conflictRecords: [],
    annotations: [],
    provenanceLinks: [],
    sourceExtensions: [],
    semanticStatus: 'VALIDATED',
    executionReadiness: 'READY_FOR_AUTOMATION_DESIGN',
    validationFindingRefs: [],
  };
}

function projected() {
  const process = simpleProcess();
  const projection = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'IMAGE_INTERPRETATION',
    createdAt: '2026-08-20T18:31:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });
  return { process, projection };
}

test('I7B-04 generated Talos BPMN survives parse / serialize / parse without semantic or DI drift', async () => {
  const { projection } = projected();
  const inspection = await inspectBpmnXml(projection.bpmnRevision.bpmnXml);
  assert.deepEqual(inspection.processIds, ['Talos_Process']);
  assert.equal(inspection.hasDiagramInterchange, true);
  assert.ok(inspection.diagramIds.length > 0);
  assert.match(inspection.normalizedXml, /<bpmn:process[^>]+id="Talos_Process"/);
  const normalizedAgain = await inspectBpmnXml(inspection.normalizedXml);
  assert.equal(normalizedAgain.modelSemanticDigest, inspection.modelSemanticDigest);
  assert.equal(normalizedAgain.modelDiagramDigest, inspection.modelDiagramDigest);
});

test('I7B-04 graphical layout-only edit keeps the exact canonical business pin and remains confirmable', async () => {
  const { process, projection } = projected();
  const base = projection.bpmnRevision;
  const editedXml = base.bpmnXml.replace('<dc:Bounds x="120"', '<dc:Bounds x="160"');
  assert.notEqual(editedXml, base.bpmnXml);

  const result = await createBpmnRoundTripEdit({
    baseRevision: base,
    editedBpmnXml: editedXml,
    editMode: 'GRAPH_EDIT',
    createdAt: '2026-08-20T18:32:00.000Z',
    createdBy: 'business-user',
  });

  assert.equal(result.changeClass, 'VISUAL_ONLY');
  assert.equal(result.requiresCanonicalReconciliation, false);
  assert.equal(result.revision.canonicalAlignmentStatus, 'ALIGNED_TO_CANONICAL');
  assert.equal(result.revision.canonicalProcessRevisionId, process.id);
  assert.equal(result.revision.semanticDigest, base.semanticDigest);

  const confirmed = confirmBusinessProcess(result.revision, {
    canonicalProcessRevisionId: process.id,
    confirmedBy: 'business-user',
    confirmedAt: '2026-08-20T18:33:00.000Z',
    authorityRef: 'business-process-owner',
  });
  assert.equal(confirmed.revision.state, 'CONFIRMED');
});

test('I7B-04 semantic XML edit drops stale canonical authority until an explicit canonical reconciliation occurs', async () => {
  const { process, projection } = projected();
  const base = projection.bpmnRevision;
  const editedXml = base.bpmnXml.replace('name="Receive Order"', 'name="Validate Order"');
  assert.notEqual(editedXml, base.bpmnXml);

  const result = await createBpmnRoundTripEdit({
    baseRevision: base,
    editedBpmnXml: editedXml,
    editMode: 'XML_EDIT',
    createdAt: '2026-08-20T18:34:00.000Z',
    createdBy: 'business-user',
  });

  assert.equal(result.changeClass, 'SEMANTIC');
  assert.equal(result.requiresCanonicalReconciliation, true);
  assert.equal(result.revision.canonicalAlignmentStatus, 'REQUIRES_CANONICAL_RECONCILIATION');
  assert.equal(result.revision.canonicalProcessRevisionId, undefined);
  assert.throws(() => confirmBusinessProcess(result.revision, {
    canonicalProcessRevisionId: process.id,
    confirmedBy: 'business-user',
    confirmedAt: '2026-08-20T18:35:00.000Z',
    authorityRef: 'business-process-owner',
  }), /reconciled to a canonical ProcessRevision/);

  const reconciledProcessRevisionId = cid('rt-process-v2-after-bpmn-edit');
  const reconciled = alignBpmnRevisionToCanonical(result.revision, {
    canonicalProcessRevisionId: reconciledProcessRevisionId,
    alignedBy: 'talos-canonical-reconciler',
    alignedAt: '2026-08-20T18:36:00.000Z',
    authorityRef: 'business-process-owner',
  });
  assert.equal(reconciled.canonicalAlignmentStatus, 'ALIGNED_TO_CANONICAL');
  assert.equal(reconciled.canonicalProcessRevisionId, reconciledProcessRevisionId);
  const confirmed = confirmBusinessProcess(reconciled, {
    canonicalProcessRevisionId: reconciledProcessRevisionId,
    confirmedBy: 'business-user',
    confirmedAt: '2026-08-20T18:37:00.000Z',
    authorityRef: 'business-process-owner',
  });
  assert.equal(confirmed.revision.state, 'CONFIRMED');
});

test('I7B-04 native BPMN import preserves exact XML but cannot be confirmed before Talos canonicalization', async () => {
  const { projection } = projected();
  const nativeXml = projection.bpmnRevision.bpmnXml;
  const imported = await createNativeBpmnImportRevision({
    bpmnXml: nativeXml,
    sourceArtifactRefs: ['native-bpmn-source-01'],
    sourceRepresentationRefs: ['native-bpmn-representation-01'],
    createdAt: '2026-08-20T18:38:00.000Z',
    createdBy: 'business-user',
  });
  assert.equal(imported.revision.sourceRoute, 'NATIVE_BPMN');
  assert.equal(imported.revision.bpmnXml, nativeXml);
  assert.equal(imported.revision.canonicalProcessRevisionId, undefined);
  assert.equal(imported.revision.canonicalAlignmentStatus, 'REQUIRES_CANONICAL_RECONCILIATION');
  assert.throws(() => confirmBusinessProcess(imported.revision, {
    canonicalProcessRevisionId: cid('not-yet-canonicalized'),
    confirmedBy: 'business-user',
    confirmedAt: '2026-08-20T18:39:00.000Z',
    authorityRef: 'business-process-owner',
  }), /reconciled to a canonical ProcessRevision/);
});

test('I7B-04 malformed or non-process BPMN is rejected before a review revision can exist', async () => {
  await assert.rejects(() => inspectBpmnXml('<broken'), /unclosed|unexpected|parse|missing|attribute/i);
  await assert.rejects(() => createNativeBpmnImportRevision({
    bpmnXml: '<?xml version="1.0"?><bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="empty"/>',
    sourceArtifactRefs: ['empty-bpmn'],
    createdAt: '2026-08-20T18:40:00.000Z',
    createdBy: 'business-user',
  }), /at least one bpmn:Process/);
});
