import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type {
  AssessmentScope,
  ProcessEdge,
  ProcessNode,
  ProcessRevision,
  ValidationAssessment,
} from '../../semantic-core/src/types.ts';
import type { SemanticFreezeRecord, ScopeFreezeRecord } from '../../review/src/types.ts';
import type { CapabilityDesignBundle } from '../../capability/src/generic-design.ts';
import type { CapabilityRequirement } from '../../capability/src/types.ts';
import type {
  ExecutionDataDependency,
  ExecutionElement,
  ExecutionPlanAssessment,
  ExecutionPlanDefinition,
  ExecutionPlanRevision,
  ExecutionRegion,
  ExecutionRelation,
  ExecutionRequirement,
  ExecutionScopeAssessment,
  ExecutionScopeBinding,
  ExecutionSemanticMappingTrace,
} from './types.ts';

export interface GenericExecutionDraftBundle {
  definition: ExecutionPlanDefinition;
  revision: ExecutionPlanRevision;
  scopeBindings: ExecutionScopeBinding[];
  regions: ExecutionRegion[];
  elements: ExecutionElement[];
  relations: ExecutionRelation[];
  capabilityUses: [];
  dataDependencies: ExecutionDataDependency[];
  requirements: ExecutionRequirement[];
  mappingTraces: ExecutionSemanticMappingTrace[];
  scopeAssessments: ExecutionScopeAssessment[];
  assessment: ExecutionPlanAssessment;
  plannerVersion: string;
}

const PLANNER_VERSION = 'i5c02-generic-execution-draft-v0.1';
const exe = (seed: string) => createOpaqueId('execution', seed);

function validateInputs(
  process: ProcessRevision,
  scope: AssessmentScope,
  assessment: ValidationAssessment,
  freeze: SemanticFreezeRecord,
  scopeFreeze: ScopeFreezeRecord,
  capability: CapabilityDesignBundle,
): void {
  if (freeze.freezeKind !== 'AUTOMATION_DESIGN_HANDOFF') throw new TypeError('generic ExecutionPlan requires AUTOMATION_DESIGN_HANDOFF freeze');
  if (!freeze.authorityRef) throw new TypeError('generic ExecutionPlan requires authority-backed semantic freeze');
  if (freeze.processRevisionId !== process.id) throw new TypeError('generic ExecutionPlan freeze/process mismatch');
  if (!freeze.scopeFreezeRefs.includes(scopeFreeze.id)) throw new TypeError('generic ExecutionPlan scope freeze is not pinned by semantic freeze');
  if (scopeFreeze.semanticFreezeRecordId !== freeze.id || scopeFreeze.disposition !== 'ACCEPTED') throw new TypeError('generic ExecutionPlan requires accepted scope freeze');
  if (assessment.processRevisionId !== process.id || assessment.assessmentIntent !== 'AUTOMATION_DESIGN_READINESS') throw new TypeError('generic ExecutionPlan validation/process mismatch');
  if (assessment.executionReadiness !== 'READY_FOR_AUTOMATION_DESIGN') throw new TypeError('generic ExecutionPlan requires semantic READY_FOR_AUTOMATION_DESIGN');
  if (scope.id !== scopeFreeze.semanticScopeRef || assessment.primaryScopeRef !== scope.id) throw new TypeError('generic ExecutionPlan requires exact frozen validation scope');
  if (!scopeFreeze.validationAssessmentRefs.includes(assessment.id)) throw new TypeError('generic ExecutionPlan requires exact validation assessment pinned by scope freeze');
  if (scope.kind !== 'PROCESS_REVISION' || !scope.targetRefs.includes(process.id)) throw new TypeError('generic ExecutionPlan currently requires PROCESS_REVISION scope');

  const design = capability.designRevision;
  if (design.semanticFreezeRecordId !== freeze.id) throw new TypeError('generic ExecutionPlan capability/freeze mismatch');
  if (design.processRevisionId !== process.id) throw new TypeError('generic ExecutionPlan capability/process mismatch');
  if (!design.scopeFreezeRefs.includes(scopeFreeze.id)) throw new TypeError('generic ExecutionPlan capability design does not pin scope freeze');
  if (!design.validationAssessmentRefs.includes(assessment.id)) throw new TypeError('generic ExecutionPlan capability design does not pin validation assessment');
  if (new Set(design.requirementRefs).size !== design.requirementRefs.length) throw new TypeError('generic ExecutionPlan capability requirement refs are not unique');
  if (design.requirementRefs.length !== capability.requirements.length) throw new TypeError('generic ExecutionPlan capability requirement cardinality mismatch');
  for (const requirement of capability.requirements) {
    if (requirement.capabilityDesignRevisionId !== design.id) throw new TypeError('generic ExecutionPlan capability requirement/design mismatch');
    if (requirement.semanticScopeRef !== scope.id) throw new TypeError('generic ExecutionPlan capability requirement/scope mismatch');
    if (!design.requirementRefs.includes(requirement.id)) throw new TypeError('generic ExecutionPlan capability requirement is not pinned by design revision');
  }
}

