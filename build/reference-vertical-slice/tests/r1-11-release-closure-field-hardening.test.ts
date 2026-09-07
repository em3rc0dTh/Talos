import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ONE_APP_PRODUCT_RELEASE_CLOSURE_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-release-closure-page.ts';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

test('R1-11 AI safe-stop without actionable material questions receives one bounded governed retry', () => {
  const script = ONE_APP_PRODUCT_RELEASE_CLOSURE_ENHANCEMENT;
  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /UNRESOLVED_AFTER_FALLBACK/);
  assert.match(script, /materialQuestions/);
  assert.match(script, /questions\.length>0/);
  assert.match(script, /aiRecoveryAttempts>=1/);
  assert.match(script, /aiRecoveryAttempts\+=1/);
  assert.match(script, /Talos is retrying the automation design once/);
  assert.match(script, /Redesign with Gemini/);
  assert.doesNotMatch(script, /MutationObserver/);
});

test('R1-11 compiled DESIGN_ONLY workflow reveals Run instead of looking stuck after internal compilation', () => {
  const script = ONE_APP_PRODUCT_RELEASE_CLOSURE_ENHANCEMENT;
  assert.match(script, /talos-simple-hidden/);
  assert.match(script, /classList\.remove\('talos-simple-hidden'\)/);
  assert.match(script, /talosStageRun/);
  assert.match(script, /Automation design complete/);
  assert.match(script, /This session is DESIGN_ONLY/);
  assert.match(script, /Temporal runtime required to deploy/);
  assert.match(script, /temporalExecutionAvailable/);
});

test('R1-11 release closure remains process agnostic', () => {
  const script = ONE_APP_PRODUCT_RELEASE_CLOSURE_ENHANCEMENT;
  assert.doesNotMatch(script, /lavado|rines|veh[ií]culo|l[aá]mpara|car-wash|image-test/i);
});

test('R1-11 product shell serves release-closure enhancement after the client surface', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11-release-closure-'));
  const product = await startTalosOneAppProduct({ oneApp: { runtimeDir } });
  try {
    const pageResponse = await fetch(product.baseUrl);
    const page = await pageResponse.text();
    assert.equal(pageResponse.status, 200);
    assert.match(page, /\/talos-product-client-surface\.js/);
    assert.match(page, /\/talos-product-release-closure\.js/);
    assert.ok(page.indexOf('/talos-product-client-surface.js') < page.indexOf('/talos-product-release-closure.js'));

    const scriptResponse = await fetch(`${product.baseUrl}/talos-product-release-closure.js`);
    assert.equal(scriptResponse.status, 200);
    assert.equal(await scriptResponse.text(), ONE_APP_PRODUCT_RELEASE_CLOSURE_ENHANCEMENT);
  } finally {
    await product.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
