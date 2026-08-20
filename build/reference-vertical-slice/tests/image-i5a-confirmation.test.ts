import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  LocalImageByteStore,
  ReferenceQuarryPerceptionProvider,
  intakePngUpload,
  runImagePerception,
} from '../packages/image-perception/src/index.ts';
import { normalizeAndValidateImageResult } from '../packages/application/src/image-semantic.ts';
import { initializeReview } from '../packages/application/src/review.ts';
import { applyClaimConfirmation } from '../packages/application/src/semantic-review.ts';
import type { ReviewCommand } from '../packages/review/src/types.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

function withFixture<T>(fn: (ctx: {
  repo: SqliteDocumentStore;
  byteStore: LocalImageByteStore;
  bytes: Buffer;
}) => T): T {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i5a-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  try { return fn({ repo, byteStore, bytes }); }
  finally { repo.close(); rmSync(runtimeDir, { recursive: true, force: true }); }
}

function prepare(repo: SqliteDocumentStore, byteStore: LocalImageByteStore, bytes: Buffer) {
  const intake = intakePngUpload(repo, byteStore, bytes, {
    receivedAt: '2026-08-20T04:00:00.000Z',
    declaredName: 'Quarry 02 — Aqua Distilled Water Order & Delivery',
  });
  const perception = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), {
    now: '2026-08-20T04:00:01.000Z',
    materializeCommonEvidence: true,
  });
  assert.ok(perception.attempt.result);
  const semantic = normalizeAndValidateImageResult(repo, perception.attempt.result!.id, {
    normalizedAt: '2026-08-20T04:00:02.000Z',
    assessedAt: '2026-08-20T04:00:03.000Z',
  });
  const review = initializeReview(repo, semantic.normalization.processRevision, semantic.validation, {
    createdAt: '2026-08-20T04:00:04.000Z',
    createdBy: 'image-reviewer',
    sourceRepresentationRefs: [intake.representation.id],
    adapterResultContextRefs: [perception.attempt.result!.id],
  });
  return { intake, perception, semantic, review };
}

function confirmationCommand(prepared: ReturnType<typeof prepare>, selectedClaimRefs: string[]): ReviewCommand {
  const selectedSubjects = [...new Set(prepared.semantic.normalization.processRevision.semanticClaims
    .filter((claim) => selectedClaimRefs.includes(claim.id))
    .map((claim) => claim.subjectRef))];
  return {
    id: createOpaqueId('review', `image-i5a-confirm:${prepared.semantic.normalization.processRevision.id}:${selectedClaimRefs.length}`),
    clientRequestKey: `image-i5a-confirm-${prepared.semantic.normalization.processRevision.id}-${selectedClaimRefs.length}`,
    reviewWorkspaceDefinitionId: prepared.review.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: prepared.review.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: prepared.review.context.baselineBundle.id,
    primarySemanticScopeRef: prepared.semantic.validation.assessment.primaryScopeRef,
    targetSemanticScopeRefs: [prepared.semantic.validation.assessment.primaryScopeRef],
    actionKind: 'CONFIRM',
    targetSubjectRefs: selectedSubjects,
    selectedClaimRefs: selectedClaimRefs as any,
    rationale: 'Reviewer explicitly accepts the selected image-derived semantic claims as business meaning.',
    authorityRef: 'reference-image-business-reviewer',
    requestedBy: 'image-reviewer',
    requestedAt: '2026-08-20T04:00:05.000Z',
  };
}

test('I5A-01 initializes frozen Phase-3 review directly from image-derived I4 semantics', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    assert.equal(prepared.semantic.normalization.processRevision.semanticClaims.every((claim) => claim.truthClass === 'INFERRED'), true);
    assert.equal(prepared.review.context.workspaceRevision.baselineProcessRevisionId, prepared.semantic.normalization.processRevision.id);
    assert.equal(prepared.review.context.workspaceDefinition.sourceRepresentationIds.includes(prepared.intake.representation.id), true);
    assert.equal(prepared.review.context.workspaceRevision.adapterResultContextRefs.includes(prepared.perception.attempt.result!.id), true);
    assert.equal(repo.listByKind('CanvasRevision').length, 0);
  });
});

