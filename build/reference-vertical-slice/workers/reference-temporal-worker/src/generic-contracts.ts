import type { TemporalSdkTarget } from './contracts.ts';

export interface GenericRuntimeConditionSnapshot { ref:string; expression:unknown; }
export interface GenericRuntimeWaitSnapshot { executionElementRef:string; durationMs:number; sourceRef:string; testOnlyTimeScale?:number; }
export interface GenericRuntimeSemanticSnapshot { conditionRules:GenericRuntimeConditionSnapshot[]; waits:GenericRuntimeWaitSnapshot[]; snapshotDigest:string; }

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
export interface GenericHumanTaskSubmission { executionElementRef:string; outcome:'COMPLETED'; }
export interface GenericWorkflowState {
  executionId:string;
  currentElementRef:string|null;
  currentHumanTaskRef:string|null;
  visitedElementRefs:string[];
  completedHumanTaskRefs:string[];
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
export interface GenericWorkflowResult { outcome:'COMPLETED'; executionId:string; visitedElementRefs:string[]; capabilityResults:GenericCapabilityActivityResult[]; completedHumanTaskRefs:string[]; }
