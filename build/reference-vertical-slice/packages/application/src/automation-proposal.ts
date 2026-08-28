import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type {
  AutomationProposal,
  AutomationProposalDecisionRecord,
  AutomationProposalReadinessAssessment,
  AutomationProposalRoutingResult,
} from '../../capability/src/index.ts';

export function persistAutomationProposal(
  repo: ImmutableDocumentRepository,
  proposal: AutomationProposal,
): void {
  repo.append({
    id: proposal.id as any,
    aggregateKind: 'AutomationProposal',
    schemaVersion: proposal.schemaVersion,
    payload: proposal,
    createdAt: proposal.createdAt,
  });
}

export function persistAutomationProposalRouting(
  repo: ImmutableDocumentRepository,
  routingId: string,
  routing: AutomationProposalRoutingResult,
  createdAt: string,
): void {
  repo.append({
    id: routingId as any,
    aggregateKind: 'AutomationProposalRouting',
    schemaVersion: routing.policyVersion,
    payload: routing,
    createdAt,
  });
  if (routing.primary.proposal) persistAutomationProposal(repo, routing.primary.proposal);
  if (routing.fallback?.proposal && routing.fallback.proposal.id !== routing.primary.proposal?.id) {
    persistAutomationProposal(repo, routing.fallback.proposal);
  }
}

export function persistAutomationProposalReadiness(
  repo: ImmutableDocumentRepository,
  readinessId: string,
  readiness: AutomationProposalReadinessAssessment,
  createdAt: string,
): void {
  repo.append({
    id: readinessId as any,
    aggregateKind: 'AutomationProposalReadinessAssessment',
    schemaVersion: 'talos-automation-proposal-readiness-v0.1',
    payload: readiness,
    createdAt,
  });
}

export function persistAutomationProposalDecision(
  repo: ImmutableDocumentRepository,
  decision: AutomationProposalDecisionRecord,
): void {
  repo.append({
    id: decision.id as any,
    aggregateKind: 'AutomationProposalDecision',
    schemaVersion: 'talos-automation-proposal-decision-v0.1',
    payload: decision,
    createdAt: decision.decidedAt,
  });
}
