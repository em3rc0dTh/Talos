import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import {
  classifyBpmnChange,
  confirmBusinessProcess,
  createBpmnProcessRevision,
  decideNaturalLanguageBpmnCorrection,
  evaluateAutomationHandoffConfirmation,
  proposeNaturalLanguageBpmnCorrection,
  revokeBusinessProcessConfirmation,
} from '../packages/review/src/bpmn-confirmation.ts';

const processRevisionId = createOpaqueId('canonical', 'i7b02-confirmed-process');
const xmlV1 = '<?xml version="1.0"?><definitions><process id="p1"><startEvent id="start"/><task id="receive" name="Receive Order"/><endEvent id="end"/></process><BPMNDiagram id="d1"/></definitions>';

function baseRevision() {
  return createBpmnProcessRevision({
    revisionNumber: 1,
    sourceRoute: 'IMAGE_INTERPRETATION',
    editMode: 'INITIAL_PROJECTION',
    sourceArtifactRefs: ['src-artifact-image-01'],
    sourceRepresentationRefs: ['src-representation-image-01'],
    canonicalProcessRevisionId: processRevisionId,
    bpmnXml: xmlV1,
    semanticDigest: 'sem-receive-order-v1',
    diagramDigest: 'di-layout-v1',
    createdAt: '2026-08-20T17:50:00.000Z',
    createdBy: 'talos-bpmn-projector',
  });
}

test('I7B-02 creates an explicit BPMN review revision pinned to source and canonical meaning', () => {
  const revision = baseRevision();
  assert.equal(revision.sourceRoute, 'IMAGE_INTERPRETATION');
  assert.equal(revision.state, 'DRAFT');
  assert.equal(revision.sourceArtifactRefs[0], 'src-artifact-image-01');
  assert.equal(revision.canonicalProcessRevisionId, processRevisionId);
  assert.equal(revision.bpmnXmlSha256.length, 64);
});

test('I7B-02 distinguishes visual-only BPMN-DI edits from semantic edits', () => {
  const base = baseRevision();
  const visual = createBpmnProcessRevision({
    revisionNumber: 2,
    parentBpmnRevisionId: base.id,
    sourceRoute: base.sourceRoute,
    editMode: 'GRAPH_EDIT',
    canonicalProcessRevisionId: processRevisionId,
    bpmnXml: xmlV1.replace('BPMNDiagram id="d1"', 'BPMNDiagram id="d2"'),
    semanticDigest: base.semanticDigest,
    diagramDigest: 'di-layout-v2',
    createdAt: '2026-08-20T17:51:00.000Z',
    createdBy: 'business-user',
  });
  const semantic = createBpmnProcessRevision({
    revisionNumber: 3,
    parentBpmnRevisionId: visual.id,
    sourceRoute: base.sourceRoute,
    editMode: 'GRAPH_EDIT',
    canonicalProcessRevisionId: processRevisionId,
    bpmnXml: xmlV1.replace('Receive Order', 'Validate Order'),
    semanticDigest: 'sem-validate-order-v2',
    diagramDigest: visual.diagramDigest,
    createdAt: '2026-08-20T17:52:00.000Z',
    createdBy: 'business-user',
  });
  assert.equal(classifyBpmnChange(base, visual), 'VISUAL_ONLY');
  assert.equal(classifyBpmnChange(visual, semantic), 'SEMANTIC');
});

