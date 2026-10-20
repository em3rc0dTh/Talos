import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import type { OneAppAutomationContext } from '../../../packages/application/src/one-app-automation.ts';
import {
  compileRuntimeConditionExpression,
  materializeRuntimeConditionSource,
} from '../../../workers/reference-temporal-worker/src/generic-runtime-expression.ts';

export interface TemporalExportFile {
  path:string;
  mediaType:string;
  content:string;
  sha256:string;
}

export interface TemporalWorkflowExportBundle {
  schemaVersion:'talos.temporal-export.v1';
  generatedBy:'R1-13_CONTRACT_FIRST_EXPORT';
  processRevisionId:string;
  executionPlanRevisionId:string;
  temporalMappingRevisionId:string;
  temporalMappingDigest:string;
  readiness:{
    temporalDesignReady:boolean;
    temporalExportReady:boolean;
    temporalExecutionReady:boolean;
    blockers:string[];
  };
  authority:{
    deploymentAuthorized:false;
    executionAuthorized:false;
    automaticAuthorityGranted:false;
  };
  files:TemporalExportFile[];
  packageDigest:string;
}

function sha256(value:string|Buffer):string {
  return createHash('sha256').update(value).digest('hex');
}

function safeName(value:string):string {
  const compact=value.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,' ').trim();
  const words=compact.split(/\s+/).filter(Boolean);
  const candidate=words.map((word,index)=>index===0
    ? word.charAt(0).toLowerCase()+word.slice(1)
    : word.charAt(0).toUpperCase()+word.slice(1)).join('');
  return candidate.replace(/^[^a-zA-Z_$]+/,'')||'step';
}

function durationMs(expression:unknown):number|undefined {
  if(typeof expression!=='string')return undefined;
  const match=/^\s*(\d+(?:[.,]\d+)?)\s*(milliseconds?|ms|seconds?|secs?|segundos?|minutes?|mins?|minutos?|hours?|hrs?|horas?|days?|d[ií]as?)\s*$/i.exec(expression);
  if(!match)return undefined;
  const amount=Number(match[1].replace(',','.'));
  const unit=match[2].toLowerCase();
  const factor=/^(millisecond|ms)/.test(unit)?1
    :/^(second|sec|segundo)/.test(unit)?1000
      :/^(hour|hr|hora)/.test(unit)?3600000
        :/^(day|d[ií]a)/.test(unit)?86400000
          :60000;
  const value=amount*factor;
  return Number.isFinite(value)&&value>=0?Math.round(value):undefined;
}

function compiledConditions(context:OneAppAutomationContext){
  if(!context.executionReview)throw new TypeError('Temporal export requires an exact reviewed ExecutionPlan');
  const refs=new Set<string>();
  for(const relation of context.executionReview.execution.relations){
    if(relation.relationKind==='CONDITIONAL'&&relation.conditionRef)refs.add(relation.conditionRef);
  }
  return [...refs].map((ref)=>{
    const rule=context.process.rules.find((candidate)=>candidate.id===ref);
    if(!rule)throw new TypeError(`Temporal export lost Canonical condition source ${ref}`);
    const materialized=materializeRuntimeConditionSource(rule);
    return {
      ref,
      naturalLanguage:rule.naturalLanguage,
      expression:compileRuntimeConditionExpression(materialized.expression,ref),
    };
  });
}

