export const R1_11C_GUIDED_RESOLUTION_UX_EXTENSION = String.raw`
<style>
  .r111cTopActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .r111cMode{background:#172335!important;color:#c9d8e8!important;border:1px solid #334b67!important;font-size:10px!important;padding:8px 10px!important}
  .r111cSummary{margin-top:14px;border:1px solid #2b4b63;border-radius:14px;padding:13px;background:linear-gradient(180deg,#0d1924,#09121a)}
  .r111cSummary.good{border-color:#285743;background:linear-gradient(180deg,#0c1d18,#08130f)}
  .r111cSummary.warn{border-color:#65562f;background:linear-gradient(180deg,#201b0e,#131006)}
  .r111cSummary strong{display:block;font-size:13px}.r111cSummary p{margin:5px 0 0;color:#aab9c9;font-size:11px;line-height:1.5}
  .r111cPanel{margin-top:14px;border:1px solid #3a526c;border-radius:15px;padding:14px;background:linear-gradient(180deg,#101923,#091019);display:none}
  .r111cPanel.open{display:block}.r111cPanel h3{margin:0;font-size:14px}.r111cLead{margin:5px 0 0;color:#9fb0c2;font-size:11px;line-height:1.5}
  .r111cQuestions{display:grid;gap:9px;margin-top:12px}.r111cQuestion{border:1px solid #26384d;border-radius:12px;padding:11px;background:#08111a}
  .r111cQuestionHead{display:flex;gap:8px;align-items:flex-start;justify-content:space-between}.r111cQuestionHead strong{font-size:12px}.r111cQuestionHead small{font-size:9px;color:#778da4}
  .r111cQuestion p{margin:5px 0 9px;color:#b5c5d6;font-size:11px;line-height:1.45}.r111cTarget{font-size:10px;color:#66e4bd;margin-bottom:8px}
  .r111cQuestion input[type=text],.r111cQuestion select{width:100%;box-sizing:border-box;border:1px solid #344a62;border-radius:9px;background:#0c1621;color:#e6eef7;padding:9px;font-size:11px}
  .r111cQuestion label.r111cCheck{display:flex;gap:8px;align-items:flex-start;color:#d9e6f2;font-size:11px;line-height:1.4}
  .r111cWaitFields{display:grid;gap:7px;margin-top:7px}.r111cWaitFields.hidden{display:none}
  .r111cActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:11px}.r111cActions button{font-size:10px;padding:8px 10px}
  .r111cSecondary{background:#1b2938!important;color:#d8e5f1!important}.r111cStatus{font-size:10px;color:#ffca6b;line-height:1.45}
  .r111cProposal{margin-top:10px;border:1px solid #35563f;border-radius:11px;padding:10px;background:#0a1711;display:none}.r111cProposal.open{display:block}
  .r111cProposal strong{font-size:11px;color:#8ce0b9}.r111cProposal ul{margin:7px 0 0;padding-left:18px;color:#b9cabc;font-size:10px;line-height:1.55}
  .r111cInferenceGroup{border:1px solid #294354;border-radius:12px;padding:10px 11px;background:#0b151e}
  .r111cInferenceGroup strong{display:block;font-size:12px}.r111cInferenceGroup span{display:block;margin-top:4px;color:#94a8bc;font-size:10px;line-height:1.45}
  body:not(.r111cAdvanced) .meta,body:not(.r111cAdvanced) #questionsLabel,body:not(.r111cAdvanced) #questions,body:not(.r111cAdvanced) #findingsLabel,body:not(.r111cAdvanced) #findings,body:not(.r111cAdvanced) .editor,body:not(.r111cAdvanced) details,body:not(.r111cAdvanced) .r104Boundary,body:not(.r111cAdvanced) .r105Boundary,body:not(.r111cAdvanced) .r106Boundary,body:not(.r111cAdvanced) .r107Boundary,body:not(.r111cAdvanced) .r105Meta{display:none!important}
  body:not(.r111cAdvanced) .r111cQuestionHead small{display:none!important}
  body:not(.r111cAdvanced) .r111cQuestion[data-code="SV-SRC-001"]{padding:8px 10px}
  body:not(.r111cAdvanced) .r111cQuestion[data-code="SV-SRC-001"] p{display:none}
  body:not(.r111cAdvanced) .r111cFuture{display:none!important}body.r111cAdvanced .r111cFuture{display:block!important}
  body:not(.r111cAdvanced) .r110Stats,body:not(.r111cAdvanced) .r110Notice,body:not(.r111cAdvanced) .r110History{display:none!important}
  body:not(.r111cAdvanced) .r110Recovery{padding:11px 13px}body:not(.r111cAdvanced) .r110Recovery p{max-width:760px}
  body:not(.r111cAdvanced) .runtime{font-size:0}body:not(.r111cAdvanced) .runtime::after{content:'Ready';font-size:12px}
</style>
<script>
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var current={revision:null,process:null,validation:null,proposal:null};
  var supportedCodes=['SV-CFL-001','SV-SUB-002','SV-EVT-001','SV-EVT-002','SV-EVT-003','SV-SRC-001'];
  var simpleTruthTitles=['1 · YOUR PROCESS','2 · UNDERSTAND','3 · REVIEW','4 · CONFIRM','5 · AUTOMATION','6 · PLAN','7 · CONNECT','8 · RUN','9 · HISTORY'];
  var friendlyTail={
    'Waiting for input':'Waiting for your process',
    'Not reached':'Not started',
    'Never automatic':'Needs your confirmation',
    'Separate authority':'Not started',
    'Separate authority still required':'Not started',
    'Exact source preserved':'Source saved',
    'Evidence admitted':'Process understood',
    'Review candidate created':'Ready for review',
    'Exact process confirmed':'Confirmed',
    'Durable evidence recovered':'Saved'
  };

  function byId(id){return document.getElementById(id)}
  function clear(node){while(node&&node.firstChild)node.removeChild(node.firstChild)}
  function authority(kind){return 'authority:talos-product:r1-11c-'+kind+':'+Date.now()}
  function safe(value){return value==null?'—':String(value)}
  function friendlyReadiness(value){
    if(value==='READY_FOR_AUTOMATION_DESIGN')return['Ready for automation setup','Talos has enough confirmed business detail to continue.','good'];
    if(value==='NEEDS_CONFIRMATION')return['Please confirm a few details','Talos understands the flow, but some inferred meaning still needs your confirmation.','warn'];
    if(value==='INSUFFICIENT_DETAIL')return['A few details still need your confirmation','Answer the questions below before Talos designs the automation.','warn'];
    if(value==='BLOCKED_BY_CONFLICT')return['Two parts of the process disagree','Review the conflicting meaning before continuing.','warn'];
    return['Review what Talos understood','Confirm or correct the process before continuing.',''];
  }
  function nodeById(ref){return current.process&&current.process.nodes&&current.process.nodes.find(function(n){return n.id===ref})}
  function edgeById(ref){return current.process&&current.process.edges&&current.process.edges.find(function(e){return e.id===ref})}
  function claimById(ref){return current.process&&current.process.semanticClaims&&current.process.semanticClaims.find(function(c){return c.id===ref})}
  function targetLabel(ref){var node=nodeById(ref);if(node)return node.name||node.kind;var edge=edgeById(ref);if(edge){var a=nodeById(edge.sourceNodeId),b=nodeById(edge.targetNodeId);return safe(a&&a.name||'Previous step')+' → '+safe(b&&b.name||'Next step')}return''}
  function findingFor(question){return current.validation&&current.validation.findings&&current.validation.findings.find(function(f){return (question.findingRefs||[]).indexOf(f.id)>=0})}
  function friendlyQuestion(code,label){var target=label?' “'+label+'”':'';if(code==='SV-CFL-001')return['When should this path be used?','Tell Talos the business condition for'+target+'.'];if(code==='SV-SUB-002')return['How does this subprocess finish?','Describe how'+target+' behaves and when it is complete.'];if(code==='SV-EVT-003')return['What are we waiting for here?','Choose what makes'+target+' wait, then provide the needed detail.'];if(code==='SV-EVT-002')return['How long or until what time?','Complete the timing for'+target+'.'];if(code==='SV-EVT-001')return['What lets the process continue?','Tell Talos what resumes'+target+'.'];if(code==='SV-SRC-001')return['Is Talos’s interpretation correct?','Talos inferred the meaning of'+target+'. Confirm it only if it matches the real process.'];return['Confirm this detail','Talos needs one more business detail before continuing.']}
  function humanValue(value){if(value==null)return'—';if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return String(value);if(Array.isArray(value))return value.map(humanValue).join(', ');try{var keys=Object.keys(value);return keys.slice(0,3).map(function(k){return k+': '+humanValue(value[k])}).join(' · ')}catch{return'Inferred business meaning'}}

  function installModeToggle(){
    var top=document.querySelector('.top');if(!top||byId('r111cMode'))return;
    var wrap=document.createElement('div');wrap.className='r111cTopActions';
    var button=document.createElement('button');button.type='button';button.id='r111cMode';button.className='r111cMode';wrap.appendChild(button);top.appendChild(wrap);
    function apply(mode){var advanced=mode==='advanced';document.body.classList.toggle('r111cAdvanced',advanced);button.textContent=advanced?'Simple view':'Technical details';localStorage.setItem('talos-r1-11c-ui',advanced?'advanced':'simple');simplifyShell()}
    button.addEventListener('click',function(){apply(document.body.classList.contains('r111cAdvanced')?'simple':'advanced')});
    apply(localStorage.getItem('talos-r1-11c-ui')==='advanced'?'advanced':'simple');
  }

  function installGuided(){
    var review=byId('review');if(!review||byId('r111cGuided'))return;
    var summary=document.createElement('section');summary.id='r111cSummary';summary.className='r111cSummary';summary.innerHTML='<strong>Review what Talos understood</strong><p>Talos will ask only for details it cannot safely infer.</p>';
    var panel=document.createElement('section');panel.id='r111cGuided';panel.className='r111cPanel';panel.innerHTML='<h3>Finish the missing process details</h3><p class="r111cLead">Answer in normal business language. Talos will show you the proposed meaning before it changes the active process.</p><div id="r111cQuestions" class="r111cQuestions"></div><div id="r111cProposal" class="r111cProposal"></div><div class="r111cActions"><button id="r111cReview" type="button">Review my answers</button><button id="r111cAccept" type="button" style="display:none">Apply these answers</button><button id="r111cReject" type="button" class="r111cSecondary" style="display:none">Change my answers</button><span id="r111cStatus" class="r111cStatus"></span></div>';
    var confirmation=byId('r104BusinessConfirmation');review.insertBefore(summary,confirmation||review.firstChild);review.insertBefore(panel,confirmation||null);
    byId('r111cReview').addEventListener('click',propose);byId('r111cAccept').addEventListener('click',function(){decide('ACCEPT')});byId('r111cReject').addEventListener('click',function(){decide('REJECT')});
  }

  function renderSummary(){var box=byId('r111cSummary');if(!box)return;if(!current.validation){box.className='r111cSummary';box.innerHTML='<strong>Review what Talos understood</strong><p>Talos will ask only for details it cannot safely infer.</p>';return}var a=current.validation.assessment||{},copy=friendlyReadiness(a.executionReadiness);box.className='r111cSummary '+copy[2];box.innerHTML='<strong>'+copy[0]+'</strong><p>'+copy[1]+'</p>'}
  function option(value,label){var o=document.createElement('option');o.value=value;o.textContent=label;return o}
  function input(placeholder,className){var n=document.createElement('input');n.type='text';n.placeholder=placeholder;n.className=className;return n}
  function waitFields(box){var kind=box.querySelector('.r111cWaitKind').value,expression=box.querySelector('.r111cWaitExpression'),timezone=box.querySelector('.r111cWaitTimezone'),resume=box.querySelector('.r111cWaitResume');expression.parentNode.classList.toggle('hidden',!(kind==='DURATION'||kind==='SCHEDULE'||kind==='DEADLINE'));timezone.parentNode.classList.toggle('hidden',!(kind==='SCHEDULE'||kind==='DEADLINE'));resume.parentNode.classList.toggle('hidden',!(kind==='MESSAGE'||kind==='EXTERNAL_EVENT'||kind==='HUMAN_RESPONSE'||kind==='CONDITION'))}
  function insertInferenceGroup(host){var cards=Array.from(host.querySelectorAll('.r111cQuestion[data-code="SV-SRC-001"]'));if(cards.length<2)return;var group=document.createElement('div');group.className='r111cInferenceGroup';var strong=document.createElement('strong');strong.textContent='Check '+cards.length+' interpretations Talos inferred';var note=document.createElement('span');note.textContent='Review each item individually. There is intentionally no “confirm all” shortcut.';group.append(strong,note);host.insertBefore(group,cards[0])}

  function renderQuestions(focusFirst){
    var panel=byId('r111cGuided'),host=byId('r111cQuestions'),status=byId('r111cStatus');if(!panel||!host)return;
    clear(host);current.proposal=null;byId('r111cAccept').style.display='none';byId('r111cReject').style.display='none';byId('r111cReview').style.display='inline-block';byId('r111cProposal').classList.remove('open');
    var questions=current.validation&&current.validation.questions||[];var supported=questions.filter(function(q){var f=findingFor(q);return f&&supportedCodes.indexOf(f.code)>=0});
    panel.classList.toggle('open',supported.length>0);if(!supported.length){status.textContent='';return}
    supported.forEach(function(q,index){
      var f=findingFor(q),label=targetLabel(q.targetRef),copy=friendlyQuestion(f.code,label),box=document.createElement('section');
      box.className='r111cQuestion';box.dataset.question=q.id;box.dataset.finding=f.id;box.dataset.target=q.targetRef;box.dataset.code=f.code;
      var head=document.createElement('div');head.className='r111cQuestionHead';var title=document.createElement('strong');title.textContent=(index+1)+'. '+copy[0];var tech=document.createElement('small');tech.textContent=f.code;head.append(title,tech);box.appendChild(head);
      if(label){var target=document.createElement('div');target.className='r111cTarget';target.textContent=label;box.appendChild(target)}
      var p=document.createElement('p');p.textContent=copy[1];box.appendChild(p);
      if(f.code==='SV-CFL-001'){
        box.appendChild(input('Example: only when the customer answered “Yes”','r111cCondition'));
      }else if(f.code==='SV-SUB-002'){
        var select=document.createElement('select');select.className='r111cBoundary';[['EMBEDDED','Part of this process'],['CALL_ACTIVITY','A reusable process'],['EXTERNAL_ORCHESTRATION','Handled by another system/process'],['HUMAN_MANAGED','Handled manually by a person']].forEach(function(item){select.appendChild(option(item[0],item[1]))});box.appendChild(select);box.appendChild(input('What must be true before this part is finished?','r111cCompletion'));
      }else if(f.code.indexOf('SV-EVT-')===0){
        var kind=document.createElement('select');kind.className='r111cWaitKind';kind.appendChild(option('','Choose what this step waits for…'));[['DURATION','A duration'],['SCHEDULE','A scheduled time'],['DEADLINE','A deadline'],['MESSAGE','A message'],['EXTERNAL_EVENT','An external event'],['HUMAN_RESPONSE','A person’s response'],['CONDITION','A business condition']].forEach(function(item){kind.appendChild(option(item[0],item[1]))});
        var node=nodeById(q.targetRef),existing=node&&node.details&&node.details.waitKind;if(existing&&Array.from(kind.options).some(function(o){return o.value===existing}))kind.value=existing;box.appendChild(kind);
        var eWrap=document.createElement('div');eWrap.className='r111cWaitFields';eWrap.appendChild(input('Example: 5 minutes, every weekday at 08:00, 2026-10-01 17:00','r111cWaitExpression'));box.appendChild(eWrap);
        var tzWrap=document.createElement('div');tzWrap.className='r111cWaitFields';tzWrap.appendChild(input('Timezone, e.g. America/Lima','r111cWaitTimezone'));box.appendChild(tzWrap);
        var rWrap=document.createElement('div');rWrap.className='r111cWaitFields';rWrap.appendChild(input('What exactly happens before the process continues?','r111cWaitResume'));box.appendChild(rWrap);
        kind.addEventListener('change',function(){waitFields(box)});waitFields(box);
      }else{
        var claimRef=(f.targetRefs||[])[1],claim=claimById(claimRef);box.dataset.claim=claimRef||'';var inferred=document.createElement('div');inferred.className='r111cTarget';inferred.textContent='Talos inferred: '+humanValue(claim&&claim.value);box.appendChild(inferred);var check=document.createElement('label');check.className='r111cCheck';var cb=document.createElement('input');cb.type='checkbox';cb.className='r111cInference';check.appendChild(cb);check.appendChild(document.createTextNode('Yes, this meaning matches the real process.'));box.appendChild(check);
      }
      host.appendChild(box);
    });
    insertInferenceGroup(host);status.textContent='Answer these items before continuing to automation setup.';simplifyShell();
    if(focusFirst){var first=host.querySelector('input,select');if(first)first.focus()}
  }

  function collectAnswers(){
    return Array.from(document.querySelectorAll('.r111cQuestion')).map(function(box){
      var code=box.dataset.code,base={questionRef:box.dataset.question,findingRef:box.dataset.finding,targetRef:box.dataset.target};
      if(code==='SV-CFL-001'){var condition=box.querySelector('.r111cCondition').value.trim();if(!condition)throw new Error('Describe when each branch should be used.');return Object.assign({kind:'BRANCH_CONDITION',condition:condition},base)}
      if(code==='SV-SUB-002'){var completion=box.querySelector('.r111cCompletion').value.trim();if(!completion)throw new Error('Describe when each subprocess is complete.');return Object.assign({kind:'SUBPROCESS_BOUNDARY',boundaryMeaning:box.querySelector('.r111cBoundary').value,completionMeaning:completion},base)}
      if(code.indexOf('SV-EVT-')===0){var waitKind=box.querySelector('.r111cWaitKind').value;if(!waitKind)throw new Error('Choose what each wait step is waiting for.');var answer=Object.assign({kind:'WAIT_SEMANTICS',waitKind:waitKind},base),expression=box.querySelector('.r111cWaitExpression').value.trim(),timezone=box.querySelector('.r111cWaitTimezone').value.trim(),resume=box.querySelector('.r111cWaitResume').value.trim();if(waitKind==='DURATION'&&!expression)throw new Error('Enter the duration for the wait step.');if((waitKind==='SCHEDULE'||waitKind==='DEADLINE')&&(!expression||!timezone))throw new Error('Enter the time and timezone for the scheduled wait.');if((waitKind==='MESSAGE'||waitKind==='EXTERNAL_EVENT'||waitKind==='HUMAN_RESPONSE'||waitKind==='CONDITION')&&!resume)throw new Error('Describe what lets the wait step continue.');if(expression)answer.expression=expression;if(timezone)answer.timezone=timezone;if(resume)answer.resumeSemantics=resume;return answer}
      if(!box.querySelector('.r111cInference').checked)throw new Error('Confirm each inferred meaning only if it matches the real process.');if(!box.dataset.claim)throw new Error('Talos could not identify the inferred meaning safely. Open Technical details.');return Object.assign({kind:'MATERIAL_INFERENCE',claimRef:box.dataset.claim,confirmation:'ACCEPT_INFERRED_MEANING'},base);
    });
  }

  function proposalLine(answer){if(answer.kind==='BRANCH_CONDITION')return'Use a branch when: '+answer.condition;if(answer.kind==='SUBPROCESS_BOUNDARY')return'Subprocess completion: '+answer.completionMeaning;if(answer.kind==='WAIT_SEMANTICS')return'Wait: '+answer.waitKind.replaceAll('_',' ').toLowerCase()+(answer.expression?' · '+answer.expression:'')+(answer.resumeSemantics?' · '+answer.resumeSemantics:'');return'Accept one inferred business meaning as confirmed.'}
  async function propose(){if(!current.revision||!current.validation)return;var status=byId('r111cStatus');try{status.textContent='Preparing your proposed process update…';var answers=collectAnswers();var response=await nativeFetch('/api/semantic-resolution/propose',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revisionId:current.revision.id,answers:answers,answeredBy:'one-app-product-user',authorityRef:authority('answers'),rationale:'Business user answered the missing process details in the guided One-App review.'})});var body=await response.json();if(!response.ok)throw new Error(body.error||('HTTP '+response.status));current.proposal=body.proposal;var proposal=byId('r111cProposal');clear(proposal);var strong=document.createElement('strong');strong.textContent='Review what will change';var lead=document.createElement('div');lead.className='r111cLead';lead.textContent='Talos will create a new process version with these meanings. Nothing is confirmed or automated yet.';var ul=document.createElement('ul');(body.proposal.answers||[]).forEach(function(a){var li=document.createElement('li');li.textContent=proposalLine(a);ul.appendChild(li)});proposal.append(strong,lead,ul);proposal.classList.add('open');byId('r111cReview').style.display='none';byId('r111cAccept').style.display='inline-block';byId('r111cReject').style.display='inline-block';status.textContent='Check the summary, then apply it only if it matches the real process.'}catch(error){status.textContent=error instanceof Error?error.message:String(error)}}

  async function decide(decision){if(!current.proposal||!current.revision)return;var status=byId('r111cStatus');try{status.textContent=decision==='ACCEPT'?'Creating the new process version…':'Keeping the current process…';var response=await nativeFetch('/api/semantic-resolution/decide',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revisionId:current.revision.id,proposalId:current.proposal.id,decision:decision,decidedBy:'one-app-product-user',authorityRef:authority(decision==='ACCEPT'?'accept':'reject'),rationale:decision==='ACCEPT'?'I reviewed and accept these guided business meanings.':'I want to change these answers.'})});var body=await response.json();if(!response.ok)throw new Error(body.error||('HTTP '+response.status));if(decision==='REJECT'){current.proposal=null;renderQuestions(false);status.textContent='No process change was made. Update the answers and review them again.';return}current.proposal=null;capture(body);window.dispatchEvent(new CustomEvent('talos:r1-11c-semantic-revision-created',{detail:{revisionId:body.revision.id,requiresProcessReconfirmation:true}}));var reviewResponse=await nativeFetch('/api/process-review?revisionId='+encodeURIComponent(body.revision.id));var reviewBody=await reviewResponse.json();if(reviewResponse.ok)capture(reviewBody);var badge=byId('reviewBadge');if(badge){badge.textContent='UPDATED · CONFIRM THIS VERSION';badge.className='badge corrected'}status.textContent='Details saved in a new process version. Please confirm this updated process before automation setup.';simplifyShell();var confirmation=byId('r104BusinessConfirmation');if(confirmation)confirmation.scrollIntoView({behavior:'smooth',block:'center'})}catch(error){status.textContent=error instanceof Error?error.message:String(error)}}

  function capture(body){if(!body)return;if(body.revision&&body.reconciliation&&body.reconciliation.processRevision){current.revision=body.revision;current.process=body.reconciliation.processRevision;current.validation=body.reconciliation.validation||null;renderSummary();renderQuestions(false)}}
  function freezeBlocked(){var panel=byId('r111cGuided');if(panel)panel.classList.add('open');var status=byId('r111cStatus');if(status)status.textContent='Before we design the automation, confirm the missing process details below.';renderQuestions(true);if(panel)panel.scrollIntoView({behavior:'smooth',block:'start'})}

  function simplifyTruth(){
    var steps=Array.from(document.querySelectorAll('.truth .truthStep'));
    var advanced=document.body.classList.contains('r111cAdvanced');
    steps.forEach(function(step,index){var strong=step.querySelector('strong');if(strong){if(!strong.dataset.r111cOriginal)strong.dataset.r111cOriginal=strong.textContent||'';strong.textContent=advanced?(strong.dataset.r111cOriginal||strong.textContent):(simpleTruthTitles[index]||strong.textContent)}if(!advanced){var tail=step.childNodes[step.childNodes.length-1];if(tail&&tail.nodeType===Node.TEXT_NODE){var text=(tail.textContent||'').trim();if(friendlyTail[text])tail.textContent=friendlyTail[text]}}});
    var badge=byId('reviewBadge');if(badge&&!advanced){if(badge.textContent==='INFERRED · NOT CONFIRMED')badge.textContent='Needs review';else if(badge.textContent==='CORRECTED · RECONFIRMATION REQUIRED')badge.textContent='Updated · confirm again';else if(badge.textContent==='CONFIRMED · AUTOMATION NOT AUTHORIZED')badge.textContent='Process confirmed'}
  }

  function simplifyShell(){
    var h1=document.querySelector('h1');if(h1)h1.textContent='Show Talos how your process works.';
    var lead=document.querySelector('.lead');if(lead)lead.textContent='Upload your real process. Talos will help you review it, fill in missing details, and prepare automation step by step.';
    var source=document.querySelector('.card .sub');if(source)source.textContent='Start with an image or BPMN file. Talos keeps the original source unchanged while you review what it understood.';
    var reviewCard=document.querySelectorAll('.card')[1];if(reviewCard){var reviewTitle=reviewCard.querySelector('h2');if(reviewTitle)reviewTitle.textContent='Review your process';var reviewLead=reviewCard.querySelector('.sub');if(reviewLead)reviewLead.textContent='Check the steps below. If Talos is unsure about something, it will ask you in normal business language.'}
    var confirmation=byId('r104BusinessConfirmation');if(confirmation){var confirmationTitle=confirmation.querySelector('h3');if(confirmationTitle)confirmationTitle.textContent='Confirm this process';var confirmationLead=confirmation.querySelector('p');if(confirmationLead)confirmationLead.textContent='Confirm only when this version matches the real business process.'}
    var design=byId('r105AutomationDesign');if(design){var designTitle=design.querySelector('h3');if(designTitle)designTitle.textContent='Set up the automation';var designLead=design.querySelector('p');if(designLead)designLead.textContent='Once the process is confirmed and complete, Talos can help decide how each step should be handled.'}
    var plan=byId('r106ExecutionPlan');if(plan){plan.classList.add('r111cFuture');var planTitle=plan.querySelector('h3');if(planTitle)planTitle.textContent='Review the automation plan'}
    var runtime=byId('r107RuntimeAuthority');if(runtime){runtime.classList.add('r111cFuture');var runtimeTitle=runtime.querySelector('h3');if(runtimeTitle)runtimeTitle.textContent='Connect and run'}
    var recovery=byId('r110Recovery');if(recovery){var recoveryTitle=recovery.querySelector('h2');if(recoveryTitle)recoveryTitle.textContent='History & recovery';var recoveryLead=recovery.querySelector('p');if(recoveryLead)recoveryLead.textContent='Your progress is saved. Talos never restarts an automation on its own after a restart.'}
    var nav=byId('r110Nav');if(nav){Array.from(nav.querySelectorAll('button')).forEach(function(button){var text=button.textContent;if(text==='Source')button.textContent='Your process';else if(text==='Automation design')button.textContent='Automation';else if(text==='ExecutionPlan')button.textContent='Plan';else if(text==='Runtime & deploy')button.textContent='Run';else if(text==='Recovery & history')button.textContent='History'})}
    simplifyTruth();
  }

  installModeToggle();installGuided();setTimeout(simplifyShell,0);
  window.addEventListener('talos:r1-04-business-process-confirmed',function(){var design=byId('r105AutomationDesign');if(design)design.classList.remove('r111cFuture');var status=byId('r111cStatus');if(status&&current.validation&&current.validation.assessment&&current.validation.assessment.executionReadiness!=='READY_FOR_AUTOMATION_DESIGN')status.textContent='Process confirmed. A few details still need your confirmation before automation setup.';setTimeout(simplifyShell,0)});
  window.addEventListener('talos:r1-05-automation-design-updated',function(){var plan=byId('r106ExecutionPlan');if(plan)plan.classList.remove('r111cFuture');setTimeout(simplifyShell,0)});
  window.addEventListener('talos:r1-06-automation-approved',function(){var runtime=byId('r107RuntimeAuthority');if(runtime)runtime.classList.remove('r111cFuture');setTimeout(simplifyShell,0)});
  window.addEventListener('talos:r1-11c-semantic-revision-created',function(){var design=byId('r105AutomationDesign'),plan=byId('r106ExecutionPlan'),runtime=byId('r107RuntimeAuthority');if(design)design.classList.add('r111cFuture');if(plan)plan.classList.add('r111cFuture');if(runtime)runtime.classList.add('r111cFuture');setTimeout(simplifyShell,0)});

  window.fetch=function(input,init){var path=typeof input==='string'?input:(input&&input.url)||'';return nativeFetch(input,init).then(async function(response){if(response.ok&&(path.indexOf('/api/input/image')!==-1||path.indexOf('/api/input/bpmn')!==-1||path.indexOf('/api/bpmn/edit')!==-1||path.indexOf('/api/bpmn/confirm')!==-1||path.indexOf('/api/process-review')!==-1)){try{capture(await response.clone().json())}catch{}}if(response.ok&&path.indexOf('/api/bpmn/automation-design-approval')!==-1){try{var body=await response.clone().json();if(body.automationDesignOpened===false||body.handoff&&body.handoff.result&&body.handoff.result!=='FROZEN')freezeBlocked()}catch{}}setTimeout(simplifyShell,0);return response})};
})();
</script>`;

export function renderR111cGuidedResolutionUxPage(basePage: string): string {
  const marker = '</body>';
  if (!basePage.includes(marker)) throw new TypeError('R1-11C guided UX requires a closing body tag');
  return basePage.replace(marker, `${R1_11C_GUIDED_RESOLUTION_UX_EXTENSION}\n${marker}`);
}
