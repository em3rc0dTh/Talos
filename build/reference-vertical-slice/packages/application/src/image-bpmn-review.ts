import type { OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  assessImagePerceptionSufficiency,
  intakePngUpload,
  runCorrelatedConfiguredImagePerceptionAdmission,
  runCorrelatedImagePerceptionWithFallback,
  type ImageIntakeBundle,
  type ImagePerceptionAdmissionBundle,
  type ImagePerceptionFallbackRoutingRecord,
  type ImagePerceptionRuntimeBinding,
  type ImagePerceptionSufficiencyAssessment,
  type ImagePerceptionSufficiencyPolicy,
  type LocalImageByteStore,
} from '../../image-perception/src/index.ts';
import {
  projectCanonicalProcessToBpmn,
  type BpmnProjectionResult,
} from '../../review/src/index.ts';
import { normalizeAndValidateImageResult, type ImageSemanticBundle } from './image-semantic.ts';

const BPMN_WORKSPACE_SCHEMA = 'talos-bpmn-workspace-v0.1';

interface ImageBpmnReviewRoutingContext {
  perceptionRouting?: ImagePerceptionFallbackRoutingRecord;
  perceptionSufficiency?: ImagePerceptionSufficiencyAssessment;
}

export type ImageBpmnReviewResult =
  | ({
      status: 'SAFE_STOP_BEFORE_CANONICAL';
      intake: ImageIntakeBundle;
      perception: ImagePerceptionAdmissionBundle;
      automaticConfirmationAuthorized: false;
      automaticFreezeAuthorized: false;
      automaticExecutionAuthorized: false;
    } & ImageBpmnReviewRoutingContext)
  | ({
      status: 'BPMN_READY_FOR_PROCESS_REVIEW';
      intake: ImageIntakeBundle;
      perception: ImagePerceptionAdmissionBundle;
      semantic: ImageSemanticBundle;
      projection: BpmnProjectionResult;
      automaticConfirmationAuthorized: false;
      automaticFreezeAuthorized: false;
      automaticExecutionAuthorized: false;
    } & ImageBpmnReviewRoutingContext);

export interface ImageBpmnReviewOptions {
  declaredName?: string;
  initiatedBy: string;
  receivedAt?: string;
  perceivedAt?: string;
  normalizedAt?: string;
  assessedAt?: string;
  projectedAt?: string;
  bpmnRevisionNumber?: number;
  fetchImpl?: typeof fetch;
  fallbackBinding?: ImagePerceptionRuntimeBinding;
  fallbackFetchImpl?: typeof fetch;
  sufficiencyPolicy?: ImagePerceptionSufficiencyPolicy;
}

function persistBpmnProjection(repo: ImmutableDocumentRepository, projection: BpmnProjectionResult): void {
  const revision = projection.bpmnRevision;
  repo.append({
    id: revision.id as OpaqueId,
    aggregateKind: 'BpmnProcessRevision',
    schemaVersion: BPMN_WORKSPACE_SCHEMA,
    payload: revision,
    ...(revision.parentBpmnRevisionId ? { parentId: revision.parentBpmnRevisionId as OpaqueId } : {}),
    createdAt: revision.createdAt,
  });
}

/**
 * Image-to-review orchestration.
 *
 * Talos always applies its deterministic sufficiency gate to the primary
 * provider evidence. A configured fallback is invoked only when that primary
 * evidence is insufficient. Without a fallback, insufficient primary evidence
 * safe-stops before canonical normalization rather than becoming a misleading
 * review candidate. If neither configured attempt is sufficient, canonical
 * normalization is forbidden.
 *
 * Any selected perception remains INFERRED business meaning and is projected
 * into a non-executable DRAFT BPMN revision for human review. No confirmation,
 * freeze, deployment, or execution authority is created by perception.
 */
