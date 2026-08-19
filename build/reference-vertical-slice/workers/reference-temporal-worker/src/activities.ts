import { ApplicationFailure } from '@temporalio/common';
import type { ReferenceEmailFailurePlan } from '../../../packages/reference-email-sink/src/reference-email-sink.ts';
import {
  ReferenceEmailSinkService,
} from '../../../packages/reference-email-sink/src/reference-email-sink.ts';
import {
  classifyReferenceProviderError,
  referenceFailureSpecFromProviderError,
} from './sdk-adapter-contract.ts';
import type {
  ReferenceActivities,
  SendReferenceConfirmationActivityInput,
  SendReferenceConfirmationActivityResult,
} from './workflow-runtime.ts';

export interface ReferenceActivityFactoryOptions {
  failurePlan?: ReferenceEmailFailurePlan;
}

export function createReferenceActivities(
  provider: ReferenceEmailSinkService,
  options: ReferenceActivityFactoryOptions = {},
): ReferenceActivities {
  const failurePlan = options.failurePlan ?? { transientFailuresBeforeSuccess: 0 };

  return {
    async sendReferenceConfirmation(
      input: SendReferenceConfirmationActivityInput,
    ): Promise<SendReferenceConfirmationActivityResult> {
      try {
        const result = provider.send(
          {
            referenceRequestId: input.referenceRequestId,
            capabilityUseOccurrenceId: input.capabilityUseOccurrenceId,
            to: input.to,
          },
          failurePlan,
        );
        return {
          outcome: result.outcome,
          idempotencyKey: result.idempotencyKey,
          effectStatus: result.effectStatus,
        };
      } catch (error) {
        const kind = classifyReferenceProviderError(error);
        const failure = referenceFailureSpecFromProviderError(error);
        throw ApplicationFailure.create({
          message: error instanceof Error ? error.message : String(error),
          type: failure.applicationFailureType,
          nonRetryable: failure.nonRetryable,
          details: [
            {
              providerFailureKind: kind,
              translationBasis: failure.translationBasis,
            },
          ],
          cause: error instanceof Error ? error : undefined,
        });
      }
    },
  };
}
