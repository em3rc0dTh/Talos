# TALOS — Forms / Human Interaction Capability Contract v0.2

Status: **DESIGN CANDIDATE / T4-02 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T4-02 design: `28-FORMS-HUMAN-INTERACTION-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial T4-02 pressure test:

```text
U01–U36
34 PASS
 2 FAIL
```

Failures:

```text
U05 — reusable form field coupled to one process-context information requirement
U06 — reusable form action coupled to one process-context HumanOutcome
```

v0.2 separates reusable form-local identity from process-context use mappings.

No frozen Phase-1/2/3/T4-01 contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
FORM-LOCAL FIELD IDENTITY              != PROCESS INFORMATION-ITEM IDENTITY
FORM-LOCAL ACTION IDENTITY             != PROCESS HUMAN-OUTCOME IDENTITY
REUSABLE FormRevision                  must not acquire one use's process identity
FORM USE MAPPING                       = process-context semantic bridge
FORM REUSE                             != form mutation per process occurrence
FORM DESIGN PROVENANCE                 != active process-use binding
```

Primary reuse law:

> A reusable `FormRevision` owns only form-local logical fields/actions/rules. Every process-context semantic association is made through an immutable `FormUseBinding` and its mappings.

---

# 2. HumanInteractionDesignRevision

Retain v0.1 unchanged conceptually:

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

Human interaction remains independent from forms/provider/runtime mechanics.

---

# 3. Interaction / participant / authority / identity model

Retain v0.1:

```text
InteractionKind
ParticipantRequirement
AuthorityRequirement
IdentityAssuranceRequirement
HumanInteractionDesignFacet
```

Critical distinctions remain:

```text
role != runtime user
business authority != IAM implementation
identity assurance != identity provider
```

---

# 4. Human information / outcomes / evidence

Retain process-context structures:

```text
HumanInformationContract
HumanInformationItemRequirement
HumanOutcomeContract
HumanOutcome
HumanCompletionRule
HumanEvidenceRequirement
```

These belong to the human interaction design occurrence and may trace to accepted semantic/T4-01 requirement facets.

---

# 5. FormDefinition

Retain stable reusable logical identity:

```text
FormDefinition
- id
- canonicalName
- purpose
- createdAt
- lifecycleStatus?
```

---

# 6. FormRevision — revised provenance ownership

```text
FormRevision
- id
- formDefinitionId
- version
- fieldContractRefs[]
- formRuleRefs[]
- outcomeActionRefs[]
- logicalLayoutGroupRefs[]?
- formDesignFacetRefs[]
- formSemanticDigest
- createdAt
- supersedesFormRevisionRef?
```

Removed process-context-owned field from active v0.1 shape:

```text
informationItemBindingRefs[]
```

Process information mapping belongs to `FormUseBinding`.

---

# 7. FormFieldContract — revised in v0.2

Reusable form-local logical field:

```text
FormFieldContract
- id
- formRevisionId
- fieldKey
- businessLabel?
- businessPrompt?
- logicalDataTypeOrSchemaRef?
- requirednessDefault?
- validationRuleRefs[]
- evidenceClassRefs[]?
- formDesignFacetRefs[]
```

Removed as active authoritative process-context references:

```text
semanticDataRef
informationItemRequirementRef
```

Those associations are established per use.

No UI widget/component type is semantic authority.

---

# 8. FormOutcomeAction — revised in v0.2

Reusable form-local action intent:

```text
FormOutcomeAction
- id
- formRevisionId
- actionKey
- actionIntent
- requiredFormFieldRefs[]?
- formDesignFacetRefs[]
```

Removed:

```text
candidateHumanOutcomeRef
```

A form-local action becomes a process-context human outcome only through a use mapping.

---

# 9. FormDesignFacet — new/clarified in v0.2

Reusable form design may retain its own property-level design history without becoming bound to one process use.

```text
FormDesignFacet
- id
- formRevisionId
- propertyPath
- value?
- valueRef?
- designBasis
- designState
- originatingDesignRefs[]?
- authorityRef?
- materiality
```

`originatingDesignRefs[]` may explain where a reusable form idea came from, but does not make that origin the active process-use mapping.

