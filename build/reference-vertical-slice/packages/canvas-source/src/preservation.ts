import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import { appendRecord } from '../../source-intake/src/store.ts';
import type { PreservedCanvasSource,SourceArtifact,SourceAvailabilityRecord,SourceCapture,SourceIntakeSession,SourceRepresentation } from '../../source-intake/src/types.ts';
import type { CanvasDefinition,CanvasRevision,TalosCanvasNativeSource } from './types.ts';

export interface PreviewDescriptor { contentHash:string; derivationMethod:string; createdAt:string; }

export function toNativeEnvelope(definition:CanvasDefinition,revision:CanvasRevision):TalosCanvasNativeSource{
  return{schemaVersion:'talos-canvas-native-v0.2',canvasDefinition:definition,canvasRevision:revision,elements:revision.elementSnapshots,relationships:revision.relationshipSnapshots,containerMemberships:revision.containerMemberships,semanticDigestAlgorithmVersion:revision.digestAlgorithmVersion,nativeDigestAlgorithmVersion:revision.digestAlgorithmVersion};
}

export function preserveCanvasRevision(repo:ImmutableDocumentRepository,definition:CanvasDefinition,revision:CanvasRevision,options:{startedAt?:string;initiatedBy?:string;preview?:PreviewDescriptor}={}):PreservedCanvasSource<TalosCanvasNativeSource>{
  const startedAt=options.startedAt??revision.createdAt;
  const originId=definition.sourceOriginId;
  const session:SourceIntakeSession={id:createOpaqueId('source',`intake-session:${revision.id}`),startedAt,...(options.initiatedBy?{initiatedBy:options.initiatedBy}:{}),channel:'TALOS_CANVAS',sourceInputRefs:[revision.id],declaredIntent:'NATIVE_CANVAS_PROCESS_AUTHORING'};
  const capture:SourceCapture={id:createOpaqueId('source',`capture:${revision.id}`),sourceOriginId:originId,capturedAt:startedAt,captureMethod:'CANVAS_NATIVE',sessionRef:session.id};
  const nativeRepresentationId=createOpaqueId('source',`native-representation:${revision.id}`);
  const availabilityId=createOpaqueId('source',`availability:${revision.id}:native`);
  const artifactId=createOpaqueId('source',`artifact:${definition.id}`);
  const previewRepresentations:SourceRepresentation[]=[];
  if(options.preview){previewRepresentations.push({id:createOpaqueId('source',`preview:${revision.id}:${options.preview.contentHash}`),sourceArtifactId:artifactId,sourceOriginId:originId,captureId:capture.id,representationKind:'PREVIEW',contentHash:options.preview.contentHash,hashAlgorithm:'SHA-256',derivedFromRepresentationId:nativeRepresentationId,derivationMethod:options.preview.derivationMethod,byteIdentityStatus:'NOT_BYTE_IDENTICAL',createdAt:options.preview.createdAt});}
  const artifact:SourceArtifact={id:artifactId,sourceOriginId:originId,artifactClass:'TALOS_CANVAS',...(definition.title?{declaredName:definition.title}:{}),captureIds:[capture.id],representationIds:[nativeRepresentationId,...previewRepresentations.map(p=>p.id)],availabilityRecordIds:[availabilityId]};
  const nativeValue=toNativeEnvelope(definition,revision);
  const nativeRepresentation:SourceRepresentation<TalosCanvasNativeSource>={id:nativeRepresentationId,sourceArtifactId:artifact.id,sourceOriginId:originId,captureId:capture.id,representationKind:'NATIVE_STRUCTURED',contentHash:digestDeterministicJson(nativeValue),hashAlgorithm:'SHA-256',byteIdentityStatus:'EXACT_VERIFIED',nativeValue,createdAt:revision.createdAt};
  const availability:SourceAvailabilityRecord={id:availabilityId,sourceOriginId:originId,sourceArtifactId:artifact.id,representationClass:'NATIVE_STRUCTURED_MODEL',status:'AVAILABLE_TO_TALOS',observedAt:startedAt};
  const origin={id:originId,originKind:'TALOS_NATIVE' as const,mediumKind:'TALOS_CANVAS',createdAt:definition.createdAt};
  appendRecord(repo,'SourceIntakeSession',session,session.startedAt,session.id);
  appendRecord(repo,'SourceOrigin',origin,definition.createdAt,origin.id);
  appendRecord(repo,'SourceCapture',capture,capture.capturedAt,capture.id);
  appendRecord(repo,'SourceArtifactObservation',artifact,startedAt,createOpaqueId('source',`artifact-observation:${artifact.id}:${revision.id}`));
  appendRecord(repo,'SourceRepresentation',nativeRepresentation,revision.createdAt,nativeRepresentation.id);
  for(const preview of previewRepresentations)appendRecord(repo,'SourceRepresentation',preview,preview.createdAt??startedAt,preview.id);
  appendRecord(repo,'SourceAvailabilityRecord',availability,availability.observedAt,availability.id);
  return{session,origin,capture,artifact,nativeRepresentation,availability,previewRepresentations};
}
