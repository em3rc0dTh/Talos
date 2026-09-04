export const ONE_APP_PRODUCT_SIMPLE_JOURNEY_ENHANCEMENT = String.raw`
(function(){
  'use strict';

  var latestProcess=null;
  var latestProposal=null;
  var latestExecution=null;
  var latestRuntimeProfile=null;
  var compileStarted=false;
  var compileFinished=false;
  var compileTicks=0;
  var deployStarted=false;
  var deployTicks=0;
  var runStarted=false;
  var runTicks=0;
  var autoDesignStarted=false;
  var advancedOpen=false;
  var reviewRenderKey='';
  var temporalRenderKey='';
  var driveTimer=0;

  function byId(id){return document.getElementById(id)}
  function q(selector,root){return (root||document).querySelector(selector)}
  function qa(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector))}
  function text(value){return value===undefined||value===null?'':String(value)}
  function later(fn,ms){return window.setTimeout(fn,ms||0)}
  function statusText(id){var node=byId(id);return node?text(node.textContent).trim():''}
  function button(label,kind){var b=document.createElement('button');b.type='button';b.textContent=label;if(kind)b.className=kind;return b}
  function cardTitle(id,title,copy){var card=byId(id);if(!card)return;var h=q('h2',card);var p=q('p',card);if(h)h.textContent=title;if(p&&copy)p.textContent=copy}
  function hide(node){if(node&&!node.classList.contains('talos-simple-hidden'))node.classList.add('talos-simple-hidden')}
  function show(node){if(node&&node.classList.contains('talos-simple-hidden'))node.classList.remove('talos-simple-hidden')}
  function safeClick(id){var b=byId(id);if(b&&!b.disabled){b.click();return true}return false}
  function stageClass(node,state){if(!node)return;var next='talos-stage '+state;if(node.className!==next)node.className=next}
  function scheduleDrive(ms){if(driveTimer)window.clearTimeout(driveTimer);driveTimer=later(function(){driveTimer=0;drive()},ms===undefined?35:ms)}

  function installStyle(){
    if(byId('talosSimpleJourneyStyle'))return;
    var style=document.createElement('style');style.id='talosSimpleJourneyStyle';style.textContent='\
      .talos-simple-hidden{display:none!important}\
      .talos-stagebar{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 22px}\
      .talos-stage{border:1px solid var(--line);border-radius:14px;padding:12px 14px;background:#0d121a;color:#728198;display:flex;gap:10px;align-items:center;min-height:58px}\
      .talos-stage strong{display:block;color:inherit}.talos-stage small{display:block;color:var(--muted);font-weight:500}\
      .talos-stage .num{width:30px;height:30px;border-radius:50%;border:1px solid currentColor;display:grid;place-items:center;font-weight:900;flex:0 0 auto}\
      .talos-stage.active{color:var(--accent);border-color:#43649b;background:#111b2b}.talos-stage.done{color:var(--good);border-color:#285d37;background:#0f1d15}\
      .talos-stage-intro{border:1px solid #34445f;background:linear-gradient(135deg,#111a29,#0d131d);padding:14px 16px;border-radius:14px;margin-bottom:12px}\
      .talos-stage-intro h2{margin:0 0 4px;font-size:20px}.talos-stage-intro p{margin:0;color:var(--muted)}\
      .talos-canvas{border:1px solid #33445f;border-radius:16px;background:#f8fafc;margin:12px 0;padding:10px;overflow:auto;min-height:240px}\
      .talos-canvas svg{display:block;min-width:760px;width:100%;height:auto}.talos-canvas-title{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:14px}\
      .talos-canvas-title strong{font-size:15px}.talos-canvas-title small{color:var(--muted)}.talos-tools-title{margin:12px 0 5px;font-size:13px}\
      .talos-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 10px}.talos-tool{border:1px solid var(--line);border-radius:12px;padding:10px;background:#0b1018}\
      .talos-tool strong{display:block}.talos-tool small{color:var(--muted)}.talos-primary-action{padding:11px 16px!important;font-size:14px!important}\
      .talos-advanced{margin-top:14px;border-top:1px solid var(--line);padding-top:10px}.talos-advanced summary{cursor:pointer;color:var(--muted);font-weight:800}\
      .talos-engine-state{margin-top:10px;border-left:3px solid var(--accent);background:#0a1019;padding:10px 12px;border-radius:7px;color:#c8d5ea}.talos-engine-state.good{border-color:var(--good)}.talos-engine-state.warn{border-color:var(--warn)}.talos-engine-state.bad{border-color:var(--bad)}\
      #sourceCard,#reviewCard,#confirmCard,#designCard,#deployCard,#executeCard{opacity:1!important}.talos-simple-aside{display:none!important}.talos-advanced-open{display:grid!important}#talosAdvancedToggle{white-space:nowrap}\
      @media(max-width:800px){.talos-stagebar{grid-template-columns:1fr}.talos-tools{grid-template-columns:1fr}.talos-canvas svg{min-width:680px}}\
    ';document.head.appendChild(style)
  }

  function installStages(){
    var old=q('.progress');if(old)old.classList.add('talos-simple-hidden');
    if(byId('talosSimpleStages'))return;var header=q('.top');if(!header)return;var bar=document.createElement('div');bar.id='talosSimpleStages';bar.className='talos-stagebar';
    function stage(id,n,title,copy){var d=document.createElement('div');d.id=id;d.className='talos-stage';var num=document.createElement('span');num.className='num';num.textContent=n;var words=document.createElement('div');var strong=document.createElement('strong');strong.textContent=title;var small=document.createElement('small');small.textContent=copy;words.append(strong,small);d.append(num,words);return d}
    bar.append(stage('talosStageProcess','1','Process','Show me what you do'),stage('talosStageAutomation','2','Automation','Show me how Talos would run it'),stage('talosStageRun','3','Run','Deploy, execute and monitor'));header.insertAdjacentElement('afterend',bar)
  }

  function simplifyHeader(){var top=q('.top');if(!top)return;var h=q('h1',top),p=q('p',top),eyebrow=q('.eyebrow',top);if(eyebrow)eyebrow.textContent='Talos';if(h)h.textContent='Turn a real process into a running workflow.';if(p)p.textContent='Bring an image or BPMN. Confirm what Talos understood, review how Talos proposes to execute it, then run it. Technical governance stays underneath.'}

  function installAdvancedToggle(){
    if(byId('talosAdvancedToggle'))return;var badge=byId('runtimeBadge');if(!badge)return;var toggle=button('Advanced');toggle.id='talosAdvancedToggle';badge.insertAdjacentElement('beforebegin',toggle);
    toggle.addEventListener('click',function(){advancedOpen=!advancedOpen;toggle.textContent=advancedOpen?'Hide advanced':'Advanced';var aside=q('aside.stack');if(aside){if(advancedOpen)aside.classList.add('talos-advanced-open');else aside.classList.remove('talos-advanced-open')}if(advancedOpen){show(byId('planCard'));show(byId('runtimeCard'))}else{hide(byId('planCard'));hide(byId('runtimeCard'))}})
  }

  function installStageIntros(){
    if(!byId('talosProcessIntro')){var source=byId('sourceCard');if(source){var d=document.createElement('div');d.id='talosProcessIntro';d.className='talos-stage-intro';d.innerHTML='<h2>1 · Your process</h2><p>Upload the process. Talos will reconstruct it visually before any automation is approved.</p>';source.insertAdjacentElement('beforebegin',d)}}
    if(!byId('talosAutomationIntro')){var design=byId('designCard');if(design){var a=document.createElement('div');a.id='talosAutomationIntro';a.className='talos-stage-intro';a.innerHTML='<h2>2 · Proposed automation</h2><p>Talos designs the Temporal workflow and suggests the capabilities or integrations needed. You approve the design, not the plumbing.</p>';design.insertAdjacentElement('beforebegin',a)}}
    if(!byId('talosRunIntro')){var deploy=byId('deployCard');if(deploy){var r=document.createElement('div');r.id='talosRunIntro';r.className='talos-stage-intro';r.innerHTML='<h2>3 · Run</h2><p>When a Temporal runtime is configured, deploy the approved workflow and start a governed execution.</p>';deploy.insertAdjacentElement('beforebegin',r)}}
  }

  function simplifyCards(){
    cardTitle('sourceCard','Bring your process','Upload an image or BPMN. Talos preserves the source and creates a reviewable process model.');var analyze=byId('analyze');if(analyze){analyze.textContent='Understand process';analyze.classList.add('talos-primary-action')}
    cardTitle('reviewCard','This is what Talos understood','Review the process canvas. If anything material is wrong or missing, correct it before confirming.');cardTitle('confirmCard','Confirm this process','Your confirmation freezes the business meaning Talos may use for automation design.');var confirm=byId('confirmProcess');if(confirm){confirm.textContent='Confirm process';confirm.classList.add('talos-primary-action')}
    cardTitle('designCard','This is how Talos proposes to run it','Review the Temporal canvas and suggested capabilities. Approve it or ask Talos to redesign it.');hide(byId('openDesign'));cardTitle('deployCard','Deploy','Talos will realize the already-approved technical design against the configured Temporal target.');cardTitle('executeCard','Run & monitor','Start one governed workflow execution and follow its durable state.');
    var authority=q('.authority-note',byId('confirmCard'));hide(authority);var rationale=byId('confirmRationale');if(rationale)hide(rationale.closest('.field'));hide(byId('planCard'));hide(byId('runtimeCard'));hide(byId('capabilityInputs'));var aside=q('aside.stack');if(aside)aside.classList.add('talos-simple-aside');
    var review=byId('reviewCard');if(review&&!byId('talosReviewAdvanced')){var advanced=document.createElement('details');advanced.id='talosReviewAdvanced';advanced.className='talos-advanced';var summary=document.createElement('summary');summary.textContent='Advanced review evidence';advanced.appendChild(summary);['questions','findings'].forEach(function(id){var node=byId(id);if(node){var heading=node.previousElementSibling;if(heading&&heading.tagName==='H3')advanced.appendChild(heading);advanced.appendChild(node)}});var editor=byId('bpmnEditor');if(editor){var field=editor.closest('.field');if(field)advanced.appendChild(field)}var save=byId('saveCorrection');if(save&&save.parentElement)advanced.appendChild(save.parentElement);review.appendChild(advanced)}
  }

  function esc(value){return text(value).replace(/[&<>\"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]})}
  function wrapWords(label,max){var words=text(label).split(/\s+/).filter(Boolean),lines=[],line='';words.forEach(function(word){var next=line?line+' '+word:word;if(next.length>max&&line){lines.push(line);line=word}else line=next});if(line)lines.push(line);return lines.slice(0,4)}
  function shape(node){var kind=text(node&&node.kind);if(kind==='DECISION'||kind==='PARALLEL_SPLIT'||kind==='JOIN')return'diamond';if(kind==='EVENT')return'start';if(kind==='END')return'end';if(kind==='WAIT')return'wait';return'task'}

  function layoutProcess(process){
    var nodes=(process&&process.nodes)||[],edges=(process&&process.edges)||[],incoming={},outgoing={};nodes.forEach(function(n){incoming[n.id]=[];outgoing[n.id]=[]});edges.forEach(function(e){if(outgoing[e.sourceNodeId])outgoing[e.sourceNodeId].push(e);if(incoming[e.targetNodeId])incoming[e.targetNodeId].push(e)});
    var roots=nodes.filter(function(n){return n.kind==='EVENT'||(incoming[n.id]||[]).length===0});if(!roots.length&&nodes.length)roots=[nodes[0]];var rank={},queue=[];roots.forEach(function(n){if(rank[n.id]===undefined){rank[n.id]=0;queue.push(n.id)}});while(queue.length){var id=queue.shift();(outgoing[id]||[]).forEach(function(e){if(rank[e.targetNodeId]===undefined){rank[e.targetNodeId]=(rank[id]||0)+1;queue.push(e.targetNodeId)}})}nodes.forEach(function(n){if(rank[n.id]===undefined)rank[n.id]=0});
    var columns={};nodes.forEach(function(n){var r=rank[n.id]||0;(columns[r]||(columns[r]=[])).push(n)});var pos={},xGap=220,yGap=150,margin=90;Object.keys(columns).forEach(function(k){columns[k].forEach(function(n,i){pos[n.id]={x:margin+Number(k)*xGap,y:margin+i*yGap}})});var ranks=Object.keys(columns).map(Number),maxRank=Math.max.apply(null,ranks.concat([0])),maxRows=Math.max.apply(null,Object.keys(columns).map(function(k){return columns[k].length}).concat([1]));return{nodes:nodes,edges:edges,positions:pos,width:Math.max(850,margin*2+maxRank*xGap+190),height:Math.max(320,margin*2+(maxRows-1)*yGap+130)}
  }

  function svgNode(node,pos,mode,maps){
    var kind=shape(node),x=pos.x,y=pos.y,label=text(node&&node.name)||text(node&&node.kind)||'Process step',lines=wrapWords(label,23),fill='#eef4ff',stroke='#3976c5',badge='';
    if(mode==='temporal'){var step=maps.stepBySubject[node.id],orch=maps.orchBySubject[node.id];if(orch){badge=orch.proposedTreatment;if(badge==='DURABLE_TIMER'||badge==='WORKFLOW_CONDITION'){fill='#f4edff';stroke='#8b5cc7'}else if(badge==='DETERMINISTIC_BRANCH'){fill='#fff8d8';stroke='#c18b00'}}else if(step){badge=step.proposedFamily==='HUMAN_INTERACTION'?'HUMAN TASK':step.implementationKind;fill=step.proposedFamily==='HUMAN_INTERACTION'?'#eef4ff':'#e9f9ef';stroke=step.proposedFamily==='HUMAN_INTERACTION'?'#3976c5':'#31915b'}}
    if(kind==='diamond'){var points=x+','+(y-55)+' '+(x+75)+','+y+' '+x+','+(y+55)+' '+(x-75)+','+y,out='<polygon points="'+points+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';lines.forEach(function(line,i){out+='<text x="'+x+'" y="'+(y-8+i*17)+'" text-anchor="middle" font-size="13" font-family="Arial" fill="#172033">'+esc(line)+'</text>'});if(badge)out+='<text x="'+x+'" y="'+(y+76)+'" text-anchor="middle" font-size="10" font-weight="700" font-family="Arial" fill="'+stroke+'">'+esc(badge)+'</text>';return out}
    if(kind==='start'||kind==='end'){var c='<circle cx="'+x+'" cy="'+y+'" r="34" fill="'+(kind==='start'?'#eaf9df':'#fff0f0')+'" stroke="'+(kind==='start'?'#46a51f':'#d83b3b')+'" stroke-width="3"/>';if(kind==='end')c+='<circle cx="'+x+'" cy="'+y+'" r="27" fill="none" stroke="#d83b3b" stroke-width="2"/>';c+='<text x="'+x+'" y="'+(y+53)+'" text-anchor="middle" font-size="12" font-family="Arial" fill="#172033">'+esc(label)+'</text>';return c}
    var w=170,h=86,out='<rect x="'+(x-w/2)+'" y="'+(y-h/2)+'" width="'+w+'" height="'+h+'" rx="14" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';lines.forEach(function(line,i){out+='<text x="'+x+'" y="'+(y-10+i*17)+'" text-anchor="middle" font-size="13" font-family="Arial" fill="#172033">'+esc(line)+'</text>'});if(badge)out+='<text x="'+x+'" y="'+(y+34)+'" text-anchor="middle" font-size="9" font-weight="700" font-family="Arial" fill="'+stroke+'">'+esc(badge)+'</text>';return out
  }

  function renderSvg(process,mode,proposal){
    if(!process)return'<div class="status warn">Talos has not produced a process model yet.</div>';var l=layoutProcess(process),maps={stepBySubject:{},orchBySubject:{}};if(proposal){(proposal.steps||[]).forEach(function(step){(step.semanticSubjectRefs||[]).forEach(function(ref){maps.stepBySubject[ref]=step})});(proposal.orchestration||[]).forEach(function(o){if(o.semanticSubjectRef)maps.orchBySubject[o.semanticSubjectRef]=o})}
    var marker='talosArrow'+mode,svg='<svg viewBox="0 0 '+l.width+' '+l.height+'" role="img"><defs><marker id="'+marker+'" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#293241"/></marker></defs>';
    l.edges.forEach(function(e){var a=l.positions[e.sourceNodeId],b=l.positions[e.targetNodeId];if(!a||!b)return;var x1=a.x+(shape(l.nodes.find(function(n){return n.id===e.sourceNodeId}))==='diamond'?76:80),x2=b.x-80,mid=(x1+x2)/2;svg+='<path d="M'+x1+' '+a.y+' C'+mid+' '+a.y+' '+mid+' '+b.y+' '+x2+' '+b.y+'" fill="none" stroke="#293241" stroke-width="2" marker-end="url(#'+marker+')"/>';if(e.label)svg+='<text x="'+mid+'" y="'+(Math.min(a.y,b.y)-8)+'" text-anchor="middle" font-size="11" font-weight="700" font-family="Arial" fill="#293241">'+esc(e.label)+'</text>'});l.nodes.forEach(function(n){svg+=svgNode(n,l.positions[n.id],mode,maps)});return svg+'</svg>'
  }

  function ensureReviewCanvas(){var review=byId('reviewCard');if(!review)return null;var canvas=byId('talosBpmnCanvas');if(canvas)return canvas;var title=document.createElement('div');title.className='talos-canvas-title';title.innerHTML='<strong>BPMN review canvas</strong><small>What Talos understood from the source</small>';canvas=document.createElement('div');canvas.id='talosBpmnCanvas';canvas.className='talos-canvas';var nodes=byId('processNodes');if(nodes){nodes.insertAdjacentElement('beforebegin',title);title.insertAdjacentElement('afterend',canvas)}else review.append(title,canvas);return canvas}
  function renderReviewCanvas(){if(!latestProcess)return;var key=text(latestProcess.id)+'|'+(latestProcess.nodes||[]).length+'|'+(latestProcess.edges||[]).length;if(key===reviewRenderKey)return;reviewRenderKey=key;var canvas=ensureReviewCanvas();if(canvas)canvas.innerHTML=renderSvg(latestProcess,'bpmn',null)}

  function ensureTemporalCanvas(){var panel=byId('aiAutomationProposal');if(!panel)return null;var canvas=byId('talosTemporalCanvas');if(canvas)return canvas;var title=document.createElement('div');title.className='talos-canvas-title';title.innerHTML='<strong>Temporal workflow canvas</strong><small>Suggested execution design · not deployed</small>';canvas=document.createElement('div');canvas.id='talosTemporalCanvas';canvas.className='talos-canvas';var toolsTitle=document.createElement('h3');toolsTitle.className='talos-tools-title';toolsTitle.textContent='Suggested tools & capabilities';var tools=document.createElement('div');tools.id='talosSuggestedTools';tools.className='talos-tools';panel.append(title,canvas,toolsTitle,tools);return canvas}
  function renderSuggestedTools(){var box=byId('talosSuggestedTools');if(!box||!latestProposal)return;box.innerHTML='';var seen={};(latestProposal.steps||[]).forEach(function(step){var k=step.proposedFamily+'|'+step.implementationKind+'|'+step.implementationRef;if(seen[k])return;seen[k]=true;var d=document.createElement('div');d.className='talos-tool';var strong=document.createElement('strong');strong.textContent=step.canonicalName||step.proposedFamily;var small=document.createElement('small');small.textContent=step.proposedFamily==='HUMAN_INTERACTION'?'Talos human coordination':step.implementationKind+' · '+step.implementationRef;d.append(strong,small);box.appendChild(d)});if(!box.children.length){var n=document.createElement('div');n.className='talos-tool';n.innerHTML='<strong>No external tools required</strong><small>The proposal stays inside workflow-native coordination.</small>';box.appendChild(n)}}
  function renderTemporalCanvas(){if(!latestProcess||!latestProposal)return;var key=text(latestProposal.proposalDigest||latestProposal.id)+'|'+text(latestProcess.id);if(key===temporalRenderKey)return;temporalRenderKey=key;var canvas=ensureTemporalCanvas();if(canvas){canvas.innerHTML=renderSvg(latestProcess,'temporal',latestProposal);renderSuggestedTools();renameAiActions()}}

  function renameAiActions(){var panel=byId('aiAutomationProposal');if(!panel)return;qa('button',panel).forEach(function(b){var t=text(b.textContent).trim();if(t==='Accept AI automation design')b.textContent='Approve automation';else if(t==='Design accepted')b.textContent='Automation approved';else if(t==='Reject design')b.textContent='Reject';else if(t==='Redesign with Gemini')b.textContent='Redesign'})}
  function installCompileState(){var design=byId('designCard');if(design&&!byId('talosCompileState')){var s=document.createElement('div');s.id='talosCompileState';s.className='talos-engine-state';s.textContent='Confirm the process to let Talos design the automation.';design.appendChild(s)}}
  function setCompile(message,kind){var node=byId('talosCompileState');if(node){node.textContent=message;node.className='talos-engine-state '+(kind||'')}}

  function autoOpenDesignAfterConfirmation(){if(autoDesignStarted||statusText('confirmationState')!=='CONFIRMED')return;var open=byId('openDesign');if(open&&!open.disabled){autoDesignStarted=true;setCompile('Gemini is preparing the Temporal workflow proposal…','');open.click()}}
  function applyProposedMappingChoices(){if(!latestExecution||!latestProposal)return;var elementById={};(latestExecution.elements||[]).forEach(function(x){elementById[x.id]=x});var orchBySubject={};(latestProposal.orchestration||[]).forEach(function(o){if(o.semanticSubjectRef)orchBySubject[o.semanticSubjectRef]=o});qa('#mappingChoices [data-element]').forEach(function(row){var element=elementById[row.dataset.element],select=q('select',row);if(!element||!select)return;var refs=Array.isArray(element.semanticSubjectRefs)?element.semanticSubjectRefs.slice():(element.semanticSubjectRef?[element.semanticSubjectRef]:[]),desired='';refs.some(function(ref){var o=orchBySubject[ref];if(o&&(o.proposedTreatment==='DURABLE_TIMER'||o.proposedTreatment==='WORKFLOW_CONDITION')){desired=o.proposedTreatment;return true}return false});if(desired&&qa('option',select).some(function(o){return o.value===desired}))select.value=desired})}

  function startCompileIfReady(){if(compileStarted)return;if(statusText('designState').indexOf('CAPABILITIES BOUND')===-1)return;compileStarted=true;compileTicks=0;setCompile('Talos is validating and compiling the approved automation…','');continueCompile()}
  function continueCompile(){
    if(!compileStarted||compileFinished)return;if(++compileTicks>120){setCompile('Compilation did not settle in time. Open Advanced for the blocking gate.','warn');return}
    var ps=statusText('planState');if(ps.indexOf('BLOCKED')>=0||ps.indexOf('NEEDS_EXECUTION_DESIGN')>=0){setCompile('Talos needs one material clarification before it can compile this automation.','warn');return}
    if(byId('buildPlan')&&!byId('buildPlan').disabled&&!ps.match(/READY|APPROVED/)){safeClick('buildPlan');later(continueCompile,80);return}
    if(byId('approveAutomation')&&!byId('approveAutomation').disabled){safeClick('approveAutomation');later(continueCompile,80);return}
    if(byId('mapTemporal')&&!byId('mapTemporal').disabled){applyProposedMappingChoices();safeClick('mapTemporal');later(continueCompile,80);return}
    if(byId('recordRuntimePolicy')&&!byId('recordRuntimePolicy').disabled){safeClick('recordRuntimePolicy');later(continueCompile,80);return}
    later(continueCompile,100)
  }
  function markCompiled(){if(compileFinished)return;compileFinished=true;setCompile('Automation compiled and governed. Ready to deploy when a Temporal runtime is available.','good');installSimpleRunActions();updateStages()}

  function installSimpleRunActions(){
    var deploy=byId('deployCard');if(deploy&&!byId('talosDeployOnce')){var old=byId('designDeployment')&&byId('designDeployment').parentElement;hide(old);var b=button('Deploy approved workflow','primary talos-primary-action');b.id='talosDeployOnce';b.disabled=!(latestRuntimeProfile&&latestRuntimeProfile.temporalExecutionAvailable);deploy.appendChild(b);b.addEventListener('click',function(){if(deployStarted)return;deployStarted=true;deployTicks=0;b.disabled=true;b.textContent='Deploying…';continueDeploy()})}
    var execute=byId('executeCard');if(execute&&!byId('talosRunOnce')){qa('.field',execute).forEach(hide);var oldActions=byId('approveExecution')&&byId('approveExecution').parentElement;hide(oldActions);var r=button('Run workflow','primary talos-primary-action');r.id='talosRunOnce';r.disabled=true;execute.appendChild(r);r.addEventListener('click',function(){if(runStarted)return;runStarted=true;runTicks=0;r.disabled=true;r.textContent='Starting…';continueRun()})}
  }
  function continueDeploy(){if(!deployStarted)return;if(++deployTicks>120){var h=byId('talosDeployOnce');if(h){h.textContent='Deploy timed out';h.disabled=false}deployStarted=false;return}if(safeClick('designDeployment')||safeClick('realizeEnvironment')||safeClick('approveDeployment')||safeClick('deployWorker')){later(continueDeploy,100);return}if(statusText('truthDeployment').indexOf('Worker deployed')>=0){var high=byId('talosDeployOnce');if(high){high.textContent='Deployed';high.className='good talos-primary-action'}var run=byId('talosRunOnce');if(run)run.disabled=false;updateStages();return}later(continueDeploy,120)}
  function continueRun(){if(!runStarted)return;if(++runTicks>120){var h=byId('talosRunOnce');if(h){h.textContent='Run timed out';h.disabled=false}runStarted=false;return}if(safeClick('approveExecution')||safeClick('startExecution')){later(continueRun,120);return}var st=statusText('executionState'),high=byId('talosRunOnce');if(st.indexOf('completed')>=0||statusText('truthExecution').indexOf('COMPLETED')>=0){if(high){high.textContent='Completed';high.className='good talos-primary-action'}updateStages();return}if(st.indexOf('RUNNING')>=0||st.indexOf('waiting')>=0){if(high){high.textContent='Running';high.className='good talos-primary-action'}updateStages();return}later(continueRun,140)}

  function updateStages(){var confirmed=statusText('confirmationState')==='CONFIRMED',executed=statusText('truthExecution').indexOf('COMPLETED')>=0,deployed=statusText('truthDeployment').indexOf('Worker deployed')>=0;stageClass(byId('talosStageProcess'),confirmed?'done':'active');stageClass(byId('talosStageAutomation'),compileFinished?'done':confirmed?'active':'');stageClass(byId('talosStageRun'),executed?'done':compileFinished?'active':'');var aiIntro=byId('talosAutomationIntro'),design=byId('designCard'),runIntro=byId('talosRunIntro'),deploy=byId('deployCard'),execute=byId('executeCard');if(confirmed){show(aiIntro);show(design)}else{hide(aiIntro);hide(design)}if(compileFinished){show(runIntro);show(deploy)}else{hide(runIntro);hide(deploy)}if(deployed)show(execute);else hide(execute)}

  function routeOf(response){try{return new URL(response.url,window.location.href).pathname}catch(_){return''}}
  function captureJson(response,payload){
    if(!response||!response.ok||!payload)return;var path=routeOf(response);
    if(path.indexOf('/api/process-review')!==-1){var p=payload.reconciliation&&payload.reconciliation.processRevision;if(p){latestProcess=p;renderReviewCanvas()}}
    if(path.indexOf('/api/bpmn/confirm')!==-1){later(function(){autoOpenDesignAfterConfirmation();updateStages()},60)}
    if(path.indexOf('/api/automation/proposal/generate')!==-1){var routing=payload.routing||{},selected=routing.selectedProposal;if(selected){latestProposal=selected;later(renderTemporalCanvas,20)}}
    if(path.indexOf('/api/automation/proposal/bind')!==-1)later(startCompileIfReady,60);
    if(path.indexOf('/api/automation/execution-plan/review')!==-1&&payload.execution){latestExecution=payload.execution;later(continueCompile,40)}
    if(path.indexOf('/api/automation/approve')!==-1||path.indexOf('/api/automation/temporal-mapping')!==-1)later(continueCompile,50);
    if(path.indexOf('/api/automation/runtime-policy')!==-1){markCompiled()}
    if(path.indexOf('/api/automation/deployment-')!==-1||path.indexOf('/api/automation/environment-realization')!==-1||path.indexOf('/api/automation/deployment/')!==-1)later(continueDeploy,50);
    if(path.indexOf('/api/automation/execution/')!==-1)later(continueRun,60);
    if(path.indexOf('/api/product/runtime-profile')!==-1){latestRuntimeProfile=payload;installSimpleRunActions();var b=byId('talosDeployOnce');if(b&&!deployStarted)b.disabled=!payload.temporalExecutionAvailable}
    scheduleDrive(25)
  }

  function installResponseTap(){
    if(Response.prototype.__talosSimpleJourneyJson)return;var nativeJson=Response.prototype.json;
    Object.defineProperty(Response.prototype,'__talosSimpleJourneyJson',{value:true,configurable:false});
    Response.prototype.json=function(){var response=this;return nativeJson.call(this).then(function(payload){try{captureJson(response,payload)}catch(_){}return payload})}
  }

  function drive(){renameAiActions();autoOpenDesignAfterConfirmation();startCompileIfReady();renderReviewCanvas();renderTemporalCanvas();installSimpleRunActions();updateStages()}

  installResponseTap();installStyle();simplifyHeader();installStages();installAdvancedToggle();installStageIntros();ensureReviewCanvas();simplifyCards();installCompileState();installSimpleRunActions();updateStages();
  fetch('/api/product/runtime-profile').then(function(r){return r.ok?r.json():null}).then(function(profile){if(profile){latestRuntimeProfile=profile;drive()}}).catch(function(){});
})();
`;
