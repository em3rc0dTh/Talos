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
import { GenericEffectLedger } from '../workers/reference-temporal-worker/src/generic-activities.ts';
import { TalosGenericWorkflow } from '../workers/reference-temporal-worker/src/generic-workflow.ts';

const bpmn=`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_I907" targetNamespace="https://talos.local/i9-07">
  <bpmn:process id="Process_I907" name="Explicit Workflow Execution Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="DoWork" name="Perform approved work"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="DoWork" />
    <bpmn:sequenceFlow id="F2" sourceRef="DoWork" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

async function post(baseUrl:string,pathname:string,payload:Record<string,unknown>){
  const response=await fetch(`${baseUrl}${pathname}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  return{response,body:await response.json() as any};
}

function workerEvidence(actualNamespace:string){
  const artifactPath=path.resolve(process.cwd(),'workers/reference-temporal-worker/src/generic-worker-runtime.ts');
  return{
    actualNamespace,
    taskQueue:'talos-i9-07-queue',
    workflowTypeName:'TalosGenericWorkflow',
    activityTypeName:'executeGenericCapability',
    workerLogicalName:'talos-i9-07-worker',
    executableArtifactRef:'workers/reference-temporal-worker/src/generic-worker-runtime.ts',
    artifactDigest:createHash('sha256').update(readFileSync(artifactPath)).digest('hex'),
    sdkFamily:'TEMPORAL_TYPESCRIPT_SDK',
    sdkVersionRef:'1.22.0',
    authorityRef:'authority:i9-07-environment-realizer',
    realizedBy:'i9-07-environment-realizer',
  };
}

async function reachRealization(baseUrl:string,actualNamespace:string){
  const imported=await post(baseUrl,'/api/input/bpmn',{fileName:'i9-07.bpmn',bpmnXml:bpmn,initiatedBy:'i9-07-user'});
  assert.equal(imported.response.status,201);
  const confirmed=await post(baseUrl,'/api/bpmn/confirm',{
    revisionId:imported.body.revision.id,
    canonicalProcessRevisionId:imported.body.revision.canonicalProcessRevisionId,
    confirmedBy:'i9-07-user',authorityRef:'authority:i9-07-process-owner',rationale:'Confirm exact process before automation design.',
  });
  assert.equal(confirmed.response.status,201);
  const frozen=await post(baseUrl,'/api/bpmn/automation-design-approval',{
    revisionId:confirmed.body.revision.id,confirmationId:confirmed.body.confirmation.id,
    approvedBy:'i9-07-user',authorityRef:'authority:i9-07-freeze',
  });
  assert.equal(frozen.response.status,201);
  const workspace=frozen.body.automationDesign.workspace;
  const selections=workspace.requirements.map((requirement:any,index:number)=>({
    source:'EXPLICIT_OFFERING',requirementRef:requirement.capabilityRequirementRef,family:'SYSTEM_OPERATION',
    offeringCanonicalName:`I9-07 Operation ${index+1}`,offeringLifecycleStatus:'TEST_ONLY',
    implementationKind:'INTERNAL_SERVICE',implementationRef:`i9-07:operation:${index+1}`,
    decidedBy:'i9-07-designer',authorityRef:'authority:i9-07-capability-selection',rationale:'Explicit selection before workflow execution.',
  }));
  const selected=await post(baseUrl,'/api/automation/capability/select',{workspaceId:workspace.id,selections});
  assert.equal(selected.response.status,201);
  const reviewed=await post(baseUrl,'/api/automation/execution-plan/review',{workspaceId:workspace.id,decisions:{}});
  assert.equal(reviewed.response.status,201);
  const automationApproval=await post(baseUrl,'/api/automation/approve',{
    reviewId:reviewed.body.review.id,approvedBy:'i9-07-owner',authorityRef:'authority:i9-07-automation-approval',
    rationale:'Approve exact ExecutionPlan for Temporal design only.',
  });
  assert.equal(automationApproval.response.status,201);
  const mapped=await post(baseUrl,'/api/automation/temporal-mapping',{approvalId:automationApproval.body.id,waits:[],humans:[]});
  assert.equal(mapped.response.status,201);
  const activities=reviewed.body.execution.capabilityUses.map((use:any)=>({
    capabilityUseOccurrenceRef:use.id,authorityRef:'authority:i9-07-runtime-policy',decidedBy:'i9-07-runtime-designer',
    rationale:'Explicit Activity policy before execution.',policyBasis:'REFERENCE_TEST_DESIGN',
    retry:{initialIntervalMs:100,backoffCoefficient:2,maximumIntervalMs:1000,maximumAttempts:3,nonRetryableFailureTypes:['INVALID_REQUEST']},
    timeout:{startToCloseMs:5000,scheduleToCloseMs:10000},
    idempotency:{requirement:'REQUIRED',strategyKind:'IDEMPOTENCY_KEY',keyContract:'sha256(executionId + capabilityUseOccurrenceRef)',enforcementRef:'ONE_APP_EFFECT_LEDGER'},
    failureClassifications:[{failureType:'TRANSIENT_FAILURE',retryable:true,businessFailure:false},{failureType:'INVALID_REQUEST',retryable:false,businessFailure:false}],
  }));
  const runtimePolicy=await post(baseUrl,'/api/automation/runtime-policy',{
    approvalId:automationApproval.body.id,temporalMappingRevisionId:mapped.body.mapping.revision.id,activities,
    workflow:{authorityRef:'authority:i9-07-workflow-policy',decidedBy:'i9-07-runtime-designer',rationale:'No implicit whole-workflow retries.',maximumAttempts:1,policyBasis:'REFERENCE_TEST_DESIGN'},
  });
  assert.equal(runtimePolicy.response.status,201);
  const deploymentDesign=await post(baseUrl,'/api/automation/deployment-design',{
    approvalId:automationApproval.body.id,runtimePolicyRevisionId:runtimePolicy.body.runtimePolicy.revision.id,
    environmentKey:'talos-i9-07-test',environmentClass:'TEST',temporalPlatformRef:'TEMPORAL_LOCAL_TEST',
    desiredNamespaceKey:'talos-i9-07',desiredTaskQueueKey:'talos-i9-07-queue',desiredWorkflowTypeName:'TalosGenericWorkflow',
    desiredActivityTypeName:'executeGenericCapability',desiredWorkerLogicalName:'talos-i9-07-worker',
    authorityRef:'authority:i9-07-deployment-designer',decidedBy:'i9-07-deployment-designer',rationale:'Design exact target before realization.',
  });
  assert.equal(deploymentDesign.response.status,201);
  const realization=await post(baseUrl,'/api/automation/environment-realization',{
    approvalId:automationApproval.body.id,deploymentRevisionId:deploymentDesign.body.deploymentDesign.revision.id,...workerEvidence(actualNamespace),
  });
  assert.equal(realization.response.status,201);
  return{automationApproval:automationApproval.body,realization:realization.body.deploymentRealization};
}

