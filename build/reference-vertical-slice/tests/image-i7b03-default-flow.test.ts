import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import type { BusinessRule, ProcessEdge, ProcessNode, ProcessRevision } from '../packages/semantic-core/src/types.ts';
import { projectCanonicalProcessToBpmn } from '../packages/review/src/bpmn-projector.ts';

const cid = (seed: string) => createOpaqueId('canonical', seed);
const pid = (seed: string) => createOpaqueId('provenance', seed);
const sid = (seed: string) => createOpaqueId('source', seed);

function makeNode(seed: string, kind: ProcessNode['kind'], name: string): ProcessNode {
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

function makeProcess(defaultCarriesRule = false): { process: ProcessRevision; decision: ProcessNode; defaultEdge: ProcessEdge } {
  const start = makeNode('default-start', 'EVENT', 'Start');
  const decision = makeNode('default-decision', 'DECISION', 'Eligible?');
  const approved = makeNode('default-approved', 'ACTION', 'Approve');
  const fallback = makeNode('default-fallback', 'ACTION', 'Manual Review');
  const end = makeNode('default-end', 'END', 'Done');
  const trueRule: BusinessRule = {
    id: cid('default-true-rule'),
    naturalLanguage: 'eligible equals true',
    expression: { fact: 'eligible', operator: 'EQUALS', value: true },
    inputs: [],
    truthClass: 'CONFIRMED',
    unresolvedTerms: [],
    provenanceRefs: [pid('prov-default-rule')],
  };
  const edge = (seed: string, source: ProcessNode, target: ProcessNode, kind: ProcessEdge['kind'], conditionRuleRef?: ReturnType<typeof cid>): ProcessEdge => ({
    id: cid(seed),
    sourceNodeId: source.id,
    targetNodeId: target.id,
    kind,
    ...(conditionRuleRef ? { conditionRuleRef } : {}),
    truthClass: 'CONFIRMED',
    provenanceRefs: [pid(`prov-${seed}`)],
    sourceExtensionRefs: [],
  });
  const defaultEdge = edge(
    'default-edge',
    decision,
    fallback,
    'DEFAULT',
    defaultCarriesRule ? trueRule.id : undefined,
  );
  const process: ProcessRevision = {
    id: cid('default-process'),
    processDefinitionId: cid('default-definition'),
    revision: 1,
    createdAt: '2026-08-20T18:10:00.000Z',
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: [sid('default-source')],
    nodes: [start, decision, approved, fallback, end],
    edges: [
      edge('default-e1', start, decision, 'SEQUENCE'),
      edge('default-e2', decision, approved, 'CONDITIONAL', trueRule.id),
      defaultEdge,
      edge('default-e4', approved, end, 'SEQUENCE'),
      edge('default-e5', fallback, end, 'SEQUENCE'),
    ],
    actors: [],
    variables: [],
    dataObjects: [],
    rules: [trueRule],
    semanticClaims: [],
    conflictRecords: [],
    annotations: [],
    provenanceLinks: [],
    sourceExtensions: [],
    semanticStatus: 'VALIDATED',
    executionReadiness: 'READY_FOR_AUTOMATION_DESIGN',
    validationFindingRefs: [],
  };
  return { process, decision, defaultEdge };
}

test('I7B-03 canonical DEFAULT branch is emitted as an actual BPMN default flow', () => {
  const { process, decision, defaultEdge } = makeProcess();
  const result = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'TALOS_CANVAS',
    createdAt: '2026-08-20T18:11:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });
  const decisionMapping = result.elementMappings.find((mapping) => mapping.canonicalRef === decision.id)!;
  const defaultMapping = result.elementMappings.find((mapping) => mapping.canonicalRef === defaultEdge.id)!;
  assert.ok(decisionMapping);
  assert.ok(defaultMapping);
  assert.match(
    result.bpmnRevision.bpmnXml,
    new RegExp(`<bpmn:exclusiveGateway id="${decisionMapping.bpmnElementId}"[^>]*default="${defaultMapping.bpmnElementId}"`),
  );
});

test('I7B-03 contradictory DEFAULT + condition rule is surfaced and not projected', () => {
  const { process, defaultEdge } = makeProcess(true);
  const result = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'TALOS_CANVAS',
    createdAt: '2026-08-20T18:12:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });
  assert.ok(result.unprojectableCanonicalRefs.includes(defaultEdge.id));
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === 'DEFAULT_EDGE_HAS_CONDITION_RULE' && diagnostic.targetRef === defaultEdge.id));
  assert.equal(result.elementMappings.some((mapping) => mapping.canonicalRef === defaultEdge.id), false);
});
