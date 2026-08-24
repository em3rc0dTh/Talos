import { createHash } from 'node:crypto';
import {
  IMAGE_PERCEPTION_RUNTIME_ENV,
  resolveImagePerceptionRuntimeBinding,
  type ImagePerceptionRuntimeDescriptor,
} from '../../../packages/image-perception/src/index.ts';
import type {
  TalosPrivatePreviewAccess,
  TalosPrivatePreviewRequestPolicy,
} from './private-preview-server.ts';

export const TALOS_PRIVATE_PREVIEW_CONFIG_VERSION = 'talos-private-preview-runtime-config-v0.1';

export const TALOS_PRIVATE_PREVIEW_ENV = {
  workspaceId: 'TALOS_PRIVATE_PREVIEW_WORKSPACE_ID',
  actorId: 'TALOS_PRIVATE_PREVIEW_ACTOR_ID',
  bearerToken: 'TALOS_PRIVATE_PREVIEW_BEARER_TOKEN',
  bindHost: 'TALOS_PRIVATE_PREVIEW_BIND_HOST',
  allowedHostnames: 'TALOS_PRIVATE_PREVIEW_ALLOWED_HOSTNAMES',
  allowedOrigins: 'TALOS_PRIVATE_PREVIEW_ALLOWED_ORIGINS',
  maxJsonBytes: 'TALOS_PRIVATE_PREVIEW_MAX_JSON_BYTES',
  maxImageBytes: 'TALOS_PRIVATE_PREVIEW_MAX_IMAGE_BYTES',
  imageMode: 'TALOS_PRIVATE_PREVIEW_IMAGE_MODE',
  runtimeMode: 'TALOS_PRIVATE_PREVIEW_RUNTIME_MODE',
  temporalAddress: 'TALOS_PRIVATE_PREVIEW_TEMPORAL_ADDRESS',
  temporalNamespace: 'TALOS_PRIVATE_PREVIEW_TEMPORAL_NAMESPACE',
  temporalTaskQueue: 'TALOS_PRIVATE_PREVIEW_TEMPORAL_TASK_QUEUE',
} as const;

type Environment = Readonly<Record<string, string | undefined>>;
export type TalosPrivatePreviewImageMode = 'DISABLED' | 'REQUIRED';
export type TalosPrivatePreviewRuntimeMode = 'DESIGN_ONLY' | 'TEMPORAL_EXECUTION';

export interface TalosPrivatePreviewTemporalTarget {
  address: string;
  namespace: string;
  taskQueue: string;
}

export interface TalosPrivatePreviewRuntimeDescriptor {
  configVersion: typeof TALOS_PRIVATE_PREVIEW_CONFIG_VERSION;
  workspaceId: string;
  actorId: string;
  bindHost: '127.0.0.1' | '::1';
  allowedHostnames: string[];
  allowedOrigins: string[];
  maxJsonBytes: number;
  maxImageBytes: number;
  authentication: 'BEARER_TOKEN';
  accessSecretConfigured: true;
  accessSecretSource: 'ENVIRONMENT';
  accessSecretEnvName: typeof TALOS_PRIVATE_PREVIEW_ENV.bearerToken;
  imageMode: TalosPrivatePreviewImageMode;
  imageProvider?: Readonly<ImagePerceptionRuntimeDescriptor>;
  runtimeMode: TalosPrivatePreviewRuntimeMode;
  temporalTarget?: TalosPrivatePreviewTemporalTarget;
  configurationFingerprint: string;
}

export interface TalosPrivatePreviewStartConfiguration {
  host: '127.0.0.1' | '::1';
  access: TalosPrivatePreviewAccess;
  requestPolicy: Required<TalosPrivatePreviewRequestPolicy>;
  imagePerceptionEnv: Readonly<Record<string, string | undefined>>;
}

export interface TalosPrivatePreviewRuntimeBinding {
  readonly descriptor: Readonly<TalosPrivatePreviewRuntimeDescriptor>;
  createStartConfiguration(): TalosPrivatePreviewStartConfiguration;
}

