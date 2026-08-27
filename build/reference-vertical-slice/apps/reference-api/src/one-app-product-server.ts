import http from 'node:http';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startTalosOneApp, type TalosOneAppOptions } from './one-app-server.ts';
import { ONE_APP_PRODUCT_PAGE } from './one-app-product-page.ts';
import { ONE_APP_PRODUCT_HUMAN_RUNTIME_ENHANCEMENT } from './one-app-product-human-runtime-page.ts';
import type { TalosProductHumanRuntimeControl } from './private-preview-human-control.ts';
import type { TalosExecutionRecoveryItem, TalosExecutionRecoveryResult, TalosProductExecutionRecovery } from './private-preview-execution-recovery.ts';

export interface TalosProductUpstream {
  baseUrl: string;
  headers?: Readonly<Record<string, string>>;
  runtimeDir?: string;
  close?: () => Promise<void>;
}
export interface TalosOneAppProductOptions {
  port?: number;
  host?: string;
  oneApp?: Omit<TalosOneAppOptions, 'port' | 'host'>;
  upstream?: TalosProductUpstream;
  runtimeProfile?: Readonly<Record<string, unknown>>;
  humanRuntimeControl?: TalosProductHumanRuntimeControl;
  humanRuntimeActorId?: string;
  executionRecovery?: TalosProductExecutionRecovery;
  ensureRecoveredWorkers?: (realizedDeploymentRevisionIds: string[]) => Promise<void>;
}
const MAX_PROXY_BYTES = 24 * 1024 * 1024;

