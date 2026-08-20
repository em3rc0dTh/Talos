import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import { appendRecord, getAttemptView } from '../../source-intake/src/store.ts';
import type {
  AdapterAttemptCompletion,
  AdapterAttemptStart,
  AdapterAttemptView,
  AdapterDiagnostic,
  AdapterResult,
  SourceId,
} from '../../source-intake/src/types.ts';
import type { ImageIntakeBundle } from './types.ts';
import type {
  ImagePerceptionProvider,
  ImagePerceptionProviderResult,
  PerceptionAlternativeSet,
  PerceptionObservation,
  PerceptionRelationCandidate,
  VisualEvidenceAnchor,
} from './perception-types.ts';

export interface ImagePerceptionAttemptBundle {
  attempt: AdapterAttemptView;
  providerResult: ImagePerceptionProviderResult;
  anchors: VisualEvidenceAnchor[];
  observations: PerceptionObservation[];
  alternativeSets: PerceptionAlternativeSet[];
  relationCandidates: PerceptionRelationCandidate[];
}

export interface RunImagePerceptionOptions {
  now?: string;
  adapterVersion?: string;
  perceptionPipelineVersion?: string;
}

function providerInputFingerprint(
  intake: ImageIntakeBundle,
  provider: ImagePerceptionProvider,
  adapterVersion: string,
  pipelineVersion: string,
): string {
  return digestDeterministicJson({
    representationDigest: intake.representation.contentHash,
    adapterId: 'ImagePerceptionAdapter',
    adapterVersion,
    providerId: provider.providerId,
    providerVersion: provider.providerVersion,
    perceptionPipelineVersion: pipelineVersion,
    coordinateSpace: {
      width: intake.coordinateSpace.width,
      height: intake.coordinateSpace.height,
      basis: intake.coordinateSpace.coordinateBasis,
    },
  });
}

