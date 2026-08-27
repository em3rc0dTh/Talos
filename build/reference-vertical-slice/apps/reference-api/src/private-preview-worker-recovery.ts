import { NativeConnection } from '@temporalio/worker';
import type { OneAppAutomationContext } from '../../../packages/application/src/one-app-automation.ts';
import { compileGenericRuntimeProgram } from '../../../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';
import {
  GenericEffectLedger,
  type GenericCapabilityTransport,
  type GenericEffectIdentity,
  type GenericExternalCapabilityEffect,
} from '../../../workers/reference-temporal-worker/src/generic-activities.ts';
import type { GenericCapabilityActivityInput } from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';
import { createGenericTemporalWorker, type GenericWorkerRuntime } from '../../../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import type { TalosPrivatePreviewTemporalTarget } from './private-preview-config.ts';
import {
  buildOneAppRuntimeSemanticSnapshot,
  TALOS_PRODUCT_SDK_VERSION,
  type TalosProductCapabilityTransportResolver,
} from './private-preview-temporal-runtime.ts';
import type {
  TalosProductRuntimeCapabilityBinding,
  TalosProductRuntimeRegistry,
  TalosProductRuntimeRegistryRecord,
} from './private-preview-runtime-registry.ts';

export const TALOS_PRODUCT_WORKER_RECOVERY_VERSION = 'talos-product-worker-recovery-v0.1';
export const TALOS_PRODUCT_RECOVERY_DISPATCH_REF = 'TALOS_PRODUCT_RECOVERY_CAPABILITY_DISPATCH_V1';

interface ActiveRecoveredWorker {
  realizedDeploymentRevisionId: string;
  runtime: GenericWorkerRuntime;
  runPromise: Promise<void>;
  ledger: GenericEffectLedger;
}

export interface TalosProductWorkerRecovery {
  recover(realizedDeploymentRevisionIds: string[]): Promise<{
    recoveryVersion: typeof TALOS_PRODUCT_WORKER_RECOVERY_VERSION;
    recoveredDeploymentRevisionIds: string[];
    evidenceRefs: string[];
  }>;
  close(): Promise<void>;
}

class RecoveryCapabilityDispatchTransport implements GenericCapabilityTransport {
  readonly transportRef = TALOS_PRODUCT_RECOVERY_DISPATCH_REF;
  readonly acceptedExternalTransportRefs: readonly string[];
  readonly #byUse: Map<string, GenericCapabilityTransport>;

  constructor(resolutions: Array<{ capabilityUseOccurrenceRef: string; transport: GenericCapabilityTransport }>) {
    this.#byUse = new Map(resolutions.map((item) => [item.capabilityUseOccurrenceRef, item.transport]));
    this.acceptedExternalTransportRefs = [...new Set(resolutions.map((item) => item.transport.transportRef))].sort();
  }

  async execute(input: GenericCapabilityActivityInput, identity: GenericEffectIdentity): Promise<GenericExternalCapabilityEffect> {
    const transport = this.#byUse.get(input.capabilityUseOccurrenceRef);
    if (!transport) throw new TypeError(`TALOS_WORKER_RECOVERY_TRANSPORT_MISSING: ${input.capabilityUseOccurrenceRef}`);
    return transport.execute(input, identity);
  }
}

function invocationUseRefs(context: OneAppAutomationContext): string[] {
  const execution = context.executionReview?.execution;
  if (!execution) throw new TypeError('TALOS_RUNTIME_REGISTRY_EXECUTION_PLAN_REQUIRED');
  return [...new Set(
    execution.elements
      .filter((element) => element.kind === 'CAPABILITY_INVOCATION')
      .flatMap((element) => element.capabilityUseRefs),
  )].sort();
}

