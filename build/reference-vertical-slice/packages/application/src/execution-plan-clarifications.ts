import type { ProcessRevision } from '../../semantic-core/src/types.ts';
import type { AutomationExecutionPlanReviewBundle, AutomationExecutionDesignDecisions } from '../../execution/src/automation-execution-review.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { OneAppAutomationContext } from './one-app-automation.ts';

export interface ExecutionPlanClarification {
  id:string;
  kind:'RELATION_COORDINATION'|'SUBPROCESS_COORDINATION'|'PROCESS_DETAIL';
  semanticRef:string;
  title:string;
  question:string;
  route:'EXECUTION_DESIGN'|'PROCESS_REVIEW';
  choices:Array<{value:string;label:string}>;
}

/** Describe actual plan blockers using business names, never guesses about the
 * missing data. Source meaning remains immutable during execution design. */
export function describeExecutionPlanClarifications(process:ProcessRevision, bundle:AutomationExecutionPlanReviewBundle):ExecutionPlanClarification[] {
  const questions:ExecutionPlanClarification[]=[];
  const name=(id:string)=>process.nodes.find(node=>node.id===id)?.name||'this activity';
  for(const relation of bundle.execution.relations.filter(item=>item.relationState!=='COMPLETE')){
    const edge=process.edges.find(item=>relation.semanticRelationRefs.includes(item.id));
    if(!edge)continue;
    const coordination=relation.relationKind==='SOURCE_DEFINED';
    const sourceIsWait=process.nodes.some(node=>node.id===edge.sourceNodeId&&node.kind==='WAIT');
    questions.push({
      id:relation.id,
      kind:coordination?'RELATION_COORDINATION':'PROCESS_DETAIL',
      semanticRef:edge.id,
      title:`${name(edge.sourceNodeId)} → ${name(edge.targetNodeId)}`,
      question:coordination?'How should the process continue along this connection?':'When should the process follow this path? Its business condition is not yet structured.',
      route:coordination?'EXECUTION_DESIGN':'PROCESS_REVIEW',
      choices:coordination?[{value:'CONTINUE',label:'Continue with the next activity'},...(sourceIsWait?[{value:'RESUME_AFTER_WAIT',label:'Continue after the confirmed wait finishes'}]:[])]:[],
    });
  }
  for(const element of bundle.execution.elements.filter(item=>item.designState!=='COMPLETE')){
    const node=process.nodes.find(item=>element.semanticSubjectRefs.includes(item.id));
    if(!node)continue;
    const subprocess=node.kind==='SUBPROCESS';
    questions.push({id:element.id,kind:subprocess?'SUBPROCESS_COORDINATION':'PROCESS_DETAIL',semanticRef:node.id,title:node.name||'Process activity',question:subprocess?'Should this part run within the same process or as a separate workflow?':node.kind==='WAIT'?'What exactly allows this wait to finish? Review its duration, response or timezone.':'This activity still needs a business detail before the design can continue.',route:subprocess?'EXECUTION_DESIGN':'PROCESS_REVIEW',choices:subprocess?[{value:'SAME_PROCESS',label:'Within the same process'},{value:'SEPARATE_WORKFLOW',label:'As a separate workflow'}]:[]});
  }
  if(bundle.review.state!=='READY_FOR_AUTOMATION_APPROVAL'&&!questions.length){
    questions.push({id:bundle.review.id,kind:'PROCESS_DETAIL',semanticRef:process.id,title:'Process design',question:'The plan still contains an unresolved requirement. Review the process details before approving it.',route:'PROCESS_REVIEW',choices:[]});
  }
  return questions;
}

