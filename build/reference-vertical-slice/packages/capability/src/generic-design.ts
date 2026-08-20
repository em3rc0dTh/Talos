import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type {
  Actor,
  AssessmentScope,
  ProcessNode,
  ProcessRevision,
  SemanticClaim,
  ValidationAssessment,
} from '../../semantic-core/src/types.ts';
import type { SemanticFreezeRecord, ScopeFreezeRecord } from '../../review/src/types.ts';
import type {
  CapabilityDesignRevision,
  CapabilityFamily,
  CapabilityRequirement,
  CapabilityRequirementFacet,
  CapabilityRequirementProvenanceTrace,
  DesignState,
} from './types.ts';

export interface CapabilityDesignBundle {
  designRevision: CapabilityDesignRevision;
  requirements: CapabilityRequirement[];
  facets: CapabilityRequirementFacet[];
  provenanceTraces: CapabilityRequirementProvenanceTrace[];
  designerRef: string;
  designerVersion: string;
}

const DESIGNER_VERSION = 'i5c-generic-capability-designer-v0.1';
const cap = (seed: string) => createOpaqueId('capability', seed);
const HUMAN_ACTORS = new Set<Actor['kind']>(['HUMAN_ROLE', 'HUMAN_PERSON']);

function claimsFor(process: ProcessRevision, subjectRef: string): SemanticClaim[] {
  return process.semanticClaims.filter((claim) => claim.subjectRef === subjectRef);
}

function actorFamily(process: ProcessRevision, node: ProcessNode): CapabilityFamily | undefined {
  if (node.actorRefs.length === 0) return undefined;
  const actors = node.actorRefs
    .map((ref) => process.actors.find((actor) => actor.id === ref))
    .filter((actor): actor is Actor => Boolean(actor));
  if (actors.length !== node.actorRefs.length || actors.length === 0) return undefined;
  if (actors.every((actor) => HUMAN_ACTORS.has(actor.kind))) return 'HUMAN_INTERACTION';
  if (actors.every((actor) => actor.kind === 'SYSTEM')) return 'SYSTEM_OPERATION';
  if (actors.every((actor) => actor.kind === 'AI')) return 'AI_TASK';
  return undefined;
}

function familyFor(process: ProcessRevision, node: ProcessNode): CapabilityFamily | undefined {
  if (node.kind === 'HUMAN_INTERACTION') return 'HUMAN_INTERACTION';
  if (node.kind !== 'ACTION') return undefined;
  return actorFamily(process, node);
}

function operationIntentFor(node: ProcessNode): { value: string; state: DesignState } {
  if (node.kind === 'HUMAN_INTERACTION') {
    const explicit = node.details?.interactionKind;
    if (typeof explicit === 'string' && explicit.trim().length > 0) return { value: explicit, state: 'REQUIRED' };
    return { value: 'UNRESOLVED_HUMAN_INTERACTION', state: 'UNRESOLVED' };
  }
  return { value: 'PERFORM_ACTION', state: 'REQUIRED' };
}

function isCapabilitySubject(node: ProcessNode): boolean {
  // Decisions, waits, subprocess boundaries, states and completion remain orchestration/business
  // semantics. ACTION and HUMAN_INTERACTION represent work whose execution nature must be designed.
  return node.kind === 'ACTION' || node.kind === 'HUMAN_INTERACTION';
}

