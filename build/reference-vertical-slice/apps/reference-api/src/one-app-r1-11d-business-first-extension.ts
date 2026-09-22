export const R1_11D_BUSINESS_FIRST_EXTENSION=String.raw`
<style>
  .r111dJourney{margin:0 0 18px;border:1px solid #283b50;border-radius:18px;background:rgba(8,14,21,.94);padding:12px}
  .r111dSteps{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.r111dStep{border:1px solid #293b50;background:#0b121b;color:#7f92a8;border-radius:12px;padding:10px;text-align:left;font-size:11px}.r111dStep strong{display:block;color:#cbd8e5;font-size:12px;margin-bottom:3px}.r111dStep.active{border-color:#66e4bd;background:#0b201a;color:#b7dccf}.r111dStep.active strong,.r111dStep.done strong{color:#66e4bd}.r111dStep.done{border-color:#285a4a;background:#0a1714}
  .r111dMode{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:10px}.r111dModeText{font-size:11px;color:#90a4b9}.r111dTechnical{background:#172335!important;color:#c8d7e5!important;border:1px solid #334963!important;font-size:10px!important;padding:7px 10px!important}
  .r111dSourceChooser{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 16px}.r111dSourceCard{border:1px solid #2a3d52;border-radius:15px;background:#0d151f;padding:15px;cursor:pointer;transition:.15s transform,.15s border-color;text-align:left;color:#eef5fb}.r111dSourceCard:hover{transform:translateY(-2px);border-color:#53708f}.r111dSourceCard strong{display:block;font-size:14px}.r111dSourceCard span{display:block;margin-top:5px;color:#93a6ba;font-size:11px;line-height:1.45}.r111dSourceCard.selected{border-color:#66e4bd;background:#0c1d18}
  .r111dCanvas{display:none;margin-top:14px;border:1px solid #2c435a;border-radius:15px;background:#09111a;padding:14px}.r111dCanvas.open{display:block}.r111dCanvas h3{margin:0;font-size:14px}.r111dCanvas p{margin:5px 0 0;color:#93a7ba;font-size:11px;line-height:1.5}.r111dCanvas input,.r111dCanvas select{background:#0e1823;color:#eef5fb;border:1px solid #334a63;border-radius:8px;padding:8px;font:inherit}.r111dCanvasTitle{width:100%;margin-top:10px}.r111dPalette{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.r111dPalette button{font-size:10px;padding:7px 9px;background:#1c2b3d;color:#d7e4ef;border:1px solid #32475f}.r111dCanvasRows,.r111dConnections{display:grid;gap:7px;margin-top:10px}.r111dCanvasRow,.r111dConnection{display:grid;grid-template-columns:110px minmax(160px,1fr) auto;gap:7px;align-items:center;border:1px solid #223448;border-radius:10px;padding:8px;background:#071019}.r111dCanvasRow[draggable=true]{cursor:grab}.r111dCanvasRow button,.r111dConnection button{padding:6px 8px;font-size:9px;background:#27384b;color:#d9e6f2}.r111dConnection{grid-template-columns:1fr 1fr 120px 1fr auto}.r111dCanvasActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}.r111dCanvasState{font-size:11px;color:#93a6ba}.r111dCanvasState.good{color:#66e4bd}.r111dCanvasState.bad{color:#ff7f8e}
  .r111dContinue{display:flex;justify-content:flex-end;margin-top:12px}.r111dContinue button{min-width:180px}
  .r111dAutomationGuide{display:none;margin-top:12px;border:1px solid #315343;border-radius:12px;padding:12px;background:#091711}.r111dAutomationGuide.open{display:block}.r111dAutomationGuide h4{margin:0 0 5px;font-size:12px}.r111dAutomationGuide p{margin:0;color:#9bb3a9;font-size:11px;line-height:1.45}.r111dPlanSummary{display:grid;gap:6px;margin-top:9px}.r111dPlanItem{border-left:2px solid #4b7d68;padding:7px 9px;background:#0a1411;border-radius:0 8px 8px 0;font-size:11px}.r111dAutomationActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.r111dAutomationState{font-size:11px;color:#ffca6b;margin-top:8px}.r111dAutomationState.good{color:#66e4bd}.r111dAutomationState.bad{color:#ff7f8e}
  .r111dRun{display:none;border:1px solid #2d4e42;border-radius:18px;padding:18px;background:linear-gradient(180deg,#0c1b16,#08110e);max-width:760px;margin:0 auto}.r111dRun.open{display:block}.r111dRun h2{margin:0;font-size:20px}.r111dRun p{color:#a8beb5;line-height:1.55}.r111dRunState{margin-top:10px;font-size:12px;color:#ffca6b}.r111dRunState.good{color:#66e4bd}.r111dRunActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  body.r111dSimple .truth,body.r111dSimple #r110Nav,body.r111dSimple #r110Recovery,body.r111dSimple .runtime,body.r111dSimple .r111cToolbar{display:none!important}
  body.r111dSimple #r106ExecutionPlan,body.r111dSimple #r107RuntimeAuthority{display:none!important}
  body.r111dSimple #r111NativeHint{display:none!important}
  body.r111dSimple.r111dStage-process .grid .card:nth-child(2){display:none}
  body.r111dSimple.r111dStage-review .grid .card:first-child,body.r111dSimple.r111dStage-confirm .grid .card:first-child,body.r111dSimple.r111dStage-automate .grid .card:first-child,body.r111dSimple.r111dStage-run .grid{display:none}
  body.r111dSimple.r111dStage-review #r104BusinessConfirmation,body.r111dSimple.r111dStage-review #r105AutomationDesign{display:none!important}
  body.r111dSimple.r111dStage-confirm #r111cClarify,body.r111dSimple.r111dStage-confirm #r105AutomationDesign{display:none!important}
  body.r111dSimple.r111dStage-automate #r111cClarify,body.r111dSimple.r111dStage-automate #r104BusinessConfirmation{display:none!important}
  body.r111dSimple.r111dStage-review #r111dRun,body.r111dSimple.r111dStage-confirm #r111dRun,body.r111dSimple.r111dStage-automate #r111dRun,body.r111dSimple.r111dStage-process #r111dRun{display:none!important}
  body.r111dSimple.r111dStage-run #r111dRun{display:block}
  body.r111dSimple.r111dStage-review .r111dSourceChooser,body.r111dSimple.r111dStage-confirm .r111dSourceChooser,body.r111dSimple.r111dStage-automate .r111dSourceChooser,body.r111dSimple.r111dStage-run .r111dSourceChooser{display:none!important}
  body.r111dSimple .r105Meta,body.r111dSimple .r105Suggestion small,body.r111dSimple .r105RequirementState,body.r111dSimple #r105State{display:none!important}
  body.r111dSimple.r111fDesignReady .r105Actions{display:none!important}
  body.r111dSimple:not(.r111fExceptions) #r105Workspace{display:none!important}
  body.r111dSimple:not(.r111fExceptions) #r111eBulk{display:none!important}
  body.r111dSimple:not(.r111fExceptions) #r111dPreparePlan{display:none!important}
  body.r111dSimple .r105Boundary{display:none!important}
  body.r111dSimple .r105RequirementTitle{font-size:12px}
  body.r111dSimple .r105DecisionButtons button{background:#22364a;color:#e3edf6}
  body.r111dTechnicalMode .truth,body.r111dTechnicalMode #r110Nav,body.r111dTechnicalMode #r110Recovery,body.r111dTechnicalMode .runtime,body.r111dTechnicalMode #r106ExecutionPlan,body.r111dTechnicalMode #r107RuntimeAuthority{display:grid!important}
  body.r111dTechnicalMode #r110Nav{display:flex!important}body.r111dTechnicalMode .runtime{display:block!important}body.r111dTechnicalMode #r106ExecutionPlan,body.r111dTechnicalMode #r107RuntimeAuthority,body.r111dTechnicalMode #r110Recovery{display:block!important}
  .r111dResolve{margin-top:9px;border:1px solid #314960;border-radius:10px;padding:10px;background:#08121c}.r111dResolvePrompt{font-size:11px;color:#b7c7d8;line-height:1.45;margin-bottom:8px}.r111dResolveGrid{display:grid;grid-template-columns:180px 1fr;gap:7px}.r111dResolve select,.r111dResolve input{width:100%;background:#0e1823;color:#eef5fb;border:1px solid #334a63;border-radius:8px;padding:8px;font:inherit}.r111dResolveActions{display:flex;gap:8px;align-items:center;margin-top:8px}.r111dResolveSaved{font-size:10px;color:#66e4bd}.r111dResolveHint{font-size:10px;color:#91a5b8;margin-top:6px;line-height:1.4}
  .r111eBulk{display:none;margin:10px 0;border:1px solid #315b4a;border-radius:12px;padding:12px;background:#0a1914}.r111eBulk.open{display:block}.r111eBulk strong{display:block;font-size:12px}.r111eBulk p{margin:4px 0 9px!important;color:#a7c4b8!important}.r111eBulkGrid{display:grid;grid-template-columns:180px 1fr;gap:7px}.r111eBulk select,.r111eBulk input{width:100%;background:#0e1823;color:#eef5fb;border:1px solid #365744;border-radius:8px;padding:8px;font:inherit}.r111eBulkRole{margin-top:7px}.r111eBulkActions{display:flex;gap:8px;align-items:center;margin-top:9px}.r111eResolved{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #2e5547;border-radius:9px;padding:9px;background:#0a1713;font-size:11px}.r111eResolved button{padding:5px 8px;font-size:9px;background:#203b32;color:#dff6ec}
  .r111fProposal{display:none;margin:10px 0;border:1px solid #3b6c59;border-radius:14px;padding:14px;background:linear-gradient(180deg,#0c2019,#08150f)}.r111fProposal.open{display:block}.r111fProposal strong{display:block;font-size:14px;color:#e7fff5}.r111fProposal p{margin:6px 0 0!important;color:#abd0c0!important;line-height:1.55!important}.r111fProposalSummary{margin-top:10px;padding:10px;border:1px solid #2b5646;border-radius:10px;background:#07140f;color:#cce9dc;font-size:11px;line-height:1.55}.r111fProposalActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.r111fProposalActions button.secondary{background:#172335;color:#d4e2ed;border:1px solid #334963}.r111fProposalState{font-size:11px;color:#ffca6b;margin-top:8px}.r111fProposalState.good{color:#66e4bd}
  .r111gRunFlow{display:grid;gap:10px;margin-top:12px}.r111gRunCard{display:none;border:1px solid #294f43;border-radius:12px;padding:12px;background:#081711}.r111gRunCard.open{display:block}.r111gRunCard strong{display:block;color:#e1fff2;font-size:12px}.r111gRunCard p{margin:5px 0 9px!important;color:#a6c9bb!important;font-size:10px!important;line-height:1.5!important}.r111gRunSummary{padding:9px;border:1px solid #294638;border-radius:9px;background:#06100d;color:#c4e6d8;font-size:10px;line-height:1.55}.r111gRunState{margin-top:7px;font-size:10px;color:#ffca6b}.r111gRunState.good{color:#66e4bd}.r111gRunState.bad{color:#ff7f8e}#r111gTemporalLink{align-items:center;padding:8px 10px;border:1px solid #315b4a;border-radius:8px;color:#66e4bd;text-decoration:none;font-size:10px}.r111hWork{display:none;margin-top:12px;border:1px solid #315b4a;border-radius:12px;padding:12px;background:#06130f}.r111hWork.open{display:block}.r111hWorkTop{display:flex;justify-content:space-between;gap:10px;align-items:center}.r111hBadge{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#66e4bd;border:1px solid #315b4a;border-radius:999px;padding:5px 8px}.r111hTask{margin-top:10px;font-size:17px;font-weight:800;color:#edfff7}.r111hMeta{margin-top:5px;font-size:10px;color:#a5c5b8;line-height:1.5}.r111hProgress{margin-top:10px;height:6px;border-radius:999px;background:#10231c;overflow:hidden}.r111hProgress>span{display:block;height:100%;background:#66e4bd;width:0;transition:width .2s ease}.r111hActions{display:flex;gap:8px;align-items:center;margin-top:11px;flex-wrap:wrap}.r111hActions button{display:none}.r111hActions button.visible{display:inline-flex}#r111hDecisionChoices{display:flex;gap:8px;flex-wrap:wrap}#r111hDecisionChoices button{display:inline-flex}.r111hState{font-size:10px;color:#91a5b8}.r111hState.bad{color:#ff7f8e}
  @media(max-width:800px){.r111dSteps,.r111dSourceChooser{grid-template-columns:1fr}.r111dConnection,.r111dResolveGrid,.r111eBulkGrid{grid-template-columns:1fr}.r111dCanvasRow{grid-template-columns:90px 1fr auto}}
</style>
<script>
(function(){
  'use strict';
  var nativeFetch=window.fetch.bind(window);
  var currentStage='process';
  var hasCandidate=false;
  var latestDesign=null;
  var explicitSelections={};
  var simpleReview=null;
  var simpleApproval=null;
  var simpleMapping=null;
  var simpleRuntimeTarget=null;
  var simpleRuntimePolicy=null;
  var simpleDeploymentDesign=null;
  var simpleRealization=null;
  var simpleDeploymentAttempt=null;
  var simpleExecutionObservation=null;
  var runtimeMonitorTimer=null;
  var runtimeMonitorBusy=false;
  var dragId=null;
  var canvasCounter=0;
  var connectionCounter=0;

  function byId(id){return document.getElementById(id)}
  function authority(kind){return 'authority:talos-product:r1-11d-'+kind+':'+Date.now()}
  function stageIndex(stage){return['process','review','confirm','automate','run'].indexOf(stage)}
  function setStage(stage){
    currentStage=stage;
    ['process','review','confirm','automate','run'].forEach(function(x){document.body.classList.toggle('r111dStage-'+x,x===stage)});
    Array.from(document.querySelectorAll('.r111dStep')).forEach(function(node){var idx=stageIndex(node.dataset.stage),cur=stageIndex(stage);node.classList.toggle('active',idx===cur);node.classList.toggle('done',idx<cur)});
    if(stage==='confirm'){var n=byId('r104BusinessConfirmation');if(n)setTimeout(function(){n.scrollIntoView({behavior:'smooth',block:'center'})},20)}
    if(stage==='automate'){var a=byId('r105AutomationDesign');if(a)setTimeout(function(){a.scrollIntoView({behavior:'smooth',block:'start'})},20)}
  }
  function installJourney(){
    if(byId('r111dJourney'))return;
    document.body.classList.add('r111dSimple','r111dStage-process');
    var top=document.querySelector('.top');if(!top)return;
    var journey=document.createElement('section');journey.id='r111dJourney';journey.className='r111dJourney';
    journey.innerHTML='<div class="r111dSteps">'+
      '<button class="r111dStep active" data-stage="process"><strong>1 · Process</strong>Bring your process</button>'+
      '<button class="r111dStep" data-stage="review"><strong>2 · Review</strong>Check & clarify</button>'+
      '<button class="r111dStep" data-stage="confirm"><strong>3 · Confirm</strong>Confirm the process</button>'+
      '<button class="r111dStep" data-stage="automate"><strong>4 · Automate</strong>Prepare automation</button>'+
      '<button class="r111dStep" data-stage="run"><strong>5 · Run</strong>Run & monitor</button>'+
      '</div><div class="r111dMode"><div class="r111dModeText">Talos keeps evidence, revisions, validation and execution authority behind this simple journey.</div><button id="r111dTechnical" class="r111dTechnical" type="button">Technical details</button></div>';
    top.insertAdjacentElement('afterend',journey);
    Array.from(journey.querySelectorAll('.r111dStep')).forEach(function(button){button.addEventListener('click',function(){var target=this.dataset.stage;if(target==='review'&&!hasCandidate)return;if(target==='confirm'&&!hasCandidate)return;setStage(target)})});
    byId('r111dTechnical').addEventListener('click',function(){
      var technical=document.body.classList.toggle('r111dTechnicalMode');
      document.body.classList.toggle('r111dSimple',!technical);document.body.classList.toggle('r111cAdvanced',technical);
      this.textContent=technical?'Back to simple view':'Technical details';
    });
    var old=byId('r111cMode');if(old)old.style.display='none';
  }
  function installSourceChooser(){
    var grid=document.querySelector('.grid');if(!grid||byId('r111dSourceChooser'))return;
    var chooser=document.createElement('section');chooser.id='r111dSourceChooser';chooser.className='r111dSourceChooser';
    chooser.innerHTML='<button type="button" class="r111dSourceCard" data-mode="image"><strong>Upload an image</strong><span>Photo, screenshot or process diagram</span></button><button type="button" class="r111dSourceCard" data-mode="bpmn"><strong>Import BPMN</strong><span>Use an existing process definition</span></button><button type="button" class="r111dSourceCard" data-mode="canvas"><strong>Create it here</strong><span>Build the process with simple Talos blocks</span></button>';
    grid.insertAdjacentElement('beforebegin',chooser);
    chooser.querySelector('[data-mode=image]').addEventListener('click',function(){selectMode('image');var b=byId('choose');if(b)b.click()});
    chooser.querySelector('[data-mode=bpmn]').addEventListener('click',function(){selectMode('bpmn');var b=byId('r111ChooseBpmn');if(b)b.click()});
    chooser.querySelector('[data-mode=canvas]').addEventListener('click',function(){selectMode('canvas');showCanvas()});
    var sourceCard=grid.querySelector('.card');if(sourceCard)installCanvas(sourceCard);
  }
  function selectMode(mode){Array.from(document.querySelectorAll('.r111dSourceCard')).forEach(function(c){c.classList.toggle('selected',c.dataset.mode===mode)})}
  function canvasRows(){return Array.from(document.querySelectorAll('.r111dCanvasRow'))}
  function stepOption(select){canvasRows().forEach(function(row){var o=document.createElement('option');o.value=row.dataset.id;o.textContent=row.querySelector('.r111dLabel').value||row.dataset.kind;select.appendChild(o)})}
  function refreshConnectionSelects(){Array.from(document.querySelectorAll('.r111dFrom,.r111dTo')).forEach(function(select){var value=select.value;select.innerHTML='';stepOption(select);if(Array.from(select.options).some(function(o){return o.value===value}))select.value=value})}
  function addStep(kind,label){
    canvasCounter+=1;var id='step-'+canvasCounter;var host=byId('r111dCanvasRows');var row=document.createElement('div');row.className='r111dCanvasRow';row.draggable=true;row.dataset.id=id;row.dataset.kind=kind;row.dataset.waitKind='';row.dataset.expression='';
    row.innerHTML='<select class="r111dKind"><option value="'+kind+'">'+kind.replace('_',' ')+'</option></select><input class="r111dLabel" value="'+(label||'')+'" placeholder="What happens here?"><button type="button">Remove</button>';
    row.querySelector('button').onclick=function(){row.remove();refreshConnectionSelects()};
    row.addEventListener('dragstart',function(){dragId=id});row.addEventListener('dragover',function(e){e.preventDefault()});row.addEventListener('drop',function(e){e.preventDefault();var dragged=document.querySelector('.r111dCanvasRow[data-id="'+dragId+'"]');if(dragged&&dragged!==row)host.insertBefore(dragged,row);refreshConnectionSelects()});
    host.appendChild(row);refreshConnectionSelects();return row;
  }
  function addConnection(){
    connectionCounter+=1;var row=document.createElement('div');row.className='r111dConnection';row.dataset.id='connection-'+connectionCounter;
    row.innerHTML='<select class="r111dFrom"></select><select class="r111dTo"></select><select class="r111dConnKind"><option value="FLOW">Then</option><option value="CONDITION">When...</option><option value="DEFAULT">Otherwise</option><option value="PARALLEL">At the same time</option></select><input class="r111dCondition" placeholder="Condition, if needed"><button type="button">Remove</button>';
    stepOption(row.querySelector('.r111dFrom'));stepOption(row.querySelector('.r111dTo'));row.querySelector('button').onclick=function(){row.remove()};byId('r111dConnections').appendChild(row);return row;
  }
  function installCanvas(sourceCard){
    if(byId('r111dCanvas'))return;var panel=document.createElement('section');panel.id='r111dCanvas';panel.className='r111dCanvas';
    panel.innerHTML='<h3>Create your process</h3><p>Add the steps in business language. Talos will preserve this Canvas as the source, then send it through the same review and confirmation path as images and BPMN.</p><input id="r111dCanvasTitle" class="r111dCanvasTitle" value="My process" placeholder="Process name"><div class="r111dPalette"><button data-kind="START">+ Start</button><button data-kind="STEP">+ Step</button><button data-kind="DECISION">+ Decision</button><button data-kind="WAIT">+ Wait</button><button data-kind="APPROVAL">+ Person / approval</button><button data-kind="SUBPROCESS">+ Subprocess</button><button data-kind="END">+ End</button></div><div id="r111dCanvasRows" class="r111dCanvasRows"></div><div class="sectionLabel">Connections</div><div id="r111dConnections" class="r111dConnections"></div><div class="r111dCanvasActions"><button id="r111dAddConnection" type="button" class="secondary">Add connection</button><button id="r111dReviewCanvas" type="button">Review my process</button><span id="r111dCanvasState" class="r111dCanvasState"></span></div>';
    sourceCard.appendChild(panel);Array.from(panel.querySelectorAll('.r111dPalette button')).forEach(function(b){b.addEventListener('click',function(){addStep(this.dataset.kind,this.dataset.kind==='START'?'Start':this.dataset.kind==='END'?'End':'')})});byId('r111dAddConnection').onclick=addConnection;byId('r111dReviewCanvas').onclick=submitCanvas;
  }
  function showCanvas(){var p=byId('r111dCanvas');if(p)p.classList.add('open');if(canvasRows().length===0){addStep('START','Start');addStep('END','End')}}
  function canvasPayload(){
    var elements=canvasRows().map(function(row){var kind=row.dataset.kind,label=row.querySelector('.r111dLabel').value.trim();if(!label)throw new Error('Every step needs a name.');var payload={id:row.dataset.id,kind:kind,label:label};if(kind==='WAIT'){payload.waitKind=(row.dataset.waitKind||'').trim();if((row.dataset.expression||'').trim())payload.expression=row.dataset.expression.trim()}return payload});
    var connections=Array.from(document.querySelectorAll('.r111dConnection')).map(function(row){var condition=row.querySelector('.r111dCondition').value.trim();var kind=row.querySelector('.r111dConnKind').value;if(condition&&kind==='FLOW')kind='CONDITION';if(kind==='CONDITION'&&!condition)throw new Error('A When... connection needs a condition.');return{id:row.dataset.id,from:row.querySelector('.r111dFrom').value,to:row.querySelector('.r111dTo').value,kind:kind,condition:condition}});
    var payload={title:byId('r111dCanvasTitle').value.trim()||'My process',initiatedBy:'one-app-product-user',elements:elements,connections:connections};
    if(window.talosCanvasPresentationSnapshot&&typeof window.talosCanvasPresentationSnapshot==='function'){var presentation=window.talosCanvasPresentationSnapshot();if(presentation&&typeof presentation==='object')payload.presentation=presentation}
    return payload;
  }
  async function submitCanvas(){
    var state=byId('r111dCanvasState');var button=byId('r111dReviewCanvas');button.disabled=true;state.className='r111dCanvasState';state.textContent='Preparing your process for review…';
    try{var response=await fetch('/api/input/canvas',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(canvasPayload())});var body=await response.json();if(!response.ok)throw new Error(body.userMessage||body.error||('HTTP '+response.status));if(body.status!=='BPMN_READY_FOR_PROCESS_REVIEW')throw new Error(body.userMessage||'Talos saved the process but cannot review it yet.');state.className='r111dCanvasState good';state.textContent='Process ready for review.';hasCandidate=true;renderProductCandidate(body.reconciliation,'READY · NOT CONFIRMED');setStage('review')}
    catch(error){state.className='r111dCanvasState bad';state.textContent=error instanceof Error?error.message:String(error)}
    finally{button.disabled=false}
  }
  function installContinue(){
    var review=byId('review');if(!review||byId('r111dContinue'))return;var div=document.createElement('div');div.id='r111dContinue';div.className='r111dContinue';div.innerHTML='<button type="button">Continue to confirmation</button>';div.querySelector('button').onclick=function(){var clarify=byId('r111cClarify');if(clarify&&clarify.classList.contains('open')){clarify.scrollIntoView({behavior:'smooth',block:'center'});return}setStage('confirm')};var confirmation=byId('r104BusinessConfirmation');if(confirmation&&confirmation.parentNode)confirmation.parentNode.insertBefore(div,confirmation);else review.appendChild(div);
  }
  function humanFamily(value){var map={HUMAN_INTERACTION:'Handled by a person',DATA_COLLECTION:'Collect information',COMMUNICATION:'Send or receive information',SYSTEM_OPERATION:'Use a system or API',DOCUMENT_FILE:'Work with a document',STORAGE:'Store information',EXTERNAL_WORKFLOW_INVOCATION:'Start another workflow',AI_TASK:'Use AI for this step',CUSTOM_INTEGRATION:'Use another integration'};return map[value]||String(value||'Automation step').replaceAll('_',' ').toLowerCase()}
  function implementationKind(family){
    if(family==='HUMAN_INTERACTION')return'HUMAN_SERVICE';
    if(family==='AI_TASK')return'AI_SERVICE';
    if(family==='STORAGE')return'DATABASE_ADAPTER';
    if(family==='EXTERNAL_WORKFLOW_INVOCATION')return'N8N_WORKFLOW';
    return'DIRECT_API';
  }
  function slug(value){return String(value||'selection').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'selection'}
  function acceptedDecision(requirement){
    return (latestDesign&&latestDesign.decisions||[]).find(function(d){return d.capabilityRequirementRef===requirement.capabilityRequirementRef&&(d.decision==='ACCEPT'||d.decision==='REPLACE')});
  }
  function hasDirection(requirement){return Boolean(acceptedDecision(requirement)||explicitSelections[requirement.capabilityRequirementRef])}
  function renderExplicitCapabilityControls(){
    if(!latestDesign)return;
    var cards=Array.from(document.querySelectorAll('.r105Requirement'));
    (latestDesign.requirements||[]).forEach(function(requirement,index){
      var card=cards[index];if(!card)return;
      var title=card.querySelector('.r105RequirementTitle');
      if(title)title.textContent=requirement.businessStepName||humanFamily(requirement.family);
      var unresolved=requirement.designState==='UNRESOLVED_CAPABILITY'||requirement.designState==='NO_SUGGESTION_AVAILABLE';
      if(!unresolved)return;
      var list=card.querySelector('.r105Suggestions');if(!list)return;list.innerHTML='';
      var existing=explicitSelections[requirement.capabilityRequirementRef];
      if(existing){
        var resolved=document.createElement('div');resolved.className='r111eResolved';
        var summary=document.createElement('span');summary.textContent=humanFamily(existing.family)+' · '+existing.offeringCanonicalName+(existing.participantLabel?' · '+existing.participantLabel:'');
        var change=document.createElement('button');change.type='button';change.textContent='Change';change.addEventListener('click',function(){delete explicitSelections[requirement.capabilityRequirementRef];updateAutomationGuide()});
        resolved.appendChild(summary);resolved.appendChild(change);list.appendChild(resolved);return;
      }
      var box=document.createElement('div');box.className='r111dResolve';
      var prompt=document.createElement('div');prompt.className='r111dResolvePrompt';prompt.textContent='How should this business step be handled when Talos runs the workflow?';box.appendChild(prompt);
      var grid=document.createElement('div');grid.className='r111dResolveGrid';
      var family=document.createElement('select');family.className='r111dResolveFamily';
      var options=[
        ['','Choose who or what performs it'],
        ['HUMAN_INTERACTION','A person / manual task'],
        ['SYSTEM_OPERATION','A system or API'],
        ['COMMUNICATION','A message or notification'],
        ['DATA_COLLECTION','Collect information'],
        ['DOCUMENT_FILE','A document or file'],
        ['STORAGE','Store or update data'],
        ['EXTERNAL_WORKFLOW_INVOCATION','Another workflow / n8n'],
        ['AI_TASK','An AI capability'],
        ['CUSTOM_INTEGRATION','Another integration']
      ];
      options.forEach(function(pair){var option=document.createElement('option');option.value=pair[0];option.textContent=pair[1];family.appendChild(option)});
      if(requirement.family&&requirement.family!=='SOURCE_DEFINED'){family.value=requirement.family;family.disabled=true}
      var offering=document.createElement('input');offering.className='r111dResolveOffering';offering.placeholder='Name the system, service, or execution direction';
      grid.appendChild(family);grid.appendChild(offering);box.appendChild(grid);
      var participant=document.createElement('input');participant.className='r111dResolveParticipant';participant.placeholder='Who is responsible? Example: car-wash operator';participant.style.marginTop='7px';participant.style.display=family.value==='HUMAN_INTERACTION'?'block':'none';box.appendChild(participant);
      var hint=document.createElement('div');hint.className='r111dResolveHint';hint.textContent='This is an automation-design decision. It does not rewrite or reconfirm the business process.';box.appendChild(hint);
      var actions=document.createElement('div');actions.className='r111dResolveActions';var save=document.createElement('button');save.type='button';save.textContent='Use this direction';var saved=document.createElement('span');saved.className='r111dResolveSaved';actions.appendChild(save);actions.appendChild(saved);box.appendChild(actions);
      family.addEventListener('change',function(){
        participant.style.display=family.value==='HUMAN_INTERACTION'?'block':'none';
        if(!offering.value){
          if(family.value==='HUMAN_INTERACTION')offering.value='Talos manual task';
          else if(family.value==='AI_TASK')offering.value='Configured AI capability';
        }
      });
      save.addEventListener('click',function(){
        var chosen=family.value;var name=offering.value.trim();var person=participant.value.trim();
        saved.textContent='';
        if(!chosen){saved.textContent='Choose who or what performs this step.';return}
        if(!name){saved.textContent='Give this execution direction a name.';return}
        if(chosen==='HUMAN_INTERACTION'&&!person){saved.textContent='Tell Talos who is responsible for the manual step.';return}
        explicitSelections[requirement.capabilityRequirementRef]={
          source:'EXPLICIT_OFFERING',
          requirementRef:requirement.capabilityRequirementRef,
          family:chosen,
          operationIntent:requirement.operationIntent,
          offeringCanonicalName:name,
          offeringLifecycleStatus:'TEST_ONLY',
          implementationKind:implementationKind(chosen),
          implementationRef:'product-explicit:'+slug(chosen)+':'+slug(name),
          participantLabel:person,
          businessStepName:requirement.businessStepName||'this process step'
        };
        saved.textContent='Direction selected';
        updateAutomationGuide();
      });
      list.appendChild(box);
    });
  }
  function simplifyDesign(){
    Array.from(document.querySelectorAll('.r105Requirement')).forEach(function(card){Array.from(card.querySelectorAll('.r105DecisionButtons button')).forEach(function(b){var m={ACCEPT:'Use this',REJECT:'Not needed',DEFER:'Decide later',REPLACE:'Choose another'};if(m[b.textContent])b.textContent=m[b.textContent]})});
    renderExplicitCapabilityControls();
  }
  function installAutomationGuide(){
    var design=byId('r105AutomationDesign');if(!design||byId('r111dAutomationGuide'))return;var guide=document.createElement('section');guide.id='r111dAutomationGuide';guide.className='r111dAutomationGuide';guide.innerHTML='<h4>Automation proposal</h4><p>Talos should do the translation work. Review one proposal, then change only real exceptions.</p><div id="r111fProposal" class="r111fProposal"><strong>Talos has a low-risk draft</strong><p id="r111fProposalCopy"></p><div id="r111fProposalSummary" class="r111fProposalSummary"></div><div class="r111fProposalActions"><button id="r111fUseProposal" type="button">Use Talos proposal</button><button id="r111fReviewExceptions" class="secondary" type="button">Review exceptions</button></div><div id="r111fProposalState" class="r111fProposalState"></div></div><div id="r111eBulk" class="r111eBulk"><strong id="r111eBulkTitle">Set one default</strong><p id="r111eBulkCopy"></p><div class="r111eBulkGrid"><select id="r111eBulkFamily"><option value="">Choose who or what performs them</option><option value="HUMAN_INTERACTION">A person / manual task</option><option value="SYSTEM_OPERATION">A system or API</option><option value="COMMUNICATION">A message or notification</option><option value="DATA_COLLECTION">Collect information</option><option value="DOCUMENT_FILE">A document or file</option><option value="STORAGE">Store or update data</option><option value="EXTERNAL_WORKFLOW_INVOCATION">Another workflow / n8n</option><option value="AI_TASK">An AI capability</option><option value="CUSTOM_INTEGRATION">Another integration</option></select><input id="r111eBulkOffering" placeholder="Execution direction or service name"></div><input id="r111eBulkRole" class="r111eBulkRole" placeholder="Who is responsible? Example: process operator" style="display:none"><div class="r111eBulkActions"><button id="r111eApplyBulk" type="button">Apply to similar unresolved steps</button><span id="r111eBulkState" class="r111dResolveSaved"></span></div></div><div id="r111dPlanSummary" class="r111dPlanSummary"></div><div class="r111dAutomationActions"><button id="r111dPreparePlan" type="button" disabled>Prepare automation plan</button><button id="r111dApproveAutomation" type="button" style="display:none">Approve automation</button></div><div id="r111dAutomationState" class="r111dAutomationState"></div>';design.appendChild(guide);byId('r111dPreparePlan').onclick=preparePlan;byId('r111dApproveAutomation').onclick=approveAutomationSimple;byId('r111fUseProposal').onclick=useTalosProposal;byId('r111fReviewExceptions').onclick=function(){document.body.classList.toggle('r111fExceptions');this.textContent=document.body.classList.contains('r111fExceptions')?'Hide exceptions':'Review exceptions';setTimeout(simplifyDesign,0)};byId('r111eBulkFamily').onchange=function(){var role=byId('r111eBulkRole'),name=byId('r111eBulkOffering');role.style.display=this.value==='HUMAN_INTERACTION'?'block':'none';if(!name.value){if(this.value==='HUMAN_INTERACTION')name.value='Talos manual task';else if(this.value==='AI_TASK')name.value='Configured AI capability'}};byId('r111eApplyBulk').onclick=applyBulkDirection;
  }
  function proposalCandidates(){
    if(!latestDesign)return[];return(latestDesign.requirements||[]).filter(function(r){return !hasDirection(r)&&(r.designState==='UNRESOLVED_CAPABILITY'||r.designState==='NO_SUGGESTION_AVAILABLE')&&r.family==='SOURCE_DEFINED'})
  }
  function proposalEligible(){
    if(!latestDesign)return false;var pending=(latestDesign.requirements||[]).filter(function(r){return !hasDirection(r)});var candidates=proposalCandidates();return pending.length>0&&pending.length===candidates.length
  }
  function renderTalosProposal(){
    var box=byId('r111fProposal');if(!box||!latestDesign)return;var candidates=proposalCandidates(),eligible=proposalEligible()&&!simpleReview;box.classList.toggle('open',eligible);if(!eligible)return;
    byId('r111fProposalCopy').textContent='Talos can keep '+candidates.length+' unresolved business steps as tracked manual work for a generic process operator. This is an automation draft, not a claim about your business truth.';
    byId('r111fProposalSummary').textContent=candidates.length+' manual task'+(candidates.length===1?'':'s')+' proposed · existing decisions and confirmed waits stay unchanged · no deployment or execution';
    byId('r111fProposalState').textContent='';
  }
  async function useTalosProposal(){
    if(!proposalEligible())return;var candidates=proposalCandidates(),button=byId('r111fUseProposal'),state=byId('r111fProposalState');button.disabled=true;state.className='r111fProposalState';state.textContent='Applying the draft and preparing one reviewable automation plan…';
    candidates.forEach(function(requirement){explicitSelections[requirement.capabilityRequirementRef]={source:'EXPLICIT_OFFERING',requirementRef:requirement.capabilityRequirementRef,family:'HUMAN_INTERACTION',operationIntent:requirement.operationIntent,offeringCanonicalName:'Talos manual task',offeringLifecycleStatus:'TEST_ONLY',implementationKind:'HUMAN_SERVICE',implementationRef:'product-explicit:human-interaction:talos-manual-task',participantLabel:'Process operator',businessStepName:requirement.businessStepName||'this process step'}});
    try{await preparePlan();if(!simpleReview)throw new Error('Talos could not prepare the proposed automation plan.');state.className='r111fProposalState good';state.textContent='Draft applied. Review the short summary below; change exceptions only if needed.';var proposalBox=byId('r111fProposal');if(proposalBox)proposalBox.classList.remove('open')}
    catch(error){state.textContent=error instanceof Error?error.message:String(error);button.disabled=false}
  }
  function unresolvedForBulk(){
    if(!latestDesign)return[];return(latestDesign.requirements||[]).filter(function(r){return(r.designState==='UNRESOLVED_CAPABILITY'||r.designState==='NO_SUGGESTION_AVAILABLE')&&!hasDirection(r)})
  }
  function renderBulkDirection(){
    var box=byId('r111eBulk');if(!box||!latestDesign)return;var unresolved=unresolvedForBulk();box.classList.toggle('open',unresolved.length>1);if(unresolved.length>1){byId('r111eBulkTitle').textContent='Set one default for '+unresolved.length+' unresolved steps';byId('r111eBulkCopy').textContent='Use one execution direction for these steps, then change only the exceptions below.'}
  }
  function applyBulkDirection(){
    var unresolved=unresolvedForBulk(),family=byId('r111eBulkFamily').value,name=byId('r111eBulkOffering').value.trim(),person=byId('r111eBulkRole').value.trim(),state=byId('r111eBulkState');state.textContent='';
    if(!family){state.textContent='Choose who or what performs these steps.';return}
    if(!name){state.textContent='Give this execution direction a name.';return}
    if(family==='HUMAN_INTERACTION'&&!person){state.textContent='Tell Talos who is responsible.';return}
    unresolved.forEach(function(requirement){explicitSelections[requirement.capabilityRequirementRef]={source:'EXPLICIT_OFFERING',requirementRef:requirement.capabilityRequirementRef,family:family,operationIntent:requirement.operationIntent,offeringCanonicalName:name,offeringLifecycleStatus:'TEST_ONLY',implementationKind:implementationKind(family),implementationRef:'product-explicit:'+slug(family)+':'+slug(name),participantLabel:person,businessStepName:requirement.businessStepName||'this process step'}});
    state.textContent='Applied. Change only the exceptions if needed.';updateAutomationGuide();
  }
  function decisionsReady(){
    if(!latestDesign)return false;var req=latestDesign.requirements||[];return req.length>0&&req.every(hasDirection)
  }
  function updateAutomationGuide(){
    installAutomationGuide();var guide=byId('r111dAutomationGuide');if(!guide||!latestDesign)return;guide.classList.add('open');renderTalosProposal();renderBulkDirection();var button=byId('r111dPreparePlan');button.disabled=!decisionsReady();var state=byId('r111dAutomationState');state.className='r111dAutomationState';state.textContent=simpleReview?'Automation plan prepared.':proposalEligible()?'Talos prepared a draft so you do not have to classify every step.':decisionsReady()?'Your exception choices are ready. Talos can prepare the automation plan.':'Review only the items Talos could not safely group.';setTimeout(simplifyDesign,0)
  }
  async function post(path,payload){var response=await nativeFetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});var raw=await response.text();var body=raw?JSON.parse(raw):{};if(!response.ok)throw new Error(body.userMessage||body.error||body.code||('HTTP '+response.status));return body}
  function capabilitySelection(requirement){
    var explicit=explicitSelections[requirement.capabilityRequirementRef];
    if(explicit){
      var result={source:explicit.source,requirementRef:explicit.requirementRef,family:explicit.family,operationIntent:explicit.operationIntent,offeringCanonicalName:explicit.offeringCanonicalName,offeringLifecycleStatus:explicit.offeringLifecycleStatus,implementationKind:explicit.implementationKind,implementationRef:explicit.implementationRef,decidedBy:'one-app-product-user',authorityRef:authority('capability-selection'),rationale:'User explicitly selected how this business step should be executed in Automation Design.'};
      if(explicit.family==='HUMAN_INTERACTION')result.human={interactionKind:'MANUAL_ACTION',responsibilityKind:'PERFORMER',roleRefs:[],participantLabel:explicit.participantLabel,assignmentCardinality:'ANY_ELIGIBLE',outcomes:[{code:'COMPLETED',businessMeaning:explicit.businessStepName+' is complete.',terminal:true}]};
      return result;
    }
    var d=acceptedDecision(requirement);return{source:'SUGGESTION_DECISION',requirementRef:requirement.capabilityRequirementRef,suggestionDecisionRef:d.id,decidedBy:'one-app-product-user',authorityRef:authority('capability-selection'),rationale:'User explicitly selected this automation direction in the business-first journey.'};
  }
  async function preparePlan(){
    if(!latestDesign||!decisionsReady())return;var state=byId('r111dAutomationState');state.textContent='Preparing a reviewable automation plan…';
    try{
      var selections=(latestDesign.requirements||[]).map(capabilitySelection);
      await post('/api/automation/capability/select',{workspaceId:latestDesign.workspaceId,selections:selections});
      simpleReview=await post('/api/automation/execution-plan/review',{workspaceId:latestDesign.workspaceId,decisions:{}});
      var host=byId('r111dPlanSummary');host.innerHTML='';var elements=(simpleReview.execution&&simpleReview.execution.elements)||[];var counts={HUMAN_COORDINATION:0,CAPABILITY_INVOCATION:0,DECISION_COORDINATION:0,WAIT_COORDINATION:0,COMPLETION_COORDINATION:0,OTHER:0};elements.forEach(function(element){if(counts[element.kind]!==undefined)counts[element.kind]+=1;else counts.OTHER+=1});var parts=[];if(counts.HUMAN_COORDINATION)parts.push(counts.HUMAN_COORDINATION+' manual task'+(counts.HUMAN_COORDINATION===1?'':'s'));if(counts.CAPABILITY_INVOCATION)parts.push(counts.CAPABILITY_INVOCATION+' automated capability'+(counts.CAPABILITY_INVOCATION===1?'':'ies'));if(counts.DECISION_COORDINATION)parts.push(counts.DECISION_COORDINATION+' decision'+(counts.DECISION_COORDINATION===1?'':'s'));if(counts.WAIT_COORDINATION)parts.push(counts.WAIT_COORDINATION+' confirmed wait'+(counts.WAIT_COORDINATION===1?'':'s'));if(counts.COMPLETION_COORDINATION)parts.push(counts.COMPLETION_COORDINATION+' completion');var row=document.createElement('div');row.className='r111dPlanItem';row.textContent=parts.join(' · ');host.appendChild(row);
      if(simpleReview.review&&simpleReview.review.state==='READY_FOR_AUTOMATION_APPROVAL'){state.className='r111dAutomationState good';state.textContent='Talos prepared the plan from the proposal. Approve it only if this short summary matches your intent.';byId('r111dApproveAutomation').style.display='inline-block';renderTalosProposal()}else{state.textContent='Talos found a real execution-design exception that still needs review. No execution authority was created.'}
    }catch(error){state.className='r111dAutomationState bad';state.textContent=error instanceof Error?error.message:String(error)}
  }

  async function approveAutomationSimple(){
    if(!simpleReview)return;var state=byId('r111dAutomationState');state.textContent='Recording your automation approval…';
    try{
      var body=await post('/api/automation/approve',{reviewId:simpleReview.review.id,approvedBy:'one-app-product-user',authorityRef:authority('automation-approval'),rationale:'User explicitly approved the reviewed automation plan. Runtime, deployment and execution remain separate.'});
      simpleApproval=body;state.className='r111dAutomationState good';state.textContent='Automation approved. Nothing has been deployed or run yet.';
      window.dispatchEvent(new CustomEvent('talos:r1-06-automation-approved',{detail:{approvalId:body.id,reviewId:simpleReview.review.id,executionPlanRevisionId:body.executionPlanRevisionRef,executionPlanAssessmentId:body.executionPlanAssessmentRef,executionDigest:body.executionDigest,capabilityBindingRevisionRefs:body.capabilityBindingRevisionRefs||[],workspaceId:latestDesign.workspaceId}}));
      setStage('run');updateRun();
    }catch(error){state.className='r111dAutomationState bad';state.textContent=error instanceof Error?error.message:String(error)}
  }
  function installRun(){
    if(byId('r111dRun'))return;var grid=document.querySelector('.grid');if(!grid)return;var panel=document.createElement('section');panel.id='r111dRun';panel.className='r111dRun';panel.innerHTML='<h2>Make this process live</h2><p>Talos will guide the implementation while keeping every deployment and process start explicit. Technical infrastructure stays under Technical details.</p><div class="r111dRunActions"><button id="r111dPrepareTemporal" type="button" disabled>Prepare Temporal workflow</button></div><div id="r111dRunState" class="r111dRunState">Approve the automation first.</div><div class="r111gRunFlow"><section id="r111gRuntimeCard" class="r111gRunCard"><strong>1 · Prepare execution</strong><p>Use Talos\' safe recommended execution settings for this approved workflow.</p><div id="r111gRuntimeSummary" class="r111gRunSummary"></div><div class="r111dRunActions"><button id="r111gPrepareRuntime" type="button">Prepare execution</button></div><div id="r111gRuntimeState" class="r111gRunState"></div></section><section id="r111gDeploymentCard" class="r111gRunCard"><strong>2 · Prepare this environment</strong><p>Talos checks the configured environment against the approved workflow. You do not enter infrastructure coordinates in Simple Mode.</p><div id="r111gDeploymentSummary" class="r111gRunSummary"></div><div class="r111dRunActions"><button id="r111gPrepareDeployment" type="button">Prepare this environment</button></div><div id="r111gDeploymentState" class="r111gRunState"></div></section><section id="r111gDeployCard" class="r111gRunCard"><strong>3 · Make workflow available</strong><p>This explicitly authorizes one deployment. It does not start the business process.</p><div class="r111dRunActions"><button id="r111gDeploy" type="button">Make workflow available</button></div><div id="r111gDeployState" class="r111gRunState"></div></section><section id="r111gStartCard" class="r111gRunCard"><strong>4 · Start this process</strong><p>This explicitly authorizes one process instance. Talos will then show the live business work.</p><div class="r111dRunActions"><button id="r111gStart" type="button">Start this process</button><a id="r111gTemporalLink" style="display:none" target="_blank" rel="noreferrer">Open Temporal</a></div><div id="r111gStartState" class="r111gRunState"></div><div id="r111hWork" class="r111hWork"><div class="r111hWorkTop"><strong>Live business work</strong><span id="r111hBadge" class="r111hBadge">Connecting</span></div><div id="r111hTask" class="r111hTask">Reading current workflow state…</div><div id="r111hMeta" class="r111hMeta"></div><div class="r111hProgress"><span id="r111hProgressBar"></span></div><div class="r111hActions"><button id="r111hCompleteTask" type="button">Mark task completed</button><button id="r111hDecisionYes" type="button">Condition applies</button><button id="r111hDecisionNo" type="button">Condition does not apply</button><span id="r111hDecisionChoices"></span><span id="r111hState" class="r111hState"></span></div></div></section></div>';grid.insertAdjacentElement('afterend',panel);byId('r111dPrepareTemporal').onclick=prepareTemporal;byId('r111gPrepareRuntime').onclick=prepareRecommendedRuntime;byId('r111gPrepareDeployment').onclick=prepareLocalDeployment;byId('r111gDeploy').onclick=deployLocalWorker;byId('r111gStart').onclick=startLocalWorkflow;byId('r111hCompleteTask').onclick=completeCurrentHumanTask;byId('r111hDecisionYes').onclick=function(){resolveCurrentDecision(true)};byId('r111hDecisionNo').onclick=function(){resolveCurrentDecision(false)};
  }
  function updateRun(){installRun();var b=byId('r111dPrepareTemporal');if(b)b.disabled=!simpleApproval;var state=byId('r111dRunState');if(simpleApproval)state.textContent='Automation approved. You may export the Temporal workflow and stop, or explicitly choose implementation.'}
  function openRunCard(id){var n=byId(id);if(n)n.classList.add('open')}
  async function loadRuntimeTarget(){
    if(simpleRuntimeTarget)return simpleRuntimeTarget;var response=await nativeFetch('/api/product/runtime-target');var body=await response.json();if(!response.ok||!body.available||!body.target)throw new Error('This Talos host has no configured simple runtime target.');simpleRuntimeTarget=body.target;return simpleRuntimeTarget
  }
  function recommendedActivityPolicies(){
    var uses=(simpleReview&&simpleReview.execution&&simpleReview.execution.capabilityUses)||[];
    var units=(simpleMapping&&simpleMapping.units)||[];
    var activityUseIds=new Set();
    units.filter(function(unit){return unit.constructKind==='ACTIVITY'}).forEach(function(unit){
      (unit.executionSubjectRefs||[]).forEach(function(ref){activityUseIds.add(ref)})
    });
    return uses.filter(function(use){return activityUseIds.has(use.id)}).map(function(use){return{capabilityUseOccurrenceRef:use.id,authorityRef:authority('runtime-policy-activity'),decidedBy:'one-app-product-user',rationale:'User explicitly accepted Talos recommended bounded TEST runtime policy.',policyBasis:'USER_EXPLICIT_DESIGN',retry:{initialIntervalMs:500,backoffCoefficient:2,maximumIntervalMs:5000,maximumAttempts:3,nonRetryableFailureTypes:['INVALID_REQUEST','IDEMPOTENCY_CONFLICT']},timeout:{startToCloseMs:30000,scheduleToCloseMs:60000},idempotency:{requirement:'REQUIRED',strategyKind:'IDEMPOTENCY_KEY',keyContract:'sha256(executionId + capabilityUseOccurrenceRef)',enforcementRef:'ONE_APP_EFFECT_LEDGER'},failureClassifications:[{failureType:'TRANSIENT_FAILURE',retryable:true,businessFailure:false},{failureType:'INVALID_REQUEST',retryable:false,businessFailure:false},{failureType:'IDEMPOTENCY_CONFLICT',retryable:false,businessFailure:false}]}})
  }
  async function prepareRecommendedRuntime(){
    if(!simpleMapping||!simpleApproval)return;var button=byId('r111gPrepareRuntime'),state=byId('r111gRuntimeState');button.disabled=true;state.className='r111gRunState';state.textContent='Preparing safe execution settings…';
    try{var body=await post('/api/automation/runtime-policy',{approvalId:simpleApproval.id,temporalMappingRevisionId:simpleMapping.revision.id,activities:recommendedActivityPolicies(),workflow:{authorityRef:authority('workflow-runtime-policy'),decidedBy:'one-app-product-user',rationale:'User explicitly accepted one Workflow attempt; business execution is not retried implicitly.',maximumAttempts:1,policyBasis:'USER_EXPLICIT_DESIGN'}});simpleRuntimePolicy=body.runtimePolicy;state.className='r111gRunState good';state.textContent='Execution settings are ready. Nothing has been deployed.';button.textContent='Execution settings ready';var target=await loadRuntimeTarget();byId('r111gDeploymentSummary').textContent='Temporal namespace '+target.namespace+' · task queue '+target.taskQueue+' · '+target.workflowTypeName;openRunCard('r111gDeploymentCard')}
    catch(error){button.disabled=false;state.className='r111gRunState bad';state.textContent=error instanceof Error?error.message:String(error)}
  }
  async function prepareLocalDeployment(){
    if(!simpleRuntimePolicy)return;var button=byId('r111gPrepareDeployment'),state=byId('r111gDeploymentState');button.disabled=true;state.className='r111gRunState';state.textContent='Checking this Talos environment against the approved process…';
    try{var target=await loadRuntimeTarget();var designed=await post('/api/automation/deployment-design',{approvalId:simpleApproval.id,runtimePolicyRevisionId:simpleRuntimePolicy.revision.id,environmentKey:target.environmentKey,environmentClass:target.environmentClass,temporalPlatformRef:target.temporalPlatformRef,desiredNamespaceKey:target.namespace,desiredTaskQueueKey:target.taskQueue,desiredWorkflowTypeName:target.workflowTypeName,desiredActivityTypeName:target.activityTypeName,desiredWorkerLogicalName:target.workerLogicalName,authorityRef:authority('deployment-design'),decidedBy:'one-app-product-user',rationale:'User explicitly selected the configured local field-trial Temporal target.'});simpleDeploymentDesign=designed.deploymentDesign;var realized=await post('/api/automation/environment-realization',{approvalId:simpleApproval.id,deploymentRevisionId:simpleDeploymentDesign.revision.id,actualNamespace:target.namespace,taskQueue:target.taskQueue,workflowTypeName:target.workflowTypeName,activityTypeName:target.activityTypeName,workerLogicalName:target.workerLogicalName,executableArtifactRef:target.executableArtifactRef,artifactDigest:target.artifactDigest,sdkFamily:target.sdkFamily,sdkVersionRef:target.sdkVersionRef,authorityRef:authority('environment-realization'),realizedBy:'talos-field-trial-host'});simpleRealization=realized.deploymentRealization;state.className='r111gRunState good';state.textContent='This environment is ready for the workflow. Nothing has been deployed yet.';button.textContent='Environment ready';openRunCard('r111gDeployCard')}
    catch(error){button.disabled=false;state.className='r111gRunState bad';state.textContent=error instanceof Error?error.message:String(error)}
  }
  async function deployLocalWorker(){
    if(!simpleRealization)return;var button=byId('r111gDeploy'),state=byId('r111gDeployState');button.disabled=true;state.className='r111gRunState';state.textContent='Making this workflow available in the selected environment…';
    try{var approved=await post('/api/automation/deployment/approve',{automationApprovalId:simpleApproval.id,deploymentRevisionId:simpleRealization.revision.id,authorityRef:authority('deployment-approval'),approvedBy:'one-app-product-user',rationale:'User explicitly authorizes exactly one deployment attempt for this local field-trial revision.'});var attempted=await post('/api/automation/deployment/attempt',{deploymentApprovalId:approved.deploymentApproval.id,deploymentRevisionId:simpleRealization.revision.id});if(!attempted.deploymentAttemptSucceeded)throw new Error('The local Worker deployment did not succeed.');simpleDeploymentAttempt=attempted.deploymentAttempt;state.className='r111gRunState good';state.textContent='Workflow is available. The business process has not started.';button.textContent='Workflow available';openRunCard('r111gStartCard')}
    catch(error){button.disabled=false;state.className='r111gRunState bad';state.textContent=error instanceof Error?error.message:String(error)}
  }
  async function startLocalWorkflow(){
    if(!simpleDeploymentAttempt||!simpleRealization)return;var button=byId('r111gStart'),state=byId('r111gStartState');button.disabled=true;state.className='r111gRunState';state.textContent='Starting one explicitly authorized process instance…';
    try{var executionId='TALOS-R1-'+Date.now();var facts={};var capabilityInputs={};var binding=simpleRealization.workflowTypeBindings&&simpleRealization.workflowTypeBindings[0];if(!binding)throw new Error('The realized local environment has no workflow type binding.');var approved=await post('/api/automation/execution/approve',{automationApprovalId:simpleApproval.id,deploymentRevisionId:simpleRealization.revision.id,deploymentAttemptId:simpleDeploymentAttempt.id,workflowTypeBindingRef:binding.id,executionId:executionId,facts:facts,capabilityInputs:capabilityInputs,authorityRef:authority('workflow-execution-approval'),approvedBy:'one-app-product-user',rationale:'User explicitly authorizes exactly one local workflow start with this execution identity.'});var started=await post('/api/automation/execution/start',{workflowExecutionApprovalId:approved.workflowExecutionApproval.id,deploymentRevisionId:simpleRealization.revision.id,executionId:executionId,facts:facts,capabilityInputs:capabilityInputs});simpleExecutionObservation=started.workflowExecutionObservation;state.className='r111gRunState good';state.textContent='Workflow '+simpleExecutionObservation.workflowIdRef+' is '+String(simpleExecutionObservation.executionStatus).toLowerCase()+'. It is now visible in Temporal.';button.textContent='Process started';var target=await loadRuntimeTarget();var link=byId('r111gTemporalLink');if(target.temporalWebUi&&link){link.href=target.temporalWebUi.replace(/\/$/,'')+'/namespaces/'+encodeURIComponent(target.namespace)+'/workflows/'+encodeURIComponent(simpleExecutionObservation.workflowIdRef)+'/'+encodeURIComponent(simpleExecutionObservation.runIdRef);link.style.display='inline-flex';link.textContent='Open Temporal'}startRuntimeMonitor();window.dispatchEvent(new CustomEvent('talos:r1-07-workflow-observed',{detail:{automationApprovalId:simpleApproval.id,deploymentRevisionId:simpleRealization.revision.id,deploymentAttemptId:simpleDeploymentAttempt.id,executionApprovalId:approved.workflowExecutionApproval.id,executionObservation:simpleExecutionObservation}}))}
    catch(error){button.disabled=false;state.className='r111gRunState bad';state.textContent=error instanceof Error?error.message:String(error)}
  }
  function stopRuntimeMonitor(){if(runtimeMonitorTimer){clearInterval(runtimeMonitorTimer);runtimeMonitorTimer=null}}
  function renderRuntimeState(runtime){
    var host=byId('r111hWork'),badge=byId('r111hBadge'),task=byId('r111hTask'),meta=byId('r111hMeta'),bar=byId('r111hProgressBar'),button=byId('r111hCompleteTask'),decisionYes=byId('r111hDecisionYes'),decisionNo=byId('r111hDecisionNo'),decisionChoices=byId('r111hDecisionChoices'),state=byId('r111hState');if(!host||!runtime)return;host.classList.add('open');var work=runtime.currentWork||{};var progress=runtime.progress||{};var total=Math.max(1,Number(progress.humanTotal||0));var completed=Math.max(0,Number(progress.humanCompleted||0));if(bar)bar.style.width=Math.min(100,Math.round(completed/total*100))+'%';if(button){button.classList.remove('visible');button.disabled=false;button.dataset.executionElementRef=''}[decisionYes,decisionNo].forEach(function(decisionButton){if(decisionButton){decisionButton.classList.remove('visible');decisionButton.disabled=false;decisionButton.dataset.decisionRef=''}});if(decisionChoices)decisionChoices.innerHTML='';if(state){state.textContent='';state.className='r111hState'}
    if(runtime.executionStatus==='FAILED'||runtime.executionStatus==='CANCELLED'){badge.textContent=runtime.executionStatus;task.textContent='Workflow needs attention';meta.textContent='Temporal reported '+runtime.executionStatus.toLowerCase()+'. Open Temporal for technical evidence.';if(state)state.className='r111hState bad';stopRuntimeMonitor();return}
    if(work.kind==='COMPLETE'||runtime.executionStatus==='COMPLETED'){badge.textContent='Completed';task.textContent='Process complete';meta.textContent=completed+' human tasks completed on the executed path.';if(bar)bar.style.width='100%';stopRuntimeMonitor();var runState=byId('r111gStartState');if(runState){runState.className='r111gRunState good';runState.textContent='Workflow completed in Temporal.'}return}
    if(work.kind==='HUMAN_TASK'){badge.textContent='Waiting for you';task.textContent=work.businessStepName||'Human task';meta.textContent='Human work · '+completed+' of '+Number(progress.humanTotal||0)+' completed';if(button){button.dataset.executionElementRef=work.executionElementRef||'';button.classList.add('visible')}return}
    if(work.kind==='DECISION'){badge.textContent='Decision required';if(work.decisionMode==='CHOICE'&&Array.isArray(work.decisionOptions)&&work.decisionOptions.length){task.textContent=work.businessStepName||'Business decision';meta.textContent='Talos cannot safely infer this outcome. Choose one confirmed business branch.';if(decisionChoices){work.decisionOptions.forEach(function(option){var choice=document.createElement('button');choice.type='button';choice.textContent=option.label||'Choose outcome';choice.onclick=function(){resolveCurrentDecisionChoice(work.decisionRef||'',option.relationRef)};decisionChoices.appendChild(choice)})}return}task.textContent=work.decisionPrompt||work.businessStepName||'Business decision';meta.textContent='Talos cannot safely infer this condition. Choose whether it applies to this execution.';[decisionYes,decisionNo].forEach(function(decisionButton){if(decisionButton){decisionButton.dataset.decisionRef=work.decisionRef||'';decisionButton.classList.add('visible')}});return}
    if(work.kind==='WAIT'){badge.textContent='Timer running';task.textContent=work.businessStepName||'Waiting';meta.textContent='Talos is waiting automatically'+(work.waitExpression?' · '+work.waitExpression:'')+'. No action is required.';return}
    badge.textContent='Running';task.textContent=work.businessStepName||'Talos is advancing the workflow';meta.textContent='Temporal is processing the next coordination step.'}
  async function refreshRuntimeState(){
    if(!simpleExecutionObservation||!simpleApproval||runtimeMonitorBusy)return;runtimeMonitorBusy=true;try{var body=await post('/api/automation/execution/state',{automationApprovalId:simpleApproval.id});renderRuntimeState(body.runtime)}catch(error){var state=byId('r111hState');if(state){state.className='r111hState bad';state.textContent=error instanceof Error?error.message:String(error)}}finally{runtimeMonitorBusy=false}}
  function startRuntimeMonitor(){stopRuntimeMonitor();var host=byId('r111hWork');if(host)host.classList.add('open');refreshRuntimeState();runtimeMonitorTimer=setInterval(refreshRuntimeState,1000)}
  async function completeCurrentHumanTask(){
    if(!simpleExecutionObservation||!simpleApproval)return;var button=byId('r111hCompleteTask'),state=byId('r111hState'),ref=button&&button.dataset.executionElementRef;if(!button||!ref)return;button.disabled=true;if(state){state.className='r111hState';state.textContent='Completing this business step in Temporal…'}try{var body=await post('/api/automation/execution/human-task/complete',{automationApprovalId:simpleApproval.id,executionElementRef:ref});renderRuntimeState(body.runtime);setTimeout(refreshRuntimeState,100)}catch(error){button.disabled=false;if(state){state.className='r111hState bad';state.textContent=error instanceof Error?error.message:String(error)}}
  }
  async function resolveCurrentDecision(applies){
    if(!simpleExecutionObservation||!simpleApproval)return;var yes=byId('r111hDecisionYes'),no=byId('r111hDecisionNo'),state=byId('r111hState'),ref=(yes&&yes.dataset.decisionRef)||(no&&no.dataset.decisionRef);if(!ref)return;if(yes)yes.disabled=true;if(no)no.disabled=true;if(state){state.className='r111hState';state.textContent='Recording this business decision in Temporal…'}try{var body=await post('/api/automation/execution/decision/resolve',{automationApprovalId:simpleApproval.id,decisionRef:ref,applies:applies===true});renderRuntimeState(body.runtime);setTimeout(refreshRuntimeState,100)}catch(error){if(yes)yes.disabled=false;if(no)no.disabled=false;if(state){state.className='r111hState bad';state.textContent=error instanceof Error?error.message:String(error)}}
  }
  async function resolveCurrentDecisionChoice(decisionRef,selectedRelationRef){
    if(!simpleExecutionObservation||!simpleApproval||!decisionRef||!selectedRelationRef)return;var choices=byId('r111hDecisionChoices'),state=byId('r111hState');if(choices)Array.from(choices.querySelectorAll('button')).forEach(function(button){button.disabled=true});if(state){state.className='r111hState';state.textContent='Recording the selected business outcome in Temporal…'}try{var body=await post('/api/automation/execution/decision/resolve',{automationApprovalId:simpleApproval.id,decisionRef:decisionRef,selectedRelationRef:selectedRelationRef});renderRuntimeState(body.runtime);setTimeout(refreshRuntimeState,100)}catch(error){if(choices)Array.from(choices.querySelectorAll('button')).forEach(function(button){button.disabled=false});if(state){state.className='r111hState bad';state.textContent=error instanceof Error?error.message:String(error)}}
  }
  async function prepareTemporal(){
    if(!simpleApproval)return;var state=byId('r111dRunState');state.className='r111dRunState';state.textContent='Reusing your confirmed waits and approved human/system choices to prepare Temporal…';
    try{var button=byId('r111dPrepareTemporal');if(button)button.disabled=true;var body=await post('/api/automation/temporal-mapping',{approvalId:simpleApproval.id,useRecommendedMapping:true,allowDurableRecovery:true,decidedBy:'one-app-product-user',authorityRef:authority('temporal-mapping'),rationale:'User explicitly requested Talos to prepare the recommended technical Temporal mapping from already approved process and automation semantics.'});simpleMapping=body.mapping;if(body.deploymentAuthorized!==false||body.executionAuthorized!==false)throw new Error('Talos refused an unsafe authority transition.');state.className='r111dRunState good';state.textContent=body.durableRecoveryApplied?'Temporal design recovered from your durable approved plan. Nothing has been deployed or started.':'Temporal design prepared from the information you already confirmed. Nothing has been deployed or started.';if(button){button.textContent='Temporal design ready';button.disabled=true}var target=await loadRuntimeTarget();byId('r111gRuntimeSummary').textContent='TEST runtime · up to 3 Activity attempts · 30s Activity timeout · one Workflow attempt · target '+target.namespace;openRunCard('r111gRuntimeCard');window.dispatchEvent(new CustomEvent('talos:r1-11d-temporal-ready',{detail:{mapping:simpleMapping}}))}
    catch(error){var button=byId('r111dPrepareTemporal');if(button)button.disabled=false;var message=error instanceof Error?error.message:String(error);state.className='r111dRunState bad';state.textContent=message.indexOf('RECOMMENDED_TEMPORAL_MAPPING_NEEDS_EXPLICIT_WAIT_DECISION')>=0?'One wait has execution semantics that cannot be safely selected automatically. Talos should ask only for that specific wait.':'Talos could not safely reconstruct one approved execution detail. Your approved process is unchanged.'}
  }
  function renderReviewList(containerId,items,className,formatter){
    var box=byId(containerId);if(!box)return;box.innerHTML='';
    if(!items||!items.length){var empty=document.createElement('div');empty.className=className;empty.textContent='None';box.appendChild(empty);return}
    items.slice(0,12).forEach(function(item){var row=document.createElement('div');row.className=className;row.textContent=formatter(item);box.appendChild(row)})
  }
  function renderProductCandidate(reconciliation,badgeText){
    var process=reconciliation&&reconciliation.processRevision;if(!process)return;
    var validation=reconciliation.validation||{};
    var host=byId('nodes');if(host){host.innerHTML='';(process.nodes||[]).forEach(function(node){var row=document.createElement('div');row.className='node';var name=document.createElement('strong');name.textContent=node.name||node.kind||'Process step';var meta=document.createElement('span');var details=node.details||{};var timing=node.kind==='WAIT'&&details.expression?' · '+details.expression:'';meta.textContent=(node.kind||'NODE')+timing+' · '+(node.truthClass||'INFERRED');row.appendChild(name);row.appendChild(meta);host.appendChild(row)})}
    renderReviewList('questions',validation.questions||[],'question',function(q){return(q.code?q.code+' · ':'')+(q.question||q.prompt||q.description||'Reviewer input required')});
    renderReviewList('findings',validation.findings||[],'finding',function(f){return(f.code?f.code+' · ':'')+(f.title||f.description||'Validation finding')});
    var metaHost=byId('meta');if(metaHost){metaHost.innerHTML='';[['Canonical revision',process.id||'—'],['Semantic status',process.semanticStatus||'INFERRED'],['Execution readiness',validation.assessment?validation.assessment.executionReadiness:'NOT AUTHORIZED']].forEach(function(pair){var item=document.createElement('div');item.className='metric';var key=document.createElement('div');key.className='k';key.textContent=pair[0];var value=document.createElement('div');value.className='v';value.textContent=pair[1];item.appendChild(key);item.appendChild(value);metaHost.appendChild(item)})}
    var badge=byId('reviewBadge');if(badge&&badgeText){badge.textContent=badgeText;badge.className='badge corrected'}
    var review=byId('review');if(review)review.className='review open';
  }
  function installCopy(){
    var h=document.querySelector('.top h1');if(h)h.textContent='Show Talos how your business works.';
    var p=document.querySelector('.top .lead');if(p)p.textContent='Use an image, BPMN, or create the process here. Talos will do the technical translation and ask only for business decisions it cannot safely infer.';
    var open=byId('r105Open');if(open)open.textContent='Let Talos prepare an automation proposal';
    var design=byId('r105AutomationDesign');if(design){var h3=design.querySelector('h3');if(h3)h3.textContent='Prepare automation';var intro=design.querySelector('p');if(intro)intro.textContent='Talos will propose a safe automation draft from the process you already confirmed. You review the proposal, not every internal binding.'}
  }
  function resetCanvas(){
    canvasRows().forEach(function(row){row.remove()});Array.from(document.querySelectorAll('.r111dConnection')).forEach(function(row){row.remove()});canvasCounter=0;connectionCounter=0;refreshConnectionSelects();
  }
  window.talosProductCanvas={
    show:showCanvas,
    addStep:addStep,
    addConnection:addConnection,
    reset:resetCanvas,
    payload:canvasPayload,
    refresh:refreshConnectionSelects
  };
  window.talosProductJourney={setStage:setStage,selectMode:selectMode};
  installJourney();installSourceChooser();installContinue();installAutomationGuide();installRun();installCopy();setStage('process');
  window.addEventListener('talos:r1-11c-semantic-resolution-applied',function(event){hasCandidate=true;var detail=event&&event.detail;renderProductCandidate(detail&&detail.reconciliation,'UPDATED · RECONFIRMATION REQUIRED');setStage('review')});
  window.addEventListener('talos:r1-04-business-process-confirmed',function(){hasCandidate=true;setStage('automate')});
  window.addEventListener('talos:r1-05-automation-design-updated',function(event){latestDesign=event&&event.detail;document.body.classList.add('r111fDesignReady');updateAutomationGuide();setTimeout(simplifyDesign,10)});
  window.addEventListener('talos:r1-05-automation-design-invalidated',function(){latestDesign=null;explicitSelections={};simpleReview=null;simpleApproval=null;simpleMapping=null;simpleRuntimeTarget=null;simpleRuntimePolicy=null;simpleDeploymentDesign=null;simpleRealization=null;simpleDeploymentAttempt=null;simpleExecutionObservation=null;stopRuntimeMonitor();document.body.classList.remove('r111fDesignReady','r111fExceptions')});
  window.addEventListener('talos:r1-06-automation-approved',function(){setStage('run');updateRun()});
  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';var method=String((init&&init.method)||'GET').toUpperCase();
    return nativeFetch(input,init).then(function(response){
      var sourceInput=path.indexOf('/api/input/image')!==-1||path.indexOf('/api/input/bpmn')!==-1||path.indexOf('/api/input/canvas')!==-1;
      var clarified=path.indexOf('/api/semantic-resolution/decide')!==-1;
      var confirmed=path.indexOf('/api/bpmn/confirm')!==-1;
      if(response.ok&&method==='POST'&&(sourceInput||clarified||confirmed)){
        response.clone().json().then(function(body){
          if(body&&body.revision&&body.reconciliation&&body.reconciliation.status==='RECONCILED'){
            hasCandidate=true;
            if(sourceInput)renderProductCandidate(body.reconciliation,'READY · NOT CONFIRMED');
            else if(clarified)renderProductCandidate(body.reconciliation,'UPDATED · RECONFIRMATION REQUIRED');
            else if(confirmed)renderProductCandidate(body.reconciliation,'CONFIRMED · AUTOMATION NOT AUTHORIZED');
            if(sourceInput||clarified)setStage('review');
          }
        }).catch(function(){});
      }
      return response;
    });
  };
})();
</script>`;

export function renderR111DBusinessFirstPage(basePage:string):string{
  const marker='</body>';
  if(!basePage.includes(marker))throw new TypeError('R1-11D business-first UX requires a closing body tag');
  return basePage.replace(marker,`${R1_11D_BUSINESS_FIRST_EXTENSION}\n${marker}`);
}
