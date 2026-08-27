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

export const TALOS_PRODUCT_WORKER_RECOVERY_VERSION = 'talos-product-worker-recovery-v0.2';
export const TALOS_PRODUCT_RECOVERY_DISPATCH_REF = 'TALOS_PRODUCT_RECOVERY_CAPABILITY_DISPATCH_V1';

interface ActiveRecoveredWorker {
  taskQueue: string;
  realizedDeploymentRevisionIds: Set<string>;
  dispatch: RecoveryCapabilityDispatchTransport;
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
  readonly #byUse = new Map<string, { implementationRef: string; transport: GenericCapabilityTransport }>();

  get acceptedExternalTransportRefs(): readonly string[] {
    return [...new Set([...this.#byUse.values()].map((item) => item.transport.transportRef))].sort();
  }

  add(capabilityUseOccurrenceRef: string, implementationRef: string, transport: GenericCapabilityTransport): void {
    const existing = this.#byUse.get(capabilityUseOccurrenceRef);
    if (existing) {
      if (existing.implementationRef !== implementationRef || existing.transport.transportRef !== transport.transportRef) {
        throw new TypeError(`TALOS_WORKER_RECOVERY_CAPABILITY_BINDING_CONFLICT: ${capabilityUseOccurrenceRef}`);
      }
      return;
    }
    this.#byUse.set(capabilityUseOccurrenceRef, { implementationRef, transport });
  }

  async execute(input: GenericCapabilityActivityInput, identity: GenericEffectIdentity): Promise<GenericExternalCapabilityEffect> {
    const resolved = this.#byUse.get(input.capabilityUseOccurrenceRef);
    if (!resolved) throw new TypeError(`TALOS_WORKER_RECOVERY_TRANSPORT_MISSING: ${input.capabilityUseOccurrenceRef}`);
    return resolved.transport.execute(input, identity);
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

interface ResolvedRecoveryBinding {
  capabilityUseOccurrenceRef: string;
  implementationRef: string;
  transport: GenericCapabilityTransport;
}

function resolveRecoveredBindings(
  record: TalosProductRuntimeRegistryRecord,
  resolver?: TalosProductCapabilityTransportResolver,
): ResolvedRecoveryBinding[] {
  const invocationRefs = [...new Set(
    record.program.graph.elements
      .filter((element) => element.kind === 'CAPABILITY_INVOCATION')
      .flatMap((element) => element.capabilityUseOccurrenceRefs),
  )].sort();
  if (invocationRefs.length === 0) return [];
  if (!resolver) throw new TypeError('TALOS_WORKER_RECOVERY_CAPABILITY_RESOLVER_REQUIRED');
  const byUse = new Map(record.capabilityBindings.map((item) => [item.capabilityUseOccurrenceRef, item.implementationRef]));
  return invocationRefs.map((capabilityUseOccurrenceRef) => {
    const implementationRef = byUse.get(capabilityUseOccurrenceRef);
    if (!implementationRef) throw new TypeError(`TALOS_WORKER_RECOVERY_IMPLEMENTATION_BINDING_MISSING: ${capabilityUseOccurrenceRef}`);
    // The concrete product resolver dispatches only from the exact persisted
    // implementationRef. Recovery intentionally has no mutable One-App design
    // context and cannot reinterpret business labels.
    const transport = resolver.resolve({
      context: undefined as any,
      capabilityUseOccurrenceRef,
      implementationRef,
    });
    if (!transport) throw new TypeError(`TALOS_WORKER_RECOVERY_TRANSPORT_UNRESOLVED: ${implementationRef}`);
    return { capabilityUseOccurrenceRef, implementationRef, transport };
  });
}

export function createTalosProductWorkerRecovery(
  target: TalosPrivatePreviewTemporalTarget,
  registry: TalosProductRuntimeRegistry,
  capabilityTransportResolver?: TalosProductCapabilityTransportResolver,
  options: { nativeConnection?: NativeConnection } = {},
): TalosProductWorkerRecovery {
  let nativeConnection: NativeConnection | undefined = options.nativeConnection;
  const ownsConnection = !options.nativeConnection;
  let active: ActiveRecoveredWorker | undefined;
  let closing = false;

  async function ensureConnection(): Promise<NativeConnection> {
    if (closing) throw new TypeError('TALOS_WORKER_RECOVERY_CLOSING');
    if (!nativeConnection) nativeConnection = await NativeConnection.connect({ address: target.address });
    return nativeConnection;
  }

  async function recover(realizedDeploymentRevisionIds: string[]) {
    const unique = [...new Set(realizedDeploymentRevisionIds.map((item) => item.trim()).filter(Boolean))].sort();
    const records = unique.map((deploymentRevisionId) => {
      const record = registry.get(deploymentRevisionId);
      if (!record) throw new TypeError(`TALOS_WORKER_RECOVERY_REGISTRY_RECORD_MISSING: ${deploymentRevisionId}`);
      if (record.namespace !== target.namespace) throw new TypeError(`TALOS_WORKER_RECOVERY_NAMESPACE_MISMATCH: ${deploymentRevisionId}`);
      if (record.taskQueue !== target.taskQueue) throw new TypeError(`TALOS_WORKER_RECOVERY_TASK_QUEUE_MISMATCH: ${deploymentRevisionId}`);
      return record;
    });

    const resolved = records.flatMap((record) => resolveRecoveredBindings(record, capabilityTransportResolver));
    // Validate the full merged dispatch table before mutating a live Worker.
    const candidate = new RecoveryCapabilityDispatchTransport();
    for (const binding of resolved) candidate.add(binding.capabilityUseOccurrenceRef, binding.implementationRef, binding.transport);

    if (!active && unique.length > 0) {
      const connection = await ensureConnection();
      const ledger = new GenericEffectLedger();
      const runtime = await createGenericTemporalWorker({
        connection,
        namespace: target.namespace,
        taskQueue: target.taskQueue,
        identity: `talos-recovered-worker:${target.taskQueue}`,
        ledger,
        capabilityTransport: candidate,
      });
      const runPromise = runtime.worker.run();
      const startupState = await Promise.race([
        runPromise.then(() => 'STOPPED' as const),
        new Promise<'RUNNING'>((resolve) => setTimeout(() => resolve('RUNNING'), 150)),
      ]);
      if (startupState !== 'RUNNING') throw new TypeError(`TALOS_WORKER_RECOVERY_START_FAILED: ${target.taskQueue}`);
      active = {
        taskQueue: target.taskQueue,
        realizedDeploymentRevisionIds: new Set(unique),
        dispatch: candidate,
        runtime,
        runPromise,
        ledger,
      };
    } else if (active) {
      if (active.taskQueue !== target.taskQueue) throw new TypeError('TALOS_WORKER_RECOVERY_ACTIVE_QUEUE_MISMATCH');
      for (const binding of resolved) active.dispatch.add(binding.capabilityUseOccurrenceRef, binding.implementationRef, binding.transport);
      for (const deploymentRevisionId of unique) active.realizedDeploymentRevisionIds.add(deploymentRevisionId);
    }

    const recoveredDeploymentRevisionIds = active
      ? unique.filter((id) => active!.realizedDeploymentRevisionIds.has(id))
      : [];
    const evidenceRefs = records.flatMap((record) => [
      `worker-recovery:${TALOS_PRODUCT_WORKER_RECOVERY_VERSION}`,
      `recovered-deployment:${record.realizedDeploymentRevisionId}`,
      `runtime-program:${record.program.programDigest}`,
      `temporal-namespace:${record.namespace}`,
      `task-queue:${record.taskQueue}`,
    ]);
    return {
      recoveryVersion: TALOS_PRODUCT_WORKER_RECOVERY_VERSION,
      recoveredDeploymentRevisionIds,
      evidenceRefs,
    };
  }

  async function close(): Promise<void> {
    if (closing) return;
    closing = true;
    if (active) {
      active.runtime.worker.shutdown();
      await Promise.allSettled([active.runPromise]);
      active = undefined;
    }
    if (ownsConnection && nativeConnection) await nativeConnection.close();
    nativeConnection = undefined;
  }

  return { recover, close };
}
