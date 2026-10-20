import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type {
  AdapterResult,
  CandidateSemanticScope,
  SourceArtifact,
  SourceCapture,
  SourceEvidenceGraph,
  SourceId,
  SourceOccurrenceDescriptor,
  SourceOrigin,
  SourcePropertyEvidenceDescriptor,
  SourceRelationshipDescriptor,
  SourceRepresentation,
} from '../../source-intake/src/types.ts';
import type {
  Actor,
  BusinessRule,
  CanonicalId,
  DataObject,
  EvidenceFragment,
  EvidencePerspective,
  NormalizationBundle,
  ProcessDefinition,
  ProcessEdge,
  ProcessNode,
  ProcessNodeKind,
  ProcessRevision,
  ProvenanceId,
  ProvenanceLink,
  SemanticClaim,
  SourceOccurrence,
  SourceSemanticExtension,
  TransformationRecord,
  TruthClass,
} from '../../semantic-core/src/types.ts';

export interface CommonNormalizationProfile {
  sourceFamily: string;
  extractionMethod: string;
  interpretationMethod: string;
  interpreterVersion: string;
  defaultTruthClass: TruthClass;
  perspective?: EvidencePerspective;
  evidenceType?: string;
  nodeFragmentKind?: EvidenceFragment['fragmentKind'];
  mapRelationshipRole?: (candidateRole?: string, sourceAssertedRole?: string) => ProcessEdge['kind'] | undefined;
  resolveNode?: (input: {
    candidateSemanticType?: string;
    sourceAssertedType?: string;
    literalLabel?: string;
    properties: Record<string, unknown>;
  }) => { kind: ProcessNodeKind; details?: Record<string, unknown> } | undefined;
}

export interface CommonNormalizeOptions { normalizedAt?: string; }

function findPayloadById<T extends { id: any }>(repo: ImmutableDocumentRepository, kind: string, id: any): T | undefined {
  return repo.listByKind<T>(kind).map((document) => document.payload).find((payload) => payload.id === id);
}

function findSourceArtifact(repo: ImmutableDocumentRepository, id: SourceId): SourceArtifact | undefined {
  for (const kind of ['SourceArtifact', 'SourceArtifactObservation']) {
    const artifact = repo.listByKind<SourceArtifact>(kind).map((document) => document.payload).find((item) => item.id === id);
    if (artifact) return artifact;
  }
  return undefined;
}

function nodeKind(candidate?: string): ProcessNodeKind | undefined {
  return ['EVENT', 'ACTION', 'DECISION', 'PARALLEL_SPLIT', 'JOIN', 'WAIT', 'HUMAN_INTERACTION', 'SUBPROCESS', 'STATE', 'END'].includes(candidate ?? '')
    ? candidate as ProcessNodeKind : undefined;
}

function occurrenceKind(kind: string): SourceOccurrence['occurrenceKind'] {
  return ['NODE', 'EDGE', 'LANE', 'PARTICIPANT', 'OBJECT_NODE', 'ANNOTATION', 'EVENT_MARKER', 'STYLE_MARKER', 'REGION', 'SOURCE_DEFINED'].includes(kind)
    ? kind as SourceOccurrence['occurrenceKind'] : 'SOURCE_DEFINED';
}

function unbox(value: unknown): unknown {
  if (value && typeof value === 'object' && 'state' in value) {
    const boxed = value as any;
    if (boxed.state !== 'SET') return undefined;
    if (Object.hasOwn(boxed, 'value')) return boxed.value;
    if (Object.hasOwn(boxed, 'literalText')) return boxed.literalText;
    return undefined;
  }
  return value;
}

function sourceState(value: unknown): string | undefined {
  return value && typeof value === 'object' && 'state' in value ? String((value as any).state) : undefined;
}

function actorKind(props: Record<string, unknown>): Actor['kind'] {
  const candidate = String(unbox(props['propertyValues.actorKind']) ?? 'UNKNOWN');
  return ['HUMAN_ROLE', 'HUMAN_PERSON', 'SYSTEM', 'ORGANIZATION', 'EXTERNAL_PARTY', 'AI', 'MIXED', 'UNKNOWN'].includes(candidate)
    ? candidate as Actor['kind'] : 'UNKNOWN';
}

