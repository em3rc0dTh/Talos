import { createOpaqueId, type OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import {
  adaptPreservedCanvas,
  buildCanvasRevision,
  CanvasDomainStore,
  preserveCanvasRevision,
  type CanvasDefinition,
  type CanvasElementDraft,
  type CanvasRelationshipDraft,
} from '../../canvas-source/src/index.ts';
import { validateProcessRevision } from '../../semantic-core/src/validation.ts';
import { projectCanonicalProcessToBpmn } from '../../review/src/bpmn-projector.ts';
import { normalizeAdapterResult } from './normalization.ts';
import { persistValidationBundle } from './validation-persistence.ts';

export interface ProductCanvasElementInput{
  id?:string;
  kind:string;
  label:string;
  waitKind?:string;
  expression?:string;
}

export interface ProductCanvasConnectionInput{
  id?:string;
  from:string;
  to:string;
  kind?:string;
  condition?:string;
}

export interface ProductCanvasInput{
  title:string;
  initiatedBy:string;
  elements:ProductCanvasElementInput[];
  connections?:ProductCanvasConnectionInput[];
  presentation?:unknown;
  createdAt?:string;
}

function required(value:string,field:string):string{
  const normalized=value.trim();
  if(!normalized)throw new TypeError(`${field} must be non-empty`);
  return normalized;
}

export function prepareProductCanvasSource(repo:ImmutableDocumentRepository,input:ProductCanvasInput){
  if(!Array.isArray(input.elements)||input.elements.length===0)throw new TypeError('Canvas requires at least one process step');
  const initiatedBy=required(input.initiatedBy,'initiatedBy');
  const title=required(input.title||'Untitled process','title');
  const now=input.createdAt??new Date().toISOString();
  const definitionId=createOpaqueId('canvas',`product-canvas-definition:${title}:${now}`);
  const revisionId=createOpaqueId('canvas',`product-canvas-revision:${definitionId}:1`);
  const changeSetId=createOpaqueId('canvas',`product-canvas-changeset:${revisionId}`);
  const sourceOriginId=createOpaqueId('source',`product-canvas-origin:${definitionId}`);

  const kindMap:Record<string,CanvasElementDraft['kind']>={
    START:'TRIGGER',
    STEP:'ACTION',
    DECISION:'DECISION',
    WAIT:'WAIT',
    PERSON:'HUMAN_INTERACTION',
    APPROVAL:'HUMAN_INTERACTION',
    SUBPROCESS:'SUBPROCESS',
    END:'END',
  };
  const clientToCanvas=new Map<string,ReturnType<typeof createOpaqueId>>();
  const elements:CanvasElementDraft[]=input.elements.map((item,index)=>{
    const clientId=required(item.id??`step-${index+1}`,`elements[${index}].id`);
    const requestedKind=required(item.kind,`elements[${index}].kind`).toUpperCase();
    const kind=kindMap[requestedKind];
    if(!kind)throw new TypeError(`Unsupported Canvas step kind: ${requestedKind}`);
    const canvasElementId=createOpaqueId('canvas',`product-canvas-element:${definitionId}:${clientId}`);
    clientToCanvas.set(clientId,canvasElementId);
    const propertyValues:Record<string,any>={};
    if(kind==='WAIT'){
      const waitKind=item.waitKind?.trim().toUpperCase();
      const expression=item.expression?.trim();
      propertyValues.waitKind=waitKind?{state:'SET',value:waitKind}:{state:'SET',value:'SOURCE_DEFINED'};
      if(expression)propertyValues.duration={state:'SET',literalText:expression};
    }
    if(kind==='HUMAN_INTERACTION')propertyValues.interactionKind={state:'SET',value:requestedKind==='APPROVAL'?'APPROVAL':'HUMAN_TASK'};
    return{canvasElementId,kind,label:required(item.label,`elements[${index}].label`),propertyValues,actorRefs:[],dataRefs:[],ruleRefs:[]};
  });

  const provided=input.connections??[];
  const connections:ProductCanvasConnectionInput[]=provided.length?provided:input.elements.slice(0,-1).map((item,index)=>({
    id:`auto-${index+1}`,
    from:item.id??`step-${index+1}`,
    to:input.elements[index+1]!.id??`step-${index+2}`,
    kind:'FLOW',
  }));

  const relationships:CanvasRelationshipDraft[]=connections.map((item,index)=>{
    const from=required(item.from,`connections[${index}].from`);
    const to=required(item.to,`connections[${index}].to`);
    const source=clientToCanvas.get(from),target=clientToCanvas.get(to);
    if(!source||!target)throw new TypeError('Canvas connection references an unknown step');
    const requestedKind=(item.kind??'FLOW').toUpperCase();
    const kind:CanvasRelationshipDraft['kind']=requestedKind==='CONDITION'?'CONDITIONAL_FLOW':requestedKind==='DEFAULT'?'DEFAULT_FLOW':requestedKind==='PARALLEL'?'PARALLEL_FLOW':'CONTROL_FLOW';
    const condition=item.condition?.trim();
    return{
      canvasRelationshipId:createOpaqueId('canvas',`product-canvas-relationship:${definitionId}:${item.id??index+1}`),
      kind,
      sourceEndpoint:{state:'SET',elementId:source},
      targetEndpoint:{state:'SET',elementId:target},
      ...(kind==='CONDITIONAL_FLOW'?{guard:condition?{literalText:condition,semanticState:'SET' as const}:{semanticState:'UNKNOWN' as const}}:{}),
      relationshipProperties:{},
    };
  });

  const revision=buildCanvasRevision({
    id:revisionId,canvasDefinitionId:definitionId,revisionNumber:1,createdAt:now,createdBy:initiatedBy,revisionKind:'SEMANTIC',changeSetId,
    elements,relationships,
    ...(input.presentation&&typeof input.presentation==='object'?{presentationSnapshot:input.presentation as any}:{}),
  });
  const definition:CanvasDefinition={id:definitionId,sourceOriginId,title,createdAt:now,createdBy:initiatedBy,latestRevisionId:revision.id};
  new CanvasDomainStore(repo).saveInitialCanvas(definition,revision);
  const preserved=preserveCanvasRevision(repo,definition,revision,{startedAt:now,initiatedBy});
  const attempt=adaptPreservedCanvas(repo,preserved,undefined,{now});
  if(!attempt.result||(attempt.completion?.status!=='SUCCEEDED'&&attempt.completion?.status!=='PARTIAL')){
    return{status:'SAFE_STOP_BEFORE_CANONICAL' as const,definition,revision,preserved,attempt};
  }
  const normalized=normalizeAdapterResult(repo,attempt.result.id,{normalizedAt:now});
  const validation=validateProcessRevision(normalized.processRevision,'AUTOMATION_DESIGN_READINESS',{assessedAt:now});
  persistValidationBundle(repo,validation);
  const projection=projectCanonicalProcessToBpmn({processRevision:normalized.processRevision,sourceRoute:'TALOS_CANVAS',createdAt:now,createdBy:initiatedBy,revisionNumber:1});
  repo.append({id:projection.bpmnRevision.id as OpaqueId,aggregateKind:'BpmnProcessRevision',schemaVersion:'talos-bpmn-workspace-v0.1',payload:projection.bpmnRevision,createdAt:projection.bpmnRevision.createdAt});
  return{status:'BPMN_READY_FOR_PROCESS_REVIEW' as const,definition,revision,preserved,attempt,normalized,validation,projection};
}
