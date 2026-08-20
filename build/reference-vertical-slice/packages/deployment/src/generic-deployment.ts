import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { GenericResolvedExecutionBundle } from '../../execution/src/generic-resolved-plan.ts';
import type { ReferenceTemporalMappingBundle } from '../../temporal-design/src/types.ts';
import type { ReferenceRuntimePolicyBundle } from '../../runtime-policy/src/types.ts';
import type { DeploymentRequirement,ReferenceDeploymentBundle } from './types.ts';

const dep=(seed:string)=>createOpaqueId('deployment',seed);
export interface GenericDeploymentIntent {
  environmentKey:string;
  environmentClass:'DEVELOPMENT'|'TEST'|'STAGING'|'PRODUCTION';
  temporalPlatformRef:string;
  desiredNamespaceKey:string;
  desiredTaskQueueKey:string;
  desiredWorkflowTypeName:string;
  desiredActivityTypeName:string;
  desiredWorkerLogicalName:string;
  authorityRef:string;
  decidedBy:string;
  rationale:string;
}
function nonEmpty(v:string,label:string){if(!v.trim())throw new TypeError(`${label} is required`);}

export function designGenericDeployment(
  execution:GenericResolvedExecutionBundle,
  mapping:ReferenceTemporalMappingBundle,
  policy:ReferenceRuntimePolicyBundle,
  intent:GenericDeploymentIntent,
  createdAt:string,
):ReferenceDeploymentBundle{
  if(policy.assessment.readiness!=='READY_FOR_DEPLOYMENT_DESIGN')throw new TypeError('generic Deployment requires READY_FOR_DEPLOYMENT_DESIGN runtime policy');
  if(policy.revision.executionPlanRevisionRef!==execution.revision.id||policy.revision.temporalMappingRevisionRef!==mapping.revision.id)throw new TypeError('generic Deployment upstream lineage mismatch');
  for(const [k,v] of Object.entries({environmentKey:intent.environmentKey,temporalPlatformRef:intent.temporalPlatformRef,desiredNamespaceKey:intent.desiredNamespaceKey,desiredTaskQueueKey:intent.desiredTaskQueueKey,desiredWorkflowTypeName:intent.desiredWorkflowTypeName,desiredActivityTypeName:intent.desiredActivityTypeName,desiredWorkerLogicalName:intent.desiredWorkerLogicalName,authorityRef:intent.authorityRef,decidedBy:intent.decidedBy,rationale:intent.rationale}))nonEmpty(v,k);

  const definitionId=dep(`generic-deployment-definition:${execution.definition.id}`);
  const intentDigest=digestDeterministicJson({execution:execution.revision.id,mapping:mapping.revision.id,policy:policy.revision.id,intent});
  const revisionId=dep(`generic-deployment-revision:${policy.revision.id}:${intentDigest}`);
  const targetId=dep(`generic-target:${revisionId}`),namespaceResolutionId=dep(`generic-namespace-resolution:${revisionId}:${intent.desiredNamespaceKey}`),namespaceBindingId=dep(`generic-namespace-binding:${revisionId}`),namingId=dep(`generic-naming:${revisionId}`),assessmentId=dep(`generic-deployment-assessment:${revisionId}`);
  const targetProfile={id:targetId,environmentKey:intent.environmentKey,environmentClass:intent.environmentClass,temporalPlatformRef:intent.temporalPlatformRef,temporalNamespaceLocatorRef:namespaceResolutionId,platformCapabilityProfileRef:mapping.featureProfile.id,targetPolicyRefs:[policy.revision.id],createdAt};
  const namespaceResolution={id:namespaceResolutionId,deploymentTargetProfileRef:targetId,desiredNamespaceKey:intent.desiredNamespaceKey,resolutionPolicy:'USE_REQUESTED_IF_AVAILABLE_ELSE_RECORD_ACTUAL_PRECREATED' as const,resolutionState:'RESOLUTION_REQUIRED' as const,createdAt};
  const namespaceBinding={id:namespaceBindingId,deploymentRevisionRef:revisionId,deploymentTargetProfileRef:targetId,namespaceLocatorRef:namespaceResolutionId,bindingRationaleRefs:[namespaceResolutionId,intent.authorityRef,'Concrete Temporal Namespace is resolved only from runtime/environment evidence.']};
  const namingIntent={id:namingId,deploymentRevisionRef:revisionId,desiredTaskQueueKey:intent.desiredTaskQueueKey,desiredWorkflowTypeName:intent.desiredWorkflowTypeName,desiredActivityTypeName:intent.desiredActivityTypeName,desiredWorkerLogicalName:intent.desiredWorkerLogicalName,bindingState:'DESIGN_INTENT_ONLY' as const,createdAt};
  const requirements:DeploymentRequirement[]=[
    {id:dep(`generic-requirement:${revisionId}:environment`),deploymentRevisionRef:revisionId,requirementKind:'ENVIRONMENT_CONFIGURATION',state:'RESOLVED',materiality:'MATERIAL',subjectRefs:[targetId],rationale:`Environment class ${intent.environmentClass} is an explicit deployment design decision by ${intent.decidedBy}.`},
    {id:dep(`generic-requirement:${revisionId}:namespace`),deploymentRevisionRef:revisionId,requirementKind:'NAMESPACE_BINDING',state:'UNRESOLVED',materiality:'MATERIAL',subjectRefs:[namespaceResolutionId,namespaceBindingId],rationale:'Actual namespace locator requires runtime/environment realization evidence.'},
    {id:dep(`generic-requirement:${revisionId}:task-queue`),deploymentRevisionRef:revisionId,requirementKind:'TASK_QUEUE_ROUTING',state:'UNRESOLVED',materiality:'MATERIAL',subjectRefs:[namingId],rationale:'Task Queue design intent is not a concrete routing binding until a Worker artifact exists.'},
    {id:dep(`generic-requirement:${revisionId}:worker`),deploymentRevisionRef:revisionId,requirementKind:'WORKER_ARTIFACT',state:'UNRESOLVED',materiality:'MATERIAL',subjectRefs:[namingId],rationale:'Executable generic Worker artifact identity/digest must be produced by the runtime compilation gate.'},
    {id:dep(`generic-requirement:${revisionId}:types`),deploymentRevisionRef:revisionId,requirementKind:'TYPE_REGISTRATION',state:'UNRESOLVED',materiality:'MATERIAL',subjectRefs:[namingId,...mapping.units.map(x=>x.id)],rationale:'Workflow/Activity type bindings require the compiled Worker artifact and Task Queue binding.'},
    {id:dep(`generic-requirement:${revisionId}:runtime`),deploymentRevisionRef:revisionId,requirementKind:'RUNTIME_COMPATIBILITY',state:'UNRESOLVED',materiality:'MATERIAL',subjectRefs:[mapping.featureProfile.id,policy.revision.id],rationale:'Actual Temporal SDK/runtime compatibility is proven by the generic runtime gate, not by design intent.'},
  ];
  const unresolved=requirements.filter(x=>x.state==='UNRESOLVED').map(x=>x.id);
  const deploymentDigest=digestDeterministicJson({execution:execution.revision.id,mapping:mapping.revision.id,policy:policy.revision.id,targetProfile,namespaceResolution,namingIntent,requirements});
  const revision={id:revisionId,deploymentDefinitionId:definitionId,revisionNumber:1,executionPlanRevisionRef:execution.revision.id,temporalMappingRevisionRef:mapping.revision.id,runtimePolicyRevisionRef:policy.revision.id,temporalFeatureProfileRef:mapping.featureProfile.id,deploymentTargetProfileRef:targetId,environmentBindingRealizationRefs:[],temporalNamespaceBindingRef:namespaceBindingId,taskQueueBindingRefs:[],workflowTypeBindingRefs:[],activityTypeBindingRefs:[],workerArtifactBindingRefs:[],deploymentRequirementRefs:requirements.map(x=>x.id),deploymentAssessmentRef:assessmentId,deploymentDigest,createdAt,createdBy:intent.decidedBy};
  const assessment={id:assessmentId,deploymentRevisionRef:revisionId,findingRefs:['Environment realization intentionally remains incomplete until compiled Worker/runtime evidence exists.'],unresolvedRequirementRefs:unresolved,readiness:'INCOMPLETE_ENVIRONMENT_REALIZATION' as const,assessedAt:createdAt};
  const definition={id:definitionId,executionPlanDefinitionRef:execution.definition.id,canonicalName:'Generic Temporal deployment',createdAt,lifecycleStatus:'DESIGN',initialDeploymentRevisionRef:revisionId,latestDeploymentRevisionRef:revisionId};
  return{definition,revision,targetProfile,namespaceResolution,namespaceBinding,namingIntent,requirements,assessment,environmentRealizations:[],taskQueueBindings:[],workflowTypeBindings:[],activityTypeBindings:[],workerArtifactBindings:[],attempts:[],observations:[],workflowExecutions:[]};
}
