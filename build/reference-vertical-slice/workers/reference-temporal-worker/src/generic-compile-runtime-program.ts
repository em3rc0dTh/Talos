import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import type { GenericResolvedExecutionBundle } from '../../../packages/execution/src/generic-resolved-plan.ts';
import type { ReferenceTemporalMappingBundle } from '../../../packages/temporal-design/src/types.ts';
import type { ReferenceRuntimePolicyBundle } from '../../../packages/runtime-policy/src/types.ts';
import type { ReferenceDeploymentBundle } from '../../../packages/deployment/src/types.ts';
import type { TemporalSdkTarget } from './contracts.ts';
import type { CompiledGenericRuntimeProgram,GenericRuntimeSemanticInputSnapshot } from './generic-contracts.ts';
import { compileRuntimeConditionExpression } from './generic-runtime-expression.ts';

export function compileGenericRuntimeProgram(
  execution:GenericResolvedExecutionBundle,
  mapping:ReferenceTemporalMappingBundle,
  policy:ReferenceRuntimePolicyBundle,
  deployment:ReferenceDeploymentBundle,
  semantics:GenericRuntimeSemanticInputSnapshot,
  sdkTarget:TemporalSdkTarget,
):CompiledGenericRuntimeProgram{
  if(execution.assessment.readiness!=='READY_FOR_TEMPORAL_MAPPING_DESIGN')throw new TypeError('generic runtime compilation requires ready ExecutionPlan');
  if(mapping.assessment.readiness!=='READY_FOR_RUNTIME_POLICY_DESIGN')throw new TypeError('generic runtime compilation requires ready Temporal mapping');
  if(policy.assessment.readiness!=='READY_FOR_DEPLOYMENT_DESIGN')throw new TypeError('generic runtime compilation requires ready runtime policy');
  if(deployment.assessment.readiness!=='INCOMPLETE_ENVIRONMENT_REALIZATION')throw new TypeError('generic runtime compilation expects unresolved environment realization before Worker proof');
  if(mapping.revision.executionPlanRevisionRef!==execution.revision.id||policy.revision.executionPlanRevisionRef!==execution.revision.id||policy.revision.temporalMappingRevisionRef!==mapping.revision.id||deployment.revision.executionPlanRevisionRef!==execution.revision.id||deployment.revision.temporalMappingRevisionRef!==mapping.revision.id||deployment.revision.runtimePolicyRevisionRef!==policy.revision.id)throw new TypeError('generic runtime compilation upstream lineage mismatch');
  if(semantics.snapshotDigest!==digestDeterministicJson({conditionRules:semantics.conditionRules,waits:semantics.waits}))throw new TypeError('generic runtime semantic snapshot digest mismatch');

  const runtimeConditionRules=semantics.conditionRules.map(rule=>({
    ref:rule.ref,
    expression:compileRuntimeConditionExpression(rule.expression,rule.ref),
  }));
  const runtimeWaits=semantics.waits.map(wait=>({...wait}));
  const runtimeSemantics={
    conditionRules:runtimeConditionRules,
    waits:runtimeWaits,
    snapshotDigest:digestDeterministicJson({conditionRules:runtimeConditionRules,waits:runtimeWaits}),
  };

  const incoming=new Map(execution.elements.map(e=>[e.id,0]));
  for(const r of execution.relations)incoming.set(r.targetElementRef,(incoming.get(r.targetElementRef)??0)+1);
  const entries=execution.elements.filter(e=>(incoming.get(e.id)??0)===0);
  if(entries.length!==1)throw new TypeError(`generic runtime v0.1 requires exactly one graph entry; found ${entries.length}`);
  if(execution.relations.some(r=>r.relationKind==='PARALLEL'||r.relationKind==='SOURCE_DEFINED'))throw new TypeError('generic runtime v0.1 does not execute parallel/source-defined relations');
  const unsupported=new Set(['CHILD_WORKFLOW','SIGNAL_HANDLER']);
  if(mapping.units.some(u=>unsupported.has(u.constructKind)))throw new TypeError('generic runtime v0.1 does not yet execute child-workflow or signal-handler mappings');

  const elements=execution.elements.map(element=>({
    id:element.id,
    kind:element.kind,
    constructKinds:mapping.units.filter(u=>u.executionSubjectRefs.includes(element.id)).map(u=>u.constructKind),
    capabilityUseOccurrenceRefs:[...element.capabilityUseRefs],
    semanticSubjectRefs:[...element.semanticSubjectRefs],
  }));
  for(const element of elements){
    if(element.constructKinds.length===0)throw new TypeError(`generic runtime element ${element.id} has no Temporal construct mapping`);
  }
  const relations=execution.relations.map(r=>({id:r.id,sourceElementRef:r.sourceElementRef,targetElementRef:r.targetElementRef,relationKind:r.relationKind,...(r.conditionRef?{conditionRef:r.conditionRef}:{})}));
  const elementIds=new Set(elements.map((element)=>element.id));
  const exactRelations=new Set<string>();
  for(const relation of relations){
    if(!elementIds.has(relation.sourceElementRef)||!elementIds.has(relation.targetElementRef)){
      throw new TypeError(`generic runtime relation ${relation.id} references an unknown execution element`);
    }
    const key=JSON.stringify([relation.sourceElementRef,relation.targetElementRef,relation.relationKind,relation.conditionRef??null]);
    if(exactRelations.has(key))throw new TypeError(`generic runtime contains a duplicate relation at ${relation.sourceElementRef} -> ${relation.targetElementRef}`);
    exactRelations.add(key);
  }
  for(const element of elements){
    const outgoing=relations.filter((relation)=>relation.sourceElementRef===element.id);
    if(element.kind==='COMPLETION_COORDINATION'){
      if(outgoing.length)throw new TypeError(`generic runtime completion element ${element.id} must not have outgoing relations`);
      continue;
    }
    if(outgoing.length===0)throw new TypeError(`generic runtime non-terminal element ${element.id} has no outgoing relation`);
    const conditional=outgoing.filter((relation)=>relation.relationKind==='CONDITIONAL');
    if(conditional.length){
      if(outgoing.some((relation)=>relation.relationKind!=='CONDITIONAL'&&relation.relationKind!=='DEFAULT')){
        throw new TypeError(`generic runtime conditional routing at ${element.id} cannot mix conditional/default and sequence relations`);
      }
      if(outgoing.filter((relation)=>relation.relationKind==='DEFAULT').length>1){
        throw new TypeError(`generic runtime conditional routing at ${element.id} has multiple default relations`);
      }
      for(const relation of conditional)if(!relation.conditionRef)throw new TypeError(`generic runtime conditional relation ${relation.id} has no conditionRef`);
    }else{
      const deterministic=outgoing.filter((relation)=>relation.relationKind==='SEQUENCE'||relation.relationKind==='DEFAULT');
      if(deterministic.length!==1||deterministic.length!==outgoing.length){
        throw new TypeError(`generic runtime v0.1 requires one deterministic outgoing relation at ${element.id}`);
      }
    }
  }

  const activityUnits=mapping.units.filter(unit=>unit.constructKind==='ACTIVITY');
  const activityUses=execution.capabilityUses.filter(use=>activityUnits.some(unit=>unit.executionSubjectRefs.includes(use.id)));
  const activityPolicies=activityUses.map(use=>{
    const ap=policy.activityPolicies.find(x=>x.capabilityUseOccurrenceRef===use.id);if(!ap)throw new TypeError(`Activity policy missing for Activity-backed capability use ${use.id}`);
    const retry=policy.retryPolicies.find(x=>x.id===ap.retryPolicyRef),timeout=policy.timeoutPolicies.find(x=>x.id===ap.timeoutPolicyRef),idem=policy.idempotencyPolicies.find(x=>x.id===ap.idempotencyPolicyRef);
    if(!retry||!timeout||!idem||retry.initialIntervalMs===undefined||retry.backoffCoefficient===undefined||retry.maximumIntervalMs===undefined||retry.maximumAttempts===undefined||timeout.startToCloseMs===undefined||timeout.scheduleToCloseMs===undefined)throw new TypeError(`material Activity policy incomplete for ${use.id}`);
    return{capabilityUseOccurrenceRef:use.id,temporalMappingUnitRef:ap.temporalMappingUnitRef,retry:{initialIntervalMs:retry.initialIntervalMs,backoffCoefficient:retry.backoffCoefficient,maximumIntervalMs:retry.maximumIntervalMs,maximumAttempts:retry.maximumAttempts,nonRetryableErrorTypes:[...retry.nonRetryableFailureTypes]},timeout:{startToCloseMs:timeout.startToCloseMs,scheduleToCloseMs:timeout.scheduleToCloseMs},idempotency:{strategyKind:idem.strategyKind as 'IDEMPOTENCY_KEY'|'PROVIDER_GUARANTEE'|'NONE',...(idem.keyContract?{keyContract:idem.keyContract}:{}),...(idem.enforcementRef?{enforcementRef:idem.enforcementRef}:{})}};
  });
  const workflowRetry=policy.retryPolicies.find(x=>x.id===policy.revision.workflowRetryPolicyRef);if(!workflowRetry?.maximumAttempts)throw new TypeError('generic Workflow retry policy missing');
  const waitElements=elements.filter(e=>e.kind==='WAIT_COORDINATION');
  for(const wait of waitElements){const spec=runtimeSemantics.waits.find(x=>x.executionElementRef===wait.id);if(!spec||!Number.isFinite(spec.durationMs)||spec.durationMs<0)throw new TypeError(`runtime wait snapshot missing/invalid for ${wait.id}`);}
  const conditionRefs=new Set(relations.filter(r=>r.relationKind==='CONDITIONAL').map(r=>r.conditionRef).filter(Boolean));
  for(const ref of conditionRefs)if(!runtimeSemantics.conditionRules.some(x=>x.ref===ref))throw new TypeError(`runtime condition snapshot missing for ${ref}`);

  const material={sdkTarget,executionPlanRevisionRef:execution.revision.id,temporalMappingRevisionRef:mapping.revision.id,runtimePolicyRevisionRef:policy.revision.id,deploymentRevisionRef:deployment.revision.id,temporalFeatureProfileRef:mapping.featureProfile.id,workflow:{workflowTypeName:deployment.namingIntent.desiredWorkflowTypeName,workflowMaximumAttempts:workflowRetry.maximumAttempts},activity:{activityTypeName:deployment.namingIntent.desiredActivityTypeName,policies:activityPolicies},graph:{entryElementRef:entries[0].id,elements,relations},semantics:runtimeSemantics,deploymentIntent:{environmentClass:deployment.targetProfile.environmentClass as 'DEVELOPMENT'|'TEST'|'STAGING'|'PRODUCTION',desiredNamespaceKey:deployment.namespaceResolution.desiredNamespaceKey,desiredTaskQueueKey:deployment.namingIntent.desiredTaskQueueKey,desiredWorkerLogicalName:deployment.namingIntent.desiredWorkerLogicalName,realizationState:'INCOMPLETE_ENVIRONMENT_REALIZATION' as const}};
  return{schemaVersion:'talos.generic-runtime-program.v1',...material,programDigest:digestDeterministicJson(material)};
}
