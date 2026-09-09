import type { ImagePerceptionProviderResult } from './perception-types.ts';

export const IMAGE_PERCEPTION_SUFFICIENCY_POLICY_VERSION = 'talos-image-perception-sufficiency-v0.2';

export interface ImagePerceptionSufficiencyPolicy {
  minimumConfidence?: number;
  requireKnownRelationDirection?: boolean;
  requireResolvedRelationEndpoints?: boolean;
  requireBusinessSemanticType?: boolean;
  requireConnectedBusinessFlow?: boolean;
}

export interface ImagePerceptionSufficiencyAssessment {
  policyVersion: typeof IMAGE_PERCEPTION_SUFFICIENCY_POLICY_VERSION;
  status: 'SUFFICIENT' | 'INSUFFICIENT';
  reasonCodes: string[];
  minimumConfidence: number;
}

const UNCERTAINTY_DIAGNOSTIC = /(AMBIG|UNCERTAIN|LOW[_ -]?CONF|UNRESOLVED|INCOMPLETE|ILLEGIBLE|OBSCUR|UNKNOWN|PARTIAL|MISSING)/i;

function add(reasons: Set<string>, condition: boolean, code: string): void {
  if (condition) reasons.add(code);
}

function below(value: number | undefined, minimum: number): boolean {
  return value !== undefined && value < minimum;
}

function uniqueResolvedEndpointKey(
  candidates: ImagePerceptionProviderResult['relationCandidates'][number]['sourceEndpointCandidates'],
): string | undefined {
  const resolved = candidates.filter((item) =>
    item.endpointState === 'SET_CANDIDATE' && Boolean(item.occurrenceCandidateKey),
  );
  return resolved.length === 1 ? resolved[0].occurrenceCandidateKey : undefined;
}

function assessBusinessGraphConnectivity(
  result: ImagePerceptionProviderResult,
  reasons: Set<string>,
  businessOccurrences: ImagePerceptionProviderResult['occurrenceCandidates'],
): void {
  if (businessOccurrences.length <= 1) return;

  const businessKeys = new Set(businessOccurrences.map((item) => item.providerOccurrenceKey));
  const adjacency = new Map<string, Set<string>>(
    [...businessKeys].map((key) => [key, new Set<string>()]),
  );
  const incoming = new Map<string, number>([...businessKeys].map((key) => [key, 0]));
  const outgoing = new Map<string, number>([...businessKeys].map((key) => [key, 0]));

  for (const relation of result.relationCandidates) {
    const source = uniqueResolvedEndpointKey(relation.sourceEndpointCandidates);
    const target = uniqueResolvedEndpointKey(relation.targetEndpointCandidates);
    if (!source || !target || !businessKeys.has(source) || !businessKeys.has(target)) continue;

    adjacency.get(source)!.add(target);
    adjacency.get(target)!.add(source);

    const knownDirections = relation.directionCandidates.filter((item) => item.value !== 'UNKNOWN');
    if (knownDirections.length !== 1) continue;
    const direction = knownDirections[0].value;
    if (direction === 'SOURCE_TO_TARGET') {
      outgoing.set(source, (outgoing.get(source) ?? 0) + 1);
      incoming.set(target, (incoming.get(target) ?? 0) + 1);
    } else if (direction === 'TARGET_TO_SOURCE') {
      outgoing.set(target, (outgoing.get(target) ?? 0) + 1);
      incoming.set(source, (incoming.get(source) ?? 0) + 1);
    } else if (direction === 'BIDIRECTIONAL') {
      outgoing.set(source, (outgoing.get(source) ?? 0) + 1);
      outgoing.set(target, (outgoing.get(target) ?? 0) + 1);
      incoming.set(source, (incoming.get(source) ?? 0) + 1);
      incoming.set(target, (incoming.get(target) ?? 0) + 1);
    }
  }

  const unseen = new Set(businessKeys);
  let components = 0;
  while (unseen.size > 0) {
    components += 1;
    const first = unseen.values().next().value as string;
    const stack = [first];
    unseen.delete(first);
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const next of adjacency.get(current) ?? []) {
        if (!unseen.has(next)) continue;
        unseen.delete(next);
        stack.push(next);
      }
    }
  }
  add(reasons, components > 1, 'DISCONNECTED_BUSINESS_GRAPH');

  const endOccurrences = businessOccurrences.filter((item) => item.candidateSemanticType === 'END');
  for (const end of endOccurrences) {
    add(reasons, (incoming.get(end.providerOccurrenceKey) ?? 0) === 0, 'END_WITHOUT_INCOMING_RELATION');
  }

  if (endOccurrences.length > 0) {
    for (const occurrence of businessOccurrences) {
      if (occurrence.candidateSemanticType === 'END') continue;
      add(
        reasons,
        (outgoing.get(occurrence.providerOccurrenceKey) ?? 0) === 0,
        'NON_TERMINAL_WITHOUT_OUTGOING_RELATION',
      );
    }
  }
}

/**
 * Talos-owned deterministic gate for deciding whether a primary image
 * perception attempt is strong enough to continue without a second provider.
 *
 * This deliberately does not ask the model whether it "feels confident".
 * It inspects the structured evidence contract: status, visibility, business
 * occurrences, endpoint resolution, relation direction, graph connectivity,
 * alternatives, diagnostics and any supplied numeric confidence values.
 */
