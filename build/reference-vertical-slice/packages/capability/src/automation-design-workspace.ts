import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { CapabilityDesignBundle } from './generic-design.ts';
import type { CapabilityRequirement } from './types.ts';
import {
  decideIntegrationSuggestion,
  suggestIntegrations,
  type IntegrationSuggestion,
  type IntegrationSuggestionDecision,
  type IntegrationSuggestionDecisionKind,
} from './integration-suggestions.ts';

export type AutomationDesignRequirementState =
  | 'UNRESOLVED_CAPABILITY'
  | 'NO_SUGGESTION_AVAILABLE'
  | 'AWAITING_USER_DECISION'
  | 'DECISION_RECORDED';

export type AutomationDesignWorkspaceState =
  | 'BLOCKED_UNRESOLVED_CAPABILITY'
  | 'AWAITING_USER_DECISIONS'
  | 'READY_FOR_EXPLICIT_SELECTION';

export interface AutomationDesignRequirementView {
  capabilityRequirementRef: string;
  semanticSubjectRefs: string[];
  family: CapabilityRequirement['family'];
  operationIntent: string;
  requirementState: CapabilityRequirement['requirementState'];
  suggestionRefs: string[];
  decisionRefs: string[];
  designState: AutomationDesignRequirementState;
}

export interface AutomationDesignWorkspace {
  id: string;
  revisionNumber: number;
  supersedesWorkspaceRef?: string;
  processRevisionRef: string;
  capabilityDesignRevisionRef: string;
  requirementRefs: string[];
  unresolvedRequirementRefs: string[];
  requirements: AutomationDesignRequirementView[];
  state: AutomationDesignWorkspaceState;
  createsBinding: false;
  capabilitySelectionCreated: false;
  bindingAuthorized: false;
  executionPlanAuthorized: false;
  createdAt: string;
}

export interface AutomationDesignWorkspaceBundle {
  workspace: AutomationDesignWorkspace;
  suggestions: IntegrationSuggestion[];
  decisions: IntegrationSuggestionDecision[];
}

export interface AutomationDesignSuggestionDecisionInput {
  suggestionRef: string;
  capabilityRequirementRef: string;
  decision: IntegrationSuggestionDecisionKind;
  decidedBy: string;
  authorityRef: string;
  rationale: string;
  replacement?: IntegrationSuggestionDecision['replacement'];
  decidedAt: string;
}

function decisionsFor(
  decisions: readonly IntegrationSuggestionDecision[],
  requirementRef: string,
): IntegrationSuggestionDecision[] {
  return decisions.filter((decision) => decision.capabilityRequirementRef === requirementRef);
}

function suggestionsFor(
  suggestions: readonly IntegrationSuggestion[],
  requirementRef: string,
): IntegrationSuggestion[] {
  return suggestions.filter((suggestion) => suggestion.capabilityRequirementRef === requirementRef);
}

function requirementView(
  requirement: CapabilityRequirement,
  suggestions: readonly IntegrationSuggestion[],
  decisions: readonly IntegrationSuggestionDecision[],
): AutomationDesignRequirementView {
  const requirementSuggestions = suggestionsFor(suggestions, requirement.id);
  const requirementDecisions = decisionsFor(decisions, requirement.id);
  const hasAcceptedDirection = requirementDecisions.some(
    (decision) => decision.decision === 'ACCEPT' || decision.decision === 'REPLACE',
  );

  let designState: AutomationDesignRequirementState;
  if (requirement.requirementState === 'UNRESOLVED' || requirement.family === 'SOURCE_DEFINED') {
    designState = 'UNRESOLVED_CAPABILITY';
  } else if (hasAcceptedDirection) {
    designState = 'DECISION_RECORDED';
  } else if (requirementSuggestions.length === 0) {
    designState = 'NO_SUGGESTION_AVAILABLE';
  } else {
    designState = 'AWAITING_USER_DECISION';
  }

  return {
    capabilityRequirementRef: requirement.id,
    semanticSubjectRefs: [...requirement.semanticSubjectRefs],
    family: requirement.family,
    operationIntent: requirement.operationIntent,
    requirementState: requirement.requirementState,
    suggestionRefs: requirementSuggestions.map((suggestion) => suggestion.id),
    decisionRefs: requirementDecisions.map((decision) => decision.id),
    designState,
  };
}

