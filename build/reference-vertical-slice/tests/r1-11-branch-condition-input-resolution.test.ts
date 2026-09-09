import test from 'node:test';
import assert from 'node:assert/strict';
import { ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT } from '../apps/reference-api/src/one-app-product-review-resolution-page.ts';

test('R1-11 branch-condition inputs resolve projected image BPMN ids without exposing XML to the user', () => {
  const script = ONE_APP_PRODUCT_REVIEW_RESOLUTION_ENHANCEMENT;

  assert.match(script, /function projectedBpmnNodeId\(node\)/);
  assert.match(script, /return canonicalId\?'Node_'\+canonicalId:''/);
  assert.match(script, /var sourceId=projectedBpmnNodeId\(row\.source\)/);
  assert.match(script, /var targetId=projectedBpmnNodeId\(row\.target\)/);
  assert.match(script, /if\(flows\.length!==1\)return/);
  assert.match(script, /Apply branch conditions/);
  assert.match(script, /Talos will update the BPMN correction internally/);

  assert.doesNotMatch(script, /var sourceId=row\.source&&row\.source\.details&&row\.source\.details\.bpmnElementId/);
  assert.doesNotMatch(script, /var targetId=row\.target&&row\.target\.details&&row\.target\.details\.bpmnElementId/);
});
