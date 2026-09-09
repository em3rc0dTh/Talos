import assert from 'node:assert/strict';
import test from 'node:test';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';

test('R1-03 review/correction controls remain explicit after the product page grows into later authority stages', () => {
  assert.match(ONE_APP_PRODUCT_PAGE, /\/api\/process-review\?revisionId=/);
  assert.match(ONE_APP_PRODUCT_PAGE, /\/api\/bpmn\/edit/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Save correction/);
  assert.match(ONE_APP_PRODUCT_PAGE, /new immutable process revision/i);
  assert.match(ONE_APP_PRODUCT_PAGE, /CORRECTED · RECONFIRMATION REQUIRED/);
  assert.match(ONE_APP_PRODUCT_PAGE, /business-process confirmation remains separate/i);

  // R1-04+ may expose later routes on the same product page, but each boundary must
  // remain a separate user action rather than being smuggled into correction/review.
  assert.match(ONE_APP_PRODUCT_PAGE, /Confirm business process/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Approve Automation Design handoff/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Bind explicit capability selections/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Approve this ExecutionPlan/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Approve one deployment attempt/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Approve this exact workflow start/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Start approved workflow once/);
  assert.match(ONE_APP_PRODUCT_PAGE, /process confirmation ≠ automation approval ≠ deployment approval ≠ execution approval/i);
});
