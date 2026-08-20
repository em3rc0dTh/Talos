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
  ArtifactClassification,
  CandidateSemanticScope,
  SourceEvidenceGraph,
  SourceId,
  SourceOccurrenceDescriptor,
  SourcePlaneDescriptor,
  SourcePlaneKind,
  SourcePropertyEvidenceDescriptor,
  SourceRelationshipDescriptor,
} from '../../source-intake/src/types.ts';
import type { ImageIntakeBundle } from './types.ts';
import type {
  ImagePerceptionProvider,
  ImagePerceptionProviderResult,
  PerceptionAlternativeSet,
  PerceptionObservation,
  PerceptionRelationCandidate,
  ProviderRelationCandidate,
  VisualEvidenceAnchor,
} from './perception-types.ts';

export interface ImageCommonEvidenceBundle {
  planes: SourcePlaneDescriptor[];
  properties: SourcePropertyEvidenceDescriptor[];
  occurrences: SourceOccurrenceDescriptor[];
  relationships: SourceRelationshipDescriptor[];
  classification: ArtifactClassification;
  graph: SourceEvidenceGraph;
  scope: CandidateSemanticScope;
}

export interface ImagePerceptionAttemptBundle {
  attempt: AdapterAttemptView;
  providerResult: ImagePerceptionProviderResult;
  anchors: VisualEvidenceAnchor[];
  observations: PerceptionObservation[];
  alternativeSets: PerceptionAlternativeSet[];
  relationCandidates: PerceptionRelationCandidate[];
  commonEvidence?: ImageCommonEvidenceBundle;
}

