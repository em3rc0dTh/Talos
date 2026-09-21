import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';
import { renderR111DBusinessFirstPage } from '../apps/reference-api/src/one-app-r1-11d-business-first-extension.ts';
import { renderR110ProductShellPage } from '../apps/reference-api/src/one-app-r1-10-product-shell-extension.ts';

async function post(baseUrl:string,route:string,payload:unknown){
  const response=await fetch(baseUrl+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const body=await response.json();
  return{response,body};
}

test('R1-11D simple product shell exposes five business stages and three source modes',()=>{
  const page=renderR111DBusinessFirstPage(renderR110ProductShellPage(ONE_APP_PRODUCT_PAGE));
  for(const label of ['1 · Process','2 · Review','3 · Confirm','4 · Automate','5 · Run'])assert.match(page,new RegExp(label.replace('·','\\·')));
  for(const label of ['Upload an image','Import BPMN','Create it here'])assert.match(page,new RegExp(label));
  assert.match(page,/Technical details/);
  assert.match(page,/r111dSimple/);
  assert.match(page,/\/api\/input\/canvas/);
  assert.match(page,/Prepare Temporal workflow/);
});

test('R1-11D Canvas enters source preservation, Canonical review, confirmation and Automation Design',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r111d-canvas-'));
  const app=await startTalosOneApp({runtimeDir,port:0});
  try{
    const intake=await post(app.baseUrl,'/api/input/canvas',{
      title:'Simple service process',
      initiatedBy:'field-trial-user',
      elements:[
        {id:'start',kind:'START',label:'Start'},
        {id:'work',kind:'STEP',label:'Do the work'},
        {id:'end',kind:'END',label:'Done'},
      ],
      connections:[],
    });
    assert.equal(intake.response.status,201);
    assert.equal(intake.body.status,'BPMN_READY_FOR_PROCESS_REVIEW');
    assert.equal(intake.body.sourceKind,'TALOS_CANVAS');
    assert.equal(intake.body.reconciliation.status,'RECONCILED');
    assert.equal(intake.body.automaticConfirmationAuthorized,false);
    assert.equal(intake.body.automaticAutomationDesignAuthorized,false);

    const review=await fetch(app.baseUrl+'/api/process-review?revisionId='+encodeURIComponent(intake.body.revision.id));
    assert.equal(review.status,200);

    const confirmation=await post(app.baseUrl,'/api/bpmn/confirm',{
      revisionId:intake.body.revision.id,
      canonicalProcessRevisionId:intake.body.reconciliation.processRevision.id,
      confirmedBy:'field-trial-user',
      authorityRef:'authority:r1-11d:test:canvas-confirm',
      rationale:'Reviewed exact Canvas-derived business process.',
    });
    assert.equal(confirmation.response.status,201);
    assert.equal(confirmation.body.automaticAutomationDesignAuthorized,false);

    const design=await post(app.baseUrl,'/api/bpmn/automation-design-approval',{
      revisionId:confirmation.body.revision.id,
      confirmationId:confirmation.body.confirmation.id,
      approvedBy:'field-trial-user',
      authorityRef:'authority:r1-11d:test:canvas-design',
    });
    assert.equal(design.response.status,201);
    assert.equal(design.body.automationDesignOpened,true);
    assert.equal(design.body.deploymentAuthorized,false);
    assert.equal(design.body.executionAuthorized,false);
  }finally{
    await app.close();
    rmSync(runtimeDir,{recursive:true,force:true});
  }
});

