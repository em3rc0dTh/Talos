# TALOS — Integration / Capability Binding Contract v0.1

Status: **DESIGN CANDIDATE / T4-03 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define the explicit design decision that binds one process-context `CapabilityRequirement` to one immutable compatible `CapabilityOfferingRevision`, maps logical business inputs/outputs/outcomes to the offering interface, and describes required configuration/credential slots without rewriting business semantics or introducing Temporal execution mechanics.

BUILD remains closed.

---

# 1. Fundamental invariants

```text
CAPABILITY MATCH                       != CAPABILITY BINDING
BEST / ONLY MATCH                      != AUTO-BIND AUTHORITY
CAPABILITY BINDING                     != BUSINESS SEMANTIC TRUTH
BINDING REVISION                       != ProcessRevision MUTATION
OFFERING REVISION                      != PROVIDER CURRENT HEALTH
LOGICAL INPUT                           != PROVIDER INPUT
LOGICAL OUTPUT                          != PROVIDER OUTPUT
BUSINESS OUTCOME                        != PROVIDER STATUS CODE
DATA MAPPING                            != BUSINESS RULE AUTOMATICALLY
CONFIGURATION CONTRACT                  != CONFIGURATION VALUE
CREDENTIAL SLOT                         != CREDENTIAL VALUE
CREDENTIAL REFERENCE                    != SECRET MATERIAL
BINDING DESIGN                          != DEPLOYMENT ENVIRONMENT
ENVIRONMENT CONFIGURATION               != BINDING DESIGN AUTOMATICALLY
PROVIDER VERSION CHANGE                 != SILENT BINDING UPDATE
BINDING CHANGE                          != BUSINESS SEMANTIC CHANGE AUTOMATICALLY
N8N OFFERING BINDING                    != ORCHESTRATION AUTHORITY TRANSFER
CAPABILITY BINDING                      != TEMPORAL ACTIVITY
```

Primary law:

> TALOS selects and maps a capability implementation explicitly, pins immutable versions, keeps secret/configuration material separate, and leaves durable runtime mapping/deployment to Phase 5.

---

# 2. CapabilityBindingDefinition

Stable process-design identity for the binding of one requirement occurrence.

```text
CapabilityBindingDefinition
- id
- capabilityRequirementId
- capabilityDesignRevisionId
- semanticScopeRef
- createdAt
- lifecycleStatus?
```

One requirement has zero or one active accepted binding definition by default unless an explicit multi-binding strategy is modeled.

---

# 3. CapabilityBindingRevision

Immutable selected implementation design.

```text
CapabilityBindingRevision
- id
- capabilityBindingDefinitionId
- version
- capabilityRequirementId
- capabilityRequirementFacetSnapshotRefs[]
- capabilityOfferingRevisionId
- matchAssessmentRef
- selectionDecisionRef
- inputMappingRefs[]
- outputMappingRefs[]
- outcomeMappingRefs[]
- configurationRequirementBindingRefs[]
- credentialRequirementBindingRefs[]
- bindingConstraintRefs[]
- bindingState
- bindingDigest
- createdAt
- supersedesBindingRevisionRef?
```

No secret values are stored.

---

# 4. CapabilitySelectionDecision

Explicit authority-backed selection record.

```text
CapabilitySelectionDecision
- id
- capabilityRequirementId
- selectedOfferingRevisionId
- consideredMatchAssessmentRefs[]
- selectionBasis
- authorityRef?
- decidedBy
- rationale?
- decidedAt
```

`selectionBasis`:

```text
MATCH_COMPATIBILITY
BUSINESS_CONSTRAINT
TECHNICAL_ARCHITECTURE_DECISION
EXISTING_IMPLEMENTATION_REUSE
COST_OR_OPERATING_DECISION
HUMAN_CONFIRMED_DESIGN
SOURCE_DEFINED
```

Existing implementation reuse may justify a design choice, but it does not rewrite the semantic requirement.

---

# 5. BindingState

```text
DRAFT
SELECTED
MAPPING_INCOMPLETE
CONFIGURATION_INCOMPLETE
READY_FOR_EXECUTION_DESIGN
SUPERSEDED
SOURCE_DEFINED
```

