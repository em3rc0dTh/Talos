import { fileURLToPath } from 'node:url';
import type { NativeConnection } from '@temporalio/worker';
import { Worker } from '@temporalio/worker';
import { createGenericActivities,GenericEffectLedger,type GenericCapabilityTransport } from './generic-activities.ts';

export interface GenericTemporalWorkerOptions {
  connection?:NativeConnection;
  namespace?:string;
  taskQueue:string;
  identity?:string;
  ledger?:GenericEffectLedger;
  capabilityTransport?:GenericCapabilityTransport;
}
export async function createGenericTemporalWorker(options:GenericTemporalWorkerOptions){
  const ledger=options.ledger??new GenericEffectLedger();
  const worker=await Worker.create({...(options.connection?{connection:options.connection}:{}),...(options.namespace?{namespace:options.namespace}:{}),taskQueue:options.taskQueue,identity:options.identity??'talos-generic-worker',workflowsPath:fileURLToPath(new URL('./generic-workflow.ts',import.meta.url)),activities:createGenericActivities(ledger,options.capabilityTransport)});
  return{worker,ledger};
}

export type GenericWorkerRuntime=Awaited<ReturnType<typeof createGenericTemporalWorker>>;