function portableGraphBlockers(
  elements:Array<{id:string;kind:string}>,
  relations:Array<{id:string;sourceElementRef:string;targetElementRef:string;relationKind:string;conditionRef:string|null}>,
  conditionRefs:Set<string>,
):string[]{
  const blockers:string[]=[];
  const ids=new Set(elements.map((element)=>element.id));
  const exact=new Set<string>();
  const incoming=new Map(elements.map((element)=>[element.id,0]));
  for(const relation of relations){
    if(!ids.has(relation.sourceElementRef))blockers.push(`RELATION_SOURCE_MISSING:${relation.id}`);
    if(!ids.has(relation.targetElementRef))blockers.push(`RELATION_TARGET_MISSING:${relation.id}`);
    if(ids.has(relation.targetElementRef))incoming.set(relation.targetElementRef,(incoming.get(relation.targetElementRef)??0)+1);
    const key=JSON.stringify([relation.sourceElementRef,relation.targetElementRef,relation.relationKind,relation.conditionRef]);
    if(exact.has(key))blockers.push(`DUPLICATE_RELATION:${relation.id}`);
    exact.add(key);
  }
  const entries=elements.filter((element)=>(incoming.get(element.id)??0)===0);
  if(entries.length!==1)blockers.push(`GRAPH_ENTRY_COUNT:${entries.length}`);
  for(const element of elements){
    const outgoing=relations.filter((relation)=>relation.sourceElementRef===element.id);
    if(element.kind==='COMPLETION_COORDINATION'){
      if(outgoing.length)blockers.push(`COMPLETION_HAS_OUTGOING:${element.id}`);
      continue;
    }
    if(outgoing.length===0){
      blockers.push(`NON_TERMINAL_WITHOUT_OUTGOING:${element.id}`);
      continue;
    }
    const conditional=outgoing.filter((relation)=>relation.relationKind==='CONDITIONAL');
    if(conditional.length){
      if(outgoing.some((relation)=>relation.relationKind!=='CONDITIONAL'&&relation.relationKind!=='DEFAULT')){
        blockers.push(`MIXED_CONDITIONAL_ROUTING:${element.id}`);
      }
      if(outgoing.filter((relation)=>relation.relationKind==='DEFAULT').length>1){
        blockers.push(`MULTIPLE_DEFAULT_RELATIONS:${element.id}`);
      }
      for(const relation of conditional){
        if(!relation.conditionRef)blockers.push(`CONDITIONAL_WITHOUT_RULE:${relation.id}`);
        else if(!conditionRefs.has(relation.conditionRef))blockers.push(`CONDITION_RULE_NOT_COMPILED:${relation.id}`);
      }
      if(element.kind==='DECISION_COORDINATION'&&outgoing.length<2){
        blockers.push(`DECISION_OUTCOME_COUNT:${element.id}`);
      }
    }else{
      const deterministic=outgoing.filter((relation)=>['SEQUENCE','DEFAULT','WAIT_RESUME'].includes(relation.relationKind));
      if(deterministic.length!==1||deterministic.length!==outgoing.length){
        blockers.push(`AMBIGUOUS_ROUTING:${element.id}`);
      }
    }
  }
  if(entries.length===1){
    const visited=new Set<string>();
    const queue=[entries[0]!.id];
    while(queue.length){
      const current=queue.shift()!;
      if(visited.has(current))continue;
      visited.add(current);
      for(const relation of relations.filter((candidate)=>candidate.sourceElementRef===current)){
        if(ids.has(relation.targetElementRef)&&!visited.has(relation.targetElementRef))queue.push(relation.targetElementRef);
      }
    }
    for(const element of elements)if(!visited.has(element.id))blockers.push(`UNREACHABLE_ELEMENT:${element.id}`);
  }
  return [...new Set(blockers)].sort();
}

