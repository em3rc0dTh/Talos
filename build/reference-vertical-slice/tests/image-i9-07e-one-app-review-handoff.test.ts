import test from 'node:test';
import assert from 'node:assert/strict';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';
import { renderR111DBusinessFirstPage } from '../apps/reference-api/src/one-app-r1-11d-business-first-extension.ts';

test('R1-11K initial source handoff renders and opens the review candidate',()=>{
  const page=renderR111DBusinessFirstPage(ONE_APP_PRODUCT_PAGE);
  assert.match(page,/if\(sourceInput\)renderProductCandidate\(body\.reconciliation,'READY · NOT CONFIRMED'\)/);
  assert.match(page,/review\.className='review open'/);
  assert.match(page,/renderProductCandidate\(body\.reconciliation,'READY · NOT CONFIRMED'\);setStage\('review'\)/);
  assert.match(page,/id="nodes"/);
  assert.match(page,/id="questions"/);
  assert.match(page,/id="findings"/);
});
