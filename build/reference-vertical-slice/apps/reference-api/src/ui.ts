export const referenceDemoHtml = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Talos Reference Vertical Slice</title>
  <style>
    :root { color-scheme: dark; --bg:#080b10; --panel:#10151d; --panel2:#151c26; --line:#263142; --text:#edf3ff; --muted:#91a0b6; --accent:#7ce7c6; --warn:#ffcf70; --bad:#ff7d8d; }
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
    @media (max-width:850px) { .grid { grid-template-columns:1fr; } .hero { align-items:flex-start; flex-direction:column; } .badge{white-space:normal;} }
  </style>
</head>
<body>
<main>
  <header class="hero">
    <div>
      <div class="eyebrow">Talos · Reference Vertical Slice</div>
      <h1>Source truth → durable execution.</h1>
      <p>This is the first deliberately small Talos runtime. It preserves the source, finds the missing actor, applies the explicit Manager correction, freezes accepted semantics, designs capabilities, maps execution to Temporal, and runs the process on a real local Temporal server.</p>
    </div>
    <div class="badge" id="healthBadge">Starting runtime…</div>
  </header>

  <div class="grid">
    <section class="card">
      <h2>1. The Talos spine</h2>
      <p class="sub">This baseline is rebuilt through the real reference pipeline when the app starts.</p>
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
      <div class="actions">
        <button id="startBtn">Start process</button>
      </div>
      <div class="note">For approved requests the reference Worker intentionally injects one transient provider failure. Temporal should retry the Activity and the provider must still record exactly one logical effect.</div>
      <div class="status" id="requestStatus">No request started yet.</div>

      <div id="reviewBox" hidden>
        <label for="comment">Manager comment</label>
        <textarea id="comment" placeholder="Optional comment"></textarea>
        <div class="actions">
          <button class="reject" id="rejectBtn">Reject</button>
          <button id="approveBtn">Approve</button>
        </div>
      </div>

      <pre id="resultJson">Runtime result will appear here.</pre>
    </section>
  </div>
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
  function setBusy(value) {
    byId('startBtn').disabled = value;
    byId('approveBtn').disabled = value;
    byId('rejectBtn').disabled = value;
  }

  async function boot() {
    try {
      const [health, baseline] = await Promise.all([call('/api/health'), call('/api/baseline')]);
      byId('healthBadge').textContent = health.status + ' · Temporal ' + health.temporalSdkVersion;
      byId('healthBadge').className = 'badge';
      byId('baselineMeta').innerHTML = '';
      const metrics = [
        ['Initial readiness', baseline.initial.readiness],
        ['Initial actor', baseline.initial.actor],
        ['Corrected actor', baseline.corrected.actor],
        ['Freeze', baseline.freeze.kind],
        ['Temporal mapping', baseline.temporal.humanMapping],
        ['Provider', baseline.capability.offering],
      ];
      for (const pair of metrics) {
        const div = document.createElement('div');
        div.className = 'metric';
        div.innerHTML = '<div class="k"></div><div class="v"></div>';
        div.querySelector('.k').textContent = pair[0];
        div.querySelector('.v').textContent = pair[1];
        byId('baselineMeta').appendChild(div);
      }
      byId('baselineJson').textContent = pretty(baseline);
    } catch (error) {
      byId('healthBadge').textContent = 'Runtime error';
      byId('healthBadge').className = 'badge bad';
      byId('baselineJson').textContent = String(error);
    }
  }

  async function startProcess() {
    setBusy(true);
    try {
      const recipientEmail = byId('recipient').value.trim();
      const data = await call('/api/processes', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({recipientEmail}),
      });
      currentRequestId = data.referenceRequestId;
      byId('requestStatus').innerHTML = '<strong>RUNNING</strong><br>Request: ' + data.referenceRequestId + '<br>Workflow: ' + data.workflowId + '<br>Review state: ' + data.reviewState.reviewOutcome;
      byId('reviewBox').hidden = false;
      byId('resultJson').textContent = pretty(data);
    } catch (error) {
      byId('requestStatus').innerHTML = '<span class="bad">' + String(error) + '</span>';
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(outcome) {
    if (!currentRequestId) return;
    setBusy(true);
    try {
      const data = await call('/api/processes/' + encodeURIComponent(currentRequestId) + '/review', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({outcome, comment: byId('comment').value}),
      });
      byId('requestStatus').innerHTML = '<strong>' + data.result.outcome + '</strong><br>Temporal Workflow completed.<br>Provider effects: ' + data.providerEffects.length;
      byId('reviewBox').hidden = true;
      byId('resultJson').textContent = pretty(data);
    } catch (error) {
      byId('requestStatus').innerHTML = '<span class="bad">' + String(error) + '</span>';
    } finally {
      setBusy(false);
    }
  }

  byId('startBtn').addEventListener('click', startProcess);
  byId('approveBtn').addEventListener('click', () => submitReview('APPROVED'));
  byId('rejectBtn').addEventListener('click', () => submitReview('REJECTED'));
  boot();
</script>
</body>
</html>`;
