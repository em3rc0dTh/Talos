import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  IMAGE_PERCEPTION_RUNTIME_ENV,
} from '../packages/image-perception/src/index.ts';
import {
  resolveTalosPrivatePreviewRuntimeBinding,
  TALOS_PRIVATE_PREVIEW_ENV,
} from '../apps/reference-api/src/private-preview-config.ts';
import {
  startTalosPrivatePreviewFromEnv,
} from '../apps/reference-api/src/private-preview-runtime.ts';
import {
  startTalosPrivatePreview,
} from '../apps/reference-api/src/private-preview-server.ts';

const TOKEN = 'talos-r0-02-private-preview-token-0001';
const IMAGE_TOKEN = 'talos-r0-02-image-provider-secret-0001';
const WORKSPACE_ID = 'workspace:r0-02-private-preview';
const ACTOR_ID = 'actor:r0-02-private-preview-owner';

function designOnlyEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    [TALOS_PRIVATE_PREVIEW_ENV.workspaceId]: WORKSPACE_ID,
    [TALOS_PRIVATE_PREVIEW_ENV.actorId]: ACTOR_ID,
    [TALOS_PRIVATE_PREVIEW_ENV.bearerToken]: TOKEN,
    [TALOS_PRIVATE_PREVIEW_ENV.bindHost]: '127.0.0.1',
    [TALOS_PRIVATE_PREVIEW_ENV.allowedHostnames]: '127.0.0.1,localhost',
    [TALOS_PRIVATE_PREVIEW_ENV.allowedOrigins]: 'http://127.0.0.1:3000',
    [TALOS_PRIVATE_PREVIEW_ENV.maxJsonBytes]: String(2 * 1024 * 1024),
    [TALOS_PRIVATE_PREVIEW_ENV.maxImageBytes]: String(1024 * 1024),
    [TALOS_PRIVATE_PREVIEW_ENV.imageMode]: 'DISABLED',
    [TALOS_PRIVATE_PREVIEW_ENV.runtimeMode]: 'DESIGN_ONLY',
    ...overrides,
  };
}

function configuredImageEnv() {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: 'https://vision.example.test/analyze',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'provider:r0-02-test',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'model:r0-02-test',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'pipeline:r0-02-v1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '30000',
    [IMAGE_PERCEPTION_RUNTIME_ENV.bearerToken]: IMAGE_TOKEN,
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerClass]: 'MODEL_PROVIDER',
    [IMAGE_PERCEPTION_RUNTIME_ENV.evidenceMode]: 'MODEL_INFERENCE',
  };
}

function executionEnv(overrides: Record<string, string | undefined> = {}) {
  return designOnlyEnv({
    [TALOS_PRIVATE_PREVIEW_ENV.runtimeMode]: 'TEMPORAL_EXECUTION',
    [TALOS_PRIVATE_PREVIEW_ENV.temporalAddress]: '127.0.0.1:7233',
    [TALOS_PRIVATE_PREVIEW_ENV.temporalNamespace]: 'talos-r0-02',
    [TALOS_PRIVATE_PREVIEW_ENV.temporalTaskQueue]: 'talos-r0-02-preview',
    ...overrides,
  });
}

async function read(response: Response) {
  return await response.json() as any;
}

function rawRequest(baseUrl: string, options: { path: string; host?: string; origin?: string; authorization?: string }) {
  const url = new URL(baseUrl);
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const request = http.request({
      hostname: url.hostname,
      port: Number(url.port),
      path: options.path,
      method: 'GET',
      headers: {
        host: options.host ?? url.host,
        ...(options.origin ? { origin: options.origin } : {}),
        ...(options.authorization ? { authorization: options.authorization } : {}),
        'x-talos-workspace-id': WORKSPACE_ID,
        'x-talos-actor-id': ACTOR_ID,
      },
    }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: response.statusCode ?? 0, body: text ? JSON.parse(text) : undefined });
      });
    });
    request.once('error', reject);
    request.end();
  });
}

