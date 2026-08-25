export const ONE_APP_PRODUCT_PAGE = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Talos · Process Intake</title>
  <style>
    :root{color-scheme:dark;--bg:#080c12;--panel:#0f1620;--line:#263548;--text:#f4f7fb;--muted:#98a8bb;--accent:#66e4bd;--warn:#ffca6b;--bad:#ff7f8e;--blue:#78aef7}
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:radial-gradient(circle at 12% -8%,#152a3d 0,#080c12 42%);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    button,input{font:inherit}.shell{width:min(1240px,calc(100% - 32px));margin:0 auto;padding:28px 0 46px}.top{display:flex;justify-content:space-between;gap:22px;align-items:flex-end;margin-bottom:20px}.eyebrow{font-size:11px;font-weight:900;letter-spacing:.16em;color:var(--accent)}h1{font-size:clamp(34px,5vw,62px);letter-spacing:-.045em;line-height:.98;margin:8px 0}.lead{max-width:780px;color:var(--muted);line-height:1.55;margin:0}.runtime{border:1px solid var(--line);border-radius:999px;padding:9px 13px;color:var(--muted);font-size:12px;white-space:nowrap}.runtime.ready{border-color:#2b745f;background:#0b251e;color:var(--accent)}.runtime.warn{border-color:#725c2d;background:#211a0a;color:var(--warn)}
    .truth{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:18px}.truthStep{border:1px solid var(--line);border-radius:12px;padding:10px;background:#0b1119;color:var(--muted);font-size:11px}.truthStep strong{display:block;color:var(--text);font-size:12px;margin-bottom:4px}.truthStep.pass{border-color:#2d6e5c;background:#0b211b}.truthStep.pass strong{color:var(--accent)}.truthStep.blocked{border-color:#66562f;background:#1d180d}.truthStep.blocked strong{color:var(--warn)}
    .grid{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:16px}.card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,rgba(20,29,40,.97),rgba(12,18,27,.97));padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.25)}.card h2{font-size:16px;margin:0 0 6px}.sub{margin:0;color:var(--muted);font-size:12px;line-height:1.5}.drop{margin-top:16px;border:1px dashed #40536b;border-radius:16px;min-height:300px;display:grid;place-items:center;overflow:hidden;background:#080d14;position:relative}.drop img{max-width:100%;max-height:440px;display:none}.drop.hasImage img{display:block}.drop.hasImage .empty{display:none}.empty{text-align:center;padding:30px;color:var(--muted)}.empty strong{display:block;color:var(--text);font-size:15px;margin-bottom:6px}.actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px}button{border:0;border-radius:11px;background:var(--accent);color:#062019;font-weight:850;padding:11px 15px;cursor:pointer}button.secondary{background:#223044;color:var(--text);border:1px solid #34465f}button:disabled{opacity:.45;cursor:not-allowed}.fileName{font-size:12px;color:var(--muted)}
    .stage{margin-top:16px;border:1px solid var(--line);border-radius:14px;padding:13px;background:#0a1018}.stageTitle{font-weight:850;font-size:13px}.stageText{font-size:12px;color:var(--muted);line-height:1.5;margin-top:5px}.stage.ok .stageTitle{color:var(--accent)}.stage.warn .stageTitle{color:var(--warn)}.stage.bad .stageTitle{color:var(--bad)}
    .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px}.metric{border:1px solid #202d3d;border-radius:11px;background:#0a1018;padding:10px;min-height:68px}.k{font-size:10px;letter-spacing:.11em;text-transform:uppercase;color:var(--muted)}.v{font-size:12px;margin-top:6px;word-break:break-word}.review{margin-top:14px;display:none}.review.open{display:block}.reviewTop{display:flex;justify-content:space-between;gap:12px;align-items:center}.badge{font-size:10px;padding:5px 8px;border:1px solid #38506a;border-radius:999px;color:var(--blue)}.nodes{display:grid;gap:7px;margin-top:10px}.node{border:1px solid #223247;border-radius:10px;padding:9px 10px;background:#0a1018}.node strong{font-size:12px}.node span{display:block;margin-top:3px;font-size:10px;color:var(--muted)}.findings{margin-top:12px;display:grid;gap:7px}.finding{border-left:3px solid var(--warn);padding:9px 10px;background:#17140c;border-radius:0 9px 9px 0;font-size:11px;color:#d9c393}.next{margin-top:14px;padding:12px;border:1px solid #2b3a4e;border-radius:11px;color:var(--muted);font-size:11px;line-height:1.5}.next strong{color:var(--text)}details{margin-top:12px}summary{cursor:pointer;color:var(--muted);font-size:11px}pre{white-space:pre-wrap;word-break:break-word;max-height:340px;overflow:auto;background:#070b10;border:1px solid #202d3d;border-radius:11px;padding:12px;color:#b9c9da;font:10px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
    @media(max-width:900px){.grid{grid-template-columns:1fr}.truth{grid-template-columns:1fr 1fr}.top{align-items:flex-start;flex-direction:column}.runtime{white-space:normal}.meta{grid-template-columns:1fr}}
  </style>
</head>
<body>
<main class="shell">
  <header class="top">
    <div><div class="eyebrow">TALOS · ONE APP</div><h1>Bring the real process.</h1><p class="lead">Talos preserves your source first, then asks the configured perception runtime what it can actually observe. Inference stays separate from business confirmation and execution authority.</p></div>
    <div class="runtime" id="runtimeBadge">Checking runtime…</div>
  </header>

  <section class="truth" aria-label="Talos authority chain">
    <div class="truthStep" id="truthSource"><strong>1 · SOURCE</strong>Waiting for input</div>
    <div class="truthStep" id="truthPerception"><strong>2 · PERCEPTION</strong>Not reached</div>
    <div class="truthStep" id="truthMeaning"><strong>3 · INFERRED MEANING</strong>Not reached</div>
    <div class="truthStep"><strong>4 · HUMAN CONFIRMATION</strong>Never automatic</div>
    <div class="truthStep"><strong>5 · EXECUTION</strong>Separate authority</div>
  </section>

  <div class="grid">
    <section class="card">
      <h2>Process source</h2>
      <p class="sub">PNG input is sent through the real One-App image route. The browser preview is only a convenience; Talos records its own exact source identity.</p>
      <div class="drop" id="drop"><div class="empty"><strong>Choose a process image</strong>PNG · exact source preserved before interpretation</div><img id="preview" alt="Selected process source" /></div>
      <input id="file" type="file" accept="image/png,.png" hidden />
      <div class="actions"><button class="secondary" id="choose">Choose PNG</button><button id="inspect" disabled>Preserve & understand</button><span class="fileName" id="fileName">No file selected</span></div>
      <div class="stage" id="sourceStatus"><div class="stageTitle">WAITING_FOR_SOURCE</div><div class="stageText">Talos has not received a process source yet.</div></div>
    </section>

    <section class="card">
      <h2>What Talos can support</h2>
      <p class="sub">This is per-run truth. A configured capability does not imply that this image was understood.</p>
      <div class="meta" id="meta"></div>
      <div class="review" id="review">
        <div class="reviewTop"><strong>Process review candidate</strong><span class="badge">INFERRED · NOT CONFIRMED</span></div>
        <div class="nodes" id="nodes"></div>
        <div class="findings" id="findings"></div>
        <div class="next"><strong>Next authority:</strong> review and correct the inferred process before business-process confirmation. This screen does not freeze semantics, approve automation, deploy, or execute anything.</div>
      </div>
      <details><summary>Technical evidence</summary><pre id="json">No result yet.</pre></details>
    </section>
  </div>
</main>
<script>
(function(){
  var fileInput=document.getElementById('file');
  var selected=null;
  function el(id){return document.getElementById(id)}
  function esc(value){return String(value==null?'—':value)}
  function metric(key,value){var d=document.createElement('div');d.className='metric';var k=document.createElement('div');k.className='k';k.textContent=key;var v=document.createElement('div');v.className='v';v.textContent=esc(value);d.append(k,v);el('meta').appendChild(d)}
  function step(id,state,text){var d=el(id);d.className='truthStep '+state;d.childNodes[d.childNodes.length-1].textContent=text}
  function stage(title,text,kind){var box=el('sourceStatus');box.className='stage '+(kind||'');box.innerHTML='';var a=document.createElement('div');a.className='stageTitle';a.textContent=title;var b=document.createElement('div');b.className='stageText';b.textContent=text;box.append(a,b)}
  function toBase64(file){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){var s=String(r.result||'');resolve(s.slice(s.indexOf(',')+1));};r.onerror=reject;r.readAsDataURL(file)})}
  async function api(path,options){var r=await fetch(path,options);var text=await r.text();var body=text?JSON.parse(text):{};if(!r.ok){var e=new Error(body.error||('HTTP '+r.status));e.body=body;throw e}return body}
  async function boot(){try{var s=await api('/api/status');var configured=Boolean(s.image&&s.image.liveVisionInterpretation);var badge=el('runtimeBadge');badge.textContent=configured?'READY · '+s.image.provider.providerId:'SOURCE READY · VISION NOT CONFIGURED';badge.className='runtime '+(configured?'ready':'warn');el('meta').innerHTML='';metric('One-App',s.status);metric('Image intake',s.image&&s.image.exactSourceIntake?'AVAILABLE':'UNAVAILABLE');metric('Interpreted image route',s.inputRoutes&&s.inputRoutes.indexOf('IMAGE_PNG')>=0?'AVAILABLE':'UNAVAILABLE');metric('Live perception',configured?'CONFIGURED':'NOT CONFIGURED');metric('Authority',s.automaticWorkflowExecutionAuthorized===false?'EXPLICIT':'UNKNOWN');if(configured){metric('Model',s.image.provider.modelRef);metric('Model version',s.image.provider.modelVersion)}}catch(e){el('runtimeBadge').textContent='RUNTIME ERROR';el('runtimeBadge').className='runtime warn';stage('RUNTIME_ERROR',e.message,'bad')}}
  function select(file){selected=file;el('fileName').textContent=file?file.name:'No file selected';el('inspect').disabled=!file;if(!file)return;var url=URL.createObjectURL(file);el('preview').src=url;el('drop').className='drop hasImage';stage('SOURCE_SELECTED','The browser has selected '+file.name+'. Talos has not preserved it yet.','');}
  async function inspect(){if(!selected)return;if(selected.type&&selected.type!=='image/png'){stage('UNSUPPORTED_SOURCE','R1-02 accepts PNG on the image route.','bad');return}el('inspect').disabled=true;stage('PRESERVING_SOURCE','Sending exact PNG bytes into the One-App intake boundary…','');try{var imageBase64=await toBase64(selected);var data=await api('/api/input/image',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({imageBase64:imageBase64,fileName:selected.name,initiatedBy:'one-app-product-user'})});el('json').textContent=JSON.stringify(data,null,2);el('meta').innerHTML='';var hash=data.sourceContentSha256||(data.sourceRepresentation&&data.sourceRepresentation.contentHash)||(data.representation&&data.representation.contentHash);metric('Result',data.status||(data.interpretation&&data.interpretation.status)||'SOURCE_PRESERVED');metric('SHA-256',hash||'preserved by One-App');metric('Dimensions',data.width&&data.height?(data.width+' × '+data.height):'recorded at intake');metric('Perception decision',data.perceptionDecision||(data.interpretation&&data.interpretation.status)||'NOT RUN');step('truthSource','pass','Exact source preserved');
        if(data.interpretation&&data.interpretation.status==='NOT_CONFIGURED'){step('truthPerception','blocked','Provider not configured');step('truthMeaning','blocked','Not reached');stage('SOURCE_PRESERVED','Source truth is durable. No perception provider is configured, so Talos stops here instead of inventing a process.','warn');el('review').className='review';return}
        if(data.status!=='BPMN_READY_FOR_PROCESS_REVIEW'){step('truthPerception','blocked',esc(data.perceptionDecision||data.status));step('truthMeaning','blocked','No admitted review candidate');stage(esc(data.status||'PERCEPTION_NOT_ADMITTED'),'The source is preserved, but the current evidence was not admitted as a reviewable business-process candidate.','warn');el('review').className='review';return}
        step('truthPerception','pass','Evidence admitted');step('truthMeaning','pass','Review candidate created');stage('BPMN_READY_FOR_PROCESS_REVIEW','Talos produced an inferred process candidate. Human review is required before confirmation.','ok');
        var rec=data.reconciliation||{};var process=rec.processRevision||{};var validation=rec.validation||{};metric('Canonical revision',process.id||'created');metric('Semantic status',process.semanticStatus||'INFERRED');metric('Validation',validation.assessment?validation.assessment.semanticVerdict:'ASSESSED');metric('Execution readiness',validation.assessment?validation.assessment.executionReadiness:'NOT AUTHORIZED');
        var nodes=el('nodes');nodes.innerHTML='';(process.nodes||[]).forEach(function(n){var d=document.createElement('div');d.className='node';var a=document.createElement('strong');a.textContent=n.name||n.kind||n.id;var b=document.createElement('span');b.textContent=(n.kind||'NODE')+' · '+(n.truthClass||'INFERRED');d.append(a,b);nodes.appendChild(d)});
        var findings=el('findings');findings.innerHTML='';((validation&&validation.findings)||[]).slice(0,8).forEach(function(f){var d=document.createElement('div');d.className='finding';d.textContent=(f.code?f.code+' · ':'')+(f.title||f.description||'Validation finding');findings.appendChild(d)});el('review').className='review open';
      }catch(e){stage('INTAKE_ERROR',e.message,'bad');if(e.body)el('json').textContent=JSON.stringify(e.body,null,2)}finally{el('inspect').disabled=false}}
  el('choose').onclick=function(){fileInput.click()};fileInput.onchange=function(){select(fileInput.files&&fileInput.files[0])};el('inspect').onclick=inspect;boot();
})();
</script>
</body>
</html>`;