test('I5A-01 explicit confirmation creates reviewer-authored evidence and a new confirmed ProcessRevision without mutating image/perception history', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    const allInferred = prepared.semantic.normalization.processRevision.semanticClaims
      .filter((claim) => claim.truthClass === 'INFERRED')
      .map((claim) => claim.id);
    const beforeAttempts = repo.listByKind('AdapterAttemptStart').length;
    const beforeObservations = repo.listByKind('PerceptionObservation').length;
    const beforeAlternatives = repo.listByKind('PerceptionAlternativeSet').length;
    const beforeImageHash = prepared.intake.representation.contentHash;

    const result = applyClaimConfirmation(
      repo,
      prepared.review.context,
      prepared.semantic.normalization.processRevision,
      prepared.semantic.validation,
      confirmationCommand(prepared, allInferred),
    );

    assert.equal(result.application.result, 'APPLIED');
    assert.ok(result.candidateProcessRevision);
    assert.ok(result.candidateValidation);
    assert.ok(result.nextContext);
    assert.equal(result.candidateProcessRevision!.parentRevisionIds[0], prepared.semantic.normalization.processRevision.id);
    assert.equal(result.candidateProcessRevision!.derivationKind, 'REINTERPRETATION');
    assert.notEqual(result.candidateProcessRevision!.id, prepared.semantic.normalization.processRevision.id);
    assert.equal(result.confirmedClaims.length, allInferred.length);
    assert.equal(result.confirmations.length, allInferred.length);
    assert.equal(result.candidateProcessRevision!.semanticClaims.every((claim) => claim.truthClass === 'CONFIRMED'), true);
    assert.equal(result.candidateProcessRevision!.nodes.every((node) => node.truthClass === 'CONFIRMED'), true);
    assert.equal(result.candidateProcessRevision!.edges.every((edge) => edge.truthClass === 'CONFIRMED'), true);
    assert.equal(result.authoredRevision?.sourceCanvasRevisionRef, undefined, 'image confirmation must not manufacture Canvas source history');
    assert.equal(result.authoredRevision?.confirmationRefs.length, allInferred.length);

    assert.equal(repo.listByKind('AdapterAttemptStart').length, beforeAttempts);
    assert.equal(repo.listByKind('PerceptionObservation').length, beforeObservations);
    assert.equal(repo.listByKind('PerceptionAlternativeSet').length, beforeAlternatives);
    assert.equal(prepared.intake.representation.contentHash, beforeImageHash);
    assert.equal(repo.listByKind('CanvasRevision').length, 0);

    const historical = repo.get<any>(prepared.semantic.normalization.processRevision.id)?.payload;
    assert.equal(historical.semanticClaims.every((claim: any) => claim.truthClass === 'INFERRED'), true, 'I4 inferred revision must remain historical truth');
  });
});

test('I5A-01 full confirmation resolves source-confirmation findings but preserves real semantic blockers', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    const allInferred = prepared.semantic.normalization.processRevision.semanticClaims
      .filter((claim) => claim.truthClass === 'INFERRED')
      .map((claim) => claim.id);
    const result = applyClaimConfirmation(repo, prepared.review.context, prepared.semantic.normalization.processRevision, prepared.semantic.validation, confirmationCommand(prepared, allInferred));
    const validation = result.candidateValidation!;
    const codes = validation.findings.map((finding) => finding.code);

    assert.equal(codes.includes('SV-SRC-001'), false);
    assert.ok(codes.includes('SV-CMP-001'));
    assert.ok(codes.includes('SV-SUB-002'));
    assert.equal(codes.filter((code) => code === 'SV-CFL-001').length, 2);
    assert.equal(validation.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
    assert.equal(validation.assessment.semanticVerdict, 'INCOMPLETE');
    assert.equal(validation.assessment.supersedesAssessmentId, prepared.semantic.validation.assessment.id);
    assert.equal(result.findingDispositions.length > 0, true);
  });
});

test('I5A-01 partial confirmation leaves unselected inferred meaning unresolved', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    const selected = prepared.semantic.normalization.processRevision.semanticClaims
      .filter((claim) => claim.truthClass === 'INFERRED')
      .slice(0, 1)
      .map((claim) => claim.id);
    const result = applyClaimConfirmation(repo, prepared.review.context, prepared.semantic.normalization.processRevision, prepared.semantic.validation, confirmationCommand(prepared, selected));

    assert.equal(result.application.result, 'APPLIED');
    assert.equal(result.candidateProcessRevision!.semanticClaims.some((claim) => claim.truthClass === 'INFERRED'), true);
    assert.equal(result.candidateValidation!.findings.some((finding) => finding.code === 'SV-SRC-001'), true);
    assert.equal(result.candidateValidation!.assessment.executionReadiness, 'INSUFFICIENT_DETAIL');
  });
});

test('I5A-01 does not authorize freeze/capability/execution/Temporal after confirmation', () => {
  withFixture(({ repo, byteStore, bytes }) => {
    const prepared = prepare(repo, byteStore, bytes);
    const allInferred = prepared.semantic.normalization.processRevision.semanticClaims.map((claim) => claim.id);
    applyClaimConfirmation(repo, prepared.review.context, prepared.semantic.normalization.processRevision, prepared.semantic.validation, confirmationCommand(prepared, allInferred));

    assert.equal(repo.listByKind('SemanticFreezeRecord').length, 0);
    assert.equal(repo.listByKind('CapabilityDesignRevision').length, 0);
    assert.equal(repo.listByKind('CapabilityBindingRevision').length, 0);
    assert.equal(repo.listByKind('ExecutionPlanRevision').length, 0);
    assert.equal(repo.listByKind('TemporalMappingRevision').length, 0);
    assert.equal(repo.listByKind('DeploymentRevision').length, 0);
  });
});
