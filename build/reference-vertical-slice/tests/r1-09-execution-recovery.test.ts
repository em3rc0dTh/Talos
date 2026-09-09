import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  createTalosProductExecutionRecovery,
  type TalosTemporalExecutionInspection,
  type TalosTemporalExecutionInspector,
} from '../apps/reference-api/src/private-preview-execution-recovery.ts';

const APPROVED_AT = '2026-08-27T01:00:00.000Z';
const STARTED_AT = '2026-08-27T01:00:02.000Z';
const COMPLETED_AT = '2026-08-27T01:05:00.000Z';
const EXECUTION_ID = 'RUN-RECOVERY-001';
const APPROVAL_ID = 'deployment:workflow-approval-recovery-001';
const DEPLOYMENT_REVISION_ID = 'deployment:revision-recovery-001';
const DEPLOYMENT_ATTEMPT_ID = 'deployment:attempt-recovery-001';
const WORKFLOW_TYPE_BINDING_ID = 'deployment:workflow-type-recovery-001';
const RUN_ID = 'temporal-run-recovery-001';

function append(store: SqliteDocumentStore, id: string, aggregateKind: string, payload: any, createdAt: string) {
  store.append({ id: id as any, aggregateKind, schemaVersion: 'r1-09-test-v0.1', payload, createdAt });
}

function seedDurableAuthority(runtimeDir: string): void {
  const store = new SqliteDocumentStore(path.join(runtimeDir, 'talos-one-app.sqlite'));
  try {
    append(store, DEPLOYMENT_REVISION_ID, 'DeploymentRevision', {
      id: DEPLOYMENT_REVISION_ID,
      deploymentDefinitionId: 'deployment:definition-recovery-001',
      revisionNumber: 1,
    }, '2026-08-27T00:58:00.000Z');
    append(store, WORKFLOW_TYPE_BINDING_ID, 'WorkflowTypeBinding', {
      id: WORKFLOW_TYPE_BINDING_ID,
      deploymentRevisionRef: DEPLOYMENT_REVISION_ID,
      workflowTypeName: 'TalosGenericWorkflow',
      taskQueueBindingRef: 'deployment:task-queue-recovery-001',
      artifactRef: 'worker:talos-generic',
    }, '2026-08-27T00:58:10.000Z');
    append(store, DEPLOYMENT_ATTEMPT_ID, 'DeploymentAttempt', {
      id: DEPLOYMENT_ATTEMPT_ID,
      deploymentRevisionRef: DEPLOYMENT_REVISION_ID,
      targetProfileRef: 'deployment:target-recovery-001',
      attemptNumber: 1,
      startedAt: '2026-08-27T00:59:00.000Z',
      completedAt: '2026-08-27T00:59:30.000Z',
      result: 'SUCCEEDED',
      diagnosticRefs: [],
      deploymentApprovalRef: 'deployment:approval-recovery-001',
      evidenceRefs: ['worker-running:recovery-001'],
    }, '2026-08-27T00:59:00.000Z');
    append(store, APPROVAL_ID, 'WorkflowExecutionApprovalRecord', {
      id: APPROVAL_ID,
      deploymentRevisionRef: DEPLOYMENT_REVISION_ID,
      deploymentAttemptRef: DEPLOYMENT_ATTEMPT_ID,
      workflowTypeBindingRef: WORKFLOW_TYPE_BINDING_ID,
      executionId: EXECUTION_ID,
      executionInputDigest: 'sha256:approved-recovery-input',
      approvalKind: 'WORKFLOW_EXECUTION_START',
      decision: 'APPROVED',
      authorityRef: 'authority:r1-09-owner',
      approvedBy: 'actor:r1-09-owner',
      rationale: 'Approve exactly one workflow start before the crash/restart test.',
      authorizedWorkflowStartCount: 1,
      createsWorkflowExecutionAuthority: true,
      approvedAt: APPROVED_AT,
    }, APPROVED_AT);
  } finally {
    store.close();
  }
}

function inspection(status: 'RUNNING' | 'COMPLETED'): TalosTemporalExecutionInspection {
  return {
    executionId: EXECUTION_ID,
    workflowIdRef: `talos-${EXECUTION_ID}`,
    runIdRef: RUN_ID,
    startedAt: STARTED_AT,
    status,
    ...(status === 'COMPLETED' ? { completedAt: COMPLETED_AT } : {}),
    evidenceRefs: [
      'recovery:talos-product-execution-recovery-v0.1',
      `workflow-id:talos-${EXECUTION_ID}`,
      `run-id:${RUN_ID}`,
      `temporal-status:${status}`,
    ],
  };
}

