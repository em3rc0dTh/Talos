import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SqliteDocumentStore } from '../../../packages/persistence-sqlite/src/sqlite-document-store.ts';

export const TALOS_PRODUCT_RUNTIME_SCHEMA_VERSION='talos.one-app-product-runtime.v1';
export const TALOS_PRODUCT_RUNTIME_MANIFEST='talos-product-runtime.json';
export const TALOS_PRODUCT_DATABASE='talos-one-app.sqlite';

export interface TalosProductRuntimeManifest{
  schemaVersion:typeof TALOS_PRODUCT_RUNTIME_SCHEMA_VERSION;
  compatibilityFamily:'TALOS_1_X';
  migrationPolicy:'EXPLICIT_ONLY_NO_AUTOMATIC_MUTATION';
  authorityRecoveryPolicy:'DURABLE_EVIDENCE_RECONSTRUCTION_EXPLICIT_REAUTHORIZATION';
  createdAt:string;
}

export interface TalosRecoveryDocumentSummary{
  id:string;
  aggregateKind:string;
  schemaVersion:string;
  createdAt:string;
  parentId?:string;
  state?:string;
  result?:string;
  readiness?:string;
  executionStatus?:string;
  revisionNumber?:number;
  processRevisionRef?:string;
  executionPlanRevisionRef?:string;
  deploymentRevisionRef?:string;
  workflowIdRef?:string;
  runIdRef?:string;
}

export interface TalosProductRecoverySnapshot{
  runtimeSchemaVersion:typeof TALOS_PRODUCT_RUNTIME_SCHEMA_VERSION;
  compatibilityFamily:'TALOS_1_X';
  recoveryMode:'DURABLE_EVIDENCE_RECONSTRUCTION';
  automaticAuthorityRehydration:false;
  explicitReauthorizationRequired:true;
  durableDocumentCount:number;
  aggregateCounts:Record<string,number>;
  lastDurableStage:string;
  nextSafeAction:string;
  inFlightRecovery:string;
  latestByKind:Record<string,TalosRecoveryDocumentSummary>;
  timeline:TalosRecoveryDocumentSummary[];
}

function runtimeManifestPath(runtimeDir:string):string{return path.join(runtimeDir,TALOS_PRODUCT_RUNTIME_MANIFEST);}
function runtimeDatabasePath(runtimeDir:string):string{return path.join(runtimeDir,TALOS_PRODUCT_DATABASE);}

export function ensureTalosProductRuntimeCompatibility(runtimeDir:string):TalosProductRuntimeManifest{
  mkdirSync(runtimeDir,{recursive:true});
  const manifestPath=runtimeManifestPath(runtimeDir);
  if(!existsSync(manifestPath)){
    const manifest:TalosProductRuntimeManifest={
      schemaVersion:TALOS_PRODUCT_RUNTIME_SCHEMA_VERSION,
      compatibilityFamily:'TALOS_1_X',
      migrationPolicy:'EXPLICIT_ONLY_NO_AUTOMATIC_MUTATION',
      authorityRecoveryPolicy:'DURABLE_EVIDENCE_RECONSTRUCTION_EXPLICIT_REAUTHORIZATION',
      createdAt:new Date().toISOString(),
    };
    writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n',{encoding:'utf8',flag:'wx'});
    return manifest;
  }
  let parsed:any;
  try{parsed=JSON.parse(readFileSync(manifestPath,'utf8'));}
  catch{throw new TypeError('TALOS_RUNTIME_MANIFEST_INVALID: runtime manifest is not valid JSON');}
  if(parsed?.schemaVersion!==TALOS_PRODUCT_RUNTIME_SCHEMA_VERSION){
    throw new TypeError(`TALOS_RUNTIME_VERSION_INCOMPATIBLE: expected ${TALOS_PRODUCT_RUNTIME_SCHEMA_VERSION}, found ${String(parsed?.schemaVersion??'missing')}. Automatic migration is forbidden; use an explicit migration or isolated runtime directory.`);
  }
  if(parsed?.migrationPolicy!=='EXPLICIT_ONLY_NO_AUTOMATIC_MUTATION'){
    throw new TypeError('TALOS_RUNTIME_MIGRATION_POLICY_INCOMPATIBLE: automatic or unknown runtime migration policy is not accepted');
  }
  return parsed as TalosProductRuntimeManifest;
}

function text(value:unknown):string|undefined{return typeof value==='string'&&value.trim()?value:undefined;}
function integer(value:unknown):number|undefined{return Number.isInteger(value)?Number(value):undefined;}

