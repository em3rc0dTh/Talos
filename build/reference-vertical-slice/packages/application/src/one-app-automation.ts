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
  designGenericRuntimePolicy,
  type GenericActivityRuntimePolicyResolution,
  type GenericWorkflowRuntimePolicyResolution,
} from '../../runtime-policy/src/generic-policy.ts';
import type { ReferenceRuntimePolicyBundle } from '../../runtime-policy/src/types.ts';
import {
  designGenericDeployment,
  type GenericDeploymentIntent,
} from '../../deployment/src/generic-deployment.ts';
import {
  realizeGenericDeployment,
  type GenericWorkerRealizationEvidence,
} from '../../deployment/src/generic-realization.ts';
import {
  approveGenericDeploymentAttempt,
  recordAuthorizedDeploymentAttempt,
  type GenericDeploymentApprovalInput,
  type GenericDeploymentAttemptResult,
} from '../../deployment/src/generic-deployment-attempt.ts';
import {
  approveGenericWorkflowExecution,
  recordAuthorizedWorkflowExecution,
  recordAuthorizedWorkflowExecutionCompletion,
  recordAuthorizedWorkflowExecutionStart,
  type GenericWorkflowExecutionApprovalInput,
  type GenericWorkflowExecutionResult,
  type GenericWorkflowExecutionStartResult,
} from '../../deployment/src/generic-workflow-execution.ts';
import type {
  DeploymentApprovalRecord,
  DeploymentAttempt,
  ReferenceDeploymentBundle,
  WorkflowExecutionApprovalRecord,
  WorkflowExecutionObservation,
  WorkflowExecutionStartRecord,
} from '../../deployment/src/types.ts';
import {
  persistAutomationCapabilitySelection,
  persistGenericCapabilityDesign,
} from './capability.ts';
import {
  persistAutomationDesignApproval,
  persistAutomationExecutionPlanReview,
  persistApprovedAutomationTemporalMapping,
} from './execution-design.ts';
import { persistExplicitRuntimePolicyDesign } from './runtime-policy-design.ts';
import {
  persistOneAppDeploymentDesign,
  persistOneAppDeploymentRealization,
} from './deployment-design.ts';
import {
  persistOneAppDeploymentApproval,
  persistOneAppDeploymentAttempt,
} from './deployment-attempt.ts';
import {
  persistOneAppWorkflowExecutionApproval,
  persistOneAppWorkflowExecutionObservation,
  persistOneAppWorkflowExecutionStart,
} from './workflow-execution.ts';

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
  runtimePolicy?: ReferenceRuntimePolicyBundle;
  deploymentDesign?: ReferenceDeploymentBundle;
  deploymentRealization?: ReferenceDeploymentBundle;
  deploymentApproval?: DeploymentApprovalRecord;
  deploymentAttempt?: DeploymentAttempt;
  workflowExecutionApproval?: WorkflowExecutionApprovalRecord;
  workflowExecutionStart?: WorkflowExecutionStartRecord;
  workflowExecutionObservation?: WorkflowExecutionObservation;
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
  const candidate = openAutomationExecutionPlanReview(
    context.process,
    context.scope,
    context.assessment,
    context.freeze,
    context.scopeFreeze,
    context.selection,
    decisions,
    createdAt,
  );
  const previous = context.executionReview;
  if (previous && candidate.execution.revision.id === previous.execution.revision.id) {
    return context;
  }
  const executionReview: AutomationExecutionPlanReviewBundle = previous
    ? {
        ...candidate,
        execution: {
          ...candidate.execution,
          definition: previous.execution.definition,
          revision: {
            ...candidate.execution.revision,
            revision: previous.execution.revision.revision + 1,
            parentRevisionRefs: [previous.execution.revision.id],
          },
        },
      }
    : candidate;
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

