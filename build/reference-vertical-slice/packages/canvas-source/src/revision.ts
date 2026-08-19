import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { CanvasContainerMembership,CanvasElementDraft,CanvasElementSnapshot,CanvasEndpointRef,CanvasRelationshipDraft,CanvasRelationshipSnapshot,CanvasRevision,CanvasRevisionApplicationResult,CanvasRevisionDraft,CanvasChangeSet,CanvasId } from './types.ts';

export const CANVAS_DIGEST_ALGORITHM_VERSION='talos-canvas-digest-v1';

function validateEndpoint(endpoint:CanvasEndpointRef,label:string):void{
  if(endpoint.state==='SET' && !endpoint.elementId) throw new TypeError(`${label} SET endpoint requires elementId`);
  if(endpoint.state!=='SET' && 'elementId' in endpoint) throw new TypeError(`${label} ${endpoint.state} endpoint must not carry elementId`);
}
function snapshotElement(revisionId:CanvasId,element:CanvasElementDraft):CanvasElementSnapshot{
  return {...element,snapshotId:createOpaqueId('canvas',`element-snapshot:${revisionId}:${element.canvasElementId}`),canvasRevisionId:revisionId};
}
function snapshotRelationship(revisionId:CanvasId,relationship:CanvasRelationshipDraft):CanvasRelationshipSnapshot{
  validateEndpoint(relationship.sourceEndpoint,'source'); validateEndpoint(relationship.targetEndpoint,'target');
  return {...relationship,snapshotId:createOpaqueId('canvas',`relationship-snapshot:${revisionId}:${relationship.canvasRelationshipId}`),canvasRevisionId:revisionId};
}
function semanticElement(element:CanvasElementSnapshot){const {snapshotId:_,canvasRevisionId:__,...stable}=element; return stable;}
function semanticRelationship(rel:CanvasRelationshipSnapshot){const {snapshotId:_,canvasRevisionId:__,...stable}=rel; return stable;}
function semanticMembership(m:CanvasContainerMembership){return {id:m.id,containerElementId:m.containerElementId,memberElementId:m.memberElementId,membershipKind:m.membershipKind};}

export function semanticProjection(revision:CanvasRevision):unknown{
  const elements=revision.elementSnapshots.filter(e=>e.kind!=='ANNOTATION'&&e.kind!=='GROUP').map(semanticElement).sort((a,b)=>String(a.canvasElementId).localeCompare(String(b.canvasElementId)));
  const relationships=revision.relationshipSnapshots.filter(r=>r.kind!=='ANNOTATION_RELATIONSHIP').map(semanticRelationship).sort((a,b)=>String(a.canvasRelationshipId).localeCompare(String(b.canvasRelationshipId)));
  const memberships=revision.containerMemberships.filter(m=>m.membershipKind==='RESPONSIBILITY_SCOPE'||m.membershipKind==='SUBPROCESS_SCOPE'||m.membershipKind==='SOURCE_DEFINED').map(semanticMembership).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
  return {canvasDefinitionId:revision.canvasDefinitionId,elements,relationships,memberships};
}
export function nativeProjection(revision:CanvasRevision):unknown{const {semanticDigest:_,nativeRepresentationDigest:__,...withoutDigests}=revision; return withoutDigests;}

export function buildCanvasRevision(draft:CanvasRevisionDraft):CanvasRevision{
  if(draft.revisionNumber<1||!Number.isInteger(draft.revisionNumber)) throw new TypeError('revisionNumber must be a positive integer');
  const ids=new Set(draft.elements.map(e=>e.canvasElementId)); if(ids.size!==draft.elements.length) throw new TypeError('duplicate canvasElementId in revision');
  const relIds=new Set(draft.relationships.map(r=>r.canvasRelationshipId)); if(relIds.size!==draft.relationships.length) throw new TypeError('duplicate canvasRelationshipId in revision');
  for(const r of draft.relationships){validateEndpoint(r.sourceEndpoint,'source');validateEndpoint(r.targetEndpoint,'target');for(const endpoint of [r.sourceEndpoint,r.targetEndpoint])if(endpoint.state==='SET'&&!ids.has(endpoint.elementId))throw new TypeError(`relationship ${r.canvasRelationshipId} references missing element ${endpoint.elementId}`);}
  const revisionBase={id:draft.id,canvasDefinitionId:draft.canvasDefinitionId,revisionNumber:draft.revisionNumber,...(draft.parentRevisionId?{parentRevisionId:draft.parentRevisionId}:{}),createdAt:draft.createdAt,...(draft.createdBy?{createdBy:draft.createdBy}:{}),revisionKind:draft.revisionKind,changeSetId:draft.changeSetId,elementSnapshots:draft.elements.map(e=>snapshotElement(draft.id,e)),relationshipSnapshots:draft.relationships.map(r=>snapshotRelationship(draft.id,r)),containerMemberships:(draft.memberships??[]).map(m=>({...m,canvasRevisionId:draft.id})),...(draft.presentationSnapshot?{presentationSnapshot:draft.presentationSnapshot}:{}),digestAlgorithmVersion:CANVAS_DIGEST_ALGORITHM_VERSION,...(draft.notes?{notes:draft.notes}: {})};
  const temporary={...revisionBase,semanticDigest:'',nativeRepresentationDigest:''} as CanvasRevision;
  const semanticDigest=digestDeterministicJson(semanticProjection(temporary));
  const withSemantic={...temporary,semanticDigest};
  const nativeRepresentationDigest=digestDeterministicJson(nativeProjection(withSemantic));
  return {...withSemantic,nativeRepresentationDigest};
}
function toElementDraft(snapshot:CanvasElementSnapshot):CanvasElementDraft{const {snapshotId:_,canvasRevisionId:__,...draft}=snapshot;return draft;}
function toRelationshipDraft(snapshot:CanvasRelationshipSnapshot):CanvasRelationshipDraft{const {snapshotId:_,canvasRevisionId:__,...draft}=snapshot;return draft;}

