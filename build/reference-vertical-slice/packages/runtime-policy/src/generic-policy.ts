import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { GenericResolvedExecutionBundle } from '../../execution/src/generic-resolved-plan.ts';
import type { ReferenceTemporalMappingBundle } from '../../temporal-design/src/types.ts';
import type {
  FailureClassificationPolicy,
  IdempotencyPolicyDesign,
  ReferenceRuntimePolicyBundle,
  RetryPolicyDesign,
  RuntimePolicyFacet,
  TimeoutPolicyDesign,
} from './types.ts';

const rpl=(seed:string)=>createOpaqueId('runtimePolicy',seed);
const DESIGNER_VERSION='i6-generic-runtime-policy-v0.2';

type PolicyBasis=RetryPolicyDesign['policyBasis'];
export interface GenericActivityRuntimePolicyResolution {
  capabilityUseOccurrenceRef:string;
  authorityRef:string;
  decidedBy:string;
  rationale:string;
  policyBasis:PolicyBasis;
  retry:{initialIntervalMs:number;backoffCoefficient:number;maximumIntervalMs:number;maximumAttempts:number;nonRetryableFailureTypes:string[]};
  timeout:{startToCloseMs:number;scheduleToCloseMs:number};
  idempotency:{requirement:'REQUIRED'|'NOT_REQUIRED';strategyKind:'IDEMPOTENCY_KEY'|'PROVIDER_GUARANTEE'|'NONE';keyContract?:string;enforcementRef?:string};
  failureClassifications:Array<{failureType:string;retryable:boolean;businessFailure:boolean;notes?:string}>;
}
export interface GenericWorkflowRuntimePolicyResolution {
  authorityRef:string;
  decidedBy:string;
  rationale:string;
  maximumAttempts:number;
  policyBasis:PolicyBasis;
}

function nonEmpty(v:string,label:string):void{if(!v.trim())throw new TypeError(`${label} is required`);}
function positive(n:number,label:string):void{if(!Number.isFinite(n)||n<=0)throw new TypeError(`${label} must be > 0`);}

function activityCapabilityUses(execution:GenericResolvedExecutionBundle){
  const refs=new Set(
    execution.elements
      .filter(element=>element.kind==='CAPABILITY_INVOCATION')
      .flatMap(element=>element.capabilityUseRefs),
  );
  return execution.capabilityUses.filter(use=>refs.has(use.id));
}