test('I9-07 requires explicit one-start authority before a real Temporal business workflow and persists exact execution provenance',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-i9-07-'));
  const temporal=await TestWorkflowEnvironment.createLocal({server:{namespace:'talos-i9-07'}});
  const ledger=new GenericEffectLedger();
  let workerRuntime:any;
  let workerRun:Promise<void>|undefined;
  let compiledProgram:any;
  let deploymentExecutorCalls=0;
  let workflowExecutorCalls=0;

  const app=await startTalosOneApp({
    port:0,runtimeDir,imagePerceptionEnv:{},
    deploymentAttemptExecutor:async({context,deploymentApprovalId,startedAt})=>{
      deploymentExecutorCalls+=1;
      assert.equal(context.deploymentApproval?.id,deploymentApprovalId);
      assert.ok(context.executionReview&&context.mapping&&context.runtimePolicy&&context.deploymentDesign&&context.deploymentRealization);
      assert.equal(context.deploymentRealization.revision.parentDeploymentRevisionRef,context.deploymentDesign.revision.id);
      const conditionRules=context.process.rules.map(rule=>({ref:rule.id,expression:rule.expression}));
      const waits:any[]=[];
      const semantics={conditionRules,waits,snapshotDigest:digestDeterministicJson({conditionRules,waits})};
      compiledProgram=compileGenericRuntimeProgram(context.executionReview.execution,context.mapping,context.runtimePolicy,context.deploymentDesign,semantics,{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'});
      assert.equal(compiledProgram.deploymentRevisionRef,context.deploymentRealization.revision.parentDeploymentRevisionRef);
      const taskQueue=context.deploymentRealization.taskQueueBindings[0].taskQueueKey;
      workerRuntime=await createGenericTemporalWorker({connection:temporal.nativeConnection,namespace:temporal.namespace,taskQueue,identity:'i9-07-deployed-worker',ledger});
      workerRun=workerRuntime.worker.run();
      const state=await Promise.race([workerRun.then(()=> 'STOPPED' as const),new Promise<'RUNNING'>(resolve=>setTimeout(()=>resolve('RUNNING'),150))]);
      assert.equal(state,'RUNNING');
      assert.equal(ledger.list().length,0,'deployment alone must not execute the business workflow');
      return{completedAt:new Date().toISOString(),result:'SUCCEEDED' as const,diagnosticRefs:[],evidenceRefs:[`namespace:${temporal.namespace}`,`task-queue:${taskQueue}`,`runtime-program:${compiledProgram.programDigest}`,`started:${startedAt}`],orchestratorRef:'I9-07_LOCAL_TEMPORAL_WORKER_DEPLOYER'};
    },
    workflowExecutionExecutor:async({context,workflowExecutionApprovalId,executionId,facts,capabilityInputs,startedAt})=>{
      workflowExecutorCalls+=1;
      assert.equal(context.workflowExecutionApproval?.id,workflowExecutionApprovalId);
      assert.ok(compiledProgram&&workerRuntime&&workerRun);
      const taskQueue=context.deploymentRealization!.taskQueueBindings[0].taskQueueKey;
      const workflowId=`talos-i9-07-${executionId}`;
      const handle=await temporal.client.workflow.start(TalosGenericWorkflow,{
        workflowId,taskQueue,
        args:[{executionId,facts,capabilityInputs,program:compiledProgram}],
        retry:{maximumAttempts:compiledProgram.workflow.workflowMaximumAttempts},
      });
      const result=await handle.result();
      assert.equal(result.outcome,'COMPLETED');
      assert.equal(result.executionId,executionId);
      const description=await handle.describe();
      const runId=(description as any).runId??(handle as any).firstExecutionRunId;
      assert.ok(runId,'Temporal execution must expose a concrete run id');
      return{
        completedAt:new Date().toISOString(),workflowExecutionRef:`temporal:${workflowId}:${runId}`,
        workflowIdRef:workflowId,runIdRef:String(runId),executionStatus:'COMPLETED' as const,
        evidenceRefs:[`workflow-id:${workflowId}`,`run-id:${runId}`,`runtime-program:${compiledProgram.programDigest}`,`started:${startedAt}`,`outcome:${result.outcome}`],
      };
    },
  });

  try{
    const status=await (await fetch(`${app.baseUrl}/api/status`)).json() as any;
    assert.equal(status.deploymentAttemptStage,'I9-06_EXPLICIT_DEPLOYMENT_APPROVAL_ATTEMPT');
    assert.equal(status.workflowExecutionStage,'I9-07_EXPLICIT_WORKFLOW_EXECUTION_AUTHORITY');
    assert.equal(status.automaticWorkflowExecutionAuthorized,false);
    assert.equal(status.workflowExecutionExecutorConfigured,true);
    assert.equal(status.executionAuthorized,false);

    const x=await reachRealization(app.baseUrl,temporal.namespace);
    const premature=await post(app.baseUrl,'/api/automation/execution/approve',{
      automationApprovalId:x.automationApproval.id,deploymentRevisionId:x.realization.revision.id,deploymentAttemptId:'deployment:missing-attempt',
      workflowTypeBindingRef:x.realization.workflowTypeBindings[0].id,executionId:'I9-07-EXEC-001',facts:{approved:true},
      authorityRef:'authority:i9-07-execution-owner',approvedBy:'i9-07-execution-owner',rationale:'Must be blocked before deployment attempt.',
    });
    assert.equal(premature.response.status,409);

    const deploymentApproval=await post(app.baseUrl,'/api/automation/deployment/approve',{
      automationApprovalId:x.automationApproval.id,deploymentRevisionId:x.realization.revision.id,
      authorityRef:'authority:i9-07-deployment-owner',approvedBy:'i9-07-deployment-owner',rationale:'Authorize exactly one Worker deployment attempt.',
    });
    assert.equal(deploymentApproval.response.status,201);
    const deploymentAttempt=await post(app.baseUrl,'/api/automation/deployment/attempt',{
      deploymentApprovalId:deploymentApproval.body.deploymentApproval.id,deploymentRevisionId:x.realization.revision.id,
    });
    assert.equal(deploymentAttempt.response.status,201);
    assert.equal(deploymentAttempt.body.deploymentAttempt.result,'SUCCEEDED');
    assert.equal(deploymentAttempt.body.workflowExecutionAuthorized,false);
    assert.equal(deploymentExecutorCalls,1);
    assert.equal(ledger.list().length,0);

    const executionId='I9-07-EXEC-001';
    const facts={approved:true};
    const capabilityInputs=Object.fromEntries((compiledProgram.activity.policies as any[]).map(policy=>[policy.capabilityUseOccurrenceRef,{source:'i9-07-explicit-input'}]));
    const executionApproval=await post(app.baseUrl,'/api/automation/execution/approve',{
      automationApprovalId:x.automationApproval.id,deploymentRevisionId:x.realization.revision.id,
      deploymentAttemptId:deploymentAttempt.body.deploymentAttempt.id,workflowTypeBindingRef:x.realization.workflowTypeBindings[0].id,
      executionId,facts,capabilityInputs,authorityRef:'authority:i9-07-execution-owner',approvedBy:'i9-07-execution-owner',
      rationale:'Explicitly authorize this exact business workflow input once.',
    });
    assert.equal(executionApproval.response.status,201);
    assert.equal(executionApproval.body.workflowExecutionApproval.deploymentAttemptRef,deploymentAttempt.body.deploymentAttempt.id);
    assert.equal(executionApproval.body.workflowExecutionApproval.authorizedWorkflowStartCount,1);
    assert.equal(executionApproval.body.workflowExecutionApproval.createsWorkflowExecutionAuthority,true);

    const drifted=await post(app.baseUrl,'/api/automation/execution/start',{
      workflowExecutionApprovalId:executionApproval.body.workflowExecutionApproval.id,deploymentRevisionId:x.realization.revision.id,
      executionId,facts:{approved:false},capabilityInputs,
    });
    assert.equal(drifted.response.status,409);
    assert.equal(workflowExecutorCalls,0,'input drift must be rejected before Temporal workflow.start');

    const started=await post(app.baseUrl,'/api/automation/execution/start',{
      workflowExecutionApprovalId:executionApproval.body.workflowExecutionApproval.id,deploymentRevisionId:x.realization.revision.id,
      executionId,facts,capabilityInputs,
    });
    assert.equal(started.response.status,201);
    assert.equal(workflowExecutorCalls,1);
    assert.equal(started.body.workflowExecutionObservation.executionStatus,'COMPLETED');
    assert.equal(started.body.workflowExecutionObservation.startingDeploymentRevisionRef,x.realization.revision.id);
    assert.equal(started.body.workflowExecutionObservation.executionApprovalRef,executionApproval.body.workflowExecutionApproval.id);
    assert.equal(started.body.workflowExecutionObservation.executionInputDigest,executionApproval.body.workflowExecutionApproval.executionInputDigest);
    assert.equal(started.body.workflowExecutionApprovalConsumed,true);
    assert.equal(started.body.additionalWorkflowStartAuthorized,false);
    assert.equal(ledger.list().filter(item=>item.executionId===executionId).length,1);

    const duplicate=await post(app.baseUrl,'/api/automation/execution/start',{
      workflowExecutionApprovalId:executionApproval.body.workflowExecutionApproval.id,deploymentRevisionId:x.realization.revision.id,
      executionId,facts,capabilityInputs,
    });
    assert.equal(duplicate.response.status,409);
    assert.equal(workflowExecutorCalls,1,'consumed one-start authority must block duplicate Temporal workflow.start');
  }finally{
    if(workerRuntime){workerRuntime.worker.shutdown();await workerRun?.catch(()=>undefined);}
    await app.close();
    await temporal.teardown().catch(()=>undefined);
  }

  const repo=new SqliteDocumentStore(path.join(runtimeDir,'talos-one-app.sqlite'));
  try{
    assert.equal(repo.listByKind('DeploymentAttempt').length,1);
    assert.equal(repo.listByKind('WorkflowExecutionApprovalRecord').length,1);
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length,1);
    const approval=repo.listByKind('WorkflowExecutionApprovalRecord')[0].payload as any;
    const observation=repo.listByKind('WorkflowExecutionObservation')[0].payload as any;
    assert.equal(observation.executionApprovalRef,approval.id);
    assert.equal(observation.executionInputDigest,approval.executionInputDigest);
    assert.ok(observation.workflowIdRef);
    assert.ok(observation.runIdRef);
  }finally{
    repo.close();rmSync(runtimeDir,{recursive:true,force:true});
  }
});

test('I9-07 refuses workflow execution without a trusted execution executor',async()=>{
  const app=await startTalosOneApp({port:0,imagePerceptionEnv:{}});
  try{
    const result=await post(app.baseUrl,'/api/automation/execution/start',{
      workflowExecutionApprovalId:'deployment:missing-execution-approval',deploymentRevisionId:'deployment:missing',executionId:'missing',facts:{},
    });
    assert.equal(result.response.status,409);
  }finally{await app.close();}
});