---

# 10. FormUseBinding — revised in v0.2

```text
FormUseBinding
- id
- humanInteractionDesignRevisionId
- formRevisionId
- purpose
- interactionStage?
- informationItemMappingRefs[]
- outcomeMappingRefs[]
- useRuleOverrideRefs[]?
- bindingState
- createdAt
```

It pins one exact immutable `FormRevision`.

This is a logical human-interaction/form design binding, not T4-03 provider binding.

---

# 11. FormInformationItemMapping — new in v0.2

```text
FormInformationItemMapping
- id
- formUseBindingId
- humanInformationItemRequirementRef
- formFieldContractRef
- direction
- mappingKind
- requirednessOverride?
- mappingState
- designFacetRefs[]?
```

`mappingKind`:

```text
DIRECT
TRANSFORM_REQUIRED
COMPOSITE
SOURCE_DEFINED
```

This preserves process-context information identity separately from reusable form field identity.

---

# 12. FormOutcomeMapping — new in v0.2

```text
FormOutcomeMapping
- id
- formUseBindingId
- formOutcomeActionRef
- humanOutcomeRef
- mappingState
- designFacetRefs[]?
```

One form-local `submit`/`approve` action may map to different business outcomes in different form uses.

A mapping does not create a canonical process edge automatically.

---

# 13. Reuse canonical example

Shared form:

```text
FormRevision F1
field: reason
action: submit
```

Interaction A:

```text
HumanInformationItemRequirement A.reason
HumanOutcome A.REJECTED
```

Binding A:

```text
A.reason  → F1.reason
F1.submit → A.REJECTED
```

Interaction B:

```text
HumanInformationItemRequirement B.reason
HumanOutcome B.REJECTED_EXCEPTION
```

Binding B:

```text
B.reason  → F1.reason
F1.submit → B.REJECTED_EXCEPTION
```

`F1` never mutates and never inherits A/B process identity.

---

# 14. Form rules

Retain v0.1 `FormRule`:

```text
DATA_VALIDATION
REQUIREDNESS
VISIBILITY
ENABLEMENT
CROSS_FIELD_CONSISTENCY
BUSINESS_CONSTRAINT
SOURCE_DEFINED
```

Use-specific requiredness or mapping constraints may be carried as use overrides where necessary.

Still:

```text
form visibility != process branch automatically
field order != process order
```

---

# 15. Formless / multiple-form interaction

Retain:

```text
HumanInteractionDesignRevision → 0..N FormUseBinding
FormRevision → reused by 0..N interaction designs
```

No form requirement is invented for physical/manual/phone/external interactions.

---

# 16. Timing / escalation / delegation

Retain v0.1:

```text
BusinessTimingRequirement
EscalationRequirement
DelegationRequirement
```

Business semantics remain independent from task runner/scheduler/Temporal implementation.

---

# 17. Signature / attachment / privacy

Retain v0.1 evidence and privacy boundaries:

```text
signature requirement != signature provider
attachment requirement != upload/storage provider
privacy constraint != storage/encryption provider
```

---

# 18. Assignment / identity boundary

Retain:

```text
ParticipantRequirement != runtime assignment
IdentityAssuranceRequirement != identity provider
AuthorityRequirement != IAM policy implementation
```

---

# 19. Completion / outcome boundary

Retain:

```text
form submit != business completion automatically
form action != HumanOutcome until explicit use mapping
HumanOutcome != canonical edge automatically
```

---

# 20. Version/history

Logical form changes create new `FormRevision`; interaction changes create new `HumanInteractionDesignRevision`; use mapping changes create new binding/mapping history according to design revision policy.

Presentation-only renderer changes remain outside logical form history.

---

# 21. Phase boundary

T4-02 still excludes:

```text
renderer/widget selection
task inbox/provider
runtime assignment
identity provider
storage/signature provider
accepted external capability binding
Temporal Signal/Update/timer implementation
```

---

# 22. Regression target

v0.2 must pass all U01–U36, especially:

```text
U04–U06 reusable-form anti-coupling
U23 exact FormRevision pinning
U34 process information mapping per form use
U35 process outcome mapping per form use
```

BUILD remains closed.
