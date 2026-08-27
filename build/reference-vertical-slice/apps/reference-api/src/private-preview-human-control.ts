import { Client, Connection } from '@temporalio/client';
import type { TalosPrivatePreviewTemporalTarget } from './private-preview-config.ts';
import {
  GENERIC_HUMAN_SIGNAL_NAME,
  GENERIC_HUMAN_UPDATE_NAME,
  GENERIC_RUNTIME_STATE_QUERY_NAME,
  type GenericHumanOutcomeSubmission,
  type GenericHumanSubmissionReceipt,
  type GenericWorkflowRuntimeState,
} from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';

export interface TalosProductHumanRuntimeControlOptions {
  /** Integration-test seam. Production callers omit this and use target.address. */
  client?: Client;
  signalReceiptTimeoutMs?: number;
  signalReceiptPollMs?: number;
}

export interface TalosProductHumanRuntimeState {
  workflowIdRef: string;
  runtimeState: GenericWorkflowRuntimeState;
}

export interface TalosProductHumanOutcomeInput {
  executionId: string;
  submissionId: string;
  executionElementRef: string;
  outcomeCode: string;
  actorRef: string;
  authorityRef: string;
  rationale?: string;
}

export interface TalosProductHumanRuntimeControl {
  getState(executionId: string): Promise<TalosProductHumanRuntimeState>;
  submitOutcome(input: TalosProductHumanOutcomeInput): Promise<{
    workflowIdRef: string;
    receipt: GenericHumanSubmissionReceipt;
    runtimeState: GenericWorkflowRuntimeState;
  }>;
  close(): Promise<void>;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function workflowIdForExecution(executionId: string): string {
  return `talos-${required(executionId, 'executionId')}`;
}

function cloneState(state: GenericWorkflowRuntimeState): GenericWorkflowRuntimeState {
  return {
    executionId: state.executionId,
    status: state.status,
    ...(state.currentElementRef ? { currentElementRef: state.currentElementRef } : {}),
    ...(state.pendingHumanTask ? {
      pendingHumanTask: {
        ...state.pendingHumanTask,
        participantRoleRefs: [...state.pendingHumanTask.participantRoleRefs],
        outcomes: state.pendingHumanTask.outcomes.map((item) => ({ ...item })),
      },
    } : {}),
    acceptedHumanSubmissions: state.acceptedHumanSubmissions.map((item) => ({ ...item })),
  };
}

/**
 * Server-side control surface for a Workflow that is already running under an
 * explicitly consumed one-start approval. It never starts Workflows and never
 * chooses business outcomes. The Temporal Workflow remains the final validator
 * of active element, approved message primitive and frozen allowed outcomes.
 */
export function createTalosProductHumanRuntimeControl(
  target: TalosPrivatePreviewTemporalTarget,
  options: TalosProductHumanRuntimeControlOptions = {},
): TalosProductHumanRuntimeControl {
  let connection: Connection | undefined;
  let client: Client | undefined = options.client;
  const ownsConnection = !options.client;
  let closing = false;

  async function ensureClient(): Promise<Client> {
    if (closing) throw new TypeError('TALOS_HUMAN_CONTROL_CLOSING');
    if (!client) {
      connection = await Connection.connect({ address: target.address });
      client = new Client({ connection, namespace: target.namespace });
    }
    return client;
  }

  async function getState(executionId: string): Promise<TalosProductHumanRuntimeState> {
    const normalizedExecutionId = required(executionId, 'executionId');
    const workflowIdRef = workflowIdForExecution(normalizedExecutionId);
    const temporal = await ensureClient();
    const handle = temporal.workflow.getHandle(workflowIdRef);
    const state = await (handle as any).query(GENERIC_RUNTIME_STATE_QUERY_NAME) as GenericWorkflowRuntimeState;
    if (!state || state.executionId !== normalizedExecutionId) {
      throw new TypeError('TALOS_HUMAN_CONTROL_STATE_MISMATCH: queried Workflow state does not match executionId');
    }
    return { workflowIdRef, runtimeState: cloneState(state) };
  }

  async function submitOutcome(input: TalosProductHumanOutcomeInput): Promise<{
    workflowIdRef: string;
    receipt: GenericHumanSubmissionReceipt;
    runtimeState: GenericWorkflowRuntimeState;
  }> {
    const executionId = required(input.executionId, 'executionId');
    const submission: GenericHumanOutcomeSubmission = {
      submissionId: required(input.submissionId, 'submissionId'),
      executionElementRef: required(input.executionElementRef, 'executionElementRef'),
      outcomeCode: required(input.outcomeCode, 'outcomeCode'),
      actorRef: required(input.actorRef, 'actorRef'),
      authorityRef: required(input.authorityRef, 'authorityRef'),
      ...(input.rationale?.trim() ? { rationale: input.rationale.trim() } : {}),
    };

    const before = await getState(executionId);
    const pending = before.runtimeState.pendingHumanTask;
    if (!pending) throw new TypeError('TALOS_HUMAN_CONTROL_NO_PENDING_TASK: Workflow is not waiting for human input');
    if (pending.executionElementRef !== submission.executionElementRef) {
      throw new TypeError('TALOS_HUMAN_CONTROL_ELEMENT_MISMATCH: submission does not target the active human task');
    }
    if (!pending.outcomes.some((item) => item.outcomeCode === submission.outcomeCode)) {
      throw new TypeError('TALOS_HUMAN_CONTROL_OUTCOME_NOT_ALLOWED: outcome is outside the frozen human design');
    }

    const temporal = await ensureClient();
    const handle = temporal.workflow.getHandle(before.workflowIdRef);
    let receipt: GenericHumanSubmissionReceipt | undefined;
    if (pending.messageKind === 'UPDATE_HANDLER') {
      receipt = await (handle as any).executeUpdate(GENERIC_HUMAN_UPDATE_NAME, { args: [submission] }) as GenericHumanSubmissionReceipt;
    } else {
      await (handle as any).signal(GENERIC_HUMAN_SIGNAL_NAME, submission);
      const timeoutMs = options.signalReceiptTimeoutMs ?? 5_000;
      const pollMs = options.signalReceiptPollMs ?? 50;
      const deadline = Date.now() + timeoutMs;
      while (Date.now() <= deadline) {
        const current = await getState(executionId);
        receipt = current.runtimeState.acceptedHumanSubmissions.find((item) => item.submissionId === submission.submissionId);
        if (receipt) break;
        await new Promise((resolve) => setTimeout(resolve, pollMs));
      }
      if (!receipt) {
        throw new TypeError('TALOS_HUMAN_CONTROL_SIGNAL_RECEIPT_TIMEOUT: Signal was sent but no accepted frozen-outcome receipt was observed');
      }
    }

    if (!receipt.accepted || receipt.submissionId !== submission.submissionId) {
      throw new TypeError('TALOS_HUMAN_CONTROL_RECEIPT_INVALID: Temporal returned an unexpected human submission receipt');
    }
    const after = await getState(executionId);
    return { workflowIdRef: after.workflowIdRef, receipt: { ...receipt }, runtimeState: after.runtimeState };
  }

  async function close(): Promise<void> {
    if (closing) return;
    closing = true;
    if (ownsConnection && connection) await connection.close();
    connection = undefined;
    client = undefined;
  }

  return { getState, submitOutcome, close };
}
