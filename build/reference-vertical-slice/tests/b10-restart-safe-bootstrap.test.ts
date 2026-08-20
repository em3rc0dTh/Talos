import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { buildRestartSafeReferenceVerticalSlice } from '../packages/application/src/reference-bootstrap.ts';
import { startReferenceDemo } from '../apps/reference-api/src/server.ts';

// Hands-on regression: the same durable runtime directory must survive a full stop/start cycle.
function documentCount(dbPath: string): number {
  const store = new SqliteDocumentStore(dbPath);
  try {
    const kinds = [
      'ProcessRevision',
      'ReviewCommand',
      'ReviewCommandApplication',
      'SemanticFreezeRecord',
      'CapabilityDesignRevision',
      'ExecutionPlanRevision',
      'TemporalMappingRevision',
      'RuntimePolicyRevision',
      'DeploymentRevision',
    ];
    return kinds.reduce((total, kind) => total + store.listByKind(kind).length, 0);
  } finally {
    store.close();
  }
}

test('reference bootstrap replays immutable review history against the same durable Talos SQLite store', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-b10-bootstrap-'));
  const dbPath = path.join(dir, 'talos-state.sqlite');
  const store = new SqliteDocumentStore(dbPath);
  try {
    const first = buildRestartSafeReferenceVerticalSlice(store);
    const firstCount = documentCount(dbPath);
    const second = buildRestartSafeReferenceVerticalSlice(store);
    const secondCount = documentCount(dbPath);

    assert.equal(first.initial.validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.equal(first.correction.application.result, 'APPLIED');
    assert.equal(first.correction.candidateValidation?.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');

    assert.equal(second.correction.application.result, 'IDEMPOTENT_REPLAY');
    assert.equal(second.correction.candidateProcessRevision?.id, first.correction.candidateProcessRevision?.id);
    assert.equal(second.correction.candidateValidation?.assessment.id, first.correction.candidateValidation?.assessment.id);
    assert.equal(second.correction.nextContext?.workspaceRevision.id, first.correction.nextContext?.workspaceRevision.id);
    assert.equal(second.correction.candidateValidation?.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');
    assert.equal(secondCount, firstCount, 'restart replay must not create duplicate semantic/review/execution history');
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('reference HTTP/Temporal app can close and restart with the same runtime directory', { timeout: 120_000 }, async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-b10-restart-'));
  try {
    const first = await startReferenceDemo({ port: 0, runtimeDir, injectTransientFailure: false });
    const firstHealth = await fetch(`${first.baseUrl}/api/health`).then((response) => response.json()) as any;
    assert.equal(firstHealth.status, 'READY');
    await first.close();

    const talosDbPath = path.join(runtimeDir, 'talos-state.sqlite');
    const countAfterFirst = documentCount(talosDbPath);

    const second = await startReferenceDemo({ port: 0, runtimeDir, injectTransientFailure: false });
    try {
      const secondHealth = await fetch(`${second.baseUrl}/api/health`).then((response) => response.json()) as any;
      assert.equal(secondHealth.status, 'READY');
      assert.equal(secondHealth.workerState, 'RUNNING');
    } finally {
      await second.close();
    }

    const countAfterSecond = documentCount(talosDbPath);
    assert.equal(countAfterSecond, countAfterFirst, 'second app start must reuse identical immutable semantic history');
  } finally {
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
