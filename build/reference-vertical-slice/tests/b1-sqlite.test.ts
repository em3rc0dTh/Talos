import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { SqliteDocumentStore, ImmutableDocumentConflictError } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { ReferenceEmailSinkStore, ReferenceEmailIdempotencyConflictError } from '../packages/reference-email-sink/src/email-sink-store.ts';

test('Talos immutable repository survives close/reopen and rejects mutation-by-id', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-b1-'));
  const dbPath = path.join(dir, 'talos-state.sqlite');
  const id = createOpaqueId('source', 'b1-doc');
  try {
    let store = new SqliteDocumentStore(dbPath);
    const doc = { id, aggregateKind: 'SourceOrigin', schemaVersion: 'v0.3', payload: { medium: 'TALOS_CANVAS' }, createdAt: '2026-08-19T12:00:00Z' } as const;
    assert.equal(store.append(doc).status, 'INSERTED');
    assert.equal(store.append(doc).status, 'EXISTS_IDENTICAL');
    assert.throws(() => store.append({ ...doc, payload: { medium: 'BPMN_FILE' } }), ImmutableDocumentConflictError);
    store.close();

    store = new SqliteDocumentStore(dbPath);
    assert.deepEqual(store.get(id)?.payload, { medium: 'TALOS_CANVAS' });
    assert.equal(store.listByKind('SourceOrigin').length, 1);
    store.close();

    const raw = new DatabaseSync(dbPath);
    assert.throws(() => raw.exec(`UPDATE immutable_documents SET schema_version='evil' WHERE id='${id}'`), /append-only/);
    assert.throws(() => raw.exec(`DELETE FROM immutable_documents WHERE id='${id}'`), /append-only/);
    raw.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Talos state and reference provider effect stores are physically isolated', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-b1-isolation-'));
  const talosPath = path.join(dir, 'talos-state.sqlite');
  const sinkPath = path.join(dir, 'reference-email-sink.sqlite');
  try {
    const talos = new SqliteDocumentStore(talosPath);
    const sink = new ReferenceEmailSinkStore(sinkPath);
    const first = sink.record({ idempotencyKey: 'req-1:cap-use-1', request: { to: 'a@example.test', subject: 'Approved', body: 'Done' }, createdAt: '2026-08-19T12:01:00Z' });
    assert.equal(first.status, 'INSERTED');
    assert.equal(sink.record({ idempotencyKey: 'req-1:cap-use-1', request: { to: 'a@example.test', subject: 'Approved', body: 'Done' }, createdAt: '2026-08-19T12:01:00Z' }).status, 'DUPLICATE_IDENTICAL');
    assert.equal(sink.count(), 1);
    assert.throws(() => sink.record({ idempotencyKey: 'req-1:cap-use-1', request: { to: 'b@example.test', subject: 'Changed', body: 'Different' }, createdAt: '2026-08-19T12:01:00Z' }), ReferenceEmailIdempotencyConflictError);
    assert.ok(talos.tableNames().includes('immutable_documents'));
    assert.ok(!talos.tableNames().includes('reference_email_effects'));
    assert.ok(sink.tableNames().includes('reference_email_effects'));
    assert.ok(!sink.tableNames().includes('immutable_documents'));
    talos.close();
    sink.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
