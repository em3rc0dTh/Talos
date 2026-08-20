import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createOpaqueId } from '../packages/foundation/src/ids.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { applyFreezeCommand } from '../packages/application/src/review.ts';
import type { FreezeRequestPayload, ReviewCommand, ScopeFreezeRequest } from '../packages/review/src/types.ts';
import { buildReadyQuarry02ImageReview } from './helpers/quarry02-ready-image.ts';

const fixturePath = path.resolve(process.cwd(), '../../brainstorming/mining-site/quarry-02-water-order-delivery/quarry-02.png');

function freezeRequest(current: ReturnType<typeof buildReadyQuarry02ImageReview>['current']) {
  const scope = current.validation.assessment.primaryScopeRef;
  const commandId = createOpaqueId('review', `i5b00:image-freeze:${current.process.id}`);
  const payloadId = createOpaqueId('review', `i5b00:image-freeze-payload:${current.process.id}`);
  const requestId = createOpaqueId('review', `i5b00:image-freeze-scope:${current.process.id}`);
  const command: ReviewCommand = {
    id: commandId,
    clientRequestKey: `i5b00-image-freeze-${current.process.id}`,
    reviewWorkspaceDefinitionId: current.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: current.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: current.context.baselineBundle.id,
    primarySemanticScopeRef: scope,
    targetSemanticScopeRefs: [scope],
    actionKind: 'REQUEST_FREEZE',
    targetSubjectRefs: [],
    actionPayloadRef: payloadId,
    rationale: 'Freeze the exact reviewer-authorized image-derived semantic baseline for automation design handoff.',
    authorityRef: 'reference-image-business-owner',
    requestedBy: 'image-reviewer',
    requestedAt: '2026-08-20T08:10:00.000Z',
  };
  const payload: FreezeRequestPayload = {
    id: payloadId,
    reviewCommandId: command.id,
    freezeKind: 'AUTOMATION_DESIGN_HANDOFF',
    scopeRequestRefs: [requestId],
    requestedAt: command.requestedAt,
  };
  const request: ScopeFreezeRequest = {
    id: requestId,
    freezeRequestPayloadId: payload.id,
    semanticScopeRef: scope,
    requestedDisposition: 'ACCEPTED',
    referencedValidationAssessmentRefs: [current.validation.assessment.id],
  };
  return { command, payload, request };
}

