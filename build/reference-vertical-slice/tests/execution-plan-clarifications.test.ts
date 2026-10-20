import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {startTalosOneAppProduct} from '../apps/reference-api/src/one-app-product-server.ts';
import {startGeminiChainPerceptionGateway} from '../apps/reference-api/src/gemini-chain-perception-gateway.ts';
import {describeExecutionPlanClarifications,resolveExecutionPlanClarifications} from '../packages/application/src/execution-plan-clarifications.ts';

test('a missing business condition cannot be bypassed through an execution coordination answer',()=>{
  const process:any={id:'process',nodes:[{id:'decision',name:'¿Aprobada?',kind:'DECISION'},{id:'work',name:'Ejecutar atención',kind:'ACTION'}],edges:[{id:'edge',sourceNodeId:'decision',targetNodeId:'work',kind:'CONDITIONAL',label:'Sí'}]};
  const review:any={review:{id:'review',state:'BLOCKED_EXECUTION_DESIGN'},execution:{relations:[{id:'relation',relationState:'INCOMPLETE',relationKind:'CONDITIONAL',semanticRelationRefs:['edge']}],elements:[],relationResolutions:[],coordinationResolutions:[]}};
  const questions=describeExecutionPlanClarifications(process,review);
  assert.equal(questions[0]!.route,'PROCESS_REVIEW');assert.match(questions[0]!.title,/Aprobada.*Ejecutar/);
  assert.throws(()=>resolveExecutionPlanClarifications(process,review,[{questionId:'relation',choice:'CONTINUE'}],{authorityRef:'authority:test',decidedBy:'test',rationale:'Cannot invent a business condition'}),/exact pending design question/);
});

