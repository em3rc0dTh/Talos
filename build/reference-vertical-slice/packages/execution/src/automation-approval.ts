import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import { createOpaqueId } from '../../foundation/src/ids.ts';
import type { AutomationExecutionPlanReviewBundle } from './automation-execution-review.ts';

export interface AutomationApprovalInput {
  approvedBy: string;
  authorityRef: string;
  rationale: string;
  approvedAt: string;
}

export interface AutomationDesignApprovalRecord {
  id: string;
  approvalKind: 'AUTOMATION_DESIGN_TO_TEMPORAL_HANDOFF';
  automationExecutionPlanReviewRef: string;
  processRevisionRef: string;
  automationDesignWorkspaceRevisionRef: string;
  capabilitySelectionTraceRefs: string[];
  capabilityBindingRevisionRefs: string[];
  resolvedCapabilityDesignRevisionRef: string;
  executionPlanRevisionRef: string;
  executionPlanAssessmentRef: string;
  executionDigest: string;
  approvedBy: string;
  authorityRef: string;
  rationale: string;
  temporalDesignAuthorized: true;
  deploymentAuthorized: false;
  executionAuthorized: false;
  approvedAt: string;
}

function nonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function sameRefs(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

export function approveAutomationDesign(
  bundle: AutomationExecutionPlanReviewBundle,
  input: AutomationApprovalInput,
): AutomationDesignApprovalRecord {
  const { review, execution } = bundle;
  if (review.state !== 'READY_FOR_AUTOMATION_APPROVAL') {
    throw new TypeError('automation approval requires a READY_FOR_AUTOMATION_APPROVAL ExecutionPlan review');
  }
  if (review.technicalReadiness !== 'READY_FOR_TEMPORAL_MAPPING_DESIGN') {
    throw new TypeError('automation approval requires technical READY_FOR_TEMPORAL_MAPPING_DESIGN readiness');
  }
  if (review.materialExecutionRequirementRefs.length > 0
    || review.incompleteExecutionElementRefs.length > 0
    || review.incompleteExecutionRelationRefs.length > 0) {
    throw new TypeError('automation approval cannot bypass unresolved execution-design blockers');
  }
  if (!review.automationApprovalRequired || review.temporalDesignAuthorized || review.deploymentAuthorized || review.executionAuthorized) {
    throw new TypeError('automation approval requires an unapproved I8-05 review boundary');
  }
  if (review.executionPlanRevisionRef !== execution.revision.id
    || review.executionPlanAssessmentRef !== execution.assessment.id) {
    throw new TypeError('automation approval must pin the exact reviewed ExecutionPlan revision and assessment');
  }
  if (review.processRevisionRef !== execution.revision.processRevisionId) {
    throw new TypeError('automation approval review/process lineage mismatch');
  }
  if (review.resolvedCapabilityDesignRevisionRef !== execution.revision.capabilityDesignRevisionId) {
    throw new TypeError('automation approval capability design lineage mismatch');
  }
  if (!sameRefs(review.capabilityBindingRevisionRefs, execution.revision.capabilityBindingRevisionRefs)) {
    throw new TypeError('automation approval binding lineage mismatch');
  }
  if (execution.revision.readiness !== 'READY_FOR_TEMPORAL_MAPPING_DESIGN'
    || execution.assessment.readiness !== 'READY_FOR_TEMPORAL_MAPPING_DESIGN') {
    throw new TypeError('automation approval cannot authorize a non-ready ExecutionPlan');
  }

  const approvedBy = nonEmpty(input.approvedBy, 'approvedBy');
  const authorityRef = nonEmpty(input.authorityRef, 'authorityRef');
  const rationale = nonEmpty(input.rationale, 'rationale');
  const approvedAt = nonEmpty(input.approvedAt, 'approvedAt');
  const decisionDigest = digestDeterministicJson({
    approvalKind: 'AUTOMATION_DESIGN_TO_TEMPORAL_HANDOFF',
    automationExecutionPlanReviewRef: review.id,
    processRevisionRef: review.processRevisionRef,
    automationDesignWorkspaceRevisionRef: review.automationDesignWorkspaceRevisionRef,
    capabilitySelectionTraceRefs: [...review.capabilitySelectionTraceRefs].sort(),
    capabilityBindingRevisionRefs: [...review.capabilityBindingRevisionRefs].sort(),
    resolvedCapabilityDesignRevisionRef: review.resolvedCapabilityDesignRevisionRef,
    executionPlanRevisionRef: execution.revision.id,
    executionPlanAssessmentRef: execution.assessment.id,
    executionDigest: execution.revision.executionDigest,
    approvedBy,
    authorityRef,
    rationale,
  });

  return {
    id: createOpaqueId('execution', `automation-design-approval:${decisionDigest}`),
    approvalKind: 'AUTOMATION_DESIGN_TO_TEMPORAL_HANDOFF',
    automationExecutionPlanReviewRef: review.id,
    processRevisionRef: review.processRevisionRef,
    automationDesignWorkspaceRevisionRef: review.automationDesignWorkspaceRevisionRef,
    capabilitySelectionTraceRefs: [...review.capabilitySelectionTraceRefs],
    capabilityBindingRevisionRefs: [...review.capabilityBindingRevisionRefs],
    resolvedCapabilityDesignRevisionRef: review.resolvedCapabilityDesignRevisionRef,
    executionPlanRevisionRef: execution.revision.id,
    executionPlanAssessmentRef: execution.assessment.id,
    executionDigest: execution.revision.executionDigest,
    approvedBy,
    authorityRef,
    rationale,
    temporalDesignAuthorized: true,
    deploymentAuthorized: false,
    executionAuthorized: false,
    approvedAt,
  };
}
