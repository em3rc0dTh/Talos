import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { SourceId } from '../../source-intake/src/types.ts';
import { runImagePerception, type ImagePerceptionAttemptBundle, type RunImagePerceptionOptions } from './perception-adapter.ts';
import type { ImagePerceptionProvider, ImagePerceptionProviderRequest, ImagePerceptionProviderResult } from './perception-types.ts';
import type { ImageIntakeBundle } from './types.ts';

const ADMISSION_SCHEMA = 'image-perception-admission-v0.1';

export type ImagePerceptionAdmissionDecision =
  | 'ADMITTED_FOR_REVIEW'
  | 'SAFE_STOP_NO_RESULT'
  | 'SAFE_STOP_PROVIDER_FAILURE';

export interface ImagePerceptionAdmissionRecord {
  id: SourceId;
  sourceArtifactId: SourceId;
  sourceRepresentationId: SourceId;
  sourceContentSha256: string;
  sourceByteIdentityStatus: ImageIntakeBundle['representation']['byteIdentityStatus'];
  coordinateSpace: {
    width: number;
    height: number;
    basis: ImageIntakeBundle['coordinateSpace']['coordinateBasis'];
  };
  adapterAttemptId: SourceId;
  adapterCompletionStatus: 'SUCCEEDED'|'PARTIAL'|'FAILED'|'MISSING';
  adapterResultRef?: SourceId;
  providerId: string;
  providerVersion: string;
  providerStatus: ImagePerceptionProviderResult['status'];
  decision: ImagePerceptionAdmissionDecision;
  reasonCodes: string[];
  requiresHumanReview: boolean;
  semanticAuthority: 'NONE';
  automaticFreezeAuthorized: false;
  automaticExecutionAuthorized: false;
  commonEvidenceGraphRefs: SourceId[];
  diagnosticRefs: SourceId[];
  admittedAt: string;
}

export interface RunImagePerceptionAdmissionOptions extends RunImagePerceptionOptions {
  admissionAt?: string;
}

export interface ImagePerceptionAdmissionBundle extends ImagePerceptionAttemptBundle {
  admission: ImagePerceptionAdmissionRecord;
}

interface CapturedProviderFailure {
  code: 'IMAGE_PERCEPTION_PROVIDER_FAILURE';
  description: string;
}

function providerFailureDescription(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    return message ? `${error.name}: ${message}` : error.name;
  }
  if (typeof error === 'string' && error.trim()) return error.trim();
  return 'Image perception provider threw an unknown error.';
}

function failureResult(provider: ImagePerceptionProvider, failure: CapturedProviderFailure): ImagePerceptionProviderResult {
  return {
    providerId: provider.providerId,
    providerVersion: provider.providerVersion,
    providerClass: 'SOURCE_DEFINED',
    modelRef: `provider:${provider.providerId}`,
    modelVersion: provider.providerVersion,
    pipelineVersion: 'provider-execution-failed',
    evidenceMode: 'SOURCE_DEFINED',
    status: 'NO_RESULT',
    anchors: [],
    observations: [],
    occurrenceCandidates: [],
    alternativeSets: [],
    relationCandidates: [],
    diagnostics: [{ code: failure.code, description: failure.description }],
  };
}

function failureCapturingProvider(provider: ImagePerceptionProvider): {
  provider: ImagePerceptionProvider;
  failure: () => CapturedProviderFailure | undefined;
} {
  let captured: CapturedProviderFailure | undefined;
  return {
    provider: {
      providerId: provider.providerId,
      providerVersion: provider.providerVersion,
      perceive(request: ImagePerceptionProviderRequest): ImagePerceptionProviderResult {
        try {
          return provider.perceive(request);
        } catch (error) {
          captured = {
            code: 'IMAGE_PERCEPTION_PROVIDER_FAILURE',
            description: providerFailureDescription(error),
          };
          return failureResult(provider, captured);
        }
      },
    },
    failure: () => captured,
  };
}

function appendAdmission(repo: ImmutableDocumentRepository, record: ImagePerceptionAdmissionRecord): void {
  repo.append({
    id: record.id,
    aggregateKind: 'ImagePerceptionAdmissionRecord',
    schemaVersion: ADMISSION_SCHEMA,
    payload: record,
    createdAt: record.admittedAt,
  });
}

export function runImagePerceptionAdmission(
  repo: ImmutableDocumentRepository,
  intake: ImageIntakeBundle,
  provider: ImagePerceptionProvider,
  options: RunImagePerceptionAdmissionOptions = {},
): ImagePerceptionAdmissionBundle {
  const admittedAt = options.admissionAt ?? options.now ?? new Date().toISOString();
  const safe = failureCapturingProvider(provider);
  const attempt = runImagePerception(repo, intake, safe.provider, {
    ...options,
    materializeCommonEvidence: options.materializeCommonEvidence ?? true,
  });
  const providerFailure = safe.failure();

  let decision: ImagePerceptionAdmissionDecision;
  let reasonCodes: string[];
  if (providerFailure) {
    decision = 'SAFE_STOP_PROVIDER_FAILURE';
    reasonCodes = [providerFailure.code];
  } else if (attempt.providerResult.status === 'NO_RESULT') {
    decision = 'SAFE_STOP_NO_RESULT';
    reasonCodes = attempt.providerResult.diagnostics.map((item) => item.code);
  } else if (attempt.providerResult.status === 'PARTIAL') {
    decision = 'ADMITTED_FOR_REVIEW';
    reasonCodes = ['PROVIDER_PARTIAL_EVIDENCE', ...attempt.providerResult.diagnostics.map((item) => item.code)];
  } else {
    decision = 'ADMITTED_FOR_REVIEW';
    reasonCodes = ['PROVIDER_INFERENCE_REQUIRES_REVIEW', ...attempt.providerResult.diagnostics.map((item) => item.code)];
  }

  const admission: ImagePerceptionAdmissionRecord = {
    id: createOpaqueId('source', `image-perception-admission:${attempt.attempt.start.id}`),
    sourceArtifactId: intake.artifact.id,
    sourceRepresentationId: intake.representation.id,
    sourceContentSha256: intake.representation.contentHash,
    sourceByteIdentityStatus: intake.representation.byteIdentityStatus,
    coordinateSpace: {
      width: intake.coordinateSpace.width,
      height: intake.coordinateSpace.height,
      basis: intake.coordinateSpace.coordinateBasis,
    },
    adapterAttemptId: attempt.attempt.start.id,
    adapterCompletionStatus: attempt.attempt.completion?.status ?? 'MISSING',
    ...(attempt.attempt.result ? { adapterResultRef: attempt.attempt.result.id } : {}),
    providerId: provider.providerId,
    providerVersion: provider.providerVersion,
    providerStatus: attempt.providerResult.status,
    decision,
    reasonCodes: [...new Set(reasonCodes)],
    requiresHumanReview: decision === 'ADMITTED_FOR_REVIEW',
    semanticAuthority: 'NONE',
    automaticFreezeAuthorized: false,
    automaticExecutionAuthorized: false,
    commonEvidenceGraphRefs: attempt.commonEvidence ? [attempt.commonEvidence.graph.id] : [],
    diagnosticRefs: attempt.attempt.diagnostics.map((item) => item.id),
    admittedAt,
  };
  appendAdmission(repo, admission);

  return { ...attempt, admission };
}
