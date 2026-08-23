import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { CapabilityDesignBundle } from './generic-design.ts';
import {
  resolveGenericCapabilities,
  type GenericCapabilityResolutionBundle,
  type GenericHumanDesignResolution,
  type GenericRequirementResolution,
} from './generic-resolution.ts';
import type {
  CapabilityFamily,
  CapabilityOfferingDefinition,
  CapabilityOfferingRevision,
} from './types.ts';
import type { AutomationDesignWorkspaceBundle } from './automation-design-workspace.ts';
import type { IntegrationSuggestion, IntegrationSuggestionDecision } from './integration-suggestions.ts';

export type AutomationCapabilitySelectionSource = 'SUGGESTION_DECISION' | 'EXPLICIT_OFFERING';

interface SelectionAuthority {
  authorityRef: string;
  decidedBy: string;
  rationale: string;
}

export interface SuggestionBackedCapabilitySelection extends SelectionAuthority {
  source: 'SUGGESTION_DECISION';
  requirementRef: string;
  suggestionDecisionRef: string;
  human?: GenericHumanDesignResolution;
}

export interface ExplicitOfferingCapabilitySelection extends SelectionAuthority {
  source: 'EXPLICIT_OFFERING';
  requirementRef: string;
  family: CapabilityFamily;
  operationIntent?: string;
  offeringCanonicalName: string;
  offeringLifecycleStatus?: CapabilityOfferingDefinition['lifecycleStatus'];
  implementationKind: CapabilityOfferingRevision['implementationKind'];
  implementationRef: string;
  human?: GenericHumanDesignResolution;
}

export type AutomationCapabilitySelectionInput = SuggestionBackedCapabilitySelection | ExplicitOfferingCapabilitySelection;

export interface AutomationCapabilitySelectionTrace {
  id: string;
  workspaceRevisionRef: string;
  capabilityRequirementRef: string;
  source: AutomationCapabilitySelectionSource;
  suggestionDecisionRef?: string;
  selectedFamily: CapabilityFamily;
  selectedOfferingCanonicalName: string;
  selectedImplementationKind: CapabilityOfferingRevision['implementationKind'];
  selectedImplementationRef: string;
  authorityRef: string;
  decidedBy: string;
  rationale: string;
  createsCapabilitySelection: true;
  createsBinding: true;
  createdAt: string;
}

export interface AutomationCapabilitySelectionResult {
  workspaceRevisionRef: string;
  baseCapabilityDesignRevisionRef: string;
  resolvedCapabilityDesignRevisionRef: string;
  traces: AutomationCapabilitySelectionTrace[];
  resolution: GenericCapabilityResolutionBundle;
  createsCapabilitySelection: true;
  createsBinding: true;
  executionPlanAuthorized: false;
  temporalMappingAuthorized: false;
  deploymentAuthorized: false;
}

function nonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function suggestionImplementationKind(suggestion: IntegrationSuggestion): CapabilityOfferingRevision['implementationKind'] {
  switch (suggestion.implementationKind) {
    case 'DIRECT_API': return 'DIRECT_API';
    case 'MCP_TOOL': return 'MCP_TOOL';
    case 'N8N_WORKFLOW': return 'N8N_WORKFLOW';
    case 'HUMAN': return 'HUMAN_SERVICE';
  }
}

function exactDecision(
  workspace: AutomationDesignWorkspaceBundle,
  selection: SuggestionBackedCapabilitySelection,
): { decision: IntegrationSuggestionDecision; suggestion: IntegrationSuggestion } {
  const decision = workspace.decisions.find((item) => item.id === selection.suggestionDecisionRef);
  if (!decision) throw new TypeError('explicit capability selection references an unknown integration-suggestion decision');
  if (decision.capabilityRequirementRef !== selection.requirementRef) {
    throw new TypeError('suggestion decision does not belong to the selected capability requirement');
  }
  if (decision.decision !== 'ACCEPT' && decision.decision !== 'REPLACE') {
    throw new TypeError('explicit capability selection requires an ACCEPT or REPLACE suggestion decision');
  }
  const suggestion = workspace.suggestions.find((item) => item.id === decision.suggestionRef);
  if (!suggestion || suggestion.capabilityRequirementRef !== selection.requirementRef) {
    throw new TypeError('integration suggestion lineage is missing or mismatched');
  }
  return { decision, suggestion };
}

