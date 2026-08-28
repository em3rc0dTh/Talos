import type { OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  intakePngUpload,
  runCorrelatedConfiguredImagePerceptionAdmission,
  runCorrelatedImagePerceptionWithFallback,
  type ImageIntakeBundle,
  type ImagePerceptionAdmissionBundle,
  type ImagePerceptionFallbackRoutingRecord,
  type ImagePerceptionRuntimeBinding,
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
 * With only one provider configured, the historical path is preserved. When a
 * fallback binding is configured, Talos runs the primary provider first and
 * invokes the fallback automatically only when Talos' deterministic
 * sufficiency gate rejects the primary evidence. If neither attempt is
 * sufficient, canonical normalization is forbidden.
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

    if (!routed.selected) {
      return {
        status: 'SAFE_STOP_BEFORE_CANONICAL',
        intake,
        perception,
        perceptionRouting,
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
  }

  if (perception.admission.decision !== 'ADMITTED_FOR_REVIEW' || !perception.attempt.result) {
    return {
      status: 'SAFE_STOP_BEFORE_CANONICAL',
      intake,
      perception,
      ...(perceptionRouting ? { perceptionRouting } : {}),
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
    semantic,
    projection,
    automaticConfirmationAuthorized: false,
    automaticFreezeAuthorized: false,
    automaticExecutionAuthorized: false,
  };
}
