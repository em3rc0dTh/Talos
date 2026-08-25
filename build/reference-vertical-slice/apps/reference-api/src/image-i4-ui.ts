import { referenceDemoHtml } from './ui.ts';

/**
 * I4 is an additive browser truth layer over the already-regression-proven I3
 * source/perception review shell. Keeping the transformation explicit prevents
 * I4 from silently rewriting the historical I3 interaction contract while the
 * image workflow is still bounded before semantic freeze/execution.
 *
 * R1-01 hardening: capability availability and per-upload execution state are
 * deliberately separate. A stage must never render as a green success merely
 * because the build contains that capability. The pills below are updated from
 * the actual image result returned by /api/images.
 */
export const referenceDemoHtmlI4 = referenceDemoHtml
  .replace(
    'The running Canvas reference spine remains real. The Image Vertical Slice now adds exact PNG preservation, perception history and common source evidence without pretending that image inference is accepted business truth.',
    'The running Canvas reference spine remains real. The Image Vertical Slice now carries exact PNG evidence through perception, common source evidence, inferred Canonical meaning and frozen semantic validation — while keeping image freeze/execution closed.',
  )
  .replace(
    '<h2>3. Image source → perception evidence</h2>',
    '<h2>3. Image source → inferred Canonical review</h2>',
  )
  .replace(
    'I3 is a review surface, not an image-to-Temporal shortcut. Talos preserves the PNG first, then records perception and common source evidence. Image-derived Canonical/Temporal gates remain closed.',
    'Talos preserves the PNG first, records perception/common evidence, then creates an INFERRED Canonical ProcessRevision and ValidationAssessment for review. I5 semantic freeze/execution handoff and I6 image → Temporal remain closed.',
  )
  .replace(
    '.gate-pill { border:1px solid #354256; border-radius:999px; padding:6px 9px; color:#c6d1df; background:#0b1017; font-size:11px; }',
    '.gate-pill { border:1px solid #354256; border-radius:999px; padding:6px 9px; color:#c6d1df; background:#0b1017; font-size:11px; }\n    .gate-pass { border-color:#2d6c5c; background:#0c231d; color:var(--accent); }\n    .gate-partial,.gate-no-result { border-color:#715d2f; background:#211a0b; color:var(--warn); }\n    .gate-blocked,.gate-not-reached { border-color:#354256; background:#0b1017; color:var(--muted); }\n    .gate-closed,.gate-fail { border-color:#67313e; background:#241219; color:var(--bad); }',
  )
  .replace(
    '<span class="gate-pill">I0 bytes ✅</span><span class="gate-pill">I1 perception ✅</span><span class="gate-pill">I2 common evidence ✅</span><span class="gate-pill">I3 browser 🟡</span><span class="gate-pill">I4 Canonical ⛔</span><span class="gate-pill">I6 image → Temporal ⛔</span>',
    '<span class="gate-pill gate-not-reached" id="gateI0">I0 bytes · NOT_REACHED</span><span class="gate-pill gate-not-reached" id="gateI1">I1 perception · NOT_REACHED</span><span class="gate-pill gate-not-reached" id="gateI2">I2 common evidence · NOT_REACHED</span><span class="gate-pill gate-not-reached" id="gateI3">I3 review · NOT_REACHED</span><span class="gate-pill gate-not-reached" id="gateI4">I4 Canonical + Validation · NOT_REACHED</span><span class="gate-pill gate-closed" id="gateI5">I5 freeze / execution · CLOSED</span><span class="gate-pill gate-closed" id="gateI6">I6 image → Temporal · CLOSED</span>',
  )
  .replace("if (file.type && file.type !== 'image/png') { byId('imageStatus').textContent = 'I3 accepts PNG only.'; return; }", "if (file.type && file.type !== 'image/png') { byId('imageStatus').textContent = 'I4 accepts PNG only.'; return; }")
  .replace(
    '  async function uploadImage() {',
    `  function setImageGate(id, label, state) {
    const element = byId(id);
    if (!element) return;
    const normalized = String(state).toLowerCase().replaceAll('_', '-');
    element.className = 'gate-pill gate-' + normalized;
    element.textContent = label + ' · ' + state;
  }

  function updateImageGates(data) {
    const bytesPass = data.source && data.source.byteIdentityStatus === 'EXACT_VERIFIED';
    setImageGate('gateI0', 'I0 bytes', bytesPass ? 'PASS' : 'FAIL');

    const providerStatus = data.perception && data.perception.providerStatus;
    const hasPerceptionEvidence = Boolean(data.perception)
      && (data.perception.anchorCount > 0 || data.perception.observationCount > 0 || data.perception.occurrenceCandidateCount > 0);
    if (providerStatus === 'NO_RESULT') setImageGate('gateI1', 'I1 perception', 'NO_RESULT');
    else if (providerStatus === 'PARTIAL') setImageGate('gateI1', 'I1 perception', hasPerceptionEvidence ? 'PARTIAL' : 'NO_RESULT');
    else setImageGate('gateI1', 'I1 perception', hasPerceptionEvidence ? 'PASS' : 'PARTIAL');

    if (data.commonEvidence) setImageGate('gateI2', 'I2 common evidence', 'PASS');
    else setImageGate('gateI2', 'I2 common evidence', providerStatus === 'NO_RESULT' ? 'BLOCKED' : 'NOT_REACHED');

    if (data.commonEvidence) setImageGate('gateI3', 'I3 review', 'PASS');
    else setImageGate('gateI3', 'I3 review', 'NOT_REACHED');

    if (data.canonical && data.canonical.created && data.validation) setImageGate('gateI4', 'I4 Canonical + Validation', 'PASS');
    else setImageGate('gateI4', 'I4 Canonical + Validation', 'NOT_REACHED');

    setImageGate('gateI5', 'I5 freeze / execution', 'CLOSED');
    setImageGate('gateI6', 'I6 image → Temporal', 'CLOSED');
  }

  async function uploadImage() {`,
  )
  .replace(
    "metric('imageMeta','Canonical',data.canonical.gate);\n      metric('imageMeta','Image → Temporal',data.temporal.gate);",
    "metric('imageMeta','Canonical',data.canonical.created ? data.canonical.nodeCount + ' nodes / ' + data.canonical.truthDiscipline : data.canonical.gate);\n      metric('imageMeta','Validation',data.validation ? data.validation.semanticVerdict + ' / ' + data.validation.executionReadiness : 'NOT ASSESSED');\n      metric('imageMeta','I5 handoff',data.executionHandoff.gate);\n      metric('imageMeta','Image → Temporal',data.temporal.gate);",
  )
  .replace(
    "byId('imageStatus').innerHTML = '<strong>' + data.stage + '</strong><br>' + (data.commonEvidence ? 'Perception/common evidence is ready to inspect. No Canonical process has been created.' : 'The image is preserved exactly, but this fixture provider did not interpret it.');",
    "updateImageGates(data);\n      byId('imageStatus').innerHTML = '<strong>' + data.stage + '</strong><br>' + (data.canonical.created ? 'Talos created an INFERRED Canonical candidate and ran semantic validation. Review the findings below; nothing has been frozen or executed from this image.' : 'The image is preserved exactly, but this fixture provider did not interpret it.');",
  );
