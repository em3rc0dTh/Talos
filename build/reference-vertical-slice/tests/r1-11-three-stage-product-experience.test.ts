import test from 'node:test';
import assert from 'node:assert/strict';
import { ONE_APP_PRODUCT_SIMPLE_JOURNEY_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-simple-journey-page.ts';
import { ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-client-surface-page.ts';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

test('R1-11 product experience exposes Process → Automation → Run instead of making eight internal gates the primary journey', () => {
  const script = ONE_APP_PRODUCT_SIMPLE_JOURNEY_ENHANCEMENT;

  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /talosStageProcess/);
  assert.match(script, /talosStageAutomation/);
  assert.match(script, /talosStageRun/);
  assert.match(script, /Show me what you do/);
  assert.match(script, /Show me how Talos would run it/);
  assert.match(script, /Deploy, execute and monitor/);
  assert.match(script, /old\.classList\.add\('talos-simple-hidden'\)/);
  assert.match(script, /hide\(byId\('planCard'\)\);hide\(byId\('runtimeCard'\)\)/);
  assert.match(script, /talosAdvancedToggle/);
  assert.match(script, /Hide advanced/);
});

test('R1-11 process review renders a BPMN canvas before business confirmation and keeps evidence details advanced', () => {
  const script = ONE_APP_PRODUCT_SIMPLE_JOURNEY_ENHANCEMENT;

  assert.match(script, /BPMN review canvas/);
  assert.match(script, /What Talos understood from the source/);
  assert.match(script, /renderSvg\(latestProcess,'bpmn',null\)/);
  assert.match(script, /Advanced review evidence/);
  assert.match(script, /Confirm process/);
  assert.match(script, /\/api\/process-review/);
  assert.match(script, /\/api\/bpmn\/confirm/);
});

test('R1-11 confirmed process automatically opens AI design and renders a Temporal canvas plus proposal-derived tools before approval', () => {
  const script = ONE_APP_PRODUCT_SIMPLE_JOURNEY_ENHANCEMENT;

  assert.match(script, /autoOpenDesignAfterConfirmation/);
  assert.match(script, /Gemini is preparing the Temporal workflow proposal/);
  assert.match(script, /Temporal workflow canvas/);
  assert.match(script, /Suggested execution design · not deployed/);
  assert.match(script, /Suggested tools & capabilities/);
  assert.match(script, /renderSvg\(latestProcess,'temporal',latestProposal\)/);
  assert.match(script, /step\.implementationKind\+' · '\+step\.implementationRef/);
  assert.match(script, /Approve automation/);
  assert.doesNotMatch(script, /car wash|lavado|l[aá]mpara|ampolleta/i);
  assert.doesNotMatch(script, /WhatsApp|Gmail|Google Drive|PostgreSQL|Mercado Pago/i);
});

test('R1-11 Temporal compilation follows proposal wait treatment rather than silently choosing a different visible design', () => {
  const script = ONE_APP_PRODUCT_SIMPLE_JOURNEY_ENHANCEMENT;

  assert.match(script, /Array\.isArray\(element\.semanticSubjectRefs\)\?element\.semanticSubjectRefs\.slice\(\)/);
  assert.match(script, /o\.proposedTreatment==='DURABLE_TIMER'\|\|o\.proposedTreatment==='WORKFLOW_CONDITION'/);
  assert.match(script, /select\.value=desired/);
});

test('R1-11 one automation approval may compile hidden plan/mapping/policy gates, while deployment and workflow start still require explicit visible actions', () => {
  const script = ONE_APP_PRODUCT_SIMPLE_JOURNEY_ENHANCEMENT;

  assert.match(script, /startCompileIfReady/);
  assert.match(script, /safeClick\('buildPlan'\)/);
  assert.match(script, /safeClick\('approveAutomation'\)/);
  assert.match(script, /safeClick\('mapTemporal'\)/);
  assert.match(script, /safeClick\('recordRuntimePolicy'\)/);
  assert.match(script, /Deploy approved workflow/);
  assert.match(script, /Run workflow/);
  assert.match(script, /b\.addEventListener\('click'/);
  assert.match(script, /r\.addEventListener\('click'/);
  assert.doesNotMatch(script, /safeClick\('approveDeployment'\).*startCompileIfReady/);
  assert.doesNotMatch(script, /safeClick\('approveExecution'\).*startCompileIfReady/);
});

test('R1-11 normal client surface hides router/binding diagnostics and manual capability plumbing unless Advanced is opened', () => {
  const script = ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT;

  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /PRIMARY_ACCEPTED/);
  assert.match(script, /READY_FOR_CAPABILITY_SELECTION/);
  assert.match(script, /manualCapabilityToggle/);
  assert.match(script, /if\(advanced\)show\(manual\);else hide\(manual\)/);
  assert.match(script, /designState/);
  assert.match(script, /reviewState/);
});

test('R1-11 product server serves simplified journey and client-safe surface after the engine presentation enhancements', async () => {
  const product = await startTalosOneAppProduct({ port: 0 });
  try {
    const page = await fetch(product.baseUrl);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /talos-product-simple-journey\.js/);
    assert.match(html, /talos-product-client-surface\.js/);
    assert.ok(html.lastIndexOf('talos-product-simple-journey.js') > html.lastIndexOf('talos-product-ai-automation.js'));
    assert.ok(html.lastIndexOf('talos-product-client-surface.js') > html.lastIndexOf('talos-product-simple-journey.js'));

    const enhancement = await fetch(`${product.baseUrl}/talos-product-simple-journey.js`);
    assert.equal(enhancement.status, 200);
    assert.match(enhancement.headers.get('content-type') ?? '', /application\/javascript/);
    assert.equal(await enhancement.text(), ONE_APP_PRODUCT_SIMPLE_JOURNEY_ENHANCEMENT);

    const clientSurface = await fetch(`${product.baseUrl}/talos-product-client-surface.js`);
    assert.equal(clientSurface.status, 200);
    assert.match(clientSurface.headers.get('content-type') ?? '', /application\/javascript/);
    assert.equal(await clientSurface.text(), ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT);
  } finally {
    await product.close();
  }
});
