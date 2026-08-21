import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import { AsyncHttpBpmnCorrectionProvider } from '../../review/src/async-http-bpmn-correction-provider.ts';
import { NaturalLanguageBpmnCorrectionService } from './bpmn-natural-language.ts';

export interface HttpBpmnCorrectionServiceOptions {
  endpoint: string;
  timeoutMs?: number;
  headers?: Readonly<Record<string, string>>;
  now?: () => string;
}

/**
 * Application-owned factory used by browser/API adapters.
 *
 * The external model transport remains untrusted: the returned service still
 * validates the provider protocol and BPMN proposal before any review revision
 * can be materialized. This factory grants no canonical, confirmation, freeze,
 * deployment, or execution authority.
 */
export function createHttpBpmnCorrectionService(
  repo: ImmutableDocumentRepository,
  options: HttpBpmnCorrectionServiceOptions,
): NaturalLanguageBpmnCorrectionService {
  const provider = new AsyncHttpBpmnCorrectionProvider({
    endpoint: options.endpoint,
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
  });
  return new NaturalLanguageBpmnCorrectionService(repo, provider, options.now);
}
