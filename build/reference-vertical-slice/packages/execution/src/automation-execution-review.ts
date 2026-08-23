import { createOpaqueId } from '../../foundation/src/ids.ts';
import type {
  AssessmentScope,
  ProcessRevision,
  ValidationAssessment,
} from '../../semantic-core/src/types.ts';
import type { ScopeFreezeRecord, SemanticFreezeRecord } from '../../review/src/types.ts';
import type { AutomationCapabilitySelectionResult } from '../../capability/src/automation-capability-selection.ts';
import {
  designGenericResolvedExecutionPlan,
  type GenericResolvedExecutionBundle,
  type RelationExecutionResolution,
  type SubprocessExecutionResolution,
} from './generic-resolved-plan.ts';

export type AutomationExecutionPlanReviewState =
  | 'BLOCKED_EXECUTION_DESIGN'
  | 'READY_FOR_AUTOMATION_APPROVAL';

export interface AutomationExecutionPlanReview {
  id: string;
  processRevisionRef: string;
  automationDesignWorkspaceRevisionRef: string;
  capabilitySelectionTraceRefs: string[];
  resolvedCapabilityDesignRevisionRef: string;
  capabilityBindingRevisionRefs: string[];
  executionPlanRevisionRef: string;
  executionPlanAssessmentRef: string;
  technicalReadiness: GenericResolvedExecutionBundle['assessment']['readiness'];
  materialExecutionRequirementRefs: string[];
  incompleteExecutionElementRefs: string[];
  incompleteExecutionRelationRefs: string[];
  state: AutomationExecutionPlanReviewState;
  automationApprovalRequired: true;
  temporalDesignAuthorized: false;
  deploymentAuthorized: false;
  executionAuthorized: false;
  createdAt: string;
}

export interface AutomationExecutionPlanReviewBundle {
  review: AutomationExecutionPlanReview;
  execution: GenericResolvedExecutionBundle;
}

export interface AutomationExecutionDesignDecisions {
  subprocessResolutions?: SubprocessExecutionResolution[];
  relationResolutions?: RelationExecutionResolution[];
}

function validateSelectionLineage(
  process: ProcessRevision,
  selection: AutomationCapabilitySelectionResult,
): void {
  if (!selection.createsCapabilitySelection || !selection.createsBinding) {
    throw new TypeError('ExecutionPlan review requires an explicit I8-04 capability selection and binding result');
  }
  if (selection.executionPlanAuthorized || selection.temporalMappingAuthorized || selection.deploymentAuthorized) {
    throw new TypeError('I8-04 input must not already carry downstream execution or deployment authority');
  }
  if (selection.resolution.designRevision.id !== selection.resolvedCapabilityDesignRevisionRef) {
    throw new TypeError('capability selection resolved design reference does not match its resolution bundle');
  }
  if (selection.resolution.designRevision.processRevisionId !== process.id) {
    throw new TypeError('capability selection does not belong to the reviewed ProcessRevision');
  }
  if (selection.traces.length !== selection.resolution.requirements.length) {
    throw new TypeError('ExecutionPlan review requires one explicit capability selection trace per resolved requirement');
  }
  if (selection.traces.some((trace) => trace.workspaceRevisionRef !== selection.workspaceRevisionRef)) {
    throw new TypeError('capability selection trace does not pin the exact Automation Design Workspace revision');
  }
}

export function openAutomationExecutionPlanReview(
  process: ProcessRevision,
  scope: AssessmentScope,
  assessment: ValidationAssessment,
  freeze: SemanticFreezeRecord,
  scopeFreeze: ScopeFreezeRecord,
  selection: AutomationCapabilitySelectionResult,
  decisions: AutomationExecutionDesignDecisions,
  createdAt: string,
): AutomationExecutionPlanReviewBundle {
  validateSelectionLineage(process, selection);
  const execution = designGenericResolvedExecutionPlan(
    process,
    scope,
    assessment,
    freeze,
    scopeFreeze,
    selection.resolution,
    decisions.subprocessResolutions ?? [],
    createdAt,
    undefined,
    decisions.relationResolutions ?? [],
  );
  const materialExecutionRequirementRefs = execution.requirements
    .filter((requirement) => requirement.materiality === 'MATERIAL' && requirement.resolutionState === 'UNRESOLVED')
    .map((requirement) => requirement.id);
  const incompleteExecutionElementRefs = execution.elements
    .filter((element) => element.designState !== 'COMPLETE')
    .map((element) => element.id);
  const incompleteExecutionRelationRefs = execution.relations
    .filter((relation) => relation.relationState !== 'COMPLETE')
    .map((relation) => relation.id);
  const technicallyReady = execution.assessment.readiness === 'READY_FOR_TEMPORAL_MAPPING_DESIGN'
    && materialExecutionRequirementRefs.length === 0
    && incompleteExecutionElementRefs.length === 0
    && incompleteExecutionRelationRefs.length === 0;

  return {
    execution,
    review: {
      id: createOpaqueId('execution', `automation-execution-plan-review:${execution.revision.id}:${selection.workspaceRevisionRef}`),
      processRevisionRef: process.id,
      automationDesignWorkspaceRevisionRef: selection.workspaceRevisionRef,
      capabilitySelectionTraceRefs: selection.traces.map((trace) => trace.id),
      resolvedCapabilityDesignRevisionRef: selection.resolution.designRevision.id,
      capabilityBindingRevisionRefs: selection.resolution.bindingRevisions.map((binding) => binding.id),
      executionPlanRevisionRef: execution.revision.id,
      executionPlanAssessmentRef: execution.assessment.id,
      technicalReadiness: execution.assessment.readiness,
      materialExecutionRequirementRefs,
      incompleteExecutionElementRefs,
      incompleteExecutionRelationRefs,
      state: technicallyReady ? 'READY_FOR_AUTOMATION_APPROVAL' : 'BLOCKED_EXECUTION_DESIGN',
      automationApprovalRequired: true,
      temporalDesignAuthorized: false,
      deploymentAuthorized: false,
      executionAuthorized: false,
      createdAt,
    },
  };
}
