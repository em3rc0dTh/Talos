import http from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BpmnWorkspaceService } from '../../../packages/application/src/bpmn-workspace.ts';
import { LocalImageByteStore } from '../../../packages/image-perception/src/byte-store.ts';
import { SqliteDocumentStore } from '../../../packages/persistence-sqlite/src/sqlite-document-store.ts';

export interface WorkspaceServerOptions {
  port?: number;
  host?: string;
  runtimeDir?: string;
}

const MAX_JSON_BYTES = 20 * 1024 * 1024;

function json(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function jsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_JSON_BYTES) throw new TypeError('Request payload exceeds the Talos workspace limit');
    chunks.push(buffer);
  }
  if (!chunks.length) return {};
  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('Expected a JSON object');
  return parsed as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} must be a non-empty string`);
  return value;
}

function mimeType(filePath: string): string {
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.woff2')) return 'font/woff2';
  if (filePath.endsWith('.woff')) return 'font/woff';
  if (filePath.endsWith('.ttf')) return 'font/ttf';
  if (filePath.endsWith('.eot')) return 'application/vnd.ms-fontobject';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function serveBpmnJs(pathname: string, res: http.ServerResponse): boolean {
  const prefix = '/vendor/bpmn-js/';
  if (!pathname.startsWith(prefix)) return false;
  const distRoot = path.resolve(process.cwd(), 'node_modules/bpmn-js/dist');
  const relative = decodeURIComponent(pathname.slice(prefix.length));
  const filePath = path.resolve(distRoot, relative);
  if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${path.sep}`)) {
    json(res, 403, { error: 'invalid vendor path' });
    return true;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    json(res, 404, { error: 'vendor asset not found' });
    return true;
  }
  const bytes = readFileSync(filePath);
  res.writeHead(200, {
    'content-type': mimeType(filePath),
    'content-length': bytes.byteLength,
    'cache-control': 'public, max-age=3600',
  });
  res.end(bytes);
  return true;
}

