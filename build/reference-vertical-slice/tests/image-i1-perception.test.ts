import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  LocalImageByteStore,
  QUARRY_02_VERIFIED_SHA256,
  ReferenceQuarryPerceptionProvider,
  intakePngUpload,
  runImagePerception,
  type ImagePerceptionProvider,
} from '../packages/image-perception/src/index.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

function withImageStore<T>(fn: (ctx: { repo: SqliteDocumentStore; byteStore: LocalImageByteStore; bytes: Buffer }) => T): T {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i1-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  try { return fn({ repo, byteStore, bytes }); }
  finally { repo.close(); rmSync(runtimeDir, { recursive: true, force: true }); }
}

test('I1A adapter consumes a provider-neutral ImagePerceptionProvider contract', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const intake = intakePngUpload(repo, byteStore, bytes, { receivedAt: '2026-08-19T23:20:00.000Z' });
    const neutralProvider: ImagePerceptionProvider = {
      providerId: 'NEUTRAL_TEST_PROVIDER', providerVersion: '0.0.1-test',
      perceive: () => ({
        providerId: 'NEUTRAL_TEST_PROVIDER', providerVersion: '0.0.1-test', providerClass: 'SOURCE_DEFINED',
        modelRef: 'test-model', modelVersion: '0.0.1', pipelineVersion: 'test-pipeline', evidenceMode: 'SOURCE_DEFINED', status: 'SUCCEEDED',
        anchors: [{ providerAnchorKey: 'whole', geometryKind: 'WHOLE_IMAGE', geometry: { x: 0, y: 0, width: 791, height: 451 }, visibilityState: 'VISIBLE' }],
        observations: [{ providerObservationKey: 'obs-1', anchorKey: 'whole', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Example', confidence: 0.5 }],
        occurrenceCandidates: [], alternativeSets: [], relationCandidates: [], diagnostics: [],
      }),
    };
    const result = runImagePerception(repo, intake, neutralProvider, { now: '2026-08-19T23:20:01.000Z' });
    assert.equal(result.providerResult.providerId, 'NEUTRAL_TEST_PROVIDER');
    assert.equal(result.attempt.start.extractionMode, 'VISUAL_PERCEPTION');
    assert.equal(result.anchors.length, 1);
    assert.equal(result.observations.length, 1);
    assert.equal(result.providerResult.occurrenceCandidates.length, 0);
    assert.equal(result.attempt.completion?.status, 'PARTIAL');
    assert.ok(result.attempt.diagnostics.some((item) => item.code === 'COMMON_EVIDENCE_MATERIALIZATION_PENDING'));
    assert.equal(repo.listByKind('SourceEvidenceGraph').length, 0);
    assert.equal(repo.listByKind('ProcessRevision').length, 0);
  });
});

