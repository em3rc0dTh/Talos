import test from 'node:test';
import assert from 'node:assert/strict';
import { routeAutomationProposal } from '../packages/capability/src/automation-proposal-routing.ts';
import {
  TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING,
  withTalosBuiltinAutomationOfferings,
} from '../packages/capability/src/automation-proposal-readiness.ts';
import type { AutomationProposalProvider, AutomationProposalProviderContext } from '../packages/capability/src/automation-proposal.ts';
import type { CapabilityDesignBundle } from '../packages/capability/src/generic-design.ts';
import type { ProcessRevision } from '../packages/semantic-core/src/types.ts';

const NOW='2026-08-28T23:50:00.000Z';
const SUBJECT='prc_generic_roleless_subject';
const REQUIREMENT='cap_generic_roleless_requirement';

function process():ProcessRevision{return{
  id:'prc_generic_roleless_revision' as any,processDefinitionId:'prc_generic_roleless_definition' as any,revision:1,createdAt:NOW,parentRevisionIds:[],derivationKind:'HUMAN_CONFIRMATION',sourceArtifactIds:['src_generic' as any],
  nodes:[{id:SUBJECT as any,kind:'ACTION',name:'Perform confirmed physical work',actorRefs:[],inputRefs:[],outputRefs:[],ruleRefs:[],truthClass:'CONFIRMED',provenanceRefs:[],sourceExtensionRefs:[]}],
  edges:[],actors:[],variables:[],dataObjects:[],rules:[],semanticClaims:[],conflictRecords:[],annotations:[],provenanceLinks:[],sourceExtensions:[],semanticStatus:'VALIDATED',executionReadiness:'READY_FOR_AUTOMATION_DESIGN',validationFindingRefs:[],
};}
function design():CapabilityDesignBundle{return{
  designRevision:{id:'cap_generic_roleless_design' as any,semanticFreezeRecordId:'rvw_freeze' as any,scopeFreezeRefs:['rvw_scope' as any],processRevisionId:'prc_generic_roleless_revision' as any,validationAssessmentRefs:['val_assessment' as any],requirementRefs:[REQUIREMENT as any],unresolvedRequirementRefs:[REQUIREMENT as any],designState:'NEEDS_DESIGN_DECISION',designDigest:'digest',createdAt:NOW},
  requirements:[{id:REQUIREMENT as any,capabilityDesignRevisionId:'cap_generic_roleless_design' as any,semanticScopeRef:'val_scope',semanticSubjectRefs:[SUBJECT],family:'SOURCE_DEFINED',operationIntent:'PERFORM_ACTION',actorOrResponsibilityRefs:[],dataObjectRefs:[],requirementBasis:'SEMANTIC_DERIVED',constraintRefs:[],safetyRequirementRefs:[],requirementState:'UNRESOLVED',provenanceTraceRef:'cap_trace' as any,facetRefs:[]}],
  facets:[],provenanceTraces:[{id:'cap_trace' as any,requirementId:REQUIREMENT as any,semanticFreezeRecordId:'rvw_freeze' as any,scopeFreezeRef:'rvw_scope' as any,processRevisionId:'prc_generic_roleless_revision' as any,semanticSubjectRefs:[SUBJECT],semanticClaimRefs:[],validationAssessmentRefs:['val_assessment' as any],derivationMethod:'FROZEN_ACTION_TO_GENERIC_CAPABILITY_REQUIREMENT',designerVersion:'test',createdAt:NOW}],designerRef:'test',designerVersion:'test',
};}
function context():AutomationProposalProviderContext{return{process:process(),design:design(),availableOfferings:withTalosBuiltinAutomationOfferings([]) as any};}
function raw(question:{question:string;reason:string;material:boolean}){return{
  steps:[{capabilityRequirementRef:REQUIREMENT,semanticSubjectRefs:[SUBJECT],proposedFamily:'HUMAN_INTERACTION',canonicalName:'Workflow-native human coordination',implementationKind:'HUMAN_SERVICE',implementationRef:`offering:${TALOS_WORKFLOW_NATIVE_HUMAN_OFFERING.id}`,rationale:'Confirmed work is human and may be assigned at runtime without inventing a business role.',confidence:0.95,human:{interactionKind:'MANUAL_ACTION',responsibilityKind:'PERFORMER',roleRefs:[],outcomeCode:'COMPLETED',outcomeBusinessMeaning:'The human work is completed.'}}],
  orchestration:[],unresolvedQuestions:[{semanticSubjectRefs:[SUBJECT],...question}],assumptions:[],diagnostics:[],
};}
function provider(rawProposal:unknown):AutomationProposalProvider{return{providerId:'TEST_NORMALIZATION_PROVIDER',modelRef:'test-model',pipelineVersion:'test-pipeline',async propose(){return{providerId:'TEST_NORMALIZATION_PROVIDER',modelRef:'test-model',pipelineVersion:'test-pipeline',rawProposal};}};}

test('role-only model question becomes non-material when governed ANY_ELIGIBLE human assignment is already valid',async()=>{
  const result=await routeAutomationProposal(context(),provider(raw({question:'Which role or actor is responsible for performing this work?',reason:'No organizational participant was named in the source.',material:true})),undefined,NOW);
  assert.equal(result.decision,'PRIMARY_ACCEPTED');
  assert.equal(result.primary.result,'COMPLETE');
  assert.equal(result.selectedProposal?.status,'COMPLETE');
  assert.equal(result.selectedProposal?.unresolvedQuestions[0]?.material,false);
  assert.match(result.selectedProposal?.diagnostics.join('\n')??'',/NON_MATERIAL_RUNTIME_PARTICIPANT_ASSIGNMENT/);
  assert.equal(result.selectedProposal?.createsBinding,false);
  assert.equal(result.selectedProposal?.grantsAuthority,false);
});

test('non-participant material question remains fail-closed',async()=>{
  const result=await routeAutomationProposal(context(),provider(raw({question:'What evidence proves this work completed successfully?',reason:'The required completion evidence is not established.',material:true})),undefined,NOW);
  assert.equal(result.decision,'UNRESOLVED_AFTER_FALLBACK');
  assert.equal(result.primary.result,'PARTIAL');
  assert.equal(result.primary.proposal?.unresolvedQuestions[0]?.material,true);
});