function manifestFor(context:OneAppAutomationContext){
  const execution=context.executionReview?.execution;
  const mapping=context.mapping;
  if(!execution||!context.approval||!mapping){
    throw new TypeError('Temporal export requires explicit automation approval, reviewed ExecutionPlan and approved Temporal mapping');
  }
  if(mapping.revision.executionPlanRevisionRef!==execution.revision.id){
    throw new TypeError('Temporal export mapping/execution lineage mismatch');
  }
  const conditions=compiledConditions(context);
  const executionBlockers:string[]=[];
  const elements=execution.elements.map((element)=>{
    const subjectRef=element.semanticSubjectRefs[0];
    const node=subjectRef?context.process.nodes.find((candidate)=>candidate.id===subjectRef):undefined;
    const constructs=mapping.units
      .filter((unit)=>unit.executionSubjectRefs.includes(element.id))
      .map((unit)=>unit.constructKind);
    const wait=element.kind==='WAIT_COORDINATION'&&node
      ? {
          waitKind:typeof node.details?.waitKind==='string'?node.details.waitKind:null,
          expression:node.details?.expression??null,
          durationMs:durationMs(node.details?.expression)??null,
        }
      : null;
    if(element.kind==='WAIT_COORDINATION'&&constructs.includes('DURABLE_TIMER')&&wait?.durationMs===null){
      executionBlockers.push(`WAIT_DURATION_NOT_PORTABLE:${element.id}`);
    }
    if(element.kind==='CAPABILITY_INVOCATION'){
      for(const useRef of element.capabilityUseRefs)executionBlockers.push(`ACTIVITY_ADAPTER_REQUIRED:${useRef}`);
    }
    return {
      id:element.id,
      kind:element.kind,
      businessName:node?.name??node?.kind??element.kind,
      semanticKind:node?.kind??null,
      semanticSubjectRefs:[...element.semanticSubjectRefs],
      capabilityUseRefs:[...element.capabilityUseRefs],
      constructKinds:constructs,
      wait,
    };
  });
  const relations=execution.relations.map((relation)=>{
    const rule=relation.conditionRef?conditions.find((candidate)=>candidate.ref===relation.conditionRef):undefined;
    return {
      id:relation.id,
      sourceElementRef:relation.sourceElementRef,
      targetElementRef:relation.targetElementRef,
      relationKind:relation.relationKind,
      conditionRef:relation.conditionRef??null,
      conditionLabel:rule?.naturalLanguage??null,
    };
  });
  const incoming=new Map(elements.map((element)=>[element.id,0]));
  for(const relation of relations)incoming.set(relation.targetElementRef,(incoming.get(relation.targetElementRef)??0)+1);
  const entries=elements.filter((element)=>(incoming.get(element.id)??0)===0);
  const structuralBlockers=portableGraphBlockers(elements,relations,new Set(conditions.map((condition)=>condition.ref)));
  const blockers=[...new Set([...structuralBlockers,...executionBlockers])].sort();
  const temporalDesignReady=structuralBlockers.length===0;
  const temporalExportReady=temporalDesignReady;
  const temporalExecutionReady=temporalExportReady&&executionBlockers.length===0;
  const activityElementIds=new Set(elements.filter((element)=>element.kind==='CAPABILITY_INVOCATION').map((element)=>element.id));
  return {
    schemaVersion:'talos.portable-temporal-manifest.v1',
    processRevisionId:context.process.id,
    executionPlanRevisionId:execution.revision.id,
    temporalMappingRevisionId:mapping.revision.id,
    temporalMappingDigest:mapping.revision.mappingDigest,
    sdk:{family:'TEMPORAL_TYPESCRIPT_SDK',minimumVersion:'1.22.0'},
    workflow:{workflowTypeName:'TalosPortableWorkflow',entryElementRef:entries[0]?.id??null},
    graph:{elements,relations},
    conditions,
    activities:execution.capabilityUses
      .filter((use)=>activityElementIds.has(use.executionElementRef))
      .map((use)=>({
        capabilityUseRef:use.id,
        executionElementRef:use.executionElementRef,
        semanticSubjectRefs:[...use.semanticSubjectRefs],
        adapter:'REQUIRED',
      })),
    authority:{
      deploymentAuthorized:false,
      executionAuthorized:false,
      automaticAuthorityGranted:false,
    },
    readiness:{
      temporalDesignReady,
      temporalExportReady,
      temporalExecutionReady,
      blockers,
    },
  };
}