`READY_FOR_EXECUTION_DESIGN` means the binding design is complete enough for Phase 5. It does not mean deployable or runnable.

---

# 6. CapabilityInputMapping

Maps logical capability input to offering input.

```text
CapabilityInputMapping
- id
- bindingRevisionId
- requirementInputRef
- offeringInputRef
- mappingKind
- transformContractRef?
- mappingState
- evidenceRefs[]?
```

`mappingKind`:

```text
DIRECT
RENAME
STRUCTURAL_TRANSFORM
VALUE_TRANSFORM
COMPOSITE
CONSTANT_NON_SECRET
SOURCE_DEFINED
```

A mapping does not become a new business rule unless accepted semantics/design authority establish one.

---

# 7. CapabilityOutputMapping

```text
CapabilityOutputMapping
- id
- bindingRevisionId
- offeringOutputRef
- requirementOutputRef
- mappingKind
- transformContractRef?
- mappingState
```

Provider response fields remain implementation detail while logical outputs remain capability/business design.

---

# 8. CapabilityOutcomeMapping

Maps provider/implementation evidence to required business-observable outcomes.

```text
CapabilityOutcomeMapping
- id
- bindingRevisionId
- requirementOutcomeRef
- offeringEvidenceRefs[]
- interpretationRuleRef?
- mappingState
```

Example:

```text
provider accepted message != delivery confirmed
```

If required business outcome cannot be observed from the offering, the binding is incomplete/incompatible for execution design.

---

# 9. MappingTransformContract

Logical deterministic/controlled transform description.

```text
MappingTransformContract
- id
- transformKind
- inputSchemaRef?
- outputSchemaRef?
- expressionOrFunctionContractRef?
- determinismRequirement?
- validationRuleRefs[]
- designFacetRefs[]
```

This is mapping design, not Temporal workflow code.

Opaque code may be referenced as an implementation contract but cannot silently alter business meaning.

---

# 10. OfferingConfigurationRequirement

Offering-side named configuration slot/contract.

```text
OfferingConfigurationRequirement
- id
- offeringRevisionId
- key
- valueClass
- requiredness
- sensitivityClass
- allowedValueContractRef?
- environmentDependent?
```

Examples:

```text
base URL
tenant ID
sender identity
folder ID
workflow ID
model profile
```

This is not a configured value.

---

# 11. ConfigurationRequirementBinding

Binding design states how a configuration requirement will be sourced, without forcing deployment-environment values into the immutable implementation selection.

```text
ConfigurationRequirementBinding
- id
- bindingRevisionId
- offeringConfigurationRequirementRef
- resolutionKind
- staticNonSecretValue?
- valueSourceRef?
- environmentDependent
- resolutionState
```

`resolutionKind`:

```text
STATIC_NON_SECRET
ENVIRONMENT_VALUE
DEPLOYMENT_VALUE
SECRET_DERIVED_REFERENCE
RUNTIME_CONTEXT
SOURCE_DEFINED
```

Secret material itself is forbidden.

---

# 12. CredentialRequirementBinding

Maps an offering auth/credential class/slot to a symbolic secure reference requirement.

```text
CredentialRequirementBinding
- id
- bindingRevisionId
- capabilityAuthContractRef
- credentialSlotRef?
- credentialClassRef
- resolutionKind
- secureReferenceRef?
- environmentDependent
- resolutionState
```

Rules:

```text
secureReferenceRef = opaque locator/handle only
secret bytes/tokens/passwords = forbidden
```

A missing credential may leave execution/deployment incomplete without invalidating business semantics.

---

# 13. BindingConstraint

Implementation-selection constraint or verified property.

```text
BindingConstraint
- id
- bindingRevisionId
- requirementFacetRef?
- constraintKind
- expectedValue?
- offeringEvidenceRef?
- state
- materiality
```

Examples:

```text
EMAIL channel satisfied
Microsoft 365 provider constraint satisfied
EU region supported
required audit evidence supported
```

---

# 14. Binding compatibility recheck

