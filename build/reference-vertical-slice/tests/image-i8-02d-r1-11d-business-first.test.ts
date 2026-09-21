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
  assert.match(page,/How should this business step be handled when Talos runs the workflow/);
  assert.match(page,/Who is responsible\?/);
  assert.match(page,/Talos has a low-risk draft/);
  assert.match(page,/Use Talos proposal/);
  assert.match(page,/Review exceptions/);
  assert.match(page,/Set one default/);
  assert.match(page,/Apply to similar unresolved steps/);
  assert.match(page,/useRecommendedMapping:true/);
  assert.match(page,/allowDurableRecovery:true/);
});

test('R1-11D Canvas enters source preservation, Canonical review, confirmation and Automation Design',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r111d-canvas-'));
  let app=await startTalosOneApp({runtimeDir,port:0});
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
    const clarifiedWait=accepted.body.reconciliation.processRevision.nodes.find((node:any)=>node.name==='Let product work');
    assert.ok(clarifiedWait);
    assert.equal(clarifiedWait.kind,'WAIT');
    assert.equal(clarifiedWait.details.waitKind,'DURATION');
    assert.equal(clarifiedWait.details.expression,'5 minutes');

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


test('R1-11D actorless business actions can be explicitly designed as human work without changing Canonical business truth',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r111d-human-capability-'));
  const app=await startTalosOneApp({runtimeDir,port:0});
  try{
    const intake=await post(app.baseUrl,'/api/input/canvas',{
      title:'Manual service process',
      initiatedBy:'field-trial-user',
      elements:[
        {id:'start',kind:'START',label:'Start'},
        {id:'work',kind:'STEP',label:'Wash the vehicle'},
        {id:'end',kind:'END',label:'Done'},
      ],
      connections:[],
    });
    assert.equal(intake.response.status,201);

    const confirmation=await post(app.baseUrl,'/api/bpmn/confirm',{
      revisionId:intake.body.revision.id,
      canonicalProcessRevisionId:intake.body.reconciliation.processRevision.id,
      confirmedBy:'field-trial-user',
      authorityRef:'authority:r1-11d:test:manual-confirm',
      rationale:'Reviewed exact manual service process.',
    });
    assert.equal(confirmation.response.status,201);

    const design=await post(app.baseUrl,'/api/bpmn/automation-design-approval',{
      revisionId:confirmation.body.revision.id,
      confirmationId:confirmation.body.confirmation.id,
      approvedBy:'field-trial-user',
      authorityRef:'authority:r1-11d:test:manual-design',
    });
    assert.equal(design.response.status,201);
    assert.equal(design.body.automationDesignOpened,true);
    const workspace=design.body.automationDesign.workspace;
    assert.equal(workspace.requirements.length,1);
    const requirement=workspace.requirements[0];
    assert.equal(requirement.businessStepName,'Wash the vehicle');
    assert.equal(requirement.businessStepKind,'ACTION');
    assert.equal(requirement.designState,'UNRESOLVED_CAPABILITY');

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
        decidedBy:'field-trial-user',
        authorityRef:'authority:r1-11d:test:manual-selection',
        rationale:'The user explicitly chose a manual human step in Automation Design.',
        human:{
          interactionKind:'MANUAL_ACTION',
          responsibilityKind:'PERFORMER',
          roleRefs:[],
          participantLabel:'Car-wash operator',
          assignmentCardinality:'ANY_ELIGIBLE',
          outcomes:[{code:'COMPLETED',businessMeaning:'Wash the vehicle is complete.',terminal:true}],
        },
      }],
    });
    assert.equal(selected.response.status,201);
    assert.equal(selected.body.createsBinding,true);
    assert.equal(selected.body.executionPlanAuthorized,false);
    assert.equal(selected.body.resolution.participantRequirements[0].roleRefs.length,0);
    assert.deepEqual(selected.body.resolution.participantRequirements[0].actorTypeConstraints,['BUSINESS_RESPONSIBILITY:Car-wash operator']);

    const review=await post(app.baseUrl,'/api/automation/execution-plan/review',{
      workspaceId:workspace.id,
      decisions:{},
    });
    assert.equal(review.response.status,201);
    assert.equal(review.body.review.state,'READY_FOR_AUTOMATION_APPROVAL');
    assert.equal(review.body.review.temporalDesignAuthorized,false);
    assert.equal(review.body.review.deploymentAuthorized,false);
    assert.equal(review.body.review.executionAuthorized,false);
  }finally{
    await app.close();
    rmSync(runtimeDir,{recursive:true,force:true});
  }
});