test('image decision process explains a blocked connection, recovers accepted choices, resolves it and exports without changing business truth',async()=>{
  const graph={status:'SUCCEEDED',nodes:[['s','Inicio','EVENT'],['submit','Enviar solicitud','ACTION'],['review','Revisar solicitud','ACTION'],['d','¿Aprobada?','DECISION'],['work','Ejecutar atención','ACTION'],['notify','Notificar resultado','ACTION'],['reject','Informar rechazo','ACTION'],['e','Fin','END'],['r','Fin','END']].map(([id,label,kind])=>({id,label,kind,confidence:.99})),edges:[['a','s','submit'],['b','submit','review'],['c','review','d'],['y','d','work','Sí'],['n','d','reject','No'],['f','work','notify'],['g','notify','e'],['h','reject','r']].map(([id,source,target,label])=>({id,source,target,label,kind:id==='b'?'MESSAGE':label?'CONDITIONAL_FLOW':'FLOW',directed:true,confidence:.99})),diagnostics:[]};
  const gateway=await startGeminiChainPerceptionGateway({port:0,env:{GEMINI_API_KEY:'mock-key',GEMINI_MODEL_CHAIN:'mock-model'},fetchImpl:(async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(graph)}]}}]}),{headers:{'content-type':'application/json'}})) as typeof fetch});
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-plan-questions-'));
  const options={port:0,oneApp:{runtimeDir,imagePerceptionEnv:{TALOS_IMAGE_PERCEPTION_PROVIDER_URL:gateway.baseUrl+'/perceive',TALOS_IMAGE_PERCEPTION_PROVIDER_ID:'TALOS_GEMINI_MODEL_CHAIN',TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION:'1.0.0',TALOS_IMAGE_PERCEPTION_MODEL_REF:'router:gemini-model-chain',TALOS_IMAGE_PERCEPTION_MODEL_VERSION:'r1-11-gemini-chain-v1',TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION:'talos-r1-11-gemini-chain-v0.1',TALOS_IMAGE_PERCEPTION_TIMEOUT_MS:'10000',TALOS_IMAGE_PERCEPTION_PROVIDER_CLASS:'MODEL_PROVIDER',TALOS_IMAGE_PERCEPTION_EVIDENCE_MODE:'MODEL_INFERENCE'}}};
  let app=await startTalosOneAppProduct(options);
  const post=async(route:string,payload:unknown,expected=201)=>{const response=await fetch(app.baseUrl+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const body=await response.json() as any;assert.equal(response.status,expected,JSON.stringify(body));return body};
  try{
    const intake=await post('/api/input/image',{imageBase64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1xkAAAAASUVORK5CYII=',fileName:'request.png',initiatedBy:'test'});
    const validation=intake.reconciliation.validation,process=intake.reconciliation.processRevision;
    const answers=validation.questions.filter((q:any)=>validation.findings.some((f:any)=>q.findingRefs.includes(f.id)&&f.code==='SV-CFL-001')).map((q:any)=>({kind:'BRANCH_CONDITION',questionRef:q.id,findingRef:q.findingRefs[0],targetRef:q.targetRef,condition:process.edges.find((e:any)=>e.id===q.targetRef).label==='Sí'?'La solicitud fue aprobada':'La solicitud fue rechazada'}));
    assert.equal(answers.length,2);
    const proposal=await post('/api/semantic-resolution/propose',{revisionId:intake.revision.id,answers,answeredBy:'test',authorityRef:'authority:test:business',rationale:'Confirm visible branch meaning'});
    const clarified=await post('/api/semantic-resolution/decide',{revisionId:intake.revision.id,proposalId:proposal.proposal.id,decision:'ACCEPT',decidedBy:'test',authorityRef:'authority:test:apply',rationale:'Apply reviewed branch meaning'});
    const confirmed=await post('/api/bpmn/confirm',{revisionId:clarified.revision.id,canonicalProcessRevisionId:clarified.reconciliation.processRevision.id,confirmedBy:'test',authorityRef:'authority:test:confirm'});
    const canonical=JSON.stringify(confirmed.reconciliation.processRevision);
    const design=await post('/api/bpmn/automation-design-approval',{revisionId:confirmed.revision.id,confirmationId:confirmed.confirmation.id,approvedBy:'test',authorityRef:'authority:test:design'});
    const workspace=design.automationDesign.workspace;
    await post('/api/automation/capability/select',{workspaceId:workspace.id,selections:workspace.requirements.map((r:any)=>({source:'EXPLICIT_OFFERING',requirementRef:r.capabilityRequirementRef,family:'SYSTEM_OPERATION',offeringCanonicalName:'API contract',offeringLifecycleStatus:'TEST_ONLY',implementationKind:'DIRECT_API',implementationRef:'proposal-contract:'+r.capabilityRequirementRef,decidedBy:'test',authorityRef:'authority:test:selection',rationale:'Accept reviewed design directions'}))});
    const blocked=await post('/api/automation/execution-plan/review',{workspaceId:workspace.id,decisions:{}});
    assert.equal(blocked.review.state,'BLOCKED_EXECUTION_DESIGN');assert.equal(blocked.clarifications.length,1);
    const question=blocked.clarifications[0];assert.equal(question.kind,'RELATION_COORDINATION');assert.match(question.title,/Enviar solicitud.*Revisar solicitud/);
    await post('/api/automation/approve',{reviewId:blocked.review.id,approvedBy:'test',authorityRef:'authority:test:must-not-approve',rationale:'Blocked review must refuse'},409);
    // Restart must recover the existing selected design, not repeat five forms.
    await app.close();app=await startTalosOneAppProduct(options);
    const recoveredResponse=await fetch(app.baseUrl+'/api/automation/execution-plan/recover?reviewId='+encodeURIComponent(blocked.review.id)+'&processRevisionId='+encodeURIComponent(confirmed.confirmation.canonicalProcessRevisionId));
    const recovered=await recoveredResponse.json() as any;assert.equal(recoveredResponse.status,200,JSON.stringify(recovered));
    assert.equal(recovered.acceptedSteps.length,5);assert.equal(recovered.consumableAuthorityRecovered,false);
    const answerPayload={workspaceId:recovered.workspaceId,reviewId:blocked.review.id,answers:[{questionId:question.id,choice:'CONTINUE'}],authorityRef:'authority:test:coordination',decidedBy:'test',rationale:'Explicitly continue after the named activity'};
    const resolved=await post('/api/automation/execution-plan/review',answerPayload);
    assert.equal(resolved.review.state,'READY_FOR_AUTOMATION_APPROVAL');assert.deepEqual(resolved.clarifications,[]);
    assert.deepEqual(resolved.execution.definition,blocked.execution.definition);
    assert.deepEqual(resolved.review.capabilityBindingRevisionRefs,blocked.review.capabilityBindingRevisionRefs);
    assert.equal(resolved.execution.relationResolutions[0].sourceSemanticRelationKind,'MESSAGE');
    const replay=await post('/api/automation/execution-plan/review',answerPayload,200);assert.equal(replay.idempotentReplay,true);assert.equal(replay.review.id,resolved.review.id);
    const snapshot=await fetch(app.baseUrl+'/api/product/workspace-snapshot?revisionId='+encodeURIComponent(confirmed.revision.id)).then(r=>r.json()) as any;
    assert.deepEqual(snapshot.processRevision,JSON.parse(canonical));
    assert.equal(resolved.execution.revision.revision,2);assert.deepEqual(resolved.execution.revision.parentRevisionRefs,[blocked.execution.revision.id]);
    const approval=await post('/api/automation/approve',{reviewId:resolved.review.id,approvedBy:'test',authorityRef:'authority:test:approve',rationale:'Approve this exact resolved design'});
    const mapping=await post('/api/automation/temporal-mapping',{approvalId:approval.id,useRecommendedMapping:true,allowDurableRecovery:true,decidedBy:'test',authorityRef:'authority:test:mapping',rationale:'Generate design artifacts'});
    const exported=await post('/api/automation/temporal-export',{approvalId:approval.id,temporalMappingRevisionId:mapping.mapping.revision.id,allowDurableRecovery:true},200);
    assert.equal(exported.readiness.temporalExportReady,true);assert.equal(exported.readiness.temporalExecutionReady,false);
    const status=await fetch(app.baseUrl+'/api/status').then(r=>r.json()) as any;assert.equal(status.deploymentAuthorized,false);assert.equal(status.executionAuthorized,false);
  }finally{await app.close();await gateway.close();rmSync(runtimeDir,{recursive:true,force:true})}
});
