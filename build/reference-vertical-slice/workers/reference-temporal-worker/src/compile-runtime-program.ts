import { digestDeterministicJson } from '../../../packages/foundation/src/digest.ts';
import type { ReferenceExecutionBundle } from '../../../packages/execution/src/types.ts';
import type { ReferenceTemporalMappingBundle } from '../../../packages/temporal-design/src/types.ts';
import type { ReferenceRuntimePolicyBundle } from '../../../packages/runtime-policy/src/types.ts';
import type { ReferenceDeploymentBundle } from '../../../packages/deployment/src/types.ts';
import type { CompiledReferenceRuntimeProgram, TemporalSdkTarget } from './contracts.ts';

export function compileReferenceRuntimeProgram(
  execution: ReferenceExecutionBundle,
  mapping: ReferenceTemporalMappingBundle,
  policy: ReferenceRuntimePolicyBundle,
  deployment: ReferenceDeploymentBundle,
  sdkTarget: TemporalSdkTarget,
): CompiledReferenceRuntimeProgram {
  if (mapping.assessment.readiness !== 'READY_FOR_RUNTIME_POLICY_DESIGN') {
    throw new TypeError('reference runtime compilation requires READY_FOR_RUNTIME_POLICY_DESIGN mapping');
  }
  if (policy.assessment.readiness !== 'READY_FOR_DEPLOYMENT_DESIGN') {
    throw new TypeError('reference runtime compilation requires READY_FOR_DEPLOYMENT_DESIGN policy');
  }
  if (deployment.assessment.readiness !== 'INCOMPLETE_ENVIRONMENT_REALIZATION') {
    throw new TypeError('pre-SDK B7 compilation expects incomplete B6 environment realization');
  }
  if (
    policy.revision.executionPlanRevisionRef !== execution.revision.id
    || policy.revision.temporalMappingRevisionRef !== mapping.revision.id
    || deployment.revision.executionPlanRevisionRef !== execution.revision.id
    || deployment.revision.temporalMappingRevisionRef !== mapping.revision.id
    || deployment.revision.runtimePolicyRevisionRef !== policy.revision.id
  ) {
    throw new TypeError('reference runtime compilation upstream lineage mismatch');
  }

  const emailUse = execution.capabilityUses.find((use) =>
    execution.elements.some((element) => element.capabilityUseRefs.includes(use.id)
      && element.kind === 'CAPABILITY_INVOCATION')
  );
  if (!emailUse) throw new TypeError('reference email CapabilityUseOccurrence missing');

  const activityUnit = mapping.units.find((unit) =>
    unit.constructKind === 'ACTIVITY' && unit.executionSubjectRefs.includes(emailUse.id)
  );
  if (!activityUnit) throw new TypeError('reference email Activity mapping missing');

  const activityPolicy = policy.activityPolicies.find((item) => item.capabilityUseOccurrenceRef === emailUse.id);
  if (!activityPolicy) throw new TypeError('reference email Activity policy missing');
  const retry = policy.retryPolicies.find((item) => item.id === activityPolicy.retryPolicyRef);
  const timeout = policy.timeoutPolicies.find((item) => item.id === activityPolicy.timeoutPolicyRef);
  const idempotency = policy.idempotencyPolicies.find((item) => item.id === activityPolicy.idempotencyPolicyRef);
  if (!retry || !timeout || !idempotency) throw new TypeError('reference email material policy incomplete');

  const workflowRetry = policy.retryPolicies.find((item) => item.policySubjectRef === mapping.workflowBoundaries[0]?.id);
  if (!workflowRetry || workflowRetry.maximumAttempts !== 1) {
    throw new TypeError('reference Workflow maximumAttempts=1 policy missing');
  }

  const humanExecutionElement = execution.elements.find((element) => element.kind === 'HUMAN_COORDINATION');
  if (!humanExecutionElement) throw new TypeError('reference human execution subject missing');
  const humanKinds = new Set(
    mapping.units
      .filter((unit) => unit.executionSubjectRefs.includes(humanExecutionElement.id))
      .map((unit) => unit.constructKind),
  );
  if (!humanKinds.has('UPDATE_HANDLER') || !humanKinds.has('WORKFLOW_CONDITION')) {
    throw new TypeError('reference human Update + Workflow condition mapping missing');
  }

  const material = {
    sdkTarget,
    executionPlanRevisionRef: execution.revision.id,
    temporalMappingRevisionRef: mapping.revision.id,
    runtimePolicyRevisionRef: policy.revision.id,
    deploymentRevisionRef: deployment.revision.id,
    temporalFeatureProfileRef: mapping.featureProfile.id,
    workflow: {
      workflowTypeName: deployment.namingIntent.desiredWorkflowTypeName,
      reviewUpdateName: 'submitReferenceReviewDecision' as const,
      reviewWaitKind: 'WORKFLOW_CONDITION' as const,
      workflowMaximumAttempts: 1 as const,
    },
    activity: {
      activityTypeName: deployment.namingIntent.desiredActivityTypeName,
      temporalMappingUnitRef: activityUnit.id,
      capabilityUseOccurrenceRef: emailUse.id,
      retry: {
        initialIntervalMs: retry.initialIntervalMs!,
        backoffCoefficient: retry.backoffCoefficient!,
        maximumIntervalMs: retry.maximumIntervalMs!,
        maximumAttempts: retry.maximumAttempts!,
        nonRetryableErrorTypes: [...retry.nonRetryableFailureTypes],
      },
      timeout: {
        startToCloseMs: timeout.startToCloseMs!,
        scheduleToCloseMs: timeout.scheduleToCloseMs!,
      },
      idempotency: {
        strategyKind: 'IDEMPOTENCY_KEY' as const,
        keyContract: idempotency.keyContract,
        enforcementRef: idempotency.enforcementRef,
      },
    },
    deploymentIntent: {
      environmentClass: deployment.targetProfile.environmentClass as 'TEST',
      desiredNamespaceKey: deployment.namespaceResolution.desiredNamespaceKey,
      namespaceResolutionPolicy: deployment.namespaceResolution.resolutionPolicy,
      desiredTaskQueueKey: deployment.namingIntent.desiredTaskQueueKey,
      desiredWorkerLogicalName: deployment.namingIntent.desiredWorkerLogicalName,
      realizationState: 'INCOMPLETE_ENVIRONMENT_REALIZATION' as const,
    },
  };
  return {
    schemaVersion: 'talos.reference-runtime-program.v1',
    ...material,
    programDigest: digestDeterministicJson(material),
  };
}
