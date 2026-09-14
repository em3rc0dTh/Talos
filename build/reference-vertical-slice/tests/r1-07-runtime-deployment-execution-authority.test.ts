import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

const bpmn=`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R107" targetNamespace="https://talos.local/r1-07">
  <bpmn:process id="Process_R107" name="R1-07 Authority Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Work" name="Perform approved work"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Work" />
    <bpmn:sequenceFlow id="F2" sourceRef="Work" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

async function post(baseUrl:string,pathname:string,payload:Record<string,unknown>){
  const response=await fetch(`${baseUrl}${pathname}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  return{response,body:await response.json() as any};
}

async function reachAutomationApproval(baseUrl:string){
  const imported=await post(baseUrl,'/api/input/bpmn',{fileName:'r1-07.bpmn',bpmnXml:bpmn,initiatedBy:'r1-07-user'});
  assert.equal(imported.response.status,201);
  const confirmed=await post(baseUrl,'/api/bpmn/confirm',{revisionId:imported.body.revision.id,canonicalProcessRevisionId:imported.body.revision.canonicalProcessRevisionId,confirmedBy:'r1-07-user',authorityRef:'authority:r1-07-process-owner',rationale:'Confirm exact process.'});
  assert.equal(confirmed.response.status,201);
  const opened=await post(baseUrl,'/api/bpmn/automation-design-approval',{revisionId:confirmed.body.revision.id,confirmationId:confirmed.body.confirmation.id,approvedBy:'r1-07-user',authorityRef:'authority:r1-07-design'});
  assert.equal(opened.response.status,201);
  const workspace=opened.body.automationDesign.workspace;
  const selections=workspace.requirements.map((requirement:any,index:number)=>({source:'EXPLICIT_OFFERING',requirementRef:requirement.capabilityRequirementRef,family:'SYSTEM_OPERATION',offeringCanonicalName:`R1-07 operation ${index+1}`,offeringLifecycleStatus:'TEST_ONLY',implementationKind:'INTERNAL_SERVICE',implementationRef:`r1-07:operation:${index+1}`,decidedBy:'r1-07-user',authorityRef:'authority:r1-07-capability',rationale:'Explicit capability selection.'}));
  const selected=await post(baseUrl,'/api/automation/capability/select',{workspaceId:workspace.id,selections});
  assert.equal(selected.response.status,201);
  const reviewed=await post(baseUrl,'/api/automation/execution-plan/review',{workspaceId:workspace.id,decisions:{}});
  assert.equal(reviewed.response.status,201);
  const approved=await post(baseUrl,'/api/automation/approve',{reviewId:reviewed.body.review.id,approvedBy:'r1-07-user',authorityRef:'authority:r1-07-automation',rationale:'Approve exact plan for Temporal design.'});
  assert.equal(approved.response.status,201);
  return{reviewed:reviewed.body,approved:approved.body};
}

function activityPolicy(use:any){return{
  capabilityUseOccurrenceRef:use.id,authorityRef:'authority:r1-07-runtime',decidedBy:'r1-07-runtime-owner',rationale:'Explicit policy, no implicit defaults.',policyBasis:'USER_EXPLICIT_DESIGN',
  retry:{initialIntervalMs:100,backoffCoefficient:2,maximumIntervalMs:1000,maximumAttempts:3,nonRetryableFailureTypes:['INVALID_REQUEST','IDEMPOTENCY_CONFLICT']},
  timeout:{startToCloseMs:5000,scheduleToCloseMs:10000},
  idempotency:{requirement:'REQUIRED',strategyKind:'IDEMPOTENCY_KEY',keyContract:'sha256(executionId + capabilityUseOccurrenceRef)',enforcementRef:'ONE_APP_EFFECT_LEDGER'},
  failureClassifications:[{failureType:'TRANSIENT_FAILURE',retryable:true,businessFailure:false},{failureType:'INVALID_REQUEST',retryable:false,businessFailure:false},{failureType:'IDEMPOTENCY_CONFLICT',retryable:false,businessFailure:false}],
};}

test('R1-07 product exposes eight explicit authority actions and never a run-all shortcut',async()=>{
  const source=readFileSync(path.resolve(process.cwd(),'apps/reference-api/src/one-app-r1-07-runtime-authority-extension.ts'),'utf8');
  for(const route of ['/api/automation/temporal-mapping','/api/automation/runtime-policy','/api/automation/deployment-design','/api/automation/environment-realization','/api/automation/deployment/approve','/api/automation/deployment/attempt','/api/automation/execution/approve','/api/automation/execution/start']) assert.equal(source.includes(route),true,`${route} must be visible in R1-07`);
  assert.equal(source.includes('run-all'),false);
  assert.equal(source.includes('Run all'),false);
  assert.match(source,/One gate ≠ the next gate/);
  assert.match(source,/exactly one start/i);

  const app=await startTalosOneAppProduct({port:0,oneApp:{imagePerceptionEnv:{}}});
  try{
    const html=await fetch(app.baseUrl).then(r=>r.text());
    assert.match(html,/panel\.id='r107RuntimeAuthority'/);
    assert.match(html,/Map exact plan to Temporal/);
    assert.match(html,/Confirm explicit RuntimePolicy/);
    assert.match(html,/Approve one deployment attempt/);
    assert.match(html,/Approve exact workflow input once/);
    assert.match(html,/Start authorized workflow once/);
  }finally{await app.close();}
});

