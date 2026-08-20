import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { GenericResolvedExecutionBundle } from '../../execution/src/generic-resolved-plan.ts';
import type {
  ReferenceTemporalMappingBundle,
  TemporalConstructKind,
  TemporalMappingDecision,
  TemporalMappingGroup,
  TemporalMappingUnit,
  TemporalMappingUnitCompatibility,
} from './types.ts';

const tmp=(seed:string)=>createOpaqueId('temporalMapping',seed);
const DESIGNER_VERSION='i6-generic-temporal-mapper-v0.1';

export interface GenericWaitTemporalResolution {
  executionElementRef:string;
  constructKind:'DURABLE_TIMER'|'WORKFLOW_CONDITION';
  authorityRef:string;
  decidedBy:string;
  rationale:string;
}
export interface GenericHumanTemporalResolution {
  executionElementRef:string;
  messageKind:'UPDATE_HANDLER'|'SIGNAL_HANDLER';
  authorityRef:string;
  decidedBy:string;
  rationale:string;
}
export interface GenericTemporalResolutionSet {
  waits:GenericWaitTemporalResolution[];
  humans:GenericHumanTemporalResolution[];
}

function nonEmpty(value:string,label:string):void{if(!value.trim())throw new TypeError(`${label} is required`);}
function validateResolutionAuthority(x:{authorityRef:string;decidedBy:string;rationale:string}):void{
  nonEmpty(x.authorityRef,'authorityRef');nonEmpty(x.decidedBy,'decidedBy');nonEmpty(x.rationale,'rationale');
}

