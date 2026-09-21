import test from 'node:test';
import assert from 'node:assert/strict';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';

async function post(baseUrl:string,pathname:string,payload:Record<string,unknown>){
  const response=await fetch(`${baseUrl}${pathname}`,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify(payload),
  });
  return {response,body:await response.json() as any};
}

test('I9-07C One App exposes exact live human work and completes only the current Temporal Update-backed task',async()=>{
  let currentHumanTaskRef:string|null=null;
  let executionId='R1-11H-EXEC-001';
  let humanUpdateCalls=0;

  const app=await startTalosOneApp({
    port:0,
    imagePerceptionEnv:{},
    deploymentAttemptExecutor:async({startedAt})=>({
      completedAt:new Date().toISOString(),
      result:'SUCCEEDED' as const,
      diagnosticRefs:[],
      evidenceRefs:[`started:${startedAt}`],
      orchestratorRef:'I9_07C_TEST_DEPLOYER',
    }),
    workflowExecutionExecutor:async()=>({
      workflowExecutionRef:'temporal:talos-r1-11h-test:run-r1-11h-test',
      workflowIdRef:'talos-r1-11h-test',
      runIdRef:'run-r1-11h-test',
      executionStatus:'RUNNING' as const,
      evidenceRefs:['i9-07c:workflow-started'],
    }),
    workflowRuntimeStateReader:async()=>({
      executionStatus:'RUNNING' as const,
      state:{
        executionId,
        currentElementRef:currentHumanTaskRef,
        currentHumanTaskRef,
        visitedElementRefs:currentHumanTaskRef?[currentHumanTaskRef]:[],
        completedHumanTaskRefs:[],
      },
    }),
    humanTaskExecutor:async({executionElementRef})=>{
      humanUpdateCalls+=1;
      assert.equal(executionElementRef,currentHumanTaskRef);
      const completed=executionElementRef;
      currentHumanTaskRef=null;
      return{
        executionStatus:'COMPLETED' as const,
        state:{
          executionId,
          currentElementRef:null,
          currentHumanTaskRef:null,
          visitedElementRefs:[completed],
          completedHumanTaskRefs:[completed],
        },
      };
    },
  });

  try{
    const intake=await post(app.baseUrl,'/api/input/canvas',{
      title:'R1-11H manual process',
      initiatedBy:'r1-11h-user',
      elements:[
        {id:'start',kind:'START',label:'Start'},
        {id:'work',kind:'STEP',label:'Wash the vehicle'},
        {id:'end',kind:'END',label:'Done'},
      ],
      connections:[],
    });
    assert.equal(intake.response.status,201);

    const confirmed=await post(app.baseUrl,'/api/bpmn/confirm',{
      revisionId:intake.body.revision.id,
      canonicalProcessRevisionId:intake.body.reconciliation.processRevision.id,
      confirmedBy:'r1-11h-user',
      authorityRef:'authority:r1-11h:process',
      rationale:'Confirm the exact manual process.',
    });
    assert.equal(confirmed.response.status,201);

    const design=await post(app.baseUrl,'/api/bpmn/automation-design-approval',{
      revisionId:confirmed.body.revision.id,
      confirmationId:confirmed.body.confirmation.id,
      approvedBy:'r1-11h-user',
      authorityRef:'authority:r1-11h:design',
    });
    assert.equal(design.response.status,201);
    const workspace=design.body.automationDesign.workspace;
    const requirement=workspace.requirements[0];

    const selected=await post(app.baseUrl,'/api/automation/capability/select',{
      workspaceId:workspace.id,
      selections:[{
        source:'EXPLICIT_OFFERING',
        requirementRef:requirement.capabilityRequirementRef,
        family:'HUMAN_INTERACTION',
        operationIntent:requirement.operationIntent,
        offeringCanonicalName:'Talos manual task',
        offeringLifecycleStatus:'TEST_ONLY',
        implementationKind:'HUMAN_SERVICE',
        implementationRef:'product-explicit:human-interaction:talos-manual-task',
        decidedBy:'r1-11h-user',
        authorityRef:'authority:r1-11h:human',
        rationale:'The business step is explicitly performed by a person.',
        human:{
          interactionKind:'MANUAL_ACTION',
          responsibilityKind:'PERFORMER',
          roleRefs:[],
          participantLabel:'Process operator',
          assignmentCardinality:'ANY_ELIGIBLE',
          outcomes:[{code:'COMPLETED',businessMeaning:'Wash the vehicle is complete.',terminal:true}],
        },
      }],
    });
    assert.equal(selected.response.status,201);

    const reviewed=await post(app.baseUrl,'/api/automation/execution-plan/review',{
      workspaceId:workspace.id,
      decisions:{},
    });
    assert.equal(reviewed.response.status,201);
    const human=reviewed.body.execution.elements.find((element:any)=>element.kind==='HUMAN_COORDINATION');
    assert.ok(human);
    currentHumanTaskRef=human.id;

    const automationApproval=await post(app.baseUrl,'/api/automation/approve',{
      reviewId:reviewed.body.review.id,
      approvedBy:'r1-11h-user',
      authorityRef:'authority:r1-11h:automation',
      rationale:'Approve the reviewed manual automation design.',
    });
    assert.equal(automationApproval.response.status,201);

    const mapped=await post(app.baseUrl,'/api/automation/temporal-mapping',{
      approvalId:automationApproval.body.id,
      useRecommendedMapping:true,
      allowDurableRecovery:true,
      decidedBy:'r1-11h-user',
      authorityRef:'authority:r1-11h:mapping',
      rationale:'Use the product-safe human Update mapping.',
    });
    assert.equal(mapped.response.status,201);

    const policy=await post(app.baseUrl,'/api/automation/runtime-policy',{
      approvalId:automationApproval.body.id,
      temporalMappingRevisionId:mapped.body.mapping.revision.id,
      activities:[],
      workflow:{
        authorityRef:'authority:r1-11h:runtime',
        decidedBy:'r1-11h-user',
        rationale:'One explicit workflow attempt.',
        maximumAttempts:1,
        policyBasis:'USER_EXPLICIT_DESIGN',
      },
    });
    assert.equal(policy.response.status,201);

    const deployment=await post(app.baseUrl,'/api/automation/deployment-design',{
      approvalId:automationApproval.body.id,
      runtimePolicyRevisionId:policy.body.runtimePolicy.revision.id,
      environmentKey:'r1-11h-local',
      environmentClass:'TEST',
      temporalPlatformRef:'TEMPORAL_LOCAL_TEST',
      desiredNamespaceKey:'default',
      desiredTaskQueueKey:'r1-11h-queue',
      desiredWorkflowTypeName:'TalosGenericWorkflow',
      desiredActivityTypeName:'executeGenericCapability',
      desiredWorkerLogicalName:'r1-11h-worker',
      authorityRef:'authority:r1-11h:deployment',
      decidedBy:'r1-11h-user',
      rationale:'Use the exact local test environment.',
    });
    assert.equal(deployment.response.status,201);

    const realized=await post(app.baseUrl,'/api/automation/environment-realization',{
      approvalId:automationApproval.body.id,
      deploymentRevisionId:deployment.body.deploymentDesign.revision.id,
      actualNamespace:'default',
      taskQueue:'r1-11h-queue',
      workflowTypeName:'TalosGenericWorkflow',
      activityTypeName:'executeGenericCapability',
      workerLogicalName:'r1-11h-worker',
      executableArtifactRef:'workers/reference-temporal-worker/src/generic-worker-runtime.ts',
      artifactDigest:'r1-11h-test-worker-digest',
      sdkFamily:'TEMPORAL_TYPESCRIPT_SDK',
      sdkVersionRef:'1.22.0',
      authorityRef:'authority:r1-11h:realization',
      realizedBy:'r1-11h-host',
    });
    assert.equal(realized.response.status,201);

    const deployApproval=await post(app.baseUrl,'/api/automation/deployment/approve',{
      automationApprovalId:automationApproval.body.id,
      deploymentRevisionId:realized.body.deploymentRealization.revision.id,
      authorityRef:'authority:r1-11h:deploy-once',
      approvedBy:'r1-11h-user',
      rationale:'Authorize exactly one Worker deployment attempt.',
    });
    assert.equal(deployApproval.response.status,201);

    const attempt=await post(app.baseUrl,'/api/automation/deployment/attempt',{
      deploymentApprovalId:deployApproval.body.deploymentApproval.id,
      deploymentRevisionId:realized.body.deploymentRealization.revision.id,
    });
    assert.equal(attempt.response.status,201);
    assert.equal(attempt.body.deploymentAttemptSucceeded,true);

    const executionApproval=await post(app.baseUrl,'/api/automation/execution/approve',{
      automationApprovalId:automationApproval.body.id,
      deploymentRevisionId:realized.body.deploymentRealization.revision.id,
      deploymentAttemptId:attempt.body.deploymentAttempt.id,
      workflowTypeBindingRef:realized.body.deploymentRealization.workflowTypeBindings[0].id,
      executionId,
      facts:{},
      capabilityInputs:{},
      authorityRef:'authority:r1-11h:start-once',
      approvedBy:'r1-11h-user',
      rationale:'Authorize one workflow start.',
    });
    assert.equal(executionApproval.response.status,201);

    const started=await post(app.baseUrl,'/api/automation/execution/start',{
      workflowExecutionApprovalId:executionApproval.body.workflowExecutionApproval.id,
      deploymentRevisionId:realized.body.deploymentRealization.revision.id,
      executionId,
      facts:{},
      capabilityInputs:{},
    });
    assert.equal(started.response.status,201);
    assert.equal(started.body.workflowExecutionObservation.executionStatus,'RUNNING');

    const live=await post(app.baseUrl,'/api/automation/execution/state',{
      automationApprovalId:automationApproval.body.id,
    });
    assert.equal(live.response.status,200);
    assert.equal(live.body.runtime.executionStatus,'RUNNING');
    assert.equal(live.body.runtime.currentWork.kind,'HUMAN_TASK');
    assert.equal(live.body.runtime.currentWork.businessStepName,'Wash the vehicle');
    assert.equal(live.body.runtime.currentWork.executionElementRef,human.id);
    assert.equal(live.body.runtime.progress.humanCompleted,0);
    assert.equal(live.body.runtime.progress.humanTotal,1);
    assert.equal(live.body.runtime.additionalWorkflowStartAuthorized,false);

    const stale=await post(app.baseUrl,'/api/automation/execution/human-task/complete',{
      automationApprovalId:automationApproval.body.id,
      executionElementRef:'execution:wrong-human-task',
    });
    assert.equal(stale.response.status,409);
    assert.equal(humanUpdateCalls,0);

    const completed=await post(app.baseUrl,'/api/automation/execution/human-task/complete',{
      automationApprovalId:automationApproval.body.id,
      executionElementRef:human.id,
    });
    assert.equal(completed.response.status,200);
    assert.equal(humanUpdateCalls,1);
    assert.equal(completed.body.runtime.executionStatus,'COMPLETED');
    assert.equal(completed.body.runtime.currentWork.kind,'COMPLETE');
    assert.equal(completed.body.runtime.progress.humanCompleted,1);
    assert.equal(completed.body.additionalWorkflowStartAuthorized,false);
  }finally{
    await app.close();
  }
});
