import test from 'node:test';
import assert from 'node:assert/strict';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { createGenericTemporalWorker } from '../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import {
  TalosGenericWorkflow,
  completeGenericHumanTask,
  getGenericWorkflowState,
} from '../workers/reference-temporal-worker/src/generic-workflow.ts';
import type { CompiledGenericRuntimeProgram } from '../workers/reference-temporal-worker/src/generic-contracts.ts';

test('I9-07B generic Temporal workflow can remain running on a human task and resume through one tracked Update',async()=>{
  const temporal=await TestWorkflowEnvironment.createLocal({server:{namespace:'talos-i9-07b'}});
  const taskQueue='talos-i9-07b-human';
  const runtime=await createGenericTemporalWorker({
    connection:temporal.nativeConnection,
    namespace:temporal.namespace,
    taskQueue,
    identity:'talos-i9-07b-worker',
  });
  const program:CompiledGenericRuntimeProgram={
    schemaVersion:'talos.generic-runtime-program.v1',
    sdkTarget:{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'},
    executionPlanRevisionRef:'execution-plan:test' as any,
    temporalMappingRevisionRef:'temporal-mapping:test' as any,
    runtimePolicyRevisionRef:'runtime-policy:test' as any,
    deploymentRevisionRef:'deployment:test' as any,
    temporalFeatureProfileRef:'temporal-feature:test' as any,
    workflow:{workflowTypeName:'TalosGenericWorkflow',workflowMaximumAttempts:1},
    activity:{activityTypeName:'executeGenericCapability',policies:[]},
    graph:{
      entryElementRef:'start',
      elements:[
        {id:'start',kind:'COORDINATION_STEP',constructKinds:['WORKFLOW_LOGIC'],capabilityUseOccurrenceRefs:[],semanticSubjectRefs:['start-node']},
        {id:'human',kind:'HUMAN_COORDINATION',constructKinds:['UPDATE_HANDLER'],capabilityUseOccurrenceRefs:[],semanticSubjectRefs:['manual-node']},
        {id:'end',kind:'COMPLETION_COORDINATION',constructKinds:['WORKFLOW_LOGIC'],capabilityUseOccurrenceRefs:[],semanticSubjectRefs:['end-node']},
      ],
      relations:[
        {id:'r1',sourceElementRef:'start',targetElementRef:'human',relationKind:'SEQUENCE'},
        {id:'r2',sourceElementRef:'human',targetElementRef:'end',relationKind:'SEQUENCE'},
      ],
    },
    semantics:{conditionRules:[],waits:[],snapshotDigest:'not-used-by-workflow'},
    deploymentIntent:{environmentClass:'TEST',desiredNamespaceKey:temporal.namespace,desiredTaskQueueKey:taskQueue,desiredWorkerLogicalName:'talos-i9-07b-worker',realizationState:'INCOMPLETE_ENVIRONMENT_REALIZATION'},
    programDigest:'test-program-digest',
  };
  try{
    await runtime.worker.runUntil(async()=>{
      const handle=await temporal.client.workflow.start(TalosGenericWorkflow,{
        workflowId:'talos-i9-07b-human-001',
        taskQueue,
        args:[{executionId:'I9-07B-001',facts:{},program}],
      });
      let state:any;
      for(let i=0;i<20;i+=1){
        state=await handle.query(getGenericWorkflowState);
        if(state.currentHumanTaskRef==='human')break;
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      assert.equal(state.currentHumanTaskRef,'human');
      const updated=await handle.executeUpdate(completeGenericHumanTask,{args:[{executionElementRef:'human',outcome:'COMPLETED'}]});
      assert.ok(updated.completedHumanTaskRefs.includes('human'));
      const result=await handle.result();
      assert.equal(result.outcome,'COMPLETED');
      assert.deepEqual(result.completedHumanTaskRefs,['human']);
      assert.ok(result.visitedElementRefs.includes('human'));
    });
  }finally{
    await temporal.teardown();
  }
});
