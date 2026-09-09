import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTalosPrivatePreviewRuntimeBinding } from '../apps/reference-api/src/private-preview-config.ts';
import { startTalosOneApp } from '../apps/reference-api/src/one-app-server.ts';

function baseEnv(): Record<string,string> {
  return {
    TALOS_PRIVATE_PREVIEW_WORKSPACE_ID:'workspace-r1-image',
    TALOS_PRIVATE_PREVIEW_ACTOR_ID:'operator-r1-image',
    TALOS_PRIVATE_PREVIEW_BEARER_TOKEN:'0123456789abcdef0123456789abcdef',
    TALOS_PRIVATE_PREVIEW_BIND_HOST:'127.0.0.1',
    TALOS_PRIVATE_PREVIEW_ALLOWED_HOSTNAMES:'127.0.0.1,localhost',
    TALOS_PRIVATE_PREVIEW_ALLOWED_ORIGINS:'NONE',
    TALOS_PRIVATE_PREVIEW_MAX_JSON_BYTES:'65536',
    TALOS_PRIVATE_PREVIEW_MAX_IMAGE_BYTES:'1024',
    TALOS_PRIVATE_PREVIEW_IMAGE_MODE:'REQUIRED',
    TALOS_PRIVATE_PREVIEW_RUNTIME_MODE:'DESIGN_ONLY',
  };
}

test('private-preview image mode REQUIRED accepts GEMINI_API_KEY as the primary perception configuration',()=>{
  const secret='gemini-product-secret-do-not-expose';
  const binding=resolveTalosPrivatePreviewRuntimeBinding({...baseEnv(),GEMINI_API_KEY:secret,TALOS_GEMINI_MODEL:'gemini-test-model'});
  assert.equal(binding.descriptor.imageMode,'REQUIRED');
  assert.equal(binding.descriptor.imageProviderSelection,'GEMINI_API_KEY');
  assert.equal(binding.descriptor.imageProvider?.providerId,'TALOS_GEMINI_PRIMARY');
  assert.equal(binding.descriptor.imageProvider?.authMode,'API_KEY');
  assert.equal(JSON.stringify(binding.descriptor).includes(secret),false);
  const start=binding.createStartConfiguration();
  assert.equal(start.imagePerceptionEnv.GEMINI_API_KEY,secret,'secret is passed only through the internal start configuration');
});

test('private-preview DISABLED image mode rejects a stray Gemini key rather than silently enabling image interpretation',()=>{
  assert.throws(()=>resolveTalosPrivatePreviewRuntimeBinding({...baseEnv(),TALOS_PRIVATE_PREVIEW_IMAGE_MODE:'DISABLED',GEMINI_API_KEY:'configured-but-forbidden'}),/image provider\/fallback variables are present/);
});

test('One-App status selects Gemini from GEMINI_API_KEY and never exposes the key',async()=>{
  const secret='one-app-gemini-secret-do-not-expose';
  const app=await startTalosOneApp({
    imagePerceptionEnv:{GEMINI_API_KEY:secret,TALOS_GEMINI_MODEL:'gemini-test-model'},
    geminiBaseFetchImpl:(async()=>{throw new Error('status check must not invoke Gemini');}) as typeof fetch,
  });
  try {
    const response=await fetch(`${app.baseUrl}/api/status`);
    assert.equal(response.status,200);
    const status=await response.json() as any;
    assert.equal(status.imageInputIntegratedIntoOneApp,true);
    assert.equal(status.image.primarySelection,'GEMINI_API_KEY');
    assert.equal(status.image.provider.providerId,'TALOS_GEMINI_PRIMARY');
    assert.equal(status.image.provider.authMode,'API_KEY');
    assert.equal(status.image.deterministicPrimarySufficiencyGate,true);
    assert.equal(JSON.stringify(status).includes(secret),false);
  } finally {
    await app.close();
  }
});
