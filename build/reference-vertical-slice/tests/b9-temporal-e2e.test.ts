import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { createReferenceTemporalWorker } from '../workers/reference-temporal-worker/src/worker-runtime.ts';
import {
  TalosReferenceApprovalWorkflow,
  submitReferenceReviewDecision,
} from '../workers/reference-temporal-worker/src/workflow.ts';
import { buildReferenceRuntimeProgram } from './helpers/reference-runtime-program.ts';

test('real Temporal server executes approved/rejected reference paths with durable Activity retry evidence', { timeout: 120_000 }, async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-b9-'));
  const providerDb = path.join(dir, 'reference-email-sink.sqlite');
  const env = await TestWorkflowEnvironment.createLocal({
    server: { namespace: 'talos-reference' },
  });
  const taskQueue = 'talos-reference-main';
  const { program } = buildReferenceRuntimeProgram();
  let clockIndex = 0;
  const clock = () => [
    '2026-08-19T22:00:00.000Z',
    '2026-08-19T22:00:01.000Z',
    '2026-08-19T22:00:02.000Z',
  ][Math.min(clockIndex++, 2)];

  const runtime = await createReferenceTemporalWorker({
    connection: env.nativeConnection,
    namespace: env.namespace,
    taskQueue,
    providerDbPath: providerDb,
    identity: 'talos-reference-worker-b9',
    failurePlan: { transientFailuresBeforeSuccess: 1 },
    now: clock,
  });

  try {
    await runtime.worker.runUntil(async () => {
      const approvedId = `talos-approved-${randomUUID()}`;
      const approved = await env.client.workflow.start(TalosReferenceApprovalWorkflow, {
        workflowId: approvedId,
        taskQueue,
        args: [{
          referenceRequestId: 'REQ-B9-APPROVED',
          notificationRecipientEmail: 'receiver@example.test',
          program,
        }],
        retry: { maximumAttempts: program.workflow.workflowMaximumAttempts },
      });

      const accepted = await approved.executeUpdate(submitReferenceReviewDecision, {
        args: [{ outcome: 'APPROVED', comment: 'approved in B9' }],
      });
      assert.equal(accepted.reviewOutcome, 'APPROVED');

      const approvedResult = await approved.result();
      assert.deepEqual(approvedResult, {
        outcome: 'COMPLETED',
        reviewOutcome: 'APPROVED',
        notificationOutcome: 'MESSAGE_ACCEPTED',
      });

      assert.equal(
        runtime.providerService.attemptCount(
          'REQ-B9-APPROVED',
          program.activity.capabilityUseOccurrenceRef,
        ),
        2,
      );
      assert.equal(runtime.providerStore.count(), 1);

      const approvedDescription = await approved.describe();
      assert.ok(approvedDescription);
      const approvedHistory = await approved.fetchHistory();
      const approvedEvents = approvedHistory.events ?? [];
      assert.ok(approvedEvents.length > 0);
      assert.ok(approvedEvents.some((event) => Boolean(event.activityTaskScheduledEventAttributes)));
      const startedAttempts = approvedEvents.filter((event) => Boolean(event.activityTaskStartedEventAttributes));
      assert.ok(startedAttempts.length >= 2, `expected at least 2 Activity Task starts, got ${startedAttempts.length}`);
      assert.ok(approvedEvents.some((event) => Boolean(event.activityTaskCompletedEventAttributes)));
      assert.ok(approvedEvents.some((event) => Boolean(event.workflowExecutionCompletedEventAttributes)));

      const rejectedId = `talos-rejected-${randomUUID()}`;
      const rejected = await env.client.workflow.start(TalosReferenceApprovalWorkflow, {
        workflowId: rejectedId,
        taskQueue,
        args: [{
          referenceRequestId: 'REQ-B9-REJECTED',
          notificationRecipientEmail: 'unused@example.test',
          program,
        }],
        retry: { maximumAttempts: program.workflow.workflowMaximumAttempts },
      });
      const rejectedUpdate = await rejected.executeUpdate(submitReferenceReviewDecision, {
        args: [{ outcome: 'REJECTED', comment: 'rejected in B9' }],
      });
      assert.equal(rejectedUpdate.reviewOutcome, 'REJECTED');
      assert.deepEqual(await rejected.result(), {
        outcome: 'REJECTED',
        reviewOutcome: 'REJECTED',
      });
      assert.equal(runtime.providerStore.count(), 1);

      const rejectedHistory = await rejected.fetchHistory();
      assert.equal(
        (rejectedHistory.events ?? []).some((event) => Boolean(event.activityTaskScheduledEventAttributes)),
        false,
      );
    });
  } finally {
    runtime.closeProvider();
    await env.teardown();
    rmSync(dir, { recursive: true, force: true });
  }
});