function page(): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Talos — Process Confirmation</title>
  <link rel="stylesheet" href="/vendor/bpmn-js/assets/diagram-js.css">
  <link rel="stylesheet" href="/vendor/bpmn-js/assets/bpmn-font/css/bpmn.css">
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827;background:#f4f6fa;--line:#dfe3ea;--muted:#667085;--ink:#101828;--panel:#fff;--ok:#067647;--warn:#b54708;--bad:#b42318}
    *{box-sizing:border-box}body{margin:0}.app{min-height:100vh;display:grid;grid-template-rows:auto auto 1fr auto}.top{padding:18px 24px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.92);backdrop-filter:blur(12px);display:flex;justify-content:space-between;gap:24px;align-items:center}.brand{display:flex;gap:12px;align-items:center}.mark{width:34px;height:34px;border-radius:11px;background:#111827;color:white;display:grid;place-items:center;font-weight:850}.eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:800}.title{font-size:18px;font-weight:800;margin-top:2px}.stage{font-size:12px;color:var(--muted);font-weight:700}.inputs{padding:14px 24px;display:grid;grid-template-columns:1fr 1fr;gap:12px;border-bottom:1px solid var(--line)}.inputCard{border:1px solid var(--line);background:white;border-radius:16px;padding:14px;display:flex;justify-content:space-between;gap:18px;align-items:center}.inputCard strong{display:block;font-size:14px}.inputCard span{font-size:12px;color:var(--muted)}.fileButton{position:relative;overflow:hidden;background:#101828;color:white;border-radius:999px;padding:10px 14px;font-size:12px;font-weight:800;white-space:nowrap;cursor:pointer}.fileButton input{position:absolute;inset:0;opacity:0;cursor:pointer}.workspace{padding:14px 24px 20px;display:grid;grid-template-columns:minmax(220px,28%) minmax(460px,1fr) minmax(300px,34%);gap:12px;min-height:0}.panel{border:1px solid var(--line);border-radius:18px;background:var(--panel);overflow:hidden;min-height:0;box-shadow:0 10px 30px rgba(16,24,40,.035)}.panelHead{height:48px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;padding:0 14px}.panelHead b{font-size:12px;letter-spacing:.06em;text-transform:uppercase}.badge{font-size:10px;font-weight:850;border-radius:999px;padding:5px 8px;background:#f2f4f7;color:#475467}.badge.ok{background:#ecfdf3;color:var(--ok)}.badge.warn{background:#fffaeb;color:var(--warn)}.sourceBody{padding:14px;height:calc(100% - 48px);overflow:auto}.sourceEmpty,.canvasEmpty{height:100%;min-height:260px;border:1px dashed #cfd5df;border-radius:14px;display:grid;place-items:center;text-align:center;padding:24px;color:var(--muted);font-size:13px;line-height:1.55}.sourcePreview{display:none}.sourcePreview img{width:100%;height:auto;border-radius:12px;border:1px solid var(--line);display:block}.sourceMeta{margin-top:12px;font-size:12px;line-height:1.55;color:#475467;word-break:break-word}.sourceMeta strong{color:#101828}.canvasWrap{height:calc(100% - 48px);position:relative}.canvas{height:100%;min-height:520px}.canvasEmpty{position:absolute;inset:14px;z-index:2;background:white}.editorBody{height:calc(100% - 48px);display:grid;grid-template-rows:auto 1fr auto}.editorState{padding:10px 12px;border-bottom:1px solid var(--line);font-size:11px;color:var(--muted)}textarea{width:100%;height:100%;resize:none;border:0;outline:0;padding:14px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#17202e;background:#fbfcfe}.editorActions{padding:10px;border-top:1px solid var(--line);display:flex;gap:8px}.bottom{border-top:1px solid var(--line);background:white;padding:14px 24px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}.truth{display:flex;gap:9px;align-items:center;min-width:0}.dot{width:10px;height:10px;border-radius:50%;background:#98a2b3;flex:0 0 auto}.dot.ok{background:#12b76a}.dot.warn{background:#f79009}.dot.bad{background:#f04438}.truthText{min-width:0}.truthText strong{font-size:13px;display:block}.truthText span{font-size:12px;color:var(--muted);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.actions{display:flex;gap:8px}.btn{border:1px solid #d0d5dd;background:white;color:#344054;border-radius:999px;padding:10px 14px;font-size:12px;font-weight:800;cursor:pointer}.btn.primary{background:#101828;color:white;border-color:#101828}.btn:disabled{opacity:.42;cursor:not-allowed}.notice{margin-top:12px;border-radius:12px;padding:10px 11px;font-size:12px;line-height:1.5;background:#f2f4f7;color:#475467}.notice.warn{background:#fffaeb;color:#93370d}.notice.ok{background:#ecfdf3;color:#05603a}.notice.bad{background:#fef3f2;color:#912018}@media(max-width:1050px){.workspace{grid-template-columns:1fr}.panel{min-height:420px}.inputs{grid-template-columns:1fr}.bottom{grid-template-columns:1fr}.actions{justify-content:flex-start;flex-wrap:wrap}}
  </style>
</head>
<body>
<div class="app">
  <header class="top">
    <div class="brand"><div class="mark">T</div><div><div class="eyebrow">Talos · Level 3</div><div class="title">Process Confirmation</div></div></div>
    <div class="stage" id="stage">No process loaded</div>
  </header>
  <section class="inputs">
    <div class="inputCard"><div><strong>Show Talos an image</strong><span>PNG source is preserved first. No automatic approval.</span></div><label class="fileButton">Upload image<input id="imageInput" type="file" accept="image/png"></label></div>
    <div class="inputCard"><div><strong>Open native BPMN</strong><span>XML is preserved, parsed and rendered directly.</span></div><label class="fileButton">Open BPMN<input id="bpmnInput" type="file" accept=".bpmn,.xml,text/xml,application/xml"></label></div>
  </section>
  <main class="workspace">
    <section class="panel">
      <div class="panelHead"><b>Original source</b><span class="badge" id="sourceBadge">EMPTY</span></div>
      <div class="sourceBody">
        <div class="sourceEmpty" id="sourceEmpty">Upload the process source you want Talos to understand.<br><br>The source and Talos' interpretation remain separate.</div>
        <div class="sourcePreview" id="sourcePreview"><img id="sourceImage" alt="Uploaded process source"><div class="sourceMeta" id="sourceMeta"></div><div class="notice" id="sourceNotice"></div></div>
      </div>
    </section>
    <section class="panel">
      <div class="panelHead"><b>BPMN — what Talos understands</b><span class="badge" id="bpmnBadge">NO BPMN</span></div>
      <div class="canvasWrap"><div id="canvas" class="canvas"></div><div class="canvasEmpty" id="canvasEmpty">BPMN appears here only after a BPMN source is opened or an image interpretation has produced a review candidate.</div></div>
    </section>
    <section class="panel">
      <div class="panelHead"><b>BPMN XML</b><span class="badge" id="xmlBadge">SYNCED</span></div>
      <div class="editorBody"><div class="editorState" id="editorState">No committed BPMN revision.</div><textarea id="xmlEditor" spellcheck="false" disabled></textarea><div class="editorActions"><button class="btn" id="applyXml" disabled>Apply XML</button><button class="btn" id="commitGraph" disabled>Commit graph edit</button></div></div>
    </section>
  </main>
  <footer class="bottom">
    <div class="truth"><div class="dot" id="truthDot"></div><div class="truthText"><strong id="truthTitle">Waiting for source</strong><span id="truthDetail">Talos has not claimed to understand a process yet.</span></div></div>
    <div class="actions"><button class="btn" id="nlButton" disabled>Tell Talos what's wrong</button><button class="btn primary" id="confirmButton" disabled>Confirm Process</button></div>
  </footer>
</div>
<script src="/vendor/bpmn-js/bpmn-modeler.development.js"></script>
<script>
const modeler=new BpmnJS({container:'#canvas',keyboard:{bindTo:document}});
const $=s=>document.querySelector(s);
const imageInput=$('#imageInput'),bpmnInput=$('#bpmnInput'),sourceEmpty=$('#sourceEmpty'),sourcePreview=$('#sourcePreview'),sourceImage=$('#sourceImage'),sourceMeta=$('#sourceMeta'),sourceNotice=$('#sourceNotice'),sourceBadge=$('#sourceBadge'),bpmnBadge=$('#bpmnBadge'),xmlBadge=$('#xmlBadge'),xmlEditor=$('#xmlEditor'),editorState=$('#editorState'),canvasEmpty=$('#canvasEmpty'),applyXml=$('#applyXml'),commitGraph=$('#commitGraph'),confirmButton=$('#confirmButton'),truthDot=$('#truthDot'),truthTitle=$('#truthTitle'),truthDetail=$('#truthDetail'),stage=$('#stage');
let currentRevision=null,currentHasDI=false,programmaticImport=false,xmlDraftDirty=false,graphDirty=false,sourceObjectUrl=null;
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function post(url,payload){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const x=await r.json().catch(()=>({error:'Invalid server response'}));if(!r.ok){const e=new Error(x.error||'Talos request failed');e.code=x.code;e.status=r.status;throw e}return x}
function setTruth(kind,title,detail){truthDot.className='dot '+kind;truthTitle.textContent=title;truthDetail.textContent=detail}
function updateControls(){const aligned=currentRevision&&currentRevision.canonicalAlignmentStatus==='ALIGNED_TO_CANONICAL';const clean=!xmlDraftDirty&&!graphDirty;confirmButton.disabled=!(currentRevision&&aligned&&clean&&currentRevision.state==='DRAFT');applyXml.disabled=!(currentRevision&&xmlDraftDirty);commitGraph.disabled=!(currentRevision&&graphDirty&&!xmlDraftDirty);xmlEditor.disabled=!currentRevision;$('#nlButton').disabled=!currentRevision;if(!currentRevision){editorState.textContent='No committed BPMN revision.';return}editorState.textContent='Revision '+currentRevision.revisionNumber+' · '+currentRevision.editMode+' · '+currentRevision.canonicalAlignmentStatus;}
function showRevisionState(){if(!currentRevision){bpmnBadge.className='badge';bpmnBadge.textContent='NO BPMN';setTruth('warn','Source preserved; process not ready','No BPMN candidate has been accepted for review.');stage.textContent='Source intake';updateControls();return}bpmnBadge.textContent='REV '+currentRevision.revisionNumber;bpmnBadge.className='badge '+(currentRevision.canonicalAlignmentStatus==='ALIGNED_TO_CANONICAL'?'ok':'warn');stage.textContent='BPMN review · revision '+currentRevision.revisionNumber;if(currentRevision.canonicalAlignmentStatus==='ALIGNED_TO_CANONICAL'){setTruth('ok','Ready for business confirmation','Graph and XML are synchronized and the BPMN meaning is aligned to a canonical ProcessRevision.')}else{setTruth('warn','Canonical reconciliation required','You may edit and review this BPMN, but Confirm Process remains blocked until Talos reconciles its business meaning.')}updateControls();}
async function importIntoModeler(xml){programmaticImport=true;try{await modeler.importXML(xml);currentHasDI=true;canvasEmpty.style.display='none';modeler.get('canvas').zoom('fit-viewport');}catch(e){currentHasDI=false;canvasEmpty.style.display='grid';canvasEmpty.textContent='This BPMN parsed successfully but has no renderable BPMN-DI diagram. XML remains available for review.';}finally{programmaticImport=false}}
async function loadRevision(revision,hasDI){currentRevision=revision;currentHasDI=hasDI;xmlEditor.value=revision.bpmnXml;xmlDraftDirty=false;graphDirty=false;xmlBadge.textContent='SYNCED';xmlBadge.className='badge ok';await importIntoModeler(revision.bpmnXml);showRevisionState();}
modeler.on('commandStack.changed',async()=>{if(programmaticImport||!currentRevision)return;try{const saved=await modeler.saveXML({format:true});if(typeof saved.xml==='string'){xmlEditor.value=saved.xml;graphDirty=true;xmlDraftDirty=false;xmlBadge.textContent='GRAPH DRAFT';xmlBadge.className='badge warn';updateControls();}}catch(e){setTruth('bad','Could not serialize graph edit',String(e))}});
xmlEditor.addEventListener('input',()=>{if(!currentRevision)return;xmlDraftDirty=true;graphDirty=false;xmlBadge.textContent='UNAPPLIED XML';xmlBadge.className='badge warn';updateControls();setTruth('warn','XML draft not applied','The committed BPMN revision remains authoritative until Apply XML succeeds.');});
imageInput.addEventListener('change',async()=>{const file=imageInput.files&&imageInput.files[0];if(!file)return;if(sourceObjectUrl)URL.revokeObjectURL(sourceObjectUrl);sourceObjectUrl=URL.createObjectURL(file);sourceImage.src=sourceObjectUrl;sourceEmpty.style.display='none';sourcePreview.style.display='block';sourceBadge.textContent='UPLOADING';sourceBadge.className='badge warn';sourceMeta.innerHTML='<strong>'+esc(file.name)+'</strong><br>'+Math.round(file.size/1024)+' KB';sourceNotice.className='notice';sourceNotice.textContent='Preserving exact PNG source bytes…';currentRevision=null;xmlEditor.value='';canvasEmpty.style.display='grid';canvasEmpty.textContent='Image uploaded. Talos has not interpreted it yet.';showRevisionState();try{const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));const x=await post('/api/input/image',{fileName:file.name,imageBase64:btoa(binary),initiatedBy:'browser-user'});sourceBadge.textContent='SOURCE PRESERVED';sourceBadge.className='badge ok';sourceMeta.innerHTML='<strong>'+esc(file.name)+'</strong><br>'+x.width+' × '+x.height+' px<br>SHA-256 '+esc(x.sourceContentSha256);sourceNotice.className='notice warn';sourceNotice.textContent='Source preserved. Interpretation is still pending; Talos has not approved or confirmed this process.';setTruth('warn','Image accepted — interpretation pending','The source is safe in Talos. A vision provider must produce review evidence before BPMN can appear.');stage.textContent='Image source preserved';}catch(e){sourceBadge.textContent='REJECTED';sourceBadge.className='badge warn';sourceNotice.className='notice bad';sourceNotice.textContent=String(e);setTruth('bad','Image intake failed',String(e));}});
bpmnInput.addEventListener('change',async()=>{const file=bpmnInput.files&&bpmnInput.files[0];if(!file)return;sourceEmpty.style.display='none';sourcePreview.style.display='block';sourceImage.removeAttribute('src');sourceImage.style.display='none';sourceBadge.textContent='PARSING';sourceBadge.className='badge warn';sourceMeta.innerHTML='<strong>'+esc(file.name)+'</strong><br>Native BPMN/XML source';sourceNotice.className='notice';sourceNotice.textContent='Preserving and validating native BPMN…';try{const bpmnXml=await file.text();const x=await post('/api/input/bpmn',{fileName:file.name,bpmnXml,initiatedBy:'browser-user'});sourceBadge.textContent='SOURCE PRESERVED';sourceBadge.className='badge ok';sourceNotice.className='notice ok';sourceNotice.textContent='Native BPMN source preserved and opened directly. No image reconstruction was used.';await loadRevision(x.revision,x.hasDiagramInterchange);}catch(e){sourceBadge.textContent='REJECTED';sourceBadge.className='badge warn';sourceNotice.className='notice bad';sourceNotice.textContent=String(e);setTruth('bad','BPMN import rejected',String(e));}});
commitGraph.addEventListener('click',async()=>{if(!currentRevision||!graphDirty)return;commitGraph.disabled=true;try{const saved=await modeler.saveXML({format:true});const x=await post('/api/bpmn/edit',{baseRevisionId:currentRevision.id,bpmnXml:saved.xml,editMode:'GRAPH_EDIT',editedBy:'browser-user'});await loadRevision(x.revision,x.hasDiagramInterchange);if(x.changeClass==='SEMANTIC')setTruth('warn','Semantic graph change saved','The old canonical authority was removed. Reconciliation is required before confirmation.');}catch(e){setTruth('bad','Graph edit rejected',String(e));}finally{updateControls();}});
applyXml.addEventListener('click',async()=>{if(!currentRevision||!xmlDraftDirty)return;applyXml.disabled=true;const draft=xmlEditor.value;try{const x=await post('/api/bpmn/edit',{baseRevisionId:currentRevision.id,bpmnXml:draft,editMode:'XML_EDIT',editedBy:'browser-user'});await loadRevision(x.revision,x.hasDiagramInterchange);if(x.changeClass==='SEMANTIC')setTruth('warn','Semantic XML change saved','The old canonical authority was removed. Reconciliation is required before confirmation.');}catch(e){xmlDraftDirty=true;xmlBadge.textContent='INVALID / UNAPPLIED';xmlBadge.className='badge warn';setTruth('bad','XML change rejected',String(e));updateControls();}});
confirmButton.addEventListener('click',async()=>{if(!currentRevision||confirmButton.disabled)return;try{const x=await post('/api/bpmn/confirm',{revisionId:currentRevision.id,canonicalProcessRevisionId:currentRevision.canonicalProcessRevisionId,confirmedBy:'browser-user',authorityRef:'browser-business-process-owner',rationale:'The BPMN shown by Talos accurately represents the business process.'});currentRevision=x.revision;confirmButton.disabled=true;bpmnBadge.textContent='CONFIRMED';bpmnBadge.className='badge ok';setTruth('ok','Process confirmed','This exact BPMN revision is now the user-authoritative business-process contract. Automation design is a separate gate.');stage.textContent='Process confirmed';}catch(e){setTruth('bad','Confirmation blocked',String(e));}});
fetch('/api/workspace/status').then(r=>r.json()).then(()=>{}).catch(()=>setTruth('bad','Talos API unavailable','Could not reach the workspace API.'));
updateControls();
</script>
</body>
</html>`;
}

export async function startProcessConfirmationWorkspace(options: WorkspaceServerOptions = {}) {
  const host = options.host ?? '127.0.0.1';
  const runtimeDir = options.runtimeDir ?? mkdtempSync(path.join(os.tmpdir(), 'talos-bpmn-workspace-'));
  const ownsDir = !options.runtimeDir;
  const repo = new SqliteDocumentStore(path.join(runtimeDir, 'talos-workspace.sqlite'));
  const byteStore = new LocalImageByteStore(path.join(runtimeDir, 'source-bytes'));
  const workspace = new BpmnWorkspaceService(repo, byteStore);

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      if (serveBpmnJs(url.pathname, res)) return;

      if (req.method === 'GET' && url.pathname === '/') {
        const html = page();
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': Buffer.byteLength(html), 'cache-control': 'no-store' });
        res.end(html);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/workspace/status') {
        json(res, 200, {
          status: 'READY_FOR_PROCESS_INPUT',
          inputRoutes: ['IMAGE_PNG', 'NATIVE_BPMN'],
          nativeBpmn: { parse: true, render: true, graphEdit: true, xmlEdit: true },
          image: { exactSourceIntake: true, liveVisionInterpretation: false, reason: 'I7C_REAL_ARBITRARY_IMAGE_VISION_NOT_CONFIGURED' },
          confirmation: { automatic: false, requiresCanonicalAlignment: true },
          execution: { automatic: false, separateAutomationDesignGate: true },
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/input/image') {
        const input = await jsonBody(req);
        const imageBase64 = text(input.imageBase64, 'imageBase64');
        const result = workspace.intakeImage({
          pngBytes: Buffer.from(imageBase64, 'base64'),
          declaredName: typeof input.fileName === 'string' ? input.fileName : 'uploaded-process.png',
          initiatedBy: typeof input.initiatedBy === 'string' ? input.initiatedBy : 'browser-user',
        });
        json(res, 201, result);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/input/bpmn') {
        const input = await jsonBody(req);
        const result = await workspace.importNativeBpmn({
          bpmnXml: text(input.bpmnXml, 'bpmnXml'),
          declaredName: typeof input.fileName === 'string' ? input.fileName : 'uploaded-process.bpmn',
          initiatedBy: typeof input.initiatedBy === 'string' ? input.initiatedBy : 'browser-user',
        });
        json(res, 201, result);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/edit') {
        const input = await jsonBody(req);
        const editMode = text(input.editMode, 'editMode');
        if (editMode !== 'GRAPH_EDIT' && editMode !== 'XML_EDIT') throw new TypeError('editMode must be GRAPH_EDIT or XML_EDIT');
        const result = await workspace.edit({
          baseRevisionId: text(input.baseRevisionId, 'baseRevisionId'),
          editedBpmnXml: text(input.bpmnXml, 'bpmnXml'),
          editMode,
          editedBy: typeof input.editedBy === 'string' ? input.editedBy : 'browser-user',
        });
        json(res, 201, { ...result, hasDiagramInterchange: result.revision.diagramDigest.length > 0 });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/bpmn/confirm') {
        const input = await jsonBody(req);
        const result = workspace.confirm({
          revisionId: text(input.revisionId, 'revisionId'),
          canonicalProcessRevisionId: text(input.canonicalProcessRevisionId, 'canonicalProcessRevisionId') as never,
          confirmedBy: typeof input.confirmedBy === 'string' ? input.confirmedBy : 'browser-user',
          authorityRef: text(input.authorityRef, 'authorityRef'),
          ...(typeof input.rationale === 'string' ? { rationale: input.rationale } : {}),
        });
        json(res, 201, result);
        return;
      }

      json(res, 404, { error: 'not found' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const conflict = /canonical|confirm|reconciliation|DRAFT|revision not found/i.test(message);
      json(res, conflict ? 409 : 400, { error: message, code: conflict ? 'PROCESS_CONFIRMATION_BLOCKED' : 'WORKSPACE_REQUEST_REJECTED' });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 4318, host, () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Talos Process Confirmation workspace did not bind a TCP address');
  const baseUrl = `http://${host}:${address.port}`;
  let closed = false;
  return {
    baseUrl,
    runtimeDir,
    async close() {
      if (closed) return;
      closed = true;
      await new Promise<void>((resolve) => server.close(() => resolve()));
      repo.close();
      if (ownsDir) rmSync(runtimeDir, { recursive: true, force: true });
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startProcessConfirmationWorkspace({ port: Number(process.env.PORT ?? 4318) })
    .then((app) => {
      console.log(`Talos Process Confirmation workspace ready at ${app.baseUrl}`);
      const stop = async () => { await app.close(); process.exit(0); };
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
    })
    .catch((error) => { console.error(error); process.exit(1); });
}