function implementationRefForUse(context: OneAppAutomationContext, capabilityUseOccurrenceRef: string): string {
  const execution = context.executionReview?.execution;
  const selection = context.selection;
  if (!execution || !selection) throw new TypeError('TALOS_RUNTIME_REGISTRY_CAPABILITY_LINEAGE_REQUIRED');
  const use = execution.capabilityUses.find((item) => item.id === capabilityUseOccurrenceRef);
  if (!use) throw new TypeError(`TALOS_RUNTIME_REGISTRY_CAPABILITY_USE_MISSING: ${capabilityUseOccurrenceRef}`);
  const binding = selection.resolution.bindingRevisions.find((item) => item.id === use.capabilityBindingRevisionRef);
  if (!binding) throw new TypeError(`TALOS_RUNTIME_REGISTRY_CAPABILITY_BINDING_MISSING: ${use.capabilityBindingRevisionRef}`);
  const offering = selection.resolution.offeringRevisions.find((item) => item.id === binding.capabilityOfferingRevisionId);
  const implementationRef = offering?.implementationRef?.trim();
  if (!implementationRef) throw new TypeError(`TALOS_RUNTIME_REGISTRY_IMPLEMENTATION_REF_MISSING: ${capabilityUseOccurrenceRef}`);
  return implementationRef;
}

/**
 * Persist the exact compiled runtime material before a deployment attempt.
 * This record is evidence only: it grants no deployment or workflow-start
 * authority. Recovery later requires a durable approved execution plus an
 * actually observed RUNNING Temporal Workflow before this manifest is used.
 */
export function persistTalosProductRuntimeManifest(
  registry: TalosProductRuntimeRegistry,
  context: OneAppAutomationContext,
  target: TalosPrivatePreviewTemporalTarget,
  recordedAt: string,
): TalosProductRuntimeRegistryRecord {
  if (!context.executionReview || !context.mapping || !context.runtimePolicy || !context.deploymentDesign || !context.deploymentRealization) {
    throw new TypeError('TALOS_RUNTIME_REGISTRY_APPROVED_LINEAGE_REQUIRED');
  }
  const program = compileGenericRuntimeProgram(
    context.executionReview.execution,
    context.mapping,
    context.runtimePolicy,
    context.deploymentDesign,
    buildOneAppRuntimeSemanticSnapshot(context),
    { family: 'TEMPORAL_TYPESCRIPT_SDK', version: TALOS_PRODUCT_SDK_VERSION },
  );
  if (program.deploymentRevisionRef !== context.deploymentRealization.revision.parentDeploymentRevisionRef) {
    throw new TypeError('TALOS_RUNTIME_REGISTRY_DEPLOYMENT_LINEAGE_MISMATCH');
  }
  if (context.deploymentRealization.namespaceBinding.namespaceLocatorRef !== `temporal-namespace:${target.namespace}`) {
    throw new TypeError('TALOS_RUNTIME_REGISTRY_NAMESPACE_MISMATCH');
  }
  const realizedQueue = context.deploymentRealization.taskQueueBindings[0]?.taskQueueKey;
  if (realizedQueue !== target.taskQueue) throw new TypeError('TALOS_RUNTIME_REGISTRY_TASK_QUEUE_MISMATCH');
  const capabilityBindings: TalosProductRuntimeCapabilityBinding[] = invocationUseRefs(context).map((capabilityUseOccurrenceRef) => ({
    capabilityUseOccurrenceRef,
    implementationRef: implementationRefForUse(context, capabilityUseOccurrenceRef),
  }));
  return registry.persist({
    realizedDeploymentRevisionId: context.deploymentRealization.revision.id,
    program,
    namespace: target.namespace,
    taskQueue: target.taskQueue,
    capabilityBindings,
    recordedAt,
  });
}

function resolveRecoveredTransport(
  record: TalosProductRuntimeRegistryRecord,
  resolver?: TalosProductCapabilityTransportResolver,
): GenericCapabilityTransport | undefined {
  const invocationRefs = [...new Set(
    record.program.graph.elements
      .filter((element) => element.kind === 'CAPABILITY_INVOCATION')
      .flatMap((element) => element.capabilityUseOccurrenceRefs),
  )].sort();
  if (invocationRefs.length === 0) return undefined;
  if (!resolver) throw new TypeError('TALOS_WORKER_RECOVERY_CAPABILITY_RESOLVER_REQUIRED');
  const byUse = new Map(record.capabilityBindings.map((item) => [item.capabilityUseOccurrenceRef, item.implementationRef]));
  const resolutions = invocationRefs.map((capabilityUseOccurrenceRef) => {
    const implementationRef = byUse.get(capabilityUseOccurrenceRef);
    if (!implementationRef) throw new TypeError(`TALOS_WORKER_RECOVERY_IMPLEMENTATION_BINDING_MISSING: ${capabilityUseOccurrenceRef}`);
    const transport = resolver.resolve({
      context: undefined as any,
      capabilityUseOccurrenceRef,
      implementationRef,
    });
    if (!transport) throw new TypeError(`TALOS_WORKER_RECOVERY_TRANSPORT_UNRESOLVED: ${implementationRef}`);
    return { capabilityUseOccurrenceRef, transport };
  });
  return new RecoveryCapabilityDispatchTransport(resolutions);
}

