import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { ReferenceExecutionBundle } from '../../execution/src/types.ts';
import type { GenericExecutionDraftBundle } from '../../execution/src/generic-plan.ts';
import type { GenericResolvedExecutionBundle } from '../../execution/src/generic-resolved-plan.ts';
import type { AutomationExecutionPlanReviewBundle } from '../../execution/src/automation-execution-review.ts';
import type { AutomationDesignApprovalRecord } from '../../execution/src/automation-approval.ts';
import type { ReferenceTemporalMappingBundle } from '../../temporal-design/src/types.ts';
import type { ReferenceRuntimePolicyBundle } from '../../runtime-policy/src/types.ts';
import type { ReferenceDeploymentBundle } from '../../deployment/src/types.ts';

function append(repo:ImmutableDocumentRepository,kind:string,payload:any,fallbackAt:string,schemaVersion='phase5-reference-v0.2'):void{
  repo.append({id:payload.id,aggregateKind:kind,schemaVersion,payload,createdAt:payload.createdAt??payload.assessedAt??payload.decidedAt??payload.approvedAt??fallbackAt});
}
export function persistReferenceExecutionDesign(repo:ImmutableDocumentRepository,execution:ReferenceExecutionBundle,mapping:ReferenceTemporalMappingBundle,policy:ReferenceRuntimePolicyBundle,deployment:ReferenceDeploymentBundle):void{
  const at=execution.revision.createdAt;
  const records:Array<[string,any]>=[
    ['ExecutionPlanDefinition',execution.definition],['ExecutionPlanRevision',execution.revision],...execution.scopeBindings.map(x=>['ExecutionScopeBinding',x] as [string,any]),...execution.regions.map(x=>['ExecutionRegion',x] as [string,any]),...execution.elements.map(x=>['ExecutionElement',x] as [string,any]),...execution.relations.map(x=>['ExecutionRelation',x] as [string,any]),...execution.capabilityUses.map(x=>['CapabilityUseOccurrence',x] as [string,any]),...execution.dataDependencies.map(x=>['ExecutionDataDependency',x] as [string,any]),...execution.requirements.map(x=>['ExecutionRequirement',x] as [string,any]),...execution.mappingTraces.map(x=>['ExecutionSemanticMappingTrace',x] as [string,any]),...execution.scopeAssessments.map(x=>['ExecutionScopeAssessment',x] as [string,any]),['ExecutionPlanAssessment',execution.assessment],
    ['TemporalMappingDefinition',mapping.definition],['TemporalMappingRevision',mapping.revision],['TemporalFeatureProfile',mapping.featureProfile],...mapping.workflowBoundaries.map(x=>['TemporalWorkflowBoundaryMapping',x] as [string,any]),...mapping.groups.map(x=>['TemporalMappingGroup',x] as [string,any]),...mapping.units.map(x=>['TemporalMappingUnit',x] as [string,any]),...mapping.alternatives.map(x=>['TemporalMappingAlternative',x] as [string,any]),...mapping.decisions.map(x=>['TemporalMappingDecision',x] as [string,any]),...mapping.unitCompatibility.map(x=>['TemporalMappingUnitCompatibility',x] as [string,any]),['TemporalFeatureCompatibilityAssessment',mapping.compatibilityAssessment],['TemporalMappingAssessment',mapping.assessment],
    ['RuntimePolicyRevision',policy.revision],...policy.activityPolicies.map(x=>['ActivityExecutionPolicy',x] as [string,any]),...policy.retryPolicies.map(x=>['RetryPolicyDesign',x] as [string,any]),...policy.timeoutPolicies.map(x=>['TimeoutPolicyDesign',x] as [string,any]),...policy.idempotencyPolicies.map(x=>['IdempotencyPolicyDesign',x] as [string,any]),...policy.failurePolicies.map(x=>['FailureClassificationPolicy',x] as [string,any]),['TemporalDefaultBehaviorProfile',policy.defaultProfile],...policy.defaultEntries.map(x=>['TemporalDefaultBehaviorEntry',x] as [string,any]),...policy.defaultAcceptances.map(x=>['TemporalDefaultAcceptance',x] as [string,any]),...policy.facets.map(x=>['RuntimePolicyFacet',x] as [string,any]),['RuntimePolicyAssessment',policy.assessment],
    ['DeploymentDefinition',deployment.definition],['DeploymentRevision',deployment.revision],['DeploymentTargetProfile',deployment.targetProfile],['TemporalNamespaceResolutionContract',deployment.namespaceResolution],['TemporalNamespaceBinding',deployment.namespaceBinding],['ReferenceDeploymentNamingIntent',deployment.namingIntent],...deployment.requirements.map(x=>['DeploymentRequirement',x] as [string,any]),['DeploymentAssessment',deployment.assessment]
  ];
  for(const [kind,payload] of records)append(repo,kind,payload,at);
}

