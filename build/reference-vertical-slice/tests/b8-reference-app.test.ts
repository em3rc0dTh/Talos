import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startReferenceDemo } from '../apps/reference-api/src/server.ts';

// This smoke test is the user-try gate: it must traverse real Talos semantics and real Temporal runtime.
async function requestJson(baseUrl: string, pathname: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body as any;
}

test('B8 local app exposes the real Talos baseline and completes approved/rejected Temporal requests', { timeout: 120_000 }, async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-b8-app-'));
  const demo = await startReferenceDemo({ port: 0, runtimeDir, injectTransientFailure: true });
  try {
    const health = await requestJson(demo.baseUrl, '/api/health');
    assert.equal(health.status, 'READY');
    assert.equal(health.temporalSdkVersion, '1.22.0');
    assert.equal(health.workerState, 'RUNNING');

    const baseline = await requestJson(demo.baseUrl, '/api/baseline');
    assert.equal(baseline.initial.actor, 'UNKNOWN');
    assert.equal(baseline.initial.readiness, 'INSUFFICIENT_DETAIL');
    assert.ok(baseline.initial.findingCodes.includes('SV-ACT-001'));
    assert.equal(baseline.corrected.actor, 'Manager');
    assert.equal(baseline.corrected.readiness, 'READY_FOR_AUTOMATION_DESIGN');
    assert.equal(baseline.freeze.kind, 'AUTOMATION_DESIGN_HANDOFF');
    assert.equal(baseline.capability.offering, 'REFERENCE_EMAIL_SINK');
    assert.match(baseline.temporal.humanMapping, /UPDATE_HANDLER/);
    assert.match(baseline.temporal.humanMapping, /WORKFLOW_CONDITION/);
    assert.equal(baseline.temporal.retryMaximumAttempts, 3);

    const startedApproved = await requestJson(demo.baseUrl, '/api/processes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recipientEmail: 'eduardo@example.test' }),
    });
    assert.equal(startedApproved.reviewState.reviewOutcome, 'PENDING');

    const approved = await requestJson(
      demo.baseUrl,
      `/api/processes/${encodeURIComponent(startedApproved.referenceRequestId)}/review`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ outcome: 'APPROVED', comment: 'B8 smoke approval' }),
      },
    );
    assert.deepEqual(approved.result, {
      outcome: 'COMPLETED',
      reviewOutcome: 'APPROVED',
      notificationOutcome: 'MESSAGE_ACCEPTED',
    });
    assert.equal(approved.providerEffects.length, 1);
    assert.equal(approved.providerEffects[0].request.to, 'eduardo@example.test');
    assert.ok(Number(approved.temporal.history.activityAttempt) >= 2);
    assert.equal(approved.temporal.history.activityCompleted, true);
    assert.equal(approved.temporal.history.workflowCompleted, true);

    const startedRejected = await requestJson(demo.baseUrl, '/api/processes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recipientEmail: 'unused@example.test' }),
    });
    const rejected = await requestJson(
      demo.baseUrl,
      `/api/processes/${encodeURIComponent(startedRejected.referenceRequestId)}/review`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ outcome: 'REJECTED', comment: 'B8 smoke rejection' }),
      },
    );
    assert.deepEqual(rejected.result, {
      outcome: 'REJECTED',
      reviewOutcome: 'REJECTED',
    });
    assert.equal(rejected.providerEffects.length, 0);
    assert.equal(rejected.temporal.history.activityScheduled, false);
  } finally {
    await demo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
