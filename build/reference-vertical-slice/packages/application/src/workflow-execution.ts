import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import { workflowExecutionInputDigest } from '../../deployment/src/generic-workflow-execution.ts';
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

export function assertOneAppWorkflowExecutionInputApproved(
  approval:WorkflowExecutionApprovalRecord,
  input:{executionId:string;facts:Record<string,unknown>;capabilityInputs?:Record<string,unknown>},
):void{
  if(input.executionId!==approval.executionId)throw new TypeError('workflow start must use the exact approved executionId');
  const digest=workflowExecutionInputDigest(input);
  if(digest!==approval.executionInputDigest)throw new TypeError('workflow start input must match the exact approved execution input digest');
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
