import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTalosPrivatePreviewRuntimeBinding } from './private-preview-config.ts';
import {
  resolveTalosPrivatePreviewRuntimeDir,
  startTalosPrivatePreviewOperator,
} from './private-preview-operator.ts';
import { startTalosOneAppProduct } from './one-app-product-server.ts';
import { createTalosProductCapabilityTransportResolver } from './private-preview-capability-transports.ts';
import {
  createTalosProductTemporalRuntimeAdapters,
  TALOS_PRODUCT_ACTIVITY_TYPE,
  TALOS_PRODUCT_SDK_VERSION,
  TALOS_PRODUCT_TEMPORAL_RUNTIME_VERSION,
  TALOS_PRODUCT_WORKFLOW_TYPE,
  type TalosManagedTemporalRuntimeAdapters,
  type TalosProductCapabilityTransportResolver,
} from './private-preview-temporal-runtime.ts';
import {
  createTalosProductHumanRuntimeControl,
  type TalosProductHumanRuntimeControl,
} from './private-preview-human-control.ts';
import {
  createTalosProductExecutionRecovery,
  createTalosTemporalExecutionInspector,
  type TalosExecutionRecoveryResult,
  type TalosProductExecutionRecovery,
} from './private-preview-execution-recovery.ts';
import { createTalosProductRuntimeRegistry, type TalosProductRuntimeRegistry } from './private-preview-runtime-registry.ts';
import {
  createTalosProductWorkerRecovery,
  persistTalosProductRuntimeManifest,
  type TalosProductWorkerRecovery,
} from './private-preview-worker-recovery.ts';
import type { TalosPrivatePreviewRuntimeAdapters } from './private-preview-runtime.ts';

export const TALOS_PRODUCT_LAUNCHER_VERSION = 'talos-private-preview-product-v0.6';
export const TALOS_PRODUCT_PORT_ENV = 'TALOS_PRODUCT_PORT';

type Environment = Readonly<Record<string, string | undefined>>;

export interface TalosPrivatePreviewProductOptions {
  /** Test/development override. Zero requests an ephemeral product-shell port. */
  productPort?: number;
  /** Test/development override. Zero requests an ephemeral secured authority port. */
  authorityPort?: number;
}

function checkedPort(value: number, label: string, allowEphemeral: boolean): number {
  const min = allowEphemeral ? 0 : 1;
  if (!Number.isSafeInteger(value) || value < min || value > 65_535) {
    throw new TypeError(`${label} must be between ${min} and 65535`);
  }
  return value;
}

function productPort(env: Environment, override?: number): number {
  if (override !== undefined) return checkedPort(override, 'productPort', true);
  const raw = env[TALOS_PRODUCT_PORT_ENV]?.trim() || '8787';
  if (!/^\d+$/.test(raw)) throw new TypeError(`${TALOS_PRODUCT_PORT_ENV} must be an integer`);
  return checkedPort(Number(raw), TALOS_PRODUCT_PORT_ENV, false);
}

function workerArtifact() {
  const executableArtifactRef = 'workers/reference-temporal-worker/src/generic-worker-runtime.ts';
  const filePath = fileURLToPath(new URL('../../../workers/reference-temporal-worker/src/generic-worker-runtime.ts', import.meta.url));
  return {
    executableArtifactRef,
    artifactDigest: createHash('sha256').update(readFileSync(filePath)).digest('hex'),
  };
}

