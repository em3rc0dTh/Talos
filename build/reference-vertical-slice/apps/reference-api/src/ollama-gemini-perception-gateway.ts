import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateUntrustedImagePerceptionProviderResult,
  type AsyncHttpImagePerceptionProviderConfig,
  type AsyncImagePerceptionTransportEnvelope,
} from '../../../packages/image-perception/src/async-http-provider.ts';
import { IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION } from '../../../packages/image-perception/src/correlated-http-provider.ts';

const MAX_REQUEST_BYTES = 24 * 1024 * 1024;

const MODEL_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['SUCCEEDED', 'PARTIAL', 'NO_RESULT'] },
    anchors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          providerAnchorKey: { type: 'string' },
          geometryKind: { type: 'string', enum: ['POINT', 'BOX', 'POLYGON', 'POLYLINE', 'MASK', 'WHOLE_IMAGE', 'SOURCE_DEFINED'] },
          geometry: {},
          visibilityState: { type: 'string', enum: ['VISIBLE', 'PARTIALLY_VISIBLE', 'LOW_LEGIBILITY', 'OBSCURED', 'OUT_OF_FRAME_CANDIDATE', 'UNKNOWN'] },
          notes: { type: 'string' },
        },
        required: ['providerAnchorKey', 'geometryKind', 'geometry', 'visibilityState'],
      },
    },
    observations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          providerObservationKey: { type: 'string' },
          anchorKey: { type: 'string' },
          observationKind: { type: 'string', enum: ['TEXT_REGION', 'TEXT_LITERAL_CANDIDATE', 'SHAPE_REGION', 'SHAPE_CLASS_CANDIDATE', 'CONNECTOR_STROKE', 'ARROWHEAD', 'CONNECTOR_ENDPOINT', 'CONTAINER_REGION', 'ICON_REGION', 'COLOR_STYLE', 'LINE_STYLE', 'SPATIAL_ATTACHMENT', 'PLANE_REGION', 'ANNOTATION_REGION', 'EDITOR_UI_REGION', 'CURSOR_PRESENCE', 'SOURCE_DEFINED'] },
          observedValue: {},
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          parentObservationKeys: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string' },
        },
        required: ['providerObservationKey', 'anchorKey', 'observationKind'],
      },
    },
    occurrenceCandidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          providerOccurrenceKey: { type: 'string' },
          anchorKeys: { type: 'array', items: { type: 'string' } },
          occurrenceKind: { type: 'string' },
          literalLabelObservationKey: { type: 'string' },
          candidateSemanticType: { type: 'string' },
          sourcePlaneKind: { type: 'string', enum: ['AUTHORING_CONTEXT', 'COLLABORATOR_OVERLAY', 'NOTATION_ANNOTATION', 'BUSINESS_GRAPH', 'RESPONSIBILITY_COLLABORATION', 'OBJECT_DATA', 'ARCHITECTURE_TOPOLOGY', 'FUNCTIONAL_MODEL', 'ANALYTIC_SIMULATION', 'RUNTIME_EVIDENCE', 'SOURCE_DEFINED', 'UNKNOWN'] },
          supportingObservationKeys: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          notes: { type: 'string' },
        },
        required: ['providerOccurrenceKey', 'anchorKeys', 'occurrenceKind', 'sourcePlaneKind', 'supportingObservationKeys'],
      },
    },
    alternativeSets: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          providerAlternativeSetKey: { type: 'string' },
          subjectObservationKey: { type: 'string' },
          propertyPath: { type: 'string' },
          alternatives: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                providerAlternativeKey: { type: 'string' },
                value: {},
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                anchorKeys: { type: 'array', items: { type: 'string' } },
                supportingObservationKeys: { type: 'array', items: { type: 'string' } },
                interpretationNotes: { type: 'string' },
              },
              required: ['providerAlternativeKey', 'value', 'anchorKeys', 'supportingObservationKeys'],
            },
          },
          exclusivityMode: { type: 'string', enum: ['MUTUALLY_EXCLUSIVE', 'NON_EXCLUSIVE', 'SOURCE_DEFINED'] },
          modelPreferredAlternativeKey: { type: 'string' },
          modelPreferenceConfidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['providerAlternativeSetKey', 'propertyPath', 'alternatives', 'exclusivityMode'],
      },
    },
    relationCandidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          providerRelationKey: { type: 'string' },
          strokeObservationKeys: { type: 'array', items: { type: 'string' } },
          anchorKeys: { type: 'array', items: { type: 'string' } },
          existenceConfidence: { type: 'number', minimum: 0, maximum: 1 },
          sourceEndpointCandidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                occurrenceCandidateKey: { type: 'string' },
                anchorKey: { type: 'string' },
                endpointState: { type: 'string', enum: ['SET_CANDIDATE', 'UNKNOWN', 'OUT_OF_FRAME', 'OCCLUDED', 'UNRESOLVED', 'SOURCE_DEFINED'] },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['endpointState'],
            },
          },
          targetEndpointCandidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                occurrenceCandidateKey: { type: 'string' },
                anchorKey: { type: 'string' },
                endpointState: { type: 'string', enum: ['SET_CANDIDATE', 'UNKNOWN', 'OUT_OF_FRAME', 'OCCLUDED', 'UNRESOLVED', 'SOURCE_DEFINED'] },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['endpointState'],
            },
          },
          directionCandidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                value: { type: 'string', enum: ['SOURCE_TO_TARGET', 'TARGET_TO_SOURCE', 'BIDIRECTIONAL', 'UNKNOWN'] },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['value'],
            },
          },
          roleAlternativeSetKey: { type: 'string' },
          guardTextObservationKeys: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string' },
        },
        required: ['providerRelationKey', 'strokeObservationKeys', 'anchorKeys', 'sourceEndpointCandidates', 'targetEndpointCandidates', 'directionCandidates'],
      },
    },
    diagnostics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['code', 'description'],
      },
    },
  },
  required: ['status', 'anchors', 'observations', 'occurrenceCandidates', 'alternativeSets', 'relationCandidates', 'diagnostics'],
} as const;