export function runImagePerception(
  repo: ImmutableDocumentRepository,
  intake: ImageIntakeBundle,
  provider: ImagePerceptionProvider,
  options: RunImagePerceptionOptions = {},
): ImagePerceptionAttemptBundle {
  const now = options.now ?? new Date().toISOString();
  const adapterVersion = options.adapterVersion ?? '0.1.0-reference';
  const pipelineVersion = options.perceptionPipelineVersion ?? 'image-perception-v0.1';
  const attemptId = createOpaqueId('source');
  const inputFingerprint = providerInputFingerprint(intake, provider, adapterVersion, pipelineVersion);

  const start: AdapterAttemptStart = {
    id: attemptId,
    sourceIntakeSessionId: intake.session.id,
    sourceOriginId: intake.origin.id,
    sourceArtifactId: intake.artifact.id,
    sourceRepresentationId: intake.representation.id,
    adapterId: 'ImagePerceptionAdapter',
    adapterVersion,
    mappingRegistryVersion: 'image-perception-materialization-v0.1',
    canonicalModelVersion: 'v0.1',
    extractionMode: 'VISUAL_PERCEPTION',
    inputFingerprint,
    status: 'STARTED',
    startedAt: now,
  };
  appendRecord(repo, 'AdapterAttemptStart', start, now, createOpaqueId('source', `image-attempt-start:${attemptId}`));

  const providerResult = provider.perceive({
    sourceRepresentationId: intake.representation.id,
    contentSha256: intake.representation.contentHash,
    mediaType: 'image/png',
    coordinateSpace: intake.coordinateSpace,
  });

  if (providerResult.status === 'NO_RESULT') {
    const diagnosticIds: SourceId[] = [];
    for (const item of providerResult.diagnostics) {
      const diagnostic: AdapterDiagnostic = {
        id: createOpaqueId('source', `image-diagnostic:${attemptId}:${item.code}`),
        adapterAttemptId: attemptId,
        code: item.code,
        severity: 'WARNING',
        description: item.description,
        impact: 'Source bytes remain preserved; no perception or process output is fabricated.',
        recoverability: 'Use a compatible perception provider/model or retain the image as preserved source-only evidence.',
      };
      appendRecord(repo, 'AdapterDiagnostic', diagnostic, now, diagnostic.id);
      diagnosticIds.push(diagnostic.id);
    }
    const completion: AdapterAttemptCompletion = {
      id: createOpaqueId('source', `image-attempt-completion:${attemptId}:PARTIAL`),
      adapterAttemptId: attemptId,
      status: 'PARTIAL',
      completedAt: now,
      failureStage: 'SOURCE_DEFINED',
      diagnosticIds,
    };
    appendRecord(repo, 'AdapterAttemptCompletion', completion, now, completion.id);
    return {
      attempt: getAttemptView(repo, attemptId)!,
      providerResult,
      anchors: [],
      observations: [],
      alternativeSets: [],
      relationCandidates: [],
    };
  }

  const anchorIdByKey = new Map<string, SourceId>();
  const observationIdByKey = new Map<string, SourceId>();
  const alternativeSetIdByKey = new Map<string, SourceId>();
  const alternativeIdByKey = new Map<string, SourceId>();

  for (const anchor of providerResult.anchors) {
    anchorIdByKey.set(anchor.providerAnchorKey, createOpaqueId('source', `visual-anchor:${attemptId}:${anchor.providerAnchorKey}`));
  }
  for (const observation of providerResult.observations) {
    observationIdByKey.set(observation.providerObservationKey, createOpaqueId('source', `perception-observation:${attemptId}:${observation.providerObservationKey}`));
  }
  for (const set of providerResult.alternativeSets) {
    alternativeSetIdByKey.set(set.providerAlternativeSetKey, createOpaqueId('source', `perception-alt-set:${attemptId}:${set.providerAlternativeSetKey}`));
    for (const alternative of set.alternatives) {
      alternativeIdByKey.set(alternative.providerAlternativeKey, createOpaqueId('source', `perception-alt:${attemptId}:${alternative.providerAlternativeKey}`));
    }
  }

  const anchors: VisualEvidenceAnchor[] = providerResult.anchors.map((anchor) => {
    const record: VisualEvidenceAnchor = {
      id: anchorIdByKey.get(anchor.providerAnchorKey)!,
      sourceRepresentationId: intake.representation.id,
      coordinateSpaceId: intake.coordinateSpace.id,
      geometryKind: anchor.geometryKind,
      geometry: anchor.geometry,
      visibilityState: anchor.visibilityState,
      anchorDigest: digestDeterministicJson({ geometryKind: anchor.geometryKind, geometry: anchor.geometry }),
      ...(anchor.notes ? { notes: anchor.notes } : {}),
    };
    appendRecord(repo, 'VisualEvidenceAnchor', record, now, record.id);
    return record;
  });

  const alternativeSets: PerceptionAlternativeSet[] = providerResult.alternativeSets.map((set) => {
    const record: PerceptionAlternativeSet = {
      id: alternativeSetIdByKey.get(set.providerAlternativeSetKey)!,
      adapterAttemptId: attemptId,
      ...(set.subjectObservationKey && observationIdByKey.has(set.subjectObservationKey)
        ? { subjectObservationRef: observationIdByKey.get(set.subjectObservationKey)! }
        : {}),
      propertyPath: set.propertyPath,
      alternatives: set.alternatives.map((alternative) => ({
        id: alternativeIdByKey.get(alternative.providerAlternativeKey)!,
        value: alternative.value,
        ...(alternative.confidence !== undefined ? { confidence: alternative.confidence } : {}),
        evidenceAnchorRefs: alternative.anchorKeys.map((key) => anchorIdByKey.get(key)!),
        supportingObservationRefs: alternative.supportingObservationKeys.map((key) => observationIdByKey.get(key)!),
        ...(alternative.interpretationNotes ? { interpretationNotes: alternative.interpretationNotes } : {}),
      })),
      exclusivityMode: set.exclusivityMode,
      ...(set.modelPreferredAlternativeKey ? { modelPreferredAlternativeId: alternativeIdByKey.get(set.modelPreferredAlternativeKey)! } : {}),
      ...(set.modelPreferenceConfidence !== undefined ? { modelPreferenceConfidence: set.modelPreferenceConfidence } : {}),
      createdAt: now,
    };
    appendRecord(repo, 'PerceptionAlternativeSet', record, now, record.id);
    return record;
  });

  const alternativeSetForObservation = new Map<string, SourceId>();
  for (const set of providerResult.alternativeSets) {
    if (set.subjectObservationKey) alternativeSetForObservation.set(set.subjectObservationKey, alternativeSetIdByKey.get(set.providerAlternativeSetKey)!);
  }

  const observations: PerceptionObservation[] = providerResult.observations.map((observation) => {
    const record: PerceptionObservation = {
      id: observationIdByKey.get(observation.providerObservationKey)!,
      adapterAttemptId: attemptId,
      sourceRepresentationId: intake.representation.id,
      anchorId: anchorIdByKey.get(observation.anchorKey)!,
      observationKind: observation.observationKind,
      ...(observation.observedValue !== undefined ? { observedValue: observation.observedValue } : {}),
      ...(observation.confidence !== undefined ? { confidence: observation.confidence } : {}),
      modelRef: providerResult.modelRef,
      modelVersion: providerResult.modelVersion,
      pipelineStage: providerResult.pipelineVersion,
      createdAt: now,
      ...(alternativeSetForObservation.has(observation.providerObservationKey)
        ? { alternativeSetRef: alternativeSetForObservation.get(observation.providerObservationKey)! }
        : {}),
      ...(observation.parentObservationKeys?.length
        ? { parentObservationRefs: observation.parentObservationKeys.map((key) => observationIdByKey.get(key)!) }
        : {}),
      ...(observation.notes ? { notes: observation.notes } : {}),
    };
    appendRecord(repo, 'PerceptionObservation', record, now, record.id);
    return record;
  });

  const relationCandidates: PerceptionRelationCandidate[] = providerResult.relationCandidates.map((relation) => {
    const record: PerceptionRelationCandidate = {
      id: createOpaqueId('source', `perception-relation:${attemptId}:${relation.providerRelationKey}`),
      adapterAttemptId: attemptId,
      strokeObservationRefs: relation.strokeObservationKeys.map((key) => observationIdByKey.get(key)!),
      relationAnchorRefs: relation.anchorKeys.map((key) => anchorIdByKey.get(key)!),
      ...(relation.existenceConfidence !== undefined ? { existenceConfidence: relation.existenceConfidence } : {}),
      sourceEndpointCandidates: relation.sourceEndpointCandidates.map((candidate) => ({
        ...(candidate.occurrenceCandidateKey ? { occurrenceCandidateRef: candidate.occurrenceCandidateKey } : {}),
        ...(candidate.anchorKey ? { anchorRef: anchorIdByKey.get(candidate.anchorKey)! } : {}),
        endpointState: candidate.endpointState,
        ...(candidate.confidence !== undefined ? { confidence: candidate.confidence } : {}),
      })),
      targetEndpointCandidates: relation.targetEndpointCandidates.map((candidate) => ({
        ...(candidate.occurrenceCandidateKey ? { occurrenceCandidateRef: candidate.occurrenceCandidateKey } : {}),
        ...(candidate.anchorKey ? { anchorRef: anchorIdByKey.get(candidate.anchorKey)! } : {}),
        endpointState: candidate.endpointState,
        ...(candidate.confidence !== undefined ? { confidence: candidate.confidence } : {}),
      })),
      directionCandidates: relation.directionCandidates,
      ...(relation.roleAlternativeSetKey ? { roleAlternativeSetRef: alternativeSetIdByKey.get(relation.roleAlternativeSetKey)! } : {}),
      guardTextObservationRefs: (relation.guardTextObservationKeys ?? []).map((key) => observationIdByKey.get(key)!),
      ...(relation.notes ? { notes: relation.notes } : {}),
    };
    appendRecord(repo, 'PerceptionRelationCandidate', record, now, record.id);
    return record;
  });

  const diagnosticIds: SourceId[] = [];
  for (const item of [
    ...providerResult.diagnostics,
    {
      code: 'COMMON_EVIDENCE_MATERIALIZATION_PENDING',
      description: 'I1 materialized perception history only; common SourceEvidenceGraph / CandidateSemanticScope materialization is an I2 gate.',
    },
  ]) {
    const diagnostic: AdapterDiagnostic = {
      id: createOpaqueId('source', `image-diagnostic:${attemptId}:${item.code}`),
      adapterAttemptId: attemptId,
      code: item.code,
      severity: 'INFO',
      description: item.description,
      impact: 'Perception evidence is preserved, but no image-derived canonical process support is claimed yet.',
      recoverability: 'Advance through I2 common evidence materialization before normalization/canonical support is claimed.',
    };
    appendRecord(repo, 'AdapterDiagnostic', diagnostic, now, diagnostic.id);
    diagnosticIds.push(diagnostic.id);
  }

  const result: AdapterResult = {
    id: createOpaqueId('source', `image-adapter-result:${attemptId}`),
    adapterAttemptId: attemptId,
    sourceOriginIds: [intake.origin.id],
    sourceArtifactIds: [intake.artifact.id],
    sourceRepresentationIds: [intake.representation.id],
    artifactClassificationIds: [],
    sourceEvidenceGraphIds: [],
    candidateScopeIds: [],
    interpretationClaimSetIds: [],
    completedAt: now,
    inputFingerprint,
  };
  appendRecord(repo, 'AdapterResult', result, now, result.id);

  const completion: AdapterAttemptCompletion = {
    id: createOpaqueId('source', `image-attempt-completion:${attemptId}:PARTIAL`),
    adapterAttemptId: attemptId,
    status: 'PARTIAL',
    completedAt: now,
    failureStage: 'RESULT_MATERIALIZATION',
    diagnosticIds,
    resultId: result.id,
  };
  appendRecord(repo, 'AdapterAttemptCompletion', completion, now, completion.id);

  return {
    attempt: getAttemptView(repo, attemptId)!,
    providerResult,
    anchors,
    observations,
    alternativeSets,
    relationCandidates,
  };
}
