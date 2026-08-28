import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  routeAutomationProposal,
  type AutomationProposalProvider,
  type AutomationProposalRoutingResult,
} from '../../capability/src/index.ts';
import type { OneAppAutomationContext } from './one-app-automation.ts';
import { persistAutomationProposalRouting } from './automation-proposal.ts';

export interface OneAppAutomationProposalResult {
  routingId: string;
  routing: AutomationProposalRoutingResult;
  processRevisionRef: string;
  capabilityDesignRevisionRef: string;
  workspaceRef: string;
  createsBinding: false;
  automationApprovalAuthorized: false;
  deploymentAuthorized: false;
  workflowExecutionAuthorized: false;
}

/**
 * Produce SUGGESTED automation-design review material for an already opened
 * One-App Automation Design workspace. This service never mutates capability
 * selection, execution design, deployment or execution authority.
 */
export async function proposeOneAppAutomationDesign(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  primaryProvider: AutomationProposalProvider,
  fallbackProvider: AutomationProposalProvider | undefined,
  createdAt: string,
): Promise<OneAppAutomationProposalResult> {
  if (context.selection) {
    throw new TypeError('one-app automation proposal cannot be generated after capability selection has been frozen');
  }
  if (context.workspace.workspace.capabilityDesignRevisionRef !== context.design.designRevision.id) {
    throw new TypeError('one-app automation proposal requires the exact active CapabilityDesignRevision workspace');
  }
  if (context.process.id !== context.design.designRevision.processRevisionId) {
    throw new TypeError('one-app automation proposal requires exact ProcessRevision lineage');
  }

  const routing = await routeAutomationProposal(
    { process: context.process, design: context.design },
    primaryProvider,
    fallbackProvider,
    createdAt,
  );
  const routingId = createOpaqueId(
    'capability',
    `automation-proposal-routing:${context.workspace.workspace.id}:${createdAt}:${routing.decision}`,
  ) as string;
  persistAutomationProposalRouting(repo, routingId, routing, createdAt);

  return {
    routingId,
    routing,
    processRevisionRef: context.process.id as string,
    capabilityDesignRevisionRef: context.design.designRevision.id as string,
    workspaceRef: context.workspace.workspace.id as string,
    createsBinding: false,
    automationApprovalAuthorized: false,
    deploymentAuthorized: false,
    workflowExecutionAuthorized: false,
  };
}
