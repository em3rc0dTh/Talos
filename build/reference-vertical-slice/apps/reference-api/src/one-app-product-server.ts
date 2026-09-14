import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  startTalosOneApp,
  type TalosOneAppOptions,
} from './one-app-server.ts';
import { ONE_APP_PRODUCT_PAGE } from './one-app-product-page.ts';
import { renderR104BusinessConfirmationPage } from './one-app-r1-04-confirmation-extension.ts';

export interface TalosOneAppProductOptions {
  port?: number;
  host?: string;
  oneApp?: Omit<TalosOneAppOptions, 'port' | 'host'>;
}

const MAX_PROXY_BYTES = 24 * 1024 * 1024;

async function readBody(req: http.IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_PROXY_BYTES) throw new TypeError('R1_PRODUCT_REQUEST_TOO_LARGE');
    chunks.push(buffer);
  }
  return chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
}

function json(res: http.ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function proxy(
  innerBaseUrl: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
): Promise<void> {
  const body = await readBody(req);
  const headers: Record<string, string> = {};
  const contentType = req.headers['content-type'];
  if (typeof contentType === 'string') headers['content-type'] = contentType;
  const response = await fetch(`${innerBaseUrl}${url.pathname}${url.search}`, {
    method: req.method,
    headers,
    ...(body === undefined ? {} : { body }),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  res.writeHead(response.status, {
    'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
    'content-length': bytes.byteLength,
    'cache-control': 'no-store',
  });
  res.end(bytes);
}

/**
 * R1 product shell over the certified One-App authority backend.
 *
 * The shell owns presentation only. Source intake, perception admission,
 * Canonical review state and all later authority transitions continue to live in
 * startTalosOneApp. Keeping the browser shell outside that authority service
 * prevents UI convenience code from becoming an alternate execution path.
 *
 * R1-04 injects the explicit business-process confirmation surface here. The
 * extension can only call the existing /api/bpmn/confirm authority boundary; it
 * does not create an alternate confirmation, freeze, deployment or execution path.
 *
 * R1-00 cumulative certification seal: this comment changes no behavior; it exists
 * only to force Image, Temporal-runtime and restart-safety CI on the final PR head.
 */
export async function startTalosOneAppProduct(options: TalosOneAppProductOptions = {}) {
  const host = options.host ?? '127.0.0.1';
  const inner = await startTalosOneApp({
    ...(options.oneApp ?? {}),
    host: '127.0.0.1',
    port: 0,
  });

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      if (req.method === 'GET' && url.pathname === '/') {
        const productPage = renderR104BusinessConfirmationPage(ONE_APP_PRODUCT_PAGE);
        res.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'content-length': Buffer.byteLength(productPage),
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(productPage);
        return;
      }
      if (url.pathname.startsWith('/api/')) {
        await proxy(inner.baseUrl, req, res, url);
        return;
      }
      json(res, 404, { error: 'not found', code: 'R1_PRODUCT_ROUTE_NOT_FOUND' });
    } catch (error) {
      json(res, 400, {
        error: error instanceof Error ? error.message : String(error),
        code: 'R1_PRODUCT_REQUEST_REJECTED',
      });
    }
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(options.port ?? 8787, host, () => resolve());
    });
  } catch (error) {
    await inner.close();
    throw error;
  }

  const address = server.address();
  if (!address || typeof address === 'string') {
    await inner.close();
    throw new Error('Talos R1 product server did not bind a TCP address');
  }

  let closed = false;
  return {
    baseUrl: `http://${host}:${address.port}`,
    innerBaseUrl: inner.baseUrl,
    runtimeDir: inner.runtimeDir,
    async close() {
      if (closed) return;
      closed = true;
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await inner.close();
    },
  };
}

async function main() {
  const product = await startTalosOneAppProduct({
    port: Number(process.env.PORT ?? 8787),
  });
  console.log(`\nTALOS One-App product path is ready: ${product.baseUrl}\n`);
  const stop = async () => {
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
    await product.close();
  };
  const onSignal = () => {
    stop().then(() => process.exit(0), (error) => {
      console.error(error);
      process.exit(1);
    });
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
