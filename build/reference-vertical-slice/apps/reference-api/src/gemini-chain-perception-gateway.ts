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
const DEFAULT_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.6-flash',
] as const;

const PROVIDER = {
  providerId: 'TALOS_GEMINI_MODEL_CHAIN',
  providerVersion: '1.0.0',
  modelRef: 'router:gemini-model-chain',
  modelVersion: 'r1-11-gemini-chain-v1',
  pipelineVersion: 'talos-r1-11-gemini-chain-v0.1',
  providerClass: 'MODEL_PROVIDER' as const,
  evidenceMode: 'MODEL_INFERENCE' as const,
};

const COMPACT_NODE_KINDS = new Set([
  'EVENT', 'ACTION', 'DECISION', 'WAIT', 'HUMAN_INTERACTION', 'SUBPROCESS', 'END',
  'PARTICIPANT', 'DATA_OBJECT', 'UNKNOWN',
]);
const COMPACT_EDGE_KINDS = new Set(['FLOW', 'CONDITIONAL_FLOW', 'MESSAGE', 'ASSOCIATION', 'UNKNOWN']);
const COMPACT_STATUSES = new Set(['SUCCEEDED', 'PARTIAL', 'NO_RESULT']);

type Environment = Readonly<Record<string, string | undefined>>;

type CompactNode = {
  id: string;
  label?: string;
  kind: string;
  confidence: number;
};

type CompactEdge = {
  id: string;
  source: string;
  target: string;
  kind: string;
  label?: string;
  confidence: number;
  directed: boolean;
};

type CompactGraph = {
  status: 'SUCCEEDED' | 'PARTIAL' | 'NO_RESULT';
  nodes: CompactNode[];
  edges: CompactEdge[];
  diagnostics: string[];
};

export interface GeminiChainGatewayOptions {
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
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new TypeError(`${name} must be between ${min} and ${max}`);
  }
  return value;
}

function baseUrl(raw: string): string {
  const value = new URL(raw);
  if (!['http:', 'https:'].includes(value.protocol)) throw new TypeError('GEMINI_BASE_URL must use http or https');
  if (value.username || value.password || value.search || value.hash) {
    throw new TypeError('GEMINI_BASE_URL may not contain credentials, query or fragment');
  }
  return value.toString().replace(/\/$/, '');
}

function parseModelChain(env: Environment): string[] {
  const raw = optional(env, 'GEMINI_MODEL_CHAIN');
  const models = (raw ? raw.split(',') : [...DEFAULT_GEMINI_MODELS])
    .map((value) => value.trim())
    .filter(Boolean);
  const unique = [...new Set(models)];
  if (!unique.length) throw new TypeError('GEMINI_MODEL_CHAIN must contain at least one model');
  if (unique.length > 8) throw new TypeError('GEMINI_MODEL_CHAIN may contain at most 8 models');
  return unique;
}

async function readBody(req: http.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_REQUEST_BYTES) throw new TypeError('GEMINI_CHAIN_REQUEST_TOO_LARGE');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${name} must be an object`);
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be a non-empty string`);
  return value.trim();
}

function confidence(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new TypeError(`${name} must be between 0 and 1`);
  }
  return value;
}

function validateEnvelope(raw: unknown): AsyncImagePerceptionTransportEnvelope {
  const value = record(raw, 'request');
  if (value.schemaVersion !== 'talos-image-perception-request-v0.1') throw new TypeError('GEMINI_CHAIN_INVALID_REQUEST_SCHEMA');
  if (value.mediaType !== 'image/png') throw new TypeError('GEMINI_CHAIN_UNSUPPORTED_MEDIA_TYPE');
  stringValue(value.sourceRepresentationId, 'request.sourceRepresentationId');
  stringValue(value.contentSha256, 'request.contentSha256');
  stringValue(value.imageBase64, 'request.imageBase64');
  const coordinate = record(value.coordinateSpace, 'request.coordinateSpace');
  if (typeof coordinate.width !== 'number' || !Number.isFinite(coordinate.width)) throw new TypeError('request.coordinateSpace.width invalid');
  if (typeof coordinate.height !== 'number' || !Number.isFinite(coordinate.height)) throw new TypeError('request.coordinateSpace.height invalid');
  stringValue(coordinate.basis, 'request.coordinateSpace.basis');
  stringValue(coordinate.orientation, 'request.coordinateSpace.orientation');
  stringValue(coordinate.originConvention, 'request.coordinateSpace.originConvention');
  return value as unknown as AsyncImagePerceptionTransportEnvelope;
}