test('R1-07 complete authority chain requires every predecessor and consumes one-shot deployment/execution authority',async()=>{
  let deploymentCalls=0;let executionCalls=0;
  const app=await startTalosOneAppProduct({port:0,oneApp:{imagePerceptionEnv:{},deploymentAttemptExecutor:async input=>{deploymentCalls+=1;return{completedAt:new Date().toISOString(),result:'SUCCEEDED',diagnosticRefs:[],evidenceRefs:[`deployment:${input.deploymentApprovalId}`],orchestratorRef:'R1_07_TEST_TRUSTED_DEPLOYER'};},workflowExecutionExecutor:async input=>{executionCalls+=1;return{completedAt:new Date().toISOString(),workflowExecutionRef:`trusted:${input.executionId}:run-1`,workflowIdRef:`r1-07-${input.executionId}`,runIdRef:'run-r1-07-1',executionStatus:'COMPLETED',evidenceRefs:[`execution:${input.executionId}`,`approval:${input.workflowExecutionApprovalId}`]};}}});
  try{
    const x=await reachAutomationApproval(app.baseUrl);

    const prematureRuntime=await post(app.baseUrl,'/api/automation/runtime-policy',{approvalId:x.approved.id,temporalMappingRevisionId:'missing',activities:[],workflow:{authorityRef:'authority:r1-07',decidedBy:'r1-07',rationale:'must fail',maximumAttempts:1,policyBasis:'USER_EXPLICIT_DESIGN'}});
    assert.equal(prematureRuntime.response.status,409);

    const mapped=await post(app.baseUrl,'/api/automation/temporal-mapping',{approvalId:x.approved.id,waits:[],humans:[]});
    assert.equal(mapped.response.status,201);
    assert.equal(mapped.body.runtimePolicyAuthorized,false);
    assert.equal(mapped.body.deploymentAuthorized,false);
    assert.equal(mapped.body.executionAuthorized,false);

    const activities=x.reviewed.execution.capabilityUses.map(activityPolicy);
    const runtime=await post(app.baseUrl,'/api/automation/runtime-policy',{approvalId:x.approved.id,temporalMappingRevisionId:mapped.body.mapping.revision.id,activities,workflow:{authorityRef:'authority:r1-07-workflow-runtime',decidedBy:'r1-07-runtime-owner',rationale:'No implicit whole-workflow retries.',maximumAttempts:1,policyBasis:'USER_EXPLICIT_DESIGN'}});
    assert.equal(runtime.response.status,201);
    assert.equal(runtime.body.runtimePolicy.defaultEntries.length,0);
    assert.equal(runtime.body.runtimePolicy.defaultAcceptances.length,0);
    assert.equal(runtime.body.deploymentAuthorized,false);
    assert.equal(runtime.body.executionAuthorized,false);

    const design=await post(app.baseUrl,'/api/automation/deployment-design',{approvalId:x.approved.id,runtimePolicyRevisionId:runtime.body.runtimePolicy.revision.id,environmentKey:'r1-07-test',environmentClass:'TEST',temporalPlatformRef:'TEMPORAL_TEST',desiredNamespaceKey:'default',desiredTaskQueueKey:'talos-r1-07',desiredWorkflowTypeName:'TalosGenericWorkflow',desiredActivityTypeName:'executeGenericCapability',desiredWorkerLogicalName:'talos-r1-07-worker',authorityRef:'authority:r1-07-deploy-design',decidedBy:'r1-07-deploy-designer',rationale:'Exact deployment intent only.'});
    assert.equal(design.response.status,201);
    assert.equal(design.body.deploymentAttemptAuthorized,false);
    assert.equal(design.body.executionAuthorized,false);

    const realized=await post(app.baseUrl,'/api/automation/environment-realization',{approvalId:x.approved.id,deploymentRevisionId:design.body.deploymentDesign.revision.id,actualNamespace:'default',taskQueue:'talos-r1-07',workflowTypeName:'TalosGenericWorkflow',activityTypeName:'executeGenericCapability',workerLogicalName:'talos-r1-07-worker',executableArtifactRef:'r1-07:test-worker',artifactDigest:'sha256:r1-07-test-artifact',sdkFamily:'TEMPORAL_TYPESCRIPT_SDK',sdkVersionRef:'1.22.0',authorityRef:'authority:r1-07-realizer',realizedBy:'r1-07-realizer'});
    assert.equal(realized.response.status,201);
    assert.equal(realized.body.deploymentAttemptAuthorized,false);

    const prematureExecution=await post(app.baseUrl,'/api/automation/execution/approve',{automationApprovalId:x.approved.id,deploymentRevisionId:realized.body.deploymentRealization.revision.id,deploymentAttemptId:'deployment:missing',workflowTypeBindingRef:realized.body.deploymentRealization.workflowTypeBindings[0].id,executionId:'R1-07-EXEC',facts:{approved:true},authorityRef:'authority:r1-07-exec',approvedBy:'r1-07-exec-owner',rationale:'must fail before deployment'});
    assert.equal(prematureExecution.response.status,409);

    const deploymentApproval=await post(app.baseUrl,'/api/automation/deployment/approve',{automationApprovalId:x.approved.id,deploymentRevisionId:realized.body.deploymentRealization.revision.id,authorityRef:'authority:r1-07-deploy-owner',approvedBy:'r1-07-deploy-owner',rationale:'Authorize one exact deployment attempt.'});
    assert.equal(deploymentApproval.response.status,201);
    assert.equal(deploymentApproval.body.authorizedAttemptCount,1);
    assert.equal(deploymentApproval.body.executionAuthorized,false);

    const attempt=await post(app.baseUrl,'/api/automation/deployment/attempt',{deploymentApprovalId:deploymentApproval.body.deploymentApproval.id,deploymentRevisionId:realized.body.deploymentRealization.revision.id});
    assert.equal(attempt.response.status,201);
    assert.equal(attempt.body.deploymentAttemptConsumed,true);
    assert.equal(attempt.body.deploymentAttemptSucceeded,true);
    assert.equal(attempt.body.workflowExecutionAuthorized,false);
    assert.equal(deploymentCalls,1);

    const duplicateAttempt=await post(app.baseUrl,'/api/automation/deployment/attempt',{deploymentApprovalId:deploymentApproval.body.deploymentApproval.id,deploymentRevisionId:realized.body.deploymentRealization.revision.id});
    assert.equal(duplicateAttempt.response.status,409);
    assert.equal(deploymentCalls,1);

    const executionId='R1-07-EXEC-001';
    const facts={approved:true};
    const capabilityInputs=Object.fromEntries(x.reviewed.execution.capabilityUses.map((use:any)=>[use.id,{source:'r1-07-explicit-input'}]));
    const execApproval=await post(app.baseUrl,'/api/automation/execution/approve',{automationApprovalId:x.approved.id,deploymentRevisionId:realized.body.deploymentRealization.revision.id,deploymentAttemptId:attempt.body.deploymentAttempt.id,workflowTypeBindingRef:realized.body.deploymentRealization.workflowTypeBindings[0].id,executionId,facts,capabilityInputs,authorityRef:'authority:r1-07-exec-owner',approvedBy:'r1-07-exec-owner',rationale:'Authorize this exact input exactly once.'});
    assert.equal(execApproval.response.status,201);
    assert.equal(execApproval.body.workflowExecutionAuthorized,true);
    assert.equal(execApproval.body.authorizedWorkflowStartCount,1);

    const drift=await post(app.baseUrl,'/api/automation/execution/start',{workflowExecutionApprovalId:execApproval.body.workflowExecutionApproval.id,deploymentRevisionId:realized.body.deploymentRealization.revision.id,executionId,facts:{approved:false},capabilityInputs});
    assert.equal(drift.response.status,409);
    assert.equal(executionCalls,0);

    const started=await post(app.baseUrl,'/api/automation/execution/start',{workflowExecutionApprovalId:execApproval.body.workflowExecutionApproval.id,deploymentRevisionId:realized.body.deploymentRealization.revision.id,executionId,facts,capabilityInputs});
    assert.equal(started.response.status,201);
    assert.equal(started.body.workflowExecutionObservation.executionStatus,'COMPLETED');
    assert.equal(started.body.workflowExecutionApprovalConsumed,true);
    assert.equal(started.body.additionalWorkflowStartAuthorized,false);
    assert.equal(executionCalls,1);

    const duplicateStart=await post(app.baseUrl,'/api/automation/execution/start',{workflowExecutionApprovalId:execApproval.body.workflowExecutionApproval.id,deploymentRevisionId:realized.body.deploymentRealization.revision.id,executionId,facts,capabilityInputs});
    assert.equal(duplicateStart.response.status,409);
    assert.equal(executionCalls,1);
  }finally{await app.close();}
});
