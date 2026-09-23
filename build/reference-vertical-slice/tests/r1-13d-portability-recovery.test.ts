import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

function canvasInput(){
  return {
    title:'R1-13D portable process',
    initiatedBy:'r1-13d-user',
    elements:[
      {id:'start',kind:'START',label:'Start'},
      {id:'human',kind:'APPROVAL',label:'Review request'},
      {id:'wait',kind:'WAIT',label:'Wait 30 seconds',waitKind:'DURATION',expression:'30 seconds'},
      {id:'end',kind:'END',label:'End'},
    ],
    connections:[
      {id:'c1',from:'start',to:'human',kind:'FLOW'},
      {id:'c2',from:'human',to:'wait',kind:'FLOW'},
      {id:'c3',from:'wait',to:'end',kind:'FLOW'},
    ],
    presentation:{
      nodeLayouts:[
        {clientElementId:'start',x:20,y:30},
        {clientElementId:'human',x:210,y:30},
        {clientElementId:'wait',x:400,y:30},
        {clientElementId:'end',x:590,y:30},
      ],
      viewport:{mode:'BUSINESS_CANVAS'},
      zoom:1,
    },
  };
}

test('R1-13D portable Canvas export can be verified and re-imported as a fresh review candidate',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r1-13d-roundtrip-'));
  const app=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
  try{
    const created=await fetch(app.baseUrl+'/api/input/canvas',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(canvasInput())});
    assert.equal(created.status,201);
    const first=await created.json() as any;
    const exported=await fetch(app.baseUrl+'/api/process/canvas/export?revisionId='+encodeURIComponent(first.canvasRevision.id));
    assert.equal(exported.status,200);
    const nativeSource=await exported.json() as any;
    assert.equal(nativeSource.schemaVersion,'talos-canvas-native-v0.2');

    const imported=await fetch(app.baseUrl+'/api/input/canvas-native',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({nativeSource,initiatedBy:'roundtrip-user'})});
    assert.equal(imported.status,201);
    const second=await imported.json() as any;
    assert.equal(second.status,'BPMN_READY_FOR_PROCESS_REVIEW');
    assert.equal(second.sourceKind,'TALOS_CANVAS');
    assert.equal(second.importedPortableCanvas,true);
    assert.notEqual(second.canvasRevision.id,first.canvasRevision.id);
    assert.equal(second.canvasRevision.elementSnapshots.length,4);
    assert.equal(second.canvasRevision.relationshipSnapshots.length,3);
    assert.equal(second.canvasRevision.elementSnapshots.find((item:any)=>item.kind==='WAIT')?.propertyValues.duration.literalText,'30 seconds');
    const layouts=second.canvasRevision.presentationSnapshot?.nodeLayouts??[];
    assert.deepEqual(layouts.map((item:any)=>[item.x,item.y]),[[20,30],[210,30],[400,30],[590,30]]);
    assert.equal(second.automaticConfirmationAuthorized,false);
    assert.equal(second.automaticExecutionAuthorized,false);
  }finally{await app.close();rmSync(runtimeDir,{recursive:true,force:true})}
});

test('R1-13D rejects a tampered portable Canvas without changing authority',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r1-13d-tamper-'));
  const app=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
  try{
    const created=await fetch(app.baseUrl+'/api/input/canvas',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(canvasInput())});
    const first=await created.json() as any;
    const nativeSource=await fetch(app.baseUrl+'/api/process/canvas/export?revisionId='+encodeURIComponent(first.canvasRevision.id)).then((response)=>response.json()) as any;
    nativeSource.elements[1].label='Tampered label';
    const imported=await fetch(app.baseUrl+'/api/input/canvas-native',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({nativeSource,initiatedBy:'tamper-user'})});
    assert.ok(imported.status>=400);
    const body=await imported.json() as any;
    assert.match(body.userMessage,/could not safely prepare this process for review/i);
    assert.equal(body.safeState.deploymentAutomaticallyAuthorized,false);
    assert.equal(body.safeState.workflowAutomaticallyStarted,false);
    assert.match(body.error,/snapshots do not match|digest verification failed/i);
  }finally{await app.close();rmSync(runtimeDir,{recursive:true,force:true})}
});

test('R1-13D reconstructs the translation workspace after restart without rehydrating authority',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r1-13d-recovery-'));
  let app=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
  let original:any;
  try{
    const created=await fetch(app.baseUrl+'/api/input/canvas',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(canvasInput())});
    assert.equal(created.status,201);original=await created.json();
  }finally{await app.close()}
  app=await startTalosOneAppProduct({port:0,oneApp:{runtimeDir,imagePerceptionEnv:{}}});
  try{
    const recovered=await fetch(app.baseUrl+'/api/product/workspace-state').then((response)=>response.json()) as any;
    assert.equal(recovered.available,true);
    assert.equal(recovered.sourceKind,'TALOS_CANVAS');
    assert.equal(recovered.process.id,original.reconciliation.processRevision.id);
    assert.equal(recovered.bpmnRevision.id,original.revision.id);
    assert.equal(recovered.canvasRevision.id,original.canvasRevision.id);
    assert.equal(recovered.confirmation.status,'REVIEW');
    assert.equal(recovered.automaticAuthorityGranted,false);
    assert.equal(recovered.authorityRehydrated,false);
    const page=await fetch(app.baseUrl).then((response)=>response.text());
    assert.match(page,/recoverTranslationWorkspace/);
    assert.match(page,/No deployment or execution authority was restored/);
    assert.match(page,/Import saved Canvas/);
  }finally{await app.close();rmSync(runtimeDir,{recursive:true,force:true})}
});
