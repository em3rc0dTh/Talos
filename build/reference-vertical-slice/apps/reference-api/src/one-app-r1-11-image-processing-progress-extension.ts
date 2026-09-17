const STYLE = `
<style id="talos-r1-11-image-progress-style">
  #talosImageProgress{position:fixed;right:24px;bottom:24px;z-index:10000;width:min(430px,calc(100vw - 48px));background:rgba(8,14,28,.97);border:1px solid rgba(89,132,255,.32);box-shadow:0 24px 70px rgba(0,0,0,.42);border-radius:22px;padding:18px 20px;color:#f7f9ff;display:none;backdrop-filter:blur(18px)}
  #talosImageProgress[data-visible="true"]{display:block;animation:talosProgressIn .22s ease-out}
  .talosProgressTop{display:flex;align-items:center;gap:16px}
  .talosOrbit{position:relative;width:54px;height:54px;flex:0 0 54px;border:1px solid rgba(115,157,255,.3);border-radius:50%}
  .talosOrbit:before,.talosOrbit:after{content:"";position:absolute;border-radius:50%}
  .talosOrbit:before{width:8px;height:8px;background:#6d94ff;top:23px;left:23px;box-shadow:0 0 22px rgba(109,148,255,.8)}
  .talosOrbit:after{width:10px;height:10px;background:#75e3c8;top:-5px;left:22px;transform-origin:5px 32px;animation:talosOrbitSpin 1.15s linear infinite;box-shadow:0 0 16px rgba(117,227,200,.55)}
  .talosProgressCopy{min-width:0;flex:1}
  .talosProgressEyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8ba8ff;margin-bottom:4px}
  #talosImageProgressTitle{font-size:16px;font-weight:800;line-height:1.25;color:#fff}
  #talosImageProgressText{font-size:13px;line-height:1.55;color:#aebbd2;margin-top:5px}
  .talosProgressMeta{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
  .talosProgressPill{border:1px solid #24304a;background:#0e1729;border-radius:999px;padding:6px 9px;font-size:11px;color:#c8d4eb}
  #talosImageElapsed{font-variant-numeric:tabular-nums;color:#fff;font-weight:800}
  .talosProgressTrack{height:3px;background:#152039;border-radius:999px;overflow:hidden;margin-top:14px}
  .talosProgressTrack span{display:block;height:100%;width:42%;background:linear-gradient(90deg,#456fff,#75e3c8);border-radius:999px;animation:talosTrack 1.5s ease-in-out infinite}
  #talosImageProgress[data-tone="slow"]{border-color:rgba(255,193,92,.42)}
  #talosImageProgress[data-tone="slow"] .talosProgressEyebrow{color:#ffc15c}
  #talosImageProgress[data-tone="success"]{border-color:rgba(117,227,200,.48)}
  #talosImageProgress[data-tone="error"]{border-color:rgba(255,107,129,.48)}
  details.talosProgressDetails{margin-top:12px;border-top:1px solid #1b2942;padding-top:10px}
  details.talosProgressDetails summary{cursor:pointer;color:#91a6ca;font-size:11px;user-select:none}
  #talosImageTechnical{font-size:11px;line-height:1.5;color:#8395b5;margin-top:8px;white-space:pre-wrap}
  @keyframes talosOrbitSpin{to{transform:rotate(360deg)}}
  @keyframes talosTrack{0%{transform:translateX(-110%)}50%{transform:translateX(90%)}100%{transform:translateX(250%)}}
  @keyframes talosProgressIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @media(max-width:640px){#talosImageProgress{right:14px;bottom:14px;width:calc(100vw - 28px)}}
</style>`;

const PANEL = `
<div id="talosImageProgress" role="status" aria-live="polite" aria-atomic="true" data-visible="false" data-tone="normal">
  <div class="talosProgressTop">
    <div class="talosOrbit" aria-hidden="true"></div>
    <div class="talosProgressCopy">
      <div class="talosProgressEyebrow" id="talosImageStage">PERCEPTION · ACTIVE</div>
      <div id="talosImageProgressTitle">Procesando información…</div>
      <div id="talosImageProgressText">Estamos analizando la imagen y preparando evidencia para revisión.</div>
    </div>
  </div>
  <div class="talosProgressMeta">
    <span class="talosProgressPill">Tiempo transcurrido · <strong id="talosImageElapsed">00:00</strong></span>
    <span class="talosProgressPill" id="talosImageRoute">Ruta · Gemini</span>
  </div>
  <div class="talosProgressTrack"><span></span></div>
  <details class="talosProgressDetails">
    <summary>Ver detalles técnicos</summary>
    <div id="talosImageTechnical">Fuente preservada antes de interpretar.\nCadena de modelos con fallback automático activa.\nLa salida del modelo sigue siendo evidencia inferida, nunca confirmación automática.</div>
  </details>
</div>`;

