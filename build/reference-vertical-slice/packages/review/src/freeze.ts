import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ValidationAssessment } from '../../semantic-core/src/types.ts';
import type {
  FreezeRequestPayload,
  ReviewBaselineBundle,
  ReviewCommand,
  ReviewScopeSurfaceBinding,
  ReviewWorkspaceRevision,
  ScopeFreezeOutcome,
  ScopeFreezeRecord,
  ScopeFreezeRequest,
  SemanticFreezeApplication,
  SemanticFreezeRecord,
} from './types.ts';

export interface FreezeEvaluationResult {
  application: SemanticFreezeApplication;
  freezeRecord?: SemanticFreezeRecord;
  scopeRecords: ScopeFreezeRecord[];
  outcomes: ScopeFreezeOutcome[];
}

function application(
  command: ReviewCommand,
  applicationId: string,
  payload: FreezeRequestPayload,
  result: SemanticFreezeApplication['result'],
  evaluatedAt: string,
  scopeOutcomeRefs: any[] = [],
  resultingSemanticFreezeRecordRef?: any,
): SemanticFreezeApplication {
  return {
    id: createOpaqueId('review', `freeze-app:${command.id}:${result}`),
    reviewCommandApplicationId: applicationId as any,
    freezeRequestPayloadId: payload.id,
    result,
    ...(resultingSemanticFreezeRecordRef ? { resultingSemanticFreezeRecordRef } : {}),
    scopeOutcomeRefs,
    evaluatedAt,
  };
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const a = new Set(left);
  const b = new Set(right);
  return a.size === b.size && [...a].every((item) => b.has(item));
}

/**
 * Evaluate one semantic freeze request against one exact immutable review baseline.
 *
 * Baseline identity, request-graph identity, validation identity and freeze
 * authority are independent gates. A ready assessment for the same semantic
 * scope is not sufficient unless it is the exact assessment pinned by the
 * current ReviewWorkspaceRevision and it assesses the exact ProcessRevision
 * being frozen.
 */