test('R0-02 resolves a deterministic secret-safe DESIGN_ONLY preview descriptor', () => {
  const first = resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv());
  const second = resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv());

  assert.equal(first.descriptor.runtimeMode, 'DESIGN_ONLY');
  assert.equal(first.descriptor.imageMode, 'DISABLED');
  assert.equal(first.descriptor.authentication, 'BEARER_TOKEN');
  assert.equal(first.descriptor.accessSecretConfigured, true);
  assert.equal(first.descriptor.accessSecretEnvName, TALOS_PRIVATE_PREVIEW_ENV.bearerToken);
  assert.equal(first.descriptor.configurationFingerprint, second.descriptor.configurationFingerprint);
  assert.deepEqual(first.descriptor.allowedHostnames, ['127.0.0.1', 'localhost']);
  assert.deepEqual(first.descriptor.allowedOrigins, ['http://127.0.0.1:3000']);
  assert.equal(first.descriptor.temporalTarget, undefined);

  const serialized = JSON.stringify(first.descriptor);
  assert.equal(serialized.includes(TOKEN), false);
  assert.equal(serialized.includes(IMAGE_TOKEN), false);

  const start = first.createStartConfiguration();
  assert.equal(start.access.bearerToken, TOKEN);
  assert.deepEqual(start.imagePerceptionEnv, {});
});

test('R0-02 fails closed on missing, weak, conflicting or internally inconsistent preview configuration', () => {
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({ [TALOS_PRIVATE_PREVIEW_ENV.workspaceId]: undefined })),
    /R0_PREVIEW_CONFIG_MISSING/,
  );
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({ [TALOS_PRIVATE_PREVIEW_ENV.bearerToken]: 'short' })),
    /at least 24 characters/,
  );
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({ [TALOS_PRIVATE_PREVIEW_ENV.bindHost]: '0.0.0.0' })),
    /loopback-local/,
  );
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({ [TALOS_PRIVATE_PREVIEW_ENV.allowedHostnames]: '127.0.0.1,example.com' })),
    /hostnames must remain loopback-local/,
  );
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({ [TALOS_PRIVATE_PREVIEW_ENV.allowedOrigins]: 'https://preview.example.test/path' })),
    /exact http\/https origins/,
  );
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({
      [TALOS_PRIVATE_PREVIEW_ENV.temporalAddress]: '127.0.0.1:7233',
    })),
    /Temporal coordinates are forbidden in DESIGN_ONLY mode/,
  );
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({
      [TALOS_PRIVATE_PREVIEW_ENV.maxJsonBytes]: '65536',
      [TALOS_PRIVATE_PREVIEW_ENV.maxImageBytes]: String(1024 * 1024),
    })),
    /JSON limit is too small/,
  );
});

test('R0-02 image mode is explicit and provider secrets remain outside the safe descriptor', () => {
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({
      [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: 'https://vision.example.test/analyze',
    })),
    /image provider variables are present while private-preview image mode is DISABLED/,
  );

  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({
      [TALOS_PRIVATE_PREVIEW_ENV.imageMode]: 'REQUIRED',
    })),
    /image mode REQUIRED needs a complete image-perception provider configuration/,
  );

  const binding = resolveTalosPrivatePreviewRuntimeBinding(designOnlyEnv({
    [TALOS_PRIVATE_PREVIEW_ENV.imageMode]: 'REQUIRED',
    ...configuredImageEnv(),
  }));
  assert.equal(binding.descriptor.imageMode, 'REQUIRED');
  assert.equal(binding.descriptor.imageProvider?.providerId, 'provider:r0-02-test');
  assert.equal(binding.descriptor.imageProvider?.authConfigured, true);
  const serialized = JSON.stringify(binding.descriptor);
  assert.equal(serialized.includes(IMAGE_TOKEN), false);
  assert.equal(serialized.includes(TOKEN), false);
  const start = binding.createStartConfiguration();
  assert.equal(start.imagePerceptionEnv[IMAGE_PERCEPTION_RUNTIME_ENV.bearerToken], IMAGE_TOKEN);
});

