import assert from 'node:assert/strict';
import test from 'node:test';
import { startGeminiChainPerceptionGateway } from '../apps/reference-api/src/gemini-chain-perception-gateway.ts';
import { renderR111ProcessingUxPage } from '../apps/reference-api/src/one-app-r1-11-processing-ux-extension.ts';

const envelope = {
  schemaVersion: 'talos-image-perception-request-v0.1',
  sourceRepresentationId: 'src_gemini_chain',
  contentSha256: 'b'.repeat(64),
  mediaType: 'image/png',
  coordinateSpace: { width: 640, height: 480, basis: 'PIXEL', orientation: 'TOP_LEFT_ORIGIN', originConvention: 'TOP_LEFT' },
  imageBase64: 'iVBORw0KGgo=',
};

function compactGraph() {
  return {
    status: 'SUCCEEDED',
    nodes: [
      { id: 'start', label: 'Start', kind: 'EVENT', confidence: 0.98 },
      { id: 'review', label: 'Review request', kind: 'ACTION', confidence: 0.95 },
    ],
    edges: [
      { id: 'flow-1', source: 'start', target: 'review', kind: 'FLOW', confidence: 0.94, directed: true },
    ],
    diagnostics: ['Simple visible process fragment.'],
  };
}

function geminiResponse(graph = compactGraph()) {
  return {
    candidates: [{ content: { parts: [{ text: JSON.stringify(graph) }] } }],
  };
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}

test('R1-11 Gemini chain advances to the next model, uses compact JSON, expands Talos evidence and preserves correlation', async () => {
  const geminiModels: string[] = [];
  const geminiUrls: string[] = [];
  const requestBodies: any[] = [];
  const upstreamFetch: typeof fetch = (async (input, init) => {
    const url = String(input);
    const match = url.match(/\/v1beta\/models\/([^:]+):generateContent$/);
    if (match) {
      geminiUrls.push(url);
      const model = decodeURIComponent(match[1]);
      geminiModels.push(model);
      requestBodies.push(JSON.parse(String(init?.body ?? '{}')));
      if (model === 'model-one') return jsonResponse({ error: { code: 429, message: 'quota' } }, 429);
      if (model === 'model-two') return jsonResponse(geminiResponse());
    }
    return jsonResponse({}, 404);
  }) as typeof fetch;

  const gateway = await startGeminiChainPerceptionGateway({
    port: 0,
    env: {
      GEMINI_API_KEY: 'test-only-secret',
      GEMINI_MODEL_CHAIN: 'model-one,model-two,model-three',
      GEMINI_BASE_URL: 'http://gemini.test',
      GEMINI_TIMEOUT_MS: '2000',
      GEMINI_CHAIN_BUDGET_MS: '10000',
    },
    fetchImpl: upstreamFetch,
  });
  try {
    const response = await fetch(`${gateway.baseUrl}/perceive`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(envelope),
    });
    const body = await response.json() as any;
    assert.equal(response.status, 200);
    assert.deepEqual(geminiModels, ['model-one', 'model-two']);
    assert.deepEqual(geminiUrls, [
      'http://gemini.test/v1beta/models/model-one:generateContent',
      'http://gemini.test/v1beta/models/model-two:generateContent',
    ]);
    assert.equal(geminiUrls.some((url) => url.includes('/v1beta/v1beta/')), false);
    assert.equal(requestBodies.every((request) => request.generationConfig.responseMimeType === 'application/json'), true);
    assert.equal(requestBodies.every((request) => !Object.hasOwn(request.generationConfig, 'responseSchema')), true);
    assert.match(requestBodies[1].contents[0].parts[1].text, /nodes/);
    assert.match(requestBodies[1].contents[0].parts[1].text, /edges/);
    assert.equal(response.headers.get('x-talos-gemini-model'), 'model-two');
    assert.equal(response.headers.get('x-talos-gemini-attempt'), '2');
    assert.equal(body.providerId, 'TALOS_GEMINI_MODEL_CHAIN');
    assert.equal(body.status, 'SUCCEEDED');
    assert.equal(body.anchors[0].providerAnchorKey, 'whole-image');
    assert.equal(body.occurrenceCandidates.length, 2);
    assert.equal(body.occurrenceCandidates[0].candidateSemanticType, 'EVENT');
    assert.equal(body.occurrenceCandidates[1].candidateSemanticType, 'ACTION');
    assert.equal(body.relationCandidates.length, 1);
    assert.equal(body.requestCorrelation.sourceRepresentationId, envelope.sourceRepresentationId);
    assert.equal(body.requestCorrelation.contentSha256, envelope.contentSha256);
    assert.equal(body.diagnostics.some((item: any) => item.code === 'COMPACT_GRAPH_EXPANDED'), true);
    assert.equal(JSON.stringify(body).includes('test-only-secret'), false);
  } finally {
    await gateway.close();
  }
});