export function designOneAppExplicitRuntimePolicy(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  activities: GenericActivityRuntimePolicyResolution[],
  workflow: GenericWorkflowRuntimePolicyResolution,
  createdAt: string,
): OneAppAutomationContext {
  if (!context.executionReview || !context.approval || !context.mapping) {
    throw new TypeError('one-app RuntimePolicy design requires an approved Temporal mapping first');
  }
  if (!context.approval.temporalDesignAuthorized) {
    throw new TypeError('one-app RuntimePolicy design requires explicit Temporal-design authority');
  }
  if (context.runtimePolicy) {
    throw new TypeError('one-app RuntimePolicy design is append-only and already exists for this context');
  }
  const runtimePolicy = designGenericRuntimePolicy(
    context.executionReview.execution,
    context.mapping,
    activities,
    workflow,
    createdAt,
  );
  persistExplicitRuntimePolicyDesign(repo, runtimePolicy);
  return { ...context, runtimePolicy };
}

export function designOneAppDeployment(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  intent: GenericDeploymentIntent,
  createdAt: string,
): OneAppAutomationContext {
  if (!context.executionReview || !context.mapping || !context.runtimePolicy) {
    throw new TypeError('one-app Deployment design requires an explicit RuntimePolicy first');
  }
  if (context.runtimePolicy.assessment.readiness !== 'READY_FOR_DEPLOYMENT_DESIGN') {
    throw new TypeError('one-app Deployment design requires READY_FOR_DEPLOYMENT_DESIGN RuntimePolicy');
  }
  if (context.deploymentDesign) {
    throw new TypeError('one-app Deployment design is append-only and already exists for this context');
  }
  const deploymentDesign = designGenericDeployment(
    context.executionReview.execution,
    context.mapping,
    context.runtimePolicy,
    intent,
    createdAt,
  );
  persistOneAppDeploymentDesign(repo, deploymentDesign);
  return { ...context, deploymentDesign };
}

export function realizeOneAppDeploymentEnvironment(
  repo: ImmutableDocumentRepository,
  context: OneAppAutomationContext,
  evidence: Omit<GenericWorkerRealizationEvidence, 'capabilityBindingRevisionRefs'>,
  createdAt: string,
): OneAppAutomationContext {
  if (!context.selection || !context.mapping || !context.deploymentDesign) {
    throw new TypeError('one-app environment realization requires explicit capability bindings, Temporal mapping and Deployment design');
  }
  if (context.deploymentRealization) {
    throw new TypeError('one-app environment realization is append-only and already exists for this context');
  }
  const capabilityBindingRevisionRefs = context.selection.resolution.bindingRevisions.map((item) => item.id);
  if (capabilityBindingRevisionRefs.length === 0) {
    throw new TypeError('one-app environment realization requires exact capability binding revision lineage');
  }
  const deploymentRealization = realizeGenericDeployment(
    context.deploymentDesign,
    context.mapping,
    {
      ...evidence,
      capabilityBindingRevisionRefs,
    },
    createdAt,
  );
  persistOneAppDeploymentRealization(repo, deploymentRealization);
  return { ...context, deploymentRealization };
}

export function approveOneAppDeploymentAttempt(
  repo:ImmutableDocumentRepository,
  context:OneAppAutomationContext,
  input:GenericDeploymentApprovalInput,
):OneAppAutomationContext{
  if(!context.deploymentRealization)throw new TypeError('one-app deployment approval requires exact environment realization first');
  if(context.deploymentApproval)throw new TypeError('one-app deployment approval is append-only and already exists for this context');
  const deploymentApproval=approveGenericDeploymentAttempt(context.deploymentRealization,input);
  persistOneAppDeploymentApproval(repo,deploymentApproval);
  return{...context,deploymentApproval};
}

export function recordOneAppAuthorizedDeploymentAttempt(
  repo:ImmutableDocumentRepository,
  context:OneAppAutomationContext,
  result:GenericDeploymentAttemptResult,
):OneAppAutomationContext{
  if(!context.deploymentRealization||!context.deploymentApproval)throw new TypeError('one-app deployment attempt requires explicit deployment approval and environment realization');
  if(context.deploymentAttempt)throw new TypeError('one-app deployment attempt is append-only and already exists for this context');
  if(result.startedAt<context.deploymentApproval.approvedAt)throw new TypeError('deployment attempt cannot begin before explicit deployment approval');
  const deploymentAttempt=recordAuthorizedDeploymentAttempt(context.deploymentRealization,context.deploymentApproval,result);
  persistOneAppDeploymentAttempt(repo,deploymentAttempt);
  return{...context,deploymentAttempt};
}

