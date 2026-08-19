# TALOS — Forms / Human Interaction Capability Contract v0.1

Status: **DESIGN CANDIDATE / T4-02 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Specialize the frozen T4-01 capability model for business semantics that require a human to review, approve, reject, correct, choose, acknowledge, sign, upload, provide information, or perform another observable human action.

The contract must preserve the business interaction independently from form rendering, task inbox software, user assignment implementation, identity provider, notification channel, or Temporal waiting/signaling mechanics.

BUILD remains closed.

---

# 1. Fundamental invariants

```text
HUMAN_INTERACTION semantic              != HUMAN CAPABILITY REQUIREMENT
HUMAN CAPABILITY REQUIREMENT            != HUMAN INTERACTION DESIGN
HUMAN INTERACTION DESIGN                != FORM
FORM LOGICAL CONTRACT                    != FORM UI / RENDERER
FORM FIELD                               != UI WIDGET
FIELD ORDER                              != PROCESS EXECUTION ORDER
FORM SUBMIT                              != BUSINESS COMPLETION AUTOMATICALLY
BUTTON LABEL                             != BUSINESS OUTCOME AUTOMATICALLY
CONDITIONAL FIELD VISIBILITY             != PROCESS BRANCH AUTOMATICALLY
BUSINESS VALIDATION RULE                 != CLIENT-SIDE VALIDATOR
ROLE / RESPONSIBILITY                    != ASSIGNED USER ID
ASSIGNEE CONSTRAINT                      != IDENTITY PROVIDER
AUTHORITY REQUIREMENT                    != AUTHORIZATION IMPLEMENTATION
IDENTITY ASSURANCE REQUIREMENT           != LOGIN PROVIDER
BUSINESS DUE CONDITION                   != TEMPORAL TIMER / TIMEOUT
BUSINESS ESCALATION POLICY               != SCHEDULER IMPLEMENTATION
DELEGATION POLICY                        != TASK-INBOX FEATURE
SIGNATURE REQUIREMENT                    != SIGNATURE PROVIDER
ATTACHMENT REQUIREMENT                   != FILE-UPLOAD WIDGET
HUMAN INTERACTION                        may require ZERO forms
ONE HUMAN INTERACTION                    may use 0..N form contracts
ONE FORM REVISION                        may be reused by many interaction designs
CURRENT FORM RENDERER                    != IMMUTABLE FORM CONTRACT
DRAFT / SAVE STATE                       != BUSINESS OUTCOME unless semantics say so
```

Primary law:

> TALOS models what the person must understand, provide, decide, attest or accomplish before it models how a product UI presents or transports that interaction.

---

# 2. Phase-4 entry

T4-02 specializes a frozen T4-01 requirement where relevant, usually:

```text
CapabilityRequirement.family = HUMAN_INTERACTION
or DATA_COLLECTION
```

The parent requirement remains authoritative for capability-design provenance/facets.

T4-02 never rewrites the accepted ProcessRevision or T4-01 requirement.

---

# 3. HumanInteractionDesignRevision

Immutable design snapshot for one human interaction requirement occurrence.

```text
HumanInteractionDesignRevision
- id
- capabilityDesignRevisionId
- capabilityRequirementId
- semanticScopeRef
- semanticSubjectRefs[]
- interactionKind
- participantRequirementRef
- informationContractRefs[]
- outcomeContractRef
- authorityRequirementRefs[]
- identityAssuranceRequirementRefs[]
- businessTimingRequirementRefs[]
- escalationRequirementRefs[]
- delegationRequirementRefs[]
- formUseRefs[]
- evidenceRequirementRefs[]
- designFacetRefs[]
- designState
- designDigest
- createdAt
- supersedesHumanInteractionDesignRef?
```

No UI/runtime provider detail is required for the interaction design to exist.

---

# 4. InteractionKind

Initial vocabulary:

```text
REVIEW
APPROVAL
DECISION
DATA_ENTRY
CORRECTION
CHOICE
ACKNOWLEDGEMENT
SIGNATURE
UPLOAD_PROVISION
MANUAL_ACTION
OBSERVATION
SOURCE_DEFINED
```