function summarize(document:any):TalosRecoveryDocumentSummary{
  const payload=document.payload&&typeof document.payload==='object'&&!Array.isArray(document.payload)?document.payload as Record<string,unknown>:{};
  const assessment=payload.assessment&&typeof payload.assessment==='object'&&!Array.isArray(payload.assessment)?payload.assessment as Record<string,unknown>:{};
  const revision=payload.revision&&typeof payload.revision==='object'&&!Array.isArray(payload.revision)?payload.revision as Record<string,unknown>:{};
  return{
    id:String(document.id),
    aggregateKind:String(document.aggregateKind),
    schemaVersion:String(document.schemaVersion),
    createdAt:String(document.createdAt),
    ...(document.parentId?{parentId:String(document.parentId)}:{}),
    ...(text(payload.state)?{state:text(payload.state)}:{}),
    ...(text(payload.result)?{result:text(payload.result)}:{}),
    ...(text(payload.executionStatus)?{executionStatus:text(payload.executionStatus)}:{}),
    ...(text(payload.readiness)||text(assessment.readiness)?{readiness:text(payload.readiness)??text(assessment.readiness)}:{}),
    ...(integer(payload.revisionNumber)!==undefined||integer(revision.revisionNumber)!==undefined?{revisionNumber:integer(payload.revisionNumber)??integer(revision.revisionNumber)}:{}),
    ...(text(payload.processRevisionRef)||text(payload.processRevisionId)?{processRevisionRef:text(payload.processRevisionRef)??text(payload.processRevisionId)}:{}),
    ...(text(payload.executionPlanRevisionRef)?{executionPlanRevisionRef:text(payload.executionPlanRevisionRef)}:{}),
    ...(text(payload.deploymentRevisionRef)||text(payload.startingDeploymentRevisionRef)?{deploymentRevisionRef:text(payload.deploymentRevisionRef)??text(payload.startingDeploymentRevisionRef)}:{}),
    ...(text(payload.workflowIdRef)?{workflowIdRef:text(payload.workflowIdRef)}:{}),
    ...(text(payload.runIdRef)?{runIdRef:text(payload.runIdRef)}:{}),
  };
}

function has(counts:Record<string,number>,kind:string):boolean{return(counts[kind]??0)>0;}

