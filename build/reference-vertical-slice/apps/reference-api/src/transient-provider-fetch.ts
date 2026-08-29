const DEFAULT_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export interface TransientProviderRetryOptions {
  maxAttempts?: number;
  retryDelayMs?: readonly number[];
  retryableStatuses?: ReadonlySet<number>;
  maxRetryAfterMs?: number;
  sleep?: (milliseconds: number, signal?: AbortSignal | null) => Promise<void>;
  now?: () => number;
}

function replayableBody(body: BodyInit | null | undefined): boolean {
  return body === undefined
    || body === null
    || typeof body === 'string'
    || body instanceof URLSearchParams
    || body instanceof ArrayBuffer
    || ArrayBuffer.isView(body);
}

function defaultSleep(milliseconds: number, signal?: AbortSignal | null): Promise<void> {
  if (milliseconds <= 0) return Promise.resolve();
  if (signal?.aborted) return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function abortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function parseRetryAfterMs(value: string | null, nowMs: number, maxRetryAfterMs: number): number | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;

  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const milliseconds = Math.ceil(Number(raw) * 1_000);
    return Math.max(0, Math.min(maxRetryAfterMs, milliseconds));
  }

  const retryAt = Date.parse(raw);
  if (!Number.isFinite(retryAt)) return undefined;
  return Math.max(0, Math.min(maxRetryAfterMs, retryAt - nowMs));
}

/**
 * Bounded transport-only retry wrapper for replay-safe provider requests.
 *
 * This does not change perception/admission semantics. It only retries a small
 * set of transient HTTP failures (or transport errors) before returning the
 * provider response to Talos. Semantic insufficiency, malformed model output,
 * authentication errors and policy failures are never retried here.
 *
 * HTTP Retry-After is authoritative for retry timing when present, but is
 * capped so a provider can never stall the Talos request indefinitely.
 */
export function createTransientProviderRetryFetch(
  baseFetch: typeof fetch = fetch,
  options: TransientProviderRetryOptions = {},
): typeof fetch {
  const maxAttempts = options.maxAttempts ?? 3;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) {
    throw new TypeError('TRANSIENT_PROVIDER_RETRY_MAX_ATTEMPTS_INVALID');
  }
  const retryDelayMs = [...(options.retryDelayMs ?? [1_000, 4_000])];
  if (retryDelayMs.some((value) => !Number.isFinite(value) || value < 0 || value > 15_000)) {
    throw new TypeError('TRANSIENT_PROVIDER_RETRY_DELAY_INVALID');
  }
  const maxRetryAfterMs = options.maxRetryAfterMs ?? 15_000;
  if (!Number.isFinite(maxRetryAfterMs) || maxRetryAfterMs < 0 || maxRetryAfterMs > 60_000) {
    throw new TypeError('TRANSIENT_PROVIDER_RETRY_AFTER_LIMIT_INVALID');
  }
  const retryableStatuses = options.retryableStatuses ?? DEFAULT_RETRYABLE_STATUSES;
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = String(init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const body = init?.body ?? (input instanceof Request ? input.body : undefined);
    const replayable = (method === 'GET' || method === 'HEAD' || replayableBody(body as BodyInit | null | undefined));
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError');
      let serverDelayMs: number | undefined;
      try {
        const response = await baseFetch(input, init);
        const retry = replayable && attempt < maxAttempts && retryableStatuses.has(response.status);
        if (!retry) return response;
        serverDelayMs = parseRetryAfterMs(response.headers.get('retry-after'), now(), maxRetryAfterMs);
        await response.arrayBuffer().catch(() => undefined);
      } catch (error) {
        lastError = error;
        if (!replayable || attempt >= maxAttempts || abortError(error) || signal?.aborted) throw error;
      }
      const configuredDelay = retryDelayMs[Math.min(attempt - 1, Math.max(0, retryDelayMs.length - 1))] ?? 0;
      const delay = serverDelayMs ?? configuredDelay;
      await sleep(delay, signal);
    }
    throw lastError ?? new TypeError('TRANSIENT_PROVIDER_RETRY_EXHAUSTED');
  }) as typeof fetch;
}
