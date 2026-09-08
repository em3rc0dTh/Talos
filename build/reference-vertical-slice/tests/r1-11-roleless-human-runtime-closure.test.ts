import test from 'node:test';
import assert from 'node:assert/strict';
import { digestDeterministicJson } from '../packages/foundation/src/digest.ts';
import { buildOneAppHumanRuntimeSnapshots } from '../apps/reference-api/src/private-preview-human-runtime.ts';
import { compileGenericRuntimeProgram } from '../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';

function execution() {
  return {
    revision: { id: 'exe_roleless_runtime' },
    assessment: { readiness: 'READY_FOR_TEMPORAL_MAPPING_DESIGN' },
    elements: [
      {
        id: 'exe_human',
        kind: 'HUMAN_COORDINATION',
        capabilityUseRefs: ['use_human'],
        semanticSubjectRefs: ['prc_human'],
      },
      {
        id: 'exe_end',
        kind: 'COMPLETION_COORDINATION',
        capabilityUseRefs: [],
        semanticSubjectRefs: ['prc_end'],
      },
    ],
    relations: [{
      id: 'rel_human_end',
      sourceElementRef: 'exe_human',
      targetElementRef: 'exe_end',
      relationKind: 'SEQUENCE',
    }],
    capabilityUses: [{
      id: 'use_human',
      capabilityRequirementRef: 'cap_req_human',
      capabilityBindingRevisionRef: 'cap_binding_human',
    }],
  } as any;
}

function mapping() {
  return {
    revision: {
      id: 'tmp_roleless_runtime',
      executionPlanRevisionRef: 'exe_roleless_runtime',
    },
    assessment: { readiness: 'READY_FOR_RUNTIME_POLICY_DESIGN' },
    featureProfile: { id: 'tmp_feature_roleless' },
    workflowBoundaries: [{ id: 'tmp_workflow_roleless' }],
    units: [
      {
        id: 'tmp_human_update',
        constructKind: 'UPDATE_HANDLER',
        executionSubjectRefs: ['exe_human', 'use_human'],
      },
      {
        id: 'tmp_human_wait',
        constructKind: 'WORKFLOW_CONDITION',
        role: 'WAIT_FOR_ACCEPTED_HUMAN_OUTCOME',
        executionSubjectRefs: ['exe_human', 'use_human'],
      },
      {
        id: 'tmp_end_logic',
        constructKind: 'WORKFLOW_LOGIC',
        executionSubjectRefs: ['exe_end'],
      },
    ],
  } as any;
}

function context(assignmentCardinality = 'ANY_ELIGIBLE', actorTypeConstraints = ['HUMAN'], roleRefs: string[] = []) {
  return {
    executionReview: { execution: execution() },
    mapping: mapping(),
    selection: {
      resolution: {
        requirements: [{ id: 'cap_req_human', family: 'HUMAN_INTERACTION' }],
        humanDesigns: [{
          id: 'cap_human_design',
          capabilityRequirementId: 'cap_req_human',
          designState: 'COMPLETE',
          participantRequirementRef: 'cap_participant',
          outcomeContractRef: 'cap_outcomes',
        }],
        participantRequirements: [{
          id: 'cap_participant',
          participantState: 'COMPLETE',
          responsibilityKind: 'PERFORMER',
          roleRefs,
          actorTypeConstraints,
          assignmentCardinality,
        }],
        humanOutcomeContracts: [{
          id: 'cap_outcomes',
          unresolvedOutcomeRefs: [],
          outcomeRefs: ['cap_outcome_completed'],
        }],
        humanOutcomes: [{
          id: 'cap_outcome_completed',
          outcomeCode: 'COMPLETED',
          businessMeaning: 'The confirmed human work is completed.',
          terminalForInteraction: true,
        }],
      },
    },
  } as any;
}

function runtimePolicy() {
  return {
    revision: {
      id: 'rpl_roleless_runtime',
      executionPlanRevisionRef: 'exe_roleless_runtime',
      temporalMappingRevisionRef: 'tmp_roleless_runtime',
      workflowRetryPolicyRef: 'rpl_workflow_retry',
    },
    assessment: { readiness: 'READY_FOR_DEPLOYMENT_DESIGN' },
    activityPolicies: [],
    retryPolicies: [{ id: 'rpl_workflow_retry', maximumAttempts: 1 }],
    timeoutPolicies: [],
    idempotencyPolicies: [],
  } as any;
}

function deployment() {
  return {
    revision: {
      id: 'dep_roleless_runtime',
      executionPlanRevisionRef: 'exe_roleless_runtime',
      temporalMappingRevisionRef: 'tmp_roleless_runtime',
      runtimePolicyRevisionRef: 'rpl_roleless_runtime',
    },
    assessment: { readiness: 'INCOMPLETE_ENVIRONMENT_REALIZATION' },
    namingIntent: {
      desiredWorkflowTypeName: 'TalosGenericWorkflow',
      desiredActivityTypeName: 'executeGenericCapability',
      desiredTaskQueueKey: 'talos-r1-roleless',
      desiredWorkerLogicalName: 'talos-product-worker',
    },
    targetProfile: { environmentClass: 'TEST' },
    namespaceResolution: { desiredNamespaceKey: 'default' },
  } as any;
}

function semantics(humans: any[]) {
  const conditionRules: any[] = [];
  const waits: any[] = [];
  return {
    conditionRules,
    waits,
    humans,
    snapshotDigest: digestDeterministicJson({ conditionRules, waits, humans }),
  } as any;
}

test('R1-11 runtime snapshot preserves roleless ANY_ELIGIBLE human assignment without inventing a role', () => {
  const humans = buildOneAppHumanRuntimeSnapshots(context());
  assert.equal(humans.length, 1);
  assert.deepEqual(humans[0].participantRoleRefs, []);
  assert.equal(humans[0].participantAssignmentCardinality, 'ANY_ELIGIBLE');
  assert.deepEqual(humans[0].participantActorTypeConstraints, ['HUMAN']);

  const program = compileGenericRuntimeProgram(
    execution(),
    mapping(),
    runtimePolicy(),
    deployment(),
    semantics(humans),
    { family: 'TEMPORAL_TYPESCRIPT_SDK', version: '1.22.0' },
  );
  assert.deepEqual(program.semantics.humans?.[0]?.participantRoleRefs, []);
  assert.equal(program.semantics.humans?.[0]?.participantAssignmentCardinality, 'ANY_ELIGIBLE');
});

test('R1-11 roleless human runtime remains fail-closed without explicit ANY_ELIGIBLE + HUMAN semantics', () => {
  assert.throws(
    () => buildOneAppHumanRuntimeSnapshots(context('EXACTLY_ONE', [], [])),
    /TALOS_RUNTIME_HUMAN_PARTICIPANT_INCOMPLETE/,
  );

  const valid = buildOneAppHumanRuntimeSnapshots(context());
  const malformed = [{
    ...valid[0],
    participantAssignmentCardinality: 'EXACTLY_ONE',
    participantActorTypeConstraints: [],
  }];
  assert.throws(
    () => compileGenericRuntimeProgram(
      execution(),
      mapping(),
      runtimePolicy(),
      deployment(),
      semantics(malformed),
      { family: 'TEMPORAL_TYPESCRIPT_SDK', version: '1.22.0' },
    ),
    /TALOS_RUNTIME_HUMAN_PARTICIPANT_INCOMPLETE/,
  );
});
