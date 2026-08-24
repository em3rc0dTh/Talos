import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
  startTalosOneApp,
  type TalosOneAppOptions,
} from './one-app-server.ts';

export interface TalosPrivatePreviewAccess {
  workspaceId: string;
  actorId: string;
  bearerToken: string;
}

export interface TalosPrivatePreviewRequestPolicy {
  allowedHostnames?: string[];
  allowedOrigins?: string[];
  maxJsonBytes?: number;
  maxImageBytes?: number;
}

export interface TalosPrivatePreviewOptions {
  port?: number;
  host?: string;
  access: TalosPrivatePreviewAccess;
  requestPolicy?: TalosPrivatePreviewRequestPolicy;
  releaseGate?: 'R0-01_PRIVATE_PREVIEW_ACCESS_BOUNDARY' | 'R0-02_PREVIEW_CONFIGURATION_SECRET_CONTRACT';
  oneApp?: Omit<TalosOneAppOptions, 'port' | 'host'>;
}

const ACTOR_FIELDS = new Set([
  'initiatedBy',
  'confirmedBy',
  'approvedBy',
  'decidedBy',
  'realizedBy',
  'requestedBy',
  'createdBy',
  'reconciledBy',
  'selectedBy',
  'frozenBy',
]);
const BUSINESS_PAYLOAD_FIELDS = new Set(['facts', 'capabilityInputs']);
const DEFAULT_MAX_PROXY_JSON_BYTES = 20 * 1024 * 1024;
const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

class PreviewAccessError extends Error {
  readonly status: 400 | 401 | 403 | 413;
  readonly code: string;

  constructor(status: 400 | 401 | 403 | 413, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function tokenDigest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function bearerMatches(header: string | undefined, token: string): boolean {
  if (!header?.startsWith('Bearer ')) return false;
  const supplied = header.slice('Bearer '.length);
  return timingSafeEqual(tokenDigest(supplied), tokenDigest(token));
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

function normalizedHostname(value: string): string {
  return value.trim().toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
}

function requestHostname(req: http.IncomingMessage): string | undefined {
  const header = req.headers.host;
  if (!header) return undefined;
  try {
    const hostname = new URL(`http://${header}`).hostname;
    return normalizedHostname(hostname);
  } catch {
    return undefined;
  }
}

function assertRequestScope(req: http.IncomingMessage, policy: TalosPrivatePreviewRequestPolicy | undefined): void {
  if (!policy) return;
  if (policy.allowedHostnames) {
    const allowed = new Set(policy.allowedHostnames.map(normalizedHostname));
    const hostname = requestHostname(req);
    if (!hostname || !allowed.has(hostname)) {
      throw new PreviewAccessError(403, 'R0_HOST_SCOPE_MISMATCH', 'Request host is outside the configured private-preview host scope');
    }
  }
  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  if (origin && policy.allowedOrigins) {
    const allowed = new Set(policy.allowedOrigins);
    if (!allowed.has(origin)) {
      throw new PreviewAccessError(403, 'R0_ORIGIN_SCOPE_MISMATCH', 'Request origin is outside the configured private-preview origin scope');
    }
  }
}

async function readJsonBody(
  req: http.IncomingMessage,
  maxJsonBytes: number,
): Promise<Record<string, unknown> | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > maxJsonBytes) {
      throw new PreviewAccessError(413, 'R0_REQUEST_TOO_LARGE', 'Request payload exceeds the Talos private-preview limit');
    }
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new PreviewAccessError(400, 'R0_INVALID_JSON', 'Expected a valid JSON request body');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new PreviewAccessError(400, 'R0_INVALID_JSON', 'Expected a JSON object request body');
  }
  return parsed as Record<string, unknown>;
}

function assertImageLimit(pathname: string, payload: Record<string, unknown> | undefined, maxImageBytes: number): void {
  if (pathname !== '/api/input/image' || !payload || typeof payload.imageBase64 !== 'string') return;
  const imageBytes = Buffer.from(payload.imageBase64, 'base64').byteLength;
  if (imageBytes > maxImageBytes) {
    throw new PreviewAccessError(413, 'R0_IMAGE_TOO_LARGE', 'Image payload exceeds the configured Talos private-preview image limit');
  }
}