export interface RunImagePerceptionOptions {
  now?: string;
  adapterVersion?: string;
  perceptionPipelineVersion?: string;
  materializeCommonEvidence?: boolean;
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

function completionId(attemptId: SourceId, status: string): SourceId {
  return createOpaqueId('source', `image-attempt-completion:${attemptId}:${status}`);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function inferredClassification(
  intake: ImageIntakeBundle,
  providerResult: ImagePerceptionProviderResult,
  attemptId: SourceId,
): ArtifactClassification {
  const planeKinds = new Set(providerResult.occurrenceCandidates.map((item) => item.sourcePlaneKind));
  const artifactClass = planeKinds.has('RESPONSIBILITY_COLLABORATION') && planeKinds.has('BUSINESS_GRAPH')
    ? 'COLLABORATION_DIAGRAM'
    : planeKinds.has('BUSINESS_GRAPH')
      ? 'PROCESS_DIAGRAM'
      : 'UNKNOWN';
  const confidences = providerResult.occurrenceCandidates
    .map((item) => item.confidence)
    .filter((value): value is number => value !== undefined);
  const confidence = confidences.length ? Math.min(...confidences) : undefined;

  return {
    id: createOpaqueId('source', `image-classification:${attemptId}`),
    sourceArtifactId: intake.artifact.id,
    artifactClass,
    truthClass: 'INFERRED',
    ...(confidence !== undefined ? { confidence } : {}),
    evidenceFragmentRefs: [],
    classifierRef: `ImagePerceptionAdapter/${providerResult.providerId}`,
    classifierVersion: providerResult.providerVersion,
  };
}

function materializeCommonEvidence(
  repo: ImmutableDocumentRepository,
  intake: ImageIntakeBundle,
  providerResult: ImagePerceptionProviderResult,
  attemptId: SourceId,
  now: string,
  anchors: VisualEvidenceAnchor[],
  observations: PerceptionObservation[],
  alternativeSets: PerceptionAlternativeSet[],
  relationCandidates: PerceptionRelationCandidate[],
): ImageCommonEvidenceBundle {
  const observationIdByKey = new Map(providerResult.observations.map((item, index) => [item.providerObservationKey, observations[index].id]));
  const observationByKey = new Map(providerResult.observations.map((item) => [item.providerObservationKey, item]));
  const anchorIdByKey = new Map(providerResult.anchors.map((item, index) => [item.providerAnchorKey, anchors[index].id]));
  const alternativeSetIdByKey = new Map(providerResult.alternativeSets.map((item, index) => [item.providerAlternativeSetKey, alternativeSets[index].id]));
  const relationCandidateIdByKey = new Map(providerResult.relationCandidates.map((item, index) => [item.providerRelationKey, relationCandidates[index].id]));

  const planeKinds = unique(providerResult.occurrenceCandidates.map((item) => item.sourcePlaneKind)).sort();
  const planes: SourcePlaneDescriptor[] = planeKinds.map((kind) => {
    const plane: SourcePlaneDescriptor = {
      id: createOpaqueId('source', `image-plane:${attemptId}:${kind}`),
      sourceArtifactId: intake.artifact.id,
      kind,
      description: 'Perception-derived source plane; classification remains inferred.',
    };
    appendRecord(repo, 'SourcePlaneDescriptor', plane, now, plane.id);
    return plane;
  });
  const planeIdByKind = new Map<SourcePlaneKind, SourceId>(planes.map((plane) => [plane.kind, plane.id]));

  const occurrenceIdByKey = new Map<string, SourceId>();
  for (const candidate of providerResult.occurrenceCandidates) {
    occurrenceIdByKey.set(candidate.providerOccurrenceKey, createOpaqueId('source', `image-occurrence:${attemptId}:${candidate.providerOccurrenceKey}`));
  }

  const properties: SourcePropertyEvidenceDescriptor[] = [];
  const propertyRefsByOccurrenceKey = new Map<string, SourceId[]>();
  const propertyExtensionRefsByOccurrenceKey = new Map<string, SourceId[]>();
  for (const candidate of providerResult.occurrenceCandidates) {
    const refs: SourceId[] = [];
    const extensionRefs: SourceId[] = [];
    for (const [index, property] of (candidate.propertyCandidates ?? []).entries()) {
      const sourceExtensionRefs = unique([
        ...property.supportingObservationKeys.map((key) => observationIdByKey.get(key)).filter((id): id is SourceId => Boolean(id)),
        ...candidate.anchorKeys.map((key) => anchorIdByKey.get(key)).filter((id): id is SourceId => Boolean(id)),
      ]);
      const descriptor: SourcePropertyEvidenceDescriptor = {
        id: createOpaqueId('source', `image-property:${attemptId}:${candidate.providerOccurrenceKey}:${index}:${property.propertyPath}`),
        sourceRepresentationId: intake.representation.id,
        propertyPath: property.propertyPath,
        ...(property.sourceState ? { sourceState: property.sourceState } : {}),
        ...(property.literalValue !== undefined ? { literalValue: property.literalValue } : {}),
        sourceExtensionRefs,
      };
      appendRecord(repo, 'SourcePropertyEvidenceDescriptor', descriptor, now, descriptor.id);
      properties.push(descriptor);
      refs.push(descriptor.id);
      extensionRefs.push(descriptor.id, ...sourceExtensionRefs);
    }
    propertyRefsByOccurrenceKey.set(candidate.providerOccurrenceKey, refs);
    propertyExtensionRefsByOccurrenceKey.set(candidate.providerOccurrenceKey, unique(extensionRefs));
  }

  const occurrences: SourceOccurrenceDescriptor[] = providerResult.occurrenceCandidates.map((candidate) => {
    const labelObservation = candidate.literalLabelObservationKey
      ? observationByKey.get(candidate.literalLabelObservationKey)
      : undefined;
    const literalLabel = typeof labelObservation?.observedValue === 'string' ? labelObservation.observedValue : undefined;
    const sourceExtensionRefs = unique([
      ...candidate.supportingObservationKeys.map((key) => observationIdByKey.get(key)).filter((id): id is SourceId => Boolean(id)),
      ...candidate.anchorKeys.map((key) => anchorIdByKey.get(key)).filter((id): id is SourceId => Boolean(id)),
      ...(propertyExtensionRefsByOccurrenceKey.get(candidate.providerOccurrenceKey) ?? []),
    ]);
    const descriptor: SourceOccurrenceDescriptor = {
      sourceOccurrenceId: occurrenceIdByKey.get(candidate.providerOccurrenceKey)!,
      occurrenceKind: candidate.occurrenceKind,
      ...(literalLabel ? { literalLabel } : {}),
      ...(candidate.candidateSemanticType ? { candidateSemanticType: candidate.candidateSemanticType } : {}),
      sourcePlaneRef: planeIdByKind.get(candidate.sourcePlaneKind)!,
      propertyEvidenceRefs: propertyRefsByOccurrenceKey.get(candidate.providerOccurrenceKey) ?? [],
      sourceExtensionRefs,
    };
    appendRecord(repo, 'SourceOccurrenceDescriptor', descriptor, now, descriptor.sourceOccurrenceId);
    return descriptor;
  });

  function resolvedEndpoint(candidates: ProviderRelationCandidate['sourceEndpointCandidates']): { ref?: SourceId; state: string } {
    const set = candidates.filter((candidate) => candidate.endpointState === 'SET_CANDIDATE' && candidate.occurrenceCandidateKey && occurrenceIdByKey.has(candidate.occurrenceCandidateKey));
    if (set.length === 1) return { ref: occurrenceIdByKey.get(set[0].occurrenceCandidateKey!)!, state: 'SET' };
    if (candidates.some((candidate) => candidate.endpointState === 'OUT_OF_FRAME')) return { state: 'OUT_OF_FRAME' };
    if (candidates.some((candidate) => candidate.endpointState === 'OCCLUDED')) return { state: 'OCCLUDED' };
    return { state: 'UNKNOWN' };
  }

  function preferredRole(relation: ProviderRelationCandidate): string | undefined {
    if (!relation.roleAlternativeSetKey) return undefined;
    const set = providerResult.alternativeSets.find((item) => item.providerAlternativeSetKey === relation.roleAlternativeSetKey);
    if (!set?.modelPreferredAlternativeKey) return undefined;
    const preferred = set.alternatives.find((item) => item.providerAlternativeKey === set.modelPreferredAlternativeKey);
    return typeof preferred?.value === 'string' ? preferred.value : undefined;
  }

  const relationships: SourceRelationshipDescriptor[] = providerResult.relationCandidates.map((relation) => {
    const source = resolvedEndpoint(relation.sourceEndpointCandidates);
    const target = resolvedEndpoint(relation.targetEndpointCandidates);
    const relationCandidateRef = relationCandidateIdByKey.get(relation.providerRelationKey)!;
    const role = preferredRole(relation);
    const sourceExtensionRefs = unique([
      relationCandidateRef,
      ...relation.strokeObservationKeys.map((key) => observationIdByKey.get(key)).filter((id): id is SourceId => Boolean(id)),
      ...relation.anchorKeys.map((key) => anchorIdByKey.get(key)).filter((id): id is SourceId => Boolean(id)),
      ...(relation.roleAlternativeSetKey && alternativeSetIdByKey.get(relation.roleAlternativeSetKey)
        ? [alternativeSetIdByKey.get(relation.roleAlternativeSetKey)!]
        : []),
    ]);
    const descriptor: SourceRelationshipDescriptor = {
      sourceOccurrenceId: createOpaqueId('source', `image-relationship:${attemptId}:${relation.providerRelationKey}`),
      ...(source.ref ? { sourceRef: source.ref } : {}),
      ...(target.ref ? { targetRef: target.ref } : {}),
      sourceEndpointState: source.state,
      targetEndpointState: target.state,
      ...(role ? { candidateRelationshipRole: role } : {}),
      directionEvidence: {
        candidates: relation.directionCandidates,
        perceptionRelationCandidateRef: relationCandidateRef,
      },
      propertyEvidenceRefs: [],
      sourceExtensionRefs,
    };
    appendRecord(repo, 'SourceRelationshipDescriptor', descriptor, now, descriptor.sourceOccurrenceId);
    return descriptor;
  });

  const classification = inferredClassification(intake, providerResult, attemptId);
  appendRecord(repo, 'ArtifactClassification', classification, now, classification.id);

  const perceptionExtensionRefs = unique([
    intake.coordinateSpace.id,
    ...anchors.map((item) => item.id),
    ...observations.map((item) => item.id),
    ...alternativeSets.map((item) => item.id),
    ...relationCandidates.map((item) => item.id),
    ...properties.map((item) => item.id),
  ]);
  const graph: SourceEvidenceGraph = {
    id: createOpaqueId('source', `image-evidence-graph:${attemptId}`),
    sourceArtifactId: intake.artifact.id,
    sourceRepresentationId: intake.representation.id,
    adapterAttemptId: attemptId,
    occurrenceIds: occurrences.map((item) => item.sourceOccurrenceId),
    relationshipOccurrenceIds: relationships.map((item) => item.sourceOccurrenceId),
    sourcePlaneIds: planes.map((item) => item.id),
    evidenceFragmentIds: [],
    sourceExtensionRefs: perceptionExtensionRefs,
    extractionDigest: digestDeterministicJson({
      providerId: providerResult.providerId,
      providerVersion: providerResult.providerVersion,
      representationDigest: intake.representation.contentHash,
      occurrenceIds: occurrences.map((item) => item.sourceOccurrenceId),
      relationshipOccurrenceIds: relationships.map((item) => item.sourceOccurrenceId),
      propertyEvidenceIds: properties.map((item) => item.id),
      perceptionExtensionRefs,
    }),
  };
  appendRecord(repo, 'SourceEvidenceGraph', graph, now, graph.id);

  const excludedOccurrenceKeys = new Set(
    providerResult.occurrenceCandidates
      .filter((candidate) => ['NOTATION_ANNOTATION', 'AUTHORING_CONTEXT', 'COLLABORATOR_OVERLAY'].includes(candidate.sourcePlaneKind))
      .map((candidate) => candidate.providerOccurrenceKey),
  );
  const excludedOccurrenceRefs = providerResult.occurrenceCandidates
    .filter((candidate) => excludedOccurrenceKeys.has(candidate.providerOccurrenceKey))
    .map((candidate) => occurrenceIdByKey.get(candidate.providerOccurrenceKey)!);
  const includedOccurrenceRefs = [
    ...providerResult.occurrenceCandidates
      .filter((candidate) => !excludedOccurrenceKeys.has(candidate.providerOccurrenceKey))
      .map((candidate) => occurrenceIdByKey.get(candidate.providerOccurrenceKey)!),
    ...relationships.map((item) => item.sourceOccurrenceId),
  ];
  const scopeKind: CandidateSemanticScope['kind'] = classification.artifactClass === 'COLLABORATION_DIAGRAM'
    ? 'COLLABORATION'
    : classification.artifactClass === 'PROCESS_DIAGRAM'
      ? 'PROCESS_CANDIDATE'
      : 'NON_EXECUTABLE_CONTEXT';
  const confidences = providerResult.occurrenceCandidates
    .map((item) => item.confidence)
    .filter((value): value is number => value !== undefined);
  const scope: CandidateSemanticScope = {
    id: createOpaqueId('source', `image-scope:${attemptId}:primary`),
    sourceArtifactId: intake.artifact.id,
    sourceEvidenceGraphId: graph.id,
    kind: scopeKind,
    includedOccurrenceRefs,
    excludedOccurrenceRefs,
    ...(intake.artifact.declaredName ? { candidateName: intake.artifact.declaredName } : {}),
    purpose: 'Perception-derived candidate scope; requires downstream semantic normalization, validation and human review before acceptance.',
    truthClass: 'INFERRED',
    ...(confidences.length ? { confidence: Math.min(...confidences) } : {}),
    evidenceRefs: [graph.id],
  };
  appendRecord(repo, 'CandidateSemanticScope', scope, now, scope.id);

  return { planes, properties, occurrences, relationships, classification, graph, scope };
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
    mappingRegistryVersion: 'image-perception-materialization-v0.2',
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
      id: completionId(attemptId, 'PARTIAL'),
      adapterAttemptId: attemptId,
      status: 'PARTIAL',
      completedAt: now,
      failureStage: 'SOURCE_DEFINED',
      diagnosticIds,
    };
    appendRecord(repo, 'AdapterAttemptCompletion', completion, now, completion.id);
    return { attempt: getAttemptView(repo, attemptId)!, providerResult, anchors: [], observations: [], alternativeSets: [], relationCandidates: [] };
  }

