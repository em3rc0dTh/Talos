import assert from 'node:assert/strict';
import test from 'node:test';
import { startOllamaGeminiPerceptionGateway } from '../apps/reference-api/src/ollama-gemini-perception-gateway.ts';

const envelope = {
  schemaVersion: 'talos-image-perception-request-v0.1',
  sourceRepresentationId: 'src_r1_11_gateway',
  contentSha256: 'a'.repeat(64),
  mediaType: 'image/png',
  coordinateSpace: {
    width: 640,
    height: 480,
    basis: 'PIXEL',
    orientation: 'TOP_LEFT_ORIGIN',
    originConvention: 'TOP_LEFT',
  },
  imageBase64: 'iVBORw0KGgo=',
};

function modelOutput(status: 'SUCCEEDED' | 'PARTIAL' | 'NO_RESULT' = 'SUCCEEDED') {
  if (status === 'NO_RESULT') {
    return { status, anchors: [], observations: [], occurrenceCandidates: [], alternativeSets: [], relationCandidates: [], diagnostics: [] };
  }
  return {
    status,
    anchors: [
      { providerAnchorKey: 'a-task', geometryKind: 'BOX', geometry: { x: 100, y: 100, width: 180, height: 80 }, visibilityState: 'VISIBLE' },
    ],
    observations: [
      { providerObservationKey: 'o-task', anchorKey: 'a-task', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Review request', confidence: 0.93 },
    ],
    occurrenceCandidates: [
      { providerOccurrenceKey: 'task', anchorKeys: ['a-task'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o-task', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o-task'], confidence: 0.91 },
    ],
    alternativeSets: [],
    relationCandidates: [],
    diagnostics: [],
  };
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}

async function postPerception(baseUrl: string) {
  const response = await fetch(`${baseUrl}/perceive`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(envelope),
  });
  const body = await response.json() as any;
  return { response, body };
}

test('R1-11 perception gateway uses local Ollama as primary and preserves exact Talos correlation', async () => {
  let ollamaCalls = 0;
  let geminiCalls = 0;
  const upstreamFetch: typeof fetch = (async (input, init) => {
    const url = String(input);
    if (url.endsWith('/api/tags')) return jsonResponse({ models: [{ name: 'qwen2.5vl:7b' }] });
    if (url.endsWith('/api/chat')) {
      ollamaCalls += 1;
      const request = JSON.parse(String(init?.body)) as any;
      assert.equal(request.model, 'qwen2.5vl:7b');
      assert.equal(request.messages[0].images[0], envelope.imageBase64);
      assert.equal(request.options.temperature, 0);
      assert.equal(request.format.type, 'object');
      return jsonResponse({ message: { content: JSON.stringify(modelOutput()) } });
    }
    if (url.includes('generativelanguage.googleapis.com')) {
      geminiCalls += 1;
      return jsonResponse({});
    }
    return jsonResponse({}, 404);
  }) as typeof fetch;

  const gateway = await startOllamaGeminiPerceptionGateway({
    port: 0,
    env: { OLLAMA_BASE_URL: 'http://ollama.test:11434', OLLAMA_MODEL: 'qwen2.5vl:7b' },
    fetchImpl: upstreamFetch,
  });
  try {
    const health = await fetch(`${gateway.baseUrl}/health`);
    assert.equal(health.status, 200);
    const result = await postPerception(gateway.baseUrl);
    assert.equal(result.response.status, 200);
    assert.equal(result.body.status, 'SUCCEEDED');
    assert.equal(result.body.requestCorrelation.sourceRepresentationId, envelope.sourceRepresentationId);
    assert.equal(result.body.requestCorrelation.contentSha256, envelope.contentSha256);
    assert.equal(result.body.requestCorrelation.coordinateSpace.width, 640);
    assert.equal(result.body.providerId, 'TALOS_OLLAMA_GEMINI_GATEWAY');
    assert.equal(result.body.diagnostics.at(-1).code, 'UPSTREAM_PROVIDER_SELECTED');
    assert.equal(result.body.diagnostics.at(-1).description, 'OLLAMA:qwen2.5vl:7b');
    assert.equal(ollamaCalls, 1);
    assert.equal(geminiCalls, 0);
  } finally {
    await gateway.close();
  }
});

