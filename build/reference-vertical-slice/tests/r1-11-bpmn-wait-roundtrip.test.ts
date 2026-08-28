import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { buildBpmnCanonicalSourceView } from '../packages/review/src/bpmn-canonical-source-view.ts';
import { projectCanonicalProcessToBpmn } from '../packages/review/src/bpmn-projector.ts';
import type { ProcessEdge, ProcessNode, ProcessRevision } from '../packages/semantic-core/src/types.ts';

const cid = (seed: string) => createOpaqueId('canonical', seed);
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
    provenanceRefs: [],
    sourceExtensionRefs: [],
  };
}

function edge(
  seed: string,
  source: ProcessNode,
  target: ProcessNode,
  kind: ProcessEdge['kind'] = 'SEQUENCE',
  label?: string,
): ProcessEdge {
  return {
    id: cid(seed),
    sourceNodeId: source.id,
    targetNodeId: target.id,
    kind,
    ...(label ? { label } : {}),
    truthClass: 'CONFIRMED',
    provenanceRefs: [],
    sourceExtensionRefs: [],
  };
}

function processFixture() {
  const start = node('roundtrip-start', 'EVENT', 'Start');
  const prepare = node('roundtrip-prepare', 'ACTION', 'Prepare work');
  const decision = node('roundtrip-decision', 'DECISION', 'Is extra treatment required?');
  const wait = node('roundtrip-wait', 'WAIT', 'Wait for treatment');
  const intermediateEvent = node('roundtrip-event', 'EVENT', 'External acknowledgement');
  const end = node('roundtrip-end', 'END', 'Complete');
  const yes = edge('roundtrip-yes', decision, wait, 'CONDITIONAL', 'Yes');
  const no = edge('roundtrip-no', decision, intermediateEvent, 'CONDITIONAL', 'No');
  const process: ProcessRevision = {
    id: cid('roundtrip-process-v1'),
    processDefinitionId: cid('roundtrip-definition'),
    revision: 1,
    createdAt: '2026-08-28T22:10:00.000Z',
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: [sid('roundtrip-source')],
    nodes: [start, prepare, decision, wait, intermediateEvent, end],
    edges: [
      edge('roundtrip-e1', start, prepare),
      edge('roundtrip-e2', prepare, decision),
      yes,
      no,
      edge('roundtrip-e5', wait, end),
      edge('roundtrip-e6', intermediateEvent, end),
    ],
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
  return { process, wait, intermediateEvent, yes, no };
}

function bpmnNodeId(node: ProcessNode): string {
  return `Node_${node.id}`;
}

function bpmnFlowId(flow: ProcessEdge): string {
  return `Flow_${flow.id}`;
}

function addCondition(xml: string, flow: ProcessEdge, condition: string): string {
  const id = bpmnFlowId(flow);
  const marker = `<bpmn:sequenceFlow id="${id}"`;
  const start = xml.indexOf(marker);
  assert.notEqual(start, -1, `missing projected flow ${id}`);
  const openEnd = xml.indexOf('>', start);
  const close = xml.indexOf('</bpmn:sequenceFlow>', openEnd);
  assert.notEqual(openEnd, -1);
  assert.notEqual(close, -1);
  const expression = `<bpmn:conditionExpression xsi:type="bpmn:tFormalExpression" language="urn:talos:natural-language-condition">${condition}</bpmn:conditionExpression>`;
  return `${xml.slice(0, openEnd + 1)}${expression}${xml.slice(openEnd + 1, close)}${xml.slice(close)}`;
}

async function post(baseUrl: string, pathname: string, payload: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { response, body: await response.json() as any };
}

test('R1-11 Talos-projected WAIT uses standard BPMN timer evidence while a non-start EVENT remains a plain intermediate catch event', async () => {
  const { process, wait, intermediateEvent } = processFixture();
  const projection = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'IMAGE_INTERPRETATION',
    createdAt: '2026-08-28T22:11:00.000Z',
    createdBy: 'talos-projector-test',
  });

  const view = await buildBpmnCanonicalSourceView(projection.bpmnRevision.bpmnXml);
  const nodes = view.processes[0]!.nodes;
  const projectedWait = nodes.find((item) => item.id === bpmnNodeId(wait));
  const projectedEvent = nodes.find((item) => item.id === bpmnNodeId(intermediateEvent));

  assert.equal(projectedWait?.type, 'bpmn:IntermediateCatchEvent');
  assert.deepEqual(projectedWait?.eventDefinitionTypes, ['bpmn:TimerEventDefinition']);
  assert.equal(projectedEvent?.type, 'bpmn:IntermediateCatchEvent');
  assert.deepEqual(projectedEvent?.eventDefinitionTypes, []);
  assert.match(projection.bpmnRevision.bpmnXml, /<bpmn:timerEventDefinition\s*\/>/);
});

test('R1-11 branch-condition correction roundtrip preserves WAIT and EVENT semantics instead of blocking on IntermediateCatchEvent', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11-wait-roundtrip-'));
  const app = await startTalosOneApp({ runtimeDir });
  try {
    const { process, wait, intermediateEvent, yes, no } = processFixture();
    const projection = projectCanonicalProcessToBpmn({
      processRevision: process,
      sourceRoute: 'IMAGE_INTERPRETATION',
      createdAt: '2026-08-28T22:12:00.000Z',
      createdBy: 'talos-projector-test',
    });

    const imported = await post(app.baseUrl, '/api/input/bpmn', {
      fileName: 'generic-branch-wait.bpmn',
      bpmnXml: projection.bpmnRevision.bpmnXml,
      initiatedBy: 'r1-11-field-user',
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.body.reconciliation.status, 'RECONCILED');
    const importedNodes = imported.body.reconciliation.processRevision.nodes;
    assert.equal(importedNodes.find((item: any) => item.name === wait.name)?.kind, 'WAIT');
    assert.equal(importedNodes.find((item: any) => item.name === intermediateEvent.name)?.kind, 'EVENT');

    let correctedXml = addCondition(projection.bpmnRevision.bpmnXml, yes, 'Yes');
    correctedXml = addCondition(correctedXml, no, 'No');
    const corrected = await post(app.baseUrl, '/api/bpmn/edit', {
      baseRevisionId: imported.body.revision.id,
      bpmnXml: correctedXml,
      editMode: 'XML_EDIT',
      editedBy: 'r1-11-field-user',
    });

    assert.equal(corrected.response.status, 201);
    assert.equal(corrected.body.status, 'CORRECTED_PROCESS_REVIEW_REQUIRED');
    assert.equal(corrected.body.reconciliation.status, 'RECONCILED');
    assert.equal(
      corrected.body.reconciliation.diagnostics?.some((item: any) => item.code === 'UNSUPPORTED_BPMN_ELEMENT'),
      false,
    );
    const correctedNodes = corrected.body.reconciliation.processRevision.nodes;
    assert.equal(correctedNodes.find((item: any) => item.name === wait.name)?.kind, 'WAIT');
    assert.equal(correctedNodes.find((item: any) => item.name === intermediateEvent.name)?.kind, 'EVENT');
    assert.deepEqual(
      corrected.body.reconciliation.processRevision.rules.map((rule: any) => rule.naturalLanguage).sort(),
      ['No', 'Yes'],
    );
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