  const anchorIdByKey = new Map<string, SourceId>();
  const observationIdByKey = new Map<string, SourceId>();
  const alternativeSetIdByKey = new Map<string, SourceId>();
  const alternativeIdByKey = new Map<string, SourceId>();

  for (const anchor of providerResult.anchors) anchorIdByKey.set(anchor.providerAnchorKey, createOpaqueId('source', `visual-anchor:${attemptId}:${anchor.providerAnchorKey}`));
  for (const observation of providerResult.observations) observationIdByKey.set(observation.providerObservationKey, createOpaqueId('source', `perception-observation:${attemptId}:${observation.providerObservationKey}`));
  for (const set of providerResult.alternativeSets) {
    alternativeSetIdByKey.set(set.providerAlternativeSetKey, createOpaqueId('source', `perception-alt-set:${attemptId}:${set.providerAlternativeSetKey}`));
    for (const alternative of set.alternatives) alternativeIdByKey.set(alternative.providerAlternativeKey, createOpaqueId('source', `perception-alt:${attemptId}:${alternative.providerAlternativeKey}`));
  }

  const anchors: VisualEvidenceAnchor[] = providerResult.anchors.map((anchor) => {
    const record: VisualEvidenceAnchor = {
      id: anchorIdByKey.get(anchor.providerAnchorKey)!, sourceRepresentationId: intake.representation.id,
      coordinateSpaceId: intake.coordinateSpace.id, geometryKind: anchor.geometryKind, geometry: anchor.geometry,
      visibilityState: anchor.visibilityState,
      anchorDigest: digestDeterministicJson({ geometryKind: anchor.geometryKind, geometry: anchor.geometry }),
      ...(anchor.notes ? { notes: anchor.notes } : {}),
    };
    appendRecord(repo, 'VisualEvidenceAnchor', record, now, record.id);
    return record;
  });

