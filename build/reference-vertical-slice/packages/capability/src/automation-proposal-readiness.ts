import type { AutomationCapabilitySelectionInput } from './automation-capability-selection.ts';
import type { AutomationProposal } from './automation-proposal.ts';
import type { AutomationProposalDecisionRecord } from './automation-proposal-decision.ts';
import type { CapabilityOfferingRevision } from './types.ts';

export interface AutomationProposalOfferingCandidate {
  id: string;
  family: CapabilityOfferingRevision['family'];
  supportedOperationIntents: string[];
  implementationKind: CapabilityOfferingRevision['implementationKind'];
  implementationRef: string;
}

/**
 * Built-in Talos capability for Workflow-native human coordination.
 *
 * This is not an external provider claim. It represents Talos' own durable
 * human-work coordination contract (UPDATE/SIGNAL + Workflow condition). When
 * the business source does not name a role, the accepted automation design may
 * use runtime assignment to any eligible authenticated human instead of
 * inventing an organizational role or forcing one form per business task.
 */
export const TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING: AutomationProposalOfferingCandidate = Object.freeze({
  id: 'talos-builtin-offering:workflow-native-human-v1',
  family: 'HUMAN_INTERACTION',
  supportedOperationIntents: ['PERFORM_ACTION', 'UNRESOLVED_HUMAN_INTERACTION'],
  implementationKind: 'HUMAN_SERVICE',
  implementationRef: 'talos://workflow-native/human-coordination/v1',
});

export function withTalosBuiltinAutomationOfferings(
  availableOfferings: readonly AutomationProposalOfferingCandidate[] = [],
): AutomationProposalOfferingCandidate[] {
  const withoutDuplicate = availableOfferings.filter((offering) => offering.id !== TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING.id);
  return [TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING, ...withoutDuplicate];
}

export type AutomationProposalBindingReadiness = 'READY_FOR_CAPABILITY_SELECTION' | 'NEEDS_CAPABILITY_CONFIGURATION';

export interface AutomationProposalCapabilityGap {
  capabilityRequirementRef: string;
  semanticSubjectRefs: string[];
  proposedFamily: string;
  proposedImplementationKind: string;
  proposedImplementationRef: string;
  reason: 'PROPOSAL_ONLY_REFERENCE' | 'OFFERING_NOT_AVAILABLE' | 'OFFERING_MISMATCH' | 'HUMAN_DESIGN_INCOMPLETE';
}

export interface AutomationProposalReadinessAssessment {
  proposalRef: string;
  proposalDigest: string;
  designStatus: AutomationProposal['status'];
  bindingReadiness: AutomationProposalBindingReadiness;
  readyCapabilityRequirementRefs: string[];
  gaps: AutomationProposalCapabilityGap[];
  createsBinding: false;
  executionPlanAuthorized: false;
}

function offeringId(implementationRef: string): string | undefined {
  return implementationRef.startsWith('offering:') ? implementationRef.slice('offering:'.length) : undefined;
}

