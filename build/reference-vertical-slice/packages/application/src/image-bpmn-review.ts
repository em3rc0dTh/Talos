import type { OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  intakePngUpload,
  runCorrelatedConfiguredImagePerceptionAdmission,
  type ImageIntakeBundle,
  type ImagePerceptionAdmissionBundle,
  type ImagePerceptionRuntimeBinding,
  type LocalImageByteStore,
} from '../../image-perception/src/index.ts';
import {
  projectCanonicalProcessToBpmn,
  type BpmnProjectionResult,
} from '../../review/src/index.ts';
import { normalizeAndValidateImageResult, type ImageSemanticBundle } from './image-semantic.ts';

const BPMN_WORKSPACE_SCHEMA = 'talos-bpmn-workspace-v0.1';

export type ImageBpmnReviewResult =
  | {
      status: 'SAFE_STOP_BEFORE_CANONICAL';
      intake: ImageIntakeBundle;
      perception: ImagePerceptionAdmissionBundle;
      automaticConfirmationAuthorized: false;
      automaticFreezeAuthorized: false;
      automaticExecutionAuthorized: false;
    }
  | {
      status: 'BPMN_READY_FOR_PROCESS_REVIEW';
      intake: ImageIntakeBundle;
      perception: ImagePerceptionAdmissionBundle;
      semantic: ImageSemanticBundle;
      projection: BpmnProjectionResult;
      automaticConfirmationAuthorized: false;
      automaticFreezeAuthorized: false;
      automaticExecutionAuthorized: false;
    };

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
 * Strongest image-to-review orchestration available after I7C-04.
 *
 * A model safe-stop cannot cross into canonical normalization. A successful
 * perception admission is normalized as INFERRED business meaning, validated,
 * and projected into a non-executable DRAFT BPMN revision for human review.
 * No confirmation, freeze, deployment, or execution authority is created.
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

  const perception = await runCorrelatedConfiguredImagePerceptionAdmission(
    repo,
    byteStore,
    intake,
    binding,
    { ...(options.perceivedAt ? { now: options.perceivedAt } : {}) },
    options.fetchImpl ?? fetch,
  );

  if (perception.admission.decision !== 'ADMITTED_FOR_REVIEW' || !perception.attempt.result) {
    return {
      status: 'SAFE_STOP_BEFORE_CANONICAL',
      intake,
      perception,
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
  const projection = projectCanonicalProcessToBpmn({
    processRevision: semantic.normalization.processRevision,
    sourceRoute: 'IMAGE_INTERPRETATION',
    createdAt: projectedAt,
    createdBy: options.initiatedBy,
    ...(options.bpmnRevisionNumber ? { revisionNumber: options.bpmnRevisionNumber } : {}),
  });
  persistBpmnProjection(repo, projection);

  return {
    status: 'BPMN_READY_FOR_PROCESS_REVIEW',
    intake,
    perception,
    semantic,
    projection,
    automaticConfirmationAuthorized: false,
    automaticFreezeAuthorized: false,
    automaticExecutionAuthorized: false,
  };
}
