import type { OpaqueId } from '../../foundation/src/ids.ts';
import type {
  SourceArtifact,
  SourceAvailabilityRecord,
  SourceCapture,
  SourceId,
  SourceIntakeSession,
  SourceOrigin,
  SourceRepresentation,
} from '../../source-intake/src/types.ts';

export type ImagePerceptionId = OpaqueId<'source'>;

export interface ImageByteStorageRecord {
  id: SourceId;
  sourceRepresentationId: SourceId;
  sha256: string;
  mediaType: 'image/png';
  byteLength: number;
  relativePath: string;
  storageKind: 'LOCAL_CONTENT_ADDRESSED_REFERENCE';
}

export interface ImageCoordinateSpace {
  id: SourceId;
  sourceRepresentationId: SourceId;
  width: number;
  height: number;
  orientation: 'UPRIGHT';
  coordinateBasis: 'PIXEL';
  originConvention: 'TOP_LEFT_X_RIGHT_Y_DOWN';
}

export interface ImageIntakeBundle {
  session: SourceIntakeSession;
  origin: SourceOrigin;
  capture: SourceCapture;
  artifact: SourceArtifact;
  representation: SourceRepresentation;
  availability: SourceAvailabilityRecord;
  storage: ImageByteStorageRecord;
  coordinateSpace: ImageCoordinateSpace;
}

export interface ImageIntakeOptions {
  receivedAt?: string;
  initiatedBy?: string;
  declaredName?: string;
  declaredDescription?: string;
}

export interface StoredImageBytes {
  sha256: string;
  byteLength: number;
  relativePath: string;
  reused: boolean;
}

export interface PngDimensions {
  width: number;
  height: number;
}
