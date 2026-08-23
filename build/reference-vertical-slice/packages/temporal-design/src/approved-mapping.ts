import type { AutomationDesignApprovalRecord } from '../../execution/src/automation-approval.ts';
import type { GenericResolvedExecutionBundle } from '../../execution/src/generic-resolved-plan.ts';
import {
  designGenericTemporalMapping,
  type GenericTemporalResolutionSet,
} from './generic-mapping.ts';
import type { ReferenceTemporalMappingBundle } from './types.ts';

function sameRefs(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

export function designApprovedAutomationTemporalMapping(
  execution: GenericResolvedExecutionBundle,
  approval: AutomationDesignApprovalRecord,
  resolutions: GenericTemporalResolutionSet,
  createdAt: string,
): ReferenceTemporalMappingBundle {
  if (approval.approvalKind !== 'AUTOMATION_DESIGN_TO_TEMPORAL_HANDOFF'
    || !approval.temporalDesignAuthorized
    || approval.deploymentAuthorized
    || approval.executionAuthorized) {
    throw new TypeError('Temporal design requires an explicit I8-06 automation-design handoff approval');
  }
  if (approval.executionPlanRevisionRef !== execution.revision.id
    || approval.executionPlanAssessmentRef !== execution.assessment.id
    || approval.executionDigest !== execution.revision.executionDigest) {
    throw new TypeError('Temporal design approval must pin the exact ExecutionPlan revision, assessment and digest');
  }
  if (approval.processRevisionRef !== execution.revision.processRevisionId
    || approval.resolvedCapabilityDesignRevisionRef !== execution.revision.capabilityDesignRevisionId) {
    throw new TypeError('Temporal design approval process/capability lineage mismatch');
  }
  if (!sameRefs(approval.capabilityBindingRevisionRefs, execution.revision.capabilityBindingRevisionRefs)) {
    throw new TypeError('Temporal design approval binding lineage mismatch');
  }

  return designGenericTemporalMapping(execution, resolutions, createdAt);
}