function validateCompactGraph(raw: unknown): CompactGraph {
  const value = record(raw, 'gemini.compactGraph');
  const status = stringValue(value.status, 'gemini.compactGraph.status');
  if (!COMPACT_STATUSES.has(status)) throw new TypeError(`unsupported compact status ${status}`);
  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges) || !Array.isArray(value.diagnostics)) {
    throw new TypeError('compact graph requires nodes, edges and diagnostics arrays');
  }
  if (value.nodes.length > 200 || value.edges.length > 400) throw new TypeError('compact graph exceeds safety bounds');

  const nodeIds = new Set<string>();
  const nodes = value.nodes.map((rawNode, index) => {
    const node = record(rawNode, `nodes[${index}]`);
    const id = stringValue(node.id, `nodes[${index}].id`);
    if (nodeIds.has(id)) throw new TypeError(`duplicate node id ${id}`);
    nodeIds.add(id);
    const kind = stringValue(node.kind, `nodes[${index}].kind`).toUpperCase();
    if (!COMPACT_NODE_KINDS.has(kind)) throw new TypeError(`unsupported node kind ${kind}`);
    const label = typeof node.label === 'string' && node.label.trim() ? node.label.trim().slice(0, 500) : undefined;
    return { id, ...(label ? { label } : {}), kind, confidence: confidence(node.confidence, `nodes[${index}].confidence`) };
  });

  const edgeIds = new Set<string>();
  const edges = value.edges.map((rawEdge, index) => {
    const edge = record(rawEdge, `edges[${index}]`);
    const id = stringValue(edge.id, `edges[${index}].id`);
    if (edgeIds.has(id)) throw new TypeError(`duplicate edge id ${id}`);
    edgeIds.add(id);
    const source = stringValue(edge.source, `edges[${index}].source`);
    const target = stringValue(edge.target, `edges[${index}].target`);
    if (!nodeIds.has(source) || !nodeIds.has(target)) throw new TypeError(`edge ${id} references unknown node`);
    const kind = stringValue(edge.kind, `edges[${index}].kind`).toUpperCase();
    if (!COMPACT_EDGE_KINDS.has(kind)) throw new TypeError(`unsupported edge kind ${kind}`);
    if (typeof edge.directed !== 'boolean') throw new TypeError(`edges[${index}].directed must be boolean`);
    const label = typeof edge.label === 'string' && edge.label.trim() ? edge.label.trim().slice(0, 500) : undefined;
    return {
      id, source, target, kind,
      ...(label ? { label } : {}),
      confidence: confidence(edge.confidence, `edges[${index}].confidence`),
      directed: edge.directed,
    };
  });

  const diagnostics = value.diagnostics
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .slice(0, 32)
    .map((item) => item.trim().slice(0, 500));

  if (status === 'SUCCEEDED' && !nodes.length) throw new TypeError('SUCCEEDED compact graph must contain nodes');
  return { status: status as CompactGraph['status'], nodes, edges, diagnostics };
}

function providerConfig(): AsyncHttpImagePerceptionProviderConfig {
  return {
    endpoint: 'http://talos-gemini-chain.local/perceive',
    providerId: PROVIDER.providerId,
    providerVersion: PROVIDER.providerVersion,
    modelRef: PROVIDER.modelRef,
    modelVersion: PROVIDER.modelVersion,
    pipelineVersion: PROVIDER.pipelineVersion,
    providerClass: PROVIDER.providerClass,
    evidenceMode: PROVIDER.evidenceMode,
  };
}

function semanticType(kind: string): string | undefined {
  if (['EVENT', 'ACTION', 'DECISION', 'WAIT', 'HUMAN_INTERACTION', 'SUBPROCESS', 'END'].includes(kind)) return kind;
  if (kind === 'PARTICIPANT') return 'ACTOR';
  if (kind === 'DATA_OBJECT') return 'DATA_OBJECT';
  return undefined;
}

function relationRole(kind: string): string {
  switch (kind) {
    case 'FLOW': return 'FLOW_CANDIDATE';
    case 'CONDITIONAL_FLOW': return 'CONDITIONAL_FLOW_CANDIDATE';
    case 'MESSAGE': return 'MESSAGE_INTERACTION_CANDIDATE';
    default: return 'UNKNOWN_RELATIONSHIP_ROLE';
  }
}

