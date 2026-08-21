import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { ImageIntakeBundle } from './types.ts';
import type { LocalImageByteStore } from './byte-store.ts';
import {
  runAsyncHttpImagePerceptionAdmission,
  type AsyncHttpImagePerceptionProviderConfig,
} from './async-http-provider.ts';
import type {
  ImagePerceptionAdmissionBundle,
  RunImagePerceptionAdmissionOptions,
} from './admission.ts';

export const IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION = 'talos-image-perception-runtime-config-v0.1';

export const IMAGE_PERCEPTION_RUNTIME_ENV = {
  endpoint: 'TALOS_IMAGE_PERCEPTION_PROVIDER_URL',
  providerId: 'TALOS_IMAGE_PERCEPTION_PROVIDER_ID',
  providerVersion: 'TALOS_IMAGE_PERCEPTION_PROVIDER_VERSION',
  modelRef: 'TALOS_IMAGE_PERCEPTION_MODEL_REF',
  modelVersion: 'TALOS_IMAGE_PERCEPTION_MODEL_VERSION',
  pipelineVersion: 'TALOS_IMAGE_PERCEPTION_PIPELINE_VERSION',
  timeoutMs: 'TALOS_IMAGE_PERCEPTION_TIMEOUT_MS',
  bearerToken: 'TALOS_IMAGE_PERCEPTION_BEARER_TOKEN',
} as const;

export interface ImagePerceptionRuntimeDescriptor {
  configVersion: typeof IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION;
  endpoint: string;
  providerId: string;
  providerVersion: string;
  modelRef: string;
  modelVersion: string;
  pipelineVersion: string;
  timeoutMs: number;
  authMode: 'NONE' | 'BEARER';
  authConfigured: boolean;
  configurationFingerprint: string;
}

export interface ImagePerceptionRuntimeBinding {
  readonly descriptor: Readonly<ImagePerceptionRuntimeDescriptor>;
  createTransportConfig(fetchImpl?: typeof fetch): AsyncHttpImagePerceptionProviderConfig;
}

export type ImagePerceptionRuntimeResolution =
  | {
      status: 'DISABLED';
      reason: 'ENDPOINT_NOT_CONFIGURED';
      configVersion: typeof IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION;
    }
  | {
      status: 'CONFIGURED';
      binding: ImagePerceptionRuntimeBinding;
    };

type Environment = Readonly<Record<string, string | undefined>>;

