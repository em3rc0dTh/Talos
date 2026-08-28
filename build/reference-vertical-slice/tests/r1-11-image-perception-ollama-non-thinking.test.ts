import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveOllamaImageFallbackRuntime,
} from '../packages/image-perception/src/index.ts';

function talosRequest(): RequestInit {
  return {
    method: 'POST',
    body: JSON.stringify({
      schemaVersion: 'talos-image-perception-request-v0.1',
      sourceRepresentationId: 'src_test_representation',
      contentSha256: 'a'.repeat(64),
      coordinateSpace: { width: 640, height: 480 },
      imageBase64: 'dGVzdA==',
    }),
  };
}

test('Ollama fallback uses non-thinking JSON extraction and Talos validates the result', async () => {
  let observedThink: unknown = 'missing';
  let observedStream: unknown = 'missing';
  let observedFormat: unknown;
  let observedModel: unknown;
  let observedNumPredict: unknown;
  let observedPrompt = '';

  const fakeOllama = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, any>;
    observedThink = body.think;
    observedStream = body.stream;
    observedFormat = body.format;
    observedModel = body.model;
    observedNumPredict = body.options?.num_predict;
    observedPrompt = String(body.messages?.[0]?.content ?? '');

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

  assert.equal(runtime.binding.descriptor.modelRef, 'qwen3-vl:4b-instruct');
  assert.equal(runtime.binding.descriptor.pipelineVersion, 'talos-ollama-qwen3vl-fallback-v0.3');

  const response = await runtime.fetchImpl('http://talos.invalid/vision', talosRequest());

  assert.equal(observedThink, false);
  assert.equal(observedStream, false);
  assert.equal(observedFormat, 'json');
  assert.equal(observedModel, 'qwen3-vl:4b-instruct');
  assert.equal(observedNumPredict, 2048);
  assert.match(observedPrompt, /elements MUST NOT be empty/);
  assert.match(observedPrompt, /Use nodeKind=UNKNOWN/);
  assert.equal(response.status, 200);

  const provider = await response.json() as any;
  assert.equal(provider.providerId, 'TALOS_OLLAMA_LOCAL_FALLBACK');
  assert.equal(provider.status, 'SUCCEEDED');
  assert.equal(provider.occurrenceCandidates.length, 2);
  assert.equal(provider.relationCandidates.length, 1);
});

test('Talos rejects malformed local JSON evidence instead of coercing it into perception truth', async () => {
  const malformedOllama = (async () => new Response(JSON.stringify({
    message: {
      role: 'assistant',
      content: JSON.stringify({
        completeCoverage: true,
        elements: [{
          id: 'a',
          label: 'Receive request',
          nodeKind: 'NOT_A_TALOS_NODE_KIND',
          occurrenceKind: 'NODE',
          sourcePlaneKind: 'BUSINESS_GRAPH',
          bbox: [10, 10, 200, 250],
          confidence: 0.92,
          visibility: 'VISIBLE',
        }],
        connectors: [],
        uncertainties: [],
      }),
    },
    done: true,
  }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;

  const runtime = resolveOllamaImageFallbackRuntime({
    TALOS_OLLAMA_FALLBACK_ENABLED: 'true',
  }, malformedOllama);
  assert.equal(runtime.status, 'CONFIGURED');
  if (runtime.status !== 'CONFIGURED') return;

  await assert.rejects(
    () => runtime.fetchImpl('http://talos.invalid/vision', talosRequest()),
    /OLLAMA_IMAGE_FALLBACK_INVALID_NODE_KIND_1/,
  );
});

test('empty local graph remains NO_RESULT and preserves the model visual uncertainty', async () => {
  const emptyOllama = (async () => new Response(JSON.stringify({
    message: {
      role: 'assistant',
      content: JSON.stringify({
        completeCoverage: false,
        elements: [],
        connectors: [],
        uncertainties: [{
          code: 'NO_VISIBLE_PROCESS_STRUCTURE',
          description: 'No process-relevant visual structure could be identified with sufficient visual evidence.',
        }],
      }),
    },
    done: true,
  }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;

  const runtime = resolveOllamaImageFallbackRuntime({
    TALOS_OLLAMA_FALLBACK_ENABLED: 'true',
  }, emptyOllama);
  assert.equal(runtime.status, 'CONFIGURED');
  if (runtime.status !== 'CONFIGURED') return;

  const response = await runtime.fetchImpl('http://talos.invalid/vision', talosRequest());
  assert.equal(response.status, 200);
  const provider = await response.json() as any;
  assert.equal(provider.status, 'NO_RESULT');
  assert.equal(provider.occurrenceCandidates.length, 0);
  assert.ok(provider.diagnostics.some((item: any) => item.code === 'OLLAMA_NO_VISIBLE_PROCESS_STRUCTURE'));
});