export async function startTalosPrivatePreviewProduct(
  env: Environment = process.env,
  options: TalosPrivatePreviewProductOptions = {},
) {
  const binding = resolveTalosPrivatePreviewRuntimeBinding(env);
  const start = binding.createStartConfiguration();
  const runtimeDir = resolveTalosPrivatePreviewRuntimeDir(env);
  let runtimeAdapters: TalosManagedTemporalRuntimeAdapters | undefined;
  let operatorRuntimeAdapters: TalosPrivatePreviewRuntimeAdapters | undefined;
  let humanRuntimeControl: TalosProductHumanRuntimeControl | undefined;
  let capabilityTransportResolver: TalosProductCapabilityTransportResolver | undefined;
  let runtimeRegistry: TalosProductRuntimeRegistry | undefined;
  const temporalTarget = binding.descriptor.runtimeMode === 'TEMPORAL_EXECUTION'
    ? binding.descriptor.temporalTarget
    : undefined;

  if (binding.descriptor.runtimeMode === 'TEMPORAL_EXECUTION') {
    if (!temporalTarget) throw new TypeError('TALOS_PRODUCT_TEMPORAL_TARGET_REQUIRED');
    capabilityTransportResolver = createTalosProductCapabilityTransportResolver(env);
    runtimeRegistry = createTalosProductRuntimeRegistry(runtimeDir);
    runtimeAdapters = createTalosProductTemporalRuntimeAdapters(temporalTarget, {
      capabilityTransportResolver,
    });
    operatorRuntimeAdapters = {
      deploymentAttemptExecutor: async (input) => {
        // Recovery material is not authority. Persist it before the attempt so a
        // crash after Worker start cannot strand a live Temporal Workflow without
        // the exact program needed to rehydrate its Worker.
        persistTalosProductRuntimeManifest(runtimeRegistry!, input.context, temporalTarget, input.startedAt);
        return runtimeAdapters!.deploymentAttemptExecutor(input);
      },
      workflowExecutionExecutor: (input) => runtimeAdapters!.workflowExecutionExecutor(input),
    };
    try {
      await runtimeAdapters.assertReachable();
      humanRuntimeControl = createTalosProductHumanRuntimeControl(temporalTarget);
    } catch (error) {
      await runtimeAdapters.close();
      throw error;
    }
  }

  let operator: Awaited<ReturnType<typeof startTalosPrivatePreviewOperator>> | undefined;
  let product: Awaited<ReturnType<typeof startTalosOneAppProduct>> | undefined;
  let executionRecovery: TalosProductExecutionRecovery | undefined;
  let workerRecovery: TalosProductWorkerRecovery | undefined;
  let preflightExecutionRecovery: TalosExecutionRecoveryResult | undefined;
  let workerRecoveryResult: Awaited<ReturnType<TalosProductWorkerRecovery['recover']>> | undefined;
  try {
    operator = await startTalosPrivatePreviewOperator(env, {
      ...(options.authorityPort !== undefined ? { port: checkedPort(options.authorityPort, 'authorityPort', true) } : {}),
      ...(operatorRuntimeAdapters ? { runtimeAdapters: operatorRuntimeAdapters } : {}),
    });
    if (temporalTarget && runtimeRegistry && capabilityTransportResolver) {
      executionRecovery = createTalosProductExecutionRecovery(
        operator.runtimeDir,
        createTalosTemporalExecutionInspector(temporalTarget),
      );
      preflightExecutionRecovery = await executionRecovery.reconcileAll();
      const activeDeploymentRevisionIds = [...new Set(
        preflightExecutionRecovery.items
          .filter((item) => item.state === 'RUNNING')
          .map((item) => item.start?.startingDeploymentRevisionRef)
          .filter((item): item is string => Boolean(item)),
      )];
      workerRecovery = createTalosProductWorkerRecovery(
        temporalTarget,
        runtimeRegistry,
        capabilityTransportResolver,
      );
      workerRecoveryResult = await workerRecovery.recover(activeDeploymentRevisionIds);
      if (workerRecoveryResult.recoveredDeploymentRevisionIds.length !== activeDeploymentRevisionIds.length) {
        throw new TypeError('TALOS_PRODUCT_WORKER_RECOVERY_INCOMPLETE');
      }
    }
    const artifact = workerArtifact();
    product = await startTalosOneAppProduct({
      port: productPort(env, options.productPort),
      host: '127.0.0.1',
      upstream: {
        baseUrl: operator.baseUrl,
        runtimeDir: operator.runtimeDir,
        headers: {
          authorization: `Bearer ${start.access.bearerToken}`,
          'x-talos-workspace-id': start.access.workspaceId,
          'x-talos-actor-id': start.access.actorId,
        },
      },
      ...(humanRuntimeControl ? {
        humanRuntimeControl,
        humanRuntimeActorId: binding.descriptor.actorId,
      } : {}),
      ...(executionRecovery ? { executionRecovery } : {}),
      runtimeProfile: {
        launcherVersion: TALOS_PRODUCT_LAUNCHER_VERSION,
        workspaceId: binding.descriptor.workspaceId,
        actorId: binding.descriptor.actorId,
        runtimeMode: binding.descriptor.runtimeMode,
        imageMode: binding.descriptor.imageMode,
        temporalExecutionAvailable: Boolean(runtimeAdapters),
        humanRuntimeAvailable: Boolean(humanRuntimeControl),
        executionRecoveryAvailable: Boolean(executionRecovery),
        recoveredActiveExecutionIds: [...(preflightExecutionRecovery?.activeExecutionIds ?? [])],
        recoveredTerminalExecutionIds: [...(preflightExecutionRecovery?.terminalExecutionIds ?? [])],
        recoveredWorkerDeploymentRevisionIds: [...(workerRecoveryResult?.recoveredDeploymentRevisionIds ?? [])],
        ...(binding.descriptor.imageProvider ? { imageProvider: binding.descriptor.imageProvider } : {}),
        ...(binding.descriptor.temporalTarget ? {
          temporal: {
            namespace: binding.descriptor.temporalTarget.namespace,
            taskQueue: binding.descriptor.temporalTarget.taskQueue,
            platformRef: 'TEMPORAL_CONFIGURED_PRIVATE_PREVIEW',
            workflowTypeName: TALOS_PRODUCT_WORKFLOW_TYPE,
            activityTypeName: TALOS_PRODUCT_ACTIVITY_TYPE,
            workerLogicalName: 'talos-product-worker',
            sdkFamily: 'TEMPORAL_TYPESCRIPT_SDK',
            sdkVersion: TALOS_PRODUCT_SDK_VERSION,
            runtimeAdapterVersion: TALOS_PRODUCT_TEMPORAL_RUNTIME_VERSION,
            ...artifact,
          },
        } : {}),
        secretMaterialExposed: false,
      },
    });
  } catch (error) {
    await product?.close().catch(() => undefined);
    if (!product) await executionRecovery?.close().catch(() => undefined);
    await workerRecovery?.close().catch(() => undefined);
    await operator?.close().catch(() => undefined);
    await humanRuntimeControl?.close().catch(() => undefined);
    await runtimeAdapters?.close().catch(() => undefined);
    throw error;
  }

  let closed = false;
  return {
    baseUrl: product.baseUrl,
    authorityBaseUrl: operator.baseUrl,
    runtimeDir: operator.runtimeDir,
    runtimeDescriptor: binding.descriptor,
    recoveryBeforeStart: operator.recoveryBeforeStart,
    executionRecoveryBeforeServe: product.recoveryBeforeServe,
    preflightExecutionRecovery,
    workerRecoveryResult,
    async close() {
      if (closed) return;
      closed = true;
      // Product owns execution-recovery; launcher owns recovered Worker and base runtime lifecycles.
      await product.close();
      await workerRecovery?.close();
      await operator.close();
      await humanRuntimeControl?.close();
      await runtimeAdapters?.close();
    },
  };
}

