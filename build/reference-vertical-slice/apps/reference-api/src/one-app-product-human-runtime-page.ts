export const ONE_APP_PRODUCT_HUMAN_RUNTIME_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var approvedStart=null;
  var activeExecutionId=null;
  var terminal=false;
  var pollTimer=null;

  function el(id){return document.getElementById(id)}
  function delay(ms){return new Promise(function(resolve){setTimeout(resolve,ms)})}
  function randomId(){return window.crypto&&crypto.randomUUID?crypto.randomUUID():'human-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
  function jsonBody(init){if(!init||typeof init.body!=='string')return null;try{return JSON.parse(init.body)}catch(_){return null}}
  function pathOf(input){try{return new URL(typeof input==='string'?input:input.url,window.location.href).pathname}catch(_){return ''}}
  async function responseJson(response){try{return await response.clone().json()}catch(_){return null}}
  function setExecution(message,kind){var node=el('executionState');if(!node)return;node.textContent=message;node.className='status '+(kind||'')}
  function setEvidence(value){var node=el('executionEvidence');if(node)node.textContent=typeof value==='string'?value:JSON.stringify(value,null,2)}
  function humanBox(){var existing=el('humanRuntimeTask');if(existing)return existing;var card=el('executeCard');if(!card)return null;var box=document.createElement('div');box.id='humanRuntimeTask';box.className='requirement hidden';var evidence=el('executionEvidence');var heading=evidence&&evidence.previousElementSibling;if(heading)card.insertBefore(box,heading);else card.appendChild(box);return box}

  window.fetch=async function(input,init){
    var path=pathOf(input);
    var request=jsonBody(init);
    var response=await nativeFetch(input,init);
    if(path==='/api/automation/execution/approve'&&response.ok){
      var body=await responseJson(response);
      if(body&&body.workflowExecutionApproval&&request){
        approvedStart={approval:body.workflowExecutionApproval,request:request};
      }
    }
    return response;
  };

  async function getRuntimeProfile(){
    try{
      var response=await nativeFetch('/api/product/runtime-profile');
      if(!response.ok)return;
      var profile=await response.json();
      if(profile.humanRuntimeAvailable){
        var limit=el('runtimeLimit');
        if(limit){limit.textContent='Human runtime enabled · UPDATE/SIGNAL outcomes are validated against the frozen approved design.';limit.className='status good'}
      }
    }catch(_){/* base page owns runtime errors */}
  }

  function renderHumanTask(executionId,state){
    var box=humanBox();if(!box)return;
    var task=state&&state.pendingHumanTask;
    if(!task){
      box.className='requirement';
      box.innerHTML='<strong>Workflow running</strong><small>Current element: '+String((state&&state.currentElementRef)||'Temporal coordination')+'. Talos is waiting for the next durable runtime transition.</small>';
      return;
    }
    box.className='requirement';box.innerHTML='';
    var title=document.createElement('strong');title.textContent='Human task · '+task.executionElementRef;
    var meta=document.createElement('small');meta.textContent='Required role(s): '+(task.participantRoleRefs||[]).join(', ')+' · approved channel: '+task.messageKind;
    var note=document.createElement('p');note.textContent='Choose the business outcome you actually authorize. Talos cannot invent or add outcomes here.';
    var actions=document.createElement('div');actions.className='row';
    (task.outcomes||[]).forEach(function(outcome){
      var button=document.createElement('button');button.className='good';button.textContent=outcome.outcomeCode+' · '+outcome.businessMeaning;
      button.onclick=async function(){
        Array.from(actions.querySelectorAll('button')).forEach(function(b){b.disabled=true});
        try{
          var response=await nativeFetch('/api/product/execution/human-outcome',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({executionId:executionId,submissionId:randomId(),executionElementRef:task.executionElementRef,outcomeCode:outcome.outcomeCode,rationale:'I explicitly submit this allowed human outcome for the active Talos workflow task.'})});
          var body=await response.json();
          if(!response.ok)throw new Error(body.error||('HTTP '+response.status));
          title.textContent='Human outcome accepted · '+body.receipt.outcomeCode;
          meta.textContent='Temporal accepted submission '+body.receipt.submissionId+'. Workflow is resuming deterministically.';
          actions.innerHTML='';
          setExecution('Human outcome accepted. Temporal is resuming the approved workflow…','good');
        }catch(error){
          setExecution(error instanceof Error?error.message:String(error),'bad');
          Array.from(actions.querySelectorAll('button')).forEach(function(b){b.disabled=false});
        }
      };
      actions.appendChild(button);
    });
    box.append(title,meta,note,actions);
  }

  async function poll(executionId){
    if(pollTimer)clearTimeout(pollTimer);
    if(terminal||activeExecutionId!==executionId)return;
    try{
      var response=await nativeFetch('/api/product/execution/state?executionId='+encodeURIComponent(executionId));
      var body=await response.json();
      if(response.ok&&body.runtimeState){
        renderHumanTask(executionId,body.runtimeState);
        if(body.runtimeState.status==='RUNNING')setExecution(body.runtimeState.pendingHumanTask?'Workflow is waiting for your explicit human outcome.':'Workflow is RUNNING in Temporal.','warn');
      }
    }catch(_){/* Workflow may not be queryable during the first task activation; retry. */}
    if(!terminal&&activeExecutionId===executionId)pollTimer=setTimeout(function(){poll(executionId)},400);
  }

  async function startApprovedExecution(){
    if(!approvedStart){setExecution('Approve the exact workflow start first.','bad');return}
    var approval=approvedStart.approval;
    var request=approvedStart.request;
    var executionId=approval.executionId;
    activeExecutionId=executionId;terminal=false;
    var button=el('startExecution');if(button)button.disabled=true;
    setExecution('Starting the exact approved Temporal Workflow…','');
    var startPayload={
      workflowExecutionApprovalId:approval.id,
      deploymentRevisionId:approval.deploymentRevisionRef,
      executionId:executionId,
      facts:request.facts||{},
      capabilityInputs:request.capabilityInputs||{}
    };
    poll(executionId);
    try{
      var response=await nativeFetch('/api/automation/execution/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(startPayload)});
      var body=await response.json();
      if(!response.ok)throw new Error(body.error||('HTTP '+response.status));
      terminal=true;if(pollTimer)clearTimeout(pollTimer);
      var observation=body.workflowExecutionObservation;
      var box=humanBox();if(box){box.className='requirement';box.innerHTML='<strong>Workflow terminal</strong><small>The human/runtime coordination is closed and immutable terminal evidence is persisted.</small>'}
      if(observation){
        var truth=el('truthExecution');if(truth)truth.textContent=observation.executionStatus+' · '+observation.workflowIdRef;
        var step=el('pexecute');if(step)step.className='pstep done';
        setExecution('Temporal Workflow '+observation.executionStatus.toLowerCase()+' with durable execution evidence.','good');
        setEvidence(observation);
      }else{
        setExecution('Workflow returned without a terminal observation.','bad');setEvidence(body);
      }
    }catch(error){
      terminal=true;if(pollTimer)clearTimeout(pollTimer);
      setExecution(error instanceof Error?error.message:String(error),'bad');
      if(button)button.disabled=false;
    }
  }

  function install(){
    getRuntimeProfile();
    humanBox();
    var start=el('startExecution');
    if(start){
      start.addEventListener('click',function(event){event.preventDefault();event.stopImmediatePropagation();startApprovedExecution()},true);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
`;