A kind describes business interaction intent, not a UI control.

---

# 5. HumanInteractionDesignFacet

Property-level design provenance aligned with T4-01 `CapabilityRequirementFacet`.

```text
HumanInteractionDesignFacet
- id
- humanInteractionDesignRevisionId
- propertyPath
- value?
- valueRef?
- designBasis
- designState
- semanticClaimRefs[]
- capabilityRequirementFacetRefs[]
- authorityRef?
- materiality
- notes?
```

Different interaction properties may have different design bases/states.

---

# 6. ParticipantRequirement

Describes who may/must perform the human interaction at the business-design level.

```text
ParticipantRequirement
- id
- humanInteractionDesignRevisionId
- responsibilityKind
- roleRefs[]
- actorTypeConstraints[]
- organizationalConstraintRefs[]
- eligibilityRuleRefs[]
- assignmentCardinality
- participantState
- facetRefs[]
```

`responsibilityKind` may include:

```text
PERFORMER
APPROVER
REVIEWER
DECISION_AUTHORITY
DATA_PROVIDER
SIGNER
OBSERVER
SOURCE_DEFINED
```

`assignmentCardinality`:

```text
EXACTLY_ONE
ONE_OR_MORE
ANY_ELIGIBLE
ALL_REQUIRED
N_OF_M
SOURCE_DEFINED
```

This does not select a concrete user/account.

---

# 7. AuthorityRequirement

```text
AuthorityRequirement
- id
- humanInteractionDesignRevisionId
- authorityKind
- requiredAuthorityRef?
- scopeRef?
- evidenceRefs[]
- materiality
```

Examples:

```text
MANAGER_APPROVAL_AUTHORITY
FINANCIAL_SIGNOFF_AUTHORITY
LEGAL_SIGNATURE_AUTHORITY
SOURCE_DEFINED
```

Authority requirement is business/governance semantics; implementation IAM belongs later.

---

# 8. IdentityAssuranceRequirement

```text
IdentityAssuranceRequirement
- id
- humanInteractionDesignRevisionId
- assuranceKind
- requiredLevel?
- evidenceOrAttestationRequirements[]
- materiality
```

Examples:

```text
KNOWN_PARTICIPANT
AUTHENTICATED_PARTICIPANT
VERIFIED_IDENTITY
STRONG_AUTHENTICATION_REQUIRED
ANONYMOUS_ALLOWED
SOURCE_DEFINED
```

No OAuth/SSO/identity provider is selected here.

---

# 9. HumanInformationContract

Logical information the person must receive and/or provide.

```text
HumanInformationContract
- id
- humanInteractionDesignRevisionId
- direction
- informationItemRefs[]
- requiredContextRefs[]
- contractState
```

`direction`:

```text
PRESENT_TO_HUMAN
COLLECT_FROM_HUMAN
BIDIRECTIONAL
SOURCE_DEFINED
```

Information is expressed in semantic/business terms, not widget payloads.

---

# 10. HumanInformationItemRequirement

```text
HumanInformationItemRequirement
- id
- informationContractId
- semanticDataRef?
- businessName
- purpose?
- dataTypeOrSchemaRef?
- requiredness
- constraintRefs[]
- evidenceRequirementRefs[]
- facetRefs[]
```

`requiredness`:

```text
REQUIRED
OPTIONAL
CONDITIONAL
SOURCE_DEFINED
```

No HTML input/widget type is required.

---

# 11. HumanOutcomeContract

Business-observable results from the interaction.

```text
HumanOutcomeContract
- id
- humanInteractionDesignRevisionId
- outcomeRefs[]
- completionRuleRef?
- unresolvedOutcomeRefs[]
```

Each:

```text
HumanOutcome
- id
- outcomeCode
- businessMeaning
- semanticOutcomeRef?
- requiredEvidenceRefs[]
- terminalForInteraction?
- facetRefs[]
```

Examples:

```text
APPROVED
REJECTED
NEEDS_CORRECTION
ACKNOWLEDGED
SIGNED
INFORMATION_PROVIDED
MANUAL_ACTION_COMPLETED
SOURCE_DEFINED
```

