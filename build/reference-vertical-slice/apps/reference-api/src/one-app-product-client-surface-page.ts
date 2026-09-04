export const ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var advanced=false;
  var nativeFetch=window.fetch.bind(window);
  var refreshTimer=0;
  var modalSvg=null;
  var modalBaseWidth=1200;
  var modalZoom=1;

  function byId(id){return document.getElementById(id)}
  function all(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector))}
  function txt(node){return String(node&&node.textContent||'').trim()}
  function hide(node){if(node&&node.style.display!=='none')node.style.display='none'}
  function show(node){if(node&&node.style.display==='none')node.style.display=''}
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
      #talosCanvasModal{position:fixed;inset:0;z-index:99999;background:rgba(3,7,13,.92);padding:18px;display:none;align-items:stretch;justify-content:center}\
      #talosCanvasModal.open{display:flex}\
      #talosCanvasModalPanel{width:min(98vw,1900px);height:calc(100vh - 36px);background:#0c1119;border:1px solid #33445f;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 100px rgba(0,0,0,.55)}\
      #talosCanvasModalBar{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid #273246;background:#111925}\
      #talosCanvasModalTitle{font-weight:800;margin-right:auto}\
      #talosCanvasViewport{flex:1;overflow:auto;background:#f8fafc;padding:18px}\
      #talosCanvasViewport svg{display:block;height:auto!important;max-width:none!important;margin:0 auto}\
      #talosCanvasZoom{min-width:56px;text-align:center;color:#b8c8de;font-size:12px;font-weight:800}\
      .talos-review-noise-hidden{display:none!important}\
      @media(max-width:900px){.shell{padding:16px!important}.talos-canvas svg{min-width:900px!important}#talosCanvasModal{padding:8px}#talosCanvasModalPanel{height:calc(100vh - 16px)}}\
    ';
    document.head.appendChild(style);
  }

  function applyLayout(){
    var grid=document.querySelector('.grid');
    if(!grid)return;
    if(advanced)grid.classList.remove('talos-product-wide');
    else grid.classList.add('talos-product-wide');
  }

  function applyReviewNoise(){
    var review=byId('reviewCard');if(!review)return;
    var nodes=byId('processNodes');var questions=byId('questions');var findings=byId('findings');var advancedReview=byId('talosReviewAdvanced');
    [nodes,questions,findings,advancedReview].forEach(function(node){if(!node)return;if(advanced)show(node);else hide(node)});
    all('h3',review).forEach(function(h){if(/^(Questions|Findings)$/i.test(txt(h))){if(advanced)show(h);else hide(h)}});
    all('button',review).forEach(function(button){if(/review questions|validation findings|advanced BPMN\/XML/i.test(txt(button))){if(advanced)show(button);else hide(button)}});
  }

  function applyAiSurface(){
    var panel=byId('aiAutomationProposal');if(!panel)return;
    all('.pill',panel).forEach(function(pill){if(technicalPill(pill)){if(advanced)show(pill);else hide(pill)}});
    all('.metrics',panel).forEach(function(metrics){if(advanced)show(metrics);else hide(metrics)});
    all('details',panel).forEach(function(details){if(advanced)show(details);else hide(details)});
    all('.status',panel).forEach(function(status){if(/No capability binding exists yet/i.test(txt(status))){if(advanced)show(status);else hide(status)}});
  }

  function fixDesignStatus(){
    var panel=byId('aiAutomationProposal');var state=byId('talosCompileState');
    if(!panel||!state)return;
    var panelText=txt(panel);
    var readyButton=all('button',panel).some(function(button){return /Approve automation/i.test(txt(button))&&!button.disabled});
    var proposalReady=/DESIGN COMPLETE|AI design coverage is complete/i.test(panelText)||readyButton;
    if(proposalReady&&/Gemini is preparing the Temporal workflow proposal|Confirm the process to let Talos design the automation/i.test(txt(state))){
      state.textContent='Automation proposal ready for review.';
      state.className='talos-engine-state good';
    }
  }

  function canvasTitle(canvas){
    if(canvas.id==='talosBpmnCanvas')return'BPMN process canvas';
    if(canvas.id==='talosTemporalCanvas')return'Temporal workflow canvas';
    return'Process canvas';
  }

  function ensureModal(){
    var modal=byId('talosCanvasModal');if(modal)return modal;
    modal=document.createElement('div');modal.id='talosCanvasModal';modal.setAttribute('aria-hidden','true');
    var panel=document.createElement('div');panel.id='talosCanvasModalPanel';
    var bar=document.createElement('div');bar.id='talosCanvasModalBar';
    var title=document.createElement('div');title.id='talosCanvasModalTitle';title.textContent='Process canvas';
    var minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.title='Zoom out';
    var zoom=document.createElement('span');zoom.id='talosCanvasZoom';zoom.textContent='Fit';
    var plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.title='Zoom in';
    var actual=document.createElement('button');actual.type='button';actual.textContent='100%';
    var fit=document.createElement('button');fit.type='button';fit.textContent='Fit';
    var close=document.createElement('button');close.type='button';close.textContent='Close';
    var viewport=document.createElement('div');viewport.id='talosCanvasViewport';
    bar.append(title,minus,zoom,plus,actual,fit,close);panel.append(bar,viewport);modal.appendChild(panel);document.body.appendChild(modal);
    function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');viewport.innerHTML='';modalSvg=null;document.body.style.overflow=''}
    function setZoom(value){if(!modalSvg)return;modalZoom=Math.max(.5,Math.min(3,value));modalSvg.style.width=Math.round(modalBaseWidth*modalZoom)+'px';zoom.textContent=Math.round(modalZoom*100)+'%'}
    function fitCanvas(){if(!modalSvg)return;modalSvg.style.width='100%';zoom.textContent='Fit'}
    minus.addEventListener('click',function(){setZoom(modalZoom-.2)});plus.addEventListener('click',function(){setZoom(modalZoom+.2)});actual.addEventListener('click',function(){setZoom(1)});fit.addEventListener('click',fitCanvas);close.addEventListener('click',closeModal);
    modal.addEventListener('click',function(event){if(event.target===modal)closeModal()});
    document.addEventListener('keydown',function(event){if(event.key==='Escape'&&modal.classList.contains('open'))closeModal()});
    modal._talosOpen=function(canvas){
      var source=canvas&&canvas.querySelector('svg');if(!source)return;
      viewport.innerHTML='';modalSvg=source.cloneNode(true);modalBaseWidth=Math.max(1200,Number(source.getAttribute('width'))||1200);modalZoom=1;viewport.appendChild(modalSvg);title.textContent=canvasTitle(canvas);modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';fitCanvas();
    };
    return modal;
  }

  function enhanceCanvases(){
    all('.talos-canvas').forEach(function(canvas){
      if(canvas.dataset.largeCanvasBound==='true')return;
      canvas.dataset.largeCanvasBound='true';canvas.title='Double-click to open this canvas large';
      var title=canvas.previousElementSibling;
      var open=document.createElement('button');open.type='button';open.className='talos-canvas-open';open.textContent='Open large';
      open.addEventListener('click',function(event){event.stopPropagation();var modal=ensureModal();if(modal&&modal._talosOpen)modal._talosOpen(canvas)});
      canvas.addEventListener('dblclick',function(){var modal=ensureModal();if(modal&&modal._talosOpen)modal._talosOpen(canvas)});
      if(title&&title.classList&&title.classList.contains('talos-canvas-title'))title.appendChild(open);else canvas.insertAdjacentElement('beforebegin',open);
    });
  }

  function apply(){
    installStyle();applyLayout();
    var reviewBadge=byId('reviewBadge');
    if(reviewBadge&&!advanced){var value=txt(reviewBadge);if(/INFERRED|SOURCE TRUTH|CORRECTED/i.test(value))reviewBadge.textContent=/CORRECTED/i.test(value)?'Updated · review again':'Ready for review'}
    var reviewState=byId('reviewState');if(reviewState){if(advanced)show(reviewState);else hide(reviewState)}
    var designState=byId('designState');if(designState){if(advanced)show(designState);else hide(designState)}
    var manual=byId('manualCapabilityToggle');if(manual){if(advanced)show(manual);else hide(manual)}
    var requirements=byId('requirements');var selection=byId('selectionActions');if(!advanced){if(requirements)hide(requirements);if(selection)hide(selection)}else{if(requirements)show(requirements);if(selection)show(selection)}
    applyReviewNoise();applyAiSurface();fixDesignStatus();enhanceCanvases();
    var truthAside=document.querySelector('aside.stack');if(truthAside&&!advanced)truthAside.classList.remove('talos-advanced-open');
  }

  function bind(){
    var toggle=byId('talosAdvancedToggle');if(!toggle||toggle.dataset.clientSurfaceBound==='true')return;
    toggle.dataset.clientSurfaceBound='true';
    toggle.addEventListener('click',function(){window.setTimeout(function(){advanced=txt(toggle)==='Hide advanced';scheduleApply()},0)});
  }

  function scheduleApply(){
    if(refreshTimer)window.clearTimeout(refreshTimer);
    refreshTimer=window.setTimeout(function(){refreshTimer=0;bind();apply()},24);
  }

  window.fetch=function(input,init){
    return nativeFetch(input,init).then(function(response){
      scheduleApply();window.setTimeout(scheduleApply,140);window.setTimeout(scheduleApply,600);return response;
    },function(error){scheduleApply();throw error});
  };

  document.addEventListener('talos:surface-refresh',scheduleApply);
  document.addEventListener('click',function(event){var target=event.target;if(target&&target.tagName==='BUTTON')window.setTimeout(scheduleApply,80)});
  bind();apply();window.setTimeout(scheduleApply,80);window.setTimeout(scheduleApply,400);
})();
`;
