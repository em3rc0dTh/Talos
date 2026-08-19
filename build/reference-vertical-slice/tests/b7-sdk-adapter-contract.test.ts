import test from 'node:test';
import assert from 'node:assert/strict';
import { designReferenceExecutionPlan } from '../packages/execution/src/reference-plan.ts';
import { designReferenceTemporalMapping } from '../packages/temporal-design/src/reference-mapping.ts';
import { designReferenceRuntimePolicy } from '../packages/runtime-policy/src/reference-policy.ts';
import { designReferenceDeployment } from '../packages/deployment/src/reference-deployment.ts';
import {
  compileReferenceRuntimeProgram,
  referenceActivityOptionsFromProgram,
  referenceProviderRequestFromWorkflowInput,
  referenceFailureSpecFromProviderError,
} from '../workers/reference-temporal-worker/src/index.ts';
import {
  ReferenceEmailTransientFailureError,
  ReferenceEmailInvalidRequestError,
  ReferenceEmailIdempotencyConflictError,
} from '../packages/reference-email-sink/src/index.ts';

const at='2026-08-19T20:45:00.000Z';
function program(){
  const process:any={id:'prc_process_revision_2',processDefinitionId:'prc_process_definition',nodes:[{id:'prc_start',name:'Request submitted'},{id:'prc_review',name:'Review request'},{id:'prc_decision',name:'Approved?'},{id:'prc_email',name:'Send confirmation email'},{id:'prc_completed',name:'Completed'},{id:'prc_rejected',name:'Rejected'}],edges:[{id:'prc_e1',sourceNodeId:'prc_start',targetNodeId:'prc_review',kind:'SEQUENCE'},{id:'prc_e2',sourceNodeId:'prc_review',targetNodeId:'prc_decision',kind:'SEQUENCE'},{id:'prc_e3',sourceNodeId:'prc_decision',targetNodeId:'prc_email',kind:'CONDITIONAL'},{id:'prc_e4',sourceNodeId:'prc_decision',targetNodeId:'prc_rejected',kind:'DEFAULT'},{id:'prc_e5',sourceNodeId:'prc_email',targetNodeId:'prc_completed',kind:'SEQUENCE'}]};
  const validation:any={id:'val_assessment_2',executionReadiness:'READY_FOR_AUTOMATION_DESIGN'};
  const freeze:any={id:'rvw_freeze_2',freezeKind:'AUTOMATION_DESIGN_HANDOFF',processRevisionId:process.id};
  const scopeFreeze:any={id:'rvw_scope_freeze_2',semanticFreezeRecordId:freeze.id,semanticScopeRef:'scope-reference',disposition:'ACCEPTED'};
  const capability:any={bindingAssessment:{result:'READY_FOR_EXECUTION_DESIGN'},designRevision:{id:'cap_design_1',processRevisionId:process.id},bindingRevision:{id:'cap_binding_1'},requirements:[{id:'cap_human_req',family:'HUMAN_INTERACTION'},{id:'cap_email_req',family:'COMMUNICATION'}],humanDesign:{id:'cap_human_design'},inputFields:[{id:'cap_recipient_field'}],inputMappings:[{id:'cap_recipient_mapping'}],selectionDecision:{id:'cap_selection'}};
  const execution=designReferenceExecutionPlan(process,validation,freeze,scopeFreeze,capability,at);
  const mapping=designReferenceTemporalMapping(execution,at);
  const policy=designReferenceRuntimePolicy(execution,mapping,at);
  const deployment=designReferenceDeployment(execution,mapping,policy,at);
  return compileReferenceRuntimeProgram(execution,mapping,policy,deployment,{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'});
}

test('pre-SDK Activity options assembler matches Temporal 1.22 Activity/Retry field contract',()=>{
  assert.deepEqual(referenceActivityOptionsFromProgram(program()),{
    startToCloseTimeout:5000,
    scheduleToCloseTimeout:10000,
    retry:{initialInterval:250,backoffCoefficient:2,maximumInterval:1000,maximumAttempts:3,nonRetryableErrorTypes:['INVALID_REFERENCE_REQUEST']},
  });
});

test('future Activity provider request contains only execution context plus mapped destination',()=>{
  const p=program();
  assert.deepEqual(
    referenceProviderRequestFromWorkflowInput({referenceRequestId:'ref-runtime-001',notificationRecipientEmail:'receiver@example.test',program:p}),
    {referenceRequestId:'ref-runtime-001',capabilityUseOccurrenceId:p.activity.capabilityUseOccurrenceRef,to:'receiver@example.test'},
  );
});

test('concrete provider exceptions map deterministically to frozen B6 failure specs',()=>{
  assert.equal(referenceFailureSpecFromProviderError(new ReferenceEmailTransientFailureError(1)).applicationFailureType,'TRANSIENT_REFERENCE_FAILURE');
  assert.equal(referenceFailureSpecFromProviderError(new ReferenceEmailTransientFailureError(1)).nonRetryable,false);
  assert.equal(referenceFailureSpecFromProviderError(new ReferenceEmailInvalidRequestError('bad')).nonRetryable,true);
  assert.equal(referenceFailureSpecFromProviderError(new ReferenceEmailIdempotencyConflictError('k')).nonRetryable,true);
});
