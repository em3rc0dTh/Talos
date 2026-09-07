// R1-11 product-field closure layer.
//
// This layer owns two presentation/recovery concerns discovered by real-user
// field use without weakening any authority boundary:
// 1) one bounded AI-design retry when a routed safe-stop exposes no material
//    question the user can answer;
// 2) explicit Run-stage completion/reveal when the governed execution design is
//    compiled, including a truthful DESIGN_ONLY terminal product state.
//
// It is domain agnostic. No process label, actor name, branch text or fixture
// identity participates in either decision.
export const ONE_APP_PRODUCT_RELEASE_CLOSURE_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var priorJson=Response.prototype.json;
  var runtimeProfile=null;
  var aiRecoveryAttempts=0;
  var refreshTimer=0;

  function byId(id){return document.getElementById(id)}
  function all(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector))}
  function text(node){return String(node&&node.textContent||'').trim()}
  function routeOf(response){try{return new URL(response.url,window.location.href).pathname}catch(_){return''}}
  function reveal(node){if(!node)return;if(node.classList){node.classList.remove('talos-simple-hidden');node.classList.remove('closed')}if(node.style.display==='none')node.style.display=''}
  function setCompile(message,kind){var node=byId('talosCompileStateFinal')||byId('talosCompileState');if(!node)return;node.textContent=message;node.className='talos-engine-state '+(kind||'')}
  function scheduleRefresh(delay){if(refreshTimer)window.clearTimeout(refreshTimer);refreshTimer=window.setTimeout(function(){refreshTimer=0;refresh()},delay===undefined?40:delay)}

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

  function ensureDesignOnlyClosure(){
    if(!compiledTruth())return;
    reveal(byId('talosRunIntro'));reveal(byId('deployCard'));
    var stage=byId('talosStageRun');if(stage)stage.className='talos-stage active';
    var deploy=byId('deployCard');if(!deploy)return;
    var available=Boolean(runtimeProfile&&runtimeProfile.temporalExecutionAvailable);
    var button=byId('talosDeployRecovery')||byId('talosDeployOnce');
    if(button){button.disabled=!available;if(!available)button.textContent='Temporal runtime required to deploy'}
    var note=byId('talosRuntimeClosure');
    if(!note){note=document.createElement('div');note.id='talosRuntimeClosure';note.className='talos-release-state';deploy.appendChild(note)}
    if(available){
      note.textContent='Automation design is complete. Temporal is available; deploy the approved workflow when you are ready.';
    }else{
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

  function refresh(){fixAiVisualState();ensureDesignOnlyClosure()}

  function capture(response,body){
    if(!response||!response.ok||!body)return;
    var path=routeOf(response);
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
