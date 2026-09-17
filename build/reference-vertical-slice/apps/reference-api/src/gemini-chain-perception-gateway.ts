import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { validateUntrustedImagePerceptionProviderResponse } from '../../../packages/image-perception/src/index.ts';

type Env = Record<string, string | undefined>;
type FetchLike = typeof fetch;

type PerceptionEnvelope = {
  schemaVersion: string;
  sourceRepresentationId: string;
  contentSha256: string;
  mediaType: string;
  coordinateSpace: {
    width: number;
    height: number;
    basis: string;
    orientation: string;
    originConvention: string;
  };
  imageBase64: string;
};

type GraphNode = {
  id: string;
  label: string;
  semanticType: 'EVENT' | 'ACTION' | 'END' | 'GATEWAY';
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
};

type CompactGraph = {
  status: 'SUCCEEDED' | 'PARTIAL' | 'NO_RESULT';
  nodes: GraphNode[];
  edges: GraphEdge[];
  diagnostics: Array<{ code: string; description: string }>;
};

const DEFAULT_GEMINI_MODEL_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
] as const;

const COMPACT_GRAPH_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['SUCCEEDED', 'PARTIAL', 'NO_RESULT'] },
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          semanticType: { type: 'string', enum: ['EVENT', 'ACTION', 'END', 'GATEWAY'] },
          x: { type: 'number' },
          y: { type: 'number' },
          width: { type: 'number' },
          height: { type: 'number' },
          confidence: { type: 'number' },
        },
        required: ['id', 'label', 'semanticType', 'x', 'y', 'width', 'height', 'confidence'],
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          source: { type: 'string' },
          target: { type: 'string' },
          label: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['id', 'source', 'target', 'label', 'confidence'],
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
  required: ['status', 'nodes', 'edges', 'diagnostics'],
} as const;

const SYSTEM_PROMPT = [
  'You are a visual evidence extractor for Talos.',
  'Inspect only what is visibly supported by the supplied process image.',
  'Return a compact directed process graph. Do not invent business rules, actors, integrations, approvals, or execution authority.',
  'Use EVENT for visible starts/intermediate events, ACTION for visible tasks/activities, END for visible end events, and GATEWAY only for visible decision/merge gateways.',
  'Use the visible literal label for each node. If a node has no readable label, use a short neutral visual label such as Unlabeled event.',
  'Coordinates must use the supplied image pixel coordinate space with top-left origin.',
  'Edges must reference node ids from the same response. Preserve visible direction only; omit an edge if its direction cannot be supported.',
  'Confidence is evidence confidence from 0 to 1, not truth or approval.',
  'If some visible process structure is readable but incomplete, return PARTIAL. If no defensible process graph can be extracted, return NO_RESULT.',
].join(' ');

function asInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function modelChain(env: Env): string[] {
  const raw = env.GEMINI_MODEL_CHAIN?.trim() || env.GEMINI_MODEL?.trim();
  const values = (raw ? raw.split(',') : [...DEFAULT_GEMINI_MODEL_CHAIN])
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(values)];
}