function recoveryClassification(counts:Record<string,number>):{stage:string;nextSafeAction:string;inFlightRecovery:string}{
  if(has(counts,'WorkflowExecutionObservation'))return{stage:'WORKFLOW_EXECUTION_OBSERVED',nextSafeAction:'REVIEW_EXECUTION_HISTORY_OR_BEGIN_NEW_EXPLICIT_REVISION',inFlightRecovery:'COMPLETED_EXECUTION_IS_DURABLE; NO EXECUTION AUTHORITY IS REHYDRATED'};
  if(has(counts,'WorkflowExecutionApprovalRecord'))return{stage:'WORKFLOW_EXECUTION_APPROVED_NOT_OBSERVED',nextSafeAction:'REAUTHORIZE_WORKFLOW_EXECUTION_FROM_DURABLE_EVIDENCE',inFlightRecovery:'UNOBSERVED START IS TREATED AS UNKNOWN; DO NOT AUTO-START AFTER RESTART'};
  if(has(counts,'DeploymentAttempt'))return{stage:'DEPLOYMENT_ATTEMPT_RECORDED',nextSafeAction:'REAUTHORIZE_WORKFLOW_EXECUTION_FROM_DURABLE_EVIDENCE',inFlightRecovery:'DEPLOYMENT RESULT IS DURABLE; EXECUTION AUTHORITY MUST BE RECREATED EXPLICITLY'};
  if(has(counts,'DeploymentApprovalRecord'))return{stage:'DEPLOYMENT_APPROVED_NOT_ATTEMPTED',nextSafeAction:'REAUTHORIZE_DEPLOYMENT_FROM_DURABLE_EVIDENCE',inFlightRecovery:'UNCONSUMED IN-MEMORY DEPLOYMENT AUTHORITY IS NOT REHYDRATED AFTER RESTART'};
  if((counts.DeploymentRevision??0)>=2)return{stage:'ENVIRONMENT_REALIZED',nextSafeAction:'REVIEW_REALIZATION_AND_REAUTHORIZE_DEPLOYMENT',inFlightRecovery:'REALIZATION EVIDENCE IS DURABLE; DEPLOYMENT AUTHORITY REMAINS EXPLICIT'};
  if(has(counts,'DeploymentRevision'))return{stage:'DEPLOYMENT_DESIGNED',nextSafeAction:'REVIEW_DEPLOYMENT_DESIGN_AND_REALIZE_ENVIRONMENT',inFlightRecovery:'DEPLOYMENT INTENT IS DURABLE; REALIZATION MUST BE RE-OBSERVED OR CONFIRMED'};
  if(has(counts,'RuntimePolicyRevision'))return{stage:'RUNTIME_POLICY_DESIGNED',nextSafeAction:'RECREATE_DEPLOYMENT_DESIGN_AUTHORITY',inFlightRecovery:'RUNTIME POLICY IS DURABLE; NO DEPLOYMENT AUTHORITY IS IMPLIED'};
  if(has(counts,'TemporalMappingRevision'))return{stage:'TEMPORAL_MAPPING_DESIGNED',nextSafeAction:'RECREATE_EXPLICIT_RUNTIME_POLICY_AUTHORITY',inFlightRecovery:'TEMPORAL DESIGN IS DURABLE; RUNTIME POLICY MUST REMAIN EXPLICIT'};
  if(has(counts,'AutomationDesignApprovalRecord'))return{stage:'AUTOMATION_APPROVED',nextSafeAction:'RECREATE_TEMPORAL_MAPPING_AUTHORITY',inFlightRecovery:'AUTOMATION APPROVAL EVIDENCE IS DURABLE; DOWNSTREAM SESSION AUTHORITY IS NOT REHYDRATED'};
  if(has(counts,'AutomationExecutionPlanReview'))return{stage:'EXECUTION_PLAN_REVIEWED',nextSafeAction:'REVIEW_AND_REAUTHORIZE_EXACT_EXECUTION_PLAN',inFlightRecovery:'REVIEW EVIDENCE IS DURABLE; AUTOMATION APPROVAL MUST BE EXPLICIT'};
  if(has(counts,'CapabilityBindingRevision'))return{stage:'CAPABILITIES_BOUND',nextSafeAction:'REOPEN_EXECUTION_PLAN_REVIEW_FROM_DURABLE_LINEAGE',inFlightRecovery:'BINDINGS ARE DURABLE; EXECUTIONPLAN AUTHORITY IS NOT IMPLIED'};
  if(has(counts,'SemanticFreezeRecord'))return{stage:'AUTOMATION_DESIGN_BASELINE_FROZEN',nextSafeAction:'REOPEN_AUTOMATION_DESIGN_FROM_DURABLE_BASELINE',inFlightRecovery:'FROZEN MEANING SURVIVES; WORKSPACE SESSION STATE DOES NOT BECOME AUTHORITY'};
  if(has(counts,'BusinessProcessConfirmationRecord'))return{stage:'BUSINESS_PROCESS_CONFIRMED',nextSafeAction:'REOPEN_AUTOMATION_DESIGN_EXPLICITLY',inFlightRecovery:'CONFIRMATION SURVIVES; AUTOMATION DESIGN STILL REQUIRES EXPLICIT HANDOFF'};
  if(Object.keys(counts).length)return{stage:'DURABLE_HISTORY_PRESENT',nextSafeAction:'REVIEW_DURABLE_HISTORY',inFlightRecovery:'NO CONSUMABLE AUTHORITY IS INFERRED FROM DURABLE DOCUMENT PRESENCE'};
  return{stage:'EMPTY_RUNTIME',nextSafeAction:'START_NEW_SOURCE_INTAKE',inFlightRecovery:'NO DURABLE WORK EXISTS'};
}

export function buildTalosProductRecoverySnapshot(runtimeDir:string):TalosProductRecoverySnapshot{
  const manifest=ensureTalosProductRuntimeCompatibility(runtimeDir);
  const databasePath=runtimeDatabasePath(runtimeDir);
  if(!existsSync(databasePath)){
    return{runtimeSchemaVersion:manifest.schemaVersion,compatibilityFamily:manifest.compatibilityFamily,recoveryMode:'DURABLE_EVIDENCE_RECONSTRUCTION',automaticAuthorityRehydration:false,explicitReauthorizationRequired:true,durableDocumentCount:0,aggregateCounts:{},lastDurableStage:'EMPTY_RUNTIME',nextSafeAction:'START_NEW_SOURCE_INTAKE',inFlightRecovery:'NO DURABLE WORK EXISTS',latestByKind:{},timeline:[]};
  }
  const repo=new SqliteDocumentStore(databasePath);
  try{
    const documents=repo.listAll();
    const timeline=documents.map(summarize);
    const aggregateCounts:Record<string,number>={};
    const latestByKind:Record<string,TalosRecoveryDocumentSummary>={};
    for(const item of timeline){aggregateCounts[item.aggregateKind]=(aggregateCounts[item.aggregateKind]??0)+1;latestByKind[item.aggregateKind]=item;}
    const classification=recoveryClassification(aggregateCounts);
    return{runtimeSchemaVersion:manifest.schemaVersion,compatibilityFamily:manifest.compatibilityFamily,recoveryMode:'DURABLE_EVIDENCE_RECONSTRUCTION',automaticAuthorityRehydration:false,explicitReauthorizationRequired:true,durableDocumentCount:timeline.length,aggregateCounts,lastDurableStage:classification.stage,nextSafeAction:classification.nextSafeAction,inFlightRecovery:classification.inFlightRecovery,latestByKind,timeline};
  }finally{repo.close();}
}
