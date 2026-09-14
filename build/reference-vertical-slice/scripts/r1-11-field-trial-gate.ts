import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const R1_11_FIELD_TRIAL_SCHEMA='talos.r1-11.field-trial.v1';

export interface R111Defect{
  id:string;
  severity:'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
  summary:string;
  blockedTrial:boolean;
}

export interface R111FieldTrialReceipt{
  schemaVersion:typeof R1_11_FIELD_TRIAL_SCHEMA;
  trialId:string;
  processOrigin:{kind:'REAL_OPERATIONAL_PROCESS'|'REAL_CUSTOMER_PROCESS';organizationAlias:string;description:string};
  participant:{role:string;externalToImplementationTeam:true};
  processFingerprint:string;
  inputKinds:string[];
  metrics:{
    semanticAccuracyReviewed:number;
    reviewerEffortMinutes:number;
    questionUsefulnessRating1to5:number;
    correctionUsabilityRating1to5:number;
    suggestionQualityRating1to5:number;
    authorityClarityRating1to5:number;
    timeToReviewedMinutes:number;
    timeToApprovedMinutes:number|null;
    executionOutcome:'COMPLETED'|'FAILED'|'NOT_ATTEMPTED'|'BLOCKED_BY_OPERATOR';
    operatorFrictionNotes:string;
    defects:R111Defect[];
  };
  evidenceRefs:string[];
  attestedBy:string;
  attestedAt:string;
}

export interface R111ValidationResult{
  status:'PASS'|'FAIL';
  qualifyingTrialCount:number;
  distinctProcessCount:number;
  errors:string[];
  trialIds:string[];
}

function text(value:unknown,name:string,errors:string[]):string{
  if(typeof value!=='string'||!value.trim()){errors.push(`${name} must be a non-empty string`);return'';}
  return value.trim();
}
function finite(value:unknown,name:string,min:number,max:number,errors:string[]):number{
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max){errors.push(`${name} must be a number in [${min}, ${max}]`);return NaN;}
  return value;
}
function stringArray(value:unknown,name:string,errors:string[]):string[]{
  if(!Array.isArray(value)||value.length===0||value.some(item=>typeof item!=='string'||!item.trim())){errors.push(`${name} must contain at least one non-empty string`);return[];}
  return value.map(item=>String(item).trim());
}
function containsSecretLikeMaterial(value:unknown):boolean{
  const serialized=JSON.stringify(value);
  return /gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(serialized);
}

