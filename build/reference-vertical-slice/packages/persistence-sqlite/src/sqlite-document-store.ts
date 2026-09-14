import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { deterministicJson } from '../../foundation/src/deterministic-json.ts';
import { sha256Utf8 } from '../../foundation/src/digest.ts';
import type { AppendResult, ImmutableDocument, ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { OpaqueId } from '../../foundation/src/ids.ts';

export class ImmutableDocumentConflictError extends Error {
  constructor(id: string) {
    super(`Immutable document conflict for id=${id}`);
    this.name = 'ImmutableDocumentConflictError';
  }
}

export class SqliteDocumentStore implements ImmutableDocumentRepository {
  readonly #db: DatabaseSync;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') mkdirSync(path.dirname(dbPath), { recursive: true });
    this.#db = new DatabaseSync(dbPath, { timeout: 5000 });
    this.#db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS immutable_documents (
        id TEXT PRIMARY KEY,
        aggregate_kind TEXT NOT NULL,
        schema_version TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        payload_sha256 TEXT NOT NULL,
        parent_id TEXT,
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_immutable_documents_kind_created
        ON immutable_documents(aggregate_kind, created_at, id);
      CREATE TRIGGER IF NOT EXISTS immutable_documents_no_update
        BEFORE UPDATE ON immutable_documents
        BEGIN SELECT RAISE(ABORT, 'immutable_documents is append-only'); END;
      CREATE TRIGGER IF NOT EXISTS immutable_documents_no_delete
        BEFORE DELETE ON immutable_documents
        BEGIN SELECT RAISE(ABORT, 'immutable_documents is append-only'); END;
    `);
  }

  append<T>(document: ImmutableDocument<T>): AppendResult {
    const payloadJson = deterministicJson(document.payload);
    const payloadSha256 = sha256Utf8(payloadJson);
    const existing = this.#db.prepare(`
      SELECT id, aggregate_kind, schema_version, payload_json, payload_sha256, parent_id, created_at
      FROM immutable_documents WHERE id = ?
    `).get(document.id) as Record<string, unknown> | undefined;

    if (existing) {
      const same = existing.aggregate_kind === document.aggregateKind
        && existing.schema_version === document.schemaVersion
        && existing.payload_json === payloadJson
        && existing.payload_sha256 === payloadSha256
        && (existing.parent_id ?? undefined) === document.parentId
        && existing.created_at === document.createdAt;
      if (!same) throw new ImmutableDocumentConflictError(document.id);
      return { status: 'EXISTS_IDENTICAL', payloadSha256 };
    }

    this.#db.prepare(`
      INSERT INTO immutable_documents
        (id, aggregate_kind, schema_version, payload_json, payload_sha256, parent_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      document.id,
      document.aggregateKind,
      document.schemaVersion,
      payloadJson,
      payloadSha256,
      document.parentId ?? null,
      document.createdAt,
    );
    return { status: 'INSERTED', payloadSha256 };
  }

  get<T = unknown>(id: OpaqueId): ImmutableDocument<T> | undefined {
    const row = this.#db.prepare(`
      SELECT id, aggregate_kind, schema_version, payload_json, parent_id, created_at
      FROM immutable_documents WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;
    return row ? this.#toDocument<T>(row) : undefined;
  }

  listByKind<T = unknown>(aggregateKind: string): readonly ImmutableDocument<T>[] {
    const rows = this.#db.prepare(`
      SELECT id, aggregate_kind, schema_version, payload_json, parent_id, created_at
      FROM immutable_documents WHERE aggregate_kind = ? ORDER BY created_at, id
    `).all(aggregateKind) as Record<string, unknown>[];
    return rows.map((row) => this.#toDocument<T>(row));
  }

  /**
   * Read-only recovery/inspection view across every immutable document.
   *
   * This does not add a mutable projection table and does not change repository
   * authority semantics. It exists so the product can reconstruct durable history
   * after process restart without treating in-memory sessions as truth.
   */
  listAll<T = unknown>(): readonly ImmutableDocument<T>[] {
    const rows = this.#db.prepare(`
      SELECT id, aggregate_kind, schema_version, payload_json, parent_id, created_at
      FROM immutable_documents ORDER BY created_at, id
    `).all() as Record<string, unknown>[];
    return rows.map((row) => this.#toDocument<T>(row));
  }

  tableNames(): string[] {
    const rows = this.#db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`).all() as Array<{name: string}>;
    return rows.map((row) => row.name);
  }

  #toDocument<T>(row: Record<string, unknown>): ImmutableDocument<T> {
    const base = {
      id: row.id as OpaqueId,
      aggregateKind: String(row.aggregate_kind),
      schemaVersion: String(row.schema_version),
      payload: JSON.parse(String(row.payload_json)) as T,
      createdAt: String(row.created_at),
    };
    return row.parent_id === null || row.parent_id === undefined
      ? base
      : { ...base, parentId: row.parent_id as OpaqueId };
  }

  close(): void {
    this.#db.close();
  }
}
