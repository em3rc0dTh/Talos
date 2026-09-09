import assert from 'node:assert/strict';
import test from 'node:test';
import { startTalosOneAppProduct } from '../apps/reference-api/src/one-app-product-server.ts';

test('R1-11 product shell always serves the mapping-derived Activity runtime-policy guard without process-specific vocabulary', async () => {
  const product = await startTalosOneAppProduct({
    port: 0,
    upstream: {
      baseUrl: 'http://127.0.0.1:1',
    },
    runtimeProfile: {
      actorId: 'actor:field-owner',
      runtimeMode: 'DESIGN_ONLY',
      temporalExecutionAvailable: false,
      secretMaterialExposed: false,
    },
  });

  try {
    const homeResponse = await fetch(`${product.baseUrl}/`);
    assert.equal(homeResponse.status, 200);
    const home = await homeResponse.text();
    assert.match(home, /<script src="\/talos-product-runtime-policy\.js"><\/script>/);

    const guardResponse = await fetch(`${product.baseUrl}/talos-product-runtime-policy.js`);
    assert.equal(guardResponse.status, 200);
    assert.match(guardResponse.headers.get('content-type') ?? '', /application\/javascript/);

    const guard = await guardResponse.text();
    assert.match(guard, /talos-product-runtime-policy-boundary-v0\.1/);
    assert.match(guard, /\/api\/automation\/temporal-mapping/);
    assert.match(guard, /\/api\/automation\/runtime-policy/);
    assert.match(guard, /constructKind===['"]ACTIVITY['"]/);
    assert.match(guard, /R1_RUNTIME_POLICY_ACTIVITY_RESOLUTION_MISSING/);

    assert.doesNotMatch(guard, /Car[- ]?Wash/i);
    assert.doesNotMatch(guard, /Polish Plus/i);
    assert.doesNotMatch(guard, /\bECO\b/);
  } finally {
    await product.close();
  }
});
