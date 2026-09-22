import { condition, defineQuery, defineUpdate, proxyActivities, setHandler, sleep } from '@temporalio/workflow';
import type {
  GenericCapabilityActivityInput,
  GenericCapabilityActivityResult,
  GenericDecisionSubmission,
  GenericHumanTaskSubmission,
  GenericRuntimeConditionExpression,
  GenericRuntimeContext,
  GenericRuntimeValue,
  GenericWorkflowInput,
  GenericWorkflowResult,
  GenericWorkflowState,
} from './generic-contracts.ts';

type GenericActivities={executeGenericCapability(input:GenericCapabilityActivityInput):Promise<GenericCapabilityActivityResult>};
export const completeGenericHumanTask = defineUpdate<GenericWorkflowState,[GenericHumanTaskSubmission]>('completeGenericHumanTask');
export const resolveGenericDecision = defineUpdate<GenericWorkflowState,[GenericDecisionSubmission]>('resolveGenericDecision');
export const getGenericWorkflowState = defineQuery<GenericWorkflowState>('getGenericWorkflowState');

function runtimeContext(input:GenericWorkflowInput):GenericRuntimeContext{
  const supplied=input.runtimeContext;
  return{
    initialInputs:{...(supplied?.initialInputs??{}),...(input.facts??{})},
    processVariables:{...(supplied?.processVariables??{})},
    humanOutputs:{...(supplied?.humanOutputs??{})},
    activityOutputs:{...(supplied?.activityOutputs??{})},
    externalEvents:{...(supplied?.externalEvents??{})},
    systemValues:{...(supplied?.systemValues??{})},
    executionMetadata:{...(supplied?.executionMetadata??{}),executionId:input.executionId},
  };
}

function readReference(path:string,context:GenericRuntimeContext):{found:boolean;value:unknown}{
  const parts=path.split('.').filter(Boolean);
  let value:unknown=context;
  for(const part of parts){
    if(value===null||value===undefined||typeof value!=='object')return{found:false,value:undefined};
    if(!Object.prototype.hasOwnProperty.call(value,part))return{found:false,value:undefined};
    value=(value as Record<string,unknown>)[part];
  }
  return{found:true,value};
}

function readValue(value:GenericRuntimeValue,context:GenericRuntimeContext):{found:boolean;value:unknown}{
  if(value.kind==='LITERAL')return{found:true,value:value.value};
  return readReference(value.path,context);
}

function evaluate(
  expression:GenericRuntimeConditionExpression,
  context:GenericRuntimeContext,
  decisionOutcomes:Record<string,boolean>,
):boolean{
  if(expression.kind==='DECISION_INPUT'){
    if(!Object.prototype.hasOwnProperty.call(decisionOutcomes,expression.decisionRef)){
      throw new TypeError(`runtime decision input missing ${expression.decisionRef}`);
    }
    return decisionOutcomes[expression.decisionRef]===true;
  }
  if(expression.kind==='EXISTS')return readValue(expression.value,context).found;
  if(expression.kind==='NOT')return!evaluate(expression.expression,context,decisionOutcomes);
  if(expression.kind==='AND')return expression.expressions.every(item=>evaluate(item,context,decisionOutcomes));
  if(expression.kind==='OR')return expression.expressions.some(item=>evaluate(item,context,decisionOutcomes));

  const left=readValue(expression.left,context);
  const right=readValue(expression.right,context);
  const actual=left.value;
  const expected=right.value;
  switch(expression.operator){
    case'EQUALS':return left.found&&right.found&&actual===expected;
    case'NOT_EQUALS':return left.found&&right.found&&actual!==expected;
    case'IN':return left.found&&right.found&&Array.isArray(expected)&&expected.includes(actual);
    case'NOT_IN':return left.found&&right.found&&Array.isArray(expected)&&!expected.includes(actual);
    case'GREATER_THAN':return left.found&&right.found&&typeof actual==='number'&&typeof expected==='number'&&actual>expected;
    case'GREATER_THAN_OR_EQUAL':return left.found&&right.found&&typeof actual==='number'&&typeof expected==='number'&&actual>=expected;
    case'LESS_THAN':return left.found&&right.found&&typeof actual==='number'&&typeof expected==='number'&&actual<expected;
    case'LESS_THAN_OR_EQUAL':return left.found&&right.found&&typeof actual==='number'&&typeof expected==='number'&&actual<=expected;
  }
}

