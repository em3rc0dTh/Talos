export const ONE_APP_PRODUCT_SIMPLE_JOURNEY_ENHANCEMENT = String.raw`
(function(){
  'use strict';

  var nativeFetch=window.fetch.bind(window);
  var latestProcess=null;
  var latestProposal=null;
  var latestExecution=null;
  var latestRuntimeProfile=null;
  var compileStarted=false;
  var compileFinished=false;
  var deployStarted=false;
  var runStarted=false;
  var autoDesignStarted=false;
  var advancedOpen=false;

  function byId(id){return document.getElementById(id)}
  function q(selector,root){return (root||document).querySelector(selector)}
  function qa(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector))}
  function text(value){return value===undefined||value===null?'':String(value)}
  function later(fn,ms){return window.setTimeout(fn,ms||0)}
  function statusText(id){var node=byId(id);return node?text(node.textContent).trim():''}
  function button(label,kind){var b=document.createElement('button');b.type='button';b.textContent=label;if(kind)b.className=kind;return b}
  function cardTitle(id,title,copy){var card=byId(id);if(!card)return;var h=q('h2',card);var p=q('p',card);if(h)h.textContent=title;if(p&&copy)p.textContent=copy}
  function hide(node){if(node)node.classList.add('talos-simple-hidden')}
  function show(node){if(node)node.classList.remove('talos-simple-hidden')}
  function safeClick(id){var b=byId(id);if(b&&!b.disabled){b.click();return true}return false}
  function stageClass(node,state){if(!node)return;node.className='talos-stage '+state}

  function installStyle(){
    if(byId('talosSimpleJourneyStyle'))return;
    var style=document.createElement('style');style.id='talosSimpleJourneyStyle';style.textContent='\
      .talos-simple-hidden{display:none!important}\
      .talos-stagebar{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 22px}\
      .talos-stage{border:1px solid var(--line);border-radius:14px;padding:12px 14px;background:#0d121a;color:#728198;display:flex;gap:10px;align-items:center;min-height:58px}\
      .talos-stage strong{display:block;color:inherit}.talos-stage small{display:block;color:var(--muted);font-weight:500}\
      .talos-stage .num{width:30px;height:30px;border-radius:50%;border:1px solid currentColor;display:grid;place-items:center;font-weight:900;flex:0 0 auto}\
      .talos-stage.active{color:var(--accent);border-color:#43649b;background:#111b2b}\
      .talos-stage.done{color:var(--good);border-color:#285d37;background:#0f1d15}\
      .talos-stage.blocked{color:var(--warn);border-color:#655428;background:#211b0d}\
      .talos-stage-intro{border:1px solid #34445f;background:linear-gradient(135deg,#111a29,#0d131d);padding:14px 16px;border-radius:14px;margin-bottom:12px}\
      .talos-stage-intro h2{margin:0 0 4px;font-size:20px}.talos-stage-intro p{margin:0;color:var(--muted)}\
      .talos-canvas{border:1px solid #33445f;border-radius:16px;background:#f8fafc;margin:12px 0;padding:10px;overflow:auto;min-height:240px}\
      .talos-canvas svg{display:block;min-width:760px;width:100%;height:auto}\
      .talos-canvas-title{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:14px}\
      .talos-canvas-title strong{font-size:15px}.talos-canvas-title small{color:var(--muted)}\
      .talos-tools-title{margin:12px 0 5px;font-size:13px}\
      .talos-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 10px}\
      .talos-tool{border:1px solid var(--line);border-radius:12px;padding:10px;background:#0b1018}.talos-tool strong{display:block}.talos-tool small{color:var(--muted)}\
      .talos-primary-action{padding:11px 16px!important;font-size:14px!important}\
      .talos-advanced{margin-top:14px;border-top:1px solid var(--line);padding-top:10px}\
      .talos-advanced summary{cursor:pointer;color:var(--muted);font-weight:800}\
      .talos-engine-state{margin-top:10px;border-left:3px solid var(--accent);background:#0a1019;padding:10px 12px;border-radius:7px;color:#c8d5ea}\
      .talos-engine-state.good{border-color:var(--good)}.talos-engine-state.warn{border-color:var(--warn)}.talos-engine-state.bad{border-color:var(--bad)}\
      #sourceCard,#reviewCard,#confirmCard,#designCard,#deployCard,#executeCard{opacity:1!important}\
      #reviewCard.closed,#confirmCard.closed,#designCard.closed,#deployCard.closed,#executeCard.closed{opacity:.55}\
      .talos-simple-aside{display:none!important}\
      .talos-advanced-open{display:grid!important}\
      #talosAdvancedToggle{white-space:nowrap}\
      @media(max-width:800px){.talos-stagebar{grid-template-columns:1fr}.talos-tools{grid-template-columns:1fr}.talos-canvas svg{min-width:680px}}\
    ';
    document.head.appendChild(style);
  }

  function installStages(){
    var old=q('.progress');if(old)old.classList.add('talos-simple-hidden');
    if(byId('talosSimpleStages'))return;
    var header=q('.top');if(!header)return;
    var bar=document.createElement('div');bar.id='talosSimpleStages';bar.className='talos-stagebar';
    function stage(id,n,title,copy){var d=document.createElement('div');d.id=id;d.className='talos-stage';var num=document.createElement('span');num.className='num';num.textContent=n;var words=document.createElement('div');var strong=document.createElement('strong');strong.textContent=title;var small=document.createElement('small');small.textContent=copy;words.append(strong,small);d.append(num,words);return d}
    bar.append(stage('talosStageProcess','1','Process','Show me what you do'),stage('talosStageAutomation','2','Automation','Show me how Talos would run it'),stage('talosStageRun','3','Run','Deploy, execute and monitor'));
    header.insertAdjacentElement('afterend',bar);
  }

  function simplifyHeader(){
    var top=q('.top');if(!top)return;
    var h=q('h1',top);var p=q('p',top);var eyebrow=q('.eyebrow',top);
    if(eyebrow)eyebrow.textContent='Talos';
    if(h)h.textContent='Turn a real process into a running workflow.';
    if(p)p.textContent='Bring an image or BPMN. Confirm what Talos understood, review how Talos proposes to execute it, then run it. Technical governance stays underneath.';
  }

  function installAdvancedToggle(){
    if(byId('talosAdvancedToggle'))return;var top=q('.top');var badge=byId('runtimeBadge');if(!top||!badge)return;
    var toggle=button('Advanced');toggle.id='talosAdvancedToggle';badge.insertAdjacentElement('beforebegin',toggle);
    toggle.addEventListener('click',function(){advancedOpen=!advancedOpen;toggle.textContent=advancedOpen?'Hide advanced':'Advanced';var aside=q('aside.stack');if(aside){if(advancedOpen)aside.classList.add('talos-advanced-open');else aside.classList.remove('talos-advanced-open')}var plan=byId('planCard'),runtime=byId('runtimeCard');if(advancedOpen){show(plan);show(runtime)}else{hide(plan);hide(runtime)}})
  }

  function installStageIntros(){
    if(!byId('talosProcessIntro')){var source=byId('sourceCard');if(source){var d=document.createElement('div');d.id='talosProcessIntro';d.className='talos-stage-intro';d.innerHTML='<h2>1 · Your process</h2><p>Upload the process. Talos will reconstruct it visually before any automation is approved.</p>';source.insertAdjacentElement('beforebegin',d)}}
    if(!byId('talosAutomationIntro')){var design=byId('designCard');if(design){var a=document.createElement('div');a.id='talosAutomationIntro';a.className='talos-stage-intro';a.innerHTML='<h2>2 · Proposed automation</h2><p>Talos designs the Temporal workflow and suggests the capabilities or integrations needed. You approve the design, not the plumbing.</p>';design.insertAdjacentElement('beforebegin',a)}}
    if(!byId('talosRunIntro')){var deploy=byId('deployCard');if(deploy){var r=document.createElement('div');r.id='talosRunIntro';r.className='talos-stage-intro';r.innerHTML='<h2>3 · Run</h2><p>When a Temporal runtime is configured, deploy the approved workflow and start a governed execution.</p>';deploy.insertAdjacentElement('beforebegin',r)}}
  }

  function simplifyCards(){
    cardTitle('sourceCard','Bring your process','Upload an image or BPMN. Talos preserves the source and creates a reviewable process model.');
    var analyze=byId('analyze');if(analyze){analyze.textContent='Understand process';analyze.classList.add('talos-primary-action')}
    cardTitle('reviewCard','This is what Talos understood','Review the process canvas. If anything material is wrong or missing, correct it before confirming.');
    cardTitle('confirmCard','Confirm this process','Your confirmation freezes the business meaning Talos may use for automation design.');
    var confirm=byId('confirmProcess');if(confirm){confirm.textContent='Confirm process';confirm.classList.add('talos-primary-action')}
    cardTitle('designCard','This is how Talos proposes to run it','Review the Temporal canvas and suggested capabilities. Approve it or ask Talos to redesign it.');
    var open=byId('openDesign');if(open)hide(open);
    cardTitle('deployCard','Deploy','Talos will realize the already-approved technical design against the configured Temporal target.');
    cardTitle('executeCard','Run & monitor','Start one governed workflow execution and follow its durable state.');
    var authority=q('.authority-note',byId('confirmCard'));hide(authority);
    var rationale=byId('confirmRationale');if(rationale){var field=rationale.closest('.field');hide(field)}
    hide(byId('planCard'));hide(byId('runtimeCard'));
    var aside=q('aside.stack');if(aside)aside.classList.add('talos-simple-aside');
    var review=byId('reviewCard');if(review&&!byId('talosReviewAdvanced')){
      var advanced=document.createElement('details');advanced.id='talosReviewAdvanced';advanced.className='talos-advanced';var summary=document.createElement('summary');summary.textContent='Advanced review evidence';advanced.appendChild(summary);
      ['questions','findings'].forEach(function(id){var node=byId(id);if(node){var heading=node.previousElementSibling;if(heading&&heading.tagName==='H3')advanced.appendChild(heading);advanced.appendChild(node)}});
      var editor=byId('bpmnEditor');if(editor){var editorField=editor.closest('.field');if(editorField)advanced.appendChild(editorField)}
      var save=byId('saveCorrection');if(save){var row=save.parentElement;if(row)advanced.appendChild(row)}
      review.appendChild(advanced);
    }
  }

  function nodeLabel(node){return text(node&&node.name)||text(node&&node.kind)||'Process step'}
  function nodeShapeKind(node){var kind=text(node&&node.kind);if(kind==='DECISION'||kind==='PARALLEL_SPLIT'||kind==='JOIN')return 'diamond';if(kind==='EVENT')return 'start';if(kind==='END')return 'end';if(kind==='WAIT')return 'wait';return 'task'}
  function esc(value){return text(value).replace(/[&<>\"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]})}
  function wrapWords(label,max){var words=text(label).split(/\s+/).filter(Boolean);var lines=[];var line='';words.forEach(function(word){var next=line?line+' '+word:word;if(next.length>max&&line){lines.push(line);line=word}else line=next});if(line)lines.push(line);return lines.slice(0,4)}

  function layoutProcess(process){
    var nodes=(process&&process.nodes)||[];var edges=(process&&process.edges)||[];var incoming={};var outgoing={};nodes.forEach(function(n){incoming[n.id]=[];outgoing[n.id]=[]});edges.forEach(function(e){if(outgoing[e.sourceNodeId])outgoing[e.sourceNodeId].push(e);if(incoming[e.targetNodeId])incoming[e.targetNodeId].push(e)});
    var roots=nodes.filter(function(n){return (incoming[n.id]||[]).length===0||n.kind==='EVENT'});if(!roots.length&&nodes.length)roots=[nodes[0]];var rank={};var queue=[];roots.forEach(function(n){rank[n.id]=0;queue.push(n.id)});var guard=0;
    while(queue.length&&guard<5000){guard++;var id=queue.shift();(outgoing[id]||[]).forEach(function(e){var next=e.targetNodeId;var proposed=(rank[id]||0)+1;if(rank[next]===undefined||proposed>rank[next]){rank[next]=Math.min(proposed,nodes.length+2);queue.push(next)}})}nodes.forEach(function(n){if(rank[n.id]===undefined)rank[n.id]=0});
    var columns={};nodes.forEach(function(n){var r=rank[n.id]||0;(columns[r]||(columns[r]=[])).push(n)});var positions={};var xGap=220,yGap=150,margin=90;Object.keys(columns).sort(function(a,b){return Number(a)-Number(b)}).forEach(function(key){columns[key].forEach(function(n,i){positions[n.id]={x:margin+Number(key)*xGap,y:margin+i*yGap}})});var maxRank=Math.max.apply(null,Object.keys(columns).map(Number).concat([0]));var maxRows=Math.max.apply(null,Object.keys(columns).map(function(k){return columns[k].length}).concat([1]));return{nodes:nodes,edges:edges,positions:positions,width:Math.max(850,margin*2+maxRank*xGap+190),height:Math.max(320,margin*2+(maxRows-1)*yGap+130)}
  }

  function svgNode(node,pos,mode,proposalMaps){
    var kind=nodeShapeKind(node),x=pos.x,y=pos.y,label=nodeLabel(node),lines=wrapWords(label,23),fill='#eef4ff',stroke='#3976c5',badge='';
    if(mode==='temporal'){var step=proposalMaps&&proposalMaps.stepBySubject[node.id];var orch=proposalMaps&&proposalMaps.orchBySubject[node.id];if(orch){badge=orch.proposedTreatment;if(orch.proposedTreatment==='DURABLE_TIMER'||orch.proposedTreatment==='WORKFLOW_CONDITION'){fill='#f4edff';stroke='#8b5cc7'}else if(orch.proposedTreatment==='DETERMINISTIC_BRANCH'){fill='#fff8d8';stroke='#c18b00'}}else if(step){badge=step.proposedFamily==='HUMAN_INTERACTION'?'HUMAN TASK':step.implementationKind;fill=step.proposedFamily==='HUMAN_INTERACTION'?'#eef4ff':'#e9f9ef';stroke=step.proposedFamily==='HUMAN_INTERACTION'?'#3976c5':'#31915b'}}if(kind==='wait'){fill='#f4edff';stroke='#8b5cc7'}
    if(kind==='diamond'){var points=x+','+(y-55)+' '+(x+75)+','+y+' '+x+','+(y+55)+' '+(x-75)+','+y;var out='<polygon points="'+points+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';lines.forEach(function(line,i){out+='<text x="'+x+'" y="'+(y-8+i*17)+'" text-anchor="middle" font-size="13" font-family="Arial" fill="#172033">'+esc(line)+'</text>'});if(badge)out+='<text x="'+x+'" y="'+(y+76)+'" text-anchor="middle" font-size="10" font-weight="700" font-family="Arial" fill="'+stroke+'">'+esc(badge)+'</text>';return out}
    if(kind==='start'||kind==='end'){var outCircle='<circle cx="'+x+'" cy="'+y+'" r="34" fill="'+(kind==='start'?'#eaf9df':'#fff0f0')+'" stroke="'+(kind==='start'?'#46a51f':'#d83b3b')+'" stroke-width="3"/>';if(kind==='end')outCircle+='<circle cx="'+x+'" cy="'+y+'" r="27" fill="none" stroke="#d83b3b" stroke-width="2"/>';outCircle+='<text x="'+x+'" y="'+(y+53)+'" text-anchor="middle" font-size="12" font-family="Arial" fill="#172033">'+esc(label==='EVENT'?'Start':label==='END'?'End':label)+'</text>';return outCircle}
    var width=170,height=86;var outBox='<rect x="'+(x-width/2)+'" y="'+(y-height/2)+'" width="'+width+'" height="'+height+'" rx="14" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';lines.forEach(function(line,i){outBox+='<text x="'+x+'" y="'+(y-10+i*17)+'" text-anchor="middle" font-size="13" font-family="Arial" fill="#172033">'+esc(line)+'</text>'});if(badge)outBox+='<text x="'+x+'" y="'+(y+34)+'" text-anchor="middle" font-size="9" font-weight="700" font-family="Arial" fill="'+stroke+'">'+esc(badge)+'</text>';return outBox
  }

  function renderSvg(process,mode,proposal){
    if(!process)return '<div class="status warn">Talos has not produced a process model yet.</div>';var layout=layoutProcess(process);var maps={stepBySubject:{},orchBySubject:{}};if(proposal){(proposal.steps||[]).forEach(function(step){(step.semanticSubjectRefs||[]).forEach(function(ref){maps.stepBySubject[ref]=step})});(proposal.orchestration||[]).forEach(function(item){maps.orchBySubject[item.semanticSubjectRef]=item})}
    var svg='<svg viewBox="0 0 '+layout.width+' '+layout.height+'" role="img" aria-label="'+(mode==='temporal'?'Temporal workflow proposal':'BPMN process review')+'"><defs><marker id="talosArrow'+mode+'" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#293241"/></marker></defs>';
    layout.edges.forEach(function(e){var a=layout.positions[e.sourceNodeId],b=layout.positions[e.targetNodeId];if(!a||!b)return;var x1=a.x+80,y1=a.y,x2=b.x-80,y2=b.y;if(nodeShapeKind((layout.nodes||[]).find(function(n){return n.id===e.sourceNodeId}))==='diamond')x1=a.x+76;var mid=(x1+x2)/2;svg+='<path d="M'+x1+' '+y1+' C'+mid+' '+y1+' '+mid+' '+y2+' '+x2+' '+y2+'" fill="none" stroke="#293241" stroke-width="2" marker-end="url(#talosArrow'+mode+')"/>';var label=text(e.label);if(label)svg+='<text x="'+mid+'" y="'+(Math.min(y1,y2)-8)+'" text-anchor="middle" font-size="11" font-weight="700" font-family="Arial" fill="#293241">'+esc(label)+'</text>'});layout.nodes.forEach(function(n){svg+=svgNode(n,layout.positions[n.id],mode,maps)});svg+='</svg>';return svg
  }

  function ensureReviewCanvas(){var review=byId('reviewCard');if(!review)return null;var existing=byId('talosBpmnCanvas');if(existing)return existing;var title=document.createElement('div');title.className='talos-canvas-title';title.innerHTML='<strong>BPMN review canvas</strong><small>What Talos understood from the source</small>';var canvas=document.createElement('div');canvas.id='talosBpmnCanvas';canvas.className='talos-canvas';var nodes=byId('processNodes');if(nodes){nodes.insertAdjacentElement('beforebegin',title);title.insertAdjacentElement('afterend',canvas)}else review.append(title,canvas);return canvas}
  function renderReviewCanvas(){var canvas=ensureReviewCanvas();if(canvas)canvas.innerHTML=renderSvg(latestProcess,'bpmn',null)}

  function ensureTemporalCanvas(){var panel=byId('aiAutomationProposal');if(!panel)return null;var existing=byId('talosTemporalCanvas');if(existing)return existing;var title=document.createElement('div');title.className='talos-canvas-title';title.innerHTML='<strong>Temporal workflow canvas</strong><small>Suggested execution design · not deployed</small>';var canvas=document.createElement('div');canvas.id='talosTemporalCanvas';canvas.className='talos-canvas';var toolsTitle=document.createElement('h3');toolsTitle.className='talos-tools-title';toolsTitle.textContent='Suggested tools & capabilities';var tools=document.createElement('div');tools.id='talosSuggestedTools';tools.className='talos-tools';var firstStatus=q('.status',panel);if(firstStatus)firstStatus.insertAdjacentElement('afterend',title);else panel.appendChild(title);title.insertAdjacentElement('afterend',canvas);canvas.insertAdjacentElement('afterend',toolsTitle);toolsTitle.insertAdjacentElement('afterend',tools);return canvas}

  function renderSuggestedTools(){var box=byId('talosSuggestedTools');if(!box||!latestProposal)return;box.innerHTML='';var seen={};(latestProposal.steps||[]).forEach(function(step){var key=step.proposedFamily+'|'+step.implementationKind+'|'+step.implementationRef;if(seen[key])return;seen[key]=true;var d=document.createElement('div');d.className='talos-tool';var strong=document.createElement('strong');strong.textContent=step.canonicalName||step.proposedFamily;var small=document.createElement('small');if(step.proposedFamily==='HUMAN_INTERACTION')small.textContent='Talos human coordination · runtime participant assignment';else small.textContent=step.implementationKind+' · '+step.implementationRef;d.append(strong,small);box.appendChild(d)});if(!box.children.length){var none=document.createElement('div');none.className='talos-tool';none.innerHTML='<strong>No external tools required</strong><small>The proposed workflow can stay inside Workflow-native coordination.</small>';box.appendChild(none)}}
  function renderTemporalCanvas(){var canvas=ensureTemporalCanvas();if(canvas){canvas.innerHTML=renderSvg(latestProcess,'temporal',latestProposal);renderSuggestedTools();renameAiActions()}}

  function renameAiActions(){var panel=byId('aiAutomationProposal');if(!panel)return;var intro=q('small',panel);if(intro)intro.textContent='Talos designed this from the confirmed process. Review the workflow and suggested tools; nothing is deployed until you approve and deploy it.';qa('button',panel).forEach(function(b){var t=text(b.textContent).trim();if(t==='Accept AI automation design'||t==='Design accepted')b.textContent=t==='Design accepted'?'Automation approved':'Approve automation';else if(t==='Reject design')b.textContent='Reject';else if(t==='Redesign with Gemini')b.textContent='Redesign'});var state=byId('aiAutomationState');if(state){var s=text(state.textContent);if(s.indexOf('Review the AI proposal')>=0)state.textContent='Review the proposed workflow and tools. Nothing is deployed yet.';else if(s.indexOf('AI design decision recorded')>=0)state.textContent='Automation approval recorded. Talos is preparing the governed execution design.';else if(s.indexOf('Capabilities explicitly selected')>=0)state.textContent='Approved capabilities are pinned. Talos is compiling the workflow.'}}

  function installCompileState(){var design=byId('designCard');if(!design||byId('talosCompileState'))return;var state=document.createElement('div');state.id='talosCompileState';state.className='talos-engine-state';state.textContent='Confirm the process to let Talos design the automation.';design.appendChild(state)}
  function setCompile(message,kind){var node=byId('talosCompileState');if(node){node.textContent=message;node.className='talos-engine-state '+(kind||'')}}

  function applyProposedMappingChoices(){if(!latestExecution||!latestProposal)return;var elementById={};(latestExecution.elements||[]).forEach(function(x){elementById[x.id]=x});var orchBySubject={};(latestProposal.orchestration||[]).forEach(function(o){orchBySubject[o.semanticSubjectRef]=o});qa('#mappingChoices [data-element]').forEach(function(row){var element=elementById[row.dataset.element];var select=q('select',row);if(!element||!select)return;var refs=Array.isArray(element.semanticSubjectRefs)?element.semanticSubjectRefs.slice():(element.semanticSubjectRef?[element.semanticSubjectRef]:[]);var desired='';refs.some(function(ref){var o=orchBySubject[ref];if(o&&(o.proposedTreatment==='DURABLE_TIMER'||o.proposedTreatment==='WORKFLOW_CONDITION')){desired=o.proposedTreatment;return true}return false});if(desired&&qa('option',select).some(function(o){return o.value===desired}))select.value=desired})}

  function continueCompile(){if(!compileStarted||compileFinished)return;var planState=statusText('planState');if(planState.indexOf('BLOCKED')>=0||planState.indexOf('NEEDS_EXECUTION_DESIGN')>=0){setCompile('Talos needs one material process/design clarification before it can compile this automation. No deployment authority was created.','warn');return}if(byId('buildPlan')&&!byId('buildPlan').disabled&&!statusText('planState').match(/READY|APPROVED/)){safeClick('buildPlan');return}if(byId('approveAutomation')&&!byId('approveAutomation').disabled){safeClick('approveAutomation');return}if(byId('mapTemporal')&&!byId('mapTemporal').disabled){applyProposedMappingChoices();safeClick('mapTemporal');return}if(byId('recordRuntimePolicy')&&!byId('recordRuntimePolicy').disabled){safeClick('recordRuntimePolicy');return}if(statusText('runtimePolicyPreview').indexOf('READY_FOR_DEPLOYMENT_DESIGN')>=0){compileFinished=true;setCompile('Automation compiled and governed. Ready to deploy when a Temporal runtime is available.','good');updateStages();installSimpleRunActions();return}later(continueCompile,120)}
  function startCompileIfReady(){if(compileStarted)return;var design=statusText('designState');if(design.indexOf('CAPABILITIES BOUND')===-1)return;compileStarted=true;setCompile('Talos is validating and compiling the approved automation…','');later(continueCompile,50)}
  function autoOpenDesignAfterConfirmation(){if(autoDesignStarted)return;if(statusText('confirmationState')!=='CONFIRMED')return;var open=byId('openDesign');if(open&&!open.disabled){autoDesignStarted=true;setCompile('Gemini is preparing the Temporal workflow proposal…','');open.click()}}

  function installSimpleRunActions(){var deploy=byId('deployCard');if(deploy&&!byId('talosDeployOnce')){var oldRow=byId('designDeployment')&&byId('designDeployment').parentElement;if(oldRow)hide(oldRow);var b=button('Deploy approved workflow','primary talos-primary-action');b.id='talosDeployOnce';b.disabled=!(latestRuntimeProfile&&latestRuntimeProfile.temporalExecutionAvailable);deploy.appendChild(b);b.addEventListener('click',function(){if(deployStarted)return;deployStarted=true;b.disabled=true;b.textContent='Deploying…';safeClick('designDeployment')||later(continueDeploy,100)})}var execute=byId('executeCard');if(execute&&!byId('talosRunOnce')){qa('.field',execute).forEach(function(f){hide(f)});var oldActions=byId('approveExecution')&&byId('approveExecution').parentElement;if(oldActions)hide(oldActions);var r=button('Run workflow','primary talos-primary-action');r.id='talosRunOnce';r.disabled=true;execute.appendChild(r);r.addEventListener('click',function(){if(runStarted)return;runStarted=true;r.disabled=true;r.textContent='Starting…';safeClick('approveExecution')||later(continueRun,100)})}}
  function continueDeploy(){if(!deployStarted)return;if(byId('realizeEnvironment')&&!byId('realizeEnvironment').disabled){byId('realizeEnvironment').click();later(continueDeploy,120);return}if(byId('approveDeployment')&&!byId('approveDeployment').disabled){byId('approveDeployment').click();later(continueDeploy,120);return}if(byId('deployWorker')&&!byId('deployWorker').disabled){byId('deployWorker').click();later(continueDeploy,120);return}var truth=statusText('truthDeployment');var high=byId('talosDeployOnce');if(truth.indexOf('Worker deployed')>=0){if(high){high.textContent='Deployed';high.className='good talos-primary-action'}var run=byId('talosRunOnce');if(run)run.disabled=false;updateStages();return}if(statusText('deploymentState').toLowerCase().indexOf('error')>=0||statusText('deploymentState').toLowerCase().indexOf('fail')>=0){if(high){high.textContent='Deploy failed';high.disabled=false}deployStarted=false;return}later(continueDeploy,150)}
  function continueRun(){if(!runStarted)return;if(byId('startExecution')&&!byId('startExecution').disabled){byId('startExecution').click();later(continueRun,160);return}var state=statusText('executionState');var high=byId('talosRunOnce');if(state.toLowerCase().indexOf('completed')>=0||statusText('truthExecution').indexOf('COMPLETED')>=0){if(high){high.textContent='Completed';high.className='good talos-primary-action'}updateStages();return}if(state.indexOf('RUNNING')>=0||state.indexOf('waiting')>=0){if(high){high.textContent='Running';high.className='good talos-primary-action'}updateStages();return}if(state.toLowerCase().indexOf('error')>=0||state.toLowerCase().indexOf('failed')>=0){if(high){high.textContent='Run failed';high.disabled=false}runStarted=false;return}later(continueRun,180)}

  function updateStages(){var process=byId('talosStageProcess'),automation=byId('talosStageAutomation'),run=byId('talosStageRun');var confirmed=statusText('confirmationState')==='CONFIRMED';var deployed=statusText('truthDeployment').indexOf('Worker deployed')>=0;var executed=statusText('truthExecution').indexOf('COMPLETED')>=0;stageClass(process,confirmed?'done':'active');stageClass(automation,compileFinished?'done':confirmed?'active':'');stageClass(run,executed?'done':compileFinished?'active':'');var runIntro=byId('talosRunIntro'),deployCard=byId('deployCard'),executeCard=byId('executeCard');if(compileFinished){show(runIntro);show(deployCard);if(deployed)show(executeCard)}else{hide(runIntro);hide(deployCard);hide(executeCard)}}

  function captureReview(body){var process=body&&body.reconciliation&&body.reconciliation.processRevision;if(process){latestProcess=process;later(renderReviewCanvas,30)}}
  function captureProposal(body){var route=body&&body.routing;var selected=route&&route.selectedProposal;if(selected){latestProposal=selected;later(renderTemporalCanvas,50)}}
  function captureExecution(body){if(body&&body.execution){latestExecution=body.execution;later(continueCompile,30)}}

  window.fetch=function(input,init){var path=typeof input==='string'?input:(input&&input.url)||'';var method=String((init&&init.method)||'GET').toUpperCase();return nativeFetch(input,init).then(function(response){if(path.indexOf('/api/process-review')!==-1&&method==='GET'&&response.ok)response.clone().json().then(captureReview).catch(function(){});if(path.indexOf('/api/automation/proposal/generate')!==-1&&method==='POST'&&response.ok)response.clone().json().then(captureProposal).catch(function(){});if(path.indexOf('/api/automation/execution-plan/review')!==-1&&method==='POST'&&response.ok)response.clone().json().then(captureExecution).catch(function(){});if(path.indexOf('/api/bpmn/confirm')!==-1&&method==='POST'&&response.ok)later(function(){autoOpenDesignAfterConfirmation();updateStages()},80);if(path.indexOf('/api/automation/proposal/bind')!==-1&&method==='POST'&&response.ok)later(startCompileIfReady,120);if(path.indexOf('/api/automation/approve')!==-1&&method==='POST'&&response.ok)later(continueCompile,80);if(path.indexOf('/api/automation/temporal-mapping')!==-1&&method==='POST'&&response.ok)later(continueCompile,80);if(path.indexOf('/api/automation/runtime-policy')!==-1&&method==='POST'&&response.ok)later(function(){continueCompile();updateStages()},80);if(path.indexOf('/api/automation/deployment-design')!==-1&&method==='POST'&&response.ok)later(continueDeploy,80);if(path.indexOf('/api/automation/environment-realization')!==-1&&method==='POST'&&response.ok)later(continueDeploy,80);if(path.indexOf('/api/automation/deployment/approve')!==-1&&method==='POST'&&response.ok)later(continueDeploy,80);if(path.indexOf('/api/automation/deployment/attempt')!==-1&&method==='POST'&&response.ok)later(function(){continueDeploy();updateStages()},80);if(path.indexOf('/api/automation/execution/approve')!==-1&&method==='POST'&&response.ok)later(continueRun,80);if(path.indexOf('/api/automation/execution/start')!==-1&&method==='POST'&&response.ok)later(function(){continueRun();updateStages()},100);if(path.indexOf('/api/product/runtime-profile')!==-1&&method==='GET'&&response.ok)response.clone().json().then(function(profile){latestRuntimeProfile=profile;later(function(){installSimpleRunActions();updateStages()},30)}).catch(function(){});return response})}

  function observe(){new MutationObserver(function(){renameAiActions();autoOpenDesignAfterConfirmation();startCompileIfReady();if(latestProcess)renderReviewCanvas();if(latestProposal)renderTemporalCanvas();installSimpleRunActions();updateStages()}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','class']})}

  installStyle();simplifyHeader();installStages();installAdvancedToggle();installStageIntros();ensureReviewCanvas();simplifyCards();installCompileState();installSimpleRunActions();observe();updateStages();nativeFetch('/api/product/runtime-profile').then(function(response){return response.ok?response.json():null}).then(function(profile){if(profile){latestRuntimeProfile=profile;installSimpleRunActions();updateStages()}}).catch(function(){});
})();
`;