A binding revision must pin or re-evaluate compatibility against the exact selected offering revision and relevant requirement facets.

```text
CapabilityRequirement snapshot
+ OfferingRevision
+ MatchAssessment
+ explicit SelectionDecision
→ BindingRevision
```

A later offering revision does not silently replace the pinned one.

---

# 15. Provider version/history

If provider/API/offering contract evolves:

```text
OfferingRevision V1
OfferingRevision V2
```

existing binding remains pinned to V1 until explicit new binding revision/migration decision.

No mutable “latest provider contract” lookup is allowed as binding truth.

---

# 16. Existing implementation reuse

Existing automation may supply:

```text
IMPLEMENTED_BEHAVIOR evidence
+ candidate offering
+ configuration hints
```

Explicit reuse may be selected via `CapabilitySelectionDecision`.

Still:

```text
existing implementation != required semantic provider
```

---

# 17. n8n binding

An n8n workflow offering can be selected:

```text
CapabilityOfferingRevision
implementationKind = N8N_WORKFLOW
```

Binding may pin:

```text
workflow offering revision
logical input/output/outcome mappings
symbolic configuration/credential needs
```

It does not declare n8n the durable process owner.

Phase 5 may later decide how durable orchestration invokes it.

---

# 18. Human service/form binding boundary

T4-03 may later select offerings for supporting services such as:

```text
task inbox
identity directory
signature service
file storage
notification provider
```

But T4-02 `HumanInteractionDesignRevision` / `FormRevision` remain logical design artifacts and are not rewritten to provider types.

---

# 19. Binding validation

Introduce design-level assessment:

```text
CapabilityBindingAssessment
- id
- bindingRevisionId
- validatorVersion
- findingRefs[]
- bindingReadiness
- assessedAt
```

`bindingReadiness`:

```text
INCOMPLETE_SELECTION
INCOMPLETE_MAPPING
INCOMPLETE_CONFIGURATION_CONTRACT
INCOMPLETE_CREDENTIAL_CONTRACT
OUTCOME_UNOBSERVABLE
SAFETY_INCOMPATIBLE
READY_FOR_EXECUTION_DESIGN
SOURCE_DEFINED
```

This is Phase-4 design readiness, not deployment readiness.

---

# 20. Environment / deployment boundary

T4-03 binding design may declare:

```text
environmentDependent = true
```

and symbolic value/credential sources.

Concrete deployment environment realization remains downstream.

Do not store:

```text
production secret token
production worker/task queue
Temporal namespace
runtime endpoint health
```

as T4-03 business/capability binding truth.

---

# 21. Multiple environments

The same `CapabilityBindingRevision` may conceptually be realized in several environments when environment-dependent requirements are resolved separately later.

A provider selection/mapping change creates a new binding revision; an environment secret rotation does not rewrite the binding design.

---

# 22. Binding change vs semantic change

Changing:

```text
Gmail → Microsoft 365
API v1 → API v2
n8n workflow offering revision
```

may be a pure capability-binding design change when frozen business requirements remain satisfied.

It creates new capability/binding design history, not a new `ProcessRevision` automatically.

If the new provider changes accepted business semantics/outcomes/constraints, semantic review must reopen explicitly.

---

# 23. No automatic binding

No ranking/matcher may create an accepted `CapabilitySelectionDecision`.

Explicit authority/design decision is required.

```text
COMPATIBLE != SELECTED
```

---

# 24. Phase-5 handoff

Phase 5 receives pinned:

```text
ProcessRevision / SemanticFreeze
CapabilityDesignRevision
CapabilityBindingRevision(s)
HumanInteractionDesignRevision / FormRevision(s)
CapabilityBindingAssessment(s)
```

and then designs durable execution mappings.

T4-03 does not define Temporal Activities, retry/timeout policy, task queues, workflows or deployment revisions.

---

# 25. Gate

T4-03 must prove that explicit offering selection, data/outcome mapping and symbolic configuration/credential requirements can be versioned and audited independently from business semantics, environment/deployment realization and Temporal execution mechanics.

BUILD remains closed.
