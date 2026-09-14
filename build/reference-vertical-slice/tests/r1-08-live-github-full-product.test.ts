import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { digestDeterministicJson } from '../packages/foundation/src/digest.ts';
import { compileGenericRuntimeProgram } from '../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';
import { createGenericTemporalWorker } from '../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import { TalosGenericWorkflow } from '../workers/reference-temporal-worker/src/generic-workflow.ts';
import { genericEffectIdentity } from '../workers/reference-temporal-worker/src/generic-activities.ts';
import {
  GitHubIssueCommentCapabilityTransport,
  GITHUB_ISSUE_COMMENT_TRANSPORT_REF,
  inspectGitHubIssueCommentEffect,
} from '../workers/reference-temporal-worker/src/github-issue-comment-transport.ts';

const LIVE_REQUIRED=process.env.R1_08_LIVE_REQUIRED==='1';
const TASK_QUEUE='talos-r1-08-live-github';

const bpmn=`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R108" targetNamespace="https://talos.local/r1-08">
  <bpmn:process id="Process_R108" name="External Evidence Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="PublishEvidence" name="Publish approved certification evidence"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="PublishEvidence" />
    <bpmn:sequenceFlow id="F2" sourceRef="PublishEvidence" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

function required(name:string):string{
  const value=process.env[name]?.trim();
  if(!value)throw new TypeError(`R1-08 live certification requires ${name}`);
  return value;
}

async function post(baseUrl:string,pathname:string,payload:Record<string,unknown>){
  const response=await fetch(`${baseUrl}${pathname}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  return{response,body:await response.json() as any};
}

function realizationEvidence(namespace:string,artifactDigest:string){return{
  actualNamespace:namespace,taskQueue:TASK_QUEUE,workflowTypeName:'TalosGenericWorkflow',activityTypeName:'executeGenericCapability',
  workerLogicalName:'talos-r1-08-live-github-worker',executableArtifactRef:'workers/reference-temporal-worker/src/generic-worker-runtime.ts',artifactDigest,
  sdkFamily:'TEMPORAL_TYPESCRIPT_SDK',sdkVersionRef:'1.22.0',authorityRef:'authority:r1-08-environment-realizer',realizedBy:'r1-08-environment-realizer',
};}

async function replayWithFreshWorker(input:{
  temporal:Awaited<ReturnType<typeof TestWorkflowEnvironment.createLocal>>;
  transport:GitHubIssueCommentCapabilityTransport;
  program:any;
  executionId:string;
  facts:Record<string,unknown>;
  capabilityInputs:Record<string,unknown>;
}){
  const runtime=await createGenericTemporalWorker({connection:input.temporal.nativeConnection,namespace:input.temporal.namespace,taskQueue:TASK_QUEUE,identity:'r1-08-restart-probe-worker',capabilityTransport:input.transport});
  const workerRun=runtime.worker.run();
  try{
    const handle=await input.temporal.client.workflow.start(TalosGenericWorkflow,{workflowId:`talos-r1-08-restart-probe-${input.executionId}`,taskQueue:TASK_QUEUE,args:[{executionId:input.executionId,facts:input.facts,capabilityInputs:input.capabilityInputs,program:input.program}],retry:{maximumAttempts:1}});
    return await handle.result();
  }finally{runtime.worker.shutdown();await workerRun;}
}

