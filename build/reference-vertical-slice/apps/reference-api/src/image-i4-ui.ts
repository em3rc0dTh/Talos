import { referenceDemoHtml } from './ui.ts';

/**
 * I4 is an additive browser truth layer over the already-regression-proven I3
 * source/perception review shell. Keeping the transformation explicit prevents
 * I4 from silently rewriting the historical I3 interaction contract while the
 * image workflow is still bounded before semantic freeze/execution.
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
    '<span class="gate-pill">I0 bytes ✅</span><span class="gate-pill">I1 perception ✅</span><span class="gate-pill">I2 common evidence ✅</span><span class="gate-pill">I3 browser 🟡</span><span class="gate-pill">I4 Canonical ⛔</span><span class="gate-pill">I6 image → Temporal ⛔</span>',
    '<span class="gate-pill">I0 bytes ✅</span><span class="gate-pill">I1 perception ✅</span><span class="gate-pill">I2 common evidence ✅</span><span class="gate-pill">I3 review ✅</span><span class="gate-pill">I4 Canonical + Validation ✅</span><span class="gate-pill">I5 freeze / execution ⛔</span><span class="gate-pill">I6 image → Temporal ⛔</span>',
  )
  .replace("if (file.type && file.type !== 'image/png') { byId('imageStatus').textContent = 'I3 accepts PNG only.'; return; }", "if (file.type && file.type !== 'image/png') { byId('imageStatus').textContent = 'I4 accepts PNG only.'; return; }")
  .replace(
    "metric('imageMeta','Canonical',data.canonical.gate);\n      metric('imageMeta','Image → Temporal',data.temporal.gate);",
    "metric('imageMeta','Canonical',data.canonical.created ? data.canonical.nodeCount + ' nodes / ' + data.canonical.truthDiscipline : data.canonical.gate);\n      metric('imageMeta','Validation',data.validation ? data.validation.semanticVerdict + ' / ' + data.validation.executionReadiness : 'NOT ASSESSED');\n      metric('imageMeta','I5 handoff',data.executionHandoff.gate);\n      metric('imageMeta','Image → Temporal',data.temporal.gate);",
  )
  .replace(
    "byId('imageStatus').innerHTML = '<strong>' + data.stage + '</strong><br>' + (data.commonEvidence ? 'Perception/common evidence is ready to inspect. No Canonical process has been created.' : 'The image is preserved exactly, but this fixture provider did not interpret it.');",
    "byId('imageStatus').innerHTML = '<strong>' + data.stage + '</strong><br>' + (data.canonical.created ? 'Talos created an INFERRED Canonical candidate and ran semantic validation. Review the findings below; nothing has been frozen or executed from this image.' : 'The image is preserved exactly, but this fixture provider did not interpret it.');",
  );
