export const R1_05_AUTOMATION_DESIGN_EXTENSION = String.raw`
<style>
  .r105Design{margin-top:14px;border:1px solid #33465d;border-radius:14px;padding:14px;background:linear-gradient(180deg,#101923,#091019)}
  .r105Design h3{margin:0 0 5px;font-size:13px}.r105Design p{margin:0;color:#98a8bb;font-size:11px;line-height:1.5}
  .r105Boundary{margin-top:10px;padding:9px 10px;border:1px dashed #50627a;border-radius:9px;color:#c7d7e8;font-size:11px;line-height:1.45}
  .r105Boundary strong{color:#66e4bd}.r105Actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:10px}
  .r105State{font-size:11px;color:#ffca6b}.r105State.good{color:#66e4bd}.r105State.bad{color:#ff7f8e}.r105State.blocked{color:#ffca6b}
  .r105Workspace{display:grid;gap:10px;margin-top:12px}.r105Meta{display:flex;gap:8px;flex-wrap:wrap}.r105Pill{border:1px solid #2a3b50;border-radius:999px;padding:4px 8px;color:#b9c9dc;font-size:10px}
  .r105Requirement{border:1px solid #263548;border-radius:11px;padding:10px;background:#070c12}.r105RequirementHead{display:flex;justify-content:space-between;gap:8px;align-items:center}.r105RequirementTitle{font-size:11px;color:#d9e5f2}.r105RequirementState{font-size:9px;color:#93a4b8}
  .r105Suggestions{display:grid;gap:7px;margin-top:8px}.r105Suggestion{border:1px solid #203146;border-radius:9px;padding:8px;background:#0a1119}.r105Suggestion strong{font-size:11px;color:#dfeaf6}.r105Suggestion small{display:block;margin-top:3px;color:#8193a8}
  .r105DecisionButtons{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.r105DecisionButtons button{font-size:10px;padding:6px 8px}.r105DecisionButtons button:disabled{opacity:.45}
</style>
<script>
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var confirmation=null;
  var bundle=null;
  var opening=false;

  function byId(id){return document.getElementById(id)}
  function authority(kind){return 'authority:talos-product:r1-05-'+kind+':'+Date.now()}
  function setState(message,kind){var node=byId('r105State');if(!node)return;node.textContent=message;node.className='r105State'+(kind?' '+kind:'')}
  function clearNode(node){while(node&&node.firstChild)node.removeChild(node.firstChild)}
  function publishInvalidated(reason){window.dispatchEvent(new CustomEvent('talos:r1-05-automation-design-invalidated',{detail:{reason:reason||'Automation Design context invalidated.'}}))}
  function reset(message){confirmation=null;bundle=null;opening=false;var host=byId('r105Workspace');clearNode(host);var open=byId('r105Open');if(open)open.disabled=true;setState(message||'Business-process confirmation required before automation design.','blocked');publishInvalidated(message)}
  function label(value){return value==null?'—':String(value).replaceAll('_',' ')}
  function pill(text){var node=document.createElement('span');node.className='r105Pill';node.textContent=text;return node}

  function publishWorkspace(next){
    var workspace=next&&next.workspace;if(!workspace||!workspace.id)return;
    window.dispatchEvent(new CustomEvent('talos:r1-05-automation-design-updated',{detail:{
      workspaceId:workspace.id,
      workspaceRevisionNumber:workspace.revisionNumber,
      workspaceState:workspace.state,
      processRevisionRef:workspace.processRevisionRef,
      capabilityDesignRevisionRef:workspace.capabilityDesignRevisionRef,
      requirements:Array.isArray(workspace.requirements)?workspace.requirements:[],
      suggestions:Array.isArray(next.suggestions)?next.suggestions:[],
      decisions:Array.isArray(next.decisions)?next.decisions:[]
    }}));
  }

  function renderWorkspace(next){
    bundle=next;
    var host=byId('r105Workspace');if(!host)return;clearNode(host);
    var workspace=next&&next.workspace;if(!workspace){setState('Automation Design Workspace response is missing its workspace contract.','bad');return}
    var meta=document.createElement('div');meta.className='r105Meta';
    meta.appendChild(pill('Workspace rev '+workspace.revisionNumber));
    meta.appendChild(pill(label(workspace.state)));
    meta.appendChild(pill('Binding: NO'));
    meta.appendChild(pill('Capability selection: NO'));
    meta.appendChild(pill('ExecutionPlan authority: NO'));
    host.appendChild(meta);

    var suggestions=Array.isArray(next.suggestions)?next.suggestions:[];
    (workspace.requirements||[]).forEach(function(requirement){
      var card=document.createElement('section');card.className='r105Requirement';
      var head=document.createElement('div');head.className='r105RequirementHead';
      var title=document.createElement('strong');title.className='r105RequirementTitle';title.textContent=label(requirement.family)+' · '+label(requirement.operationIntent);
      var state=document.createElement('span');state.className='r105RequirementState';state.textContent=label(requirement.designState);
      head.appendChild(title);head.appendChild(state);card.appendChild(head);
      var list=document.createElement('div');list.className='r105Suggestions';
      suggestions.filter(function(item){return item.capabilityRequirementRef===requirement.capabilityRequirementRef}).forEach(function(suggestion){
        var item=document.createElement('div');item.className='r105Suggestion';
        var name=document.createElement('strong');name.textContent=suggestion.canonicalName||'Integration direction';item.appendChild(name);
        var detail=document.createElement('small');detail.textContent=label(suggestion.implementationKind)+' · proposal only · creates binding: NO';item.appendChild(detail);
        var actions=document.createElement('div');actions.className='r105DecisionButtons';
        ['ACCEPT','REJECT','DEFER'].forEach(function(decision){var button=document.createElement('button');button.type='button';button.textContent=decision;button.disabled=requirement.designState==='DECISION_RECORDED';button.addEventListener('click',function(){decide(requirement,suggestion,decision)});actions.appendChild(button)});
        var replace=document.createElement('button');replace.type='button';replace.textContent='REPLACE';replace.disabled=requirement.designState==='DECISION_RECORDED';replace.addEventListener('click',function(){decide(requirement,suggestion,'REPLACE')});actions.appendChild(replace);
        item.appendChild(actions);list.appendChild(item);
      });
      if(!list.childNodes.length){var none=document.createElement('small');none.textContent='No implementation suggestion available; capability remains unresolved.';list.appendChild(none)}
      card.appendChild(list);host.appendChild(card);
    });
    var kind=workspace.state==='READY_FOR_EXPLICIT_SELECTION'?'good':'blocked';
    setState(label(workspace.state)+' · no capability binding, ExecutionPlan, deployment or execution authority created.',kind);
    publishWorkspace(next);
  }

  async function openDesign(){
    if(!confirmation||opening)return;opening=true;var button=byId('r105Open');if(button)button.disabled=true;
    setState('Freezing the exact confirmed semantic baseline for Automation Design only…','');
    try{
      var response=await nativeFetch('/api/bpmn/automation-design-approval',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revisionId:confirmation.revisionId,confirmationId:confirmation.confirmationId,approvedBy:'one-app-product-user',authorityRef:authority('automation-design-handoff')})});
      var raw=await response.text();var body=raw?JSON.parse(raw):{};
      if(!response.ok)throw new Error(body.error||body.code||('HTTP '+response.status));
      if(!body.automationDesignOpened||!body.automationDesign){setState(body.userMessage||'Talos needs a few process details before it can prepare the automation.','blocked');window.dispatchEvent(new CustomEvent('talos:r1-11c-freeze-blocked',{detail:body}));return;}
      if(body.capabilitySelectionCreated!==false||body.deploymentAuthorized!==false||body.executionAuthorized!==false)throw new Error('R1-05 authority boundary violation.');
      renderWorkspace(body.automationDesign);
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad');if(button)button.disabled=false}
    finally{opening=false}
  }

  async function decide(requirement,suggestion,decision){
    if(!bundle||!bundle.workspace)return;
    var payload={workspaceId:bundle.workspace.id,suggestionRef:suggestion.id,capabilityRequirementRef:requirement.capabilityRequirementRef,decision:decision,decidedBy:'one-app-product-user',authorityRef:authority('suggestion-decision'),rationale:'Explicit R1-05 product decision. This records a design direction only and creates no capability binding.'};
    if(decision==='REPLACE')payload.replacement={canonicalName:'Explicit replacement direction',implementationKind:'DIRECT_API',implementationRef:'user-defined:replacement'};
    setState('Recording append-only Automation Design decision…','');
    try{
      var response=await nativeFetch('/api/automation/suggestion/decide',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      var raw=await response.text();var body=raw?JSON.parse(raw):{};
      if(!response.ok)throw new Error(body.error||body.code||('HTTP '+response.status));
      if(body.capabilitySelectionCreated!==false||body.executionPlanAuthorized!==false)throw new Error('R1-05 suggestion decision crossed a downstream authority boundary.');
      renderWorkspace(body);
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  function install(){
    var review=byId('review');if(!review||byId('r105AutomationDesign'))return;
    var box=document.createElement('section');box.id='r105AutomationDesign';box.className='r105Design';
    box.innerHTML='<h3>Automation Design Workspace</h3><p>Explore how the confirmed business process could be automated. Suggestions are design directions, not capability bindings.</p><div class="r105Boundary"><strong>Authority boundary:</strong> opening this workspace freezes the exact confirmed semantic baseline for design only. Capability selection, ExecutionPlan review, automation approval, deployment and execution remain separate explicit gates.</div><div class="r105Actions"><button id="r105Open" disabled>Open automation design</button><span id="r105State" class="r105State blocked">Business-process confirmation required before automation design.</span></div><div id="r105Workspace" class="r105Workspace"></div>';
    review.appendChild(box);byId('r105Open').addEventListener('click',openDesign);
  }

  install();
  window.addEventListener('talos:r1-04-business-process-confirmed',function(event){
    var detail=event&&event.detail;if(!detail||!detail.revisionId||!detail.confirmationId)return;
    confirmation={revisionId:detail.revisionId,canonicalProcessRevisionId:detail.canonicalProcessRevisionId,confirmationId:detail.confirmationId};
    bundle=null;var host=byId('r105Workspace');clearNode(host);var open=byId('r105Open');if(open)open.disabled=false;
    setState('CONFIRMED BASELINE READY · explicit Automation Design handoff is available.','good');
  });

  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';var method=String((init&&init.method)||'GET').toUpperCase();
    var semanticResolution=path.indexOf('/api/semantic-resolution/decide')!==-1;var invalidates=method==='POST'&&(path.indexOf('/api/input/image')!==-1||path.indexOf('/api/input/bpmn')!==-1||path.indexOf('/api/bpmn/edit')!==-1||semanticResolution);
    return nativeFetch(input,init).then(function(response){if(invalidates&&response.ok)reset(semanticResolution?'Clarifications updated the process · review and confirm it again.':'Process changed · review and confirm it again.');return response});
  };
})();
</script>`;

export function renderR105AutomationDesignPage(basePage: string): string {
  const marker = '</body>';
  if (!basePage.includes(marker)) throw new TypeError('R1-05 product page requires a closing body tag');
  return basePage.replace(marker, `${R1_05_AUTOMATION_DESIGN_EXTENSION}\n${marker}`);
}