function inspectorFor(status: 'RUNNING' | 'COMPLETED'): TalosTemporalExecutionInspector {
  let closed = false;
  return {
    async inspect(executionId) {
      if (closed) throw new Error('inspector closed');
      assert.equal(executionId, EXECUTION_ID);
      return inspection(status);
    },
    async close() { closed = true; },
  };
}

function inspectStore(runtimeDir: string) {
  const store = new SqliteDocumentStore(path.join(runtimeDir, 'talos-one-app.sqlite'));
  try {
    return {
      starts: store.listByKind('WorkflowExecutionStartRecord').map((document) => document.payload as any),
      observations: store.listByKind('WorkflowExecutionObservation').map((document) => document.payload as any),
      approvals: store.listByKind('WorkflowExecutionApprovalRecord').map((document) => document.payload as any),
    };
  } finally {
    store.close();
  }
}

test('R1-09 restart reconciliation records RUNNING once, then closes the same Temporal run once after the next Talos process starts', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-09-recovery-'));
  seedDurableAuthority(runtimeDir);
  try {
    const firstProcess = createTalosProductExecutionRecovery(runtimeDir, inspectorFor('RUNNING'));
    const first = await firstProcess.reconcileAll();
    assert.deepEqual(first.activeExecutionIds, [EXECUTION_ID]);
    assert.deepEqual(first.terminalExecutionIds, []);
    assert.equal(first.items[0]?.state, 'RUNNING');
    await firstProcess.close();

    const afterFirst = inspectStore(runtimeDir);
    assert.equal(afterFirst.approvals.length, 1, 'recovery must not manufacture a second workflow-start approval');
    assert.equal(afterFirst.starts.length, 1);
    assert.equal(afterFirst.observations.length, 0);
    assert.equal(afterFirst.starts[0].executionApprovalRef, APPROVAL_ID);
    assert.equal(afterFirst.starts[0].executionInputDigest, 'sha256:approved-recovery-input');
    assert.equal(afterFirst.starts[0].workflowIdRef, `talos-${EXECUTION_ID}`);
    assert.equal(afterFirst.starts[0].runIdRef, RUN_ID);
    assert.equal(afterFirst.starts[0].executionStatus, 'RUNNING');

    // Simulate a completely new Talos product process against the same runtimeDir.
    const secondProcess = createTalosProductExecutionRecovery(runtimeDir, inspectorFor('COMPLETED'));
    const second = await secondProcess.reconcileAll();
    assert.deepEqual(second.activeExecutionIds, []);
    assert.deepEqual(second.terminalExecutionIds, [EXECUTION_ID]);
    assert.equal(second.items[0]?.state, 'TERMINAL');

    const idempotentSecondPass = await secondProcess.reconcileAll();
    assert.deepEqual(idempotentSecondPass.terminalExecutionIds, [EXECUTION_ID]);
    await secondProcess.close();

    const final = inspectStore(runtimeDir);
    assert.equal(final.approvals.length, 1);
    assert.equal(final.starts.length, 1, 'restart reconciliation must reuse the recovered start record');
    assert.equal(final.observations.length, 1, 'terminal reconciliation is immutable and idempotent');
    assert.equal(final.observations[0].executionApprovalRef, APPROVAL_ID);
    assert.equal(final.observations[0].workflowIdRef, `talos-${EXECUTION_ID}`);
    assert.equal(final.observations[0].runIdRef, RUN_ID);
    assert.equal(final.observations[0].closedAt, COMPLETED_AT);
    assert.equal(final.observations[0].executionStatus, 'COMPLETED');
    assert.deepEqual(final.observations[0].runtimeSegmentObservationRefs, [final.starts[0].id]);
  } finally {
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('R1-09 durable approval alone never becomes a recovered start when Temporal has no observed Workflow', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-09-no-runtime-'));
  seedDurableAuthority(runtimeDir);
  const inspector: TalosTemporalExecutionInspector = {
    async inspect() { throw new Error('Temporal Workflow not found'); },
    async close() {},
  };
  try {
    const recovery = createTalosProductExecutionRecovery(runtimeDir, inspector);
    const result = await recovery.reconcileAll();
    assert.deepEqual(result.activeExecutionIds, []);
    assert.deepEqual(result.terminalExecutionIds, []);
    assert.equal(result.items[0]?.state, 'NOT_OBSERVED');
    assert.match(result.items[0]?.diagnostic ?? '', /Workflow not found/);
    await recovery.close();

    const persisted = inspectStore(runtimeDir);
    assert.equal(persisted.approvals.length, 1);
    assert.equal(persisted.starts.length, 0, 'approval is authority, not proof that Temporal actually started');
    assert.equal(persisted.observations.length, 0);
  } finally {
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