function workspaceState(requirements: readonly AutomationDesignRequirementView[]): AutomationDesignWorkspaceState {
  if (requirements.some((requirement) => requirement.designState === 'UNRESOLVED_CAPABILITY')) {
    return 'BLOCKED_UNRESOLVED_CAPABILITY';
  }
  if (requirements.length > 0 && requirements.every((requirement) => requirement.designState === 'DECISION_RECORDED')) {
    return 'READY_FOR_EXPLICIT_SELECTION';
  }
  return 'AWAITING_USER_DECISIONS';
}

function buildWorkspace(
  design: CapabilityDesignBundle,
  suggestions: readonly IntegrationSuggestion[],
  decisions: readonly IntegrationSuggestionDecision[],
  revisionNumber: number,
  createdAt: string,
  revisionSeed: string,
  supersedesWorkspaceRef?: string,
): AutomationDesignWorkspace {
  const requirements = design.requirements.map((requirement) => requirementView(requirement, suggestions, decisions));
  return {
    id: createOpaqueId('capability', `automation-design-workspace:${design.designRevision.id}:${revisionNumber}:${revisionSeed}`),
    revisionNumber,
    ...(supersedesWorkspaceRef ? { supersedesWorkspaceRef } : {}),
    processRevisionRef: design.designRevision.processRevisionId,
    capabilityDesignRevisionRef: design.designRevision.id,
    requirementRefs: design.requirements.map((requirement) => requirement.id),
    unresolvedRequirementRefs: requirements
      .filter((requirement) => requirement.designState === 'UNRESOLVED_CAPABILITY')
      .map((requirement) => requirement.capabilityRequirementRef),
    requirements,
    state: workspaceState(requirements),
    createsBinding: false,
    capabilitySelectionCreated: false,
    bindingAuthorized: false,
    executionPlanAuthorized: false,
    createdAt,
  };
}

export function openAutomationDesignWorkspace(
  design: CapabilityDesignBundle,
  createdAt: string,
): AutomationDesignWorkspaceBundle {
  const suggestions = suggestIntegrations(design.requirements, createdAt);
  const decisions: IntegrationSuggestionDecision[] = [];
  return {
    workspace: buildWorkspace(design, suggestions, decisions, 1, createdAt, 'OPEN'),
    suggestions,
    decisions,
  };
}

export function decideAutomationDesignSuggestion(
  design: CapabilityDesignBundle,
  current: AutomationDesignWorkspaceBundle,
  input: AutomationDesignSuggestionDecisionInput,
): AutomationDesignWorkspaceBundle {
  if (current.workspace.capabilityDesignRevisionRef !== design.designRevision.id) {
    throw new TypeError('automation design workspace must remain pinned to the exact CapabilityDesignRevision');
  }
  if (current.decisions.some((decision) => decision.suggestionRef === input.suggestionRef)) {
    throw new TypeError('an integration suggestion already has an append-only decision');
  }
  if (
    (input.decision === 'ACCEPT' || input.decision === 'REPLACE')
    && current.decisions.some(
      (decision) => decision.capabilityRequirementRef === input.capabilityRequirementRef
        && (decision.decision === 'ACCEPT' || decision.decision === 'REPLACE'),
    )
  ) {
    throw new TypeError('a capability requirement already has an accepted integration direction');
  }

  const decision = decideIntegrationSuggestion(current.suggestions, input);
  const decisions = [...current.decisions, decision];
  return {
    workspace: buildWorkspace(
      design,
      current.suggestions,
      decisions,
      current.workspace.revisionNumber + 1,
      input.decidedAt,
      decision.id,
      current.workspace.id,
    ),
    suggestions: [...current.suggestions],
    decisions,
  };
}
