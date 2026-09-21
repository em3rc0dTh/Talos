import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  LocalImageByteStore,
  ReferenceQuarryPerceptionProvider,
  intakePngUpload,
  runImagePerception,
} from '../packages/image-perception/src/index.ts';
import { normalizeAndValidateImageResult } from '../packages/application/src/image-semantic.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

function withImageStore<T>(fn: (ctx: { repo: SqliteDocumentStore; byteStore: LocalImageByteStore; bytes: Buffer }) => T): T {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i4-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  try { return fn({ repo, byteStore, bytes }); }
  finally { repo.close(); rmSync(runtimeDir, { recursive: true, force: true }); }
}

function buildI4(repo: SqliteDocumentStore, byteStore: LocalImageByteStore, bytes: Buffer) {
  const intake = intakePngUpload(repo, byteStore, bytes, {
    receivedAt: '2026-08-20T03:00:00.000Z',
    declaredName: 'Quarry 02 — Aqua Distilled Water Order & Delivery',
  });
  const perception = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), {
    now: '2026-08-20T03:00:01.000Z',
    materializeCommonEvidence: true,
  });
  assert.equal(perception.attempt.completion?.status, 'SUCCEEDED');
  assert.ok(perception.attempt.result);
  const semantic = normalizeAndValidateImageResult(repo, perception.attempt.result!.id, {
    normalizedAt: '2026-08-20T03:00:02.000Z',
    assessedAt: '2026-08-20T03:00:03.000Z',
  });
  return { intake, perception, semantic };
}

test('I4 image common evidence normalizes without Canvas native model and remains INFERRED', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const { semantic } = buildI4(repo, byteStore, bytes);
    const revision = semantic.normalization.processRevision;

    assert.equal(revision.nodes.length, 8);
    assert.equal(revision.actors.length, 5);
    assert.equal(revision.dataObjects.length, 4);
    assert.equal(revision.edges.length, 8);
    assert.equal(revision.nodes.every((node) => node.truthClass === 'INFERRED'), true);
    assert.equal(revision.edges.every((edge) => edge.truthClass === 'INFERRED'), true);
    assert.equal(revision.semanticClaims.length > 0, true);
    assert.equal(revision.semanticClaims.every((claim) => claim.truthClass === 'INFERRED'), true);
    assert.equal(revision.semanticClaims.some((claim) => claim.truthClass === 'CONFIRMED'), false);
    assert.equal(revision.semanticClaims.some((claim) => claim.truthClass === 'SOURCE_TRUTH'), false);
    assert.equal(revision.provenanceLinks.every((link) => link.truthClass === 'INFERRED'), true);
    assert.equal(revision.provenanceLinks.every((link) => link.extractionMethod === 'VISUAL_PERCEPTION'), true);
    assert.equal(revision.provenanceLinks.every((link) => link.interpreterVersion === 'image-common-normalizer-reference-v0.2'), true);

    const rasterOccurrences = semantic.normalization.sourceOccurrences.filter((item) => item.occurrenceKind !== 'EDGE');
    assert.equal(rasterOccurrences.length > 0, true);
    assert.equal(rasterOccurrences.some((item) => item.sourceAssertedType !== undefined), false);
    assert.equal(semantic.normalization.evidenceFragments.every((fragment) => fragment.sourceElementRef === undefined), true, 'raster evidence must not fabricate native source element IDs');
    assert.equal(semantic.normalization.evidenceFragments.some((fragment) => fragment.fragmentKind === 'IMAGE_REGION'), true);
  });
});

test('I4 maps only supported image relationship candidates and keeps branch semantics unconfirmed', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const { semantic } = buildI4(repo, byteStore, bytes);
    const revision = semantic.normalization.processRevision;
    const kinds = revision.edges.map((edge) => edge.kind);

    assert.equal(kinds.filter((kind) => kind === 'MESSAGE').length, 1);
    assert.equal(kinds.filter((kind) => kind === 'CONDITIONAL').length, 2);
    assert.equal(kinds.filter((kind) => kind === 'SEQUENCE').length, 5);
    assert.equal(revision.rules.length, 0, 'I4 must not invent Yes/No business rules that are not materialized in common evidence');
    assert.equal(repo.listByKind('PerceptionAlternativeDecision').length, 0, 'model preference remains distinct from human confirmation');
  });
});

test('I4 runs frozen validation and exposes incompleteness instead of repairing the image-derived process', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const { semantic } = buildI4(repo, byteStore, bytes);
    const validation = semantic.validation;
    const codes = validation.findings.map((finding) => finding.code);

    assert.equal(validation.assessment.processRevisionId, semantic.normalization.processRevision.id);
    assert.equal(validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.equal(validation.assessment.semanticVerdict, 'INCOMPLETE');
    assert.ok(codes.includes('SV-CMP-001'), 'missing explicit END in I2 evidence must remain visible');
    assert.ok(codes.includes('SV-SUB-002'), 'collapsed subprocess boundary remains unresolved');
    assert.equal(codes.filter((code) => code === 'SV-CFL-001').length, 2, 'both inferred conditional branches still lack confirmed structured rules');
    assert.ok(codes.includes('SV-SRC-001'), 'material inferred image meaning requires confirmation');
    assert.equal(validation.questions.length > 0, true);
  });
});

test('I4 stops before semantic freeze, capability, execution and Temporal', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    buildI4(repo, byteStore, bytes);
    assert.equal(repo.listByKind('SemanticFreezeRecord').length, 0);
    assert.equal(repo.listByKind('CapabilityDesignRevision').length, 0);
    assert.equal(repo.listByKind('CapabilityBindingRevision').length, 0);
    assert.equal(repo.listByKind('ExecutionPlanRevision').length, 0);
    assert.equal(repo.listByKind('TemporalMappingRevision').length, 0);
    assert.equal(repo.listByKind('RuntimePolicyRevision').length, 0);
    assert.equal(repo.listByKind('DeploymentRevision').length, 0);
  });
});

test('I4 normalization is idempotent for the same immutable image AdapterResult', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const { perception, semantic: first } = buildI4(repo, byteStore, bytes);
    const processCount = repo.listByKind('ProcessRevision').length;
    const second = normalizeAndValidateImageResult(repo, perception.attempt.result!.id, {
      normalizedAt: '2026-08-20T03:00:02.000Z',
      assessedAt: '2026-08-20T03:00:03.000Z',
    });

    assert.equal(second.normalization.processRevision.id, first.normalization.processRevision.id);
    assert.equal(second.validation.assessment.id, first.validation.assessment.id);
    assert.equal(repo.listByKind('ProcessRevision').length, processCount);
  });
});
