const PROCESSING_STYLE = String.raw`
<style id="talos-r1-11-processing-style">
  .talosProcessing{position:fixed;inset:0;z-index:9999;display:none;place-items:center;padding:24px;background:rgba(3,7,12,.74);backdrop-filter:blur(12px)}
  .talosProcessing.open{display:grid}
  .talosProcessingCard{width:min(560px,100%);border:1px solid #2b4057;border-radius:24px;padding:28px;background:radial-gradient(circle at 50% 0,rgba(102,228,189,.10),transparent 38%),linear-gradient(180deg,#111b27,#0a1119);box-shadow:0 32px 100px rgba(0,0,0,.5);text-align:center}
  .talosOrbit{position:relative;width:112px;height:112px;margin:2px auto 22px}
  .talosOrbitCore{position:absolute;inset:38px;border-radius:50%;background:#66e4bd;box-shadow:0 0 30px rgba(102,228,189,.55)}
  .talosOrbitRing{position:absolute;inset:8px;border:1px solid rgba(120,174,247,.28);border-radius:50%;animation:talosOrbitSpin 2.2s linear infinite}
  .talosOrbitRing:before{content:"";position:absolute;left:50%;top:-5px;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:#78aef7;box-shadow:0 0 18px rgba(120,174,247,.85)}
  .talosOrbitRing.second{inset:20px;animation-duration:1.55s;animation-direction:reverse;transform:rotate(42deg)}
  .talosOrbitRing.second:before{width:8px;height:8px;top:-4px;margin-left:-4px;background:#ffca6b;box-shadow:0 0 16px rgba(255,202,107,.75)}
  @keyframes talosOrbitSpin{to{transform:rotate(360deg)}}
  @media(prefers-reduced-motion:reduce){.talosOrbitRing{animation-duration:6s}}
  .talosProcessingEyebrow{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#66e4bd;margin-bottom:8px}
  .talosProcessingTitle{font-size:22px;font-weight:900;letter-spacing:-.02em;color:#f4f7fb}
  .talosProcessingText{max-width:430px;margin:9px auto 0;color:#98a8bb;font-size:13px;line-height:1.55}
  .talosProcessingMeta{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}
  .talosProcessingPill{border:1px solid #293a4e;border-radius:999px;padding:7px 10px;background:#0a1018;color:#b9c9da;font-size:11px}
  .talosProcessingPill strong{color:#f4f7fb;font-variant-numeric:tabular-nums}
  .talosProcessingHint{margin-top:16px;color:#6f8195;font-size:10px;line-height:1.5}
</style>`;

const PROCESSING_MARKUP = String.raw`
<div class="talosProcessing" id="talosProcessing" role="status" aria-live="polite" aria-busy="false" aria-label="Talos image processing status">
  <div class="talosProcessingCard">
    <div class="talosOrbit" aria-hidden="true"><div class="talosOrbitRing"></div><div class="talosOrbitRing second"></div><div class="talosOrbitCore"></div></div>
    <div class="talosProcessingEyebrow" id="talosProcessingStage">PERCEPTION</div>
    <div class="talosProcessingTitle" id="talosProcessingTitle">Procesando información…</div>
    <div class="talosProcessingText" id="talosProcessingText">Estamos analizando la imagen y preparando una propuesta revisable del proceso.</div>
    <div class="talosProcessingMeta">
      <div class="talosProcessingPill">Tiempo transcurrido: <strong id="talosProcessingTime">00:00</strong></div>
      <div class="talosProcessingPill">Fuente: <strong id="talosProcessingFile">PNG</strong></div>
    </div>
    <div class="talosProcessingHint" id="talosProcessingHint">Puedes mantener esta pantalla abierta. Talos preserva la fuente antes de aceptar cualquier interpretación.</div>
  </div>
</div>`;

