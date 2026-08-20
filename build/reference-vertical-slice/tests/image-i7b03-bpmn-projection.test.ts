import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import type {
  BusinessRule,
  ProcessEdge,
  ProcessNode,
  ProcessRevision,
} from '../packages/semantic-core/src/types.ts';
import { projectCanonicalProcessToBpmn } from '../packages/review/src/bpmn-projector.ts';

const cid = (seed: string) => createOpaqueId('canonical', seed);
const pid = (seed: string) => createOpaqueId('provenance', seed);
const sid = (seed: string) => createOpaqueId('source', seed);

function node(seed: string, kind: ProcessNode['kind'], name: string, extras: Partial<ProcessNode> = {}): ProcessNode {
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
    ...extras,
  };
}

function rule(seed: string, fact: string, value: boolean): BusinessRule {
  return {
    id: cid(seed),
    naturalLanguage: `${fact} equals ${value}`,
    expression: { fact, operator: 'EQUALS', value },
    inputs: [],
    truthClass: 'CONFIRMED',
    unresolvedTerms: [],
    provenanceRefs: [pid(`prov-${seed}`)],
  };
}

function edge(
  seed: string,
  source: ProcessNode,
  target: ProcessNode,
  kind: ProcessEdge['kind'] = 'SEQUENCE',
  conditionRuleRef?: ReturnType<typeof cid>,
): ProcessEdge {
  return {
    id: cid(seed),
    sourceNodeId: source.id,
    targetNodeId: target.id,
    kind,
    ...(conditionRuleRef ? { conditionRuleRef } : {}),
    truthClass: 'CONFIRMED',
    provenanceRefs: [pid(`prov-${seed}`)],
    sourceExtensionRefs: [],
  };
}

