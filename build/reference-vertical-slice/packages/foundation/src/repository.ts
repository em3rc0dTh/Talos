import type { OpaqueId } from './ids.ts';

export interface ImmutableDocument<T = unknown> {
  readonly id: OpaqueId;
  readonly aggregateKind: string;
  readonly schemaVersion: string;
  readonly payload: T;
  readonly parentId?: OpaqueId;
  readonly createdAt: string;
}

export interface AppendResult {
  readonly status: 'INSERTED' | 'EXISTS_IDENTICAL';
  readonly payloadSha256: string;
}

export interface ImmutableDocumentRepository {
  append<T>(document: ImmutableDocument<T>): AppendResult;
  get<T = unknown>(id: OpaqueId): ImmutableDocument<T> | undefined;
  listByKind<T = unknown>(aggregateKind: string): readonly ImmutableDocument<T>[];
  close(): void;
}
