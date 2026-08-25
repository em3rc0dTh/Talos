import assert from 'node:assert/strict';
import test from 'node:test';
import { referenceDemoHtmlI4 } from '../apps/reference-api/src/image-i4-ui.ts';

test('R1-01A image stage pills distinguish capability availability from per-upload truth', () => {
  for (const id of ['gateI0', 'gateI1', 'gateI2', 'gateI3', 'gateI4', 'gateI5', 'gateI6']) {
    assert.match(referenceDemoHtmlI4, new RegExp(`id="${id}"`));
  }

  assert.doesNotMatch(referenceDemoHtmlI4, /I1 perception ✅/);
  assert.doesNotMatch(referenceDemoHtmlI4, /I2 common evidence ✅/);
  assert.doesNotMatch(referenceDemoHtmlI4, /I3 review ✅/);
  assert.doesNotMatch(referenceDemoHtmlI4, /I4 Canonical \+ Validation ✅/);

  assert.match(referenceDemoHtmlI4, /providerStatus === 'NO_RESULT'/);
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI1', 'I1 perception', 'NO_RESULT'\)/);
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI2', 'I2 common evidence', providerStatus === 'NO_RESULT' \? 'BLOCKED' : 'NOT_REACHED'\)/);
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI3', 'I3 review', 'NOT_REACHED'\)/);
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI4', 'I4 Canonical \+ Validation', 'NOT_REACHED'\)/);
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI5', 'I5 freeze \/ execution', 'CLOSED'\)/);
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI6', 'I6 image → Temporal', 'CLOSED'\)/);
});

test('R1-01A image stage pills can render actual successful stage evidence', () => {
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI0', 'I0 bytes', bytesPass \? 'PASS' : 'FAIL'\)/);
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI2', 'I2 common evidence', 'PASS'\)/);
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI3', 'I3 review', 'PASS'\)/);
  assert.match(referenceDemoHtmlI4, /setImageGate\('gateI4', 'I4 Canonical \+ Validation', 'PASS'\)/);
});
