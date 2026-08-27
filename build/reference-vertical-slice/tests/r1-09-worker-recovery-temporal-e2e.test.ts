import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
import { createTalosProductRuntimeRegistry } from '../apps/reference-api/src/private-preview-runtime-registry.ts';
import { createTalosProductWorkerRecovery } from '../apps/reference-api/src/private-preview-worker-recovery.ts';

function humanRecoveryProgram(namespace: string, taskQueue: string): CompiledGenericRuntimeProgram {
  const conditionRules: any[] = [];
  const waits: any[] = [];
  const humans = [{
    executionElementRef: 'exe_recovery_human_review',
    capabilityUseOccurrenceRef: 'exe_use_recovery_human_review',
    temporalMappingUnitRef: 'tmp_update_recovery_human_review',
    messageKind: 'UPDATE_HANDLER' as const,
    humanInteractionDesignRef: 'cap_human_design_recovery_review',
    participantRequirementRef: 'cap_human_participant_recovery_manager',
    participantRoleRefs: ['role:manager'],
    outcomeContractRef: 'cap_human_outcomes_recovery_review',
    outcomes: [
      {
        outcomeRef: 'cap_human_outcome_recovery_approve',
        outcomeCode: 'APPROVE',
        businessMeaning: 'Approve after the recovered Worker resumes the human task',
        terminalForInteraction: true,
      },
      {
        outcomeRef: 'cap_human_outcome_recovery_reject',
        outcomeCode: 'REJECT',
        businessMeaning: 'Reject after the recovered Worker resumes the human task',
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
    executionPlanRevisionRef: 'exe_revision_worker_recovery_test',
    temporalMappingRevisionRef: 'tmp_revision_worker_recovery_test',
    runtimePolicyRevisionRef: 'rpl_revision_worker_recovery_test',
    deploymentRevisionRef: 'deployment_design_revision_worker_recovery_test',
    temporalFeatureProfileRef: 'tmp_feature_profile_worker_recovery_test',
    workflow: { workflowTypeName: 'TalosGenericWorkflow', workflowMaximumAttempts: 1 },
    activity: { activityTypeName: 'executeGenericCapability', policies: [] },
    graph: {
      entryElementRef: 'exe_recovery_human_review',
      elements: [
        {
          id: 'exe_recovery_human_review',
          kind: 'HUMAN_COORDINATION',
          constructKinds: ['UPDATE_HANDLER', 'WORKFLOW_CONDITION'],
          capabilityUseOccurrenceRefs: ['exe_use_recovery_human_review'],
          semanticSubjectRefs: ['node_recovery_human_review'],
        },
        {
          id: 'exe_recovery_complete',
          kind: 'COMPLETION_COORDINATION',
          constructKinds: ['WORKFLOW_LOGIC'],
          capabilityUseOccurrenceRefs: [],
          semanticSubjectRefs: ['node_recovery_complete'],
        },
      ],
      relations: [
        {
          id: 'exe_relation_recovery_after_human',
          sourceElementRef: 'exe_recovery_human_review',
          targetElementRef: 'exe_recovery_complete',
          relationKind: 'SEQUENCE',
        },
      ],
    },
    semantics,
    deploymentIntent: {
      environmentClass: 'TEST' as const,
      desiredNamespaceKey: namespace,
      desiredTaskQueueKey: taskQueue,
      desiredWorkerLogicalName: 'talos-r1-worker-recovery',
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
  throw new Error(`recovered human task never became queryable: ${String(last)}`);
}

test('R1-09 real Temporal human Workflow survives Worker death and completes on the recovered Worker without another workflow start', { timeout: 120_000 }, async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-09-worker-recovery-'));
  const namespace = 'talos-r1-worker-recovery';
  const taskQueue = 'talos-r1-worker-recovery-main';
  const realizedDeploymentRevisionId = 'deployment:realized-r1-09-worker-recovery';
  const program = humanRecoveryProgram(namespace, taskQueue);
  const registry = createTalosProductRuntimeRegistry(runtimeDir);
  registry.persist({
    realizedDeploymentRevisionId,
    program,
    namespace,
    taskQueue,
    capabilityBindings: [],
    recordedAt: '2026-08-27T02:00:00.000Z',
  });

  const env = await TestWorkflowEnvironment.createLocal({ server: { namespace } });
  const first = await createGenericTemporalWorker({
    connection: env.nativeConnection,
    namespace: env.namespace,
    taskQueue,
    identity: 'talos-r1-worker-before-crash',
  });
  let firstRun: Promise<void> | undefined;
  let recovery: ReturnType<typeof createTalosProductWorkerRecovery> | undefined;

  try {
    firstRun = first.worker.run();
    const executionId = `R1-WORKER-RECOVERY-${randomUUID()}`;
    const workflowId = `talos-${executionId}`;
    const handle = await env.client.workflow.start(TalosGenericWorkflow, {
      workflowId,
      taskQueue,
      args: [{ executionId, facts: {}, capabilityInputs: {}, program }],
      retry: { maximumAttempts: 1 },
    });

    const beforeCrash = await waitForPendingHumanTask(handle);
    assert.equal(beforeCrash.status, 'RUNNING');
    assert.equal(beforeCrash.pendingHumanTask?.executionElementRef, 'exe_recovery_human_review');
    assert.equal(beforeCrash.acceptedHumanSubmissions.length, 0);

    const beforeDescription = await handle.describe();
    const runId = beforeDescription.runId;
    assert.ok(runId, 'Temporal must expose the durable run id before Worker shutdown');

    // Simulate the Talos Worker process disappearing while the durable Workflow
    // is blocked on a human outcome. Temporal owns the Workflow state, so this
    // must not complete/cancel/restart the Workflow.
    first.worker.shutdown();
    await firstRun;
    firstRun = undefined;

    const afterWorkerDeath = await handle.describe();
    assert.equal(afterWorkerDeath.runId, runId, 'Worker death must not create another Temporal run');

    recovery = createTalosProductWorkerRecovery(
      { address: 'test-environment-native-connection', namespace: env.namespace, taskQueue },
      registry,
      undefined,
      { nativeConnection: env.nativeConnection },
    );
    const recovered = await recovery.recover([realizedDeploymentRevisionId]);
    assert.deepEqual(recovered.recoveredDeploymentRevisionIds, [realizedDeploymentRevisionId]);
    assert(recovered.evidenceRefs.includes(`runtime-program:${program.programDigest}`));
    assert(recovered.evidenceRefs.includes(`task-queue:${taskQueue}`));

    // Reconciliation can be repeated without starting a second recovery Worker
    // or manufacturing another deployment/workflow-start authority event.
    const repeated = await recovery.recover([realizedDeploymentRevisionId]);
    assert.deepEqual(repeated.recoveredDeploymentRevisionIds, [realizedDeploymentRevisionId]);

    const afterRecovery = await waitForPendingHumanTask(handle);
    assert.equal(afterRecovery.pendingHumanTask?.executionElementRef, 'exe_recovery_human_review');
    assert.deepEqual(
      afterRecovery.pendingHumanTask?.outcomes.map((item) => item.outcomeCode),
      ['APPROVE', 'REJECT'],
    );

    const receipt = await handle.executeUpdate(GENERIC_HUMAN_UPDATE_NAME, {
      args: [{
        submissionId: 'submission-after-worker-recovery',
        executionElementRef: 'exe_recovery_human_review',
        outcomeCode: 'APPROVE',
        actorRef: 'actor:manager',
        authorityRef: 'authority:r1-09-recovered-human-outcome',
        rationale: 'Approve the exact frozen outcome after Worker recovery.',
      }],
    });
    assert.equal(receipt.accepted, true);
    assert.equal(receipt.outcomeCode, 'APPROVE');

    const result = await handle.result();
    assert.equal(result.outcome, 'COMPLETED');
    assert.equal(result.executionId, executionId);
    assert.deepEqual(result.visitedElementRefs, ['exe_recovery_human_review', 'exe_recovery_complete']);
    assert.equal(result.capabilityResults.length, 0, 'human recovery must remain Workflow-native');
    assert.equal(result.humanSubmissions?.length, 1);

    const finalDescription = await handle.describe();
    assert.equal(finalDescription.runId, runId, 'recovery must finish the exact original Temporal run');

    const history = await handle.fetchHistory();
    const events = history.events ?? [];
    assert.equal(
      events.filter((event) => Boolean(event.workflowExecutionStartedEventAttributes)).length,
      1,
      'Worker recovery must never create a second Workflow start',
    );
    assert(events.some((event) => Boolean(event.workflowExecutionCompletedEventAttributes)));
    assert.equal(
      events.some((event) => Boolean(event.activityTaskScheduledEventAttributes)),
      false,
      'the recovered human task must never be converted into an Activity',
    );
    const workflowTaskIdentities = events
      .map((event) => event.workflowTaskStartedEventAttributes?.identity)
      .filter((value): value is string => typeof value === 'string');
    assert(
      workflowTaskIdentities.some((identity) => identity === `talos-recovered-worker:${taskQueue}`),
      `expected recovered Worker identity in Temporal history, got ${workflowTaskIdentities.join(', ')}`,
    );
  } finally {
    first.worker.shutdown();
    if (firstRun) await firstRun.catch(() => undefined);
    await recovery?.close().catch(() => undefined);
    await env.teardown().catch(() => undefined);
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
