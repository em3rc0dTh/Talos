import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import {
  decideAutomationDesignSuggestion,
  openAutomationDesignWorkspace,
} from '../packages/capability/src/automation-design-workspace.ts';
import { selectAndBindAutomationCapabilities } from '../packages/capability/src/automation-capability-selection.ts';
import type { CapabilityDesignBundle } from '../packages/capability/src/generic-design.ts';
import type { CapabilityFamily, CapabilityRequirement } from '../packages/capability/src/types.ts';

const T = '2026-08-23T21:45:00.000Z';
const cap = (seed: string) => createOpaqueId('capability', `i8-04:${seed}`);
const canonical = (seed: string) => createOpaqueId('canonical', `i8-04:${seed}`);
const review = (seed: string) => createOpaqueId('review', `i8-04:${seed}`);
const validation = (seed: string) => createOpaqueId('validation', `i8-04:${seed}`);

function capabilityDesign(specs: Array<{
  seed: string;
  family: CapabilityFamily;
  requirementState?: CapabilityRequirement['requirementState'];
  operationIntent?: string;
}>): CapabilityDesignBundle {
  const designId = cap('design');
  const freezeId = review('freeze');
  const scopeFreezeId = review('scope-freeze');
  const processId = canonical('process');
  const assessmentId = validation('assessment');
  const scopeId = validation('scope');
  const requirements: CapabilityRequirement[] = specs.map((spec) => {
    const id = cap(`requirement:${spec.seed}`);
    return {
      id,
      capabilityDesignRevisionId: designId,
      semanticScopeRef: scopeId,
      semanticSubjectRefs: [canonical(`subject:${spec.seed}`)],
      family: spec.family,
      operationIntent: spec.operationIntent ?? 'PERFORM_ACTION',
      requirementBasis: 'SEMANTIC_DERIVED',
      constraintRefs: [],
      safetyRequirementRefs: [],
      requirementState: spec.requirementState ?? (spec.family === 'SOURCE_DEFINED' ? 'UNRESOLVED' : 'REQUIRED'),
      provenanceTraceRef: cap(`trace:${spec.seed}`),
      facetRefs: [],
    };
  });
  return {
    designRevision: {
      id: designId,
      semanticFreezeRecordId: freezeId,
      scopeFreezeRefs: [scopeFreezeId],
      processRevisionId: processId,
      validationAssessmentRefs: [assessmentId],
      requirementRefs: requirements.map((item) => item.id),
      unresolvedRequirementRefs: requirements.filter((item) => item.requirementState === 'UNRESOLVED').map((item) => item.id),
      designState: requirements.some((item) => item.requirementState === 'UNRESOLVED') ? 'NEEDS_DESIGN_DECISION' : 'READY_FOR_BINDING',
      designDigest: 'i8-04-design-digest',
      createdAt: T,
    },
    requirements,
    facets: [],
    provenanceTraces: requirements.map((requirement) => ({
      id: requirement.provenanceTraceRef,
      requirementId: requirement.id,
      semanticFreezeRecordId: freezeId,
      scopeFreezeRef: scopeFreezeId,
      processRevisionId: processId,
      semanticSubjectRefs: [...requirement.semanticSubjectRefs],
      semanticClaimRefs: [],
      validationAssessmentRefs: [assessmentId],
      derivationMethod: 'I8_04_TEST_FIXTURE',
      designerVersion: 'i8-04-test',
      createdAt: T,
    })),
    designerRef: 'i8-04-test-designer',
    designerVersion: 'i8-04-test',
  };
}

function acceptSuggestion(base: CapabilityDesignBundle, canonicalName: string) {
  const opened = openAutomationDesignWorkspace(base, '2026-08-23T21:46:00.000Z');
  const suggestion = opened.suggestions.find((item) => item.canonicalName === canonicalName);
  assert.ok(suggestion, `missing ${canonicalName} suggestion`);
  const decided = decideAutomationDesignSuggestion(base, opened, {
    suggestionRef: suggestion.id,
    capabilityRequirementRef: suggestion.capabilityRequirementRef,
    decision: 'ACCEPT',
    decidedBy: 'business-owner',
    authorityRef: 'authority:suggestion-direction',
    rationale: `${canonicalName} is the preferred design direction.`,
    decidedAt: '2026-08-23T21:47:00.000Z',
  });
  return { opened, decided, suggestion, decision: decided.decisions[0] };
}

