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

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

function withImageStore<T>(fn: (ctx: { repo: SqliteDocumentStore; byteStore: LocalImageByteStore; bytes: Buffer }) => T): T {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i2-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  try { return fn({ repo, byteStore, bytes }); }
  finally { repo.close(); rmSync(runtimeDir, { recursive: true, force: true }); }
}

test('I2 full image adapter materializes common source evidence and succeeds without Canonical output', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const intake = intakePngUpload(repo, byteStore, bytes, {
      receivedAt: '2026-08-19T23:30:00.000Z',
      declaredName: 'Quarry 02 — Aqua Distilled Water Order & Delivery',
    });
    const result = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), {
      now: '2026-08-19T23:30:01.000Z',
      materializeCommonEvidence: true,
    });

    assert.equal(result.attempt.completion?.status, 'SUCCEEDED');
    assert.ok(result.attempt.result);
    assert.ok(result.commonEvidence);
    assert.equal(result.commonEvidence?.planes.length, 4);
    assert.equal(result.commonEvidence?.properties.length, 10);
    assert.equal(result.commonEvidence?.occurrences.length, 20);
    assert.equal(result.commonEvidence?.relationships.length, 10);
    assert.equal(result.commonEvidence?.classification.artifactClass, 'COLLABORATION_DIAGRAM');
    assert.equal(result.commonEvidence?.classification.truthClass, 'INFERRED');
    assert.equal(result.commonEvidence?.scope.kind, 'COLLABORATION');
    assert.equal(result.commonEvidence?.scope.truthClass, 'INFERRED');
    assert.equal(result.attempt.result?.sourceEvidenceGraphIds.length, 1);
    assert.equal(result.attempt.result?.candidateScopeIds.length, 1);
    assert.equal(result.attempt.result?.artifactClassificationIds.length, 1);
    assert.equal(repo.listByKind('SourceEvidenceGraph').length, 1);
    assert.equal(repo.listByKind('CandidateSemanticScope').length, 1);
    assert.equal(repo.listByKind('SourcePropertyEvidenceDescriptor').length, 10);
    assert.equal(repo.listByKind('ProcessRevision').length, 0, 'I2 common evidence must not silently become Canonical');
  });
});

test('I2 raster occurrences, relationships and property evidence never fabricate native source IDs or source-asserted semantics', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const intake = intakePngUpload(repo, byteStore, bytes, { receivedAt: '2026-08-19T23:31:00.000Z' });
    const result = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), {
      now: '2026-08-19T23:31:01.000Z',
      materializeCommonEvidence: true,
    });
    const common = result.commonEvidence!;

    for (const occurrence of common.occurrences) {
      assert.equal('nativeSourceId' in occurrence, false, 'raster candidate must not masquerade as a native source object');
      assert.equal('sourceAssertedType' in occurrence, false, 'fixture/provider interpretation is not source-asserted type');
      assert.ok(occurrence.sourceExtensionRefs.length > 0, 'perceived occurrence must retain perception lineage');
    }
    for (const relation of common.relationships) {
      assert.equal('nativeSourceId' in relation, false);
      assert.equal('sourceAssertedRole' in relation, false, 'provider role preference is not source-asserted relationship role');
      assert.ok(relation.candidateRelationshipRole);
      assert.ok(relation.sourceExtensionRefs.length >= 3, 'relationship must retain candidate/observation/anchor lineage');
      assert.equal(relation.sourceEndpointState, 'SET');
      assert.equal(relation.targetEndpointState, 'SET');
    }
    for (const property of common.properties) {
      assert.equal('nativeSourceId' in property, false, 'raster property evidence must not fabricate native source identity');
      assert.equal(property.sourceRepresentationId, intake.representation.id);
      assert.equal(property.sourceState, 'SET');
      assert.ok((property.sourceExtensionRefs?.length ?? 0) >= 2, 'raster property evidence must retain perception observation + anchor lineage');
      assert.ok(common.graph.sourceExtensionRefs.includes(property.id), 'property evidence must remain addressable from the common graph');
    }

    const roles = common.relationships.map((item) => item.candidateRelationshipRole);
    assert.ok(roles.includes('MESSAGE_INTERACTION_CANDIDATE'));
    assert.ok(roles.includes('CONDITIONAL_FLOW_CANDIDATE'));
    assert.equal(repo.listByKind('PerceptionAlternativeDecision').length, 0, 'I2 does not convert model preference into human confirmation');
  });
});