function resolutionFromSelection(
  workspace: AutomationDesignWorkspaceBundle,
  selection: AutomationCapabilitySelectionInput,
): {
  spec: GenericRequirementResolution;
  traceSeed: Omit<AutomationCapabilitySelectionTrace, 'id' | 'workspaceRevisionRef' | 'createdAt'>;
} {
  const authorityRef = nonEmpty(selection.authorityRef, 'authorityRef');
  const decidedBy = nonEmpty(selection.decidedBy, 'decidedBy');
  const rationale = nonEmpty(selection.rationale, 'rationale');

  if (selection.source === 'EXPLICIT_OFFERING') {
    const offeringCanonicalName = nonEmpty(selection.offeringCanonicalName, 'offeringCanonicalName');
    const implementationRef = nonEmpty(selection.implementationRef, 'implementationRef');
    return {
      spec: {
        requirementRef: selection.requirementRef,
        family: selection.family,
        ...(selection.operationIntent ? { operationIntent: selection.operationIntent } : {}),
        authorityRef,
        decidedBy,
        rationale,
        offeringCanonicalName,
        ...(selection.offeringLifecycleStatus ? { offeringLifecycleStatus: selection.offeringLifecycleStatus } : {}),
        implementationKind: selection.implementationKind,
        implementationRef,
        ...(selection.human ? { human: selection.human } : {}),
      },
      traceSeed: {
        capabilityRequirementRef: selection.requirementRef,
        source: selection.source,
        selectedFamily: selection.family,
        selectedOfferingCanonicalName: offeringCanonicalName,
        selectedImplementationKind: selection.implementationKind,
        selectedImplementationRef: implementationRef,
        authorityRef,
        decidedBy,
        rationale,
        createsCapabilitySelection: true,
        createsBinding: true,
      },
    };
  }

  const { decision, suggestion } = exactDecision(workspace, selection);
  const selected = decision.decision === 'REPLACE'
    ? decision.replacement!
    : {
        canonicalName: suggestion.canonicalName,
        implementationKind: suggestion.implementationKind,
        implementationRef: suggestion.implementationRef,
      };
  const implementationKind = decision.decision === 'REPLACE'
    ? (selected.implementationKind === 'HUMAN' ? 'HUMAN_SERVICE' : selected.implementationKind)
    : suggestionImplementationKind(suggestion);

  return {
    spec: {
      requirementRef: selection.requirementRef,
      family: suggestion.family,
      authorityRef,
      decidedBy,
      rationale,
      offeringCanonicalName: selected.canonicalName,
      implementationKind: implementationKind as CapabilityOfferingRevision['implementationKind'],
      implementationRef: selected.implementationRef,
      ...(selection.human ? { human: selection.human } : {}),
    },
    traceSeed: {
      capabilityRequirementRef: selection.requirementRef,
      source: selection.source,
      suggestionDecisionRef: decision.id,
      selectedFamily: suggestion.family,
      selectedOfferingCanonicalName: selected.canonicalName,
      selectedImplementationKind: implementationKind as CapabilityOfferingRevision['implementationKind'],
      selectedImplementationRef: selected.implementationRef,
      authorityRef,
      decidedBy,
      rationale,
      createsCapabilitySelection: true,
      createsBinding: true,
    },
  };
}

export function selectAndBindAutomationCapabilities(
  base: CapabilityDesignBundle,
  workspace: AutomationDesignWorkspaceBundle,
  selections: AutomationCapabilitySelectionInput[],
  createdAt: string,
): AutomationCapabilitySelectionResult {
  if (workspace.workspace.capabilityDesignRevisionRef !== base.designRevision.id) {
    throw new TypeError('capability selection must use the exact CapabilityDesignRevision pinned by the automation workspace');
  }
  if (workspace.workspace.processRevisionRef !== base.designRevision.processRevisionId) {
    throw new TypeError('automation workspace process pin does not match capability design');
  }
  if (workspace.workspace.createsBinding || workspace.workspace.capabilitySelectionCreated || workspace.workspace.bindingAuthorized) {
    throw new TypeError('I8-04 requires an unbound I8-03 automation workspace revision');
  }
  if (selections.length !== base.requirements.length) {
    throw new TypeError('explicit capability selection requires exactly one selection per capability requirement');
  }
  const seen = new Set<string>();
  for (const selection of selections) {
    if (seen.has(selection.requirementRef)) throw new TypeError(`duplicate explicit selection for ${selection.requirementRef}`);
    if (!base.requirements.some((requirement) => requirement.id === selection.requirementRef)) {
      throw new TypeError(`explicit selection references unknown capability requirement ${selection.requirementRef}`);
    }
    seen.add(selection.requirementRef);
  }

  const prepared = selections.map((selection) => resolutionFromSelection(workspace, selection));
  const resolution = resolveGenericCapabilities(base, prepared.map((item) => item.spec), createdAt);
  const traces = prepared.map((item) => ({
    id: createOpaqueId(
      'capability',
      `automation-capability-selection:${workspace.workspace.id}:${item.traceSeed.capabilityRequirementRef}:${item.traceSeed.selectedImplementationRef}`,
    ),
    workspaceRevisionRef: workspace.workspace.id,
    ...item.traceSeed,
    createdAt,
  }));

  return {
    workspaceRevisionRef: workspace.workspace.id,
    baseCapabilityDesignRevisionRef: base.designRevision.id,
    resolvedCapabilityDesignRevisionRef: resolution.designRevision.id,
    traces,
    resolution,
    createsCapabilitySelection: true,
    createsBinding: true,
    executionPlanAuthorized: false,
    temporalMappingAuthorized: false,
    deploymentAuthorized: false,
  };
}
