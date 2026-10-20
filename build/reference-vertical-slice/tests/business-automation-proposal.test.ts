import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';
import { buildBusinessAutomationProposal } from '../packages/capability/src/business-automation-proposal.ts';

test('actorless actions suggest intake/notifications while unknown work remains unresolved; proposals are read only and revision specific', async () => {
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-proposal-'));
  let app=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
  const post=async(route:string,payload:unknown)=>{
    const response=await fetch(app.baseUrl+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const body=await response.json() as any;assert.equal(response.status,201,JSON.stringify(body));return body;
  };
  try {
    const intake=await post('/api/input/canvas',{title:'Atención',initiatedBy:'user',elements:[
      {id:'start',kind:'START',label:'Inicio'},
      {id:'submit',kind:'STEP',label:'Enviar solicitud'},
      {id:'review',kind:'STEP',label:'Revisar solicitud'},
      {id:'attend',kind:'STEP',label:'Ejecutar atención'},
      {id:'notify',kind:'STEP',label:'Notificar resultado'},
      {id:'end',kind:'END',label:'Fin'},
    ],connections:[]});
    const request=(revisionId:string,processId:string)=>fetch(app.baseUrl+'/api/product/automation-proposal?revisionId='+encodeURIComponent(revisionId)+'&processRevisionId='+encodeURIComponent(processId));
    assert.equal((await request(intake.revision.id,intake.reconciliation.processRevision.id)).status,409);
    const confirmed=await post('/api/bpmn/confirm',{revisionId:intake.revision.id,canonicalProcessRevisionId:intake.reconciliation.processRevision.id,confirmedBy:'user',authorityRef:'authority:test:confirm'});
    const before=await fetch(app.baseUrl+'/api/product/recovery').then(r=>r.json()) as any;
    const response=await request(confirmed.revision.id,confirmed.confirmation.canonicalProcessRevisionId);
    assert.equal(response.status,200);const proposal=await response.json() as any;
    assert.deepEqual(Object.fromEntries(proposal.steps.map((step:any)=>[step.businessStepName,step.family])),{'Enviar solicitud':'DATA_COLLECTION','Revisar solicitud':null,'Ejecutar atención':null,'Notificar resultado':'COMMUNICATION'});
    assert.ok(proposal.steps.every((step:any)=>step.family!=='HUMAN_INTERACTION'));
    assert.equal(proposal.state,'NEEDS_BUSINESS_ANSWER');
    assert.equal(proposal.createsBinding,false);assert.equal(proposal.executionAuthorized,false);
    assert.equal(proposal.snapshot.bpmnRevision.id,confirmed.revision.id);
    assert.equal((await request(confirmed.revision.id,'wrong-process')).status,409);
    const after=await fetch(app.baseUrl+'/api/product/recovery').then(r=>r.json()) as any;
    assert.equal(after.durableDocumentCount,before.durableDocumentCount);
    assert.equal(after.aggregateCounts.SemanticFreezeRecord,undefined);
    const frozen=JSON.stringify(proposal.snapshot.processRevision);
    buildBusinessAutomationProposal(proposal.snapshot.processRevision);
    assert.equal(JSON.stringify(proposal.snapshot.processRevision),frozen);
    // New unconfirmed source must not fall back to a previous confirmed process.
    const fresh=await post('/api/input/canvas',{title:'Nuevo',initiatedBy:'user',elements:[{id:'s',kind:'START',label:'Inicio'},{id:'w',kind:'STEP',label:'Otra actividad'},{id:'e',kind:'END',label:'Fin'}],connections:[]});
    const snapshot=await fetch(app.baseUrl+'/api/product/workspace-snapshot').then(r=>r.json()) as any;
    assert.equal(snapshot.bpmnRevision.id,fresh.revision.id);assert.equal(snapshot.confirmation,null);
    await app.close();app=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
    const recovered=await request(confirmed.revision.id,confirmed.confirmation.canonicalProcessRevisionId).then(r=>r.json()) as any;
    assert.deepEqual(recovered.steps,proposal.steps);
  } finally {await app.close();rmSync(runtimeDir,{recursive:true,force:true})}
});

test('confirmed actors take priority over label suggestions, including mixed responsibility',()=>{
  const process:any={id:'process',actors:[{id:'human',kind:'HUMAN_ROLE',name:'Reviewer'},{id:'system',kind:'SYSTEM',name:'ERP'}],nodes:[
    {id:'a',kind:'ACTION',name:'Notificar resultado',actorRefs:['human']},
    {id:'b',kind:'ACTION',name:'Enviar solicitud',actorRefs:['system']},
    {id:'c',kind:'ACTION',name:'Notificar resultado',actorRefs:['human','system']},
  ]};
  const proposal=buildBusinessAutomationProposal(process);
  assert.deepEqual(proposal.steps.map(step=>step.family),['HUMAN_INTERACTION','SYSTEM_OPERATION',null]);
  assert.equal(proposal.steps[0].participantLabel,'Reviewer');
  assert.equal(proposal.steps[0].basis,'CONFIRMED_SEMANTICS');
});
