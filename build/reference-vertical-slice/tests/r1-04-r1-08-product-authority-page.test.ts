import assert from 'node:assert/strict';
import test from 'node:test';
import { ONE_APP_PRODUCT_PAGE } from '../apps/reference-api/src/one-app-product-page.ts';

test('R1-04 through R1-08 product page exposes the full governed journey as separate user actions', () => {
  const requiredRoutes = [
    '/api/input/image',
    '/api/input/bpmn',
    '/api/process-review?revisionId=',
    '/api/bpmn/edit',
    '/api/bpmn/confirm',
    '/api/bpmn/automation-design-approval',
    '/api/automation/suggestion/decide',
    '/api/automation/capability/select',
    '/api/automation/execution-plan/review',
    '/api/automation/approve',
    '/api/automation/temporal-mapping',
    '/api/automation/runtime-policy',
    '/api/automation/deployment-design',
    '/api/automation/environment-realization',
    '/api/automation/deployment/approve',
    '/api/automation/deployment/attempt',
    '/api/automation/execution/approve',
    '/api/automation/execution/start',
  ];
  for (const route of requiredRoutes) assert.match(ONE_APP_PRODUCT_PAGE, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  const separateActions = [
    'Confirm business process',
    'Approve Automation Design handoff',
    'Bind explicit capability selections',
    'Build ExecutionPlan review',
    'Approve this ExecutionPlan',
    'Create Temporal mapping',
    'Accept visible runtime policy',
    'Design deployment',
    'Verify environment',
    'Approve one deployment attempt',
    'Deploy Worker once',
    'Approve this exact workflow start',
    'Start approved workflow once',
  ];
  for (const label of separateActions) assert.match(ONE_APP_PRODUCT_PAGE, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  assert.match(ONE_APP_PRODUCT_PAGE, /deployment.*still creates no workflow execution authority/i);
  assert.match(ONE_APP_PRODUCT_PAGE, /Changing it will invalidate the start authority/i);
  assert.match(ONE_APP_PRODUCT_PAGE, /Current executable runtime supports non-human flows/i);
  assert.match(ONE_APP_PRODUCT_PAGE, /blocked from execution rather than simulated/i);
  assert.doesNotMatch(ONE_APP_PRODUCT_PAGE, /authorization:\s*`Bearer/i, 'browser page must never embed the preview bearer credential');
  assert.doesNotMatch(ONE_APP_PRODUCT_PAGE, /TALOS_PRIVATE_PREVIEW_BEARER_TOKEN/);
});

test('R1-06 blocked ExecutionPlan exposes explicit subprocess/relation decisions and never invents unknown blocker semantics', () => {
  assert.match(ONE_APP_PRODUCT_PAGE, /Execution-design decisions required/);
  assert.match(ONE_APP_PRODUCT_PAGE, /Rebuild ExecutionPlan with decisions/);
  assert.match(ONE_APP_PRODUCT_PAGE, /subprocessResolutions/);
  assert.match(ONE_APP_PRODUCT_PAGE, /relationResolutions/);
  assert.match(ONE_APP_PRODUCT_PAGE, /INLINE_COORDINATION/);
  assert.match(ONE_APP_PRODUCT_PAGE, /SEPARATE_EXECUTION_BOUNDARY/);
  assert.match(ONE_APP_PRODUCT_PAGE, /WAIT_RESUME/);
  assert.match(ONE_APP_PRODUCT_PAGE, /This blocker has no safe execution-only decision and must be corrected upstream/);
  assert.match(ONE_APP_PRODUCT_PAGE, /No execution-design authority inferred/);
});

test('R1-04 through R1-08 page keeps truth classes distinct from authority classes', () => {
  assert.match(ONE_APP_PRODUCT_PAGE, /SOURCE TRUTH/);
  assert.match(ONE_APP_PRODUCT_PAGE, /INFERRED/);
  assert.match(ONE_APP_PRODUCT_PAGE, /CONFIRMED/);
  assert.match(ONE_APP_PRODUCT_PAGE, /AUTOMATION/);
  assert.match(ONE_APP_PRODUCT_PAGE, /DEPLOYMENT/);
  assert.match(ONE_APP_PRODUCT_PAGE, /EXECUTION/);
  assert.match(ONE_APP_PRODUCT_PAGE, /process confirmation ≠ automation approval ≠ deployment approval ≠ execution approval/i);
  assert.match(ONE_APP_PRODUCT_PAGE, /Nothing below is automatic authority/i);
});
