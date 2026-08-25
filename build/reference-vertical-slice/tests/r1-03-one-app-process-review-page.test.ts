import assert from 'node:assert/strict';
import test from 'node:test';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';

test('R1-03 product page exposes real One-App review and append-only correction controls without authority shortcuts', () => {
  assert.match(ONE_APP_PRODUCT_PAGE, /\/api\/process-review\?revisionId=/);
  assert.match(ONE_APP_PRODUCT_PAGE, /\/api\/bpmn\/edit/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Save correction/);
  assert.match(ONE_APP_PRODUCT_PAGE, /new immutable process revision/i);
  assert.match(ONE_APP_PRODUCT_PAGE, /CORRECTED · RECONFIRMATION REQUIRED/);
  assert.match(ONE_APP_PRODUCT_PAGE, /business-process confirmation remains separate/i);
  assert.doesNotMatch(ONE_APP_PRODUCT_PAGE, /\/api\/bpmn\/confirm/);
  assert.doesNotMatch(ONE_APP_PRODUCT_PAGE, /\/api\/automation\/approve/);
  assert.doesNotMatch(ONE_APP_PRODUCT_PAGE, /\/api\/automation\/execution\/start/);
});