const PROCESSING_SCRIPT = String.raw`
<script id="talos-r1-11-processing-script">
(function(){
  var overlay=document.getElementById('talosProcessing');
  var inspect=document.getElementById('inspect');
  var sourceStatus=document.getElementById('sourceStatus');
  var fileName=document.getElementById('fileName');
  if(!overlay||!inspect||!sourceStatus)return;
  var startedAt=0;
  var timer=null;
  var active=false;
  function byId(id){return document.getElementById(id)}
  function clock(seconds){var m=Math.floor(seconds/60);var s=seconds%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
  function copyFor(seconds){
    if(seconds>=45)return{stage:'PERCEPTION · FALLBACK READY',title:'Seguimos procesando tu información.',text:'La información está tomando más tiempo de lo esperado. Si un modelo no responde o no produce evidencia válida, Talos prueba automáticamente la siguiente ruta disponible.',hint:'No necesitas volver a enviar la imagen. El tiempo continúa visible mientras Talos conserva la misma fuente y sus límites de autoridad.'};
    if(seconds>=15)return{stage:'PERCEPTION · EXTENDED',title:'La información está tomando un poco más de tiempo en procesarse.',text:'Seguimos analizando la imagen y validando la estructura detectada antes de llevarla a revisión.',hint:'Talos no inventará un proceso para acelerar la respuesta. Una ruta alternativa se activa automáticamente cuando corresponde.'};
    return{stage:'PERCEPTION',title:'Procesando información…',text:'Estamos analizando la imagen y preparando una propuesta revisable del proceso.',hint:'Puedes mantener esta pantalla abierta. Talos preserva la fuente antes de aceptar cualquier interpretación.'};
  }
  function paint(){
    if(!active)return;
    var seconds=Math.max(0,Math.floor((Date.now()-startedAt)/1000));
    var state=copyFor(seconds);
    byId('talosProcessingTime').textContent=clock(seconds);
    byId('talosProcessingStage').textContent=state.stage;
    byId('talosProcessingTitle').textContent=state.title;
    byId('talosProcessingText').textContent=state.text;
    byId('talosProcessingHint').textContent=state.hint;
  }
  function start(){
    if(inspect.disabled||active)return;
    active=true;startedAt=Date.now();
    byId('talosProcessingFile').textContent=(fileName&&fileName.textContent)||'PNG';
    overlay.classList.add('open');overlay.setAttribute('aria-busy','true');
    paint();timer=setInterval(paint,250);
  }
  function finish(success){
    if(!active)return;
    active=false;if(timer){clearInterval(timer);timer=null}
    if(success){
      byId('talosProcessingStage').textContent='PROCESS REVIEW';
      byId('talosProcessingTitle').textContent='Revisión lista.';
      byId('talosProcessingText').textContent='Ya puedes inspeccionar lo que Talos entendió y corregirlo antes de confirmar el proceso.';
      setTimeout(function(){overlay.classList.remove('open');overlay.setAttribute('aria-busy','false')},700);
    }else{
      overlay.classList.remove('open');overlay.setAttribute('aria-busy','false');
    }
  }
  inspect.addEventListener('click',start,true);
  new MutationObserver(function(){
    if(!active)return;
    var text=sourceStatus.textContent||'';
    if(text.indexOf('BPMN_READY_FOR_PROCESS_REVIEW')>=0){finish(true);return}
    if(/INTAKE_ERROR|UNSUPPORTED_SOURCE|SOURCE_PRESERVED|PERCEPTION_NOT_ADMITTED|SAFE_STOP|NOT_CONFIGURED/.test(text)){finish(false)}
  }).observe(sourceStatus,{subtree:true,childList:true,characterData:true,attributes:true});
})();
</script>`;

/** Adds presentation-only processing feedback. It creates no authority or alternate API path. */
export function renderR111ProcessingUxPage(html: string): string {
  if (html.includes('id="talosProcessing"')) return html;
  return html
    .replace('</head>', `${PROCESSING_STYLE}</head>`)
    .replace('</body>', `${PROCESSING_MARKUP}${PROCESSING_SCRIPT}</body>`);
}
