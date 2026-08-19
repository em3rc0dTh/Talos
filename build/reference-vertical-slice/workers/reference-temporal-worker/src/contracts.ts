export interface TemporalSdkTarget {
  family: 'TEMPORAL_TYPESCRIPT_SDK';
  version: string;
}

export interface CompiledReferenceActivityPolicy {
  activityTypeName: string;
  temporalMappingUnitRef: string;
  capabilityUseOccurrenceRef: string;
  retry: {
    initialIntervalMs: number;
    backoffCoefficient: number;
    maximumIntervalMs: number;
    maximumAttempts: number;
    nonRetryableErrorTypes: string[];
  };
  timeout: {
    startToCloseMs: number;
    scheduleToCloseMs: number;
  };
  idempotency: {
    strategyKind: 'IDEMPOTENCY_KEY';
    keyContract: string;
    enforcementRef: string;
  };
}

export interface CompiledReferenceRuntimeProgram {
  schemaVersion: 'talos.reference-runtime-program.v1';
  sdkTarget: TemporalSdkTarget;
  executionPlanRevisionRef: string;
  temporalMappingRevisionRef: string;
  runtimePolicyRevisionRef: string;
  deploymentRevisionRef: string;
  temporalFeatureProfileRef: string;
  workflow: {
    workflowTypeName: string;
    reviewUpdateName: 'submitReferenceReviewDecision';
    reviewWaitKind: 'WORKFLOW_CONDITION';
    workflowMaximumAttempts: 1;
  };
  activity: CompiledReferenceActivityPolicy;
  deploymentIntent: {
    environmentClass: 'TEST';
    desiredNamespaceKey: string;
    namespaceResolutionPolicy: 'USE_REQUESTED_IF_AVAILABLE_ELSE_RECORD_ACTUAL_PRECREATED';
    desiredTaskQueueKey: string;
    desiredWorkerLogicalName: string;
    realizationState: 'INCOMPLETE_ENVIRONMENT_REALIZATION';
  };
  programDigest: string;
}

export interface ReferenceWorkflowInput {
  referenceRequestId: string;
  notificationRecipientEmail: string;
  program: CompiledReferenceRuntimeProgram;
}

export type ReferenceReviewOutcome = 'APPROVED' | 'REJECTED';
export interface ReferenceReviewSubmission {
  outcome: ReferenceReviewOutcome;
  comment?: string;
}

export interface ReferenceApprovalState {
  reviewOutcome: 'PENDING' | ReferenceReviewOutcome;
  comment?: string;
}

export type ReferencePostReviewAction = 'WAIT_FOR_REVIEW' | 'SEND_CONFIRMATION' | 'COMPLETE_REJECTED';

export interface ReferenceWorkflowResult {
  outcome: 'COMPLETED' | 'REJECTED';
  reviewOutcome: ReferenceReviewOutcome;
  notificationOutcome?: 'MESSAGE_ACCEPTED';
}

export type ReferenceProviderFailureKind =
  | 'TRANSIENT_REFERENCE_FAILURE'
  | 'INVALID_REFERENCE_REQUEST'
  | 'IDEMPOTENCY_CONFLICT'
  | 'UNEXPECTED_REFERENCE_PROVIDER_FAILURE';

export interface ReferenceTemporalFailureTranslation {
  applicationFailureType: 'TRANSIENT_REFERENCE_FAILURE' | 'INVALID_REFERENCE_REQUEST';
  nonRetryable: boolean;
  translationBasis: string;
}
