import { proxyActivities, sleep } from '@temporalio/workflow';
import type { GenericCapabilityActivityInput,GenericCapabilityActivityResult,GenericWorkflowInput,GenericWorkflowResult } from './generic-contracts.ts';

type GenericActivities={executeGenericCapability(input:GenericCapabilityActivityInput):Promise<GenericCapabilityActivityResult>};

function evaluate(expression:unknown,facts:Record<string,unknown>):boolean{
  if(!expression||typeof expression!=='object')throw new TypeError('runtime condition expression must be an object');
  const x=expression as any;const fact=String(x.fact??'');const operator=String(x.operator??'');const actual=facts[fact];
  switch(operator){
    case'EQUALS':return actual===x.value;
    case'NOT_EQUALS':return actual!==x.value;
    case'EXISTS':return Object.prototype.hasOwnProperty.call(facts,fact);
    case'IN':return Array.isArray(x.value)&&x.value.includes(actual);
    case'GREATER_THAN':return typeof actual==='number'&&typeof x.value==='number'&&actual>x.value;
    case'LESS_THAN':return typeof actual==='number'&&typeof x.value==='number'&&actual<x.value;
    default:throw new TypeError(`unsupported runtime condition operator ${operator}`);
  }
}
function activityOptions(policy:any){return{startToCloseTimeout:policy.timeout.startToCloseMs,scheduleToCloseTimeout:policy.timeout.scheduleToCloseMs,retry:{initialInterval:policy.retry.initialIntervalMs,backoffCoefficient:policy.retry.backoffCoefficient,maximumInterval:policy.retry.maximumIntervalMs,maximumAttempts:policy.retry.maximumAttempts,nonRetryableErrorTypes:[...policy.retry.nonRetryableErrorTypes]}};}

export async function TalosGenericWorkflow(input:GenericWorkflowInput):Promise<GenericWorkflowResult>{
  if(!input.executionId||input.program.schemaVersion!=='talos.generic-runtime-program.v1')throw new TypeError('invalid generic workflow input/program');
  let current=input.program.graph.entryElementRef;
  const visited:string[]=[],capabilityResults:GenericCapabilityActivityResult[]=[];
  for(let step=0;step<1000;step++){
    const element=input.program.graph.elements.find(e=>e.id===current);if(!element)throw new TypeError(`runtime graph element missing ${current}`);
    visited.push(element.id);
    if(element.constructKinds.includes('DURABLE_TIMER')){
      const wait=input.program.semantics.waits.find(w=>w.executionElementRef===element.id);if(!wait)throw new TypeError(`runtime wait missing for ${element.id}`);
      const scale=wait.testOnlyTimeScale??1;
      if(scale!==1&&input.program.deploymentIntent.environmentClass!=='TEST')throw new TypeError('testOnlyTimeScale is only legal in TEST deployments');
      const effective=Math.max(0,Math.floor(wait.durationMs*scale));
      if(effective>0)await sleep(effective);
    }
    if(element.kind==='CAPABILITY_INVOCATION'){
      if(element.capabilityUseOccurrenceRefs.length!==1)throw new TypeError('generic runtime v0.1 requires exactly one capability use per invocation element');
      const useRef=element.capabilityUseOccurrenceRefs[0];const policy=input.program.activity.policies.find(p=>p.capabilityUseOccurrenceRef===useRef);if(!policy)throw new TypeError(`compiled Activity policy missing for ${useRef}`);
      const activities=proxyActivities<GenericActivities>(activityOptions(policy));
      capabilityResults.push(await activities.executeGenericCapability({executionId:input.executionId,capabilityUseOccurrenceRef:useRef,input:input.capabilityInputs?.[useRef]??null}));
    }
    const outgoing=input.program.graph.relations.filter(r=>r.sourceElementRef===element.id);
    if(outgoing.length===0){
      if(element.kind!=='COMPLETION_COORDINATION')throw new TypeError(`runtime graph terminated without completion at ${element.id}`);
      return{outcome:'COMPLETED',executionId:input.executionId,visitedElementRefs:visited,capabilityResults};
    }
    const conditional=outgoing.filter(r=>r.relationKind==='CONDITIONAL');
    let next:string|undefined;
    if(conditional.length){
      const matches=conditional.filter(r=>{if(!r.conditionRef)throw new TypeError(`conditional relation ${r.id} has no conditionRef`);const rule=input.program.semantics.conditionRules.find(x=>x.ref===r.conditionRef);if(!rule)throw new TypeError(`condition snapshot missing for ${r.conditionRef}`);return evaluate(rule.expression,input.facts);});
      if(matches.length>1)throw new TypeError(`multiple conditional branches matched at ${element.id}`);
      if(matches.length===1)next=matches[0].targetElementRef;
      else{const def=outgoing.find(r=>r.relationKind==='DEFAULT');if(def)next=def.targetElementRef;}
    }else{
      const deterministic=outgoing.filter(r=>r.relationKind==='SEQUENCE'||r.relationKind==='DEFAULT');
      if(deterministic.length!==1)throw new TypeError(`generic runtime v0.1 requires one deterministic outgoing relation at ${element.id}`);
      next=deterministic[0].targetElementRef;
    }
    if(!next)throw new TypeError(`no executable branch selected at ${element.id}`);
    current=next;
  }
  throw new TypeError('generic runtime exceeded 1000 graph steps');
}
