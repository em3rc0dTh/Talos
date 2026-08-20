import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { CanvasDefinition, CanvasId, CanvasRevision, CanvasChangeSet } from '../../canvas-source/src/types.ts';
import { applyCanvasChangeSet } from '../../canvas-source/src/revision.ts';
import { CanvasDomainStore } from '../../canvas-source/src/store.ts';
import { preserveCanvasRevision } from '../../canvas-source/src/preservation.ts';
import { adaptPreservedCanvas } from '../../canvas-source/src/adapter.ts';
import type { ProcessRevision, SourceOccurrence, ProvenanceLink, EvidenceFragment, ValidationBundle, ValidationAssessment } from '../../semantic-core/src/types.ts';
import type { FindingDisposition } from '../../semantic-core/src/finding-disposition.ts';
import { validateProcessRevision } from '../../semantic-core/src/validation.ts';
import { normalizeAdapterResult } from './normalization.ts';
import { persistValidationBundle } from './validation-persistence.ts';
import { generateExplanationDraft, type ExplanationBundle } from '../../review/src/explanation.ts';
import { createInitialReviewContext, createAcceptedReviewTransition, type ReviewContextBundle } from '../../review/src/workspace.ts';
import { evaluateCorrectionDiff } from '../../review/src/diff.ts';
import { evaluateFreeze } from '../../review/src/freeze.ts';
import type { BaselineReconciliationAnalysis, BaselineTransitionCandidate, BaselineTransitionDecision, FreezeRequestPayload, ReviewAuthoredSourceRevision, ReviewCommand, ReviewCommandApplication, ReviewConfirmationRecord, ReviewId, ScopeFreezeRequest, SemanticFreezeApplication, SemanticFreezeRecord, ScopeFreezeRecord, ScopeFreezeOutcome, SemanticDiffGuard } from '../../review/src/types.ts';

function append<T>(repo:ImmutableDocumentRepository,id:any,kind:string,payload:T,at:string){repo.append({id,aggregateKind:kind,schemaVersion:'review-v0.2-reference',payload,createdAt:at});}
function persistExplanation(repo:ImmutableDocumentRepository,b:ExplanationBundle){const at=b.draft.generatedAt;for(const x of b.facets)append(repo,x.id,'ExplanationEvidenceFacet',x,at);for(const x of b.propositions)append(repo,x.id,'ExplanationProposition',x,at);for(const x of b.contentBlocks)append(repo,x.id,'ExplanationContentBlock',x,at);append(repo,b.draft.id,'ExplanationDraftSnapshot',b.draft,at);}
function persistContext(repo:ImmutableDocumentRepository,c:ReviewContextBundle){const at=c.workspaceRevision.createdAt;if(!repo.get(c.reviewAuthoredSourceDefinition.id))append(repo,c.reviewAuthoredSourceDefinition.id,'ReviewAuthoredSourceDefinition',c.reviewAuthoredSourceDefinition,c.reviewAuthoredSourceDefinition.createdAt);append(repo,createOpaqueId('review',`workspace-definition-state:${c.workspaceDefinition.id}:${c.workspaceRevision.id}`),'ReviewWorkspaceDefinitionState',c.workspaceDefinition,at);append(repo,c.workspaceRevision.id,'ReviewWorkspaceRevision',c.workspaceRevision,at);for(const x of c.projectionRevision.projectionItemSnapshots)append(repo,x.id,'ProjectionItemSnapshot',x,at);for(const x of c.projectionRevision.projectionBindingSnapshots)append(repo,x.id,'ProjectionBinding',x,at);append(repo,c.projectionRevision.id,'ReviewProjectionRevision',c.projectionRevision,at);append(repo,c.scopeBinding.id,'ReviewScopeSurfaceBinding',c.scopeBinding,at);append(repo,c.baselineBundle.id,'ReviewBaselineBundle',c.baselineBundle,at);}
function persistTransition(repo:ImmutableDocumentRepository,analysis:BaselineReconciliationAnalysis,candidate:BaselineTransitionCandidate,decision:BaselineTransitionDecision,next:ReviewContextBundle){append(repo,analysis.id,'BaselineReconciliationAnalysis',analysis,analysis.createdAt);append(repo,candidate.id,'BaselineTransitionCandidate',candidate,candidate.detectedAt);append(repo,decision.id,'BaselineTransitionDecision',decision,decision.decidedAt);persistContext(repo,next);}