export function resolveExecutionPlanClarifications(
  process:ProcessRevision,
  bundle:AutomationExecutionPlanReviewBundle,
  answers:Array<{questionId:string;choice:string}>,
  authority:{authorityRef:string;decidedBy:string;rationale:string},
):AutomationExecutionDesignDecisions {
  if(!authority.authorityRef.trim()||!authority.decidedBy.trim()||!authority.rationale.trim())throw new TypeError('Execution answers require explicit design authority');
  const questions=describeExecutionPlanClarifications(process,bundle);
  const seen=new Set<string>();
  const decisions:AutomationExecutionDesignDecisions={
    relationResolutions:bundle.execution.relationResolutions.map(item=>({semanticRelationRef:item.semanticRelationRef,executionRelationKind:item.resolvedExecutionRelationKind,authorityRef:item.authorityRef,decidedBy:item.decidedBy,rationale:item.rationale})),
    subprocessResolutions:bundle.execution.coordinationResolutions.map(item=>({semanticSubjectRef:item.semanticSubjectRef,boundaryKind:item.resolutionKind,authorityRef:item.authorityRef,decidedBy:item.decidedBy,rationale:item.rationale})),
  };
  if(!answers.length)throw new TypeError('Choose at least one pending execution answer');
  for(const answer of answers){
    const question=questions.find(item=>item.id===answer.questionId);
    if(!question||question.route!=='EXECUTION_DESIGN'||!question.choices.some(choice=>choice.value===answer.choice)||seen.has(question.id))throw new TypeError('Execution answer does not match an exact pending design question');
    seen.add(question.id);
    if(question.kind==='RELATION_COORDINATION')decisions.relationResolutions!.push({semanticRelationRef:question.semanticRef,executionRelationKind:answer.choice==='CONTINUE'?'SEQUENCE':'WAIT_RESUME',...authority});
    else if(question.kind==='SUBPROCESS_COORDINATION')decisions.subprocessResolutions!.push({semanticSubjectRef:question.semanticRef,boundaryKind:answer.choice==='SAME_PROCESS'?'INLINE_COORDINATION':'SEPARATE_EXECUTION_BOUNDARY',...authority});
  }
  return decisions;
}

/** Restore reviewed design facts only. No approval, runtime policy, deployment
 * approval or workflow-start permission is part of this recovery projection. */
