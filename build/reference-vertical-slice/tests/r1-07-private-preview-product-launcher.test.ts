import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  TALOS_PRIVATE_PREVIEW_ENV,
} from '../apps/reference-api/src/private-preview-config.ts';
import {
  TALOS_PRIVATE_PREVIEW_OPERATOR_ENV,
} from '../apps/reference-api/src/private-preview-operator.ts';
import {
  startTalosPrivatePreviewProduct,
} from '../apps/reference-api/src/private-preview-product.ts';

const TOKEN = 'talos-r1-07-product-secret-0000000001';
const WORKSPACE_ID = 'workspace:r1-07-product';
const ACTOR_ID = 'actor:r1-07-product-owner';

function designOnlyEnv(runtimeDir: string): Record<string, string> {
  return {
    [TALOS_PRIVATE_PREVIEW_ENV.workspaceId]: WORKSPACE_ID,
    [TALOS_PRIVATE_PREVIEW_ENV.actorId]: ACTOR_ID,
    [TALOS_PRIVATE_PREVIEW_ENV.bearerToken]: TOKEN,
    [TALOS_PRIVATE_PREVIEW_ENV.bindHost]: '127.0.0.1',
    [TALOS_PRIVATE_PREVIEW_ENV.allowedHostnames]: '127.0.0.1,localhost',
    [TALOS_PRIVATE_PREVIEW_ENV.allowedOrigins]: 'NONE',
    [TALOS_PRIVATE_PREVIEW_ENV.maxJsonBytes]: String(2 * 1024 * 1024),
    [TALOS_PRIVATE_PREVIEW_ENV.maxImageBytes]: String(1024 * 1024),
    [TALOS_PRIVATE_PREVIEW_ENV.imageMode]: 'DISABLED',
    [TALOS_PRIVATE_PREVIEW_ENV.runtimeMode]: 'DESIGN_ONLY',
    [TALOS_PRIVATE_PREVIEW_OPERATOR_ENV.runtimeDir]: runtimeDir,
  };
}

test('R1-07 outer product shell reaches the secured preview backend without exposing bearer material', async () => {
  const runtimeDir = mkdtempSync(path.join(os.tmpdir(), 'talos-r1-07-product-'));
  const app = await startTalosPrivatePreviewProduct(designOnlyEnv(runtimeDir), {
    authorityPort: 0,
    productPort: 0,
  });
  try {
    const homeResponse = await fetch(`${app.baseUrl}/`);
    assert.equal(homeResponse.status, 200);
    const home = await homeResponse.text();
    assert.match(home, /Source truth → governed execution/);
    assert.match(home, /Confirm business process/);
    assert.equal(home.includes(TOKEN), false);

    const profileResponse = await fetch(`${app.baseUrl}/api/product/runtime-profile`);
    assert.equal(profileResponse.status, 200);
    const profileText = await profileResponse.text();
    const profile = JSON.parse(profileText);
    assert.equal(profile.workspaceId, WORKSPACE_ID);
    assert.equal(profile.actorId, ACTOR_ID);
    assert.equal(profile.runtimeMode, 'DESIGN_ONLY');
    assert.equal(profile.temporalExecutionAvailable, false);
    assert.equal(profile.secretMaterialExposed, false);
    assert.equal(profileText.includes(TOKEN), false);

    const proxiedStatusResponse = await fetch(`${app.baseUrl}/api/status`);
    assert.equal(proxiedStatusResponse.status, 200);
    const proxiedStatusText = await proxiedStatusResponse.text();
    const proxiedStatus = JSON.parse(proxiedStatusText);
    assert.equal(proxiedStatus.status, 'READY');
    assert.equal(proxiedStatus.automaticWorkflowExecutionAuthorized, false);
    assert.equal(proxiedStatusText.includes(TOKEN), false);

    const directUnauthenticated = await fetch(`${app.authorityBaseUrl}/api/status`);
    assert.equal(directUnauthenticated.status, 401, 'the protected authority backend must remain inaccessible without the server-held bearer credential');

    const directAuthenticated = await fetch(`${app.authorityBaseUrl}/api/status`, {
      headers: {
        authorization: `Bearer ${TOKEN}`,
        'x-talos-workspace-id': WORKSPACE_ID,
        'x-talos-actor-id': ACTOR_ID,
      },
    });
    assert.equal(directAuthenticated.status, 200, 'the test proves the backend exists and the outer shell is crossing the same protected boundary');
  } finally {
    await app.close();
    rmSync(runtimeDir, { recursive: true, force: true });
  }
});
