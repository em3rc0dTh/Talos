import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { WorkflowExecutionApprovalRecord, WorkflowExecutionObservation } from '../../deployment/src/types.ts';

function append(repo:ImmutableDocumentRepository,aggregateKind:string,payload:any,createdAt:string):void{
  repo.append({
    id:payload.id,
    aggregateKind,
    schemaVersion:'i9-07-workflow-execution-v0.1',
    payload,
    createdAt,
  });
}

export function persistOneAppWorkflowExecutionApproval(
  repo:ImmutableDocumentRepository,
  approval:WorkflowExecutionApprovalRecord,
):void{
  append(repo,'WorkflowExecutionApprovalRecord',approval,approval.approvedAt);
}

export function persistOneAppWorkflowExecutionObservation(
  repo:ImmutableDocumentRepository,
  observation:WorkflowExecutionObservation,
):void{
  append(repo,'WorkflowExecutionObservation',observation,observation.closedAt??observation.startedAt);
}