export function persistGenericExecutionDraft(repo:ImmutableDocumentRepository,execution:GenericExecutionDraftBundle):void{
  const at=execution.revision.createdAt;
  const records:Array<[string,any]>=[
    ['ExecutionPlanDefinition',execution.definition],
    ['ExecutionPlanRevision',execution.revision],
    ...execution.scopeBindings.map(x=>['ExecutionScopeBinding',x] as [string,any]),
    ...execution.regions.map(x=>['ExecutionRegion',x] as [string,any]),
    ...execution.elements.map(x=>['ExecutionElement',x] as [string,any]),
    ...execution.relations.map(x=>['ExecutionRelation',x] as [string,any]),
    ...execution.requirements.map(x=>['ExecutionRequirement',x] as [string,any]),
    ...execution.mappingTraces.map(x=>['ExecutionSemanticMappingTrace',x] as [string,any]),
    ...execution.scopeAssessments.map(x=>['ExecutionScopeAssessment',x] as [string,any]),
    ['ExecutionPlanAssessment',execution.assessment],
  ];
  for(const [kind,payload] of records)append(repo,kind,payload,at,'phase5-generic-execution-draft-v0.1');
}

export function persistGenericResolvedExecutionPlan(repo:ImmutableDocumentRepository,execution:GenericResolvedExecutionBundle):void{
  const at=execution.revision.createdAt;
  const records:Array<[string,any]>=[
    ['ExecutionPlanDefinition',execution.definition],
    ['ExecutionPlanRevision',execution.revision],
    ...execution.scopeBindings.map(x=>['ExecutionScopeBinding',x] as [string,any]),
    ...execution.regions.map(x=>['ExecutionRegion',x] as [string,any]),
    ...execution.elements.map(x=>['ExecutionElement',x] as [string,any]),
    ...execution.relations.map(x=>['ExecutionRelation',x] as [string,any]),
    ...execution.capabilityUses.map(x=>['CapabilityUseOccurrence',x] as [string,any]),
    ...execution.dataDependencies.map(x=>['ExecutionDataDependency',x] as [string,any]),
    ...execution.requirements.map(x=>['ExecutionRequirement',x] as [string,any]),
    ...execution.mappingTraces.map(x=>['ExecutionSemanticMappingTrace',x] as [string,any]),
    ...execution.scopeAssessments.map(x=>['ExecutionScopeAssessment',x] as [string,any]),
    ['ExecutionPlanAssessment',execution.assessment],
    ...execution.coordinationResolutions.map(x=>['ExecutionCoordinationResolution',x] as [string,any]),
    ...execution.relationResolutions.map(x=>['ExecutionRelationResolution',x] as [string,any]),
  ];
  for(const [kind,payload] of records)append(repo,kind,payload,at,'phase5-generic-resolved-execution-v0.1');
}

export function persistAutomationExecutionPlanReview(
  repo: ImmutableDocumentRepository,
  bundle: AutomationExecutionPlanReviewBundle,
): void {
  persistGenericResolvedExecutionPlan(repo, bundle.execution);
  append(
    repo,
    'AutomationExecutionPlanReview',
    bundle.review,
    bundle.review.createdAt,
    'i8-05-automation-execution-plan-review-v0.1',
  );
}

export function persistAutomationDesignApproval(
  repo: ImmutableDocumentRepository,
  approval: AutomationDesignApprovalRecord,
): void {
  const existingForReview = repo.listByKind<AutomationDesignApprovalRecord>('AutomationDesignApprovalRecord')
    .find((document) => document.payload.automationExecutionPlanReviewRef === approval.automationExecutionPlanReviewRef);
  if (existingForReview && existingForReview.id !== approval.id) {
    throw new TypeError('automation ExecutionPlan review already has a different append-only approval decision');
  }
  append(
    repo,
    'AutomationDesignApprovalRecord',
    approval,
    approval.approvedAt,
    'i8-06-automation-design-approval-v0.1',
  );
}

export function persistApprovedAutomationTemporalMapping(
  repo: ImmutableDocumentRepository,
  mapping: ReferenceTemporalMappingBundle,
): void {
  const at = mapping.revision.createdAt;
  const records:Array<[string,any]> = [
    ['TemporalMappingDefinition', mapping.definition],
    ['TemporalMappingRevision', mapping.revision],
    ['TemporalFeatureProfile', mapping.featureProfile],
    ...mapping.workflowBoundaries.map(x=>['TemporalWorkflowBoundaryMapping',x] as [string,any]),
    ...mapping.groups.map(x=>['TemporalMappingGroup',x] as [string,any]),
    ...mapping.units.map(x=>['TemporalMappingUnit',x] as [string,any]),
    ...mapping.alternatives.map(x=>['TemporalMappingAlternative',x] as [string,any]),
    ...mapping.decisions.map(x=>['TemporalMappingDecision',x] as [string,any]),
    ...mapping.unitCompatibility.map(x=>['TemporalMappingUnitCompatibility',x] as [string,any]),
    ['TemporalFeatureCompatibilityAssessment', mapping.compatibilityAssessment],
    ['TemporalMappingAssessment', mapping.assessment],
  ];
  for (const [kind,payload] of records) append(repo,kind,payload,at,'i9-01-approved-temporal-mapping-v0.1');
}
