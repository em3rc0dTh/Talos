import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpaqueId, getIdKind, assertIdKind } from '../packages/foundation/src/ids.ts';
import { deterministicJson, versionedJson } from '../packages/foundation/src/deterministic-json.ts';
import { digestDeterministicJson } from '../packages/foundation/src/digest.ts';

test('cross-layer deterministic IDs remain distinct by kind', () => {
  const source = createOpaqueId('source', 'same-seed');
  const canonical = createOpaqueId('canonical', 'same-seed');
  assert.notEqual(source, canonical);
  assert.equal(getIdKind(source), 'source');
  assert.equal(getIdKind(canonical), 'canonical');
  assertIdKind(source, 'source');
  assert.throws(() => assertIdKind(source, 'canonical'), /id kind mismatch/);
});

test('deterministic JSON is key-order independent and array-order preserving', () => {
  const a = { z: 1, a: { d: true, b: ['x', 2] } };
  const b = { a: { b: ['x', 2], d: true }, z: 1 };
  assert.equal(deterministicJson(a), deterministicJson(b));
  assert.equal(digestDeterministicJson(a), digestDeterministicJson(b));
  assert.notEqual(deterministicJson({ a: [1, 2] }), deterministicJson({ a: [2, 1] }));
});

test('deterministic JSON refuses silent information loss', () => {
  assert.throws(() => deterministicJson({ a: undefined }), /undefined is not deterministic JSON/);
  assert.throws(() => deterministicJson({ n: Number.NaN }), /Non-finite number/);
  assert.throws(() => deterministicJson(new Date('2026-08-19T00:00:00Z')), /Only plain objects/);
  const cyclic: Record<string, unknown> = {};
  cyclic.self = cyclic;
  assert.throws(() => deterministicJson(cyclic), /Cyclic deterministic JSON/);
});

test('versioned JSON pins schema and version into serialized identity', () => {
  assert.notEqual(versionedJson('x', 'v1', { a: 1 }), versionedJson('x', 'v2', { a: 1 }));
});
