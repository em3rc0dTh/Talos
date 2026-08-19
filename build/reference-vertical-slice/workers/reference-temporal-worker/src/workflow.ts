import {
  condition,
  defineQuery,
  defineUpdate,
  proxyActivities,
  setHandler,
} from '@temporalio/workflow';
import type {
  ReferenceApprovalState,
  ReferenceReviewSubmission,
  ReferenceWorkflowInput,
  ReferenceWorkflowResult,
} from './contracts.ts';
import {
  applyReferenceReviewSubmission,
  initialReferenceApprovalState,
  validateReferenceReviewSubmission,
  validateReferenceWorkflowInput,
} from './state-machine.ts';
import {
  referenceActivityInputFromWorkflowInput,
  referenceTemporalActivityOptionsFromProgram,
  type ReferenceActivities,
} from './workflow-runtime.ts';

export const submitReferenceReviewDecision = defineUpdate<
  ReferenceApprovalState,
  [ReferenceReviewSubmission]
>('submitReferenceReviewDecision');

export const getReferenceApprovalState = defineQuery<ReferenceApprovalState>(
  'getReferenceApprovalState',
);

export async function TalosReferenceApprovalWorkflow(
  input: ReferenceWorkflowInput,
): Promise<ReferenceWorkflowResult> {
  validateReferenceWorkflowInput(input);

  let state = initialReferenceApprovalState();

  setHandler(getReferenceApprovalState, () => state);
  setHandler(
    submitReferenceReviewDecision,
    (submission) => {
      state = applyReferenceReviewSubmission(state, submission);
      return state;
    },
    {
      validator: (submission) => validateReferenceReviewSubmission(state, submission),
    },
  );

  await condition(() => state.reviewOutcome !== 'PENDING');

  if (state.reviewOutcome === 'REJECTED') {
    return {
      outcome: 'REJECTED',
      reviewOutcome: 'REJECTED',
    };
  }

  const activities = proxyActivities<ReferenceActivities>(
    referenceTemporalActivityOptionsFromProgram(input.program),
  );
  const notification = await activities.sendReferenceConfirmation(
    referenceActivityInputFromWorkflowInput(input),
  );

  return {
    outcome: 'COMPLETED',
    reviewOutcome: 'APPROVED',
    notificationOutcome: notification.outcome,
  };
}
