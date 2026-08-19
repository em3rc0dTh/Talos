import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { deterministicJson } from '../../foundation/src/deterministic-json.ts';
import { sha256Utf8 } from '../../foundation/src/digest.ts';

export interface ReferenceEmailEffect {
  readonly idempotencyKey: string;
  readonly request: {
    readonly to: string;
    readonly subject: string;
    readonly body: string;
  };
  readonly createdAt: string;
}

export class ReferenceEmailIdempotencyConflictError extends Error {
  constructor(key: string) {
    super(`Reference email idempotency conflict for key=${key}`);
    this.name = 'ReferenceEmailIdempotencyConflictError';
  }
}

export class ReferenceEmailSinkStore {
  readonly #db: DatabaseSync;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') mkdirSync(path.dirname(dbPath), { recursive: true });
    this.#db = new DatabaseSync(dbPath, { timeout: 5000 });
    this.#db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS reference_email_effects (
        idempotency_key TEXT PRIMARY KEY,
        request_json TEXT NOT NULL,
        request_sha256 TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE TRIGGER IF NOT EXISTS reference_email_effects_no_update
        BEFORE UPDATE ON reference_email_effects
        BEGIN SELECT RAISE(ABORT, 'reference_email_effects is append-only'); END;
      CREATE TRIGGER IF NOT EXISTS reference_email_effects_no_delete
        BEFORE DELETE ON reference_email_effects
        BEGIN SELECT RAISE(ABORT, 'reference_email_effects is append-only'); END;
    `);
  }

  record(effect: ReferenceEmailEffect): { status: 'INSERTED' | 'DUPLICATE_IDENTICAL'; requestSha256: string } {
    const requestJson = deterministicJson(effect.request);
    const requestSha256 = sha256Utf8(requestJson);
    const existing = this.#db.prepare(`
      SELECT request_json, request_sha256, created_at
      FROM reference_email_effects WHERE idempotency_key = ?
    `).get(effect.idempotencyKey) as Record<string, unknown> | undefined;
    if (existing) {
      const same = existing.request_json === requestJson
        && existing.request_sha256 === requestSha256
        && existing.created_at === effect.createdAt;
      if (!same) throw new ReferenceEmailIdempotencyConflictError(effect.idempotencyKey);
      return { status: 'DUPLICATE_IDENTICAL', requestSha256 };
    }
    this.#db.prepare(`
      INSERT INTO reference_email_effects (idempotency_key, request_json, request_sha256, created_at)
      VALUES (?, ?, ?, ?)
    `).run(effect.idempotencyKey, requestJson, requestSha256, effect.createdAt);
    return { status: 'INSERTED', requestSha256 };
  }

  count(): number {
    const row = this.#db.prepare(`SELECT COUNT(*) AS count FROM reference_email_effects`).get() as {count: number};
    return Number(row.count);
  }

  tableNames(): string[] {
    const rows = this.#db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`).all() as Array<{name: string}>;
    return rows.map((row) => row.name);
  }

  close(): void {
    this.#db.close();
  }
}