test('R1-11 gateway falls back to Gemini only after Ollama output fails the Talos evidence contract', async () => {
  let ollamaCalls = 0;
  let geminiCalls = 0;
  const upstreamFetch: typeof fetch = (async (input, init) => {
    const url = String(input);
    if (url.endsWith('/api/tags')) return jsonResponse({ models: [{ name: 'qwen2.5vl:7b' }] });
    if (url.endsWith('/api/chat')) {
      ollamaCalls += 1;
      return jsonResponse({ message: { content: JSON.stringify({ ...modelOutput(), observations: [{ providerObservationKey: 'broken', anchorKey: 'missing', observationKind: 'TEXT_LITERAL_CANDIDATE' }] }) } });
    }
    if (url.startsWith('http://gemini.test/')) {
      geminiCalls += 1;
      const request = JSON.parse(String(init?.body)) as any;
      assert.equal(new Headers(init?.headers).get('x-goog-api-key'), 'test-gemini-secret');
      assert.equal(request.contents[0].parts[0].inline_data.data, envelope.imageBase64);
      assert.equal(request.generationConfig.responseMimeType, 'application/json');
      return jsonResponse({ candidates: [{ content: { parts: [{ text: JSON.stringify(modelOutput()) }] } }] });
    }
    return jsonResponse({}, 404);
  }) as typeof fetch;

  const gateway = await startOllamaGeminiPerceptionGateway({
    port: 0,
    env: {
      OLLAMA_BASE_URL: 'http://ollama.test:11434',
      OLLAMA_MODEL: 'qwen2.5vl:7b',
      OLLAMA_MAX_ATTEMPTS: '2',
      GEMINI_API_KEY: 'test-gemini-secret',
      GEMINI_BASE_URL: 'http://gemini.test',
      GEMINI_MODEL: 'gemini-test-vision',
    },
    fetchImpl: upstreamFetch,
  });
  try {
    const result = await postPerception(gateway.baseUrl);
    assert.equal(result.response.status, 200);
    assert.equal(result.body.status, 'SUCCEEDED');
    assert.equal(result.body.diagnostics.at(-1).description, 'GEMINI:gemini-test-vision');
    assert.equal(ollamaCalls, 2, 'invalid primary output is retried before fallback');
    assert.equal(geminiCalls, 1);
    assert.equal(JSON.stringify(result.body).includes('test-gemini-secret'), false);
  } finally {
    await gateway.close();
  }
});

test('R1-11 gateway keeps a valid partial Ollama result if Gemini fallback is unavailable', async () => {
  let geminiCalls = 0;
  const upstreamFetch: typeof fetch = (async (input) => {
    const url = String(input);
    if (url.endsWith('/api/tags')) return jsonResponse({ models: [{ name: 'qwen2.5vl:7b' }] });
    if (url.endsWith('/api/chat')) return jsonResponse({ message: { content: JSON.stringify(modelOutput('PARTIAL')) } });
    if (url.startsWith('http://gemini.test/')) {
      geminiCalls += 1;
      return jsonResponse({ error: 'quota' }, 429);
    }
    return jsonResponse({}, 404);
  }) as typeof fetch;

  const gateway = await startOllamaGeminiPerceptionGateway({
    port: 0,
    env: {
      OLLAMA_BASE_URL: 'http://ollama.test:11434',
      GEMINI_API_KEY: 'configured-but-unavailable',
      GEMINI_BASE_URL: 'http://gemini.test',
    },
    fetchImpl: upstreamFetch,
  });
  try {
    const result = await postPerception(gateway.baseUrl);
    assert.equal(result.response.status, 200);
    assert.equal(result.body.status, 'PARTIAL');
    assert.equal(result.body.diagnostics.at(-1).description, 'OLLAMA:qwen2.5vl:7b');
    assert.equal(geminiCalls, 1);
  } finally {
    await gateway.close();
  }
});

test('R1-11 gateway fails closed when neither Ollama nor Gemini can produce valid evidence', async () => {
  const upstreamFetch: typeof fetch = (async (input) => {
    const url = String(input);
    if (url.endsWith('/api/tags')) return jsonResponse({ models: [{ name: 'qwen2.5vl:7b' }] });
    if (url.endsWith('/api/chat')) return jsonResponse({ error: 'offline' }, 503);
    if (url.startsWith('http://gemini.test/')) return jsonResponse({ error: 'quota' }, 429);
    return jsonResponse({}, 404);
  }) as typeof fetch;

  const gateway = await startOllamaGeminiPerceptionGateway({
    port: 0,
    env: {
      OLLAMA_BASE_URL: 'http://ollama.test:11434',
      OLLAMA_MAX_ATTEMPTS: '1',
      GEMINI_API_KEY: 'configured-but-unavailable',
      GEMINI_BASE_URL: 'http://gemini.test',
    },
    fetchImpl: upstreamFetch,
  });
  try {
    const result = await postPerception(gateway.baseUrl);
    assert.equal(result.response.status, 503);
    assert.equal(result.body.code, 'PERCEPTION_GATEWAY_UNAVAILABLE');
    assert.equal(result.body.automaticConfirmationAuthorized, false);
    assert.equal(result.body.automaticExecutionAuthorized, false);
    assert.equal('anchors' in result.body, false, 'failure must not manufacture hidden perception evidence');
  } finally {
    await gateway.close();
  }
});