const SYSTEM_PROMPT = `You are the visual perception layer of Talos. Analyze only what is visible in the supplied process-diagram image. Do not confirm business truth, do not authorize automation, deployment or execution, and do not invent hidden steps. Return visual evidence and inference candidates only.

Build internally consistent keys: every observation anchorKey must exist; every occurrence anchor/supporting-observation reference must exist; every relation endpoint must reference an existing occurrence/anchor; every relation stroke observation must exist. Use BUSINESS_GRAPH for ordinary process nodes. Prefer TEXT_LITERAL_CANDIDATE for visible labels and CONNECTOR_STROKE for visible connectors. If meaning or direction is uncertain, use PARTIAL and encode uncertainty rather than guessing. If there is no usable process evidence, return NO_RESULT with empty evidence arrays. Coordinates may be pixel-space using the provided image dimensions. Return only JSON matching the supplied schema.`;

type Environment = Readonly<Record<string, string | undefined>>;

type ProviderPayload = ReturnType<typeof validateUntrustedImagePerceptionProviderResult> & {
  requestCorrelation: {
    schemaVersion: typeof IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION;
    sourceRepresentationId: string;
    contentSha256: string;
    coordinateSpace: AsyncImagePerceptionTransportEnvelope['coordinateSpace'];
  };
};

export interface OllamaGeminiGatewayOptions {
  host?: string;
  port?: number;
  env?: Environment;
  fetchImpl?: typeof fetch;
}