export function designGenericTemporalMapping(
  execution:GenericResolvedExecutionBundle,
  resolutions:GenericTemporalResolutionSet,
  createdAt:string,
):ReferenceTemporalMappingBundle{
  if(execution.revision.readiness!=='READY_FOR_TEMPORAL_MAPPING_DESIGN'||execution.assessment.readiness!=='READY_FOR_TEMPORAL_MAPPING_DESIGN'){
    throw new TypeError('generic Temporal mapping requires READY_FOR_TEMPORAL_MAPPING_DESIGN');
  }
  const waitByElement=new Map(resolutions.waits.map(x=>[x.executionElementRef,x]));
  const humanByElement=new Map(resolutions.humans.map(x=>[x.executionElementRef,x]));
  if(waitByElement.size!==resolutions.waits.length)throw new TypeError('duplicate WAIT Temporal resolution');
  if(humanByElement.size!==resolutions.humans.length)throw new TypeError('duplicate human Temporal resolution');
  for(const x of [...resolutions.waits,...resolutions.humans])validateResolutionAuthority(x);

  const waits=execution.elements.filter(e=>e.kind==='WAIT_COORDINATION');
  const humans=execution.elements.filter(e=>e.kind==='HUMAN_COORDINATION');
  if(waits.some(e=>!waitByElement.has(e.id)))throw new TypeError('every WAIT_COORDINATION requires explicit Temporal mapping resolution');
  if(humans.some(e=>!humanByElement.has(e.id)))throw new TypeError('every HUMAN_COORDINATION requires explicit Temporal mapping resolution');
  for(const ref of waitByElement.keys())if(!waits.some(e=>e.id===ref))throw new TypeError(`WAIT resolution targets non-WAIT element ${ref}`);
  for(const ref of humanByElement.keys())if(!humans.some(e=>e.id===ref))throw new TypeError(`human resolution targets non-human element ${ref}`);

  const definitionId=tmp(`generic-mapping-definition:${execution.definition.id}`);
  const resolutionDigest=digestDeterministicJson({
    executionPlanRevisionRef:execution.revision.id,
    waits:resolutions.waits.map(x=>({...x})).sort((a,b)=>a.executionElementRef.localeCompare(b.executionElementRef)),
    humans:resolutions.humans.map(x=>({...x})).sort((a,b)=>a.executionElementRef.localeCompare(b.executionElementRef)),
    designerVersion:DESIGNER_VERSION,
  });
  const revisionId=tmp(`generic-mapping-revision:${execution.revision.id}:${resolutionDigest}`);
  const profileId=tmp(`generic-feature-profile:${revisionId}`);
  const supportedConstructKinds:TemporalConstructKind[]=['WORKFLOW_LOGIC','ACTIVITY','UPDATE_HANDLER','SIGNAL_HANDLER','WORKFLOW_CONDITION','DURABLE_TIMER','CHILD_WORKFLOW','NO_DIRECT_PRIMITIVE'];
  const featureProfile={
    id:profileId,
    profileVersion:'talos-generic-temporal-profile-v0.1',
    platformFamily:'TEMPORAL_PLATFORM_GENERIC' as const,
    sdkFamily:'typescript',
    supportedConstructKinds,
    supportedFeatureRefs:['workflow-definition','activity-definition','workflow-message-passing:update','workflow-message-passing:signal','workflow-condition','durable-timer','child-workflow'],
    createdAt,
  };
  const scope=execution.scopeBindings[0],root=execution.regions[0];
  if(!scope||!root)throw new TypeError('generic Temporal mapping requires root execution scope/region');
  const boundary={
    id:tmp(`generic-workflow-boundary:${revisionId}:${scope.id}`),
    temporalMappingRevisionId:revisionId,
    executionScopeBindingRef:scope.id,
    executionRegionRefs:[root.id],
    boundaryKind:'SINGLE_WORKFLOW_CANDIDATE' as const,
    role:'ROOT_ORCHESTRATOR' as const,
    rationale:'The accepted execution scope is represented by one root orchestration Workflow; explicit subprocess resolutions may introduce child boundaries.',
    mappingState:'ACCEPTED' as const,
  };

  const groups:TemporalMappingGroup[]=[],units:TemporalMappingUnit[]=[],decisions:TemporalMappingDecision[]=[];
  const add=(key:string,subjects:string[],groupKind:TemporalMappingGroup['groupKind'],specs:Array<{kind:TemporalConstructKind;role:string;rationale:string;features:string[]}>,basis:TemporalMappingDecision['decisionBasis'],rationale:string)=>{
    const groupId=tmp(`generic-group:${revisionId}:${key}`),refs=[] as any[];
    for(let i=0;i<specs.length;i++){
      const s=specs[i],id=tmp(`generic-unit:${groupId}:${i}:${s.kind}`);
      units.push({id,temporalMappingRevisionId:revisionId,mappingGroupRef:groupId,executionSubjectRefs:subjects,constructKind:s.kind,role:s.role,rationale:s.rationale,requiredFeatureRefs:s.features,mappingState:'ACCEPTED'});
      refs.push(id);
    }
    groups.push({id:groupId,temporalMappingRevisionId:revisionId,executionSubjectRefs:subjects,groupKind,mappingUnitRefs:refs,rationale});
    decisions.push({id:tmp(`generic-decision:${groupId}`),temporalMappingRevisionId:revisionId,executionSubjectRefs:subjects,selectedMappingGroupRef:groupId,rejectedAlternativeRefs:[],decisionBasis:basis,rationale,decidedAt:createdAt});
  };

  for(const element of execution.elements){
    const subjects=[element.id,...element.capabilityUseRefs];
    const coordination=execution.coordinationResolutions.find(x=>x.semanticSubjectRef===element.semanticSubjectRefs[0]);
    if(coordination?.resolutionKind==='SEPARATE_EXECUTION_BOUNDARY'){
      add(element.id,subjects,'SINGLE_PRIMITIVE',[{kind:'CHILD_WORKFLOW',role:'EXPLICIT_SUBPROCESS_BOUNDARY',rationale:'An authority-backed execution design selected a separate execution boundary for this business subprocess.',features:['child-workflow']}],'EXECUTION_SEMANTICS','Explicit execution-boundary authority selects a Child Workflow candidate; the business subprocess label itself did not.');
      continue;
    }
    switch(element.kind){
      case 'CAPABILITY_INVOCATION':
        add(element.id,subjects,'SINGLE_PRIMITIVE',[{kind:'ACTIVITY',role:'SELECTED_CAPABILITY_SIDE_EFFECT',rationale:'A pinned CapabilityUseOccurrence crosses the deterministic Workflow boundary and is executed through an Activity adapter.',features:['activity-definition']}],'CAPABILITY_SIDE_EFFECT','Selected capability invocation maps to an Activity adapter; provider choice remains pinned in the capability binding.');
        break;
      case 'WAIT_COORDINATION':{
        const r=waitByElement.get(element.id)!;
        add(element.id,[element.id],'SINGLE_PRIMITIVE',[{kind:r.constructKind,role:r.constructKind==='DURABLE_TIMER'?'BUSINESS_WAIT':'WAIT_FOR_WORKFLOW_STATE',rationale:r.rationale,features:[r.constructKind==='DURABLE_TIMER'?'durable-timer':'workflow-condition']}],'EXECUTION_SEMANTICS',`Explicit wait mapping decision by ${r.decidedBy}; authority=${r.authorityRef}.`);
        break;
      }
      case 'HUMAN_COORDINATION':{
        const r=humanByElement.get(element.id)!;
        add(element.id,subjects,'COMPOSITE_PATTERN',[
          {kind:r.messageKind,role:'TRACKED_HUMAN_SUBMISSION',rationale:r.rationale,features:[r.messageKind==='UPDATE_HANDLER'?'workflow-message-passing:update':'workflow-message-passing:signal']},
          {kind:'WORKFLOW_CONDITION',role:'WAIT_FOR_ACCEPTED_HUMAN_OUTCOME',rationale:'Workflow continuation waits deterministically for accepted human-interaction state.',features:['workflow-condition']},
        ],'INTERACTION_SEMANTICS',`Explicit human interaction mapping decision by ${r.decidedBy}; authority=${r.authorityRef}.`);
        break;
      }
      case 'DECISION_COORDINATION':
        add(element.id,[element.id],'SINGLE_PRIMITIVE',[{kind:'WORKFLOW_LOGIC',role:'BUSINESS_BRANCH_COORDINATION',rationale:'Structured branch coordination is deterministic Workflow logic.',features:['workflow-definition']}],'EXECUTION_SEMANTICS','Decision coordination remains in deterministic Workflow logic.');
        break;
      case 'COMPLETION_COORDINATION':
        add(element.id,[element.id],'SINGLE_PRIMITIVE',[{kind:'WORKFLOW_LOGIC',role:'BUSINESS_COMPLETION',rationale:'Business completion is represented by deterministic Workflow state/return.',features:['workflow-definition']}],'EXECUTION_SEMANTICS','Completion requires no external primitive.');
        break;
      case 'STATE_COORDINATION':
      case 'COORDINATION_STEP':
        add(element.id,[element.id],'SINGLE_PRIMITIVE',[{kind:'WORKFLOW_LOGIC',role:'DETERMINISTIC_COORDINATION',rationale:'Pure accepted coordination remains inside Workflow logic.',features:['workflow-definition']}],'EXECUTION_SEMANTICS','Pure coordination does not require an external side effect.');
        break;
      default:
        throw new TypeError(`generic Temporal mapping does not accept unresolved execution element kind ${element.kind}`);
    }
  }

  const compat:TemporalMappingUnitCompatibility[]=units.map(u=>({
    id:tmp(`generic-compat:${u.id}`),temporalMappingUnitRef:u.id,requiredConstructKind:u.constructKind,requiredFeatureRefs:u.requiredFeatureRefs,
    result:supportedConstructKinds.includes(u.constructKind)?'COMPATIBLE':'INCOMPATIBLE',
  }));
  const compatibilityAssessment={
    id:tmp(`generic-feature-compatibility:${revisionId}`),temporalMappingRevisionId:revisionId,temporalFeatureProfileRef:profileId,
    mappingUnitCompatibilityRefs:compat.map(x=>x.id),findingRefs:[],result:compat.every(x=>x.result==='COMPATIBLE')?'COMPATIBLE' as const:'INCOMPATIBLE' as const,assessedAt:createdAt,
  };
  const readiness=compatibilityAssessment.result==='COMPATIBLE'?'READY_FOR_RUNTIME_POLICY_DESIGN' as const:'NEEDS_TEMPORAL_FEATURE_COMPATIBILITY' as const;
  const assessment={id:tmp(`generic-mapping-assessment:${revisionId}`),temporalMappingRevisionId:revisionId,findingRefs:[],readiness,assessedAt:createdAt};
  const mappingDigest=digestDeterministicJson({executionPlanRevisionRef:execution.revision.id,featureProfile,workflowBoundary:boundary,groups,units,decisions,compatibilityAssessment});
  const revision={id:revisionId,temporalMappingDefinitionId:definitionId,revision:1,executionPlanRevisionRef:execution.revision.id,workflowBoundaryMappingRefs:[boundary.id],mappingGroupRefs:groups.map(x=>x.id),mappingUnitRefs:units.map(x=>x.id),mappingAlternativeRefs:[],mappingDecisionRefs:decisions.map(x=>x.id),temporalFeatureProfileRef:profileId,featureCompatibilityAssessmentRef:compatibilityAssessment.id,temporalMappingAssessmentRef:assessment.id,mappingDigest,createdAt,parentRevisionRefs:[]};
  const definition={id:definitionId,executionPlanDefinitionRef:execution.definition.id,canonicalName:'Generic Temporal mapping',createdAt,revisionRefs:[revisionId]};
  return{definition,revision,featureProfile,workflowBoundaries:[boundary],groups,units,alternatives:[],decisions,unitCompatibility:compat,compatibilityAssessment,assessment};
}
