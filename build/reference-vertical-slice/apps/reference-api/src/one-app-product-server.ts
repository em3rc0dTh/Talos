import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  startTalosOneApp,
  type TalosOneAppOptions,
} from './one-app-server.ts';
import { ONE_APP_PRODUCT_PAGE } from './one-app-product-page.ts';
import { renderR111NativeBpmnSourcePage } from './one-app-r1-11-native-bpmn-source-extension.ts';
import { renderR104BusinessConfirmationPage } from './one-app-r1-04-confirmation-extension.ts';
import { renderR105AutomationDesignPage } from './one-app-r1-05-automation-design-extension.ts';
import { renderR106ExecutionPlanPage } from './one-app-r1-06-execution-plan-extension.ts';
import { renderR107RuntimeAuthorityPage } from './one-app-r1-07-runtime-authority-extension.ts';
import { renderR110ProductShellPage } from './one-app-r1-10-product-shell-extension.ts';
import {
  buildTalosProductRecoverySnapshot,
  ensureTalosProductRuntimeCompatibility,
} from './product-runtime-recovery.ts';

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

function normalizeProductApiResponse(pathname: string, contentType: string, bytes: Buffer): Buffer {
  if (!contentType.includes('application/json')) return bytes;
  if (pathname !== '/api/automation/deployment/approve' && pathname !== '/api/automation/execution/approve') return bytes;
  try {
    const parsed = JSON.parse(bytes.toString('utf8')) as Record<string, any>;
    if (pathname === '/api/automation/deployment/approve' && parsed.deploymentApproval) {
      parsed.authorizedAttemptCount = parsed.deploymentApproval.authorizedAttemptCount;
    }
    if (pathname === '/api/automation/execution/approve' && parsed.workflowExecutionApproval) {
      parsed.workflowExecutionAuthorized = parsed.workflowExecutionApproval.createsWorkflowExecutionAuthority === true;
      parsed.authorizedWorkflowStartCount = parsed.workflowExecutionApproval.authorizedWorkflowStartCount;
    }
    return Buffer.from(JSON.stringify(parsed));
  } catch {
    return bytes;
  }
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
  const responseContentType = response.headers.get('content-type') ?? 'application/json; charset=utf-8';
  let bytes = Buffer.from(await response.arrayBuffer());
  if (response.ok) bytes = normalizeProductApiResponse(url.pathname, responseContentType, bytes);
  res.writeHead(response.status, {
    'content-type': responseContentType,
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
 * Product-only proxy aliases expose single-use authority counts at the top level for
 * the browser stepper while preserving the canonical nested approval records from
 * the One-App authority service unchanged.
 *
 * R1-11 adds native BPMN as a first-class product input without creating a new
 * semantic or authority path. Structured BPMN enters the existing One-App intake,
 * reconciliation and process-review routes, then reaches R1-04 through the same
 * exact-revision confirmation boundary as image-derived BPMN.
 * R1-04 injects explicit business-process confirmation.
 * R1-05 consumes the exact confirmation and exposes Automation Design only.
 * R1-06 consumes the exact Automation Design workspace, records explicit capability
 * selection/binding, renders the resulting ExecutionPlan, and permits one explicit
 * automation approval pinned to the exact plan.
 * R1-07 exposes every later authority transition as a separate operator action:
 * Temporal mapping -> explicit RuntimePolicy -> deployment design -> environment
 * realization -> deployment approval -> deployment attempt -> workflow execution
 * approval -> one workflow start.
 * R1-09 adds a versioned product runtime contract and read-only durable recovery
 * reconstruction. Restart never resurrects consumed/in-memory authority implicitly;
 * recovery identifies the last durable gate and the next safe explicit action.
 * R1-10 consolidates navigation, authority state, durable history and safe recovery
 * guidance into the primary product surface. Raw JSON remains debug-only evidence.
 *
 * Source-input extensions are composed before R1-04 so confirmation observes the
 * exact review candidate through the existing fetch boundary. R1-07 is injected
 * before the R1-06 script so it can observe the exact ExecutionPlan-review response
 * without adding a duplicate review/read path. Its UI installs on the next event-loop
 * turn, after R1-06, so product order remains R1-06 then R1-07 for the operator.
 */
export async function startTalosOneAppProduct(options: TalosOneAppProductOptions = {}) {
  const host = options.host ?? '127.0.0.1';
  if (options.oneApp?.runtimeDir) ensureTalosProductRuntimeCompatibility(options.oneApp.runtimeDir);
  const inner = await startTalosOneApp({
    ...(options.oneApp ?? {}),
    host: '127.0.0.1',
    port: 0,
  });
  try {
    ensureTalosProductRuntimeCompatibility(inner.runtimeDir);
  } catch (error) {
    await inner.close();
    throw error;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? host}`);
      if (req.method === 'GET' && url.pathname === '/') {
        const withNativeBpmnSource = renderR111NativeBpmnSourcePage(ONE_APP_PRODUCT_PAGE);
        const withConfirmation = renderR104BusinessConfirmationPage(withNativeBpmnSource);
        const withAutomationDesign = renderR105AutomationDesignPage(withConfirmation);
        const withRuntimeAuthorityCapture = renderR107RuntimeAuthorityPage(withAutomationDesign);
        const withExecutionPlan = renderR106ExecutionPlanPage(withRuntimeAuthorityCapture);
        const productPage = renderR110ProductShellPage(withExecutionPlan);
        res.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'content-length': Buffer.byteLength(productPage),
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        });
        res.end(productPage);
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/product/recovery') {
        json(res, 200, buildTalosProductRecoverySnapshot(inner.runtimeDir));
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