function optional(env: Environment, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function intEnv(env: Environment, name: string, fallback: number, min: number, max: number): number {
  const raw = optional(env, name);
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw)) throw new TypeError(`${name} must be an integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new TypeError(`${name} must be between ${min} and ${max}`);
  return value;
}

function baseUrl(raw: string, name: string): string {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new TypeError(`${name} must use http or https`);
  if (url.username || url.password || url.search || url.hash) throw new TypeError(`${name} may not contain credentials, query or fragment`);
  return url.toString().replace(/\/$/, '');
}

function gatewayConfig(env: Environment) {
  const ollamaModel = optional(env, 'OLLAMA_MODEL') ?? 'qwen2.5vl:7b';
  return {
    ollamaBaseUrl: baseUrl(optional(env, 'OLLAMA_BASE_URL') ?? 'http://ollama:11434', 'OLLAMA_BASE_URL'),
    ollamaModel,
    ollamaTimeoutMs: intEnv(env, 'OLLAMA_TIMEOUT_MS', 45_000, 1_000, 600_000),
    ollamaMaxAttempts: intEnv(env, 'OLLAMA_MAX_ATTEMPTS', 2, 1, 3),
    geminiApiKey: optional(env, 'GEMINI_API_KEY'),
    geminiModel: optional(env, 'GEMINI_MODEL') ?? 'gemini-2.5-flash',
    geminiBaseUrl: baseUrl(optional(env, 'GEMINI_BASE_URL') ?? 'https://generativelanguage.googleapis.com', 'GEMINI_BASE_URL'),
    geminiTimeoutMs: intEnv(env, 'GEMINI_TIMEOUT_MS', 18_000, 1_000, 60_000),
    providerId: optional(env, 'TALOS_GATEWAY_PROVIDER_ID') ?? 'TALOS_OLLAMA_GEMINI_GATEWAY',
    providerVersion: optional(env, 'TALOS_GATEWAY_PROVIDER_VERSION') ?? '1.0.0',
    modelRef: optional(env, 'TALOS_GATEWAY_MODEL_REF') ?? 'router:ollama-primary-gemini-fallback',
    modelVersion: optional(env, 'TALOS_GATEWAY_MODEL_VERSION') ?? 'r1-11-v1',
    pipelineVersion: optional(env, 'TALOS_GATEWAY_PIPELINE_VERSION') ?? 'talos-r1-11-local-vision-v0.1',
  };
}

async function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_REQUEST_BYTES) throw new TypeError('PERCEPTION_GATEWAY_REQUEST_TOO_LARGE');
    chunks.push(buffer);
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('PERCEPTION_GATEWAY_EXPECTED_JSON_OBJECT');
  return parsed as Record<string, unknown>;
}

function validateEnvelope(raw: Record<string, unknown>): AsyncImagePerceptionTransportEnvelope {
  if (raw.schemaVersion !== 'talos-image-perception-request-v0.1') throw new TypeError('PERCEPTION_GATEWAY_INVALID_REQUEST_SCHEMA');
  if (raw.mediaType !== 'image/png') throw new TypeError('PERCEPTION_GATEWAY_UNSUPPORTED_MEDIA_TYPE');
  if (typeof raw.sourceRepresentationId !== 'string' || !raw.sourceRepresentationId) throw new TypeError('PERCEPTION_GATEWAY_SOURCE_REPRESENTATION_REQUIRED');
  if (typeof raw.contentSha256 !== 'string' || !raw.contentSha256) throw new TypeError('PERCEPTION_GATEWAY_SOURCE_HASH_REQUIRED');
  if (typeof raw.imageBase64 !== 'string' || !raw.imageBase64) throw new TypeError('PERCEPTION_GATEWAY_IMAGE_REQUIRED');
  if (!raw.coordinateSpace || typeof raw.coordinateSpace !== 'object' || Array.isArray(raw.coordinateSpace)) throw new TypeError('PERCEPTION_GATEWAY_COORDINATE_SPACE_REQUIRED');
  const coordinate = raw.coordinateSpace as Record<string, unknown>;
  for (const key of ['width', 'height']) if (typeof coordinate[key] !== 'number' || !Number.isFinite(coordinate[key])) throw new TypeError(`PERCEPTION_GATEWAY_COORDINATE_${key.toUpperCase()}_INVALID`);
  for (const key of ['basis', 'orientation', 'originConvention']) if (typeof coordinate[key] !== 'string' || !coordinate[key]) throw new TypeError(`PERCEPTION_GATEWAY_COORDINATE_${key.toUpperCase()}_INVALID`);
  return raw as unknown as AsyncImagePerceptionTransportEnvelope;
}

function transportConfig(config: ReturnType<typeof gatewayConfig>): AsyncHttpImagePerceptionProviderConfig {
  return {
    endpoint: 'http://talos-perception-gateway.local/perceive',
    providerId: config.providerId,
    providerVersion: config.providerVersion,
    modelRef: config.modelRef,
    modelVersion: config.modelVersion,
    pipelineVersion: config.pipelineVersion,
    providerClass: 'MODEL_PROVIDER',
    evidenceMode: 'MODEL_INFERENCE',
  };
}

function correlatedPayload(
  envelope: AsyncImagePerceptionTransportEnvelope,
  modelOutput: Record<string, unknown>,
  selectedProvider: 'OLLAMA' | 'GEMINI',
  selectedModel: string,
  config: ReturnType<typeof gatewayConfig>,
): ProviderPayload {
  const diagnostics = Array.isArray(modelOutput.diagnostics) ? [...modelOutput.diagnostics] : [];
  diagnostics.push({
    code: 'UPSTREAM_PROVIDER_SELECTED',
    description: `${selectedProvider}:${selectedModel}`,
  });
  const candidate = {
    providerId: config.providerId,
    providerVersion: config.providerVersion,
    providerClass: 'MODEL_PROVIDER',
    modelRef: config.modelRef,
    modelVersion: config.modelVersion,
    pipelineVersion: config.pipelineVersion,
    evidenceMode: 'MODEL_INFERENCE',
    status: modelOutput.status,
    anchors: modelOutput.anchors,
    observations: modelOutput.observations,
    occurrenceCandidates: modelOutput.occurrenceCandidates,
    alternativeSets: modelOutput.alternativeSets,
    relationCandidates: modelOutput.relationCandidates,
    diagnostics,
  };
  const validated = validateUntrustedImagePerceptionProviderResult(candidate, transportConfig(config));
  return {
    ...validated,
    requestCorrelation: {
      schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
      sourceRepresentationId: envelope.sourceRepresentationId,
      contentSha256: envelope.contentSha256,
      coordinateSpace: { ...envelope.coordinateSpace },
    },
  };
}

function prompt(envelope: AsyncImagePerceptionTransportEnvelope): string {
  return `${SYSTEM_PROMPT}\n\nImage dimensions: ${envelope.coordinateSpace.width} x ${envelope.coordinateSpace.height}. The response format schema is enforced by the Ollama structured-output request; do not restate it.`;
}

async function fetchWithTimeout(fetchImpl: typeof fetch, url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callOllama(
  envelope: AsyncImagePerceptionTransportEnvelope,
  config: ReturnType<typeof gatewayConfig>,
  fetchImpl: typeof fetch,
): Promise<ProviderPayload> {
  const response = await fetchWithTimeout(fetchImpl, `${config.ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: config.ollamaModel,
      messages: [{ role: 'user', content: prompt(envelope), images: [envelope.imageBase64] }],
      stream: false,
      format: MODEL_OUTPUT_SCHEMA,
      options: { temperature: 0 },
    }),
  }, config.ollamaTimeoutMs);
  if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}`);
  const raw = await response.json() as any;
  const content = raw?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new TypeError('OLLAMA_EMPTY_STRUCTURED_RESPONSE');
  const parsed = JSON.parse(content) as Record<string, unknown>;
  return correlatedPayload(envelope, parsed, 'OLLAMA', config.ollamaModel, config);
}

async function callGemini(
  envelope: AsyncImagePerceptionTransportEnvelope,
  config: ReturnType<typeof gatewayConfig>,
  fetchImpl: typeof fetch,
): Promise<ProviderPayload> {
  if (!config.geminiApiKey) throw new Error('GEMINI_FALLBACK_NOT_CONFIGURED');
  const url = `${config.geminiBaseUrl}/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent`;
  const response = await fetchWithTimeout(fetchImpl, url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': config.geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { inline_data: { mime_type: envelope.mediaType, data: envelope.imageBase64 } },
          { text: prompt(envelope) },
        ],
      }],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: MODEL_OUTPUT_SCHEMA,
      },
    }),
  }, config.geminiTimeoutMs);
  if (!response.ok) throw new Error(`GEMINI_HTTP_${response.status}`);
  const raw = await response.json() as any;
  const parts = raw?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((part: any) => part?.text).filter((value: unknown) => typeof value === 'string').join('') : '';
  if (!text.trim()) throw new TypeError('GEMINI_EMPTY_STRUCTURED_RESPONSE');
  const parsed = JSON.parse(text) as Record<string, unknown>;
  return correlatedPayload(envelope, parsed, 'GEMINI', config.geminiModel, config);
}

async function perceive(
  envelope: AsyncImagePerceptionTransportEnvelope,
  config: ReturnType<typeof gatewayConfig>,
  fetchImpl: typeof fetch,
): Promise<ProviderPayload> {
  let lastPrimaryError: unknown;
  let usablePrimary: ProviderPayload | undefined;
  for (let attempt = 1; attempt <= config.ollamaMaxAttempts; attempt += 1) {
    try {
      const result = await callOllama(envelope, config, fetchImpl);
      if (result.status === 'SUCCEEDED') return result;
      usablePrimary = result;
      break;
    } catch (error) {
      lastPrimaryError = error;
      if (attempt < config.ollamaMaxAttempts) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  if (config.geminiApiKey) {
    try {
      const fallback = await callGemini(envelope, config, fetchImpl);
      if (fallback.status !== 'NO_RESULT') return fallback;
      if (!usablePrimary) usablePrimary = fallback;
    } catch (fallbackError) {
      if (usablePrimary) return usablePrimary;
      throw new Error(`PERCEPTION_PRIMARY_AND_FALLBACK_FAILED: primary=${lastPrimaryError instanceof Error ? lastPrimaryError.message : String(lastPrimaryError)}; fallback=${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
    }
  }

  if (usablePrimary) return usablePrimary;
  throw new Error(`PERCEPTION_PRIMARY_FAILED: ${lastPrimaryError instanceof Error ? lastPrimaryError.message : String(lastPrimaryError)}`);
}

