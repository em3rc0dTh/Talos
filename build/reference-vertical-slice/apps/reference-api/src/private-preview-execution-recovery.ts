import path from 'node:path';
import { Client, Connection } from '@temporalio/client';
import { createOpaqueId } from '../../../packages/foundation/src/ids.ts';
import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import { SqliteDocumentStore } from '../../../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  recordAuthorizedWorkflowExecutionCompletion,
  type GenericWorkflowExecutionResult,
} from '../../../packages/deployment/src/generic-workflow-execution.ts';
import type {
  WorkflowExecutionApprovalRecord,
  WorkflowExecutionObservation,
  WorkflowExecutionStartRecord,
} from '../../../packages/deployment/src/types.ts';
import { persistOneAppWorkflowExecutionObservation } from '../../../packages/application/src/workflow-execution.ts';
import type { GenericWorkflowResult } from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';
import type { TalosPrivatePreviewTemporalTarget } from './private-preview-config.ts';

export const TALOS_EXECUTION_RECOVERY_VERSION = 'talos-product-execution-recovery-v0.2';

export interface TalosTemporalExecutionInspection {
  executionId: string;
  workflowIdRef: string;
  runIdRef: string;
  startedAt: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  completedAt?: string;
  evidenceRefs: string[];
}

export interface TalosTemporalExecutionInspector {
  inspect(executionId: string): Promise<TalosTemporalExecutionInspection>;
  close(): Promise<void>;
}

export interface TalosExecutionRecoveryItem {
  executionId: string;
  approvalId: string;
  state: 'RUNNING' | 'TERMINAL' | 'NOT_OBSERVED';
  start?: WorkflowExecutionStartRecord;
  observation?: WorkflowExecutionObservation;
  diagnostic?: string;
}

export interface TalosExecutionRecoveryResult {
  recoveryVersion: typeof TALOS_EXECUTION_RECOVERY_VERSION;
  items: TalosExecutionRecoveryItem[];
  activeExecutionIds: string[];
  terminalExecutionIds: string[];
}

export interface TalosProductExecutionRecovery {
  reconcileAll(): Promise<TalosExecutionRecoveryResult>;
  reconcileExecution(executionId: string): Promise<TalosExecutionRecoveryItem>;
  close(): Promise<void>;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function iso(value: unknown, label: string): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  throw new TypeError(`${label} is required from Temporal execution history`);
}

function temporalStatus(description: any): 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
  const raw = description?.status;
  const name = String(typeof raw === 'string' ? raw : raw?.name ?? raw ?? '').toUpperCase();
  if (name.includes('RUNNING')) return 'RUNNING';
  if (name.includes('COMPLETED')) return 'COMPLETED';
  if (name.includes('CANCELED') || name.includes('CANCELLED')) return 'CANCELLED';
  if (name.includes('FAILED') || name.includes('TERMINATED') || name.includes('TIMED_OUT')) return 'FAILED';
  throw new TypeError(`TALOS_RECOVERY_TEMPORAL_STATUS_UNSUPPORTED: ${name || 'UNKNOWN'}`);
}

function workflowResultEvidence(result: GenericWorkflowResult | undefined): string[] {
  if (!result) return [];
  return [
    `workflow-outcome:${result.outcome}`,
    ...result.visitedElementRefs.map((ref) => `visited-element:${ref}`),
    ...(result.humanSubmissions ?? []).flatMap((submission) => [
      `human-submission:${submission.submissionId}`,
      `human-outcome:${submission.outcomeCode}`,
      `human-element:${submission.executionElementRef}`,
    ]),
    ...result.capabilityResults.flatMap((item) => [
      ...(item.transportRef ? [`transport:${item.transportRef}`] : []),
      ...(item.externalEffectRef ? [`external-effect:${item.externalEffectRef}`] : []),
      ...(item.evidenceRefs ?? []),
    ]),
  ];
}

export function createTalosTemporalExecutionInspector(
  target: TalosPrivatePreviewTemporalTarget,
  options: { client?: Client } = {},
): TalosTemporalExecutionInspector {
  let connection: Connection | undefined;
  let client: Client | undefined = options.client;
  const ownsConnection = !options.client;
  let closed = false;

  async function ensureClient(): Promise<Client> {
    if (closed) throw new TypeError('TALOS_RECOVERY_INSPECTOR_CLOSED');
    if (!client) {
      connection = await Connection.connect({ address: target.address });
      client = new Client({ connection, namespace: target.namespace });
    }
    return client;
  }

  async function inspect(executionIdInput: string): Promise<TalosTemporalExecutionInspection> {
    const executionId = required(executionIdInput, 'executionId');
    const workflowIdRef = `talos-${executionId}`;
    const temporal = await ensureClient();
    const handle = temporal.workflow.getHandle(workflowIdRef);
    const description = await handle.describe();
    const runIdRef = required(String((description as any).runId ?? (handle as any).firstExecutionRunId ?? ''), 'Temporal runId');
    const startedAt = iso((description as any).startTime, 'Temporal startTime');
    const status = temporalStatus(description);
    const evidenceRefs = [
      `recovery:${TALOS_EXECUTION_RECOVERY_VERSION}`,
      `workflow-id:${workflowIdRef}`,
      `run-id:${runIdRef}`,
      `temporal-status:${status}`,
    ];
    if (status === 'RUNNING') {
      return { executionId, workflowIdRef, runIdRef, startedAt, status, evidenceRefs };
    }

    let result: GenericWorkflowResult | undefined;
    if (status === 'COMPLETED') {
      const observed = await handle.result();
      if (observed && typeof observed === 'object' && (observed as any).outcome === 'COMPLETED') result = observed as GenericWorkflowResult;
    }
    const completedAt = iso((description as any).closeTime, 'Temporal closeTime');
    return {
      executionId,
      workflowIdRef,
      runIdRef,
      startedAt,
      status,
      completedAt,
      evidenceRefs: [...evidenceRefs, ...workflowResultEvidence(result)],
    };
  }

  async function close(): Promise<void> {
    if (closed) return;
    closed = true;
    if (ownsConnection && connection) await connection.close();
    connection = undefined;
    client = undefined;
  }

  return { inspect, close };
}