test('I5B-00 exact image-derived ready baseline freezes source-agnostically with backward lineage and no runtime handoff', () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i5b00-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  try {
    const ready = buildReadyQuarry02ImageReview(repo, byteStore, bytes);
    const current = ready.current;
    assert.equal(current.validation.assessment.executionReadiness, 'READY_FOR_AUTOMATION_DESIGN');

    const before = {
      processRevisions: repo.listByKind('ProcessRevision').length,
      attempts: repo.listByKind('AdapterAttemptStart').length,
      observations: repo.listByKind('PerceptionObservation').length,
      alternatives: repo.listByKind('PerceptionAlternativeSet').length,
      sourceArtifacts: repo.listByKind('SourceArtifact').length,
      sourceRepresentations: repo.listByKind('SourceRepresentation').length,
      canvasRevisions: repo.listByKind('CanvasRevision').length,
      capabilityDesign: repo.listByKind('CapabilityDesignRevision').length,
      executionPlans: repo.listByKind('ExecutionPlanRevision').length,
      temporalMappings: repo.listByKind('TemporalMappingRevision').length,
    };
    const sourceHash = ready.intake.representation.contentHash;

    const request = freezeRequest(current);
    const result = applyFreezeCommand(
      repo,
      current.context,
      request.command,
      request.payload,
      [request.request],
      [current.validation.assessment],
    );

    assert.equal(result.commandApplication.result, 'APPLIED');
    assert.equal(result.freezeApplication.result, 'FROZEN');
    assert.ok(result.freezeRecord);
    assert.equal(result.freezeRecord!.freezeKind, 'AUTOMATION_DESIGN_HANDOFF');
    assert.equal(result.freezeRecord!.authorityRef, 'reference-image-business-owner');
    assert.equal(result.freezeRecord!.processRevisionId, current.process.id);
    assert.equal(result.freezeRecord!.reviewWorkspaceRevisionId, current.context.workspaceRevision.id);
    assert.equal(result.freezeRecord!.reviewBaselineBundleId, current.context.baselineBundle.id);
    assert.deepEqual(result.scopeRecords[0].validationAssessmentRefs, [current.validation.assessment.id]);
    assert.equal(result.scopeRecords[0].disposition, 'ACCEPTED');
    assert.equal(result.scopeRecords[0].visualScopeBindingRef, current.context.scopeBinding.id);
    assert.equal(result.scopeRecords[0].explanationDraftSnapshotRef, current.context.scopeBinding.explanationDraftSnapshotRef);

    // Backward lineage from freeze to review baseline and then source/image context.
    const persistedBaseline = repo.get<any>(result.freezeRecord!.reviewBaselineBundleId)?.payload;
    const persistedWorkspace = repo.get<any>(result.freezeRecord!.reviewWorkspaceRevisionId)?.payload;
    const persistedProcess = repo.get<any>(result.freezeRecord!.processRevisionId)?.payload;
    assert.equal(persistedBaseline?.baselineProcessRevisionId, current.process.id);
    assert.equal(persistedWorkspace?.baselineValidationAssessmentId, current.validation.assessment.id);
    assert.equal(persistedProcess?.id, current.process.id);
    assert.ok(current.context.workspaceDefinition.sourceArtifactIds.includes(ready.intake.artifact.id));
    assert.ok(current.context.workspaceDefinition.sourceRepresentationIds.includes(ready.intake.representation.id));
    assert.ok(current.process.sourceArtifactIds.includes(ready.intake.artifact.id));
    assert.ok(current.context.workspaceRevision.activeReviewAuthoredSourceRevisionId);
    assert.ok(repo.get(current.context.workspaceRevision.activeReviewAuthoredSourceRevisionId!));

    // Freeze is an immutable review/control artifact only.
    assert.equal(repo.listByKind('ProcessRevision').length, before.processRevisions);
    assert.equal(repo.listByKind('AdapterAttemptStart').length, before.attempts);
    assert.equal(repo.listByKind('PerceptionObservation').length, before.observations);
    assert.equal(repo.listByKind('PerceptionAlternativeSet').length, before.alternatives);
    assert.equal(repo.listByKind('SourceArtifact').length, before.sourceArtifacts);
    assert.equal(repo.listByKind('SourceRepresentation').length, before.sourceRepresentations);
    assert.equal(repo.listByKind('CanvasRevision').length, before.canvasRevisions);
    assert.equal(ready.intake.representation.contentHash, sourceHash);
    assert.equal(repo.listByKind('CapabilityDesignRevision').length, before.capabilityDesign);
    assert.equal(repo.listByKind('ExecutionPlanRevision').length, before.executionPlans);
    assert.equal(repo.listByKind('TemporalMappingRevision').length, before.temporalMappings);
    assert.equal(repo.listByKind('RuntimePolicyRevision').length, 0);
    assert.equal(repo.listByKind('DeploymentRevision').length, 0);
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length, 0);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});

test('I5B-00 ready image freeze without authority is rejected and persists no SemanticFreezeRecord', () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-image-i5b00-auth-'));
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-state.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const bytes = readFileSync(fixturePath);
  try {
    const ready = buildReadyQuarry02ImageReview(repo, byteStore, bytes);
    const request = freezeRequest(ready.current);
    delete (request.command as any).authorityRef;
    const result = applyFreezeCommand(
      repo,
      ready.current.context,
      request.command,
      request.payload,
      [request.request],
      [ready.current.validation.assessment],
    );
    assert.equal(result.commandApplication.result, 'REJECTED_AUTHORITY');
    assert.equal(result.freezeApplication.result, 'REJECTED_AUTHORITY');
    assert.equal(result.freezeRecord, undefined);
    assert.equal(repo.listByKind('SemanticFreezeRecord').length, 0);
  } finally {
    repo.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