function config(env: Env) {
  return {
    apiKey: env.GEMINI_API_KEY?.trim() ?? '',
    baseUrl: (env.GEMINI_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com').replace(/\/$/, ''),
    models: modelChain(env),
    timeoutMs: asInt(env.GEMINI_TIMEOUT_MS, 30_000, 3_000, 90_000),
    providerId: env.TALOS_GATEWAY_PROVIDER_ID?.trim() || 'TALOS_GEMINI_MODEL_CHAIN',
    providerVersion: env.TALOS_GATEWAY_PROVIDER_VERSION?.trim() || '1.0.0',
    modelRef: env.TALOS_GATEWAY_MODEL_REF?.trim() || 'router:gemini-model-chain',
    modelVersion: env.TALOS_GATEWAY_MODEL_VERSION?.trim() || 'r1-11-gemini-chain-v1',
    pipelineVersion: env.TALOS_GATEWAY_PIPELINE_VERSION?.trim() || 'talos-r1-11-gemini-vision-v0.1',
  };
}

function safeId(value: string, fallback: string): string {
  const normalized = value.trim().replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
  return normalized || fallback;
}

function confidence(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  return Math.max(0, Math.min(1, number));
}

function finite(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeGraph(value: unknown, envelope: PerceptionEnvelope): CompactGraph {
  if (!value || typeof value !== 'object') throw new Error('GEMINI_GRAPH_NOT_OBJECT');
  const raw = value as Record<string, unknown>;
  if (!['SUCCEEDED', 'PARTIAL', 'NO_RESULT'].includes(String(raw.status))) throw new Error('GEMINI_GRAPH_STATUS_INVALID');
  const status = String(raw.status) as CompactGraph['status'];
  const nodeValues = Array.isArray(raw.nodes) ? raw.nodes : [];
  const edgeValues = Array.isArray(raw.edges) ? raw.edges : [];
  const diagnostics = Array.isArray(raw.diagnostics)
    ? raw.diagnostics.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const row = item as Record<string, unknown>;
        return [{ code: String(row.code ?? 'MODEL_DIAGNOSTIC'), description: String(row.description ?? '') }];
      })
    : [];

  const seen = new Set<string>();
  const nodes: GraphNode[] = nodeValues.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const id = safeId(String(row.id ?? ''), `node-${index + 1}`);
    if (seen.has(id)) return [];
    const semanticType = String(row.semanticType ?? 'ACTION');
    if (!['EVENT', 'ACTION', 'END', 'GATEWAY'].includes(semanticType)) return [];
    seen.add(id);
    const width = Math.max(1, Math.min(envelope.coordinateSpace.width, finite(row.width, 1)));
    const height = Math.max(1, Math.min(envelope.coordinateSpace.height, finite(row.height, 1)));
    const x = Math.max(0, Math.min(envelope.coordinateSpace.width - 1, finite(row.x, 0)));
    const y = Math.max(0, Math.min(envelope.coordinateSpace.height - 1, finite(row.y, 0)));
    return [{
      id,
      label: String(row.label ?? id).trim().slice(0, 240) || id,
      semanticType: semanticType as GraphNode['semanticType'],
      x,
      y,
      width: Math.min(width, Math.max(1, envelope.coordinateSpace.width - x)),
      height: Math.min(height, Math.max(1, envelope.coordinateSpace.height - y)),
      confidence: confidence(row.confidence),
    }];
  });

  const ids = new Set(nodes.map((node) => node.id));
  const edges: GraphEdge[] = edgeValues.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const source = safeId(String(row.source ?? ''), '');
    const target = safeId(String(row.target ?? ''), '');
    if (!source || !target || source === target || !ids.has(source) || !ids.has(target)) return [];
    return [{
      id: safeId(String(row.id ?? ''), `edge-${index + 1}`),
      source,
      target,
      label: String(row.label ?? '').trim().slice(0, 240),
      confidence: confidence(row.confidence),
    }];
  });

  if (status === 'NO_RESULT') return { status, nodes: [], edges: [], diagnostics };
  if (nodes.length === 0) throw new Error('GEMINI_GRAPH_HAS_NO_VALID_NODES');
  return { status: edges.length < edgeValues.length ? 'PARTIAL' : status, nodes, edges, diagnostics };
}