function revision(input: {
  seed: string;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  rules?: BusinessRule[];
}): ProcessRevision {
  return {
    id: cid(`process-${input.seed}`),
    processDefinitionId: cid(`definition-${input.seed}`),
    revision: 1,
    createdAt: '2026-08-20T18:05:00.000Z',
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: [sid(`source-${input.seed}`)],
    nodes: input.nodes,
    edges: input.edges,
    actors: [],
    variables: [],
    dataObjects: [],
    rules: input.rules ?? [],
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

function quarry01LikeProcess(): ProcessRevision {
  const start = node('q01-start', 'EVENT', 'Order received');
  const receive = node('q01-receive', 'ACTION', 'Receive Order');
  const checkCredit = node('q01-credit', 'ACTION', 'Check Credit');
  const creditDecision = node('q01-credit-ok', 'DECISION', 'Credit ok?');
  const failed = node('q01-failed', 'END', 'Order Failed');
  const fulfill = node('q01-fulfill', 'ACTION', 'Fulfill Order');
  const fulfilledDecision = node('q01-fulfilled-ok', 'DECISION', 'Fulfilled ok?');
  const invoice = node('q01-invoice', 'ACTION', 'Send invoice');
  const complete = node('q01-complete', 'END', 'Order complete');

  const creditFalse = rule('rule-credit-false', 'creditOk', false);
  const creditTrue = rule('rule-credit-true', 'creditOk', true);
  const fulfilledFalse = rule('rule-fulfilled-false', 'fulfilledOk', false);
  const fulfilledTrue = rule('rule-fulfilled-true', 'fulfilledOk', true);

  return revision({
    seed: 'q01',
    nodes: [start, receive, checkCredit, creditDecision, failed, fulfill, fulfilledDecision, invoice, complete],
    rules: [creditFalse, creditTrue, fulfilledFalse, fulfilledTrue],
    edges: [
      edge('q01-e1', start, receive),
      edge('q01-e2', receive, checkCredit),
      edge('q01-e3', checkCredit, creditDecision),
      edge('q01-e4', creditDecision, failed, 'CONDITIONAL', creditFalse.id),
      edge('q01-e5', creditDecision, fulfill, 'CONDITIONAL', creditTrue.id),
      edge('q01-e6', fulfill, fulfilledDecision),
      edge('q01-e7', fulfilledDecision, failed, 'CONDITIONAL', fulfilledFalse.id),
      edge('q01-e8', fulfilledDecision, invoice, 'CONDITIONAL', fulfilledTrue.id),
      edge('q01-e9', invoice, complete),
    ],
  });
}

test('I7B-03 Quarry-01-like confirmed canonical graph projects to a non-executable BPMN review candidate', () => {
  const process = quarry01LikeProcess();
  const result = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'IMAGE_INTERPRETATION',
    createdAt: '2026-08-20T18:06:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });

  assert.equal(result.bpmnRevision.state, 'DRAFT');
  assert.equal(result.bpmnRevision.canonicalProcessRevisionId, process.id);
  assert.match(result.bpmnRevision.bpmnXml, /<bpmn:process id="Talos_Process" isExecutable="false">/);
  assert.match(result.bpmnRevision.bpmnXml, /<bpmn:startEvent/);
  assert.match(result.bpmnRevision.bpmnXml, /<bpmn:task[^>]+name="Receive Order"/);
  assert.match(result.bpmnRevision.bpmnXml, /<bpmn:exclusiveGateway[^>]+name="Credit ok\?"/);
  assert.match(result.bpmnRevision.bpmnXml, /<bpmn:endEvent[^>]+name="Order complete"/);
  assert.equal(result.unprojectableCanonicalRefs.length, 0);
});

test('I7B-03 conditional flows carry exact canonical BusinessRule references and structured expressions, not guessed branch labels', () => {
  const process = quarry01LikeProcess();
  const result = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'IMAGE_INTERPRETATION',
    createdAt: '2026-08-20T18:06:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });
  for (const rule of process.rules) {
    assert.match(result.bpmnRevision.bpmnXml, new RegExp(`businessRuleRef canonicalRef="${rule.id}"`));
  }
  assert.match(result.bpmnRevision.bpmnXml, /&quot;fact&quot;:&quot;creditOk&quot;/);
  assert.doesNotMatch(result.bpmnRevision.bpmnXml, /name="Yes"|name="No"/);
});

test('I7B-03 BPMN element mappings retain canonical and backward source provenance identities', () => {
  const process = quarry01LikeProcess();
  const result = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'IMAGE_INTERPRETATION',
    createdAt: '2026-08-20T18:06:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });
  const receive = process.nodes.find((candidate) => candidate.name === 'Receive Order')!;
  const mapping = result.elementMappings.find((candidate) => candidate.canonicalRef === receive.id)!;
  assert.ok(mapping);
  assert.deepEqual(mapping.provenanceRefs, receive.provenanceRefs);
  assert.deepEqual(mapping.sourceArtifactIds, process.sourceArtifactIds);
  assert.notEqual(mapping.bpmnElementId, receive.id);
});

test('I7B-03 repeated projection of the same immutable canonical meaning is deterministic', () => {
  const process = quarry01LikeProcess();
  const project = () => projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'TALOS_CANVAS',
    createdAt: '2026-08-20T18:06:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });
  const first = project();
  const second = project();
  assert.equal(first.bpmnRevision.bpmnXml, second.bpmnRevision.bpmnXml);
  assert.equal(first.bpmnRevision.bpmnXmlSha256, second.bpmnRevision.bpmnXmlSha256);
  assert.equal(first.bpmnRevision.semanticDigest, second.bpmnRevision.semanticDigest);
  assert.equal(first.bpmnRevision.diagramDigest, second.bpmnRevision.diagramDigest);
  assert.equal(first.bpmnRevision.id, second.bpmnRevision.id);
});

test('I7B-03 Quarry-02-style incomplete WAIT is visible for business review but never fabricated into a BPMN timer', () => {
  const start = node('q02-start', 'EVENT', 'Order placed');
  const forward = node('q02-forward', 'ACTION', 'Forward Order');
  const wait = node('q02-wait', 'WAIT', 'On Next Wednesday', {
    details: { waitKind: 'SCHEDULE', timezone: 'UNKNOWN', expression: 'UNKNOWN' },
    executionReadiness: 'INSUFFICIENT_DETAIL',
  });
  const deliver = node('q02-deliver', 'ACTION', 'Deliver Water');
  const end = node('q02-end', 'END', 'Order fulfilled');
  const process = revision({
    seed: 'q02',
    nodes: [start, forward, wait, deliver, end],
    edges: [
      edge('q02-e1', start, forward),
      edge('q02-e2', forward, wait),
      edge('q02-e3', wait, deliver),
      edge('q02-e4', deliver, end),
    ],
  });
  process.executionReadiness = 'INSUFFICIENT_DETAIL';

  const result = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'IMAGE_INTERPRETATION',
    createdAt: '2026-08-20T18:07:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });
  assert.match(result.bpmnRevision.bpmnXml, /<bpmn:intermediateCatchEvent[^>]+name="On Next Wednesday"/);
  assert.doesNotMatch(result.bpmnRevision.bpmnXml, /timerEventDefinition/);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === 'WAIT_EXECUTION_TIMING_NOT_MATERIALIZED' && diagnostic.targetRef === wait.id));
});

test('I7B-03 unsupported canonical meaning is surfaced instead of silently dropped or coerced', () => {
  const start = node('unsupported-start', 'EVENT', 'Start');
  const state = node('unsupported-state', 'STATE', 'Inventory stable');
  const end = node('unsupported-end', 'END', 'Done');
  const process = revision({
    seed: 'unsupported',
    nodes: [start, state, end],
    edges: [edge('unsupported-e1', start, state), edge('unsupported-e2', state, end)],
  });
  const result = projectCanonicalProcessToBpmn({
    processRevision: process,
    sourceRoute: 'TALOS_CANVAS',
    createdAt: '2026-08-20T18:08:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });
  assert.ok(result.unprojectableCanonicalRefs.includes(state.id));
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === 'UNSUPPORTED_NODE_KIND' && diagnostic.targetRef === state.id));
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === 'UNPROJECTABLE_EDGE_ENDPOINT'));
  assert.doesNotMatch(result.bpmnRevision.bpmnXml, /Inventory stable/);
});
