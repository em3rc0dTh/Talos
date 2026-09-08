import test from 'node:test';
import assert from 'node:assert/strict';
import { assessAutomationHandoffTopology } from '../packages/application/src/bpmn-freeze-handoff.ts';
import type { ProcessRevision } from '../packages/semantic-core/src/types.ts';

function process(nodes: Array<{ id: string; kind: 'EVENT'|'ACTION'|'END'; name: string }>, edges: Array<[string,string]>): ProcessRevision {
  return {
    id: 'prc_topology' as any,
    processDefinitionId: 'prc_topology_definition' as any,
    revision: 1,
    createdAt: '2026-09-08T15:00:00.000Z',
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: ['src_topology' as any],
    nodes: nodes.map((node) => ({
      id: node.id as any,
      kind: node.kind,
      name: node.name,
      actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [],
      truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [],
    })),
    edges: edges.map(([source,target], index) => ({
      id: `edge_${index}` as any,
      sourceNodeId: source as any,
      targetNodeId: target as any,
      kind: 'SEQUENCE',
      truthClass: 'CONFIRMED',
      provenanceRefs: [],
      sourceExtensionRefs: [],
    })),
    actors: [], variables: [], dataObjects: [], rules: [], semanticClaims: [],
    conflictRecords: [], annotations: [], provenanceLinks: [], sourceExtensions: [],
    semanticStatus: 'VALIDATED',
    executionReadiness: 'READY_FOR_AUTOMATION_DESIGN',
    validationFindingRefs: [],
  };
}

test('R1-11 canonical handoff accepts one connected entry-to-END process', () => {
  const candidate = process([
    { id: 'start', kind: 'EVENT', name: 'Start' },
    { id: 'name', kind: 'ACTION', name: 'Request name' },
    { id: 'save', kind: 'ACTION', name: 'Save Data' },
    { id: 'end', kind: 'END', name: 'End' },
  ], [
    ['start','name'],
    ['name','save'],
    ['save','end'],
  ]);
  assert.deepEqual(assessAutomationHandoffTopology(candidate), []);
});

test('R1-11 canonical handoff rejects the disconnected field-trial shape even after business confirmation', () => {
  const malformed = process([
    { id: 'start', kind: 'EVENT', name: 'Start' },
    { id: 'name', kind: 'ACTION', name: 'Request name' },
    { id: 'phone', kind: 'ACTION', name: 'Request Phone number' },
    { id: 'id', kind: 'ACTION', name: 'Request ID (optional)' },
    { id: 'end', kind: 'END', name: 'End' },
  ], [
    ['start','name'],
    ['name','phone'],
    ['phone','id'],
  ]);
  const diagnostics = assessAutomationHandoffTopology(malformed);
  assert.ok(diagnostics.includes('AUTOMATION_HANDOFF_REQUIRES_SINGLE_CONNECTED_PROCESS_ENTRY'));
  assert.ok(diagnostics.includes('AUTOMATION_HANDOFF_END_REQUIRES_INCOMING_FLOW'));
  assert.ok(diagnostics.includes('AUTOMATION_HANDOFF_NON_TERMINAL_DEAD_END'));
});

test('R1-11 canonical handoff rejects a disconnected island even when every node has a local relation', () => {
  const malformed = process([
    { id: 'start', kind: 'EVENT', name: 'Start' },
    { id: 'a', kind: 'ACTION', name: 'A' },
    { id: 'end', kind: 'END', name: 'End' },
    { id: 'islandA', kind: 'ACTION', name: 'Island A' },
    { id: 'islandB', kind: 'ACTION', name: 'Island B' },
  ], [
    ['start','a'],
    ['a','end'],
    ['islandA','islandB'],
    ['islandB','islandA'],
  ]);
  const diagnostics = assessAutomationHandoffTopology(malformed);
  assert.ok(diagnostics.includes('AUTOMATION_HANDOFF_REJECTS_DISCONNECTED_PROCESS_GRAPH'));
});
