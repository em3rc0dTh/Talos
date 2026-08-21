import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { ImagePerceptionAdmissionBundle, RunImagePerceptionAdmissionOptions } from './admission.ts';
import { runAsyncHttpImagePerceptionAdmission, type AsyncImagePerceptionTransportEnvelope } from './async-http-provider.ts';
import type { LocalImageByteStore } from './byte-store.ts';
import type { ImagePerceptionRuntimeBinding } from './runtime-provider-config.ts';
import type { ImageIntakeBundle } from './types.ts';

export const IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION = 'talos-image-perception-correlation-v0.1';

export interface ImagePerceptionResponseCorrelation {
  schemaVersion: typeof IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION;
  sourceRepresentationId: string;
  contentSha256: string;
  coordinateSpace: {
    width: number;
    height: number;
    basis: string;
    orientation: string;
    originConvention: string;
  };
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`IMAGE_PERCEPTION_RESPONSE_CORRELATION_INVALID: ${path}: expected object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`IMAGE_PERCEPTION_RESPONSE_CORRELATION_INVALID: ${path}: expected non-empty string`);
  }
  return value;
}

function requiredNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`IMAGE_PERCEPTION_RESPONSE_CORRELATION_INVALID: ${path}: expected finite number`);
  }
  return value;
}

function expectedCorrelation(envelope: AsyncImagePerceptionTransportEnvelope): ImagePerceptionResponseCorrelation {
  return {
    schemaVersion: IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
    sourceRepresentationId: envelope.sourceRepresentationId,
    contentSha256: envelope.contentSha256,
    coordinateSpace: {
      width: envelope.coordinateSpace.width,
      height: envelope.coordinateSpace.height,
      basis: envelope.coordinateSpace.basis,
      orientation: envelope.coordinateSpace.orientation,
      originConvention: envelope.coordinateSpace.originConvention,
    },
  };
}

function validateCorrelation(raw: unknown, expected: ImagePerceptionResponseCorrelation): void {
  const value = record(raw, 'response.requestCorrelation');
  const coordinate = record(value.coordinateSpace, 'response.requestCorrelation.coordinateSpace');
  const actual: ImagePerceptionResponseCorrelation = {
    schemaVersion: requiredString(value.schemaVersion, 'response.requestCorrelation.schemaVersion') as typeof IMAGE_PERCEPTION_RESPONSE_CORRELATION_VERSION,
    sourceRepresentationId: requiredString(value.sourceRepresentationId, 'response.requestCorrelation.sourceRepresentationId'),
    contentSha256: requiredString(value.contentSha256, 'response.requestCorrelation.contentSha256'),
    coordinateSpace: {
      width: requiredNumber(coordinate.width, 'response.requestCorrelation.coordinateSpace.width'),
      height: requiredNumber(coordinate.height, 'response.requestCorrelation.coordinateSpace.height'),
      basis: requiredString(coordinate.basis, 'response.requestCorrelation.coordinateSpace.basis'),
      orientation: requiredString(coordinate.orientation, 'response.requestCorrelation.coordinateSpace.orientation'),
      originConvention: requiredString(coordinate.originConvention, 'response.requestCorrelation.coordinateSpace.originConvention'),
    },
  };

  if (actual.schemaVersion !== expected.schemaVersion) throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_MISMATCH: schemaVersion');
  if (actual.sourceRepresentationId !== expected.sourceRepresentationId) throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_MISMATCH: sourceRepresentationId');
  if (actual.contentSha256 !== expected.contentSha256) throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_MISMATCH: contentSha256');
  if (actual.coordinateSpace.width !== expected.coordinateSpace.width) throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_MISMATCH: coordinateSpace.width');
  if (actual.coordinateSpace.height !== expected.coordinateSpace.height) throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_MISMATCH: coordinateSpace.height');
  if (actual.coordinateSpace.basis !== expected.coordinateSpace.basis) throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_MISMATCH: coordinateSpace.basis');
  if (actual.coordinateSpace.orientation !== expected.coordinateSpace.orientation) throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_MISMATCH: coordinateSpace.orientation');
  if (actual.coordinateSpace.originConvention !== expected.coordinateSpace.originConvention) throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_MISMATCH: coordinateSpace.originConvention');
}

function requestEnvelope(init?: RequestInit): AsyncImagePerceptionTransportEnvelope {
  if (!init || typeof init.body !== 'string') {
    throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_INVALID: outbound request body must be JSON string');
  }
  const parsed = JSON.parse(init.body) as AsyncImagePerceptionTransportEnvelope;
  if (parsed.schemaVersion !== 'talos-image-perception-request-v0.1') {
    throw new TypeError('IMAGE_PERCEPTION_RESPONSE_CORRELATION_INVALID: unexpected request schema');
  }
  return parsed;
}

/**
 * Wrap an HTTP fetch so that successful model-provider responses must echo the
 * exact image identity and coordinate space of the request before the existing
 * I7B-01 untrusted-response validator may see the payload.
 */
export function createCorrelatedImagePerceptionFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const envelope = requestEnvelope(init);
    const response = await baseFetch(input, init);
    if (!response.ok) return response;

    const payload = await response.json();
    const responseObject = record(payload, 'response');
    validateCorrelation(responseObject.requestCorrelation, expectedCorrelation(envelope));

    return new Response(JSON.stringify(payload), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }) as typeof fetch;
}

export async function runCorrelatedConfiguredImagePerceptionAdmission(
  repo: ImmutableDocumentRepository,
  byteStore: LocalImageByteStore,
  intake: ImageIntakeBundle,
  binding: ImagePerceptionRuntimeBinding,
  options: RunImagePerceptionAdmissionOptions = {},
  baseFetch: typeof fetch = fetch,
): Promise<ImagePerceptionAdmissionBundle> {
  return runAsyncHttpImagePerceptionAdmission(
    repo,
    byteStore,
    intake,
    binding.createTransportConfig(createCorrelatedImagePerceptionFetch(baseFetch)),
    options,
  );
}
