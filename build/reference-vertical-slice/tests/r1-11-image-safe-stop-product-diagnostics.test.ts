import test from 'node:test';
import assert from 'node:assert/strict';
import { ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-review-resolution-page.ts';

test('R1-11 One-App surfaces image safe-stop routing and sufficiency reasons without weakening authority', () => {
  const script = ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT;
  assert.match(script, /Why Talos stopped/);
  assert.match(script, /perceptionRouting/);
  assert.match(script, /primaryAssessment/);
  assert.match(script, /fallbackAssessment/);
  assert.match(script, /reasonCodes/);
  assert.match(script, /Source preserved; no business truth was created/);
  assert.match(script, /SAFE STOP/);
  assert.match(script, /\/api\/input\/image/);
});

test('R1-11 safe-stop presentation remains diagnostic only and contains no authority shortcut', () => {
  const script = ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT;
  const diagnosticSection = script.slice(script.indexOf('function renderImageSafeStop'), script.indexOf('window.fetch=function'));
  assert.ok(diagnosticSection.length > 0);
  assert.doesNotMatch(diagnosticSection, /confirmProcess\.click|openDesign\.click|approve|createsBinding|deploymentAuthorized|executionAuthorized/i);
  assert.match(diagnosticSection, /no business truth was created/i);
});
