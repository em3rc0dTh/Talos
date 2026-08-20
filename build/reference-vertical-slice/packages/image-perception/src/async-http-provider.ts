import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { LocalImageByteStore } from './byte-store.ts';
import { runImagePerceptionAdmission, type ImagePerceptionAdmissionBundle, type RunImagePerceptionAdmissionOptions } from './admission.ts';
import type {
  ImagePerceptionProvider,
  ImagePerceptionProviderRequest,
  ImagePerceptionProviderResult,
  ProviderAlternativeSet,
  ProviderObservation,
  ProviderOccurrenceCandidate,
  ProviderRelationCandidate,
  ProviderVisualAnchor,
} from './perception-types.ts';
import type { ImageIntakeBundle } from './types.ts';

const GEOMETRY_KINDS = new Set(['POINT','BOX','POLYGON','POLYLINE','MASK','WHOLE_IMAGE','SOURCE_DEFINED']);
const VISIBILITY_STATES = new Set(['VISIBLE','PARTIALLY_VISIBLE','LOW_LEGIBILITY','OBSCURED','OUT_OF_FRAME_CANDIDATE','UNKNOWN']);
const OBSERVATION_KINDS = new Set([
  'TEXT_REGION','TEXT_LITERAL_CANDIDATE','SHAPE_REGION','SHAPE_CLASS_CANDIDATE','CONNECTOR_STROKE','ARROWHEAD',
  'CONNECTOR_ENDPOINT','CONTAINER_REGION','ICON_REGION','COLOR_STYLE','LINE_STYLE','SPATIAL_ATTACHMENT','PLANE_REGION',
  'ANNOTATION_REGION','EDITOR_UI_REGION','CURSOR_PRESENCE','SOURCE_DEFINED',
]);
const PLANE_KINDS = new Set([
  'AUTHORING_CONTEXT','COLLABORATOR_OVERLAY','NOTATION_ANNOTATION','BUSINESS_GRAPH','RESPONSIBILITY_COLLABORATION','OBJECT_DATA',
  'ARCHITECTURE_TOPOLOGY','FUNCTIONAL_MODEL','ANALYTIC_SIMULATION','RUNTIME_EVIDENCE','SOURCE_DEFINED','UNKNOWN',
]);
const ENDPOINT_STATES = new Set(['SET_CANDIDATE','UNKNOWN','OUT_OF_FRAME','OCCLUDED','UNRESOLVED','SOURCE_DEFINED']);
const DIRECTIONS = new Set(['SOURCE_TO_TARGET','TARGET_TO_SOURCE','BIDIRECTIONAL','UNKNOWN']);
const PROVIDER_STATUSES = new Set(['SUCCEEDED','PARTIAL','NO_RESULT']);

export interface AsyncHttpImagePerceptionProviderConfig {
  endpoint: string;
  providerId: string;
  providerVersion: string;
  modelRef: string;
  modelVersion: string;
  pipelineVersion: string;
  timeoutMs?: number;
  headers?: Readonly<Record<string,string>>;
  fetchImpl?: typeof fetch;
}

export interface AsyncImagePerceptionTransportEnvelope {
  schemaVersion: 'talos-image-perception-request-v0.1';
  sourceRepresentationId: string;
  contentSha256: string;
  mediaType: 'image/png';
  coordinateSpace: {
    width: number;
    height: number;
    basis: string;
    orientation: string;
    originConvention: string;
  };
  imageBase64: string;
}