function validateInputs(
  process: ProcessRevision,
  scope: AssessmentScope,
  assessment: ValidationAssessment,
  freeze: SemanticFreezeRecord,
  scopeFreeze: ScopeFreezeRecord,
): void {
  if (freeze.freezeKind !== 'AUTOMATION_DESIGN_HANDOFF') throw new TypeError('generic capability design requires AUTOMATION_DESIGN_HANDOFF freeze');
  if (!freeze.authorityRef) throw new TypeError('generic capability design requires an authority-backed semantic freeze');
  if (freeze.processRevisionId !== process.id) throw new TypeError('freeze/process revision mismatch');
  if (!freeze.scopeFreezeRefs.includes(scopeFreeze.id)) throw new TypeError('scope freeze is not pinned by semantic freeze');
  if (scopeFreeze.semanticFreezeRecordId !== freeze.id || scopeFreeze.disposition !== 'ACCEPTED') throw new TypeError('generic capability design requires accepted scope freeze');
  if (assessment.processRevisionId !== process.id) throw new TypeError('validation/process revision mismatch');
  if (assessment.assessmentIntent !== 'AUTOMATION_DESIGN_READINESS') throw new TypeError('generic capability design requires AUTOMATION_DESIGN_READINESS assessment');
  if (assessment.executionReadiness !== 'READY_FOR_AUTOMATION_DESIGN') throw new TypeError('generic capability design requires READY_FOR_AUTOMATION_DESIGN');
  if (scope.id !== scopeFreeze.semanticScopeRef || assessment.primaryScopeRef !== scope.id) throw new TypeError('generic capability design requires the exact frozen validation scope');
  if (!scopeFreeze.validationAssessmentRefs.includes(assessment.id)) throw new TypeError('generic capability design requires the exact validation assessment pinned by scope freeze');
  if (scope.kind !== 'PROCESS_REVISION' || !scope.targetRefs.includes(process.id)) throw new TypeError('i5c generic designer currently requires a frozen PROCESS_REVISION scope');
}