export function assessImagePerceptionSufficiency(
  result: ImagePerceptionProviderResult,
  policy: ImagePerceptionSufficiencyPolicy = {},
): ImagePerceptionSufficiencyAssessment {
  const minimum = policy.minimumConfidence ?? 0.70;
  if (!Number.isFinite(minimum) || minimum < 0 || minimum > 1) {
    throw new TypeError('IMAGE_PERCEPTION_SUFFICIENCY_POLICY_INVALID: minimumConfidence must be between 0 and 1');
  }

  const requireDirection = policy.requireKnownRelationDirection ?? true;
  const requireEndpoints = policy.requireResolvedRelationEndpoints ?? true;
  const requireBusinessSemanticType = policy.requireBusinessSemanticType ?? true;
  const requireConnectedBusinessFlow = policy.requireConnectedBusinessFlow ?? true;
  const reasons = new Set<string>();

  add(reasons, result.status !== 'SUCCEEDED', `PRIMARY_PROVIDER_STATUS_${result.status}`);
  add(reasons, result.occurrenceCandidates.length === 0, 'NO_OCCURRENCE_CANDIDATES');

  for (const anchor of result.anchors) {
    add(reasons, anchor.visibilityState !== 'VISIBLE', `VISIBILITY_${anchor.visibilityState}`);
  }

  const businessOccurrences = result.occurrenceCandidates.filter((item) => item.sourcePlaneKind === 'BUSINESS_GRAPH');
  add(reasons, businessOccurrences.length === 0, 'NO_BUSINESS_GRAPH_OCCURRENCES');

  for (const occurrence of businessOccurrences) {
    add(reasons, occurrence.anchorKeys.length === 0, 'BUSINESS_OCCURRENCE_WITHOUT_ANCHOR');
    add(reasons, occurrence.supportingObservationKeys.length === 0, 'BUSINESS_OCCURRENCE_WITHOUT_SUPPORTING_OBSERVATION');
    add(reasons, requireBusinessSemanticType && !occurrence.candidateSemanticType?.trim(), 'BUSINESS_OCCURRENCE_WITHOUT_SEMANTIC_TYPE');
    add(reasons, below(occurrence.confidence, minimum), 'BUSINESS_OCCURRENCE_LOW_CONFIDENCE');
  }

  if (businessOccurrences.length > 1) {
    add(reasons, result.relationCandidates.length === 0, 'MULTI_NODE_GRAPH_WITHOUT_RELATIONS');
  }

  for (const relation of result.relationCandidates) {
    add(reasons, relation.strokeObservationKeys.length === 0, 'RELATION_WITHOUT_STROKE_EVIDENCE');
    add(reasons, relation.anchorKeys.length === 0, 'RELATION_WITHOUT_ANCHOR');
    add(reasons, below(relation.existenceConfidence, minimum), 'RELATION_LOW_EXISTENCE_CONFIDENCE');

    if (requireEndpoints) {
      const resolvedSources = relation.sourceEndpointCandidates.filter((item) => item.endpointState === 'SET_CANDIDATE' && Boolean(item.occurrenceCandidateKey));
      const resolvedTargets = relation.targetEndpointCandidates.filter((item) => item.endpointState === 'SET_CANDIDATE' && Boolean(item.occurrenceCandidateKey));
      add(reasons, resolvedSources.length !== 1, 'RELATION_SOURCE_ENDPOINT_UNRESOLVED');
      add(reasons, resolvedTargets.length !== 1, 'RELATION_TARGET_ENDPOINT_UNRESOLVED');
      add(reasons, relation.sourceEndpointCandidates.some((item) => item.endpointState !== 'SET_CANDIDATE'), 'RELATION_SOURCE_ENDPOINT_AMBIGUOUS');
      add(reasons, relation.targetEndpointCandidates.some((item) => item.endpointState !== 'SET_CANDIDATE'), 'RELATION_TARGET_ENDPOINT_AMBIGUOUS');
      add(reasons, relation.sourceEndpointCandidates.some((item) => below(item.confidence, minimum)), 'RELATION_SOURCE_ENDPOINT_LOW_CONFIDENCE');
      add(reasons, relation.targetEndpointCandidates.some((item) => below(item.confidence, minimum)), 'RELATION_TARGET_ENDPOINT_LOW_CONFIDENCE');
    }

    if (requireDirection) {
      const known = relation.directionCandidates.filter((item) => item.value !== 'UNKNOWN');
      add(reasons, known.length !== 1, 'RELATION_DIRECTION_UNRESOLVED');
      add(reasons, relation.directionCandidates.some((item) => item.value === 'UNKNOWN'), 'RELATION_DIRECTION_AMBIGUOUS');
      add(reasons, known.some((item) => below(item.confidence, minimum)), 'RELATION_DIRECTION_LOW_CONFIDENCE');
    }
  }

  if (requireConnectedBusinessFlow) {
    assessBusinessGraphConnectivity(result, reasons, businessOccurrences);
  }

  for (const set of result.alternativeSets) {
    if (set.alternatives.length <= 1) continue;
    add(reasons, !set.modelPreferredAlternativeKey, 'MULTI_ALTERNATIVE_WITHOUT_PREFERENCE');
    add(reasons, below(set.modelPreferenceConfidence, minimum), 'MULTI_ALTERNATIVE_LOW_PREFERENCE_CONFIDENCE');
  }

  for (const diagnostic of result.diagnostics) {
    if (UNCERTAINTY_DIAGNOSTIC.test(`${diagnostic.code} ${diagnostic.description}`)) {
      reasons.add('PROVIDER_DIAGNOSTIC_SIGNALS_UNCERTAINTY');
    }
  }

  return {
    policyVersion: IMAGE_PERCEPTION_SUFFICIENCY_POLICY_VERSION,
    status: reasons.size === 0 ? 'SUFFICIENT' : 'INSUFFICIENT',
    reasonCodes: [...reasons].sort(),
    minimumConfidence: minimum,
  };
}