  const alternativeSets: PerceptionAlternativeSet[] = providerResult.alternativeSets.map((set) => {
    const record: PerceptionAlternativeSet = {
      id: alternativeSetIdByKey.get(set.providerAlternativeSetKey)!, adapterAttemptId: attemptId,
      ...(set.subjectObservationKey && observationIdByKey.has(set.subjectObservationKey) ? { subjectObservationRef: observationIdByKey.get(set.subjectObservationKey)! } : {}),
      propertyPath: set.propertyPath,
      alternatives: set.alternatives.map((alternative) => ({
        id: alternativeIdByKey.get(alternative.providerAlternativeKey)!, value: alternative.value,
        ...(alternative.confidence !== undefined ? { confidence: alternative.confidence } : {}),
        evidenceAnchorRefs: alternative.anchorKeys.map((key) => anchorIdByKey.get(key)!),
        supportingObservationRefs: alternative.supportingObservationKeys.map((key) => observationIdByKey.get(key)!),
        ...(alternative.interpretationNotes ? { interpretationNotes: alternative.interpretationNotes } : {}),
      })),
      exclusivityMode: set.exclusivityMode,
      ...(set.modelPreferredAlternativeKey ? { modelPreferredAlternativeId: alternativeIdByKey.get(set.modelPreferredAlternativeKey)! } : {}),
      ...(set.modelPreferenceConfidence !== undefined ? { modelPreferenceConfidence: set.modelPreferenceConfidence } : {}), createdAt: now,
    };
    appendRecord(repo, 'PerceptionAlternativeSet', record, now, record.id);
    return record;
  });

