import { createOpaqueId, type OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  alignBpmnRevisionToCanonical,
  confirmBusinessProcess,
  type BpmnProcessRevision,
  type BusinessProcessConfirmationRecord,
} from '../../review/src/index.ts';
import type { ReviewContextBundle } from '../../review/src/workspace.ts';
import type { ReviewCommand } from '../../review/src/types.ts';
import type { ProcessRevision, ValidationBundle } from '../../semantic-core/src/types.ts';
import { applyClaimConfirmation, type ClaimConfirmationResult } from './semantic-review.ts';

const BPMN_WORKSPACE_SCHEMA = 'talos-bpmn-workspace-v0.1';

export interface ConfirmImageBusinessProcessInput {
  currentBpmnRevision: BpmnProcessRevision;
  currentProcessRevision: ProcessRevision;
  currentValidation: ValidationBundle;
  currentReviewContext: ReviewContextBundle;
  confirmedBy: string;
  authorityRef: string;
  confirmedAt?: string;
  rationale?: string;
}

export interface ConfirmImageBusinessProcessResult {
  previousBpmnRevision: BpmnProcessRevision;
  confirmedBpmnRevision: BpmnProcessRevision;
  canonicalConfirmation: ClaimConfirmationResult;
  confirmedProcessRevision: ProcessRevision;
  confirmedValidation: ValidationBundle;
  confirmation: BusinessProcessConfirmationRecord;
}

function appendBpmnRevision(repo: ImmutableDocumentRepository, revision: BpmnProcessRevision): void {
  repo.append({
    id: revision.id as OpaqueId,
    aggregateKind: 'BpmnProcessRevision',
    schemaVersion: BPMN_WORKSPACE_SCHEMA,
    payload: revision,
    ...(revision.parentBpmnRevisionId ? { parentId: revision.parentBpmnRevisionId as OpaqueId } : {}),
    createdAt: revision.createdAt,
  });
}

function appendConfirmation(repo: ImmutableDocumentRepository, confirmation: BusinessProcessConfirmationRecord): void {
  repo.append({
    id: confirmation.id as OpaqueId,
    aggregateKind: 'BusinessProcessConfirmationRecord',
    schemaVersion: BPMN_WORKSPACE_SCHEMA,
    payload: confirmation,
    parentId: confirmation.bpmnRevisionId as OpaqueId,
    createdAt: confirmation.confirmedAt,
  });
}

function nextBpmnRevisionNumber(repo: ImmutableDocumentRepository): number {
  return repo.listByKind<BpmnProcessRevision>('BpmnProcessRevision')
    .reduce((highest, document) => Math.max(highest, document.payload.revisionNumber), 0) + 1;
}

/**
 * I7C-05 authority bridge for an image-interpreted BPMN revision.
 *
 * Saying “Yes, this is my process” confirms the exact inferred claim set through
 * the existing source-family-neutral semantic review contract. That produces a
 * new HUMAN_CONFIRMATION ProcessRevision. The same BPMN XML is then aligned to
 * that new canonical revision and only that exact aligned revision receives the
 * BusinessProcessConfirmationRecord.
 *
 * Nothing here creates a semantic freeze or execution/deployment authority.
 */
export function confirmImageInterpretedBusinessProcess(
  repo: ImmutableDocumentRepository,
  input: ConfirmImageBusinessProcessInput,
): ConfirmImageBusinessProcessResult {
  const at = input.confirmedAt ?? new Date().toISOString();
  const bpmn = input.currentBpmnRevision;
  const process = input.currentProcessRevision;
  const validation = input.currentValidation;
  const context = input.currentReviewContext;

  if (bpmn.sourceRoute !== 'IMAGE_INTERPRETATION') {
    throw new TypeError('Image business-process confirmation requires IMAGE_INTERPRETATION BPMN');
  }
  if (bpmn.state !== 'DRAFT') throw new TypeError('Only a DRAFT image BPMN revision may be confirmed');
  if (bpmn.canonicalAlignmentStatus !== 'ALIGNED_TO_CANONICAL'
      || bpmn.canonicalProcessRevisionId !== process.id) {
    throw new TypeError('Image BPMN must be aligned to the exact current inferred ProcessRevision before confirmation');
  }
  if (validation.assessment.processRevisionId !== process.id) {
    throw new TypeError('Image BPMN confirmation requires validation of the exact current ProcessRevision');
  }
  if (context.workspaceRevision.baselineProcessRevisionId !== process.id
      || context.baselineBundle.baselineProcessRevisionId !== process.id) {
    throw new TypeError('Image BPMN confirmation requires the exact current review baseline');
  }
  if (!input.authorityRef.trim()) throw new TypeError('Image BPMN confirmation requires authorityRef');

  const inferredClaims = process.semanticClaims.filter((claim) => claim.truthClass === 'INFERRED');
  if (inferredClaims.length === 0) {
    throw new TypeError('Image BPMN confirmation requires at least one current INFERRED semantic claim');
  }
  const selectedClaimRefs = inferredClaims.map((claim) => claim.id);
  const targetSubjectRefs = [...new Set(inferredClaims.map((claim) => claim.subjectRef))];
  const command: ReviewCommand = {
    id: createOpaqueId('review', `image-process-confirm:${bpmn.id}:${process.id}:${input.authorityRef}`),
    clientRequestKey: `image-process-confirm-${bpmn.id}-${process.id}`,
    reviewWorkspaceDefinitionId: context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: context.workspaceRevision.id,
    expectedReviewBaselineBundleId: context.baselineBundle.id,
    primarySemanticScopeRef: validation.assessment.primaryScopeRef,
    targetSemanticScopeRefs: [validation.assessment.primaryScopeRef],
    actionKind: 'CONFIRM',
    targetSubjectRefs,
    selectedClaimRefs,
    rationale: input.rationale ?? 'Business-process owner confirms the exact image-interpreted BPMN and its current inferred business meaning.',
    authorityRef: input.authorityRef,
    requestedBy: input.confirmedBy,
    requestedAt: at,
  };

  const canonicalConfirmation = applyClaimConfirmation(
    repo,
    context,
    process,
    validation,
    command,
  );
  if (canonicalConfirmation.application.result !== 'APPLIED'
      || !canonicalConfirmation.candidateProcessRevision
      || !canonicalConfirmation.candidateValidation
      || !canonicalConfirmation.nextContext) {
    throw new TypeError(`Image canonical confirmation was not applied: ${canonicalConfirmation.application.result}`);
  }

  const confirmedProcessRevision = canonicalConfirmation.candidateProcessRevision;
  const confirmedValidation = canonicalConfirmation.candidateValidation;
  const aligned = alignBpmnRevisionToCanonical(bpmn, {
    canonicalProcessRevisionId: confirmedProcessRevision.id,
    alignedBy: input.confirmedBy,
    alignedAt: at,
    authorityRef: `business-process-confirmation:${input.authorityRef}`,
    revisionNumber: nextBpmnRevisionNumber(repo),
  });
  appendBpmnRevision(repo, aligned);

  const confirmed = confirmBusinessProcess(aligned, {
    canonicalProcessRevisionId: confirmedProcessRevision.id,
    confirmedBy: input.confirmedBy,
    confirmedAt: at,
    authorityRef: input.authorityRef,
    ...(input.rationale ? { rationale: input.rationale } : {}),
  });
  appendConfirmation(repo, confirmed.confirmation);

  return {
    previousBpmnRevision: bpmn,
    confirmedBpmnRevision: confirmed.revision,
    canonicalConfirmation,
    confirmedProcessRevision,
    confirmedValidation,
    confirmation: confirmed.confirmation,
  };
}
