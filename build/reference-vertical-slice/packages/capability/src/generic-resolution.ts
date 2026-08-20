import { createOpaqueId } from '../../foundation/src/ids.ts';
import { digestDeterministicJson } from '../../foundation/src/digest.ts';
import type { CanonicalId } from '../../semantic-core/src/types.ts';
import type { CapabilityDesignBundle } from './generic-design.ts';
import type {
  CapabilityBindingAssessment,
  CapabilityBindingDefinition,
  CapabilityBindingRevision,
  CapabilityFamily,
  CapabilityMatchAssessment,
  CapabilityOfferingDefinition,
  CapabilityOfferingRevision,
  CapabilityOfferingSafetyProfile,
  CapabilityRequirement,
  CapabilityRequirementFacet,
  CapabilityRequirementProvenanceTrace,
  CapabilitySelectionDecision,
  HumanInteractionDesignRevision,
  HumanOutcome,
  HumanOutcomeContract,
  ParticipantRequirement,
} from './types.ts';

const RESOLVER_VERSION = 'i5c03-generic-capability-resolution-v0.1';
const cap = (seed: string) => createOpaqueId('capability', seed);

export interface GenericHumanDesignResolution {
  interactionKind: HumanInteractionDesignRevision['interactionKind'];
  responsibilityKind: ParticipantRequirement['responsibilityKind'];
  roleRefs: CanonicalId[];
  assignmentCardinality?: ParticipantRequirement['assignmentCardinality'];
  outcomes: Array<{ code: string; businessMeaning: string; terminal?: boolean }>;
}

export interface GenericRequirementResolution {
  requirementRef: string;
  family: CapabilityFamily;
  operationIntent?: string;
  authorityRef: string;
  decidedBy: string;
  rationale: string;
  offeringCanonicalName: string;
  offeringLifecycleStatus?: CapabilityOfferingDefinition['lifecycleStatus'];
  implementationKind: CapabilityOfferingRevision['implementationKind'];
  implementationRef: string;
  human?: GenericHumanDesignResolution;
}

export interface GenericCapabilityResolutionBundle {
  designRevision: CapabilityDesignBundle['designRevision'];
  requirements: CapabilityRequirement[];
  facets: CapabilityRequirementFacet[];
  provenanceTraces: CapabilityRequirementProvenanceTrace[];
  offeringDefinitions: CapabilityOfferingDefinition[];
  offeringRevisions: CapabilityOfferingRevision[];
  offeringSafetyProfiles: CapabilityOfferingSafetyProfile[];
  matchAssessments: CapabilityMatchAssessment[];
  selectionDecisions: CapabilitySelectionDecision[];
  bindingDefinitions: CapabilityBindingDefinition[];
  bindingRevisions: CapabilityBindingRevision[];
  bindingAssessments: CapabilityBindingAssessment[];
  humanDesigns: HumanInteractionDesignRevision[];
  participantRequirements: ParticipantRequirement[];
  humanOutcomeContracts: HumanOutcomeContract[];
  humanOutcomes: HumanOutcome[];
  resolverVersion: string;
  resolutionDigest: string;
}

function requireNonEmpty(value: string, label: string): void {
  if (!value.trim()) throw new TypeError(`${label} is required`);
}

function normalizedResolution(spec: GenericRequirementResolution) {
  return {
    requirementRef: spec.requirementRef,
    family: spec.family,
    ...(spec.operationIntent ? { operationIntent: spec.operationIntent } : {}),
    authorityRef: spec.authorityRef,
    decidedBy: spec.decidedBy,
    rationale: spec.rationale,
    offeringCanonicalName: spec.offeringCanonicalName,
    offeringLifecycleStatus: spec.offeringLifecycleStatus ?? 'TEST_ONLY',
    implementationKind: spec.implementationKind,
    implementationRef: spec.implementationRef,
    ...(spec.human ? {
      human: {
        interactionKind: spec.human.interactionKind,
        responsibilityKind: spec.human.responsibilityKind,
        roleRefs: spec.human.roleRefs,
        assignmentCardinality: spec.human.assignmentCardinality ?? 'EXACTLY_ONE',
        outcomes: spec.human.outcomes.map((outcome) => ({
          code: outcome.code,
          businessMeaning: outcome.businessMeaning,
          ...(outcome.terminal !== undefined ? { terminal: outcome.terminal } : {}),
        })),
      },
    } : {}),
  };
}

