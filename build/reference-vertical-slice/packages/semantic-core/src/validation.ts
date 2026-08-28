import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { AssessmentIntent,AssessmentScope,ClarificationPlan,ClarificationQuestion,ExecutionReadiness,ProcessNode,ProcessRevision,ReadinessDecision,SemanticVerdict,ValidationAssessment,ValidationBundle,ValidationFinding,ValidationId } from './types.ts';

export const SEMANTIC_VALIDATOR_VERSION='talos-semantic-validator-reference-0.3';
export const SEMANTIC_RULESET_VERSION='semantic-validation-v0.3';
export const READINESS_RULE_VERSION='semantic-validation-readiness-v0.3';

interface FindingDraft { code:string; family:string; title:string; description:string; targetRefs:string[]; evidenceRefs?:string[]; provenanceRefs?:any[]; severity:'INFO'|'WARNING'|'ERROR'|'CRITICAL'; blockerClass:'NONE'|'SEMANTIC_UNDERSTANDING'|'AUTOMATION_DESIGN'|'SOURCE_ACCEPTANCE'; resolutionRoute:ValidationFinding['resolutionRoute']; questionCandidate?:boolean; deferredGate?:string; }
function sourceProps(node:ProcessNode):Record<string,unknown>{return (node.details?.sourceProperties as Record<string,unknown>|undefined)??{};}
function stateOf(value:unknown):string|undefined{return value&&typeof value==='object'&&'state' in value?String((value as any).state):undefined;}
function valueOf(value:unknown):unknown{return value&&typeof value==='object'&&'value' in value?(value as any).value:value;}
function usable(value:unknown):boolean{return value!==undefined&&value!==null&&stateOf(value)!=='UNKNOWN'&&String(valueOf(value)??'').trim().length>0;}

