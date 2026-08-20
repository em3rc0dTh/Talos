import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { validateProcessRevision, SEMANTIC_RULESET_VERSION, SEMANTIC_VALIDATOR_VERSION } from '../packages/semantic-core/src/validation.ts';
import type { Actor, ProcessEdge, ProcessNode, ProcessRevision, SemanticClaim } from '../packages/semantic-core/src/types.ts';

const cid = (seed: string) => createOpaqueId('canonical', `vcon:${seed}`);
const pid = (seed: string) => createOpaqueId('provenance', `vcon:${seed}`);
const sid = (seed: string) => createOpaqueId('source', `vcon:${seed}`);

function node(seed: string, kind: ProcessNode['kind'], extra: Partial<ProcessNode> = {}): ProcessNode {
  return {
    id: cid(`node:${seed}`),
    kind,
    name: seed,
    actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [],
    truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [],
    ...extra,
  };
}

function edge(seed: string, source: ProcessNode, target: ProcessNode, kind: ProcessEdge['kind'] = 'SEQUENCE'): ProcessEdge {
  return { id: cid(`edge:${seed}`), sourceNodeId: source.id, targetNodeId: target.id, kind, truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [] };
}

function revision(seed: string, nodes: ProcessNode[], edges: ProcessEdge[], options: { actors?: Actor[]; claims?: SemanticClaim[] } = {}): ProcessRevision {
  return {
    id: cid(`revision:${seed}`), processDefinitionId: cid(`definition:${seed}`), revision: 1,
    createdAt: '2026-08-20T05:30:00.000Z', parentRevisionIds: [], derivationKind: 'HUMAN_CONFIRMATION', sourceArtifactIds: [sid(`artifact:${seed}`)],
    nodes, edges, actors: options.actors ?? [], variables: [], dataObjects: [], rules: [], semanticClaims: options.claims ?? [], conflictRecords: [], annotations: [], provenanceLinks: [], sourceExtensions: [],
    semanticStatus: 'NORMALIZED', executionReadiness: 'NOT_ASSESSED', validationFindingRefs: [],
  };
}

function codes(result: ReturnType<typeof validateProcessRevision>) { return result.findings.map((finding) => finding.code); }
function confirmedClaim(seed: string, subjectRef: string, propertyPath: string, value: unknown): SemanticClaim {
  return { id: pid(`claim:${seed}`), subjectRef, propertyPath, value, perspective: 'BUSINESS_INTENT', truthClass: 'CONFIRMED', evidenceFragmentRefs: [], provenanceLinkRefs: [], createdAt: '2026-08-20T05:30:00.000Z' };
}

test('VCON-01 keeps frozen ruleset v0.2 while versioning only the reference validator implementation', () => {
  assert.equal(SEMANTIC_RULESET_VERSION, 'semantic-validation-v0.2');
  assert.equal(SEMANTIC_VALIDATOR_VERSION, 'talos-semantic-validator-reference-0.3');
});