test('R1-11D guided clarification survives product restart and Apply is idempotent',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r111d-restart-'));
  let app=await startTalosOneApp({runtimeDir,port:0});
  try{
    const intake=await post(app.baseUrl,'/api/input/canvas',{
      title:'Decision and wait process',
      initiatedBy:'field-trial-user',
      elements:[
        {id:'start',kind:'START',label:'Start'},
        {id:'decision',kind:'DECISION',label:'Needs treatment?'},
        {id:'wait',kind:'WAIT',label:'Let product work'},
        {id:'end',kind:'END',label:'Done'},
      ],
      connections:[
        {id:'a',from:'start',to:'decision',kind:'FLOW'},
        {id:'b',from:'decision',to:'wait',kind:'CONDITION'},
        {id:'c',from:'decision',to:'end',kind:'DEFAULT'},
        {id:'d',from:'wait',to:'end',kind:'FLOW'},
      ],
    });
    assert.equal(intake.response.status,201);
    const validation=intake.body.reconciliation.validation;
    const answers:any[]=[];
    for(const question of validation.questions){
      const finding=validation.findings.find((item:any)=>question.findingRefs.includes(item.id));
      if(finding?.code==='SV-CFL-001')answers.push({kind:'BRANCH_CONDITION',questionRef:question.id,findingRef:finding.id,targetRef:question.targetRef,condition:'When treatment is needed'});
      if(finding?.code==='SV-EVT-003')answers.push({kind:'WAIT_SEMANTICS',questionRef:question.id,findingRef:finding.id,targetRef:question.targetRef,waitKind:'DURATION',expression:'5 minutes'});
    }
    assert.ok(answers.some((item)=>item.kind==='BRANCH_CONDITION'));
    assert.ok(answers.some((item)=>item.kind==='WAIT_SEMANTICS'));

    const proposal=await post(app.baseUrl,'/api/semantic-resolution/propose',{
      revisionId:intake.body.revision.id,
      answers,
      answeredBy:'field-trial-user',
      authorityRef:'authority:r1-11d:test:answers',
      rationale:'Business user supplied the missing branch and wait meaning.',
    });
    assert.equal(proposal.response.status,201);
    assert.equal(proposal.body.createsCanonicalRevision,false);
    const proposalId=proposal.body.proposal.id;
    const originalRevisionId=intake.body.revision.id;

    await app.close();
    app=await startTalosOneApp({runtimeDir,port:0});

    const accepted=await post(app.baseUrl,'/api/semantic-resolution/decide',{
      revisionId:originalRevisionId,
      proposalId,
      decision:'ACCEPT',
      decidedBy:'field-trial-user',
      authorityRef:'authority:r1-11d:test:accept',
      rationale:'Explicitly apply the reviewed clarifications.',
    });
    assert.equal(accepted.response.status,201);
    assert.equal(accepted.body.requiresProcessReconfirmation,true);
    assert.equal(accepted.body.authorizesAutomationDesign,false);
    assert.notEqual(accepted.body.revision.id,originalRevisionId);

    const replay=await post(app.baseUrl,'/api/semantic-resolution/decide',{
      revisionId:originalRevisionId,
      proposalId,
      decision:'ACCEPT',
      decidedBy:'field-trial-user',
      authorityRef:'authority:r1-11d:test:accept-again',
      rationale:'Double click replay must not create another revision.',
    });
    assert.equal(replay.response.status,200);
    assert.equal(replay.body.idempotentReplay,true);
    assert.equal(replay.body.revision.id,accepted.body.revision.id);

    await app.close();
    app=await startTalosOneApp({runtimeDir,port:0});

    const confirmation=await post(app.baseUrl,'/api/bpmn/confirm',{
      revisionId:accepted.body.revision.id,
      canonicalProcessRevisionId:accepted.body.reconciliation.processRevision.id,
      confirmedBy:'field-trial-user',
      authorityRef:'authority:r1-11d:test:reconfirm',
      rationale:'Reviewed clarified process.',
    });
    assert.equal(confirmation.response.status,201);

    const design=await post(app.baseUrl,'/api/bpmn/automation-design-approval',{
      revisionId:confirmation.body.revision.id,
      confirmationId:confirmation.body.confirmation.id,
      approvedBy:'field-trial-user',
      authorityRef:'authority:r1-11d:test:design',
    });
    assert.equal(design.response.status,201);
    assert.equal(design.body.automationDesignOpened,true);
  }finally{
    await app.close();
    rmSync(runtimeDir,{recursive:true,force:true});
  }
});
