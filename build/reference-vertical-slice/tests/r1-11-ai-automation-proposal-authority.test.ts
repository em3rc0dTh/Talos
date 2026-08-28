import test from 'node:test';
import assert from 'node:assert/strict';
import {
  admitAutomationProposal,
  assessAutomationProposalCapabilityReadiness,
  decideAutomationProposal,
  materializeApprovedAutomationProposalSelections,
  type AutomationProposalOfferingCandidate,
  type AutomationProposalProviderContext,
} from '../packages/capability/src/index.ts';
import type { ProcessRevision } from '../packages/semantic-core/src/types.ts';
import type { CapabilityDesignBundle } from '../packages/capability/src/generic-design.ts';

const NOW = '2026-08-28T20:00:00.000Z';
const ACTION = 'prc_generic_work';
const REQUIREMENT = 'cap_generic_work';

function process(): ProcessRevision {
  return {
    id: 'prc_generic_revision' as any,
    processDefinitionId: 'prc_generic_definition' as any,
    revision: 1,
    createdAt: NOW,
    parentRevisionIds: [],
    derivationKind: 'HUMAN_CONFIRMATION',
    sourceArtifactIds: ['src_generic' as any],
    nodes: [{
      id: ACTION as any,
      kind: 'ACTION',
      name: 'Perform confirmed business work',
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
      id: 'cap_generic_design' as any,
      semanticFreezeRecordId: 'rvw_generic_freeze' as any,
      scopeFreezeRefs: ['rvw_generic_scope' as any],
      processRevisionId: 'prc_generic_revision' as any,
      validationAssessmentRefs: ['val_generic' as any],
      requirementRefs: [REQUIREMENT as any],
      unresolvedRequirementRefs: [REQUIREMENT as any],
      designState: 'NEEDS_DESIGN_DECISION',
      designDigest: 'generic-design-digest',
      createdAt: NOW,
    },
    requirements: [{
      id: REQUIREMENT as any,
      capabilityDesignRevisionId: 'cap_generic_design' as any,
      semanticScopeRef: 'val_generic_scope',
      semanticSubjectRefs: [ACTION],
      family: 'SOURCE_DEFINED',
      operationIntent: 'PERFORM_ACTION',
      requirementBasis: 'SEMANTIC_DERIVED',
      constraintRefs: [], safetyRequirementRefs: [],
      requirementState: 'UNRESOLVED',
      provenanceTraceRef: 'cap_generic_trace' as any,
      facetRefs: [],
    }],
    facets: [], provenanceTraces: [],
    designerRef: 'talos-generic-capability-designer',
    designerVersion: 'test-v1',
  };
}

function context(availableOfferings: AutomationProposalOfferingCandidate[] = []): AutomationProposalProviderContext {
  return { process: process(), design: design(), availableOfferings };
}

function raw(implementationRef: string) {
  return {
    steps: [{
      capabilityRequirementRef: REQUIREMENT,
      semanticSubjectRefs: [ACTION],
      proposedFamily: 'SYSTEM_OPERATION',
      canonicalName: 'Governed business operation',
      implementationKind: 'INTERNAL_SERVICE',
      implementationRef,
      rationale: 'A proposed execution direction for the confirmed business work.',
      confidence: 0.82,
    }],
    orchestration: [], unresolvedQuestions: [], assumptions: [], diagnostics: [],
  };
}

const provider = { providerId: 'TEST_AUTOMATION_DESIGNER', modelRef: 'test-model', pipelineVersion: 'test-pipeline-v1' };

const offering: AutomationProposalOfferingCandidate = {
  id: 'cap_offering_runtime_1',
  family: 'SYSTEM_OPERATION',
  supportedOperationIntents: ['PERFORM_ACTION'],
  implementationKind: 'INTERNAL_SERVICE',
  implementationRef: 'runtime:configured-business-operation',
};

test('complete AI design can remain non-bindable when its implementation is only a proposal', () => {
  const proposal = admitAutomationProposal(context(), provider, raw('proposal:generic-business-operation'), NOW);
  assert.equal(proposal.status, 'COMPLETE');
  const readiness = assessAutomationProposalCapabilityReadiness(proposal, []);
  assert.equal(readiness.designStatus, 'COMPLETE');
  assert.equal(readiness.bindingReadiness, 'NEEDS_CAPABILITY_CONFIGURATION');
  assert.equal(readiness.gaps.length, 1);
  assert.equal(readiness.gaps[0].reason, 'PROPOSAL_ONLY_REFERENCE');
  assert.equal(readiness.createsBinding, false);
  assert.equal(readiness.executionPlanAuthorized, false);
});

test('accepting AI design records authority but still creates no capability binding', () => {
  const proposal = admitAutomationProposal(context(), provider, raw('proposal:generic-business-operation'), NOW);
  const decision = decideAutomationProposal(proposal, {
    proposalRef: proposal.id,
    proposalDigest: proposal.proposalDigest,
    decision: 'ACCEPT_DESIGN',
    decidedBy: 'business-owner',
    authorityRef: 'authority:automation-design-review:1',
    rationale: 'I accept this implementation direction for capability configuration and selection.',
    decidedAt: NOW,
  });
  assert.equal(decision.acceptedForCapabilitySelection, true);
  assert.equal(decision.createsBinding, false);
  assert.equal(decision.executionPlanAuthorized, false);
  assert.equal(decision.temporalMappingAuthorized, false);
  assert.throws(
    () => materializeApprovedAutomationProposalSelections(proposal, decision, []),
    /requires capability configuration before binding/,
  );
});

test('an accepted proposal materializes existing capability selection only when exact offering evidence exists', () => {
  const proposal = admitAutomationProposal(context([offering]), provider, raw(`offering:${offering.id}`), NOW);
  const readiness = assessAutomationProposalCapabilityReadiness(proposal, [offering]);
  assert.equal(readiness.bindingReadiness, 'READY_FOR_CAPABILITY_SELECTION');
  const decision = decideAutomationProposal(proposal, {
    proposalRef: proposal.id,
    proposalDigest: proposal.proposalDigest,
    decision: 'ACCEPT_DESIGN',
    decidedBy: 'business-owner',
    authorityRef: 'authority:automation-design-review:2',
    rationale: 'I accept this exact governed offering for the reviewed automation design.',
    decidedAt: NOW,
  });
  const selections = materializeApprovedAutomationProposalSelections(proposal, decision, [offering]);
  assert.equal(selections.length, 1);
  assert.equal(selections[0].source, 'EXPLICIT_OFFERING');
  if (selections[0].source !== 'EXPLICIT_OFFERING') return;
  assert.equal(selections[0].requirementRef, REQUIREMENT);
  assert.equal(selections[0].implementationRef, offering.implementationRef);
  assert.equal(selections[0].family, offering.family);
  assert.equal(selections[0].authorityRef, decision.authorityRef);
});

test('partial AI design cannot be accepted as a complete automation design', () => {
  const proposal = admitAutomationProposal(context(), provider, {
    ...raw('proposal:generic-business-operation'),
    unresolvedQuestions: [{
      semanticSubjectRefs: [ACTION],
      question: 'Which business constraint controls this implementation?',
      reason: 'The confirmed process does not provide it.',
      material: true,
    }],
  }, NOW);
  assert.equal(proposal.status, 'PARTIAL');
  assert.throws(() => decideAutomationProposal(proposal, {
    proposalRef: proposal.id,
    proposalDigest: proposal.proposalDigest,
    decision: 'ACCEPT_DESIGN',
    decidedBy: 'business-owner',
    authorityRef: 'authority:automation-design-review:3',
    rationale: 'Attempted premature acceptance.',
    decidedAt: NOW,
  }), /cannot be accepted while design coverage is incomplete/);
});
