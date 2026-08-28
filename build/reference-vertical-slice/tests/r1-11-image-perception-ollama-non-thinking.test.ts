import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveOllamaImageFallbackRuntime,
} from '../packages/image-perception/src/index.ts';

test('Ollama fallback disables model thinking for structured visual extraction', async () => {
  let observedThink: unknown = 'missing';
  let observedStream: unknown = 'missing';
  let observedFormat: unknown;

  const fakeOllama = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    observedThink = body.think;
    observedStream = body.stream;
    observedFormat = body.format;

    const extraction = {
      completeCoverage: true,
      elements: [
        {
          id: 'a', label: 'Receive request', nodeKind: 'ACTION', occurrenceKind: 'NODE',
          sourcePlaneKind: 'BUSINESS_GRAPH', bbox: [10, 10, 200, 250], confidence: 0.92, visibility: 'VISIBLE',
        },
        {
          id: 'b', label: 'Approve request', nodeKind: 'ACTION', occurrenceKind: 'NODE',
          sourcePlaneKind: 'BUSINESS_GRAPH', bbox: [10, 600, 200, 850], confidence: 0.92, visibility: 'VISIBLE',
        },
      ],
      connectors: [
        {
          id: 'c', sourceElementId: 'a', targetElementId: 'b', direction: 'SOURCE_TO_TARGET',
          role: 'CONTROL_FLOW', guardText: '', bbox: [60, 250, 140, 600], confidence: 0.91,
        },
      ],
      uncertainties: [],
    };

    return new Response(JSON.stringify({
      message: { role: 'assistant', content: JSON.stringify(extraction) },
      done: true,
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;

  const runtime = resolveOllamaImageFallbackRuntime({
    TALOS_OLLAMA_FALLBACK_ENABLED: 'true',
  }, fakeOllama);
  assert.equal(runtime.status, 'CONFIGURED');
  if (runtime.status !== 'CONFIGURED') return;

  const response = await runtime.fetchImpl('http://talos.invalid/vision', {
    method: 'POST',
    body: JSON.stringify({
      schemaVersion: 'talos-image-perception-request-v0.1',
      sourceRepresentationId: 'src_test_representation',
      contentSha256: 'a'.repeat(64),
      coordinateSpace: { width: 640, height: 480 },
      imageBase64: 'dGVzdA==',
    }),
  });

  assert.equal(observedThink, false);
  assert.equal(observedStream, false);
  assert.equal(typeof observedFormat, 'object');
  assert.equal(response.status, 200);

  const provider = await response.json() as any;
  assert.equal(provider.providerId, 'TALOS_OLLAMA_LOCAL_FALLBACK');
  assert.equal(provider.status, 'SUCCEEDED');
  assert.equal(provider.occurrenceCandidates.length, 2);
  assert.equal(provider.relationCandidates.length, 1);
});
