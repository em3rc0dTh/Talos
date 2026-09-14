export const R1_06_EXECUTION_PLAN_EXTENSION = String.raw`
<style>
  .r106Panel{margin-top:14px;border:1px solid #3b536e;border-radius:14px;padding:14px;background:linear-gradient(180deg,#101a25,#080f17)}
  .r106Panel h3{margin:0 0 5px;font-size:13px}.r106Panel>p{margin:0;color:#98a9bc;font-size:11px;line-height:1.5}
  .r106Boundary{margin-top:10px;padding:9px 10px;border:1px dashed #556b84;border-radius:9px;color:#c8d8e8;font-size:11px;line-height:1.45}
  .r106Boundary strong{color:#66e4bd}.r106State{margin-top:9px;font-size:11px;color:#ffca6b}.r106State.good{color:#66e4bd}.r106State.bad{color:#ff7f8e}.r106State.blocked{color:#ffca6b}
  .r106Grid{display:grid;gap:9px;margin-top:11px}.r106Card{border:1px solid #27384b;border-radius:11px;padding:10px;background:#070d14}
  .r106Card h4{margin:0 0 7px;font-size:11px;color:#dce8f4}.r106Meta{display:flex;gap:7px;flex-wrap:wrap}.r106Pill{border:1px solid #2d4157;border-radius:999px;padding:4px 8px;font-size:9px;color:#afc2d8}
  .r106Fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:7px;margin-top:8px}.r106Fields label{display:grid;gap:4px;font-size:9px;color:#8195ab}.r106Fields input,.r106Fields select,.r106Fields textarea{width:100%;box-sizing:border-box;background:#0b131d;color:#dce7f2;border:1px solid #2d4055;border-radius:7px;padding:7px;font-size:10px}.r106Fields textarea{min-height:58px;resize:vertical}
  .r106Actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.r106Actions button{font-size:10px;padding:7px 9px}.r106Actions button:disabled{opacity:.45}
  .r106Plan{display:grid;gap:7px;margin-top:9px}.r106Step{border-left:2px solid #31506d;padding:6px 8px;background:#09121b;border-radius:0 8px 8px 0}.r106Step strong{font-size:10px;color:#d7e6f5}.r106Step small{display:block;color:#7f93a9;margin-top:3px;line-height:1.4}
  .r106Policy{margin-top:8px;padding:8px;border:1px solid #4b3f28;border-radius:8px;background:#151207;color:#d9c58f;font-size:10px;line-height:1.5}.r106Policy code{color:#ffe0a1}
  .r106Approval{margin-top:9px;padding:9px;border:1px solid #285743;border-radius:9px;background:#081710;color:#9fdbbf;font-size:10px;line-height:1.5}
</style>
<script>
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var design=null;
  var selection=null;
  var planReview=null;
  var approval=null;

  var FAMILIES=['HUMAN_INTERACTION','DATA_COLLECTION','COMMUNICATION','SYSTEM_OPERATION','DOCUMENT_FILE','STORAGE','EXTERNAL_WORKFLOW_INVOCATION','AI_TASK','CUSTOM_INTEGRATION'];
  var IMPLEMENTATIONS=['DIRECT_API','INTERNAL_SERVICE','MCP_TOOL','N8N_WORKFLOW','HUMAN_SERVICE','AI_SERVICE','DATABASE_ADAPTER','WEBHOOK_ENDPOINT'];

  function byId(id){return document.getElementById(id)}
  function safe(value){return value==null?'—':String(value)}
  function label(value){return safe(value).replaceAll('_',' ')}
  function authority(kind){return 'authority:talos-product:r1-06-'+kind+':'+Date.now()}
  function clear(node){while(node&&node.firstChild)node.removeChild(node.firstChild)}
  function setState(message,kind){var node=byId('r106State');if(!node)return;node.textContent=message;node.className='r106State'+(kind?' '+kind:'')}
  function pill(text){var node=document.createElement('span');node.className='r106Pill';node.textContent=text;return node}
  function option(value,selected){var node=document.createElement('option');node.value=value;node.textContent=label(value);node.selected=selected;return node}
  function field(labelText,input){var wrap=document.createElement('label');wrap.textContent=labelText;wrap.appendChild(input);return wrap}
  function input(type,value){var node=document.createElement('input');node.type=type||'text';node.value=value||'';return node}

  function reset(reason){
    design=null;selection=null;planReview=null;approval=null;
    clear(byId('r106Selection'));clear(byId('r106Plan'));clear(byId('r106Approval'));
    var commit=byId('r106CommitSelection'),review=byId('r106ReviewPlan'),approve=byId('r106Approve');
    if(commit)commit.disabled=true;if(review)review.disabled=true;if(approve)approve.disabled=true;
    setState(reason||'Automation Design Workspace required before ExecutionPlan review.','blocked');
    window.dispatchEvent(new CustomEvent('talos:r1-06-automation-approval-invalidated',{detail:{reason:reason||'R1-06 context invalidated.'}}));
  }

  function eligibleDecision(requirementRef){
    if(!design)return null;
    return (design.decisions||[]).find(function(item){return item.capabilityRequirementRef===requirementRef&&(item.decision==='ACCEPT'||item.decision==='REPLACE')})||null;
  }

  function renderSelectionEditor(){
    var host=byId('r106Selection');if(!host||!design)return;clear(host);
    (design.requirements||[]).forEach(function(requirement,index){
      var ref=requirement.capabilityRequirementRef;
      var accepted=eligibleDecision(ref);
      var card=document.createElement('section');card.className='r106Card';card.dataset.requirementRef=ref;
      var title=document.createElement('h4');title.textContent=(index+1)+'. '+label(requirement.family)+' · '+label(requirement.operationIntent);card.appendChild(title);
      var meta=document.createElement('div');meta.className='r106Meta';meta.appendChild(pill('Requirement '+safe(ref)));meta.appendChild(pill('Design '+label(requirement.designState)));card.appendChild(meta);
      var fields=document.createElement('div');fields.className='r106Fields';
      var source=document.createElement('select');source.className='r106Source';source.appendChild(option('EXPLICIT_OFFERING',!accepted));if(accepted)source.appendChild(option('SUGGESTION_DECISION',true));fields.appendChild(field('Selection authority path',source));
      if(accepted){
        var direction=input('text',accepted.decision+' · '+safe(accepted.suggestionRef));direction.readOnly=true;direction.className='r106SuggestionDecision';direction.dataset.decisionRef=accepted.id;fields.appendChild(field('Accepted/replaced design direction',direction));
      }
      var family=document.createElement('select');family.className='r106Family';var defaultFamily=requirement.family==='SOURCE_DEFINED'?'SYSTEM_OPERATION':requirement.family;FAMILIES.forEach(function(item){family.appendChild(option(item,item===defaultFamily))});fields.appendChild(field('Capability family',family));
      var name=input('text','Explicit '+label(defaultFamily)+' capability');name.className='r106OfferingName';fields.appendChild(field('Offering name',name));
      var implementation=document.createElement('select');implementation.className='r106ImplementationKind';IMPLEMENTATIONS.forEach(function(item){implementation.appendChild(option(item,item===(defaultFamily==='HUMAN_INTERACTION'?'HUMAN_SERVICE':'INTERNAL_SERVICE')))});fields.appendChild(field('Implementation kind',implementation));
      var implementationRef=input('text','user-defined:'+String(index+1));implementationRef.className='r106ImplementationRef';fields.appendChild(field('Implementation reference',implementationRef));
      var rationale=document.createElement('textarea');rationale.className='r106Rationale';rationale.value='Explicit R1-06 capability selection after reviewing Automation Design. No provider is inferred from business labels.';fields.appendChild(field('Selection rationale',rationale));
      var humanRole=input('text','role:explicit-reviewer');humanRole.className='r106HumanRole';fields.appendChild(field('Human role ref (human only)',humanRole));
      var humanOutcome=input('text','COMPLETED');humanOutcome.className='r106HumanOutcome';fields.appendChild(field('Human terminal outcome (human only)',humanOutcome));
      card.appendChild(fields);host.appendChild(card);
    });
    var commit=byId('r106CommitSelection');if(commit)commit.disabled=!design.requirements||!design.requirements.length;
  }

  function buildSelections(){
    if(!design)throw new Error('Automation Design Workspace is not active.');
    return Array.from(byId('r106Selection').querySelectorAll('.r106Card')).map(function(card){
      var requirementRef=card.dataset.requirementRef;
      var source=card.querySelector('.r106Source').value;
      var rationale=card.querySelector('.r106Rationale').value.trim();
      if(!rationale)throw new Error('Every capability selection requires an explicit rationale.');
      if(source==='SUGGESTION_DECISION'){
        var decision=card.querySelector('.r106SuggestionDecision');
        if(!decision||!decision.dataset.decisionRef)throw new Error('Selected suggestion direction is missing its append-only decision reference.');
        return{source:'SUGGESTION_DECISION',requirementRef:requirementRef,suggestionDecisionRef:decision.dataset.decisionRef,decidedBy:'one-app-product-user',authorityRef:authority('capability-selection'),rationale:rationale};
      }
      var family=card.querySelector('.r106Family').value;
      var payload={source:'EXPLICIT_OFFERING',requirementRef:requirementRef,family:family,offeringCanonicalName:card.querySelector('.r106OfferingName').value.trim(),offeringLifecycleStatus:'ACTIVE',implementationKind:card.querySelector('.r106ImplementationKind').value,implementationRef:card.querySelector('.r106ImplementationRef').value.trim(),decidedBy:'one-app-product-user',authorityRef:authority('capability-selection'),rationale:rationale};
      if(!payload.offeringCanonicalName||!payload.implementationRef)throw new Error('Explicit offering name and implementation reference are required.');
      if(family==='HUMAN_INTERACTION'){
        var outcome=card.querySelector('.r106HumanOutcome').value.trim()||'COMPLETED';
        payload.human={interactionKind:'MANUAL_ACTION',responsibilityKind:'PERFORMER',roleRefs:[card.querySelector('.r106HumanRole').value.trim()].filter(Boolean),outcomes:[{code:outcome,businessMeaning:'Explicit human completion outcome.',terminal:true}]};
        if(!payload.human.roleRefs.length)throw new Error('Human capability selection requires an explicit role reference.');
      }
      return payload;
    });
  }

  async function commitSelection(){
    if(!design)return;setState('Recording explicit capability selection and binding…','');
    try{
      var response=await nativeFetch('/api/automation/capability/select',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({workspaceId:design.workspaceId,selections:buildSelections()})});
      var raw=await response.text();var body=raw?JSON.parse(raw):{};if(!response.ok)throw new Error(body.error||body.code||('HTTP '+response.status));
      if(body.createsCapabilitySelection!==true||body.createsBinding!==true||body.executionPlanAuthorized!==false||body.temporalMappingAuthorized!==false||body.deploymentAuthorized!==false)throw new Error('R1-06 capability-selection authority boundary violation.');
      selection=body;planReview=null;approval=null;clear(byId('r106Plan'));clear(byId('r106Approval'));
      byId('r106ReviewPlan').disabled=false;byId('r106Approve').disabled=true;
      setState('CAPABILITIES EXPLICITLY SELECTED · ExecutionPlan review is now available.','good');
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  function renderPlan(bundle){
    var host=byId('r106Plan');if(!host)return;clear(host);
    var review=bundle.review,execution=bundle.execution;
    var card=document.createElement('section');card.className='r106Card';
    var title=document.createElement('h4');title.textContent='ExecutionPlan · '+label(review.state);card.appendChild(title);
    var meta=document.createElement('div');meta.className='r106Meta';meta.appendChild(pill('Plan '+safe(execution.revision.id)));meta.appendChild(pill('Assessment '+safe(execution.assessment.id)));meta.appendChild(pill('Readiness '+label(review.technicalReadiness)));meta.appendChild(pill('Automation approval required: YES'));card.appendChild(meta);
    var steps=document.createElement('div');steps.className='r106Plan';
    (execution.elements||[]).forEach(function(element,index){var step=document.createElement('div');step.className='r106Step';var strong=document.createElement('strong');strong.textContent=(index+1)+'. '+label(element.kind);step.appendChild(strong);var small=document.createElement('small');small.textContent='Semantic refs: '+(element.semanticSubjectRefs||[]).join(', ')+' · capability uses: '+((element.capabilityUseRefs||[]).join(', ')||'none')+' · design: '+label(element.designState);step.appendChild(small);steps.appendChild(step)});card.appendChild(steps);
    var blockers=document.createElement('div');blockers.className='r106Policy';blockers.innerHTML='<strong>Execution design blockers</strong><br>material requirements: <code>'+review.materialExecutionRequirementRefs.length+'</code> · incomplete elements: <code>'+review.incompleteExecutionElementRefs.length+'</code> · incomplete relations: <code>'+review.incompleteExecutionRelationRefs.length+'</code>';card.appendChild(blockers);
    var policy=document.createElement('div');policy.className='r106Policy';policy.innerHTML='<strong>Runtime contract preview — explicit, not assumed</strong><br>runtime inputs: <code>REQUIRED AT EXECUTION APPROVAL</code><br>retry policy: <code>UNSET — R1-07 REQUIRED</code><br>idempotency policy: <code>UNSET — R1-07 REQUIRED</code><br>timeouts: <code>UNSET — R1-07 REQUIRED</code><br>external effects: <code>'+((execution.capabilityUses||[]).length?'PRESENT THROUGH '+execution.capabilityUses.length+' CAPABILITY USE(S)':'NONE')+'</code><br>No value above is silently defaulted by R1-06.';card.appendChild(policy);
    host.appendChild(card);
    var approve=byId('r106Approve');if(approve)approve.disabled=review.state!=='READY_FOR_AUTOMATION_APPROVAL';
    setState(review.state==='READY_FOR_AUTOMATION_APPROVAL'?'EXECUTION PLAN READY FOR EXPLICIT AUTOMATION APPROVAL.':'ExecutionPlan remains blocked. Resolve execution-design requirements before approval.',review.state==='READY_FOR_AUTOMATION_APPROVAL'?'good':'blocked');
  }

  async function reviewPlan(){
    if(!design||!selection)return;setState('Generating and reviewing exact ExecutionPlan…','');
    try{
      var decisionsText=byId('r106ExecutionDecisions').value.trim();var decisions=decisionsText?JSON.parse(decisionsText):{};
      var response=await nativeFetch('/api/automation/execution-plan/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({workspaceId:design.workspaceId,decisions:decisions})});
      var raw=await response.text();var body=raw?JSON.parse(raw):{};if(!response.ok)throw new Error(body.error||body.code||('HTTP '+response.status));
      if(body.review.temporalDesignAuthorized!==false||body.review.deploymentAuthorized!==false||body.review.executionAuthorized!==false)throw new Error('R1-06 ExecutionPlan review crossed downstream authority.');
      planReview=body;approval=null;clear(byId('r106Approval'));renderPlan(body);
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  async function approveAutomation(){
    if(!planReview||planReview.review.state!=='READY_FOR_AUTOMATION_APPROVAL')return;setState('Recording explicit automation approval for this exact ExecutionPlan…','');
    try{
      var rationale=byId('r106ApprovalRationale').value.trim();if(!rationale)throw new Error('Automation approval requires a rationale.');
      var response=await nativeFetch('/api/automation/approve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reviewId:planReview.review.id,approvedBy:'one-app-product-user',authorityRef:authority('automation-approval'),rationale:rationale})});
      var raw=await response.text();var body=raw?JSON.parse(raw):{};if(!response.ok)throw new Error(body.error||body.code||('HTTP '+response.status));
      if(body.temporalDesignAuthorized!==true||body.deploymentAuthorized!==false||body.executionAuthorized!==false)throw new Error('R1-06 automation approval did not preserve deployment/execution authority boundaries.');
      if(body.executionPlanRevisionRef!==planReview.execution.revision.id||body.executionPlanAssessmentRef!==planReview.execution.assessment.id||body.executionDigest!==planReview.execution.revision.executionDigest)throw new Error('Automation approval did not pin the exact reviewed ExecutionPlan.');
      approval=body;var host=byId('r106Approval');clear(host);var receipt=document.createElement('div');receipt.className='r106Approval';receipt.textContent='APPROVED · exact ExecutionPlan '+body.executionPlanRevisionRef+' · Temporal design: YES · deployment: NO · execution: NO';host.appendChild(receipt);setState('AUTOMATION APPROVED FOR TEMPORAL DESIGN ONLY.','good');
      window.dispatchEvent(new CustomEvent('talos:r1-06-automation-approved',{detail:{approvalId:body.id,reviewId:planReview.review.id,executionPlanRevisionId:body.executionPlanRevisionRef,executionPlanAssessmentId:body.executionPlanAssessmentRef,executionDigest:body.executionDigest,capabilityBindingRevisionRefs:body.capabilityBindingRevisionRefs||[],workspaceId:design.workspaceId}}));
    }catch(error){setState(error instanceof Error?error.message:String(error),'bad')}
  }

  function install(){
    var review=byId('review');if(!review||byId('r106ExecutionPlan'))return;
    var panel=document.createElement('section');panel.id='r106ExecutionPlan';panel.className='r106Panel';
    panel.innerHTML='<h3>ExecutionPlan & Automation Approval</h3><p>Turn reviewed Automation Design into explicit capability bindings, inspect the generated execution design, then approve one exact plan for Temporal design.</p><div class="r106Boundary"><strong>Authority boundary:</strong> capability selection is explicit; ExecutionPlan review does not authorize Temporal; automation approval authorizes Temporal design only. RuntimePolicy, deployment and execution remain later gates.</div><div id="r106State" class="r106State blocked">Automation Design Workspace required before ExecutionPlan review.</div><div id="r106Selection" class="r106Grid"></div><div class="r106Actions"><button id="r106CommitSelection" disabled>Select & bind capabilities</button><button id="r106ReviewPlan" disabled>Review ExecutionPlan</button></div><div class="r106Fields"><label>Execution-design decisions when blockers exist<textarea id="r106ExecutionDecisions" placeholder="Optional explicit JSON decisions: subprocessResolutions / relationResolutions">{}</textarea></label></div><div id="r106Plan"></div><div class="r106Fields"><label>Automation approval rationale<textarea id="r106ApprovalRationale">Approve this exact reviewed ExecutionPlan for Temporal design only. Runtime, deployment and workflow execution remain separately authorized.</textarea></label></div><div class="r106Actions"><button id="r106Approve" disabled>Approve exact ExecutionPlan</button></div><div id="r106Approval"></div>';
    review.appendChild(panel);
    byId('r106CommitSelection').addEventListener('click',commitSelection);byId('r106ReviewPlan').addEventListener('click',reviewPlan);byId('r106Approve').addEventListener('click',approveAutomation);
  }

  install();
  window.addEventListener('talos:r1-05-automation-design-updated',function(event){var detail=event&&event.detail;if(!detail||!detail.workspaceId)return;design=detail;selection=null;planReview=null;approval=null;clear(byId('r106Plan'));clear(byId('r106Approval'));byId('r106ReviewPlan').disabled=true;byId('r106Approve').disabled=true;renderSelectionEditor();setState('AUTOMATION DESIGN READY · explicit capability selection is required.','good')});
  window.addEventListener('talos:r1-05-automation-design-invalidated',function(event){reset((event&&event.detail&&event.detail.reason)||'Automation Design invalidated; reconfirm the process.')});
})();
</script>`;

export function renderR106ExecutionPlanPage(basePage: string): string {
  const marker = '</body>';
  if (!basePage.includes(marker)) throw new TypeError('R1-06 product page requires a closing body tag');
  return basePage.replace(marker, `${R1_06_EXECUTION_PLAN_EXTENSION}\n${marker}`);
}
