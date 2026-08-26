import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type {
  DeploymentAttempt,
  ReferenceDeploymentBundle,
  WorkflowExecutionApprovalRecord,
  WorkflowExecutionObservation,
  WorkflowExecutionStartRecord,
} from './types.ts';

const dep=(seed:string)=>createOpaqueId('deployment',seed);
const obs=(seed:string)=>createOpaqueId('observation',seed);

export interface GenericWorkflowExecutionApprovalInput {
  workflowTypeBindingRef:string;
  executionId:string;
  facts:Record<string,unknown>;
  capabilityInputs?:Record<string,unknown>;
  authorityRef:string;
  approvedBy:string;
  rationale:string;
  approvedAt:string;
}

export interface GenericWorkflowExecutionStartResult {
  startedAt:string;
  workflowExecutionRef:string;
  workflowIdRef:string;
  runIdRef:string;
  evidenceRefs:string[];
}

export interface GenericWorkflowExecutionResult extends GenericWorkflowExecutionStartResult {
  completedAt:string;
  executionStatus:'COMPLETED'|'FAILED'|'CANCELLED';
}

function required(value:string,label:string):string{
  const normalized=value.trim();
  if(!normalized)throw new TypeError(`${label} is required`);
  return normalized;
}

export function workflowExecutionInputDigest(input:{executionId:string;facts:Record<string,unknown>;capabilityInputs?:Record<string,unknown>}):string{
  return digestDeterministicJson({
    executionId:required(input.executionId,'executionId'),
    facts:input.facts,
    capabilityInputs:input.capabilityInputs??{},
  });
}

function assertSuccessfulDeployment(
  deployment:ReferenceDeploymentBundle,
  attempt:DeploymentAttempt,
):void{
  if(deployment.assessment.readiness!=='READY_FOR_DEPLOYMENT_ATTEMPT')throw new TypeError('workflow execution approval requires an exact realized deployment');
  if(attempt.deploymentRevisionRef!==deployment.revision.id)throw new TypeError('workflow execution approval must pin the exact deployed DeploymentRevision');
  if(attempt.result!=='SUCCEEDED')throw new TypeError('workflow execution approval requires a successful DeploymentAttempt');
  if(!attempt.deploymentApprovalRef)throw new TypeError('workflow execution approval requires deployment-attempt authority lineage');
  if(!attempt.evidenceRefs?.length)throw new TypeError('workflow execution approval requires concrete deployment-attempt evidence');
  if(deployment.workflowTypeBindings.length===0)throw new TypeError('workflow execution approval requires a realized Workflow type binding');
}

function assertStartAuthority(
  deployment:ReferenceDeploymentBundle,
  attempt:DeploymentAttempt,
  approval:WorkflowExecutionApprovalRecord,
  input:{executionId:string;facts:Record<string,unknown>;capabilityInputs?:Record<string,unknown>},
):string{
  assertSuccessfulDeployment(deployment,attempt);
  if(approval.deploymentRevisionRef!==deployment.revision.id||approval.deploymentAttemptRef!==attempt.id){
    throw new TypeError('workflow execution approval must pin the exact successful deployment attempt');
  }
  if(approval.decision!=='APPROVED'||approval.approvalKind!=='WORKFLOW_EXECUTION_START'||approval.authorizedWorkflowStartCount!==1||!approval.createsWorkflowExecutionAuthority){
    throw new TypeError('workflow start requires explicit one-start execution authority');
  }
  if(!deployment.workflowTypeBindings.some(binding=>binding.id===approval.workflowTypeBindingRef)){
    throw new TypeError('workflow execution approval references a stale WorkflowTypeBinding');
  }
  const executionId=required(input.executionId,'executionId');
  if(executionId!==approval.executionId)throw new TypeError('workflow start must use the exact approved executionId');
  const executionInputDigest=workflowExecutionInputDigest({executionId,facts:input.facts,capabilityInputs:input.capabilityInputs});
  if(executionInputDigest!==approval.executionInputDigest)throw new TypeError('workflow start input must match the exact approved execution input digest');
  return executionInputDigest;
}

export function approveGenericWorkflowExecution(
  deployment:ReferenceDeploymentBundle,
  attempt:DeploymentAttempt,
  input:GenericWorkflowExecutionApprovalInput,
):WorkflowExecutionApprovalRecord{
  assertSuccessfulDeployment(deployment,attempt);
  const workflowTypeBindingRef=required(input.workflowTypeBindingRef,'workflowTypeBindingRef');
  if(!deployment.workflowTypeBindings.some(binding=>binding.id===workflowTypeBindingRef)){
    throw new TypeError('workflow execution approval must pin an exact realized WorkflowTypeBinding');
  }
  const executionId=required(input.executionId,'executionId');
  const authorityRef=required(input.authorityRef,'authorityRef');
  const approvedBy=required(input.approvedBy,'approvedBy');
  const rationale=required(input.rationale,'rationale');
  const approvedAt=required(input.approvedAt,'approvedAt');
  const executionInputDigest=workflowExecutionInputDigest({executionId,facts:input.facts,capabilityInputs:input.capabilityInputs});
  const material={
    deploymentRevisionRef:deployment.revision.id,
    deploymentAttemptRef:attempt.id,
    workflowTypeBindingRef:workflowTypeBindingRef as any,
    executionId,
    executionInputDigest,
    approvalKind:'WORKFLOW_EXECUTION_START' as const,
    decision:'APPROVED' as const,
    authorityRef,
    approvedBy,
    rationale,
    authorizedWorkflowStartCount:1 as const,
    createsWorkflowExecutionAuthority:true as const,
    approvedAt,
  };
  return{id:dep(`workflow-execution-approval:${deployment.revision.id}:${attempt.id}:${digestDeterministicJson(material)}`),...material};
}

