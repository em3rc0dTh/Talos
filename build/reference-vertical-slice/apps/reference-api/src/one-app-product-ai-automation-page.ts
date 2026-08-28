export const ONE_APP_PRODUCT_AI_AUTOMATION_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var workspaceId='';
  var proposal=null;
  var readiness=null;
  var decision=null;
  var actorId='one-app-product-user';

  function byId(id){return document.getElementById(id)}
  function authority(kind){return 'authority:talos-product:ai-automation:'+kind+':'+Date.now()}
  function actor(){return actorId}
  function jsonPost(path,body){
    return nativeFetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(async function(response){
      var payload={};try{payload=await response.json()}catch(_){}
      if(!response.ok)throw new Error(payload.error||('HTTP '+response.status));
      return payload;
    });
  }
  function ensurePanel(){
    var existing=byId('aiAutomationProposal');if(existing)return existing;
    var design=byId('designCard');var requirements=byId('requirements');if(!design||!requirements)return null;
    var panel=document.createElement('div');panel.id='aiAutomationProposal';panel.className='requirement';panel.style.marginTop='12px';
    requirements.insertAdjacentElement('beforebegin',panel);
    var advanced=document.createElement('button');advanced.id='manualCapabilityToggle';advanced.type='button';advanced.textContent='Advanced · manual capability editor';advanced.style.marginTop='10px';
    panel.insertAdjacentElement('afterend',advanced);
    requirements.style.display='none';
    var selections=byId('selectionActions');if(selections)selections.style.display='none';
    advanced.addEventListener('click',function(){
      var open=requirements.style.display!=='none';
      requirements.style.display=open?'none':'';
      if(selections)selections.style.display=open?'none':'';
      advanced.textContent=open?'Advanced · manual capability editor':'Hide manual capability editor';
    });
    return panel;
  }
  function pill(text,kind){var span=document.createElement('span');span.className='pill '+(kind||'');span.textContent=text;return span}
  function metric(label,value){var d=document.createElement('div');d.className='metric';var b=document.createElement('b');b.textContent=label;var s=document.createElement('span');s.textContent=String(value);d.append(b,s);return d}
  function listItem(title,detail,kind){var d=document.createElement('div');d.className='item '+(kind||'');var strong=document.createElement('strong');strong.textContent=title;var small=document.createElement('small');small.textContent=detail;d.append(strong,small);return d}
  function humanCount(){return proposal?(proposal.steps||[]).filter(function(step){return step.proposedFamily==='HUMAN_INTERACTION'}).length:0}
  function integrationCount(){return proposal?(proposal.steps||[]).filter(function(step){return step.proposedFamily!=='HUMAN_INTERACTION'}).length:0}
  function orchestrationCount(kind){return proposal?(proposal.orchestration||[]).filter(function(item){return item.proposedTreatment===kind}).length:0}
  function render(){
    var panel=ensurePanel();if(!panel)return;panel.innerHTML='';
    var title=document.createElement('strong');title.textContent='Talos AI Automation Designer';panel.appendChild(title);
    var intro=document.createElement('small');intro.style.display='block';intro.style.marginTop='4px';
    intro.textContent='Gemini proposes the implementation from the confirmed process. Talos validates the proposal. The proposal itself creates no binding, deployment authority or execution authority.';panel.appendChild(intro);
    if(!proposal){
      var state=document.createElement('div');state.className='status';state.textContent='Automation proposal has not been generated yet.';panel.appendChild(state);return;
    }
    var row=document.createElement('div');row.className='row';row.style.marginTop='10px';row.append(pill(proposal.state,'warn'),pill('DESIGN '+proposal.status,proposal.status==='COMPLETE'?'good':'warn'));
    if(readiness)row.append(pill(readiness.bindingReadiness,readiness.bindingReadiness==='READY_FOR_CAPABILITY_SELECTION'?'good':'warn'));panel.appendChild(row);
    var metrics=document.createElement('div');metrics.className='execution-summary';metrics.style.marginTop='10px';
    metrics.append(metric('Business work',(proposal.steps||[]).length),metric('Human',humanCount()),metric('System / integration',integrationCount()),metric('Durable waits',orchestrationCount('DURABLE_TIMER')+orchestrationCount('WORKFLOW_CONDITION')),metric('Branches',orchestrationCount('DETERMINISTIC_BRANCH')),metric('Subprocess candidates',orchestrationCount('CHILD_WORKFLOW_CANDIDATE')+orchestrationCount('INLINE_COORDINATION')));panel.appendChild(metrics);

    var attention=[];
    (proposal.unresolvedQuestions||[]).filter(function(q){return q.material}).forEach(function(q){attention.push({title:q.question,detail:q.reason,kind:'question'})});
    if(readiness)(readiness.gaps||[]).forEach(function(gap){
      var labels={PROPOSAL_ONLY_REFERENCE:'Capability proposed but not configured',OFFERING_NOT_AVAILABLE:'Referenced capability is not available',OFFERING_MISMATCH:'Configured capability does not match the proposal',HUMAN_DESIGN_INCOMPLETE:'Human participant design is incomplete'};
      attention.push({title:labels[gap.reason]||gap.reason,detail:(gap.proposedFamily||'CAPABILITY')+' · '+(gap.proposedImplementationKind||'')+' · '+(gap.proposedImplementationRef||''),kind:'question'});
    });
    if(attention.length){
      var h=document.createElement('h3');h.textContent='Needs your attention';panel.appendChild(h);var list=document.createElement('div');list.className='list';attention.forEach(function(item){list.appendChild(listItem(item.title,item.detail,item.kind))});panel.appendChild(list);
    } else {
      var ready=document.createElement('div');ready.className='status good';ready.textContent='Design coverage is complete and every proposed capability is backed by an available governed offering.';panel.appendChild(ready);
    }

    var details=document.createElement('details');details.style.marginTop='10px';var summary=document.createElement('summary');summary.textContent='Review proposed implementation steps';details.appendChild(summary);var steps=document.createElement('div');steps.className='list';steps.style.marginTop='8px';
    (proposal.steps||[]).forEach(function(step){steps.appendChild(listItem(step.canonicalName,step.proposedFamily+' · '+step.implementationKind+' · '+step.rationale,''))});
    (proposal.orchestration||[]).forEach(function(item){steps.appendChild(listItem(item.canonicalNodeKind+' orchestration',item.proposedTreatment+' · '+item.rationale,''))});details.appendChild(steps);panel.appendChild(details);

    var actions=document.createElement('div');actions.className='row';actions.style.marginTop='12px';
    var accept=document.createElement('button');accept.className='good';accept.textContent=decision&&decision.decision==='ACCEPT_DESIGN'?'Design accepted':'Accept automation design';accept.disabled=proposal.status!=='COMPLETE'||Boolean(decision);
    var reject=document.createElement('button');reject.textContent='Reject design';reject.disabled=Boolean(decision);
    var regenerate=document.createElement('button');regenerate.textContent='Regenerate proposal';regenerate.disabled=Boolean(decision&&decision.decision==='ACCEPT_DESIGN');
    actions.append(accept,reject,regenerate);panel.appendChild(actions);
    var state=document.createElement('div');state.id='aiAutomationState';state.className='status';state.textContent=decision?'Design decision recorded. Capability binding remains a separate governed step.':'Review the proposal. No capability binding exists yet.';panel.appendChild(state);

    accept.addEventListener('click',function(){decide('ACCEPT_DESIGN')});
    reject.addEventListener('click',function(){decide('REJECT')});
    regenerate.addEventListener('click',function(){generate(workspaceId)});
  }
  function generate(id){
    if(!id)return;workspaceId=id;proposal=null;readiness=null;decision=null;render();
    var state=byId('aiAutomationState');if(state)state.textContent='Talos is designing the automation proposal…';
    jsonPost('/api/automation/proposal/generate',{workspaceId:id}).then(function(body){
      proposal=body&&body.routing?body.routing.selectedProposal:null;readiness=body&&body.readiness?body.readiness:null;
      render();
      if(!proposal){var s=byId('aiAutomationState');if(s){s.textContent='Talos could not produce a complete governed proposal. Review diagnostics or use the advanced editor.';s.className='status warn'}}
    }).catch(function(error){var panel=ensurePanel();if(panel){panel.innerHTML='';panel.appendChild(listItem('Automation Designer unavailable',error.message,'finding'))}});
  }
  function decide(kind){
    if(!proposal||!workspaceId)return;
    jsonPost('/api/automation/proposal/decide',{
      workspaceId:workspaceId,
      proposalRef:proposal.id,
      proposalDigest:proposal.proposalDigest,
      decision:kind,
      decidedBy:actor(),
      authorityRef:authority('proposal-'+kind.toLowerCase()),
      rationale:kind==='ACCEPT_DESIGN'?'I reviewed and accept this exact AI automation design. Capability selection remains separately governed.':'I reject this automation design proposal.'
    }).then(function(body){
      decision=body.decision;readiness=body.readiness||readiness;render();
      if(kind==='ACCEPT_DESIGN'&&readiness&&readiness.bindingReadiness==='READY_FOR_CAPABILITY_SELECTION')bind();
    }).catch(function(error){var s=byId('aiAutomationState');if(s){s.textContent=error.message;s.className='status bad'}});
  }
  function bind(){
    jsonPost('/api/automation/proposal/bind',{workspaceId:workspaceId,proposalRef:proposal.id,proposalDigest:proposal.proposalDigest,decisionRef:decision.id}).then(function(){
      var s=byId('aiAutomationState');if(s){s.textContent='Capabilities explicitly selected from the accepted proposal. ExecutionPlan review is now available.';s.className='status good'}
      var truth=byId('truthAutomation');if(truth)truth.textContent='AI design accepted · capabilities explicitly bound · ExecutionPlan not approved';
      var designState=byId('designState');if(designState){designState.textContent='AI DESIGN ACCEPTED · CAPABILITIES BOUND';designState.className='pill good'}
      var build=byId('buildPlan');if(build)build.disabled=false;
      var plan=byId('planCard');if(plan)plan.classList.remove('closed');
      var step=byId('pdesign');if(step)step.className='pstep done';
    }).catch(function(error){var s=byId('aiAutomationState');if(s){s.textContent=error.message;s.className='status warn'}});
  }

  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';
    var method=String((init&&init.method)||'GET').toUpperCase();
    var isOpen=path.indexOf('/api/bpmn/automation-design-approval')!==-1&&method==='POST';
    return nativeFetch(input,init).then(function(response){
      if(isOpen&&response.ok){response.clone().json().then(function(body){if(body&&body.automationDesignOpened&&body.automationDesign&&body.automationDesign.workspace){setTimeout(function(){generate(body.automationDesign.workspace.id)},0)}}).catch(function(){})}
      return response;
    });
  };
  nativeFetch('/api/product/runtime-profile').then(function(response){return response.ok?response.json():null}).then(function(profile){if(profile&&profile.actorId)actorId=profile.actorId}).catch(function(){});
  ensurePanel();render();
})();
`;