function validateResolution(base: CapabilityDesignBundle, specs: GenericRequirementResolution[]): Map<string, GenericRequirementResolution> {
  if (specs.length !== base.requirements.length) throw new TypeError('generic capability resolution requires exactly one decision per capability requirement');
  const byRequirement = new Map<string, GenericRequirementResolution>();
  for (const spec of specs) {
    if (byRequirement.has(spec.requirementRef)) throw new TypeError(`duplicate capability resolution for ${spec.requirementRef}`);
    const requirement = base.requirements.find((item) => item.id === spec.requirementRef);
    if (!requirement) throw new TypeError(`capability resolution references unknown requirement ${spec.requirementRef}`);
    requireNonEmpty(spec.authorityRef, 'authorityRef');
    requireNonEmpty(spec.decidedBy, 'decidedBy');
    requireNonEmpty(spec.rationale, 'rationale');
    requireNonEmpty(spec.offeringCanonicalName, 'offeringCanonicalName');
    requireNonEmpty(spec.implementationRef, 'implementationRef');
    if (requirement.family !== 'SOURCE_DEFINED' && requirement.family !== spec.family) {
      throw new TypeError(`capability resolution cannot override frozen semantic family ${requirement.family} for ${requirement.id}`);
    }
    if (requirement.operationIntent === 'UNRESOLVED_HUMAN_INTERACTION' && !spec.operationIntent) {
      throw new TypeError(`capability resolution requires explicit operationIntent for ${requirement.id}`);
    }
    if (spec.family === 'HUMAN_INTERACTION') {
      if (!spec.human) throw new TypeError(`HUMAN_INTERACTION resolution requires human design for ${requirement.id}`);
      if (spec.human.roleRefs.length === 0) throw new TypeError(`human design requires at least one participant role for ${requirement.id}`);
      if (spec.human.outcomes.length === 0) throw new TypeError(`human design requires at least one outcome for ${requirement.id}`);
      for (const outcome of spec.human.outcomes) {
        requireNonEmpty(outcome.code, 'human outcome code');
        requireNonEmpty(outcome.businessMeaning, 'human outcome businessMeaning');
      }
    } else if (spec.human) {
      throw new TypeError(`non-human capability resolution cannot carry human design for ${requirement.id}`);
    }
    byRequirement.set(spec.requirementRef, spec);
  }
  return byRequirement;
}

