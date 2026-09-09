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
  const existing = repo.get<AutomationProposal>(proposal.id as any);
  if (existing) {
    if (
      existing.aggregateKind !== 'AutomationProposal'
      || existing.schemaVersion !== proposal.schemaVersion
      || existing.payload.proposalDigest !== proposal.proposalDigest
      || existing.payload.processRevisionRef !== proposal.processRevisionRef
      || existing.payload.capabilityDesignRevisionRef !== proposal.capabilityDesignRevisionRef
      || existing.payload.providerId !== proposal.providerId
      || existing.payload.modelRef !== proposal.modelRef
      || existing.payload.pipelineVersion !== proposal.pipelineVersion
    ) {
      throw new TypeError('automation proposal immutable identity conflict');
    }
    // AutomationProposal.id is content-addressed from semantic proposal content.
    // An identical later generation reuses the first persisted proposal artifact;
    // its new provider-attempt time remains captured by AutomationProposalRouting.
    return;
  }
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