function buildNodeDetails(kind: ProcessNodeKind, props: Record<string, unknown>): Record<string, unknown> {
  const details: Record<string, unknown> = {};
  if (Object.keys(props).length) details.sourceProperties = props;
  if (sourceState(props['propertyValues.actor']) === 'UNKNOWN') details.responsibilityState = 'UNKNOWN';
  if (kind === 'DECISION') {
    const routingMode = unbox(props['propertyValues.decisionMode']);
    if (routingMode) details.routingMode = routingMode;
  }
  if (kind === 'WAIT') {
    const waitKind = unbox(props['propertyValues.waitKind']);
    if (waitKind) details.waitKind = waitKind;
    const resume = unbox(props['propertyValues.resumeCondition']) ?? unbox(props['propertyValues.eventDescriptor']);
    if (resume) details.resumeSemantics = resume;
  }
  if (kind === 'HUMAN_INTERACTION') {
    const interactionKind = unbox(props['propertyValues.interactionKind']);
    if (interactionKind) details.interactionKind = interactionKind;
    const outcomes = unbox(props['propertyValues.outcomes']);
    if (outcomes) details.outcomes = outcomes;
  }
  if (kind === 'SUBPROCESS') {
    const mode = unbox(props['propertyValues.boundaryMeaning']);
    if (mode) details.subprocessMode = mode;
  }
  return details;
}

function defaultRelationshipKind(candidateRole?: string, sourceAssertedRole?: string): ProcessEdge['kind'] | undefined {
  const role = sourceAssertedRole ?? candidateRole;
  switch (role) {
    case 'CONTROL_FLOW': case 'FLOW_CANDIDATE': case 'SEQUENCE_CANDIDATE': return 'SEQUENCE';
    case 'CONDITIONAL_FLOW': case 'CONDITIONAL_FLOW_CANDIDATE': case 'CONTROL_FLOW_CANDIDATE': return 'CONDITIONAL';
    case 'DEFAULT_FLOW': return 'DEFAULT';
    case 'PARALLEL_FLOW': return 'PARALLEL';
    case 'MESSAGE_RELATIONSHIP': case 'MESSAGE_CANDIDATE': case 'MESSAGE_INTERACTION_CANDIDATE': return 'MESSAGE';
    default: return undefined;
  }
}

function collectExisting(repo: ImmutableDocumentRepository, definition: ProcessDefinition, revision: ProcessRevision): NormalizationBundle {
  const evidenceFragments = repo.listByKind<EvidenceFragment>('EvidenceFragment').map((d) => d.payload)
    .filter((fragment) => revision.provenanceLinks.some((link) => link.evidenceFragmentId === fragment.id));
  const sourceOccurrences = repo.listByKind<SourceOccurrence>('SourceOccurrence').map((d) => d.payload)
    .filter((occurrence) => revision.provenanceLinks.some((link) => link.sourceOccurrenceId === occurrence.id));
  const transformationRecords = repo.listByKind<TransformationRecord>('TransformationRecord').map((d) => d.payload)
    .filter((record) => record.outputRefIds.includes(revision.id));
  return { processDefinition: definition, processRevision: revision, evidenceFragments, sourceOccurrences, semanticClaims: revision.semanticClaims, provenanceLinks: revision.provenanceLinks, transformationRecords };
}

function persist(repo: ImmutableDocumentRepository, definition: ProcessDefinition, revision: ProcessRevision, fragments: EvidenceFragment[], occurrences: SourceOccurrence[], claims: SemanticClaim[], links: ProvenanceLink[], transforms: TransformationRecord[], createdAt: string): void {
  repo.append({ id: revision.id, aggregateKind: 'ProcessRevision', schemaVersion: 'canonical-v0.1-reference', payload: revision, createdAt });
  repo.append({ id: createOpaqueId('canonical', `process-definition-state:${definition.id}:${revision.id}`), aggregateKind: 'ProcessDefinitionState', schemaVersion: 'canonical-v0.1-reference', payload: definition, createdAt });
  for (const item of fragments) repo.append({ id: item.id, aggregateKind: 'EvidenceFragment', schemaVersion: 'provenance-v0.3-reference', payload: item, createdAt });
  for (const item of occurrences) repo.append({ id: item.id, aggregateKind: 'SourceOccurrence', schemaVersion: 'provenance-v0.3-reference', payload: item, createdAt });
  for (const item of claims) repo.append({ id: item.id, aggregateKind: 'SemanticClaim', schemaVersion: 'provenance-v0.3-reference', payload: item, createdAt });
  for (const item of links) repo.append({ id: item.id, aggregateKind: 'ProvenanceLink', schemaVersion: 'provenance-v0.3-reference', payload: item, createdAt });
  for (const item of transforms) repo.append({ id: item.id, aggregateKind: 'TransformationRecord', schemaVersion: 'provenance-v0.3-reference', payload: item, createdAt });
}