export async function buildImageBpmnReviewCandidate(
  repo: ImmutableDocumentRepository,
  byteStore: LocalImageByteStore,
  pngBytes: Uint8Array,
  binding: ImagePerceptionRuntimeBinding,
  options: ImageBpmnReviewOptions,
): Promise<ImageBpmnReviewResult> {
  const intake = intakePngUpload(repo, byteStore, pngBytes, {
    ...(options.declaredName ? { declaredName: options.declaredName } : {}),
    initiatedBy: options.initiatedBy,
    ...(options.receivedAt ? { receivedAt: options.receivedAt } : {}),
    declaredDescription: 'Talos arbitrary-image business-process review input',
  });

  let perception: ImagePerceptionAdmissionBundle;
  let perceptionRouting: ImagePerceptionFallbackRoutingRecord | undefined;
  let perceptionSufficiency: ImagePerceptionSufficiencyAssessment | undefined;

  if (options.fallbackBinding) {
    const routed = await runCorrelatedImagePerceptionWithFallback(
      repo,
      byteStore,
      intake,
      binding,
      options.fallbackBinding,
      {
        ...(options.perceivedAt ? { now: options.perceivedAt } : {}),
        ...(options.sufficiencyPolicy ? { sufficiencyPolicy: options.sufficiencyPolicy } : {}),
        ...(options.fetchImpl ? { primaryFetch: options.fetchImpl } : {}),
        ...(options.fallbackFetchImpl ? { fallbackFetch: options.fallbackFetchImpl } : {}),
      },
    );
    perceptionRouting = routed.routing;
    perception = routed.selected ?? routed.fallback ?? routed.primary;
    perceptionSufficiency = routed.selected
      ? routed.selected === routed.primary
        ? routed.routing.primaryAssessment
        : routed.routing.fallbackAssessment
      : routed.routing.fallbackAssessment ?? routed.routing.primaryAssessment;

    if (!routed.selected) {
      return {
        status: 'SAFE_STOP_BEFORE_CANONICAL',
        intake,
        perception,
        perceptionRouting,
        ...(perceptionSufficiency ? { perceptionSufficiency } : {}),
        automaticConfirmationAuthorized: false,
        automaticFreezeAuthorized: false,
        automaticExecutionAuthorized: false,
      };
    }
  } else {
    perception = await runCorrelatedConfiguredImagePerceptionAdmission(
      repo,
      byteStore,
      intake,
      binding,
      { ...(options.perceivedAt ? { now: options.perceivedAt } : {}) },
      options.fetchImpl ?? fetch,
    );
    perceptionSufficiency = assessImagePerceptionSufficiency(
      perception.providerResult,
      options.sufficiencyPolicy,
    );
    if (
      perception.admission.decision !== 'ADMITTED_FOR_REVIEW'
      || !perception.attempt.result
      || perceptionSufficiency.status !== 'SUFFICIENT'
    ) {
      return {
        status: 'SAFE_STOP_BEFORE_CANONICAL',
        intake,
        perception,
        perceptionSufficiency,
        automaticConfirmationAuthorized: false,
        automaticFreezeAuthorized: false,
        automaticExecutionAuthorized: false,
      };
    }
  }

  if (perception.admission.decision !== 'ADMITTED_FOR_REVIEW' || !perception.attempt.result) {
    return {
      status: 'SAFE_STOP_BEFORE_CANONICAL',
      intake,
      perception,
      ...(perceptionRouting ? { perceptionRouting } : {}),
      ...(perceptionSufficiency ? { perceptionSufficiency } : {}),
      automaticConfirmationAuthorized: false,
      automaticFreezeAuthorized: false,
      automaticExecutionAuthorized: false,
    };
  }

  const semantic = normalizeAndValidateImageResult(repo, perception.attempt.result.id, {
    ...(options.normalizedAt ? { normalizedAt: options.normalizedAt } : {}),
    ...(options.assessedAt ? { assessedAt: options.assessedAt } : {}),
  });

  const projectedAt = options.projectedAt ?? options.assessedAt ?? options.normalizedAt ?? options.perceivedAt ?? new Date().toISOString();
  const baseProjection = projectCanonicalProcessToBpmn({
    processRevision: semantic.normalization.processRevision,
    sourceRoute: 'IMAGE_INTERPRETATION',
    createdAt: projectedAt,
    createdBy: options.initiatedBy,
    ...(options.bpmnRevisionNumber ? { revisionNumber: options.bpmnRevisionNumber } : {}),
  });
  const projection: BpmnProjectionResult = {
    ...baseProjection,
    bpmnRevision: {
      ...baseProjection.bpmnRevision,
      sourceRepresentationRefs: [intake.representation.id],
    },
  };
  persistBpmnProjection(repo, projection);

  return {
    status: 'BPMN_READY_FOR_PROCESS_REVIEW',
    intake,
    perception,
    ...(perceptionRouting ? { perceptionRouting } : {}),
    ...(perceptionSufficiency ? { perceptionSufficiency } : {}),
    semantic,
    projection,
    automaticConfirmationAuthorized: false,
    automaticFreezeAuthorized: false,
    automaticExecutionAuthorized: false,
  };
}