export function evaluateFreeze(
  command: ReviewCommand,
  applicationId: string,
  payload: FreezeRequestPayload,
  scopeRequests: ScopeFreezeRequest[],
  workspaceRevision: ReviewWorkspaceRevision,
  baseline: ReviewBaselineBundle,
  scopeBinding: ReviewScopeSurfaceBinding,
  assessments: ValidationAssessment[],
  evaluatedAt: string,
): FreezeEvaluationResult {
  const staleBaseline = command.expectedReviewWorkspaceRevisionId !== workspaceRevision.id
    || command.expectedReviewBaselineBundleId !== baseline.id
    || baseline.reviewWorkspaceRevisionId !== workspaceRevision.id
    || baseline.reviewWorkspaceDefinitionId !== workspaceRevision.reviewWorkspaceDefinitionId
    || baseline.baselineProcessRevisionId !== workspaceRevision.baselineProcessRevisionId
    || scopeBinding.reviewBaselineBundleId !== baseline.id;

  if (staleBaseline) {
    return {
      application: application(command, applicationId, payload, 'REJECTED_STALE', evaluatedAt),
      scopeRecords: [],
      outcomes: [],
    };
  }

  const requestIds = scopeRequests.map((request) => request.id as string);
  const payloadRefs = payload.scopeRequestRefs.map((id) => id as string);
  const requestedScopes = scopeRequests.map((request) => request.semanticScopeRef);
  const targetedScopes = command.targetSemanticScopeRefs;
  const invalidRequestGraph = command.actionKind !== 'REQUEST_FREEZE'
    || payload.reviewCommandId !== command.id
    || (command.actionPayloadRef !== undefined && command.actionPayloadRef !== payload.id)
    || !sameSet(payloadRefs, requestIds)
    || scopeRequests.some((request) => request.freezeRequestPayloadId !== payload.id)
    || targetedScopes.length === 0
    || !sameSet(requestedScopes, targetedScopes);

  if (invalidRequestGraph) {
    return {
      application: application(command, applicationId, payload, 'REJECTED_INVALID_SCOPE_SET', evaluatedAt),
      scopeRecords: [],
      outcomes: [],
    };
  }

  const baselineAssessment = workspaceRevision.baselineValidationAssessmentId
    ? assessments.find((assessment) => assessment.id === workspaceRevision.baselineValidationAssessmentId)
    : undefined;

  const outcomes: ScopeFreezeOutcome[] = scopeRequests.map((request) => {
    const baselineAssessmentMatchesScope = baselineAssessment?.primaryScopeRef === request.semanticScopeRef;
    const exactAssessmentRefs = baselineAssessmentMatchesScope ? [baselineAssessment!.id] : [];

    if (request.requestedDisposition === 'EXCLUDED') {
      return {
        id: createOpaqueId('review', `freeze-outcome:${command.id}:${request.semanticScopeRef}`),
        semanticScopeRef: request.semanticScopeRef,
        requestedDisposition: request.requestedDisposition,
        resultingDisposition: 'EXCLUDED',
        eligibilityResult: 'EXCLUDED',
        validationAssessmentRefs: exactAssessmentRefs,
        diagnosticRefs: [],
      };
    }

    if (request.requestedDisposition === 'DEFERRED') {
      return {
        id: createOpaqueId('review', `freeze-outcome:${command.id}:${request.semanticScopeRef}`),
        semanticScopeRef: request.semanticScopeRef,
        requestedDisposition: request.requestedDisposition,
        resultingDisposition: 'DEFERRED',
        eligibilityResult: 'DEFERRED',
        validationAssessmentRefs: exactAssessmentRefs,
        diagnosticRefs: [],
      };
    }

    const referencedAssessmentIsExact = !request.referencedValidationAssessmentRefs
      || (request.referencedValidationAssessmentRefs.length === 1
        && baselineAssessment !== undefined
        && request.referencedValidationAssessmentRefs[0] === baselineAssessment.id);

    const automationReady = payload.freezeKind !== 'AUTOMATION_DESIGN_HANDOFF'
      || (baselineAssessment !== undefined
        && baselineAssessment.processRevisionId === workspaceRevision.baselineProcessRevisionId
        && baselineAssessment.primaryScopeRef === request.semanticScopeRef
        && baselineAssessment.assessmentIntent === 'AUTOMATION_DESIGN_READINESS'
        && baselineAssessment.executionReadiness === 'READY_FOR_AUTOMATION_DESIGN'
        && referencedAssessmentIsExact);

    return {
      id: createOpaqueId('review', `freeze-outcome:${command.id}:${request.semanticScopeRef}`),
      semanticScopeRef: request.semanticScopeRef,
      requestedDisposition: request.requestedDisposition,
      ...(automationReady ? { resultingDisposition: request.requestedDisposition } : {}),
      eligibilityResult: automationReady ? 'ELIGIBLE' : 'INELIGIBLE_VALIDATION',
      validationAssessmentRefs: exactAssessmentRefs,
      diagnosticRefs: automationReady ? [] : ['AUTOMATION_DESIGN_HANDOFF_REQUIRES_EXACT_READY_BASELINE_ASSESSMENT'],
    };
  });

  if (outcomes.some((outcome) => outcome.requestedDisposition === 'ACCEPTED' && outcome.eligibilityResult === 'INELIGIBLE_VALIDATION')) {
    return {
      application: application(command, applicationId, payload, 'REJECTED_VALIDATION_GATE', evaluatedAt, outcomes.map((outcome) => outcome.id)),
      scopeRecords: [],
      outcomes,
    };
  }

  // Authority is required before any semantic freeze may be created. Validation
  // may reject an already-ineligible baseline first so readiness and authority
  // remain distinct diagnostics rather than one masking the other.
  if (!command.authorityRef) {
    return {
      application: application(command, applicationId, payload, 'REJECTED_AUTHORITY', evaluatedAt, outcomes.map((outcome) => outcome.id)),
      scopeRecords: [],
      outcomes,
    };
  }

  const freezeId = createOpaqueId('review', `semantic-freeze:${baseline.id}:${payload.freezeKind}`);
  const scopeRecords: ScopeFreezeRecord[] = outcomes.map((outcome) => ({
    id: createOpaqueId('review', `scope-freeze:${freezeId}:${outcome.semanticScopeRef}`),
    semanticFreezeRecordId: freezeId,
    semanticScopeRef: outcome.semanticScopeRef,
    disposition: outcome.resultingDisposition ?? outcome.requestedDisposition,
    validationAssessmentRefs: outcome.validationAssessmentRefs,
    ...(scopeBinding.semanticScopeRef === outcome.semanticScopeRef
      ? {
          ...(scopeBinding.explanationDraftSnapshotRef
            ? { explanationDraftSnapshotRef: scopeBinding.explanationDraftSnapshotRef }
            : {}),
          visualScopeBindingRef: scopeBinding.id,
        }
      : {}),
  }));

  const freezeRecord: SemanticFreezeRecord = {
    id: freezeId,
    reviewWorkspaceDefinitionId: baseline.reviewWorkspaceDefinitionId,
    reviewWorkspaceRevisionId: workspaceRevision.id,
    reviewBaselineBundleId: baseline.id,
    processRevisionId: workspaceRevision.baselineProcessRevisionId,
    freezeKind: payload.freezeKind,
    scopeFreezeRefs: scopeRecords.map((record) => record.id),
    acceptedBy: command.requestedBy,
    authorityRef: command.authorityRef,
    ...(command.rationale ? { rationale: command.rationale } : {}),
    frozenAt: evaluatedAt,
    canonicalModelVersion: 'v0.1',
    provenanceContractVersion: 'v0.3',
    validationContractVersion: 'v0.2',
    reviewContractVersion: 'v0.2',
    freezeDigest: digestDeterministicJson({
      processRevisionId: workspaceRevision.baselineProcessRevisionId,
      ...(workspaceRevision.baselineValidationAssessmentId
        ? { validationAssessmentId: workspaceRevision.baselineValidationAssessmentId }
        : {}),
      freezeKind: payload.freezeKind,
      scopes: scopeRecords.map((record) => ({
        scope: record.semanticScopeRef,
        disposition: record.disposition,
        assessments: record.validationAssessmentRefs,
      })),
    }),
  };

  return {
    application: application(
      command,
      applicationId,
      payload,
      'FROZEN',
      evaluatedAt,
      outcomes.map((outcome) => outcome.id),
      freezeRecord.id,
    ),
    freezeRecord,
    scopeRecords,
    outcomes,
  };
}