  const alternativeSetForObservation = new Map<string, SourceId>();
  for (const set of providerResult.alternativeSets) if (set.subjectObservationKey) alternativeSetForObservation.set(set.subjectObservationKey, alternativeSetIdByKey.get(set.providerAlternativeSetKey)!);

  const observations: PerceptionObservation[] = providerResult.observations.map((observation) => {
    const record: PerceptionObservation = {
      id: observationIdByKey.get(observation.providerObservationKey)!, adapterAttemptId: attemptId,
      sourceRepresentationId: intake.representation.id, anchorId: anchorIdByKey.get(observation.anchorKey)!,
      observationKind: observation.observationKind,
      ...(observation.observedValue !== undefined ? { observedValue: observation.observedValue } : {}),
      ...(observation.confidence !== undefined ? { confidence: observation.confidence } : {}),
      modelRef: providerResult.modelRef, modelVersion: providerResult.modelVersion, pipelineStage: providerResult.pipelineVersion,
      createdAt: now,
      ...(alternativeSetForObservation.has(observation.providerObservationKey) ? { alternativeSetRef: alternativeSetForObservation.get(observation.providerObservationKey)! } : {}),
      ...(observation.parentObservationKeys?.length ? { parentObservationRefs: observation.parentObservationKeys.map((key) => observationIdByKey.get(key)!) } : {}),
      ...(observation.notes ? { notes: observation.notes } : {}),
    };
    appendRecord(repo, 'PerceptionObservation', record, now, record.id);
    return record;
  });