export function resolveGenericCapabilities(
  base: CapabilityDesignBundle,
  specs: GenericRequirementResolution[],
  createdAt: string,
): GenericCapabilityResolutionBundle {
  const byRequirement = validateResolution(base, specs);
  const normalizedSpecs = specs.map(normalizedResolution).sort((a, b) => a.requirementRef.localeCompare(b.requirementRef));
  const resolutionDigest = digestDeterministicJson({
    baseCapabilityDesignRevisionId: base.designRevision.id,
    resolverVersion: RESOLVER_VERSION,
    resolutions: normalizedSpecs,
  });
  const designId = cap(`resolved-design:${base.designRevision.id}:${resolutionDigest}`);

  const requirements: CapabilityRequirement[] = [];
  const facets: CapabilityRequirementFacet[] = [];
  const provenanceTraces: CapabilityRequirementProvenanceTrace[] = [];
  const offeringDefinitions: CapabilityOfferingDefinition[] = [];
  const offeringRevisions: CapabilityOfferingRevision[] = [];
  const offeringSafetyProfiles: CapabilityOfferingSafetyProfile[] = [];
  const matchAssessments: CapabilityMatchAssessment[] = [];
  const selectionDecisions: CapabilitySelectionDecision[] = [];
  const bindingDefinitions: CapabilityBindingDefinition[] = [];
  const bindingRevisions: CapabilityBindingRevision[] = [];
  const bindingAssessments: CapabilityBindingAssessment[] = [];
  const humanDesigns: HumanInteractionDesignRevision[] = [];
  const participantRequirements: ParticipantRequirement[] = [];
  const humanOutcomeContracts: HumanOutcomeContract[] = [];
  const humanOutcomes: HumanOutcome[] = [];

  for (const oldRequirement of base.requirements) {
    const spec = byRequirement.get(oldRequirement.id)!;
    const requirementId = cap(`resolved-requirement:${designId}:${oldRequirement.id}`);
    const traceId = cap(`resolved-trace:${requirementId}`);
    const oldFacets = base.facets.filter((facet) => facet.capabilityRequirementId === oldRequirement.id);
    const requirementFacets: CapabilityRequirementFacet[] = oldFacets.map((oldFacet) => {
      const isFamily = oldFacet.facetKind === 'FAMILY' || oldFacet.propertyPath === 'family';
      const isOperation = oldFacet.facetKind === 'OPERATION_INTENT' || oldFacet.propertyPath === 'operationIntent';
      const id = cap(`resolved-facet:${requirementId}:${oldFacet.id}`);
      if (isFamily) {
        return {
          ...oldFacet,
          id,
          capabilityRequirementId: requirementId,
          value: spec.family,
          designBasis: 'CONFIRMED_DESIGN',
          designState: 'REQUIRED',
          authorityRef: spec.authorityRef,
          notes: 'Execution capability family selected by explicit design authority; it is not inferred from the business-action label.',
        };
      }
      if (isOperation && spec.operationIntent) {
        return {
          ...oldFacet,
          id,
          capabilityRequirementId: requirementId,
          value: spec.operationIntent,
          designBasis: 'CONFIRMED_DESIGN',
          designState: 'REQUIRED',
          authorityRef: spec.authorityRef,
        };
      }
      return { ...oldFacet, id, capabilityRequirementId: requirementId };
    });
    const operationIntent = spec.operationIntent ?? oldRequirement.operationIntent;
    requirements.push({
      ...oldRequirement,
      id: requirementId,
      capabilityDesignRevisionId: designId,
      family: spec.family,
      operationIntent,
      requirementBasis: 'CONFIRMED_DESIGN',
      requirementState: 'REQUIRED',
      provenanceTraceRef: traceId,
      facetRefs: requirementFacets.map((facet) => facet.id),
      notes: 'Business work remains pinned to frozen semantics; execution family/provider selection is an explicit downstream design decision.',
    });
    facets.push(...requirementFacets);
    const oldTrace = base.provenanceTraces.find((trace) => trace.id === oldRequirement.provenanceTraceRef);
    if (!oldTrace) throw new TypeError(`base provenance trace missing for ${oldRequirement.id}`);
    provenanceTraces.push({
      ...oldTrace,
      id: traceId,
      requirementId,
      derivationMethod: 'EXPLICIT_EXECUTION_DESIGN_RESOLUTION',
      designerVersion: RESOLVER_VERSION,
      createdAt,
    });

    const offeringDefinitionId = cap(`generic-offering-definition:${requirementId}:${spec.implementationRef}`);
    const offeringRevisionId = cap(`generic-offering-revision:${offeringDefinitionId}:1`);
    const safetyProfileId = cap(`generic-offering-safety:${offeringRevisionId}`);
    const matchId = cap(`generic-match:${requirementId}:${offeringRevisionId}`);
    const selectionId = cap(`generic-selection:${requirementId}:${offeringRevisionId}:${spec.authorityRef}`);
    const bindingDefinitionId = cap(`generic-binding-definition:${requirementId}`);
    const bindingRevisionId = cap(`generic-binding-revision:${bindingDefinitionId}:${offeringRevisionId}`);
    const bindingAssessmentId = cap(`generic-binding-assessment:${bindingRevisionId}`);

    offeringDefinitions.push({
      id: offeringDefinitionId,
      canonicalName: spec.offeringCanonicalName,
      createdAt,
      lifecycleStatus: spec.offeringLifecycleStatus ?? 'TEST_ONLY',
    });
    offeringRevisions.push({
      id: offeringRevisionId,
      capabilityOfferingDefinitionId: offeringDefinitionId,
      version: '1',
      family: spec.family,
      supportedOperationIntents: [operationIntent],
      supportedConstraintRefs: [],
      safetyProfileRef: safetyProfileId,
      implementationKind: spec.implementationKind,
      implementationRef: spec.implementationRef,
      createdAt,
    });
    offeringSafetyProfiles.push({
      id: safetyProfileId,
      offeringRevisionId,
      idempotencySupport: 'EXPLICIT_POLICY_REQUIRED',
      duplicateProtectionSupport: 'ADAPTER_DEFINED',
      completionEvidenceSupport: 'ADAPTER_RESULT_REQUIRED',
      compensationSupport: 'SOURCE_DEFINED',
      auditEvidenceSupport: 'EXECUTION_OBSERVATION_REQUIRED',
      dataProtectionAttributes: [],
      notes: 'Generic offering safety remains explicit and is finalized by runtime policy/deployment design.',
    });
    matchAssessments.push({
      id: matchId,
      requirementId,
      offeringRevisionId,
      matcherVersion: RESOLVER_VERSION,
      result: 'COMPATIBLE',
      satisfiedConstraintRefs: [],
      unsatisfiedConstraintRefs: [],
      unknownConstraintRefs: [],
      inputMappingFeasibility: 'DIRECT',
      outputMappingFeasibility: 'NOT_REQUIRED',
      outcomeCompatibility: 'COMPATIBLE',
      safetyCompatibility: 'COMPATIBLE',
      authCompatibility: 'NOT_REQUIRED',
      findingRefs: [],
      assessedAt: createdAt,
    });
    selectionDecisions.push({
      id: selectionId,
      capabilityRequirementId: requirementId,
      selectedOfferingRevisionId: offeringRevisionId,
      consideredMatchAssessmentRefs: [matchId],
      selectionBasis: 'TECHNICAL_ARCHITECTURE_DECISION',
      authorityRef: spec.authorityRef,
      decidedBy: spec.decidedBy,
      rationale: spec.rationale,
      decidedAt: createdAt,
    });
    bindingDefinitions.push({
      id: bindingDefinitionId,
      capabilityRequirementId: requirementId,
      capabilityDesignRevisionId: designId,
      semanticScopeRef: oldRequirement.semanticScopeRef,
      createdAt,
      lifecycleStatus: 'ACTIVE',
    });
    const bindingDigest = digestDeterministicJson({
      requirementId,
      offeringRevisionId,
      matchId,
      selectionId,
      inputMappingRefs: [],
      outputMappingRefs: [],
      outcomeMappingRefs: [],
      configurationRequirementBindingRefs: [],
      credentialRequirementBindingRefs: [],
      bindingConstraintRefs: [],
    });
    bindingRevisions.push({
      id: bindingRevisionId,
      capabilityBindingDefinitionId: bindingDefinitionId,
      version: '1',
      capabilityRequirementId: requirementId,
      capabilityRequirementFacetSnapshotRefs: requirementFacets.map((facet) => facet.id),
      capabilityOfferingRevisionId: offeringRevisionId,
      matchAssessmentRef: matchId,
      selectionDecisionRef: selectionId,
      inputMappingRefs: [],
      outputMappingRefs: [],
      outcomeMappingRefs: [],
      configurationRequirementBindingRefs: [],
      credentialRequirementBindingRefs: [],
      bindingConstraintRefs: [],
      bindingState: 'READY_FOR_EXECUTION_DESIGN',
      bindingDigest,
      createdAt,
    });
    bindingAssessments.push({
      id: bindingAssessmentId,
      capabilityBindingRevisionId: bindingRevisionId,
      result: 'READY_FOR_EXECUTION_DESIGN',
      findingRefs: [],
      assessedAt: createdAt,
    });

    if (spec.family === 'HUMAN_INTERACTION') {
      const human = spec.human!;
      const humanDesignId = cap(`generic-human-design:${requirementId}`);
      const participantId = cap(`generic-human-participant:${humanDesignId}`);
      const outcomeContractId = cap(`generic-human-outcomes:${humanDesignId}`);
      const outcomes = human.outcomes.map((outcome) => ({
        id: cap(`generic-human-outcome:${humanDesignId}:${outcome.code}`),
        outcomeCode: outcome.code,
        businessMeaning: outcome.businessMeaning,
        requiredEvidenceRefs: [],
        ...(outcome.terminal !== undefined ? { terminalForInteraction: outcome.terminal } : {}),
        facetRefs: [],
      } satisfies HumanOutcome));
      const humanDigest = digestDeterministicJson({
        requirementId,
        interactionKind: human.interactionKind,
        responsibilityKind: human.responsibilityKind,
        roleRefs: human.roleRefs,
        assignmentCardinality: human.assignmentCardinality ?? 'EXACTLY_ONE',
        outcomes: outcomes.map((outcome) => ({ code: outcome.outcomeCode, meaning: outcome.businessMeaning, terminal: outcome.terminalForInteraction ?? false })),
        authorityRef: spec.authorityRef,
      });
      humanDesigns.push({
        id: humanDesignId,
        capabilityDesignRevisionId: designId,
        capabilityRequirementId: requirementId,
        semanticScopeRef: oldRequirement.semanticScopeRef,
        semanticSubjectRefs: oldRequirement.semanticSubjectRefs,
        interactionKind: human.interactionKind,
        participantRequirementRef: participantId,
        informationContractRefs: [],
        outcomeContractRef: outcomeContractId,
        authorityRequirementRefs: [],
        identityAssuranceRequirementRefs: [],
        businessTimingRequirementRefs: [],
        escalationRequirementRefs: [],
        delegationRequirementRefs: [],
        formUseRefs: [],
        evidenceRequirementRefs: [],
        designFacetRefs: [],
        designState: 'COMPLETE',
        designDigest: humanDigest,
        createdAt,
      });
      participantRequirements.push({
        id: participantId,
        humanInteractionDesignRevisionId: humanDesignId,
        responsibilityKind: human.responsibilityKind,
        roleRefs: human.roleRefs,
        actorTypeConstraints: [],
        organizationalConstraintRefs: [],
        eligibilityRuleRefs: [],
        assignmentCardinality: human.assignmentCardinality ?? 'EXACTLY_ONE',
        participantState: 'COMPLETE',
        facetRefs: [],
      });
      humanOutcomeContracts.push({
        id: outcomeContractId,
        humanInteractionDesignRevisionId: humanDesignId,
        outcomeRefs: outcomes.map((outcome) => outcome.id),
        unresolvedOutcomeRefs: [],
      });
      humanOutcomes.push(...outcomes);
    }
  }

  const designDigest = digestDeterministicJson({
    baseCapabilityDesignRevisionId: base.designRevision.id,
    resolutionDigest,
    requirements: requirements.map((requirement) => ({
      id: requirement.id,
      subjects: requirement.semanticSubjectRefs,
      family: requirement.family,
      operationIntent: requirement.operationIntent,
      state: requirement.requirementState,
      facets: requirement.facetRefs,
    })),
  });

  return {
    designRevision: {
      id: designId,
      semanticFreezeRecordId: base.designRevision.semanticFreezeRecordId,
      scopeFreezeRefs: base.designRevision.scopeFreezeRefs,
      processRevisionId: base.designRevision.processRevisionId,
      validationAssessmentRefs: base.designRevision.validationAssessmentRefs,
      requirementRefs: requirements.map((requirement) => requirement.id),
      unresolvedRequirementRefs: [],
      designState: 'READY_FOR_BINDING',
      designDigest,
      createdAt,
      supersedesCapabilityDesignRef: base.designRevision.id,
    },
    requirements,
    facets,
    provenanceTraces,
    offeringDefinitions,
    offeringRevisions,
    offeringSafetyProfiles,
    matchAssessments,
    selectionDecisions,
    bindingDefinitions,
    bindingRevisions,
    bindingAssessments,
    humanDesigns,
    participantRequirements,
    humanOutcomeContracts,
    humanOutcomes,
    resolverVersion: RESOLVER_VERSION,
    resolutionDigest,
  };
}