test('R1-11 Gemini chain fails closed after exhausting configured models and reports bounded attempt evidence', async () => {
  const upstreamFetch: typeof fetch = (async (input) => {
    if (String(input).includes(':generateContent')) return jsonResponse({ error: { message: 'unavailable' } }, 503);
    return jsonResponse({}, 404);
  }) as typeof fetch;
  const gateway = await startGeminiChainPerceptionGateway({
    port: 0,
    env: {
      GEMINI_API_KEY: 'test-only-secret',
      GEMINI_MODEL_CHAIN: 'a,b',
      GEMINI_BASE_URL: 'http://gemini.test',
      GEMINI_TIMEOUT_MS: '2000',
      GEMINI_CHAIN_BUDGET_MS: '10000',
    },
    fetchImpl: upstreamFetch,
  });
  try {
    const response = await fetch(`${gateway.baseUrl}/perceive`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(envelope),
    });
    const body = await response.json() as any;
    assert.equal(response.status, 503);
    assert.equal(body.code, 'PERCEPTION_GATEWAY_UNAVAILABLE');
    assert.equal(body.error, 'GEMINI_MODEL_CHAIN_EXHAUSTED');
    assert.equal(body.attempts.length, 2);
    assert.equal(body.attempts[0].model, 'a');
    assert.equal(body.attempts[0].status, 503);
    assert.match(body.attempts[0].error, /GEMINI_HTTP_503/);
    assert.equal(body.automaticConfirmationAuthorized, false);
    assert.equal(body.automaticExecutionAuthorized, false);
    assert.equal('anchors' in body, false);
    assert.equal(JSON.stringify(body).includes('test-only-secret'), false);
  } finally {
    await gateway.close();
  }
});

test('R1-11 Gemini compact protocol rejects invented edge endpoints before Talos evidence admission', async () => {
  const badGraph = compactGraph();
  badGraph.edges[0].target = 'missing-node';
  const upstreamFetch: typeof fetch = (async () => jsonResponse(geminiResponse(badGraph))) as typeof fetch;
  const gateway = await startGeminiChainPerceptionGateway({
    port: 0,
    env: {
      GEMINI_API_KEY: 'test-only-secret',
      GEMINI_MODEL_CHAIN: 'one',
      GEMINI_BASE_URL: 'http://gemini.test',
      GEMINI_TIMEOUT_MS: '2000',
      GEMINI_CHAIN_BUDGET_MS: '5000',
    },
    fetchImpl: upstreamFetch,
  });
  try {
    const response = await fetch(`${gateway.baseUrl}/perceive`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(envelope),
    });
    const body = await response.json() as any;
    assert.equal(response.status, 503);
    assert.equal(body.error, 'GEMINI_MODEL_CHAIN_EXHAUSTED');
    assert.match(body.attempts[0].error, /references unknown node/);
    assert.equal(body.automaticConfirmationAuthorized, false);
    assert.equal(body.automaticExecutionAuthorized, false);
  } finally {
    await gateway.close();
  }
});

test('R1-11 One-App processing UX exposes orbit, elapsed time, slow and alternate-route messages without adding authority', () => {
  const base = '<html><head></head><body><button id="inspect">Preserve & understand</button><span id="fileName">image.png</span><div id="sourceStatus"></div></body></html>';
  const page = renderR111ProcessingUxPage(base);
  assert.match(page, /id="talosProcessing"/);
  assert.match(page, /talosOrbitRing/);
  assert.match(page, /Tiempo transcurrido/);
  assert.match(page, /Procesando información/);
  assert.match(page, /La información está tomando un poco más de tiempo en procesarse/);
  assert.match(page, /Si un modelo no responde o no produce evidencia válida, Talos prueba automáticamente la siguiente ruta disponible/);
  assert.match(page, /seconds>=15/);
  assert.match(page, /seconds>=45/);
  assert.match(page, /BPMN_READY_FOR_PROCESS_REVIEW/);
  assert.doesNotMatch(page, /automaticConfirmationAuthorized\s*=\s*true/);
  assert.doesNotMatch(page, /automaticExecutionAuthorized\s*=\s*true/);
});
