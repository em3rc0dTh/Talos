import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  ReferenceEmailSinkStore,
  ReferenceEmailSinkService,
  ReferenceEmailTransientFailureError,
  ReferenceEmailInvalidRequestError,
  ReferenceEmailIdempotencyConflictError,
  deriveReferenceEmailIdempotencyKey,
} from '../packages/reference-email-sink/src/index.ts';
import { sha256Utf8 } from '../packages/foundation/src/digest.ts';

function request() {
  return {
    referenceRequestId: 'ref-001',
    capabilityUseOccurrenceId: 'exe_cap_use_001',
    to: 'receiver@example.test',
    effectCreatedAt: '2026-08-19T19:30:00Z',
  };
}

test('provider request surface matches the B5/B6 mapped input boundary', () => {
  assert.deepEqual(Object.keys(request()).sort(), [
    'capabilityUseOccurrenceId',
    'effectCreatedAt',
    'referenceRequestId',
    'to',
  ]);
});

test('provider key matches frozen B6 sha256 contract', () => {
  assert.equal(
    deriveReferenceEmailIdempotencyKey('ref-001', 'exe_cap_use_001'),
    sha256Utf8('ref-001:exe_cap_use_001'),
  );
});

test('transient failure can be injected before one logical provider effect', () => {
  const store = new ReferenceEmailSinkStore(':memory:');
  const provider = new ReferenceEmailSinkService(store);
  assert.throws(
    () => provider.send(request(), { transientFailuresBeforeSuccess: 1 }),
    ReferenceEmailTransientFailureError,
  );
  const result = provider.send(request(), { transientFailuresBeforeSuccess: 1 });
  assert.equal(result.attemptNumber, 2);
  assert.equal(result.effectStatus, 'INSERTED');
  assert.equal(store.count(), 1);
  store.close();
});

test('repeated identical request is deduplicated by provider store', () => {
  const store = new ReferenceEmailSinkStore(':memory:');
  const provider = new ReferenceEmailSinkService(store);
  assert.equal(provider.send(request()).effectStatus, 'INSERTED');
  assert.equal(provider.send(request()).effectStatus, 'DUPLICATE_IDENTICAL');
  assert.equal(store.count(), 1);
  store.close();
});

test('same idempotency key with changed mapped destination is rejected', () => {
  const store = new ReferenceEmailSinkStore(':memory:');
  const provider = new ReferenceEmailSinkService(store);
  provider.send(request());
  assert.throws(
    () => provider.send({ ...request(), to: 'other@example.test' }),
    ReferenceEmailIdempotencyConflictError,
  );
  assert.equal(store.count(), 1);
  store.close();
});

test('invalid request is permanent provider failure and creates no effect', () => {
  const store = new ReferenceEmailSinkStore(':memory:');
  const provider = new ReferenceEmailSinkService(store);
  assert.throws(
    () => provider.send({ ...request(), to: 'not-an-email' }),
    ReferenceEmailInvalidRequestError,
  );
  assert.equal(provider.attemptCount('ref-001', 'exe_cap_use_001'), 1);
  assert.equal(store.count(), 0);
  store.close();
});

test('provider effect survives restart in its own database', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'talos-provider-'));
  const db = path.join(dir, 'reference-email-sink.sqlite');
  try {
    let store = new ReferenceEmailSinkStore(db);
    const provider = new ReferenceEmailSinkService(store);
    provider.send(request());
    store.close();

    store = new ReferenceEmailSinkStore(db);
    assert.equal(store.count(), 1);
    store.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
