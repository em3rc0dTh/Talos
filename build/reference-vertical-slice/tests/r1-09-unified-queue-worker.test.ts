import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { digestDeterministicJson } from '../packages/foundation/src/digest.ts';
import {
  createTalosProductTemporalRuntimeAdapters,
} from '../apps/reference-api/src/private-preview-temporal-runtime.ts';
import type {
  CompiledGenericRuntimeProgram,
  GenericCapabilityActivityInput,
} from '../workers/reference-temporal-worker/src/generic-contracts.ts';
import type {
  GenericCapabilityTransport,
  GenericEffectIdentity,
  GenericExternalCapabilityEffect,
} from '../workers/reference-temporal-worker/src/generic-activities.ts';
import { TalosGenericWorkflow } from '../workers/reference-temporal-worker/src/generic-workflow.ts';

class RecordingTransport implements GenericCapabilityTransport {
  readonly calls: Array<{ executionId: string; capabilityUseOccurrenceRef: string }> = [];
  constructor(readonly transportRef: string) {}
  async execute(input: GenericCapabilityActivityInput, identity: GenericEffectIdentity): Promise<GenericExternalCapabilityEffect> {
    this.calls.push({ executionId: input.executionId, capabilityUseOccurrenceRef: input.capabilityUseOccurrenceRef });
    return {
      effectStatus: 'INSERTED',
      transportRef: this.transportRef,
      externalEffectRef: `${this.transportRef}:${identity.effectKey}`,
      evidenceRefs: [`transport:${this.transportRef}`, `effect:${identity.effectKey}`],
    };
  }
}

function activityProgram(namespace: string, taskQueue: string, seed: string, useRef: string): CompiledGenericRuntimeProgram {
  const conditionRules: any[] = [];
  const waits: any[] = [];
  const semantics = { conditionRules, waits, snapshotDigest: digestDeterministicJson({ conditionRules, waits }) };
  const material = {
    sdkTarget: { family: 'TEMPORAL_TYPESCRIPT_SDK' as const, version: '1.22.0' },
    executionPlanRevisionRef: `exe_revision_${seed}`,
    temporalMappingRevisionRef: `tmp_revision_${seed}`,
    runtimePolicyRevisionRef: `rpl_revision_${seed}`,
    deploymentRevisionRef: `deployment_design_revision_${seed}`,
    temporalFeatureProfileRef: `tmp_feature_profile_${seed}`,
    workflow: { workflowTypeName: 'TalosGenericWorkflow', workflowMaximumAttempts: 1 },
    activity: {
      activityTypeName: 'executeGenericCapability',
      policies: [{
        capabilityUseOccurrenceRef: useRef,
        temporalMappingUnitRef: `tmp_activity_${seed}`,
        retry: {
          initialIntervalMs: 10,
          backoffCoefficient: 2,
          maximumIntervalMs: 50,
          maximumAttempts: 2,
          nonRetryableErrorTypes: ['INVALID_GENERIC_CAPABILITY_REQUEST', 'GENERIC_IDEMPOTENCY_CONFLICT'],
        },
        timeout: { startToCloseMs: 5000, scheduleToCloseMs: 10000 },
        idempotency: {
          strategyKind: 'IDEMPOTENCY_KEY' as const,
          keyContract: 'sha256(executionId + capabilityUseOccurrenceRef)',
          enforcementRef: 'R1_09_UNIFIED_QUEUE_TEST',
        },
      }],
    },
    graph: {
      entryElementRef: `exe_activity_${seed}`,
      elements: [
        {
          id: `exe_activity_${seed}`,
          kind: 'CAPABILITY_INVOCATION',
          constructKinds: ['ACTIVITY'],
          capabilityUseOccurrenceRefs: [useRef],
          semanticSubjectRefs: [`node_activity_${seed}`],
        },
        {
          id: `exe_complete_${seed}`,
          kind: 'COMPLETION_COORDINATION',
          constructKinds: ['WORKFLOW_LOGIC'],
          capabilityUseOccurrenceRefs: [],
          semanticSubjectRefs: [`node_complete_${seed}`],
        },
      ],
      relations: [{
        id: `exe_relation_${seed}`,
        sourceElementRef: `exe_activity_${seed}`,
        targetElementRef: `exe_complete_${seed}`,
        relationKind: 'SEQUENCE',
      }],
    },
    semantics,
    deploymentIntent: {
      environmentClass: 'TEST' as const,
      desiredNamespaceKey: namespace,
      desiredTaskQueueKey: taskQueue,
      desiredWorkerLogicalName: 'talos-r1-09-unified-worker',
      realizationState: 'INCOMPLETE_ENVIRONMENT_REALIZATION' as const,
    },
  };
  return { schemaVersion: 'talos.generic-runtime-program.v1', ...material, programDigest: digestDeterministicJson(material) };
}

