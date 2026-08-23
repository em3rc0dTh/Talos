import type { ImmutableDocumentRepository } from '../../foundation/src/repository.ts';
import type { CapabilityReferenceBundle } from '../../capability/src/types.ts';
import type { CapabilityDesignBundle } from '../../capability/src/generic-design.ts';
import type { GenericCapabilityResolutionBundle } from '../../capability/src/generic-resolution.ts';
import type { AutomationCapabilitySelectionResult } from '../../capability/src/automation-capability-selection.ts';

const records = (bundle:CapabilityReferenceBundle) => [
  ['CapabilityDesignRevision', bundle.designRevision],
  ...bundle.requirements.map(x=>['CapabilityRequirement',x] as const),
  ...bundle.facets.map(x=>['CapabilityRequirementFacet',x] as const),
  ...bundle.inputContracts.map(x=>['CapabilityInputContract',x] as const),
  ...bundle.inputFields.map(x=>['CapabilityInputFieldRequirement',x] as const),
  ...bundle.outcomeContracts.map(x=>['CapabilityOutcomeContract',x] as const),
  ...bundle.constraints.map(x=>['CapabilityConstraint',x] as const),
  ...bundle.provenanceTraces.map(x=>['CapabilityRequirementProvenanceTrace',x] as const),
  ['HumanInteractionDesignRevision', bundle.humanDesign] as const,
  ...bundle.humanFacets.map(x=>['HumanInteractionDesignFacet',x] as const),
  ['ParticipantRequirement', bundle.participantRequirement] as const,
  ['HumanInformationContract', bundle.informationContract] as const,
  ...bundle.informationItems.map(x=>['HumanInformationItemRequirement',x] as const),
  ['HumanOutcomeContract', bundle.humanOutcomeContract] as const,
  ...bundle.humanOutcomes.map(x=>['HumanOutcome',x] as const),
  ['FormDefinition', bundle.formDefinition] as const,
  ['FormRevision', bundle.formRevision] as const,
  ...bundle.formFields.map(x=>['FormFieldContract',x] as const),
  ...bundle.formActions.map(x=>['FormOutcomeAction',x] as const),
  ['FormUseBinding', bundle.formUseBinding] as const,
  ...bundle.formInformationMappings.map(x=>['FormInformationItemMapping',x] as const),
  ...bundle.formOutcomeMappings.map(x=>['FormOutcomeMapping',x] as const),
  ['CapabilityOfferingDefinition', bundle.offeringDefinition] as const,
  ['CapabilityOfferingRevision', bundle.offeringRevision] as const,
  ['CapabilityOfferingSafetyProfile', bundle.offeringSafetyProfile] as const,
  ['CapabilityMatchAssessment', bundle.matchAssessment] as const,
  ['CapabilitySelectionDecision', bundle.selectionDecision] as const,
  ['CapabilityBindingDefinition', bundle.bindingDefinition] as const,
  ['CapabilityBindingRevision', bundle.bindingRevision] as const,
  ...bundle.inputMappings.map(x=>['CapabilityInputMapping',x] as const),
  ...bundle.outcomeMappings.map(x=>['CapabilityOutcomeMapping',x] as const),
  ...bundle.configurationSlots.map(x=>['ConfigurationResolutionSlot',x] as const),
  ...bundle.credentialContracts.map(x=>['CredentialResolutionContract',x] as const),
  ['CapabilityBindingAssessment', bundle.bindingAssessment] as const,
] as const;

export function persistCapabilityReferenceBundle(repo:ImmutableDocumentRepository,bundle:CapabilityReferenceBundle):void{
  for(const [kind,payload] of records(bundle)){
    repo.append({id:(payload as any).id,aggregateKind:kind,schemaVersion:'phase4-reference-v0.2',payload,createdAt:(payload as any).createdAt??(payload as any).assessedAt??(payload as any).decidedAt??bundle.designRevision.createdAt});
  }
}

export function persistGenericCapabilityDesign(repo:ImmutableDocumentRepository,bundle:CapabilityDesignBundle):void{
  const genericRecords = [
    ['CapabilityDesignRevision', bundle.designRevision],
    ...bundle.requirements.map(x=>['CapabilityRequirement',x] as const),
    ...bundle.facets.map(x=>['CapabilityRequirementFacet',x] as const),
    ...bundle.provenanceTraces.map(x=>['CapabilityRequirementProvenanceTrace',x] as const),
  ] as const;
  for(const [kind,payload] of genericRecords){
    repo.append({
      id:(payload as any).id,
      aggregateKind:kind,
      schemaVersion:'phase4-generic-capability-design-v0.1',
      payload,
      createdAt:(payload as any).createdAt??bundle.designRevision.createdAt,
    });
  }
}

export function persistGenericCapabilityResolution(repo:ImmutableDocumentRepository,bundle:GenericCapabilityResolutionBundle):void{
  const resolvedRecords:Array<[string,any]> = [
    ['CapabilityDesignRevision', bundle.designRevision],
    ...bundle.requirements.map(x=>['CapabilityRequirement',x] as [string,any]),
    ...bundle.facets.map(x=>['CapabilityRequirementFacet',x] as [string,any]),
    ...bundle.provenanceTraces.map(x=>['CapabilityRequirementProvenanceTrace',x] as [string,any]),
    ...bundle.offeringDefinitions.map(x=>['CapabilityOfferingDefinition',x] as [string,any]),
    ...bundle.offeringRevisions.map(x=>['CapabilityOfferingRevision',x] as [string,any]),
    ...bundle.offeringSafetyProfiles.map(x=>['CapabilityOfferingSafetyProfile',x] as [string,any]),
    ...bundle.matchAssessments.map(x=>['CapabilityMatchAssessment',x] as [string,any]),
    ...bundle.selectionDecisions.map(x=>['CapabilitySelectionDecision',x] as [string,any]),
    ...bundle.bindingDefinitions.map(x=>['CapabilityBindingDefinition',x] as [string,any]),
    ...bundle.bindingRevisions.map(x=>['CapabilityBindingRevision',x] as [string,any]),
    ...bundle.bindingAssessments.map(x=>['CapabilityBindingAssessment',x] as [string,any]),
    ...bundle.humanDesigns.map(x=>['HumanInteractionDesignRevision',x] as [string,any]),
    ...bundle.participantRequirements.map(x=>['ParticipantRequirement',x] as [string,any]),
    ...bundle.humanOutcomeContracts.map(x=>['HumanOutcomeContract',x] as [string,any]),
    ...bundle.humanOutcomes.map(x=>['HumanOutcome',x] as [string,any]),
  ];
  for(const [kind,payload] of resolvedRecords){
    repo.append({
      id:payload.id,
      aggregateKind:kind,
      schemaVersion:'phase4-generic-capability-resolution-v0.1',
      payload,
      createdAt:payload.createdAt??payload.assessedAt??payload.decidedAt??bundle.designRevision.createdAt,
    });
  }
}

export function persistAutomationCapabilitySelection(
  repo: ImmutableDocumentRepository,
  result: AutomationCapabilitySelectionResult,
): void {
  persistGenericCapabilityResolution(repo, result.resolution);
  for (const trace of result.traces) {
    repo.append({
      id: trace.id as any,
      aggregateKind: 'AutomationCapabilitySelectionTrace',
      schemaVersion: 'i8-04-automation-capability-selection-v0.1',
      payload: trace,
      createdAt: trace.createdAt,
    });
  }
}