async function main(): Promise<void> {
  const app = await startTalosPrivatePreviewProduct(process.env);
  process.stdout.write(`${JSON.stringify({
    status: 'READY',
    product: 'TALOS_ONE_APP',
    launcherVersion: TALOS_PRODUCT_LAUNCHER_VERSION,
    baseUrl: app.baseUrl,
    runtimeDir: path.resolve(app.runtimeDir),
    runtimeMode: app.runtimeDescriptor.runtimeMode,
    imageMode: app.runtimeDescriptor.imageMode,
    temporalExecutionAvailable: app.runtimeDescriptor.runtimeMode === 'TEMPORAL_EXECUTION',
    humanRuntimeAvailable: app.runtimeDescriptor.runtimeMode === 'TEMPORAL_EXECUTION',
    executionRecoveryAvailable: app.runtimeDescriptor.runtimeMode === 'TEMPORAL_EXECUTION',
    recoveredActiveExecutionCount: app.preflightExecutionRecovery?.activeExecutionIds.length ?? 0,
    recoveredTerminalExecutionCount: app.preflightExecutionRecovery?.terminalExecutionIds.length ?? 0,
    recoveredWorkerCount: app.workerRecoveryResult?.recoveredDeploymentRevisionIds.length ?? 0,
    secretMaterialExposed: false,
  }, null, 2)}\n`);

  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await app.close();
  };
  const onSignal = () => {
    stop().then(() => process.exit(0), (error) => {
      console.error(error);
      process.exit(1);
    });
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
