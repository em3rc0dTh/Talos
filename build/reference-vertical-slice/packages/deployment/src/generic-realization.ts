import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ReferenceTemporalMappingBundle } from '../../temporal-design/src/types.ts';
import type {
  ReferenceDeploymentBundle,
  DeploymentRequirement,
  ActivityTypeBinding,
  WorkflowTypeBinding,
  EnvironmentBindingRealization,
} from './types.ts';

const dep=(seed:string)=>createOpaqueId('deployment',seed);
export interface GenericWorkerRealizationEvidence {
  actualNamespace:string;
  taskQueue:string;
  workflowTypeName:string;
  activityTypeName:string;
  workerLogicalName:string;
  executableArtifactRef:string;
  artifactDigest:string;
  sdkFamily:string;
  sdkVersionRef:string;
  authorityRef:string;
  realizedBy:string;
  capabilityBindingRevisionRefs?:string[];
}
function nonEmpty(v:string,label:string){if(!v.trim())throw new TypeError(`${label} is required`);}

export function realizeGenericDeployment(
  design:ReferenceDeploymentBundle,
  mapping:ReferenceTemporalMappingBundle,
  evidence:GenericWorkerRealizationEvidence,
  createdAt:string,
):ReferenceDeploymentBundle{
  if(design.assessment.readiness!=='INCOMPLETE_ENVIRONMENT_REALIZATION')throw new TypeError('generic deployment realization requires incomplete design revision');
  if(design.revision.temporalMappingRevisionRef!==mapping.revision.id)throw new TypeError('generic deployment realization mapping lineage mismatch');
  for(const [k,v] of Object.entries(evidence)){
    if(k==='capabilityBindingRevisionRefs')continue;
    nonEmpty(v as string,k);
  }
  const capabilityBindingRevisionRefs=evidence.capabilityBindingRevisionRefs??[];
  if(new Set(capabilityBindingRevisionRefs).size!==capabilityBindingRevisionRefs.length)throw new TypeError('duplicate capability binding revision in environment realization evidence');
  for(const ref of capabilityBindingRevisionRefs)nonEmpty(ref,'capabilityBindingRevisionRef');
  if(evidence.taskQueue!==design.namingIntent.desiredTaskQueueKey||evidence.workflowTypeName!==design.namingIntent.desiredWorkflowTypeName||evidence.activityTypeName!==design.namingIntent.desiredActivityTypeName||evidence.workerLogicalName!==design.namingIntent.desiredWorkerLogicalName)throw new TypeError('generic worker realization does not match deployment naming intent');

  const realizationDigest=digestDeterministicJson({parentDeploymentRevisionRef:design.revision.id,mappingRevisionRef:mapping.revision.id,evidence:{...evidence,capabilityBindingRevisionRefs}});
  const revisionId=dep(`generic-realized-deployment:${design.revision.id}:${realizationDigest}`),targetId=dep(`generic-realized-target:${revisionId}`),namespaceResolutionId=dep(`generic-realized-namespace-resolution:${revisionId}`),namespaceBindingId=dep(`generic-realized-namespace-binding:${revisionId}`),namingId=dep(`generic-realized-naming:${revisionId}`),taskQueueId=dep(`generic-task-queue:${revisionId}`),workerId=dep(`generic-worker-artifact:${revisionId}:${evidence.artifactDigest}`),workflowBindingId=dep(`generic-workflow-type:${revisionId}`),assessmentId=dep(`generic-realized-assessment:${revisionId}`);
  const activityUnits=mapping.units.filter(u=>u.constructKind==='ACTIVITY');
  const activityBindings:ActivityTypeBinding[]=activityUnits.map((unit,index)=>({id:dep(`generic-activity-type:${revisionId}:${index}:${unit.id}`),deploymentRevisionRef:revisionId,temporalMappingUnitRef:unit.id,activityTypeName:evidence.activityTypeName,taskQueueBindingRef:taskQueueId,artifactRef:evidence.executableArtifactRef}));
  const workflowBinding:WorkflowTypeBinding={id:workflowBindingId,deploymentRevisionRef:revisionId,temporalWorkflowBoundaryMappingRef:mapping.workflowBoundaries[0].id,workflowTypeName:evidence.workflowTypeName,taskQueueBindingRef:taskQueueId,artifactRef:evidence.executableArtifactRef};
  const targetProfile={...design.targetProfile,id:targetId,temporalNamespaceLocatorRef:`temporal-namespace:${evidence.actualNamespace}`,createdAt};
  const namespaceResolution={id:namespaceResolutionId,deploymentTargetProfileRef:targetId,desiredNamespaceKey:design.namespaceResolution.desiredNamespaceKey,resolutionPolicy:'USE_REQUESTED_IF_AVAILABLE_ELSE_RECORD_ACTUAL_PRECREATED' as const,resolutionState:'RESOLVED' as const,actualNamespaceLocatorRef:`temporal-namespace:${evidence.actualNamespace}`,createdAt};
  const namespaceBinding={id:namespaceBindingId,deploymentRevisionRef:revisionId,deploymentTargetProfileRef:targetId,namespaceLocatorRef:`temporal-namespace:${evidence.actualNamespace}`,bindingRationaleRefs:[namespaceResolutionId,evidence.authorityRef,'Observed/pre-created Temporal namespace accepted for this realized deployment revision.']};
  const namingIntent={...design.namingIntent,id:namingId,deploymentRevisionRef:revisionId,bindingState:'REALIZED' as const,createdAt};
  const taskQueueBinding={id:taskQueueId,deploymentRevisionRef:revisionId,taskQueueKey:evidence.taskQueue,taskQueueKind:'SHARED_NAME_MULTI_KIND' as const,temporalMappingSubjectRefs:[mapping.workflowBoundaries[0].id,...activityUnits.map(u=>u.id)],workerArtifactBindingRefs:[workerId],routingPurpose:'Route the generic Workflow and generic capability Activity adapter to the exact realized Worker artifact.',createdAt};
  const workerArtifactBinding={id:workerId,deploymentRevisionRef:revisionId,workerLogicalName:evidence.workerLogicalName,executableArtifactRef:evidence.executableArtifactRef,artifactDigest:evidence.artifactDigest,sdkFamily:evidence.sdkFamily,sdkVersionRef:evidence.sdkVersionRef,supportedWorkflowTypeBindingRefs:[workflowBindingId],supportedActivityTypeBindingRefs:activityBindings.map(x=>x.id)};
  const environmentRealizations:EnvironmentBindingRealization[]=capabilityBindingRevisionRefs.map((bindingRef,index)=>{
    const id=dep(`generic-environment-realization:${revisionId}:${index}:${bindingRef}`);
    return{
      id,
      deploymentRevisionRef:revisionId,
      capabilityBindingRevisionRef:bindingRef,
      configurationRealizationRefs:[targetId,namespaceBindingId,taskQueueId,workerId],
      credentialRealizationRefs:[],
      realizationDigest:digestDeterministicJson({deploymentRevisionRef:revisionId,capabilityBindingRevisionRef:bindingRef,targetId,namespaceBindingId,taskQueueId,workerId,evidenceDigest:realizationDigest}),
      createdAt,
    };
  });
  const environmentRationale=capabilityBindingRevisionRefs.length>0
    ?'Environment target is pinned by the realized deployment revision and traced to the exact capability binding revisions.'
    :'Environment target is pinned by the realized deployment revision; no capability-binding lineage was supplied by this legacy generic caller.';
  const requirements:DeploymentRequirement[]=[
    {id:dep(`generic-realized-requirement:${revisionId}:environment`),deploymentRevisionRef:revisionId,requirementKind:'ENVIRONMENT_CONFIGURATION',state:'RESOLVED',materiality:'MATERIAL',subjectRefs:[targetId,...environmentRealizations.map(x=>x.id)],rationale:environmentRationale},
    {id:dep(`generic-realized-requirement:${revisionId}:namespace`),deploymentRevisionRef:revisionId,requirementKind:'NAMESPACE_BINDING',state:'RESOLVED',materiality:'MATERIAL',subjectRefs:[namespaceResolutionId,namespaceBindingId],rationale:'Concrete Temporal namespace is recorded from runtime environment evidence.'},
    {id:dep(`generic-realized-requirement:${revisionId}:task-queue`),deploymentRevisionRef:revisionId,requirementKind:'TASK_QUEUE_ROUTING',state:'RESOLVED',materiality:'MATERIAL',subjectRefs:[taskQueueId],rationale:'Concrete Task Queue binding points to the realized Worker artifact.'},
    {id:dep(`generic-realized-requirement:${revisionId}:worker`),deploymentRevisionRef:revisionId,requirementKind:'WORKER_ARTIFACT',state:'RESOLVED',materiality:'MATERIAL',subjectRefs:[workerId],rationale:'Worker artifact identity and digest are pinned.'},
    {id:dep(`generic-realized-requirement:${revisionId}:types`),deploymentRevisionRef:revisionId,requirementKind:'TYPE_REGISTRATION',state:'RESOLVED',materiality:'MATERIAL',subjectRefs:[workflowBindingId,...activityBindings.map(x=>x.id)],rationale:'Workflow and Activity mappings are bound to executable type names and the realized Worker artifact.'},
    {id:dep(`generic-realized-requirement:${revisionId}:runtime`),deploymentRevisionRef:revisionId,requirementKind:'RUNTIME_COMPATIBILITY',state:'RESOLVED',materiality:'MATERIAL',subjectRefs:[workerId,mapping.featureProfile.id],rationale:`Worker pins ${evidence.sdkFamily} ${evidence.sdkVersionRef}; compatibility must still be exercised by a deployment attempt before production claim.`},
  ];
  const deploymentDigest=digestDeterministicJson({parent:design.revision.id,targetProfile,namespaceResolution,namespaceBinding,namingIntent,environmentRealizations,taskQueueBinding,workflowBinding,activityBindings,workerArtifactBinding,requirements});
  const revision={...design.revision,id:revisionId,revisionNumber:design.revision.revisionNumber+1,parentDeploymentRevisionRef:design.revision.id,deploymentTargetProfileRef:targetId,environmentBindingRealizationRefs:environmentRealizations.map(x=>x.id),temporalNamespaceBindingRef:namespaceBindingId,taskQueueBindingRefs:[taskQueueId],workflowTypeBindingRefs:[workflowBindingId],activityTypeBindingRefs:activityBindings.map(x=>x.id),workerArtifactBindingRefs:[workerId],deploymentRequirementRefs:requirements.map(x=>x.id),deploymentAssessmentRef:assessmentId,deploymentDigest,createdAt,createdBy:evidence.realizedBy};
  const assessment={id:assessmentId,deploymentRevisionRef:revisionId,findingRefs:[],unresolvedRequirementRefs:[],readiness:'READY_FOR_DEPLOYMENT_ATTEMPT' as const,assessedAt:createdAt};
  const definition={...design.definition,latestDeploymentRevisionRef:revisionId};
  return{definition,revision,targetProfile,namespaceResolution,namespaceBinding,namingIntent,requirements,assessment,environmentRealizations,taskQueueBindings:[taskQueueBinding],workflowTypeBindings:[workflowBinding],activityTypeBindings:activityBindings,workerArtifactBindings:[workerArtifactBinding],attempts:[],observations:[],workflowExecutions:[]};
}
