import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IMAGE_PERCEPTION_RUNTIME_ENV,
  resolveImagePerceptionRuntimeBinding,
} from '../packages/image-perception/src/index.ts';

function configuredEnv(token: string): Record<string, string> {
  return {
    [IMAGE_PERCEPTION_RUNTIME_ENV.endpoint]: 'https://vision.example.test/perceive',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerId]: 'I7C_REAL_PROVIDER_GATEWAY',
    [IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion]: '1.0.0',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelRef]: 'vision:model:configured',
    [IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion]: '2026-08-20',
    [IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion]: 'talos-process-diagram-perception-v0.1',
    [IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs]: '5000',
    [IMAGE_PERCEPTION_RUNTIME_ENV.bearerToken]: token,
  };
}

test('I7C-01 bearer-token rotation does not change the public runtime descriptor or configuration fingerprint', () => {
  const first = resolveImagePerceptionRuntimeBinding(configuredEnv('secret-rotation-a'));
  const second = resolveImagePerceptionRuntimeBinding(configuredEnv('secret-rotation-b'));
  assert.equal(first.status, 'CONFIGURED');
  assert.equal(second.status, 'CONFIGURED');
  if (first.status !== 'CONFIGURED' || second.status !== 'CONFIGURED') throw new Error('expected configured bindings');

  assert.deepEqual(first.binding.descriptor, second.binding.descriptor);
  assert.equal(
    first.binding.descriptor.configurationFingerprint,
    second.binding.descriptor.configurationFingerprint,
  );
  assert.equal(JSON.stringify(first.binding).includes('secret-rotation-a'), false);
  assert.equal(JSON.stringify(second.binding).includes('secret-rotation-b'), false);

  const firstTransport = first.binding.createTransportConfig();
  const secondTransport = second.binding.createTransportConfig();
  assert.equal(firstTransport.headers?.authorization, 'Bearer secret-rotation-a');
  assert.equal(secondTransport.headers?.authorization, 'Bearer secret-rotation-b');
  assert.equal(firstTransport.providerId, secondTransport.providerId);
  assert.equal(firstTransport.modelRef, secondTransport.modelRef);
  assert.equal(firstTransport.pipelineVersion, secondTransport.pipelineVersion);
});