function midpoint(node: GraphNode) {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

function expandGraph(graph: CompactGraph, envelope: PerceptionEnvelope, selectedModel: string, cfg: ReturnType<typeof config>) {
  const anchors: any[] = [];
  const observations: any[] = [];
  const occurrenceCandidates: any[] = [];
  const alternativeSets: any[] = [];
  const relationCandidates: any[] = [];
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));

  for (const node of graph.nodes) {
    const anchorKey = `a-${node.id}`;
    const observationKey = `o-${node.id}`;
    anchors.push({
      providerAnchorKey: anchorKey,
      geometryKind: 'BOX',
      geometry: { x: node.x, y: node.y, width: node.width, height: node.height },
      visibilityState: 'VISIBLE',
    });
    observations.push({
      providerObservationKey: observationKey,
      anchorKey,
      observationKind: 'TEXT_LITERAL_CANDIDATE',
      observedValue: node.label,
      confidence: node.confidence,
    });
    occurrenceCandidates.push({
      providerOccurrenceKey: node.id,
      anchorKeys: [anchorKey],
      occurrenceKind: 'NODE',
      literalLabelObservationKey: observationKey,
      candidateSemanticType: node.semanticType,
      sourcePlaneKind: 'BUSINESS_GRAPH',
      supportingObservationKeys: [observationKey],
      confidence: node.confidence,
    });
  }

  graph.edges.forEach((edge, index) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return;
    const edgeId = safeId(edge.id, `edge-${index + 1}`);
    const anchorKey = `a-${edgeId}`;
    const observationKey = `o-${edgeId}`;
    const alternativeSetKey = `role-${edgeId}`;
    anchors.push({
      providerAnchorKey: anchorKey,
      geometryKind: 'POLYLINE',
      geometry: [midpoint(source), midpoint(target)],
      visibilityState: 'VISIBLE',
    });
    observations.push({
      providerObservationKey: observationKey,
      anchorKey,
      observationKind: 'CONNECTOR_STROKE',
      ...(edge.label ? { observedValue: edge.label } : {}),
      confidence: edge.confidence,
    });
    alternativeSets.push({
      providerAlternativeSetKey: alternativeSetKey,
      propertyPath: 'relationshipRole',
      alternatives: [{
        providerAlternativeKey: `control-${edgeId}`,
        value: 'CONTROL_FLOW',
        confidence: edge.confidence,
        anchorKeys: [anchorKey],
        supportingObservationKeys: [observationKey],
      }],
      exclusivityMode: 'MUTUALLY_EXCLUSIVE',
      modelPreferredAlternativeKey: `control-${edgeId}`,
      modelPreferenceConfidence: edge.confidence,
    });
    relationCandidates.push({
      providerRelationKey: edgeId,
      strokeObservationKeys: [observationKey],
      anchorKeys: [anchorKey],
      existenceConfidence: edge.confidence,
      sourceEndpointCandidates: [{
        occurrenceCandidateKey: edge.source,
        anchorKey: `a-${edge.source}`,
        endpointState: 'SET_CANDIDATE',
        confidence: edge.confidence,
      }],
      targetEndpointCandidates: [{
        occurrenceCandidateKey: edge.target,
        anchorKey: `a-${edge.target}`,
        endpointState: 'SET_CANDIDATE',
        confidence: edge.confidence,
      }],
      directionCandidates: [{ value: 'SOURCE_TO_TARGET', confidence: edge.confidence }],
      roleAlternativeSetKey: alternativeSetKey,
    });
  });

  const payload = {
    providerId: cfg.providerId,
    providerVersion: cfg.providerVersion,
    providerClass: 'MODEL_PROVIDER',
    modelRef: cfg.modelRef,
    modelVersion: cfg.modelVersion,
    pipelineVersion: cfg.pipelineVersion,
    evidenceMode: 'MODEL_INFERENCE',
    status: graph.status,
    requestCorrelation: {
      schemaVersion: 'talos-image-perception-response-correlation-v0.1',
      sourceRepresentationId: envelope.sourceRepresentationId,
      contentSha256: envelope.contentSha256,
      coordinateSpace: { ...envelope.coordinateSpace },
    },
    anchors,
    observations,
    occurrenceCandidates,
    alternativeSets,
    relationCandidates,
    diagnostics: [
      ...graph.diagnostics,
      { code: 'UPSTREAM_PROVIDER_SELECTED', description: `GEMINI:${selectedModel}` },
      { code: 'MODEL_OUTPUT_SCOPE', description: 'Model output is visual perception evidence only; it is not business confirmation or execution authority.' },
    ],
  };
  return validateUntrustedImagePerceptionProviderResponse(payload, envelope);
}