function missingDecision(
  expression:GenericRuntimeConditionExpression,
  context:GenericRuntimeContext,
  decisionOutcomes:Record<string,boolean>,
):{decisionRef:string;prompt:string}|null{
  if(expression.kind==='DECISION_INPUT'){
    return Object.prototype.hasOwnProperty.call(decisionOutcomes,expression.decisionRef)
      ? null
      : {decisionRef:expression.decisionRef,prompt:expression.prompt};
  }
  if(expression.kind==='COMPARE'||expression.kind==='EXISTS')return null;
  if(expression.kind==='NOT')return missingDecision(expression.expression,context,decisionOutcomes);
  if(expression.kind==='AND'){
    for(const item of expression.expressions){
      const missing=missingDecision(item,context,decisionOutcomes);
      if(missing)return missing;
      if(!evaluate(item,context,decisionOutcomes))return null;
    }
    return null;
  }
  for(const item of expression.expressions){
    const missing=missingDecision(item,context,decisionOutcomes);
    if(missing)return missing;
    if(evaluate(item,context,decisionOutcomes))return null;
  }
  return null;
}

function activityOptions(policy:any){return{startToCloseTimeout:policy.timeout.startToCloseMs,scheduleToCloseTimeout:policy.timeout.scheduleToCloseMs,retry:{initialInterval:policy.retry.initialIntervalMs,backoffCoefficient:policy.retry.backoffCoefficient,maximumInterval:policy.retry.maximumIntervalMs,maximumAttempts:policy.retry.maximumAttempts,nonRetryableErrorTypes:[...policy.retry.nonRetryableErrorTypes]}};}

