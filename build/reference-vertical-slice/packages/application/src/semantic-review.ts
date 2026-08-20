import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type {
  ProcessDefinition,
  ProcessRevision,
  SemanticClaim,
  ValidationBundle,
} from '../../semantic-core/src/types.ts';
import type { FindingDisposition } from '../../semantic-core/src/finding-disposition.ts';
import { validateProcessRevision } from '../../semantic-core/src/validation.ts';
import { persistValidationBundle } from './validation-persistence.ts';
import { generateExplanationDraft, type ExplanationBundle } from '../../review/src/explanation.ts';
import {
  createAcceptedReviewTransition,
  type ReviewContextBundle,
} from '../../review/src/workspace.ts';
import type {
  BaselineReconciliationAnalysis,
  BaselineTransitionCandidate,
  BaselineTransitionDecision,
  ReviewAuthoredSourceRevision,
  ReviewCommand,
  ReviewCommandApplication,
  ReviewConfirmationRecord,
} from '../../review/src/types.ts';

function append<T>(repo: ImmutableDocumentRepository, id: any, kind: string, payload: T, at: string): void {
  repo.append({ id, aggregateKind: kind, schemaVersion: 'review-v0.2-reference', payload, createdAt: at });
}

function persistExplanation(repo: ImmutableDocumentRepository, bundle: ExplanationBundle): void {
  const at = bundle.draft.generatedAt;
  for (const item of bundle.facets) append(repo, item.id, 'ExplanationEvidenceFacet', item, at);
  for (const item of bundle.propositions) append(repo, item.id, 'ExplanationProposition', item, at);
  for (const item of bundle.contentBlocks) append(repo, item.id, 'ExplanationContentBlock', item, at);
  append(repo, bundle.draft.id, 'ExplanationDraftSnapshot', bundle.draft, at);
}

function persistContext(repo: ImmutableDocumentRepository, context: ReviewContextBundle): void {
  const at = context.workspaceRevision.createdAt;
  if (!repo.get(context.reviewAuthoredSourceDefinition.id)) {
    append(repo, context.reviewAuthoredSourceDefinition.id, 'ReviewAuthoredSourceDefinition', context.reviewAuthoredSourceDefinition, context.reviewAuthoredSourceDefinition.createdAt);
  }
  append(repo, createOpaqueId('review', `workspace-definition-state:${context.workspaceDefinition.id}:${context.workspaceRevision.id}`), 'ReviewWorkspaceDefinitionState', context.workspaceDefinition, at);
  append(repo, context.workspaceRevision.id, 'ReviewWorkspaceRevision', context.workspaceRevision, at);
  for (const item of context.projectionRevision.projectionItemSnapshots) append(repo, item.id, 'ProjectionItemSnapshot', item, at);
  for (const item of context.projectionRevision.projectionBindingSnapshots) append(repo, item.id, 'ProjectionBinding', item, at);
  append(repo, context.projectionRevision.id, 'ReviewProjectionRevision', context.projectionRevision, at);
  append(repo, context.scopeBinding.id, 'ReviewScopeSurfaceBinding', context.scopeBinding, at);
  append(repo, context.baselineBundle.id, 'ReviewBaselineBundle', context.baselineBundle, at);
}

function persistTransition(
  repo: ImmutableDocumentRepository,
  analysis: BaselineReconciliationAnalysis,
  candidate: BaselineTransitionCandidate,
  decision: BaselineTransitionDecision,
  next: ReviewContextBundle,
): void {
  append(repo, analysis.id, 'BaselineReconciliationAnalysis', analysis, analysis.createdAt);
  append(repo, candidate.id, 'BaselineTransitionCandidate', candidate, candidate.detectedAt);
  append(repo, decision.id, 'BaselineTransitionDecision', decision, decision.decidedAt);
  persistContext(repo, next);
}

function currentProcessDefinition(repo: ImmutableDocumentRepository, processDefinitionId: string): ProcessDefinition {
  const states = repo.listByKind<ProcessDefinition>('ProcessDefinitionState').map((item) => item.payload)
    .filter((item) => item.id === processDefinitionId);
  const current = states.at(-1);
  if (!current) throw new TypeError(`ProcessDefinitionState missing for ${processDefinitionId}`);
  return current;
}