function fail(path: string, detail: string): never {
  throw new TypeError(`INVALID_IMAGE_PERCEPTION_PROVIDER_RESPONSE: ${path}: ${detail}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected object');
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) fail(path, 'expected non-empty string');
  return value;
}

function arrayValue(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, 'expected array');
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  return arrayValue(value, path).map((item,index) => stringValue(item, `${path}[${index}]`));
}

function confidence(value: unknown, path: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) fail(path, 'expected number from 0 to 1');
  return value;
}

function uniqueKeys(items: string[], path: string): void {
  if (new Set(items).size !== items.length) fail(path, 'duplicate provider keys are not allowed');
}

function validateAnchor(raw: unknown, index: number): ProviderVisualAnchor {
  const value = record(raw, `anchors[${index}]`);
  const geometryKind = stringValue(value.geometryKind, `anchors[${index}].geometryKind`);
  const visibilityState = stringValue(value.visibilityState, `anchors[${index}].visibilityState`);
  if (!GEOMETRY_KINDS.has(geometryKind)) fail(`anchors[${index}].geometryKind`, `unsupported value ${geometryKind}`);
  if (!VISIBILITY_STATES.has(visibilityState)) fail(`anchors[${index}].visibilityState`, `unsupported value ${visibilityState}`);
  return {
    providerAnchorKey: stringValue(value.providerAnchorKey, `anchors[${index}].providerAnchorKey`),
    geometryKind: geometryKind as ProviderVisualAnchor['geometryKind'],
    geometry: value.geometry,
    visibilityState: visibilityState as ProviderVisualAnchor['visibilityState'],
    ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
  };
}

function validateObservation(raw: unknown, index: number): ProviderObservation {
  const value = record(raw, `observations[${index}]`);
  const kind = stringValue(value.observationKind, `observations[${index}].observationKind`);
  if (!OBSERVATION_KINDS.has(kind)) fail(`observations[${index}].observationKind`, `unsupported value ${kind}`);
  const result: ProviderObservation = {
    providerObservationKey: stringValue(value.providerObservationKey, `observations[${index}].providerObservationKey`),
    anchorKey: stringValue(value.anchorKey, `observations[${index}].anchorKey`),
    observationKind: kind as ProviderObservation['observationKind'],
    ...(value.observedValue !== undefined ? { observedValue: value.observedValue } : {}),
    ...(confidence(value.confidence, `observations[${index}].confidence`) !== undefined ? { confidence: confidence(value.confidence, `observations[${index}].confidence`)! } : {}),
    ...(value.parentObservationKeys !== undefined ? { parentObservationKeys: stringArray(value.parentObservationKeys, `observations[${index}].parentObservationKeys`) } : {}),
    ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
  };
  return result;
}

function validateOccurrence(raw: unknown, index: number): ProviderOccurrenceCandidate {
  const value = record(raw, `occurrenceCandidates[${index}]`);
  const sourcePlaneKind = stringValue(value.sourcePlaneKind, `occurrenceCandidates[${index}].sourcePlaneKind`);
  if (!PLANE_KINDS.has(sourcePlaneKind)) fail(`occurrenceCandidates[${index}].sourcePlaneKind`, `unsupported value ${sourcePlaneKind}`);
  return {
    providerOccurrenceKey: stringValue(value.providerOccurrenceKey, `occurrenceCandidates[${index}].providerOccurrenceKey`),
    anchorKeys: stringArray(value.anchorKeys, `occurrenceCandidates[${index}].anchorKeys`),
    occurrenceKind: stringValue(value.occurrenceKind, `occurrenceCandidates[${index}].occurrenceKind`),
    ...(typeof value.literalLabelObservationKey === 'string' ? { literalLabelObservationKey: value.literalLabelObservationKey } : {}),
    ...(typeof value.candidateSemanticType === 'string' ? { candidateSemanticType: value.candidateSemanticType } : {}),
    sourcePlaneKind: sourcePlaneKind as ProviderOccurrenceCandidate['sourcePlaneKind'],
    supportingObservationKeys: stringArray(value.supportingObservationKeys, `occurrenceCandidates[${index}].supportingObservationKeys`),
    ...(confidence(value.confidence, `occurrenceCandidates[${index}].confidence`) !== undefined ? { confidence: confidence(value.confidence, `occurrenceCandidates[${index}].confidence`)! } : {}),
    ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
  };
}

function validateAlternativeSet(raw: unknown, index: number): ProviderAlternativeSet {
  const value = record(raw, `alternativeSets[${index}]`);
  const exclusivityMode = stringValue(value.exclusivityMode, `alternativeSets[${index}].exclusivityMode`);
  if (!['MUTUALLY_EXCLUSIVE','NON_EXCLUSIVE','SOURCE_DEFINED'].includes(exclusivityMode)) fail(`alternativeSets[${index}].exclusivityMode`, `unsupported value ${exclusivityMode}`);
  const alternatives = arrayValue(value.alternatives, `alternativeSets[${index}].alternatives`).map((rawAlt,altIndex) => {
    const alt = record(rawAlt, `alternativeSets[${index}].alternatives[${altIndex}]`);
    return {
      providerAlternativeKey: stringValue(alt.providerAlternativeKey, `alternativeSets[${index}].alternatives[${altIndex}].providerAlternativeKey`),
      value: alt.value,
      ...(confidence(alt.confidence, `alternativeSets[${index}].alternatives[${altIndex}].confidence`) !== undefined ? { confidence: confidence(alt.confidence, `alternativeSets[${index}].alternatives[${altIndex}].confidence`)! } : {}),
      anchorKeys: stringArray(alt.anchorKeys, `alternativeSets[${index}].alternatives[${altIndex}].anchorKeys`),
      supportingObservationKeys: stringArray(alt.supportingObservationKeys, `alternativeSets[${index}].alternatives[${altIndex}].supportingObservationKeys`),
      ...(typeof alt.interpretationNotes === 'string' ? { interpretationNotes: alt.interpretationNotes } : {}),
    };
  });
  return {
    providerAlternativeSetKey: stringValue(value.providerAlternativeSetKey, `alternativeSets[${index}].providerAlternativeSetKey`),
    ...(typeof value.subjectObservationKey === 'string' ? { subjectObservationKey: value.subjectObservationKey } : {}),
    propertyPath: stringValue(value.propertyPath, `alternativeSets[${index}].propertyPath`),
    alternatives,
    exclusivityMode: exclusivityMode as ProviderAlternativeSet['exclusivityMode'],
    ...(typeof value.modelPreferredAlternativeKey === 'string' ? { modelPreferredAlternativeKey: value.modelPreferredAlternativeKey } : {}),
    ...(confidence(value.modelPreferenceConfidence, `alternativeSets[${index}].modelPreferenceConfidence`) !== undefined ? { modelPreferenceConfidence: confidence(value.modelPreferenceConfidence, `alternativeSets[${index}].modelPreferenceConfidence`)! } : {}),
  };
}

function validateRelation(raw: unknown, index: number): ProviderRelationCandidate {
  const value = record(raw, `relationCandidates[${index}]`);
  const endpoints = (rawItems: unknown, path: string) => arrayValue(rawItems, path).map((rawEndpoint,endpointIndex) => {
    const endpoint = record(rawEndpoint, `${path}[${endpointIndex}]`);
    const state = stringValue(endpoint.endpointState, `${path}[${endpointIndex}].endpointState`);
    if (!ENDPOINT_STATES.has(state)) fail(`${path}[${endpointIndex}].endpointState`, `unsupported value ${state}`);
    return {
      ...(typeof endpoint.occurrenceCandidateKey === 'string' ? { occurrenceCandidateKey: endpoint.occurrenceCandidateKey } : {}),
      ...(typeof endpoint.anchorKey === 'string' ? { anchorKey: endpoint.anchorKey } : {}),
      endpointState: state as 'SET_CANDIDATE'|'UNKNOWN'|'OUT_OF_FRAME'|'OCCLUDED'|'UNRESOLVED'|'SOURCE_DEFINED',
      ...(confidence(endpoint.confidence, `${path}[${endpointIndex}].confidence`) !== undefined ? { confidence: confidence(endpoint.confidence, `${path}[${endpointIndex}].confidence`)! } : {}),
    };
  });
  const directions = arrayValue(value.directionCandidates, `relationCandidates[${index}].directionCandidates`).map((rawDirection,directionIndex) => {
    const direction = record(rawDirection, `relationCandidates[${index}].directionCandidates[${directionIndex}]`);
    const candidate = stringValue(direction.value, `relationCandidates[${index}].directionCandidates[${directionIndex}].value`);
    if (!DIRECTIONS.has(candidate)) fail(`relationCandidates[${index}].directionCandidates[${directionIndex}].value`, `unsupported value ${candidate}`);
    return {
      value: candidate as 'SOURCE_TO_TARGET'|'TARGET_TO_SOURCE'|'BIDIRECTIONAL'|'UNKNOWN',
      ...(confidence(direction.confidence, `relationCandidates[${index}].directionCandidates[${directionIndex}].confidence`) !== undefined ? { confidence: confidence(direction.confidence, `relationCandidates[${index}].directionCandidates[${directionIndex}].confidence`)! } : {}),
    };
  });
  return {
    providerRelationKey: stringValue(value.providerRelationKey, `relationCandidates[${index}].providerRelationKey`),
    strokeObservationKeys: stringArray(value.strokeObservationKeys, `relationCandidates[${index}].strokeObservationKeys`),
    anchorKeys: stringArray(value.anchorKeys, `relationCandidates[${index}].anchorKeys`),
    ...(confidence(value.existenceConfidence, `relationCandidates[${index}].existenceConfidence`) !== undefined ? { existenceConfidence: confidence(value.existenceConfidence, `relationCandidates[${index}].existenceConfidence`)! } : {}),
    sourceEndpointCandidates: endpoints(value.sourceEndpointCandidates, `relationCandidates[${index}].sourceEndpointCandidates`),
    targetEndpointCandidates: endpoints(value.targetEndpointCandidates, `relationCandidates[${index}].targetEndpointCandidates`),
    directionCandidates: directions,
    ...(typeof value.roleAlternativeSetKey === 'string' ? { roleAlternativeSetKey: value.roleAlternativeSetKey } : {}),
    ...(value.guardTextObservationKeys !== undefined ? { guardTextObservationKeys: stringArray(value.guardTextObservationKeys, `relationCandidates[${index}].guardTextObservationKeys`) } : {}),
    ...(typeof value.notes === 'string' ? { notes: value.notes } : {}),
  };
}

export function validateUntrustedImagePerceptionProviderResult(raw: unknown, config: AsyncHttpImagePerceptionProviderConfig): ImagePerceptionProviderResult {
  const value = record(raw, 'response');
  const providerId = stringValue(value.providerId, 'response.providerId');
  const providerVersion = stringValue(value.providerVersion, 'response.providerVersion');
  const providerClass = stringValue(value.providerClass, 'response.providerClass');
  const modelRef = stringValue(value.modelRef, 'response.modelRef');
  const modelVersion = stringValue(value.modelVersion, 'response.modelVersion');
  const pipelineVersion = stringValue(value.pipelineVersion, 'response.pipelineVersion');
  const evidenceMode = stringValue(value.evidenceMode, 'response.evidenceMode');
  const status = stringValue(value.status, 'response.status');

  if (providerId !== config.providerId) fail('response.providerId', `expected ${config.providerId}`);
  if (providerVersion !== config.providerVersion) fail('response.providerVersion', `expected ${config.providerVersion}`);
  if (providerClass !== 'MODEL_PROVIDER') fail('response.providerClass', 'real I7B provider must be MODEL_PROVIDER');
  if (modelRef !== config.modelRef) fail('response.modelRef', `expected ${config.modelRef}`);
  if (modelVersion !== config.modelVersion) fail('response.modelVersion', `expected ${config.modelVersion}`);
  if (pipelineVersion !== config.pipelineVersion) fail('response.pipelineVersion', `expected ${config.pipelineVersion}`);
  if (evidenceMode !== 'MODEL_INFERENCE') fail('response.evidenceMode', 'real I7B provider must emit MODEL_INFERENCE');
  if (!PROVIDER_STATUSES.has(status)) fail('response.status', `unsupported value ${status}`);

  const anchors = arrayValue(value.anchors, 'response.anchors').map(validateAnchor);
  const observations = arrayValue(value.observations, 'response.observations').map(validateObservation);
  const occurrenceCandidates = arrayValue(value.occurrenceCandidates, 'response.occurrenceCandidates').map(validateOccurrence);
  const alternativeSets = arrayValue(value.alternativeSets, 'response.alternativeSets').map(validateAlternativeSet);
  const relationCandidates = arrayValue(value.relationCandidates, 'response.relationCandidates').map(validateRelation);
  const diagnostics = arrayValue(value.diagnostics, 'response.diagnostics').map((rawDiagnostic,index) => {
    const diagnostic = record(rawDiagnostic, `response.diagnostics[${index}]`);
    return {
      code: stringValue(diagnostic.code, `response.diagnostics[${index}].code`),
      description: stringValue(diagnostic.description, `response.diagnostics[${index}].description`),
    };
  });

  uniqueKeys(anchors.map((item) => item.providerAnchorKey), 'response.anchors');
  uniqueKeys(observations.map((item) => item.providerObservationKey), 'response.observations');
  uniqueKeys(occurrenceCandidates.map((item) => item.providerOccurrenceKey), 'response.occurrenceCandidates');
  uniqueKeys(alternativeSets.map((item) => item.providerAlternativeSetKey), 'response.alternativeSets');
  uniqueKeys(relationCandidates.map((item) => item.providerRelationKey), 'response.relationCandidates');

  const anchorKeys = new Set(anchors.map((item) => item.providerAnchorKey));
  const observationKeys = new Set(observations.map((item) => item.providerObservationKey));
  const occurrenceKeys = new Set(occurrenceCandidates.map((item) => item.providerOccurrenceKey));
  const alternativeSetKeys = new Set(alternativeSets.map((item) => item.providerAlternativeSetKey));

  for (const observation of observations) {
    if (!anchorKeys.has(observation.anchorKey)) fail(`observation:${observation.providerObservationKey}.anchorKey`, 'unknown anchor');
    for (const parent of observation.parentObservationKeys ?? []) if (!observationKeys.has(parent)) fail(`observation:${observation.providerObservationKey}.parentObservationKeys`, `unknown observation ${parent}`);
  }
  for (const occurrence of occurrenceCandidates) {
    for (const key of occurrence.anchorKeys) if (!anchorKeys.has(key)) fail(`occurrence:${occurrence.providerOccurrenceKey}.anchorKeys`, `unknown anchor ${key}`);
    for (const key of occurrence.supportingObservationKeys) if (!observationKeys.has(key)) fail(`occurrence:${occurrence.providerOccurrenceKey}.supportingObservationKeys`, `unknown observation ${key}`);
    if (occurrence.literalLabelObservationKey && !observationKeys.has(occurrence.literalLabelObservationKey)) fail(`occurrence:${occurrence.providerOccurrenceKey}.literalLabelObservationKey`, 'unknown observation');
  }
  for (const set of alternativeSets) {
    const alternativeKeys = new Set(set.alternatives.map((item) => item.providerAlternativeKey));
    if (alternativeKeys.size !== set.alternatives.length) fail(`alternativeSet:${set.providerAlternativeSetKey}`, 'duplicate alternative keys');
    if (set.subjectObservationKey && !observationKeys.has(set.subjectObservationKey)) fail(`alternativeSet:${set.providerAlternativeSetKey}.subjectObservationKey`, 'unknown observation');
    if (set.modelPreferredAlternativeKey && !alternativeKeys.has(set.modelPreferredAlternativeKey)) fail(`alternativeSet:${set.providerAlternativeSetKey}.modelPreferredAlternativeKey`, 'unknown alternative');
    for (const alternative of set.alternatives) {
      for (const key of alternative.anchorKeys) if (!anchorKeys.has(key)) fail(`alternative:${alternative.providerAlternativeKey}.anchorKeys`, `unknown anchor ${key}`);
      for (const key of alternative.supportingObservationKeys) if (!observationKeys.has(key)) fail(`alternative:${alternative.providerAlternativeKey}.supportingObservationKeys`, `unknown observation ${key}`);
    }
  }
  for (const relation of relationCandidates) {
    for (const key of relation.strokeObservationKeys) if (!observationKeys.has(key)) fail(`relation:${relation.providerRelationKey}.strokeObservationKeys`, `unknown observation ${key}`);
    for (const key of relation.anchorKeys) if (!anchorKeys.has(key)) fail(`relation:${relation.providerRelationKey}.anchorKeys`, `unknown anchor ${key}`);
    for (const endpoint of [...relation.sourceEndpointCandidates, ...relation.targetEndpointCandidates]) {
      if (endpoint.occurrenceCandidateKey && !occurrenceKeys.has(endpoint.occurrenceCandidateKey)) fail(`relation:${relation.providerRelationKey}.endpoint`, `unknown occurrence ${endpoint.occurrenceCandidateKey}`);
      if (endpoint.anchorKey && !anchorKeys.has(endpoint.anchorKey)) fail(`relation:${relation.providerRelationKey}.endpoint`, `unknown anchor ${endpoint.anchorKey}`);
    }
    if (relation.roleAlternativeSetKey && !alternativeSetKeys.has(relation.roleAlternativeSetKey)) fail(`relation:${relation.providerRelationKey}.roleAlternativeSetKey`, 'unknown alternative set');
    for (const key of relation.guardTextObservationKeys ?? []) if (!observationKeys.has(key)) fail(`relation:${relation.providerRelationKey}.guardTextObservationKeys`, `unknown observation ${key}`);
  }

  if (status === 'NO_RESULT' && (anchors.length || observations.length || occurrenceCandidates.length || alternativeSets.length || relationCandidates.length)) {
    fail('response', 'NO_RESULT must not carry hidden perception evidence');
  }

  return {
    providerId,
    providerVersion,
    providerClass: 'MODEL_PROVIDER',
    modelRef,
    modelVersion,
    pipelineVersion,
    evidenceMode: 'MODEL_INFERENCE',
    status: status as ImagePerceptionProviderResult['status'],
    anchors,
    observations,
    occurrenceCandidates,
    alternativeSets,
    relationCandidates,
    diagnostics,
  };
}

function syncProviderFromResult(config: AsyncHttpImagePerceptionProviderConfig, result: ImagePerceptionProviderResult): ImagePerceptionProvider {
  return {
    providerId: config.providerId,
    providerVersion: config.providerVersion,
    perceive: (_request: ImagePerceptionProviderRequest) => result,
  };
}

function throwingSyncProvider(config: AsyncHttpImagePerceptionProviderConfig, error: unknown): ImagePerceptionProvider {
  return {
    providerId: config.providerId,
    providerVersion: config.providerVersion,
    perceive: () => { throw error instanceof Error ? error : new Error(String(error)); },
  };
}

async function postProviderRequest(
  config: AsyncHttpImagePerceptionProviderConfig,
  envelope: AsyncImagePerceptionTransportEnvelope,
): Promise<unknown> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 30_000);
  try {
    const response = await fetchImpl(config.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(config.headers ?? {}) },
      body: JSON.stringify(envelope),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`IMAGE_PERCEPTION_PROVIDER_HTTP_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function runAsyncHttpImagePerceptionAdmission(
  repo: ImmutableDocumentRepository,
  byteStore: LocalImageByteStore,
  intake: ImageIntakeBundle,
  config: AsyncHttpImagePerceptionProviderConfig,
  options: RunImagePerceptionAdmissionOptions = {},
): Promise<ImagePerceptionAdmissionBundle> {
  try {
    if (intake.storage.sha256 !== intake.representation.contentHash) {
      throw new Error('IMAGE_PERCEPTION_SOURCE_STORAGE_IDENTITY_MISMATCH');
    }
    const bytes = byteStore.readPng(intake.storage.sha256);
    const envelope: AsyncImagePerceptionTransportEnvelope = {
      schemaVersion: 'talos-image-perception-request-v0.1',
      sourceRepresentationId: intake.representation.id,
      contentSha256: intake.representation.contentHash,
      mediaType: 'image/png',
      coordinateSpace: {
        width: intake.coordinateSpace.width,
        height: intake.coordinateSpace.height,
        basis: intake.coordinateSpace.coordinateBasis,
        orientation: intake.coordinateSpace.orientation,
        originConvention: intake.coordinateSpace.originConvention,
      },
      imageBase64: bytes.toString('base64'),
    };
    const raw = await postProviderRequest(config, envelope);
    const validated = validateUntrustedImagePerceptionProviderResult(raw, config);
    return runImagePerceptionAdmission(repo, intake, syncProviderFromResult(config, validated), options);
  } catch (error) {
    return runImagePerceptionAdmission(repo, intake, throwingSyncProvider(config, error), options);
  }
}