export async function TalosGenericWorkflow(input:GenericWorkflowInput):Promise<GenericWorkflowResult>{
  if(!input.executionId||input.program.schemaVersion!=='talos.generic-runtime-program.v1')throw new TypeError('invalid generic workflow input/program');
  let current=input.program.graph.entryElementRef;
  let currentHumanTaskRef:string|null=null;
  let currentDecisionRef:string|null=null;
  let currentDecisionPrompt:string|null=null;
  const context=runtimeContext(input);
  const visited:string[]=[],capabilityResults:GenericCapabilityActivityResult[]=[];
  const completedHumanTaskRefs:string[]=[];
  const decisionOutcomes:Record<string,boolean>={};
  const state=():GenericWorkflowState=>({
    executionId:input.executionId,
    currentElementRef:current,
    currentHumanTaskRef,
    currentDecisionRef,
    currentDecisionPrompt,
    visitedElementRefs:[...visited],
    completedHumanTaskRefs:[...completedHumanTaskRefs],
    decisionOutcomes:{...decisionOutcomes},
  });
  setHandler(getGenericWorkflowState,()=>state());
  setHandler(
    completeGenericHumanTask,
    (submission)=>{
      if(submission.executionElementRef!==currentHumanTaskRef)throw new TypeError('generic human task update must target the exact current human task');
      if(submission.outcome!=='COMPLETED')throw new TypeError('generic human task v0.1 accepts only COMPLETED');
      if(!completedHumanTaskRefs.includes(submission.executionElementRef))completedHumanTaskRefs.push(submission.executionElementRef);
      context.humanOutputs[submission.executionElementRef]={
        outcome:submission.outcome,
        ...(submission.output!==undefined?{output:submission.output}:{}),
      };
      return state();
    },
    {validator:(submission)=>{
      if(!currentHumanTaskRef)throw new TypeError('generic workflow is not waiting on a human task');
      if(submission.executionElementRef!==currentHumanTaskRef)throw new TypeError('generic human task update is stale or targets another step');
      if(submission.outcome!=='COMPLETED')throw new TypeError('generic human task v0.1 accepts only COMPLETED');
    }},
  );
  setHandler(
    resolveGenericDecision,
    (submission)=>{
      if(submission.decisionRef!==currentDecisionRef)throw new TypeError('generic decision update must target the exact current runtime decision');
      decisionOutcomes[submission.decisionRef]=submission.applies;
      context.humanOutputs[`decision:${submission.decisionRef}`]={
        applies:submission.applies,
        ...(submission.output!==undefined?{output:submission.output}:{}),
      };
      return state();
    },
    {validator:(submission)=>{
      if(!currentDecisionRef)throw new TypeError('generic workflow is not waiting on a runtime business decision');
      if(submission.decisionRef!==currentDecisionRef)throw new TypeError('generic decision update is stale or targets another condition');
      if(typeof submission.applies!=='boolean')throw new TypeError('generic decision update requires a boolean applies outcome');
    }},
  );
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
    if(element.kind==='HUMAN_COORDINATION'&&element.constructKinds.includes('UPDATE_HANDLER')){
      currentHumanTaskRef=element.id;
      await condition(()=>completedHumanTaskRefs.includes(element.id));
      currentHumanTaskRef=null;
    }
    if(element.kind==='CAPABILITY_INVOCATION'){
      if(element.capabilityUseOccurrenceRefs.length!==1)throw new TypeError('generic runtime v0.1 requires exactly one capability use per invocation element');
      const useRef=element.capabilityUseOccurrenceRefs[0];const policy=input.program.activity.policies.find(p=>p.capabilityUseOccurrenceRef===useRef);if(!policy)throw new TypeError(`compiled Activity policy missing for ${useRef}`);
      const activities=proxyActivities<GenericActivities>(activityOptions(policy));
      const result=await activities.executeGenericCapability({executionId:input.executionId,capabilityUseOccurrenceRef:useRef,input:input.capabilityInputs?.[useRef]??null});
      capabilityResults.push(result);
      context.activityOutputs[useRef]=result;
    }
    const outgoing=input.program.graph.relations.filter(r=>r.sourceElementRef===element.id);
    if(outgoing.length===0){
      if(element.kind!=='COMPLETION_COORDINATION')throw new TypeError(`runtime graph terminated without completion at ${element.id}`);
      return{outcome:'COMPLETED',executionId:input.executionId,visitedElementRefs:visited,capabilityResults,completedHumanTaskRefs,decisionOutcomes:{...decisionOutcomes}};
    }
    const conditional=outgoing.filter(r=>r.relationKind==='CONDITIONAL');
    let next:string|undefined;
    if(conditional.length){
      for(const relation of conditional){
        if(!relation.conditionRef)throw new TypeError(`conditional relation ${relation.id} has no conditionRef`);
        const rule=input.program.semantics.conditionRules.find(x=>x.ref===relation.conditionRef);
        if(!rule)throw new TypeError(`condition snapshot missing for ${relation.conditionRef}`);
        let unresolved=missingDecision(rule.expression,context,decisionOutcomes);
        while(unresolved){
          currentDecisionRef=unresolved.decisionRef;
          currentDecisionPrompt=unresolved.prompt;
          await condition(()=>Object.prototype.hasOwnProperty.call(decisionOutcomes,unresolved!.decisionRef));
          currentDecisionRef=null;
          currentDecisionPrompt=null;
          unresolved=missingDecision(rule.expression,context,decisionOutcomes);
        }
      }
      const matches=conditional.filter(r=>{
        if(!r.conditionRef)throw new TypeError(`conditional relation ${r.id} has no conditionRef`);
        const rule=input.program.semantics.conditionRules.find(x=>x.ref===r.conditionRef);
        if(!rule)throw new TypeError(`condition snapshot missing for ${r.conditionRef}`);
        return evaluate(rule.expression,context,decisionOutcomes);
      });
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
