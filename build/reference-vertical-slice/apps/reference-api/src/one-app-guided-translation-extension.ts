export const GUIDED_TRANSLATION_EXTENSION = String.raw`
<style>
  .talosProposal{border:1px solid #315b4a;border-radius:14px;background:#0a1915;padding:16px;margin:0 0 12px;color:#dcebe4}
  .talosProposal h3{margin:0 0 6px;font-size:16px}.talosProposal p{font-size:12px;line-height:1.6;color:#a9bfb5}
  .talosProposalRows{display:grid;gap:8px;margin:12px 0}.talosProposalRow{border:1px solid #2b453b;border-radius:10px;padding:12px;background:#09130f}
  .talosProposalRow strong,.talosProposalRow small{display:block}.talosProposalRow small{margin:5px 0 8px;color:#a5b9b1;font-size:11px;line-height:1.5}
  .talosProposalRow select,.talosProposalRow input{max-width:100%;margin:4px 8px 4px 0;padding:8px;border:1px solid #416052;border-radius:8px;background:#101e18;color:#e5f5eb;font:inherit}
  .talosProposalState{font-size:12px;line-height:1.6;margin:8px 0;color:#b8d5c7}.talosProposalState.error{color:#ffb1b1}
  body.r111dSimple #r105AutomationDesign{display:none!important}
  #talosProposal [hidden]{display:none!important}
</style>
<script>
(function(){
  'use strict';
  var priorFetch=window.fetch.bind(window),epoch=0,active=null,proposal=null,busy=false,plan=null,approved=false;
  function el(id){return document.getElementById(id)}
  function install(){
    if(el('talosProposal'))return;
    var panel=el('r113TemporalPanel');if(!panel)return;
    var box=document.createElement('section');box.id='talosProposal';box.className='talosProposal';box.hidden=true;
    box.innerHTML='<h3 id="talosProposalTitle">Preparing your automation proposal</h3><p id="talosProposalIntro"></p><div id="talosProposalRows" class="talosProposalRows"></div><div id="talosExecutionQuestions" class="talosProposalRows"></div><div id="talosProposalState" class="talosProposalState" role="status" aria-live="polite"></div><div class="r113Actions"><button id="talosUseProposal" type="button" hidden>Use this proposal</button><button id="talosApplyExecutionAnswers" type="button" hidden>Apply answers & update design</button><button id="talosReviewProcessDetails" type="button" hidden>Review missing business details</button><button id="talosApproveProposal" type="button" hidden>Approve design & prepare Temporal</button><button id="talosRetryProposal" type="button" hidden>Retry preparation</button></div>';
    panel.insertBefore(box,panel.firstChild);
    [['r113WorkflowSource','View generated workflow source'],['r113BpmnXml','View BPMN XML']].forEach(function(pair){var source=el(pair[0]);if(source){var details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=pair[1];source.parentNode.insertBefore(details,source);details.appendChild(summary);details.appendChild(source)}});
    el('talosUseProposal').onclick=useProposal;el('talosApproveProposal').onclick=approve;
    el('talosApplyExecutionAnswers').onclick=applyExecutionAnswers;el('talosReviewProcessDetails').onclick=reviewProcessDetails;
    el('talosRetryProposal').onclick=function(){if(approved)window.talosBusinessAutomation.prepareTemporal();else if(plan&&plan.review.state==='READY_FOR_AUTOMATION_APPROVAL')approve();else if(plan)applyExecutionAnswers();else if(proposal)useProposal();else if(active)prepare(active)};
  }
  function state(title,message,error){
    install();var box=el('talosProposal');if(!box)return;box.hidden=false;box.setAttribute('aria-busy',busy?'true':'false');el('talosProposalTitle').textContent=title;
    el('talosProposalState').textContent=message;el('talosProposalState').className='talosProposalState'+(error?' error':'');
    el('talosRetryProposal').hidden=!error;el('talosUseProposal').disabled=busy;el('talosApproveProposal').disabled=busy;
    var messageNode=el('r113TemporalState');if(messageNode)messageNode.textContent=message;
  }
  function reset(){epoch+=1;active=null;proposal=null;plan=null;approved=false;busy=false;install();el('talosProposal').hidden=true;el('talosUseProposal').hidden=true;el('talosApproveProposal').hidden=true;el('talosApplyExecutionAnswers').hidden=true;el('talosReviewProcessDetails').hidden=true;el('talosExecutionQuestions').replaceChildren();el('talosProposalRows').replaceChildren()}
  function ready(){return proposal&&proposal.steps.every(function(step){return step.family&&(step.family!=='HUMAN_INTERACTION'||step.participantLabel)})}
  function updateReady(){el('talosUseProposal').disabled=busy||!ready()}
  function renderProposal(){
    var host=el('talosProposalRows');host.replaceChildren();
    el('talosProposalIntro').textContent='Talos prepared '+proposal.steps.length+' activities and '+proposal.decisionCount+' decision'+(proposal.decisionCount===1?'':'s')+'. Suggested services remain implementation requirements until connected. Review the proposal and answer only what is still unknown.';
    proposal.steps.forEach(function(step){
      var row=document.createElement('div');row.className='talosProposalRow';
      var title=document.createElement('strong');title.textContent=step.businessStepName;row.appendChild(title);
      var detail=document.createElement('small');detail.textContent=step.direction+' · '+(step.basis==='CONFIRMED_SEMANTICS'?'From your confirmed process':step.family?'Proposed by Talos':'Business answer needed');row.appendChild(detail);
      var select=document.createElement('select');select.setAttribute('aria-label','Execution direction for '+step.businessStepName);
      [['','I am not sure yet'],['HUMAN_INTERACTION','A person or team'],['SYSTEM_OPERATION','A system or API'],['COMMUNICATION','Automatic notification'],['DATA_COLLECTION','Form or request intake'],['AI_TASK','An AI capability']].forEach(function(pair){var option=document.createElement('option');option.value=pair[0];option.textContent=pair[1];select.appendChild(option)});
      // Preserve families outside the short list without silently selecting a different one.
      if(step.family&&!Array.from(select.options).some(function(option){return option.value===step.family})){var option=document.createElement('option');option.value=step.family;option.textContent=step.direction;select.appendChild(option)}
      select.value=step.family||'';
      select.hidden=Boolean(step.family);
      var role=document.createElement('input');role.placeholder='Responsible person or team';role.setAttribute('aria-label','Responsible person or team for '+step.businessStepName);role.value=step.participantLabel||'';role.hidden=step.family!=='HUMAN_INTERACTION';
      // A confirmed responsibility is business truth. Changes belong in process review.
      select.disabled=step.basis==='CONFIRMED_SEMANTICS';if(select.disabled)role.readOnly=Boolean(step.participantLabel);
      select.onchange=function(){step.family=this.value||null;step.direction=this.options[this.selectedIndex].textContent;role.hidden=step.family!=='HUMAN_INTERACTION';step.participantLabel=role.hidden?null:role.value.trim()||null;detail.textContent=step.family==='HUMAN_INTERACTION'?'Explicitly chosen human work':step.family?'Proposed service · connection required before execution':'Talos will keep this activity unresolved.';updateReady()};
      role.oninput=function(){step.participantLabel=this.value.trim()||null;updateReady()};row.appendChild(select);row.appendChild(role);
      if(step.family&&step.basis!=='CONFIRMED_SEMANTICS'){var change=document.createElement('button');change.type='button';change.textContent='Change';change.className='secondary';change.onclick=function(){select.hidden=false;this.hidden=true};row.appendChild(change)}
      host.appendChild(row);
    });
    el('talosUseProposal').hidden=false;updateReady();
  }
  async function prepare(detail){
    if(!detail||!detail.revisionId||!detail.canonicalProcessRevisionId)return;
    var token=++epoch;active=detail;proposal=null;plan=null;approved=false;busy=true;
    install();el('talosUseProposal').hidden=true;el('talosApproveProposal').hidden=true;el('talosProposalRows').replaceChildren();
    state('Process confirmed','Preparing the automation proposal from your confirmed process…');
    window.talosTranslationWorkspace.selectTab('temporal');
    try{
      var response=await priorFetch('/api/product/automation-proposal?revisionId='+encodeURIComponent(detail.revisionId)+'&processRevisionId='+encodeURIComponent(detail.canonicalProcessRevisionId));
      var body=await response.json();if(token!==epoch)return;if(!response.ok)throw new Error(body.userMessage||'Talos could not refresh the confirmed process.');
      if(body.revisionId!==detail.revisionId||body.processRevisionRef!==detail.canonicalProcessRevisionId)throw new Error('The response belongs to another process revision.');
      var snapshot=body.snapshot;
      window.talosTranslationWorkspace.updateProcess({revision:snapshot.bpmnRevision,reconciliation:{processRevision:snapshot.processRevision},canvasRevision:snapshot.canvas&&snapshot.canvas.revision});
      window.talosTranslationWorkspace.preview(snapshot.processRevision);
      proposal=body;busy=false;
      if(snapshot.automationApproval){approved=true;state('Automation design already approved','Restoring the approved Temporal design…');window.talosBusinessAutomation.restoreApprovedDesign(snapshot.automationApproval);await window.talosTranslationWorkspace.recover(detail.revisionId);if(token!==epoch)return;if(!snapshot.temporalMapping)await window.talosBusinessAutomation.prepareTemporal();el('talosUseProposal').hidden=true;return}
      if(snapshot.executionPlanReview){var recoveredResponse=await priorFetch('/api/automation/execution-plan/recover?reviewId='+encodeURIComponent(snapshot.executionPlanReview.id)+'&processRevisionId='+encodeURIComponent(detail.canonicalProcessRevisionId));var recovered=await recoveredResponse.json();if(token!==epoch)return;if(!recoveredResponse.ok)throw new Error(recovered.userMessage||'Talos could not recover the accepted design.');proposal.steps=recovered.acceptedSteps;renderProposal();window.talosBusinessAutomation.restoreReviewedDesign(recovered);plan=recovered.executionReview;renderPlanState();return}
      renderProposal();state(ready()?'Automation proposal ready':'A business answer is needed',ready()?'Review the proposed directions. Talos will build the technical plan for you.':'Choose who or what performs the pending activities. You can leave uncertain items pending.');updateReady();
      window.dispatchEvent(new CustomEvent('talos:workspace-refreshed'));
    }catch(error){if(token!==epoch)return;busy=false;state('Preparation needs a retry',error instanceof Error?error.message:String(error),true)}
  }
  async function useProposal(){
    if(busy||!ready()||!active)return;var token=epoch;busy=true;state('Preparing your design','Talos is building the plan from the proposal you accepted…');
    try{
      var design=await window.talosAutomationDesign.open();if(token!==epoch)return;
      if(!design||design.blocked){busy=false;var blockers=design&&design.details&&design.details.freezeBlockers&&design.details.freezeBlockers.blockers||[];state('A business detail needs your answer',blockers.length?blockers[0].question||blockers[0].description:'Review the named pending business questions before preparing this design.');el('talosReviewProcessDetails').hidden=false;el('talosUseProposal').hidden=true;return}
      plan=await window.talosBusinessAutomation.applyProposal(proposal);if(token!==epoch)return;
      busy=false;if(!plan)throw new Error('Talos could not load the prepared plan. Retry preparation.');renderPlanState();
    }catch(error){if(token!==epoch)return;busy=false;state('Design needs attention',error instanceof Error?error.message:String(error),true)}
  }
  function renderPlanState(){
    el('talosUseProposal').hidden=true;el('talosApproveProposal').hidden=plan.review.state!=='READY_FOR_AUTOMATION_APPROVAL';
    el('talosProposalRows').querySelectorAll('select,input,button').forEach(function(node){node.disabled=true;node.hidden=true});
    Array.from(el('talosProposalRows').children).forEach(function(row,index){var step=proposal.steps[index];row.querySelector('small').textContent=step.direction+(step.participantLabel?' · '+step.participantLabel:'')});
    var host=el('talosExecutionQuestions');host.replaceChildren();var questions=plan.clarifications||[];
    el('talosApplyExecutionAnswers').hidden=!questions.some(function(q){return q.route==='EXECUTION_DESIGN'});el('talosReviewProcessDetails').hidden=plan.review.state==='READY_FOR_AUTOMATION_APPROVAL';
    questions.forEach(function(question){var row=document.createElement('div');row.className='talosProposalRow';var title=document.createElement('strong');title.textContent=question.title;row.appendChild(title);var prompt=document.createElement('small');prompt.textContent=question.question;row.appendChild(prompt);if(question.route==='EXECUTION_DESIGN'){var select=document.createElement('select');select.className='talosExecutionAnswer';select.dataset.question=question.id;select.setAttribute('aria-label',question.title);var empty=document.createElement('option');empty.value='';empty.textContent='Choose how this continues';select.appendChild(empty);question.choices.forEach(function(choice){var option=document.createElement('option');option.value=choice.value;option.textContent=choice.label;select.appendChild(option)});row.appendChild(select)}host.appendChild(row)});
    if(plan.review.state==='READY_FOR_AUTOMATION_APPROVAL')state('Your automation design is ready','Review the activities above. Approve the design to generate its Temporal artifacts. Connections, deployment and starting a process remain separate.');
    else state('One execution detail needs your answer',questions.length?'Answer the named questions below. Your confirmed activities and accepted choices are preserved.':'Talos needs a process detail before approval. Review the business process to continue.');
    if(!questions.length&&plan.review.state!=='READY_FOR_AUTOMATION_APPROVAL')el('talosReviewProcessDetails').hidden=false;
  }
  async function applyExecutionAnswers(){
    if(busy||!plan||plan.review.state==='READY_FOR_AUTOMATION_APPROVAL')return;
    var answers=Array.from(document.querySelectorAll('.talosExecutionAnswer')).map(function(node){return{questionId:node.dataset.question,choice:node.value}});
    if(!answers.length||answers.some(function(answer){return !answer.choice})){state('An answer is still needed','Choose an option for each pending execution question.');return}
    var token=epoch;busy=true;el('talosApplyExecutionAnswers').disabled=true;state('Updating your design','Talos is applying your coordination choices and checking the plan…');
    try{var resolved=await window.talosBusinessAutomation.resolveQuestions(answers);if(token!==epoch)return;plan=resolved;busy=false;renderPlanState()}
    catch(error){if(token!==epoch)return;busy=false;state('Could not apply these answers',error instanceof Error?error.message:String(error),true)}
    finally{if(token===epoch)el('talosApplyExecutionAnswers').disabled=false}
  }
  async function reviewProcessDetails(){
    if(!active)return;try{var response=await window.fetch('/api/process-review?revisionId='+encodeURIComponent(active.revisionId));var body=await response.json();if(!response.ok)throw new Error(body.userMessage||'Talos could not load the pending business questions.');window.talosGuidedProcessReview.show(body)}catch(error){state('Could not load business details',error instanceof Error?error.message:String(error),true)}
  }
  async function approve(){
    if(busy||!plan)return;var token=epoch;busy=true;state('Preparing Temporal artifacts','Recording your design approval and generating the Temporal representation…');
    try{await window.talosBusinessAutomation.approve();if(token!==epoch)return;busy=false;if(!approved)throw new Error('Talos could not record the design approval. Retry this step.');el('talosApproveProposal').hidden=true}
    catch(error){if(token!==epoch)return;busy=false;state('Temporal preparation needs a retry',error instanceof Error?error.message:String(error),true)}
  }
  window.addEventListener('talos:r1-04-business-process-confirmed',function(event){prepare(event.detail)});
  window.addEventListener('talos:r1-11c-semantic-resolution-applied',reset);
  window.addEventListener('talos:r1-06-automation-approved',function(){approved=true});
  window.addEventListener('talos:r1-11d-temporal-ready',function(){busy=false;state('Temporal design prepared','Your workflow is prepared. Talos is loading its export and implementation requirements.');el('talosApproveProposal').hidden=true;el('talosUseProposal').hidden=true});
  window.addEventListener('talos:temporal-preparation-failed',function(event){busy=false;state('Temporal preparation needs attention',event.detail.message,true)});
  window.addEventListener('talos:temporal-export-failed',function(event){busy=false;state('Temporal export needs a retry',event.detail.message,true)});
  window.addEventListener('talos:temporal-export-ready',function(event){if(!document.body.classList.contains('r113ImplementationChosen'))window.talosProductJourney.setStage('automate');busy=false;state('Temporal artifacts ready',event.detail.readiness.temporalExecutionReady?'The workflow can be exported. Implementation is optional.':'The workflow can be exported. Proposed services still need implementation before execution.');el('talosRetryProposal').hidden=true});
  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'',method=String((init&&init.method)||'GET').toUpperCase();
    if(method==='POST'&&(/\/api\/input\//.test(path)||path.indexOf('/api/bpmn/edit')>=0||path.indexOf('/api/semantic-resolution/decide')>=0))reset();
    return priorFetch(input,init);
  };
  window.addEventListener('talos:workspace-resumed',function(event){var body=event.detail;if(body.confirmation&&body.confirmation.status==='CONFIRMED')window.dispatchEvent(new CustomEvent('talos:r1-04-business-process-confirmed',{detail:{revisionId:body.bpmnRevision.id,canonicalProcessRevisionId:body.process.id,confirmationId:body.confirmation.confirmationId,confirmedProcess:{revision:body.bpmnRevision,reconciliation:{processRevision:body.process}}}}))});
  install();
})();
</script>`;

export function renderGuidedTranslationPage(basePage:string):string {
  return basePage.replace('</body>', `${GUIDED_TRANSLATION_EXTENSION}\n</body>`);
}