function payload<T>(document: any, kind: string): T {
  if (!document || document.aggregateKind !== kind) throw new TypeError(`TALOS_RECOVERY_DURABLE_AUTHORITY_MISSING: ${kind}`);
  return document.payload as T;
}

function appendRecoveredStart(repo: SqliteDocumentStore, approval: WorkflowExecutionApprovalRecord, observed: TalosTemporalExecutionInspection): WorkflowExecutionStartRecord {
  if (approval.decision !== 'APPROVED' || approval.approvalKind !== 'WORKFLOW_EXECUTION_START' || approval.authorizedWorkflowStartCount !== 1 || !approval.createsWorkflowExecutionAuthority) {
    throw new TypeError('TALOS_RECOVERY_START_AUTHORITY_INVALID');
  }
  if (observed.executionId !== approval.executionId) throw new TypeError('TALOS_RECOVERY_EXECUTION_ID_MISMATCH');
  if (observed.workflowIdRef !== `talos-${approval.executionId}`) throw new TypeError('TALOS_RECOVERY_WORKFLOW_ID_MISMATCH');
  if (observed.startedAt < approval.approvedAt) throw new TypeError('TALOS_RECOVERY_START_PRECEDES_APPROVAL');

  const attempt = payload<any>(repo.get(approval.deploymentAttemptRef as any), 'DeploymentAttempt');
  if (attempt.id !== approval.deploymentAttemptRef || attempt.deploymentRevisionRef !== approval.deploymentRevisionRef || attempt.result !== 'SUCCEEDED' || !attempt.deploymentApprovalRef || !attempt.evidenceRefs?.length) {
    throw new TypeError('TALOS_RECOVERY_SUCCESSFUL_DEPLOYMENT_AUTHORITY_MISSING');
  }
  const revision = payload<any>(repo.get(approval.deploymentRevisionRef as any), 'DeploymentRevision');
  if (revision.id !== approval.deploymentRevisionRef) throw new TypeError('TALOS_RECOVERY_DEPLOYMENT_REVISION_MISMATCH');
  const workflowType = payload<any>(repo.get(approval.workflowTypeBindingRef as any), 'WorkflowTypeBinding');
  if (workflowType.id !== approval.workflowTypeBindingRef || workflowType.deploymentRevisionRef !== approval.deploymentRevisionRef) {
    throw new TypeError('TALOS_RECOVERY_WORKFLOW_TYPE_BINDING_MISMATCH');
  }
  if (observed.evidenceRefs.length === 0) throw new TypeError('TALOS_RECOVERY_RUNTIME_EVIDENCE_REQUIRED');

  const material = {
    workflowExecutionRef: `temporal:${observed.workflowIdRef}:${observed.runIdRef}`,
    workflowIdRef: observed.workflowIdRef,
    runIdRef: observed.runIdRef,
    startingDeploymentRevisionRef: approval.deploymentRevisionRef,
    workflowTypeBindingRef: approval.workflowTypeBindingRef,
    executionApprovalRef: approval.id,
    executionInputDigest: approval.executionInputDigest,
    startedAt: observed.startedAt,
    executionStatus: 'RUNNING' as const,
    evidenceRefs: [...observed.evidenceRefs, `recovered-authority:${approval.id}`],
  };
  const start: WorkflowExecutionStartRecord = {
    id: createOpaqueId('observation', `r1-09-recovered-workflow-start:${approval.id}:${observed.runIdRef}:${digestDeterministicJson(material)}`),
    ...material,
  };
  repo.append({
    id: start.id,
    aggregateKind: 'WorkflowExecutionStartRecord',
    schemaVersion: 'r1-09-workflow-recovery-v0.2',
    payload: start,
    createdAt: start.startedAt,
  });
  return start;
}

function latestByApproval<T extends { executionApprovalRef?: string }>(documents: any[], approvalId: string): T | undefined {
  return documents
    .map((document) => document.payload as T)
    .filter((item) => item.executionApprovalRef === approvalId)
    .at(-1);
}

