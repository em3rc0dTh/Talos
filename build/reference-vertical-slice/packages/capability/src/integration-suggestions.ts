import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { CapabilityRequirement } from './types.ts';

export type IntegrationSuggestionState = 'SUGGESTED';
export type IntegrationSuggestionDecisionKind = 'ACCEPT' | 'REPLACE' | 'REJECT' | 'DEFER';

export interface IntegrationSuggestion {
  id: string;
  capabilityRequirementRef: string;
  family: CapabilityRequirement['family'];
  canonicalName: string;
  implementationKind: 'DIRECT_API' | 'MCP_TOOL' | 'N8N_WORKFLOW' | 'HUMAN';
  implementationRef: string;
  rationale: string;
  state: IntegrationSuggestionState;
  generatedFrom: 'CAPABILITY_FAMILY';
  createsBinding: false;
  createdAt: string;
}

export interface IntegrationSuggestionDecision {
  id: string;
  suggestionRef: string;
  capabilityRequirementRef: string;
  decision: IntegrationSuggestionDecisionKind;
  decidedBy: string;
  authorityRef: string;
  rationale: string;
  replacement?: {
    canonicalName: string;
    implementationKind: IntegrationSuggestion['implementationKind'];
    implementationRef: string;
  };
  createsBinding: false;
  decidedAt: string;
}

const suggestionId = (seed: string) => createOpaqueId('capability', seed);

type CatalogEntry = Omit<IntegrationSuggestion, 'id' | 'capabilityRequirementRef' | 'family' | 'state' | 'generatedFrom' | 'createsBinding' | 'createdAt'>;

const CATALOG: Partial<Record<CapabilityRequirement['family'], readonly CatalogEntry[]>> = {
  COMMUNICATION: [
    { canonicalName: 'Gmail', implementationKind: 'DIRECT_API', implementationRef: 'suggestion:gmail', rationale: 'Possible email delivery implementation.' },
    { canonicalName: 'Slack', implementationKind: 'DIRECT_API', implementationRef: 'suggestion:slack', rationale: 'Possible team-message implementation.' },
    { canonicalName: 'n8n workflow', implementationKind: 'N8N_WORKFLOW', implementationRef: 'suggestion:n8n:communication', rationale: 'Possible delegated integration workflow.' },
  ],
  DOCUMENT_MANAGEMENT: [
    { canonicalName: 'Google Drive', implementationKind: 'DIRECT_API', implementationRef: 'suggestion:google-drive', rationale: 'Possible document storage implementation.' },
  ],
  HUMAN_INTERACTION: [
    { canonicalName: 'Talos human task', implementationKind: 'HUMAN', implementationRef: 'suggestion:talos-human-task', rationale: 'Possible tracked human interaction; no form is implied.' },
  ],
  AI_TASK: [
    { canonicalName: 'Configured AI capability', implementationKind: 'MCP_TOOL', implementationRef: 'suggestion:configured-ai', rationale: 'Possible bounded AI capability; provider/model remains undecided.' },
  ],
};

function nonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

export function suggestIntegrations(requirements: readonly CapabilityRequirement[], createdAt: string): IntegrationSuggestion[] {
  const suggestions: IntegrationSuggestion[] = [];
  for (const requirement of requirements) {
    for (const entry of CATALOG[requirement.family] ?? []) {
      const id = suggestionId(`integration-suggestion:${requirement.id}:${entry.implementationRef}`);
      suggestions.push({
        id,
        capabilityRequirementRef: requirement.id,
        family: requirement.family,
        ...entry,
        state: 'SUGGESTED',
        generatedFrom: 'CAPABILITY_FAMILY',
        createsBinding: false,
        createdAt,
      });
    }
  }
  return suggestions;
}

export function decideIntegrationSuggestion(
  suggestions: readonly IntegrationSuggestion[],
  input: {
    suggestionRef: string;
    capabilityRequirementRef: string;
    decision: IntegrationSuggestionDecisionKind;
    decidedBy: string;
    authorityRef: string;
    rationale: string;
    replacement?: IntegrationSuggestionDecision['replacement'];
    decidedAt: string;
  },
): IntegrationSuggestionDecision {
  const suggestion = suggestions.find((item) => item.id === input.suggestionRef);
  if (!suggestion || suggestion.capabilityRequirementRef !== input.capabilityRequirementRef) {
    throw new TypeError('integration suggestion decision must target the exact suggestion and capability requirement');
  }
  if (input.decision === 'REPLACE' && !input.replacement) throw new TypeError('REPLACE requires an explicit replacement');
  if (input.decision !== 'REPLACE' && input.replacement) throw new TypeError('replacement is only valid for REPLACE');
  const decidedBy = nonEmpty(input.decidedBy, 'decidedBy');
  const authorityRef = nonEmpty(input.authorityRef, 'authorityRef');
  const rationale = nonEmpty(input.rationale, 'rationale');
  if (input.replacement) {
    nonEmpty(input.replacement.canonicalName, 'replacement canonicalName');
    nonEmpty(input.replacement.implementationRef, 'replacement implementationRef');
  }
  const digest = digestDeterministicJson({
    suggestionRef: suggestion.id,
    capabilityRequirementRef: suggestion.capabilityRequirementRef,
    decision: input.decision,
    decidedBy,
    authorityRef,
    rationale,
    ...(input.replacement ? { replacement: input.replacement } : {}),
  });
  return {
    id: suggestionId(`integration-suggestion-decision:${digest}`),
    suggestionRef: suggestion.id,
    capabilityRequirementRef: suggestion.capabilityRequirementRef,
    decision: input.decision,
    decidedBy,
    authorityRef,
    rationale,
    ...(input.replacement ? { replacement: input.replacement } : {}),
    createsBinding: false,
    decidedAt: input.decidedAt,
  };
}
