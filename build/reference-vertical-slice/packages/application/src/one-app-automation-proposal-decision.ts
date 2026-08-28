import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  assessAutomationProposalCapabilityReadiness,
  decideAutomationProposal,
  materializeApprovedAutomationProposalSelections,
  type AutomationProposal,
  type AutomationProposalDecisionKind,
  type AutomationProposalDecisionRecord,
  type AutomationProposalOfferingCandidate,
  type AutomationProposalReadinessAssessment,
} from '../../capability/src/index.ts';
import {
  persistAutomationProposalDecision,
  persistAutomationProposalReadiness,
} from './automation-proposal.ts';
import {
  selectOneAppAutomationCapabilities,
  type OneAppAutomationContext,
} from './one-app-automation.ts';

export interface OneAppAutomationProposalReviewResult {
  decision: AutomationProposalDecisionRecord;
  readiness: AutomationProposalReadinessAssessment;
  capabilitySelectionCreated: false;
  executionPlanAuthorized: false;
  temporalMappingAuthorized: false;
  deploymentAuthorized: false;
  workflowExecutionAuthorized: false;
}

export function reviewOneAppAutomationProposal(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  proposal: AutomationProposal,
  availableOfferings: readonly AutomationProposalOfferingCandidate[],
  input: {
    proposalRef: string;
    proposalDigest: string;
    decision: AutomationProposalDecisionKind;
    decidedBy: string;
    authorityRef: string;
    rationale: string;
    decidedAt: string;
  },
): OneAppAutomationProposalReviewResult {
  if (context.selection) throw new TypeError('one-app automation proposal review cannot change design after capability selection');
  if (proposal.processRevisionRef !== context.process.id) throw new TypeError('automation proposal review must pin the exact ProcessRevision');
  if (proposal.capabilityDesignRevisionRef !== context.design.designRevision.id) throw new TypeError('automation proposal review must pin the exact CapabilityDesignRevision');
  const decision = decideAutomationProposal(proposal, input);
  const readiness = assessAutomationProposalCapabilityReadiness(proposal, availableOfferings);
  const readinessId = createOpaqueId('capability', `automation-proposal-readiness:${proposal.id}:${proposal.proposalDigest}:${input.decidedAt}`) as string;
  persistAutomationProposalReadiness(repo, readinessId, readiness, input.decidedAt);
  persistAutomationProposalDecision(repo, decision);
  return {
    decision,
    readiness,
    capabilitySelectionCreated: false,
    executionPlanAuthorized: false,
    temporalMappingAuthorized: false,
    deploymentAuthorized: false,
    workflowExecutionAuthorized: false,
  };
}

export function bindOneAppAcceptedAutomationProposal(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  proposal: AutomationProposal,
  decision: AutomationProposalDecisionRecord,
  availableOfferings: readonly AutomationProposalOfferingCandidate[],
  createdAt: string,
): OneAppAutomationContext {
  if (context.selection) throw new TypeError('one-app automation proposal binding is append-only and capability selection already exists');
  if (proposal.processRevisionRef !== context.process.id) throw new TypeError('automation proposal binding must pin the exact ProcessRevision');
  if (proposal.capabilityDesignRevisionRef !== context.design.designRevision.id) throw new TypeError('automation proposal binding must pin the exact CapabilityDesignRevision');
  const selections = materializeApprovedAutomationProposalSelections(proposal, decision, availableOfferings);
  return selectOneAppAutomationCapabilities(repo, context, selections, createdAt);
}