export interface InitializedReview { context:ReviewContextBundle; explanation:ExplanationBundle; }
export function initializeReview(repo:ImmutableDocumentRepository,revision:ProcessRevision,validation:ValidationBundle,options:{createdAt?:string;createdBy?:string;sourceRepresentationRefs?:string[];adapterResultContextRefs?:string[]}={}):InitializedReview{
  const explanation=generateExplanationDraft(revision,validation,{generatedAt:options.createdAt,sourceRepresentationRefs:options.sourceRepresentationRefs});
  const context=createInitialReviewContext(revision,validation,explanation,options);
  persistExplanation(repo,explanation);persistContext(repo,context);return{context,explanation};
}

function nativeElementForCanonical(repo:ImmutableDocumentRepository,canonicalRef:string):CanvasId{
  const link=repo.listByKind<ProvenanceLink>('ProvenanceLink').map(d=>d.payload).find(p=>p.targetRef===canonicalRef&&!p.targetPropertyPath);if(!link?.sourceOccurrenceId)throw new TypeError('canonical target has no source occurrence provenance');
  const occurrence=repo.listByKind<SourceOccurrence>('SourceOccurrence').map(d=>d.payload).find(o=>o.id===link.sourceOccurrenceId);if(!occurrence)throw new TypeError('source occurrence missing');
  const fragment=repo.listByKind<EvidenceFragment>('EvidenceFragment').map(d=>d.payload).find(f=>f.id===occurrence.evidenceFragmentId);if(!fragment?.sourceElementRef)throw new TypeError('source element ref missing');return fragment.sourceElementRef as CanvasId;
}
function findApplicationByClientKey(repo:ImmutableDocumentRepository,key:string|undefined){if(!key)return undefined;return repo.listByKind<ReviewCommand>('ReviewCommand').map(d=>d.payload).find(c=>c.clientRequestKey===key);}

