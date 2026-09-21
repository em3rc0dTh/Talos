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
  body.r111dSimple .r105Meta,body.r111dSimple .r105Suggestion small,body.r111dSimple .r105RequirementState{display:none!important}
  body.r111dSimple .r105RequirementTitle{font-size:12px}
  body.r111dSimple .r105DecisionButtons button{background:#22364a;color:#e3edf6}
  body.r111dTechnicalMode .truth,body.r111dTechnicalMode #r110Nav,body.r111dTechnicalMode #r110Recovery,body.r111dTechnicalMode .runtime,body.r111dTechnicalMode #r106ExecutionPlan,body.r111dTechnicalMode #r107RuntimeAuthority{display:grid!important}
  body.r111dTechnicalMode #r110Nav{display:flex!important}body.r111dTechnicalMode .runtime{display:block!important}body.r111dTechnicalMode #r106ExecutionPlan,body.r111dTechnicalMode #r107RuntimeAuthority,body.r111dTechnicalMode #r110Recovery{display:block!important}
  .r111dResolve{margin-top:9px;border:1px solid #314960;border-radius:10px;padding:10px;background:#08121c}.r111dResolvePrompt{font-size:11px;color:#b7c7d8;line-height:1.45;margin-bottom:8px}.r111dResolveGrid{display:grid;grid-template-columns:180px 1fr;gap:7px}.r111dResolve select,.r111dResolve input{width:100%;background:#0e1823;color:#eef5fb;border:1px solid #334a63;border-radius:8px;padding:8px;font:inherit}.r111dResolveActions{display:flex;gap:8px;align-items:center;margin-top:8px}.r111dResolveSaved{font-size:10px;color:#66e4bd}.r111dResolveHint{font-size:10px;color:#91a5b8;margin-top:6px;line-height:1.4}
  @media(max-width:800px){.r111dSteps,.r111dSourceChooser{grid-template-columns:1fr}.r111dConnection,.r111dResolveGrid{grid-template-columns:1fr}.r111dCanvasRow{grid-template-columns:90px 1fr auto}}
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
    canvasCounter+=1;var id='step-'+canvasCounter;var host=byId('r111dCanvasRows');var row=document.createElement('div');row.className='r111dCanvasRow';row.draggable=true;row.dataset.id=id;row.dataset.kind=kind;
    row.innerHTML='<select class="r111dKind"><option value="'+kind+'">'+kind.replace('_',' ')+'</option></select><input class="r111dLabel" value="'+(label||'')+'" placeholder="What happens here?"><button type="button">Remove</button>';
    row.querySelector('button').onclick=function(){row.remove();refreshConnectionSelects()};
    row.addEventListener('dragstart',function(){dragId=id});row.addEventListener('dragover',function(e){e.preventDefault()});row.addEventListener('drop',function(e){e.preventDefault();var dragged=document.querySelector('.r111dCanvasRow[data-id="'+dragId+'"]');if(dragged&&dragged!==row)host.insertBefore(dragged,row);refreshConnectionSelects()});
    host.appendChild(row);refreshConnectionSelects();return row;
  }
  function addConnection(){
    connectionCounter+=1;var row=document.createElement('div');row.className='r111dConnection';row.dataset.id='connection-'+connectionCounter;
    row.innerHTML='<select class="r111dFrom"></select><select class="r111dTo"></select><select class="r111dConnKind"><option value="FLOW">Then</option><option value="CONDITION">When...</option><option value="DEFAULT">Otherwise</option><option value="PARALLEL">At the same time</option></select><input class="r111dCondition" placeholder="Condition, if needed"><button type="button">Remove</button>';
    stepOption(row.querySelector('.r111dFrom'));stepOption(row.querySelector('.r111dTo'));row.querySelector('button').onclick=function(){row.remove()};byId('r111dConnections').appendChild(row);
  }
  function installCanvas(sourceCard){
    if(byId('r111dCanvas'))return;var panel=document.createElement('section');panel.id='r111dCanvas';panel.className='r111dCanvas';
    panel.innerHTML='<h3>Create your process</h3><p>Add the steps in business language. Talos will preserve this Canvas as the source, then send it through the same review and confirmation path as images and BPMN.</p><input id="r111dCanvasTitle" class="r111dCanvasTitle" value="My process" placeholder="Process name"><div class="r111dPalette"><button data-kind="START">+ Start</button><button data-kind="STEP">+ Step</button><button data-kind="DECISION">+ Decision</button><button data-kind="WAIT">+ Wait</button><button data-kind="APPROVAL">+ Person / approval</button><button data-kind="SUBPROCESS">+ Subprocess</button><button data-kind="END">+ End</button></div><div id="r111dCanvasRows" class="r111dCanvasRows"></div><div class="sectionLabel">Connections</div><div id="r111dConnections" class="r111dConnections"></div><div class="r111dCanvasActions"><button id="r111dAddConnection" type="button" class="secondary">Add connection</button><button id="r111dReviewCanvas" type="button">Review my process</button><span id="r111dCanvasState" class="r111dCanvasState"></span></div>';
    sourceCard.appendChild(panel);Array.from(panel.querySelectorAll('.r111dPalette button')).forEach(function(b){b.addEventListener('click',function(){addStep(this.dataset.kind,this.dataset.kind==='START'?'Start':this.dataset.kind==='END'?'End':'')})});byId('r111dAddConnection').onclick=addConnection;byId('r111dReviewCanvas').onclick=submitCanvas;
  }
  function showCanvas(){var p=byId('r111dCanvas');if(p)p.classList.add('open');if(canvasRows().length===0){addStep('START','Start');addStep('END','End')}}
  function canvasPayload(){
    var elements=canvasRows().map(function(row){var kind=row.dataset.kind,label=row.querySelector('.r111dLabel').value.trim();if(!label)throw new Error('Every step needs a name.');var payload={id:row.dataset.id,kind:kind,label:label};if(kind==='WAIT'){payload.waitKind='';}return payload});
    var connections=Array.from(document.querySelectorAll('.r111dConnection')).map(function(row){return{id:row.dataset.id,from:row.querySelector('.r111dFrom').value,to:row.querySelector('.r111dTo').value,kind:row.querySelector('.r111dConnKind').value,condition:row.querySelector('.r111dCondition').value.trim()}});
    return{title:byId('r111dCanvasTitle').value.trim()||'My process',initiatedBy:'one-app-product-user',elements:elements,connections:connections};
  }
  async function submitCanvas(){
    var state=byId('r111dCanvasState');var button=byId('r111dReviewCanvas');button.disabled=true;state.className='r111dCanvasState';state.textContent='Preparing your process for review…';
    try{var response=await fetch('/api/input/canvas',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(canvasPayload())});var body=await response.json();if(!response.ok)throw new Error(body.userMessage||body.error||('HTTP '+response.status));if(body.status!=='BPMN_READY_FOR_PROCESS_REVIEW')throw new Error(body.userMessage||'Talos saved the process but cannot review it yet.');state.className='r111dCanvasState good';state.textContent='Process ready for review.';hasCandidate=true;setStage('review')}
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
      var existing=explicitSelections[requirement.capabilityRequirementRef];
      if(existing){family.value=existing.family;offering.value=existing.offeringCanonicalName;participant.value=existing.participantLabel||'';participant.style.display=family.value==='HUMAN_INTERACTION'?'block':'none';saved.textContent='Direction selected'}
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
    var design=byId('r105AutomationDesign');if(!design||byId('r111dAutomationGuide'))return;var guide=document.createElement('section');guide.id='r111dAutomationGuide';guide.className='r111dAutomationGuide';guide.innerHTML='<h4>Automation plan</h4><p>For each business step, tell Talos who or what should perform it. Talos will keep this separate from the confirmed business process.</p><div id="r111dPlanSummary" class="r111dPlanSummary"></div><div class="r111dAutomationActions"><button id="r111dPreparePlan" type="button" disabled>Prepare automation plan</button><button id="r111dApproveAutomation" type="button" style="display:none">Approve automation</button></div><div id="r111dAutomationState" class="r111dAutomationState"></div>';design.appendChild(guide);byId('r111dPreparePlan').onclick=preparePlan;byId('r111dApproveAutomation').onclick=approveAutomationSimple;
  }
  function decisionsReady(){
    if(!latestDesign)return false;var req=latestDesign.requirements||[];return req.length>0&&req.every(hasDirection)
  }
  function updateAutomationGuide(){
    installAutomationGuide();var guide=byId('r111dAutomationGuide');if(!guide||!latestDesign)return;guide.classList.add('open');var button=byId('r111dPreparePlan');button.disabled=!decisionsReady();var state=byId('r111dAutomationState');state.className='r111dAutomationState';state.textContent=decisionsReady()?'Your choices are ready. Talos can prepare the automation plan.':'Choose how each business step should be handled.';setTimeout(simplifyDesign,0)
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
      var host=byId('r111dPlanSummary');host.innerHTML='';(simpleReview.execution&&simpleReview.execution.elements||[]).forEach(function(element,index){var row=document.createElement('div');row.className='r111dPlanItem';row.textContent=(index+1)+'. '+String(element.kind||'Step').replaceAll('_',' ').toLowerCase();host.appendChild(row)});
      if(simpleReview.review&&simpleReview.review.state==='READY_FOR_AUTOMATION_APPROVAL'){state.className='r111dAutomationState good';state.textContent='Automation plan ready. Review the summary and approve it when it matches your intent.';byId('r111dApproveAutomation').style.display='inline-block'}else{state.textContent='Talos needs more automation detail before approval. No execution authority was created.'}
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
    if(byId('r111dRun'))return;var grid=document.querySelector('.grid');if(!grid)return;var panel=document.createElement('section');panel.id='r111dRun';panel.className='r111dRun';panel.innerHTML='<h2>Run & monitor</h2><p>Your business process and automation remain versioned and traceable. Preparing a Temporal workflow does not deploy or start it.</p><div class="r111dRunActions"><button id="r111dPrepareTemporal" type="button" disabled>Prepare Temporal workflow</button></div><div id="r111dRunState" class="r111dRunState">Approve the automation first.</div>';grid.insertAdjacentElement('afterend',panel);byId('r111dPrepareTemporal').onclick=prepareTemporal;
  }
  function updateRun(){installRun();var b=byId('r111dPrepareTemporal');if(b)b.disabled=!simpleApproval;var s=byId('r111dRunState');if(simpleApproval)s.textContent='Automation approved. Temporal workflow preparation is available; deployment and execution are still separate.'}
  async function prepareTemporal(){
    if(!simpleApproval)return;var state=byId('r111dRunState');state.textContent='Preparing the Temporal workflow design…';
    try{var body=await post('/api/automation/temporal-mapping',{approvalId:simpleApproval.id,waits:[],humans:[]});var mapping=body.mapping;if(body.deploymentAuthorized!==false||body.executionAuthorized!==false)throw new Error('Talos refused an unsafe authority transition.');state.className='r111dRunState good';state.textContent='Temporal workflow prepared. It has not been deployed or started. Runtime administration remains separate from the business journey.';window.dispatchEvent(new CustomEvent('talos:r1-11d-temporal-ready',{detail:{mapping:mapping}}))}
    catch(error){state.className='r111dRunState bad';state.textContent='Talos needs one more execution detail before it can prepare the Temporal workflow. Your approved process is safe and unchanged.'}
  }
  function installCopy(){
    var h=document.querySelector('.top h1');if(h)h.textContent='Show Talos how your business works.';
    var p=document.querySelector('.top .lead');if(p)p.textContent='Use an image, BPMN, or create the process here. Talos will ask only what it needs, then help you prepare a governed automation.';
  }
  installJourney();installSourceChooser();installContinue();installAutomationGuide();installRun();installCopy();setStage('process');
  window.addEventListener('talos:r1-11c-semantic-resolution-applied',function(){hasCandidate=true;setStage('review')});
  window.addEventListener('talos:r1-04-business-process-confirmed',function(){hasCandidate=true;setStage('automate')});
  window.addEventListener('talos:r1-05-automation-design-updated',function(event){latestDesign=event&&event.detail;updateAutomationGuide();setTimeout(simplifyDesign,10)});
  window.addEventListener('talos:r1-06-automation-approved',function(){setStage('run');updateRun()});
  window.fetch=function(input,init){
    var path=typeof input==='string'?input:(input&&input.url)||'';var method=String((init&&init.method)||'GET').toUpperCase();
    return nativeFetch(input,init).then(function(response){if(response.ok&&method==='POST'&&(path.indexOf('/api/input/image')!==-1||path.indexOf('/api/input/bpmn')!==-1||path.indexOf('/api/input/canvas')!==-1)){response.clone().json().then(function(body){if(body&&body.revision&&body.reconciliation&&body.reconciliation.status==='RECONCILED'){hasCandidate=true;setStage('review')}}).catch(function(){})}return response});
  };
})();
</script>`;

export function renderR111DBusinessFirstPage(basePage:string):string{
  const marker='</body>';
  if(!basePage.includes(marker))throw new TypeError('R1-11D business-first UX requires a closing body tag');
  return basePage.replace(marker,`${R1_11D_BUSINESS_FIRST_EXTENSION}\n${marker}`);
}
