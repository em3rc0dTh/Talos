import test from 'node:test';
import assert from 'node:assert/strict';
import { ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-client-surface-page.ts';

test('R1-11 normal product surface uses the full content width while Advanced may restore the authority aside', () => {
  const script = ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT;
  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /grid\.talos-product-wide/);
  assert.match(script, /grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(script, /applyLayout/);
  assert.match(script, /if\(advanced\)grid\.classList\.remove\('talos-product-wide'\)/);
});

test('R1-11 BPMN and Temporal canvases can open in a large zoomable modal', () => {
  const script = ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT;
  assert.match(script, /talosCanvasModal/);
  assert.match(script, /talosCanvasViewport/);
  assert.match(script, /Open large/);
  assert.match(script, /Zoom out/);
  assert.match(script, /Zoom in/);
  assert.match(script, /fitCanvas/);
  assert.match(script, /Double-click to open this canvas large/);
});

test('R1-11 material branch questions live directly under the BPMN canvas and save through one explicit confirmation action', () => {
  const script = ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT;
  assert.match(script, /branchConditionResolution/);
  assert.match(script, /canvas\.insertAdjacentElement\('afterend',panel\)/);
  assert.match(script, /Confirm the decision branches/);
  assert.match(script, /Confirm branch meanings/);
  assert.match(script, /talosAutoSaveBound/);
  assert.match(script, /save\.click\(\)/);
});

test('R1-11 repetitive validator receipts stay compact and behind Advanced instead of becoming the user journey', () => {
  const script = ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT;
  assert.match(script, /processNodes/);
  assert.match(script, /questions/);
  assert.match(script, /findings/);
  assert.match(script, /review questions/);
  assert.match(script, /validation findings/);
  assert.match(script, /advanced BPMN/);
  assert.match(script, /applyReviewNoise/);
  assert.match(script, /compactTechnicalEvidence/);
  assert.match(script, /Reviewer input required/);
  assert.match(script, /SV-SRC-001/);
  assert.match(script, /×/);
});

test('R1-11 completed automation proposal cannot remain visually stuck in Gemini preparing state', () => {
  const script = ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT;
  assert.match(script, /fixDesignStatus/);
  assert.match(script, /talosTemporalCanvas/);
  assert.match(script, /DESIGN COMPLETE\|AI design coverage is complete/);
  assert.match(script, /Gemini is preparing the Temporal workflow proposal/);
  assert.match(script, /Automation proposal ready for review\./);
});

test('R1-11 dynamic AI modules refresh the client surface through parsed JSON even when they bypass the latest fetch wrapper', () => {
  const script = ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT;
  assert.match(script, /installJsonHook/);
  assert.match(script, /Response\.prototype\.json/);
  assert.match(script, /__talosClientSurfaceJsonHook/);
  assert.match(script, /window\.setTimeout\(scheduleApply,700\)/);
});

test('R1-11 client hardening remains event-driven and contains no recursive DOM observer', () => {
  const script = ONE_APP_PRODUCT_CLIENT_SURFACE_ENHANCEMENT;
  assert.doesNotMatch(script, /MutationObserver/);
  assert.match(script, /nativeFetch=window\.fetch\.bind\(window\)/);
  assert.match(script, /scheduleApply/);
  assert.match(script, /talos:surface-refresh/);
});
