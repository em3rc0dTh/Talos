import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { designReferenceExecutionPlan } from '../packages/execution/src/reference-plan.ts';
import { designReferenceTemporalMapping } from '../packages/temporal-design/src/reference-mapping.ts';
import { designReferenceRuntimePolicy } from '../packages/runtime-policy/src/reference-policy.ts';
import { designReferenceDeployment } from '../packages/deployment/src/reference-deployment.ts';
import {
  compileReferenceRuntimeProgram,
  initialReferenceApprovalState,
  applyReferenceReviewSubmission,
  referencePostReviewAction,
  referenceTemporalFailureTranslation,
  validateReferenceWorkflowInput,
  ReferenceReviewUpdateRejected,
} from '../workers/reference-temporal-worker/src/index.ts';

const at = '2026-08-19T20:30:00.000Z';
function buildB6() {
  const process:any={id:'prc_process_revision_2',processDefinitionId:'prc_process_definition',nodes:[{id:'prc_start',name:'Request submitted'},{id:'prc_review',name:'Review request'},{id:'prc_decision',name:'Approved?'},{id:'prc_email',name:'Send confirmation email'},{id:'prc_completed',name:'Completed'},{id:'prc_rejected',name:'Rejected'}],edges:[{id:'prc_e1',sourceNodeId:'prc_start',targetNodeId:'prc_review',kind:'SEQUENCE'},{id:'prc_e2',sourceNodeId:'prc_review',targetNodeId:'prc_decision',kind:'SEQUENCE'},{id:'prc_e3',sourceNodeId:'prc_decision',targetNodeId:'prc_email',kind:'CONDITIONAL'},{id:'prc_e4',sourceNodeId:'prc_decision',targetNodeId:'prc_rejected',kind:'DEFAULT'},{id:'prc_e5',sourceNodeId:'prc_email',targetNodeId:'prc_completed',kind:'SEQUENCE'}]};
  const validation:any={id:'val_assessment_2',executionReadiness:'READY_FOR_AUTOMATION_DESIGN'};
  const freeze:any={id:'rvw_freeze_2',freezeKind:'AUTOMATION_DESIGN_HANDOFF',processRevisionId:process.id};
  const scopeFreeze:any={id:'rvw_scope_freeze_2',semanticFreezeRecordId:freeze.id,semanticScopeRef:'scope-reference',disposition:'ACCEPTED'};
  const capability:any={bindingAssessment:{result:'READY_FOR_EXECUTION_DESIGN'},designRevision:{id:'cap_design_1',processRevisionId:process.id},bindingRevision:{id:'cap_binding_1'},requirements:[{id:'cap_human_req',family:'HUMAN_INTERACTION'},{id:'cap_email_req',family:'COMMUNICATION'}],humanDesign:{id:'cap_human_design'},inputFields:[{id:'cap_recipient_field'}],inputMappings:[{id:'cap_recipient_mapping'}],selectionDecision:{id:'cap_selection'}};
  const execution=designReferenceExecutionPlan(process,validation,freeze,scopeFreeze,capability,at);
  const mapping=designReferenceTemporalMapping(execution,at);
  const policy=designReferenceRuntimePolicy(execution,mapping,at);
  const deployment=designReferenceDeployment(execution,mapping,policy,at);
  return {execution,mapping,policy,deployment};
}
function program(){const b=buildB6();return compileReferenceRuntimeProgram(b.execution,b.mapping,b.policy,b.deployment,{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'});}

test('compiled runtime program pins exact B6 revision lineage and Temporal SDK target',()=>{
  const b=buildB6();const p=compileReferenceRuntimeProgram(b.execution,b.mapping,b.policy,b.deployment,{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'});
  assert.equal(p.sdkTarget.version,'1.22.0');
  assert.equal(p.executionPlanRevisionRef,b.execution.revision.id);
  assert.equal(p.temporalMappingRevisionRef,b.mapping.revision.id);
  assert.equal(p.runtimePolicyRevisionRef,b.policy.revision.id);
  assert.equal(p.deploymentRevisionRef,b.deployment.revision.id);
});

test('compiled program consumes exact B6 Activity and Workflow material policy values',()=>{
  const p=program();
  assert.deepEqual(p.activity.retry,{initialIntervalMs:250,backoffCoefficient:2,maximumIntervalMs:1000,maximumAttempts:3,nonRetryableErrorTypes:['INVALID_REFERENCE_REQUEST']});
  assert.deepEqual(p.activity.timeout,{startToCloseMs:5000,scheduleToCloseMs:10000});
  assert.equal(p.activity.idempotency.keyContract,'sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)');
  assert.equal(p.activity.idempotency.enforcementRef,'REFERENCE_EMAIL_SINK_UNIQUE_EFFECT_STORE');
  assert.equal(p.workflow.workflowMaximumAttempts,1);
});

test('compiled program preserves desired deployment intent without fabricating actual Namespace or Worker realization',()=>{
  const p=program();
  assert.equal(p.deploymentIntent.environmentClass,'TEST');
  assert.equal(p.deploymentIntent.desiredNamespaceKey,'talos-reference');
  assert.equal(p.deploymentIntent.desiredTaskQueueKey,'talos-reference-main');
  assert.equal(p.deploymentIntent.desiredWorkerLogicalName,'talos-reference-worker');
  assert.equal(p.deploymentIntent.realizationState,'INCOMPLETE_ENVIRONMENT_REALIZATION');
  assert.equal(JSON.stringify(p).includes('actualNamespaceLocatorRef'),false);
});

test('compiled program is deterministic for one immutable B6 baseline',()=>{
  assert.equal(program().programDigest,program().programDigest);
});

test('Workflow input contains runtime recipient but keeps it outside compiled program truth',()=>{
  const p=program();
  const input:any={referenceRequestId:'ref-runtime-001',notificationRecipientEmail:'receiver@example.test',program:p};
  validateReferenceWorkflowInput(input);
  assert.equal(JSON.stringify(p).includes('receiver@example.test'),false);
});

test('review state waits, accepts one APPROVED Update, then rejects any finalized duplicate or contradiction',()=>{
  const initial=initialReferenceApprovalState();
  assert.equal(referencePostReviewAction(initial),'WAIT_FOR_REVIEW');
  const approved=applyReferenceReviewSubmission(initial,{outcome:'APPROVED',comment:'ok'});
  assert.equal(referencePostReviewAction(approved),'SEND_CONFIRMATION');
  assert.throws(()=>applyReferenceReviewSubmission(approved,{outcome:'APPROVED'}),(error:any)=>error instanceof ReferenceReviewUpdateRejected&&error.code==='REVIEW_ALREADY_FINALIZED');
  assert.throws(()=>applyReferenceReviewSubmission(approved,{outcome:'REJECTED'}),(error:any)=>error instanceof ReferenceReviewUpdateRejected&&error.code==='REVIEW_ALREADY_FINALIZED');
});

test('REJECTED Update deterministically selects rejected completion with no email action',()=>{
  const rejected=applyReferenceReviewSubmission(initialReferenceApprovalState(),{outcome:'REJECTED'});
  assert.equal(referencePostReviewAction(rejected),'COMPLETE_REJECTED');
});

test('provider failure translation stays inside the two B6 failure classes',()=>{
  assert.deepEqual(referenceTemporalFailureTranslation('TRANSIENT_REFERENCE_FAILURE').applicationFailureType,'TRANSIENT_REFERENCE_FAILURE');
  assert.equal(referenceTemporalFailureTranslation('TRANSIENT_REFERENCE_FAILURE').nonRetryable,false);
  assert.equal(referenceTemporalFailureTranslation('INVALID_REFERENCE_REQUEST').nonRetryable,true);
  assert.deepEqual(referenceTemporalFailureTranslation('IDEMPOTENCY_CONFLICT').applicationFailureType,'INVALID_REFERENCE_REQUEST');
  assert.equal(referenceTemporalFailureTranslation('IDEMPOTENCY_CONFLICT').nonRetryable,true);
  assert.deepEqual(referenceTemporalFailureTranslation('UNEXPECTED_REFERENCE_PROVIDER_FAILURE').applicationFailureType,'TRANSIENT_REFERENCE_FAILURE');
});

test('post-lock Worker imports only the authorized pinned Temporal TypeScript SDK surface',()=>{
  const dir=new URL('../workers/reference-temporal-worker/src/',import.meta.url);
  const allowed=new Set(['@temporalio/activity','@temporalio/client','@temporalio/common','@temporalio/worker','@temporalio/workflow']);
  let temporalImportCount=0;
  for(const file of readdirSync(dir).filter((name)=>name.endsWith('.ts'))){
    const text=readFileSync(new URL(file,dir),'utf8');
    for(const match of text.matchAll(/from\s+['"](@temporalio\/[^'"]+)['"]/g)){
      temporalImportCount+=1;
      assert.equal(allowed.has(match[1]),true,`${file} imported unauthorized Temporal package ${match[1]}`);
    }
  }
  assert.ok(temporalImportCount>0,'post-lock Worker must exercise the real Temporal SDK boundary');
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  for(const name of [...allowed,'@temporalio/testing']){
    const version=pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
    assert.equal(version,'1.22.0',`${name} must remain pinned to the certified Temporal SDK version`);
  }
});

test('runtime compiler rejects mismatched B6 lineage',()=>{
  const b=buildB6();const bad=structuredClone(b.policy);bad.revision.temporalMappingRevisionRef='tmp_wrong';
  assert.throws(()=>compileReferenceRuntimeProgram(b.execution,b.mapping,bad,b.deployment,{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'}),/upstream lineage mismatch/);
});