test('VCON-02 zero-incoming work is not silently promoted to process entry', () => {
  const action = node('Receive request', 'ACTION');
  const end = node('Done', 'END');
  const result = validateProcessRevision(revision('entry-missing', [action, end], [edge('a-end', action, end)]));
  assert.ok(codes(result).includes('SV-STR-001'));
  assert.equal(result.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
  assert.equal(result.assessment.semanticVerdict, 'VALID_WITH_FINDINGS');

  const start = node('Request received', 'EVENT');
  const explicit = validateProcessRevision(revision('entry-event', [start, action, end], [edge('start-a', start, action), edge('a-end2', action, end)]));
  assert.equal(codes(explicit).includes('SV-STR-001'), false);
});

test('VCON-03 message interaction requires an accepted correlation identity', () => {
  const start = node('Start', 'EVENT');
  const receive = node('Receive', 'ACTION');
  const end = node('Done', 'END');
  const message = edge('message', start, receive, 'MESSAGE');
  const flow = edge('receive-end', receive, end);
  const missing = revision('correlation-missing', [start, receive, end], [message, flow]);
  const missingResult = validateProcessRevision(missing);
  assert.ok(codes(missingResult).includes('SV-COR-001'));
  assert.equal(missingResult.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');

  const claim = confirmedClaim('correlation', missing.id, 'process.correlationIdentity', 'orderId');
  const accepted = validateProcessRevision({ ...missing, id: cid('revision:correlation-accepted'), semanticClaims: [claim] });
  assert.equal(codes(accepted).includes('SV-COR-001'), false);
});

test('VCON-04 WAIT classification and complete calendar semantics remain explicit', () => {
  const start = node('Start', 'EVENT');
  const waitUnknown = node('Wait', 'WAIT');
  const end = node('Done', 'END');
  const baseEdges = [edge('start-wait', start, waitUnknown), edge('wait-end', waitUnknown, end)];
  const unknown = validateProcessRevision(revision('wait-unknown', [start, waitUnknown, end], baseEdges));
  assert.ok(codes(unknown).includes('SV-EVT-001'));
  assert.equal(unknown.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');

  const scheduled = { ...waitUnknown, id: cid('node:scheduled'), details: { waitKind: 'SCHEDULE' } };
  const scheduledResult = validateProcessRevision(revision('wait-schedule', [start, scheduled, end], [edge('s-scheduled', start, scheduled), edge('scheduled-end', scheduled, end)]));
  assert.ok(codes(scheduledResult).includes('SV-EVT-002'));

  const complete = { ...scheduled, id: cid('node:complete-wait'), details: { waitKind: 'SCHEDULE', expression: 'NEXT_WEDNESDAY 09:00', timezone: 'America/Lima' } };
  const completeResult = validateProcessRevision(revision('wait-complete', [start, complete, end], [edge('s-complete', start, complete), edge('complete-end', complete, end)]));
  assert.equal(codes(completeResult).includes('SV-EVT-001'), false);
  assert.equal(codes(completeResult).includes('SV-EVT-002'), false);
});

test('VCON-05 collapsed subprocess boundary does not imply known internals', () => {
  const start = node('Start', 'EVENT');
  const collapsed = node('Arrange delivery', 'SUBPROCESS', { details: { subprocessMode: 'COLLAPSED_SUBPROCESS' } });
  const end = node('Done', 'END');
  const missing = validateProcessRevision(revision('sub-missing', [start, collapsed, end], [edge('s-sub', start, collapsed), edge('sub-end', collapsed, end)]));
  assert.ok(codes(missing).includes('SV-SUB-001'));
  assert.equal(codes(missing).includes('SV-SUB-002'), false);

  const known = { ...collapsed, id: cid('node:known-sub'), details: { subprocessMode: 'COLLAPSED_SUBPROCESS', internalSemantics: { definitionRef: 'review-authored-arrange-delivery-v1' } } };
  const accepted = validateProcessRevision(revision('sub-known', [start, known, end], [edge('s-known', start, known), edge('known-end', known, end)]));
  assert.equal(codes(accepted).includes('SV-SUB-001'), false);
});

test('VCON-06 human/physical assignment requires a business completion-observation contract', () => {
  const worker: Actor = { id: cid('actor:worker'), kind: 'HUMAN_ROLE', name: 'Worker', sourceReferences: [], provenanceRefs: [] };
  const start = node('Start', 'EVENT');
  const delivery = node('Deliver', 'ACTION', { actorRefs: [worker.id] });
  const end = node('Done', 'END');
  const missing = validateProcessRevision(revision('human-missing', [start, delivery, end], [edge('s-deliver', start, delivery), edge('deliver-end', delivery, end)], { actors: [worker] }));
  assert.ok(codes(missing).includes('SV-HUM-001'));
  assert.equal(missing.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');

  const observable = { ...delivery, id: cid('node:observable-delivery'), details: { completionObservation: { kind: 'HUMAN_CONFIRMATION', outcome: 'DELIVERED' } } };
  const accepted = validateProcessRevision(revision('human-observable', [start, observable, end], [edge('s-observable', start, observable), edge('observable-end', observable, end)], { actors: [worker] }));
  assert.equal(codes(accepted).includes('SV-HUM-001'), false);
});
