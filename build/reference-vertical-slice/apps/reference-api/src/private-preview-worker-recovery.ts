import type { NativeConnection } from '@temporalio/worker';
import type { OneAppAutomationContext } from '../../../packages/application/src/one-app-automation.ts';
import { compileGenericRuntimeProgram } from '../../../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';
import type { TalosPrivatePreviewTemporalTarget } from './private-preview-config.ts';
import {
  buildOneAppRuntimeSemanticSnapshot,
  createTalosProductTemporalRuntimeAdapters,
  TALOS_PRODUCT_SDK_VERSION,
  type TalosManagedTemporalRuntimeAdapters,
  type TalosProductCapabilityTransportResolver,
} from './private-preview-temporal-runtime.ts';
import type {
  TalosProductRuntimeCapabilityBinding,
  TalosProductRuntimeRegistry,
  TalosProductRuntimeRegistryRecord,
} from './private-preview-runtime-registry.ts';

export const TALOS_PRODUCT_WORKER_RECOVERY_VERSION = 'talos-product-worker-recovery-v0.3';

export interface TalosProductWorkerRecovery {
  recover(realizedDeploymentRevisionIds: string[]): Promise<{
    recoveryVersion: typeof TALOS_PRODUCT_WORKER_RECOVERY_VERSION;
    recoveredDeploymentRevisionIds: string[];
    evidenceRefs: string[];
  }>;
  close(): Promise<void>;
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
 * Persist only secret-free, exact runtime material. This manifest is recovery
 * evidence, never deployment or workflow-start authority.
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

/**
 * Recovery does not create a second Worker anymore. It registers recovered
 * runtime manifests into the same queue Worker owned by the trusted product
 * runtime adapter, so recovered and fresh deployments share one dispatch table.
 */
export function createTalosProductWorkerRecovery(
  target: TalosPrivatePreviewTemporalTarget,
  registry: TalosProductRuntimeRegistry,
  capabilityTransportResolver?: TalosProductCapabilityTransportResolver,
  options: {
    nativeConnection?: NativeConnection;
    runtimeAdapters?: TalosManagedTemporalRuntimeAdapters;
  } = {},
): TalosProductWorkerRecovery {
  const ownsRuntime = !options.runtimeAdapters;
  const runtimeAdapters = options.runtimeAdapters ?? createTalosProductTemporalRuntimeAdapters(target, {
    capabilityTransportResolver,
    ...(options.nativeConnection ? { nativeConnection: options.nativeConnection } : {}),
  });
  let closed = false;

  async function recover(realizedDeploymentRevisionIds: string[]) {
    if (closed) throw new TypeError('TALOS_WORKER_RECOVERY_CLOSED');
    const unique = [...new Set(realizedDeploymentRevisionIds.map((item) => item.trim()).filter(Boolean))].sort();
    const recoveredDeploymentRevisionIds: string[] = [];
    const evidenceRefs: string[] = [];
    for (const deploymentRevisionId of unique) {
      const record = registry.get(deploymentRevisionId);
      if (!record) throw new TypeError(`TALOS_WORKER_RECOVERY_REGISTRY_RECORD_MISSING: ${deploymentRevisionId}`);
      if (record.namespace !== target.namespace) throw new TypeError(`TALOS_WORKER_RECOVERY_NAMESPACE_MISMATCH: ${deploymentRevisionId}`);
      if (record.taskQueue !== target.taskQueue) throw new TypeError(`TALOS_WORKER_RECOVERY_TASK_QUEUE_MISMATCH: ${deploymentRevisionId}`);
      const recovered = await runtimeAdapters.recoverDeployment(record);
      recoveredDeploymentRevisionIds.push(recovered.realizedDeploymentRevisionId);
      evidenceRefs.push(
        `worker-recovery:${TALOS_PRODUCT_WORKER_RECOVERY_VERSION}`,
        ...recovered.evidenceRefs,
      );
    }
    return {
      recoveryVersion: TALOS_PRODUCT_WORKER_RECOVERY_VERSION,
      recoveredDeploymentRevisionIds,
      evidenceRefs,
    };
  }

  async function close(): Promise<void> {
    if (closed) return;
    closed = true;
    if (ownsRuntime) await runtimeAdapters.close();
  }

  return { recover, close };
}
