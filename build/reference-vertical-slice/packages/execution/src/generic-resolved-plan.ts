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
import type { GenericCapabilityResolutionBundle } from '../../capability/src/generic-resolution.ts';
import type { CapabilityBindingRevision, CapabilityRequirement } from '../../capability/src/types.ts';
import type {
  CapabilityUseOccurrence,
  ExecutionDataDependency,
  ExecutionElement,
  ExecutionId,
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

const PLANNER_VERSION = 'i5c03-generic-resolved-execution-plan-v0.1';
const exe = (seed: string) => createOpaqueId('execution', seed);

export interface SubprocessExecutionResolution {
  semanticSubjectRef: string;
  boundaryKind: 'INLINE_COORDINATION' | 'SEPARATE_EXECUTION_BOUNDARY';
  authorityRef: string;
  decidedBy: string;
  rationale: string;
}

/**
 * Explicit execution-design treatment for a frozen semantic relation whose
 * business kind does not itself determine an executable coordination kind.
 * This never rewrites the canonical ProcessEdge.
 */
export interface RelationExecutionResolution {
  semanticRelationRef: string;
  executionRelationKind: 'SEQUENCE' | 'WAIT_RESUME';
  authorityRef: string;
  decidedBy: string;
  rationale: string;
}

export interface ExecutionRelationResolutionRecord {
  id: ExecutionId;
  executionPlanRevisionId: ExecutionId;
  semanticRelationRef: string;
  sourceSemanticRelationKind: ProcessEdge['kind'];
  resolvedExecutionRelationKind: 'SEQUENCE' | 'WAIT_RESUME';
  authorityRef: string;
  decidedBy: string;
  rationale: string;
  createdAt: string;
}

export interface ExecutionCoordinationResolutionRecord {
  id: ExecutionId;
  executionPlanRevisionId: ExecutionId;
  semanticSubjectRef: string;
  resolutionKind: 'INLINE_COORDINATION' | 'SEPARATE_EXECUTION_BOUNDARY';
  authorityRef: string;
  decidedBy: string;
  rationale: string;
  createdAt: string;
}

export interface GenericResolvedExecutionBundle {
  definition: ExecutionPlanDefinition;
  revision: ExecutionPlanRevision;
  scopeBindings: ExecutionScopeBinding[];
  regions: ExecutionRegion[];
  elements: ExecutionElement[];
  relations: ExecutionRelation[];
  capabilityUses: CapabilityUseOccurrence[];
  dataDependencies: ExecutionDataDependency[];
  requirements: ExecutionRequirement[];
  mappingTraces: ExecutionSemanticMappingTrace[];
  scopeAssessments: ExecutionScopeAssessment[];
  assessment: ExecutionPlanAssessment;
  coordinationResolutions: ExecutionCoordinationResolutionRecord[];
  relationResolutions: ExecutionRelationResolutionRecord[];
  plannerVersion: string;
}

function validateInputs(
  process: ProcessRevision,
  scope: AssessmentScope,
  assessment: ValidationAssessment,
  freeze: SemanticFreezeRecord,
  scopeFreeze: ScopeFreezeRecord,
  capability: GenericCapabilityResolutionBundle,
): void {
  if (freeze.freezeKind !== 'AUTOMATION_DESIGN_HANDOFF' || !freeze.authorityRef) throw new TypeError('resolved ExecutionPlan requires authority-backed AUTOMATION_DESIGN_HANDOFF freeze');
  if (freeze.processRevisionId !== process.id) throw new TypeError('resolved ExecutionPlan freeze/process mismatch');
  if (scopeFreeze.semanticFreezeRecordId !== freeze.id || scopeFreeze.disposition !== 'ACCEPTED' || !freeze.scopeFreezeRefs.includes(scopeFreeze.id)) throw new TypeError('resolved ExecutionPlan requires exact accepted scope freeze');
  if (assessment.processRevisionId !== process.id || assessment.assessmentIntent !== 'AUTOMATION_DESIGN_READINESS' || assessment.executionReadiness !== 'READY_FOR_AUTOMATION_DESIGN') throw new TypeError('resolved ExecutionPlan requires exact ready validation assessment');
  if (scope.id !== scopeFreeze.semanticScopeRef || assessment.primaryScopeRef !== scope.id || !scopeFreeze.validationAssessmentRefs.includes(assessment.id)) throw new TypeError('resolved ExecutionPlan requires exact frozen validation scope/assessment');
  if (scope.kind !== 'PROCESS_REVISION' || !scope.targetRefs.includes(process.id)) throw new TypeError('resolved ExecutionPlan currently requires PROCESS_REVISION scope');
  if (capability.designRevision.semanticFreezeRecordId !== freeze.id || capability.designRevision.processRevisionId !== process.id) throw new TypeError('resolved ExecutionPlan capability lineage mismatch');
  if (capability.designRevision.designState !== 'READY_FOR_BINDING' || capability.designRevision.unresolvedRequirementRefs.length !== 0) throw new TypeError('resolved ExecutionPlan requires resolved capability design');
  if (!capability.designRevision.scopeFreezeRefs.includes(scopeFreeze.id) || !capability.designRevision.validationAssessmentRefs.includes(assessment.id)) throw new TypeError('resolved ExecutionPlan capability design does not pin exact freeze/assessment');
  if (capability.bindingRevisions.length !== capability.requirements.length || capability.bindingAssessments.length !== capability.requirements.length) throw new TypeError('resolved ExecutionPlan requires one binding and assessment per capability requirement');
  for (const requirement of capability.requirements) {
    const binding = capability.bindingRevisions.find((item) => item.capabilityRequirementId === requirement.id);
    const bindingAssessment = binding && capability.bindingAssessments.find((item) => item.capabilityBindingRevisionId === binding.id);
    if (!binding || binding.bindingState !== 'READY_FOR_EXECUTION_DESIGN' || !bindingAssessment || bindingAssessment.result !== 'READY_FOR_EXECUTION_DESIGN') {
      throw new TypeError(`resolved ExecutionPlan requires ready binding for ${requirement.id}`);
    }
    if (requirement.family === 'HUMAN_INTERACTION') {
      const human = capability.humanDesigns.find((item) => item.capabilityRequirementId === requirement.id);
      if (!human || human.designState !== 'COMPLETE') throw new TypeError(`resolved ExecutionPlan requires complete human interaction design for ${requirement.id}`);
    }
  }
}

function requirementForNode(capability: GenericCapabilityResolutionBundle, node: ProcessNode): CapabilityRequirement | undefined {
  return capability.requirements.find((requirement) => requirement.semanticSubjectRefs.includes(node.id));
}

function bindingForRequirement(capability: GenericCapabilityResolutionBundle, requirement: CapabilityRequirement): CapabilityBindingRevision {
  const binding = capability.bindingRevisions.find((item) => item.capabilityRequirementId === requirement.id);
  if (!binding) throw new TypeError(`binding missing for ${requirement.id}`);
  return binding;
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

function completeWaitSemantics(node: ProcessNode): boolean {
  if (node.kind !== 'WAIT') return true;
  const details = node.details ?? {};
  const waitKind = typeof details.waitKind === 'string' ? details.waitKind : '';
  if (!waitKind) return false;
  if (waitKind === 'SCHEDULE' || waitKind === 'DEADLINE') {
    return typeof details.timezone === 'string' && details.timezone.length > 0 && details.expression !== undefined;
  }
  if (['EXTERNAL_EVENT', 'MESSAGE', 'HUMAN_RESPONSE', 'CONDITION'].includes(waitKind)) return details.resumeSemantics !== undefined;
  if (waitKind === 'DURATION') return details.expression !== undefined;
  return false;
}

export function designGenericResolvedExecutionPlan(
  process: ProcessRevision,
  scope: AssessmentScope,
  assessment: ValidationAssessment,
  freeze: SemanticFreezeRecord,
  scopeFreeze: ScopeFreezeRecord,
  capability: GenericCapabilityResolutionBundle,
  subprocessResolutions: SubprocessExecutionResolution[],
  createdAt: string,
  parentExecutionPlanRevisionRef?: ExecutionId,
  relationResolutions: RelationExecutionResolution[] = [],
): GenericResolvedExecutionBundle {
  validateInputs(process, scope, assessment, freeze, scopeFreeze, capability);
  const subprocessBySubject = new Map(subprocessResolutions.map((item) => [item.semanticSubjectRef, item]));
  if (subprocessBySubject.size !== subprocessResolutions.length) throw new TypeError('duplicate subprocess execution resolution');
  for (const resolution of subprocessResolutions) {
    if (!resolution.authorityRef.trim() || !resolution.decidedBy.trim() || !resolution.rationale.trim()) throw new TypeError('subprocess execution resolution requires authority, decision owner and rationale');
    const node = process.nodes.find((item) => item.id === resolution.semanticSubjectRef);
    if (!node || node.kind !== 'SUBPROCESS') throw new TypeError(`subprocess resolution targets non-subprocess ${resolution.semanticSubjectRef}`);
  }
  const relationResolutionBySemanticRef = new Map(relationResolutions.map((item) => [item.semanticRelationRef, item]));
  if (relationResolutionBySemanticRef.size !== relationResolutions.length) throw new TypeError('duplicate execution relation resolution');
  for (const resolution of relationResolutions) {
    if (!resolution.authorityRef.trim() || !resolution.decidedBy.trim() || !resolution.rationale.trim()) throw new TypeError('execution relation resolution requires authority, decision owner and rationale');
    const edge = process.edges.find((item) => item.id === resolution.semanticRelationRef);
    if (!edge) throw new TypeError(`execution relation resolution targets missing semantic relation ${resolution.semanticRelationRef}`);
    if (relationKind(edge) !== 'SOURCE_DEFINED') throw new TypeError(`execution relation resolution may only resolve a semantically preserved relation with no direct execution kind: ${resolution.semanticRelationRef}`);
  }

  const definitionId = exe(`generic-resolved-plan-definition:${process.processDefinitionId}`);
  const resolutionDigest = digestDeterministicJson({
    capabilityDesignRevisionId: capability.designRevision.id,
    bindings: capability.bindingRevisions.map((item) => item.id).sort(),
    humanDesigns: capability.humanDesigns.map((item) => item.id).sort(),
    subprocessResolutions: subprocessResolutions.map((item) => ({
      semanticSubjectRef: item.semanticSubjectRef,
      boundaryKind: item.boundaryKind,
      authorityRef: item.authorityRef,
      decidedBy: item.decidedBy,
      rationale: item.rationale,
    })).sort((a, b) => a.semanticSubjectRef.localeCompare(b.semanticSubjectRef)),
    relationResolutions: relationResolutions.map((item) => ({
      semanticRelationRef: item.semanticRelationRef,
      executionRelationKind: item.executionRelationKind,
      authorityRef: item.authorityRef,
      decidedBy: item.decidedBy,
      rationale: item.rationale,
    })).sort((a, b) => a.semanticRelationRef.localeCompare(b.semanticRelationRef)),
  });
  const revisionId = exe(`generic-resolved-plan-revision:${freeze.id}:${capability.designRevision.id}:${resolutionDigest}`);
  const scopeBindingId = exe(`generic-resolved-scope:${revisionId}:${scope.id}`);
  const regionId = exe(`generic-resolved-region:${revisionId}:root`);
  const elementIdByNode = new Map(process.nodes.map((node) => [node.id, exe(`generic-resolved-element:${revisionId}:${node.id}`)]));
  const requirements: ExecutionRequirement[] = [];
  const elements: ExecutionElement[] = [];
  const capabilityUses: CapabilityUseOccurrence[] = [];
  const mappingTraces: ExecutionSemanticMappingTrace[] = [];
  const coordinationResolutions: ExecutionCoordinationResolutionRecord[] = [];
  const relationResolutionRecords: ExecutionRelationResolutionRecord[] = [];

  for (const node of process.nodes) {
    const elementId = elementIdByNode.get(node.id)!;
    const capabilityRequirement = requirementForNode(capability, node);
    let kind: ExecutionElement['kind'] = 'COORDINATION_STEP';
    let complete = true;
    let capabilityUseRef: ExecutionId | undefined;
    let executionRequirementRef: ExecutionId | undefined;

    if (capabilityRequirement) {
      const binding = bindingForRequirement(capability, capabilityRequirement);
      capabilityUseRef = exe(`generic-resolved-capability-use:${revisionId}:${capabilityRequirement.id}`);
      kind = capabilityRequirement.family === 'HUMAN_INTERACTION' ? 'HUMAN_COORDINATION' : 'CAPABILITY_INVOCATION';
      capabilityUses.push({
        id: capabilityUseRef,
        executionPlanRevisionId: revisionId,
        executionElementRef: elementId,
        capabilityRequirementRef: capabilityRequirement.id,
        capabilityBindingRevisionRef: binding.id,
        logicalInputRefs: [],
        logicalOutcomeRefs: [],
        semanticSubjectRefs: capabilityRequirement.semanticSubjectRefs,
        occurrenceState: 'COMPLETE',
      });
    } else if (node.kind === 'DECISION') kind = 'DECISION_COORDINATION';
    else if (node.kind === 'WAIT') {
      kind = 'WAIT_COORDINATION';
      complete = completeWaitSemantics(node);
    } else if (node.kind === 'END') kind = 'COMPLETION_COORDINATION';
    else if (node.kind === 'STATE') kind = 'STATE_COORDINATION';
    else if (node.kind === 'SUBPROCESS') {
      const resolution = subprocessBySubject.get(node.id);
      complete = Boolean(resolution);
      if (resolution) {
        const resolutionId = exe(`generic-coordination-resolution:${revisionId}:${node.id}`);
        coordinationResolutions.push({
          id: resolutionId,
          executionPlanRevisionId: revisionId,
          semanticSubjectRef: node.id,
          resolutionKind: resolution.boundaryKind,
          authorityRef: resolution.authorityRef,
          decidedBy: resolution.decidedBy,
          rationale: resolution.rationale,
          createdAt,
        });
      }
    }

    if (!complete) {
      executionRequirementRef = exe(`generic-resolved-requirement:${revisionId}:${node.id}`);
      const description = node.kind === 'WAIT'
        ? 'WAIT exists semantically but lacks complete structured resume semantics required for Temporal mapping. Do not infer timer/schedule behavior from its label.'
        : node.kind === 'SUBPROCESS'
          ? 'Subprocess business boundary is frozen but its execution-boundary treatment still requires explicit design authority.'
          : 'Execution coordination remains unresolved.';
      requirements.push({
        id: executionRequirementRef,
        executionPlanRevisionId: revisionId,
        targetRef: elementId,
        requirementKind: 'COORDINATION_BOUNDARY',
        description,
        materiality: 'MATERIAL',
        resolutionState: 'UNRESOLVED',
        evidenceRefs: [node.id],
      });
    }

    elements.push({
      id: elementId,
      executionPlanRevisionId: revisionId,
      executionRegionRef: regionId,
      kind,
      semanticSubjectRefs: [node.id],
      capabilityUseRefs: capabilityUseRef ? [capabilityUseRef] : [],
      inputDependencyRefs: [],
      outputDependencyRefs: [],
      executionRequirementRefs: executionRequirementRef ? [executionRequirementRef] : [],
      designState: complete ? 'COMPLETE' : 'INCOMPLETE',
    });
    mappingTraces.push({
      id: exe(`generic-resolved-trace:${revisionId}:${node.id}`),
      executionPlanRevisionId: revisionId,
      semanticSubjectRefs: [node.id],
      executionElementRefs: [elementId],
      capabilityUseRefs: capabilityUseRef ? [capabilityUseRef] : [],
      mappingKind: capabilityUseRef ? 'DIRECT_COORDINATION' : complete ? 'DIRECT_COORDINATION' : 'SOURCE_DEFINED',
      rationale: capabilityUseRef
        ? 'Frozen business work is represented through an explicitly selected and ready capability binding; Temporal primitive selection remains downstream.'
        : complete
          ? 'Semantic coordination is preserved without selecting a Temporal primitive.'
          : 'Material execution-design information is still missing; mapping must remain blocked.',
      createdAt,
    });
  }

  const relations: ExecutionRelation[] = [];
  for (const edge of process.edges) {
    const sourceElementRef = elementIdByNode.get(edge.sourceNodeId);
    const targetElementRef = elementIdByNode.get(edge.targetNodeId);
    if (!sourceElementRef || !targetElementRef) throw new TypeError(`resolved ExecutionPlan relation ${edge.id} references missing endpoint`);
    const relationId = exe(`generic-resolved-relation:${revisionId}:${edge.id}`);
    const baseRelationKind = relationKind(edge);
    const explicitResolution = relationResolutionBySemanticRef.get(edge.id);
    const complete = relationComplete(process, edge) || Boolean(explicitResolution);
    if (explicitResolution) {
      relationResolutionRecords.push({
        id: exe(`generic-relation-resolution:${revisionId}:${edge.id}`),
        executionPlanRevisionId: revisionId,
        semanticRelationRef: edge.id,
        sourceSemanticRelationKind: edge.kind,
        resolvedExecutionRelationKind: explicitResolution.executionRelationKind,
        authorityRef: explicitResolution.authorityRef,
        decidedBy: explicitResolution.decidedBy,
        rationale: explicitResolution.rationale,
        createdAt,
      });
    }
    relations.push({
      id: relationId,
      executionPlanRevisionId: revisionId,
      executionRegionRef: regionId,
      sourceElementRef,
      targetElementRef,
      relationKind: explicitResolution?.executionRelationKind ?? baseRelationKind,
      semanticRelationRefs: [edge.id],
      ...(edge.conditionRuleRef ? { conditionRef: edge.conditionRuleRef } : {}),
      relationState: complete ? 'COMPLETE' : 'INCOMPLETE',
    });
    if (!complete) {
      const requirementId = exe(`generic-resolved-requirement:${revisionId}:relation:${edge.id}`);
      requirements.push({
        id: requirementId,
        executionPlanRevisionId: revisionId,
        targetRef: relationId,
        requirementKind: 'COORDINATION_BOUNDARY',
        description: 'Semantic relation cannot be promoted to executable coordination until its structured relation meaning is complete.',
        materiality: 'MATERIAL',
        resolutionState: 'UNRESOLVED',
        evidenceRefs: [edge.id, ...(edge.conditionRuleRef ? [edge.conditionRuleRef] : [])],
      });
    }
  }

  const unresolved = requirements.some((requirement) => requirement.materiality === 'MATERIAL' && requirement.resolutionState === 'UNRESOLVED') || elements.some((element) => element.designState !== 'COMPLETE') || relations.some((relation) => relation.relationState !== 'COMPLETE');
  const readiness: ExecutionScopeAssessment['readiness'] = unresolved ? 'NEEDS_EXECUTION_DESIGN_DECISION' : 'READY_FOR_TEMPORAL_MAPPING_DESIGN';
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
    boundaryState: readiness === 'READY_FOR_TEMPORAL_MAPPING_DESIGN' ? 'COMPLETE' : 'INCOMPLETE',
  };
  const scopeAssessment: ExecutionScopeAssessment = {
    id: exe(`generic-resolved-scope-assessment:${revisionId}`),
    executionPlanRevisionId: revisionId,
    executionScopeBindingRef: scopeBindingId,
    semanticScopeRef: scope.id,
    assessmentVersion: PLANNER_VERSION,
    findingRefs: [],
    materialExecutionRequirementRefs: requirements.filter((requirement) => requirement.materiality === 'MATERIAL').map((requirement) => requirement.id),
    readiness,
    assessedAt: createdAt,
  };
  const planAssessment: ExecutionPlanAssessment = {
    id: exe(`generic-resolved-plan-assessment:${revisionId}`),
    executionPlanRevisionId: revisionId,
    assessmentVersion: PLANNER_VERSION,
    executionScopeAssessmentRefs: [scopeAssessment.id],
    planGlobalFindingRefs: [],
    planGlobalExecutionRequirementRefs: [],
    readiness,
    aggregationPolicyVersion: 'execution-plan-aggregate-v0.2',
    assessedAt: createdAt,
  };
  const executionDigest = digestDeterministicJson({
    processRevisionId: process.id,
    semanticFreezeRecordId: freeze.id,
    capabilityDesignRevisionId: capability.designRevision.id,
    bindingRefs: capability.bindingRevisions.map((item) => item.id).sort(),
    humanDesignRefs: capability.humanDesigns.map((item) => item.id).sort(),
    coordinationResolutions: coordinationResolutions.map((item) => ({ id: item.id, subject: item.semanticSubjectRef, kind: item.resolutionKind, authorityRef: item.authorityRef })),
    relationResolutions: relationResolutionRecords.map((item) => ({ id: item.id, semanticRelationRef: item.semanticRelationRef, sourceKind: item.sourceSemanticRelationKind, resolvedKind: item.resolvedExecutionRelationKind, authorityRef: item.authorityRef })),
    elements: elements.map((item) => ({ id: item.id, kind: item.kind, subjects: item.semanticSubjectRefs, capabilityUses: item.capabilityUseRefs, state: item.designState })),
    relations: relations.map((item) => ({ id: item.id, kind: item.relationKind, semanticRelationRefs: item.semanticRelationRefs, ...(item.conditionRef ? { conditionRef: item.conditionRef } : {}), state: item.relationState })),
    requirements: requirements.map((item) => ({ id: item.id, targetRef: item.targetRef, state: item.resolutionState, evidenceRefs: item.evidenceRefs })),
    readiness,
  });
  const revision: ExecutionPlanRevision = {
    id: revisionId,
    executionPlanDefinitionId: definitionId,
    revision: parentExecutionPlanRevisionRef ? 2 : 1,
    processRevisionId: process.id,
    semanticFreezeRecordId: freeze.id,
    scopeFreezeRefs: [scopeFreeze.id],
    validationAssessmentRefs: [assessment.id],
    capabilityDesignRevisionId: capability.designRevision.id,
    capabilityBindingRevisionRefs: capability.bindingRevisions.map((item) => item.id),
    humanInteractionDesignRevisionRefs: capability.humanDesigns.map((item) => item.id),
    executionScopeBindingRefs: [scopeBinding.id],
    executionRegionRefs: [region.id],
    executionElementRefs: elements.map((item) => item.id),
    executionRelationRefs: relations.map((item) => item.id),
    capabilityUseOccurrenceRefs: capabilityUses.map((item) => item.id),
    executionDataDependencyRefs: [],
    executionRequirementRefs: requirements.map((item) => item.id),
    semanticMappingTraceRefs: mappingTraces.map((item) => item.id),
    executionScopeAssessmentRefs: [scopeAssessment.id],
    executionAssessmentRef: planAssessment.id,
    readiness,
    executionDigest,
    createdAt,
    parentRevisionRefs: parentExecutionPlanRevisionRef ? [parentExecutionPlanRevisionRef] : [],
  };
  const definition: ExecutionPlanDefinition = {
    id: definitionId,
    canonicalName: 'Generic resolved execution plan',
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
    capabilityUses,
    dataDependencies: [],
    requirements,
    mappingTraces,
    scopeAssessments: [scopeAssessment],
    assessment: planAssessment,
    coordinationResolutions,
    relationResolutions: relationResolutionRecords,
    plannerVersion: PLANNER_VERSION,
  };
}
