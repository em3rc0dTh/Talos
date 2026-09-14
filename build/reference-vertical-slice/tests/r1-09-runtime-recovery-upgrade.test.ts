import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';
import {
  TALOS_PRODUCT_RUNTIME_MANIFEST,
  TALOS_PRODUCT_RUNTIME_SCHEMA_VERSION,
} from '../apps/reference-api/src/product-runtime-recovery.ts';

const bpmn=`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R109" targetNamespace="https://talos.local/r1-09">
  <bpmn:process id="Process_R109" name="R1-09 Recovery Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Work" name="Perform durable work"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Work" />
    <bpmn:sequenceFlow id="F2" sourceRef="Work" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

async function post(baseUrl:string,pathname:string,payload:Record<string,unknown>){
  const response=await fetch(`${baseUrl}${pathname}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  return{response,body:await response.json() as any};
}

async function reachDeploymentApproval(baseUrl:string){
  const imported=await post(baseUrl,'/api/input/bpmn',{fileName:'r1-09.bpmn',bpmnXml:bpmn,initiatedBy:'r1-09-user'});assert.equal(imported.response.status,201);
  const confirmed=await post(baseUrl,'/api/bpmn/confirm',{revisionId:imported.body.revision.id,canonicalProcessRevisionId:imported.body.revision.canonicalProcessRevisionId,confirmedBy:'r1-09-user',authorityRef:'authority:r1-09-process',rationale:'Confirm durable process.'});assert.equal(confirmed.response.status,201);
  const opened=await post(baseUrl,'/api/bpmn/automation-design-approval',{revisionId:confirmed.body.revision.id,confirmationId:confirmed.body.confirmation.id,approvedBy:'r1-09-user',authorityRef:'authority:r1-09-design'});assert.equal(opened.response.status,201);
  const workspace=opened.body.automationDesign.workspace;
  const selections=workspace.requirements.map((requirement:any,index:number)=>({source:'EXPLICIT_OFFERING',requirementRef:requirement.capabilityRequirementRef,family:'SYSTEM_OPERATION',offeringCanonicalName:`R1-09 operation ${index+1}`,offeringLifecycleStatus:'TEST_ONLY',implementationKind:'INTERNAL_SERVICE',implementationRef:`r1-09:operation:${index+1}`,decidedBy:'r1-09-user',authorityRef:'authority:r1-09-capability',rationale:'Explicit capability choice.'}));
  const selected=await post(baseUrl,'/api/automation/capability/select',{workspaceId:workspace.id,selections});assert.equal(selected.response.status,201);
  const reviewed=await post(baseUrl,'/api/automation/execution-plan/review',{workspaceId:workspace.id,decisions:{}});assert.equal(reviewed.response.status,201);
  const approved=await post(baseUrl,'/api/automation/approve',{reviewId:reviewed.body.review.id,approvedBy:'r1-09-user',authorityRef:'authority:r1-09-automation',rationale:'Approve exact plan.'});assert.equal(approved.response.status,201);
  const mapped=await post(baseUrl,'/api/automation/temporal-mapping',{approvalId:approved.body.id,waits:[],humans:[]});assert.equal(mapped.response.status,201);
  const activities=reviewed.body.execution.capabilityUses.map((use:any)=>({capabilityUseOccurrenceRef:use.id,authorityRef:'authority:r1-09-runtime',decidedBy:'r1-09-user',rationale:'Explicit restart-safe runtime policy.',policyBasis:'USER_EXPLICIT_DESIGN',retry:{initialIntervalMs:100,backoffCoefficient:2,maximumIntervalMs:1000,maximumAttempts:3,nonRetryableFailureTypes:['INVALID_REQUEST']},timeout:{startToCloseMs:5000,scheduleToCloseMs:10000},idempotency:{requirement:'REQUIRED',strategyKind:'IDEMPOTENCY_KEY',keyContract:'sha256(executionId + capabilityUseOccurrenceRef)',enforcementRef:'ONE_APP_EFFECT_LEDGER'},failureClassifications:[{failureType:'TRANSIENT_FAILURE',retryable:true,businessFailure:false},{failureType:'INVALID_REQUEST',retryable:false,businessFailure:false}]}));
  const runtime=await post(baseUrl,'/api/automation/runtime-policy',{approvalId:approved.body.id,temporalMappingRevisionId:mapped.body.mapping.revision.id,activities,workflow:{authorityRef:'authority:r1-09-workflow-policy',decidedBy:'r1-09-user',rationale:'No implicit workflow retry.',maximumAttempts:1,policyBasis:'USER_EXPLICIT_DESIGN'}});assert.equal(runtime.response.status,201);
  const design=await post(baseUrl,'/api/automation/deployment-design',{approvalId:approved.body.id,runtimePolicyRevisionId:runtime.body.runtimePolicy.revision.id,environmentKey:'r1-09-recovery',environmentClass:'TEST',temporalPlatformRef:'TEMPORAL_RECOVERY_TEST',desiredNamespaceKey:'default',desiredTaskQueueKey:'talos-r1-09',desiredWorkflowTypeName:'TalosGenericWorkflow',desiredActivityTypeName:'executeGenericCapability',desiredWorkerLogicalName:'talos-r1-09-worker',authorityRef:'authority:r1-09-deploy-design',decidedBy:'r1-09-user',rationale:'Design exact environment.'});assert.equal(design.response.status,201);
  const realized=await post(baseUrl,'/api/automation/environment-realization',{approvalId:approved.body.id,deploymentRevisionId:design.body.deploymentDesign.revision.id,actualNamespace:'default',taskQueue:'talos-r1-09',workflowTypeName:'TalosGenericWorkflow',activityTypeName:'executeGenericCapability',workerLogicalName:'talos-r1-09-worker',executableArtifactRef:'r1-09:worker',artifactDigest:'sha256:r1-09-runtime',sdkFamily:'TEMPORAL_TYPESCRIPT_SDK',sdkVersionRef:'1.22.0',authorityRef:'authority:r1-09-realization',realizedBy:'r1-09-user'});assert.equal(realized.response.status,201);
  const deploymentApproval=await post(baseUrl,'/api/automation/deployment/approve',{automationApprovalId:approved.body.id,deploymentRevisionId:realized.body.deploymentRealization.revision.id,authorityRef:'authority:r1-09-deploy-owner',approvedBy:'r1-09-user',rationale:'Authorize one deployment attempt before simulated process restart.'});assert.equal(deploymentApproval.response.status,201);
  return{deploymentApproval:deploymentApproval.body.deploymentApproval,realized:realized.body.deploymentRealization};
}