test('R1-11E recommended Temporal mapping reuses confirmed wait and approved human design without another per-step form',async()=>{
  const runtimeDir=mkdtempSync(path.join(os.tmpdir(),'talos-r111e-low-friction-'));
  let app=await startTalosOneApp({runtimeDir,port:0});
  try{
    const intake=await post(app.baseUrl,'/api/input/canvas',{
      title:'Low-friction manual process',
      initiatedBy:'field-trial-user',
      elements:[
        {id:'start',kind:'START',label:'Start'},
        {id:'work',kind:'STEP',label:'Wash the vehicle'},
        {id:'wait',kind:'WAIT',label:'Let product work'},
        {id:'end',kind:'END',label:'Done'},
      ],
      connections:[
        {id:'a',from:'start',to:'work',kind:'FLOW'},
        {id:'b',from:'work',to:'wait',kind:'FLOW'},
        {id:'c',from:'wait',to:'end',kind:'FLOW'},
      ],
    });
    assert.equal(intake.response.status,201);

    const validation=intake.body.reconciliation.validation;
    const waitQuestion=validation.questions.find((question:any)=>{
      const finding=validation.findings.find((item:any)=>question.findingRefs.includes(item.id));
      return finding?.code==='SV-EVT-003';
    });
    assert.ok(waitQuestion);
    const waitFinding=validation.findings.find((item:any)=>waitQuestion.findingRefs.includes(item.id));
    assert.ok(waitFinding);

    const proposal=await post(app.baseUrl,'/api/semantic-resolution/propose',{
      revisionId:intake.body.revision.id,
      answers:[{
        kind:'WAIT_SEMANTICS',
        questionRef:waitQuestion.id,
        findingRef:waitFinding.id,
        targetRef:waitQuestion.targetRef,
        waitKind:'DURATION',
        expression:'5 minutes',
      }],
      answeredBy:'field-trial-user',
      authorityRef:'authority:r1-11e:test:wait-answer',
      rationale:'The business user confirmed the exact wait duration.',
    });
    assert.equal(proposal.response.status,201);

    const accepted=await post(app.baseUrl,'/api/semantic-resolution/decide',{
      revisionId:intake.body.revision.id,
      proposalId:proposal.body.proposal.id,
      decision:'ACCEPT',
      decidedBy:'field-trial-user',
      authorityRef:'authority:r1-11e:test:wait-accept',
      rationale:'Apply the confirmed wait semantics.',
    });
    assert.equal(accepted.response.status,201);

    const confirmation=await post(app.baseUrl,'/api/bpmn/confirm',{
      revisionId:accepted.body.revision.id,
      canonicalProcessRevisionId:accepted.body.reconciliation.processRevision.id,
      confirmedBy:'field-trial-user',
      authorityRef:'authority:r1-11e:test:confirm',
      rationale:'Reviewed the clarified business process.',
    });
    assert.equal(confirmation.response.status,201);

    const design=await post(app.baseUrl,'/api/bpmn/automation-design-approval',{
      revisionId:confirmation.body.revision.id,
      confirmationId:confirmation.body.confirmation.id,
      approvedBy:'field-trial-user',
      authorityRef:'authority:r1-11e:test:automation-design',
    });
    assert.equal(design.response.status,201);
    const workspace=design.body.automationDesign.workspace;
    assert.equal(workspace.requirements.length,1);
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
        decidedBy:'field-trial-user',
        authorityRef:'authority:r1-11e:test:human-default',
        rationale:'One explicit default says this manual process step is handled by the car-wash operator.',
        human:{
          interactionKind:'MANUAL_ACTION',
          responsibilityKind:'PERFORMER',
          roleRefs:[],
          participantLabel:'Car-wash operator',
          assignmentCardinality:'ANY_ELIGIBLE',
          outcomes:[{code:'COMPLETED',businessMeaning:'Wash the vehicle is complete.',terminal:true}],
        },
      }],
    });
    assert.equal(selected.response.status,201);

    const review=await post(app.baseUrl,'/api/automation/execution-plan/review',{
      workspaceId:workspace.id,
      decisions:{},
    });
    assert.equal(review.response.status,201);
    assert.equal(review.body.review.state,'READY_FOR_AUTOMATION_APPROVAL');
    assert.ok(review.body.execution.elements.some((element:any)=>element.kind==='WAIT_COORDINATION'));
    assert.ok(review.body.execution.elements.some((element:any)=>element.kind==='HUMAN_COORDINATION'));

    const approval=await post(app.baseUrl,'/api/automation/approve',{
      reviewId:review.body.review.id,
      approvedBy:'field-trial-user',
      authorityRef:'authority:r1-11e:test:automation-approval',
      rationale:'Approve this reviewed automation plan for Temporal design only.',
    });
    assert.equal(approval.response.status,201);
    assert.equal(approval.body.idempotentReplay,false);

    const approvalReplay=await post(app.baseUrl,'/api/automation/approve',{
      reviewId:review.body.review.id,
      approvedBy:'field-trial-user',
      authorityRef:'authority:r1-11f:test:automation-approval-replay',
      rationale:'A repeated product click must return the existing exact approval without appending another approval.',
    });
    assert.equal(approvalReplay.response.status,200);
    assert.equal(approvalReplay.body.idempotentReplay,true);
    assert.equal(approvalReplay.body.id,approval.body.id);
    assert.equal(approvalReplay.body.executionDigest,approval.body.executionDigest);

    await app.close();
    app=await startTalosOneApp({runtimeDir,port:0});

    const mapping=await post(app.baseUrl,'/api/automation/temporal-mapping',{
      approvalId:approval.body.id,
      useRecommendedMapping:true,
      allowDurableRecovery:true,
      decidedBy:'field-trial-user',
      authorityRef:'authority:r1-11f:test:recommended-temporal-after-restart',
      rationale:'Explicitly resume Temporal design from the exact durable automation approval without re-entering approved details.',
    });
    assert.equal(mapping.response.status,201);
    assert.equal(mapping.body.recommendedMappingApplied,true);
    assert.equal(mapping.body.durableRecoveryApplied,true);
    assert.equal(mapping.body.idempotentReplay,false);
    assert.equal(mapping.body.recommendedWaitResolutionCount,1);
    assert.equal(mapping.body.recommendedHumanResolutionCount,1);
    assert.ok(mapping.body.mapping.units.some((unit:any)=>unit.constructKind==='DURABLE_TIMER'));
    assert.ok(mapping.body.mapping.units.some((unit:any)=>unit.constructKind==='UPDATE_HANDLER'));
    assert.equal(mapping.body.deploymentAuthorized,false);
    assert.equal(mapping.body.executionAuthorized,false);

    const replay=await post(app.baseUrl,'/api/automation/temporal-mapping',{
      approvalId:approval.body.id,
      useRecommendedMapping:true,
      allowDurableRecovery:true,
      decidedBy:'field-trial-user',
      authorityRef:'authority:r1-11f:test:recommended-temporal-replay',
      rationale:'Repeat click must return the already prepared Temporal mapping without creating another revision.',
    });
    assert.equal(replay.response.status,200);
    assert.equal(replay.body.idempotentReplay,true);
    assert.equal(replay.body.mapping.revision.id,mapping.body.mapping.revision.id);
    assert.equal(replay.body.deploymentAuthorized,false);
    assert.equal(replay.body.executionAuthorized,false);

    const runtimePolicy=await post(app.baseUrl,'/api/automation/runtime-policy',{
      approvalId:approval.body.id,
      temporalMappingRevisionId:mapping.body.mapping.revision.id,
      activities:[],
      workflow:{
        authorityRef:'authority:r1-11g:test:human-runtime-policy',
        decidedBy:'field-trial-user',
        rationale:'Human Update handlers do not execute through Activities; accept only the explicit Workflow retry policy.',
        maximumAttempts:1,
        policyBasis:'USER_EXPLICIT_DESIGN',
      },
    });
    assert.equal(runtimePolicy.response.status,201);
    assert.equal(runtimePolicy.body.runtimePolicy.assessment.readiness,'READY_FOR_DEPLOYMENT_DESIGN');
    assert.equal(runtimePolicy.body.runtimePolicy.activityPolicies.length,0);
    assert.equal(runtimePolicy.body.runtimePolicy.timeoutPolicies.length,0);
    assert.equal(runtimePolicy.body.runtimePolicy.idempotencyPolicies.length,0);
    assert.equal(runtimePolicy.body.deploymentAuthorized,false);
    assert.equal(runtimePolicy.body.executionAuthorized,false);

  }finally{
    await app.close();
    rmSync(runtimeDir,{recursive:true,force:true});
  }
});