A UI button named “Submit” is not a business outcome unless explicitly mapped later.

---

# 12. HumanCompletionRule

Defines business evidence needed to consider the interaction complete.

```text
HumanCompletionRule
- id
- humanInteractionDesignRevisionId
- requiredOutcomeRefs[]?
- requiredInformationItemRefs[]?
- requiredEvidenceRefs[]?
- completionExpressionRef?
- materiality
```

This is not a task-runner state-machine definition.

---

# 13. HumanEvidenceRequirement

```text
HumanEvidenceRequirement
- id
- humanInteractionDesignRevisionId
- kind
- semanticPurpose
- requiredness
- retentionOrAuditConstraintRefs[]?
- facetRefs[]
```

Kinds may include:

```text
ATTESTATION
COMMENT
REASON
SIGNATURE
ATTACHMENT
PHOTO
DOCUMENT
TIMESTAMP
IDENTITY_ASSERTION
SOURCE_DEFINED
```

The contract states evidence required, not how it is captured/stored technically.

---

# 14. FormDefinition

Stable logical reusable form identity.

```text
FormDefinition
- id
- canonicalName
- purpose
- createdAt
- lifecycleStatus?
```

A definition is not the rendered UI or a human interaction itself.

---

# 15. FormRevision

Immutable logical form contract revision.

```text
FormRevision
- id
- formDefinitionId
- version
- informationItemBindingRefs[]
- fieldContractRefs[]
- formRuleRefs[]
- outcomeActionRefs[]
- logicalLayoutGroupRefs[]?
- formSemanticDigest
- createdAt
- supersedesFormRevisionRef?
```

A renderer may later display one `FormRevision` differently across web/mobile/other surfaces without changing the logical form contract.

---

# 16. FormFieldContract

Logical field semantics.

```text
FormFieldContract
- id
- formRevisionId
- semanticDataRef?
- informationItemRequirementRef?
- fieldKey
- businessLabel?
- businessPrompt?
- dataTypeOrSchemaRef?
- requiredness
- validationRuleRefs[]
- evidenceRequirementRefs[]
- facetRefs[]
```

Forbidden as authoritative form semantics:

```text
HTML input type
React component name
CSS style
screen coordinates
specific renderer widget
```

Those are later presentation implementation details.

---

# 17. FormRule

```text
FormRule
- id
- formRevisionId
- ruleKind
- targetRefs[]
- conditionRef?
- ruleExpressionRef?
- businessMeaning?
- facetRefs[]
```

`ruleKind`:

```text
DATA_VALIDATION
REQUIREDNESS
VISIBILITY
ENABLEMENT
CROSS_FIELD_CONSISTENCY
BUSINESS_CONSTRAINT
SOURCE_DEFINED
```

Rule discipline:

```text
FORM VISIBILITY / ENABLEMENT RULE
        != PROCESS CONTROL FLOW AUTOMATICALLY
```

A rule may express interaction-level UI/logical behavior without creating a canonical branch.

---

# 18. FormOutcomeAction

Logical association between form/user action intent and business interaction outcome candidate.

```text
FormOutcomeAction
- id
- formRevisionId
- actionIntent
- candidateHumanOutcomeRef?
- requiredInformationItemRefs[]
- facetRefs[]
```

Examples:

```text
SUBMIT_INFORMATION
APPROVE
REJECT
REQUEST_CORRECTION
ACKNOWLEDGE
SIGN
SOURCE_DEFINED
```

A renderer button/control is later mapped to this intent; it is not the outcome itself.

---

# 19. FormUseBinding

Binds a logical form revision to one human interaction design occurrence.

```text
FormUseBinding
- id
- humanInteractionDesignRevisionId
- formRevisionId
- purpose
- interactionStage?
- informationItemMappingRefs[]
- outcomeMappingRefs[]
- bindingState
```

This is an internal design binding between logical interaction/form artifacts, not a provider/integration binding from T4-03.

One interaction may use 0..N forms; one form revision may be reused by many interactions.

---

# 20. Formless interaction

Valid examples:

```text
physical equipment inspection
phone approval recorded by operator
in-person signature observed externally
manual warehouse action
```

