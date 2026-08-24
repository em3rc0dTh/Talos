import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type {
  DeploymentApprovalRecord,
  DeploymentAttempt,
  ReferenceDeploymentBundle,
} from './types.ts';

const dep=(seed:string)=>createOpaqueId('deployment',seed);

export interface GenericDeploymentApprovalInput {
  authorityRef:string;
  approvedBy:string;
  rationale:string;
  approvedAt:string;
}

export interface GenericDeploymentAttemptResult {
  startedAt:string;
  completedAt:string;
  result:'SUCCEEDED'|'PARTIAL'|'FAILED'|'CANCELLED';
  diagnosticRefs:string[];
  evidenceRefs:string[];
  orchestratorRef:string;
}

function required(value:string,label:string):string{
  const normalized=value.trim();
  if(!normalized)throw new TypeError(`${label} is required`);
  return normalized;
}

function assertRealizedDeployment(deployment:ReferenceDeploymentBundle):void{
  if(deployment.assessment.readiness!=='READY_FOR_DEPLOYMENT_ATTEMPT'){
    throw new TypeError('deployment approval requires READY_FOR_DEPLOYMENT_ATTEMPT environment realization');
  }
  if(deployment.namespaceResolution.resolutionState!=='RESOLVED')throw new TypeError('deployment approval requires a resolved Temporal namespace');
  if(deployment.namingIntent.bindingState!=='REALIZED')throw new TypeError('deployment approval requires realized deployment naming');
  if(deployment.environmentRealizations.length===0)throw new TypeError('deployment approval requires exact environment binding realization lineage');
  if(deployment.taskQueueBindings.length===0||deployment.workflowTypeBindings.length===0||deployment.activityTypeBindings.length===0||deployment.workerArtifactBindings.length===0){
    throw new TypeError('deployment approval requires concrete Task Queue, Workflow, Activity and Worker artifact bindings');
  }
  if(deployment.requirements.some(item=>item.state!=='RESOLVED'))throw new TypeError('deployment approval requires every material deployment requirement resolved');
  if(deployment.attempts.length>0)throw new TypeError('deployment approval cannot authorize a new first attempt after an attempt already exists');
}

export function approveGenericDeploymentAttempt(
  deployment:ReferenceDeploymentBundle,
  input:GenericDeploymentApprovalInput,
):DeploymentApprovalRecord{
  assertRealizedDeployment(deployment);
  const authorityRef=required(input.authorityRef,'authorityRef');
  const approvedBy=required(input.approvedBy,'approvedBy');
  const rationale=required(input.rationale,'rationale');
  const approvedAt=required(input.approvedAt,'approvedAt');
  const material={
    deploymentRevisionRef:deployment.revision.id,
    approvalKind:'DEPLOYMENT_ATTEMPT' as const,
    decision:'APPROVED' as const,
    authorityRef,
    approvedBy,
    rationale,
    authorizedAttemptCount:1 as const,
    createsDeploymentAttemptAuthority:true as const,
    createsExecutionAuthority:false as const,
    approvedAt,
  };
  return{id:dep(`deployment-approval:${deployment.revision.id}:${digestDeterministicJson(material)}`),...material};
}

export function recordAuthorizedDeploymentAttempt(
  deployment:ReferenceDeploymentBundle,
  approval:DeploymentApprovalRecord,
  result:GenericDeploymentAttemptResult,
):DeploymentAttempt{
  assertRealizedDeployment(deployment);
  if(approval.deploymentRevisionRef!==deployment.revision.id)throw new TypeError('deployment attempt approval must pin the exact realized DeploymentRevision');
  if(approval.decision!=='APPROVED'||approval.approvalKind!=='DEPLOYMENT_ATTEMPT'||approval.authorizedAttemptCount!==1||!approval.createsDeploymentAttemptAuthority){
    throw new TypeError('deployment attempt requires explicit one-attempt approval authority');
  }
  if(approval.createsExecutionAuthority)throw new TypeError('deployment attempt approval may not create business-workflow execution authority');
  const orchestratorRef=required(result.orchestratorRef,'orchestratorRef');
  const startedAt=required(result.startedAt,'startedAt');
  const completedAt=required(result.completedAt,'completedAt');
  if(result.result==='SUCCEEDED'&&result.evidenceRefs.length===0)throw new TypeError('successful deployment attempt requires concrete evidence refs');
  for(const ref of result.evidenceRefs)required(ref,'evidenceRef');
  for(const ref of result.diagnosticRefs)required(ref,'diagnosticRef');
  const material={
    deploymentRevisionRef:deployment.revision.id,
    targetProfileRef:deployment.targetProfile.id,
    deploymentApprovalRef:approval.id,
    attemptNumber:1,
    startedAt,
    completedAt,
    result:result.result,
    diagnosticRefs:[...result.diagnosticRefs],
    evidenceRefs:[...result.evidenceRefs],
    orchestratorRef,
  };
  return{id:dep(`deployment-attempt:${deployment.revision.id}:${approval.id}:${digestDeterministicJson(material)}`),...material};
}
