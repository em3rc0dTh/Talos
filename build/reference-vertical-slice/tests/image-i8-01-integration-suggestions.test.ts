import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { decideIntegrationSuggestion, suggestIntegrations } from '../packages/capability/src/integration-suggestions.ts';

const requirement = (family: string, seed: string) => ({
  id: createOpaqueId('capability', seed),
  capabilityDesignRevisionId: createOpaqueId('capability', 'design'),
  semanticScopeRef: createOpaqueId('semantic', 'scope'),
  semanticSubjectRefs: [createOpaqueId('canonical', seed)],
  family,
  operationIntent: 'PERFORM_ACTION',
  requirementBasis: 'SEMANTIC_DERIVED',
  constraintRefs: [],
  safetyRequirementRefs: [],
  requirementState: 'REQUIRED',
  provenanceTraceRef: createOpaqueId('capability', `trace:${seed}`),
  facetRefs: [],
});

test('I8-01 suggests integrations only from capability family and creates no binding', () => {
  const suggestions = suggestIntegrations([
    requirement('COMMUNICATION', 'notify'),
    requirement('SOURCE_DEFINED', 'unknown-work'),
  ] as any, '2026-08-21T15:00:00.000Z');
  assert.deepEqual(suggestions.map((item) => item.canonicalName), ['Gmail', 'Slack', 'n8n workflow']);
  assert.equal(suggestions.every((item) => item.state === 'SUGGESTED'), true);
  assert.equal(suggestions.every((item) => item.createsBinding === false), true);
  assert.equal(JSON.stringify(suggestions).includes('unknown-work'), false);
});

test('I8-01 user can accept, replace, reject or defer without creating a binding', () => {
  const suggestions = suggestIntegrations([requirement('COMMUNICATION', 'notify')] as any, '2026-08-21T15:00:00.000Z');
  for (const decision of ['ACCEPT', 'REJECT', 'DEFER'] as const) {
    const result = decideIntegrationSuggestion(suggestions, {
      suggestionRef: suggestions[0].id,
      capabilityRequirementRef: suggestions[0].capabilityRequirementRef,
      decision,
      decidedBy: 'business-owner',
      authorityRef: 'authority:business-owner',
      rationale: `User chose ${decision}`,
      decidedAt: '2026-08-21T15:01:00.000Z',
    });
    assert.equal(result.decision, decision);
    assert.equal(result.createsBinding, false);
  }
  const replacement = decideIntegrationSuggestion(suggestions, {
    suggestionRef: suggestions[0].id,
    capabilityRequirementRef: suggestions[0].capabilityRequirementRef,
    decision: 'REPLACE',
    decidedBy: 'business-owner',
    authorityRef: 'authority:business-owner',
    rationale: 'Use the internal notification API.',
    replacement: { canonicalName: 'Internal notification', implementationKind: 'DIRECT_API', implementationRef: 'internal:notification-api' },
    decidedAt: '2026-08-21T15:02:00.000Z',
  });
  assert.equal(replacement.replacement?.canonicalName, 'Internal notification');
  assert.equal(replacement.createsBinding, false);
});

test('I8-01 rejects decisions against a different requirement or missing replacement', () => {
  const suggestions = suggestIntegrations([requirement('COMMUNICATION', 'notify')] as any, '2026-08-21T15:00:00.000Z');
  assert.throws(() => decideIntegrationSuggestion(suggestions, {
    suggestionRef: suggestions[0].id,
    capabilityRequirementRef: 'wrong',
    decision: 'ACCEPT',
    decidedBy: 'owner',
    authorityRef: 'authority:owner',
    rationale: 'wrong target',
    decidedAt: '2026-08-21T15:03:00.000Z',
  }));
  assert.throws(() => decideIntegrationSuggestion(suggestions, {
    suggestionRef: suggestions[0].id,
    capabilityRequirementRef: suggestions[0].capabilityRequirementRef,
    decision: 'REPLACE',
    decidedBy: 'owner',
    authorityRef: 'authority:owner',
    rationale: 'missing replacement',
    decidedAt: '2026-08-21T15:03:00.000Z',
  }));
});