  const relationCandidates: PerceptionRelationCandidate[] = providerResult.relationCandidates.map((relation) => {
    const record: PerceptionRelationCandidate = {
      id: createOpaqueId('source', `perception-relation:${attemptId}:${relation.providerRelationKey}`), adapterAttemptId: attemptId,
      strokeObservationRefs: relation.strokeObservationKeys.map((key) => observationIdByKey.get(key)!),
      relationAnchorRefs: relation.anchorKeys.map((key) => anchorIdByKey.get(key)!),
      ...(relation.existenceConfidence !== undefined ? { existenceConfidence: relation.existenceConfidence } : {}),
      sourceEndpointCandidates: relation.sourceEndpointCandidates.map((candidate) => ({
        ...(candidate.occurrenceCandidateKey ? { occurrenceCandidateRef: candidate.occurrenceCandidateKey } : {}),
        ...(candidate.anchorKey ? { anchorRef: anchorIdByKey.get(candidate.anchorKey)! } : {}), endpointState: candidate.endpointState,
        ...(candidate.confidence !== undefined ? { confidence: candidate.confidence } : {}),
      })),
      targetEndpointCandidates: relation.targetEndpointCandidates.map((candidate) => ({
        ...(candidate.occurrenceCandidateKey ? { occurrenceCandidateRef: candidate.occurrenceCandidateKey } : {}),
        ...(candidate.anchorKey ? { anchorRef: anchorIdByKey.get(candidate.anchorKey)! } : {}), endpointState: candidate.endpointState,
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

  const commonEvidence = options.materializeCommonEvidence
    ? materializeCommonEvidence(repo, intake, providerResult, attemptId, now, anchors, observations, alternativeSets, relationCandidates)
    : undefined;

  const diagnosticIds: SourceId[] = [];
  const diagnostics = commonEvidence ? providerResult.diagnostics : [
    ...providerResult.diagnostics,
    { code: 'COMMON_EVIDENCE_MATERIALIZATION_PENDING', description: 'I1 materialized perception history only; common SourceEvidenceGraph / CandidateSemanticScope materialization is an I2 gate.' },
  ];
  for (const item of diagnostics) {
    const diagnostic: AdapterDiagnostic = {
      id: createOpaqueId('source', `image-diagnostic:${attemptId}:${item.code}`), adapterAttemptId: attemptId,
      code: item.code, severity: 'INFO', description: item.description,
      impact: commonEvidence ? 'Perception and common source evidence are preserved; no image-derived canonical process support is claimed yet.' : 'Perception evidence is preserved, but no image-derived canonical process support is claimed yet.',
      recoverability: commonEvidence ? 'Proceed through normalization, validation and review gates before accepting semantic meaning.' : 'Advance through I2 common evidence materialization before normalization/canonical support is claimed.',
    };
    appendRecord(repo, 'AdapterDiagnostic', diagnostic, now, diagnostic.id);
    diagnosticIds.push(diagnostic.id);
  }

  const result: AdapterResult = {
    id: createOpaqueId('source', `image-adapter-result:${attemptId}`), adapterAttemptId: attemptId,
    sourceOriginIds: [intake.origin.id], sourceArtifactIds: [intake.artifact.id], sourceRepresentationIds: [intake.representation.id],
    artifactClassificationIds: commonEvidence ? [commonEvidence.classification.id] : [],
    sourceEvidenceGraphIds: commonEvidence ? [commonEvidence.graph.id] : [],
    candidateScopeIds: commonEvidence ? [commonEvidence.scope.id] : [], interpretationClaimSetIds: [], completedAt: now, inputFingerprint,
  };
  appendRecord(repo, 'AdapterResult', result, now, result.id);

  const completion: AdapterAttemptCompletion = {
    id: completionId(attemptId, commonEvidence ? 'SUCCEEDED' : 'PARTIAL'), adapterAttemptId: attemptId,
    status: commonEvidence ? 'SUCCEEDED' : 'PARTIAL', completedAt: now,
    ...(!commonEvidence ? { failureStage: 'RESULT_MATERIALIZATION' as const } : {}), diagnosticIds, resultId: result.id,
  };
  appendRecord(repo, 'AdapterAttemptCompletion', completion, now, completion.id);

  return { attempt: getAttemptView(repo, attemptId)!, providerResult, anchors, observations, alternativeSets, relationCandidates, ...(commonEvidence ? { commonEvidence } : {}) };
}