export function createTalosProductWorkerRecovery(
  target: TalosPrivatePreviewTemporalTarget,
  registry: TalosProductRuntimeRegistry,
  capabilityTransportResolver?: TalosProductCapabilityTransportResolver,
  options: { nativeConnection?: NativeConnection } = {},
): TalosProductWorkerRecovery {
  let nativeConnection: NativeConnection | undefined = options.nativeConnection;
  const ownsConnection = !options.nativeConnection;
  const active = new Map<string, ActiveRecoveredWorker>();
  let closing = false;

  async function ensureConnection(): Promise<NativeConnection> {
    if (closing) throw new TypeError('TALOS_WORKER_RECOVERY_CLOSING');
    if (!nativeConnection) nativeConnection = await NativeConnection.connect({ address: target.address });
    return nativeConnection;
  }

  async function recover(realizedDeploymentRevisionIds: string[]) {
    const unique = [...new Set(realizedDeploymentRevisionIds.map((item) => item.trim()).filter(Boolean))].sort();
    const evidenceRefs: string[] = [];
    for (const deploymentRevisionId of unique) {
      if (active.has(deploymentRevisionId)) continue;
      const record = registry.get(deploymentRevisionId);
      if (!record) throw new TypeError(`TALOS_WORKER_RECOVERY_REGISTRY_RECORD_MISSING: ${deploymentRevisionId}`);
      if (record.namespace !== target.namespace) throw new TypeError(`TALOS_WORKER_RECOVERY_NAMESPACE_MISMATCH: ${deploymentRevisionId}`);
      if (record.taskQueue !== target.taskQueue) throw new TypeError(`TALOS_WORKER_RECOVERY_TASK_QUEUE_MISMATCH: ${deploymentRevisionId}`);
      const transport = resolveRecoveredTransport(record, capabilityTransportResolver);
      const connection = await ensureConnection();
      const ledger = new GenericEffectLedger();
      const runtime = await createGenericTemporalWorker({
        connection,
        namespace: target.namespace,
        taskQueue: record.taskQueue,
        identity: `talos-recovered-worker:${deploymentRevisionId}`,
        ledger,
        ...(transport ? { capabilityTransport: transport } : {}),
      });
      const runPromise = runtime.worker.run();
      const startupState = await Promise.race([
        runPromise.then(() => 'STOPPED' as const),
        new Promise<'RUNNING'>((resolve) => setTimeout(() => resolve('RUNNING'), 150)),
      ]);
      if (startupState !== 'RUNNING') throw new TypeError(`TALOS_WORKER_RECOVERY_START_FAILED: ${deploymentRevisionId}`);
      active.set(deploymentRevisionId, { realizedDeploymentRevisionId: deploymentRevisionId, runtime, runPromise, ledger });
      evidenceRefs.push(
        `worker-recovery:${TALOS_PRODUCT_WORKER_RECOVERY_VERSION}`,
        `recovered-deployment:${deploymentRevisionId}`,
        `runtime-program:${record.program.programDigest}`,
        `temporal-namespace:${record.namespace}`,
        `task-queue:${record.taskQueue}`,
      );
    }
    return {
      recoveryVersion: TALOS_PRODUCT_WORKER_RECOVERY_VERSION,
      recoveredDeploymentRevisionIds: unique.filter((id) => active.has(id)),
      evidenceRefs,
    };
  }

  async function close(): Promise<void> {
    if (closing) return;
    closing = true;
    for (const item of active.values()) item.runtime.worker.shutdown();
    await Promise.allSettled([...active.values()].map((item) => item.runPromise));
    active.clear();
    if (ownsConnection && nativeConnection) await nativeConnection.close();
    nativeConnection = undefined;
  }

  return { recover, close };
}
