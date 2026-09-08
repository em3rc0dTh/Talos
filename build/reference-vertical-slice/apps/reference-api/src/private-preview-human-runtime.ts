import type { OneAppAutomationContext } from '../../../packages/application/src/one-app-automation.ts';
import type { GenericRuntimeHumanSnapshot } from '../../../workers/reference-temporal-worker/src/generic-contracts.ts';

/**
 * Resolve executable human-message semantics only from approved design lineage.
 * No business label or free-form runtime payload can create an outcome, role or
 * Temporal primitive that was not already accepted upstream.
 */
export function buildOneAppHumanRuntimeSnapshots(
  context: OneAppAutomationContext,
): GenericRuntimeHumanSnapshot[] {
  const execution = context.executionReview?.execution;
  const selection = context.selection?.resolution;
  const mapping = context.mapping;
  if (!execution) throw new TypeError('TALOS_RUNTIME_EXECUTION_PLAN_REQUIRED: human snapshot needs an ExecutionPlan');

  const humanElements = execution.elements.filter((element) => element.kind === 'HUMAN_COORDINATION');
  if (humanElements.length === 0) return [];
  if (!selection || !mapping) {
    throw new TypeError('TALOS_RUNTIME_HUMAN_LINEAGE_REQUIRED: human execution requires approved capability selection and Temporal mapping');
  }

  return humanElements.map((element) => {
    if (element.capabilityUseRefs.length !== 1) {
      throw new TypeError(`TALOS_RUNTIME_HUMAN_CAPABILITY_USE_REQUIRED: ${element.id}`);
    }
    const capabilityUseOccurrenceRef = element.capabilityUseRefs[0];
    const use = execution.capabilityUses.find((item) => item.id === capabilityUseOccurrenceRef);
    if (!use) throw new TypeError(`TALOS_RUNTIME_HUMAN_CAPABILITY_USE_MISSING: ${capabilityUseOccurrenceRef}`);

    const requirement = selection.requirements.find((item) => item.id === use.capabilityRequirementRef);
    if (!requirement || requirement.family !== 'HUMAN_INTERACTION') {
      throw new TypeError(`TALOS_RUNTIME_HUMAN_REQUIREMENT_MISMATCH: ${capabilityUseOccurrenceRef}`);
    }
    const humanDesign = selection.humanDesigns.find((item) => item.capabilityRequirementId === requirement.id);
    if (!humanDesign || humanDesign.designState !== 'COMPLETE') {
      throw new TypeError(`TALOS_RUNTIME_HUMAN_DESIGN_INCOMPLETE: ${requirement.id}`);
    }
    const participant = selection.participantRequirements.find((item) => item.id === humanDesign.participantRequirementRef);
    if (!participant || participant.participantState !== 'COMPLETE') {
      throw new TypeError(`TALOS_RUNTIME_HUMAN_PARTICIPANT_INCOMPLETE: ${humanDesign.id}`);
    }
    const rolelessAnyEligible = participant.roleRefs.length === 0
      && participant.assignmentCardinality === 'ANY_ELIGIBLE'
      && participant.actorTypeConstraints.includes('HUMAN');
    if (participant.roleRefs.length === 0 && !rolelessAnyEligible) {
      throw new TypeError(`TALOS_RUNTIME_HUMAN_PARTICIPANT_INCOMPLETE: ${humanDesign.id}`);
    }
    if (participant.roleRefs.length > 0 && participant.assignmentCardinality === 'ANY_ELIGIBLE') {
      throw new TypeError(`TALOS_RUNTIME_HUMAN_PARTICIPANT_ASSIGNMENT_CONFLICT: ${humanDesign.id}`);
    }
    const outcomeContract = selection.humanOutcomeContracts.find((item) => item.id === humanDesign.outcomeContractRef);
    if (!outcomeContract || outcomeContract.unresolvedOutcomeRefs.length > 0 || outcomeContract.outcomeRefs.length === 0) {
      throw new TypeError(`TALOS_RUNTIME_HUMAN_OUTCOME_CONTRACT_INCOMPLETE: ${humanDesign.id}`);
    }
    const outcomes = outcomeContract.outcomeRefs.map((outcomeRef) => {
      const outcome = selection.humanOutcomes.find((item) => item.id === outcomeRef);
      if (!outcome) throw new TypeError(`TALOS_RUNTIME_HUMAN_OUTCOME_MISSING: ${outcomeRef}`);
      if (!outcome.outcomeCode.trim() || !outcome.businessMeaning.trim()) {
        throw new TypeError(`TALOS_RUNTIME_HUMAN_OUTCOME_INCOMPLETE: ${outcomeRef}`);
      }
      return {
        outcomeRef: outcome.id,
        outcomeCode: outcome.outcomeCode,
        businessMeaning: outcome.businessMeaning,
        ...(outcome.terminalForInteraction !== undefined
          ? { terminalForInteraction: outcome.terminalForInteraction }
          : {}),
      };
    });
    if (new Set(outcomes.map((outcome) => outcome.outcomeCode)).size !== outcomes.length) {
      throw new TypeError(`TALOS_RUNTIME_HUMAN_OUTCOME_CODE_DUPLICATE: ${humanDesign.id}`);
    }

    const messageUnits = mapping.units.filter((unit) =>
      unit.executionSubjectRefs.includes(element.id)
      && (unit.constructKind === 'UPDATE_HANDLER' || unit.constructKind === 'SIGNAL_HANDLER'),
    );
    if (messageUnits.length !== 1) {
      throw new TypeError(`TALOS_RUNTIME_HUMAN_MESSAGE_MAPPING_REQUIRED: ${element.id}`);
    }
    const waitUnit = mapping.units.find((unit) =>
      unit.executionSubjectRefs.includes(element.id)
      && unit.constructKind === 'WORKFLOW_CONDITION'
      && unit.role === 'WAIT_FOR_ACCEPTED_HUMAN_OUTCOME',
    );
    if (!waitUnit) throw new TypeError(`TALOS_RUNTIME_HUMAN_WAIT_MAPPING_REQUIRED: ${element.id}`);

    return {
      executionElementRef: element.id,
      capabilityUseOccurrenceRef,
      messageKind: messageUnits[0].constructKind as 'UPDATE_HANDLER' | 'SIGNAL_HANDLER',
      participantRoleRefs: [...participant.roleRefs],
      participantAssignmentCardinality: participant.assignmentCardinality,
      participantActorTypeConstraints: [...participant.actorTypeConstraints],
      outcomes,
    };
  });
}
