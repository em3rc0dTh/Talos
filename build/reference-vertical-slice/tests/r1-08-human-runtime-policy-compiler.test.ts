import assert from 'node:assert/strict';
import test from 'node:test';
import { digestDeterministicJson } from '../packages/foundation/src/digest.ts';
import { designGenericRuntimePolicy } from '../packages/runtime-policy/src/generic-policy.ts';
import { compileGenericRuntimeProgram } from '../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';

const AT = '2026-08-27T00:30:00.000Z';

function humanExecution() {
  return {
    definition: { id: 'exe-definition-human' },
    revision: { id: 'exe-revision-human', readiness: 'READY_FOR_TEMPORAL_MAPPING_DESIGN' },
    assessment: { readiness: 'READY_FOR_TEMPORAL_MAPPING_DESIGN' },
    elements: [
      {
        id: 'exe-human',
        kind: 'HUMAN_COORDINATION',
        capabilityUseRefs: ['exe-use-human'],
        semanticSubjectRefs: ['node-human'],
      },
      {
        id: 'exe-complete',
        kind: 'COMPLETION_COORDINATION',
        capabilityUseRefs: [],
        semanticSubjectRefs: ['node-complete'],
      },
    ],
    relations: [
      {
        id: 'exe-relation-human-complete',
        sourceElementRef: 'exe-human',
        targetElementRef: 'exe-complete',
        relationKind: 'SEQUENCE',
      },
    ],
    capabilityUses: [
      {
        id: 'exe-use-human',
        capabilityBindingRevisionRef: 'cap-binding-human',
      },
    ],
  } as any;
}

function humanMapping() {
  return {
    revision: {
      id: 'tmp-revision-human',
      executionPlanRevisionRef: 'exe-revision-human',
    },
    featureProfile: { id: 'tmp-feature-human' },
    workflowBoundaries: [{ id: 'tmp-workflow-boundary-human' }],
    units: [
      {
        id: 'tmp-update-human',
        constructKind: 'UPDATE_HANDLER',
        executionSubjectRefs: ['exe-human', 'exe-use-human'],
      },
      {
        id: 'tmp-condition-human',
        constructKind: 'WORKFLOW_CONDITION',
        executionSubjectRefs: ['exe-human', 'exe-use-human'],
      },
      {
        id: 'tmp-completion-human',
        constructKind: 'WORKFLOW_LOGIC',
        executionSubjectRefs: ['exe-complete'],
      },
    ],
    assessment: { readiness: 'READY_FOR_RUNTIME_POLICY_DESIGN' },
  } as any;
}

function workflowPolicy() {
  return {
    authorityRef: 'authority:r1-human-workflow-policy',
    decidedBy: 'r1-human-runtime-architect',
    rationale: 'Human coordination stays in Workflow state; Workflow retries remain explicitly bounded.',
    maximumAttempts: 1,
    policyBasis: 'REFERENCE_TEST_DESIGN' as const,
  };
}

function deployment(policyRevisionId: string) {
  return {
    revision: {
      id: 'deployment-revision-human',
      executionPlanRevisionRef: 'exe-revision-human',
      temporalMappingRevisionRef: 'tmp-revision-human',
      runtimePolicyRevisionRef: policyRevisionId,
    },
    assessment: { readiness: 'INCOMPLETE_ENVIRONMENT_REALIZATION' },
    namingIntent: {
      desiredWorkflowTypeName: 'TalosGenericWorkflow',
      desiredActivityTypeName: 'executeGenericCapability',
      desiredTaskQueueKey: 'talos-r1-human-main',
      desiredWorkerLogicalName: 'talos-r1-human-worker',
    },
    targetProfile: { environmentClass: 'TEST' },
    namespaceResolution: { desiredNamespaceKey: 'talos-r1-human-test' },
  } as any;
}

function semantics() {
  const conditionRules: any[] = [];
  const waits: any[] = [];
  const humans = [{
    executionElementRef: 'exe-human',
    capabilityUseOccurrenceRef: 'exe-use-human',
    temporalMappingUnitRef: 'tmp-update-human',
    messageKind: 'UPDATE_HANDLER' as const,
    humanInteractionDesignRef: 'cap-human-design',
    participantRequirementRef: 'cap-human-participant',
    participantRoleRefs: ['role:manager'],
    outcomeContractRef: 'cap-human-outcomes',
    outcomes: [
      {
        outcomeRef: 'cap-outcome-approve',
        outcomeCode: 'APPROVE',
        businessMeaning: 'Approve the request',
        terminalForInteraction: true,
      },
      {
        outcomeRef: 'cap-outcome-reject',
        outcomeCode: 'REJECT',
        businessMeaning: 'Reject the request',
        terminalForInteraction: true,
      },
    ],
  }];
  return {
    conditionRules,
    waits,
    humans,
    snapshotDigest: digestDeterministicJson({ conditionRules, waits, humans }),
  };
}

