import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';
import { ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-capability-selection-page.ts';

test('R1-11 product capability selection stays closed until every requirement has an explicit executable decision', async () => {
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /Choose execution family/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /SOURCE_DEFINED means unresolved/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /Resolve .*capability requirement/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /button\.disabled=incomplete>0/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /Implementation reference/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /Do not enter credentials or secrets/);
});

test('R1-11 Human/manual capability choice carries explicit Talos human-coordination design instead of a fake external transport', async () => {
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /Talos Human Coordination/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /TALOS_HUMAN_COORDINATION_V1/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /implementationKind/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /selection\.human=humanContract\(grid\)/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /roleRefs:rolesForGrid\(grid\)/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /assignmentCardinality:'EXACTLY_ONE'/);
  assert.match(ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT, /Human work completed/);
});

test('R1-11 local product serves the capability-selection enhancement in DESIGN_ONLY as well as executable mode', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-11-capability-product-'));
  const product = await startTalosOneAppProduct({ oneApp: { runtimeDir } });
  try {
    const pageResponse = await fetch(product.baseUrl);
    const page = await pageResponse.text();
    assert.equal(pageResponse.status, 200);
    assert.match(page, /\/talos-product-capability-selection\.js/);

    const scriptResponse = await fetch(`${product.baseUrl}/talos-product-capability-selection.js`);
    const script = await scriptResponse.text();
    assert.equal(scriptResponse.status, 200);
    assert.equal(script, ONE_APP_PRODUCT_CAPABILITY_SELECTION_ENHANCEMENT);
    assert.match(script, /All capability decisions complete · binding still requires your click/);
  } finally {
    await product.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
