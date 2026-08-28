import test from 'node:test';
import assert from 'node:assert/strict';
import { ONE_APP_PRODUCT_AI_AUTOMATION_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-ai-automation-page.ts';

test('R1-11 One-App makes AI automation design the primary path after the explicit design handoff', () => {
  const script = ONE_APP_PRODUCT_AI_AUTOMATION_ENHANCEMENT;

  assert.match(script, /Open AI Automation Design/);
  assert.match(script, /Gemini designs the proposal from the confirmed process/);
  assert.match(script, /\/api\/bpmn\/automation-design-approval/);
  assert.match(script, /setTimeout\(function\(\)\{generate\(workspaceId\)\},0\)/);
  assert.match(script, /\/api\/automation\/proposal\/generate/);
  assert.match(script, /Gemini is designing the automation proposal from the confirmed process/);
});

test('R1-11 manual capability configuration remains advanced progressive disclosure, not the default design workflow', () => {
  const script = ONE_APP_PRODUCT_AI_AUTOMATION_ENHANCEMENT;

  assert.match(script, /Advanced · manual capability editor/);
  assert.match(script, /requirements\.style\.display='none'/);
  assert.match(script, /selections\.style\.display='none'/);
  assert.match(script, /collapseManualEditor\(\)/);
  assert.match(script, /AI design accepted\. Some proposed implementations are not configured or still need business input/);
});

test('R1-11 partial AI design is shown as governed safe-stop material and cannot be accepted as complete design', () => {
  const script = ONE_APP_PRODUCT_AI_AUTOMATION_ENHANCEMENT;

  assert.match(script, /UNRESOLVED_AFTER_FALLBACK/);
  assert.match(script, /AI needs business\/design input/);
  assert.match(script, /proposal\.status!==\'COMPLETE\'/);
  assert.match(script, /AI DESIGN NEEDS INPUT/);
  assert.match(script, /No capability binding, deployment authority or execution authority is created automatically/);
});