function optional(env: Environment, name: string): string | undefined {
  const value = env[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function required(env: Environment, name: string): string {
  const value = optional(env, name);
  if (!value) throw new TypeError(`R0_PREVIEW_CONFIG_MISSING: ${name}`);
  return value;
}

function enumValue<T extends string>(raw: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(raw as T)) {
    throw new TypeError(`R0_PREVIEW_CONFIG_INVALID: ${label} must be one of ${allowed.join(', ')}`);
  }
  return raw as T;
}

function integer(env: Environment, name: string, min: number, max: number): number {
  const raw = required(env, name);
  if (!/^\d+$/.test(raw)) throw new TypeError(`R0_PREVIEW_CONFIG_INVALID: ${name} must be an integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new TypeError(`R0_PREVIEW_CONFIG_INVALID: ${name} must be between ${min} and ${max}`);
  }
  return value;
}

function normalizedLocalHostname(value: string): string {
  return value.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
}

function localHostList(env: Environment): string[] {
  const raw = required(env, TALOS_PRIVATE_PREVIEW_ENV.allowedHostnames);
  const values = [...new Set(raw.split(',').map((value) => normalizedLocalHostname(value.trim())).filter(Boolean))];
  if (values.length === 0) throw new TypeError('R0_PREVIEW_CONFIG_INVALID: allowed hostnames cannot be empty');
  for (const value of values) {
    if (!['127.0.0.1', '::1', 'localhost'].includes(value)) {
      throw new TypeError('R0_PREVIEW_CONFIG_INVALID: private preview hostnames must remain loopback-local');
    }
  }
  return values;
}

function exactOrigins(env: Environment): string[] {
  const raw = required(env, TALOS_PRIVATE_PREVIEW_ENV.allowedOrigins);
  if (raw === 'NONE') return [];
  const origins: string[] = [];
  for (const entry of raw.split(',').map((value) => value.trim()).filter(Boolean)) {
    let url: URL;
    try {
      url = new URL(entry);
    } catch {
      throw new TypeError('R0_PREVIEW_CONFIG_INVALID: every allowed origin must be an absolute URL');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new TypeError('R0_PREVIEW_CONFIG_INVALID: allowed origins must be exact http/https origins without credentials, path, query or fragment');
    }
    origins.push(url.origin);
  }
  if (origins.length === 0) throw new TypeError('R0_PREVIEW_CONFIG_INVALID: allowed origins must be NONE or contain at least one origin');
  return [...new Set(origins)];
}

function temporalAddress(raw: string): string {
  const match = /^([A-Za-z0-9.-]+):(\d{1,5})$/.exec(raw);
  if (!match) throw new TypeError('R0_PREVIEW_CONFIG_INVALID: Temporal address must use host:port');
  const port = Number(match[2]);
  if (port < 1 || port > 65_535) throw new TypeError('R0_PREVIEW_CONFIG_INVALID: Temporal port must be between 1 and 65535');
  return raw;
}

function temporalName(raw: string, label: string): string {
  if (raw.length > 255 || !/^[A-Za-z0-9._-]+$/.test(raw)) {
    throw new TypeError(`R0_PREVIEW_CONFIG_INVALID: ${label} contains unsupported characters`);
  }
  return raw;
}

function imageEnvironment(env: Environment): Record<string, string | undefined> {
  const selected: Record<string, string | undefined> = {};
  for (const name of Object.values(IMAGE_PERCEPTION_RUNTIME_ENV)) {
    if (env[name] !== undefined) selected[name] = env[name];
  }
  return selected;
}

function imageConfigPresent(env: Environment): boolean {
  return Object.values(IMAGE_PERCEPTION_RUNTIME_ENV).some((name) => optional(env, name) !== undefined);
}

function fingerprint(value: object): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function resolveTalosPrivatePreviewRuntimeBinding(
  env: Environment = process.env,
): TalosPrivatePreviewRuntimeBinding {
  const workspaceId = required(env, TALOS_PRIVATE_PREVIEW_ENV.workspaceId);
  const actorId = required(env, TALOS_PRIVATE_PREVIEW_ENV.actorId);
  const bearerToken = required(env, TALOS_PRIVATE_PREVIEW_ENV.bearerToken);
  if (bearerToken.length < 24) throw new TypeError('R0_PREVIEW_CONFIG_INVALID: private-preview bearer token must contain at least 24 characters');

  const bindHostRaw = required(env, TALOS_PRIVATE_PREVIEW_ENV.bindHost);
  if (bindHostRaw !== '127.0.0.1' && bindHostRaw !== '::1') {
    throw new TypeError('R0_PREVIEW_CONFIG_INVALID: private-preview bind host must remain loopback-local');
  }
  const bindHost: '127.0.0.1' | '::1' = bindHostRaw;
  const allowedHostnames = localHostList(env);
  if (!allowedHostnames.includes(normalizedLocalHostname(bindHost))) {
    throw new TypeError('R0_PREVIEW_CONFIG_INVALID: allowed hostnames must include the configured bind host');
  }
  const allowedOrigins = exactOrigins(env);

  const maxJsonBytes = integer(env, TALOS_PRIVATE_PREVIEW_ENV.maxJsonBytes, 65_536, 20 * 1024 * 1024);
  const maxImageBytes = integer(env, TALOS_PRIVATE_PREVIEW_ENV.maxImageBytes, 1_024, 12 * 1024 * 1024);
  const minimumJsonForImage = Math.ceil(maxImageBytes * 4 / 3) + 4_096;
  if (minimumJsonForImage > maxJsonBytes) {
    throw new TypeError('R0_PREVIEW_CONFIG_INVALID: JSON limit is too small for the configured base64 image limit');
  }

  const imageMode = enumValue(
    required(env, TALOS_PRIVATE_PREVIEW_ENV.imageMode),
    ['DISABLED', 'REQUIRED'] as const,
    TALOS_PRIVATE_PREVIEW_ENV.imageMode,
  );
  let imageProvider: Readonly<ImagePerceptionRuntimeDescriptor> | undefined;
  let selectedImageEnv: Record<string, string | undefined> = {};
  if (imageMode === 'DISABLED') {
    if (imageConfigPresent(env)) {
      throw new TypeError('R0_PREVIEW_CONFIG_CONFLICT: image provider variables are present while private-preview image mode is DISABLED');
    }
  } else {
    const imageRuntime = resolveImagePerceptionRuntimeBinding(env);
    if (imageRuntime.status !== 'CONFIGURED') {
      throw new TypeError('R0_PREVIEW_CONFIG_MISSING: image mode REQUIRED needs a complete image-perception provider configuration');
    }
    imageProvider = imageRuntime.binding.descriptor;
    selectedImageEnv = imageEnvironment(env);
  }

  const runtimeMode = enumValue(
    required(env, TALOS_PRIVATE_PREVIEW_ENV.runtimeMode),
    ['DESIGN_ONLY', 'TEMPORAL_EXECUTION'] as const,
    TALOS_PRIVATE_PREVIEW_ENV.runtimeMode,
  );
  const temporalInputs = [
    optional(env, TALOS_PRIVATE_PREVIEW_ENV.temporalAddress),
    optional(env, TALOS_PRIVATE_PREVIEW_ENV.temporalNamespace),
    optional(env, TALOS_PRIVATE_PREVIEW_ENV.temporalTaskQueue),
  ];
  let target: TalosPrivatePreviewTemporalTarget | undefined;
  if (runtimeMode === 'DESIGN_ONLY') {
    if (temporalInputs.some(Boolean)) {
      throw new TypeError('R0_PREVIEW_CONFIG_CONFLICT: Temporal coordinates are forbidden in DESIGN_ONLY mode');
    }
  } else {
    target = {
      address: temporalAddress(required(env, TALOS_PRIVATE_PREVIEW_ENV.temporalAddress)),
      namespace: temporalName(required(env, TALOS_PRIVATE_PREVIEW_ENV.temporalNamespace), 'Temporal namespace'),
      taskQueue: temporalName(required(env, TALOS_PRIVATE_PREVIEW_ENV.temporalTaskQueue), 'Temporal task queue'),
    };
  }

  const safeFields = {
    configVersion: TALOS_PRIVATE_PREVIEW_CONFIG_VERSION,
    workspaceId,
    actorId,
    bindHost,
    allowedHostnames,
    allowedOrigins,
    maxJsonBytes,
    maxImageBytes,
    authentication: 'BEARER_TOKEN' as const,
    accessSecretConfigured: true as const,
    accessSecretSource: 'ENVIRONMENT' as const,
    accessSecretEnvName: TALOS_PRIVATE_PREVIEW_ENV.bearerToken,
    imageMode,
    ...(imageProvider ? { imageProvider } : {}),
    runtimeMode,
    ...(target ? { temporalTarget: target } : {}),
  };
  const descriptor: Readonly<TalosPrivatePreviewRuntimeDescriptor> = Object.freeze({
    ...safeFields,
    configurationFingerprint: fingerprint(safeFields),
  });

  return Object.freeze({
    descriptor,
    createStartConfiguration(): TalosPrivatePreviewStartConfiguration {
      return {
        host: bindHost,
        access: { workspaceId, actorId, bearerToken },
        requestPolicy: {
          allowedHostnames: [...allowedHostnames],
          allowedOrigins: [...allowedOrigins],
          maxJsonBytes,
          maxImageBytes,
        },
        imagePerceptionEnv: { ...selectedImageEnv },
      };
    },
  });
}
