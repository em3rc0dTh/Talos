import { createOpaqueId } from '../../foundation/src/ids.ts';
import { CanvasDomainStore } from '../../canvas-source/src/store.ts';
import type {
  CanvasDefinition,
  CanvasElementDraft,
  CanvasId,
  CanvasRelationshipDraft,
} from '../../canvas-source/src/types.ts';
import { buildCanvasRevision } from '../../canvas-source/src/revision.ts';
import { preserveCanvasRevision } from '../../canvas-source/src/preservation.ts';
import {
  adaptPreservedCanvas,
  canvasAdapterInputFingerprint,
  DEFAULT_CANVAS_ADAPTER_CONFIG,
} from '../../canvas-source/src/adapter.ts';
import {
  findSuccessfulResultByFingerprint,
  getAttemptView,
} from '../../source-intake/src/store.ts';
import { validateProcessRevision } from '../../semantic-core/src/validation.ts';
import type {
  FreezeRequestPayload,
  ReviewCommand,
  ScopeFreezeRequest,
} from '../../review/src/types.ts';
import { designReferenceCapabilities } from '../../capability/src/reference-design.ts';
import { designReferenceExecutionPlan } from '../../execution/src/reference-plan.ts';
import { designReferenceTemporalMapping } from '../../temporal-design/src/reference-mapping.ts';
import { designReferenceRuntimePolicy } from '../../runtime-policy/src/reference-policy.ts';
import { designReferenceDeployment } from '../../deployment/src/reference-deployment.ts';
import { normalizeAdapterResult } from './normalization.ts';
import { persistValidationBundle } from './validation-persistence.ts';
import {
  applyActorCorrection,
  applyFreezeCommand,
  initializeReview,
} from './review.ts';
import { hydrateReferenceCorrectionReplay } from './reference-replay.ts';
import { persistCapabilityReferenceBundle } from './capability.ts';
import { persistReferenceExecutionDesign } from './execution-design.ts';

export interface ReferenceDocumentStore {
  append(document: unknown): unknown;
  get(id: string): unknown;
  listByKind(kind: string): unknown[];
}

export interface ReferenceVerticalSliceBuildOptions {
  createdAt?: string;
  actorCorrectionAt?: string;
  freezeAt?: string;
  capabilityAt?: string;
  executionAt?: string;
  requestedBy?: string;
  authorityRef?: string;
}

const canvasId = (seed: string) => createOpaqueId('canvas', `demo:${seed}`);
const sourceId = (seed: string) => createOpaqueId('source', `demo:${seed}`);
const reviewId = (seed: string) => createOpaqueId('review', `demo:${seed}`);

function element(
  seed: string,
  kind: CanvasElementDraft['kind'],
  label: string,
  extra: Partial<CanvasElementDraft> = {},
): CanvasElementDraft {
  return {
    canvasElementId: canvasId(`element:${seed}`),
    kind,
    label,
    propertyValues: {},
    actorRefs: [],
    dataRefs: [],
    ruleRefs: [],
    ...extra,
  };
}

function relationship(
  seed: string,
  kind: CanvasRelationshipDraft['kind'],
  source: CanvasId,
  target: CanvasId,
  guard?: string,
): CanvasRelationshipDraft {
  return {
    canvasRelationshipId: canvasId(`relationship:${seed}`),
    kind,
    sourceEndpoint: { state: 'SET', elementId: source },
    targetEndpoint: { state: 'SET', elementId: target },
    relationshipProperties: {},
    ...(guard ? { guard: { literalText: guard, semanticState: 'SET' } } : {}),
  };
}

