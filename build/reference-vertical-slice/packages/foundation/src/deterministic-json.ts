export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function encode(value: unknown, seen: Set<object>, location: string): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`Non-finite number at ${location}`);
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (typeof value === 'undefined') throw new TypeError(`undefined is not deterministic JSON at ${location}`);
  if (typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
    throw new TypeError(`Unsupported deterministic JSON value at ${location}: ${typeof value}`);
  }
  if (typeof value !== 'object') throw new TypeError(`Unsupported deterministic JSON value at ${location}`);

  const obj = value as object;
  if (seen.has(obj)) throw new TypeError(`Cyclic deterministic JSON value at ${location}`);
  seen.add(obj);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item, index) => encode(item, seen, `${location}[${index}]`)).join(',')}]`;
    }
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      throw new TypeError(`Only plain objects are allowed in deterministic JSON at ${location}`);
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${encode(record[key], seen, `${location}.${key}`)}`).join(',')}}`;
  } finally {
    seen.delete(obj);
  }
}

export function deterministicJson(value: unknown): string {
  return encode(value, new Set(), '$');
}

export function versionedJson(schema: string, version: string, data: unknown): string {
  if (!schema || !version) throw new TypeError('schema and version are required');
  return deterministicJson({ schema, version, data });
}