export function applyCanvasChangeSet(previous:CanvasRevision,changeSet:CanvasChangeSet,revisionKind:'SEMANTIC'|'PRESENTATION'|'MIXED',createdAt=changeSet.authoredAt):CanvasRevisionApplicationResult{
  if(changeSet.baseRevisionId!==previous.id) throw new TypeError('ChangeSet baseRevisionId does not match previous revision');
  if(changeSet.canvasDefinitionId!==previous.canvasDefinitionId) throw new TypeError('ChangeSet canvasDefinitionId mismatch');
  let elements=previous.elementSnapshots.map(toElementDraft); let relationships=previous.relationshipSnapshots.map(toRelationshipDraft); let memberships=previous.containerMemberships.map(({canvasRevisionId:_,...m})=>m); let presentation=previous.presentationSnapshot;
  const retiredElementIds:CanvasId[]=[]; const retiredRelationshipIds:CanvasId[]=[];
  for(const op of changeSet.operations){
    switch(op.kind){
      case 'ADD_ELEMENT': if(elements.some(e=>e.canvasElementId===op.element.canvasElementId))throw new TypeError('element already exists'); elements.push(op.element); break;
      case 'UPDATE_ELEMENT_PROPERTY': {const i=elements.findIndex(e=>e.canvasElementId===op.elementId);if(i<0)throw new TypeError('element not found');elements[i]={...elements[i],...op.patch,canvasElementId:op.elementId} as CanvasElementDraft;break;}
      case 'RETIRE_ELEMENT': {const attached=relationships.filter(r=>(r.sourceEndpoint.state==='SET'&&r.sourceEndpoint.elementId===op.elementId)||(r.targetEndpoint.state==='SET'&&r.targetEndpoint.elementId===op.elementId));if(attached.length)throw new TypeError('retiring an element with attached relationships requires explicit relationship retirement');elements=elements.filter(e=>e.canvasElementId!==op.elementId);memberships=memberships.filter(m=>m.containerElementId!==op.elementId&&m.memberElementId!==op.elementId);retiredElementIds.push(op.elementId);break;}
      case 'ADD_RELATIONSHIP': if(relationships.some(r=>r.canvasRelationshipId===op.relationship.canvasRelationshipId))throw new TypeError('relationship already exists');relationships.push(op.relationship);break;
      case 'UPDATE_RELATIONSHIP_PROPERTY': {const i=relationships.findIndex(r=>r.canvasRelationshipId===op.relationshipId);if(i<0)throw new TypeError('relationship not found');relationships[i]={...relationships[i],...op.patch,canvasRelationshipId:op.relationshipId} as CanvasRelationshipDraft;break;}
      case 'RETIRE_RELATIONSHIP': relationships=relationships.filter(r=>r.canvasRelationshipId!==op.relationshipId);retiredRelationshipIds.push(op.relationshipId);break;
      case 'CONNECT_RELATIONSHIP_ENDPOINT': relationships=relationships.map(r=>r.canvasRelationshipId===op.relationshipId?{...r,[`${op.endpoint}Endpoint`]:{state:'SET',elementId:op.elementId}} as CanvasRelationshipDraft:r);break;
      case 'DISCONNECT_RELATIONSHIP_ENDPOINT': relationships=relationships.map(r=>r.canvasRelationshipId===op.relationshipId?{...r,[`${op.endpoint}Endpoint`]:{state:'UNCONNECTED'}} as CanvasRelationshipDraft:r);break;
      case 'MARK_ENDPOINT_UNKNOWN': relationships=relationships.map(r=>r.canvasRelationshipId===op.relationshipId?{...r,[`${op.endpoint}Endpoint`]:{state:'UNKNOWN'}} as CanvasRelationshipDraft:r);break;
      case 'ADD_MEMBERSHIP': memberships.push(op.membership);break;
      case 'REMOVE_MEMBERSHIP': memberships=memberships.filter(m=>m.id!==op.membershipId);break;
      case 'UPDATE_PRESENTATION': presentation=op.presentationSnapshot;break;
      case 'SOURCE_DEFINED': break;
    }
  }
  const revision=buildCanvasRevision({id:changeSet.resultingRevisionId,canvasDefinitionId:previous.canvasDefinitionId,revisionNumber:previous.revisionNumber+1,parentRevisionId:previous.id,createdAt,revisionKind,changeSetId:changeSet.id,elements,relationships,memberships,...(presentation?{presentationSnapshot:presentation}:{}),...(changeSet.authoredBy?{createdBy:changeSet.authoredBy}: {})});
  if(revisionKind==='PRESENTATION'&&revision.semanticDigest!==previous.semanticDigest)throw new TypeError('PRESENTATION revision cannot change semanticDigest');
  return {revision,retiredElementIds,retiredRelationshipIds};
}
