import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  LocalImageByteStore,
  intakePngUpload,
  parsePngDimensions,
  sha256ImageBytes,
} from '../packages/image-perception/src/index.ts';

const QUARRY_SHA = '6b57667aeee62a7fe47d79a4533787f5922d59e5f52dedede2751e910df755ee';
const fixturePath = path.resolve(
  process.cwd(),
  '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png',
);

test('I0 Quarry-02 bytes match the source record and PNG coordinate space', () => {
  const bytes = readFileSync(fixturePath);
  assert.equal(sha256ImageBytes(bytes), QUARRY_SHA);
  assert.deepEqual(parsePngDimensions(bytes), { width: 791, height: 451 });
});

test('I0 preserves exact PNG bytes and durable source provenance', () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i0-'));
  const dbPath = path.join(runtimeDir, 'talos-state.sqlite');
  const byteRoot = path.join(runtimeDir, 'source-bytes');
  const repo = new SqliteDocumentStore(dbPath);
  const byteStore = new LocalImageByteStore(byteRoot);
  const bytes = readFileSync(fixturePath);

  try {
    const result = intakePngUpload(repo, byteStore, bytes, {
      receivedAt: '2026-08-19T23:10:00.000Z',
      initiatedBy: 'reference-user',
      declaredName: 'Quarry 02 — Aqua Distilled Water Order & Delivery',
    });

    assert.equal(result.session.channel, 'FILE_UPLOAD');
    assert.equal(result.origin.originKind, 'DIGITAL_NATIVE_ARTIFACT');
    assert.equal(result.capture.captureMethod, 'DIRECT_UPLOAD');
    assert.equal(result.representation.representationKind, 'NATIVE_DIGITAL');
    assert.equal(result.representation.byteIdentityStatus, 'EXACT_VERIFIED');
    assert.equal(result.representation.contentHash, QUARRY_SHA);
    assert.equal(result.storage.sha256, QUARRY_SHA);
    assert.equal(result.storage.mediaType, 'image/png');
    assert.equal(result.coordinateSpace.width, 791);
    assert.equal(result.coordinateSpace.height, 451);
    assert.equal(result.coordinateSpace.coordinateBasis, 'PIXEL');

    const roundTrip = byteStore.readPng(QUARRY_SHA);
    assert.ok(roundTrip.equals(bytes), 'stored image bytes must round-trip byte-identically');

    repo.close();
    const reopened = new SqliteDocumentStore(dbPath);
    try {
      const persisted = reopened.get(result.representation.id);
      assert.equal((persisted?.payload as any).contentHash, QUARRY_SHA);
      assert.equal(reopened.listByKind('ImageCoordinateSpace').length, 1);
    } finally {
      reopened.close();
    }
  } finally {
    try { repo.close(); } catch {}
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('I0 storage deduplication does not collapse separate upload/source identities', () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i0-dedup-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);

  try {
    const first = intakePngUpload(repo, byteStore, bytes, { receivedAt: '2026-08-19T23:11:00.000Z' });
    const second = intakePngUpload(repo, byteStore, bytes, { receivedAt: '2026-08-19T23:12:00.000Z' });

    assert.equal(first.storage.sha256, second.storage.sha256);
    assert.equal(first.storage.relativePath, second.storage.relativePath);
    assert.notEqual(first.session.id, second.session.id);
    assert.notEqual(first.origin.id, second.origin.id);
    assert.notEqual(first.capture.id, second.capture.id);
    assert.notEqual(first.representation.id, second.representation.id);
    assert.equal(repo.listByKind('SourceRepresentation').length, 2);
    assert.equal(byteStore.readPng(QUARRY_SHA).byteLength, bytes.byteLength);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('I0 rejects non-PNG bytes before creating source records', () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i0-invalid-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));

  try {
    assert.throws(
      () => intakePngUpload(repo, byteStore, Buffer.from('not a png')),
      /IMAGE_INTAKE_INVALID_PNG/,
    );
    assert.equal(repo.listByKind('SourceRepresentation').length, 0);
    assert.equal(repo.listByKind('SourceOrigin').length, 0);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
