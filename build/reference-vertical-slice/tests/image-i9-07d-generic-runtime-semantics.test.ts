import test from 'node:test';
import assert from 'node:assert/strict';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { compileRuntimeConditionExpression } from '../workers/reference-temporal-worker/src/generic-runtime-expression.ts';
import { createGenericTemporalWorker } from '../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import { TalosGenericWorkflow, getGenericWorkflowState, resolveGenericDecision } from '../workers/reference-temporal-worker/src/generic-workflow.ts';

test('R1-11I compiles legacy fact conditions into the generic runtime context',()=>{
  assert.deepEqual(
    compileRuntimeConditionExpression(
      {fact:'temperature',operator:'GREATER_THAN_OR_EQUAL',value:90},
      'rule:temperature',
    ),
    {
      kind:'COMPARE',
      left:{kind:'REFERENCE',path:'initialInputs.temperature'},
      operator:'GREATER_THAN_OR_EQUAL',
      right:{kind:'LITERAL',value:90},
    },
  );
});

test('R1-11I preserves explicit generic runtime-context references without domain coupling',()=>{
  assert.deepEqual(
    compileRuntimeConditionExpression(
      {
        kind:'AND',
        expressions:[
          {
            kind:'COMPARE',
            left:{kind:'REFERENCE',path:'activityOutputs.payment.status'},
            operator:'EQUALS',
            right:{kind:'LITERAL',value:'APPROVED'},
          },
          {
            kind:'EXISTS',
            value:{kind:'REFERENCE',path:'humanOutputs.inspection.result'},
          },
        ],
      },
      'rule:generic-domain',
    ),
    {
      kind:'AND',
      expressions:[
        {
          kind:'COMPARE',
          left:{kind:'REFERENCE',path:'activityOutputs.payment.status'},
          operator:'EQUALS',
          right:{kind:'LITERAL',value:'APPROVED'},
        },
        {
          kind:'EXISTS',
          value:{kind:'REFERENCE',path:'humanOutputs.inspection.result'},
        },
      ],
    },
  );
});

test('R1-11I turns confirmed business-language branch conditions into explicit runtime decisions',()=>{
  assert.deepEqual(
    compileRuntimeConditionExpression(
      {language:'BUSINESS_NATURAL_LANGUAGE',body:'Does this confirmed business condition apply now?'},
      'rule:business-decision',
    ),
    {
      kind:'DECISION_INPUT',
      decisionRef:'rule:business-decision',
      prompt:'Does this confirmed business condition apply now?',
    },
  );
});

test('R1-11I rejects unknown condition operators before Temporal execution',()=>{
  assert.throws(
    ()=>compileRuntimeConditionExpression(
      {fact:'arbitraryFact',operator:'UNSUPPORTED_DOMAIN_OPERATOR',value:true},
      'rule:unsupported',
    ),
    /RUNTIME_CONDITION_OPERATOR_UNSUPPORTED:rule:unsupported:UNSUPPORTED_DOMAIN_OPERATOR/,
  );
});

test('R1-11I rejects opaque condition languages instead of sending them to the Worker',()=>{
  assert.throws(
    ()=>compileRuntimeConditionExpression(
      {language:'SOME_VENDOR_EXPRESSION',body:'x'},
      'rule:opaque',
    ),
    /RUNTIME_EXPRESSION_NOT_EXECUTABLE:rule:opaque:SOME_VENDOR_EXPRESSION/,
  );
});


test('R1-11I replays a legacy business-language condition and waits for an explicit generic decision',async()=>{
  const temporal=await TestWorkflowEnvironment.createLocal();
  const taskQueue='r1-11i-generic-decision';
  const runtime=await createGenericTemporalWorker({
    connection:temporal.nativeConnection,
    namespace:temporal.namespace,
    taskQueue,
    identity:'r1-11i-generic-worker',
  });
  const workerRun=runtime.worker.run();
  try{
    const program:any={
      schemaVersion:'talos.generic-runtime-program.v1',
      sdkTarget:{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'},
      executionPlanRevisionRef:'exe:test',
      temporalMappingRevisionRef:'tmp:test',
      runtimePolicyRevisionRef:'rtp:test',
      deploymentRevisionRef:'dep:test',
      temporalFeatureProfileRef:'tfp:test',
      workflow:{workflowTypeName:'TalosGenericWorkflow',workflowMaximumAttempts:1},
      activity:{activityTypeName:'executeGenericCapability',policies:[]},
      graph:{
        entryElementRef:'decision',
        elements:[
          {id:'decision',kind:'COORDINATION_STEP',constructKinds:['WORKFLOW_LOGIC'],capabilityUseOccurrenceRefs:[],semanticSubjectRefs:[]},
          {id:'accepted',kind:'COMPLETION_COORDINATION',constructKinds:['WORKFLOW_LOGIC'],capabilityUseOccurrenceRefs:[],semanticSubjectRefs:[]},
          {id:'rejected',kind:'COMPLETION_COORDINATION',constructKinds:['WORKFLOW_LOGIC'],capabilityUseOccurrenceRefs:[],semanticSubjectRefs:[]},
        ],
        relations:[
          {id:'yes',sourceElementRef:'decision',targetElementRef:'accepted',relationKind:'CONDITIONAL',conditionRef:'rule:legacy-natural-language'},
          {id:'no',sourceElementRef:'decision',targetElementRef:'rejected',relationKind:'DEFAULT'},
        ],
      },
      semantics:{
        conditionRules:[{
          ref:'rule:legacy-natural-language',
          expression:{language:'BUSINESS_NATURAL_LANGUAGE',body:'Does this confirmed business condition apply now?'},
        }],
        waits:[],
        snapshotDigest:'legacy-history-digest-is-not-recompiled-inside-workflow',
      },
      deploymentIntent:{environmentClass:'TEST',desiredNamespaceKey:'default',desiredTaskQueueKey:taskQueue,desiredWorkerLogicalName:'r1-11i-generic-worker',realizationState:'INCOMPLETE_ENVIRONMENT_REALIZATION'},
      programDigest:'legacy-program-digest',
    };
    const handle=await temporal.client.workflow.start(TalosGenericWorkflow,{
      workflowId:'r1-11i-legacy-decision',
      taskQueue,
      args:[{executionId:'R1-11I-LEGACY',facts:{},program}],
      retry:{maximumAttempts:1},
    });
    let state=await handle.query(getGenericWorkflowState);
    for(let attempt=0;attempt<40&&!state.currentDecisionRef;attempt+=1){
      await new Promise(resolve=>setTimeout(resolve,25));
      state=await handle.query(getGenericWorkflowState);
    }
    assert.equal(state.currentDecisionRef,'rule:legacy-natural-language');
    assert.equal(state.currentDecisionPrompt,'Does this confirmed business condition apply now?');
    await handle.executeUpdate(resolveGenericDecision,{args:[{decisionRef:'rule:legacy-natural-language',applies:true}]});
    const result=await handle.result();
    assert.equal(result.outcome,'COMPLETED');
    assert.equal(result.decisionOutcomes['rule:legacy-natural-language'],true);
    assert.deepEqual(result.visitedElementRefs,['decision','accepted']);
  }finally{
    runtime.worker.shutdown();
    await workerRun;
    await temporal.teardown();
  }
});