test('R1-08 complete One-App authority path reaches real Temporal and creates one idempotent GitHub external effect',{skip:!LIVE_REQUIRED,timeout:180_000},async()=>{
  const repository=required('R1_08_GITHUB_REPOSITORY');
  const token=required('R1_08_GITHUB_TOKEN');
  const headSha=required('R1_08_GITHUB_HEAD_SHA');
  const issueNumber=Number(required('R1_08_GITHUB_PR_NUMBER'));
  assert.equal(Number.isSafeInteger(issueNumber)&&issueNumber>0,true);

  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r1-08-'));
  const temporal=await TestWorkflowEnvironment.createLocal({server:{namespace:'talos-r1-08'}});
  const transportOptions={repository,issueNumber,token};
  const transport=new GitHubIssueCommentCapabilityTransport(transportOptions);
  const artifactPath=path.resolve(process.cwd(),'workers/reference-temporal-worker/src/generic-worker-runtime.ts');
  const artifactDigest=createHash('sha256').update(readFileSync(artifactPath)).digest('hex');
  let workerRuntime:any;let workerRun:Promise<void>|undefined;let compiledProgram:any;let firstWorkflowResult:any;
  let deploymentCalls=0;let workflowCalls=0;

  const app=await startTalosOneApp({
    port:0,runtimeDir,imagePerceptionEnv:{},
    deploymentAttemptExecutor:async({context,deploymentApprovalId,startedAt})=>{
      deploymentCalls+=1;
      assert.equal(context.deploymentApproval?.id,deploymentApprovalId);
      assert.ok(context.executionReview&&context.mapping&&context.runtimePolicy&&context.deploymentDesign&&context.deploymentRealization);
      const conditionRules=context.process.rules.map(rule=>({ref:rule.id,expression:rule.expression}));
      const waits:any[]=[];
      const semantics={conditionRules,waits,snapshotDigest:digestDeterministicJson({conditionRules,waits})};
      compiledProgram=compileGenericRuntimeProgram(context.executionReview.execution,context.mapping,context.runtimePolicy,context.deploymentDesign,semantics,{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'});
      assert.equal(compiledProgram.activity.policies.length,1,'R1-08 live process must resolve to exactly one external capability use');
      workerRuntime=await createGenericTemporalWorker({connection:temporal.nativeConnection,namespace:temporal.namespace,taskQueue:TASK_QUEUE,identity:'r1-08-live-worker',capabilityTransport:transport});
      workerRun=workerRuntime.worker.run();
      const state=await Promise.race([workerRun.then(()=> 'STOPPED' as const),new Promise<'RUNNING'>(resolve=>setTimeout(()=>resolve('RUNNING'),150))]);
      assert.equal(state,'RUNNING');
      return{completedAt:new Date().toISOString(),result:'SUCCEEDED' as const,diagnosticRefs:[],evidenceRefs:[`namespace:${temporal.namespace}`,`task-queue:${TASK_QUEUE}`,`runtime-program:${compiledProgram.programDigest}`,`started:${startedAt}`],orchestratorRef:'R1_08_LOCAL_TEMPORAL_GITHUB_DEPLOYER'};
    },
    workflowExecutionExecutor:async({context,workflowExecutionApprovalId,executionId,facts,capabilityInputs,startedAt})=>{
      workflowCalls+=1;
      assert.equal(context.workflowExecutionApproval?.id,workflowExecutionApprovalId);
      assert.ok(compiledProgram&&workerRuntime&&workerRun);
      const workflowId=`talos-r1-08-${executionId}`;
      const handle=await temporal.client.workflow.start(TalosGenericWorkflow,{workflowId,taskQueue:TASK_QUEUE,args:[{executionId,facts,capabilityInputs,program:compiledProgram}],retry:{maximumAttempts:compiledProgram.workflow.workflowMaximumAttempts}});
      firstWorkflowResult=await handle.result();
      assert.equal(firstWorkflowResult.outcome,'COMPLETED');
      assert.equal(firstWorkflowResult.capabilityResults.length,1);
      const effect=firstWorkflowResult.capabilityResults[0];
      assert.equal(effect.transportRef,GITHUB_ISSUE_COMMENT_TRANSPORT_REF);
      assert.ok(['INSERTED','DUPLICATE_IDENTICAL'].includes(effect.effectStatus));
      assert.ok(effect.externalEffectRef?.startsWith('github:issue-comment:'));
      const description=await handle.describe();
      const runId=(description as any).runId??(handle as any).firstExecutionRunId;
      assert.ok(runId);
      return{completedAt:new Date().toISOString(),workflowExecutionRef:`temporal:${workflowId}:${runId}`,workflowIdRef:workflowId,runIdRef:String(runId),executionStatus:'COMPLETED' as const,evidenceRefs:[`workflow-id:${workflowId}`,`run-id:${runId}`,`runtime-program:${compiledProgram.programDigest}`,`external-effect:${effect.externalEffectRef}`,`effect-status:${effect.effectStatus}`,...(effect.evidenceRefs??[]),`started:${startedAt}`]};
    },
  });

  const executionId=`R1-08-${headSha}`;
  const comment=['Talos R1-08 full-product live external-effect evidence.','',`Certified PR head: ${headSha}`,'Path: source → confirmation → Automation Design → capability binding → ExecutionPlan approval → RuntimePolicy → deployment approval → execution approval → Temporal Activity → GitHub.','This comment is idempotent evidence; reruns with the same approved input must not create duplicates.'].join('\n');

  try{
    const imported=await post(app.baseUrl,'/api/input/bpmn',{fileName:'r1-08.bpmn',bpmnXml:bpmn,initiatedBy:'r1-08-user'});assert.equal(imported.response.status,201);
    const confirmed=await post(app.baseUrl,'/api/bpmn/confirm',{revisionId:imported.body.revision.id,canonicalProcessRevisionId:imported.body.revision.canonicalProcessRevisionId,confirmedBy:'r1-08-user',authorityRef:'authority:r1-08-process-owner',rationale:'Confirm exact live external-effect business process.'});assert.equal(confirmed.response.status,201);
    const opened=await post(app.baseUrl,'/api/bpmn/automation-design-approval',{revisionId:confirmed.body.revision.id,confirmationId:confirmed.body.confirmation.id,approvedBy:'r1-08-user',authorityRef:'authority:r1-08-automation-design'});assert.equal(opened.response.status,201);
    const workspace=opened.body.automationDesign.workspace;
    assert.equal(workspace.requirements.length,1);
    const requirement=workspace.requirements[0];
    const selected=await post(app.baseUrl,'/api/automation/capability/select',{workspaceId:workspace.id,selections:[{source:'EXPLICIT_OFFERING',requirementRef:requirement.capabilityRequirementRef,family:'COMMUNICATION',offeringCanonicalName:'GitHub issue/PR comment external effect',offeringLifecycleStatus:'CERTIFICATION',implementationKind:'DIRECT_API',implementationRef:GITHUB_ISSUE_COMMENT_TRANSPORT_REF,decidedBy:'r1-08-capability-owner',authorityRef:'authority:r1-08-capability-owner',rationale:'Explicitly select the production-like GitHub REST comment transport for this live certification path.'}]});assert.equal(selected.response.status,201);
    const reviewed=await post(app.baseUrl,'/api/automation/execution-plan/review',{workspaceId:workspace.id,decisions:{}});assert.equal(reviewed.response.status,201);assert.equal(reviewed.body.execution.capabilityUses.length,1);
    const automationApproval=await post(app.baseUrl,'/api/automation/approve',{reviewId:reviewed.body.review.id,approvedBy:'r1-08-automation-owner',authorityRef:'authority:r1-08-automation-owner',rationale:'Approve exact plan for Temporal design.'});assert.equal(automationApproval.response.status,201);
    const mapped=await post(app.baseUrl,'/api/automation/temporal-mapping',{approvalId:automationApproval.body.id,waits:[],humans:[]});assert.equal(mapped.response.status,201);
    const use=reviewed.body.execution.capabilityUses[0];
    const runtime=await post(app.baseUrl,'/api/automation/runtime-policy',{approvalId:automationApproval.body.id,temporalMappingRevisionId:mapped.body.mapping.revision.id,activities:[{capabilityUseOccurrenceRef:use.id,authorityRef:'authority:r1-08-runtime',decidedBy:'r1-08-runtime-owner',rationale:'Explicit GitHub external-effect runtime policy.',policyBasis:'LIVE_EXTERNAL_CERTIFICATION',retry:{initialIntervalMs:100,backoffCoefficient:2,maximumIntervalMs:1000,maximumAttempts:2,nonRetryableFailureTypes:['INVALID_GITHUB_COMMENT_CAPABILITY_INPUT','GITHUB_EXTERNAL_IDEMPOTENCY_CONFLICT','GITHUB_EXTERNAL_AUTH_OR_SCOPE_FAILURE','GITHUB_EXTERNAL_AUTH_OR_REQUEST_FAILURE','GITHUB_EXTERNAL_INVALID_RESPONSE']},timeout:{startToCloseMs:15000,scheduleToCloseMs:30000},idempotency:{requirement:'REQUIRED',strategyKind:'IDEMPOTENCY_KEY',keyContract:'sha256(executionId + capabilityUseOccurrenceRef)',enforcementRef:GITHUB_ISSUE_COMMENT_TRANSPORT_REF},failureClassifications:[{failureType:'TRANSIENT_FAILURE',retryable:true,businessFailure:false},{failureType:'INVALID_GITHUB_COMMENT_CAPABILITY_INPUT',retryable:false,businessFailure:false},{failureType:'GITHUB_EXTERNAL_IDEMPOTENCY_CONFLICT',retryable:false,businessFailure:false}]}],workflow:{authorityRef:'authority:r1-08-workflow-policy',decidedBy:'r1-08-runtime-owner',rationale:'No implicit whole-workflow retry for a real external effect.',maximumAttempts:1,policyBasis:'LIVE_EXTERNAL_CERTIFICATION'}});assert.equal(runtime.response.status,201);
    const deploymentDesign=await post(app.baseUrl,'/api/automation/deployment-design',{approvalId:automationApproval.body.id,runtimePolicyRevisionId:runtime.body.runtimePolicy.revision.id,environmentKey:'r1-08-live',environmentClass:'TEST',temporalPlatformRef:'TEMPORAL_LOCAL_LIVE_GITHUB',desiredNamespaceKey:temporal.namespace,desiredTaskQueueKey:TASK_QUEUE,desiredWorkflowTypeName:'TalosGenericWorkflow',desiredActivityTypeName:'executeGenericCapability',desiredWorkerLogicalName:'talos-r1-08-live-github-worker',authorityRef:'authority:r1-08-deployment-designer',decidedBy:'r1-08-deployment-designer',rationale:'Design exact live-certification runtime target.'});assert.equal(deploymentDesign.response.status,201);
    const realization=await post(app.baseUrl,'/api/automation/environment-realization',{approvalId:automationApproval.body.id,deploymentRevisionId:deploymentDesign.body.deploymentDesign.revision.id,...realizationEvidence(temporal.namespace,artifactDigest)});assert.equal(realization.response.status,201);
    const deploymentApproval=await post(app.baseUrl,'/api/automation/deployment/approve',{automationApprovalId:automationApproval.body.id,deploymentRevisionId:realization.body.deploymentRealization.revision.id,authorityRef:'authority:r1-08-deployment-owner',approvedBy:'r1-08-deployment-owner',rationale:'Authorize one exact live Worker deployment attempt.'});assert.equal(deploymentApproval.response.status,201);
    const attempt=await post(app.baseUrl,'/api/automation/deployment/attempt',{deploymentApprovalId:deploymentApproval.body.deploymentApproval.id,deploymentRevisionId:realization.body.deploymentRealization.revision.id});assert.equal(attempt.response.status,201);assert.equal(attempt.body.deploymentAttemptSucceeded,true);assert.equal(deploymentCalls,1);

    const facts={certification:'R1-08',headSha};
    const capabilityInputs={[use.id]:{comment}};
    const executionApproval=await post(app.baseUrl,'/api/automation/execution/approve',{automationApprovalId:automationApproval.body.id,deploymentRevisionId:realization.body.deploymentRealization.revision.id,deploymentAttemptId:attempt.body.deploymentAttempt.id,workflowTypeBindingRef:realization.body.deploymentRealization.workflowTypeBindings[0].id,executionId,facts,capabilityInputs,authorityRef:'authority:r1-08-execution-owner',approvedBy:'r1-08-execution-owner',rationale:'Authorize exactly one live workflow start with this exact GitHub comment input.'});assert.equal(executionApproval.response.status,201);
    const started=await post(app.baseUrl,'/api/automation/execution/start',{workflowExecutionApprovalId:executionApproval.body.workflowExecutionApproval.id,deploymentRevisionId:realization.body.deploymentRealization.revision.id,executionId,facts,capabilityInputs});assert.equal(started.response.status,201);assert.equal(started.body.workflowExecutionObservation.executionStatus,'COMPLETED');assert.equal(started.body.additionalWorkflowStartAuthorized,false);assert.equal(workflowCalls,1);
    assert.equal(JSON.stringify(started.body).includes(token),false,'durable One-App execution evidence must not contain the GitHub token');

    const identity=genericEffectIdentity({executionId,capabilityUseOccurrenceRef:use.id,input:{comment}});
    const afterFirst=await inspectGitHubIssueCommentEffect(transportOptions,identity);
    assert.equal(afterFirst.conflictingMatches.length,0);
    assert.equal(afterFirst.exactMatches.length,1,'full One-App execution must leave exactly one GitHub effect');

    workerRuntime.worker.shutdown();await workerRun;workerRuntime=undefined;workerRun=undefined;
    const replay=await replayWithFreshWorker({temporal,transport,program:compiledProgram,executionId,facts,capabilityInputs});
    assert.equal(replay.outcome,'COMPLETED');
    assert.equal(replay.capabilityResults.length,1);
    assert.equal(replay.capabilityResults[0].effectStatus,'DUPLICATE_IDENTICAL','fresh Worker must dedupe from durable external GitHub evidence');
    const afterReplay=await inspectGitHubIssueCommentEffect(transportOptions,identity);
    assert.equal(afterReplay.conflictingMatches.length,0);
    assert.equal(afterReplay.exactMatches.length,1,'Worker restart replay must not create a second external effect');
  }finally{
    if(workerRuntime){workerRuntime.worker.shutdown();await workerRun?.catch(()=>undefined);}
    await app.close();
    await temporal.teardown().catch(()=>undefined);
  }

  const repo=new SqliteDocumentStore(path.join(runtimeDir,'talos-one-app.sqlite'));
  try{
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length,1);
    const observation=repo.listByKind('WorkflowExecutionObservation')[0].payload as any;
    assert.ok(observation.evidenceRefs.some((ref:string)=>ref.startsWith('external-effect:github:issue-comment:')));
    assert.equal(JSON.stringify(observation).includes(token),false);
  }finally{repo.close();rmSync(runtimeDir,{recursive:true,force:true});}
});
