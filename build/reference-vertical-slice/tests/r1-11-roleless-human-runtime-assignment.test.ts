import test from 'node:test';
import assert from 'node:assert/strict';
import {
  admitAutomationProposal,
  assessAutomationProposalCapabilityReadiness,
  decideAutomationProposal,
  generateAutomationProposal,
  materializeApprovedAutomationProposalSelections,
  resolveGeminiAutomationDesigner,
  resolveGenericCapabilities,
  TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING,
  withTalosBuiltinAutomationOfferings,
  type AutomationProposalProviderContext,
} from '../packages/capability/src/index.ts';
import type { ProcessRevision } from '../packages/semantic-core/src/types.ts';
import type { CapabilityDesignBundle } from '../packages/capability/src/generic-design.ts';

const NOW = '2026-08-28T23:10:00.000Z';
const ACTION = 'prc_roleless_human_work';
const REQUIREMENT = 'cap_roleless_human_work';
const DESIGN = 'cap_roleless_design';

function process(): ProcessRevision {
  return {
    id: 'prc_roleless_revision' as any,
    processDefinitionId: 'prc_roleless_definition' as any,
    revision: 1,
    createdAt: NOW,
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: ['src_roleless' as any],
    nodes: [{
      id: ACTION as any,
      kind: 'ACTION',
      name: 'Perform confirmed physical work',
      actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [],
      truthClass: 'CONFIRMED', provenanceRefs: [], sourceExtensionRefs: [],
    }],
    edges: [], actors: [], variables: [], dataObjects: [], rules: [], semanticClaims: [], conflictRecords: [], annotations: [], provenanceLinks: [], sourceExtensions: [],
    semanticStatus: 'VALIDATED', executionReadiness: 'READY_FOR_AUTOMATION_DESIGN', validationFindingRefs: [],
  };
}

function design(): CapabilityDesignBundle {
  return {
    designRevision: {
      id: DESIGN as any,
      semanticFreezeRecordId: 'rvw_roleless_freeze' as any,
      scopeFreezeRefs: ['rvw_roleless_scope_freeze' as any],
      processRevisionId: 'prc_roleless_revision' as any,
      validationAssessmentRefs: ['val_roleless_assessment' as any],
      requirementRefs: [REQUIREMENT as any],
      unresolvedRequirementRefs: [REQUIREMENT as any],
      designState: 'NEEDS_DESIGN_DECISION',
      designDigest: 'roleless-design-digest',
      createdAt: NOW,
    },
    requirements: [{
      id: REQUIREMENT as any,
      capabilityDesignRevisionId: DESIGN as any,
      semanticScopeRef: 'val_roleless_scope',
      semanticSubjectRefs: [ACTION],
      family: 'SOURCE_DEFINED',
      operationIntent: 'PERFORM_ACTION',
      requirementBasis: 'SEMANTIC_DERIVED',
      constraintRefs: [], safetyRequirementRefs: [],
      requirementState: 'UNRESOLVED',
      provenanceTraceRef: 'cap_roleless_trace' as any,
      facetRefs: [],
    }],
    facets: [],
    provenanceTraces: [{
      id: 'cap_roleless_trace' as any,
      requirementId: REQUIREMENT as any,
      semanticFreezeRecordId: 'rvw_roleless_freeze' as any,
      scopeFreezeRef: 'rvw_roleless_scope_freeze' as any,
      processRevisionId: 'prc_roleless_revision' as any,
      semanticSubjectRefs: [ACTION],
      semanticClaimRefs: [],
      validationAssessmentRefs: ['val_roleless_assessment' as any],
      derivationMethod: 'FROZEN_ACTION_TO_GENERIC_CAPABILITY_REQUIREMENT',
      designerVersion: 'test-v1',
      createdAt: NOW,
    }],
    designerRef: 'talos-generic-capability-designer',
    designerVersion: 'test-v1',
  };
}

function context(): AutomationProposalProviderContext {
  return { process: process(), design: design(), availableOfferings: withTalosBuiltinAutomationOfferings([]) };
}

function rawRolelessHuman() {
  return {
    steps: [{
      capabilityRequirementRef: REQUIREMENT,
      semanticSubjectRefs: [ACTION],
      proposedFamily: 'HUMAN_INTERACTION',
      canonicalName: 'Talos Workflow-native human coordination',
      implementationKind: 'HUMAN_SERVICE',
      implementationRef: `offering:${TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING.id}`,
      rationale: 'The confirmed work is performed by a human; no organizational role is asserted, so assignment remains runtime-governed.',
      confidence: 0.9,
      human: {
        interactionKind: 'MANUAL_ACTION',
        responsibilityKind: 'PERFORMER',
        roleRefs: [],
        outcomeCode: 'COMPLETED',
        outcomeBusinessMeaning: 'The confirmed human work is completed.',
      },
    }],
    orchestration: [],
    unresolvedQuestions: [],
    assumptions: ['Participant identity is selected from eligible authenticated humans at runtime; no business role is inferred.'],
    diagnostics: [],
  };
}

