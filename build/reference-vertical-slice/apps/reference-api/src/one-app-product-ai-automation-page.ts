export const ONE_APP_PRODUCT_AI_AUTOMATION_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var workspaceId='';
  var proposal=null;
  var readiness=null;
  var decision=null;
  var routing=null;
  var generating=false;
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
  function setPrimaryDesignCopy(){
    var design=byId('designCard');
    if(design){
      var intro=design.querySelector('p');
      if(intro)intro.textContent='Open the governed AI design handoff. Gemini proposes the automation from the confirmed process; Talos validates it; you review the proposal before any capability binding exists.';
    }
    var open=byId('openDesign');if(open)open.textContent='Open AI Automation Design';
  }
  function setDesignState(text,kind){
    var node=byId('designState');if(!node)return;
    node.textContent=text;node.className='pill '+(kind||'');
  }
  function collapseManualEditor(){
    var requirements=byId('requirements');if(requirements)requirements.style.display='none';
    var selections=byId('selectionActions');if(selections)selections.style.display='none';
    var advanced=byId('manualCapabilityToggle');if(advanced)advanced.textContent='Advanced · manual capability editor';
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
  function unresolvedAttempt(){
    if(!routing)return null;
    if(routing.fallback&&routing.fallback.proposal)return routing.fallback.proposal;
    if(routing.primary&&routing.primary.proposal)return routing.primary.proposal;
    return null;
  }
  function appendRetry(panel,label){
    if(!workspaceId)return;
    var retry=document.createElement('button');retry.type='button';retry.textContent=label||'Generate AI design';retry.style.marginTop='10px';
    retry.addEventListener('click',function(){generate(workspaceId)});panel.appendChild(retry);
  }
  function render(){
    setPrimaryDesignCopy();
    var panel=ensurePanel();if(!panel)return;panel.innerHTML='';
    var title=document.createElement('strong');title.textContent='Talos AI Automation Designer';panel.appendChild(title);
    var intro=document.createElement('small');intro.style.display='block';intro.style.marginTop='4px';
    intro.textContent='Gemini designs the proposal from the confirmed process. Talos validates it. You review it. No capability binding, deployment authority or execution authority is created automatically.';panel.appendChild(intro);

    if(generating){
      var loading=document.createElement('div');loading.id='aiAutomationState';loading.className='status';loading.textContent='Gemini is designing the automation proposal from the confirmed process…';panel.appendChild(loading);
      return;
    }

    if(!proposal){
      var state=document.createElement('div');state.id='aiAutomationState';state.className='status '+(routing?'warn':'');
      if(routing&&routing.decision==='UNRESOLVED_AFTER_FALLBACK'){
        state.textContent='AI design stopped safely because material design information is unresolved. Review the AI questions below or use the advanced editor only when you intentionally want manual control.';
      }else if(workspaceId){
        state.textContent='AI Automation Design is ready to generate a proposal.';
      }else{
        state.textContent='Confirm the business process, then open AI Automation Design. Talos will ask Gemini to propose the implementation automatically.';
      }
      panel.appendChild(state);
      var attempt=unresolvedAttempt();
      if(attempt){
        var questions=(attempt.unresolvedQuestions||[]).filter(function(q){return q.material});
        if(questions.length){
          var h=document.createElement('h3');h.textContent='AI needs business/design input';panel.appendChild(h);
          var list=document.createElement('div');list.className='list';questions.forEach(function(q){list.appendChild(listItem(q.question,q.reason,'question'))});panel.appendChild(list);
        }
      }
      appendRetry(panel,routing?'Redesign with Gemini':'Generate AI design');
      return;
    }

    var row=document.createElement('div');row.className='row';row.style.marginTop='10px';
    row.append(pill(proposal.state,'warn'),pill('DESIGN '+proposal.status,proposal.status==='COMPLETE'?'good':'warn'));
    if(routing)row.append(pill(routing.decision,routing.decision==='PRIMARY_ACCEPTED'||routing.decision==='FALLBACK_ACCEPTED'?'good':'warn'));
    if(readiness)row.append(pill(readiness.bindingReadiness,readiness.bindingReadiness==='READY_FOR_CAPABILITY_SELECTION'?'good':'warn'));
    panel.appendChild(row);

    var metrics=document.createElement('div');metrics.className='execution-summary';metrics.style.marginTop='10px';
    metrics.append(metric('Business work',(proposal.steps||[]).length),metric('Human',humanCount()),metric('System / integration',integrationCount()),metric('Durable waits',orchestrationCount('DURABLE_TIMER')+orchestrationCount('WORKFLOW_CONDITION')),metric('Branches',orchestrationCount('DETERMINISTIC_BRANCH')),metric('Subprocess candidates',orchestrationCount('CHILD_WORKFLOW_CANDIDATE')+orchestrationCount('INLINE_COORDINATION')));panel.appendChild(metrics);

    var attention=[];
    (proposal.unresolvedQuestions||[]).filter(function(q){return q.material}).forEach(function(q){attention.push({title:q.question,detail:q.reason,kind:'question'})});
    if(readiness)(readiness.gaps||[]).forEach(function(gap){
      var labels={PROPOSAL_ONLY_REFERENCE:'AI proposed an implementation that is not configured yet',OFFERING_NOT_AVAILABLE:'Referenced capability is not available',OFFERING_MISMATCH:'Configured capability does not match the proposal',HUMAN_DESIGN_INCOMPLETE:'Human participant design needs business input'};
      attention.push({title:labels[gap.reason]||gap.reason,detail:(gap.proposedFamily||'CAPABILITY')+' · '+(gap.proposedImplementationKind||'')+' · '+(gap.proposedImplementationRef||''),kind:'question'});
    });
    if(attention.length){
      var h=document.createElement('h3');h.textContent='Needs your attention';panel.appendChild(h);var list=document.createElement('div');list.className='list';attention.forEach(function(item){list.appendChild(listItem(item.title,item.detail,item.kind))});panel.appendChild(list);
    } else {
      var ready=document.createElement('div');ready.className='status good';ready.textContent='AI design coverage is complete. Review the proposal before accepting it.';panel.appendChild(ready);
    }

    var details=document.createElement('details');details.style.marginTop='10px';var summary=document.createElement('summary');summary.textContent='Review proposed automation';details.appendChild(summary);var steps=document.createElement('div');steps.className='list';steps.style.marginTop='8px';
    (proposal.steps||[]).forEach(function(step){steps.appendChild(listItem(step.canonicalName,step.proposedFamily+' · '+step.implementationKind+' · '+step.rationale,''))});
    (proposal.orchestration||[]).forEach(function(item){steps.appendChild(listItem(item.canonicalNodeKind+' orchestration',item.proposedTreatment+' · '+item.rationale,''))});details.appendChild(steps);panel.appendChild(details);

    var actions=document.createElement('div');actions.className='row';actions.style.marginTop='12px';
    var accept=document.createElement('button');accept.className='good';accept.textContent=decision&&decision.decision==='ACCEPT_DESIGN'?'Design accepted':'Accept AI automation design';accept.disabled=proposal.status!=='COMPLETE'||Boolean(decision)||!routing||!(routing.decision==='PRIMARY_ACCEPTED'||routing.decision==='FALLBACK_ACCEPTED');
    var reject=document.createElement('button');reject.textContent='Reject design';reject.disabled=Boolean(decision)||!routing||routing.decision==='UNRESOLVED_AFTER_FALLBACK';
    var regenerate=document.createElement('button');regenerate.textContent='Redesign with Gemini';regenerate.disabled=Boolean(decision&&decision.decision==='ACCEPT_DESIGN');
    actions.append(accept,reject,regenerate);panel.appendChild(actions);
    var state=document.createElement('div');state.id='aiAutomationState';state.className='status';
    state.textContent=decision?'AI design decision recorded. Capability binding remains a separate governed step.':'Review the AI proposal. No capability binding exists yet.';panel.appendChild(state);

    accept.addEventListener('click',function(){decide('ACCEPT_DESIGN')});
    reject.addEventListener('click',function(){decide('REJECT')});
    regenerate.addEventListener('click',function(){generate(workspaceId)});
  }
  function generate(id){
    if(!id||generating)return;
    workspaceId=id;proposal=null;readiness=null;decision=null;routing=null;generating=true;collapseManualEditor();setDesignState('AI DESIGNER RUNNING','warn');render();
    jsonPost('/api/automation/proposal/generate',{workspaceId:id}).then(function(body){
      routing=body&&body.routing?body.routing:null;
      proposal=routing&&routing.selectedProposal?routing.selectedProposal:unresolvedAttempt();
      readiness=routing&&routing.selectedProposal&&body&&body.readiness?body.readiness:null;
      generating=false;
      render();
      if(routing&&(routing.decision==='PRIMARY_ACCEPTED'||routing.decision==='FALLBACK_ACCEPTED')){
        setDesignState('AI PROPOSAL READY','good');
        var truth=byId('truthAutomation');if(truth)truth.textContent='AI automation proposal ready · no binding yet';
      }else{
        setDesignState('AI DESIGN NEEDS INPUT','warn');
        var unresolvedTruth=byId('truthAutomation');if(unresolvedTruth)unresolvedTruth.textContent='AI design safe-stop · no binding yet';
      }
    }).catch(function(error){
      generating=false;proposal=null;routing=null;render();
      var state=byId('aiAutomationState');if(state){state.textContent='Automation Designer unavailable: '+error.message;state.className='status bad'}
      setDesignState('AI DESIGNER UNAVAILABLE','bad');
    });
  }
  function decide(kind){
    if(!proposal||!workspaceId||!routing||!(routing.decision==='PRIMARY_ACCEPTED'||routing.decision==='FALLBACK_ACCEPTED'))return;
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
      if(kind==='ACCEPT_DESIGN'){
        if(readiness&&readiness.bindingReadiness==='READY_FOR_CAPABILITY_SELECTION')bind();
        else{
          var s=byId('aiAutomationState');if(s){s.textContent='AI design accepted. Some proposed implementations are not configured or still need business input. Binding remains closed; use Advanced only if you intentionally want to configure those missing capabilities manually.';s.className='status warn'}
          setDesignState('AI DESIGN ACCEPTED · BINDING OPEN ITEMS','warn');
        }
      }
    }).catch(function(error){var s=byId('aiAutomationState');if(s){s.textContent=error.message;s.className='status bad'}});
  }
  function bind(){
    jsonPost('/api/automation/proposal/bind',{workspaceId:workspaceId,proposalRef:proposal.id,proposalDigest:proposal.proposalDigest,decisionRef:decision.id}).then(function(){
      var s=byId('aiAutomationState');if(s){s.textContent='Capabilities explicitly selected from the accepted AI proposal. ExecutionPlan review is now available.';s.className='status good'}
      var truth=byId('truthAutomation');if(truth)truth.textContent='AI design accepted · capabilities explicitly bound · ExecutionPlan not approved';
      setDesignState('AI DESIGN ACCEPTED · CAPABILITIES BOUND','good');
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
      if(isOpen&&response.ok){
        response.clone().json().then(function(body){
          if(body&&body.automationDesignOpened&&body.automationDesign&&body.automationDesign.workspace){
            workspaceId=body.automationDesign.workspace.id;
            collapseManualEditor();
            setDesignState('AI DESIGNER STARTING','warn');
            var truth=byId('truthAutomation');if(truth)truth.textContent='AI automation design requested · no binding yet';
            setTimeout(function(){generate(workspaceId)},0);
          }
        }).catch(function(){})
      }
      return response;
    });
  };
  nativeFetch('/api/product/runtime-profile').then(function(response){return response.ok?response.json():null}).then(function(profile){if(profile&&profile.actorId)actorId=profile.actorId}).catch(function(){});
  setPrimaryDesignCopy();ensurePanel();collapseManualEditor();render();
})();
`;