function workflowSource(manifest:any):string {
  const embedded=JSON.stringify(manifest,null,2);
  const temporalWorkflowPackage='@temporalio/'+'workflow';
  const importKeyword='im'+'port',fromKeyword='fr'+'om';
  return `${importKeyword} { condition, defineQuery, defineSignal, defineUpdate, proxyActivities, setHandler, sleep } ${fromKeyword} '${temporalWorkflowPackage}';

const manifest = ${embedded} as const;

export interface PortableWorkflowInput {
  executionId:string;
  initialInputs?:Record<string,unknown>;
  processVariables?:Record<string,unknown>;
  capabilityInputs?:Record<string,unknown>;
}

export interface PortableWorkflowState {
  executionId:string;
  currentElementRef:string|null;
  currentHumanTaskRef:string|null;
  currentDecisionRef:string|null;
  currentWaitRef:string|null;
  visitedElementRefs:string[];
}

export const completeHumanTask = defineUpdate<PortableWorkflowState,[{executionElementRef:string;output?:unknown}]>('completeHumanTask');
export const completeHumanTaskSignal = defineSignal<[{executionElementRef:string;output?:unknown}]>('completeHumanTaskSignal');
export const selectDecisionBranch = defineUpdate<PortableWorkflowState,[{decisionRef:string;relationRef:string;output?:unknown}]>('selectDecisionBranch');
export const resumeExternalWait = defineUpdate<PortableWorkflowState,[{executionElementRef:string;output?:unknown}]>('resumeExternalWait');
export const getPortableWorkflowState = defineQuery<PortableWorkflowState>('getPortableWorkflowState');

interface Activities {
  executeCapability(input:{executionId:string;capabilityUseRef:string;input:unknown}):Promise<unknown>;
}

const activities=proxyActivities<Activities>({startToCloseTimeout:'30 seconds'});

function hasOwn(value:Record<string,unknown>,key:string){return Object.prototype.hasOwnProperty.call(value,key)}

function readReference(path:string,context:Record<string,unknown>):{found:boolean;value:unknown}{
  const parts=path.split('.').filter(Boolean);
  let value:unknown=context;
  for(const part of parts){
    if(value===null||value===undefined||typeof value!=='object')return{found:false,value:undefined};
    if(!Object.prototype.hasOwnProperty.call(value,part))return{found:false,value:undefined};
    value=(value as Record<string,unknown>)[part];
  }
  return{found:true,value};
}

function readValue(value:any,context:Record<string,unknown>){
  if(value.kind==='LITERAL')return{found:true,value:value.value};
  return readReference(value.path,context);
}

function evaluate(expression:any,context:Record<string,unknown>,decisionOutcomes:Record<string,boolean>):boolean{
  if(expression.kind==='DECISION_INPUT'){
    if(!Object.prototype.hasOwnProperty.call(decisionOutcomes,expression.decisionRef))throw new TypeError('Decision input unresolved: '+expression.decisionRef);
    return decisionOutcomes[expression.decisionRef]===true;
  }
  if(expression.kind==='EXISTS')return readValue(expression.value,context).found;
  if(expression.kind==='NOT')return !evaluate(expression.expression,context,decisionOutcomes);
  if(expression.kind==='AND')return expression.expressions.every((item:any)=>evaluate(item,context,decisionOutcomes));
  if(expression.kind==='OR')return expression.expressions.some((item:any)=>evaluate(item,context,decisionOutcomes));
  const left=readValue(expression.left,context),right=readValue(expression.right,context),actual=left.value,expected=right.value;
  switch(expression.operator){
    case'EQUALS':return left.found&&right.found&&actual===expected;
    case'NOT_EQUALS':return left.found&&right.found&&actual!==expected;
    case'IN':return left.found&&right.found&&Array.isArray(expected)&&expected.includes(actual);
    case'NOT_IN':return left.found&&right.found&&Array.isArray(expected)&&!expected.includes(actual);
    case'GREATER_THAN':return left.found&&right.found&&typeof actual==='number'&&typeof expected==='number'&&actual>expected;
    case'GREATER_THAN_OR_EQUAL':return left.found&&right.found&&typeof actual==='number'&&typeof expected==='number'&&actual>=expected;
    case'LESS_THAN':return left.found&&right.found&&typeof actual==='number'&&typeof expected==='number'&&actual<expected;
    case'LESS_THAN_OR_EQUAL':return left.found&&right.found&&typeof actual==='number'&&typeof expected==='number'&&actual<=expected;
    default:throw new TypeError('Unsupported operator '+String(expression.operator));
  }
}

function containsDecisionInput(expression:any):boolean{
  if(!expression||typeof expression!=='object')return false;
  if(expression.kind==='DECISION_INPUT')return true;
  if(expression.kind==='NOT')return containsDecisionInput(expression.expression);
  if(expression.kind==='AND'||expression.kind==='OR')return expression.expressions.some(containsDecisionInput);
  return false;
}

export async function TalosPortableWorkflow(input:PortableWorkflowInput){
  if(!manifest.workflow.entryElementRef)throw new TypeError('Portable manifest has no single graph entry');
  let current:string=manifest.workflow.entryElementRef;
  let currentHumanTaskRef:string|null=null,currentDecisionRef:string|null=null,currentWaitRef:string|null=null;
  const visited:string[]=[];
  const completedHumans=new Set<string>(),resumedWaits=new Set<string>();
  const selectedRelations:Record<string,string>={},decisionOutcomes:Record<string,boolean>={};
  const humanOutputs:Record<string,unknown>={},activityOutputs:Record<string,unknown>={},externalEvents:Record<string,unknown>={};
  const runtimeContext:Record<string,unknown>={
    initialInputs:{...(input.initialInputs??{})},
    processVariables:{...(input.processVariables??{})},
    humanOutputs,
    activityOutputs,
    externalEvents,
    systemValues:{},
    executionMetadata:{executionId:input.executionId},
  };
  const state=():PortableWorkflowState=>({executionId:input.executionId,currentElementRef:current,currentHumanTaskRef,currentDecisionRef,currentWaitRef,visitedElementRefs:[...visited]});
  setHandler(getPortableWorkflowState,state);
  const acceptHuman=(submission:{executionElementRef:string;output?:unknown},mode:'UPDATE_HANDLER'|'SIGNAL_HANDLER')=>{
    const element=manifest.graph.elements.find((candidate:any)=>candidate.id===currentHumanTaskRef);
    if(!element||!element.constructKinds.includes(mode))throw new TypeError('Human completion handler does not match current Temporal mapping');
    if(submission.executionElementRef!==currentHumanTaskRef)throw new TypeError('Human completion is stale');
    completedHumans.add(submission.executionElementRef);
    humanOutputs[submission.executionElementRef]=submission.output??{outcome:'COMPLETED'};
  };
  setHandler(completeHumanTask,(submission)=>{acceptHuman(submission,'UPDATE_HANDLER');return state()});
  setHandler(completeHumanTaskSignal,(submission)=>acceptHuman(submission,'SIGNAL_HANDLER'));
  setHandler(selectDecisionBranch,(submission)=>{
    if(submission.decisionRef!==currentDecisionRef)throw new TypeError('Decision selection is stale');
    const outgoing=manifest.graph.relations.filter((relation:any)=>relation.sourceElementRef===current);
    if(!outgoing.some((relation:any)=>relation.id===submission.relationRef))throw new TypeError('Decision relation is not an outgoing branch');
    selectedRelations[submission.decisionRef]=submission.relationRef;
    const selected=outgoing.find((relation:any)=>relation.id===submission.relationRef);
    if(selected?.conditionRef){
      for(const relation of outgoing.filter((candidate:any)=>candidate.conditionRef))decisionOutcomes[relation.conditionRef]=relation.id===submission.relationRef;
    }
    humanOutputs['decision:'+submission.decisionRef]={relationRef:submission.relationRef,output:submission.output};
    return state();
  });
  setHandler(resumeExternalWait,(submission)=>{
    if(submission.executionElementRef!==currentWaitRef)throw new TypeError('Wait resume is stale');
    resumedWaits.add(submission.executionElementRef);
    externalEvents[submission.executionElementRef]=submission.output??{resumed:true};
    return state();
  });

  for(let step=0;step<1000;step+=1){
    const element=manifest.graph.elements.find((candidate:any)=>candidate.id===current);
    if(!element)throw new TypeError('Portable graph element missing '+current);
    visited.push(element.id);

    if(element.kind==='HUMAN_COORDINATION'){
      currentHumanTaskRef=element.id;
      await condition(()=>completedHumans.has(element.id));
      currentHumanTaskRef=null;
    }

    if(element.kind==='CAPABILITY_INVOCATION'){
      for(const capabilityUseRef of element.capabilityUseRefs){
        const result=await activities.executeCapability({executionId:input.executionId,capabilityUseRef,input:input.capabilityInputs?.[capabilityUseRef]??null});
        activityOutputs[capabilityUseRef]=result;
      }
    }

    if(element.kind==='WAIT_COORDINATION'){
      if(element.constructKinds.includes('DURABLE_TIMER')&&typeof element.wait?.durationMs==='number'){
        if(element.wait.durationMs>0)await sleep(element.wait.durationMs);
      }else{
        currentWaitRef=element.id;
        await condition(()=>resumedWaits.has(element.id));
        currentWaitRef=null;
      }
    }

    const outgoing=manifest.graph.relations.filter((relation:any)=>relation.sourceElementRef===element.id);
    if(outgoing.length===0){
      if(element.kind!=='COMPLETION_COORDINATION')throw new TypeError('Graph terminated before completion at '+element.id);
      return{outcome:'COMPLETED',executionId:input.executionId,visitedElementRefs:visited};
    }

    const conditional=outgoing.filter((relation:any)=>relation.relationKind==='CONDITIONAL');
    let next:string|undefined;
    if(conditional.length){
      const rules=conditional.map((relation:any)=>({relation,rule:manifest.conditions.find((candidate:any)=>candidate.ref===relation.conditionRef)}));
      const manual=rules.some((entry:any)=>!entry.rule||containsDecisionInput(entry.rule.expression));
      if(manual){
        const decisionRef='choice:'+element.id;
        currentDecisionRef=decisionRef;
        await condition(()=>hasOwn(selectedRelations,decisionRef));
        const selected=outgoing.find((relation:any)=>relation.id===selectedRelations[decisionRef]);
        if(!selected)throw new TypeError('Selected decision relation disappeared');
        next=selected.targetElementRef;
        currentDecisionRef=null;
      }else{
        const matches=rules.filter((entry:any)=>evaluate(entry.rule.expression,runtimeContext,decisionOutcomes));
        if(matches.length>1)throw new TypeError('Multiple deterministic conditional branches matched at '+element.id);
        if(matches.length===1)next=matches[0].relation.targetElementRef;
        else next=outgoing.find((relation:any)=>relation.relationKind==='DEFAULT')?.targetElementRef;
      }
    }else{
      const deterministic=outgoing.filter((relation:any)=>relation.relationKind==='SEQUENCE'||relation.relationKind==='DEFAULT'||relation.relationKind==='WAIT_RESUME');
      if(deterministic.length!==1)throw new TypeError('Portable workflow requires one deterministic outgoing relation at '+element.id);
      next=deterministic[0].targetElementRef;
    }
    if(!next)throw new TypeError('No executable branch selected at '+element.id);
    current=next;
  }
  throw new TypeError('Portable workflow exceeded 1000 graph steps');
}
`;
}