export function normalizeCommonAdapterResult(repo: ImmutableDocumentRepository, resultId: SourceId, profile: CommonNormalizationProfile, options: CommonNormalizeOptions = {}): NormalizationBundle {
  const result = findPayloadById<AdapterResult>(repo, 'AdapterResult', resultId);
  if (!result) throw new TypeError(`AdapterResult not found: ${resultId}`);
  const scope = findPayloadById<CandidateSemanticScope>(repo, 'CandidateSemanticScope', result.candidateScopeIds[0]);
  if (!scope) throw new TypeError('CandidateSemanticScope missing');
  const graph = findPayloadById<SourceEvidenceGraph>(repo, 'SourceEvidenceGraph', scope.sourceEvidenceGraphId);
  if (!graph) throw new TypeError('SourceEvidenceGraph missing');
  const representation = findPayloadById<SourceRepresentation>(repo, 'SourceRepresentation', graph.sourceRepresentationId);
  if (!representation) throw new TypeError('SourceRepresentation missing');
  const artifact = findSourceArtifact(repo, graph.sourceArtifactId);
  if (!artifact) throw new TypeError('SourceArtifact missing');
  const origin = findPayloadById<SourceOrigin>(repo, 'SourceOrigin', result.sourceOriginIds[0]);
  if (!origin) throw new TypeError('SourceOrigin missing');
  const capture = representation.captureId ? findPayloadById<SourceCapture>(repo, 'SourceCapture', representation.captureId) : undefined;

  const normalizedAt = options.normalizedAt ?? result.completedAt;
  const perspective = profile.perspective ?? 'BUSINESS_INTENT';
  const processDefinitionId = createOpaqueId('canonical', `process-definition:${artifact.id}`);
  const processRevisionId = createOpaqueId('canonical', `common-normalization:${processDefinitionId}:${scope.id}:${graph.extractionDigest}:${profile.interpreterVersion}`);
  const existing = repo.get<ProcessRevision>(processRevisionId)?.payload;
  if (existing) {
    const states = repo.listByKind<ProcessDefinition>('ProcessDefinitionState').map((d) => d.payload).filter((item) => item.id === processDefinitionId);
    const definition = states.at(-1) ?? { id: processDefinitionId, canonicalName: scope.candidateName ?? artifact.declaredName ?? 'Unnamed process', revisionIds: [existing.id] };
    return collectExisting(repo, definition, existing);
  }

  const elementDescriptors = repo.listByKind<SourceOccurrenceDescriptor>('SourceOccurrenceDescriptor').map((d) => d.payload).filter((descriptor) => scope.includedOccurrenceRefs.includes(descriptor.sourceOccurrenceId));
  const relationshipDescriptors = repo.listByKind<SourceRelationshipDescriptor>('SourceRelationshipDescriptor').map((d) => d.payload).filter((descriptor) => scope.includedOccurrenceRefs.includes(descriptor.sourceOccurrenceId));
  const propertyEvidence = new Map(repo.listByKind<SourcePropertyEvidenceDescriptor>('SourcePropertyEvidenceDescriptor').map((d) => [String(d.payload.id), d.payload]));

  const fragments: EvidenceFragment[] = [];
  const occurrences: SourceOccurrence[] = [];
  const claims: SemanticClaim[] = [];
  const links: ProvenanceLink[] = [];
  const transforms: TransformationRecord[] = [];
  const actors: Actor[] = [];
  const dataObjects: DataObject[] = [];
  const rules: BusinessRule[] = [];
  const nodes: ProcessNode[] = [];
  const edges: ProcessEdge[] = [];
  const extensions: SourceSemanticExtension[] = [];
  const canonicalByDescriptor = new Map<string, CanonicalId>();

  const propertiesFor = (descriptor: SourceOccurrenceDescriptor): Record<string, unknown> => {
    const props: Record<string, unknown> = {};
    for (const ref of descriptor.propertyEvidenceRefs) {
      const evidence = propertyEvidence.get(String(ref));
      if (evidence && evidence.literalValue !== undefined) props[evidence.propertyPath] = evidence.literalValue;
    }
    return props;
  };

  const makeFragment = (descriptor: { sourceOccurrenceId: SourceId; nativeSourceId?: string; occurrenceKind?: string; sourcePlaneRef?: SourceId; sourceExtensionRefs?: SourceId[] }, kind: EvidenceFragment['fragmentKind']): EvidenceFragment => {
    const id = createOpaqueId('provenance', `common-fragment:${representation.id}:${descriptor.sourceOccurrenceId}:${profile.interpreterVersion}`);
    const fragment: EvidenceFragment = { id, sourceArtifactId: artifact.id, representationId: representation.id, ...(descriptor.sourcePlaneRef ? { sourcePlaneId: descriptor.sourcePlaneRef } : {}), fragmentKind: kind, ...(descriptor.nativeSourceId ? { sourceElementRef: descriptor.nativeSourceId } : {}), metadata: { sourceDescriptorRef: descriptor.sourceOccurrenceId, sourceFamily: profile.sourceFamily, sourceExtensionRefs: descriptor.sourceExtensionRefs ?? [] } };
    fragments.push(fragment);
    return fragment;
  };

  const makeLink = (targetRef: string, fragment: EvidenceFragment, sourceOccurrenceId: ProvenanceId, targetPropertyPath?: string): ProvenanceLink => {
    const id = createOpaqueId('provenance', `common-link:${targetRef}:${targetPropertyPath ?? '$'}:${fragment.id}:${profile.interpreterVersion}`);
    const link: ProvenanceLink = { id, targetRef, ...(targetPropertyPath ? { targetPropertyPath } : {}), sourceOriginId: origin.id, sourceArtifactId: artifact.id, ...(capture ? { sourceCaptureId: capture.id } : {}), sourceRepresentationId: representation.id, evidenceFragmentId: fragment.id, sourceOccurrenceId, evidenceType: profile.evidenceType ?? 'SOURCE_ELEMENT', extractionMethod: profile.extractionMethod, truthClass: profile.defaultTruthClass, perspective, interpreterVersion: profile.interpreterVersion };
    links.push(link);
    return link;
  };

  const makeClaim = (subjectRef: string, propertyPath: string, value: unknown, fragment: EvidenceFragment, link: ProvenanceLink): SemanticClaim => {
    const id = createOpaqueId('provenance', `common-claim:${subjectRef}:${propertyPath}:${fragment.id}:${profile.interpreterVersion}`);
    const claim: SemanticClaim = { id, subjectRef, propertyPath, value, perspective, truthClass: profile.defaultTruthClass, evidenceFragmentRefs: [fragment.id], provenanceLinkRefs: [link.id], createdAt: normalizedAt, interpretationMethod: profile.interpretationMethod, interpreterVersion: profile.interpreterVersion };
    claims.push(claim);
    return claim;
  };

  for (const descriptor of elementDescriptors) {
    const fragmentKind = descriptor.occurrenceKind === 'OBJECT_NODE' ? 'OBJECT_OCCURRENCE' : descriptor.occurrenceKind === 'ANNOTATION' ? 'ANNOTATION' : profile.nodeFragmentKind ?? 'SOURCE_ELEMENT';
    const fragment = makeFragment(descriptor, fragmentKind);
    const canonicalId = createOpaqueId('canonical', `common-semantic:${processDefinitionId}:${descriptor.sourceOccurrenceId}:${profile.interpreterVersion}`);
    canonicalByDescriptor.set(String(descriptor.sourceOccurrenceId), canonicalId);
    const sourceOccurrenceId = createOpaqueId('provenance', `common-source-occurrence:${descriptor.sourceOccurrenceId}:${profile.interpreterVersion}`);
    occurrences.push({ id: sourceOccurrenceId, sourceArtifactId: artifact.id, evidenceFragmentId: fragment.id, occurrenceKind: occurrenceKind(descriptor.occurrenceKind), ...(descriptor.literalLabel ? { displayLabel: descriptor.literalLabel } : {}), ...(descriptor.sourceAssertedType ? { sourceAssertedType: descriptor.sourceAssertedType } : {}), ...(descriptor.candidateSemanticType ? { candidateSemanticType: descriptor.candidateSemanticType } : {}), sourceContextRefs: [], canonicalRef: canonicalId });

    const props = propertiesFor(descriptor);
    const baseLink = makeLink(canonicalId, fragment, sourceOccurrenceId);
    if (descriptor.literalLabel !== undefined) makeClaim(canonicalId, 'name', descriptor.literalLabel, fragment, makeLink(canonicalId, fragment, sourceOccurrenceId, 'name'));

    if (descriptor.candidateSemanticType === 'ACTOR') { actors.push({ id: canonicalId, kind: actorKind(props), name: descriptor.literalLabel ?? 'Unknown actor', sourceReferences: [descriptor.nativeSourceId ?? String(descriptor.sourceOccurrenceId)], provenanceRefs: [baseLink.id] }); continue; }
    if (descriptor.candidateSemanticType === 'DATA_OBJECT') { dataObjects.push({ id: canonicalId, name: descriptor.literalLabel ?? 'Unnamed data object', sourceReferences: [descriptor.nativeSourceId ?? String(descriptor.sourceOccurrenceId)], provenanceRefs: [baseLink.id] }); continue; }
    if (descriptor.candidateSemanticType === 'BUSINESS_RULE') { rules.push({ id: canonicalId, naturalLanguage: descriptor.literalLabel ?? '', inputs: [], truthClass: profile.defaultTruthClass, unresolvedTerms: [], provenanceRefs: [baseLink.id] }); continue; }

    const resolvedNode = profile.resolveNode?.({
      candidateSemanticType: descriptor.candidateSemanticType,
      sourceAssertedType: descriptor.sourceAssertedType,
      literalLabel: descriptor.literalLabel,
      properties: props,
    });
    const kind = resolvedNode?.kind ?? nodeKind(descriptor.candidateSemanticType);
    if (!kind) {
      makeClaim(canonicalId, 'kind', descriptor.candidateSemanticType ?? descriptor.sourceAssertedType ?? descriptor.occurrenceKind, fragment, baseLink);
      continue;
    }
    makeClaim(canonicalId, 'kind', kind, fragment, baseLink);
    const details = { ...buildNodeDetails(kind, props), ...(resolvedNode?.details ?? {}) };
    nodes.push({ id: canonicalId, kind, ...(descriptor.literalLabel ? { name: descriptor.literalLabel } : {}), actorRefs: [], inputRefs: [], outputRefs: [], ruleRefs: [], ...(Object.keys(details).length ? { details } : {}), truthClass: profile.defaultTruthClass, provenanceRefs: [baseLink.id], sourceExtensionRefs: [] });
    for (const [path, value] of Object.entries(props)) {
      const propertyPath = path.startsWith('propertyValues.') ? `details.${path.slice('propertyValues.'.length)}` : path;
      makeClaim(canonicalId, propertyPath, value, fragment, makeLink(canonicalId, fragment, sourceOccurrenceId, propertyPath));
    }
  }

  const mapRelationshipRole = profile.mapRelationshipRole ?? defaultRelationshipKind;
  for (const descriptor of relationshipDescriptors) {
    const fragment = makeFragment(descriptor, 'EDGE_REGION');
    const sourceOccurrenceId = createOpaqueId('provenance', `common-source-occurrence:${descriptor.sourceOccurrenceId}:${profile.interpreterVersion}`);
    const sourceCanonical = descriptor.sourceRef ? canonicalByDescriptor.get(String(descriptor.sourceRef)) : undefined;
    const targetCanonical = descriptor.targetRef ? canonicalByDescriptor.get(String(descriptor.targetRef)) : undefined;
    const relationshipId = createOpaqueId('canonical', `common-relationship:${processDefinitionId}:${descriptor.sourceOccurrenceId}:${profile.interpreterVersion}`);
    occurrences.push({ id: sourceOccurrenceId, sourceArtifactId: artifact.id, evidenceFragmentId: fragment.id, occurrenceKind: 'EDGE', ...(descriptor.sourceAssertedRole ? { sourceAssertedType: descriptor.sourceAssertedRole } : {}), ...(descriptor.candidateRelationshipRole ? { candidateSemanticType: descriptor.candidateRelationshipRole } : {}), sourceContextRefs: [], ...(sourceCanonical && targetCanonical ? { canonicalRef: relationshipId } : {}) });
    const baseLink = makeLink(relationshipId, fragment, sourceOccurrenceId);
    makeClaim(relationshipId, 'relationshipRole', descriptor.sourceAssertedRole ?? descriptor.candidateRelationshipRole ?? 'UNKNOWN', fragment, baseLink);
    makeClaim(relationshipId, 'sourceEndpointState', descriptor.sourceEndpointState ?? 'UNKNOWN', fragment, makeLink(relationshipId, fragment, sourceOccurrenceId, 'sourceEndpointState'));
    makeClaim(relationshipId, 'targetEndpointState', descriptor.targetEndpointState ?? 'UNKNOWN', fragment, makeLink(relationshipId, fragment, sourceOccurrenceId, 'targetEndpointState'));

    const edgeKind = mapRelationshipRole(descriptor.candidateRelationshipRole, descriptor.sourceAssertedRole);
    const conditionLabel = typeof descriptor.conditionEvidence === 'string'
      ? descriptor.conditionEvidence.trim()
      : descriptor.conditionEvidence && typeof descriptor.conditionEvidence === 'object' && !Array.isArray(descriptor.conditionEvidence)
        && typeof (descriptor.conditionEvidence as Record<string, unknown>).literalText === 'string'
          ? String((descriptor.conditionEvidence as Record<string, unknown>).literalText).trim()
          : '';
    if (conditionLabel) makeClaim(relationshipId, 'label', conditionLabel, fragment, makeLink(relationshipId, fragment, sourceOccurrenceId, 'label'));
    if (edgeKind && sourceCanonical && targetCanonical && nodes.some((node) => node.id === sourceCanonical) && nodes.some((node) => node.id === targetCanonical)) {
      edges.push({ id: relationshipId, sourceNodeId: sourceCanonical, targetNodeId: targetCanonical, kind: edgeKind, ...(conditionLabel ? { label: conditionLabel } : {}), truthClass: profile.defaultTruthClass, provenanceRefs: [baseLink.id], sourceExtensionRefs: [] });
    } else if (edgeKind) {
      const extensionId = createOpaqueId('canonical', `common-incomplete-relationship:${relationshipId}`);
      extensions.push({ id: extensionId, notation: profile.sourceFamily, extensionType: 'INCOMPLETE_RELATIONSHIP', sourceArtifactId: artifact.id, sourceElementRefs: [String(descriptor.sourceOccurrenceId)], payload: { candidateRelationshipRole: descriptor.candidateRelationshipRole, sourceEndpointState: descriptor.sourceEndpointState, targetEndpointState: descriptor.targetEndpointState, ...(sourceCanonical ? { canonicalSourceRef: sourceCanonical } : {}), ...(targetCanonical ? { canonicalTargetRef: targetCanonical } : {}) }, preservationClass: 'SEMANTIC' });
    }
  }

  const prior = repo.listByKind<ProcessRevision>('ProcessRevision').map((d) => d.payload).filter((revision) => revision.processDefinitionId === processDefinitionId).sort((a, b) => a.revision - b.revision);
  const revision: ProcessRevision = { id: processRevisionId, processDefinitionId, revision: (prior.at(-1)?.revision ?? 0) + 1, createdAt: normalizedAt, parentRevisionIds: prior.length ? [prior.at(-1)!.id] : [], derivationKind: 'NORMALIZATION', sourceArtifactIds: [artifact.id], nodes, edges, actors, variables: [], dataObjects, rules, semanticClaims: claims, conflictRecords: [], annotations: [], provenanceLinks: links, sourceExtensions: extensions, semanticStatus: 'NORMALIZED', executionReadiness: 'NOT_ASSESSED', validationFindingRefs: [] };
  const definition: ProcessDefinition = { id: processDefinitionId, canonicalName: scope.candidateName ?? artifact.declaredName ?? 'Unnamed process', revisionIds: [...prior.map((item) => item.id), revision.id] };
  persist(repo, definition, revision, fragments, occurrences, claims, links, transforms, normalizedAt);
  return { processDefinition: definition, processRevision: revision, evidenceFragments: fragments, sourceOccurrences: occurrences, semanticClaims: claims, provenanceLinks: links, transformationRecords: transforms };
}
