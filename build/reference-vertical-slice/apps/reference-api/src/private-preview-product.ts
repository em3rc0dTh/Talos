import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTalosPrivatePreviewRuntimeBinding } from './private-preview-config.ts';
import { startTalosPrivatePreviewOperator } from './private-preview-operator.ts';
import { startTalosOneAppProduct } from './one-app-product-server.ts';
import {
  createTalosProductTemporalRuntimeAdapters,
  TALOS_PRODUCT_ACTIVITY_TYPE,
  TALOS_PRODUCT_SDK_VERSION,
  TALOS_PRODUCT_TEMPORAL_RUNTIME_VERSION,
  TALOS_PRODUCT_WORKFLOW_TYPE,
  type TalosManagedTemporalRuntimeAdapters,
} from './private-preview-temporal-runtime.ts';

export const TALOS_PRODUCT_LAUNCHER_VERSION = 'talos-private-preview-product-v0.1';
export const TALOS_PRODUCT_PORT_ENV = 'TALOS_PRODUCT_PORT';

type Environment = Readonly<Record<string, string | undefined>>;

function productPort(env: Environment): number {
  const raw = env[TALOS_PRODUCT_PORT_ENV]?.trim() || '8787';
  if (!/^\d+$/.test(raw)) throw new TypeError(`${TALOS_PRODUCT_PORT_ENV} must be an integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) {
    throw new TypeError(`${TALOS_PRODUCT_PORT_ENV} must be between 1 and 65535`);
  }
  return value;
}

function workerArtifact() {
  const executableArtifactRef = 'workers/reference-temporal-worker/src/generic-worker-runtime.ts';
  const filePath = fileURLToPath(new URL('../../../workers/reference-temporal-worker/src/generic-worker-runtime.ts', import.meta.url));
  return {
    executableArtifactRef,
    artifactDigest: createHash('sha256').update(readFileSync(filePath)).digest('hex'),
  };
}

export async function startTalosPrivatePreviewProduct(env: Environment = process.env) {
  const binding = resolveTalosPrivatePreviewRuntimeBinding(env);
  const start = binding.createStartConfiguration();
  let runtimeAdapters: TalosManagedTemporalRuntimeAdapters | undefined;

  if (binding.descriptor.runtimeMode === 'TEMPORAL_EXECUTION') {
    const target = binding.descriptor.temporalTarget;
    if (!target) throw new TypeError('TALOS_PRODUCT_TEMPORAL_TARGET_REQUIRED');
    runtimeAdapters = createTalosProductTemporalRuntimeAdapters(target);
    try {
      await runtimeAdapters.assertReachable();
    } catch (error) {
      await runtimeAdapters.close();
      throw error;
    }
  }

  let operator: Awaited<ReturnType<typeof startTalosPrivatePreviewOperator>> | undefined;
  let product: Awaited<ReturnType<typeof startTalosOneAppProduct>> | undefined;
  try {
    operator = await startTalosPrivatePreviewOperator(env, {
      ...(runtimeAdapters ? { runtimeAdapters } : {}),
    });
    const artifact = workerArtifact();
    product = await startTalosOneAppProduct({
      port: productPort(env),
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
      runtimeProfile: {
        launcherVersion: TALOS_PRODUCT_LAUNCHER_VERSION,
        workspaceId: binding.descriptor.workspaceId,
        actorId: binding.descriptor.actorId,
        runtimeMode: binding.descriptor.runtimeMode,
        imageMode: binding.descriptor.imageMode,
        temporalExecutionAvailable: Boolean(runtimeAdapters),
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
    await operator?.close().catch(() => undefined);
    await runtimeAdapters?.close().catch(() => undefined);
    throw error;
  }

  let closed = false;
  return {
    baseUrl: product.baseUrl,
    runtimeDir: operator.runtimeDir,
    runtimeDescriptor: binding.descriptor,
    recoveryBeforeStart: operator.recoveryBeforeStart,
    async close() {
      if (closed) return;
      closed = true;
      await product.close();
      await operator.close();
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