async function fetchWithTimeout(fetchImpl: FetchLike, url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function generationConfig(model: string) {
  if (model.startsWith('gemini-2.')) {
    return { responseMimeType: 'application/json', responseSchema: COMPACT_GRAPH_SCHEMA };
  }
  return { responseFormat: { text: { mimeType: 'application/json', schema: COMPACT_GRAPH_SCHEMA } } };
}

async function callGeminiModel(fetchImpl: FetchLike, envelope: PerceptionEnvelope, model: string, cfg: ReturnType<typeof config>) {
  const url = `${cfg.baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetchWithTimeout(fetchImpl, url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.apiKey },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { inline_data: { mime_type: envelope.mediaType, data: envelope.imageBase64 } },
          { text: `${SYSTEM_PROMPT} Image dimensions: ${envelope.coordinateSpace.width}x${envelope.coordinateSpace.height} pixels.` },
        ],
      }],
      generationConfig: generationConfig(model),
    }),
  }, cfg.timeoutMs);
  if (!response.ok) throw new Error(`GEMINI_HTTP_${response.status}`);
  const body = await response.json() as any;
  const text = body?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? '').join('').trim();
  if (!text) throw new Error('GEMINI_EMPTY_RESPONSE');
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('GEMINI_INVALID_JSON'); }
  const graph = normalizeGraph(parsed, envelope);
  return expandGraph(graph, envelope, model, cfg);
}

function validEnvelope(value: unknown): value is PerceptionEnvelope {
  if (!value || typeof value !== 'object') return false;
  const row = value as any;
  return typeof row.sourceRepresentationId === 'string'
    && typeof row.contentSha256 === 'string'
    && typeof row.mediaType === 'string'
    && typeof row.imageBase64 === 'string'
    && row.coordinateSpace && Number.isFinite(Number(row.coordinateSpace.width)) && Number.isFinite(Number(row.coordinateSpace.height));
}

async function readBody(req: any): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function perceive(fetchImpl: FetchLike, envelope: PerceptionEnvelope, cfg: ReturnType<typeof config>) {
  if (!cfg.apiKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  const failures: Array<{ model: string; error: string }> = [];
  let partial: any | undefined;
  for (const model of cfg.models) {
    try {
      const result = await callGeminiModel(fetchImpl, envelope, model, cfg);
      if (result.status === 'SUCCEEDED') return result;
      if (result.status === 'PARTIAL') partial = result;
      if (result.status !== 'NO_RESULT') return result;
      failures.push({ model, error: 'NO_RESULT' });
    } catch (error) {
      failures.push({ model, error: error instanceof Error ? error.message : String(error) });
    }
  }
  if (partial) return partial;
  const summary = failures.map((item) => `${item.model}:${item.error}`).join(' | ');
  throw new Error(`GEMINI_MODEL_CHAIN_EXHAUSTED ${summary}`);
}

export async function startGeminiChainPerceptionGateway(options: {
  host?: string;
  port?: number;
  env?: Env;
  fetchImpl?: FetchLike;
} = {}) {
  const env = options.env ?? process.env;
  const cfg = config(env);
  const fetchImpl = options.fetchImpl ?? fetch;
  const host = options.host ?? env.HOST ?? '0.0.0.0';
  const port = options.port ?? asInt(env.PORT, 8790, 0, 65535);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://talos.local');
    res.setHeader('content-type', 'application/json; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/health') {
      const ready = Boolean(cfg.apiKey && cfg.models.length);
      res.statusCode = ready ? 200 : 503;
      res.end(JSON.stringify({
        status: ready ? 'READY' : 'NOT_CONFIGURED',
        provider: 'GEMINI_MODEL_CHAIN',
        configured: Boolean(cfg.apiKey),
        models: cfg.models,
        timeoutMsPerModel: cfg.timeoutMs,
        policy: 'GEMINI_MULTI_MODEL_FALLBACK_FAIL_CLOSED',
      }, null, 2));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/perceive') {
      try {
        const body = await readBody(req);
        if (!validEnvelope(body)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ code: 'INVALID_PERCEPTION_ENVELOPE' }));
          return;
        }
        const result = await perceive(fetchImpl, body, cfg);
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (error) {
        res.statusCode = 503;
        res.end(JSON.stringify({
          code: 'PERCEPTION_GATEWAY_UNAVAILABLE',
          description: error instanceof Error ? error.message : String(error),
          automaticConfirmationAuthorized: false,
          automaticExecutionAuthorized: false,
        }));
      }
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ code: 'NOT_FOUND' }));
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('GEMINI_GATEWAY_BIND_FAILED');
  return {
    baseUrl: `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${address.port}`,
    config: { ...cfg, apiKey: cfg.apiKey ? '[configured]' : '' },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const gateway = await startGeminiChainPerceptionGateway();
  console.log(`Talos Gemini perception gateway ready: ${gateway.baseUrl}`);
  console.log(`Gemini chain: ${gateway.config.models.join(' -> ')}`);
  console.log(`API key configured: ${Boolean(process.env.GEMINI_API_KEY?.trim())}`);
}