export function buildReferenceVerticalSlice(
  repo: ReferenceDocumentStore,
  options: ReferenceVerticalSliceBuildOptions = {},
) {
  const createdAt = options.createdAt ?? '2026-08-19T23:00:00.000Z';
  const actorCorrectionAt = options.actorCorrectionAt ?? '2026-08-19T23:00:01.000Z';
  const freezeAt = options.freezeAt ?? '2026-08-19T23:00:02.000Z';
  const capabilityAt = options.capabilityAt ?? '2026-08-19T23:00:03.000Z';
  const executionAt = options.executionAt ?? '2026-08-19T23:00:04.000Z';
  const requestedBy = options.requestedBy ?? 'reference-user';
  const authorityRef = options.authorityRef ?? 'reference-business-owner';

  const start = element('start', 'TRIGGER', 'Request submitted');
  const review = element('review', 'HUMAN_INTERACTION', 'Review request', {
    propertyValues: {
      interactionKind: { state: 'SET', value: 'REVIEW' },
      actor: { state: 'UNKNOWN' },
      outcomes: { state: 'SET', value: ['APPROVED', 'REJECTED'] },
    },
  });
  const decision = element('decision', 'DECISION', 'Approved?', {
    propertyValues: { decisionMode: { state: 'SET', value: 'EXCLUSIVE' } },
  });
  const email = element('email', 'ACTION', 'Send confirmation email');
  const completed = element('completed', 'END', 'Completed', {
    propertyValues: { outcomeKind: { state: 'SET', value: 'SUCCESS' } },
  });
  const rejected = element('rejected', 'END', 'Rejected', {
    propertyValues: { outcomeKind: { state: 'SET', value: 'REJECTED' } },
  });

  const definitionId = canvasId('definition');
  const initialCanvasRevision = buildCanvasRevision({
    id: canvasId('revision:1'),
    canvasDefinitionId: definitionId,
    revisionNumber: 1,
    createdAt,
    revisionKind: 'SEMANTIC',
    changeSetId: canvasId('changeset:1'),
    elements: [start, review, decision, email, completed, rejected],
    relationships: [
      relationship('start-review', 'CONTROL_FLOW', start.canvasElementId, review.canvasElementId),
      relationship('review-decision', 'CONTROL_FLOW', review.canvasElementId, decision.canvasElementId),
      relationship('yes-email', 'CONDITIONAL_FLOW', decision.canvasElementId, email.canvasElementId, 'YES'),
      relationship('no-rejected', 'CONDITIONAL_FLOW', decision.canvasElementId, rejected.canvasElementId, 'NO'),
      relationship('email-completed', 'CONTROL_FLOW', email.canvasElementId, completed.canvasElementId),
    ],
  });
  const definition: CanvasDefinition = {
    id: definitionId,
    sourceOriginId: sourceId('origin'),
    title: 'Reference approval process',
    createdAt,
    latestRevisionId: initialCanvasRevision.id,
  };

  new CanvasDomainStore(repo as never).saveInitialCanvas(definition, initialCanvasRevision);
  const preserved = preserveCanvasRevision(
    repo as never,
    definition,
    initialCanvasRevision,
    { startedAt: createdAt, initiatedBy: requestedBy },
  );

  const fingerprint = canvasAdapterInputFingerprint(preserved, DEFAULT_CANVAS_ADAPTER_CONFIG);
  const existingResult = findSuccessfulResultByFingerprint(repo as never, fingerprint);
  const adapterAttempt = existingResult
    ? getAttemptView(repo as never, existingResult.adapterAttemptId)
    : adaptPreservedCanvas(repo as never, preserved, DEFAULT_CANVAS_ADAPTER_CONFIG, { now: createdAt });
  if (!adapterAttempt?.result) throw new TypeError('Reference Canvas adapter did not produce a result');

  const initialNormalized = normalizeAdapterResult(repo as never, adapterAttempt.result.id, { normalizedAt: createdAt });
  const initialValidation = validateProcessRevision(
    initialNormalized.processRevision,
    'AUTOMATION_DESIGN_READINESS',
    { assessedAt: createdAt },
  );
  persistValidationBundle(repo as never, initialValidation);

  const initialReview = initializeReview(
    repo as never,
    initialNormalized.processRevision,
    initialValidation,
    {
      createdAt,
      createdBy: requestedBy,
      sourceRepresentationRefs: [preserved.nativeRepresentation.id],
      adapterResultContextRefs: [adapterAttempt.result.id],
    },
  );

  const reviewNode = initialNormalized.processRevision.nodes.find((node) => node.name === 'Review request');
  if (!reviewNode) throw new TypeError('Reference review node missing');

  const correction: ReviewCommand = {
    id: reviewId('command:actor-manager'),
    clientRequestKey: 'reference-correct-manager',
    reviewWorkspaceDefinitionId: initialReview.context.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: initialReview.context.workspaceRevision.id,
    expectedReviewBaselineBundleId: initialReview.context.baselineBundle.id,
    primarySemanticScopeRef: initialValidation.assessment.primaryScopeRef,
    targetSemanticScopeRefs: [initialValidation.assessment.primaryScopeRef],
    actionKind: 'CORRECT_PROPERTY',
    targetSubjectRefs: [reviewNode.id],
    targetPropertyPath: 'details.actor',
    proposedValue: 'Manager',
    findingRefs: initialValidation.findings.filter((finding) => finding.code === 'SV-ACT-001').map((finding) => finding.id),
    questionRefs: initialValidation.questions.filter((question) => question.targetRef === reviewNode.id).map((question) => question.id),
    authorityRef,
    requestedBy,
    requestedAt: actorCorrectionAt,
  };

  const correctionAttempt = applyActorCorrection(
    repo as never,
    initialReview.context,
    initialNormalized.processRevision,
    initialValidation,
    definition,
    initialCanvasRevision,
    correction,
  );
  const corrected = correctionAttempt.application.result === 'IDEMPOTENT_REPLAY'
    ? hydrateReferenceCorrectionReplay(repo as never, correctionAttempt.application) ?? correctionAttempt
    : correctionAttempt;
  const correctionSucceeded = corrected.application.result === 'APPLIED'
    || corrected.application.result === 'IDEMPOTENT_REPLAY';
  if (!correctionSucceeded || !corrected.nextContext || !corrected.candidateProcessRevision || !corrected.candidateValidation) {
    throw new TypeError(`Reference actor correction failed: ${corrected.application.result}`);
  }

  const scope = corrected.candidateValidation.assessment.primaryScopeRef;
  const freezeCommand: ReviewCommand = {
    id: reviewId('command:freeze'),
    reviewWorkspaceDefinitionId: corrected.nextContext.workspaceDefinition.id,
    expectedReviewWorkspaceRevisionId: corrected.nextContext.workspaceRevision.id,
    expectedReviewBaselineBundleId: corrected.nextContext.baselineBundle.id,
    primarySemanticScopeRef: scope,
    targetSemanticScopeRefs: [scope],
    actionKind: 'REQUEST_FREEZE',
    targetSubjectRefs: [],
    actionPayloadRef: reviewId('freeze-payload'),
    authorityRef,
    requestedBy,
    requestedAt: freezeAt,
  };
  const freezePayload: FreezeRequestPayload = {
    id: freezeCommand.actionPayloadRef!,
    reviewCommandId: freezeCommand.id,
    freezeKind: 'AUTOMATION_DESIGN_HANDOFF',
    scopeRequestRefs: [reviewId('freeze-scope')],
    requestedAt: freezeAt,
  };
  const scopeRequest: ScopeFreezeRequest = {
    id: freezePayload.scopeRequestRefs[0],
    freezeRequestPayloadId: freezePayload.id,
    semanticScopeRef: scope,
    requestedDisposition: 'ACCEPTED',
    referencedValidationAssessmentRefs: [corrected.candidateValidation.assessment.id],
  };
  const frozen = applyFreezeCommand(
    repo as never,
    corrected.nextContext,
    freezeCommand,
    freezePayload,
    [scopeRequest],
    [corrected.candidateValidation.assessment],
  );
  if (frozen.freezeApplication.result !== 'FROZEN' || !frozen.freezeRecord || !frozen.scopeRecords[0]) {
    throw new TypeError(`Reference semantic freeze failed: ${frozen.freezeApplication.result}`);
  }

  const capability = designReferenceCapabilities(
    corrected.candidateProcessRevision,
    frozen.freezeRecord,
    frozen.scopeRecords[0],
    capabilityAt,
    requestedBy,
  );
  persistCapabilityReferenceBundle(repo as never, capability);

  const execution = designReferenceExecutionPlan(
    corrected.candidateProcessRevision,
    corrected.candidateValidation.assessment,
    frozen.freezeRecord,
    frozen.scopeRecords[0],
    capability,
    executionAt,
  );
  const mapping = designReferenceTemporalMapping(execution, executionAt);
  const policy = designReferenceRuntimePolicy(execution, mapping, executionAt);
  const deployment = designReferenceDeployment(execution, mapping, policy, executionAt);
  persistReferenceExecutionDesign(repo as never, execution, mapping, policy, deployment);

  return {
    source: { definition, initialCanvasRevision, preserved, adapterAttempt },
    initial: {
      processRevision: initialNormalized.processRevision,
      validation: initialValidation,
      review: initialReview,
    },
    correction: corrected,
    freeze: { record: frozen.freezeRecord, scope: frozen.scopeRecords[0] },
    capability,
    execution,
    mapping,
    policy,
    deployment,
  };
}
