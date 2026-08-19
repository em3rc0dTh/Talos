import type { OpaqueId } from '../../foundation/src/ids.ts';
import type { SourceId } from '../../source-intake/src/types.ts';

export type CanvasId = OpaqueId<'canvas'>;
export type CanvasElementKind='TRIGGER'|'ACTION'|'DECISION'|'PARALLEL_SPLIT'|'JOIN'|'WAIT'|'HUMAN_INTERACTION'|'SUBPROCESS'|'STATE'|'END'|'ACTOR'|'DATA_OBJECT'|'BUSINESS_RULE'|'ANNOTATION'|'GROUP';
export type CanvasRelationshipKind='CONTROL_FLOW'|'CONDITIONAL_FLOW'|'DEFAULT_FLOW'|'PARALLEL_FLOW'|'MESSAGE_RELATIONSHIP'|'DATA_ASSOCIATION'|'RESPONSIBILITY_RELATIONSHIP'|'RULE_BINDING'|'SUBPROCESS_RELATIONSHIP'|'ANNOTATION_RELATIONSHIP'|'SOURCE_DEFINED';
export type CanvasPropertyValue<T=unknown>={state:'SET';value?:T;literalText?:string;unit?:string;notes?:string}|{state:'UNKNOWN';literalText?:string;unit?:string;notes?:string}|{state:'NOT_APPLICABLE';literalText?:string;unit?:string;notes?:string};
export type CanvasEndpointRef={state:'SET';elementId:CanvasId;notes?:string}|{state:'UNKNOWN';notes?:string}|{state:'UNCONNECTED';notes?:string};
export interface CanvasGuard { literalText?: string; ruleRef?: CanvasId; semanticState:'SET'|'UNKNOWN'|'NOT_APPLICABLE'; }
export interface CanvasDefinition { id:CanvasId; sourceOriginId:SourceId; title?:string; description?:string; createdAt:string; createdBy?:string; latestRevisionId:CanvasId; lifecycleStatus?:string; }
export interface CanvasElementIdentity { id:CanvasId; canvasDefinitionId:CanvasId; createdInRevisionId:CanvasId; retiredInRevisionId?:CanvasId; }
export interface CanvasRelationshipIdentity { id:CanvasId; canvasDefinitionId:CanvasId; createdInRevisionId:CanvasId; retiredInRevisionId?:CanvasId; }
export interface CanvasElementDraft { canvasElementId:CanvasId; kind:CanvasElementKind; label:string; description?:string; propertyValues:Record<string,CanvasPropertyValue>; actorRefs:CanvasId[]; dataRefs:CanvasId[]; ruleRefs:CanvasId[]; sourceMetadata?:Record<string,unknown>; }
export interface CanvasElementSnapshot extends CanvasElementDraft { snapshotId:CanvasId; canvasRevisionId:CanvasId; }
export interface CanvasRelationshipDraft { canvasRelationshipId:CanvasId; kind:CanvasRelationshipKind; sourceEndpoint:CanvasEndpointRef; targetEndpoint:CanvasEndpointRef; label?:string; guard?:CanvasGuard; relationshipProperties:Record<string,CanvasPropertyValue>; }
export interface CanvasRelationshipSnapshot extends CanvasRelationshipDraft { snapshotId:CanvasId; canvasRevisionId:CanvasId; }
export interface CanvasContainerMembership { id:CanvasId; canvasRevisionId:CanvasId; containerElementId:CanvasId; memberElementId:CanvasId; membershipKind:'VISUAL_GROUP'|'RESPONSIBILITY_SCOPE'|'SUBPROCESS_SCOPE'|'ANNOTATION_SCOPE'|'SOURCE_DEFINED'; }
export interface CanvasPresentationSnapshot { nodeLayouts?:Record<string,unknown>[]; edgeRoutes?:Record<string,unknown>[]; viewport?:Record<string,unknown>; zoom?:number; styleTokens?:unknown[]; orderingHints?:unknown[]; }
export interface CanvasRevision { id:CanvasId; canvasDefinitionId:CanvasId; revisionNumber:number; parentRevisionId?:CanvasId; createdAt:string; createdBy?:string; revisionKind:'SEMANTIC'|'PRESENTATION'|'MIXED'; changeSetId:CanvasId; elementSnapshots:CanvasElementSnapshot[]; relationshipSnapshots:CanvasRelationshipSnapshot[]; containerMemberships:CanvasContainerMembership[]; presentationSnapshot?:CanvasPresentationSnapshot; semanticDigest:string; nativeRepresentationDigest:string; digestAlgorithmVersion:string; notes?:string; }
export interface CanvasRevisionDraft { id:CanvasId; canvasDefinitionId:CanvasId; revisionNumber:number; parentRevisionId?:CanvasId; createdAt:string; createdBy?:string; revisionKind:'SEMANTIC'|'PRESENTATION'|'MIXED'; changeSetId:CanvasId; elements:CanvasElementDraft[]; relationships:CanvasRelationshipDraft[]; memberships?:Array<Omit<CanvasContainerMembership,'canvasRevisionId'>>; presentationSnapshot?:CanvasPresentationSnapshot; notes?:string; }
export interface TalosCanvasNativeSource { schemaVersion:'talos-canvas-native-v0.2'; canvasDefinition:CanvasDefinition; canvasRevision:CanvasRevision; elements:CanvasElementSnapshot[]; relationships:CanvasRelationshipSnapshot[]; containerMemberships:CanvasContainerMembership[]; semanticDigestAlgorithmVersion:string; nativeDigestAlgorithmVersion:string; }
export type CanvasChangeOperation=
 | {kind:'ADD_ELEMENT';element:CanvasElementDraft}
 | {kind:'UPDATE_ELEMENT_PROPERTY';elementId:CanvasId;patch:Partial<Omit<CanvasElementDraft,'canvasElementId'>>}
 | {kind:'RETIRE_ELEMENT';elementId:CanvasId}
 | {kind:'ADD_RELATIONSHIP';relationship:CanvasRelationshipDraft}
 | {kind:'UPDATE_RELATIONSHIP_PROPERTY';relationshipId:CanvasId;patch:Partial<Omit<CanvasRelationshipDraft,'canvasRelationshipId'>>}
 | {kind:'RETIRE_RELATIONSHIP';relationshipId:CanvasId}
 | {kind:'CONNECT_RELATIONSHIP_ENDPOINT';relationshipId:CanvasId;endpoint:'source'|'target';elementId:CanvasId}
 | {kind:'DISCONNECT_RELATIONSHIP_ENDPOINT';relationshipId:CanvasId;endpoint:'source'|'target'}
 | {kind:'MARK_ENDPOINT_UNKNOWN';relationshipId:CanvasId;endpoint:'source'|'target'}
 | {kind:'ADD_MEMBERSHIP';membership:Omit<CanvasContainerMembership,'canvasRevisionId'>}
 | {kind:'REMOVE_MEMBERSHIP';membershipId:CanvasId}
 | {kind:'UPDATE_PRESENTATION';presentationSnapshot:CanvasPresentationSnapshot}
 | {kind:'SOURCE_DEFINED';payload:unknown};
export interface CanvasChangeSet { id:CanvasId; canvasDefinitionId:CanvasId; baseRevisionId:CanvasId; resultingRevisionId:CanvasId; authoredBy?:string; authoredAt:string; operations:CanvasChangeOperation[]; }
export interface CanvasRevisionApplicationResult { revision:CanvasRevision; retiredElementIds:CanvasId[]; retiredRelationshipIds:CanvasId[]; }
