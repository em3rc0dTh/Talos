import type { TemporalSdkTarget } from './contracts.ts';

export interface GenericRuntimeConditionSnapshot { ref:string; expression:unknown; }
export interface GenericRuntimeWaitSnapshot { executionElementRef:string; durationMs:number; sourceRef:string; testOnlyTimeScale?:number; }
export interface GenericRuntimeHumanOutcomeSnapshot {
  outcomeRef:string;
  outcomeCode:string;
  businessMeaning:string;
  terminalForInteraction?:boolean;
}
export interface GenericRuntimeHumanSnapshot {
  executionElementRef:string;
  capabilityUseOccurrenceRef:string;
  messageKind:'UPDATE_HANDLER'|'SIGNAL_HANDLER';
  participantRoleRefs:string[];
  /**
   * Present on newly compiled human programs so roleless assignment remains an
   * explicit frozen decision instead of being confused with missing role data.
   * Optional for compatibility with already-persisted role-constrained programs.
   */
  participantAssignmentCardinality?:'EXACTLY_ONE'|'ONE_OR_MORE'|'ANY_ELIGIBLE'|'ALL_REQUIRED'|'N_OF_M'|'SOURCE_DEFINED';
  participantActorTypeConstraints?:string[];
  outcomes:GenericRuntimeHumanOutcomeSnapshot[];
}
export interface GenericRuntimeSemanticSnapshot {
  conditionRules:GenericRuntimeConditionSnapshot[];
  waits:GenericRuntimeWaitSnapshot[];
  /** Omitted for historical/non-human programs so old deterministic digests remain stable. */
  humans?:GenericRuntimeHumanSnapshot[];
  snapshotDigest:string;
}

export interface CompiledGenericActivityPolicy {
  capabilityUseOccurrenceRef:string;
  temporalMappingUnitRef:string;
  retry:{initialIntervalMs:number;backoffCoefficient:number;maximumIntervalMs:number;maximumAttempts:number;nonRetryableErrorTypes:string[]};
  timeout:{startToCloseMs:number;scheduleToCloseMs:number};
  idempotency:{strategyKind:'IDEMPOTENCY_KEY'|'PROVIDER_GUARANTEE'|'NONE';keyContract?:string;enforcementRef?:string};
}
export interface CompiledGenericRuntimeElement {
  id:string;
  kind:string;
  constructKinds:string[];
  capabilityUseOccurrenceRefs:string[];
  semanticSubjectRefs:string[];
}
export interface CompiledGenericRuntimeRelation {
  id:string;
  sourceElementRef:string;
  targetElementRef:string;
  relationKind:string;
  conditionRef?:string;
}
export interface CompiledGenericRuntimeProgram {
  schemaVersion:'talos.generic-runtime-program.v1';
  sdkTarget:TemporalSdkTarget;
  executionPlanRevisionRef:string;
  temporalMappingRevisionRef:string;
  runtimePolicyRevisionRef:string;
  deploymentRevisionRef:string;
  temporalFeatureProfileRef:string;
  workflow:{workflowTypeName:string;workflowMaximumAttempts:number};
  activity:{activityTypeName:string;policies:CompiledGenericActivityPolicy[]};
  graph:{entryElementRef:string;elements:CompiledGenericRuntimeElement[];relations:CompiledGenericRuntimeRelation[]};
  semantics:GenericRuntimeSemanticSnapshot;
  deploymentIntent:{environmentClass:'DEVELOPMENT'|'TEST'|'STAGING'|'PRODUCTION';desiredNamespaceKey:string;desiredTaskQueueKey:string;desiredWorkerLogicalName:string;realizationState:'INCOMPLETE_ENVIRONMENT_REALIZATION'};
  programDigest:string;
}

export interface GenericWorkflowInput {
  executionId:string;
  facts:Record<string,unknown>;
  capabilityInputs?:Record<string,unknown>;
  program:CompiledGenericRuntimeProgram;
}
export interface GenericCapabilityActivityInput { executionId:string; capabilityUseOccurrenceRef:string; input:unknown; }
export interface GenericCapabilityActivityResult {
  outcome:'COMPLETED';
  capabilityUseOccurrenceRef:string;
  effectKey:string;
  effectStatus:'INSERTED'|'DUPLICATE_IDENTICAL';
  transportRef?:string;
  externalEffectRef?:string;
  evidenceRefs?:string[];
}

export interface GenericHumanOutcomeSubmission {
  submissionId:string;
  executionElementRef:string;
  outcomeCode:string;
  actorRef:string;
  authorityRef:string;
  rationale?:string;
}
export interface GenericHumanSubmissionReceipt {
  submissionId:string;
  executionElementRef:string;
  capabilityUseOccurrenceRef:string;
  outcomeRef:string;
  outcomeCode:string;
  actorRef:string;
  authorityRef:string;
  accepted:true;
}
export interface GenericPendingHumanTask {
  executionElementRef:string;
  capabilityUseOccurrenceRef:string;
  messageKind:'UPDATE_HANDLER'|'SIGNAL_HANDLER';
  participantRoleRefs:string[];
  outcomes:GenericRuntimeHumanOutcomeSnapshot[];
}
export interface GenericWorkflowRuntimeState {
  executionId:string;
  status:'RUNNING'|'COMPLETED';
  currentElementRef?:string;
  pendingHumanTask?:GenericPendingHumanTask;
  acceptedHumanSubmissions:GenericHumanSubmissionReceipt[];
}

export const GENERIC_HUMAN_UPDATE_NAME='talosHumanOutcome';
export const GENERIC_HUMAN_SIGNAL_NAME='talosHumanOutcomeSignal';
export const GENERIC_RUNTIME_STATE_QUERY_NAME='talosRuntimeState';

export interface GenericWorkflowResult {
  outcome:'COMPLETED';
  executionId:string;
  visitedElementRefs:string[];
  capabilityResults:GenericCapabilityActivityResult[];
  humanSubmissions?:GenericHumanSubmissionReceipt[];
}
