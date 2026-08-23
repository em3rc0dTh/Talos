import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import {
  decideAutomationDesignSuggestion,
  openAutomationDesignWorkspace,
} from '../packages/capability/src/automation-design-workspace.ts';

const requirement = (family: string, seed: string, requirementState = 'REQUIRED') => ({
  id: createOpaqueId('capability', `requirement:${seed}`),
  capabilityDesignRevisionId: createOpaqueId('capability', 'design:i8-03'),
  semanticScopeRef: createOpaqueId('semantic', 'scope:i8-03'),
  semanticSubjectRefs: [createOpaqueId('canonical', `subject:${seed}`)],
  family,
  operationIntent: 'PERFORM_ACTION',
  requirementBasis: 'SEMANTIC_DERIVED',
  constraintRefs: [],
  safetyRequirementRefs: [],
  requirementState,
  provenanceTraceRef: createOpaqueId('capability', `trace:${seed}`),
  facetRefs: [],
});

const design = (requirements: any[]) => ({
  designRevision: {
    id: createOpaqueId('capability', 'design:i8-03'),
    semanticFreezeRecordId: createOpaqueId('review', 'freeze:i8-03'),
    scopeFreezeRefs: [createOpaqueId('review', 'scope-freeze:i8-03')],
    processRevisionId: createOpaqueId('canonical', 'process:i8-03'),
    validationAssessmentRefs: [createOpaqueId('semantic', 'assessment:i8-03')],
    requirementRefs: requirements.map((item) => item.id),
    unresolvedRequirementRefs: requirements.filter((item) => item.requirementState === 'UNRESOLVED').map((item) => item.id),
    designState: requirements.some((item) => item.requirementState === 'UNRESOLVED') ? 'NEEDS_DESIGN_DECISION' : 'READY_FOR_BINDING',
    designDigest: 'digest:i8-03',
    createdAt: '2026-08-23T21:30:00.000Z',
  },
  requirements,
  facets: [],
  provenanceTraces: [],
  designerRef: 'test-designer',
  designerVersion: 'test-v1',
});

test('I8-03 opens one automation-design view across requirements without creating downstream authority', () => {
  const communication = requirement('COMMUNICATION', 'notify');
  const unknown = requirement('SOURCE_DEFINED', 'unknown', 'UNRESOLVED');
  const opened = openAutomationDesignWorkspace(design([communication, unknown]) as any, '2026-08-23T21:31:00.000Z');

  assert.equal(opened.workspace.requirements.length, 2);
  assert.equal(opened.workspace.state, 'BLOCKED_UNRESOLVED_CAPABILITY');
  assert.deepEqual(opened.workspace.unresolvedRequirementRefs, [unknown.id]);
  assert.deepEqual(opened.suggestions.map((item) => item.canonicalName), ['Gmail', 'Slack', 'n8n workflow']);
  assert.equal(opened.suggestions.every((item) => item.capabilityRequirementRef === communication.id), true);
  assert.equal(opened.suggestions.every((item) => item.createsBinding === false), true);
  assert.equal(opened.workspace.createsBinding, false);
  assert.equal(opened.workspace.capabilitySelectionCreated, false);
  assert.equal(opened.workspace.bindingAuthorized, false);
  assert.equal(opened.workspace.executionPlanAuthorized, false);
});

test('I8-03 ACCEPT records user direction but still requires an explicit capability selection', () => {
  const communication = requirement('COMMUNICATION', 'notify');
  const capabilityDesign = design([communication]) as any;
  const opened = openAutomationDesignWorkspace(capabilityDesign, '2026-08-23T21:32:00.000Z');

  assert.equal(opened.workspace.state, 'AWAITING_USER_DECISIONS');
  const gmail = opened.suggestions.find((item) => item.canonicalName === 'Gmail');
  assert.ok(gmail);

  const decided = decideAutomationDesignSuggestion(capabilityDesign, opened, {
    suggestionRef: gmail.id,
    capabilityRequirementRef: communication.id,
    decision: 'ACCEPT',
    decidedBy: 'business-owner',
    authorityRef: 'authority:business-owner',
    rationale: 'Use Gmail as the preferred implementation direction.',
    decidedAt: '2026-08-23T21:33:00.000Z',
  });

  assert.equal(decided.decisions.length, 1);
  assert.equal(decided.decisions[0].decision, 'ACCEPT');
  assert.equal(decided.decisions[0].createsBinding, false);
  assert.equal(decided.workspace.state, 'READY_FOR_EXPLICIT_SELECTION');
  assert.equal(decided.workspace.capabilitySelectionCreated, false);
  assert.equal(decided.workspace.bindingAuthorized, false);
  assert.equal(decided.workspace.executionPlanAuthorized, false);
});

