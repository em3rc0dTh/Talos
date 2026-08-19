import test from 'node:test';
import assert from 'node:assert/strict';
import { ApplicationFailure } from '@temporalio/common';
import {
  ReferenceEmailSinkService,
  ReferenceEmailSinkStore,
} from '../packages/reference-email-sink/src/index.ts';
import { createReferenceActivities } from '../workers/reference-temporal-worker/src/activities.ts';
import { buildReferenceRuntimeProgram } from './helpers/reference-runtime-program.ts';
import {
  referenceActivityInputFromWorkflowInput,
  referenceTemporalActivityOptionsFromProgram,
} from '../workers/reference-temporal-worker/src/workflow-runtime.ts';

test('real Temporal Activity options are derived from compiled B6 program', () => {
  const { program } = buildReferenceRuntimeProgram();
  assert.deepEqual(referenceTemporalActivityOptionsFromProgram(program), {
    startToCloseTimeout: 5000,
    scheduleToCloseTimeout: 10000,
    retry: {
      initialInterval: 250,
      backoffCoefficient: 2,
      maximumInterval: 1000,
      maximumAttempts: 3,
      nonRetryableErrorTypes: ['INVALID_REFERENCE_REQUEST'],
    },
  });
});

test('Activity input contains only mapped destination plus runtime/idempotency context', () => {
  const { program } = buildReferenceRuntimeProgram();
  const activityInput = referenceActivityInputFromWorkflowInput({
    referenceRequestId: 'ref-sdk-001',
    notificationRecipientEmail: 'receiver@example.test',
    program,
  });
  assert.deepEqual(activityInput, {
    referenceRequestId: 'ref-sdk-001',
    capabilityUseOccurrenceId: program.activity.capabilityUseOccurrenceRef,
    to: 'receiver@example.test',
  });
});

test('Activity wrapper translates invalid provider request into non-retryable ApplicationFailure', async () => {
  const store = new ReferenceEmailSinkStore(':memory:');
  const service = new ReferenceEmailSinkService(store, () => '2026-08-19T21:00:00Z');
  const activities = createReferenceActivities(service);
  try {
    await assert.rejects(
      () => activities.sendReferenceConfirmation({
        referenceRequestId: 'ref-invalid',
        capabilityUseOccurrenceId: 'exe_cap_use_invalid',
        to: 'not-an-email',
      }),
      (error: unknown) => {
        assert(error instanceof ApplicationFailure);
        assert.equal(error.type, 'INVALID_REFERENCE_REQUEST');
        assert.equal(error.nonRetryable, true);
        return true;
      },
    );
  } finally {
    store.close();
  }
});

test('Activity wrapper translates transient provider failure into retryable ApplicationFailure', async () => {
  const store = new ReferenceEmailSinkStore(':memory:');
  const service = new ReferenceEmailSinkService(store, () => '2026-08-19T21:00:00Z');
  const activities = createReferenceActivities(service, {
    failurePlan: { transientFailuresBeforeSuccess: 1 },
  });
  try {
    await assert.rejects(
      () => activities.sendReferenceConfirmation({
        referenceRequestId: 'ref-transient',
        capabilityUseOccurrenceId: 'exe_cap_use_transient',
        to: 'receiver@example.test',
      }),
      (error: unknown) => {
        assert(error instanceof ApplicationFailure);
        assert.equal(error.type, 'TRANSIENT_REFERENCE_FAILURE');
        assert.equal(error.nonRetryable, false);
        return true;
      },
    );
    assert.equal(store.count(), 0);
  } finally {
    store.close();
  }
});