const SCRIPT = `
<script id="talos-r1-11-image-progress-script">
(function(){
  var panel=document.getElementById('talosImageProgress');
  if(!panel||window.__talosImageProgressInstalled)return;
  window.__talosImageProgressInstalled=true;
  var title=document.getElementById('talosImageProgressTitle');
  var text=document.getElementById('talosImageProgressText');
  var elapsed=document.getElementById('talosImageElapsed');
  var stage=document.getElementById('talosImageStage');
  var route=document.getElementById('talosImageRoute');
  var technical=document.getElementById('talosImageTechnical');
  var startedAt=0,timer=null,hideTimer=null;
  function format(ms){var total=Math.max(0,Math.floor(ms/1000));var m=String(Math.floor(total/60)).padStart(2,'0');var s=String(total%60).padStart(2,'0');return m+':'+s;}
  function setCopy(ms){
    if(ms>=45000){
      panel.dataset.tone='slow';
      stage.textContent='PERCEPTION · FALLBACK READY';
      title.textContent='Seguimos procesando tu información.';
      text.textContent='La primera ruta está tomando más tiempo. Talos continúa automáticamente con las rutas de análisis disponibles sin perder la fuente.';
      route.textContent='Ruta · fallback automático';
    }else if(ms>=15000){
      panel.dataset.tone='slow';
      stage.textContent='PERCEPTION · VALIDATING';
      title.textContent='La información está tomando un poco más de tiempo en procesarse.';
      text.textContent='Seguimos analizando la imagen y validando la estructura detectada. No necesitas volver a enviar el archivo.';
      route.textContent='Ruta · Gemini';
    }else{
      panel.dataset.tone='normal';
      stage.textContent='PERCEPTION · ACTIVE';
      title.textContent='Procesando información…';
      text.textContent='Estamos analizando la imagen y preparando evidencia para revisión.';
      route.textContent='Ruta · Gemini';
    }
  }
  function tick(){var ms=Date.now()-startedAt;elapsed.textContent=format(ms);setCopy(ms);}
  function start(){
    if(hideTimer){clearTimeout(hideTimer);hideTimer=null;}
    startedAt=Date.now();
    panel.dataset.visible='true';panel.dataset.tone='normal';
    technical.textContent='Fuente preservada antes de interpretar.\\nCadena de modelos con fallback automático activa.\\nLa salida del modelo sigue siendo evidencia inferida, nunca confirmación automática.';
    setCopy(0);elapsed.textContent='00:00';
    if(timer)clearInterval(timer);timer=setInterval(tick,250);
  }
  function finish(body,httpStatus){
    if(timer){clearInterval(timer);timer=null;}
    var total=Date.now()-startedAt;elapsed.textContent=format(total);
    if(body&&body.status==='BPMN_READY_FOR_PROCESS_REVIEW'){
      panel.dataset.tone='success';stage.textContent='PROCESS REVIEW · READY';title.textContent='Revisión lista.';
      text.textContent='Talos terminó la percepción y ya puedes revisar y corregir la propuesta antes de confirmar el proceso.';
      route.textContent='Resultado · listo para revisión';
      technical.textContent='HTTP '+httpStatus+'\\nResultado: BPMN_READY_FOR_PROCESS_REVIEW\\nConfirmación automática: NO\\nEjecución automática: NO';
      hideTimer=setTimeout(function(){panel.dataset.visible='false';},4500);
      return;
    }
    panel.dataset.tone='error';stage.textContent='PERCEPTION · SAFE STOP';title.textContent='No pudimos completar la interpretación todavía.';
    text.textContent='La imagen original quedó preservada. Puedes reintentar sin perder la fuente ni crear una interpretación falsa.';
    route.textContent='Resultado · fuente preservada';
    technical.textContent='HTTP '+httpStatus+'\\nResultado: '+String(body&&body.status||body&&body.code||'UNKNOWN')+'\\nTalos detuvo el flujo antes de fabricar significado.';
  }
  function fail(error){
    if(timer){clearInterval(timer);timer=null;}
    panel.dataset.tone='error';stage.textContent='PERCEPTION · CONNECTION ISSUE';title.textContent='La conexión de procesamiento se interrumpió.';
    text.textContent='La interfaz no recibió una respuesta completa. La fuente no se convierte automáticamente en verdad de negocio.';
    route.textContent='Resultado · conexión interrumpida';technical.textContent=String(error&&error.message||error||'Network error');
  }
  var nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    var url=typeof input==='string'?input:(input&&input.url)||'';
    var imageRequest=String(url).indexOf('/api/input/image')>=0;
    if(!imageRequest)return nativeFetch(input,init);
    start();
    try{
      var response=await nativeFetch(input,init);
      var clone=response.clone();
      clone.json().then(function(body){finish(body,response.status);}).catch(function(){finish(null,response.status);});
      return response;
    }catch(error){fail(error);throw error;}
  };
})();
</script>`;

export function renderR111ImageProcessingProgressPage(basePage: string): string {
  let page = basePage;
  if (!page.includes('talos-r1-11-image-progress-style')) page = page.replace('</head>', `${STYLE}</head>`);
  if (!page.includes('talosImageProgress')) page = page.replace('</body>', `${PANEL}${SCRIPT}</body>`);
  return page;
}
