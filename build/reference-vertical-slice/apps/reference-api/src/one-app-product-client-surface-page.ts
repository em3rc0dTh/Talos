export const ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT = String.raw`
(function(){
  'use strict';
  var advanced=false;
  var nativeFetch=window.fetch.bind(window);
  var refreshTimer=0;

  function byId(id){return document.getElementById(id)}
  function all(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector))}
  function txt(node){return String(node&&node.textContent||'').trim()}
  function hide(node){if(node&&node.style.display!=='none')node.style.display='none'}
  function show(node){if(node&&node.style.display==='none')node.style.display=''}
  function technicalPill(node){return /^(SUGGESTED|DESIGN (COMPLETE|PARTIAL)|PRIMARY_ACCEPTED|FALLBACK_ACCEPTED|UNRESOLVED_AFTER_FALLBACK|READY_FOR_CAPABILITY_SELECTION|NEEDS_CAPABILITY_CONFIGURATION)$/i.test(txt(node))}

  function apply(){
    var reviewBadge=byId('reviewBadge');
    if(reviewBadge&&!advanced){
      var value=txt(reviewBadge);
      if(/INFERRED|SOURCE TRUTH|CORRECTED/i.test(value))reviewBadge.textContent=/CORRECTED/i.test(value)?'Updated · review again':'Ready for review';
    }
    var reviewState=byId('reviewState');if(reviewState){if(advanced)show(reviewState);else hide(reviewState)}
    var designState=byId('designState');if(designState){if(advanced)show(designState);else hide(designState)}
    var manual=byId('manualCapabilityToggle');if(manual){if(advanced)show(manual);else hide(manual)}
    var requirements=byId('requirements');var selection=byId('selectionActions');
    if(!advanced){if(requirements)hide(requirements);if(selection)hide(selection)}
    var panel=byId('aiAutomationProposal');
    if(panel)all('.pill',panel).forEach(function(pill){if(technicalPill(pill)){if(advanced)show(pill);else hide(pill)}});
    var truthAside=document.querySelector('aside.stack');
    if(truthAside&&!advanced)truthAside.classList.remove('talos-advanced-open');
  }

  function bind(){
    var toggle=byId('talosAdvancedToggle');if(!toggle||toggle.dataset.clientSurfaceBound==='true')return;
    toggle.dataset.clientSurfaceBound='true';
    toggle.addEventListener('click',function(){advanced=txt(toggle)==='Hide advanced';scheduleApply()});
  }

  function scheduleApply(){
    if(refreshTimer)window.clearTimeout(refreshTimer);
    refreshTimer=window.setTimeout(function(){refreshTimer=0;bind();apply()},24);
  }

  window.fetch=function(input,init){
    return nativeFetch(input,init).then(function(response){
      scheduleApply();
      window.setTimeout(scheduleApply,140);
      return response;
    },function(error){
      scheduleApply();
      throw error;
    });
  };

  document.addEventListener('talos:surface-refresh',scheduleApply);
  bind();
  apply();
  window.setTimeout(scheduleApply,80);
})();
`;
