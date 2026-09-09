import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { AutomationProposal } from './automation-proposal.ts';

export type AutomationProposalDecisionKind = 'ACCEPT_DESIGN' | 'REQUEST_CHANGES' | 'REJECT';

export interface AutomationProposalDecisionRecord {
  id: string;
  proposalRef: string;
  proposalDigest: string;
  processRevisionRef: string;
  capabilityDesignRevisionRef: string;
  decision: AutomationProposalDecisionKind;
  decidedBy: string;
  authorityRef: string;
  rationale: string;
  acceptedForCapabilitySelection: boolean;
  createsBinding: false;
  executionPlanAuthorized: false;
  temporalMappingAuthorized: false;
  deploymentAuthorized: false;
  workflowExecutionAuthorized: false;
  decidedAt: string;
}

function nonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

export function decideAutomationProposal(
  proposal: AutomationProposal,
  input: {
    proposalRef: string;
    proposalDigest: string;
    decision: AutomationProposalDecisionKind;
    decidedBy: string;
    authorityRef: string;
    rationale: string;
    decidedAt: string;
  },
): AutomationProposalDecisionRecord {
  if (input.proposalRef !== proposal.id) throw new TypeError('automation proposal decision must pin the exact proposal');
  if (input.proposalDigest !== proposal.proposalDigest) throw new TypeError('automation proposal decision must pin the exact proposal digest');
  if (proposal.state !== 'SUGGESTED' || proposal.createsBinding || proposal.grantsAuthority) {
    throw new TypeError('automation proposal decision requires a non-authoritative SUGGESTED proposal');
  }
  if (input.decision === 'ACCEPT_DESIGN' && proposal.status !== 'COMPLETE') {
    throw new TypeError('automation proposal cannot be accepted while design coverage is incomplete');
  }
  const decidedBy = nonEmpty(input.decidedBy, 'decidedBy');
  const authorityRef = nonEmpty(input.authorityRef, 'authorityRef');
  const rationale = nonEmpty(input.rationale, 'rationale');
  const stable = {
    proposalRef: proposal.id,
    proposalDigest: proposal.proposalDigest,
    processRevisionRef: proposal.processRevisionRef,
    capabilityDesignRevisionRef: proposal.capabilityDesignRevisionRef,
    decision: input.decision,
    decidedBy,
    authorityRef,
    rationale,
  };
  return {
    id: createOpaqueId('capability', `automation-proposal-decision:${digestDeterministicJson(stable)}`),
    ...stable,
    acceptedForCapabilitySelection: input.decision === 'ACCEPT_DESIGN',
    createsBinding: false,
    executionPlanAuthorized: false,
    temporalMappingAuthorized: false,
    deploymentAuthorized: false,
    workflowExecutionAuthorized: false,
    decidedAt: input.decidedAt,
  };
}