test('R1-09 one queue Worker merges exact recovered capability dispatch safely across multiple deployments', { timeout: 120_000 }, async () => {
  const namespace = 'talos-r1-09-unified';
  const taskQueue = 'talos-r1-09-unified-main';
  const temporal = await TestWorkflowEnvironment.createLocal({ server: { namespace } });
  const transportA = new RecordingTransport('R1_09_TRANSPORT_A');
  const transportB = new RecordingTransport('R1_09_TRANSPORT_B');
  const transportConflict = new RecordingTransport('R1_09_TRANSPORT_CONFLICT');
  const programA = activityProgram(namespace, taskQueue, 'a', 'exe_use_unified_a');
  const programB = activityProgram(namespace, taskQueue, 'b', 'exe_use_unified_b');
  const conflictProgram = activityProgram(namespace, taskQueue, 'conflict', 'exe_use_unified_a');
  const runtime = createTalosProductTemporalRuntimeAdapters(
    { address: 'test-environment-native-connection', namespace: temporal.namespace, taskQueue },
    {
      client: temporal.client,
      nativeConnection: temporal.nativeConnection,
      capabilityTransportResolver: {
        resolve({ implementationRef }) {
          if (implementationRef === 'impl:a') return transportA;
          if (implementationRef === 'impl:b') return transportB;
          if (implementationRef === 'impl:conflict') return transportConflict;
          return undefined;
        },
      },
    },
  );

  try {
    const recoveredA = await runtime.recoverDeployment({
      realizedDeploymentRevisionId: 'deployment:realized-unified-a',
      program: programA,
      namespace,
      taskQueue,
      capabilityBindings: [{ capabilityUseOccurrenceRef: 'exe_use_unified_a', implementationRef: 'impl:a' }],
    });
    const recoveredB = await runtime.recoverDeployment({
      realizedDeploymentRevisionId: 'deployment:realized-unified-b',
      program: programB,
      namespace,
      taskQueue,
      capabilityBindings: [{ capabilityUseOccurrenceRef: 'exe_use_unified_b', implementationRef: 'impl:b' }],
    });
    assert.equal(recoveredA.programDigest, programA.programDigest);
    assert.equal(recoveredB.programDigest, programB.programDigest);

    await assert.rejects(
      () => runtime.recoverDeployment({
        realizedDeploymentRevisionId: 'deployment:realized-unified-conflict',
        program: conflictProgram,
        namespace,
        taskQueue,
        capabilityBindings: [{ capabilityUseOccurrenceRef: 'exe_use_unified_a', implementationRef: 'impl:conflict' }],
      }),
      /TALOS_RUNTIME_CAPABILITY_BINDING_CONFLICT: exe_use_unified_a/,
    );

    const executionA = `R1-09-A-${randomUUID()}`;
    const handleA = await temporal.client.workflow.start(TalosGenericWorkflow, {
      workflowId: `talos-${executionA}`,
      taskQueue,
      args: [{ executionId: executionA, facts: {}, capabilityInputs: { exe_use_unified_a: { source: 'A' } }, program: programA }],
      retry: { maximumAttempts: 1 },
    });
    const executionB = `R1-09-B-${randomUUID()}`;
    const handleB = await temporal.client.workflow.start(TalosGenericWorkflow, {
      workflowId: `talos-${executionB}`,
      taskQueue,
      args: [{ executionId: executionB, facts: {}, capabilityInputs: { exe_use_unified_b: { source: 'B' } }, program: programB }],
      retry: { maximumAttempts: 1 },
    });

    const [resultA, resultB] = await Promise.all([handleA.result(), handleB.result()]);
    assert.equal(resultA.outcome, 'COMPLETED');
    assert.equal(resultB.outcome, 'COMPLETED');
    assert.deepEqual(transportA.calls, [{ executionId: executionA, capabilityUseOccurrenceRef: 'exe_use_unified_a' }]);
    assert.deepEqual(transportB.calls, [{ executionId: executionB, capabilityUseOccurrenceRef: 'exe_use_unified_b' }]);
    assert.equal(transportConflict.calls.length, 0, 'conflicting recovered binding must never become executable');

    for (const handle of [handleA, handleB]) {
      const history = await handle.fetchHistory();
      const workerIdentities = (history.events ?? [])
        .map((event) => event.workflowTaskStartedEventAttributes?.identity)
        .filter((value): value is string => typeof value === 'string');
      assert(workerIdentities.some((identity) => identity === `talos-recovered-worker:${taskQueue}`));
    }
  } finally {
    await runtime.close();
    await temporal.teardown();
  }
});