function requirementForNode(capability: CapabilityDesignBundle, node: ProcessNode): CapabilityRequirement | undefined {
  return capability.requirements.find((requirement) => requirement.semanticSubjectRefs.includes(node.id));
}

function elementKind(node: ProcessNode, requirement?: CapabilityRequirement): ExecutionElement['kind'] {
  if (node.kind === 'HUMAN_INTERACTION' || requirement?.family === 'HUMAN_INTERACTION') return 'HUMAN_COORDINATION';
  if (node.kind === 'DECISION') return 'DECISION_COORDINATION';
  if (node.kind === 'WAIT') return 'WAIT_COORDINATION';
  if (node.kind === 'END') return 'COMPLETION_COORDINATION';
  if (node.kind === 'STATE') return 'STATE_COORDINATION';
  if (node.kind === 'ACTION') return 'SOURCE_DEFINED';
  return 'COORDINATION_STEP';
}

function elementNeedsDesign(node: ProcessNode, requirement?: CapabilityRequirement): boolean {
  if (node.kind === 'ACTION' || node.kind === 'HUMAN_INTERACTION') return true;
  if (node.kind === 'SUBPROCESS') return true;
  return Boolean(requirement && requirement.requirementState !== 'REQUIRED');
}

function executionRequirementKind(node: ProcessNode, requirement?: CapabilityRequirement): ExecutionRequirement['requirementKind'] {
  if (node.kind === 'SUBPROCESS') return 'COORDINATION_BOUNDARY';
  if (node.kind === 'HUMAN_INTERACTION' || requirement?.family === 'HUMAN_INTERACTION') return 'HUMAN_INTERACTION';
  if (requirement && requirement.family !== 'SOURCE_DEFINED') return 'CAPABILITY_INVOCATION';
  return 'SOURCE_DEFINED';
}

function executionRequirementDescription(node: ProcessNode, requirement?: CapabilityRequirement): string {
  if (node.kind === 'SUBPROCESS') {
    return 'Business subprocess meaning is frozen, but execution decomposition/boundary is not authorized. Preserve the boundary without assuming Child Workflow or Activity mechanics.';
  }
  if (!requirement) return 'Business work has no pinned capability requirement and requires execution-design resolution.';
  if (requirement.requirementState === 'UNRESOLVED' || requirement.family === 'SOURCE_DEFINED') {
    return 'Frozen business work exists, but its execution capability family is unresolved. Do not infer human, system, provider, Activity, or Workflow behavior from the label.';
  }
  return 'Capability requirement exists, but no accepted CapabilityBindingRevision/HumanInteractionDesignRevision is pinned to this generic execution draft.';
}

