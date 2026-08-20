import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { SqliteDocumentStore } from '../packages/persistence-sqlite/src/sqlite-document-store.ts';
import { LocalImageByteStore } from '../packages/image-perception/src/byte-store.ts';
import { digestDeterministicJson } from '../packages/foundation/src/digest.ts';
import { designGenericCapabilities } from '../packages/capability/src/generic-design.ts';
import { resolveGenericCapabilities,type GenericRequirementResolution } from '../packages/capability/src/generic-resolution.ts';
import { designGenericResolvedExecutionPlan } from '../packages/execution/src/generic-resolved-plan.ts';
import { designGenericTemporalMapping } from '../packages/temporal-design/src/generic-mapping.ts';
import { designGenericRuntimePolicy } from '../packages/runtime-policy/src/generic-policy.ts';
import { designGenericDeployment } from '../packages/deployment/src/generic-deployment.ts';
import { compileGenericRuntimeProgram } from '../workers/reference-temporal-worker/src/generic-compile-runtime-program.ts';
import { createGenericTemporalWorker } from '../workers/reference-temporal-worker/src/generic-worker-runtime.ts';
import { GenericEffectLedger } from '../workers/reference-temporal-worker/src/generic-activities.ts';
import { TalosGenericWorkflow } from '../workers/reference-temporal-worker/src/generic-workflow.ts';
import { buildExecutableQuarry01ImageReview } from './helpers/quarry01-executable-image.ts';

const fixturePath=path.resolve(process.cwd(),'../../brainstorming/mining-site/quarry-01-order-process/imagen_2026-08-18_204857678.png');
const AT='2026-08-20T14:10:00.000Z';
function systemResolutions(base:ReturnType<typeof designGenericCapabilities>):GenericRequirementResolution[]{return base.requirements.map((requirement,index)=>({requirementRef:requirement.id,family:'SYSTEM_OPERATION',authorityRef:'reference-execution-architect',decidedBy:'talos-generic-runtime-test',rationale:'TEST_ONLY explicit system-operation selection for generic runtime conformance; not inferred from the image label.',offeringCanonicalName:`REFERENCE_Q01_OPERATION_${index+1}`,offeringLifecycleStatus:'TEST_ONLY',implementationKind:'INTERNAL_SERVICE',implementationRef:`reference-q01-operation:${requirement.id}`}));}
function build(){
 const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-image-i6-')),repo=new SqliteDocumentStore(path.join(runtimeDir,'talos.sqlite')),byteStore=new LocalImageByteStore(path.join(runtimeDir,'bytes'));
 const image=buildExecutableQuarry01ImageReview(repo,byteStore,readFileSync(fixturePath)),current=image.current;
 const base=designGenericCapabilities(current.process,current.validation.scope,current.validation.assessment,image.freeze,image.scopeFreeze,AT),capability=resolveGenericCapabilities(base,systemResolutions(base),AT);
 const execution=designGenericResolvedExecutionPlan(current.process,current.validation.scope,current.validation.assessment,image.freeze,image.scopeFreeze,capability,[],AT);
 const mapping=designGenericTemporalMapping(execution,{waits:[],humans:[]},AT);
 const activityPolicies=execution.capabilityUses.map(use=>({capabilityUseOccurrenceRef:use.id,authorityRef:'reference-runtime-architect',decidedBy:'talos-generic-runtime-test',rationale:'Explicit TEST_ONLY retry/timeout/idempotency policy for generic runtime conformance.',policyBasis:'REFERENCE_TEST_DESIGN' as const,retry:{initialIntervalMs:10,backoffCoefficient:2,maximumIntervalMs:50,maximumAttempts:3,nonRetryableFailureTypes:['INVALID_GENERIC_CAPABILITY_REQUEST','GENERIC_IDEMPOTENCY_CONFLICT']},timeout:{startToCloseMs:5000,scheduleToCloseMs:10000},idempotency:{requirement:'REQUIRED' as const,strategyKind:'IDEMPOTENCY_KEY' as const,keyContract:'sha256(executionId + ":" + capabilityUseOccurrenceRef)',enforcementRef:'GENERIC_EFFECT_LEDGER'},failureClassifications:[{failureType:'GENERIC_TRANSIENT_FAILURE',retryable:true,businessFailure:false},{failureType:'INVALID_GENERIC_CAPABILITY_REQUEST',retryable:false,businessFailure:false},{failureType:'GENERIC_IDEMPOTENCY_CONFLICT',retryable:false,businessFailure:false}]}));
 const policy=designGenericRuntimePolicy(execution,mapping,activityPolicies,{authorityRef:'reference-runtime-architect',decidedBy:'talos-generic-runtime-test',rationale:'Disable Workflow-level retries so business execution is not duplicated implicitly.',maximumAttempts:1,policyBasis:'REFERENCE_TEST_DESIGN'},AT);
 const deployment=designGenericDeployment(execution,mapping,policy,{environmentKey:'talos-generic-image-test',environmentClass:'TEST',temporalPlatformRef:'TEMPORAL_LOCAL_TEST_SERVICE',desiredNamespaceKey:'talos-generic-image',desiredTaskQueueKey:'talos-generic-image-main',desiredWorkflowTypeName:'TalosGenericWorkflow',desiredActivityTypeName:'executeGenericCapability',desiredWorkerLogicalName:'talos-generic-image-worker',authorityRef:'reference-deployment-architect',decidedBy:'talos-generic-runtime-test',rationale:'TEST_ONLY local Temporal deployment intent for real image-to-runtime proof.'},AT);
 const conditionRules=current.process.rules.map(rule=>({ref:rule.id,expression:rule.expression})),waits:any[]=[];const semantics={conditionRules,waits,snapshotDigest:digestDeterministicJson({conditionRules,waits})};
 const program=compileGenericRuntimeProgram(execution,mapping,policy,deployment,semantics,{family:'TEMPORAL_TYPESCRIPT_SDK',version:'1.22.0'});
 return{runtimeDir,repo,image,current,base,capability,execution,mapping,policy,deployment,program};
}
function close(x:ReturnType<typeof build>){x.repo.close();rmSync(x.runtimeDir,{recursive:true,force:true});}
function elementFor(x:ReturnType<typeof build>,name:string){const node=x.current.process.nodes.find(n=>n.name===name);assert.ok(node,`node ${name}`);const element=x.execution.elements.find(e=>e.semanticSubjectRefs.includes(node!.id));assert.ok(element,`execution element ${name}`);return element!;}