export function designGenericCapabilities(
  process: ProcessRevision,
  scope: AssessmentScope,
  assessment: ValidationAssessment,
  freeze: SemanticFreezeRecord,
  scopeFreeze: ScopeFreezeRecord,
  createdAt: string,
  designerRef = 'talos-generic-capability-designer',
): CapabilityDesignBundle {
  validateInputs(process, scope, assessment, freeze, scopeFreeze);

  const designId = cap(`generic-design:${freeze.id}:${scopeFreeze.id}`);
  const requirements: CapabilityRequirement[] = [];
  const facets: CapabilityRequirementFacet[] = [];
  const provenanceTraces: CapabilityRequirementProvenanceTrace[] = [];

  for (const node of process.nodes.filter(isCapabilitySubject)) {
    const requirementId = cap(`generic-requirement:${designId}:${node.id}`);
    const traceId = cap(`generic-trace:${requirementId}`);
    const semanticClaimRefs = claimsFor(process, node.id).map((claim) => claim.id);
    const family = familyFor(process, node);
    const familyState: DesignState = family ? 'REQUIRED' : 'UNRESOLVED';
    const operation = operationIntentFor(node);

    const familyFacet: CapabilityRequirementFacet = {
      id: cap(`generic-facet:${requirementId}:family`),
      capabilityRequirementId: requirementId,
      propertyPath: 'family',
      facetKind: 'FAMILY',
      value: family ?? 'SOURCE_DEFINED',
      designBasis: 'SEMANTIC_DERIVED',
      designState: familyState,
      semanticClaimRefs,
      semanticSubjectRefs: [node.id],
      validationAssessmentRefs: [assessment.id],
      materiality: 'MATERIAL',
      notes: family
        ? 'Capability family is derived only from accepted canonical node/actor semantics.'
        : 'Execution family is unresolved. Talos must not infer human/system/provider meaning from the action label.',
    };
    const operationFacet: CapabilityRequirementFacet = {
      id: cap(`generic-facet:${requirementId}:operation`),
      capabilityRequirementId: requirementId,
      propertyPath: 'operationIntent',
      facetKind: 'OPERATION_INTENT',
      value: operation.value,
      designBasis: 'SEMANTIC_DERIVED',
      designState: operation.state,
      semanticClaimRefs,
      semanticSubjectRefs: [node.id],
      validationAssessmentRefs: [assessment.id],
      materiality: 'MATERIAL',
      ...(node.kind === 'ACTION'
        ? { notes: 'PERFORM_ACTION preserves that business work exists without selecting an execution provider or Temporal primitive.' }
        : {}),
    };
    const actorFacets: CapabilityRequirementFacet[] = node.actorRefs.map((actorRef) => ({
      id: cap(`generic-facet:${requirementId}:actor:${actorRef}`),
      capabilityRequirementId: requirementId,
      propertyPath: 'actorOrResponsibilityRefs',
      facetKind: 'ACTOR_RESPONSIBILITY',
      valueRef: actorRef,
      designBasis: 'SEMANTIC_EXPLICIT',
      designState: 'REQUIRED',
      semanticClaimRefs,
      semanticSubjectRefs: [node.id, actorRef],
      validationAssessmentRefs: [assessment.id],
      materiality: 'MATERIAL',
    }));

    const unresolved = familyState === 'UNRESOLVED' || operation.state === 'UNRESOLVED';
    requirements.push({
      id: requirementId,
      capabilityDesignRevisionId: designId,
      semanticScopeRef: scope.id,
      semanticSubjectRefs: [node.id],
      family: family ?? 'SOURCE_DEFINED',
      operationIntent: operation.value,
      requirementBasis: 'SEMANTIC_DERIVED',
      constraintRefs: [],
      safetyRequirementRefs: [],
      ...(node.actorRefs.length > 0 ? { actorOrResponsibilityRefs: node.actorRefs } : {}),
      requirementState: unresolved ? 'UNRESOLVED' : 'REQUIRED',
      provenanceTraceRef: traceId,
      facetRefs: [familyFacet.id, operationFacet.id, ...actorFacets.map((facet) => facet.id)],
      notes: unresolved
        ? 'Business work is frozen, but its execution capability is not sufficiently specified for binding.'
        : 'Capability family/operation are derived from frozen semantics only; no offering or provider is selected here.',
    });
    facets.push(familyFacet, operationFacet, ...actorFacets);
    provenanceTraces.push({
      id: traceId,
      requirementId,
      semanticFreezeRecordId: freeze.id,
      scopeFreezeRef: scopeFreeze.id,
      processRevisionId: process.id,
      semanticSubjectRefs: [node.id, ...node.actorRefs],
      semanticClaimRefs,
      validationAssessmentRefs: [assessment.id],
      derivationMethod: node.kind === 'HUMAN_INTERACTION'
        ? 'FROZEN_HUMAN_INTERACTION_TO_GENERIC_CAPABILITY_REQUIREMENT'
        : 'FROZEN_ACTION_TO_GENERIC_CAPABILITY_REQUIREMENT',
      designerVersion: DESIGNER_VERSION,
      createdAt,
    });
  }

  const unresolvedRequirementRefs = requirements
    .filter((requirement) => requirement.requirementState === 'UNRESOLVED')
    .map((requirement) => requirement.id);
  const designState = unresolvedRequirementRefs.length > 0 ? 'NEEDS_DESIGN_DECISION' as const : 'READY_FOR_BINDING' as const;
  const designDigest = digestDeterministicJson({
    processRevisionId: process.id,
    semanticFreezeRecordId: freeze.id,
    scopeFreezeRef: scopeFreeze.id,
    validationAssessmentRef: assessment.id,
    designerVersion: DESIGNER_VERSION,
    requirements: requirements.map((requirement) => ({
      id: requirement.id,
      semanticSubjectRefs: requirement.semanticSubjectRefs,
      family: requirement.family,
      operationIntent: requirement.operationIntent,
      requirementState: requirement.requirementState,
      facetRefs: requirement.facetRefs,
    })),
    facets,
  });

  return {
    designRevision: {
      id: designId,
      semanticFreezeRecordId: freeze.id,
      scopeFreezeRefs: [scopeFreeze.id],
      processRevisionId: process.id,
      validationAssessmentRefs: [assessment.id],
      requirementRefs: requirements.map((requirement) => requirement.id),
      unresolvedRequirementRefs,
      designState,
      designDigest,
      createdAt,
    },
    requirements,
    facets,
    provenanceTraces,
    designerRef,
    designerVersion: DESIGNER_VERSION,
  };
}
