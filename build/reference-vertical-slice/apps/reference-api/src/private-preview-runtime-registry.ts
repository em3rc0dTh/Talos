import { createHash, randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import type { CompiledGenericRuntimeProgram } from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';

export const TALOS_PRODUCT_RUNTIME_REGISTRY_VERSION = 'talos-product-runtime-registry-v0.2';

export interface TalosProductRuntimeCapabilityBinding {
  capabilityUseOccurrenceRef: string;
  implementationRef: string;
}

export interface TalosProductRuntimeRegistryRecord {
  schemaVersion: typeof TALOS_PRODUCT_RUNTIME_REGISTRY_VERSION;
  realizedDeploymentRevisionId: string;
  program: CompiledGenericRuntimeProgram;
  namespace: string;
  taskQueue: string;
  capabilityBindings: TalosProductRuntimeCapabilityBinding[];
  recordedAt: string;
  registryDigest: string;
}

export interface TalosProductRuntimeRegistry {
  persist(input: Omit<TalosProductRuntimeRegistryRecord, 'schemaVersion' | 'registryDigest'>): TalosProductRuntimeRegistryRecord;
  get(realizedDeploymentRevisionId: string): TalosProductRuntimeRegistryRecord | undefined;
  list(): TalosProductRuntimeRegistryRecord[];
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function verifyProgram(program: CompiledGenericRuntimeProgram): void {
  const { programDigest, ...material } = program;
  if (!programDigest.trim() || digestDeterministicJson(material) !== programDigest) {
    throw new TypeError('TALOS_RUNTIME_REGISTRY_PROGRAM_DIGEST_MISMATCH');
  }
}

function normalizedBindings(bindings: TalosProductRuntimeCapabilityBinding[]): TalosProductRuntimeCapabilityBinding[] {
  const normalized = bindings.map((item) => ({
    capabilityUseOccurrenceRef: required(item.capabilityUseOccurrenceRef, 'capabilityUseOccurrenceRef'),
    implementationRef: required(item.implementationRef, 'implementationRef'),
  })).sort((a, b) => a.capabilityUseOccurrenceRef.localeCompare(b.capabilityUseOccurrenceRef));
  if (new Set(normalized.map((item) => item.capabilityUseOccurrenceRef)).size !== normalized.length) {
    throw new TypeError('TALOS_RUNTIME_REGISTRY_DUPLICATE_CAPABILITY_USE');
  }
  return normalized;
}

function digestMaterial(record: Omit<TalosProductRuntimeRegistryRecord, 'registryDigest'>): string {
  return digestDeterministicJson(record);
}

function verifyRecord(record: TalosProductRuntimeRegistryRecord): TalosProductRuntimeRegistryRecord {
  if (record.schemaVersion !== TALOS_PRODUCT_RUNTIME_REGISTRY_VERSION) throw new TypeError('TALOS_RUNTIME_REGISTRY_SCHEMA_UNSUPPORTED');
  verifyProgram(record.program);
  required(record.realizedDeploymentRevisionId, 'realizedDeploymentRevisionId');
  required(record.namespace, 'namespace');
  required(record.taskQueue, 'taskQueue');
  required(record.recordedAt, 'recordedAt');
  const capabilityBindings = normalizedBindings(record.capabilityBindings ?? []);
  const material = {
    schemaVersion: record.schemaVersion,
    realizedDeploymentRevisionId: record.realizedDeploymentRevisionId,
    program: record.program,
    namespace: record.namespace,
    taskQueue: record.taskQueue,
    capabilityBindings,
    recordedAt: record.recordedAt,
  };
  const expected = digestMaterial(material);
  if (record.registryDigest !== expected) throw new TypeError('TALOS_RUNTIME_REGISTRY_DIGEST_MISMATCH');
  return { ...material, registryDigest: expected };
}

function fileKey(realizedDeploymentRevisionId: string): string {
  return createHash('sha256').update(required(realizedDeploymentRevisionId, 'realizedDeploymentRevisionId')).digest('hex');
}

export function createTalosProductRuntimeRegistry(runtimeDirInput: string): TalosProductRuntimeRegistry {
  const runtimeDir = path.resolve(runtimeDirInput);
  const registryDir = path.join(runtimeDir, 'product-runtime-programs');
  mkdirSync(registryDir, { recursive: true });

  function filePath(realizedDeploymentRevisionId: string): string {
    return path.join(registryDir, `${fileKey(realizedDeploymentRevisionId)}.json`);
  }

  function read(file: string): TalosProductRuntimeRegistryRecord {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as TalosProductRuntimeRegistryRecord;
    return verifyRecord(parsed);
  }

  function get(realizedDeploymentRevisionId: string): TalosProductRuntimeRegistryRecord | undefined {
    const file = filePath(realizedDeploymentRevisionId);
    if (!existsSync(file)) return undefined;
    const record = read(file);
    if (record.realizedDeploymentRevisionId !== realizedDeploymentRevisionId) {
      throw new TypeError('TALOS_RUNTIME_REGISTRY_DEPLOYMENT_KEY_MISMATCH');
    }
    return record;
  }

  function persist(input: Omit<TalosProductRuntimeRegistryRecord, 'schemaVersion' | 'registryDigest'>): TalosProductRuntimeRegistryRecord {
    verifyProgram(input.program);
    const material = {
      schemaVersion: TALOS_PRODUCT_RUNTIME_REGISTRY_VERSION,
      realizedDeploymentRevisionId: required(input.realizedDeploymentRevisionId, 'realizedDeploymentRevisionId'),
      program: input.program,
      namespace: required(input.namespace, 'namespace'),
      taskQueue: required(input.taskQueue, 'taskQueue'),
      capabilityBindings: normalizedBindings(input.capabilityBindings),
      recordedAt: required(input.recordedAt, 'recordedAt'),
    };
    const record: TalosProductRuntimeRegistryRecord = {
      ...material,
      registryDigest: digestMaterial(material),
    };
    const file = filePath(material.realizedDeploymentRevisionId);
    if (existsSync(file)) {
      const existing = read(file);
      if (existing.registryDigest !== record.registryDigest) {
        throw new TypeError('TALOS_RUNTIME_REGISTRY_IMMUTABLE_CONFLICT: realized deployment already has different runtime material');
      }
      return existing;
    }
    const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
    try {
      writeFileSync(temporary, `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
      renameSync(temporary, file);
    } catch (error) {
      try { unlinkSync(temporary); } catch { /* best effort */ }
      throw error;
    }
    return record;
  }

  function list(): TalosProductRuntimeRegistryRecord[] {
    if (!existsSync(registryDir)) return [];
    return readdirSync(registryDir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => read(path.join(registryDir, name)));
  }

  return { persist, get, list };
}
