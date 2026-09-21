import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { digestDeterministicJson } from '../packages/foundation/src/digest.ts';
import {
  decideGuidedSemanticResolution,
  proposeGuidedSemanticResolution,
  type GuidedResolutionAnswer,
} from '../packages/application/src/semantic-resolution.ts';
import { validateProcessRevision } from '../packages/semantic-core/src/validation.ts';
import type { ProcessRevision } from '../packages/semantic-core/src/types.ts';

function quarryLikeRevision(): ProcessRevision {
  const processId = createOpaqueId('canonical', 'i8-02:process');
  const start = createOpaqueId('canonical', 'i8-02:start');
  const decision = createOpaqueId('canonical', 'i8-02:decision');
  const procurement = createOpaqueId('canonical', 'i8-02:procurement');
  const settlement = createOpaqueId('canonical', 'i8-02:settlement');
  const end = createOpaqueId('canonical', 'i8-02:end');
  const yes = createOpaqueId('canonical', 'i8-02:yes');
  const no = createOpaqueId('canonical', 'i8-02:no');
  return {
    id: createOpaqueId('canonical', 'i8-02:revision:1'),
    processDefinitionId: processId,
    revision: 1,
    createdAt: '2026-08-21T18:00:00.000Z',
    parentRevisionIds: [],
    derivationKind: 'IMPORT',
    sourceArtifactIds: [],
    nodes: [
      { id: start, kind: 'EVENT', name: 'Order Received', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: decision, kind: 'DECISION', name: 'Article Available?', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: procurement, kind: 'SUBPROCESS', name: 'Procurement', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], details: { subprocessMode: 'UNKNOWN' }, truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: settlement, kind: 'SUBPROCESS', name: 'Financial Settlement', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], details: { subprocessMode: 'UNKNOWN' }, truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: end, kind: 'END', name: 'Payment Received', actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
    ],
    edges: [
      { id: createOpaqueId('canonical', 'i8-02:start-decision'), sourceNodeId: start, targetNodeId: decision, kind: 'SEQUENCE', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: yes, sourceNodeId: decision, targetNodeId: settlement, kind: 'CONDITIONAL', label: 'Yes', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: no, sourceNodeId: decision, targetNodeId: procurement, kind: 'CONDITIONAL', label: 'No', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
      { id: createOpaqueId('canonical', 'i8-02:settlement-end'), sourceNodeId: settlement, targetNodeId: end, kind: 'SEQUENCE', truthClass: 'INFERRED', provenanceRefs: [], sourceExtensionRefs: [] },
    ],
    actors: [], variables: [], dataObjects: [], rules: [], semanticClaims: [], conflictRecords: [],
    annotations: [], provenanceLinks: [], sourceExtensions: [], semanticStatus: 'NORMALIZED',
    executionReadiness: 'NOT_ASSESSED', validationFindingRefs: [],
  };
}

function answersFor(revision: ProcessRevision, validation: ReturnType<typeof validateProcessRevision>): GuidedResolutionAnswer[] {
  return validation.findings.filter((finding) => finding.code === 'SV-CFL-001' || finding.code === 'SV-SUB-002').map((finding) => {
    const question = validation.questions.find((candidate) => candidate.findingRefs.includes(finding.id))!;
    if (finding.code === 'SV-CFL-001') {
      const edge = revision.edges.find((candidate) => candidate.id === finding.targetRefs[0])!;
      return {
        kind: 'BRANCH_CONDITION' as const,
        questionRef: question.id,
        findingRef: finding.id,
        targetRef: finding.targetRefs[0]!,
        condition: edge.label === 'Yes'
          ? 'Inventory quantity available is greater than or equal to the ordered quantity.'
          : 'Inventory quantity available is lower than the ordered quantity.',
      };
    }
    const node = revision.nodes.find((candidate) => candidate.id === finding.targetRefs[0])!;
    return {
      kind: 'SUBPROCESS_BOUNDARY' as const,
      questionRef: question.id,
      findingRef: finding.id,
      targetRef: finding.targetRefs[0]!,
      boundaryMeaning: 'EMBEDDED' as const,
      completionMeaning: node.name === 'Procurement'
        ? 'Procurement completes when the article is acquired or returns a declared business outcome.'
        : 'Financial Settlement completes when payment receipt is recorded.',
    };
  });
}

test('I8-02 turns validator questions into a proposal without changing canonical truth', () => {
  const revision = quarryLikeRevision();
  const validation = validateProcessRevision(revision);
  assert.deepEqual(validation.findings.filter((f) => ['SV-SUB-002','SV-CFL-001'].includes(f.code)).map((f) => f.code), [
    'SV-SUB-002','SV-SUB-002','SV-CFL-001','SV-CFL-001',
  ]);
  const proposal = proposeGuidedSemanticResolution({
    processRevision: revision,
    validation,
    answers: answersFor(revision, validation),
    authority: {
      answeredBy: 'business-owner',
      authorityRef: 'authority:business-owner',
      rationale: 'These answers describe the real order process.',
      answeredAt: '2026-08-21T18:01:00.000Z',
    },
  });
  assert.equal(proposal.createsCanonicalRevision, false);
  assert.equal(proposal.confirmsProcess, false);
  assert.equal(proposal.authorizesAutomationDesign, false);
  assert.equal(proposal.authorizesExecution, false);
  assert.equal(revision.rules.length, 0);
});