/** Record only the one authorized runtime start. Completion is a later immutable observation. */
export function recordAuthorizedWorkflowExecutionStart(
  deployment:ReferenceDeploymentBundle,
  attempt:DeploymentAttempt,
  approval:WorkflowExecutionApprovalRecord,
  input:{executionId:string;facts:Record<string,unknown>;capabilityInputs?:Record<string,unknown>},
  result:GenericWorkflowExecutionStartResult,
):WorkflowExecutionStartRecord{
  const executionInputDigest=assertStartAuthority(deployment,attempt,approval,input);
  const startedAt=required(result.startedAt,'startedAt');
  if(startedAt<approval.approvedAt)throw new TypeError('workflow execution cannot begin before explicit execution approval');
  const workflowExecutionRef=required(result.workflowExecutionRef,'workflowExecutionRef');
  const workflowIdRef=required(result.workflowIdRef,'workflowIdRef');
  const runIdRef=required(result.runIdRef,'runIdRef');
  if(result.evidenceRefs.length===0)throw new TypeError('workflow execution start requires concrete runtime evidence refs');
  for(const ref of result.evidenceRefs)required(ref,'evidenceRef');
  const material={
    workflowExecutionRef,
    workflowIdRef,
    runIdRef,
    startingDeploymentRevisionRef:deployment.revision.id,
    workflowTypeBindingRef:approval.workflowTypeBindingRef,
    executionApprovalRef:approval.id,
    executionInputDigest,
    startedAt,
    executionStatus:'RUNNING' as const,
    evidenceRefs:[...result.evidenceRefs],
  };
  return{id:obs(`workflow-execution-start:${approval.id}:${runIdRef}:${digestDeterministicJson(material)}`),...material};
}

/** Close an already-persisted runtime start without creating a second start authority event. */
export function recordAuthorizedWorkflowExecutionCompletion(
  start:WorkflowExecutionStartRecord,
  result:GenericWorkflowExecutionResult,
):WorkflowExecutionObservation{
  if(result.startedAt!==start.startedAt)throw new TypeError('workflow completion must preserve the exact persisted startedAt');
  if(result.workflowExecutionRef!==start.workflowExecutionRef||result.workflowIdRef!==start.workflowIdRef||result.runIdRef!==start.runIdRef){
    throw new TypeError('workflow completion must pin the exact persisted runtime execution');
  }
  const completedAt=required(result.completedAt,'completedAt');
  if(completedAt<start.startedAt)throw new TypeError('workflow completion cannot precede persisted start');
  if(result.evidenceRefs.length===0)throw new TypeError('workflow execution observation requires concrete runtime evidence refs');
  for(const ref of result.evidenceRefs)required(ref,'evidenceRef');
  const material={
    workflowExecutionRef:start.workflowExecutionRef,
    workflowIdRef:start.workflowIdRef,
    runIdRef:start.runIdRef,
    startingDeploymentRevisionRef:start.startingDeploymentRevisionRef,
    workflowTypeBindingRef:start.workflowTypeBindingRef,
    executionApprovalRef:start.executionApprovalRef,
    executionInputDigest:start.executionInputDigest,
    runtimeSegmentObservationRefs:[start.id],
    startedAt:start.startedAt,
    closedAt:completedAt,
    executionStatus:result.executionStatus,
    evidenceRefs:[...result.evidenceRefs],
  };
  return{id:obs(`workflow-execution-completion:${start.id}:${digestDeterministicJson(material)}`),...material};
}

/** Backward-compatible atomic terminal path used by existing non-human/reference tests. */
export function recordAuthorizedWorkflowExecution(
  deployment:ReferenceDeploymentBundle,
  attempt:DeploymentAttempt,
  approval:WorkflowExecutionApprovalRecord,
  input:{executionId:string;facts:Record<string,unknown>;capabilityInputs?:Record<string,unknown>},
  result:GenericWorkflowExecutionResult,
):WorkflowExecutionObservation{
  const start=recordAuthorizedWorkflowExecutionStart(deployment,attempt,approval,input,result);
  const completion=recordAuthorizedWorkflowExecutionCompletion(start,result);
  // Preserve the historical atomic observation shape: no separate persisted start exists in this path.
  return{...completion,runtimeSegmentObservationRefs:[]};
}
