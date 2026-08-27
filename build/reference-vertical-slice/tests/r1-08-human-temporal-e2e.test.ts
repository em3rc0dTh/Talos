import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { digestDeterministicJson } from '../packages/foundation/src/digest.ts';
import {
  GENERIC_HUMAN_UPDATE_NAME,
  GENERIC_RUNTIME_STATE_QUERY_NAME,
  type CompiledGenericRuntimeProgram,
  type GenericWorkflowRuntimeState,
} from '../workers/reference-temporal-worker/src/generic-contracts.ts';
import { createGenericTemporalWorker } from '../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import { TalosGenericWorkflow } from '../workers/reference-temporal-worker/src/generic-workflow.ts';

function humanProgram(): CompiledGenericRuntimeProgram {
  const conditionRules: any[] = [];
  const waits: any[] = [];
  const humans = [{
    executionElementRef: 'exe_human_review',
    capabilityUseOccurrenceRef: 'exe_use_human_review',
    temporalMappingUnitRef: 'tmp_update_human_review',
    messageKind: 'UPDATE_HANDLER' as const,
    humanInteractionDesignRef: 'cap_human_design_review',
    participantRequirementRef: 'cap_human_participant_manager',
    participantRoleRefs: ['role:manager'],
    outcomeContractRef: 'cap_human_outcomes_review',
    outcomes: [
      {
        outcomeRef: 'cap_human_outcome_approve',
        outcomeCode: 'APPROVE',
        businessMeaning: 'Approve the reviewed request',
        terminalForInteraction: true,
      },
      {
        outcomeRef: 'cap_human_outcome_reject',
        outcomeCode: 'REJECT',
        businessMeaning: 'Reject the reviewed request',
        terminalForInteraction: true,
      },
    ],
  }];
  const semantics = {
    conditionRules,
    waits,
    humans,
    snapshotDigest: digestDeterministicJson({ conditionRules, waits, humans }),
  };
  const material = {
    sdkTarget: { family: 'TEMPORAL_TYPESCRIPT_SDK' as const, version: '1.22.0' },
    executionPlanRevisionRef: 'exe_revision_human_test',
    temporalMappingRevisionRef: 'tmp_revision_human_test',
    runtimePolicyRevisionRef: 'rpl_revision_human_test',
    deploymentRevisionRef: 'deployment_revision_human_test',
    temporalFeatureProfileRef: 'tmp_feature_profile_human_test',
    workflow: { workflowTypeName: 'TalosGenericWorkflow', workflowMaximumAttempts: 1 },
    activity: { activityTypeName: 'executeGenericCapability', policies: [] },
    graph: {
      entryElementRef: 'exe_human_review',
      elements: [
        {
          id: 'exe_human_review',
          kind: 'HUMAN_COORDINATION',
          constructKinds: ['UPDATE_HANDLER', 'WORKFLOW_CONDITION'],
          capabilityUseOccurrenceRefs: ['exe_use_human_review'],
          semanticSubjectRefs: ['node_human_review'],
        },
        {
          id: 'exe_complete',
          kind: 'COMPLETION_COORDINATION',
          constructKinds: ['WORKFLOW_LOGIC'],
          capabilityUseOccurrenceRefs: [],
          semanticSubjectRefs: ['node_complete'],
        },
      ],
      relations: [
        {
          id: 'exe_relation_after_human',
          sourceElementRef: 'exe_human_review',
          targetElementRef: 'exe_complete',
          relationKind: 'SEQUENCE',
        },
      ],
    },
    semantics,
    deploymentIntent: {
      environmentClass: 'TEST' as const,
      desiredNamespaceKey: 'talos-r1-human-test',
      desiredTaskQueueKey: 'talos-r1-human-main',
      desiredWorkerLogicalName: 'talos-r1-human-worker',
      realizationState: 'INCOMPLETE_ENVIRONMENT_REALIZATION' as const,
    },
  };
  return {
    schemaVersion: 'talos.generic-runtime-program.v1',
    ...material,
    programDigest: digestDeterministicJson(material),
  };
}

