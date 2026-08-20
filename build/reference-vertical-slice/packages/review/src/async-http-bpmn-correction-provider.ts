import type { BpmnCorrectionProvider, BpmnCorrectionProviderRequest } from './bpmn-correction-provider.ts';

export interface AsyncHttpBpmnCorrectionProviderOptions {
  endpoint: string;
  timeoutMs?: number;
  headers?: Readonly<Record<string, string>>;
}

export class AsyncHttpBpmnCorrectionProvider implements BpmnCorrectionProvider {
  readonly #endpoint: string;
  readonly #timeoutMs: number;
  readonly #headers: Readonly<Record<string, string>>;

  constructor(options: AsyncHttpBpmnCorrectionProviderOptions) {
    if (!options.endpoint.trim()) throw new TypeError('BPMN correction provider endpoint must not be empty');
    this.#endpoint = options.endpoint;
    this.#timeoutMs = options.timeoutMs ?? 30_000;
    if (!Number.isInteger(this.#timeoutMs) || this.#timeoutMs < 1) throw new TypeError('timeoutMs must be a positive integer');
    this.#headers = { ...(options.headers ?? {}) };
  }

  async propose(request: BpmnCorrectionProviderRequest): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('BPMN correction provider timeout')), this.#timeoutMs);
    try {
      const response = await fetch(this.#endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...this.#headers,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      const body = await response.text();
      if (!response.ok) throw new Error(`BPMN correction provider HTTP ${response.status}`);
      if (!body.trim()) throw new Error('BPMN correction provider returned an empty response');
      try {
        return JSON.parse(body) as unknown;
      } catch {
        throw new Error('BPMN correction provider returned invalid JSON');
      }
    } finally {
      clearTimeout(timer);
    }
  }
}