export interface CorrectionResult { application:ReviewCommandApplication; nextContext?:ReviewContextBundle; candidateProcessRevision?:ProcessRevision; candidateValidation?:ValidationBundle; explanation?:ExplanationBundle; confirmation?:ReviewConfirmationRecord; findingDisposition?:FindingDisposition; diffGuard?:SemanticDiffGuard; }
export function applyActorCorrection(repo:ImmutableDocumentRepository,current:ReviewContextBundle,currentProcess:ProcessRevision,currentValidation:ValidationBundle,canvasDefinition:CanvasDefinition,canvasRevision:CanvasRevision,command:ReviewCommand):CorrectionResult{
  const at=command.requestedAt;const existingByKey=findApplicationByClientKey(repo,command.clientRequestKey);if(existingByKey){const prior=repo.listByKind<ReviewCommandApplication>('ReviewCommandApplication').map(d=>d.payload).find(a=>a.reviewCommandId===existingByKey.id);if(existingByKey.id===command.id&&prior)return{application:{...prior,result:'IDEMPOTENT_REPLAY'}};throw new TypeError('clientRequestKey already used by a different review command');}
  append(repo,command.id,'ReviewCommand',command,at);
  if(command.expectedReviewWorkspaceRevisionId!==current.workspaceRevision.id||command.expectedReviewBaselineBundleId!==current.baselineBundle.id){const app:ReviewCommandApplication={id:createOpaqueId('review',`review-app:${command.id}:stale`),reviewCommandId:command.id,result:'REJECTED_STALE',appliedAt:at,diagnosticRefs:['STALE_REVIEW_BASELINE']};append(repo,app.id,'ReviewCommandApplication',app,at);return{application:app};}
  if(command.actionKind!=='CORRECT_PROPERTY'||command.targetSemanticScopeRefs.length!==1||command.targetSubjectRefs.length!==1||command.targetPropertyPath!=='details.actor'||typeof command.proposedValue!=='string'||!command.proposedValue.trim()){const app:ReviewCommandApplication={id:createOpaqueId('review',`review-app:${command.id}:invalid`),reviewCommandId:command.id,result:'REJECTED_INVALID',appliedAt:at,diagnosticRefs:['REFERENCE_ACTOR_CORRECTION_SHAPE_REQUIRED']};append(repo,app.id,'ReviewCommandApplication',app,at);return{application:app};}
  const targetNode=currentProcess.nodes.find(n=>n.id===command.targetSubjectRefs[0]);if(!targetNode)throw new TypeError('target canonical node not found');const nativeElementId=nativeElementForCanonical(repo,targetNode.id);const nativeSnapshot=canvasRevision.elementSnapshots.find(e=>e.canvasElementId===nativeElementId);if(!nativeSnapshot)throw new TypeError('target Canvas element not found');
  const actorName=command.proposedValue.trim();const actorElementId=createOpaqueId('canvas',`review-actor:${current.workspaceDefinition.id}:${actorName}`);const nextCanvasRevisionId=createOpaqueId('canvas',`review-canvas-revision:${canvasRevision.id}:${command.id}`);const changeSet:CanvasChangeSet={id:createOpaqueId('canvas',`review-changeset:${command.id}`),canvasDefinitionId:canvasDefinition.id,baseRevisionId:canvasRevision.id,resultingRevisionId:nextCanvasRevisionId,authoredBy:command.requestedBy,authoredAt:at,operations:[{kind:'ADD_ELEMENT',element:{canvasElementId:actorElementId,kind:'ACTOR',label:actorName,propertyValues:{actorKind:{state:'SET',value:'HUMAN_ROLE'}},actorRefs:[],dataRefs:[],ruleRefs:[],sourceMetadata:{reviewCommandRef:command.id}}},{kind:'UPDATE_ELEMENT_PROPERTY',elementId:nativeElementId,patch:{propertyValues:{...nativeSnapshot.propertyValues,actor:{state:'SET',value:actorName}},actorRefs:[actorElementId]}}]};
  const applied=applyCanvasChangeSet(canvasRevision,changeSet,'SEMANTIC',at);const store=new CanvasDomainStore(repo);store.saveRevisionTransition(canvasDefinition,changeSet,applied);const nextDefinition={...canvasDefinition,latestRevisionId:applied.revision.id};const preserved=preserveCanvasRevision(repo,nextDefinition,applied.revision,{startedAt:at,initiatedBy:command.requestedBy});const attempt=adaptPreservedCanvas(repo,preserved,undefined,{now:at});if(!attempt.result)throw new Error('review correction adapter failed');const normalized=normalizeAdapterResult(repo,attempt.result.id,{normalizedAt:at});const candidateValidation=validateProcessRevision(normalized.processRevision,'AUTOMATION_DESIGN_READINESS',{assessedAt:at,supersedesAssessmentId:currentValidation.assessment.id});persistValidationBundle(repo,candidateValidation);
  const targetAfter=normalized.processRevision.nodes.find(n=>n.id===targetNode.id)!;const authoredRevisionId=createOpaqueId('review',`review-authored-revision:${current.reviewAuthoredSourceDefinition.id}:${command.id}`);const confirmation:ReviewConfirmationRecord={id:createOpaqueId('review',`confirmation:${command.id}:${targetAfter.id}:details.actor`),reviewAuthoredSourceRevisionRef:authoredRevisionId,reviewCommandRef:command.id,subjectRef:targetAfter.id,propertyPath:'details.actor',confirmedValue:actorName,...(command.authorityRef?{authorityRef:command.authorityRef}:{}),confirmedBy:command.requestedBy,confirmedAt:at};const authored:ReviewAuthoredSourceRevision={id:authoredRevisionId,reviewAuthoredSourceDefinitionId:current.reviewAuthoredSourceDefinition.id,...(current.workspaceRevision.activeReviewAuthoredSourceRevisionId?{parentRevisionId:current.workspaceRevision.activeReviewAuthoredSourceRevisionId}:{}),reviewCommandRef:command.id,sourceCanvasRevisionRef:applied.revision.id,claimRefs:[],confirmationRefs:[confirmation.id],createdAt:at,createdBy:command.requestedBy,semanticDigest:digestDeterministicJson({command:command.id,canvasRevision:applied.revision.id,subject:targetAfter.id,property:'details.actor',value:actorName})};append(repo,authored.id,'ReviewAuthoredSourceRevision',authored,at);append(repo,confirmation.id,'ReviewConfirmationRecord',confirmation,at);
  const diff=evaluateCorrectionDiff(command,currentProcess,normalized.processRevision,at);append(repo,diff.guard.id,'SemanticDiffGuard',diff.guard,at);for(let i=0;i<diff.entries.length;i++){const id=diff.guard.semanticDifferenceRefs[i];append(repo,id,'SemanticDiffEntry',diff.entries[i],at);}
  if(diff.guard.result!=='WITHIN_INTENT'){const app:ReviewCommandApplication={id:createOpaqueId('review',`review-app:${command.id}:collateral`),reviewCommandId:command.id,result:'REJECTED_COLLATERAL_DIFF',appliedAt:at,resultingCanvasRevisionRef:applied.revision.id,reviewAuthoredSourceRevisionRef:authored.id,candidateProcessRevisionRef:normalized.processRevision.id,candidateValidationAssessmentRef:candidateValidation.assessment.id,semanticDiffGuardRef:diff.guard.id,diagnosticRefs:['SEMANTIC_DIFF_OUTSIDE_REVIEWER_INTENT']};append(repo,app.id,'ReviewCommandApplication',app,at);return{application:app,candidateProcessRevision:normalized.processRevision,candidateValidation,confirmation,diffGuard:diff.guard};}
  const explanation=generateExplanationDraft(normalized.processRevision,candidateValidation,{generatedAt:at,sourceRepresentationRefs:[preserved.nativeRepresentation.id],confirmations:[confirmation]});persistExplanation(repo,explanation);const transition=createAcceptedReviewTransition(current,normalized.processRevision,candidateValidation,explanation,authored.id,command.id,diff.guard.semanticDifferenceRefs,at,command.requestedBy);persistTransition(repo,transition.reconciliationAnalysis,transition.transitionCandidate,transition.transitionDecision,transition.next);
  const oldFinding=currentValidation.findings.find(f=>f.code==='SV-ACT-001'&&f.targetRefs.includes(targetNode.id));let findingDisposition:FindingDisposition|undefined;if(oldFinding&&!candidateValidation.findings.some(f=>f.code==='SV-ACT-001'&&f.targetRefs.includes(targetNode.id))){findingDisposition={id:createOpaqueId('validation',`finding-disposition:${oldFinding.id}:${normalized.processRevision.id}`),findingId:oldFinding.id,disposition:'RESOLVED_BY_NEW_REVISION',rationale:`Reviewer confirmed responsibility as ${actorName}.`,...(command.authorityRef?{authorityRef:command.authorityRef}:{}),recordedBy:command.requestedBy,recordedAt:at,resultingProcessRevisionRef:normalized.processRevision.id,resultingAssessmentRef:candidateValidation.assessment.id};append(repo,findingDisposition.id,'FindingDisposition',findingDisposition,at);}
  const app:ReviewCommandApplication={id:createOpaqueId('review',`review-app:${command.id}:applied`),reviewCommandId:command.id,result:'APPLIED',appliedAt:at,resultingCanvasRevisionRef:applied.revision.id,reviewAuthoredSourceRevisionRef:authored.id,candidateProcessRevisionRef:normalized.processRevision.id,candidateValidationAssessmentRef:candidateValidation.assessment.id,semanticDiffGuardRef:diff.guard.id,baselineTransitionCandidateRef:transition.transitionCandidate.id,baselineTransitionDecisionRef:transition.transitionDecision.id,resultingWorkspaceRevisionRef:transition.next.workspaceRevision.id,diagnosticRefs:[]};append(repo,app.id,'ReviewCommandApplication',app,at);return{application:app,nextContext:transition.next,candidateProcessRevision:normalized.processRevision,candidateValidation,explanation,confirmation,findingDisposition,diffGuard:diff.guard};
}