TALOS may still require business outcomes/evidence without requiring a `FormRevision`.

```text
HUMAN_INTERACTION != FORM REQUIRED
```

---

# 21. BusinessTimingRequirement

Business timing semantics related to the human interaction.

```text
BusinessTimingRequirement
- id
- humanInteractionDesignRevisionId
- timingKind
- businessExpressionRef
- timezoneRequirement?
- deadlineMeaning?
- facetRefs[]
```

Kinds:

```text
DUE_BY
RESPONSE_WITHIN
AVAILABLE_AFTER
AVAILABLE_UNTIL
SOURCE_DEFINED
```

This does not choose Temporal timers/task timeouts/retry schedules.

---

# 22. EscalationRequirement

```text
EscalationRequirement
- id
- humanInteractionDesignRevisionId
- triggerBusinessConditionRef
- escalationOutcomeOrActionRef
- targetRoleOrAuthorityRefs[]
- facetRefs[]
```

This captures business escalation intent only.

Execution/scheduling/notification mechanisms belong later.

---

# 23. DelegationRequirement

```text
DelegationRequirement
- id
- humanInteractionDesignRevisionId
- delegationPolicy
- allowedDelegateConstraints[]
- authorityPreservationRules[]
- facetRefs[]
```

Delegation business policy is not a task-inbox feature flag.

---

# 24. Assignment boundary

T4-02 can describe eligible participant/authority constraints but does not define concrete runtime assignment.

Later implementation/binding may resolve:

```text
role/eligibility requirement
→ assignment service / directory / task inbox
→ runtime user/account
```

The runtime assignee is not written back as timeless business semantics.

---

# 25. Identity/auth boundary

T4-02 may require identity assurance or authority evidence.

It does not choose:

```text
Auth0
Okta
Google Identity
Microsoft Entra
custom login
```

Provider selection/binding belongs later.

---

# 26. Signature boundary

Business semantics may require signature/attestation with legal/authority properties.

T4-02 records:

```text
what must be signed
who may sign
what evidence/assurance is required
what outcome is established
```

It does not choose DocuSign/Adobe/other provider or cryptographic implementation.

---

# 27. Attachment/upload boundary

An attachment/document evidence requirement can exist independent from:

```text
upload widget
storage provider
file API
Drive/S3 bucket
```

Storage/integration binding belongs T4-03.

---

# 28. Form draft/save behavior

A renderer may support save/resume/draft state, but this is not business semantic meaning unless accepted interaction requirements explicitly make it material.

```text
SAVE_DRAFT != INTERACTION COMPLETED
```

---

# 29. Form revision history

Changing form fields/rules/outcome mapping creates a new immutable `FormRevision` where logical interaction contract changes.

Presentation-only renderer changes do not require a new logical form revision.

A running/future execution must eventually pin a specific form revision through later execution/deployment design.

---

# 30. Privacy / sensitive data requirement

Information/evidence items may carry logical privacy/sensitivity constraints such as:

```text
PERSONAL_DATA
SENSITIVE_PERSONAL_DATA
FINANCIAL_DATA
CONFIDENTIAL_BUSINESS_DATA
SOURCE_DEFINED
```

T4-02 records required handling semantics/constraints, not concrete storage/encryption provider choices.

---

# 31. Outcome vs process transition

A `HumanOutcome` may support a later process branch when frozen canonical semantics establish that relation.

The human-interaction/form contract does not invent process routing merely because multiple outcomes exist.

```text
APPROVE / REJECT outcomes
        != canonical decision edges automatically
```

---

# 32. Phase boundary

T4-02 does not define:

```text
form renderer / component library
collaborative UI implementation
task inbox/provider
runtime user assignment
identity provider/auth implementation
notification provider
file/storage provider
signature provider
Temporal Signal/Update/timer/wait implementation
accepted external provider binding
```

T4-03 and Phase 5 remain downstream.

---

# 33. Gate

T4-02 must prove that human interaction, participant/authority, information, outcomes, evidence, logical forms and business timing can be modeled independently from provider/UI/runtime implementation while remaining traceable to frozen T4-01 requirements and accepted business semantics.

BUILD remains closed.
