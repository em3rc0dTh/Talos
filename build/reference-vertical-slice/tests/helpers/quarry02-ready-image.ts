import { createOpaqueId } from '../../packages/foundation/src/ids.ts';
import type { SqliteDocumentStore } from '../../packages/persistence-sqlite/src/sqlite-document-store.ts';
import {
  type LocalImageByteStore,
  ReferenceQuarryPerceptionProvider,
  intakePngUpload,
  runImagePerception,
} from '../../packages/image-perception/src/index.ts';
import { normalizeAndValidateImageResult } from '../../packages/application/src/image-semantic.ts';
import { initializeReview } from '../../packages/application/src/review.ts';
import { applyClaimConfirmation } from '../../packages/application/src/semantic-review.ts';
import { applySemanticCorrection } from '../../packages/application/src/semantic-correction.ts';
import type { ProcessRevision, ValidationBundle } from '../../packages/semantic-core/src/types.ts';
import type { ReviewCommand } from '../../packages/review/src/types.ts';
import type { ReviewContextBundle } from '../../packages/review/src/workspace.ts';

export interface ReadyImageReviewState {
  context: ReviewContextBundle;
  process: ProcessRevision;
  validation: ValidationBundle;
}

function byName(process: ProcessRevision, name: string) {
  const node = process.nodes.find((item) => item.name === name);
  if (!node) throw new Error(`node ${name} missing`);
  return node;
}

function correctionCommand(current: ReadyImageReviewState, seq: number, input: Partial<ReviewCommand> & Pick<ReviewCommand, 'actionKind'>): ReviewCommand {
  return {
    id: createOpaqueId('review', `i5b00-ready:${seq}:${current.process.id}:${input.actionKind}`),
    clientRequestKey: `i5b00-ready-${seq}-${current.process.id}`,
    reviewWorkspaceDefinitionId: current.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: current.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: current.context.baselineBundle.id,
    primarySemanticScopeRef: current.validation.assessment.primaryScopeRef,
    targetSemanticScopeRefs: [current.validation.assessment.primaryScopeRef],
    actionKind: input.actionKind,
    targetSubjectRefs: input.targetSubjectRefs ?? [],
    ...(input.targetPropertyPath ? { targetPropertyPath: input.targetPropertyPath } : {}),
    ...(input.proposedValue !== undefined ? { proposedValue: input.proposedValue } : {}),
    rationale: input.rationale ?? 'Reviewer-authored Quarry-02 semantic correction.',
    authorityRef: 'reference-image-business-reviewer',
    requestedBy: 'image-reviewer',
    requestedAt: `2026-08-20T08:00:${String(10 + seq).padStart(2, '0')}.000Z`,
  };
}

function applyCorrection(repo: SqliteDocumentStore, current: ReadyImageReviewState, command: ReviewCommand): ReadyImageReviewState {
  const result = applySemanticCorrection(repo, current.context, current.process, current.validation, command);
  if (result.application.result !== 'APPLIED' || !result.nextContext || !result.candidateProcessRevision || !result.candidateValidation) {
    throw new Error(`semantic correction failed: ${result.application.result}`);
  }
  return {
    context: result.nextContext,
    process: result.candidateProcessRevision,
    validation: result.candidateValidation,
  };
}