test('I8-04 ACCEPTED suggestion remains unbound until a second explicit capability-selection action', () => {
  const base = capabilityDesign([{ seed: 'notify', family: 'COMMUNICATION' }]);
  const x = acceptSuggestion(base, 'Gmail');

  assert.equal(x.decision.createsBinding, false);
  assert.equal(x.decided.workspace.capabilitySelectionCreated, false);
  assert.equal(x.decided.workspace.bindingAuthorized, false);

  const selected = selectAndBindAutomationCapabilities(base, x.decided, [{
    source: 'SUGGESTION_DECISION',
    requirementRef: base.requirements[0].id,
    suggestionDecisionRef: x.decision.id,
    decidedBy: 'automation-designer',
    authorityRef: 'authority:explicit-capability-selection',
    rationale: 'Explicitly select and bind Gmail after reviewing the suggested direction.',
  }], '2026-08-23T21:48:00.000Z');

  assert.equal(selected.createsCapabilitySelection, true);
  assert.equal(selected.createsBinding, true);
  assert.equal(selected.traces[0].suggestionDecisionRef, x.decision.id);
  assert.equal(selected.traces[0].selectedOfferingCanonicalName, 'Gmail');
  assert.equal(selected.traces[0].selectedImplementationRef, 'suggestion:gmail');
  assert.equal(selected.traces[0].authorityRef, 'authority:explicit-capability-selection');
  assert.equal(selected.resolution.selectionDecisions.length, 1);
  assert.equal(selected.resolution.bindingRevisions.length, 1);
  assert.equal(selected.resolution.bindingAssessments[0].result, 'READY_FOR_EXECUTION_DESIGN');
  assert.equal(selected.executionPlanAuthorized, false);
  assert.equal(selected.temporalMappingAuthorized, false);
  assert.equal(selected.deploymentAuthorized, false);
});

test('I8-04 REPLACE binds the exact replacement only after explicit selection', () => {
  const base = capabilityDesign([{ seed: 'notify-replace', family: 'COMMUNICATION' }]);
  const opened = openAutomationDesignWorkspace(base, '2026-08-23T21:49:00.000Z');
  const gmail = opened.suggestions.find((item) => item.canonicalName === 'Gmail');
  assert.ok(gmail);
  const decided = decideAutomationDesignSuggestion(base, opened, {
    suggestionRef: gmail.id,
    capabilityRequirementRef: gmail.capabilityRequirementRef,
    decision: 'REPLACE',
    replacement: {
      canonicalName: 'Company notification gateway',
      implementationKind: 'DIRECT_API',
      implementationRef: 'internal:notification-gateway',
    },
    decidedBy: 'business-owner',
    authorityRef: 'authority:replacement-direction',
    rationale: 'Prefer the existing internal gateway.',
    decidedAt: '2026-08-23T21:50:00.000Z',
  });

  assert.equal(decided.decisions[0].createsBinding, false);
  const result = selectAndBindAutomationCapabilities(base, decided, [{
    source: 'SUGGESTION_DECISION',
    requirementRef: base.requirements[0].id,
    suggestionDecisionRef: decided.decisions[0].id,
    decidedBy: 'automation-designer',
    authorityRef: 'authority:explicit-replacement-selection',
    rationale: 'Bind the reviewed replacement explicitly.',
  }], '2026-08-23T21:51:00.000Z');

  assert.equal(result.traces[0].selectedOfferingCanonicalName, 'Company notification gateway');
  assert.equal(result.traces[0].selectedImplementationRef, 'internal:notification-gateway');
  assert.equal(result.resolution.offeringDefinitions[0].canonicalName, 'Company notification gateway');
  assert.equal(result.resolution.offeringRevisions[0].implementationRef, 'internal:notification-gateway');
});

test('I8-04 REJECT and DEFER suggestion decisions can never be promoted into a binding', () => {
  for (const decisionKind of ['REJECT', 'DEFER'] as const) {
    const base = capabilityDesign([{ seed: `notify-${decisionKind}`, family: 'COMMUNICATION' }]);
    const opened = openAutomationDesignWorkspace(base, '2026-08-23T21:52:00.000Z');
    const gmail = opened.suggestions.find((item) => item.canonicalName === 'Gmail');
    assert.ok(gmail);
    const decided = decideAutomationDesignSuggestion(base, opened, {
      suggestionRef: gmail.id,
      capabilityRequirementRef: gmail.capabilityRequirementRef,
      decision: decisionKind,
      decidedBy: 'business-owner',
      authorityRef: `authority:${decisionKind.toLowerCase()}`,
      rationale: `${decisionKind} this direction.`,
      decidedAt: '2026-08-23T21:53:00.000Z',
    });

    assert.throws(() => selectAndBindAutomationCapabilities(base, decided, [{
      source: 'SUGGESTION_DECISION',
      requirementRef: base.requirements[0].id,
      suggestionDecisionRef: decided.decisions[0].id,
      decidedBy: 'automation-designer',
      authorityRef: 'authority:invalid-promotion',
      rationale: 'This must fail.',
    }], '2026-08-23T21:54:00.000Z'), /ACCEPT or REPLACE/);
  }
});