function assertActorClaims(value: unknown, actorId: string, path = '$'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertActorClaims(item, actorId, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (BUSINESS_PAYLOAD_FIELDS.has(key)) continue;
    if (ACTOR_FIELDS.has(key) && child !== undefined && child !== actorId) {
      throw new PreviewAccessError(
        403,
        'R0_ACTOR_IMPERSONATION_FORBIDDEN',
        `${path}.${key} must match the authenticated private-preview actor`,
      );
    }
    assertActorClaims(child, actorId, `${path}.${key}`);
  }
}

function bindActor(pathname: string, payload: Record<string, unknown>, actorId: string): Record<string, unknown> {
  const bound = structuredClone(payload);
  const bindTop = (field: string) => { bound[field] = actorId; };

  switch (pathname) {
    case '/api/input/image':
    case '/api/input/bpmn':
      bindTop('initiatedBy');
      break;
    case '/api/bpmn/confirm':
      bindTop('confirmedBy');
      break;
    case '/api/bpmn/automation-design-approval':
    case '/api/automation/approve':
    case '/api/automation/deployment/approve':
    case '/api/automation/execution/approve':
      bindTop('approvedBy');
      break;
    case '/api/automation/suggestion/decide':
    case '/api/automation/deployment-design':
      bindTop('decidedBy');
      break;
    case '/api/automation/environment-realization':
      bindTop('realizedBy');
      break;
    case '/api/automation/capability/select': {
      const selections = bound.selections;
      if (Array.isArray(selections)) {
        bound.selections = selections.map((selection) => (
          selection && typeof selection === 'object' && !Array.isArray(selection)
            ? { ...(selection as Record<string, unknown>), decidedBy: actorId }
            : selection
        ));
      }
      break;
    }
    case '/api/automation/runtime-policy': {
      const activities = bound.activities;
      if (Array.isArray(activities)) {
        bound.activities = activities.map((activity) => (
          activity && typeof activity === 'object' && !Array.isArray(activity)
            ? { ...(activity as Record<string, unknown>), decidedBy: actorId }
            : activity
        ));
      }
      if (bound.workflow && typeof bound.workflow === 'object' && !Array.isArray(bound.workflow)) {
        bound.workflow = { ...(bound.workflow as Record<string, unknown>), decidedBy: actorId };
      }
      break;
    }
  }

  return bound;
}

function authorize(req: http.IncomingMessage, access: TalosPrivatePreviewAccess): void {
  if (!bearerMatches(req.headers.authorization, access.bearerToken)) {
    throw new PreviewAccessError(401, 'R0_AUTHENTICATION_REQUIRED', 'Talos private preview requires a valid bearer token');
  }
  const workspaceHeader = req.headers['x-talos-workspace-id'];
  const workspaceId = Array.isArray(workspaceHeader) ? workspaceHeader[0] : workspaceHeader;
  if (workspaceId !== access.workspaceId) {
    throw new PreviewAccessError(403, 'R0_WORKSPACE_SCOPE_MISMATCH', 'Request is outside the configured private-preview workspace');
  }
  const actorHeader = req.headers['x-talos-actor-id'];
  const actorId = Array.isArray(actorHeader) ? actorHeader[0] : actorHeader;
  if (actorId !== access.actorId) {
    throw new PreviewAccessError(403, 'R0_ACTOR_SCOPE_MISMATCH', 'Request is outside the configured private-preview actor');
  }
}

