export const referenceDemoHtml = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Talos Reference Vertical Slice</title>
  <style>
    :root { color-scheme:dark; --bg:#080b10; --panel:#10151d; --line:#263142; --text:#edf3ff; --muted:#91a0b6; --accent:#7ce7c6; --warn:#ffcf70; --bad:#ff7d8d; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background:radial-gradient(circle at 15% 0%,#132335 0,#080b10 38%); color:var(--text); min-height:100vh; }
    main { width:min(1180px,calc(100% - 32px)); margin:0 auto; padding:34px 0 48px; }
    .hero { display:flex; justify-content:space-between; gap:24px; align-items:flex-end; margin-bottom:22px; }
    .eyebrow { color:var(--accent); text-transform:uppercase; letter-spacing:.16em; font-size:12px; font-weight:800; }
    h1 { margin:8px 0 7px; font-size:clamp(30px,5vw,56px); line-height:.98; letter-spacing:-.04em; }
    .hero p { color:var(--muted); max-width:760px; margin:0; line-height:1.55; }
    .badge { white-space:nowrap; border:1px solid #2d6c5c; background:#0c231d; color:var(--accent); padding:9px 12px; border-radius:999px; font-size:12px; font-weight:800; }
    .grid { display:grid; grid-template-columns:1.08fr .92fr; gap:16px; }
    .card { background:linear-gradient(180deg,rgba(21,28,38,.96),rgba(13,18,26,.96)); border:1px solid var(--line); border-radius:18px; padding:18px; box-shadow:0 18px 55px rgba(0,0,0,.28); }
    .wide { margin-top:16px; }
    .card h2 { margin:0 0 6px; font-size:17px; }
    .card .sub { margin:0 0 16px; color:var(--muted); font-size:13px; line-height:1.5; }
    .pipeline { display:grid; gap:7px; margin-top:14px; }
    .step { display:flex; gap:10px; align-items:center; min-height:37px; padding:8px 10px; background:#0b1017; border:1px solid #202a38; border-radius:11px; font-size:13px; }
    .dot { width:8px; height:8px; background:var(--accent); border-radius:50%; box-shadow:0 0 16px rgba(124,231,198,.55); flex:0 0 auto; }
    .arrow { color:#536177; padding-left:3px; font-size:12px; }
    label { display:block; color:#c8d2e1; font-size:12px; font-weight:700; margin:14px 0 7px; }
    input, textarea { width:100%; border:1px solid #2a3748; background:#090e15; color:var(--text); border-radius:11px; padding:11px 12px; outline:none; font:inherit; }
    textarea { resize:vertical; min-height:78px; }
    input:focus, textarea:focus { border-color:#508e7d; box-shadow:0 0 0 3px rgba(124,231,198,.08); }
    .actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    button { border:0; border-radius:11px; padding:11px 15px; font-weight:800; cursor:pointer; background:var(--accent); color:#062018; }
    button.secondary { background:#263142; color:var(--text); }
    button.reject { background:#3a2028; color:#ffb3bd; border:1px solid #67313e; }
    button:disabled { opacity:.45; cursor:not-allowed; }
    .status { margin-top:14px; padding:12px; border:1px solid #273447; background:#0b1017; border-radius:11px; font-size:13px; line-height:1.55; }
    .status strong { color:var(--accent); }
    .meta { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; margin-top:13px; }
    .metric { background:#0b1017; border:1px solid #202a38; border-radius:11px; padding:10px; min-height:70px; }
    .metric .k { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.1em; }
    .metric .v { margin-top:6px; font-size:13px; word-break:break-word; }
    pre { margin:12px 0 0; padding:12px; max-height:320px; overflow:auto; background:#070b10; border:1px solid #202a38; border-radius:11px; color:#b9c9dd; font-size:11px; line-height:1.5; }
    .note { border-left:3px solid var(--warn); padding:10px 12px; background:#1b160b; color:#dfc68d; border-radius:0 10px 10px 0; font-size:12px; line-height:1.5; margin-top:14px; }
    .ok { color:var(--accent); } .bad { color:var(--bad); }
    .image-review-grid { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr); gap:16px; margin-top:16px; }
    .image-frame { position:relative; min-height:260px; background:#070b10; border:1px solid #202a38; border-radius:14px; overflow:hidden; display:grid; place-items:center; }
    .image-frame img { display:block; max-width:100%; max-height:560px; object-fit:contain; }
    .image-overlay { position:absolute; inset:8px; border:1px dashed rgba(124,231,198,.72); border-radius:10px; pointer-events:none; display:flex; align-items:flex-start; justify-content:flex-end; padding:7px; color:var(--accent); font-size:10px; letter-spacing:.08em; text-transform:uppercase; }
    .gate-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
    .gate-pill { border:1px solid #354256; border-radius:999px; padding:6px 9px; color:#c6d1df; background:#0b1017; font-size:11px; }
    @media (max-width:850px) { .grid,.image-review-grid { grid-template-columns:1fr; } .hero { align-items:flex-start; flex-direction:column; } .badge{white-space:normal;} }
  </style>
</head>
<body>
<main>
  <header class="hero">
    <div>
      <div class="eyebrow">Talos · Reference Vertical Slice</div>
      <h1>Source truth → durable execution.</h1>
      <p>The running Canvas reference spine remains real. The Image Vertical Slice now adds exact PNG preservation, perception history and common source evidence without pretending that image inference is accepted business truth.</p>
    </div>
    <div class="badge" id="healthBadge">Starting runtime…</div>
  </header>

  <div class="grid">
    <section class="card">
      <h2>1. The Talos spine</h2>
      <p class="sub">This baseline is rebuilt through the real Canvas reference pipeline when the app starts.</p>
      <div class="pipeline">
        <div class="step"><span class="dot"></span>Canvas source: Review request · actor = UNKNOWN</div>
        <div class="arrow">↓ intake / canonical / provenance / validation</div>
        <div class="step"><span class="dot"></span>Finding: missing responsibility / actor</div>
        <div class="arrow">↓ explicit review correction</div>
        <div class="step"><span class="dot"></span>actor = Manager · new source + canonical revision</div>
        <div class="arrow">↓ semantic freeze / capability / execution design</div>
        <div class="step"><span class="dot"></span>Human approval → Temporal Update + Workflow condition</div>
        <div class="step"><span class="dot"></span>Email capability → Temporal Activity + retry/idempotency policy</div>
      </div>
      <div class="meta" id="baselineMeta"></div>
      <pre id="baselineJson">Loading baseline…</pre>
    </section>

    <section class="card">
      <h2>2. Run one real request</h2>
      <p class="sub">The email provider is TEST_ONLY. No real email is sent; the Activity records one idempotent provider effect.</p>
      <label for="recipient">Runtime notification recipient</label>
      <input id="recipient" type="email" value="eduardo@example.test" autocomplete="off" />
      <div class="actions"><button id="startBtn">Start process</button></div>
      <div class="note">For approved requests the reference Worker intentionally injects one transient provider failure. Temporal should retry the Activity and the provider must still record exactly one logical effect.</div>
      <div class="status" id="requestStatus">No request started yet.</div>
      <div id="reviewBox" hidden>
        <label for="comment">Manager comment</label>
        <textarea id="comment" placeholder="Optional comment"></textarea>
        <div class="actions"><button class="reject" id="rejectBtn">Reject</button><button id="approveBtn">Approve</button></div>
      </div>
      <pre id="resultJson">Runtime result will appear here.</pre>
    </section>
  </div>

  <section class="card wide">
    <h2>3. Image source → perception evidence</h2>
    <p class="sub">I3 is a review surface, not an image-to-Temporal shortcut. Talos preserves the PNG first, then records perception and common source evidence. Image-derived Canonical/Temporal gates remain closed.</p>
    <div class="note"><strong>Current provider:</strong> REFERENCE_QUARRY_PERCEPTION / FIXTURE_PROVIDER. It recognizes only the exact Quarry-02 fixture. Other PNGs are still preserved exactly, but Talos will return <code>NO_PERCEPTION_PROVIDER_RESULT</code> instead of inventing a workflow.</div>
    <label for="imageFile">PNG process image</label>
    <input id="imageFile" type="file" accept="image/png,.png" />
    <div class="actions"><button id="uploadImageBtn">Preserve & inspect image</button></div>
    <div class="gate-row">
      <span class="gate-pill">I0 bytes ✅</span><span class="gate-pill">I1 perception ✅</span><span class="gate-pill">I2 common evidence ✅</span><span class="gate-pill">I3 browser 🟡</span><span class="gate-pill">I4 Canonical ⛔</span><span class="gate-pill">I6 image → Temporal ⛔</span>
    </div>
    <div class="status" id="imageStatus">No image uploaded yet.</div>
    <div id="imageReview" class="image-review-grid" hidden>
      <div>
        <div class="image-frame">
          <img id="imagePreview" alt="Uploaded process source" />
          <div class="image-overlay" id="imageOverlay">source bytes</div>
        </div>
      </div>
      <div>
        <div class="meta" id="imageMeta"></div>
        <pre id="imageJson">Image evidence will appear here.</pre>
      </div>
    </div>
  </section>
</main>
<script>
  const byId = (id) => document.getElementById(id);
  let currentRequestId = null;

  async function call(path, options) {
    const response = await fetch(path, options);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || ('HTTP ' + response.status));
    return body;
  }
  function pretty(value) { return JSON.stringify(value, null, 2); }
  function metric(containerId, key, value) {
    const div = document.createElement('div');
    div.className = 'metric';
    const k = document.createElement('div'); k.className = 'k'; k.textContent = key;
    const v = document.createElement('div'); v.className = 'v'; v.textContent = String(value ?? '—');
    div.append(k, v); byId(containerId).appendChild(div);
  }
  function setBusy(value) {
    byId('startBtn').disabled = value; byId('approveBtn').disabled = value; byId('rejectBtn').disabled = value;
  }

  async function boot() {
    try {
      const [health, baseline] = await Promise.all([call('/api/health'), call('/api/baseline')]);
      byId('healthBadge').textContent = health.status + ' · Temporal ' + health.temporalSdkVersion;
      byId('baselineMeta').innerHTML = '';
      for (const pair of [
        ['Initial readiness', baseline.initial.readiness], ['Initial actor', baseline.initial.actor], ['Corrected actor', baseline.corrected.actor],
        ['Freeze', baseline.freeze.kind], ['Temporal mapping', baseline.temporal.humanMapping], ['Provider', baseline.capability.offering],
      ]) metric('baselineMeta', pair[0], pair[1]);
      byId('baselineJson').textContent = pretty(baseline);
    } catch (error) {
      byId('healthBadge').textContent = 'Runtime error'; byId('healthBadge').className = 'badge bad'; byId('baselineJson').textContent = String(error);
    }
  }

  async function startProcess() {
    setBusy(true);
    try {
      const data = await call('/api/processes', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({recipientEmail:byId('recipient').value.trim()}) });
      currentRequestId = data.referenceRequestId;
      byId('requestStatus').innerHTML = '<strong>RUNNING</strong><br>Request: ' + data.referenceRequestId + '<br>Workflow: ' + data.workflowId + '<br>Review state: ' + data.reviewState.reviewOutcome;
      byId('reviewBox').hidden = false; byId('resultJson').textContent = pretty(data);
    } catch (error) { byId('requestStatus').textContent = String(error); }
    finally { setBusy(false); }
  }

  async function submitReview(outcome) {
    if (!currentRequestId) return;
    setBusy(true);
    try {
      const data = await call('/api/processes/' + encodeURIComponent(currentRequestId) + '/review', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({outcome, comment:byId('comment').value}) });
      byId('requestStatus').innerHTML = '<strong>' + data.result.outcome + '</strong><br>Temporal Workflow completed.<br>Provider effects: ' + data.providerEffects.length;
      byId('reviewBox').hidden = true; byId('resultJson').textContent = pretty(data);
    } catch (error) { byId('requestStatus').textContent = String(error); }
    finally { setBusy(false); }
  }

  async function uploadImage() {
    const input = byId('imageFile');
    const file = input.files && input.files[0];
    if (!file) { byId('imageStatus').textContent = 'Choose a PNG first.'; return; }
    if (file.type && file.type !== 'image/png') { byId('imageStatus').textContent = 'I3 accepts PNG only.'; return; }
    byId('uploadImageBtn').disabled = true;
    byId('imageStatus').textContent = 'Preserving exact bytes and running the bounded perception adapter…';
    try {
      const response = await fetch('/api/images', {
        method:'POST',
        headers:{'content-type':'image/png','x-talos-file-name':encodeURIComponent(file.name)},
        body:file,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || ('HTTP ' + response.status));
      byId('imageReview').hidden = false;
      byId('imagePreview').src = data.source.imageUrl + '?v=' + Date.now();
      byId('imageOverlay').textContent = data.perception.anchorCount ? 'WHOLE_IMAGE evidence anchor' : 'SOURCE BYTES · no perception anchor';
      byId('imageMeta').innerHTML = '';
      metric('imageMeta','Stage',data.stage);
      metric('imageMeta','Verified SHA-256',data.source.sha256);
      metric('imageMeta','Dimensions',data.source.width + ' × ' + data.source.height);
      metric('imageMeta','Byte identity',data.source.byteIdentityStatus);
      metric('imageMeta','Perception provider',data.perception.providerId);
      metric('imageMeta','Provider class',data.perception.providerClass);
      metric('imageMeta','Observations',data.perception.observationCount);
      metric('imageMeta','Occurrence candidates',data.perception.occurrenceCandidateCount);
      metric('imageMeta','Common scope',data.commonEvidence ? data.commonEvidence.scope.kind + ' / ' + data.commonEvidence.scope.truthClass : 'NONE');
      metric('imageMeta','Canonical',data.canonical.gate);
      metric('imageMeta','Image → Temporal',data.temporal.gate);
      byId('imageStatus').innerHTML = '<strong>' + data.stage + '</strong><br>' + (data.commonEvidence ? 'Perception/common evidence is ready to inspect. No Canonical process has been created.' : 'The image is preserved exactly, but this fixture provider did not interpret it.');
      byId('imageJson').textContent = pretty(data);
    } catch (error) {
      byId('imageStatus').textContent = String(error);
    } finally {
      byId('uploadImageBtn').disabled = false;
    }
  }

  byId('startBtn').addEventListener('click', startProcess);
  byId('approveBtn').addEventListener('click', () => submitReview('APPROVED'));
  byId('rejectBtn').addEventListener('click', () => submitReview('REJECTED'));
  byId('uploadImageBtn').addEventListener('click', uploadImage);
  boot();
</script>
</body>
</html>`;