test('I1B exact Quarry-02 digest produces immutable TEST_ONLY fixture perception history with recovered visible semantics', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const intake = intakePngUpload(repo, byteStore, bytes, { receivedAt: '2026-08-19T23:21:00.000Z' });
    assert.equal(intake.representation.contentHash, QUARRY_02_VERIFIED_SHA256);
    const result = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), { now: '2026-08-19T23:21:01.000Z' });
    assert.equal(result.providerResult.status, 'SUCCEEDED');
    assert.equal(result.providerResult.providerClass, 'FIXTURE_PROVIDER');
    assert.equal(result.providerResult.evidenceMode, 'FIXTURE_EXPECTATION');
    assert.equal(result.providerResult.providerId, 'REFERENCE_QUARRY_PERCEPTION');
    assert.equal(result.providerResult.providerVersion, '1.1.0-reference');
    assert.equal(result.anchors.length, 1);
    assert.equal(result.anchors[0].geometryKind, 'WHOLE_IMAGE');
    assert.equal(result.observations.length, 35);
    assert.equal(result.providerResult.occurrenceCandidates.length, 20);
    assert.equal(result.alternativeSets.length, 10);
    assert.equal(result.relationCandidates.length, 10);
    assert.equal(result.attempt.completion?.status, 'PARTIAL');
    assert.equal(result.attempt.completion?.failureStage, 'RESULT_MATERIALIZATION');

    const textValues = result.observations.filter((item) => item.observationKind === 'TEXT_LITERAL_CANDIDATE').map((item) => item.observedValue);
    for (const required of ['Customer','Manager','Worker','Place Order','Verify Customer Identity','Customer Exist?','Create Customer Account','On Next Wednesday','Forward Order','Arrange Delivery','Deliver Water','Purchase Order [Completed]']) {
      assert.ok(textValues.includes(required), `missing fixture perception text ${required}`);
    }

    const observationValues = result.observations.map((item) => item.observedValue);
    assert.ok(observationValues.includes('START_EVENT_LIKE'));
    assert.ok(observationValues.includes('TIME_INTERMEDIATE_EVENT_LIKE'));
    assert.ok(observationValues.includes('ACTIVITY_WITH_COLLAPSED_MARKER'));
    assert.ok(observationValues.includes('END_EVENT_LIKE'));
    assert.ok(result.observations.some((item) => item.observationKind === 'SPATIAL_ATTACHMENT' && (item.observedValue as any)?.role === 'Worker' && (item.observedValue as any)?.activity === 'Deliver Water'));

    const occurrenceByKey = new Map(result.providerResult.occurrenceCandidates.map((item) => [item.providerOccurrenceKey, item]));
    assert.equal(occurrenceByKey.get('customer-start')?.candidateSemanticType, 'EVENT');
    assert.equal(occurrenceByKey.get('company-end')?.candidateSemanticType, 'END');
    assert.equal(occurrenceByKey.get('on-next-wednesday')?.propertyCandidates?.some((item) => item.propertyPath === 'propertyValues.waitKind' && item.literalValue === 'CALENDAR_TIME'), true);
    assert.equal(occurrenceByKey.get('arrange-delivery')?.propertyCandidates?.some((item) => item.propertyPath === 'propertyValues.boundaryMeaning' && item.literalValue === 'COLLAPSED_SUBPROCESS'), true);
    assert.equal(occurrenceByKey.get('deliver-water')?.propertyCandidates?.some((item) => item.propertyPath === 'propertyValues.actor' && item.literalValue === 'Worker'), true);

    for (const set of result.alternativeSets) {
      const serialized = JSON.stringify(set);
      assert.ok(set.modelPreferredAlternativeId);
      assert.equal('selectionState' in (set as any), false);
      assert.equal('selectedAlternativeId' in (set as any), false);
      assert.equal('selectionAuthorityRef' in (set as any), false);
      assert.equal(serialized.includes('human-confirmed'), false);
    }
    assert.ok(result.attempt.diagnostics.some((item) => item.code === 'FIXTURE_PROVIDER_NOT_REAL_VISION'));
    assert.ok(result.attempt.diagnostics.some((item) => item.code === 'FIXTURE_SOURCE_RECORD_BYTE_IDENTITY_MISMATCH'));
    assert.ok(result.attempt.diagnostics.some((item) => item.code === 'COMMON_EVIDENCE_MATERIALIZATION_PENDING'));
    assert.equal(repo.listByKind('PerceptionAlternativeDecision').length, 0);
    assert.equal(repo.listByKind('SourceEvidenceGraph').length, 0);
    assert.equal(repo.listByKind('CandidateSemanticScope').length, 0);
    assert.equal(repo.listByKind('ProcessRevision').length, 0);
  });
});

test('I1B unsupported image digest remains preserved but produces NO_RESULT and no fake perception', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const modified = Buffer.from(bytes); modified[modified.length - 1] ^= 0x01;
    const intake = intakePngUpload(repo, byteStore, modified, { receivedAt: '2026-08-19T23:22:00.000Z' });
    assert.notEqual(intake.representation.contentHash, QUARRY_02_VERIFIED_SHA256);
    const result = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), { now: '2026-08-19T23:22:01.000Z' });
    assert.equal(result.providerResult.status, 'NO_RESULT');
    assert.equal(result.providerResult.occurrenceCandidates.length, 0);
    assert.equal(result.anchors.length, 0);
    assert.equal(result.observations.length, 0);
    assert.equal(result.alternativeSets.length, 0);
    assert.equal(result.relationCandidates.length, 0);
    assert.equal(result.attempt.completion?.status, 'PARTIAL');
    assert.ok(result.attempt.diagnostics.some((item) => item.code === 'NO_PERCEPTION_PROVIDER_RESULT'));
    assert.equal(repo.listByKind('SourceRepresentation').length, 1);
    assert.equal(repo.listByKind('PerceptionObservation').length, 0);
    assert.equal(repo.listByKind('SourceEvidenceGraph').length, 0);
    assert.equal(repo.listByKind('ProcessRevision').length, 0);
  });
});

test('I1B repeated perception runs create new immutable AdapterAttempt identities', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const intake = intakePngUpload(repo, byteStore, bytes, { receivedAt: '2026-08-19T23:23:00.000Z' });
    const provider = new ReferenceQuarryPerceptionProvider();
    const first = runImagePerception(repo, intake, provider, { now: '2026-08-19T23:23:01.000Z' });
    const second = runImagePerception(repo, intake, provider, { now: '2026-08-19T23:24:01.000Z' });
    assert.notEqual(first.attempt.start.id, second.attempt.start.id);
    assert.equal(first.attempt.start.inputFingerprint, second.attempt.start.inputFingerprint);
    assert.equal(repo.listByKind('AdapterAttemptStart').length, 2);
    assert.equal(repo.listByKind('PerceptionObservation').length, 70);
  });
});