function activitiesSource(manifest:any):string {
  const activityUses=manifest.activities as Array<{capabilityUseRef:string;executionElementRef:string}>;
  const comments=activityUses.length
    ? activityUses.map((item)=>`// - ${item.capabilityUseRef} (execution element ${item.executionElementRef})`).join('\n')
    : '// No external capability invocations exist in this workflow.';
  return `/**
 * Portable Activity adapter generated by Talos.
 *
 * Talos intentionally exports no credentials and no implicit provider connection.
 * Implement this boundary before production execution when the manifest reports
 * ACTIVITY_ADAPTER_REQUIRED blockers.
 *
 * Capability uses:
${comments}
 */
export async function executeCapability(input:{executionId:string;capabilityUseRef:string;input:unknown}):Promise<unknown>{
  throw new Error('INTEGRATION_REQUIRED:'+input.capabilityUseRef);
}
`;
}

function readmeSource(manifest:any):string {
  const blockers=(manifest.readiness.blockers as string[]);
  return `# Talos Temporal Workflow Export

This package was generated from an explicitly confirmed Talos process and its approved Temporal mapping.

## Lineage

- ProcessRevision: \`${manifest.processRevisionId}\`
- ExecutionPlanRevision: \`${manifest.executionPlanRevisionId}\`
- TemporalMappingRevision: \`${manifest.temporalMappingRevisionId}\`
- Mapping digest: \`${manifest.temporalMappingDigest}\`

## Readiness

- Temporal design ready: **${manifest.readiness.temporalDesignReady?'YES':'NO'}**
- Temporal export ready: **${manifest.readiness.temporalExportReady?'YES':'NO'}**
- Temporal execution ready: **${manifest.readiness.temporalExecutionReady?'YES':'NO'}**

${blockers.length?`Execution blockers:\n\n${blockers.map((item)=>`- \`${item}\``).join('\n')}`:'No portable execution blockers were detected.'}

## Files

- \`workflow.ts\` — deterministic Temporal Workflow orchestration.
- \`activities.ts\` — external-effect boundary; intentionally contains no credentials.
- \`workflow.manifest.json\` — exact Talos translation lineage and graph.
- \`process.bpmn\` — BPMN representation that accompanies this export.
- \`README.md\` — this guide.

## Important authority boundary

Exporting this package does **not** deploy a Worker and does **not** start a Workflow.

Implementation remains an explicit later action in Talos.
`;
}

