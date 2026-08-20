import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type {
  SourceArtifact,
  SourceAvailabilityRecord,
  SourceCapture,
  SourceIntakeSession,
  SourceOrigin,
  SourceRepresentation,
} from '../../source-intake/src/types.ts';
import { LocalImageByteStore } from './byte-store.ts';
import { parsePngDimensions } from './png.ts';
import type {
  ImageByteStorageRecord,
  ImageCoordinateSpace,
  ImageIntakeBundle,
  ImageIntakeOptions,
} from './types.ts';

const SCHEMA = 'image-intake-v0.1-reference';

function append<T extends { id?: string }>(
  repo: ImmutableDocumentRepository,
  id: any,
  aggregateKind: string,
  payload: T,
  createdAt: string,
): void {
  repo.append({ id, aggregateKind, schemaVersion: SCHEMA, payload, createdAt });
}

export function intakePngUpload(
  repo: ImmutableDocumentRepository,
  byteStore: LocalImageByteStore,
  bytes: Uint8Array,
  options: ImageIntakeOptions = {},
): ImageIntakeBundle {
  const receivedAt = options.receivedAt ?? new Date().toISOString();
  const dimensions = parsePngDimensions(bytes);
  const stored = byteStore.putPng(bytes);

  const sessionId = createOpaqueId('source');
  const originId = createOpaqueId('source');
  const captureId = createOpaqueId('source');
  const artifactId = createOpaqueId('source');
  const representationId = createOpaqueId('source');
  const availabilityId = createOpaqueId('source');
  const storageId = createOpaqueId('source', `image-storage:${representationId}`);
  const coordinateSpaceId = createOpaqueId('source', `image-coordinate-space:${representationId}`);

  const session: SourceIntakeSession = {
    id: sessionId,
    startedAt: receivedAt,
    channel: 'FILE_UPLOAD',
    sourceInputRefs: [artifactId],
    ...(options.initiatedBy ? { initiatedBy: options.initiatedBy } : {}),
    declaredIntent: 'IMAGE_SOURCE_INTAKE',
  };

  const origin: SourceOrigin = {
    id: originId,
    originKind: 'DIGITAL_NATIVE_ARTIFACT',
    mediumKind: 'IMAGE_PNG',
    ...(options.declaredDescription ? { declaredDescription: options.declaredDescription } : {}),
  };

  const capture: SourceCapture = {
    id: captureId,
    sourceOriginId: originId,
    capturedAt: receivedAt,
    captureMethod: 'DIRECT_UPLOAD',
    sessionRef: sessionId,
  };

  const storage: ImageByteStorageRecord = {
    id: storageId,
    sourceRepresentationId: representationId,
    sha256: stored.sha256,
    mediaType: 'image/png',
    byteLength: stored.byteLength,
    relativePath: stored.relativePath,
    storageKind: 'LOCAL_CONTENT_ADDRESSED_REFERENCE',
  };

  const representation: SourceRepresentation = {
    id: representationId,
    sourceArtifactId: artifactId,
    sourceOriginId: originId,
    captureId,
    representationKind: 'NATIVE_DIGITAL',
    contentHash: stored.sha256,
    hashAlgorithm: 'SHA-256',
    storageRef: storageId,
    byteIdentityStatus: 'EXACT_VERIFIED',
    createdAt: receivedAt,
  };

  const availability: SourceAvailabilityRecord = {
    id: availabilityId,
    sourceOriginId: originId,
    sourceArtifactId: artifactId,
    representationClass: 'NATIVE_IMAGE_BYTES',
    status: 'AVAILABLE_TO_TALOS',
    observedAt: receivedAt,
  };

  const artifact: SourceArtifact = {
    id: artifactId,
    sourceOriginId: originId,
    artifactClass: 'IMAGE',
    ...(options.declaredName ? { declaredName: options.declaredName } : {}),
    captureIds: [captureId],
    representationIds: [representationId],
    availabilityRecordIds: [availabilityId],
  };

  const coordinateSpace: ImageCoordinateSpace = {
    id: coordinateSpaceId,
    sourceRepresentationId: representationId,
    width: dimensions.width,
    height: dimensions.height,
    orientation: 'UPRIGHT',
    coordinateBasis: 'PIXEL',
    originConvention: 'TOP_LEFT_X_RIGHT_Y_DOWN',
  };

  append(repo, session.id, 'SourceIntakeSession', session, receivedAt);
  append(repo, origin.id, 'SourceOrigin', origin, receivedAt);
  append(repo, capture.id, 'SourceCapture', capture, receivedAt);
  append(repo, storage.id, 'ImageByteStorageRecord', storage, receivedAt);
  append(repo, representation.id, 'SourceRepresentation', representation, receivedAt);
  append(repo, availability.id, 'SourceAvailabilityRecord', availability, receivedAt);
  append(repo, artifact.id, 'SourceArtifact', artifact, receivedAt);
  append(repo, coordinateSpace.id, 'ImageCoordinateSpace', coordinateSpace, receivedAt);

  return { session, origin, capture, artifact, representation, availability, storage, coordinateSpace };
}