test('I8-03 REPLACE keeps the replacement proposal under user authority without binding it', () => {
  const communication = requirement('COMMUNICATION', 'notify');
  const capabilityDesign = design([communication]) as any;
  const opened = openAutomationDesignWorkspace(capabilityDesign, '2026-08-23T21:34:00.000Z');
  const gmail = opened.suggestions.find((item) => item.canonicalName === 'Gmail');
  assert.ok(gmail);

  const decided = decideAutomationDesignSuggestion(capabilityDesign, opened, {
    suggestionRef: gmail.id,
    capabilityRequirementRef: communication.id,
    decision: 'REPLACE',
    decidedBy: 'business-owner',
    authorityRef: 'authority:business-owner',
    rationale: 'Use the company notification gateway instead.',
    replacement: {
      canonicalName: 'Company notification gateway',
      implementationKind: 'DIRECT_API',
      implementationRef: 'internal:notification-gateway',
    },
    decidedAt: '2026-08-23T21:35:00.000Z',
  });

  assert.equal(decided.decisions[0].replacement?.implementationRef, 'internal:notification-gateway');
  assert.equal(decided.workspace.state, 'READY_FOR_EXPLICIT_SELECTION');
  assert.equal(decided.workspace.createsBinding, false);
});

test('I8-03 rejects stale workspace pins, duplicate suggestion decisions and competing accepted directions', () => {
  const communication = requirement('COMMUNICATION', 'notify');
  const capabilityDesign = design([communication]) as any;
  const opened = openAutomationDesignWorkspace(capabilityDesign, '2026-08-23T21:36:00.000Z');
  const gmail = opened.suggestions.find((item) => item.canonicalName === 'Gmail');
  const slack = opened.suggestions.find((item) => item.canonicalName === 'Slack');
  assert.ok(gmail && slack);

  const accepted = decideAutomationDesignSuggestion(capabilityDesign, opened, {
    suggestionRef: gmail.id,
    capabilityRequirementRef: communication.id,
    decision: 'ACCEPT',
    decidedBy: 'owner',
    authorityRef: 'authority:owner',
    rationale: 'Preferred direction.',
    decidedAt: '2026-08-23T21:37:00.000Z',
  });

  assert.throws(() => decideAutomationDesignSuggestion(capabilityDesign, accepted, {
    suggestionRef: gmail.id,
    capabilityRequirementRef: communication.id,
    decision: 'REJECT',
    decidedBy: 'owner',
    authorityRef: 'authority:owner',
    rationale: 'Duplicate decision should fail.',
    decidedAt: '2026-08-23T21:38:00.000Z',
  }));

  assert.throws(() => decideAutomationDesignSuggestion(capabilityDesign, accepted, {
    suggestionRef: slack.id,
    capabilityRequirementRef: communication.id,
    decision: 'ACCEPT',
    decidedBy: 'owner',
    authorityRef: 'authority:owner',
    rationale: 'A competing accepted direction should fail.',
    decidedAt: '2026-08-23T21:39:00.000Z',
  }));

  const differentDesign = design([communication]) as any;
  differentDesign.designRevision.id = createOpaqueId('capability', 'different-design');
  assert.throws(() => decideAutomationDesignSuggestion(differentDesign, opened, {
    suggestionRef: gmail.id,
    capabilityRequirementRef: communication.id,
    decision: 'DEFER',
    decidedBy: 'owner',
    authorityRef: 'authority:owner',
    rationale: 'Stale pin should fail.',
    decidedAt: '2026-08-23T21:40:00.000Z',
  }));
});