function collectFindings(revision:ProcessRevision,intent:AssessmentIntent):FindingDraft[]{
  const out:FindingDraft[]=[];
  for(const conflict of revision.conflictRecords){
    if(conflict.resolutionStatus==='UNRESOLVED')out.push({code:'SV-CNF-001',family:'SOURCE_CONFLICT',title:'Unresolved source conflict',description:`Conflicting claims remain unresolved for ${conflict.propertyPath}.`,targetRefs:[conflict.subjectRef],severity:'ERROR',blockerClass:intent==='AUTOMATION_DESIGN_READINESS'?'AUTOMATION_DESIGN':'SEMANTIC_UNDERSTANDING',resolutionRoute:'BUSINESS_OWNER_DECISION',questionCandidate:true});
  }
  for(const extension of revision.sourceExtensions){
    if(extension.extensionType==='INCOMPLETE_RELATIONSHIP'){
      const payload=extension.payload as Record<string,unknown>;
      out.push({code:'SV-CFL-002',family:'CONTROL_FLOW',title:'Branch target unresolved',description:'The source establishes a relationship/branch intent but its target is unresolved. TALOS preserves the branch without fabricating a ProcessEdge.',targetRefs:[String(payload.canonicalSourceRef??extension.id)],evidenceRefs:[...extension.sourceElementRefs],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true});
    }
  }
  for(const node of revision.nodes){
    const props=sourceProps(node);
    const actorProperty=props['propertyValues.actor']??props.actor;
    if((node.kind==='HUMAN_INTERACTION'||node.kind==='ACTION') && (stateOf(actorProperty)==='UNKNOWN'||node.details?.responsibilityState==='UNKNOWN')){
      out.push({code:'SV-ACT-001',family:'ACTOR_RESPONSIBILITY',title:'Actor or owner missing',description:`Responsibility for ${node.name??node.id} is explicitly unknown.`,targetRefs:[node.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:node.provenanceRefs});
    }
    if(node.kind==='HUMAN_INTERACTION'&&node.actorRefs.length===0&&stateOf(actorProperty)!=='NOT_APPLICABLE'){
      if(!out.some(f=>f.code==='SV-ACT-001'&&f.targetRefs.includes(node.id)))out.push({code:'SV-ACT-001',family:'ACTOR_RESPONSIBILITY',title:'Actor or owner missing',description:`Human interaction ${node.name??node.id} has no responsible actor.`,targetRefs:[node.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:node.provenanceRefs});
    }
    if(node.kind==='WAIT'){
      const waitKind=String(node.details?.waitKind??valueOf(props.waitKind)??valueOf(props['propertyValues.waitKind'])??'');
      const timezone=node.details?.timezone??props.timezone??props['propertyValues.timezone'];
      const expression=node.details?.expression??props.expression??props['propertyValues.expression'];
      const durationExpression=node.details?.durationExpression??props.durationExpression??props['propertyValues.durationExpression'];
      const durationSeconds=node.details?.durationSeconds??props.durationSeconds??props['propertyValues.durationSeconds'];
      if(!waitKind||waitKind==='UNKNOWN'||waitKind==='SOURCE_DEFINED'){
        out.push({code:'SV-EVT-003',family:'EVENT_WAIT',title:'Wait kind unresolved',description:`${node.name??'WAIT'} does not establish whether Talos is waiting for an elapsed duration, schedule, deadline, message, event, human response, or condition.`,targetRefs:[node.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:node.provenanceRefs});
      }
      if(waitKind==='DURATION'&&!usable(durationExpression)&&!usable(durationSeconds)){
        out.push({code:'SV-EVT-004',family:'EVENT_WAIT',title:'Wait duration incomplete',description:`${node.name??'WAIT'} is an elapsed-duration wait but does not contain a usable duration expression.`,targetRefs:[node.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:node.provenanceRefs});
      }
      if((waitKind==='SCHEDULE'||waitKind==='DEADLINE')&&(stateOf(timezone)==='UNKNOWN'||timezone===undefined||expression===undefined||stateOf(expression)==='UNKNOWN')){
        out.push({code:'SV-EVT-002',family:'EVENT_WAIT',title:'Wait time expression incomplete',description:`${node.name??'WAIT'} does not yet identify a complete business time instant/timezone.`,targetRefs:[node.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:node.provenanceRefs});
      }
      if((waitKind==='EXTERNAL_EVENT'||waitKind==='MESSAGE'||waitKind==='HUMAN_RESPONSE'||waitKind==='CONDITION')&&!node.details?.resumeSemantics){
        out.push({code:'SV-EVT-001',family:'EVENT_WAIT',title:'Wait resume semantics incomplete',description:`${node.name??'WAIT'} lacks complete resume semantics.`,targetRefs:[node.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:node.provenanceRefs});
      }
    }
    if(node.kind==='JOIN'){
      const join=String(node.details?.joinPolicy??valueOf(props.joinPolicy)??valueOf(props['propertyValues.joinPolicy'])??'');
      if(!join||join==='UNKNOWN')out.push({code:'SV-CON-001',family:'CONCURRENCY',title:'Join policy unresolved',description:`Join ${node.name??node.id} does not establish its synchronization policy.`,targetRefs:[node.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:node.provenanceRefs});
    }
    if(node.kind==='SUBPROCESS'){
      const mode=String(node.details?.subprocessMode??valueOf(props.boundaryMeaning)??valueOf(props['propertyValues.boundaryMeaning'])??'');
      if(!mode||mode==='UNKNOWN'||mode==='SOURCE_DEFINED')out.push({code:'SV-SUB-002',family:'SUBPROCESS_SCOPE',title:'Subprocess boundary meaning unresolved',description:`Subprocess ${node.name??node.id} does not establish a sufficient boundary meaning.`,targetRefs:[node.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:node.provenanceRefs});
    }
  }
  const outgoing=new Map<string,typeof revision.edges>();
  for(const edge of revision.edges){const list=outgoing.get(edge.sourceNodeId)??[];list.push(edge);outgoing.set(edge.sourceNodeId,list);}
  for(const node of revision.nodes.filter(n=>n.kind==='DECISION')){
    for(const edge of outgoing.get(node.id)??[]){if(edge.kind==='CONDITIONAL'&&!edge.conditionRuleRef)out.push({code:'SV-CFL-001',family:'DECISION_RULE',title:'Branch condition unresolved',description:`Conditional branch from ${node.name??node.id} has no structured business rule.`,targetRefs:[edge.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:edge.provenanceRefs});}
  }
  if(intent==='AUTOMATION_DESIGN_READINESS'&&revision.nodes.length>0&&!revision.nodes.some(n=>n.kind==='END')){
    out.push({code:'SV-CMP-001',family:'COMPLETION',title:'Success completion unproven',description:'The semantic scope has no explicit process outcome/end state; last visible work is not treated as success.',targetRefs:[revision.id],severity:'ERROR',blockerClass:'AUTOMATION_DESIGN',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true});
  }
  const inferredMaterial=revision.semanticClaims.filter(c=>c.truthClass==='INFERRED'&&c.perspective==='BUSINESS_INTENT');
  for(const claim of inferredMaterial)out.push({code:'SV-SRC-001',family:'SOURCE_UNCERTAINTY',title:'Material inferred meaning needs confirmation',description:`The business-intent interpretation for ${claim.propertyPath} is inferred and requires confirmation before automation design.`,targetRefs:[claim.subjectRef],evidenceRefs:claim.evidenceFragmentRefs,severity:'WARNING',blockerClass:'SOURCE_ACCEPTANCE',resolutionRoute:'USER_CONFIRMATION',questionCandidate:true,provenanceRefs:claim.provenanceLinkRefs});
  return out;
}

function readinessFor(findings:ValidationFinding[],revision:ProcessRevision,intent:AssessmentIntent):ExecutionReadiness{
  if(intent==='SOURCE_REVIEW')return'NOT_ASSESSED';
  if(intent==='BUSINESS_MODEL_UNDERSTANDING')return findings.some(f=>f.blockerClass==='SEMANTIC_UNDERSTANDING')?'INSUFFICIENT_DETAIL':'SEMANTICALLY_COMPLETE';
  if(intent!=='AUTOMATION_DESIGN_READINESS')return findings.length?'INSUFFICIENT_DETAIL':'SEMANTICALLY_COMPLETE';
  if(findings.some(f=>f.code==='SV-CNF-001'))return'BLOCKED_BY_CONFLICT';
  const missingCodes=new Set(['SV-STR-001','SV-STR-002','SV-STR-003','SV-STR-004','SV-CFL-001','SV-CFL-002','SV-CFL-004','SV-CMP-001','SV-CMP-002','SV-CMP-003','SV-ACT-001','SV-ACT-002','SV-HUM-001','SV-HUM-002','SV-DAT-001','SV-DAT-002','SV-DAT-003','SV-RUL-001','SV-EVT-001','SV-EVT-002','SV-EVT-003','SV-EVT-004','SV-COR-001','SV-COR-002','SV-COR-003','SV-CON-001','SV-CON-002','SV-CON-003','SV-LOP-001','SV-SUB-001','SV-SUB-002','SV-SFX-001','SV-SFX-002','SV-SFX-003']);
  if(findings.some(f=>missingCodes.has(f.code)))return'INSUFFICIENT_DETAIL';
  if(findings.some(f=>f.blockerClass==='SOURCE_ACCEPTANCE'||f.code==='SV-SRC-001'||f.code==='SV-SRC-002'))return'NEEDS_CONFIRMATION';
  return'READY_FOR_AUTOMATION_DESIGN';
}
function verdictFor(findings:ValidationFinding[],revision:ProcessRevision):SemanticVerdict{
  if(findings.some(f=>f.code==='SV-CNF-001'))return'CONFLICTED';
  if(findings.some(f=>f.blockerClass==='SEMANTIC_UNDERSTANDING'||f.blockerClass==='AUTOMATION_DESIGN'))return'INCOMPLETE';
  return findings.length?'VALID_WITH_FINDINGS':'VALID';
}
function questionText(f:ValidationFinding):string{
  switch(f.code){
    case'SV-CFL-001':return'What exact business condition selects this branch?';
    case'SV-CFL-002':return'What happens on this unresolved branch?';
    case'SV-ACT-001':return'Who is responsible for this work or human interaction?';
    case'SV-EVT-001':return'What exact event, message, response, or condition resumes this wait?';
    case'SV-EVT-002':return'What exact business time/timezone determines when this wait resumes?';
    case'SV-EVT-003':return'What kind of wait is this: elapsed duration, schedule, deadline, message, event, human response, or condition?';
    case'SV-EVT-004':return'What exact duration must elapse before this wait resumes?';
    case'SV-CON-001':return'What synchronization rule determines when this join may continue?';
    case'SV-CMP-001':return'What explicit business outcome completes this process scope?';
    default:return`Please clarify: ${f.title}.`;
  }
}

export function validateProcessRevision(revision:ProcessRevision,intent:AssessmentIntent='AUTOMATION_DESIGN_READINESS',options:{assessedAt?:string;supersedesAssessmentId?:ValidationId}={}):ValidationBundle{
  const assessedAt=options.assessedAt??new Date().toISOString();
  const scope:AssessmentScope={id:createOpaqueId('validation',`scope:${revision.id}:${intent}`),kind:'PROCESS_REVISION',targetRefs:[revision.id],intendedUse:intent};
  const assessmentId=createOpaqueId('validation',`assessment:${revision.id}:${intent}:${SEMANTIC_RULESET_VERSION}`);
  const drafts=collectFindings(revision,intent);
  const findings:ValidationFinding[]=drafts.map((d,index)=>({id:createOpaqueId('validation',`finding:${assessmentId}:${d.code}:${index}:${d.targetRefs.join('|')}`),assessmentId,code:d.code,family:d.family,title:d.title,description:d.description,scopeRef:scope.id,targetRefs:d.targetRefs,evidenceRefs:d.evidenceRefs??[],provenanceRefs:d.provenanceRefs??[],severity:d.severity,blockerClass:d.blockerClass,resolutionRoute:d.resolutionRoute,...(d.deferredGate?{deferredGate:d.deferredGate}:{}),...(d.questionCandidate?{questionCandidate:true}:{}),relatedFindingRefs:[],createdAt:assessedAt}));
  const readiness=readinessFor(findings,revision,intent);
  const decision:ReadinessDecision={id:createOpaqueId('validation',`readiness:${assessmentId}`),assessmentId,intent,primaryScopeRef:scope.id,consideredFindingRefs:findings.map(f=>f.id),ignoredOrDeferredFindingRefs:findings.filter(f=>f.blockerClass==='NONE').map(f=>f.id),selectedReadiness:readiness,decisionRuleVersion:READINESS_RULE_VERSION,rationaleCodes:[readiness]};
  const questions=findings.filter(f=>f.questionCandidate&&f.blockerClass!=='NONE').map((f,index):ClarificationQuestion=>({id:createOpaqueId('validation',`question:${assessmentId}:${index}:${f.id}`),assessmentId,findingRefs:[f.id],targetRef:f.targetRefs[0]??revision.id,questionText:questionText(f),reason:f.description,issuedAt:assessedAt}));
  const plan:ClarificationPlan|undefined=questions.length?{id:createOpaqueId('validation',`clarification-plan:${assessmentId}`),assessmentId,questionIds:questions.map(q=>q.id),strategy:'MATERIAL_BLOCKERS_FIRST',createdAt:assessedAt}:undefined;
  const assessment:ValidationAssessment={id:assessmentId,processRevisionId:revision.id,provenanceContractVersion:'v0.3',canonicalModelVersion:'v0.1',validatorVersion:SEMANTIC_VALIDATOR_VERSION,rulesetVersion:SEMANTIC_RULESET_VERSION,assessmentIntent:intent,primaryScopeRef:scope.id,contextScopeRefs:[],findingIds:findings.map(f=>f.id),...(plan?{questionPlanId:plan.id}:{}),semanticVerdict:verdictFor(findings,revision),executionReadiness:readiness,readinessDecisionRef:decision.id,assessedAt,...(options.supersedesAssessmentId?{supersedesAssessmentId:options.supersedesAssessmentId}: {})};
  return{scope,assessment,findings,readinessDecision:decision,questions,...(plan?{clarificationPlan:plan}: {})};
}