test('R0-02 TEMPORAL_EXECUTION requires complete coordinates and explicit runtime adapters', async () => {
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(executionEnv({
      [TALOS_PRIVATE_PREVIEW_ENV.temporalTaskQueue]: undefined,
    })),
    /R0_PREVIEW_CONFIG_MISSING/,
  );
  assert.throws(
    () => resolveTalosPrivatePreviewRuntimeBinding(executionEnv({
      [TALOS_PRIVATE_PREVIEW_ENV.temporalAddress]: 'not-an-address',
    })),
    /Temporal address must use host:port/,
  );

  const binding = resolveTalosPrivatePreviewRuntimeBinding(executionEnv());
  assert.deepEqual(binding.descriptor.temporalTarget, {
    address: '127.0.0.1:7233',
    namespace: 'talos-r0-02',
    taskQueue: 'talos-r0-02-preview',
  });

  await assert.rejects(
    startTalosPrivatePreviewFromEnv(executionEnv(), { port: 0 }),
    /TEMPORAL_EXECUTION mode requires deployment and workflow execution adapters/,
  );

  const dummyAdapters = {
    deploymentAttemptExecutor: async () => {
      throw new Error('test executor must never be invoked during startup');
    },
    workflowExecutionExecutor: async () => {
      throw new Error('test executor must never be invoked during startup');
    },
  };
  await assert.rejects(
    startTalosPrivatePreviewFromEnv(designOnlyEnv(), { port: 0, runtimeAdapters: dummyAdapters }),
    /runtime adapters are forbidden in DESIGN_ONLY mode/,
  );
});

test('R0-02 runtime enforces host/origin scope and does not expose access or provider secrets', async () => {
  const app = await startTalosPrivatePreviewFromEnv(designOnlyEnv(), { port: 0 });
  try {
    assert.equal(app.runtimeDescriptor.runtimeMode, 'DESIGN_ONLY');
    assert.equal(JSON.stringify(app.runtimeDescriptor).includes(TOKEN), false);

    const health = await fetch(`${app.baseUrl}/health`);
    assert.equal(health.status, 200);
    const healthBody = await read(health);
    assert.equal(healthBody.releaseGate, 'R0-02_PREVIEW_CONFIGURATION_SECRET_CONTRACT');
    assert.equal(JSON.stringify(healthBody).includes(TOKEN), false);

    const wrongHost = await rawRequest(app.baseUrl, {
      path: '/health',
      host: 'evil.example.test',
    });
    assert.equal(wrongHost.status, 403);
    assert.equal(wrongHost.body.code, 'R0_HOST_SCOPE_MISMATCH');

    const wrongOrigin = await rawRequest(app.baseUrl, {
      path: '/api/status',
      origin: 'https://evil.example.test',
      authorization: `Bearer ${TOKEN}`,
    });
    assert.equal(wrongOrigin.status, 403);
    assert.equal(wrongOrigin.body.code, 'R0_ORIGIN_SCOPE_MISMATCH');

    const status = await rawRequest(app.baseUrl, {
      path: '/api/status',
      origin: 'http://127.0.0.1:3000',
      authorization: `Bearer ${TOKEN}`,
    });
    assert.equal(status.status, 200);
    assert.equal(status.body.releaseGate, 'R0-02_PREVIEW_CONFIGURATION_SECRET_CONTRACT');
    assert.equal(JSON.stringify(status.body).includes(TOKEN), false);
  } finally {
    await app.close();
  }
});

test('R0-02 request policy rejects JSON and decoded image payloads beyond configured limits', async () => {
  const app = await startTalosPrivatePreview({
    port: 0,
    access: { bearerToken: TOKEN, workspaceId: WORKSPACE_ID, actorId: ACTOR_ID },
    requestPolicy: {
      allowedHostnames: ['127.0.0.1'],
      allowedOrigins: [],
      maxJsonBytes: 256,
      maxImageBytes: 8,
    },
    releaseGate: 'R0-02_PREVIEW_CONFIGURATION_SECRET_CONTRACT',
  });
  const headers = {
    authorization: `Bearer ${TOKEN}`,
    'x-talos-workspace-id': WORKSPACE_ID,
    'x-talos-actor-id': ACTOR_ID,
    'content-type': 'application/json',
  };
  try {
    const tooLargeJson = await fetch(`${app.baseUrl}/api/input/bpmn`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bpmnXml: 'x'.repeat(300) }),
    });
    assert.equal(tooLargeJson.status, 413);
    assert.equal((await read(tooLargeJson)).code, 'R0_REQUEST_TOO_LARGE');

    const tooLargeImage = await fetch(`${app.baseUrl}/api/input/image`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageBase64: Buffer.alloc(9).toString('base64') }),
    });
    assert.equal(tooLargeImage.status, 413);
    assert.equal((await read(tooLargeImage)).code, 'R0_IMAGE_TOO_LARGE');
  } finally {
    await app.close();
  }
});
