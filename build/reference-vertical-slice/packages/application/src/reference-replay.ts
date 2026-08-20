import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { ProcessRevision } from '../../semantic-core/src/types.ts';
import type { FindingDisposition } from '../../semantic-core/src/finding-disposition.ts';
import type {
  ReviewAuthoredSourceDefinition,
  ReviewAuthoredSourceRevision,
  ReviewBaselineBundle,
  ReviewCommandApplication,
  ReviewConfirmationRecord,
  ReviewProjectionRevision,
  ReviewScopeSurfaceBinding,
  ReviewWorkspaceDefinition,
  ReviewWorkspaceRevision,
  SemanticDiffGuard,
} from '../../review/src/types.ts';
import type { ReviewContextBundle } from '../../review/src/workspace.ts';
import type { CorrectionResult } from './review.ts';
import { loadValidationBundle } from './validation-persistence.ts';

function loadReviewContext(
  repo: ImmutableDocumentRepository,
  workspaceRevisionId: ReviewWorkspaceRevision['id'],
): ReviewContextBundle | undefined {
  const workspaceRevision = repo.get<ReviewWorkspaceRevision>(workspaceRevisionId)?.payload;
  if (!workspaceRevision) return undefined;

  const projectionRevision = workspaceRevision.projectionRevisionId
    ? repo.get<ReviewProjectionRevision>(workspaceRevision.projectionRevisionId)?.payload
    : repo.listByKind<ReviewProjectionRevision>('ReviewProjectionRevision')
      .map((document) => document.payload)
      .find((projection) => projection.reviewWorkspaceRevisionId === workspaceRevision.id);
  if (!projectionRevision) return undefined;

  const baselineBundle = repo.listByKind<ReviewBaselineBundle>('ReviewBaselineBundle')
    .map((document) => document.payload)
    .find((baseline) => baseline.reviewWorkspaceRevisionId === workspaceRevision.id);
  if (!baselineBundle) return undefined;

  const scopeBindingId = baselineBundle.scopeSurfaceBindingRefs[0];
  const scopeBinding = scopeBindingId
    ? repo.get<ReviewScopeSurfaceBinding>(scopeBindingId)?.payload
    : undefined;
  if (!scopeBinding) return undefined;

  const definitionStates = repo.listByKind<ReviewWorkspaceDefinition>('ReviewWorkspaceDefinitionState')
    .map((document) => document.payload)
    .filter((definition) => definition.id === workspaceRevision.reviewWorkspaceDefinitionId);
  const workspaceDefinition = definitionStates.find(
    (definition) => definition.latestWorkspaceRevisionId === workspaceRevision.id,
  ) ?? definitionStates.at(-1);
  if (!workspaceDefinition) return undefined;

  const reviewAuthoredSourceDefinition = repo.get<ReviewAuthoredSourceDefinition>(
    workspaceDefinition.reviewAuthoredSourceDefinitionId,
  )?.payload;
  if (!reviewAuthoredSourceDefinition) return undefined;

  return {
    workspaceDefinition,
    workspaceRevision,
    projectionRevision,
    baselineBundle,
    scopeBinding,
    reviewAuthoredSourceDefinition,
  };
}

export function hydrateReferenceCorrectionReplay(
  repo: ImmutableDocumentRepository,
  replayApplication: ReviewCommandApplication,
): CorrectionResult | undefined {
  if (
    replayApplication.result !== 'IDEMPOTENT_REPLAY'
    || !replayApplication.candidateProcessRevisionRef
    || !replayApplication.candidateValidationAssessmentRef
    || !replayApplication.resultingWorkspaceRevisionRef
  ) {
    return undefined;
  }

  const candidateProcessRevision = repo.get<ProcessRevision>(
    replayApplication.candidateProcessRevisionRef,
  )?.payload;
  const candidateValidation = loadValidationBundle(
    repo,
    replayApplication.candidateValidationAssessmentRef,
  );
  const nextContext = loadReviewContext(
    repo,
    replayApplication.resultingWorkspaceRevisionRef,
  );

  if (!candidateProcessRevision || !candidateValidation || !nextContext) return undefined;

  const diffGuard = replayApplication.semanticDiffGuardRef
    ? repo.get<SemanticDiffGuard>(replayApplication.semanticDiffGuardRef)?.payload
    : undefined;

  let confirmation: ReviewConfirmationRecord | undefined;
  if (replayApplication.reviewAuthoredSourceRevisionRef) {
    const authored = repo.get<ReviewAuthoredSourceRevision>(
      replayApplication.reviewAuthoredSourceRevisionRef,
    )?.payload;
    const confirmationRef = authored?.confirmationRefs[0];
    confirmation = confirmationRef
      ? repo.get<ReviewConfirmationRecord>(confirmationRef)?.payload
      : undefined;
  }

  const findingDisposition = repo.listByKind<FindingDisposition>('FindingDisposition')
    .map((document) => document.payload)
    .find((disposition) => disposition.resultingProcessRevisionRef === candidateProcessRevision.id);

  return {
    application: replayApplication,
    nextContext,
    candidateProcessRevision,
    candidateValidation,
    ...(confirmation ? { confirmation } : {}),
    ...(findingDisposition ? { findingDisposition } : {}),
    ...(diffGuard ? { diffGuard } : {}),
  };
}
