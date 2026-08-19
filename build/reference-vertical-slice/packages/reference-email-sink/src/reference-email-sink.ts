import { sha256Utf8 } from '../../foundation/src/digest.ts';
import { ReferenceEmailSinkStore } from './email-sink-store.ts';

export interface ReferenceEmailSendRequest {
  referenceRequestId: string;
  capabilityUseOccurrenceId: string;
  to: string;
  subject: string;
  body: string;
  effectCreatedAt: string;
}

export interface ReferenceEmailSendResult {
  outcome: 'MESSAGE_ACCEPTED';
  idempotencyKey: string;
  attemptNumber: number;
  effectStatus: 'INSERTED' | 'DUPLICATE_IDENTICAL';
  requestSha256: string;
}

export interface ReferenceEmailFailurePlan {
  transientFailuresBeforeSuccess: number;
}

export class ReferenceEmailTransientFailureError extends Error {
  readonly attemptNumber: number;
  constructor(attemptNumber: number) {
    super(`Injected transient reference email failure at attempt=${attemptNumber}`);
    this.name = 'TRANSIENT_REFERENCE_FAILURE';
    this.attemptNumber = attemptNumber;
  }
}

export class ReferenceEmailInvalidRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'INVALID_REFERENCE_REQUEST';
  }
}

export function deriveReferenceEmailIdempotencyKey(referenceRequestId: string, capabilityUseOccurrenceId: string): string {
  return sha256Utf8(`${referenceRequestId}:${capabilityUseOccurrenceId}`);
}

export class ReferenceEmailSinkService {
  readonly #attempts = new Map<string, number>();
  readonly store: ReferenceEmailSinkStore;

  constructor(store: ReferenceEmailSinkStore) {
    this.store = store;
  }

  send(request: ReferenceEmailSendRequest, plan: ReferenceEmailFailurePlan = { transientFailuresBeforeSuccess: 0 }): ReferenceEmailSendResult {
    if (!request.referenceRequestId.trim() || !request.capabilityUseOccurrenceId.trim()) {
      throw new ReferenceEmailInvalidRequestError('referenceRequestId and capabilityUseOccurrenceId are required');
    }

    const key = deriveReferenceEmailIdempotencyKey(request.referenceRequestId, request.capabilityUseOccurrenceId);
    const attempt = (this.#attempts.get(key) ?? 0) + 1;
    this.#attempts.set(key, attempt);

    if (!request.to.includes('@') || !request.subject.trim() || !request.body.trim() || !request.effectCreatedAt.trim()) {
      throw new ReferenceEmailInvalidRequestError('valid to, subject, body and effectCreatedAt are required');
    }

    if (attempt <= plan.transientFailuresBeforeSuccess) {
      throw new ReferenceEmailTransientFailureError(attempt);
    }

    const recorded = this.store.record({
      idempotencyKey: key,
      request: { to: request.to, subject: request.subject, body: request.body },
      createdAt: request.effectCreatedAt,
    });

    return {
      outcome: 'MESSAGE_ACCEPTED',
      idempotencyKey: key,
      attemptNumber: attempt,
      effectStatus: recorded.status,
      requestSha256: recorded.requestSha256,
    };
  }

  attemptCount(referenceRequestId: string, capabilityUseOccurrenceId: string): number {
    return this.#attempts.get(deriveReferenceEmailIdempotencyKey(referenceRequestId, capabilityUseOccurrenceId)) ?? 0;
  }
}