function optional(env: Environment, name: string): string | undefined {
  const value = env[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function required(env: Environment, name: string): string {
  const value = optional(env, name);
  if (!value) throw new TypeError(`IMAGE_PERCEPTION_RUNTIME_CONFIG_MISSING: ${name}`);
  return value;
}

function normalizedEndpoint(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new TypeError('IMAGE_PERCEPTION_RUNTIME_CONFIG_INVALID: provider URL must be an absolute URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('IMAGE_PERCEPTION_RUNTIME_CONFIG_INVALID: provider URL must use http or https');
  }
  if (url.username || url.password) {
    throw new TypeError('IMAGE_PERCEPTION_RUNTIME_CONFIG_INVALID: credentials are forbidden in provider URL authority');
  }
  if (url.search) {
    throw new TypeError('IMAGE_PERCEPTION_RUNTIME_CONFIG_INVALID: provider URL query parameters are forbidden');
  }
  if (url.hash) {
    throw new TypeError('IMAGE_PERCEPTION_RUNTIME_CONFIG_INVALID: provider URL fragments are forbidden');
  }
  return url.toString();
}

function timeoutMs(env: Environment): number {
  const raw = optional(env, IMAGE_PERCEPTION_RUNTIME_ENV.timeoutMs);
  if (!raw) return 30_000;
  if (!/^\d+$/.test(raw)) {
    throw new TypeError('IMAGE_PERCEPTION_RUNTIME_CONFIG_INVALID: timeout must be an integer number of milliseconds');
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1_000 || value > 120_000) {
    throw new TypeError('IMAGE_PERCEPTION_RUNTIME_CONFIG_INVALID: timeout must be between 1000 and 120000 milliseconds');
  }
  return value;
}

function secretToken(env: Environment): string | undefined {
  const raw = env[IMAGE_PERCEPTION_RUNTIME_ENV.bearerToken];
  if (raw === undefined) return undefined;
  if (!raw.trim()) {
    throw new TypeError('IMAGE_PERCEPTION_RUNTIME_CONFIG_INVALID: bearer token cannot be blank when configured');
  }
  return raw.trim();
}

/**
 * Resolve the real image-perception provider without ever returning secret
 * material in the public descriptor. The bearer token remains closure-held and
 * is injected only when the transient HTTP transport config is requested.
 */
export function resolveImagePerceptionRuntimeBinding(
  env: Environment = process.env,
): ImagePerceptionRuntimeResolution {
  const endpointRaw = optional(env, IMAGE_PERCEPTION_RUNTIME_ENV.endpoint);
  if (!endpointRaw) {
    return {
      status: 'DISABLED',
      reason: 'ENDPOINT_NOT_CONFIGURED',
      configVersion: IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION,
    };
  }

  const endpoint = normalizedEndpoint(endpointRaw);
  const providerId = required(env, IMAGE_PERCEPTION_RUNTIME_ENV.providerId);
  const providerVersion = required(env, IMAGE_PERCEPTION_RUNTIME_ENV.providerVersion);
  const modelRef = required(env, IMAGE_PERCEPTION_RUNTIME_ENV.modelRef);
  const modelVersion = required(env, IMAGE_PERCEPTION_RUNTIME_ENV.modelVersion);
  const pipelineVersion = required(env, IMAGE_PERCEPTION_RUNTIME_ENV.pipelineVersion);
  const resolvedTimeoutMs = timeoutMs(env);
  const bearerToken = secretToken(env);
  const safeFields = {
    configVersion: IMAGE_PERCEPTION_RUNTIME_CONFIG_VERSION,
    endpoint,
    providerId,
    providerVersion,
    modelRef,
    modelVersion,
    pipelineVersion,
    timeoutMs: resolvedTimeoutMs,
    authMode: bearerToken ? 'BEARER' as const : 'NONE' as const,
    authConfigured: Boolean(bearerToken),
  };
  const descriptor: ImagePerceptionRuntimeDescriptor = Object.freeze({
    ...safeFields,
    configurationFingerprint: digestDeterministicJson({
      kind: 'ImagePerceptionRuntimeDescriptor',
      ...safeFields,
    }),
  });

  const binding: ImagePerceptionRuntimeBinding = Object.freeze({
    descriptor,
    createTransportConfig(fetchImpl?: typeof fetch): AsyncHttpImagePerceptionProviderConfig {
      return {
        endpoint: descriptor.endpoint,
        providerId: descriptor.providerId,
        providerVersion: descriptor.providerVersion,
        modelRef: descriptor.modelRef,
        modelVersion: descriptor.modelVersion,
        pipelineVersion: descriptor.pipelineVersion,
        timeoutMs: descriptor.timeoutMs,
        ...(bearerToken ? { headers: { authorization: `Bearer ${bearerToken}` } } : {}),
        ...(fetchImpl ? { fetchImpl } : {}),
      };
    },
  });

  return { status: 'CONFIGURED', binding };
}

export async function runConfiguredImagePerceptionAdmission(
  repo: ImmutableDocumentRepository,
  byteStore: LocalImageByteStore,
  intake: ImageIntakeBundle,
  binding: ImagePerceptionRuntimeBinding,
  options: RunImagePerceptionAdmissionOptions = {},
): Promise<ImagePerceptionAdmissionBundle> {
  return runAsyncHttpImagePerceptionAdmission(
    repo,
    byteStore,
    intake,
    binding.createTransportConfig(),
    options,
  );
}