test('I7B-02 natural-language correction is proposal-only until explicit authority accepts it', () => {
  const base = baseRevision();
  const proposed = createBpmnProcessRevision({
    revisionNumber: 2,
    parentBpmnRevisionId: base.id,
    sourceRoute: base.sourceRoute,
    editMode: 'NATURAL_LANGUAGE_PATCH',
    canonicalProcessRevisionId: processRevisionId,
    bpmnXml: xmlV1.replace('</process>', '<userTask id="manager" name="Manager Approval"/></process>'),
    semanticDigest: 'sem-manager-approval-v2',
    diagramDigest: 'di-manager-approval-v2',
    createdAt: '2026-08-20T17:53:00.000Z',
    createdBy: 'talos-language-correction-agent',
  });
  const proposal = proposeNaturalLanguageBpmnCorrection({
    baseRevision: base,
    proposedRevision: proposed,
    instruction: 'Add manager approval before continuing.',
    requestedBy: 'business-user',
    proposedAt: '2026-08-20T17:53:01.000Z',
  });
  assert.equal(proposal.status, 'PROPOSED');
  assert.equal(proposal.automaticApplyAuthorized, false);
  assert.throws(() => decideNaturalLanguageBpmnCorrection(proposal, 'ACCEPT', {
    decidedBy: 'business-user',
    decidedAt: '2026-08-20T17:54:00.000Z',
  }), /authorityRef/);
  const accepted = decideNaturalLanguageBpmnCorrection(proposal, 'ACCEPT', {
    decidedBy: 'business-user',
    decidedAt: '2026-08-20T17:54:00.000Z',
    authorityRef: 'business-process-owner',
  });
  assert.equal(accepted.status, 'ACCEPTED');
  assert.equal(accepted.automaticApplyAuthorized, false);
});

test('I7B-02 automation handoff is blocked until the exact BPMN revision is explicitly confirmed', () => {
  const draft = baseRevision();
  const missing = evaluateAutomationHandoffConfirmation({
    currentBpmnRevision: draft,
    expectedCanonicalProcessRevisionId: processRevisionId,
  });
  assert.equal(missing.authorized, false);
  assert.equal(missing.result, 'REJECTED_MISSING_CONFIRMATION');

  const { revision: confirmedRevision, confirmation } = confirmBusinessProcess(draft, {
    canonicalProcessRevisionId: processRevisionId,
    confirmedBy: 'business-user',
    confirmedAt: '2026-08-20T17:55:00.000Z',
    authorityRef: 'business-process-owner',
    rationale: 'This BPMN accurately represents the process I want Talos to automate.',
  });
  const authorized = evaluateAutomationHandoffConfirmation({
    currentBpmnRevision: confirmedRevision,
    expectedCanonicalProcessRevisionId: processRevisionId,
    confirmation,
  });
  assert.deepEqual(authorized, { result: 'AUTHORIZED', authorized: true, diagnosticRefs: [] });
});

test('I7B-02 any later BPMN semantic revision makes the old confirmation stale', () => {
  const base = baseRevision();
  const { confirmation } = confirmBusinessProcess(base, {
    canonicalProcessRevisionId: processRevisionId,
    confirmedBy: 'business-user',
    confirmedAt: '2026-08-20T17:55:00.000Z',
    authorityRef: 'business-process-owner',
  });
  const later = createBpmnProcessRevision({
    revisionNumber: 2,
    parentBpmnRevisionId: base.id,
    sourceRoute: base.sourceRoute,
    editMode: 'XML_EDIT',
    canonicalProcessRevisionId: processRevisionId,
    bpmnXml: xmlV1.replace('Receive Order', 'Validate Order'),
    semanticDigest: 'sem-validate-order-v2',
    diagramDigest: 'di-layout-v2',
    createdAt: '2026-08-20T17:56:00.000Z',
    createdBy: 'business-user',
  });
  const stale = evaluateAutomationHandoffConfirmation({
    currentBpmnRevision: later,
    expectedCanonicalProcessRevisionId: processRevisionId,
    confirmation,
  });
  assert.equal(stale.authorized, false);
  assert.equal(stale.result, 'REJECTED_BPMN_NOT_CONFIRMED');
});

test('I7B-02 revocation immediately removes automation-handoff authority', () => {
  const draft = baseRevision();
  const { revision, confirmation } = confirmBusinessProcess(draft, {
    canonicalProcessRevisionId: processRevisionId,
    confirmedBy: 'business-user',
    confirmedAt: '2026-08-20T17:55:00.000Z',
    authorityRef: 'business-process-owner',
  });
  const revoked = revokeBusinessProcessConfirmation(confirmation, {
    revokedBy: 'business-user',
    revokedAt: '2026-08-20T17:57:00.000Z',
  });
  const result = evaluateAutomationHandoffConfirmation({
    currentBpmnRevision: revision,
    expectedCanonicalProcessRevisionId: processRevisionId,
    confirmation: revoked,
  });
  assert.equal(result.authorized, false);
  assert.equal(result.result, 'REJECTED_REVOKED_CONFIRMATION');
});