export function approveOneAppWorkflowExecution(
  repo:ImmutableDocumentRepository,
  context:OneAppAutomationContext,
  input:GenericWorkflowExecutionApprovalInput,
):OneAppAutomationContext{
  if(!context.deploymentRealization||!context.deploymentAttempt)throw new TypeError('one-app workflow execution approval requires a successful deployment attempt first');
  if(context.workflowExecutionApproval)throw new TypeError('one-app workflow execution approval is append-only and already exists for this context');
  const workflowExecutionApproval=approveGenericWorkflowExecution(context.deploymentRealization,context.deploymentAttempt,input);
  persistOneAppWorkflowExecutionApproval(repo,workflowExecutionApproval);
  return{...context,workflowExecutionApproval};
}

export function recordOneAppAuthorizedWorkflowExecutionStart(
  repo:ImmutableDocumentRepository,
  context:OneAppAutomationContext,
  input:{executionId:string;facts:Record<string,unknown>;capabilityInputs?:Record<string,unknown>},
  result:GenericWorkflowExecutionStartResult,
):OneAppAutomationContext{
  if(!context.deploymentRealization||!context.deploymentAttempt||!context.workflowExecutionApproval){
    throw new TypeError('one-app workflow execution start requires explicit execution approval and successful deployment context');
  }
  if(context.workflowExecutionStart||context.workflowExecutionObservation){
    throw new TypeError('one-app workflow execution start is append-only and already exists for this context');
  }
  const workflowExecutionStart=recordAuthorizedWorkflowExecutionStart(
    context.deploymentRealization,
    context.deploymentAttempt,
    context.workflowExecutionApproval,
    input,
    result,
  );
  persistOneAppWorkflowExecutionStart(repo,workflowExecutionStart);
  return{...context,workflowExecutionStart};
}

export function completeOneAppAuthorizedWorkflowExecution(
  repo:ImmutableDocumentRepository,
  context:OneAppAutomationContext,
  result:GenericWorkflowExecutionResult,
):OneAppAutomationContext{
  if(!context.workflowExecutionStart)throw new TypeError('one-app workflow completion requires a persisted authorized workflow start');
  if(context.workflowExecutionObservation)throw new TypeError('one-app workflow execution observation is append-only and already exists for this context');
  const workflowExecutionObservation=recordAuthorizedWorkflowExecutionCompletion(context.workflowExecutionStart,result);
  persistOneAppWorkflowExecutionObservation(repo,workflowExecutionObservation);
  return{...context,workflowExecutionObservation};
}

export function recordOneAppAuthorizedWorkflowExecution(
  repo:ImmutableDocumentRepository,
  context:OneAppAutomationContext,
  input:{executionId:string;facts:Record<string,unknown>;capabilityInputs?:Record<string,unknown>},
  result:GenericWorkflowExecutionResult,
):OneAppAutomationContext{
  if(!context.deploymentRealization||!context.deploymentAttempt||!context.workflowExecutionApproval){
    throw new TypeError('one-app workflow execution requires explicit execution approval and successful deployment context');
  }
  if(context.workflowExecutionStart)throw new TypeError('atomic workflow execution cannot overwrite a separately persisted workflow start');
  if(context.workflowExecutionObservation)throw new TypeError('one-app workflow execution observation is append-only and already exists for this context');
  const workflowExecutionObservation=recordAuthorizedWorkflowExecution(
    context.deploymentRealization,
    context.deploymentAttempt,
    context.workflowExecutionApproval,
    input,
    result,
  );
  persistOneAppWorkflowExecutionObservation(repo,workflowExecutionObservation);
  return{...context,workflowExecutionObservation};
}