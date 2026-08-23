import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type {
  AssessmentScope,
  ProcessRevision,
  ValidationAssessment,
} from '../../semantic-core/src/types.ts';
import type { ScopeFreezeRecord, SemanticFreezeRecord } from '../../review/src/types.ts';
import { designGenericCapabilities, type CapabilityDesignBundle } from '../../capability/src/generic-design.ts';
import {
  decideAutomationDesignSuggestion,
  openAutomationDesignWorkspace,
  type AutomationDesignSuggestionDecisionInput,
  type AutomationDesignWorkspaceBundle,
} from '../../capability/src/automation-design-workspace.ts';
import {
  selectAndBindAutomationCapabilities,
  type AutomationCapabilitySelectionInput,
  type AutomationCapabilitySelectionResult,
} from '../../capability/src/automation-capability-selection.ts';
import {
  approveAutomationDesign,
  openAutomationExecutionPlanReview,
  type AutomationApprovalInput,
  type AutomationDesignApprovalRecord,
  type AutomationExecutionDesignDecisions,
  type AutomationExecutionPlanReviewBundle,
} from '../../execution/src/index.ts';
import {
  designApprovedAutomationTemporalMapping,
} from '../../temporal-design/src/approved-mapping.ts';
import type { GenericTemporalResolutionSet } from '../../temporal-design/src/generic-mapping.ts';
import type { ReferenceTemporalMappingBundle } from '../../temporal-design/src/types.ts';
import {
  persistAutomationCapabilitySelection,
  persistGenericCapabilityDesign,
} from './capability.ts';
import {
  persistAutomationDesignApproval,
  persistAutomationExecutionPlanReview,
  persistApprovedAutomationTemporalMapping,
} from './execution-design.ts';

export interface OneAppAutomationContext {
  process: ProcessRevision;
  scope: AssessmentScope;
  assessment: ValidationAssessment;
  freeze: SemanticFreezeRecord;
  scopeFreeze: ScopeFreezeRecord;
  design: CapabilityDesignBundle;
  workspace: AutomationDesignWorkspaceBundle;
  selection?: AutomationCapabilitySelectionResult;
  executionReview?: AutomationExecutionPlanReviewBundle;
  approval?: AutomationDesignApprovalRecord;
  mapping?: ReferenceTemporalMappingBundle;
}

export function openOneAppAutomationDesign(
  repo: ImmutableDocumentRepository,
  input: {
    process: ProcessRevision;
    scope: AssessmentScope;
    assessment: ValidationAssessment;
    freeze: SemanticFreezeRecord;
    scopeFreeze: ScopeFreezeRecord;
    createdAt: string;
  },
): OneAppAutomationContext {
  const design = designGenericCapabilities(
    input.process,
    input.scope,
    input.assessment,
    input.freeze,
    input.scopeFreeze,
    input.createdAt,
  );
  persistGenericCapabilityDesign(repo, design);
  const workspace = openAutomationDesignWorkspace(design, input.createdAt);
  return {
    process: input.process,
    scope: input.scope,
    assessment: input.assessment,
    freeze: input.freeze,
    scopeFreeze: input.scopeFreeze,
    design,
    workspace,
  };
}

export function decideOneAppAutomationSuggestion(
  context: OneAppAutomationContext,
  input: AutomationDesignSuggestionDecisionInput,
): OneAppAutomationContext {
  if (context.selection) throw new TypeError('one-app suggestion decisions cannot mutate a workspace after capability selection');
  return {
    ...context,
    workspace: decideAutomationDesignSuggestion(context.design, context.workspace, input),
  };
}

export function selectOneAppAutomationCapabilities(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  selections: AutomationCapabilitySelectionInput[],
  createdAt: string,
): OneAppAutomationContext {
  if (context.selection) throw new TypeError('one-app capability selection is append-only and already exists for this context');
  const selection = selectAndBindAutomationCapabilities(
    context.design,
    context.workspace,
    selections,
    createdAt,
  );
  persistAutomationCapabilitySelection(repo, selection);
  return { ...context, selection };
}

export function reviewOneAppExecutionPlan(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  decisions: AutomationExecutionDesignDecisions,
  createdAt: string,
): OneAppAutomationContext {
  if (!context.selection) throw new TypeError('one-app ExecutionPlan review requires an explicit capability selection first');
  const executionReview = openAutomationExecutionPlanReview(
    context.process,
    context.scope,
    context.assessment,
    context.freeze,
    context.scopeFreeze,
    context.selection,
    decisions,
    createdAt,
  );
  persistAutomationExecutionPlanReview(repo, executionReview);
  return { ...context, executionReview };
}

export function approveOneAppAutomation(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  input: AutomationApprovalInput,
): OneAppAutomationContext {
  if (!context.executionReview) throw new TypeError('one-app automation approval requires an existing ExecutionPlan review');
  if (context.approval) throw new TypeError('one-app automation approval is append-only and already exists for this context');
  const approval = approveAutomationDesign(context.executionReview, input);
  persistAutomationDesignApproval(repo, approval);
  return { ...context, approval };
}

export function mapOneAppApprovedTemporalDesign(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  resolutions: GenericTemporalResolutionSet,
  createdAt: string,
): OneAppAutomationContext {
  if (!context.executionReview || !context.approval) {
    throw new TypeError('one-app Temporal mapping requires an explicit I8-06 automation approval');
  }
  if (context.mapping) throw new TypeError('one-app Temporal mapping is append-only and already exists for this context');
  const mapping = designApprovedAutomationTemporalMapping(
    context.executionReview.execution,
    context.approval,
    resolutions,
    createdAt,
  );
  persistApprovedAutomationTemporalMapping(repo, mapping);
  return { ...context, mapping };
}