async function proxyRequest(
  innerBaseUrl: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string,
  search: string,
  payload: Record<string, unknown> | undefined,
): Promise<void> {
  const target = `${innerBaseUrl}${pathname}${search}`;
  const response = await fetch(target, {
    method: req.method,
    headers: payload === undefined ? undefined : { 'content-type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  res.writeHead(response.status, {
    'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
    'content-length': bytes.byteLength,
    'cache-control': 'no-store',
  });
  res.end(bytes);
}

export async function startTalosPrivatePreview(options: TalosPrivatePreviewOptions) {
  const workspaceId = required(options.access.workspaceId, 'workspaceId');
  const actorId = required(options.access.actorId, 'actorId');
  const bearerToken = required(options.access.bearerToken, 'bearerToken');
  if (bearerToken.length < 24) throw new TypeError('bearerToken must contain at least 24 characters for private preview');

  const maxJsonBytes = options.requestPolicy?.maxJsonBytes ?? DEFAULT_MAX_PROXY_JSON_BYTES;
  const maxImageBytes = options.requestPolicy?.maxImageBytes ?? DEFAULT_MAX_IMAGE_BYTES;
  if (!Number.isSafeInteger(maxJsonBytes) || maxJsonBytes < 1) throw new TypeError('maxJsonBytes must be a positive safe integer');
  if (!Number.isSafeInteger(maxImageBytes) || maxImageBytes < 1) throw new TypeError('maxImageBytes must be a positive safe integer');

  const access = { workspaceId, actorId, bearerToken };
  const inner = await startTalosOneApp({
    ...(options.oneApp ?? {}),
    host: '127.0.0.1',
    port: 0,
  });
  const host = options.host ?? '127.0.0.1';
  const releaseGate = options.releaseGate ?? 'R0-01_PRIVATE_PREVIEW_ACCESS_BOUNDARY';

  const server = http.createServer(async (req, res) => {
    try {
      assertRequestScope(req, options.requestPolicy);
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      if (req.method === 'GET' && url.pathname === '/health') {
        json(res, 200, {
          status: 'READY',
          releaseGate,
          privatePreview: true,
          engineAuthorityStage: 'I9-07_EXPLICIT_WORKFLOW_EXECUTION_AUTHORITY',
          authentication: 'BEARER_TOKEN',
          workspaceIsolation: 'SINGLE_WORKSPACE_PROCESS',
          actorBinding: 'SINGLE_CONFIGURED_ACTOR',
        });
        return;
      }

      authorize(req, access);
      const payload = await readJsonBody(req, maxJsonBytes);
      assertImageLimit(url.pathname, payload, maxImageBytes);
      if (payload) assertActorClaims(payload, actorId);
      const boundPayload = payload ? bindActor(url.pathname, payload, actorId) : undefined;

      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/api/status')) {
        const engineResponse = await fetch(`${inner.baseUrl}/api/status`);
        const engine = await engineResponse.json() as Record<string, unknown>;
        json(res, engineResponse.status, {
          ...engine,
          releaseGate,
          privatePreview: {
            accessBoundaryEnforced: true,
            authentication: 'BEARER_TOKEN',
            workspaceIsolation: 'SINGLE_WORKSPACE_PROCESS',
            actorBinding: 'SINGLE_CONFIGURED_ACTOR',
            workspaceId,
            actorId,
            requestPolicyEnforced: Boolean(options.requestPolicy),
            bearerTokenExposed: false,
          },
          engineReleaseGate: engine.releaseGate,
          engineAuthorityStage: 'I9-07_EXPLICIT_WORKFLOW_EXECUTION_AUTHORITY',
        });
        return;
      }

      await proxyRequest(inner.baseUrl, req, res, url.pathname, url.search, boundPayload);
    } catch (error) {
      if (error instanceof PreviewAccessError) {
        json(res, error.status, { error: error.message, code: error.code });
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      json(res, 500, { error: message, code: 'R0_PRIVATE_PREVIEW_GATE_FAILURE' });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 0, host, () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    await inner.close();
    throw new Error('Talos private-preview server did not bind a TCP address');
  }
  let closed = false;
  return {
    baseUrl: `http://${host}:${address.port}`,
    runtimeDir: inner.runtimeDir,
    workspaceId,
    actorId,
    async close() {
      if (closed) return;
      closed = true;
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await inner.close();
    },
  };
}
