import { createHash } from 'node:crypto';
import { deterministicJson } from './deterministic-json.ts';

export function sha256Utf8(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function digestDeterministicJson(value: unknown): string {
  return sha256Utf8(deterministicJson(value));
}