test('R1-09 same-build restart reconstructs durable authority history without resurrecting consumable authority',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r1-09-restart-'));
  let approvalId='';let deploymentRevisionId='';
  try{
    const first=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
    try{
      const reached=await reachDeploymentApproval(first.baseUrl);
      approvalId=reached.deploymentApproval.id;
      deploymentRevisionId=reached.realized.revision.id;
      const before=await fetch(`${first.baseUrl}/api/product/recovery`).then(r=>r.json()) as any;
      assert.equal(before.runtimeSchemaVersion,TALOS_PRODUCT_RUNTIME_SCHEMA_VERSION);
      assert.equal(before.lastDurableStage,'DEPLOYMENT_APPROVED_NOT_ATTEMPTED');
      assert.equal(before.automaticAuthorityRehydration,false);
      assert.equal(before.explicitReauthorizationRequired,true);
      assert.equal(before.nextSafeAction,'REAUTHORIZE_DEPLOYMENT_FROM_DURABLE_EVIDENCE');
      assert.ok(before.durableDocumentCount>0);
    }finally{await first.close();}

    const second=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
    try{
      const recovered=await fetch(`${second.baseUrl}/api/product/recovery`).then(r=>r.json()) as any;
      assert.equal(recovered.lastDurableStage,'DEPLOYMENT_APPROVED_NOT_ATTEMPTED');
      assert.equal(recovered.inFlightRecovery,'UNCONSUMED IN-MEMORY DEPLOYMENT AUTHORITY IS NOT REHYDRATED AFTER RESTART');
      assert.equal(recovered.aggregateCounts.DeploymentApprovalRecord,1);
      assert.ok(recovered.aggregateCounts.DeploymentRevision>=2);

      const unsafeReplay=await post(second.baseUrl,'/api/automation/deployment/attempt',{deploymentApprovalId:approvalId,deploymentRevisionId});
      assert.equal(unsafeReplay.response.status,409,'old one-shot authority must not be silently resurrected after restart');
      assert.match(String(unsafeReplay.body.error),/explicit deployment approval/i);
    }finally{await second.close();}

    const third=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
    try{
      const recoveredAgain=await fetch(`${third.baseUrl}/api/product/recovery`).then(r=>r.json()) as any;
      assert.equal(recoveredAgain.durableDocumentCount>0,true);
      assert.equal(recoveredAgain.lastDurableStage,'DEPLOYMENT_APPROVED_NOT_ATTEMPTED');
    }finally{await third.close();}
  }finally{rmSync(runtimeDir,{recursive:true,force:true});}
});

test('R1-09 incompatible runtime version fails explicitly instead of surfacing mysterious immutable conflicts',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r1-09-version-'));
  try{
    const first=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
    await first.close();
    writeFileSync(path.join(runtimeDir,TALOS_PRODUCT_RUNTIME_MANIFEST),JSON.stringify({schemaVersion:'talos.one-app-product-runtime.v0-incompatible',compatibilityFamily:'OLD',migrationPolicy:'EXPLICIT_ONLY_NO_AUTOMATIC_MUTATION',authorityRecoveryPolicy:'DURABLE_EVIDENCE_RECONSTRUCTION_EXPLICIT_REAUTHORIZATION',createdAt:new Date().toISOString()},null,2));
    await assert.rejects(()=>startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}}),/TALOS_RUNTIME_VERSION_INCOMPATIBLE/);
  }finally{rmSync(runtimeDir,{recursive:true,force:true});}
});
