import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { ReferenceDeploymentBundle } from '../../deployment/src/types.ts';

function append(
  repo: ImmutableDocumentRepository,
  aggregateKind: string,
  payload: any,
  fallbackAt: string,
): void {
  repo.append({
    id: payload.id,
    aggregateKind,
    schemaVersion: 'i9-04-deployment-design-v0.1',
    payload,
    createdAt: payload.createdAt ?? payload.assessedAt ?? fallbackAt,
  });
}

/**
 * Persists deployment DESIGN only.
 *
 * Environment realization, concrete Task Queue / Workflow / Activity bindings,
 * Worker artifacts, deployment attempts, observations and workflow executions
 * are intentionally excluded. A design revision is not evidence that anything
 * was deployed or can execute.
 */
export function persistOneAppDeploymentDesign(
  repo: ImmutableDocumentRepository,
  deployment: ReferenceDeploymentBundle,
): void {
  const at = deployment.revision.createdAt;
  const records: Array<[string, any]> = [
    ['DeploymentDefinition', deployment.definition],
    ['DeploymentRevision', deployment.revision],
    ['DeploymentTargetProfile', deployment.targetProfile],
    ['TemporalNamespaceResolutionContract', deployment.namespaceResolution],
    ['TemporalNamespaceBinding', deployment.namespaceBinding],
    ['ReferenceDeploymentNamingIntent', deployment.namingIntent],
    ...deployment.requirements.map((item) => ['DeploymentRequirement', item] as [string, any]),
    ['DeploymentAssessment', deployment.assessment],
  ];
  for (const [kind, payload] of records) append(repo, kind, payload, at);
}
