import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client, Connection } from '@temporalio/client';
import { NativeConnection } from '@temporalio/worker';
import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import type { OneAppAutomationContext } from '../../../packages/application/src/one-app-automation.ts';
import type { TalosPrivatePreviewTemporalTarget } from './private-preview-config.ts';
import type { TalosPrivatePreviewRuntimeAdapters } from './private-preview-runtime.ts';
import type {
  OneAppDeploymentAttemptExecutorInput,
  OneAppDeploymentAttemptExecutorResult,
  OneAppWorkflowExecutionExecutorInput,
  OneAppWorkflowExecutionExecutorResult,
} from './one-app-server.ts';
import { compileGenericRuntimeProgram } from '../../../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';
import type {
  CompiledGenericRuntimeProgram,
  GenericRuntimeSemanticSnapshot,
} from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';
import {
  createGenericTemporalWorker,
  type GenericWorkerRuntime,
} from '../../../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import {
  GenericEffectLedger,
  type GenericCapabilityTransport,
} from '../../../workers/reference-temporal-worker/src/generic-activities.ts';
import { TalosGenericWorkflow } from '../../../workers/reference-temporal-worker/src/generic-workflow.ts';

export const TALOS_PRODUCT_TEMPORAL_RUNTIME_VERSION = 'talos-product-temporal-runtime-v0.1';
export const TALOS_PRODUCT_WORKFLOW_TYPE = 'TalosGenericWorkflow';
export const TALOS_PRODUCT_ACTIVITY_TYPE = 'executeGenericCapability';
export const TALOS_PRODUCT_SDK_VERSION = '1.22.0';

export interface TalosProductCapabilityTransportResolver {
  resolve(context: OneAppAutomationContext): GenericCapabilityTransport | undefined;
}

export interface TalosProductTemporalRuntimeOptions {
  capabilityTransportResolver?: TalosProductCapabilityTransportResolver;
  /** Integration-test seam. Production callers omit these and use target.address. */
  client?: Client;
  /** Integration-test seam. Production callers omit these and use target.address. */
  nativeConnection?: NativeConnection;
}

export interface TalosManagedTemporalRuntimeAdapters extends TalosPrivatePreviewRuntimeAdapters {
  assertReachable(): Promise<{
    namespace: string;
    workerIdentity: string;
    sdkVersion: string;
  }>;
  close(): Promise<void>;
}

interface ActiveDeployment {
  deploymentRevisionId: string;
  program: CompiledGenericRuntimeProgram;
  runtime: GenericWorkerRuntime;
  runPromise: Promise<void>;
  ledger: GenericEffectLedger;
  taskQueue: string;
}

function waitDurationMs(context: OneAppAutomationContext, executionElementId: string): { durationMs: number; sourceRef: string } {
  const execution = context.executionReview?.execution;
  if (!execution) throw new TypeError('TALOS_RUNTIME_EXECUTION_PLAN_REQUIRED: wait resolution requires an approved ExecutionPlan review');
  const element = execution.elements.find((item) => item.id === executionElementId);
  if (!element) throw new TypeError(`TALOS_RUNTIME_WAIT_ELEMENT_MISSING: ${executionElementId}`);
  const semanticNode = context.process.nodes.find((node) => element.semanticSubjectRefs.includes(node.id));
  if (!semanticNode) throw new TypeError(`TALOS_RUNTIME_WAIT_SOURCE_MISSING: ${executionElementId}`);

  const details = semanticNode.details ?? {};
  const raw = details.durationMs ?? details.waitDurationMs;
  const durationMs = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : Number.NaN;
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    throw new TypeError(
      `TALOS_RUNTIME_WAIT_DURATION_REQUIRED: ${semanticNode.id} must carry an explicit non-negative durationMs before execution`,
    );
  }
  return { durationMs, sourceRef: semanticNode.id };
}

/** Build runtime semantics from the exact confirmed Canonical process only. */
export function buildOneAppRuntimeSemanticSnapshot(context: OneAppAutomationContext): GenericRuntimeSemanticSnapshot {
  if (!context.executionReview) throw new TypeError('TALOS_RUNTIME_EXECUTION_PLAN_REQUIRED: runtime semantic snapshot needs an ExecutionPlan');
  const conditionRules = context.process.rules.map((rule) => ({ ref: rule.id, expression: rule.expression }));
  const waits = context.executionReview.execution.elements
    .filter((element) => element.kind === 'WAIT_COORDINATION')
    .map((element) => ({ executionElementRef: element.id, ...waitDurationMs(context, element.id) }));
  return {
    conditionRules,
    waits,
    snapshotDigest: digestDeterministicJson({ conditionRules, waits }),
  };
}

