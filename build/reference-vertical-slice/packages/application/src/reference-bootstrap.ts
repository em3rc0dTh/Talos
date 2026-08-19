import { deterministicJson } from '../../foundation/src/deterministic-json.ts';
import { sha256Utf8 } from '../../foundation/src/digest.ts';
import type {
  AppendResult,
  ImmutableDocument,
  ImmutableDocumentRepository,
} from '../../foundation/src/repository.ts';
import type { OpaqueId } from '../../foundation/src/ids.ts';
import {
  buildReferenceVerticalSlice,
  type ReferenceDocumentStore,
  type ReferenceVerticalSliceBuildOptions,
} from './reference-vertical-slice.ts';

class ReferenceBootstrapConflictError extends Error {
  constructor(id: string) {
    super(`Reference bootstrap conflict for id=${id}`);
    this.name = 'ReferenceBootstrapConflictError';
  }
}

export class ReferenceBootstrapStore implements ImmutableDocumentRepository {
  readonly #documents = new Map<string, ImmutableDocument>();

  append<T>(document: ImmutableDocument<T>): AppendResult {
    const key = String(document.id);
    const payloadJson = deterministicJson(document.payload);
    const payloadSha256 = sha256Utf8(payloadJson);
    const existing = this.#documents.get(key);

    if (existing) {
      const same = existing.aggregateKind === document.aggregateKind
        && existing.schemaVersion === document.schemaVersion
        && deterministicJson(existing.payload) === payloadJson
        && existing.parentId === document.parentId
        && existing.createdAt === document.createdAt;
      if (!same) throw new ReferenceBootstrapConflictError(key);
      return { status: 'EXISTS_IDENTICAL', payloadSha256 };
    }

    this.#documents.set(key, document as ImmutableDocument);
    return { status: 'INSERTED', payloadSha256 };
  }

  get<T = unknown>(id: OpaqueId): ImmutableDocument<T> | undefined {
    return this.#documents.get(String(id)) as ImmutableDocument<T> | undefined;
  }

  listByKind<T = unknown>(aggregateKind: string): readonly ImmutableDocument<T>[] {
    return [...this.#documents.values()]
      .filter((document) => document.aggregateKind === aggregateKind)
      .map((document) => document as ImmutableDocument<T>);
  }

  allDocuments(): readonly ImmutableDocument[] {
    return [...this.#documents.values()];
  }

  close(): void {}
}

export function buildRestartSafeReferenceVerticalSlice(
  durableRepo: ReferenceDocumentStore,
  options: ReferenceVerticalSliceBuildOptions = {},
) {
  const staged = new ReferenceBootstrapStore();
  const slice = buildReferenceVerticalSlice(staged as never, options);

  for (const document of staged.allDocuments()) {
    const existing = durableRepo.get(String(document.id)) as ImmutableDocument | undefined;
    if (existing) {
      const existingMaterial = deterministicJson({
        aggregateKind: existing.aggregateKind,
        schemaVersion: existing.schemaVersion,
        payload: existing.payload,
        parentId: existing.parentId,
        createdAt: existing.createdAt,
      });
      const nextMaterial = deterministicJson({
        aggregateKind: document.aggregateKind,
        schemaVersion: document.schemaVersion,
        payload: document.payload,
        parentId: document.parentId,
        createdAt: document.createdAt,
      });
      if (existingMaterial !== nextMaterial) {
        throw new TypeError([
          `Reference staged/durable mismatch id=${document.id}`,
          `kind=${document.aggregateKind}`,
          `existing=${existingMaterial}`,
          `next=${nextMaterial}`,
        ].join('\n'));
      }
    }
    durableRepo.append(document);
  }

  return slice;
}
