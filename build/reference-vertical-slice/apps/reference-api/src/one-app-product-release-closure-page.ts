// R1-11 product-field closure layer.
//
// This layer owns presentation/recovery concerns discovered by real-user
// field use without weakening any authority boundary:
// 1) one bounded AI-design retry when a routed safe-stop exposes no material
//    question the user can answer;
// 2) explicit Run-stage completion/reveal when the governed execution design is
//    compiled, including a truthful DESIGN_ONLY terminal product state;
// 3) truthful Temporal Worker activation: the visible action drives the existing
//    authority-bearing deployment stages and reports success only after the real
//    /api/automation/deployment/attempt response is SUCCEEDED.
//
// It is domain agnostic. No process label, actor name, branch text or fixture
// identity participates in any decision.
export const ONE_APP_PRODUCT_RELEASE_CLOSURE_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var priorJson=Response.prototype.json;
  var runtimeProfile=null;
  var aiRecoveryAttempts=0;
  var refreshTimer=0;
  var activationRunning=false;
  var lastDeploymentAttempt=null;

  function byId(id){return document.getElementById(id)}
  function all(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector))}
  function text(node){return String(node&&node.textContent||'').trim()}
  function routeOf(response){try{return new URL(response.url,window.location.href).pathname}catch(_){return''}}
  function reveal(node){if(!node)return;if(node.classList){node.classList.remove('talos-simple-hidden');node.classList.remove('closed')}if(node.style.display==='none')node.style.display=''}
  function setCompile(message,kind){var node=byId('talosCompileStateFinal')||byId('talosCompileState');if(!node)return;node.textContent=message;node.className='talos-engine-state '+(kind||'')}
  function scheduleRefresh(delay){if(refreshTimer)window.clearTimeout(refreshTimer);refreshTimer=window.setTimeout(function(){refreshTimer=0;refresh()},delay===undefined?40:delay)}
  function deploymentText(){return [text(byId('deploymentState')),text(byId('truthDeployment'))].join(' ')}
  function deploymentSucceeded(){return Boolean(lastDeploymentAttempt&&lastDeploymentAttempt.result==='SUCCEEDED')&&/Worker deployed|Worker deployment succeeded/i.test(deploymentText())}

  function materialQuestions(routing){
    if(!routing)return[];
    var attempt=(routing.fallback&&routing.fallback.proposal)||(routing.primary&&routing.primary.proposal)||null;
    return attempt&&Array.isArray(attempt.unresolvedQuestions)?attempt.unresolvedQuestions.filter(function(question){return Boolean(question&&question.material)}):[];
  }

  function retryButton(){
    var panel=byId('aiAutomationProposal');if(!panel)return null;
    return all('button',panel).find(function(button){return /Redesign with Gemini|^Redesign$/i.test(text(button))&&!button.disabled})||null;
  }

  function recoverUnresolvedAi(routing){
    if(!routing||routing.decision!=='UNRESOLVED_AFTER_FALLBACK')return false;
    var questions=materialQuestions(routing);
    if(questions.length>0){
      setCompile('Automation design needs your input before Talos can continue.','warn');
      return false;
    }
    if(aiRecoveryAttempts>=1){
      setCompile('Automation design could not settle automatically. Review the design state or try again.','warn');
      return false;
    }
    aiRecoveryAttempts+=1;
    setCompile('Talos is retrying the automation design once…','warn');
    window.setTimeout(function(){
      var button=retryButton();
      if(button)button.click();
      else scheduleRefresh(120);
    },120);
    return true;
  }

  function compiledTruth(){
    var combined=[text(byId('talosCompileStateFinal')),text(byId('talosCompileState')),text(byId('truthAutomation')),text(byId('runtimeState')),text(byId('runtimePolicyPreview'))].join(' ');
    return /Automation compiled and governed/i.test(combined)||(/READY_FOR_DEPLOYMENT_DESIGN/i.test(combined)&&/ExecutionPlan approved|ExecutionPlan|approved/i.test(combined));
  }

  function runtimeNote(){
    var deploy=byId('deployCard');if(!deploy)return null;
    var note=byId('talosRuntimeClosure');
    if(!note){note=document.createElement('div');note.id='talosRuntimeClosure';note.className='talos-release-state';deploy.appendChild(note)}
    return note;
  }

  function activationButton(){return byId('talosDeployRecovery')||byId('talosDeployOnce')}

  function waitFor(predicate,timeout,label){
    return new Promise(function(resolve,reject){
      var started=Date.now();
      function poll(){
        var value=false;try{value=Boolean(predicate())}catch(_){}
        if(value){resolve();return}
        if(Date.now()-started>=timeout){reject(new Error(label+' did not settle'));return}
        window.setTimeout(poll,100)
      }
      poll()
    })
  }

  async function driveAuthorityStep(buttonId,nextReady,label){
    if(nextReady())return;
    var button=byId(buttonId);
    if(!button)throw new Error(label+' control is unavailable');
    if(button.disabled){
      await waitFor(function(){return nextReady()||!button.disabled},6000,label+' readiness');
      if(nextReady())return;
    }
    if(button.disabled)throw new Error(label+' remains blocked by governance');
    button.click();
    await waitFor(nextReady,15000,label)
  }

  function renderDeploymentProof(){
    var deploy=byId('deployCard');if(!deploy||!lastDeploymentAttempt)return;
    var proof=byId('talosDeploymentProof');
    if(!proof){proof=document.createElement('div');proof.id='talosDeploymentProof';proof.className='talos-release-state';deploy.appendChild(proof)}
    var evidence=Array.isArray(lastDeploymentAttempt.evidenceRefs)?lastDeploymentAttempt.evidenceRefs:[];
    var taskQueue=(runtimeProfile&&runtimeProfile.temporal&&runtimeProfile.temporal.taskQueue)||'';
    proof.textContent='Temporal Worker activation confirmed by backend · result '+String(lastDeploymentAttempt.result||'UNKNOWN')+(taskQueue?' · Task Queue '+taskQueue:'')+(evidence.length?' · '+evidence.length+' evidence ref(s)':'');
    var button=activationButton();if(button){button.textContent='Worker active';button.disabled=true;button.className='good talos-primary-action'}
    reveal(byId('executeCard'));
    var run=byId('talosRunRecovery')||byId('talosRunOnce');if(run)run.disabled=false;
    var note=runtimeNote();if(note)note.textContent='Worker activation is proven. You can now start one governed Temporal Workflow execution.';
  }

  function renderDeploymentFailure(message){
    var note=runtimeNote();if(note){note.textContent='Worker activation failed: '+message;note.className='talos-release-state'}
    var button=activationButton();if(button){button.textContent='Retry Worker activation';button.disabled=false}
  }

  async function activateApprovedWorker(){
    if(activationRunning)return;
    if(!(runtimeProfile&&runtimeProfile.temporalExecutionAvailable)){renderDeploymentFailure('Temporal execution is not available in this session.');return}
    activationRunning=true;lastDeploymentAttempt=null;
    var visible=activationButton();if(visible){visible.disabled=true;visible.textContent='Activating Worker…'}
    var note=runtimeNote();if(note)note.textContent='Talos is consuming the explicit deployment authority and waiting for backend Worker proof…';
    try{
      await driveAuthorityStep('designDeployment',function(){return !byId('realizeEnvironment')?.disabled||/Deployment designed|Environment evidence|deployment attempt|Worker deployment succeeded/i.test(deploymentText())},'Deployment design');
      await driveAuthorityStep('realizeEnvironment',function(){return !byId('approveDeployment')?.disabled||/Environment evidence|deployment attempt|Worker deployment succeeded/i.test(deploymentText())},'Environment realization');
      await driveAuthorityStep('approveDeployment',function(){return !byId('deployWorker')?.disabled||/One deployment attempt|Worker deployment succeeded/i.test(deploymentText())},'Deployment approval');
      await driveAuthorityStep('deployWorker',function(){return Boolean(lastDeploymentAttempt)||/Worker deployed|Worker deployment succeeded/i.test(deploymentText())},'Temporal Worker activation');
      await waitFor(function(){return deploymentSucceeded()},5000,'Backend deployment proof');
      renderDeploymentProof();
    }catch(error){
      renderDeploymentFailure(error instanceof Error?error.message:String(error));
    }finally{
      activationRunning=false;
    }
  }

  function installWorkerActivationAction(){
    if(!(runtimeProfile&&runtimeProfile.temporalExecutionAvailable))return;
    var current=activationButton();if(!current||current.dataset.talosWorkerActivationBound==='true')return;
    var replacement=current.cloneNode(true);
    replacement.id=current.id;
    replacement.dataset.talosWorkerActivationBound='true';
    replacement.disabled=false;
    replacement.textContent='Activate approved Worker';
    current.replaceWith(replacement);
    replacement.addEventListener('click',function(){void activateApprovedWorker()});
    var note=runtimeNote();if(note&&!lastDeploymentAttempt)note.textContent='Temporal is available. Activate the approved Worker on the configured Task Queue, then run the workflow.';
  }

  function ensureDesignOnlyClosure(){
    if(!compiledTruth())return;
    reveal(byId('talosRunIntro'));reveal(byId('deployCard'));
    var stage=byId('talosStageRun');if(stage)stage.className='talos-stage active';
    var deploy=byId('deployCard');if(!deploy)return;
    var available=Boolean(runtimeProfile&&runtimeProfile.temporalExecutionAvailable);
    var button=activationButton();
    if(button&&!activationRunning&&!lastDeploymentAttempt){button.disabled=!available;if(!available)button.textContent='Temporal runtime required to deploy'}
    var note=runtimeNote();
    if(available){
      installWorkerActivationAction();
      if(note&&!lastDeploymentAttempt&&!activationRunning)note.textContent='Temporal is available. Activate the approved Worker on the configured Task Queue, then run the workflow.';
    }else if(note){
      note.innerHTML='<strong>Automation design complete.</strong><br>This session is DESIGN_ONLY. Start Talos in Temporal Execution mode to deploy and run this same governed workflow.';
    }
  }

  function fixAiVisualState(){
    var panel=byId('aiAutomationProposal'),compile=byId('talosCompileStateFinal')||byId('talosCompileState');if(!panel||!compile)return;
    var panelText=text(panel);
    if(/AI design stopped safely/i.test(panelText)&&/Gemini is preparing the Temporal workflow proposal/i.test(text(compile))){
      compile.textContent='Automation design needs input or governed retry.';compile.className='talos-engine-state warn';
    }else if(/AI design coverage is complete/i.test(panelText)&&/Gemini is preparing the Temporal workflow proposal/i.test(text(compile))){
      compile.textContent='Automation proposal ready for review.';compile.className='talos-engine-state good';
    }
  }

  function refresh(){fixAiVisualState();ensureDesignOnlyClosure();if(lastDeploymentAttempt&&lastDeploymentAttempt.result==='SUCCEEDED')renderDeploymentProof()}

  function capture(response,body){
    if(!response||!body)return;
    var path=routeOf(response);
    if(path.indexOf('/api/automation/deployment/attempt')!==-1){
      if(response.ok&&body.deploymentAttempt){
        lastDeploymentAttempt=body.deploymentAttempt;
        scheduleRefresh(10);
      }else{
        renderDeploymentFailure(String(body.error||body.code||('HTTP '+response.status)));
      }
      return;
    }
    if(!response.ok)return;
    if(path.indexOf('/api/product/runtime-profile')!==-1){runtimeProfile=body;scheduleRefresh(10);return}
    if(path.indexOf('/api/automation/proposal/generate')!==-1){
      var routing=body.routing||null;
      if(routing&&(routing.decision==='PRIMARY_ACCEPTED'||routing.decision==='FALLBACK_ACCEPTED')){
        aiRecoveryAttempts=0;setCompile('Automation proposal ready for review.','good');scheduleRefresh(20);return;
      }
      if(recoverUnresolvedAi(routing))return;
      scheduleRefresh(30);return;
    }
    if(path.indexOf('/api/automation/runtime-policy')!==-1||path.indexOf('/api/automation/approve')!==-1||path.indexOf('/api/automation/temporal-mapping')!==-1){scheduleRefresh(30);window.setTimeout(scheduleRefresh,250);window.setTimeout(scheduleRefresh,800)}
  }

  Response.prototype.json=function(){
    var response=this;
    return priorJson.call(this).then(function(body){try{capture(response,body)}catch(_){}return body});
  };

  document.addEventListener('click',function(event){if(event.target&&event.target.tagName==='BUTTON'){window.setTimeout(scheduleRefresh,80);window.setTimeout(scheduleRefresh,500)}});
  fetch('/api/product/runtime-profile').then(function(response){return response.ok?response.json():null}).then(function(profile){if(profile)runtimeProfile=profile;scheduleRefresh(20)}).catch(function(){});
  scheduleRefresh(100);window.setTimeout(scheduleRefresh,600);
})();
`;