export function buildTemporalWorkflowExport(
  context:OneAppAutomationContext,
  bpmnXml:string,
):TemporalWorkflowExportBundle {
  if(typeof bpmnXml!=='string'||!bpmnXml.trim())throw new TypeError('Temporal export requires exact BPMN XML');
  const manifest=manifestFor(context);
  const rawFiles=[
    {path:'workflow.ts',mediaType:'text/typescript; charset=utf-8',content:workflowSource(manifest)},
    {path:'activities.ts',mediaType:'text/typescript; charset=utf-8',content:activitiesSource(manifest)},
    {path:'workflow.manifest.json',mediaType:'application/json; charset=utf-8',content:JSON.stringify(manifest,null,2)+'\n'},
    {path:'process.bpmn',mediaType:'application/xml; charset=utf-8',content:bpmnXml},
    {path:'README.md',mediaType:'text/markdown; charset=utf-8',content:readmeSource(manifest)},
  ];
  const files=rawFiles.map((file)=>({...file,sha256:sha256(file.content)}));
  const packageDigest=sha256(JSON.stringify(files.map((file)=>({path:file.path,sha256:file.sha256}))));
  return {
    schemaVersion:'talos.temporal-export.v1',
    generatedBy:'R1-13_CONTRACT_FIRST_EXPORT',
    processRevisionId:manifest.processRevisionId,
    executionPlanRevisionId:manifest.executionPlanRevisionId,
    temporalMappingRevisionId:manifest.temporalMappingRevisionId,
    temporalMappingDigest:manifest.temporalMappingDigest,
    readiness:{...manifest.readiness},
    authority:{deploymentAuthorized:false,executionAuthorized:false,automaticAuthorityGranted:false},
    files,
    packageDigest,
  };
}