function applicationByClientKey(repo: ImmutableDocumentRepository, key: string | undefined) {
  if (!key) return undefined;
  const command = repo.listByKind<ReviewCommand>('ReviewCommand').map((item) => item.payload)
    .find((item) => item.clientRequestKey === key);
  if (!command) return undefined;
  const application = repo.listByKind<ReviewCommandApplication>('ReviewCommandApplication').map((item) => item.payload)
    .find((item) => item.reviewCommandId === command.id);
  return application ? { command, application } : undefined;
}

export interface ClaimConfirmationResult {
  application: ReviewCommandApplication;
  candidateProcessRevision?: ProcessRevision;
  candidateValidation?: ValidationBundle;
  nextContext?: ReviewContextBundle;
  explanation?: ExplanationBundle;
  authoredRevision?: ReviewAuthoredSourceRevision;
  confirmations: ReviewConfirmationRecord[];
  confirmedClaims: SemanticClaim[];
  findingDispositions: FindingDisposition[];
}

/**
 * Source-family-neutral confirmation of existing semantic claim values.
 *
 * This function is intentionally NOT a correction engine. It cannot change a
 * value, topology, source representation, perception record, or native source.
 * It only creates reviewer-authored evidence that explicitly selected INFERRED
 * claims are accepted as CONFIRMED in a new ProcessRevision.
 */