export function buildReadyQuarry02ImageReview(repo: SqliteDocumentStore, byteStore: LocalImageByteStore, bytes: Buffer) {
  const intake = intakePngUpload(repo, byteStore, bytes, {
    receivedAt: '2026-08-20T08:00:00.000Z',
    declaredName: 'Quarry 02 — Aqua Distilled Water Order & Delivery',
  });
  const perception = runImagePerception(repo, intake, new ReferenceQuarryPerceptionProvider(), {
    now: '2026-08-20T08:00:01.000Z',
    materializeCommonEvidence: true,
  });
  if (!perception.attempt.result) throw new Error('image adapter result missing');
  const semantic = normalizeAndValidateImageResult(repo, perception.attempt.result.id, {
    normalizedAt: '2026-08-20T08:00:02.000Z',
    assessedAt: '2026-08-20T08:00:03.000Z',
  });
  const review = initializeReview(repo, semantic.normalization.processRevision, semantic.validation, {
    createdAt: '2026-08-20T08:00:04.000Z',
    createdBy: 'image-reviewer',
    sourceRepresentationRefs: [intake.representation.id],
    adapterResultContextRefs: [perception.attempt.result.id],
  });

  const confirmation: ReviewCommand = {
    id: createOpaqueId('review', `i5b00-ready-confirm:${semantic.normalization.processRevision.id}`),
    clientRequestKey: `i5b00-ready-confirm-${semantic.normalization.processRevision.id}`,
    reviewWorkspaceDefinitionId: review.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: review.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: review.context.baselineBundle.id,
    primarySemanticScopeRef: semantic.validation.assessment.primaryScopeRef,
    targetSemanticScopeRefs: [semantic.validation.assessment.primaryScopeRef],
    actionKind: 'CONFIRM',
    targetSubjectRefs: [...new Set(semantic.normalization.processRevision.semanticClaims.map((claim) => claim.subjectRef))],
    selectedClaimRefs: semantic.normalization.processRevision.semanticClaims.map((claim) => claim.id),
    rationale: 'Explicitly confirm the image-derived candidate before correction.',
    authorityRef: 'reference-image-business-reviewer',
    requestedBy: 'image-reviewer',
    requestedAt: '2026-08-20T08:00:05.000Z',
  };
  const confirmed = applyClaimConfirmation(repo, review.context, semantic.normalization.processRevision, semantic.validation, confirmation);
  if (confirmed.application.result !== 'APPLIED' || !confirmed.nextContext || !confirmed.candidateProcessRevision || !confirmed.candidateValidation) {
    throw new Error(`claim confirmation failed: ${confirmed.application.result}`);
  }

  let current: ReadyImageReviewState = {
    context: confirmed.nextContext,
    process: confirmed.candidateProcessRevision,
    validation: confirmed.candidateValidation,
  };

  const deliver = byName(current.process, 'Deliver Water');
  current = applyCorrection(repo, current, correctionCommand(current, 1, {
    actionKind: 'ADD_PROCESS_ELEMENT',
    proposedValue: {
      kind: 'END',
      name: 'Order fulfilled',
      afterSubjectRef: deliver.id,
      relationshipKind: 'SEQUENCE',
    },
  }));

  const subprocess = byName(current.process, 'Arrange Delivery');
  current = applyCorrection(repo, current, correctionCommand(current, 2, {
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [subprocess.id],
    targetPropertyPath: 'details.subprocessMode',
    proposedValue: 'COLLAPSED_SUBPROCESS',
  }));

  const decision = byName(current.process, 'Customer Exist?');
  const createCustomer = byName(current.process, 'Create Customer Account');
  const noEdge = current.process.edges.find((edge) => edge.sourceNodeId === decision.id && edge.targetNodeId === createCustomer.id);
  if (!noEdge) throw new Error('NO branch edge missing');
  current = applyCorrection(repo, current, correctionCommand(current, 3, {
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [noEdge.id],
    targetPropertyPath: 'conditionRuleRef',
    proposedValue: {
      naturalLanguage: 'Customer does not exist',
      expression: { fact: 'customerExists', operator: 'EQUALS', value: false },
    },
  }));

  const decisionAfterNo = byName(current.process, 'Customer Exist?');
  const wednesday = byName(current.process, 'On Next Wednesday');
  const yesEdge = current.process.edges.find((edge) => edge.sourceNodeId === decisionAfterNo.id && edge.targetNodeId === wednesday.id);
  if (!yesEdge) throw new Error('YES branch edge missing');
  current = applyCorrection(repo, current, correctionCommand(current, 4, {
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [yesEdge.id],
    targetPropertyPath: 'conditionRuleRef',
    proposedValue: {
      naturalLanguage: 'Customer exists',
      expression: { fact: 'customerExists', operator: 'EQUALS', value: true },
    },
  }));

  if (current.validation.assessment.executionReadiness !== 'READY_FOR_AUTOMATION_DESIGN') {
    throw new Error(`fixture did not reach ready state: ${current.validation.assessment.executionReadiness}`);
  }

  return {
    intake,
    perception,
    initialProcess: semantic.normalization.processRevision,
    current,
  };
}
