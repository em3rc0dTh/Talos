import { existsSync } from 'node:fs';
import path from 'node:path';
import { SqliteDocumentStore } from '../../../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  TALOS_PRODUCT_DATABASE,
  buildTalosProductRecoverySnapshot,
} from './product-runtime-recovery.ts';
import { buildTalosProductJourneyState } from './product-journey.ts';

export interface TalosDurableWorkspaceSnapshot {
  version:'talos.contract-workspace-recovery.v1';
  status:'EMPTY'|'RECOVERED';
  recoveredFromDurableEvidence:boolean;
  automaticAuthorityRehydration:false;
  consumableAuthorityRecovered:false;
  confirmation:null|Record<string,unknown>;
  processRevision:null|Record<string,unknown>;
  bpmnRevision:null|Record<string,unknown>;
  canvas:null|{
    definition:Record<string,unknown>;
    revision:Record<string,unknown>;
  };
  automationApproval:null|{
    id:string;
    processRevisionRef:string;
    executionPlanRevisionRef:string;
  };
  temporalMapping:null|{
    revisionId:string;
    executionPlanRevisionRef:string;
    mappingDigest:string;
  };
  journey:ReturnType<typeof buildTalosProductJourneyState>;
}

function timestamp(value:unknown):number {
  if(typeof value!=='string')return 0;
  const parsed=Date.parse(value);
  return Number.isFinite(parsed)?parsed:0;
}

function latest<T extends Record<string,unknown>>(items:T[],field:string):T|undefined {
  return [...items].sort((a,b)=>timestamp(b[field])-timestamp(a[field]))[0];
}

function record(repo:SqliteDocumentStore,id:unknown):Record<string,unknown>|undefined {
  if(typeof id!=='string'||!id.trim())return undefined;
  const document=repo.get<any>(id as any);
  return document?.payload&&typeof document.payload==='object'?document.payload as Record<string,unknown>:undefined;
}

export function buildTalosDurableWorkspaceSnapshot(runtimeDir:string):TalosDurableWorkspaceSnapshot {
  const recovery=buildTalosProductRecoverySnapshot(runtimeDir);
  const journey=buildTalosProductJourneyState(recovery);
  const databasePath=path.join(runtimeDir,TALOS_PRODUCT_DATABASE);
  const empty:TalosDurableWorkspaceSnapshot={
    version:'talos.contract-workspace-recovery.v1',
    status:'EMPTY',
    recoveredFromDurableEvidence:false,
    automaticAuthorityRehydration:false,
    consumableAuthorityRecovered:false,
    confirmation:null,
    processRevision:null,
    bpmnRevision:null,
    canvas:null,
    automationApproval:null,
    temporalMapping:null,
    journey,
  };
  if(!existsSync(databasePath))return empty;

  const repo=new SqliteDocumentStore(databasePath);
  try{
    const confirmations=repo.listByKind<any>('BusinessProcessConfirmationRecord')
      .map((document)=>document.payload)
      .filter((confirmation)=>confirmation?.status==='CONFIRMED');
    const confirmation=latest(confirmations,'confirmedAt');
    if(!confirmation)return empty;

    const processRevision=record(repo,confirmation.canonicalProcessRevisionId);
    const storedBpmn=record(repo,confirmation.bpmnRevisionId);
    if(!processRevision||!storedBpmn)return empty;
    const bpmnRevision={
      ...storedBpmn,
      state:'CONFIRMED',
      canonicalProcessRevisionId:confirmation.canonicalProcessRevisionId,
    };

    let canvas:TalosDurableWorkspaceSnapshot['canvas']=null;
    if(storedBpmn.sourceRoute==='TALOS_CANVAS'){
      const revisions=repo.listByKind<any>('CanvasRevision').map((document)=>document.payload);
      const canvasRevision=latest(revisions,'createdAt');
      if(canvasRevision){
        const definitions=repo.listByKind<any>('CanvasDefinitionState')
          .map((document)=>document.payload)
          .filter((definition)=>definition?.id===canvasRevision.canvasDefinitionId);
        const definition=latest(definitions,'createdAt')??definitions.at(-1);
        if(definition)canvas={definition,revision:canvasRevision};
      }
    }

    const approvals=repo.listByKind<any>('AutomationDesignApprovalRecord')
      .map((document)=>document.payload)
      .filter((approval)=>approval?.processRevisionRef===confirmation.canonicalProcessRevisionId);
    const approval=latest(approvals,'approvedAt');
    const mappings=approval
      ? repo.listByKind<any>('TemporalMappingRevision')
          .map((document)=>document.payload)
          .filter((mapping)=>mapping?.executionPlanRevisionRef===approval.executionPlanRevisionRef)
      : [];
    const mapping=latest(mappings,'createdAt');

    return{
      version:'talos.contract-workspace-recovery.v1',
      status:'RECOVERED',
      recoveredFromDurableEvidence:true,
      automaticAuthorityRehydration:false,
      consumableAuthorityRecovered:false,
      confirmation,
      processRevision,
      bpmnRevision,
      canvas,
      automationApproval:approval?{
        id:String(approval.id),
        processRevisionRef:String(approval.processRevisionRef),
        executionPlanRevisionRef:String(approval.executionPlanRevisionRef),
      }:null,
      temporalMapping:mapping?{
        revisionId:String(mapping.id),
        executionPlanRevisionRef:String(mapping.executionPlanRevisionRef),
        mappingDigest:String(mapping.mappingDigest),
      }:null,
      journey,
    };
  }finally{
    repo.close();
  }
}