export function applyClaimConfirmation(
  repo: ImmutableDocumentRepository,
  currentContext: ReviewContextBundle,
  currentProcess: ProcessRevision,
  currentValidation: ValidationBundle,
  command: ReviewCommand,
): ClaimConfirmationResult {
  const at = command.requestedAt;
  const replay = applicationByClientKey(repo, command.clientRequestKey);
  if (replay) {
    if (replay.command.id !== command.id) throw new TypeError('clientRequestKey already used by a different review command');
    return { application: { ...replay.application, result: 'IDEMPOTENT_REPLAY' }, confirmations: [], confirmedClaims: [], findingDispositions: [] };
  }

  append(repo, command.id, 'ReviewCommand', command, at);

  if (command.expectedReviewWorkspaceRevisionId !== currentContext.workspaceRevision.id
    || command.expectedReviewBaselineBundleId !== currentContext.baselineBundle.id) {
    const application: ReviewCommandApplication = {
      id: createOpaqueId('review', `review-app:${command.id}:stale`),
      reviewCommandId: command.id,
      result: 'REJECTED_STALE',
      appliedAt: at,
      diagnosticRefs: ['STALE_REVIEW_BASELINE'],
    };
    append(repo, application.id, 'ReviewCommandApplication', application, at);
    return { application, confirmations: [], confirmedClaims: [], findingDispositions: [] };
  }

  const selectedRefs = [...new Set(command.selectedClaimRefs ?? [])];
  if (command.actionKind !== 'CONFIRM' || selectedRefs.length === 0 || !command.authorityRef) {
    const application: ReviewCommandApplication = {
      id: createOpaqueId('review', `review-app:${command.id}:invalid`),
      reviewCommandId: command.id,
      result: 'REJECTED_INVALID',
      appliedAt: at,
      diagnosticRefs: ['CONFIRM_REQUIRES_SELECTED_INFERRED_CLAIMS_AND_AUTHORITY'],
    };
    append(repo, application.id, 'ReviewCommandApplication', application, at);
    return { application, confirmations: [], confirmedClaims: [], findingDispositions: [] };
  }

  const currentClaims = new Map(currentProcess.semanticClaims.map((claim) => [String(claim.id), claim]));
  const selected = selectedRefs.map((ref) => currentClaims.get(String(ref)));
  if (selected.some((claim) => !claim || claim.truthClass !== 'INFERRED')) {
    const application: ReviewCommandApplication = {
      id: createOpaqueId('review', `review-app:${command.id}:invalid-claims`),
      reviewCommandId: command.id,
      result: 'REJECTED_INVALID',
      appliedAt: at,
      diagnosticRefs: ['SELECTED_CLAIMS_MUST_BE_CURRENT_INFERRED_CLAIMS'],
    };
    append(repo, application.id, 'ReviewCommandApplication', application, at);
    return { application, confirmations: [], confirmedClaims: [], findingDispositions: [] };
  }

  const selectedClaims = selected as SemanticClaim[];
  const selectedSubjects = new Set(selectedClaims.map((claim) => claim.subjectRef));
  if (command.targetSubjectRefs.length > 0 && command.targetSubjectRefs.some((ref) => !selectedSubjects.has(ref))) {
    const application: ReviewCommandApplication = {
      id: createOpaqueId('review', `review-app:${command.id}:invalid-targets`),
      reviewCommandId: command.id,
      result: 'REJECTED_INVALID',
      appliedAt: at,
      diagnosticRefs: ['TARGET_SUBJECTS_MUST_BE_BACKED_BY_SELECTED_CLAIMS'],
    };
    append(repo, application.id, 'ReviewCommandApplication', application, at);
    return { application, confirmations: [], confirmedClaims: [], findingDispositions: [] };
  }

  const authoredRevisionId = createOpaqueId('review', `semantic-confirmation:${currentContext.reviewAuthoredSourceDefinition.id}:${command.id}`);
  const confirmedClaims = selectedClaims.map((claim): SemanticClaim => ({
    ...claim,
    id: createOpaqueId('provenance', `confirmed-claim:${claim.id}:${command.id}`),
    truthClass: 'CONFIRMED',
    createdAt: at,
    interpretationMethod: 'HUMAN_REVIEW_CONFIRMATION',
    interpreterVersion: 'semantic-review-confirmation-v0.1',
  }));
  const confirmedByOldId = new Map(selectedClaims.map((claim, index) => [String(claim.id), confirmedClaims[index]]));

  const confirmations = selectedClaims.map((claim, index): ReviewConfirmationRecord => ({
    id: createOpaqueId('review', `confirmation:${command.id}:${claim.subjectRef}:${claim.propertyPath}:${index}`),
    reviewAuthoredSourceRevisionRef: authoredRevisionId,
    reviewCommandRef: command.id,
    subjectRef: claim.subjectRef,
    propertyPath: claim.propertyPath,
    confirmedValue: claim.value,
    authorityRef: command.authorityRef,
    confirmedBy: command.requestedBy,
    confirmedAt: at,
  }));

  const activeClaims = currentProcess.semanticClaims.map((claim) => confirmedByOldId.get(String(claim.id)) ?? claim);
  const claimsBySubject = new Map<string, SemanticClaim[]>();
  for (const claim of activeClaims) {
    const list = claimsBySubject.get(claim.subjectRef) ?? [];
    list.push(claim);
    claimsBySubject.set(claim.subjectRef, list);
  }
  const subjectTruth = (subjectRef: string) => {
    const subjectClaims = claimsBySubject.get(subjectRef) ?? [];
    return subjectClaims.length > 0 && subjectClaims.every((claim) => claim.truthClass === 'CONFIRMED') ? 'CONFIRMED' as const : undefined;
  };

  const candidateProcessRevision: ProcessRevision = {
    ...currentProcess,
    id: createOpaqueId('canonical', `review-confirmation:${currentProcess.id}:${command.id}`),
    revision: currentProcess.revision + 1,
    createdAt: at,
    parentRevisionIds: [currentProcess.id],
    derivationKind: 'REINTERPRETATION',
    nodes: currentProcess.nodes.map((node) => ({ ...node, ...(subjectTruth(node.id) ? { truthClass: 'CONFIRMED' as const } : {}) })),
    edges: currentProcess.edges.map((edge) => ({ ...edge, ...(subjectTruth(edge.id) ? { truthClass: 'CONFIRMED' as const } : {}) })),
    semanticClaims: activeClaims,
    semanticStatus: 'NORMALIZED',
    executionReadiness: 'NOT_ASSESSED',
    validationFindingRefs: [],
  };

  const definition = currentProcessDefinition(repo, currentProcess.processDefinitionId);
  const nextDefinition: ProcessDefinition = {
    ...definition,
    revisionIds: [...definition.revisionIds, candidateProcessRevision.id],
  };
  repo.append({
    id: candidateProcessRevision.id,
    aggregateKind: 'ProcessRevision',
    schemaVersion: 'canonical-v0.1-reference',
    payload: candidateProcessRevision,
    createdAt: at,
  });
  repo.append({
    id: createOpaqueId('canonical', `process-definition-state:${nextDefinition.id}:${candidateProcessRevision.id}`),
    aggregateKind: 'ProcessDefinitionState',
    schemaVersion: 'canonical-v0.1-reference',
    payload: nextDefinition,
    createdAt: at,
  });
  for (const claim of confirmedClaims) {
    repo.append({ id: claim.id, aggregateKind: 'SemanticClaim', schemaVersion: 'provenance-v0.3-reference', payload: claim, createdAt: at });
  }

  const authoredRevision: ReviewAuthoredSourceRevision = {
    id: authoredRevisionId,
    reviewAuthoredSourceDefinitionId: currentContext.reviewAuthoredSourceDefinition.id,
    ...(currentContext.workspaceRevision.activeReviewAuthoredSourceRevisionId
      ? { parentRevisionId: currentContext.workspaceRevision.activeReviewAuthoredSourceRevisionId }
      : {}),
    reviewCommandRef: command.id,
    claimRefs: confirmedClaims.map((claim) => claim.id),
    confirmationRefs: confirmations.map((record) => record.id),
    createdAt: at,
    createdBy: command.requestedBy,
    semanticDigest: digestDeterministicJson({
      command: command.id,
      parentProcessRevision: currentProcess.id,
      selectedClaims: selectedClaims.map((claim) => claim.id).sort(),
      confirmedClaims: confirmedClaims.map((claim) => claim.id).sort(),
    }),
  };
  append(repo, authoredRevision.id, 'ReviewAuthoredSourceRevision', authoredRevision, at);
  for (const confirmation of confirmations) append(repo, confirmation.id, 'ReviewConfirmationRecord', confirmation, at);

  const candidateValidation = validateProcessRevision(
    candidateProcessRevision,
    'AUTOMATION_DESIGN_READINESS',
    { assessedAt: at, supersedesAssessmentId: currentValidation.assessment.id },
  );
  persistValidationBundle(repo, candidateValidation);

  const explanation = generateExplanationDraft(candidateProcessRevision, candidateValidation, {
    generatedAt: at,
    sourceRepresentationRefs: currentContext.workspaceDefinition.sourceRepresentationIds,
    confirmations,
  });
  persistExplanation(repo, explanation);

  const transition = createAcceptedReviewTransition(
    currentContext,
    candidateProcessRevision,
    candidateValidation,
    explanation,
    authoredRevision.id,
    command.id,
    [],
    at,
    command.requestedBy,
  );
  persistTransition(repo, transition.reconciliationAnalysis, transition.transitionCandidate, transition.transitionDecision, transition.next);

  const findingDispositions: FindingDisposition[] = [];
  for (const finding of currentValidation.findings.filter((item) => item.code === 'SV-SRC-001')) {
    const stillPresent = candidateValidation.findings.some((item) => item.code === 'SV-SRC-001' && item.targetRefs.some((ref) => finding.targetRefs.includes(ref)));
    if (stillPresent) continue;
    const resultingClaims = confirmedClaims.filter((claim) => finding.targetRefs.includes(claim.subjectRef));
    const disposition: FindingDisposition = {
      id: createOpaqueId('validation', `finding-disposition:${finding.id}:${candidateProcessRevision.id}`),
      findingId: finding.id,
      disposition: 'RESOLVED_BY_NEW_REVISION',
      rationale: 'Reviewer explicitly confirmed the image-derived inferred semantic claim set for this subject.',
      authorityRef: command.authorityRef,
      recordedBy: command.requestedBy,
      recordedAt: at,
      resultingClaimRefs: resultingClaims.map((claim) => claim.id),
      resultingProcessRevisionRef: candidateProcessRevision.id,
      resultingAssessmentRef: candidateValidation.assessment.id,
    };
    append(repo, disposition.id, 'FindingDisposition', disposition, at);
    findingDispositions.push(disposition);
  }

  const application: ReviewCommandApplication = {
    id: createOpaqueId('review', `review-app:${command.id}:applied`),
    reviewCommandId: command.id,
    result: 'APPLIED',
    appliedAt: at,
    reviewAuthoredSourceRevisionRef: authoredRevision.id,
    candidateProcessRevisionRef: candidateProcessRevision.id,
    candidateValidationAssessmentRef: candidateValidation.assessment.id,
    baselineTransitionCandidateRef: transition.transitionCandidate.id,
    baselineTransitionDecisionRef: transition.transitionDecision.id,
    resultingWorkspaceRevisionRef: transition.next.workspaceRevision.id,
    diagnosticRefs: [],
  };
  append(repo, application.id, 'ReviewCommandApplication', application, at);

  return {
    application,
    candidateProcessRevision,
    candidateValidation,
    nextContext: transition.next,
    explanation,
    authoredRevision,
    confirmations,
    confirmedClaims,
    findingDispositions,
  };
}