async function modelAvailable(config: ReturnType<typeof gatewayConfig>, fetchImpl: typeof fetch): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(fetchImpl, `${config.ollamaBaseUrl}/api/tags`, { method: 'GET' }, 5_000);
    if (!response.ok) return false;
    const body = await response.json() as any;
    return Array.isArray(body?.models) && body.models.some((model: any) => model?.name === config.ollamaModel || model?.model === config.ollamaModel);
  } catch {
    return false;
  }
}

function json(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

export async function startOllamaGeminiPerceptionGateway(options: OllamaGeminiGatewayOptions = {}) {
  const env = options.env ?? process.env;
  const config = gatewayConfig(env);
  const fetchImpl = options.fetchImpl ?? fetch;
  const host = options.host ?? optional(env, 'HOST') ?? '127.0.0.1';
  const port = options.port ?? Number(optional(env, 'PORT') ?? 8790);

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      if (req.method === 'GET' && url.pathname === '/health') {
        const primaryReady = await modelAvailable(config, fetchImpl);
        json(res, primaryReady ? 200 : 503, {
          status: primaryReady ? 'READY' : 'PRIMARY_NOT_READY',
          primary: { provider: 'OLLAMA', model: config.ollamaModel, ready: primaryReady },
          fallback: { provider: 'GEMINI', model: config.geminiModel, configured: Boolean(config.geminiApiKey) },
          policy: 'OLLAMA_PRIMARY_GEMINI_FALLBACK_FAIL_CLOSED',
        });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/perceive') {
        const envelope = validateEnvelope(await readJson(req));
        const result = await perceive(envelope, config, fetchImpl);
        json(res, 200, result);
        return;
      }
      json(res, 404, { error: 'not found', code: 'PERCEPTION_GATEWAY_ROUTE_NOT_FOUND' });
    } catch (error) {
      json(res, 503, {
        error: error instanceof Error ? error.message : String(error),
        code: 'PERCEPTION_GATEWAY_UNAVAILABLE',
        automaticConfirmationAuthorized: false,
        automaticExecutionAuthorized: false,
      });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Talos perception gateway did not bind a TCP address');
  let closed = false;
  return {
    baseUrl: `http://${host}:${address.port}`,
    config: {
      providerId: config.providerId,
      providerVersion: config.providerVersion,
      modelRef: config.modelRef,
      modelVersion: config.modelVersion,
      pipelineVersion: config.pipelineVersion,
      ollamaModel: config.ollamaModel,
      geminiModel: config.geminiModel,
      geminiConfigured: Boolean(config.geminiApiKey),
    },
    async close() {
      if (closed) return;
      closed = true;
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

async function main() {
  const gateway = await startOllamaGeminiPerceptionGateway({ host: process.env.HOST ?? '0.0.0.0' });
  console.log(`\nTalos perception gateway ready: ${gateway.baseUrl}`);
  console.log(`Primary: Ollama ${gateway.config.ollamaModel}`);
  console.log(`Fallback: Gemini ${gateway.config.geminiModel} · configured=${gateway.config.geminiConfigured}\n`);
  const stop = async () => {
    await gateway.close();
  };
  const onSignal = () => stop().then(() => process.exit(0), (error) => {
    console.error(error);
    process.exit(1);
  });
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