export function validateR111Receipt(value:unknown,label='receipt'):string[]{
  const errors:string[]=[];
  if(!value||typeof value!=='object'||Array.isArray(value))return[`${label} must be an object`];
  const receipt=value as any;
  if(receipt.schemaVersion!==R1_11_FIELD_TRIAL_SCHEMA)errors.push(`${label}.schemaVersion must equal ${R1_11_FIELD_TRIAL_SCHEMA}`);
  text(receipt.trialId,`${label}.trialId`,errors);
  if(!receipt.processOrigin||typeof receipt.processOrigin!=='object')errors.push(`${label}.processOrigin is required`);
  else{
    if(!['REAL_OPERATIONAL_PROCESS','REAL_CUSTOMER_PROCESS'].includes(receipt.processOrigin.kind))errors.push(`${label}.processOrigin.kind must be REAL_OPERATIONAL_PROCESS or REAL_CUSTOMER_PROCESS`);
    text(receipt.processOrigin.organizationAlias,`${label}.processOrigin.organizationAlias`,errors);
    text(receipt.processOrigin.description,`${label}.processOrigin.description`,errors);
  }
  if(!receipt.participant||typeof receipt.participant!=='object')errors.push(`${label}.participant is required`);
  else{
    text(receipt.participant.role,`${label}.participant.role`,errors);
    if(receipt.participant.externalToImplementationTeam!==true)errors.push(`${label}.participant.externalToImplementationTeam must be true`);
  }
  text(receipt.processFingerprint,`${label}.processFingerprint`,errors);
  stringArray(receipt.inputKinds,`${label}.inputKinds`,errors);
  const m=receipt.metrics;
  if(!m||typeof m!=='object')errors.push(`${label}.metrics is required`);
  else{
    finite(m.semanticAccuracyReviewed,`${label}.metrics.semanticAccuracyReviewed`,0,1,errors);
    finite(m.reviewerEffortMinutes,`${label}.metrics.reviewerEffortMinutes`,0,24*60,errors);
    finite(m.questionUsefulnessRating1to5,`${label}.metrics.questionUsefulnessRating1to5`,1,5,errors);
    finite(m.correctionUsabilityRating1to5,`${label}.metrics.correctionUsabilityRating1to5`,1,5,errors);
    finite(m.suggestionQualityRating1to5,`${label}.metrics.suggestionQualityRating1to5`,1,5,errors);
    finite(m.authorityClarityRating1to5,`${label}.metrics.authorityClarityRating1to5`,1,5,errors);
    finite(m.timeToReviewedMinutes,`${label}.metrics.timeToReviewedMinutes`,0,24*60,errors);
    if(m.timeToApprovedMinutes!==null)finite(m.timeToApprovedMinutes,`${label}.metrics.timeToApprovedMinutes`,0,24*60,errors);
    if(!['COMPLETED','FAILED','NOT_ATTEMPTED','BLOCKED_BY_OPERATOR'].includes(m.executionOutcome))errors.push(`${label}.metrics.executionOutcome is invalid`);
    text(m.operatorFrictionNotes,`${label}.metrics.operatorFrictionNotes`,errors);
    if(!Array.isArray(m.defects))errors.push(`${label}.metrics.defects must be an array`);
    else m.defects.forEach((defect:any,index:number)=>{
      if(!defect||typeof defect!=='object'){errors.push(`${label}.metrics.defects[${index}] must be an object`);return;}
      text(defect.id,`${label}.metrics.defects[${index}].id`,errors);
      if(!['LOW','MEDIUM','HIGH','CRITICAL'].includes(defect.severity))errors.push(`${label}.metrics.defects[${index}].severity is invalid`);
      text(defect.summary,`${label}.metrics.defects[${index}].summary`,errors);
      if(typeof defect.blockedTrial!=='boolean')errors.push(`${label}.metrics.defects[${index}].blockedTrial must be boolean`);
    });
  }
  stringArray(receipt.evidenceRefs,`${label}.evidenceRefs`,errors);
  text(receipt.attestedBy,`${label}.attestedBy`,errors);
  const attestedAt=text(receipt.attestedAt,`${label}.attestedAt`,errors);
  if(attestedAt&&!Number.isFinite(Date.parse(attestedAt)))errors.push(`${label}.attestedAt must be ISO-date compatible`);
  if(containsSecretLikeMaterial(receipt))errors.push(`${label} appears to contain secret material`);
  return errors;
}

export function validateR111FieldTrialSet(receipts:unknown[]):R111ValidationResult{
  const errors:string[]=[];
  const valid:R111FieldTrialReceipt[]=[];
  receipts.forEach((receipt,index)=>{
    const current=validateR111Receipt(receipt,`receipts[${index}]`);
    if(current.length)errors.push(...current);else valid.push(receipt as R111FieldTrialReceipt);
  });
  const trialIds=valid.map(item=>item.trialId);
  if(new Set(trialIds).size!==trialIds.length)errors.push('trialId values must be unique');
  const processFingerprints=new Set(valid.map(item=>item.processFingerprint));
  if(valid.length<2)errors.push('R1-11 requires at least two qualifying real field trials');
  if(processFingerprints.size<2)errors.push('R1-11 requires at least two distinct real process fingerprints');
  return{status:errors.length?'FAIL':'PASS',qualifyingTrialCount:valid.length,distinctProcessCount:processFingerprints.size,errors,trialIds};
}

export function loadR111Receipts(directory:string):unknown[]{
  try{return readdirSync(directory,{withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith('.json')).sort((a,b)=>a.name.localeCompare(b.name)).map(entry=>JSON.parse(readFileSync(path.join(directory,entry.name),'utf8')));}
  catch(error:any){if(error?.code==='ENOENT')return[];throw error;}
}

function main(){
  const directory=path.resolve(process.argv[2]??path.join(process.cwd(),'..','..','evidence','field-trials'));
  const receipts=loadR111Receipts(directory);
  const result=validateR111FieldTrialSet(receipts);
  console.log(JSON.stringify({directory,...result},null,2));
  process.exitCode=result.status==='PASS'?0:2;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1]))main();