export function assessAutomationProposalCapabilityReadiness(
  proposal: AutomationProposal,
  availableOfferings: readonly AutomationProposalOfferingCandidate[] = [],
): AutomationProposalReadinessAssessment {
  const governedOfferings = withTalosBuiltinAutomationOfferings(availableOfferings);
  const byId = new Map(governedOfferings.map((offering) => [offering.id, offering]));
  const gaps: AutomationProposalCapabilityGap[] = [];
  const readyCapabilityRequirementRefs: string[] = [];

  for (const step of proposal.steps) {
    const base = {
      capabilityRequirementRef: step.capabilityRequirementRef,
      semanticSubjectRefs: [...step.semanticSubjectRefs],
      proposedFamily: step.proposedFamily,
      proposedImplementationKind: step.implementationKind,
      proposedImplementationRef: step.implementationRef,
    };
    const exactOfferingId = offeringId(step.implementationRef);
    if (!exactOfferingId) {
      gaps.push({ ...base, reason: 'PROPOSAL_ONLY_REFERENCE' });
      continue;
    }
    const offering = byId.get(exactOfferingId);
    if (!offering) {
      gaps.push({ ...base, reason: 'OFFERING_NOT_AVAILABLE' });
      continue;
    }
    if (offering.family !== step.proposedFamily || offering.implementationKind !== step.implementationKind) {
      gaps.push({ ...base, reason: 'OFFERING_MISMATCH' });
      continue;
    }
    if (step.proposedFamily === 'HUMAN_INTERACTION' && !step.human) {
      gaps.push({ ...base, reason: 'HUMAN_DESIGN_INCOMPLETE' });
      continue;
    }
    // Empty roleRefs are intentional when the source has no actor evidence.
    // Accepted design authority means Talos may use runtime assignment to an
    // eligible authenticated human; it does not manufacture a business role.
    readyCapabilityRequirementRefs.push(step.capabilityRequirementRef);
  }

  return {
    proposalRef: proposal.id,
    proposalDigest: proposal.proposalDigest,
    designStatus: proposal.status,
    bindingReadiness: proposal.status === 'COMPLETE' && gaps.length === 0
      ? 'READY_FOR_CAPABILITY_SELECTION'
      : 'NEEDS_CAPABILITY_CONFIGURATION',
    readyCapabilityRequirementRefs,
    gaps,
    createsBinding: false,
    executionPlanAuthorized: false,
  };
}

export function materializeApprovedAutomationProposalSelections(
  proposal: AutomationProposal,
  decision: AutomationProposalDecisionRecord,
  availableOfferings: readonly AutomationProposalOfferingCandidate[],
): AutomationCapabilitySelectionInput[] {
  if (decision.proposalRef !== proposal.id || decision.proposalDigest !== proposal.proposalDigest) {
    throw new TypeError('automation proposal selection materialization requires the exact reviewed proposal decision');
  }
  if (decision.decision !== 'ACCEPT_DESIGN' || !decision.acceptedForCapabilitySelection) {
    throw new TypeError('automation proposal must be explicitly accepted before capability selection materialization');
  }
  const governedOfferings = withTalosBuiltinAutomationOfferings(availableOfferings);
  const readiness = assessAutomationProposalCapabilityReadiness(proposal, governedOfferings);
  if (readiness.bindingReadiness !== 'READY_FOR_CAPABILITY_SELECTION') {
    throw new TypeError('automation proposal still requires capability configuration before binding');
  }
  const byId = new Map(governedOfferings.map((offering) => [offering.id, offering]));

  return proposal.steps.map((step) => {
    const exactOfferingId = offeringId(step.implementationRef)!;
    const offering = byId.get(exactOfferingId)!;
    return {
      source: 'EXPLICIT_OFFERING' as const,
      requirementRef: step.capabilityRequirementRef,
      family: offering.family,
      offeringCanonicalName: step.canonicalName,
      offeringLifecycleStatus: 'ACTIVE' as const,
      implementationKind: offering.implementationKind,
      implementationRef: offering.implementationRef,
      ...(step.human ? {
        human: {
          interactionKind: step.human.interactionKind,
          responsibilityKind: step.human.responsibilityKind,
          roleRefs: step.human.roleRefs as any,
          assignmentCardinality: step.human.roleRefs.length === 0 ? 'ANY_ELIGIBLE' as const : 'EXACTLY_ONE' as const,
          outcomes: [{
            code: step.human.outcomeCode,
            businessMeaning: step.human.outcomeBusinessMeaning,
            terminal: true,
          }],
        },
      } : {}),
      decidedBy: decision.decidedBy,
      authorityRef: decision.authorityRef,
      rationale: `Approved AI automation proposal ${proposal.id}: ${decision.rationale}`,
    };
  });
}