function fakeActivityPolicyForHuman() {
  return {
    capabilityUseOccurrenceRef: 'exe-use-human',
    authorityRef: 'authority:invalid-human-activity-policy',
    decidedBy: 'bad-runtime-designer',
    rationale: 'This must be rejected because human coordination is not an Activity.',
    policyBasis: 'REFERENCE_TEST_DESIGN' as const,
    retry: {
      initialIntervalMs: 10,
      backoffCoefficient: 2,
      maximumIntervalMs: 100,
      maximumAttempts: 2,
      nonRetryableFailureTypes: ['INVALID_REQUEST'],
    },
    timeout: { startToCloseMs: 1000, scheduleToCloseMs: 2000 },
    idempotency: {
      requirement: 'REQUIRED' as const,
      strategyKind: 'IDEMPOTENCY_KEY' as const,
      keyContract: 'invalid-human-activity-key',
    },
    failureClassifications: [{ failureType: 'INVALID_REQUEST', retryable: false, businessFailure: false }],
  };
}

test('R1-08H human-only execution requires zero Activity runtime policies and still gets explicit Workflow policy', () => {
  const execution = humanExecution();
  const mapping = humanMapping();
  const policy = designGenericRuntimePolicy(execution, mapping, [], workflowPolicy(), AT);

  assert.equal(policy.assessment.readiness, 'READY_FOR_DEPLOYMENT_DESIGN');
  assert.equal(policy.activityPolicies.length, 0);
  assert.equal(policy.timeoutPolicies.length, 0);
  assert.equal(policy.idempotencyPolicies.length, 0);
  assert.equal(policy.failurePolicies.length, 0);
  assert.equal(policy.retryPolicies.length, 1, 'only explicit Workflow retry policy should exist');
  assert.equal(policy.retryPolicies[0].policySubjectRef, 'tmp-workflow-boundary-human');
});

test('R1-08H runtime policy refuses to attach Activity retry/timeout/idempotency semantics to a human use', () => {
  assert.throws(
    () => designGenericRuntimePolicy(humanExecution(), humanMapping(), [fakeActivityPolicyForHuman()], workflowPolicy(), AT),
    /exactly one explicit policy resolution per Activity capability use|non-Activity capability use/,
  );
});

test('R1-08H complete frozen human semantics compile into Workflow-native UPDATE + condition with no Activity policies', () => {
  const execution = humanExecution();
  const mapping = humanMapping();
  const policy = designGenericRuntimePolicy(execution, mapping, [], workflowPolicy(), AT);
  const program = compileGenericRuntimeProgram(
    execution,
    mapping,
    policy,
    deployment(policy.revision.id),
    semantics(),
    { family: 'TEMPORAL_TYPESCRIPT_SDK', version: '1.22.0' },
  );

  assert.equal(program.activity.policies.length, 0);
  const human = program.graph.elements.find((item) => item.id === 'exe-human');
  assert(human);
  assert.deepEqual(human.constructKinds, ['UPDATE_HANDLER', 'WORKFLOW_CONDITION']);
  assert.equal(program.semantics.humans?.[0]?.outcomeContractRef, 'cap-human-outcomes');
  assert.deepEqual(program.semantics.humans?.[0]?.participantRoleRefs, ['role:manager']);
});

test('R1-08H compiler refuses human fan-out until explicit outcome-to-relation routing authority exists', () => {
  const execution = humanExecution();
  execution.relations.push({
    id: 'exe-relation-human-second-path',
    sourceElementRef: 'exe-human',
    targetElementRef: 'exe-complete',
    relationKind: 'SEQUENCE',
  });
  const mapping = humanMapping();
  const policy = designGenericRuntimePolicy(execution, mapping, [], workflowPolicy(), AT);

  assert.throws(
    () => compileGenericRuntimeProgram(
      execution,
      mapping,
      policy,
      deployment(policy.revision.id),
      semantics(),
      { family: 'TEMPORAL_TYPESCRIPT_SDK', version: '1.22.0' },
    ),
    /TALOS_RUNTIME_HUMAN_OUTCOME_ROUTING_REQUIRED/,
  );
});

test('R1-08H compiler refuses a human element when frozen participant/outcome semantics are missing', () => {
  const execution = humanExecution();
  const mapping = humanMapping();
  const policy = designGenericRuntimePolicy(execution, mapping, [], workflowPolicy(), AT);
  const conditionRules: any[] = [];
  const waits: any[] = [];
  const emptyHumans: any[] = [];
  const incomplete = {
    conditionRules,
    waits,
    humans: emptyHumans,
    snapshotDigest: digestDeterministicJson({ conditionRules, waits, humans: emptyHumans }),
  };

  assert.throws(
    () => compileGenericRuntimeProgram(
      execution,
      mapping,
      policy,
      deployment(policy.revision.id),
      incomplete,
      { family: 'TEMPORAL_TYPESCRIPT_SDK', version: '1.22.0' },
    ),
    /exactly one entry per HUMAN_COORDINATION element/,
  );
});
