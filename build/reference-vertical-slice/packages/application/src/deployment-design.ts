import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { ReferenceDeploymentBundle } from '../../deployment/src/types.ts';

function append(
  repo: ImmutableDocumentRepository,
  aggregateKind: string,
  payload: any,
  fallbackAt: string,
  schemaVersion = 'i9-04-deployment-design-v0.1',
): void {
  repo.append({
    id: payload.id,
    aggregateKind,
    schemaVersion,
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

/**
 * Persists the child deployment revision that records environment realization.
 *
 * The immutable DeploymentDefinition created by I9-04 is intentionally not
 * rewritten. Current state is established by DeploymentRevision parentage and
 * the concrete realization/binding records below. DeploymentAttempt and
 * WorkflowExecutionObservation remain absent until a later authority gate.
 */
export function persistOneAppDeploymentRealization(
  repo: ImmutableDocumentRepository,
  deployment: ReferenceDeploymentBundle,
): void {
  const at = deployment.revision.createdAt;
  const records: Array<[string, any]> = [
    ['DeploymentRevision', deployment.revision],
    ['DeploymentTargetProfile', deployment.targetProfile],
    ['TemporalNamespaceResolutionContract', deployment.namespaceResolution],
    ['TemporalNamespaceBinding', deployment.namespaceBinding],
    ['ReferenceDeploymentNamingIntent', deployment.namingIntent],
    ...deployment.environmentRealizations.map((item) => ['EnvironmentBindingRealization', item] as [string, any]),
    ...deployment.taskQueueBindings.map((item) => ['TaskQueueBinding', item] as [string, any]),
    ...deployment.workflowTypeBindings.map((item) => ['WorkflowTypeBinding', item] as [string, any]),
    ...deployment.activityTypeBindings.map((item) => ['ActivityTypeBinding', item] as [string, any]),
    ...deployment.workerArtifactBindings.map((item) => ['WorkerArtifactBinding', item] as [string, any]),
    ...deployment.requirements.map((item) => ['DeploymentRequirement', item] as [string, any]),
    ['DeploymentAssessment', deployment.assessment],
  ];
  for (const [kind, payload] of records) append(repo, kind, payload, at, 'i9-05-environment-realization-v0.1');
}
