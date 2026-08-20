import type { SourceId } from '../../source-intake/src/types.ts';
import type { ImageCoordinateSpace } from './types.ts';

export type ImageGeometryKind = 'POINT'|'BOX'|'POLYGON'|'POLYLINE'|'MASK'|'WHOLE_IMAGE'|'SOURCE_DEFINED';
export type ImageVisibilityState = 'VISIBLE'|'PARTIALLY_VISIBLE'|'LOW_LEGIBILITY'|'OBSCURED'|'OUT_OF_FRAME_CANDIDATE'|'UNKNOWN';
export type PerceptionObservationKind =
  | 'TEXT_REGION'
  | 'TEXT_LITERAL_CANDIDATE'
  | 'SHAPE_REGION'
  | 'SHAPE_CLASS_CANDIDATE'
  | 'CONNECTOR_STROKE'
  | 'ARROWHEAD'
  | 'CONNECTOR_ENDPOINT'
  | 'CONTAINER_REGION'
  | 'ICON_REGION'
  | 'COLOR_STYLE'
  | 'LINE_STYLE'
  | 'SPATIAL_ATTACHMENT'
  | 'PLANE_REGION'
  | 'ANNOTATION_REGION'
  | 'EDITOR_UI_REGION'
  | 'CURSOR_PRESENCE'
  | 'SOURCE_DEFINED';

export interface ImagePerceptionProviderRequest {
  sourceRepresentationId: SourceId;
  contentSha256: string;
  mediaType: 'image/png';
  coordinateSpace: ImageCoordinateSpace;
}

export interface ProviderVisualAnchor {
  providerAnchorKey: string;
  geometryKind: ImageGeometryKind;
  geometry: unknown;
  visibilityState: ImageVisibilityState;
  notes?: string;
}

export interface ProviderObservation {
  providerObservationKey: string;
  anchorKey: string;
  observationKind: PerceptionObservationKind;
  observedValue?: unknown;
  confidence?: number;
  parentObservationKeys?: string[];
  notes?: string;
}

export interface ProviderAlternative {
  providerAlternativeKey: string;
  value: unknown;
  confidence?: number;
  anchorKeys: string[];
  supportingObservationKeys: string[];
  interpretationNotes?: string;
}

export interface ProviderAlternativeSet {
  providerAlternativeSetKey: string;
  subjectObservationKey?: string;
  propertyPath: string;
  alternatives: ProviderAlternative[];
  exclusivityMode: 'MUTUALLY_EXCLUSIVE'|'NON_EXCLUSIVE'|'SOURCE_DEFINED';
  modelPreferredAlternativeKey?: string;
  modelPreferenceConfidence?: number;
}

export interface ProviderEndpointCandidate {
  occurrenceCandidateKey?: string;
  anchorKey?: string;
  endpointState: 'SET_CANDIDATE'|'UNKNOWN'|'OUT_OF_FRAME'|'OCCLUDED'|'UNRESOLVED'|'SOURCE_DEFINED';
  confidence?: number;
}

export interface ProviderRelationCandidate {
  providerRelationKey: string;
  strokeObservationKeys: string[];
  anchorKeys: string[];
  existenceConfidence?: number;
  sourceEndpointCandidates: ProviderEndpointCandidate[];
  targetEndpointCandidates: ProviderEndpointCandidate[];
  directionCandidates: Array<{ value: 'SOURCE_TO_TARGET'|'TARGET_TO_SOURCE'|'BIDIRECTIONAL'|'UNKNOWN'; confidence?: number }>;
  roleAlternativeSetKey?: string;
  guardTextObservationKeys?: string[];
  notes?: string;
}

export interface ImagePerceptionProviderResult {
  providerId: string;
  providerVersion: string;
  providerClass: 'FIXTURE_PROVIDER'|'MODEL_PROVIDER'|'SOURCE_DEFINED';
  modelRef: string;
  modelVersion: string;
  pipelineVersion: string;
  evidenceMode: 'FIXTURE_EXPECTATION'|'MODEL_INFERENCE'|'SOURCE_DEFINED';
  status: 'SUCCEEDED'|'PARTIAL'|'NO_RESULT';
  anchors: ProviderVisualAnchor[];
  observations: ProviderObservation[];
  alternativeSets: ProviderAlternativeSet[];
  relationCandidates: ProviderRelationCandidate[];
  diagnostics: Array<{ code: string; description: string }>;
}

export interface ImagePerceptionProvider {
  readonly providerId: string;
  readonly providerVersion: string;
  perceive(request: ImagePerceptionProviderRequest): ImagePerceptionProviderResult;
}

export interface VisualEvidenceAnchor {
  id: SourceId;
  sourceRepresentationId: SourceId;
  coordinateSpaceId: SourceId;
  geometryKind: ImageGeometryKind;
  geometry: unknown;
  visibilityState: ImageVisibilityState;
  anchorDigest?: string;
  notes?: string;
}

export interface PerceptionObservation {
  id: SourceId;
  adapterAttemptId: SourceId;
  sourceRepresentationId: SourceId;
  anchorId: SourceId;
  observationKind: PerceptionObservationKind;
  observedValue?: unknown;
  confidence?: number;
  modelRef: string;
  modelVersion: string;
  pipelineStage: string;
  createdAt: string;
  alternativeSetRef?: SourceId;
  parentObservationRefs?: SourceId[];
  notes?: string;
}

export interface PerceptionAlternative {
  id: SourceId;
  value: unknown;
  confidence?: number;
  evidenceAnchorRefs: SourceId[];
  supportingObservationRefs: SourceId[];
  interpretationNotes?: string;
}

export interface PerceptionAlternativeSet {
  id: SourceId;
  adapterAttemptId: SourceId;
  subjectObservationRef?: SourceId;
  propertyPath: string;
  alternatives: PerceptionAlternative[];
  exclusivityMode: 'MUTUALLY_EXCLUSIVE'|'NON_EXCLUSIVE'|'SOURCE_DEFINED';
  modelPreferredAlternativeId?: SourceId;
  modelPreferenceConfidence?: number;
  createdAt: string;
}

export interface PerceptionEndpointCandidate {
  occurrenceCandidateRef?: string;
  anchorRef?: SourceId;
  endpointState: 'SET_CANDIDATE'|'UNKNOWN'|'OUT_OF_FRAME'|'OCCLUDED'|'UNRESOLVED'|'SOURCE_DEFINED';
  confidence?: number;
}

export interface PerceptionRelationCandidate {
  id: SourceId;
  adapterAttemptId: SourceId;
  strokeObservationRefs: SourceId[];
  relationAnchorRefs: SourceId[];
  existenceConfidence?: number;
  sourceEndpointCandidates: PerceptionEndpointCandidate[];
  targetEndpointCandidates: PerceptionEndpointCandidate[];
  directionCandidates: Array<{ value: 'SOURCE_TO_TARGET'|'TARGET_TO_SOURCE'|'BIDIRECTIONAL'|'UNKNOWN'; confidence?: number }>;
  roleAlternativeSetRef?: SourceId;
  guardTextObservationRefs: SourceId[];
  notes?: string;
}
