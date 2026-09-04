export const ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var advanced=false;
  var nativeFetch=window.fetch.bind(window);
  var refreshTimer=0;
  var modalSvg=null;
  var modalBaseWidth=1200;
  var modalZoom=1;
  var materialAutoOpenedKey='';
  var runtimeProfile=null;
  var deployRecoveryRunning=false;
  var runRecoveryRunning=false;

  function byId(id){return document.getElementById(id)}
  function all(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector))}
  function txt(node){return String(node&&node.textContent||'').trim()}
  function hide(node){if(node&&node.style.display!=='none')node.style.display='none'}
  function show(node){if(node&&node.style.display==='none')node.style.display=''}
  function safeClick(id){var button=byId(id);if(button&&!button.disabled){button.click();return true}return false}
  function technicalPill(node){return /^(SUGGESTED|DESIGN (COMPLETE|PARTIAL)|PRIMARY_ACCEPTED|FALLBACK_ACCEPTED|UNRESOLVED_AFTER_FALLBACK|READY_FOR_CAPABILITY_SELECTION|NEEDS_CAPABILITY_CONFIGURATION)$/i.test(txt(node))}

  function installStyle(){
    if(byId('talosClientSurfaceStyle'))return;
    var style=document.createElement('style');
    style.id='talosClientSurfaceStyle';
    style.textContent='\
      .shell{max-width:1800px!important;width:100%!important}\
      .grid.talos-product-wide{grid-template-columns:minmax(0,1fr)!important}\
      .grid.talos-product-wide>main.stack{width:100%!important;max-width:none!important}\
      .grid.talos-product-wide>aside.stack{display:none!important}\
      .talos-canvas{min-height:0!important;position:relative;cursor:zoom-in}\
      .talos-canvas svg{min-width:1000px!important}\
      .talos-canvas-title{gap:10px!important}\
      .talos-canvas-open{margin-left:auto;white-space:nowrap;padding:6px 10px!important;font-size:12px!important}\
      .talos-evidence-count{display:inline-flex;margin-left:8px;padding:2px 7px;border:1px solid #42506a;border-radius:999px;color:#94a3b8;font-size:10px;font-weight:800}\
      .talos-material-trigger{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:12px 0 4px;padding:12px 14px;border:1px solid #665522;border-left:4px solid var(--warn);border-radius:12px;background:#17150e}\
      .talos-material-trigger strong{display:block}.talos-material-trigger small{display:block;color:#c8b77d;margin-top:2px}.talos-material-trigger button{white-space:nowrap;background:#f0d576;color:#171105;border-color:#f0d576}\
      #talosQuestionModal{position:fixed;inset:0;z-index:100000;background:rgba(3,7,13,.78);display:none;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(5px)}\
      #talosQuestionModal.open{display:flex}\
      #talosQuestionDialog{width:min(720px,96vw);max-height:90vh;overflow:hidden;background:#111925;border:1px solid #3b4a63;border-radius:18px;box-shadow:0 28px 90px rgba(0,0,0,.58);display:flex;flex-direction:column}\
      #talosQuestionHeader{display:flex;align-items:flex-start;gap:12px;padding:18px 20px 12px;border-bottom:1px solid #273246}\
      #talosQuestionHeaderText{flex:1}#talosQuestionHeaderText strong{font-size:20px;display:block}#talosQuestionHeaderText small{display:block;color:var(--muted);margin-top:4px}\
      #talosQuestionClose{width:36px;height:36px;padding:0;border-radius:50%;font-size:20px}\
      #talosQuestionBody{padding:18px 20px 20px;overflow:auto}\
      #talosQuestionBody .requirement{display:block!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important}\
      #talosQuestionBody .requirement>strong,#talosQuestionBody .requirement>small{display:none!important}\
      #talosQuestionBody .item{background:#0b1018;border:1px solid #33445f;padding:12px;border-radius:12px;margin-bottom:9px}\
      #talosQuestionBody .item strong{font-size:14px}#talosQuestionBody .item small{display:block!important;color:var(--muted)!important;margin-top:3px}\
      #talosQuestionBody input{margin-top:8px;font-size:14px}\
      #talosQuestionBody .row{justify-content:flex-end;margin-top:14px!important}\
      #talosQuestionBody .row button.primary{background:#f0d576!important;color:#171105!important;border-color:#f0d576!important;padding:10px 15px!important}\
      #talosCanvasModal{position:fixed;inset:0;z-index:99999;background:rgba(3,7,13,.92);padding:18px;display:none;align-items:stretch;justify-content:center}\
      #talosCanvasModal.open{display:flex}\
      #talosCanvasModalPanel{width:min(98vw,1900px);height:calc(100vh - 36px);background:#0c1119;border:1px solid #33445f;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 100px rgba(0,0,0,.55)}\
      #talosCanvasModalBar{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid #273246;background:#111925}\
      #talosCanvasModalTitle{font-weight:800;margin-right:auto}\
      #talosCanvasViewport{flex:1;overflow:auto;background:#f8fafc;padding:18px}\
      #talosCanvasViewport svg{display:block;height:auto!important;max-width:none!important;margin:0 auto}\
      #talosCanvasZoom{min-width:56px;text-align:center;color:#b8c8de;font-size:12px;font-weight:800}\
      .talos-release-state{margin-top:12px;border-left:3px solid var(--good);background:#0a1019;padding:10px 12px;border-radius:7px;color:#c8d5ea}\
      @media(max-width:900px){.shell{padding:16px!important}.talos-canvas svg{min-width:900px!important}#talosCanvasModal{padding:8px}#talosCanvasModalPanel{height:calc(100vh - 16px)}.talos-material-trigger{align-items:flex-start;flex-direction:column}}\
    ';
    document.head.appendChild(style);
  }

  function applyLayout(){
    var grid=document.querySelector('.grid');
    if(!grid)return;
    if(advanced)grid.classList.remove('talos-product-wide');
    else grid.classList.add('talos-product-wide');
  }

  function groupExactDuplicates(node,pattern){
    if(!node)return;
    var matching=all(':scope > .item',node).filter(function(item){return pattern.test(txt(item))});
    if(matching.length<2)return;
    matching.forEach(function(item,index){
      if(index===0){
        item.style.display='';
        var badge=item.querySelector('.talos-evidence-count');
        if(!badge){badge=document.createElement('span');badge.className='talos-evidence-count';item.appendChild(badge)}
        badge.textContent='×'+matching.length;
      }else item.style.display='none';
    });
  }

  function compactTechnicalEvidence(){
    groupExactDuplicates(byId('questions'),/^Reviewer input required$/i);
    groupExactDuplicates(byId('findings'),/^SV-SRC-001\s*·\s*Material inferred meaning needs confirmation$/i);
  }

  function applyReviewNoise(){
    var review=byId('reviewCard');if(!review)return;
    var nodes=byId('processNodes');var questions=byId('questions');var findings=byId('findings');var advancedReview=byId('talosReviewAdvanced');
    [nodes,questions,findings,advancedReview].forEach(function(node){if(!node)return;if(advanced)show(node);else hide(node)});
    all('h3',review).forEach(function(h){if(/^(Questions|Findings)$/i.test(txt(h))){if(advanced)show(h);else hide(h)}});
    all('button',review).forEach(function(button){if(/review questions|validation findings|advanced BPMN\/XML/i.test(txt(button))){if(advanced)show(button);else hide(button)}});
  }

  function ensureQuestionModal(){
    var modal=byId('talosQuestionModal');if(modal)return modal;
    modal=document.createElement('div');modal.id='talosQuestionModal';modal.setAttribute('aria-hidden','true');
    var dialog=document.createElement('div');dialog.id='talosQuestionDialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
    var header=document.createElement('div');header.id='talosQuestionHeader';
    var words=document.createElement('div');words.id='talosQuestionHeaderText';
    var title=document.createElement('strong');title.textContent='Talos needs your confirmation';
    var copy=document.createElement('small');copy.textContent='Only answer what changes the business meaning. Technical evidence stays out of your way.';
    var close=document.createElement('button');close.id='talosQuestionClose';close.type='button';close.textContent='×';close.setAttribute('aria-label','Close');
    var body=document.createElement('div');body.id='talosQuestionBody';
    words.append(title,copy);header.append(words,close);dialog.append(header,body);modal.appendChild(dialog);document.body.appendChild(modal);
    function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow=''}
    close.addEventListener('click',closeModal);modal.addEventListener('click',function(event){if(event.target===modal)closeModal()});
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&modal.classList.contains('open'))closeModal()});
    modal._talosOpen=function(panel){if(!panel)return;body.innerHTML='';body.appendChild(panel);modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'};
    modal._talosClose=closeModal;
    return modal;
  }

  function materialPanels(){
    var panels=all('[data-talos-material-question]');var branch=byId('branchConditionResolution');if(branch&&panels.indexOf(branch)<0)panels.push(branch);
    return panels.filter(function(panel){return !panel.classList.contains('hidden')&&panel.style.display!=='none'&&all('input,select,textarea',panel).length>0});
  }

  function materialKey(panel){return all('strong,small,input,select,textarea',panel).map(function(node){return node.value!==undefined?String(node.value):txt(node)}).join('|')}

  function ensureMaterialTrigger(panel){
    var canvas=byId('talosBpmnCanvas');if(!canvas)return null;
    var trigger=byId('talosMaterialQuestionTrigger');
    if(!trigger){
      trigger=document.createElement('div');trigger.id='talosMaterialQuestionTrigger';trigger.className='talos-material-trigger';
      var words=document.createElement('div');var title=document.createElement('strong');title.textContent='Talos needs one business confirmation';var copy=document.createElement('small');copy.textContent='Answer it now; no Advanced screen or technical review is required.';
      var open=document.createElement('button');open.type='button';open.textContent='Answer now';
      words.append(title,copy);trigger.append(words,open);canvas.insertAdjacentElement('afterend',trigger);
      open.addEventListener('click',function(){var current=materialPanels()[0];if(current){var modal=ensureQuestionModal();modal._talosOpen(current)}});
    }
    var count=all('.item',panel).length||all('input,select,textarea',panel).length;
    var strong=trigger.querySelector('strong');if(strong)strong.textContent='Talos needs '+Math.max(1,count)+' business confirmation'+(count===1?'':'s');
    return trigger;
  }

  function bindMaterialAutoSave(panel){
    var action=all('button',panel).find(function(button){return /Apply branch conditions|Confirm branch meanings|Confirm answers|Save answers/i.test(txt(button))});
    if(!action)return;
    action.textContent='Confirm answers';
    if(action.dataset.talosAutoSaveBound==='true')return;
    action.dataset.talosAutoSaveBound='true';
    action.addEventListener('click',function(){
      window.setTimeout(function(){
        var save=byId('saveCorrection');
        if(save&&!save.disabled){var state=all('.pill',panel).slice(-1)[0];if(state)state.textContent='Updating the process review…';save.click()}
      },100);
    });
  }

  function applyMaterialQuestions(){
    var panels=materialPanels();var trigger=byId('talosMaterialQuestionTrigger');var modal=byId('talosQuestionModal');
    if(!panels.length){if(trigger)hide(trigger);if(modal&&modal.classList.contains('open')&&modal._talosClose)modal._talosClose();return}
    var panel=panels[0];panel.dataset.talosMaterialQuestion='true';bindMaterialAutoSave(panel);trigger=ensureMaterialTrigger(panel);if(trigger)show(trigger);
    var key=materialKey(panel);
    if(key&&key!==materialAutoOpenedKey){materialAutoOpenedKey=key;window.setTimeout(function(){var current=materialPanels()[0];if(current){var popup=ensureQuestionModal();popup._talosOpen(current)}},80)}
  }

  function applyAiSurface(){
    var panel=byId('aiAutomationProposal');if(!panel)return;
    all('.pill',panel).forEach(function(pill){if(technicalPill(pill)){if(advanced)show(pill);else hide(pill)}});
    all('.metrics',panel).forEach(function(metrics){if(advanced)show(metrics);else hide(metrics)});
    all('details',panel).forEach(function(details){if(advanced)show(details);else hide(details)});
    all('.status',panel).forEach(function(status){if(/No capability binding exists yet/i.test(txt(status))){if(advanced)show(status);else hide(status)}});
    var bound=/CAPABILITIES BOUND/i.test(txt(byId('designState')))||/Capabilities explicitly selected/i.test(txt(byId('aiAutomationState')));
    var requirements=byId('requirements'),selection=byId('selectionActions'),manual=byId('manualCapabilityToggle');
    if(bound){hide(requirements);hide(selection);hide(manual)}
    else if(advanced){show(requirements);show(selection);show(manual)}
    else{hide(requirements);hide(selection);hide(manual)}
  }

  function fixDesignStatus(){
    var panel=byId('aiAutomationProposal');var state=byId('talosCompileState');
    if(!panel||!state)return;
    var panelText=txt(panel);var temporal=byId('talosTemporalCanvas');var hasTemporal=Boolean(temporal&&temporal.querySelector('svg'));
    var readyButton=all('button',panel).some(function(button){return /Approve automation|Automation approved/i.test(txt(button))});
    var proposalReady=hasTemporal||/DESIGN COMPLETE|AI design coverage is complete/i.test(panelText)||readyButton;
    if(proposalReady&&/Gemini is preparing the Temporal workflow proposal|Confirm the process to let Talos design the automation/i.test(txt(state))){state.textContent='Automation proposal ready for review.';state.className='talos-engine-state good'}
  }

  function canvasTitle(canvas){if(canvas.id==='talosBpmnCanvas')return'BPMN process canvas';if(canvas.id==='talosTemporalCanvas')return'Temporal workflow canvas';return'Process canvas'}

  function ensureCanvasModal(){
    var modal=byId('talosCanvasModal');if(modal)return modal;
    modal=document.createElement('div');modal.id='talosCanvasModal';modal.setAttribute('aria-hidden','true');
    var panel=document.createElement('div');panel.id='talosCanvasModalPanel';var bar=document.createElement('div');bar.id='talosCanvasModalBar';
    var title=document.createElement('div');title.id='talosCanvasModalTitle';title.textContent='Process canvas';
    var minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.title='Zoom out';var zoom=document.createElement('span');zoom.id='talosCanvasZoom';zoom.textContent='Fit';
    var plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.title='Zoom in';var actual=document.createElement('button');actual.type='button';actual.textContent='100%';var fit=document.createElement('button');fit.type='button';fit.textContent='Fit';var close=document.createElement('button');close.type='button';close.textContent='Close';
    var viewport=document.createElement('div');viewport.id='talosCanvasViewport';bar.append(title,minus,zoom,plus,actual,fit,close);panel.append(bar,viewport);modal.appendChild(panel);document.body.appendChild(modal);
    function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');viewport.innerHTML='';modalSvg=null;document.body.style.overflow=''}
    function setZoom(value){if(!modalSvg)return;modalZoom=Math.max(.5,Math.min(3,value));modalSvg.style.width=Math.round(modalBaseWidth*modalZoom)+'px';zoom.textContent=Math.round(modalZoom*100)+'%'}
    function fitCanvas(){if(!modalSvg)return;modalSvg.style.width='100%';zoom.textContent='Fit'}
    minus.addEventListener('click',function(){setZoom(modalZoom-.2)});plus.addEventListener('click',function(){setZoom(modalZoom+.2)});actual.addEventListener('click',function(){setZoom(1)});fit.addEventListener('click',fitCanvas);close.addEventListener('click',closeModal);modal.addEventListener('click',function(event){if(event.target===modal)closeModal()});
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&modal.classList.contains('open'))closeModal()});
    modal._talosOpen=function(canvas){var source=canvas&&canvas.querySelector('svg');if(!source)return;viewport.innerHTML='';modalSvg=source.cloneNode(true);modalBaseWidth=Math.max(1200,Number(source.getAttribute('width'))||1200);modalZoom=1;viewport.appendChild(modalSvg);title.textContent=canvasTitle(canvas);modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';fitCanvas()};return modal;
  }

  function enhanceCanvases(){
    all('.talos-canvas').forEach(function(canvas){
      if(canvas.dataset.largeCanvasBound==='true')return;canvas.dataset.largeCanvasBound='true';canvas.title='Double-click to open this canvas large';
      var title=canvas.previousElementSibling;var open=document.createElement('button');open.type='button';open.className='talos-canvas-open';open.textContent='Open large';
      open.addEventListener('click',function(event){event.stopPropagation();var modal=ensureCanvasModal();if(modal&&modal._talosOpen)modal._talosOpen(canvas)});canvas.addEventListener('dblclick',function(){var modal=ensureCanvasModal();if(modal&&modal._talosOpen)modal._talosOpen(canvas)});
      if(title&&title.classList&&title.classList.contains('talos-canvas-title'))title.appendChild(open);else canvas.insertAdjacentElement('beforebegin',open)
    })
  }

  function compiledTruth(){
    var plan=txt(byId('planState'));var policy=txt(byId('runtimePolicyPreview'));var truth=txt(byId('truthAutomation'));
    var planReady=/APPROVED/i.test(plan)||/ExecutionPlan approved/i.test(truth);
    var policyReady=/READY_FOR_DEPLOYMENT_DESIGN|Runtime policy recorded explicitly/i.test(policy);
    return planReady&&policyReady
  }

  function setStage(id,state){var node=byId(id);if(node)node.className='talos-stage '+state}

  function ensureRecoveryRunControls(){
    var deploy=byId('deployCard');if(!deploy)return;
    var existing=byId('talosDeployOnce')||byId('talosDeployRecovery');
    if(!existing){
      var old=byId('designDeployment');if(old&&old.parentElement)hide(old.parentElement);
      var button=document.createElement('button');button.id='talosDeployRecovery';button.type='button';button.className='primary talos-primary-action';deploy.appendChild(button);
      button.addEventListener('click',function(){if(deployRecoveryRunning)return;deployRecoveryRunning=true;button.disabled=true;button.textContent='Deploying…';driveDeployment(0)});existing=button
    }
    var available=runtimeProfile&&runtimeProfile.temporalExecutionAvailable;existing.disabled=!available;existing.textContent=available?(deployRecoveryRunning?'Deploying…':'Deploy approved workflow'):'Temporal runtime required to deploy';
  }

  function driveDeployment(tick){
    var button=byId('talosDeployRecovery');if(!deployRecoveryRunning||!button)return;
    if(/Worker deployed/i.test(txt(byId('truthDeployment')))){deployRecoveryRunning=false;button.textContent='Deployed';button.disabled=true;button.className='good talos-primary-action';var execute=byId('executeCard');show(execute);ensureRecoveryExecuteControl();return}
    if(tick>140){deployRecoveryRunning=false;button.textContent='Deploy blocked · open Advanced';button.disabled=false;return}
    if(safeClick('designDeployment')||safeClick('realizeEnvironment')||safeClick('approveDeployment')||safeClick('deployWorker')){window.setTimeout(function(){driveDeployment(tick+1)},120);return}
    window.setTimeout(function(){driveDeployment(tick+1)},140)
  }

  function ensureRecoveryExecuteControl(){
    var execute=byId('executeCard');if(!execute)return;var existing=byId('talosRunOnce')||byId('talosRunRecovery');if(existing)return;
    all('.field',execute).forEach(hide);var old=byId('approveExecution');if(old&&old.parentElement)hide(old.parentElement);
    var button=document.createElement('button');button.id='talosRunRecovery';button.type='button';button.className='primary talos-primary-action';button.textContent='Run workflow';execute.appendChild(button);
    button.addEventListener('click',function(){if(runRecoveryRunning)return;runRecoveryRunning=true;button.disabled=true;button.textContent='Starting…';driveExecution(0)})
  }

  function driveExecution(tick){
    var button=byId('talosRunRecovery');if(!runRecoveryRunning||!button)return;var execution=txt(byId('executionState'));var truth=txt(byId('truthExecution'));
    if(/COMPLETED|RUNNING|waiting/i.test(execution+' '+truth)){runRecoveryRunning=false;button.textContent=/COMPLETED/i.test(execution+' '+truth)?'Completed':'Running';button.className='good talos-primary-action';return}
    if(tick>140){runRecoveryRunning=false;button.textContent='Run blocked · open Advanced';button.disabled=false;return}
    if(safeClick('approveExecution')||safeClick('startExecution')){window.setTimeout(function(){driveExecution(tick+1)},130);return}
    window.setTimeout(function(){driveExecution(tick+1)},150)
  }

  function applyCompileRecovery(){
    if(!compiledTruth())return;
    var state=byId('talosCompileState');if(state){state.textContent='Automation compiled and governed. Ready for the configured runtime.';state.className='talos-engine-state good'}
    setStage('talosStageProcess','done');setStage('talosStageAutomation','done');setStage('talosStageRun','active');
    show(byId('talosRunIntro'));show(byId('deployCard'));ensureRecoveryRunControls();
    var note=byId('talosReleaseState');if(!note){note=document.createElement('div');note.id='talosReleaseState';note.className='talos-release-state';note.textContent='Process confirmed → automation approved → execution design compiled.';var deploy=byId('deployCard');if(deploy)deploy.insertAdjacentElement('beforebegin',note)}
  }

  function apply(){
    installStyle();applyLayout();compactTechnicalEvidence();applyMaterialQuestions();
    var reviewBadge=byId('reviewBadge');if(reviewBadge&&!advanced){var value=txt(reviewBadge);if(/INFERRED|SOURCE TRUTH|CORRECTED/i.test(value))reviewBadge.textContent=/CORRECTED/i.test(value)?'Updated · review again':'Ready for review'}
    var reviewState=byId('reviewState');if(reviewState){if(advanced)show(reviewState);else hide(reviewState)}var designState=byId('designState');if(designState){if(advanced)show(designState);else hide(designState)}
    applyReviewNoise();applyAiSurface();fixDesignStatus();enhanceCanvases();applyCompileRecovery();var truthAside=document.querySelector('aside.stack');if(truthAside&&!advanced)truthAside.classList.remove('talos-advanced-open')
  }

  function bind(){var toggle=byId('talosAdvancedToggle');if(!toggle||toggle.dataset.clientSurfaceBound==='true')return;toggle.dataset.clientSurfaceBound='true';toggle.addEventListener('click',function(){window.setTimeout(function(){advanced=txt(toggle)==='Hide advanced';scheduleApply()},0)})}
  function scheduleApply(){if(refreshTimer)window.clearTimeout(refreshTimer);refreshTimer=window.setTimeout(function(){refreshTimer=0;bind();apply()},24)}

  function installJsonHook(){
    if(window.__talosClientSurfaceJsonHook)return;window.__talosClientSurfaceJsonHook=true;var responseJson=Response.prototype.json;
    Response.prototype.json=function(){return responseJson.call(this).then(function(body){scheduleApply();window.setTimeout(scheduleApply,100);window.setTimeout(scheduleApply,700);return body})}
  }

  window.fetch=function(input,init){return nativeFetch(input,init).then(function(response){scheduleApply();window.setTimeout(scheduleApply,140);window.setTimeout(scheduleApply,700);return response},function(error){scheduleApply();throw error})};
  document.addEventListener('talos:surface-refresh',scheduleApply);document.addEventListener('click',function(event){var target=event.target;if(target&&target.tagName==='BUTTON'){window.setTimeout(scheduleApply,80);window.setTimeout(scheduleApply,500)}});
  installJsonHook();bind();apply();
  nativeFetch('/api/product/runtime-profile').then(function(response){return response.ok?response.json():null}).then(function(profile){runtimeProfile=profile;scheduleApply()}).catch(function(){});
  window.setTimeout(scheduleApply,80);window.setTimeout(scheduleApply,400)
})();
`;
