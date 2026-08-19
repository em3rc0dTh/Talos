import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { CanvasChangeSet,CanvasDefinition,CanvasElementIdentity,CanvasId,CanvasRelationshipIdentity,CanvasRevision } from './types.ts';

function append(repo:ImmutableDocumentRepository,aggregateKind:string,id:CanvasId,payload:unknown,createdAt:string){repo.append({id,aggregateKind,schemaVersion:'canvas-v0.2-reference',payload,createdAt});}

export class CanvasDomainStore{
  readonly repo:ImmutableDocumentRepository;
  constructor(repo:ImmutableDocumentRepository){this.repo=repo;}
  saveDefinitionState(definition:CanvasDefinition,createdAt=definition.createdAt):void{append(this.repo,'CanvasDefinitionState',createOpaqueId('canvas',`definition-state:${definition.id}:${definition.latestRevisionId}`),definition,createdAt);}
  saveInitialCanvas(definition:CanvasDefinition,revision:CanvasRevision):void{this.saveDefinitionState(definition);for(const snapshot of revision.elementSnapshots)this.saveElementIdentity({id:snapshot.canvasElementId,canvasDefinitionId:definition.id,createdInRevisionId:revision.id},revision.createdAt);for(const snapshot of revision.relationshipSnapshots)this.saveRelationshipIdentity({id:snapshot.canvasRelationshipId,canvasDefinitionId:definition.id,createdInRevisionId:revision.id},revision.createdAt);this.saveRevision(revision);}
  saveRevisionTransition(definition:CanvasDefinition,changeSet:CanvasChangeSet,result:{revision:CanvasRevision;retiredElementIds:CanvasId[];retiredRelationshipIds:CanvasId[]}):void{this.saveChangeSet(changeSet);for(const op of changeSet.operations){if(op.kind==='ADD_ELEMENT')this.saveElementIdentity({id:op.element.canvasElementId,canvasDefinitionId:definition.id,createdInRevisionId:result.revision.id},result.revision.createdAt);if(op.kind==='ADD_RELATIONSHIP')this.saveRelationshipIdentity({id:op.relationship.canvasRelationshipId,canvasDefinitionId:definition.id,createdInRevisionId:result.revision.id},result.revision.createdAt);}for(const id of result.retiredElementIds)this.recordElementRetirement(id,result.revision.id,result.revision.createdAt);for(const id of result.retiredRelationshipIds)this.recordRelationshipRetirement(id,result.revision.id,result.revision.createdAt);this.saveRevision(result.revision);this.saveDefinitionState({...definition,latestRevisionId:result.revision.id},result.revision.createdAt);}
  saveElementIdentity(identity:CanvasElementIdentity,createdAt:string):void{append(this.repo,'CanvasElementIdentity',identity.id,identity,createdAt);}
  saveRelationshipIdentity(identity:CanvasRelationshipIdentity,createdAt:string):void{append(this.repo,'CanvasRelationshipIdentity',identity.id,identity,createdAt);}
  saveChangeSet(changeSet:CanvasChangeSet):void{append(this.repo,'CanvasChangeSet',changeSet.id,changeSet,changeSet.authoredAt);}
  saveRevision(revision:CanvasRevision):void{append(this.repo,'CanvasRevision',revision.id,revision,revision.createdAt);}
  recordElementRetirement(identityId:CanvasId,retiredInRevisionId:CanvasId,createdAt:string):void{append(this.repo,'CanvasElementRetirement',createOpaqueId('canvas',`element-retirement:${identityId}:${retiredInRevisionId}`),{identityId,retiredInRevisionId},createdAt);}
  recordRelationshipRetirement(identityId:CanvasId,retiredInRevisionId:CanvasId,createdAt:string):void{append(this.repo,'CanvasRelationshipRetirement',createOpaqueId('canvas',`relationship-retirement:${identityId}:${retiredInRevisionId}`),{identityId,retiredInRevisionId},createdAt);}
  getRevision(id:CanvasId):CanvasRevision|undefined{return this.repo.get<CanvasRevision>(id)?.payload;}
  listRevisions(canvasDefinitionId:CanvasId):readonly CanvasRevision[]{return this.repo.listByKind<CanvasRevision>('CanvasRevision').map(d=>d.payload).filter(r=>r.canvasDefinitionId===canvasDefinitionId);}
  listElementIdentities():readonly CanvasElementIdentity[]{return this.repo.listByKind<CanvasElementIdentity>('CanvasElementIdentity').map(d=>d.payload);}
  listRelationshipIdentities():readonly CanvasRelationshipIdentity[]{return this.repo.listByKind<CanvasRelationshipIdentity>('CanvasRelationshipIdentity').map(d=>d.payload);}
  getElementRetirement(identityId:CanvasId):CanvasId|undefined{return this.repo.listByKind<{identityId:CanvasId;retiredInRevisionId:CanvasId}>('CanvasElementRetirement').map(d=>d.payload).find(r=>r.identityId===identityId)?.retiredInRevisionId;}
}