export interface FreezeResult { commandApplication:ReviewCommandApplication; freezeApplication:SemanticFreezeApplication; freezeRecord?:SemanticFreezeRecord; scopeRecords:ScopeFreezeRecord[]; outcomes:ScopeFreezeOutcome[]; }
export function applyFreezeCommand(repo:ImmutableDocumentRepository,current:ReviewContextBundle,command:ReviewCommand,payload:FreezeRequestPayload,scopeRequests:ScopeFreezeRequest[],assessments:ValidationAssessment[]):FreezeResult{
  const at=command.requestedAt;
  append(repo,command.id,'ReviewCommand',command,at);
  append(repo,payload.id,'FreezeRequestPayload',payload,at);
  for(const req of scopeRequests)append(repo,req.id,'ScopeFreezeRequest',req,at);

  const commandApplicationId=createOpaqueId('review',`review-app:${command.id}:freeze-eval`);
  const evaluated=evaluateFreeze(command,commandApplicationId,payload,scopeRequests,current.workspaceRevision,current.baselineBundle,current.scopeBinding,assessments,at);
  const commandResult:ReviewCommandApplication['result']=evaluated.application.result==='REJECTED_STALE'
    ?'REJECTED_STALE'
    :evaluated.application.result==='REJECTED_AUTHORITY'
      ?'REJECTED_AUTHORITY'
      :evaluated.application.result==='REJECTED_INVALID_SCOPE_SET'
        ?'REJECTED_INVALID'
        :'APPLIED';
  const diagnostics=commandResult==='REJECTED_STALE'
    ?['STALE_REVIEW_BASELINE']
    :commandResult==='REJECTED_AUTHORITY'
      ?['SEMANTIC_FREEZE_REQUIRES_AUTHORITY']
      :commandResult==='REJECTED_INVALID'
        ?['INVALID_FREEZE_REQUEST_GRAPH']
        :[];
  const commandApplication:ReviewCommandApplication={id:commandApplicationId,reviewCommandId:command.id,result:commandResult,appliedAt:at,diagnosticRefs:diagnostics};
  append(repo,commandApplication.id,'ReviewCommandApplication',commandApplication,at);
  for(const o of evaluated.outcomes)append(repo,o.id,'ScopeFreezeOutcome',o,at);
  for(const r of evaluated.scopeRecords)append(repo,r.id,'ScopeFreezeRecord',r,at);
  if(evaluated.freezeRecord)append(repo,evaluated.freezeRecord.id,'SemanticFreezeRecord',evaluated.freezeRecord,at);
  append(repo,evaluated.application.id,'SemanticFreezeApplication',evaluated.application,at);
  return{commandApplication,freezeApplication:evaluated.application,freezeRecord:evaluated.freezeRecord,scopeRecords:evaluated.scopeRecords,outcomes:evaluated.outcomes};
}
