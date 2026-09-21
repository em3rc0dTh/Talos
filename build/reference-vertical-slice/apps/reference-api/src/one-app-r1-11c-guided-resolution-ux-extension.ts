export const R1_11C_GUIDED_RESOLUTION_UX_EXTENSION = String.raw`
<style>
  .r111cToolbar{display:flex;justify-content:flex-end;margin:-4px 0 12px}.r111cToolbar button{font-size:10px;padding:7px 10px;background:#172335;color:#c4d3e3;border:1px solid #31465f}
  .r111cClarify{display:none;margin-top:14px;border:1px solid #39516c;border-radius:16px;padding:16px;background:linear-gradient(180deg,#0e1823,#09111a)}
  .r111cClarify.open{display:block}.r111cClarify h3{margin:0;font-size:15px}.r111cClarify .lead{margin:5px 0 0;font-size:12px;color:#9db0c5;line-height:1.55}
  .r111cCards{display:grid;gap:10px;margin-top:13px}.r111cCard{border:1px solid #293c52;border-radius:12px;padding:12px;background:#080f17}
  .r111cCard strong{display:block;font-size:12px}.r111cCard p{margin:5px 0 9px;color:#91a4b8;font-size:11px;line-height:1.45}
  .r111cCard input,.r111cCard select{width:100%;border:1px solid #344b65;border-radius:9px;background:#0e1722;color:#e8f0f8;padding:9px;font-size:11px}
  .r111cRow{display:grid;grid-template-columns:1fr 1fr;gap:8px}.r111cActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}
  .r111cActions button{font-size:11px;padding:9px 11px}.r111cState{font-size:11px;color:#ffca6b}.r111cState.good{color:#66e4bd}.r111cSummary{display:none;margin-top:11px;border:1px solid #315f4b;border-radius:10px;padding:10px;background:#0a1914;color:#bce6d4;font-size:11px;line-height:1.5}.r111cSummary.open{display:block}
  body:not(.r111cAdvanced) #meta,
  body:not(.r111cAdvanced) #questionsLabel,
  body:not(.r111cAdvanced) #questions,
  body:not(.r111cAdvanced) #findingsLabel,
  body:not(.r111cAdvanced) #findings,
  body:not(.r111cAdvanced) .editor,
  body:not(.r111cAdvanced) details,
  body:not(.r111cAdvanced) .r110Stats,
  body:not(.r111cAdvanced) .r110History,
  body:not(.r111cAdvanced) .r110Notice{display:none!important}
  body:not(.r111cAdvanced) .r104Boundary,
  body:not(.r111cAdvanced) .r105Boundary,
  body:not(.r111cAdvanced) .r106Boundary,
  body:not(.r111cAdvanced) .r107Boundary{display:none!important}
  @media(max-width:720px){.r111cRow{grid-template-columns:1fr}}
</style>
<script>
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var state={revision:null,reconciliation:null,proposal:null};

  function byId(id){return document.getElementById(id)}
  function authority(kind){return 'authority:talos-product:r1-11c-'+kind+':'+Date.now()}
  function label(v){return v==null?'':String(v).replaceAll('_',' ').toLowerCase().replace(/^./,function(x){return x.toUpperCase()})}
  function validation(){return state.reconciliation&&state.reconciliation.validation}
  function process(){return state.reconciliation&&state.reconciliation.processRevision}
  function findingFor(question){var v=validation();return v&&(v.findings||[]).find(function(f){return (question.findingRefs||[]).indexOf(f.id)>=0})}
  function node(ref){var p=process();return p&&(p.nodes||[]).find(function(n){return n.id===ref})}
  function edge(ref){var p=process();return p&&(p.edges||[]).find(function(e){return e.id===ref})}
  function supported(f){return f&&['SV-CFL-001','SV-SUB-002','SV-EVT-001','SV-EVT-002','SV-EVT-003'].indexOf(f.code)>=0}
  function setState(text,kind){var n=byId('r111cState');if(!n)return;n.textContent=text;n.className='r111cState'+(kind?' '+kind:'')}
  function targetText(q,f){
    if(f.code==='SV-CFL-001'){var e=edge(q.targetRef),a=e&&node(e.sourceNodeId),b=e&&node(e.targetNodeId);return 'Path: '+((a&&a.name)||'decision')+' → '+((b&&b.name)||'next step')}
    var n=node(q.targetRef);return (n&&n.name)||'This process step'
  }
  function install(){
    var review=byId('review');if(!review||byId('r111cClarify'))return;
    var toolbar=document.createElement('div');toolbar.className='r111cToolbar';toolbar.innerHTML='<button id="r111cMode" type="button">Technical details</button>';
    var shell=document.querySelector('.shell');if(shell)shell.insertBefore(toolbar,shell.firstChild);
    byId('r111cMode').addEventListener('click',function(){document.body.classList.toggle('r111cAdvanced');this.textContent=document.body.classList.contains('r111cAdvanced')?'Simple view':'Technical details'});
    var box=document.createElement('section');box.id='r111cClarify';box.className='r111cClarify';
    box.innerHTML='<h3>A few details need your confirmation</h3><p class="lead">Talos understood the process structure, but it will not guess business rules. Answer these questions in normal language before preparing the automation.</p><div id="r111cCards" class="r111cCards"></div><div id="r111cSummary" class="r111cSummary"></div><div class="r111cActions"><button id="r111cReview" type="button">Review my answers</button><button id="r111cApply" type="button" style="display:none">Apply clarifications</button><button id="r111cBack" type="button" class="secondary" style="display:none">Change answers</button><span id="r111cState" class="r111cState"></span></div>';
    var confirmation=byId('r104BusinessConfirmation');if(confirmation&&confirmation.parentNode)confirmation.parentNode.insertBefore(box,confirmation);else review.appendChild(box);
    byId('r111cReview').addEventListener('click',propose);
    byId('r111cApply').addEventListener('click',function(){decide('ACCEPT')});
    byId('r111cBack').addEventListener('click',function(){state.proposal=null;byId('r111cSummary').classList.remove('open');byId('r111cApply').style.display='none';byId('r111cBack').style.display='none';byId('r111cReview').style.display='inline-block';setState('')});
    simplifyCopy();
  }
  function simplifyCopy(){
    var lead=document.querySelector('.top .lead');if(lead)lead.textContent='Upload a process image or BPMN. Talos will show what it understood and ask only what it needs before preparing an automation.';
    var choose=byId('choose');if(choose)choose.textContent='Upload process image';
    var inspect=byId('inspect');if(inspect)inspect.textContent='Analyze process';
    var reviewCard=byId('review')&&byId('review').closest('.card');if(reviewCard){var h=reviewCard.querySelector('h2');if(h)h.textContent='Review your process';var p=reviewCard.querySelector('.sub');if(p)p.textContent='Check that the steps match how the work really happens. Talos will ask for any missing business details.'}
    var confirm=byId('r104BusinessConfirmation');if(confirm){var h3=confirm.querySelector('h3');if(h3)h3.textContent='Confirm this process';var p2=confirm.querySelector('p');if(p2)p2.textContent='When this matches how the business really works, confirm it. This does not start or deploy anything.';var b=byId('r104ConfirmProcess');if(b)b.textContent='Confirm process'}
    var design=byId('r105AutomationDesign');if(design){var dh=design.querySelector('h3');if(dh)dh.textContent='Prepare automation';var dp=design.querySelector('p');if(dp)dp.textContent='Choose how the confirmed process should be automated. Nothing runs until you approve it later.';var db=byId('r105Open');if(db)db.textContent='Continue to automation setup'}
  }
  function waitFields(card){
    var select=card.querySelector('.r111cWaitKind'),extra=card.querySelector('.r111cWaitExtra');if(!select||!extra)return;
    var k=select.value;extra.innerHTML='';
    if(k==='DURATION'){extra.innerHTML='<input class="r111cExpression" placeholder="How long? Example: 5 minutes" />';return}
    if(k==='SCHEDULE'||k==='DEADLINE'){extra.innerHTML='<div class="r111cRow"><input class="r111cExpression" placeholder="When? Example: every day at 8:00" /><input class="r111cTimezone" placeholder="Timezone, e.g. America/Lima" /></div>';return}
    extra.innerHTML='<input class="r111cResume" placeholder="What exactly lets the process continue?" />';
  }
  function render(){
    var panel=byId('r111cClarify'),host=byId('r111cCards');if(!panel||!host)return;
    var v=validation(),questions=v&&v.questions||[];var items=questions.map(function(q){return{q:q,f:findingFor(q)}}).filter(function(x){return supported(x.f)});
    host.innerHTML='';state.proposal=null;byId('r111cSummary').classList.remove('open');byId('r111cApply').style.display='none';byId('r111cBack').style.display='none';byId('r111cReview').style.display=items.length?'inline-block':'none';
    panel.classList.toggle('open',items.length>0);
    if(!items.length)return;
    items.forEach(function(item,index){
      var q=item.q,f=item.f,card=document.createElement('div');card.className='r111cCard';card.dataset.question=q.id;card.dataset.finding=f.id;card.dataset.target=q.targetRef;card.dataset.code=f.code;
      var title=document.createElement('strong');title.textContent=(index+1)+'. '+targetText(q,f);card.appendChild(title);
      var prompt=document.createElement('p');
      if(f.code==='SV-CFL-001')prompt.textContent='When should Talos follow this path?';
      else if(f.code.indexOf('SV-EVT-')===0)prompt.textContent='What should Talos wait for before continuing?';
      else prompt.textContent='How should this part of the process behave?';
      card.appendChild(prompt);
      if(f.code==='SV-CFL-001'){var input=document.createElement('input');input.className='r111cCondition';input.placeholder='Example: only when the customer says yes';card.appendChild(input)}
      else if(f.code.indexOf('SV-EVT-')===0){var select=document.createElement('select');select.className='r111cWaitKind';[['','Choose what the process waits for'],['DURATION','A fixed amount of time'],['SCHEDULE','A scheduled time'],['DEADLINE','A deadline'],['MESSAGE','A message'],['EXTERNAL_EVENT','An external event'],['HUMAN_RESPONSE','A person to respond'],['CONDITION','A condition to become true']].forEach(function(pair){var o=document.createElement('option');o.value=pair[0];o.textContent=pair[1];select.appendChild(o)});card.appendChild(select);var extra=document.createElement('div');extra.className='r111cWaitExtra';extra.style.marginTop='8px';card.appendChild(extra);select.addEventListener('change',function(){waitFields(card)})}
      else{var select2=document.createElement('select');select2.className='r111cBoundary';[['EMBEDDED','Part of this same process'],['CALL_ACTIVITY','A reusable process'],['EXTERNAL_ORCHESTRATION','Handled by another system'],['HUMAN_MANAGED','Managed by a person']].forEach(function(pair){var o2=document.createElement('option');o2.value=pair[0];o2.textContent=pair[1];select2.appendChild(o2)});card.appendChild(select2);var completion=document.createElement('input');completion.className='r111cCompletion';completion.placeholder='When is this part considered complete?';completion.style.marginTop='8px';card.appendChild(completion)}
      host.appendChild(card);
    });
    setState('Answer the questions above. Talos will show you the changes before applying them.');
  }
  function collect(){
    return Array.from(document.querySelectorAll('.r111cCard')).map(function(card){
      var code=card.dataset.code;
      if(code==='SV-CFL-001')return{kind:'BRANCH_CONDITION',questionRef:card.dataset.question,findingRef:card.dataset.finding,targetRef:card.dataset.target,condition:card.querySelector('.r111cCondition').value};
      if(code.indexOf('SV-EVT-')===0){var k=card.querySelector('.r111cWaitKind').value;return{kind:'WAIT_SEMANTICS',questionRef:card.dataset.question,findingRef:card.dataset.finding,targetRef:card.dataset.target,waitKind:k,expression:(card.querySelector('.r111cExpression')||{}).value,timezone:(card.querySelector('.r111cTimezone')||{}).value,resumeSemantics:(card.querySelector('.r111cResume')||{}).value}}
      return{kind:'SUBPROCESS_BOUNDARY',questionRef:card.dataset.question,findingRef:card.dataset.finding,targetRef:card.dataset.target,boundaryMeaning:card.querySelector('.r111cBoundary').value,completionMeaning:card.querySelector('.r111cCompletion').value};
    });
  }
  async function propose(){
    if(!state.revision||!validation())return;
    try{
      setState('Checking your answers…');
      var response=await nativeFetch('/api/semantic-resolution/propose',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revisionId:state.revision.id,answers:collect(),answeredBy:'one-app-product-user',authorityRef:authority('answers'),rationale:'User supplied the missing business meaning through the guided One-App review.'})});
      var body=await response.json();if(!response.ok)throw new Error(body.error||('HTTP '+response.status));state.proposal=body.proposal;
      var summary=byId('r111cSummary');summary.textContent='Talos will create a new process revision from these clarifications. Your original source stays unchanged, and you will confirm the updated process again before automation.';summary.classList.add('open');
      byId('r111cReview').style.display='none';byId('r111cApply').style.display='inline-block';byId('r111cBack').style.display='inline-block';setState('Ready to apply. Nothing has changed yet.','good');
    }catch(error){setState(error instanceof Error?error.message:String(error))}
  }
  async function decide(decision){
    if(!state.proposal||!state.revision)return;
    try{
      setState('Applying your clarifications…');
      var response=await nativeFetch('/api/semantic-resolution/decide',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revisionId:state.revision.id,proposalId:state.proposal.id,decision:decision,decidedBy:'one-app-product-user',authorityRef:authority('accept'),rationale:'User explicitly accepted the guided process clarifications.'})});
      var body=await response.json();if(!response.ok)throw new Error(body.error||('HTTP '+response.status));
      if(body.revision)state.revision=body.revision;if(body.reconciliation)state.reconciliation=body.reconciliation;state.proposal=null;render();
      window.dispatchEvent(new CustomEvent('talos:r1-11c-semantic-resolution-applied',{detail:{revision:body.revision,reconciliation:body.reconciliation}}));
      setState('Clarifications applied. Review the updated process and confirm it again.','good');
      var confirm=byId('r104BusinessConfirmation');if(confirm)confirm.scrollIntoView({behavior:'smooth',block:'center'});
    }catch(error){setState(error instanceof Error?error.message:String(error))}
  }
  function capture(body){
    if(!body)return;
    if(body.revision)state.revision=body.revision;
    if(body.reconciliation)state.reconciliation=body.reconciliation;
    render();
  }

  install();
  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';var method=String((init&&init.method)||'GET').toUpperCase();
    return nativeFetch(input,init).then(function(response){
      var relevant=response.ok&&((method==='POST'&&(path.indexOf('/api/input/image')!==-1||path.indexOf('/api/input/bpmn')!==-1||path.indexOf('/api/input/canvas')!==-1||path.indexOf('/api/bpmn/edit')!==-1||path.indexOf('/api/bpmn/confirm')!==-1||path.indexOf('/api/semantic-resolution/decide')!==-1))||(method==='GET'&&path.indexOf('/api/process-review')!==-1));
      if(relevant)response.clone().json().then(capture).catch(function(){});
      return response;
    });
  };
  window.addEventListener('talos:r1-11c-freeze-blocked',function(event){
    var detail=event&&event.detail;if(detail&&detail.reconciliation)capture(detail);
    var panel=byId('r111cClarify');if(panel){panel.classList.add('open');panel.scrollIntoView({behavior:'smooth',block:'center'})}
    setState('Answer the missing process details above, then confirm the updated process again.');
  });
})();
</script>`;

export function renderR111CGuidedResolutionUxPage(basePage: string): string {
  const marker = '</body>';
  if (!basePage.includes(marker)) throw new TypeError('R1-11C guided resolution UX requires a closing body tag');
  return basePage.replace(marker, `${R1_11C_GUIDED_RESOLUTION_UX_EXTENSION}\n${marker}`);
}