const provider = { providerId: 'TEST_ROLELESS_DESIGNER', modelRef: 'test-model', pipelineVersion: 'test-pipeline' };

test('roleless human work can be a COMPLETE AI design using Talos built-in Workflow-native human coordination', () => {
  const proposal = admitAutomationProposal(context(), provider, rawRolelessHuman(), NOW);
  assert.equal(proposal.status, 'COMPLETE');
  assert.equal(proposal.steps[0].human?.roleRefs.length, 0);
  const readiness = assessAutomationProposalCapabilityReadiness(proposal, []);
  assert.equal(readiness.bindingReadiness, 'READY_FOR_CAPABILITY_SELECTION');
  assert.deepEqual(readiness.gaps, []);
});

test('accepted roleless human proposal materializes ANY_ELIGIBLE runtime assignment without inventing a role', () => {
  const proposal = admitAutomationProposal(context(), provider, rawRolelessHuman(), NOW);
  const decision = decideAutomationProposal(proposal, {
    proposalRef: proposal.id,
    proposalDigest: proposal.proposalDigest,
    decision: 'ACCEPT_DESIGN',
    decidedBy: 'business-owner',
    authorityRef: 'authority:roleless-human-design',
    rationale: 'Accept Workflow-native human coordination with runtime participant assignment.',
    decidedAt: NOW,
  });
  const selections = materializeApprovedAutomationProposalSelections(proposal, decision, []);
  assert.equal(selections.length, 1);
  const selection = selections[0];
  assert.equal(selection.source, 'EXPLICIT_OFFERING');
  if (selection.source !== 'EXPLICIT_OFFERING') return;
  assert.equal(selection.implementationRef, TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING.implementationRef);
  assert.deepEqual(selection.human?.roleRefs, []);
  assert.equal(selection.human?.assignmentCardinality, 'ANY_ELIGIBLE');
});

test('generic capability resolver preserves roleless runtime assignment as HUMAN constraint and rejects EXACTLY_ONE without a role', () => {
  const base = design();
  const common = {
    requirementRef: REQUIREMENT,
    family: 'HUMAN_INTERACTION' as const,
    operationIntent: 'PERFORM_ACTION',
    authorityRef: 'authority:roleless-runtime',
    decidedBy: 'business-owner',
    rationale: 'Use Talos Workflow-native human coordination without asserting an organizational role.',
    offeringCanonicalName: 'Talos Workflow-native human coordination',
    offeringLifecycleStatus: 'ACTIVE' as const,
    implementationKind: 'HUMAN_SERVICE' as const,
    implementationRef: TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING.implementationRef,
  };
  const resolved = resolveGenericCapabilities(base, [{
    ...common,
    human: {
      interactionKind: 'MANUAL_ACTION',
      responsibilityKind: 'PERFORMER',
      roleRefs: [],
      assignmentCardinality: 'ANY_ELIGIBLE',
      outcomes: [{ code: 'COMPLETED', businessMeaning: 'The human work is completed.', terminal: true }],
    },
  }], NOW);
  assert.equal(resolved.participantRequirements.length, 1);
  assert.deepEqual(resolved.participantRequirements[0].roleRefs, []);
  assert.equal(resolved.participantRequirements[0].assignmentCardinality, 'ANY_ELIGIBLE');
  assert.deepEqual(resolved.participantRequirements[0].actorTypeConstraints, ['HUMAN']);
  assert.equal(resolved.humanDesigns[0].designState, 'COMPLETE');

  assert.throws(() => resolveGenericCapabilities(base, [{
    ...common,
    human: {
      interactionKind: 'MANUAL_ACTION',
      responsibilityKind: 'PERFORMER',
      roleRefs: [],
      assignmentCardinality: 'EXACTLY_ONE',
      outcomes: [{ code: 'COMPLETED', businessMeaning: 'The human work is completed.', terminal: true }],
    },
  }], NOW), /roleless human design requires ANY_ELIGIBLE runtime assignment/);
});

test('Gemini receives the built-in human capability and is instructed not to block solely on missing role evidence', async () => {
  let requestText = '';
  const fakeFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    requestText = String(body.contents?.[0]?.parts?.[0]?.text ?? '');
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(rawRolelessHuman()) }] } }] }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  const runtime = resolveGeminiAutomationDesigner({ GEMINI_API_KEY: 'test-key' }, fakeFetch);
  assert.equal(runtime.status, 'CONFIGURED');
  if (runtime.status !== 'CONFIGURED' || !runtime.provider) return;
  const proposal = await generateAutomationProposal(runtime.provider, context(), NOW);
  assert.equal(proposal.status, 'COMPLETE');
  assert.match(requestText, /runtime assignment to an eligible authenticated human/);
  assert.match(requestText, new RegExp(TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(requestText, /Missing role evidence alone is.*material unresolved question/i);
});