function assertUniqueExecutionApprovals(approvals: WorkflowExecutionApprovalRecord[]): void {
  const byExecution = new Map<string, string[]>();
  for (const approval of approvals) {
    const ids = byExecution.get(approval.executionId) ?? [];
    ids.push(approval.id);
    byExecution.set(approval.executionId, ids);
  }
  for (const [executionId, approvalIds] of byExecution) {
    if (new Set(approvalIds).size > 1) {
      throw new TypeError(`TALOS_RECOVERY_DUPLICATE_EXECUTION_APPROVAL: ${executionId}`);
    }
  }
}

export function createTalosProductExecutionRecovery(
  runtimeDir: string,
  inspector: TalosTemporalExecutionInspector,
): TalosProductExecutionRecovery {
  const dbPath = path.join(runtimeDir, 'talos-one-app.sqlite');
  let closed = false;

  function openRepo(): SqliteDocumentStore {
    if (closed) throw new TypeError('TALOS_EXECUTION_RECOVERY_CLOSED');
    return new SqliteDocumentStore(dbPath);
  }

  async function reconcileApproval(approval: WorkflowExecutionApprovalRecord): Promise<TalosExecutionRecoveryItem> {
    const repo = openRepo();
    try {
      const existingObservation = latestByApproval<WorkflowExecutionObservation>(repo.listByKind('WorkflowExecutionObservation'), approval.id);
      if (existingObservation) {
        return { executionId: approval.executionId, approvalId: approval.id, state: 'TERMINAL', observation: existingObservation };
      }
      let observed: TalosTemporalExecutionInspection;
      try {
        observed = await inspector.inspect(approval.executionId);
      } catch (error) {
        return {
          executionId: approval.executionId,
          approvalId: approval.id,
          state: 'NOT_OBSERVED',
          diagnostic: error instanceof Error ? error.message : String(error),
        };
      }

      let start = latestByApproval<WorkflowExecutionStartRecord>(repo.listByKind('WorkflowExecutionStartRecord'), approval.id);
      if (start) {
        if (start.workflowIdRef !== observed.workflowIdRef || start.runIdRef !== observed.runIdRef || start.executionInputDigest !== approval.executionInputDigest) {
          throw new TypeError('TALOS_RECOVERY_PERSISTED_START_MISMATCH');
        }
      } else {
        start = appendRecoveredStart(repo, approval, observed);
      }

      if (observed.status === 'RUNNING') {
        return { executionId: approval.executionId, approvalId: approval.id, state: 'RUNNING', start };
      }
      if (!observed.completedAt) throw new TypeError('TALOS_RECOVERY_TERMINAL_CLOSE_TIME_REQUIRED');
      const terminalResult: GenericWorkflowExecutionResult = {
        startedAt: start.startedAt,
        completedAt: observed.completedAt,
        workflowExecutionRef: start.workflowExecutionRef,
        workflowIdRef: start.workflowIdRef,
        runIdRef: start.runIdRef,
        executionStatus: observed.status,
        evidenceRefs: [...observed.evidenceRefs, `recovered-start:${start.id}`],
      };
      const observation = recordAuthorizedWorkflowExecutionCompletion(start, terminalResult);
      persistOneAppWorkflowExecutionObservation(repo, observation);
      return { executionId: approval.executionId, approvalId: approval.id, state: 'TERMINAL', start, observation };
    } finally {
      repo.close();
    }
  }

  async function reconcileExecution(executionIdInput: string): Promise<TalosExecutionRecoveryItem> {
    const executionId = required(executionIdInput, 'executionId');
    const repo = openRepo();
    let approvals: WorkflowExecutionApprovalRecord[];
    try {
      approvals = repo.listByKind('WorkflowExecutionApprovalRecord')
        .map((document) => document.payload as WorkflowExecutionApprovalRecord)
        .filter((item) => item.executionId === executionId);
    } finally {
      repo.close();
    }
    if (approvals.length === 0) throw new TypeError(`TALOS_RECOVERY_EXECUTION_APPROVAL_NOT_FOUND: ${executionId}`);
    assertUniqueExecutionApprovals(approvals);
    return reconcileApproval(approvals[0]);
  }

  async function reconcileAll(): Promise<TalosExecutionRecoveryResult> {
    const repo = openRepo();
    let approvals: WorkflowExecutionApprovalRecord[];
    try {
      approvals = repo.listByKind('WorkflowExecutionApprovalRecord').map((document) => document.payload as WorkflowExecutionApprovalRecord);
    } finally {
      repo.close();
    }
    assertUniqueExecutionApprovals(approvals);
    const items: TalosExecutionRecoveryItem[] = [];
    for (const approval of approvals) items.push(await reconcileApproval(approval));
    return {
      recoveryVersion: TALOS_EXECUTION_RECOVERY_VERSION,
      items,
      activeExecutionIds: items.filter((item) => item.state === 'RUNNING').map((item) => item.executionId),
      terminalExecutionIds: items.filter((item) => item.state === 'TERMINAL').map((item) => item.executionId),
    };
  }

  async function close(): Promise<void> {
    if (closed) return;
    closed = true;
    await inspector.close();
  }

  return { reconcileAll, reconcileExecution, close };
}
