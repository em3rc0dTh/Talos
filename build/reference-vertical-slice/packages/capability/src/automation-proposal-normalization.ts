import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type {
  AutomationProposal,
  AutomationProposalProviderContext,
  AutomationProposalQuestion,
} from './automation-proposal.ts';

const PARTICIPANT_ASSIGNMENT_WORDING = /\b(actor|role|participant|performer|responsib(?:le|ility|ility)|owner|who)\b/i;

function isGovernedRolelessHumanStep(
  context: AutomationProposalProviderContext,
  proposal: AutomationProposal,
  semanticSubjectRef: string,
): boolean {
  const matching = proposal.steps.filter((step) => step.semanticSubjectRefs.includes(semanticSubjectRef));
  if (matching.length !== 1) return false;
  const step = matching[0];
  if (step.proposedFamily !== 'HUMAN_INTERACTION' || step.implementationKind !== 'HUMAN_SERVICE' || !step.human) return false;
  if (step.human.roleRefs.length !== 0) return false;

  const requirement = context.design.requirements.find((item) => item.id === step.capabilityRequirementRef);
  if (!requirement || (requirement.actorOrResponsibilityRefs ?? []).length !== 0) return false;

  if (!step.implementationRef.startsWith('offering:')) return false;
  const offeringId = step.implementationRef.slice('offering:'.length);
  const offering = (context.availableOfferings ?? []).find((item) => item.id === offeringId);
  if (!offering) return false;
  return offering.family === 'HUMAN_INTERACTION'
    && offering.implementationKind === 'HUMAN_SERVICE'
    && offering.supportedOperationIntents.includes(requirement.operationIntent);
}

function isRuntimeParticipantAssignmentQuestion(
  context: AutomationProposalProviderContext,
  proposal: AutomationProposal,
  question: AutomationProposalQuestion,
): boolean {
  if (!question.material || question.semanticSubjectRefs.length === 0) return false;
  if (!PARTICIPANT_ASSIGNMENT_WORDING.test(`${question.question} ${question.reason}`)) return false;
  return question.semanticSubjectRefs.every((ref) => isGovernedRolelessHumanStep(context, proposal, ref));
}

/**
 * Deterministic Talos policy normalization applied after model admission.
 *
 * A model may still ask who performs roleless human work even when the frozen
 * process contains no participant constraint and the admitted proposal already
 * selects a governed HUMAN_SERVICE that supports runtime assignment. In that
 * exact case, the question is useful diagnostic material but is not a material
 * blocker. Talos does not invent a role; it preserves roleRefs=[] and runtime
 * assignment remains ANY_ELIGIBLE after explicit design acceptance.
 *
 * Any other material question remains material and therefore fail-closed.
 */
export function normalizeAutomationProposalForRouting(
  context: AutomationProposalProviderContext,
  proposal: AutomationProposal,
): AutomationProposal {
  let changed = false;
  const unresolvedQuestions = proposal.unresolvedQuestions.map((question) => {
    if (!isRuntimeParticipantAssignmentQuestion(context, proposal, question)) return question;
    changed = true;
    return { ...question, material: false };
  });
  if (!changed) return proposal;

  const coveredRequirementRefs = new Set(proposal.steps.map((step) => step.capabilityRequirementRef));
  const uncoveredRequirementRefs = context.design.requirements
    .map((requirement) => requirement.id as string)
    .filter((requirementRef) => !coveredRequirementRefs.has(requirementRef));
  const hasMaterialUnresolved = unresolvedQuestions.some((question) => question.material);
  const status: AutomationProposal['status'] = uncoveredRequirementRefs.length === 0 && !hasMaterialUnresolved ? 'COMPLETE' : 'PARTIAL';
  const diagnostics = [
    ...proposal.diagnostics,
    'TALOS_NON_MATERIAL_RUNTIME_PARTICIPANT_ASSIGNMENT: roleless HUMAN_INTERACTION uses governed runtime assignment; no organizational role was inferred.',
  ];
  const stable = {
    processRevisionRef: proposal.processRevisionRef,
    capabilityDesignRevisionRef: proposal.capabilityDesignRevisionRef,
    providerId: proposal.providerId,
    modelRef: proposal.modelRef,
    pipelineVersion: proposal.pipelineVersion,
    status,
    steps: proposal.steps,
    orchestration: proposal.orchestration,
    unresolvedQuestions,
    assumptions: proposal.assumptions,
    diagnostics,
  };
  const proposalDigest = digestDeterministicJson(stable);
  return {
    id: createOpaqueId('capability', `automation-proposal:${proposalDigest}`),
    schemaVersion: proposal.schemaVersion,
    policyVersion: proposal.policyVersion,
    ...stable,
    proposalDigest,
    state: 'SUGGESTED',
    createsBinding: false,
    grantsAuthority: false,
    createdAt: proposal.createdAt,
  };
}