async function waitForPendingHumanTask(handle: any): Promise<GenericWorkflowRuntimeState> {
  const deadline = Date.now() + 10_000;
  let last: unknown;
  while (Date.now() <= deadline) {
    try {
      const state = await handle.query(GENERIC_RUNTIME_STATE_QUERY_NAME) as GenericWorkflowRuntimeState;
      if (state.pendingHumanTask) return state;
      last = state;
    } catch (error) {
      last = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`human task never became queryable: ${String(last)}`);
}

test('R1-08H real Temporal Workflow waits for a frozen human outcome, rejects unknown outcome, accepts idempotent Update and completes', { timeout: 120_000 }, async () => {
  const program = humanProgram();
  const env = await TestWorkflowEnvironment.createLocal({
    server: { namespace: program.deploymentIntent.desiredNamespaceKey },
  });
  const runtime = await createGenericTemporalWorker({
    connection: env.nativeConnection,
    namespace: env.namespace,
    taskQueue: program.deploymentIntent.desiredTaskQueueKey,
    identity: 'talos-r1-human-worker-e2e',
  });

  try {
    await runtime.worker.runUntil(async () => {
      const executionId = `R1-HUMAN-${randomUUID()}`;
      const handle = await env.client.workflow.start(TalosGenericWorkflow, {
        workflowId: `talos-${executionId}`,
        taskQueue: program.deploymentIntent.desiredTaskQueueKey,
        args: [{ executionId, facts: {}, capabilityInputs: {}, program }],
        retry: { maximumAttempts: 1 },
      });

      const pending = await waitForPendingHumanTask(handle);
      assert.equal(pending.status, 'RUNNING');
      assert.equal(pending.currentElementRef, 'exe_human_review');
      assert.equal(pending.pendingHumanTask?.messageKind, 'UPDATE_HANDLER');
      assert.deepEqual(
        pending.pendingHumanTask?.outcomes.map((item) => item.outcomeCode),
        ['APPROVE', 'REJECT'],
      );
      assert.deepEqual(pending.pendingHumanTask?.participantRoleRefs, ['role:manager']);

      await assert.rejects(
        () => handle.executeUpdate(GENERIC_HUMAN_UPDATE_NAME, {
          args: [{
            submissionId: 'submission-invalid',
            executionElementRef: 'exe_human_review',
            outcomeCode: 'MAGIC_NEW_OUTCOME',
            actorRef: 'actor:manager',
            authorityRef: 'authority:r1-human-invalid',
          }],
        }),
        /human outcome is not allowed by the frozen design/,
      );

      const afterInvalid = await handle.query(GENERIC_RUNTIME_STATE_QUERY_NAME) as GenericWorkflowRuntimeState;
      assert.equal(afterInvalid.pendingHumanTask?.executionElementRef, 'exe_human_review');
      assert.equal(afterInvalid.acceptedHumanSubmissions.length, 0);

      const approvedSubmission = {
        submissionId: 'submission-approved-001',
        executionElementRef: 'exe_human_review',
        outcomeCode: 'APPROVE',
        actorRef: 'actor:manager',
        authorityRef: 'authority:r1-human-approved',
        rationale: 'Reviewed and explicitly approved.',
      };
      const firstReceipt = await handle.executeUpdate(GENERIC_HUMAN_UPDATE_NAME, {
        args: [approvedSubmission],
      });
      assert.equal(firstReceipt.accepted, true);
      assert.equal(firstReceipt.outcomeCode, 'APPROVE');
      assert.equal(firstReceipt.outcomeRef, 'cap_human_outcome_approve');

      const duplicateReceipt = await handle.executeUpdate(GENERIC_HUMAN_UPDATE_NAME, {
        args: [approvedSubmission],
      });
      assert.deepEqual(duplicateReceipt, firstReceipt, 'same submission id + same material must be idempotent');

      const result = await handle.result();
      assert.equal(result.outcome, 'COMPLETED');
      assert.equal(result.executionId, executionId);
      assert.deepEqual(result.visitedElementRefs, ['exe_human_review', 'exe_complete']);
      assert.equal(result.capabilityResults.length, 0, 'human coordination must not execute as an Activity');
      assert.equal(result.humanSubmissions?.length, 1);
      assert.equal(result.humanSubmissions?.[0]?.submissionId, 'submission-approved-001');
      assert.equal(result.humanSubmissions?.[0]?.outcomeCode, 'APPROVE');

      const history = await handle.fetchHistory();
      const events = history.events ?? [];
      assert(events.some((event) => Boolean(event.workflowExecutionCompletedEventAttributes)));
      assert.equal(
        events.some((event) => Boolean(event.activityTaskScheduledEventAttributes)),
        false,
        'human coordination is Workflow-native and must not schedule an Activity',
      );
    });
  } finally {
    await env.teardown();
  }
});