test('I6 Quarry-01 reaches READY_FOR_TEMPORAL_MAPPING_DESIGN and generic deployment design without reference approval/email assumptions',()=>{
 const x=build();try{
  assert.equal(x.execution.assessment.readiness,'READY_FOR_TEMPORAL_MAPPING_DESIGN');assert.equal(x.mapping.assessment.readiness,'READY_FOR_RUNTIME_POLICY_DESIGN');assert.equal(x.policy.assessment.readiness,'READY_FOR_DEPLOYMENT_DESIGN');assert.equal(x.deployment.assessment.readiness,'INCOMPLETE_ENVIRONMENT_REALIZATION');assert.equal(x.program.schemaVersion,'talos.generic-runtime-program.v1');
  assert.equal(x.mapping.units.filter(u=>u.constructKind==='ACTIVITY').length,x.execution.capabilityUses.length);assert(x.mapping.units.some(u=>u.constructKind==='WORKFLOW_LOGIC'));
  const s=JSON.stringify({capability:x.capability,mapping:x.mapping,policy:x.policy,deployment:x.deployment,program:x.program});for(const forbidden of ['Gmail','REFERENCE_EMAIL_SINK','submitReferenceReviewDecision','TalosReferenceApprovalWorkflow'])assert.equal(s.includes(forbidden),false,`generic I6 leaked ${forbidden}`);
 }finally{close(x);}
});

test('I6 runs the real Quarry-01 image-derived accepted path on a real local Temporal service and survives Worker restart',async()=>{
 const x=build();let temporal:TestWorkflowEnvironment|undefined;let first:any,second:any;const ledger=new GenericEffectLedger();
 try{
  temporal=await TestWorkflowEnvironment.createLocal({server:{namespace:x.program.deploymentIntent.desiredNamespaceKey}});
  first=await createGenericTemporalWorker({connection:temporal.nativeConnection,namespace:temporal.namespace,taskQueue:x.program.deploymentIntent.desiredTaskQueueKey,identity:'talos-generic-image-worker-1',ledger});const run1=first.worker.run();
  const successId='Q01-SUCCESS';const capabilityInputs=Object.fromEntries(x.execution.capabilityUses.map(use=>[use.id,{test:'q01',use:use.id}]));
  const h1=await temporal.client.workflow.start(TalosGenericWorkflow,{workflowId:`talos-generic-${successId}`,taskQueue:x.program.deploymentIntent.desiredTaskQueueKey,args:[{executionId:successId,facts:{creditOk:true,fulfilledOk:true},capabilityInputs,program:x.program}],retry:{maximumAttempts:x.program.workflow.workflowMaximumAttempts}});const r1=await h1.result();
  assert.equal(r1.outcome,'COMPLETED');assert(r1.visitedElementRefs.includes(elementFor(x,'Send invoice').id));assert(r1.visitedElementRefs.includes(elementFor(x,'Order complete').id));assert.equal(r1.visitedElementRefs.includes(elementFor(x,'Order Failed').id),false);assert.equal(r1.capabilityResults.length,4);assert.equal(ledger.list().filter(e=>e.executionId===successId).length,4);
  first.worker.shutdown();await run1;first=undefined;

  second=await createGenericTemporalWorker({connection:temporal.nativeConnection,namespace:temporal.namespace,taskQueue:x.program.deploymentIntent.desiredTaskQueueKey,identity:'talos-generic-image-worker-2',ledger});const run2=second.worker.run();
  const failId='Q01-CREDIT-FAILED';const h2=await temporal.client.workflow.start(TalosGenericWorkflow,{workflowId:`talos-generic-${failId}`,taskQueue:x.program.deploymentIntent.desiredTaskQueueKey,args:[{executionId:failId,facts:{creditOk:false,fulfilledOk:false},capabilityInputs,program:x.program}],retry:{maximumAttempts:x.program.workflow.workflowMaximumAttempts}});const r2=await h2.result();
  assert.equal(r2.outcome,'COMPLETED');assert(r2.visitedElementRefs.includes(elementFor(x,'Order Failed').id));assert.equal(r2.visitedElementRefs.includes(elementFor(x,'Fulfill Order').id),false);assert.equal(r2.capabilityResults.length,2);assert.equal(ledger.list().filter(e=>e.executionId===failId).length,2);
  second.worker.shutdown();await run2;second=undefined;
 }finally{if(first){first.worker.shutdown();}if(second){second.worker.shutdown();}if(temporal)await temporal.teardown().catch(()=>undefined);close(x);}
});
