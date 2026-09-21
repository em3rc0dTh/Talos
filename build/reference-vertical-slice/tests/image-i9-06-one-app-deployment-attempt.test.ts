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

const bpmn = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_I906" targetNamespace="https://talos.local/i9-06">
  <bpmn:process id="Process_I906" name="Deployment Attempt Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="DoWork" name="Perform work"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="DoWork" />
    <bpmn:sequenceFlow id="F2" sourceRef="DoWork" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

async function post(baseUrl:string,pathname:string,payload:Record<string,unknown>){
  const response=await fetch(`${baseUrl}${pathname}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const body=await response.json() as any;
  return{response,body};
}

function workerEvidence(actualNamespace:string){
  const artifactPath=path.resolve(process.cwd(),'workers/reference-temporal-worker/src/generic-worker-runtime.ts');
  const artifactBytes=readFileSync(artifactPath);
  return{
    actualNamespace,
    taskQueue:'talos-i9-06-queue',
    workflowTypeName:'TalosGenericWorkflow',
    activityTypeName:'executeGenericCapability',
    workerLogicalName:'talos-i9-06-worker',
    executableArtifactRef:'workers/reference-temporal-worker/src/generic-worker-runtime.ts',
    artifactDigest:createHash('sha256').update(artifactBytes).digest('hex'),
    sdkFamily:'TEMPORAL_TYPESCRIPT_SDK',
    sdkVersionRef:'1.22.0',
    authorityRef:'authority:i9-06-environment-realizer',
    realizedBy:'i9-06-environment-realizer',
  };
}

async function reachEnvironmentRealization(baseUrl:string,actualNamespace:string){
  const imported=await post(baseUrl,'/api/input/bpmn',{fileName:'i9-06.bpmn',bpmnXml:bpmn,initiatedBy:'i9-06-user'});
  assert.equal(imported.response.status,201);
  const confirmed=await post(baseUrl,'/api/bpmn/confirm',{
    revisionId:imported.body.revision.id,
    canonicalProcessRevisionId:imported.body.revision.canonicalProcessRevisionId,
    confirmedBy:'i9-06-user',
    authorityRef:'authority:i9-06-process-owner',
    rationale:'Confirm exact process before automation design.',
  });
  assert.equal(confirmed.response.status,201);
  const frozen=await post(baseUrl,'/api/bpmn/automation-design-approval',{
    revisionId:confirmed.body.revision.id,
    confirmationId:confirmed.body.confirmation.id,
    approvedBy:'i9-06-user',
    authorityRef:'authority:i9-06-freeze',
  });
  assert.equal(frozen.response.status,201);
  const workspace=frozen.body.automationDesign.workspace;
  const selections=workspace.requirements.map((requirement:any,index:number)=>({
    source:'EXPLICIT_OFFERING',
    requirementRef:requirement.capabilityRequirementRef,
    family:'SYSTEM_OPERATION',
    offeringCanonicalName:`I9-06 Operation ${index+1}`,
    offeringLifecycleStatus:'TEST_ONLY',
    implementationKind:'INTERNAL_SERVICE',
    implementationRef:`i9-06:operation:${index+1}`,
    decidedBy:'i9-06-designer',
    authorityRef:'authority:i9-06-capability-selection',
    rationale:'Explicit capability selection before deployment attempt.',
  }));
  const selected=await post(baseUrl,'/api/automation/capability/select',{workspaceId:workspace.id,selections});
  assert.equal(selected.response.status,201);
  const reviewed=await post(baseUrl,'/api/automation/execution-plan/review',{workspaceId:workspace.id,decisions:{}});
  assert.equal(reviewed.response.status,201);
  const automationApproval=await post(baseUrl,'/api/automation/approve',{
    reviewId:reviewed.body.review.id,
    approvedBy:'i9-06-owner',
    authorityRef:'authority:i9-06-automation-approval',
    rationale:'Approve exact ExecutionPlan for Temporal design only.',
  });
  assert.equal(automationApproval.response.status,201);
  const mapped=await post(baseUrl,'/api/automation/temporal-mapping',{approvalId:automationApproval.body.id,waits:[],humans:[]});
  assert.equal(mapped.response.status,201);
  const activities=reviewed.body.execution.capabilityUses.map((use:any)=>({
    capabilityUseOccurrenceRef:use.id,
    authorityRef:'authority:i9-06-runtime-policy',
    decidedBy:'i9-06-runtime-designer',
    rationale:'Explicit Activity runtime policy before deployment attempt.',
    policyBasis:'REFERENCE_TEST_DESIGN',
    retry:{initialIntervalMs:100,backoffCoefficient:2,maximumIntervalMs:1000,maximumAttempts:3,nonRetryableFailureTypes:['INVALID_REQUEST']},
    timeout:{startToCloseMs:5000,scheduleToCloseMs:10000},
    idempotency:{requirement:'REQUIRED',strategyKind:'IDEMPOTENCY_KEY',keyContract:'sha256(executionId + capabilityUseOccurrenceRef)',enforcementRef:'ONE_APP_EFFECT_LEDGER'},
    failureClassifications:[
      {failureType:'TRANSIENT_FAILURE',retryable:true,businessFailure:false},
      {failureType:'INVALID_REQUEST',retryable:false,businessFailure:false},
    ],
  }));
  const runtimePolicy=await post(baseUrl,'/api/automation/runtime-policy',{
    approvalId:automationApproval.body.id,
    temporalMappingRevisionId:mapped.body.mapping.revision.id,
    activities,
    workflow:{authorityRef:'authority:i9-06-workflow-policy',decidedBy:'i9-06-runtime-designer',rationale:'Prevent implicit whole-workflow retries.',maximumAttempts:1,policyBasis:'REFERENCE_TEST_DESIGN'},
  });
  assert.equal(runtimePolicy.response.status,201);
  const deploymentDesign=await post(baseUrl,'/api/automation/deployment-design',{
    approvalId:automationApproval.body.id,
    runtimePolicyRevisionId:runtimePolicy.body.runtimePolicy.revision.id,
    environmentKey:'talos-i9-06-test',
    environmentClass:'TEST',
    temporalPlatformRef:'TEMPORAL_LOCAL_TEST',
    desiredNamespaceKey:'talos-i9-06',
    desiredTaskQueueKey:'talos-i9-06-queue',
    desiredWorkflowTypeName:'TalosGenericWorkflow',
    desiredActivityTypeName:'executeGenericCapability',
    desiredWorkerLogicalName:'talos-i9-06-worker',
    authorityRef:'authority:i9-06-deployment-designer',
    decidedBy:'i9-06-deployment-designer',
    rationale:'Design exact target before environment realization.',
  });
  assert.equal(deploymentDesign.response.status,201);
  const realization=await post(baseUrl,'/api/automation/environment-realization',{
    approvalId:automationApproval.body.id,
    deploymentRevisionId:deploymentDesign.body.deploymentDesign.revision.id,
    ...workerEvidence(actualNamespace),
  });
  assert.equal(realization.response.status,201);
  assert.equal(realization.body.deploymentRealization.assessment.readiness,'READY_FOR_DEPLOYMENT_ATTEMPT');
  return{
    automationApproval:automationApproval.body,
    realization:realization.body.deploymentRealization,
  };
}

test('I9-06 explicitly approves one exact realized DeploymentRevision and performs a real Worker deployment attempt without workflow execution authority',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-i9-06-attempt-'));
  const temporal=await TestWorkflowEnvironment.createLocal({server:{namespace:'talos-i9-06'}});
  let executorCalls=0;
  const app=await startTalosOneApp({
    port:0,
    runtimeDir,
    imagePerceptionEnv:{},
    deploymentAttemptExecutor:async({context,deploymentApprovalId,attemptNumber,startedAt})=>{
      executorCalls+=1;
      assert.equal(attemptNumber,1);
      assert.equal(context.deploymentApproval?.id,deploymentApprovalId);
      assert.equal(context.deploymentApproval?.createsExecutionAuthority,false);
      assert.ok(context.executionReview&&context.mapping&&context.runtimePolicy&&context.deploymentDesign&&context.deploymentRealization);
      const conditionRules=context.process.rules.map(rule=>({ref:rule.id,expression:rule.expression}));
      const waits:any[]=[];
      const semantics={conditionRules,waits,snapshotDigest:digestDeterministicJson({conditionRules,waits})};
      const program=compileGenericRuntimeProgram(
        context.executionReview.execution,
        context.mapping,
        context.runtimePolicy,
        context.deploymentDesign,
        semantics,
        {family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'},
      );
      const taskQueue=context.deploymentRealization.taskQueueBindings[0].taskQueueKey;
      const ledger=new GenericEffectLedger();
      const runtime=await createGenericTemporalWorker({
        connection:temporal.nativeConnection,
        namespace:temporal.namespace,
        taskQueue,
        identity:`i9-06-worker-attempt-${executorCalls}`,
        ledger,
      });
      const run=runtime.worker.run();
      const state=await Promise.race([
        run.then(()=> 'STOPPED' as const),
        new Promise<'RUNNING'>(resolve=>setTimeout(()=>resolve('RUNNING'),150)),
      ]);
      assert.equal(state,'RUNNING','deployment attempt Worker must remain running after startup');
      runtime.worker.shutdown();
      await run;
      assert.equal(ledger.list().length,0,'deployment attempt must not execute business Activities');
      return{
        completedAt:new Date().toISOString(),
        result:'SUCCEEDED' as const,
        diagnosticRefs:[],
        evidenceRefs:[
          `temporal-namespace:${temporal.namespace}`,
          `task-queue:${taskQueue}`,
          `worker-artifact:${context.deploymentRealization.workerArtifactBindings[0].artifactDigest}`,
          `runtime-program:${program.programDigest}`,
          `attempt-started-at:${startedAt}`,
        ],
        orchestratorRef:'I9-06_LOCAL_TEMPORAL_WORKER_EXECUTOR',
      };
    },
  });
  try{
    const status=await (await fetch(`${app.baseUrl}/api/status`)).json() as any;
    assert.equal(status.releaseGate,'I9-01_ONE_APP_NATIVE_BPMN_E2E');
    assert.equal(status.currentAuthorityStage,'I9-03_EXPLICIT_RUNTIME_POLICY_DESIGN');
    assert.equal(status.latestAuthorityStage,'I9-04_DEPLOYMENT_DESIGN');
    assert.equal(status.environmentRealizationStage,'I9-05_ENVIRONMENT_REALIZATION');
    assert.equal(status.deploymentAttemptStage,'I9-06_EXPLICIT_DEPLOYMENT_APPROVAL_ATTEMPT');
    assert.equal(status.authorityChain.includes('EXPLICIT_DEPLOYMENT_APPROVAL'),true);
    assert.equal(status.authorityChain.includes('DEPLOYMENT_ATTEMPT'),true);
    assert.equal(status.deploymentAttemptExecutorConfigured,true);
    assert.equal(status.automaticDeploymentAttemptAuthorized,false);
    assert.equal(status.executionAuthorized,false);

    const x=await reachEnvironmentRealization(app.baseUrl,temporal.namespace);
    const staleApproval=await post(app.baseUrl,'/api/automation/deployment/approve',{
      automationApprovalId:x.automationApproval.id,
      deploymentRevisionId:'deployment:wrong-realized-revision',
      authorityRef:'authority:i9-06-deployment-owner',
      approvedBy:'i9-06-deployment-owner',
      rationale:'Must not approve stale deployment revision.',
    });
    assert.equal(staleApproval.response.status,409);

    const approved=await post(app.baseUrl,'/api/automation/deployment/approve',{
      automationApprovalId:x.automationApproval.id,
      deploymentRevisionId:x.realization.revision.id,
      authorityRef:'authority:i9-06-deployment-owner',
      approvedBy:'i9-06-deployment-owner',
      rationale:'Authorize exactly one Worker deployment attempt for this realized revision.',
    });
    assert.equal(approved.response.status,201);
    assert.equal(approved.body.deploymentApproval.deploymentRevisionRef,x.realization.revision.id);
    assert.equal(approved.body.deploymentApproval.authorizedAttemptCount,1);
    assert.equal(approved.body.deploymentApproval.createsDeploymentAttemptAuthority,true);
    assert.equal(approved.body.deploymentApproval.createsExecutionAuthority,false);
    assert.equal(approved.body.deploymentAttemptAuthorized,true);
    assert.equal(approved.body.idempotentReplay,false);
    assert.equal(approved.body.executionAuthorized,false);

    const replayApproval=await post(app.baseUrl,'/api/automation/deployment/approve',{
      automationApprovalId:x.automationApproval.id,
      deploymentRevisionId:x.realization.revision.id,
      authorityRef:'authority:i9-06-deployment-owner-replay',
      approvedBy:'i9-06-deployment-owner-replay',
      rationale:'Repeated UI click must reuse the exact unconsumed approval without appending authority.',
    });
    assert.equal(replayApproval.response.status,200);
    assert.equal(replayApproval.body.idempotentReplay,true);
    assert.equal(replayApproval.body.deploymentAttemptAuthorized,true);
    assert.equal(replayApproval.body.authorizedAttemptCount,1);
    assert.equal(replayApproval.body.deploymentApproval.id,approved.body.deploymentApproval.id);
    assert.equal(replayApproval.body.deploymentApproval.authorityRef,approved.body.deploymentApproval.authorityRef);

    const staleAttempt=await post(app.baseUrl,'/api/automation/deployment/attempt',{
      deploymentApprovalId:approved.body.deploymentApproval.id,
      deploymentRevisionId:'deployment:wrong-realized-revision',
    });
    assert.equal(staleAttempt.response.status,409);
    assert.equal(executorCalls,0);

    const attempted=await post(app.baseUrl,'/api/automation/deployment/attempt',{
      deploymentApprovalId:approved.body.deploymentApproval.id,
      deploymentRevisionId:x.realization.revision.id,
    });
    assert.equal(attempted.response.status,201);
    assert.equal(executorCalls,1);
    assert.equal(attempted.body.deploymentAttempt.deploymentRevisionRef,x.realization.revision.id);
    assert.equal(attempted.body.deploymentAttempt.deploymentApprovalRef,approved.body.deploymentApproval.id);
    assert.equal(attempted.body.deploymentAttempt.attemptNumber,1);
    assert.equal(attempted.body.deploymentAttempt.result,'SUCCEEDED');
    assert.ok(attempted.body.deploymentAttempt.evidenceRefs.length>=4);
    assert.equal(attempted.body.deploymentAttemptConsumed,true);
    assert.equal(attempted.body.deploymentAttemptSucceeded,true);
    assert.equal(attempted.body.executionAuthorized,false);

    const duplicate=await post(app.baseUrl,'/api/automation/deployment/attempt',{
      deploymentApprovalId:approved.body.deploymentApproval.id,
      deploymentRevisionId:x.realization.revision.id,
    });
    assert.equal(duplicate.response.status,409);
    assert.equal(executorCalls,1,'consumed one-attempt approval must be rejected before executor invocation');

    const replayAfterAttempt=await post(app.baseUrl,'/api/automation/deployment/approve',{
      automationApprovalId:x.automationApproval.id,
      deploymentRevisionId:x.realization.revision.id,
      authorityRef:'authority:i9-06-after-attempt',
      approvedBy:'i9-06-after-attempt',
      rationale:'A consumed approval may be replayed for inspection but must not create another deployment-attempt authority.',
    });
    assert.equal(replayAfterAttempt.response.status,200);
    assert.equal(replayAfterAttempt.body.idempotentReplay,true);
    assert.equal(replayAfterAttempt.body.deploymentApproval.id,approved.body.deploymentApproval.id);
    assert.equal(replayAfterAttempt.body.deploymentAttemptAuthorized,false);
    assert.equal(replayAfterAttempt.body.authorizedAttemptCount,0);
  }finally{
    await app.close();
    await temporal.teardown().catch(()=>undefined);
  }

  const repo=new SqliteDocumentStore(path.join(runtimeDir,'talos-one-app.sqlite'));
  try{
    assert.equal(repo.listByKind('DeploymentApprovalRecord').length,1);
    assert.equal(repo.listByKind('DeploymentAttempt').length,1);
    assert.equal(repo.listByKind('WorkflowExecutionObservation').length,0);
    const approval=repo.listByKind('DeploymentApprovalRecord')[0].payload as any;
    const attempt=repo.listByKind('DeploymentAttempt')[0].payload as any;
    assert.equal(attempt.deploymentApprovalRef,approval.id);
    assert.equal(approval.createsExecutionAuthority,false);
  }finally{
    repo.close();
    rmSync(runtimeDir,{recursive:true,force:true});
  }
});

test('I9-06 refuses a deployment attempt when no trusted deployment executor is configured',async()=>{
  const app=await startTalosOneApp({port:0,imagePerceptionEnv:{}});
  try{
    const result=await post(app.baseUrl,'/api/automation/deployment/attempt',{
      deploymentApprovalId:'deployment:missing-approval',
      deploymentRevisionId:'deployment:missing-realization',
    });
    assert.equal(result.response.status,409);
    assert.equal(result.body.code,'ONE_APP_AUTHORITY_ORDER_VIOLATION');
  }finally{
    await app.close();
  }
});
