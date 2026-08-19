import { fileURLToPath } from 'node:url';
import type { NativeConnection } from '@temporalio/worker';
import { Worker } from '@temporalio/worker';
import {
  ReferenceEmailSinkService,
  ReferenceEmailSinkStore,
  type ReferenceEmailFailurePlan,
} from '../../../packages/reference-email-sink/src/index.ts';
import { createReferenceActivities } from './activities.ts';

export interface ReferenceTemporalWorkerOptions {
  connection?: NativeConnection;
  namespace?: string;
  taskQueue: string;
  providerDbPath: string;
  identity?: string;
  failurePlan?: ReferenceEmailFailurePlan;
  now?: () => string;
}

export interface ReferenceTemporalWorkerRuntime {
  worker: Worker;
  providerStore: ReferenceEmailSinkStore;
  providerService: ReferenceEmailSinkService;
  closeProvider(): void;
}

export async function createReferenceTemporalWorker(
  options: ReferenceTemporalWorkerOptions,
): Promise<ReferenceTemporalWorkerRuntime> {
  const providerStore = new ReferenceEmailSinkStore(options.providerDbPath);
  const providerService = new ReferenceEmailSinkService(providerStore, options.now);

  try {
    const worker = await Worker.create({
      ...(options.connection ? { connection: options.connection } : {}),
      ...(options.namespace ? { namespace: options.namespace } : {}),
      taskQueue: options.taskQueue,
      identity: options.identity ?? 'talos-reference-worker',
      workflowsPath: fileURLToPath(new URL('./workflow.ts', import.meta.url)),
      activities: createReferenceActivities(providerService, {
        ...(options.failurePlan ? { failurePlan: options.failurePlan } : {}),
      }),
    });

    return {
      worker,
      providerStore,
      providerService,
      closeProvider: () => providerStore.close(),
    };
  } catch (error) {
    providerStore.close();
    throw error;
  }
}
