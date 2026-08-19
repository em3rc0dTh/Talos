import { createHash, randomUUID } from 'node:crypto';

export type IdKind =
  | 'source'
  | 'canvas'
  | 'canonical'
  | 'provenance'
  | 'review'
  | 'capability'
  | 'execution'
  | 'temporalMapping'
  | 'runtimePolicy'
  | 'deployment'
  | 'observation';

export type OpaqueId<K extends IdKind = IdKind> = string & { readonly __talosIdKind: K };

const prefixes: Record<IdKind, string> = {
  source: 'src',
  canvas: 'can',
  canonical: 'prc',
  provenance: 'prv',
  review: 'rvw',
  capability: 'cap',
  execution: 'exe',
  temporalMapping: 'tmp',
  runtimePolicy: 'rpl',
  deployment: 'dep',
  observation: 'obs',
};

const prefixToKind = new Map(Object.entries(prefixes).map(([kind, prefix]) => [prefix, kind as IdKind]));

export function createOpaqueId<K extends IdKind>(kind: K, deterministicSeed?: string): OpaqueId<K> {
  const suffix = deterministicSeed === undefined
    ? randomUUID().replaceAll('-', '')
    : createHash('sha256').update(`${kind}:${deterministicSeed}`, 'utf8').digest('hex').slice(0, 32);
  return `${prefixes[kind]}_${suffix}` as OpaqueId<K>;
}

export function getIdKind(id: string): IdKind | undefined {
  const underscore = id.indexOf('_');
  if (underscore <= 0) return undefined;
  return prefixToKind.get(id.slice(0, underscore));
}

export function assertIdKind<K extends IdKind>(id: string, expected: K): asserts id is OpaqueId<K> {
  const actual = getIdKind(id);
  if (actual !== expected) {
    throw new TypeError(`TALOS id kind mismatch: expected=${expected} actual=${actual ?? 'UNKNOWN'} id=${id}`);
  }
}