export function designGenericRuntimePolicy(
  execution:GenericResolvedExecutionBundle,
  mapping:ReferenceTemporalMappingBundle,
  activities:GenericActivityRuntimePolicyResolution[],
  workflow:GenericWorkflowRuntimePolicyResolution,
  createdAt:string,
):ReferenceRuntimePolicyBundle{
  if(mapping.assessment.readiness!=='READY_FOR_RUNTIME_POLICY_DESIGN')throw new TypeError('generic RuntimePolicy requires READY_FOR_RUNTIME_POLICY_DESIGN');
  if(mapping.revision.executionPlanRevisionRef!==execution.revision.id)throw new TypeError('generic RuntimePolicy mapping/execution mismatch');
  nonEmpty(workflow.authorityRef,'workflow authorityRef');nonEmpty(workflow.decidedBy,'workflow decidedBy');nonEmpty(workflow.rationale,'workflow rationale');positive(workflow.maximumAttempts,'workflow maximumAttempts');

  const activityUnits=mapping.units.filter(u=>u.constructKind==='ACTIVITY');
  const activityUses=activityCapabilityUses(execution);
  const resolutionByUse=new Map(activities.map(x=>[x.capabilityUseOccurrenceRef,x]));
  if(resolutionByUse.size!==activities.length)throw new TypeError('duplicate Activity runtime policy resolution');
  if(activityUnits.length!==activityUses.length)throw new TypeError('generic runtime policy expects one Activity mapping per executable Activity capability use');
  if(activities.length!==activityUses.length)throw new TypeError('generic runtime policy requires exactly one explicit policy resolution per Activity capability use');
  for(const use of activityUses){
    const spec=resolutionByUse.get(use.id);if(!spec)throw new TypeError(`runtime policy missing for Activity capability use ${use.id}`);
    nonEmpty(spec.authorityRef,'activity authorityRef');nonEmpty(spec.decidedBy,'activity decidedBy');nonEmpty(spec.rationale,'activity rationale');
    positive(spec.retry.initialIntervalMs,'retry initialIntervalMs');positive(spec.retry.backoffCoefficient,'retry backoffCoefficient');positive(spec.retry.maximumIntervalMs,'retry maximumIntervalMs');positive(spec.retry.maximumAttempts,'retry maximumAttempts');
    positive(spec.timeout.startToCloseMs,'timeout startToCloseMs');positive(spec.timeout.scheduleToCloseMs,'timeout scheduleToCloseMs');
    if(spec.timeout.scheduleToCloseMs<spec.timeout.startToCloseMs)throw new TypeError('scheduleToCloseMs must be >= startToCloseMs');
    if(spec.idempotency.requirement==='REQUIRED'&&spec.idempotency.strategyKind==='NONE')throw new TypeError('required idempotency cannot use NONE strategy');
    if(spec.idempotency.strategyKind==='IDEMPOTENCY_KEY'&&!spec.idempotency.keyContract)throw new TypeError('IDEMPOTENCY_KEY requires keyContract');
    if(spec.failureClassifications.length===0)throw new TypeError('Activity runtime policy requires explicit failure classification');
  }
  for(const spec of activities){
    if(!activityUses.some(use=>use.id===spec.capabilityUseOccurrenceRef))throw new TypeError(`runtime policy resolution targets non-Activity capability use ${spec.capabilityUseOccurrenceRef}`);
  }

  const normalized=digestDeterministicJson({execution:execution.revision.id,mapping:mapping.revision.id,activities:[...activities].sort((a,b)=>a.capabilityUseOccurrenceRef.localeCompare(b.capabilityUseOccurrenceRef)),workflow,designerVersion:DESIGNER_VERSION});
  const revisionId=rpl(`generic-runtime-policy:${mapping.revision.id}:${normalized}`);
  const retryPolicies:RetryPolicyDesign[]=[],timeoutPolicies:TimeoutPolicyDesign[]=[],idempotencyPolicies:IdempotencyPolicyDesign[]=[],failurePolicies:FailureClassificationPolicy[]=[],activityPolicies:any[]=[],facets:RuntimePolicyFacet[]=[];

  for(const use of activityUses){
    const spec=resolutionByUse.get(use.id)!;
    const unit=activityUnits.find(u=>u.executionSubjectRefs.includes(use.id));if(!unit)throw new TypeError(`Activity mapping missing for capability use ${use.id}`);
    const retry:RetryPolicyDesign={id:rpl(`generic-retry:${revisionId}:${use.id}`),runtimePolicyRevisionId:revisionId,policySubjectRef:unit.id,retryMode:'EXPLICIT_CUSTOM',initialIntervalMs:spec.retry.initialIntervalMs,backoffCoefficient:spec.retry.backoffCoefficient,maximumIntervalMs:spec.retry.maximumIntervalMs,maximumAttempts:spec.retry.maximumAttempts,nonRetryableFailureTypes:[...spec.retry.nonRetryableFailureTypes],policyBasis:spec.policyBasis};
    const timeout:TimeoutPolicyDesign={id:rpl(`generic-timeout:${revisionId}:${use.id}`),runtimePolicyRevisionId:revisionId,policySubjectRef:unit.id,startToCloseMs:spec.timeout.startToCloseMs,scheduleToCloseMs:spec.timeout.scheduleToCloseMs,policyBasis:spec.policyBasis};
    const idem:IdempotencyPolicyDesign={id:rpl(`generic-idem:${revisionId}:${use.id}`),runtimePolicyRevisionId:revisionId,policySubjectRef:unit.id,requirement:spec.idempotency.requirement,strategyKind:spec.idempotency.strategyKind,...(spec.idempotency.keyContract?{keyContract:spec.idempotency.keyContract}:{}),...(spec.idempotency.enforcementRef?{enforcementRef:spec.idempotency.enforcementRef}:{}),policyBasis:spec.policyBasis};
    const failure:FailureClassificationPolicy={id:rpl(`generic-failure:${revisionId}:${use.id}`),runtimePolicyRevisionId:revisionId,policySubjectRef:unit.id,classifications:spec.failureClassifications.map(x=>({...x}))};
    retryPolicies.push(retry);timeoutPolicies.push(timeout);idempotencyPolicies.push(idem);failurePolicies.push(failure);
    activityPolicies.push({id:rpl(`generic-activity-policy:${revisionId}:${use.id}`),runtimePolicyRevisionId:revisionId,temporalMappingUnitRef:unit.id,capabilityUseOccurrenceRef:use.id,retryPolicyRef:retry.id,timeoutPolicyRef:timeout.id,idempotencyPolicyRef:idem.id,failureClassificationPolicyRef:failure.id});
    facets.push(
      {id:rpl(`generic-facet:${revisionId}:${use.id}:retry`),runtimePolicyRevisionId:revisionId,policySubjectRef:unit.id,propertyPath:'retry',value:{...spec.retry},policyBasis:spec.policyBasis,materiality:'MATERIAL',evidenceRefs:[retry.id,spec.authorityRef]},
      {id:rpl(`generic-facet:${revisionId}:${use.id}:timeout`),runtimePolicyRevisionId:revisionId,policySubjectRef:unit.id,propertyPath:'timeout',value:{...spec.timeout},policyBasis:spec.policyBasis,materiality:'MATERIAL',evidenceRefs:[timeout.id,spec.authorityRef]},
      {id:rpl(`generic-facet:${revisionId}:${use.id}:idempotency`),runtimePolicyRevisionId:revisionId,policySubjectRef:unit.id,propertyPath:'idempotency',value:{...spec.idempotency},policyBasis:spec.policyBasis,materiality:'MATERIAL',evidenceRefs:[idem.id,spec.authorityRef]},
    );
  }

  const workflowRetry:RetryPolicyDesign={id:rpl(`generic-retry:${revisionId}:workflow`),runtimePolicyRevisionId:revisionId,policySubjectRef:mapping.workflowBoundaries[0].id,retryMode:'EXPLICIT_CUSTOM',maximumAttempts:workflow.maximumAttempts,nonRetryableFailureTypes:[],policyBasis:workflow.policyBasis};
  retryPolicies.push(workflowRetry);
  facets.push({id:rpl(`generic-facet:${revisionId}:workflow-retry`),runtimePolicyRevisionId:revisionId,policySubjectRef:mapping.workflowBoundaries[0].id,propertyPath:'retry.maximumAttempts',value:workflow.maximumAttempts,policyBasis:workflow.policyBasis,materiality:'MATERIAL',evidenceRefs:[workflowRetry.id,workflow.authorityRef]});

  const defaultProfileId=rpl(`generic-default-profile:${mapping.featureProfile.id}`);
  const defaultProfile={id:defaultProfileId,profileVersion:'talos-generic-explicit-policy-v0.2',temporalFeatureProfileRef:mapping.featureProfile.id,platformReferenceRef:'TEMPORAL_PLATFORM_GENERIC',sdkFamily:'typescript',defaultBehaviorEntryRefs:[],createdAt};
  const policyDigest=digestDeterministicJson({execution:execution.revision.id,mapping:mapping.revision.id,retryPolicies,timeoutPolicies,idempotencyPolicies,failurePolicies,activityPolicies,workflowRetry,defaultProfile,facets});
  const revision={id:revisionId,revision:1,executionPlanRevisionRef:execution.revision.id,temporalMappingRevisionRef:mapping.revision.id,temporalFeatureProfileRef:mapping.featureProfile.id,temporalDefaultBehaviorProfileRef:defaultProfile.id,activityExecutionPolicyRefs:activityPolicies.map(x=>x.id),workflowRetryPolicyRef:workflowRetry.id,retryPolicyRefs:retryPolicies.map(x=>x.id),timeoutPolicyRefs:timeoutPolicies.map(x=>x.id),idempotencyPolicyRefs:idempotencyPolicies.map(x=>x.id),failureClassificationPolicyRefs:failurePolicies.map(x=>x.id),temporalDefaultAcceptanceRefs:[],facetRefs:facets.map(x=>x.id),policyDigest,createdAt,parentRevisionRefs:[]};
  const assessment={id:rpl(`generic-policy-assessment:${revisionId}`),runtimePolicyRevisionId:revisionId,findingRefs:[],readiness:'READY_FOR_DEPLOYMENT_DESIGN' as const,assessedAt:createdAt};
  return{revision,activityPolicies,retryPolicies,timeoutPolicies,idempotencyPolicies,failurePolicies,defaultProfile,defaultEntries:[],defaultAcceptances:[],facets,assessment};
}
