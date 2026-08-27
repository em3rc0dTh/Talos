import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  createTalosProductExecutionRecovery,
  type TalosTemporalExecutionInspector,
} from '../apps/reference-api/src/private-preview-execution-recovery.ts';

const EXECUTION_ID = 'RUN-DUPLICATE-AUTHORITY-001';

function seedApproval(store: SqliteDocumentStore, id: string, approvedAt: string): void {
  store.append({
    id: id as any,
    aggregateKind: 'WorkflowExecutionApprovalRecord',
    schemaVersion: 'r1-09-duplicate-test-v0.1',
    payload: {
      id,
      deploymentRevisionRef: 'deployment:duplicate-revision',
      deploymentAttemptRef: 'deployment:duplicate-attempt',
      workflowTypeBindingRef: 'deployment:duplicate-workflow-type',
      executionId: EXECUTION_ID,
      executionInputDigest: 'sha256:duplicate-execution-input',
      approvalKind: 'WORKFLOW_EXECUTION_START',
      decision: 'APPROVED',
      authorityRef: `authority:${id}`,
      approvedBy: 'actor:r1-09-owner',
      rationale: 'Duplicate approval fixture must be rejected before runtime inspection.',
      authorizedWorkflowStartCount: 1,
      createsWorkflowExecutionAuthority: true,
      approvedAt,
    },
    createdAt: approvedAt,
  });
}

test('R1-09 recovery refuses two durable one-start approvals for the same executionId before inspecting Temporal', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-09-duplicate-approval-'));
  const store = new SqliteDocumentStore(path.join(runtimeDir, 'talos-one-app.sqlite'));
  try {
    seedApproval(store, 'deployment:workflow-approval-duplicate-a', '2026-08-27T03:00:00.000Z');
    seedApproval(store, 'deployment:workflow-approval-duplicate-b', '2026-08-27T03:00:01.000Z');
  } finally {
    store.close();
  }

  let inspections = 0;
  const inspector: TalosTemporalExecutionInspector = {
    async inspect() {
      inspections += 1;
      throw new Error('Temporal must not be consulted for ambiguous authority');
    },
    async close() {},
  };

  try {
    const recovery = createTalosProductExecutionRecovery(runtimeDir, inspector);
    await assert.rejects(
      () => recovery.reconcileAll(),
      /TALOS_RECOVERY_DUPLICATE_EXECUTION_APPROVAL: RUN-DUPLICATE-AUTHORITY-001/,
    );
    await assert.rejects(
      () => recovery.reconcileExecution(EXECUTION_ID),
      /TALOS_RECOVERY_DUPLICATE_EXECUTION_APPROVAL: RUN-DUPLICATE-AUTHORITY-001/,
    );
    assert.equal(inspections, 0, 'ambiguous authority must fail before Temporal runtime inspection');
    await recovery.close();
  } finally {
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
