import type {
  CompiledReferenceRuntimeProgram,
  ReferenceWorkflowInput,
} from './contracts.ts';

export interface SendReferenceConfirmationActivityInput {
  referenceRequestId: string;
  capabilityUseOccurrenceId: string;
  to: string;
}

export interface SendReferenceConfirmationActivityResult {
  outcome: 'MESSAGE_ACCEPTED';
  idempotencyKey: string;
  effectStatus: 'INSERTED' | 'DUPLICATE_IDENTICAL';
}

export interface ReferenceActivities {
  sendReferenceConfirmation(
    input: SendReferenceConfirmationActivityInput,
  ): Promise<SendReferenceConfirmationActivityResult>;
}

export interface ReferenceTemporalActivityOptions {
  startToCloseTimeout: number;
  scheduleToCloseTimeout: number;
  retry: {
    initialInterval: number;
    backoffCoefficient: number;
    maximumInterval: number;
    maximumAttempts: number;
    nonRetryableErrorTypes: string[];
  };
}

export function referenceTemporalActivityOptionsFromProgram(
  program: CompiledReferenceRuntimeProgram,
): ReferenceTemporalActivityOptions {
  return {
    startToCloseTimeout: program.activity.timeout.startToCloseMs,
    scheduleToCloseTimeout: program.activity.timeout.scheduleToCloseMs,
    retry: {
      initialInterval: program.activity.retry.initialIntervalMs,
      backoffCoefficient: program.activity.retry.backoffCoefficient,
      maximumInterval: program.activity.retry.maximumIntervalMs,
      maximumAttempts: program.activity.retry.maximumAttempts,
      nonRetryableErrorTypes: [...program.activity.retry.nonRetryableErrorTypes],
    },
  };
}

export function referenceActivityInputFromWorkflowInput(
  input: ReferenceWorkflowInput,
): SendReferenceConfirmationActivityInput {
  return {
    referenceRequestId: input.referenceRequestId,
    capabilityUseOccurrenceId: input.program.activity.capabilityUseOccurrenceRef,
    to: input.notificationRecipientEmail,
  };
}
