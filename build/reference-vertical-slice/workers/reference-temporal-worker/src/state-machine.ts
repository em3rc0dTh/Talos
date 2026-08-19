import type {
  ReferenceApprovalState,
  ReferencePostReviewAction,
  ReferenceReviewSubmission,
  ReferenceTemporalFailureTranslation,
  ReferenceProviderFailureKind,
  ReferenceWorkflowInput,
} from './contracts.ts';

export class ReferenceReviewUpdateRejected extends Error {
  readonly code: 'INVALID_REVIEW_SUBMISSION' | 'REVIEW_ALREADY_FINALIZED';
  constructor(code: 'INVALID_REVIEW_SUBMISSION' | 'REVIEW_ALREADY_FINALIZED', message: string) {
    super(message);
    this.name = 'ReferenceReviewUpdateRejected';
    this.code = code;
  }
}

export function validateReferenceWorkflowInput(input: unknown): asserts input is ReferenceWorkflowInput {
  if (!input || typeof input !== 'object') throw new TypeError('reference Workflow input must be an object');
  const value = input as Record<string, unknown>;
  if (typeof value.referenceRequestId !== 'string' || !value.referenceRequestId.trim()) {
    throw new TypeError('referenceRequestId is required');
  }
  if (typeof value.notificationRecipientEmail !== 'string' || !value.notificationRecipientEmail.includes('@')) {
    throw new TypeError('notificationRecipientEmail must be a valid reference email value');
  }
  if (!value.program || typeof value.program !== 'object') throw new TypeError('compiled runtime program is required');
}

export function initialReferenceApprovalState(): ReferenceApprovalState {
  return { reviewOutcome: 'PENDING' };
}

export function validateReferenceReviewSubmission(state: ReferenceApprovalState, submission: unknown): asserts submission is ReferenceReviewSubmission {
  if (state.reviewOutcome !== 'PENDING') {
    throw new ReferenceReviewUpdateRejected('REVIEW_ALREADY_FINALIZED', 'review outcome is already finalized');
  }
  if (!submission || typeof submission !== 'object') {
    throw new ReferenceReviewUpdateRejected('INVALID_REVIEW_SUBMISSION', 'review submission must be an object');
  }
  const value = submission as Record<string, unknown>;
  if (value.outcome !== 'APPROVED' && value.outcome !== 'REJECTED') {
    throw new ReferenceReviewUpdateRejected('INVALID_REVIEW_SUBMISSION', 'outcome must be APPROVED or REJECTED');
  }
  if (value.comment !== undefined && typeof value.comment !== 'string') {
    throw new ReferenceReviewUpdateRejected('INVALID_REVIEW_SUBMISSION', 'comment must be a string when supplied');
  }
}

export function applyReferenceReviewSubmission(state: ReferenceApprovalState, submission: ReferenceReviewSubmission): ReferenceApprovalState {
  validateReferenceReviewSubmission(state, submission);
  return {
    reviewOutcome: submission.outcome,
    ...(submission.comment === undefined ? {} : { comment: submission.comment }),
  };
}

export function referencePostReviewAction(state: ReferenceApprovalState): ReferencePostReviewAction {
  if (state.reviewOutcome === 'PENDING') return 'WAIT_FOR_REVIEW';
  return state.reviewOutcome === 'APPROVED' ? 'SEND_CONFIRMATION' : 'COMPLETE_REJECTED';
}

export function referenceTemporalFailureTranslation(kind: ReferenceProviderFailureKind): ReferenceTemporalFailureTranslation {
  if (kind === 'INVALID_REFERENCE_REQUEST' || kind === 'IDEMPOTENCY_CONFLICT') {
    return {
      applicationFailureType: 'INVALID_REFERENCE_REQUEST',
      nonRetryable: true,
      translationBasis: kind === 'IDEMPOTENCY_CONFLICT'
        ? 'Idempotency key reuse with a different mapped destination is a permanent invalid request.'
        : 'Provider rejected the reference request as invalid.',
    };
  }
  return {
    applicationFailureType: 'TRANSIENT_REFERENCE_FAILURE',
    nonRetryable: false,
    translationBasis: kind === 'TRANSIENT_REFERENCE_FAILURE'
      ? 'Provider declared a transient reference failure.'
      : 'Unexpected reference-provider technical failures are explicitly bounded as transient by the reference runtime policy.',
  };
}