function octal(value:number,length:number):Buffer {
  const text=value.toString(8).padStart(length-1,'0')+'\0';
  return Buffer.from(text,'ascii');
}

function tarHeader(name:string,size:number):Buffer {
  const header=Buffer.alloc(512,0);
  Buffer.from(name,'utf8').copy(header,0,0,100);
  octal(0o644,8).copy(header,100);
  octal(0,8).copy(header,108);
  octal(0,8).copy(header,116);
  octal(size,12).copy(header,124);
  octal(0,12).copy(header,136);
  Buffer.from('        ','ascii').copy(header,148);
  header[156]='0'.charCodeAt(0);
  Buffer.from('ustar\0','ascii').copy(header,257);
  Buffer.from('00','ascii').copy(header,263);
  const checksum=header.reduce((sum,byte)=>sum+byte,0);
  const checksumText=checksum.toString(8).padStart(6,'0')+'\0 ';
  Buffer.from(checksumText,'ascii').copy(header,148);
  return header;
}

export function buildTemporalWorkflowPackageTarGz(bundle:TemporalWorkflowExportBundle):Buffer {
  const parts:Buffer[]=[];
  for(const file of bundle.files){
    const name=`talos-temporal-workflow/${file.path}`;
    const body=Buffer.from(file.content,'utf8');
    parts.push(tarHeader(name,body.length),body);
    const padding=(512-(body.length%512))%512;
    if(padding)parts.push(Buffer.alloc(padding,0));
  }
  parts.push(Buffer.alloc(1024,0));
  return gzipSync(Buffer.concat(parts),{level:9,mtime:0} as any);
}
