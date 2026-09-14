import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

const bpmn=`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_R110" targetNamespace="https://talos.local/r1-10">
  <bpmn:process id="Process_R110" name="R1-10 UX Process" isExecutable="false">
    <bpmn:startEvent id="Start"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Review" name="Review durable product UX"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Review" />
    <bpmn:sequenceFlow id="F2" sourceRef="Review" targetRef="End" />
  </bpmn:process>
</bpmn:definitions>`;

async function post(baseUrl:string,pathname:string,payload:Record<string,unknown>){const response=await fetch(`${baseUrl}${pathname}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});return{response,body:await response.json() as any};}

test('R1-10 primary product surface consolidates all product stages, authority truth and recovery without a run-all action',async()=>{
  const shell=readFileSync(path.resolve(process.cwd(),'apps/reference-api/src/one-app-r1-10-product-shell-extension.ts'),'utf8');
  assert.match(shell,/Recovery, status & durable history/);
  assert.match(shell,/Go to next safe gate/);
  assert.match(shell,/automaticAuthorityRehydration/);
  assert.match(shell,/Raw JSON remains debug-only|Technical evidence|durable history/i);
  assert.equal(shell.includes('Run all'),false);

  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r1-10-'));
  const app=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
  try{
    const html=await fetch(app.baseUrl).then(r=>r.text());
    for(const marker of ["box.id='r104BusinessConfirmation'","box.id='r105AutomationDesign'","panel.id='r106ExecutionPlan'","panel.id='r107RuntimeAuthority'","panel.id='r110Recovery'"]) assert.match(html,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.match(html,/Source/);
    assert.match(html,/Automation design/);
    assert.match(html,/ExecutionPlan/);
    assert.match(html,/Runtime & deploy/);
    assert.match(html,/Recovery & history/);

    const empty=await fetch(`${app.baseUrl}/api/product/recovery`).then(r=>r.json()) as any;
    assert.equal(empty.lastDurableStage,'EMPTY_RUNTIME');
    assert.equal(empty.nextSafeAction,'START_NEW_SOURCE_INTAKE');
    assert.equal(empty.automaticAuthorityRehydration,false);
    assert.deepEqual(empty.timeline,[]);

    const imported=await post(app.baseUrl,'/api/input/bpmn',{fileName:'r1-10.bpmn',bpmnXml:bpmn,initiatedBy:'r1-10-user'});assert.equal(imported.response.status,201);
    const confirmed=await post(app.baseUrl,'/api/bpmn/confirm',{revisionId:imported.body.revision.id,canonicalProcessRevisionId:imported.body.revision.canonicalProcessRevisionId,confirmedBy:'r1-10-user',authorityRef:'authority:r1-10-owner',rationale:'Confirm exact process for recovery UX.'});assert.equal(confirmed.response.status,201);

    const recovered=await fetch(`${app.baseUrl}/api/product/recovery`).then(r=>r.json()) as any;
    assert.equal(recovered.lastDurableStage,'BUSINESS_PROCESS_CONFIRMED');
    assert.equal(recovered.nextSafeAction,'REOPEN_AUTOMATION_DESIGN_EXPLICITLY');
    assert.ok(recovered.durableDocumentCount>0);
    assert.equal(recovered.aggregateCounts.BusinessProcessConfirmationRecord,1);
    assert.ok(recovered.timeline.some((item:any)=>item.aggregateKind==='BusinessProcessConfirmationRecord'));
    assert.equal(recovered.timeline.some((item:any)=>Object.prototype.hasOwnProperty.call(item,'payload')),false,'primary recovery API returns human-oriented summaries, not raw document payloads');
  }finally{await app.close();rmSync(runtimeDir,{recursive:true,force:true});}
});
