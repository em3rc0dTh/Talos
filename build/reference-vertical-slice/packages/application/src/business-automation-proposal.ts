import { buildBusinessAutomationProposal } from '../../capability/src/business-automation-proposal.ts';
import type { ProcessRevision } from '../../semantic-core/src/types.ts';

/** Presentation-only projection over the exact confirmed durable process. */
export function proposeConfirmedBusinessAutomation(process: Record<string, unknown>) {
  return buildBusinessAutomationProposal(process as unknown as ProcessRevision);
}