function relationKind(edge: ProcessEdge): ExecutionRelation['relationKind'] {
  if (edge.kind === 'SEQUENCE') return 'SEQUENCE';
  if (edge.kind === 'CONDITIONAL') return 'CONDITIONAL';
  if (edge.kind === 'DEFAULT') return 'DEFAULT';
  if (edge.kind === 'PARALLEL') return 'PARALLEL';
  return 'SOURCE_DEFINED';
}

function relationComplete(process: ProcessRevision, edge: ProcessEdge): boolean {
  if (edge.kind === 'CONDITIONAL') return Boolean(edge.conditionRuleRef && process.rules.some((rule) => rule.id === edge.conditionRuleRef));
  return ['SEQUENCE', 'DEFAULT', 'PARALLEL'].includes(edge.kind);
}

export function designGenericExecutionDraft(
  process: ProcessRevision,
  scope: AssessmentScope,
  assessment: ValidationAssessment,
  freeze: SemanticFreezeRecord,
  scopeFreeze: ScopeFreezeRecord,
  capability: CapabilityDesignBundle,
  createdAt: string,
): GenericExecutionDraftBundle {
  validateInputs(process, scope, assessment, freeze, scopeFreeze, capability);

  const definitionId = exe(`generic-plan-definition:${process.processDefinitionId}`);
  const revisionId = exe(`generic-plan-revision:${freeze.id}:${capability.designRevision.id}`);
  const scopeBindingId = exe(`generic-scope:${revisionId}:${scope.id}`);
  const regionId = exe(`generic-region:${revisionId}:root`);
  const elementIdByNode = new Map(process.nodes.map((node) => [node.id, exe(`generic-element:${revisionId}:${node.id}`)]));

  const requirements: ExecutionRequirement[] = [];
  const elements: ExecutionElement[] = [];
  const mappingTraces: ExecutionSemanticMappingTrace[] = [];

  for (const node of process.nodes) {
    const requirement = requirementForNode(capability, node);
    const needsDesign = elementNeedsDesign(node, requirement);
    const elementId = elementIdByNode.get(node.id)!;
    let executionRequirementRef: ReturnType<typeof exe> | undefined;

    if (needsDesign) {
      executionRequirementRef = exe(`generic-execution-requirement:${revisionId}:${node.id}`);
      requirements.push({
        id: executionRequirementRef,
        executionPlanRevisionId: revisionId,
        targetRef: elementId,
        requirementKind: executionRequirementKind(node, requirement),
        description: executionRequirementDescription(node, requirement),
        materiality: 'MATERIAL',
        resolutionState: 'UNRESOLVED',
        evidenceRefs: [node.id, capability.designRevision.id, ...(requirement ? [requirement.id, requirement.provenanceTraceRef] : [])],
      });
    }

    const kind = elementKind(node, requirement);
    elements.push({
      id: elementId,
      executionPlanRevisionId: revisionId,
      executionRegionRef: regionId,
      kind,
      semanticSubjectRefs: [node.id],
      capabilityUseRefs: [],
      inputDependencyRefs: [],
      outputDependencyRefs: [],
      executionRequirementRefs: executionRequirementRef ? [executionRequirementRef] : [],
      designState: needsDesign ? 'INCOMPLETE' : 'COMPLETE',
      notes: node.kind === 'ACTION'
        ? 'Business ACTION is represented as an unresolved execution slot. It is not Workflow logic or a Temporal Activity.'
        : node.kind === 'SUBPROCESS'
          ? 'Business subprocess boundary is preserved without selecting an execution decomposition primitive.'
          : undefined,
    });
    mappingTraces.push({
      id: exe(`generic-trace:${revisionId}:${node.id}`),
      executionPlanRevisionId: revisionId,
      semanticSubjectRefs: [node.id],
      executionElementRefs: [elementId],
      capabilityUseRefs: [],
      mappingKind: needsDesign ? 'SOURCE_DEFINED' : 'DIRECT_COORDINATION',
      rationale: needsDesign
        ? 'Semantic meaning is represented in the execution draft, but material execution design remains unresolved and no runtime primitive is selected.'
        : 'Frozen semantic subject maps to execution coordination only; Temporal primitive selection remains a later phase.',
      createdAt,
    });
  }

  const relations: ExecutionRelation[] = [];
  for (const edge of process.edges) {
    const relationId = exe(`generic-relation:${revisionId}:${edge.id}`);
    const complete = relationComplete(process, edge);
    relations.push({
      id: relationId,
      executionPlanRevisionId: revisionId,
      executionRegionRef: regionId,
      sourceElementRef: elementIdByNode.get(edge.sourceNodeId)!,
      targetElementRef: elementIdByNode.get(edge.targetNodeId)!,
      relationKind: relationKind(edge),
      semanticRelationRefs: [edge.id],
      ...(edge.conditionRuleRef ? { conditionRef: edge.conditionRuleRef } : {}),
      relationState: complete ? 'COMPLETE' : 'INCOMPLETE',
    });
    if (!complete) {
      requirements.push({
        id: exe(`generic-execution-requirement:${revisionId}:relation:${edge.id}`),
        executionPlanRevisionId: revisionId,
        targetRef: relationId,
        requirementKind: 'COORDINATION_BOUNDARY',
        description: edge.kind === 'CONDITIONAL'
          ? 'Conditional relation lacks a live structured BusinessRule reference required for execution design.'
          : `Semantic relation ${edge.kind} is preserved but has no accepted generic execution-relation classification yet.`,
        materiality: 'MATERIAL',
        resolutionState: 'UNRESOLVED',
        evidenceRefs: [edge.id, ...(edge.conditionRuleRef ? [edge.conditionRuleRef] : [])],
      });
    }
  }

  const incompleteElementRefs = elements.filter((element) => element.designState !== 'COMPLETE').map((element) => element.id);
  const incompleteRelationRefs = relations.filter((relation) => relation.relationState !== 'COMPLETE').map((relation) => relation.id);
  const unresolvedRequirementRefs = requirements.filter((requirement) => requirement.resolutionState === 'UNRESOLVED').map((requirement) => requirement.id);
  const scopeReadiness: ExecutionScopeAssessment['readiness'] = unresolvedRequirementRefs.length > 0 || incompleteElementRefs.length > 0 || incompleteRelationRefs.length > 0
    ? 'NEEDS_EXECUTION_DESIGN_DECISION'
    : 'READY_FOR_TEMPORAL_MAPPING_DESIGN';

  const scopeBinding: ExecutionScopeBinding = {
    id: scopeBindingId,
    executionPlanRevisionId: revisionId,
    semanticScopeRef: scope.id,
    scopeFreezeRef: scopeFreeze.id,
    role: 'EXECUTABLE_PRIMARY',
    regionRefs: [regionId],
    includedSemanticSubjectRefs: process.nodes.map((node) => node.id),
    contextSemanticSubjectRefs: [],
  };
  const region: ExecutionRegion = {
    id: regionId,
    executionPlanRevisionId: revisionId,
    executionScopeBindingRef: scopeBindingId,
    regionKind: 'ROOT_ORCHESTRATION',
    semanticSubjectRefs: process.nodes.map((node) => node.id),
    elementRefs: elements.map((element) => element.id),
    relationRefs: relations.map((relation) => relation.id),
    boundaryState: scopeReadiness === 'READY_FOR_TEMPORAL_MAPPING_DESIGN' ? 'COMPLETE' : 'INCOMPLETE',
  };
  const scopeAssessment: ExecutionScopeAssessment = {
    id: exe(`generic-scope-assessment:${revisionId}:${scopeBindingId}`),
    executionPlanRevisionId: revisionId,
    executionScopeBindingRef: scopeBindingId,
    semanticScopeRef: scope.id,
    assessmentVersion: PLANNER_VERSION,
    findingRefs: [],
    materialExecutionRequirementRefs: requirements.filter((requirement) => requirement.materiality === 'MATERIAL').map((requirement) => requirement.id),
    readiness: scopeReadiness,
    assessedAt: createdAt,
  };
  const planAssessment: ExecutionPlanAssessment = {
    id: exe(`generic-plan-assessment:${revisionId}`),
    executionPlanRevisionId: revisionId,
    assessmentVersion: PLANNER_VERSION,
    executionScopeAssessmentRefs: [scopeAssessment.id],
    planGlobalFindingRefs: [],
    planGlobalExecutionRequirementRefs: [],
    readiness: scopeReadiness === 'READY_FOR_TEMPORAL_MAPPING_DESIGN' ? 'READY_FOR_TEMPORAL_MAPPING_DESIGN' : 'NEEDS_EXECUTION_DESIGN_DECISION',
    aggregationPolicyVersion: 'execution-plan-aggregate-v0.2',
    assessedAt: createdAt,
  };

  const executionDigest = digestDeterministicJson({
    processRevisionId: process.id,
    semanticFreezeRecordId: freeze.id,
    scopeFreezeRef: scopeFreeze.id,
    validationAssessmentRef: assessment.id,
    capabilityDesignRevisionId: capability.designRevision.id,
    plannerVersion: PLANNER_VERSION,
    elements: elements.map((element) => ({ id: element.id, kind: element.kind, subjects: element.semanticSubjectRefs, state: element.designState, requirements: element.executionRequirementRefs })),
    relations: relations.map((relation) => ({ id: relation.id, kind: relation.relationKind, semanticRelationRefs: relation.semanticRelationRefs, conditionRef: relation.conditionRef, state: relation.relationState })),
    requirements: requirements.map((requirement) => ({ id: requirement.id, targetRef: requirement.targetRef, kind: requirement.requirementKind, state: requirement.resolutionState, evidenceRefs: requirement.evidenceRefs })),
    readiness: planAssessment.readiness,
  });

  const revision: ExecutionPlanRevision = {
    id: revisionId,
    executionPlanDefinitionId: definitionId,
    revision: 1,
    processRevisionId: process.id,
    semanticFreezeRecordId: freeze.id,
    scopeFreezeRefs: [scopeFreeze.id],
    validationAssessmentRefs: [assessment.id],
    capabilityDesignRevisionId: capability.designRevision.id,
    capabilityBindingRevisionRefs: [],
    humanInteractionDesignRevisionRefs: [],
    executionScopeBindingRefs: [scopeBinding.id],
    executionRegionRefs: [region.id],
    executionElementRefs: elements.map((element) => element.id),
    executionRelationRefs: relations.map((relation) => relation.id),
    capabilityUseOccurrenceRefs: [],
    executionDataDependencyRefs: [],
    executionRequirementRefs: requirements.map((requirement) => requirement.id),
    semanticMappingTraceRefs: mappingTraces.map((trace) => trace.id),
    executionScopeAssessmentRefs: [scopeAssessment.id],
    executionAssessmentRef: planAssessment.id,
    readiness: planAssessment.readiness,
    executionDigest,
    createdAt,
    parentRevisionRefs: [],
  };
  const definition: ExecutionPlanDefinition = {
    id: definitionId,
    canonicalName: 'Generic execution draft',
    processDefinitionId: process.processDefinitionId,
    createdAt,
    revisionRefs: [revisionId],
    lifecycleStatus: 'ACTIVE',
  };

  return {
    definition,
    revision,
    scopeBindings: [scopeBinding],
    regions: [region],
    elements,
    relations,
    capabilityUses: [],
    dataDependencies: [],
    requirements,
    mappingTraces,
    scopeAssessments: [scopeAssessment],
    assessment: planAssessment,
    plannerVersion: PLANNER_VERSION,
  };
}