test('I8-02 accepted answers create a new revision, revalidate, and require reconfirmation', () => {
  const revision = quarryLikeRevision();
  const validation = validateProcessRevision(revision);
  const proposal = proposeGuidedSemanticResolution({
    processRevision: revision,
    validation,
    answers: answersFor(revision, validation),
    authority: {
      answeredBy: 'business-owner',
      authorityRef: 'authority:business-owner',
      rationale: 'Resolve the four material findings.',
      answeredAt: '2026-08-21T18:01:00.000Z',
    },
  });
  const decision = decideGuidedSemanticResolution({
    proposal, processRevision: revision, validation, decision: 'ACCEPT',
    decidedBy: 'business-owner', authorityRef: 'authority:business-owner',
    rationale: 'I accept these meanings.', decidedAt: '2026-08-21T18:02:00.000Z',
  });
  assert.equal(decision.decision, 'ACCEPT');
  if (decision.decision !== 'ACCEPT') throw new Error('expected accepted decision');
  assert.equal(decision.resolvedRevision.parentRevisionIds[0], revision.id);
  assert.equal(decision.resolvedRevision.rules.length, 2);
  assert.equal(decision.validation.findings.some((f) => f.code === 'SV-SUB-002' || f.code === 'SV-CFL-001'), false);
  assert.equal(decision.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
  assert.equal(decision.requiresProcessReconfirmation, true);
  assert.equal(decision.authorizesAutomationDesign, false);
  assert.equal(decision.authorizesExecution, false);
});

test('I8-02 accepted resolution remains deterministic JSON when optional Canonical fields are absent', () => {
  const revision = quarryLikeRevision();
  revision.rules.push({
    id: createOpaqueId('canonical', 'i8-02:existing-rule-without-outputs'),
    naturalLanguage: 'Existing source rule without optional outputs.',
    inputs: [],
    truthClass: 'INFERRED',
    unresolvedTerms: [],
    provenanceRefs: [],
  });
  const validation = validateProcessRevision(revision);
  const proposal = proposeGuidedSemanticResolution({
    processRevision: revision,
    validation,
    answers: answersFor(revision, validation),
    authority: {
      answeredBy: 'business-owner',
      authorityRef: 'authority:business-owner',
      rationale: 'Resolve material findings without manufacturing absent optional fields.',
      answeredAt: '2026-08-21T18:01:00.000Z',
    },
  });
  const decision = decideGuidedSemanticResolution({
    proposal,
    processRevision: revision,
    validation,
    decision: 'ACCEPT',
    decidedBy: 'business-owner',
    authorityRef: 'authority:business-owner',
    rationale: 'Accept exact reviewed meanings.',
    decidedAt: '2026-08-21T18:02:00.000Z',
  });
  assert.equal(decision.decision, 'ACCEPT');
  if (decision.decision !== 'ACCEPT') throw new Error('expected accepted decision');
  assert.doesNotThrow(() => digestDeterministicJson(decision.resolvedRevision));
  assert.equal(Object.hasOwn(decision.resolvedRevision.nodes[0]!, 'details'), false);
  const inheritedRule = decision.resolvedRevision.rules.find((rule) => rule.id === createOpaqueId('canonical', 'i8-02:existing-rule-without-outputs'));
  assert.ok(inheritedRule);
  assert.equal(Object.hasOwn(inheritedRule, 'outputs'), false);
});

test('I8-02 rejection and invalid cross-assessment answers create no revision', () => {
  const revision = quarryLikeRevision();
  const validation = validateProcessRevision(revision);
  const proposal = proposeGuidedSemanticResolution({
    processRevision: revision,
    validation,
    answers: answersFor(revision, validation),
    authority: {
      answeredBy: 'business-owner', authorityRef: 'authority:business-owner',
      rationale: 'Candidate answers.', answeredAt: '2026-08-21T18:01:00.000Z',
    },
  });
  const rejected = decideGuidedSemanticResolution({
    proposal, processRevision: revision, validation, decision: 'REJECT',
    decidedBy: 'business-owner', authorityRef: 'authority:business-owner',
    rationale: 'These answers are not correct.', decidedAt: '2026-08-21T18:02:00.000Z',
  });
  assert.equal(rejected.createsCanonicalRevision, false);
  assert.equal(rejected.authorizesAutomationDesign, false);
  const invalid = answersFor(revision, validation)[0]!;
  assert.throws(() => proposeGuidedSemanticResolution({
    processRevision: revision,
    validation,
    answers: [{ ...invalid, questionRef: createOpaqueId('validation', 'wrong-question') }],
    authority: {
      answeredBy: 'business-owner', authorityRef: 'authority:business-owner',
      rationale: 'Invalid answer.', answeredAt: '2026-08-21T18:03:00.000Z',
    },
  }), /QUESTION_FINDING_MISMATCH/);
});
