import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startOllamaGeminiPerceptionGateway } from './ollama-gemini-perception-gateway.ts';

const MAX_REQUEST_BYTES = 24 * 1024 * 1024;
const DEFAULT_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
] as const;

type Environment = Readonly<Record<string, string | undefined>>;

export interface GeminiChainGatewayOptions {
  host?: string;
  port?: number;
  env?: Environment;
  childFetchImpl?: typeof fetch;
  fetchImpl?: typeof fetch;
}

function optional(env: Environment, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

function parseModelChain(env: Environment): string[] {
  const raw = optional(env, 'GEMINI_MODEL_CHAIN');
  const models = (raw ? raw.split(',') : [...DEFAULT_GEMINI_MODELS])
    .map((value) => value.trim())
    .filter(Boolean);
  const unique = [...new Set(models)];
  if (!unique.length) throw new TypeError('GEMINI_MODEL_CHAIN must contain at least one model');
  if (unique.length > 12) throw new TypeError('GEMINI_MODEL_CHAIN may contain at most 12 models');
  return unique;
}

function intEnv(env: Environment, name: string, fallback: number, min: number, max: number): number {
  const raw = optional(env, name);
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw)) throw new TypeError(`${name} must be an integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new TypeError(`${name} must be between ${min} and ${max}`);
  return value;
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

function json(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

/**
 * Gemini-first perception router for interactive image trials.
 *
 * Each model is executed through the already-certified Talos perception gateway,
 * with Ollama pointed at a closed loopback port so it fails fast before Gemini.
 * This deliberately reuses the exact provider validation, source correlation and
 * fail-closed semantics instead of creating a second perception contract.
 */
export async function startGeminiChainPerceptionGateway(options: GeminiChainGatewayOptions = {}) {
  const env = options.env ?? process.env;
  const apiKey = optional(env, 'GEMINI_API_KEY');
  const models = parseModelChain(env);
  const host = options.host ?? optional(env, 'HOST') ?? '127.0.0.1';
  const port = options.port ?? Number(optional(env, 'PORT') ?? 8791);
  const perModelTimeoutMs = intEnv(env, 'GEMINI_TIMEOUT_MS', 45_000, 1_000, 60_000);
  const childFetchImpl = options.childFetchImpl ?? fetch;
  const fetchImpl = options.fetchImpl ?? fetch;
  const children: Array<{ model: string; baseUrl: string; close: () => Promise<void> }> = [];

  if (apiKey) {
    for (const model of models) {
      const child = await startOllamaGeminiPerceptionGateway({
        host: '127.0.0.1',
        port: 0,
        fetchImpl: childFetchImpl,
        env: {
          ...env,
          GEMINI_API_KEY: apiKey,
          GEMINI_MODEL: model,
          GEMINI_TIMEOUT_MS: String(perModelTimeoutMs),
          OLLAMA_BASE_URL: 'http://127.0.0.1:1',
          OLLAMA_TIMEOUT_MS: '1000',
          OLLAMA_MAX_ATTEMPTS: '1',
          TALOS_GATEWAY_MODEL_REF: 'router:gemini-model-chain',
          TALOS_GATEWAY_MODEL_VERSION: 'r1-11-gemini-chain-v1',
          TALOS_GATEWAY_PIPELINE_VERSION: 'talos-r1-11-gemini-chain-v0.1',
        },
      });
      children.push({ model, baseUrl: child.baseUrl, close: child.close });
    }
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      if (req.method === 'GET' && url.pathname === '/health') {
        json(res, apiKey ? 200 : 503, {
          status: apiKey ? 'READY' : 'GEMINI_KEY_NOT_CONFIGURED',
          provider: 'GEMINI_MODEL_CHAIN',
          models,
          configured: Boolean(apiKey),
          policy: 'ORDERED_MODEL_FAILOVER_FAIL_CLOSED',
        });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/perceive') {
        if (!apiKey || !children.length) {
          json(res, 503, {
            error: 'GEMINI_CHAIN_NOT_CONFIGURED',
            code: 'PERCEPTION_GATEWAY_UNAVAILABLE',
            automaticConfirmationAuthorized: false,
            automaticExecutionAuthorized: false,
          });
          return;
        }
        const body = await readBody(req);
        const failures: Array<{ model: string; status: number; error?: string }> = [];
        for (let index = 0; index < children.length; index += 1) {
          const child = children[index];
          try {
            const response = await fetchImpl(`${child.baseUrl}/perceive`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body,
            });
            const bytes = Buffer.from(await response.arrayBuffer());
            if (response.ok) {
              res.writeHead(response.status, {
                'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
                'content-length': bytes.byteLength,
                'cache-control': 'no-store',
                'x-talos-gemini-model': child.model,
                'x-talos-gemini-attempt': String(index + 1),
              });
              res.end(bytes);
              return;
            }
            let detail: string | undefined;
            try {
              const parsed = JSON.parse(bytes.toString('utf8')) as { error?: string };
              detail = parsed.error;
            } catch {}
            failures.push({ model: child.model, status: response.status, ...(detail ? { error: detail } : {}) });
          } catch (error) {
            failures.push({ model: child.model, status: 503, error: error instanceof Error ? error.message : String(error) });
          }
        }
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
      await Promise.all(children.map((child) => child.close()));
    },
  };
}

async function main() {
  const gateway = await startGeminiChainPerceptionGateway({ host: process.env.HOST ?? '0.0.0.0' });
  console.log(`\nTalos Gemini model-chain gateway ready: ${gateway.baseUrl}`);
  console.log(`Models: ${gateway.models.join(' -> ')}`);
  console.log(`Configured: ${gateway.configured}\n`);
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