function workerArtifactDigest(): string {
  const filePath = fileURLToPath(new URL('../../../workers/reference-temporal-worker/src/generic-worker-runtime.ts', import.meta.url));
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function assertTargetMatchesRealization(context: OneAppAutomationContext, target: TalosPrivatePreviewTemporalTarget): void {
  const realization = context.deploymentRealization;
  if (!realization) throw new TypeError('TALOS_RUNTIME_REALIZATION_REQUIRED: deployment attempt requires realized environment evidence');
  if (realization.namespaceBinding.namespaceLocatorRef !== `temporal-namespace:${target.namespace}`) {
    throw new TypeError('TALOS_RUNTIME_TARGET_MISMATCH: realized Temporal namespace does not match configured private-preview target');
  }
  const queue = realization.taskQueueBindings[0]?.taskQueueKey;
  if (!queue || queue !== target.taskQueue) {
    throw new TypeError('TALOS_RUNTIME_TARGET_MISMATCH: realized Task Queue does not match configured private-preview target');
  }
  const workflowType = realization.workflowTypeBindings[0]?.workflowTypeName;
  if (workflowType !== TALOS_PRODUCT_WORKFLOW_TYPE) {
    throw new TypeError(`TALOS_RUNTIME_WORKFLOW_TYPE_UNSUPPORTED: product runtime requires ${TALOS_PRODUCT_WORKFLOW_TYPE}`);
  }
  const activityTypes = new Set(realization.activityTypeBindings.map((item) => item.activityTypeName));
  if (activityTypes.size > 0 && (!activityTypes.has(TALOS_PRODUCT_ACTIVITY_TYPE) || activityTypes.size !== 1)) {
    throw new TypeError(`TALOS_RUNTIME_ACTIVITY_TYPE_UNSUPPORTED: product runtime requires ${TALOS_PRODUCT_ACTIVITY_TYPE}`);
  }
}

function compileApprovedProgram(context: OneAppAutomationContext): CompiledGenericRuntimeProgram {
  if (!context.executionReview || !context.mapping || !context.runtimePolicy || !context.deploymentDesign) {
    throw new TypeError('TALOS_RUNTIME_APPROVED_LINEAGE_REQUIRED: ExecutionPlan, Temporal mapping, RuntimePolicy and Deployment design are required');
  }
  return compileGenericRuntimeProgram(
    context.executionReview.execution,
    context.mapping,
    context.runtimePolicy,
    context.deploymentDesign,
    buildOneAppRuntimeSemanticSnapshot(context),
    { family: 'TEMPORAL_TYPESCRIPT_SDK', version: TALOS_PRODUCT_SDK_VERSION },
  );
}

/**
 * Concrete trusted runtime for the local/private Talos product.
 * Deployment compiles the exact approved design and starts a Worker only.
 * Workflow execution remains a separate one-start authority operation.
 */
export function createTalosProductTemporalRuntimeAdapters(
  target: TalosPrivatePreviewTemporalTarget,
  options: TalosProductTemporalRuntimeOptions = {},
): TalosManagedTemporalRuntimeAdapters {
  let clientConnection: Connection | undefined;
  let nativeConnection: NativeConnection | undefined = options.nativeConnection;
  let client: Client | undefined = options.client;
  const ownsNativeConnection = !options.nativeConnection;
  const ownsClientConnection = !options.client;
  const deployments = new Map<string, ActiveDeployment>();
  let closing = false;

  async function ensureConnections(): Promise<{ nativeConnection: NativeConnection; client: Client }> {
    if (closing) throw new TypeError('TALOS_RUNTIME_CLOSING: runtime adapter is shutting down');
    if (!client) {
      clientConnection = await Connection.connect({ address: target.address });
      client = new Client({ connection: clientConnection, namespace: target.namespace });
    }
    if (!nativeConnection) nativeConnection = await NativeConnection.connect({ address: target.address });
    return { nativeConnection, client };
  }

  async function assertReachable() {
    const connections = await ensureConnections();
    await connections.client.workflowService.describeNamespace({ namespace: target.namespace });
    return {
      namespace: target.namespace,
      workerIdentity: `talos-product-runtime@${target.address}`,
      sdkVersion: TALOS_PRODUCT_SDK_VERSION,
    };
  }

  async function deploymentAttemptExecutor(
    input: OneAppDeploymentAttemptExecutorInput,
  ): Promise<OneAppDeploymentAttemptExecutorResult> {
    const { context, deploymentApprovalId, startedAt } = input;
    if (context.deploymentApproval?.id !== deploymentApprovalId) {
      throw new TypeError('TALOS_RUNTIME_DEPLOYMENT_APPROVAL_MISMATCH: executor requires the exact deployment approval');
    }
    assertTargetMatchesRealization(context, target);
    const realization = context.deploymentRealization!;
    if (deployments.has(realization.revision.id)) {
      throw new TypeError('TALOS_RUNTIME_DEPLOYMENT_ALREADY_ACTIVE: realized deployment already has an active Worker');
    }

    const program = compileApprovedProgram(context);
    if (program.deploymentRevisionRef !== realization.revision.parentDeploymentRevisionRef) {
      throw new TypeError('TALOS_RUNTIME_PROGRAM_DEPLOYMENT_MISMATCH: compiled program is not based on the realized deployment parent');
    }
    const connections = await ensureConnections();
    const ledger = new GenericEffectLedger();
    const capabilityTransport = options.capabilityTransportResolver?.resolve(context);
    const runtime = await createGenericTemporalWorker({
      connection: connections.nativeConnection,
      namespace: target.namespace,
      taskQueue: target.taskQueue,
      identity: `talos-product-worker:${realization.revision.id}`,
      ledger,
      ...(capabilityTransport ? { capabilityTransport } : {}),
    });
    const runPromise = runtime.worker.run();
    const startupState = await Promise.race([
      runPromise.then(() => 'STOPPED' as const),
      new Promise<'RUNNING'>((resolve) => setTimeout(() => resolve('RUNNING'), 150)),
    ]);
    if (startupState !== 'RUNNING') {
      throw new TypeError('TALOS_RUNTIME_WORKER_START_FAILED: Worker stopped before deployment proof completed');
    }
    deployments.set(realization.revision.id, {
      deploymentRevisionId: realization.revision.id,
      program,
      runtime,
      runPromise,
      ledger,
      taskQueue: target.taskQueue,
    });

    return {
      completedAt: new Date().toISOString(),
      result: 'SUCCEEDED',
      diagnosticRefs: [],
      evidenceRefs: [
        `talos-runtime:${TALOS_PRODUCT_TEMPORAL_RUNTIME_VERSION}`,
        `temporal-address:${target.address}`,
        `temporal-namespace:${target.namespace}`,
        `task-queue:${target.taskQueue}`,
        `runtime-program:${program.programDigest}`,
        `worker-artifact-sha256:${workerArtifactDigest()}`,
        `started:${startedAt}`,
      ],
      orchestratorRef: TALOS_PRODUCT_TEMPORAL_RUNTIME_VERSION,
    };
  }

  async function workflowExecutionExecutor(
    input: OneAppWorkflowExecutionExecutorInput,
  ): Promise<OneAppWorkflowExecutionExecutorResult> {
    const { context, workflowExecutionApprovalId, executionId, facts, capabilityInputs, startedAt } = input;
    if (context.workflowExecutionApproval?.id !== workflowExecutionApprovalId) {
      throw new TypeError('TALOS_RUNTIME_EXECUTION_APPROVAL_MISMATCH: executor requires the exact workflow execution approval');
    }
    assertTargetMatchesRealization(context, target);
    const realization = context.deploymentRealization!;
    const active = deployments.get(realization.revision.id);
    if (!active) throw new TypeError('TALOS_RUNTIME_WORKER_NOT_ACTIVE: approved deployment Worker is not active');
    const connections = await ensureConnections();
    const workflowId = `talos-${executionId}`;
    const handle = await connections.client.workflow.start(TalosGenericWorkflow, {
      workflowId,
      taskQueue: active.taskQueue,
      args: [{ executionId, facts, ...(capabilityInputs ? { capabilityInputs } : {}), program: active.program }],
      retry: { maximumAttempts: active.program.workflow.workflowMaximumAttempts },
    });
    const result = await handle.result();
    if (result.outcome !== 'COMPLETED' || result.executionId !== executionId) {
      throw new TypeError('TALOS_RUNTIME_WORKFLOW_RESULT_INVALID: Temporal returned an unexpected terminal result');
    }
    const description = await handle.describe();
    const runId = (description as any).runId ?? (handle as any).firstExecutionRunId;
    if (!runId) throw new TypeError('TALOS_RUNTIME_RUN_ID_MISSING: Temporal execution did not expose a concrete run id');
    const effectEvidence = result.capabilityResults.flatMap((item) => [
      ...(item.transportRef ? [`transport:${item.transportRef}`] : []),
      ...(item.externalEffectRef ? [`external-effect:${item.externalEffectRef}`] : []),
      ...(item.evidenceRefs ?? []),
    ]);
    return {
      completedAt: new Date().toISOString(),
      workflowExecutionRef: `temporal:${workflowId}:${runId}`,
      workflowIdRef: workflowId,
      runIdRef: String(runId),
      executionStatus: 'COMPLETED',
      evidenceRefs: [
        `workflow-id:${workflowId}`,
        `run-id:${runId}`,
        `runtime-program:${active.program.programDigest}`,
        `started:${startedAt}`,
        `outcome:${result.outcome}`,
        ...effectEvidence,
      ],
    };
  }

  async function close(): Promise<void> {
    if (closing) return;
    closing = true;
    for (const active of deployments.values()) active.runtime.worker.shutdown();
    await Promise.allSettled([...deployments.values()].map((item) => item.runPromise));
    deployments.clear();
    if (ownsNativeConnection && nativeConnection) await nativeConnection.close();
    if (ownsClientConnection && clientConnection) await clientConnection.close();
    nativeConnection = undefined;
    clientConnection = undefined;
    client = undefined;
  }

  return {
    assertReachable,
    deploymentAttemptExecutor,
    workflowExecutionExecutor,
    close,
  };
}
