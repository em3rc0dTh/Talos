import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import type { GenericResolvedExecutionBundle } from '../../../packages/execution/src/generic-resolved-plan.ts';
import type { ReferenceTemporalMappingBundle } from '../../../packages/temporal-design/src/types.ts';
import type { ReferenceRuntimePolicyBundle } from '../../../packages/runtime-policy/src/types.ts';
import type { ReferenceDeploymentBundle } from '../../../packages/deployment/src/types.ts';
import type { TemporalSdkTarget } from './contracts.ts';
import type { CompiledGenericRuntimeProgram,GenericRuntimeSemanticSnapshot } from './generic-contracts.ts';

function semanticDigestMaterial(semantics:GenericRuntimeSemanticSnapshot){
  return semantics.humans===undefined
    ? {conditionRules:semantics.conditionRules,waits:semantics.waits}
    : {conditionRules:semantics.conditionRules,waits:semantics.waits,humans:semantics.humans};
}

export function compileGenericRuntimeProgram(
  execution:GenericResolvedExecutionBundle,
  mapping:ReferenceTemporalMappingBundle,
  policy:ReferenceRuntimePolicyBundle,
  deployment:ReferenceDeploymentBundle,
  semantics:GenericRuntimeSemanticSnapshot,
  sdkTarget:TemporalSdkTarget,
):CompiledGenericRuntimeProgram{
  if(execution.assessment.readiness!=='READY_FOR_TEMPORAL_MAPPING_DESIGN')throw new TypeError('generic runtime compilation requires ready ExecutionPlan');
  if(mapping.assessment.readiness!=='READY_FOR_RUNTIME_POLICY_DESIGN')throw new TypeError('generic runtime compilation requires ready Temporal mapping');
  if(policy.assessment.readiness!=='READY_FOR_DEPLOYMENT_DESIGN')throw new TypeError('generic runtime compilation requires ready runtime policy');
  if(deployment.assessment.readiness!=='INCOMPLETE_ENVIRONMENT_REALIZATION')throw new TypeError('generic runtime compilation expects unresolved environment realization before Worker proof');
  if(mapping.revision.executionPlanRevisionRef!==execution.revision.id||policy.revision.executionPlanRevisionRef!==execution.revision.id||policy.revision.temporalMappingRevisionRef!==mapping.revision.id||deployment.revision.executionPlanRevisionRef!==execution.revision.id||deployment.revision.temporalMappingRevisionRef!==mapping.revision.id||deployment.revision.runtimePolicyRevisionRef!==policy.revision.id)throw new TypeError('generic runtime compilation upstream lineage mismatch');
  if(semantics.snapshotDigest!==digestDeterministicJson(semanticDigestMaterial(semantics)))throw new TypeError('generic runtime semantic snapshot digest mismatch');

  const incoming=new Map(execution.elements.map(e=>[e.id,0]));
  for(const r of execution.relations)incoming.set(r.targetElementRef,(incoming.get(r.targetElementRef)??0)+1);
  const entries=execution.elements.filter(e=>(incoming.get(e.id)??0)===0);
  if(entries.length!==1)throw new TypeError(`generic runtime v0.2 requires exactly one graph entry; found ${entries.length}`);
  if(execution.relations.some(r=>r.relationKind==='PARALLEL'||r.relationKind==='SOURCE_DEFINED'))throw new TypeError('generic runtime v0.2 does not execute parallel/source-defined relations');
  if(mapping.units.some(u=>u.constructKind==='CHILD_WORKFLOW'))throw new TypeError('generic runtime v0.2 does not yet execute child-workflow mappings');

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

  const activityUseRefs=new Set(
    execution.elements
      .filter(element=>element.kind==='CAPABILITY_INVOCATION')
      .flatMap(element=>element.capabilityUseRefs),
  );
  const activityUses=execution.capabilityUses.filter(use=>activityUseRefs.has(use.id));
  const activityPolicies=activityUses.map(use=>{
    const ap=policy.activityPolicies.find(x=>x.capabilityUseOccurrenceRef===use.id);if(!ap)throw new TypeError(`Activity policy missing for ${use.id}`);
    const retry=policy.retryPolicies.find(x=>x.id===ap.retryPolicyRef),timeout=policy.timeoutPolicies.find(x=>x.id===ap.timeoutPolicyRef),idem=policy.idempotencyPolicies.find(x=>x.id===ap.idempotencyPolicyRef);
    if(!retry||!timeout||!idem||retry.initialIntervalMs===undefined||retry.backoffCoefficient===undefined||retry.maximumIntervalMs===undefined||retry.maximumAttempts===undefined||timeout.startToCloseMs===undefined||timeout.scheduleToCloseMs===undefined)throw new TypeError(`material Activity policy incomplete for ${use.id}`);
    return{capabilityUseOccurrenceRef:use.id,temporalMappingUnitRef:ap.temporalMappingUnitRef,retry:{initialIntervalMs:retry.initialIntervalMs,backoffCoefficient:retry.backoffCoefficient,maximumIntervalMs:retry.maximumIntervalMs,maximumAttempts:retry.maximumAttempts,nonRetryableErrorTypes:[...retry.nonRetryableFailureTypes]},timeout:{startToCloseMs:timeout.startToCloseMs,scheduleToCloseMs:timeout.scheduleToCloseMs},idempotency:{strategyKind:idem.strategyKind as 'IDEMPOTENCY_KEY'|'PROVIDER_GUARANTEE'|'NONE',...(idem.keyContract?{keyContract:idem.keyContract}:{}),...(idem.enforcementRef?{enforcementRef:idem.enforcementRef}:{})}};
  });
  if(policy.activityPolicies.some(ap=>!activityUseRefs.has(ap.capabilityUseOccurrenceRef)))throw new TypeError('generic runtime policy contains Activity policy for non-Activity capability use');
  const workflowRetry=policy.retryPolicies.find(x=>x.id===policy.revision.workflowRetryPolicyRef);if(!workflowRetry?.maximumAttempts)throw new TypeError('generic Workflow retry policy missing');
  const waitElements=elements.filter(e=>e.kind==='WAIT_COORDINATION');
  for(const wait of waitElements){const spec=semantics.waits.find(x=>x.executionElementRef===wait.id);if(!spec||!Number.isFinite(spec.durationMs)||spec.durationMs<0)throw new TypeError(`runtime wait snapshot missing/invalid for ${wait.id}`);}
  const conditionRefs=new Set(relations.filter(r=>r.relationKind==='CONDITIONAL').map(r=>r.conditionRef).filter(Boolean));
  for(const ref of conditionRefs)if(!semantics.conditionRules.some(x=>x.ref===ref))throw new TypeError(`runtime condition snapshot missing for ${ref}`);

  const humanElements=elements.filter(e=>e.kind==='HUMAN_COORDINATION');
  const humanSnapshots=semantics.humans??[];
  if(humanSnapshots.length!==humanElements.length)throw new TypeError('generic runtime human snapshot must contain exactly one entry per HUMAN_COORDINATION element');
  for(const human of humanElements){
    if(human.capabilityUseOccurrenceRefs.length!==1)throw new TypeError(`human runtime requires exactly one capability use at ${human.id}`);
    const snapshot=humanSnapshots.find(item=>item.executionElementRef===human.id);
    if(!snapshot)throw new TypeError(`human runtime snapshot missing for ${human.id}`);
    if(snapshot.capabilityUseOccurrenceRef!==human.capabilityUseOccurrenceRefs[0])throw new TypeError(`human runtime capability lineage mismatch for ${human.id}`);
    if(!human.constructKinds.includes(snapshot.messageKind)||!human.constructKinds.includes('WORKFLOW_CONDITION'))throw new TypeError(`human runtime Temporal mapping mismatch for ${human.id}`);
    if(snapshot.participantRoleRefs.length===0)throw new TypeError(`human runtime participant role snapshot missing for ${human.id}`);
    if(snapshot.outcomes.length===0)throw new TypeError(`human runtime outcome snapshot missing for ${human.id}`);
    const outcomeCodes=new Set<string>();
    for(const outcome of snapshot.outcomes){
      if(!outcome.outcomeRef.trim()||!outcome.outcomeCode.trim()||!outcome.businessMeaning.trim())throw new TypeError(`human runtime outcome snapshot incomplete for ${human.id}`);
      if(outcomeCodes.has(outcome.outcomeCode))throw new TypeError(`human runtime outcomeCode must be unique at ${human.id}: ${outcome.outcomeCode}`);
      outcomeCodes.add(outcome.outcomeCode);
    }
    const outgoing=relations.filter(relation=>relation.sourceElementRef===human.id);
    const deterministic=outgoing.filter(relation=>relation.relationKind==='SEQUENCE'||relation.relationKind==='DEFAULT');
    if(outgoing.length!==1||deterministic.length!==1){
      throw new TypeError(`TALOS_RUNTIME_HUMAN_OUTCOME_ROUTING_REQUIRED: ${human.id} needs explicit outcome-to-relation routing authority before execution`);
    }
  }
  if(humanSnapshots.some(snapshot=>!humanElements.some(element=>element.id===snapshot.executionElementRef)))throw new TypeError('human runtime snapshot contains an unknown execution element');

  const material={sdkTarget,executionPlanRevisionRef:execution.revision.id,temporalMappingRevisionRef:mapping.revision.id,runtimePolicyRevisionRef:policy.revision.id,deploymentRevisionRef:deployment.revision.id,temporalFeatureProfileRef:mapping.featureProfile.id,workflow:{workflowTypeName:deployment.namingIntent.desiredWorkflowTypeName,workflowMaximumAttempts:workflowRetry.maximumAttempts},activity:{activityTypeName:deployment.namingIntent.desiredActivityTypeName,policies:activityPolicies},graph:{entryElementRef:entries[0].id,elements,relations},semantics,deploymentIntent:{environmentClass:deployment.targetProfile.environmentClass as 'DEVELOPMENT'|'TEST'|'STAGING'|'PRODUCTION',desiredNamespaceKey:deployment.namespaceResolution.desiredNamespaceKey,desiredTaskQueueKey:deployment.namingIntent.desiredTaskQueueKey,desiredWorkerLogicalName:deployment.namingIntent.desiredWorkerLogicalName,realizationState:'INCOMPLETE_ENVIRONMENT_REALIZATION' as const}};
  return{schemaVersion:'talos.generic-runtime-program.v1',...material,programDigest:digestDeterministicJson(material)};
}
