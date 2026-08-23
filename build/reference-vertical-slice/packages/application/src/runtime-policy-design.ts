import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { ReferenceRuntimePolicyBundle } from '../../runtime-policy/src/types.ts';

function append(
  repo: ImmutableDocumentRepository,
  kind: string,
  payload: any,
  fallbackAt: string,
): void {
  repo.append({
    id: payload.id,
    aggregateKind: kind,
    schemaVersion: 'i9-03-explicit-runtime-policy-v0.1',
    payload,
    createdAt: payload.createdAt ?? payload.assessedAt ?? fallbackAt,
  });
}

/**
 * Persist only explicit RuntimePolicy design artifacts. This boundary does not
 * create Deployment or runtime execution authority.
 */
export function persistExplicitRuntimePolicyDesign(
  repo: ImmutableDocumentRepository,
  policy: ReferenceRuntimePolicyBundle,
): void {
  const at = policy.revision.createdAt;
  const records: Array<[string, any]> = [
    ['RuntimePolicyRevision', policy.revision],
    ...policy.activityPolicies.map((item) => ['ActivityExecutionPolicy', item] as [string, any]),
    ...policy.retryPolicies.map((item) => ['RetryPolicyDesign', item] as [string, any]),
    ...policy.timeoutPolicies.map((item) => ['TimeoutPolicyDesign', item] as [string, any]),
    ...policy.idempotencyPolicies.map((item) => ['IdempotencyPolicyDesign', item] as [string, any]),
    ...policy.failurePolicies.map((item) => ['FailureClassificationPolicy', item] as [string, any]),
    ['TemporalDefaultBehaviorProfile', policy.defaultProfile],
    ...policy.defaultEntries.map((item) => ['TemporalDefaultBehaviorEntry', item] as [string, any]),
    ...policy.defaultAcceptances.map((item) => ['TemporalDefaultAcceptance', item] as [string, any]),
    ...policy.facets.map((item) => ['RuntimePolicyFacet', item] as [string, any]),
    ['RuntimePolicyAssessment', policy.assessment],
  ];
  for (const [kind, payload] of records) append(repo, kind, payload, at);
}
