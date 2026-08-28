import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveImagePerceptionFallbackRuntimeBinding,
  resolveImagePerceptionRuntimeBinding,
  resolveOllamaImageFallbackRuntime,
} from '../packages/image-perception/src/index.ts';

function primaryEnv(timeoutMs: string) {
  return {
    TALOS_IMAGE_PERCEPTION_PROVIDER_URL: 'http://primary.invalid/vision',
    TALOS_IMAGE_PERCEPTION_PROVIDER_ID: 'PRIMARY',
    TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION: '1.0.0',
    TALOS_IMAGE_PERCEPTION_MODEL_REF: 'model:primary',
    TALOS_IMAGE_PERCEPTION_MODEL_VERSION: '1',
    TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION: 'timeout-test-v1',
    TALOS_IMAGE_PERCEPTION_TIMEOUT_MS: timeoutMs,
  };
}

function fallbackEnv(timeoutMs: string) {
  return {
    TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_URL: 'http://fallback.invalid/vision',
    TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_ID: 'FALLBACK',
    TALOS_IMAGE_PERCEPTION_FALLBACK_PROVIDER_VERSION: '1.0.0',
    TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_REF: 'model:fallback',
    TALOS_IMAGE_PERCEPTION_FALLBACK_MODEL_VERSION: '1',
    TALOS_IMAGE_PERCEPTION_FALLBACK_PIPELINE_VERSION: 'timeout-test-v1',
    TALOS_IMAGE_PERCEPTION_FALLBACK_TIMEOUT_MS: timeoutMs,
  };
}

test('local Ollama fallback gets a 300 second default budget and permits up to 600 seconds', () => {
  const runtime = resolveOllamaImageFallbackRuntime({ TALOS_OLLAMA_FALLBACK_ENABLED: 'true' }, (async () => {
    throw new Error('not invoked in config test');
  }) as typeof fetch);
  assert.equal(runtime.status, 'CONFIGURED');
  if (runtime.status !== 'CONFIGURED') return;
  assert.equal(runtime.binding.descriptor.timeoutMs, 300_000);

  const max = resolveOllamaImageFallbackRuntime({
    TALOS_OLLAMA_FALLBACK_ENABLED: 'true',
    TALOS_OLLAMA_FALLBACK_TIMEOUT_MS: '600000',
  }, (async () => {
    throw new Error('not invoked in config test');
  }) as typeof fetch);
  assert.equal(max.status, 'CONFIGURED');
  if (max.status === 'CONFIGURED') assert.equal(max.binding.descriptor.timeoutMs, 600_000);

  assert.throws(
    () => resolveOllamaImageFallbackRuntime({
      TALOS_OLLAMA_FALLBACK_ENABLED: 'true',
      TALOS_OLLAMA_FALLBACK_TIMEOUT_MS: '600001',
    }),
    /between 1000 and 600000 milliseconds/,
  );
});

test('generic runtime keeps primary at 120 seconds while allowing fallback up to 600 seconds', () => {
  const fallback = resolveImagePerceptionFallbackRuntimeBinding(fallbackEnv('300000'));
  assert.equal(fallback.status, 'CONFIGURED');
  if (fallback.status === 'CONFIGURED') assert.equal(fallback.binding.descriptor.timeoutMs, 300_000);

  assert.throws(
    () => resolveImagePerceptionRuntimeBinding(primaryEnv('300000')),
    /between 1000 and 120000 milliseconds/,
  );

  const primary = resolveImagePerceptionRuntimeBinding(primaryEnv('120000'));
  assert.equal(primary.status, 'CONFIGURED');
  if (primary.status === 'CONFIGURED') assert.equal(primary.binding.descriptor.timeoutMs, 120_000);

  assert.throws(
    () => resolveImagePerceptionFallbackRuntimeBinding(fallbackEnv('600001')),
    /between 1000 and 600000 milliseconds/,
  );
});