test('I8-04 resolves SOURCE_DEFINED work only through an explicit offering choice', () => {
  const base = capabilityDesign([{ seed: 'unknown-work', family: 'SOURCE_DEFINED', requirementState: 'UNRESOLVED' }]);
  const workspace = openAutomationDesignWorkspace(base, '2026-08-23T21:55:00.000Z');
  assert.equal(workspace.workspace.state, 'BLOCKED_UNRESOLVED_CAPABILITY');
  assert.equal(workspace.suggestions.length, 0);

  const result = selectAndBindAutomationCapabilities(base, workspace, [{
    source: 'EXPLICIT_OFFERING',
    requirementRef: base.requirements[0].id,
    family: 'SYSTEM_OPERATION',
    offeringCanonicalName: 'Inventory API',
    implementationKind: 'DIRECT_API',
    implementationRef: 'internal:inventory-api',
    decidedBy: 'automation-designer',
    authorityRef: 'authority:explicit-unknown-resolution',
    rationale: 'The business owner explicitly identifies this work as an inventory system operation.',
  }], '2026-08-23T21:56:00.000Z');

  assert.equal(result.traces[0].source, 'EXPLICIT_OFFERING');
  assert.equal(result.traces[0].selectedFamily, 'SYSTEM_OPERATION');
  assert.equal(result.resolution.requirements[0].family, 'SYSTEM_OPERATION');
  assert.equal(result.resolution.requirements[0].requirementBasis, 'CONFIRMED_DESIGN');
  assert.equal(result.resolution.selectionDecisions[0].authorityRef, 'authority:explicit-unknown-resolution');
});

test('I8-04 explicit offering cannot override a frozen non-SOURCE_DEFINED capability family', () => {
  const base = capabilityDesign([{ seed: 'system-work', family: 'SYSTEM_OPERATION' }]);
  const workspace = openAutomationDesignWorkspace(base, '2026-08-23T21:57:00.000Z');

  assert.throws(() => selectAndBindAutomationCapabilities(base, workspace, [{
    source: 'EXPLICIT_OFFERING',
    requirementRef: base.requirements[0].id,
    family: 'COMMUNICATION',
    offeringCanonicalName: 'Gmail',
    implementationKind: 'DIRECT_API',
    implementationRef: 'gmail:send',
    decidedBy: 'automation-designer',
    authorityRef: 'authority:bad-family-override',
    rationale: 'Attempted semantic override must fail.',
  }], '2026-08-23T21:58:00.000Z'), /cannot override frozen semantic family SYSTEM_OPERATION/);
});

test('I8-04 human binding requires explicit participant and outcome design', () => {
  const base = capabilityDesign([{
    seed: 'human-review',
    family: 'HUMAN_INTERACTION',
    operationIntent: 'REVIEW',
  }]);
  const workspace = openAutomationDesignWorkspace(base, '2026-08-23T21:59:00.000Z');

  assert.throws(() => selectAndBindAutomationCapabilities(base, workspace, [{
    source: 'EXPLICIT_OFFERING',
    requirementRef: base.requirements[0].id,
    family: 'HUMAN_INTERACTION',
    offeringCanonicalName: 'Talos human task',
    implementationKind: 'HUMAN_SERVICE',
    implementationRef: 'talos:human-task',
    decidedBy: 'automation-designer',
    authorityRef: 'authority:human-selection',
    rationale: 'Human review is required.',
  }], '2026-08-23T22:00:00.000Z'), /requires human design/);

  const roleRef = canonical('role:reviewer');
  const result = selectAndBindAutomationCapabilities(base, workspace, [{
    source: 'EXPLICIT_OFFERING',
    requirementRef: base.requirements[0].id,
    family: 'HUMAN_INTERACTION',
    offeringCanonicalName: 'Talos human task',
    implementationKind: 'HUMAN_SERVICE',
    implementationRef: 'talos:human-task',
    decidedBy: 'automation-designer',
    authorityRef: 'authority:human-selection',
    rationale: 'Human review is required with an explicit reviewer and outcome.',
    human: {
      interactionKind: 'REVIEW',
      responsibilityKind: 'REVIEWER',
      roleRefs: [roleRef],
      outcomes: [{ code: 'REVIEWED', businessMeaning: 'The item has been reviewed.', terminal: true }],
    },
  }], '2026-08-23T22:01:00.000Z');

  assert.equal(result.resolution.humanDesigns.length, 1);
  assert.deepEqual(result.resolution.participantRequirements[0].roleRefs, [roleRef]);
  assert.equal(result.resolution.humanOutcomes[0].outcomeCode, 'REVIEWED');
});

test('I8-04 rejects stale workspace pins and requires exactly one explicit selection per requirement', () => {
  const base = capabilityDesign([
    { seed: 'one', family: 'SYSTEM_OPERATION' },
    { seed: 'two', family: 'AI_TASK' },
  ]);
  const workspace = openAutomationDesignWorkspace(base, '2026-08-23T22:02:00.000Z');

  assert.throws(() => selectAndBindAutomationCapabilities(base, workspace, [{
    source: 'EXPLICIT_OFFERING',
    requirementRef: base.requirements[0].id,
    family: 'SYSTEM_OPERATION',
    offeringCanonicalName: 'System API',
    implementationKind: 'DIRECT_API',
    implementationRef: 'system:api',
    decidedBy: 'designer',
    authorityRef: 'authority:designer',
    rationale: 'Only one of two requirements is supplied.',
  }], '2026-08-23T22:03:00.000Z'), /exactly one selection per capability requirement/);

  const stale = {
    ...workspace,
    workspace: { ...workspace.workspace, capabilityDesignRevisionRef: cap('stale-design') },
  };
  assert.throws(() => selectAndBindAutomationCapabilities(base, stale, [], '2026-08-23T22:04:00.000Z'), /exact CapabilityDesignRevision/);
});
