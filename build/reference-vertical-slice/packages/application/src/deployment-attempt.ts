import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { DeploymentApprovalRecord, DeploymentAttempt } from '../../deployment/src/types.ts';

function append(repo:ImmutableDocumentRepository,aggregateKind:string,payload:any,createdAt:string):void{
  repo.append({
    id:payload.id,
    aggregateKind,
    schemaVersion:'i9-06-deployment-approval-attempt-v0.1',
    payload,
    createdAt,
  });
}

export function persistOneAppDeploymentApproval(
  repo:ImmutableDocumentRepository,
  approval:DeploymentApprovalRecord,
):void{
  append(repo,'DeploymentApprovalRecord',approval,approval.approvedAt);
}

export function persistOneAppDeploymentAttempt(
  repo:ImmutableDocumentRepository,
  attempt:DeploymentAttempt,
):void{
  append(repo,'DeploymentAttempt',attempt,attempt.completedAt??attempt.startedAt);
}
