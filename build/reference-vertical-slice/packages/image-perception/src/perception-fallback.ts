import { createOpaqueId, type OpaqueId } from '../../foundation/src/ids.ts';
import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import { runCorrelatedConfiguredImagePerceptionAdmission } from './correlated-http-provider.ts';
import type { ImagePerceptionAdmissionBundle, RunImagePerceptionAdmissionOptions } from './admission.ts';
import type { LocalImageByteStore } from './byte-store.ts';
import type { ImagePerceptionRuntimeBinding } from './runtime-provider-config.ts';
import type { ImageIntakeBundle } from './types.ts';
import {
  assessImagePerceptionSufficiency,
  type ImagePerceptionSufficiencyAssessment,
  type ImagePerceptionSufficiencyPolicy,
} from './perception-sufficiency.ts';

export const IMAGE_PERCEPTION_FALLBACK_ROUTING_SCHEMA = 'talos-image-perception-fallback-routing-v0.1';

export type ImagePerceptionFallbackRoutingDecision =
  | 'PRIMARY_ACCEPTED'
  | 'FALLBACK_ACCEPTED'
  | 'UNRESOLVED_AFTER_FALLBACK';

export interface ImagePerceptionFallbackRoutingRecord {
  id: OpaqueId;
  schemaVersion: typeof IMAGE_PERCEPTION_FALLBACK_ROUTING_SCHEMA;
  sourceRepresentationId: string;
  sourceContentSha256: string;
  primaryProviderId: string;
  primaryAttemptId: string;
  primaryAssessment: ImagePerceptionSufficiencyAssessment;
  fallbackProviderId?: string;
  fallbackAttemptId?: string;
  fallbackAssessment?: ImagePerceptionSufficiencyAssessment;
  selectedAttemptId?: string;
  selectedProviderId?: string;
  decision: ImagePerceptionFallbackRoutingDecision;
  automaticFallbackTriggered: boolean;
  semanticAuthority: 'NONE';
  automaticConfirmationAuthorized: false;
  automaticFreezeAuthorized: false;
  automaticExecutionAuthorized: false;
  routedAt: string;
}

export interface RunImagePerceptionWithFallbackOptions extends RunImagePerceptionAdmissionOptions {
  sufficiencyPolicy?: ImagePerceptionSufficiencyPolicy;
  primaryFetch?: typeof fetch;
  fallbackFetch?: typeof fetch;
}

export interface ImagePerceptionFallbackRoutingBundle {
  primary: ImagePerceptionAdmissionBundle;
  fallback?: ImagePerceptionAdmissionBundle;
  selected?: ImagePerceptionAdmissionBundle;
  routing: ImagePerceptionFallbackRoutingRecord;
}

function persistRouting(repo: ImmutableDocumentRepository, record: ImagePerceptionFallbackRoutingRecord): void {
  repo.append({
    id: record.id,
    aggregateKind: 'ImagePerceptionFallbackRoutingRecord',
    schemaVersion: IMAGE_PERCEPTION_FALLBACK_ROUTING_SCHEMA,
    payload: record,
    createdAt: record.routedAt,
  });
}

function routingId(intake: ImageIntakeBundle, primaryAttemptId: string, fallbackAttemptId?: string): OpaqueId {
  return createOpaqueId('source', `image-perception-fallback-routing:${intake.representation.id}:${primaryAttemptId}:${fallbackAttemptId ?? 'none'}`);
}

/**
 * Gemini-first / local-second routing contract.
 *
 * Talos always runs the configured primary provider first. Only Talos' own
 * deterministic sufficiency gate may trigger the fallback. The primary model
 * cannot self-authorize continuation and the fallback cannot create business or
 * execution authority. If both attempts remain insufficient, this function
 * returns no selected attempt so canonical normalization must not proceed.
 */
export async function runCorrelatedImagePerceptionWithFallback(
  repo: ImmutableDocumentRepository,
  byteStore: LocalImageByteStore,
  intake: ImageIntakeBundle,
  primaryBinding: ImagePerceptionRuntimeBinding,
  fallbackBinding: ImagePerceptionRuntimeBinding,
  options: RunImagePerceptionWithFallbackOptions = {},
): Promise<ImagePerceptionFallbackRoutingBundle> {
  const routedAt = options.admissionAt ?? options.now ?? new Date().toISOString();
  const primary = await runCorrelatedConfiguredImagePerceptionAdmission(
    repo,
    byteStore,
    intake,
    primaryBinding,
    options,
    options.primaryFetch ?? fetch,
  );
  const primaryAssessment = assessImagePerceptionSufficiency(primary.providerResult, options.sufficiencyPolicy);

  if (primary.admission.decision === 'ADMITTED_FOR_REVIEW' && primaryAssessment.status === 'SUFFICIENT') {
    const routing: ImagePerceptionFallbackRoutingRecord = {
      id: routingId(intake, primary.attempt.start.id),
      schemaVersion: IMAGE_PERCEPTION_FALLBACK_ROUTING_SCHEMA,
      sourceRepresentationId: intake.representation.id,
      sourceContentSha256: intake.representation.contentHash,
      primaryProviderId: primaryBinding.descriptor.providerId,
      primaryAttemptId: primary.attempt.start.id,
      primaryAssessment,
      selectedAttemptId: primary.attempt.start.id,
      selectedProviderId: primaryBinding.descriptor.providerId,
      decision: 'PRIMARY_ACCEPTED',
      automaticFallbackTriggered: false,
      semanticAuthority: 'NONE',
      automaticConfirmationAuthorized: false,
      automaticFreezeAuthorized: false,
      automaticExecutionAuthorized: false,
      routedAt,
    };
    persistRouting(repo, routing);
    return { primary, selected: primary, routing };
  }

  const fallback = await runCorrelatedConfiguredImagePerceptionAdmission(
    repo,
    byteStore,
    intake,
    fallbackBinding,
    options,
    options.fallbackFetch ?? fetch,
  );
  const fallbackAssessment = assessImagePerceptionSufficiency(fallback.providerResult, options.sufficiencyPolicy);
  const fallbackAccepted = fallback.admission.decision === 'ADMITTED_FOR_REVIEW' && fallbackAssessment.status === 'SUFFICIENT';

  const routing: ImagePerceptionFallbackRoutingRecord = {
    id: routingId(intake, primary.attempt.start.id, fallback.attempt.start.id),
    schemaVersion: IMAGE_PERCEPTION_FALLBACK_ROUTING_SCHEMA,
    sourceRepresentationId: intake.representation.id,
    sourceContentSha256: intake.representation.contentHash,
    primaryProviderId: primaryBinding.descriptor.providerId,
    primaryAttemptId: primary.attempt.start.id,
    primaryAssessment,
    fallbackProviderId: fallbackBinding.descriptor.providerId,
    fallbackAttemptId: fallback.attempt.start.id,
    fallbackAssessment,
    ...(fallbackAccepted ? {
      selectedAttemptId: fallback.attempt.start.id,
      selectedProviderId: fallbackBinding.descriptor.providerId,
    } : {}),
    decision: fallbackAccepted ? 'FALLBACK_ACCEPTED' : 'UNRESOLVED_AFTER_FALLBACK',
    automaticFallbackTriggered: true,
    semanticAuthority: 'NONE',
    automaticConfirmationAuthorized: false,
    automaticFreezeAuthorized: false,
    automaticExecutionAuthorized: false,
    routedAt,
  };
  persistRouting(repo, routing);

  return fallbackAccepted
    ? { primary, fallback, selected: fallback, routing }
    : { primary, fallback, routing };
}
