import { createOpaqueId } from '../../packages/foundation/src/ids.ts';
import type { SqliteDocumentStore } from '../../packages/persistence-sqlite/src/sqlite-document-store.ts';
import type { LocalImageByteStore } from '../../packages/image-perception/src/byte-store.ts';
import { applyFreezeCommand } from '../../packages/application/src/review.ts';
import type { FreezeRequestPayload, ReviewCommand, ScopeFreezeRequest } from '../../packages/review/src/types.ts';
import { buildReadyQuarry02ImageReview } from './quarry02-ready-image.ts';

export function buildFrozenQuarry02ImageReview(repo: SqliteDocumentStore, byteStore: LocalImageByteStore, bytes: Buffer) {
  const ready = buildReadyQuarry02ImageReview(repo, byteStore, bytes);
  const current = ready.current;
  const scope = current.validation.assessment.primaryScopeRef;
  const command: ReviewCommand = {
    id: createOpaqueId('review', `generic-freeze:${current.process.id}`),
    clientRequestKey: `generic-freeze-${current.process.id}`,
    reviewWorkspaceDefinitionId: current.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: current.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: current.context.baselineBundle.id,
    primarySemanticScopeRef: scope,
    targetSemanticScopeRefs: [scope],
    actionKind: 'REQUEST_FREEZE',
    targetSubjectRefs: [],
    actionPayloadRef: createOpaqueId('review', `generic-freeze-payload:${current.process.id}`),
    rationale: 'Freeze exact reviewed Quarry-02 semantic baseline for generic downstream execution design.',
    authorityRef: 'reference-image-business-owner',
    requestedBy: 'image-reviewer',
    requestedAt: '2026-08-20T12:00:00.000Z',
  };
  const requestId = createOpaqueId('review', `generic-freeze-scope:${current.process.id}`);
  const payload: FreezeRequestPayload = {
    id: command.actionPayloadRef!,
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
  const result = applyFreezeCommand(repo, current.context, command, payload, [request], [current.validation.assessment]);
  if (result.freezeApplication.result !== 'FROZEN' || !result.freezeRecord) throw new Error(`Quarry-02 freeze failed: ${result.freezeApplication.result}`);
  return { ready, freeze: result.freezeRecord, scopeFreeze: result.scopeRecords[0] };
}
