import { fileURLToPath } from 'node:url';
import { NativeConnection, Worker } from '@temporalio/worker';
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

export interface ConnectedGenericTemporalWorkerOptions extends Omit<GenericTemporalWorkerOptions,'connection'>{
  address:string;
}

export async function connectGenericTemporalWorker(options:ConnectedGenericTemporalWorkerOptions){
  const connection=await NativeConnection.connect({address:options.address});
  try{
    const runtime=await createGenericTemporalWorker({
      connection,
      ...(options.namespace?{namespace:options.namespace}:{}),
      taskQueue:options.taskQueue,
      ...(options.identity?{identity:options.identity}:{}),
      ...(options.ledger?{ledger:options.ledger}:{}),
      ...(options.capabilityTransport?{capabilityTransport:options.capabilityTransport}:{}),
    });
    return{...runtime,connection};
  }catch(error){
    await connection.close();
    throw error;
  }
}
