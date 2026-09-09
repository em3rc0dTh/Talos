import type {
  AutomationProposal,
  AutomationProposalProvider,
  AutomationProposalProviderContext,
} from './automation-proposal.ts';
import { generateAutomationProposal } from './automation-proposal.ts';
import { normalizeAutomationProposalForRouting } from './automation-proposal-normalization.ts';

export type AutomationProposalRoutingDecision =
  | 'PRIMARY_ACCEPTED'
  | 'FALLBACK_ACCEPTED'
  | 'UNRESOLVED_AFTER_FALLBACK';

export interface AutomationProposalAttemptEvidence {
  providerId: string;
  modelRef: string;
  pipelineVersion: string;
  result: 'COMPLETE' | 'PARTIAL' | 'PROVIDER_FAILURE' | 'POLICY_REJECTION';
  proposal?: AutomationProposal;
  diagnostic?: string;
}

export interface AutomationProposalRoutingResult {
  policyVersion: 'talos-automation-proposal-routing-v0.1';
  decision: AutomationProposalRoutingDecision;
  automaticFallbackTriggered: boolean;
  selectedProposal?: AutomationProposal;
  primary: AutomationProposalAttemptEvidence;
  fallback?: AutomationProposalAttemptEvidence;
  createsBinding: false;
  automaticAutomationApprovalAuthorized: false;
  automaticDeploymentAuthorized: false;
  automaticWorkflowExecutionAuthorized: false;
}

function diagnostic(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function identity(provider: AutomationProposalProvider) {
  return {
    providerId: provider.providerId,
    modelRef: provider.modelRef,
    pipelineVersion: provider.pipelineVersion,
  };
}

async function attempt(
  provider: AutomationProposalProvider,
  context: AutomationProposalProviderContext,
  createdAt: string,
): Promise<AutomationProposalAttemptEvidence> {
  try {
    const admitted = await generateAutomationProposal(provider, context, createdAt);
    const proposal = normalizeAutomationProposalForRouting(context, admitted);
    return {
      ...identity(provider),
      result: proposal.status,
      proposal,
    };
  } catch (error) {
    const message = diagnostic(error);
    const policyRejection = /proposal|authority|semantic|requirement|orchestration|offering|actor|roleRefs|unsupported|unknown|dropped|duplicate/i.test(message);
    return {
      ...identity(provider),
      result: policyRejection ? 'POLICY_REJECTION' : 'PROVIDER_FAILURE',
      diagnostic: message,
    };
  }
}

/**
 * Provider-independent design routing. A COMPLETE primary proposal is accepted
 * as SUGGESTED review material. Any primary provider failure, policy rejection
 * or PARTIAL proposal may trigger one independent configured fallback attempt.
 * Talos never merges/votes model outputs and never converts a routed proposal
 * into a capability binding or authority artifact.
 */
export async function routeAutomationProposal(
  context: AutomationProposalProviderContext,
  primaryProvider: AutomationProposalProvider,
  fallbackProvider: AutomationProposalProvider | undefined,
  createdAt: string,
): Promise<AutomationProposalRoutingResult> {
  const primary = await attempt(primaryProvider, context, createdAt);
  if (primary.result === 'COMPLETE' && primary.proposal) {
    return {
      policyVersion: 'talos-automation-proposal-routing-v0.1',
      decision: 'PRIMARY_ACCEPTED',
      automaticFallbackTriggered: false,
      selectedProposal: primary.proposal,
      primary,
      createsBinding: false,
      automaticAutomationApprovalAuthorized: false,
      automaticDeploymentAuthorized: false,
      automaticWorkflowExecutionAuthorized: false,
    };
  }

  if (!fallbackProvider) {
    return {
      policyVersion: 'talos-automation-proposal-routing-v0.1',
      decision: 'UNRESOLVED_AFTER_FALLBACK',
      automaticFallbackTriggered: false,
      primary,
      createsBinding: false,
      automaticAutomationApprovalAuthorized: false,
      automaticDeploymentAuthorized: false,
      automaticWorkflowExecutionAuthorized: false,
    };
  }

  const fallback = await attempt(fallbackProvider, context, createdAt);
  if (fallback.result === 'COMPLETE' && fallback.proposal) {
    return {
      policyVersion: 'talos-automation-proposal-routing-v0.1',
      decision: 'FALLBACK_ACCEPTED',
      automaticFallbackTriggered: true,
      selectedProposal: fallback.proposal,
      primary,
      fallback,
      createsBinding: false,
      automaticAutomationApprovalAuthorized: false,
      automaticDeploymentAuthorized: false,
      automaticWorkflowExecutionAuthorized: false,
    };
  }

  return {
    policyVersion: 'talos-automation-proposal-routing-v0.1',
    decision: 'UNRESOLVED_AFTER_FALLBACK',
    automaticFallbackTriggered: true,
    primary,
    fallback,
    createsBinding: false,
    automaticAutomationApprovalAuthorized: false,
    automaticDeploymentAuthorized: false,
    automaticWorkflowExecutionAuthorized: false,
  };
}
