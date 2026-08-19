import {
  ReferenceEmailIdempotencyConflictError,
  ReferenceEmailInvalidRequestError,
  ReferenceEmailTransientFailureError,
  type ReferenceEmailSendRequest,
} from '../../../packages/reference-email-sink/src/index.ts';
import type {
  CompiledReferenceRuntimeProgram,
  ReferenceProviderFailureKind,
  ReferenceTemporalFailureTranslation,
  ReferenceWorkflowInput,
} from './contracts.ts';
import { referenceTemporalFailureTranslation } from './state-machine.ts';

export interface ReferenceTemporalActivityOptionsContract {
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

export function referenceActivityOptionsFromProgram(
  program: CompiledReferenceRuntimeProgram,
): ReferenceTemporalActivityOptionsContract {
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

export function referenceProviderRequestFromWorkflowInput(input: ReferenceWorkflowInput): ReferenceEmailSendRequest {
  return {
    referenceRequestId: input.referenceRequestId,
    capabilityUseOccurrenceId: input.program.activity.capabilityUseOccurrenceRef,
    to: input.notificationRecipientEmail,
  };
}

export function classifyReferenceProviderError(error: unknown): ReferenceProviderFailureKind {
  if (error instanceof ReferenceEmailTransientFailureError) return 'TRANSIENT_REFERENCE_FAILURE';
  if (error instanceof ReferenceEmailInvalidRequestError) return 'INVALID_REFERENCE_REQUEST';
  if (error instanceof ReferenceEmailIdempotencyConflictError) return 'IDEMPOTENCY_CONFLICT';
  return 'UNEXPECTED_REFERENCE_PROVIDER_FAILURE';
}

export function referenceFailureSpecFromProviderError(error: unknown): ReferenceTemporalFailureTranslation {
  return referenceTemporalFailureTranslation(classifyReferenceProviderError(error));
}