function expandCompactGraph(envelope: AsyncImagePerceptionTransportEnvelope, graph: CompactGraph, model: string) {
  const anchorKey = 'whole-image';
  const anchors = [{
    providerAnchorKey: anchorKey,
    geometryKind: 'WHOLE_IMAGE',
    geometry: { x: 0, y: 0, width: envelope.coordinateSpace.width, height: envelope.coordinateSpace.height },
    visibilityState: 'VISIBLE',
    notes: 'Whole-image provenance anchor for compact Gemini perception.',
  }];
  const observations: any[] = [];
  const occurrenceCandidates: any[] = [];

  for (const node of graph.nodes) {
    const shapeKey = `shape:${node.id}`;
    observations.push({
      providerObservationKey: shapeKey,
      anchorKey,
      observationKind: 'SHAPE_CLASS_CANDIDATE',
      observedValue: node.kind,
      confidence: node.confidence,
      notes: 'Compact visual node classification supplied by Gemini.',
    });
    const supportingObservationKeys = [shapeKey];
    let literalLabelObservationKey: string | undefined;
    if (node.label) {
      literalLabelObservationKey = `label:${node.id}`;
      observations.push({
        providerObservationKey: literalLabelObservationKey,
        anchorKey,
        observationKind: 'TEXT_LITERAL_CANDIDATE',
        observedValue: node.label,
        confidence: node.confidence,
      });
      supportingObservationKeys.push(literalLabelObservationKey);
    }
    occurrenceCandidates.push({
      providerOccurrenceKey: `node:${node.id}`,
      anchorKeys: [anchorKey],
      occurrenceKind: node.kind === 'PARTICIPANT' ? 'PARTICIPANT' : node.kind === 'DATA_OBJECT' ? 'OBJECT_NODE' : 'NODE',
      ...(literalLabelObservationKey ? { literalLabelObservationKey } : {}),
      ...(semanticType(node.kind) ? { candidateSemanticType: semanticType(node.kind) } : {}),
      sourcePlaneKind: node.kind === 'PARTICIPANT' ? 'RESPONSIBILITY_COLLABORATION' : node.kind === 'DATA_OBJECT' ? 'OBJECT_DATA' : 'BUSINESS_GRAPH',
      supportingObservationKeys,
      confidence: node.confidence,
    });
  }

  const alternativeSets: any[] = [];
  const relationCandidates: any[] = [];
  for (const edge of graph.edges) {
    const strokeKey = `connector:${edge.id}`;
    const roleSetKey = `role:${edge.id}`;
    const preferredRole = relationRole(edge.kind);
    const preferredKey = `role:${edge.id}:preferred`;
    observations.push({
      providerObservationKey: strokeKey,
      anchorKey,
      observationKind: 'CONNECTOR_STROKE',
      observedValue: { source: edge.source, target: edge.target, kind: edge.kind, directed: edge.directed, ...(edge.label ? { label: edge.label } : {}) },
      confidence: edge.confidence,
    });
    const guardKey = edge.label ? `guard:${edge.id}` : undefined;
    if (guardKey) {
      observations.push({
        providerObservationKey: guardKey,
        anchorKey,
        observationKind: 'TEXT_LITERAL_CANDIDATE',
        observedValue: edge.label,
        confidence: edge.confidence,
        parentObservationKeys: [strokeKey],
        notes: 'Visible branch or guard text associated with this connector.',
      });
    }
    const alternatives = [{
      providerAlternativeKey: preferredKey,
      value: preferredRole,
      confidence: edge.confidence,
      anchorKeys: [anchorKey],
      supportingObservationKeys: [strokeKey],
    }];
    if (preferredRole !== 'UNKNOWN_RELATIONSHIP_ROLE') {
      alternatives.push({
        providerAlternativeKey: `role:${edge.id}:unknown`,
        value: 'UNKNOWN_RELATIONSHIP_ROLE',
        confidence: Math.max(0, 1 - edge.confidence),
        anchorKeys: [anchorKey],
        supportingObservationKeys: [strokeKey],
      });
    }
    alternativeSets.push({
      providerAlternativeSetKey: roleSetKey,
      propertyPath: 'relationshipRole',
      alternatives,
      exclusivityMode: 'MUTUALLY_EXCLUSIVE',
      modelPreferredAlternativeKey: preferredKey,
      modelPreferenceConfidence: edge.confidence,
    });
    relationCandidates.push({
      providerRelationKey: `relation:${edge.id}`,
      strokeObservationKeys: [strokeKey],
      anchorKeys: [anchorKey],
      existenceConfidence: edge.confidence,
      sourceEndpointCandidates: [{
        occurrenceCandidateKey: `node:${edge.source}`,
        anchorKey,
        endpointState: 'SET_CANDIDATE',
        confidence: edge.confidence,
      }],
      targetEndpointCandidates: [{
        occurrenceCandidateKey: `node:${edge.target}`,
        anchorKey,
        endpointState: 'SET_CANDIDATE',
        confidence: edge.confidence,
      }],
      directionCandidates: [{ value: edge.directed ? 'SOURCE_TO_TARGET' : 'UNKNOWN', confidence: edge.confidence }],
      roleAlternativeSetKey: roleSetKey,
      ...(guardKey ? { guardTextObservationKeys: [guardKey] } : {}),
    });
  }

  const candidate = {
    ...PROVIDER,
    status: graph.status,
    anchors,
    observations,
    occurrenceCandidates,
    alternativeSets,
    relationCandidates,
    diagnostics: [
      ...graph.diagnostics.map((description, index) => ({ code: `MODEL_DIAGNOSTIC_${index + 1}`, description })),
      { code: 'UPSTREAM_PROVIDER_SELECTED', description: `GEMINI:${model}` },
      { code: 'COMPACT_GRAPH_EXPANDED', description: 'Gemini compact graph was deterministically expanded into the Talos perception evidence contract.' },
    ],
  };
  const validated = validateUntrustedImagePerceptionProviderResult(candidate, providerConfig());
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

function compactPrompt(envelope: AsyncImagePerceptionTransportEnvelope): string {
  return `You are Talos visual perception. Analyze only visible process-diagram evidence in the supplied PNG. Do not invent hidden steps, business truth, automation approval, deployment authority, or execution authority. Return only JSON.\n\nImage: ${envelope.coordinateSpace.width} x ${envelope.coordinateSpace.height}.\n\nRequired JSON shape:\n{\n  "status": "SUCCEEDED|PARTIAL|NO_RESULT",\n  "nodes": [{"id":"n1","label":"visible text if any","kind":"EVENT|ACTION|DECISION|WAIT|HUMAN_INTERACTION|SUBPROCESS|END|PARTICIPANT|DATA_OBJECT|UNKNOWN","confidence":0.0}],\n  "edges": [{"id":"e1","source":"n1","target":"n2","kind":"FLOW|CONDITIONAL_FLOW|MESSAGE|ASSOCIATION|UNKNOWN","label":"visible branch/guard text if any","confidence":0.0,"directed":true}],\n  "diagnostics": ["brief uncertainty note"]\n}\n\nRules: ids must be unique; edge endpoints must reference node ids; use EVENT for a visible start/intermediate event and END for a visible end event; use PARTIAL whenever meaning or direction is uncertain; use NO_RESULT with empty arrays when there is no usable process graph. Prefer literal visible labels. For connector labels or decision branch guards (for example Yes/No, Sí/No), copy the visible text exactly into edge.label; never invent a missing guard. Keep diagnostics short.`;
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

function errorDetail(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as any;
    const message = parsed?.error?.message ?? parsed?.error ?? parsed?.message;
    if (typeof message === 'string' && message.trim()) return message.trim().slice(0, 300);
  } catch {}
  return raw.trim().slice(0, 300);
}

async function callGemini(
  envelope: AsyncImagePerceptionTransportEnvelope,
  model: string,
  apiKey: string,
  geminiBaseUrl: string,
  timeoutMs: number,
  fetchImpl: typeof fetch,
) {
  const url = `${geminiBaseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetchWithTimeout(fetchImpl, url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { inline_data: { mime_type: envelope.mediaType, data: envelope.imageBase64 } },
          { text: compactPrompt(envelope) },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
      },
    }),
  }, timeoutMs);
  const rawText = await response.text();
  if (!response.ok) throw new Error(`GEMINI_HTTP_${response.status}:${errorDetail(rawText)}`);
  const raw = JSON.parse(rawText) as any;
  const parts = raw?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((part: any) => part?.text).filter((value: unknown) => typeof value === 'string').join('')
    : '';
  if (!text.trim()) throw new TypeError('GEMINI_EMPTY_JSON_RESPONSE');
  const graph = validateCompactGraph(JSON.parse(text));
  return expandCompactGraph(envelope, graph, model);
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

export async function startGeminiChainPerceptionGateway(options: GeminiChainGatewayOptions = {}) {
  const env = options.env ?? process.env;
  const apiKey = optional(env, 'GEMINI_API_KEY');
  const models = parseModelChain(env);
  const host = options.host ?? optional(env, 'HOST') ?? '127.0.0.1';
  const port = options.port ?? Number(optional(env, 'PORT') ?? 8791);
  const geminiBaseUrl = baseUrl(optional(env, 'GEMINI_BASE_URL') ?? 'https://generativelanguage.googleapis.com');
  const perModelTimeoutMs = intEnv(env, 'GEMINI_TIMEOUT_MS', 25_000, 1_000, 60_000);
  const chainBudgetMs = intEnv(env, 'GEMINI_CHAIN_BUDGET_MS', 110_000, 5_000, 115_000);
  const fetchImpl = options.fetchImpl ?? fetch;

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      if (req.method === 'GET' && url.pathname === '/health') {
        json(res, apiKey ? 200 : 503, {
          status: apiKey ? 'READY' : 'GEMINI_KEY_NOT_CONFIGURED',
          provider: 'GEMINI_MODEL_CHAIN',
          models,
          configured: Boolean(apiKey),
          perModelTimeoutMs,
          chainBudgetMs,
          protocol: 'COMPACT_VISUAL_GRAPH_TO_TALOS_EVIDENCE',
          policy: 'ORDERED_MODEL_FAILOVER_FAIL_CLOSED',
        });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/perceive') {
        if (!apiKey) {
          json(res, 503, {
            error: 'GEMINI_CHAIN_NOT_CONFIGURED',
            code: 'PERCEPTION_GATEWAY_UNAVAILABLE',
            automaticConfirmationAuthorized: false,
            automaticExecutionAuthorized: false,
          });
          return;
        }
        const envelope = validateEnvelope(JSON.parse((await readBody(req)).toString('utf8')));
        const chainStartedAt = Date.now();
        const failures: Array<{ model: string; status: number; durationMs: number; error: string }> = [];

        for (let index = 0; index < models.length; index += 1) {
          const elapsed = Date.now() - chainStartedAt;
          const remaining = chainBudgetMs - elapsed;
          if (remaining < 1_000) break;
          const model = models[index];
          const attemptTimeoutMs = Math.min(perModelTimeoutMs, remaining);
          const startedAt = Date.now();
          console.log(`[gemini-chain] attempt=${index + 1}/${models.length} model=${model} start timeoutMs=${attemptTimeoutMs}`);
          try {
            const result = await callGemini(envelope, model, apiKey, geminiBaseUrl, attemptTimeoutMs, fetchImpl);
            const durationMs = Date.now() - startedAt;
            console.log(`[gemini-chain] attempt=${index + 1} model=${model} success durationMs=${durationMs} status=${result.status}`);
            const body = JSON.stringify(result, null, 2);
            res.writeHead(200, {
              'content-type': 'application/json; charset=utf-8',
              'content-length': Buffer.byteLength(body),
              'cache-control': 'no-store',
              'x-talos-gemini-model': model,
              'x-talos-gemini-attempt': String(index + 1),
              'x-talos-gemini-duration-ms': String(durationMs),
            });
            res.end(body);
            return;
          } catch (error) {
            const durationMs = Date.now() - startedAt;
            const detail = error instanceof Error ? error.message : String(error);
            const status = /^GEMINI_HTTP_(\d+)/.test(detail) ? Number(detail.match(/^GEMINI_HTTP_(\d+)/)?.[1] ?? 503) : 503;
            failures.push({ model, status, durationMs, error: detail.slice(0, 500) });
            console.warn(`[gemini-chain] attempt=${index + 1} model=${model} failed durationMs=${durationMs} error=${detail.slice(0, 500)}`);
          }
        }

        console.warn(`[gemini-chain] exhausted attempts=${failures.length} totalDurationMs=${Date.now() - chainStartedAt}`);
        json(res, 503, {
          error: 'GEMINI_MODEL_CHAIN_EXHAUSTED',
          code: 'PERCEPTION_GATEWAY_UNAVAILABLE',
          attempts: failures,
          automaticConfirmationAuthorized: false,
          automaticExecutionAuthorized: false,
        });
        return;
      }
      json(res, 404, { error: 'not found', code: 'GEMINI_CHAIN_ROUTE_NOT_FOUND' });
    } catch (error) {
      console.warn(`[gemini-chain] request failed error=${error instanceof Error ? error.message : String(error)}`);
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
  if (!address || typeof address === 'string') throw new Error('Gemini chain gateway did not bind a TCP address');
  let closed = false;
  return {
    baseUrl: `http://${host}:${address.port}`,
    models: [...models],
    configured: Boolean(apiKey),
    async close() {
      if (closed) return;
      closed = true;
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

async function main() {
  const gateway = await startGeminiChainPerceptionGateway({ host: process.env.HOST ?? '0.0.0.0' });
  console.log(`\nTalos Gemini model-chain gateway ready: ${gateway.baseUrl}`);
  console.log(`Models: ${gateway.models.join(' -> ')}`);
  console.log(`Configured: ${gateway.configured}`);
  console.log('Protocol: compact visual graph -> deterministic Talos evidence\n');
  const stop = () => gateway.close().then(() => process.exit(0), (error) => {
    console.error(error);
    process.exit(1);
  });
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