export function recoverReviewedExecutionDesign(repo:ImmutableDocumentRepository,reviewId:string) {
  const get=(id:string,kind:string):any=>{const document=repo.get<any>(id as any);if(!document||document.aggregateKind!==kind)throw new TypeError(`Missing durable ${kind}`);return document.payload};
  const review=get(reviewId,'AutomationExecutionPlanReview');
  if(repo.listByKind<any>('AutomationDesignApprovalRecord').some(document=>document.payload.automationExecutionPlanReviewRef===review.id||document.payload.automationDesignWorkspaceRevisionRef===review.automationDesignWorkspaceRevisionRef))throw new TypeError('Use approved-design recovery for this reviewed plan');
  const process=get(review.processRevisionRef,'ProcessRevision');
  const revision=get(review.executionPlanRevisionRef,'ExecutionPlanRevision');
  if(revision.processRevisionId!==process.id||revision.capabilityDesignRevisionId!==review.resolvedCapabilityDesignRevisionRef)throw new TypeError('Reviewed execution lineage mismatch');
  const designRevision=get(revision.capabilityDesignRevisionId,'CapabilityDesignRevision');
  const freeze=get(revision.semanticFreezeRecordId,'SemanticFreezeRecord');
  const scopeFreeze=get(revision.scopeFreezeRefs[0],'ScopeFreezeRecord');
  const assessment=get(revision.validationAssessmentRefs[0],'ValidationAssessment');
  if(freeze.processRevisionId!==process.id||scopeFreeze.semanticFreezeRecordId!==freeze.id||assessment.processRevisionId!==process.id)throw new TypeError('Reviewed semantic freeze lineage mismatch');
  const records=(ids:string[],kind:string)=>(ids||[]).map(id=>get(id,kind));
  const requirements=records(designRevision.requirementRefs,'CapabilityRequirement');
  const bindings=records(review.capabilityBindingRevisionRefs,'CapabilityBindingRevision');
  const humanDesigns=records(revision.humanInteractionDesignRevisionRefs,'HumanInteractionDesignRevision');
  const humanOutcomeContracts=records(humanDesigns.map(item=>item.outcomeContractRef),'HumanOutcomeContract');
  const selection={workspaceRevisionRef:review.automationDesignWorkspaceRevisionRef,baseCapabilityDesignRevisionRef:designRevision.supersedesCapabilityDesignRef,resolvedCapabilityDesignRevisionRef:designRevision.id,traces:records(review.capabilitySelectionTraceRefs,'AutomationCapabilitySelectionTrace'),resolution:{designRevision,requirements,bindingRevisions:bindings,bindingAssessments:repo.listByKind<any>('CapabilityBindingAssessment').map(document=>document.payload).filter(item=>bindings.some(binding=>binding.id===item.capabilityBindingRevisionId)),humanDesigns,participantRequirements:records(humanDesigns.map(item=>item.participantRequirementRef),'ParticipantRequirement'),humanOutcomeContracts,humanOutcomes:records(humanOutcomeContracts.flatMap(item=>item.outcomeRefs),'HumanOutcome')},createsCapabilitySelection:true,createsBinding:true,executionPlanAuthorized:false,temporalMappingAuthorized:false,deploymentAuthorized:false};
  const execution:any={definition:get(revision.executionPlanDefinitionId,'ExecutionPlanDefinition'),revision,assessment:get(review.executionPlanAssessmentRef,'ExecutionPlanAssessment'),plannerVersion:'durable-reviewed-design-recovery-v1'};
  for(const [field,refs,kind] of [
    ['scopeBindings','executionScopeBindingRefs','ExecutionScopeBinding'],['regions','executionRegionRefs','ExecutionRegion'],['elements','executionElementRefs','ExecutionElement'],['relations','executionRelationRefs','ExecutionRelation'],['capabilityUses','capabilityUseOccurrenceRefs','CapabilityUseOccurrence'],['dataDependencies','executionDataDependencyRefs','ExecutionDataDependency'],['requirements','executionRequirementRefs','ExecutionRequirement'],['mappingTraces','semanticMappingTraceRefs','ExecutionSemanticMappingTrace'],['scopeAssessments','executionScopeAssessmentRefs','ExecutionScopeAssessment'],
  ])execution[field!]=records(revision[refs!],kind!);
  execution.coordinationResolutions=repo.listByKind<any>('ExecutionCoordinationResolution').map(document=>document.payload).filter(item=>item.executionPlanRevisionId===revision.id);
  execution.relationResolutions=repo.listByKind<any>('ExecutionRelationResolution').map(document=>document.payload).filter(item=>item.executionPlanRevisionId===revision.id);
  const executionReview={review,execution} as AutomationExecutionPlanReviewBundle;
  const scope=get(assessment.primaryScopeRef,'AssessmentScope');
  const context={process,scope,assessment,freeze,scopeFreeze,selection,executionReview} as unknown as OneAppAutomationContext;
  const acceptedSteps=selection.traces.map(trace=>{
    const requirement=get(trace.capabilityRequirementRef,'CapabilityRequirement');
    const node=process.nodes.find((item:any)=>requirement.semanticSubjectRefs.includes(item.id));
    const resolvedRequirement=requirements.find(item=>item.semanticSubjectRefs.includes(node?.id));
    const human=humanDesigns.find(item=>item.capabilityRequirementId===resolvedRequirement?.id);
    const participant=selection.resolution.participantRequirements.find(item=>item.id===human?.participantRequirementRef);
    const responsibility=participant?.actorTypeConstraints?.find((item:string)=>item.startsWith('BUSINESS_RESPONSIBILITY:'))?.slice('BUSINESS_RESPONSIBILITY:'.length);
    return{semanticSubjectRef:node?.id,businessStepName:node?.name,family:trace.selectedFamily,direction:trace.selectedOfferingCanonicalName,participantLabel:responsibility||null,basis:'ACCEPTED_DESIGN'};
  });
  return{context,executionReview,acceptedSteps,workspaceId:review.automationDesignWorkspaceRevisionRef};
}
