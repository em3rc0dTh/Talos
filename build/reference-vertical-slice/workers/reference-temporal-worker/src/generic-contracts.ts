import type { TemporalSdkTarget } from './contracts.ts';

export type GenericRuntimeComparisonOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'IN'
  | 'NOT_IN';

export type GenericRuntimeValue =
  | { kind:'REFERENCE'; path:string }
  | { kind:'LITERAL'; value:unknown };

export type GenericRuntimeConditionExpression =
  | { kind:'COMPARE'; left:GenericRuntimeValue; operator:GenericRuntimeComparisonOperator; right:GenericRuntimeValue }
  | { kind:'EXISTS'; value:GenericRuntimeValue }
  | { kind:'AND'; expressions:GenericRuntimeConditionExpression[] }
  | { kind:'OR'; expressions:GenericRuntimeConditionExpression[] }
  | { kind:'NOT'; expression:GenericRuntimeConditionExpression }
  | { kind:'DECISION_INPUT'; decisionRef:string; prompt:string };

export interface GenericRuntimeConditionInputSnapshot { ref:string; expression:unknown; }
export interface GenericRuntimeConditionSnapshot { ref:string; expression:GenericRuntimeConditionExpression; }
export interface GenericRuntimeWaitSnapshot { executionElementRef:string; durationMs:number; sourceRef:string; testOnlyTimeScale?:number; }
export interface GenericRuntimeSemanticInputSnapshot { conditionRules:GenericRuntimeConditionInputSnapshot[]; waits:GenericRuntimeWaitSnapshot[]; snapshotDigest:string; }
export interface GenericRuntimeSemanticSnapshot { conditionRules:GenericRuntimeConditionSnapshot[]; waits:GenericRuntimeWaitSnapshot[]; snapshotDigest:string; }

export interface GenericRuntimeContext {
  initialInputs:Record<string,unknown>;
  processVariables:Record<string,unknown>;
  humanOutputs:Record<string,unknown>;
  activityOutputs:Record<string,unknown>;
  externalEvents:Record<string,unknown>;
  systemValues:Record<string,unknown>;
  executionMetadata:Record<string,unknown>;
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
  facts?:Record<string,unknown>;
  runtimeContext?:GenericRuntimeContext;
  capabilityInputs?:Record<string,unknown>;
  program:CompiledGenericRuntimeProgram;
}
export interface GenericHumanTaskSubmission { executionElementRef:string; outcome:'COMPLETED'; output?:unknown; }
export interface GenericDecisionOption { relationRef:string; decisionRef:string; label:string; targetElementRef:string; }
export interface GenericDecisionSubmission { decisionRef:string; applies?:boolean; selectedRelationRef?:string; output?:unknown; }
export interface GenericWorkflowState {
  executionId:string;
  currentElementRef:string|null;
  currentHumanTaskRef:string|null;
  currentDecisionRef:string|null;
  currentDecisionPrompt:string|null;
  currentDecisionMode?:'BOOLEAN'|'CHOICE'|null;
  currentDecisionOptions?:GenericDecisionOption[];
  selectedDecisionRelations?:Record<string,string>;
  visitedElementRefs:string[];
  completedHumanTaskRefs:string[];
  decisionOutcomes:Record<string,boolean>;
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
export interface GenericWorkflowResult { outcome:'COMPLETED'; executionId:string; visitedElementRefs:string[]; capabilityResults:GenericCapabilityActivityResult[]; completedHumanTaskRefs:string[]; decisionOutcomes:Record<string,boolean>; selectedDecisionRelations?:Record<string,string>; }