async function readBody(req: http.IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks: Buffer[] = []; let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_PROXY_BYTES) throw new TypeError('R1_PRODUCT_REQUEST_TOO_LARGE');
    chunks.push(buffer);
  }
  return chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
}
function parseJsonBuffer(body: Buffer | undefined): Record<string, unknown> {
  if (!body || body.byteLength === 0) return {};
  const parsed = JSON.parse(body.toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new TypeError('R1_PRODUCT_JSON_OBJECT_REQUIRED');
  return parsed as Record<string, unknown>;
}
function required(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} must be a non-empty string`);
  return value.trim();
}
function json(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store' });
  res.end(body);
}
async function proxy(upstream: TalosProductUpstream, req: http.IncomingMessage, res: http.ServerResponse, url: URL, inspect?: (status: number, bytes: Buffer) => void): Promise<void> {
  const body = await readBody(req);
  const headers: Record<string, string> = { ...(upstream.headers ?? {}) };
  const contentType = req.headers['content-type']; if (typeof contentType === 'string') headers['content-type'] = contentType;
  const response = await fetch(`${upstream.baseUrl}${url.pathname}${url.search}`, { method: req.method, headers, ...(body === undefined ? {} : { body }) });
  const bytes = Buffer.from(await response.arrayBuffer()); inspect?.(response.status, bytes);
  res.writeHead(response.status, { 'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8', 'content-length': bytes.byteLength, 'cache-control': 'no-store' });
  res.end(bytes);
}

/** Presentation-only shell over the protected One-App authority boundary. */
export async function startTalosOneAppProduct(options: TalosOneAppProductOptions = {}) {
  if (options.upstream && options.oneApp) throw new TypeError('R1_PRODUCT_UPSTREAM_CONFLICT: configure either upstream or embedded One-App, not both');
  if (options.humanRuntimeControl && !options.humanRuntimeActorId?.trim()) throw new TypeError('R1_PRODUCT_HUMAN_ACTOR_REQUIRED: human runtime control requires the configured private-preview actor');
  if (options.executionRecovery && !options.humanRuntimeControl) throw new TypeError('R1_PRODUCT_RECOVERY_CONTROL_REQUIRED: execution recovery requires the Temporal human/runtime control surface');
  const host = options.host ?? '127.0.0.1';
  const embedded = options.upstream ? undefined : await startTalosOneApp({ ...(options.oneApp ?? {}), host: '127.0.0.1', port: 0 });
  const upstream: TalosProductUpstream = options.upstream ?? { baseUrl: embedded!.baseUrl, runtimeDir: embedded!.runtimeDir, close: () => embedded!.close() };
  const authorizedHumanExecutionIds = new Set<string>();

  async function ensureRecoveredWorker(item: TalosExecutionRecoveryItem, alreadyAuthorized = false): Promise<void> {
    if (item.state !== 'RUNNING' || alreadyAuthorized) return;
    const deploymentRevisionId = item.start?.startingDeploymentRevisionRef;
    if (deploymentRevisionId && options.ensureRecoveredWorkers) await options.ensureRecoveredWorkers([deploymentRevisionId]);
  }

  let recoveryBeforeServe: TalosExecutionRecoveryResult | undefined;
  try {
    if (options.executionRecovery) {
      recoveryBeforeServe = await options.executionRecovery.reconcileAll();
      for (const item of recoveryBeforeServe.items) {
        if (item.state !== 'RUNNING') continue;
        await ensureRecoveredWorker(item);
        authorizedHumanExecutionIds.add(item.executionId);
      }
    }
  } catch (error) {
    await upstream.close?.(); await options.executionRecovery?.close().catch(() => undefined); throw error;
  }
  const runtimeProfile = {
    ...(options.runtimeProfile ?? { runtimeMode: 'DESIGN_ONLY', temporalExecutionAvailable: false, secretMaterialExposed: false }),
    humanRuntimeAvailable: Boolean(options.humanRuntimeControl),
    executionRecoveryAvailable: Boolean(options.executionRecovery),
    recoveredActiveExecutionCount: recoveryBeforeServe?.activeExecutionIds.length ?? 0,
  };
  const productPage = options.humanRuntimeControl ? ONE_APP_PRODUCT_PAGE.replace('</body>', '<script src="/talos-product-human-runtime.js"></script></body>') : ONE_APP_PRODUCT_PAGE;

  async function reconcileForAccess(executionId: string): Promise<TalosExecutionRecoveryItem | undefined> {
    if (!options.executionRecovery) return undefined;
    const alreadyAuthorized = authorizedHumanExecutionIds.has(executionId);
    const recovered = await options.executionRecovery.reconcileExecution(executionId);
    if (recovered.state === 'RUNNING') {
      await ensureRecoveredWorker(recovered, alreadyAuthorized);
      authorizedHumanExecutionIds.add(executionId);
    } else if (recovered.state === 'TERMINAL') authorizedHumanExecutionIds.delete(executionId);
    return recovered;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': Buffer.byteLength(productPage), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        res.end(productPage); return;
      }
      if (req.method === 'GET' && url.pathname === '/talos-product-human-runtime.js') {
        if (!options.humanRuntimeControl) { json(res, 404, { error: 'human runtime unavailable', code: 'R1_PRODUCT_HUMAN_RUNTIME_UNAVAILABLE' }); return; }
        res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'content-length': Buffer.byteLength(ONE_APP_PRODUCT_HUMAN_RUNTIME_ENHANCEMENT), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        res.end(ONE_APP_PRODUCT_HUMAN_RUNTIME_ENHANCEMENT); return;
      }
      if (req.method === 'GET' && url.pathname === '/api/product/runtime-profile') { json(res, 200, runtimeProfile); return; }
      if (req.method === 'GET' && url.pathname === '/api/product/execution/recovery') {
        if (!options.executionRecovery) throw new TypeError('R1_PRODUCT_EXECUTION_RECOVERY_UNAVAILABLE');
        json(res, 200, await reconcileForAccess(required(url.searchParams.get('executionId'), 'executionId'))); return;
      }
      if (req.method === 'GET' && url.pathname === '/api/product/execution/state') {
        if (!options.humanRuntimeControl) throw new TypeError('R1_PRODUCT_HUMAN_RUNTIME_UNAVAILABLE');
        const executionId = required(url.searchParams.get('executionId'), 'executionId');
        const recovered = options.executionRecovery ? await reconcileForAccess(executionId) : undefined;
        if (recovered?.state === 'TERMINAL') { json(res, 200, { terminalObservation: recovered.observation, recovered: true }); return; }
        if (!authorizedHumanExecutionIds.has(executionId)) throw new TypeError('R1_PRODUCT_HUMAN_EXECUTION_NOT_AUTHORIZED: executionId has no successful protected Workflow start or recovered live Temporal execution');
        try { json(res, 200, await options.humanRuntimeControl.getState(executionId)); }
        catch (error) {
          const terminal = await reconcileForAccess(executionId);
          if (terminal?.state === 'TERMINAL') { json(res, 200, { terminalObservation: terminal.observation, recovered: true }); return; }
          throw error;
        }
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/product/execution/human-outcome') {
        if (!options.humanRuntimeControl) throw new TypeError('R1_PRODUCT_HUMAN_RUNTIME_UNAVAILABLE');
        const input = parseJsonBuffer(await readBody(req));
        const executionId = required(input.executionId, 'executionId');
        const before = options.executionRecovery ? await reconcileForAccess(executionId) : undefined;
        if (before?.state === 'TERMINAL') throw new TypeError('R1_PRODUCT_HUMAN_EXECUTION_TERMINAL: Workflow is already terminal');
        if (!authorizedHumanExecutionIds.has(executionId)) throw new TypeError('R1_PRODUCT_HUMAN_EXECUTION_NOT_AUTHORIZED: executionId has no successful protected Workflow start or recovered live Temporal execution');
        const actorRef = required(options.humanRuntimeActorId, 'humanRuntimeActorId');
        const result = await options.humanRuntimeControl.submitOutcome({ executionId, submissionId: required(input.submissionId, 'submissionId'), executionElementRef: required(input.executionElementRef, 'executionElementRef'), outcomeCode: required(input.outcomeCode, 'outcomeCode'), actorRef, authorityRef: `authority:talos-product:human-outcome:${randomUUID()}`, ...(typeof input.rationale === 'string' && input.rationale.trim() ? { rationale: input.rationale.trim() } : {}) });
        const recovery = options.executionRecovery ? await reconcileForAccess(executionId) : undefined;
        json(res, 201, { ...result, ...(recovery ? { recovery } : {}) }); return;
      }
      if (url.pathname.startsWith('/api/')) {
        await proxy(upstream, req, res, url, url.pathname === '/api/automation/execution/start' ? (status, bytes) => {
          if (status < 200 || status >= 300) return;
          try {
            const body = JSON.parse(bytes.toString('utf8')) as any;
            const executionId = typeof body?.executionId === 'string' ? body.executionId.trim() : '';
            if (body?.workflowExecutionStart?.executionStatus === 'RUNNING' && executionId) authorizedHumanExecutionIds.add(executionId);
            else if (executionId) authorizedHumanExecutionIds.delete(executionId);
          } catch { /* malformed upstream response can never grant runtime access */ }
        } : undefined);
        return;
      }
      json(res, 404, { error: 'not found', code: 'R1_PRODUCT_ROUTE_NOT_FOUND' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const conflict = /UNAVAILABLE|NOT_AUTHORIZED|TERMINAL|requires|approval|not waiting|not allowed|mismatch|pending|active|recovery/i.test(message);
      json(res, conflict ? 409 : 400, { error: message, code: conflict ? 'R1_PRODUCT_AUTHORITY_ORDER_VIOLATION' : 'R1_PRODUCT_REQUEST_REJECTED' });
    }
  });

  try { await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(options.port ?? 8787, host, () => resolve()); }); }
  catch (error) { await upstream.close?.(); await options.executionRecovery?.close().catch(() => undefined); throw error; }
  const address = server.address();
  if (!address || typeof address === 'string') { await upstream.close?.(); await options.executionRecovery?.close().catch(() => undefined); throw new Error('Talos R1 product server did not bind a TCP address'); }
  let closed = false;
  return {
    baseUrl: `http://${host}:${address.port}`, innerBaseUrl: upstream.baseUrl, runtimeDir: upstream.runtimeDir, recoveryBeforeServe,
    async close() { if (closed) return; closed = true; await new Promise<void>((resolve) => server.close(() => resolve())); await upstream.close?.(); await options.executionRecovery?.close(); },
  };
}

async function main() {
  const product = await startTalosOneAppProduct({ port: Number(process.env.PORT ?? 8787) });
  console.log(`\nTALOS One-App product path is ready: ${product.baseUrl}\n`);
  const stop = async () => { process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal); await product.close(); };
  const onSignal = () => { stop().then(() => process.exit(0), (error) => { console.error(error); process.exit(1); }); };
  process.on('SIGINT', onSignal); process.on('SIGTERM', onSignal);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch((error) => { console.error(error); process.exit(1); });