test('I2 preserves visible START/END, time class, collapsed boundary and Worker responsibility as property-level INFERRED evidence candidates', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const intake = intakePngUpload(repo, byteStore, bytes, { receivedAt: '2026-08-19T23:31:30.000Z' });
    const result = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), {
      now: '2026-08-19T23:31:31.000Z',
      materializeCommonEvidence: true,
    });
    const common = result.commonEvidence!;
    const byPathValue = (path: string, value: unknown) => common.properties.find((item) => item.propertyPath === path && item.literalValue === value);

    const start = byPathValue('propertyValues.eventRole', 'START');
    const end = byPathValue('propertyValues.eventRole', 'END');
    const wait = byPathValue('propertyValues.waitKind', 'CALENDAR_TIME');
    const subprocess = byPathValue('propertyValues.boundaryMeaning', 'COLLAPSED_SUBPROCESS');
    const worker = byPathValue('propertyValues.actor', 'Worker');
    assert.ok(start && end && wait && subprocess && worker);

    for (const item of [start!, end!, wait!, subprocess!, worker!]) {
      assert.equal('nativeSourceId' in item, false);
      assert.ok(item.sourceExtensionRefs?.some((ref) => result.observations.some((obs) => obs.id === ref)), 'property candidate must trace to perception observation');
      assert.ok(item.sourceExtensionRefs?.includes(result.anchors[0].id), 'property candidate must trace to visual anchor');
    }

    const startOccurrence = common.occurrences.find((item) => item.candidateSemanticType === 'EVENT' && item.propertyEvidenceRefs.includes(start!.id));
    const endOccurrence = common.occurrences.find((item) => item.candidateSemanticType === 'END' && item.propertyEvidenceRefs.includes(end!.id));
    const waitOccurrence = common.occurrences.find((item) => item.literalLabel === 'On Next Wednesday' && item.propertyEvidenceRefs.includes(wait!.id));
    const deliveryOccurrence = common.occurrences.find((item) => item.literalLabel === 'Deliver Water' && item.propertyEvidenceRefs.includes(worker!.id));
    assert.ok(startOccurrence && endOccurrence && waitOccurrence && deliveryOccurrence);
    assert.equal(common.scope.includedOccurrenceRefs.includes(startOccurrence!.sourceOccurrenceId), true);
    assert.equal(common.scope.includedOccurrenceRefs.includes(endOccurrence!.sourceOccurrenceId), true);
  });
});

test('I2 keeps annotation context outside the candidate collaboration scope while preserving it in evidence', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const intake = intakePngUpload(repo, byteStore, bytes, { receivedAt: '2026-08-19T23:32:00.000Z' });
    const result = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), {
      now: '2026-08-19T23:32:01.000Z',
      materializeCommonEvidence: true,
    });
    const common = result.commonEvidence!;
    const annotation = common.occurrences.find((item) => item.literalLabel?.startsWith('Over 90%'));
    assert.ok(annotation, 'phone/email annotation must remain addressable source evidence');
    assert.ok(common.scope.excludedOccurrenceRefs.includes(annotation!.sourceOccurrenceId));
    assert.equal(common.scope.includedOccurrenceRefs.includes(annotation!.sourceOccurrenceId), false);
    assert.ok(common.graph.occurrenceIds.includes(annotation!.sourceOccurrenceId));
    assert.ok(common.graph.sourceExtensionRefs.includes(result.anchors[0].id));
    assert.ok(common.graph.sourceExtensionRefs.some((id) => result.observations.some((obs) => obs.id === id)));
  });
});

test('I2 is a new immutable attempt after I1 PARTIAL; it never mutates the earlier attempt into success', () => {
  withImageStore(({ repo, byteStore, bytes }) => {
    const intake = intakePngUpload(repo, byteStore, bytes, { receivedAt: '2026-08-19T23:33:00.000Z' });
    const provider = new ReferenceQuarryPerceptionProvider();
    const i1 = runImagePerception(repo, intake, provider, { now: '2026-08-19T23:33:01.000Z' });
    const i2 = runImagePerception(repo, intake, provider, {
      now: '2026-08-19T23:34:01.000Z',
      materializeCommonEvidence: true,
    });

    assert.equal(i1.attempt.completion?.status, 'PARTIAL');
    assert.equal(i2.attempt.completion?.status, 'SUCCEEDED');
    assert.notEqual(i1.attempt.start.id, i2.attempt.start.id);
    assert.equal(i1.attempt.start.inputFingerprint, i2.attempt.start.inputFingerprint);
    assert.equal(repo.listByKind('AdapterAttemptStart').length, 2);
    assert.equal(repo.listByKind('AdapterAttemptCompletion').length, 2);
    const completions = repo.listByKind<any>('AdapterAttemptCompletion').map((item) => item.payload.status).sort();
    assert.deepEqual(completions, ['PARTIAL', 'SUCCEEDED']);
    assert.equal(repo.listByKind('SourceEvidenceGraph').length, 1, 'only the I2 full attempt owns common graph materialization');
  });
});