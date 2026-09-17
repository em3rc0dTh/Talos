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

function validModelOutput() {
  return {
    status: 'SUCCEEDED',
    anchors: [{ providerAnchorKey: 'a1', geometryKind: 'BOX', geometry: { x: 10, y: 10, width: 100, height: 40 }, visibilityState: 'VISIBLE' }],
    observations: [{ providerObservationKey: 'o1', anchorKey: 'a1', observationKind: 'TEXT_LITERAL_CANDIDATE', observedValue: 'Review request', confidence: 0.95 }],
    occurrenceCandidates: [{ providerOccurrenceKey: 'n1', anchorKeys: ['a1'], occurrenceKind: 'NODE', literalLabelObservationKey: 'o1', candidateSemanticType: 'ACTION', sourcePlaneKind: 'BUSINESS_GRAPH', supportingObservationKeys: ['o1'], confidence: 0.92 }],
    alternativeSets: [], relationCandidates: [], diagnostics: [],
  };
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}

test('R1-11 Gemini chain advances to the next model, uses the real API path, and preserves Talos correlation', async () => {
  const geminiModels: string[] = [];
  const geminiUrls: string[] = [];
  const upstreamFetch: typeof fetch = (async (input) => {
    const url = String(input);
    if (url.startsWith('http://127.0.0.1:1')) return jsonResponse({ error: 'local-disabled' }, 503);
    const match = url.match(/\/v1beta\/models\/([^:]+):generateContent$/);
    if (match) {
      geminiUrls.push(url);
      const model = decodeURIComponent(match[1]);
      geminiModels.push(model);
      if (model === 'model-one') return jsonResponse({ error: { code: 429, message: 'quota' } }, 429);
      if (model === 'model-two') return jsonResponse({ candidates: [{ content: { parts: [{ text: JSON.stringify(validModelOutput()) }] } }] });
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
    },
    childFetchImpl: upstreamFetch,
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
    assert.equal(response.headers.get('x-talos-gemini-model'), 'model-two');
    assert.equal(response.headers.get('x-talos-gemini-attempt'), '2');
    assert.equal(body.requestCorrelation.sourceRepresentationId, envelope.sourceRepresentationId);
    assert.equal(body.requestCorrelation.contentSha256, envelope.contentSha256);
    assert.equal(body.automaticConfirmationAuthorized, undefined);
    assert.equal(JSON.stringify(body).includes('test-only-secret'), false);
  } finally {
    await gateway.close();
  }
});

test('R1-11 Gemini chain fails closed after exhausting configured models', async () => {
  const upstreamFetch: typeof fetch = (async (input) => {
    const url = String(input);
    if (url.startsWith('http://127.0.0.1:1')) return jsonResponse({ error: 'local-disabled' }, 503);
    if (url.includes(':generateContent')) return jsonResponse({ error: 'unavailable' }, 503);
    return jsonResponse({}, 404);
  }) as typeof fetch;
  const gateway = await startGeminiChainPerceptionGateway({
    port: 0,
    env: { GEMINI_API_KEY: 'test-only-secret', GEMINI_MODEL_CHAIN: 'a,b', GEMINI_BASE_URL: 'http://gemini.test', GEMINI_TIMEOUT_MS: '2000' },
    childFetchImpl: upstreamFetch,
  });
  try {
    const response = await fetch(`${gateway.baseUrl}/perceive`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(envelope),
    });
    const body = await response.json() as any;
    assert.equal(response.status, 503);
    assert.equal(body.code, 'PERCEPTION_GATEWAY_UNAVAILABLE');
    assert.equal(body.automaticConfirmationAuthorized, false);
    assert.equal(body.automaticExecutionAuthorized, false);
    assert.equal('anchors' in body, false);
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
