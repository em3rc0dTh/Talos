# TALOS — Capability Contract v0.1

Status: **DESIGN CANDIDATE / T4-01 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define how TALOS describes what an accepted business-process semantic scope requires from humans/systems/the external world **without binding that requirement directly to a provider, implementation, credential, n8n workflow, UI widget or Temporal execution primitive**.

T4-01 starts only from reviewed semantic scopes eligible for automation design.

Primary input:

```text
SemanticFreezeRecord
freezeKind = AUTOMATION_DESIGN_HANDOFF
+ ScopeFreezeRecord(disposition = ACCEPTED)
+ ProcessRevision
+ compatible ValidationAssessment
  executionReadiness = READY_FOR_AUTOMATION_DESIGN
```

BUILD remains closed.

---

# 1. Fundamental invariants

```text
BUSINESS ACTION / HUMAN INTERACTION   ≠ CAPABILITY REQUIREMENT AUTOMATICALLY
PROCESS NODE                          may require 0..N CAPABILITY REQUIREMENTS
CAPABILITY REQUIREMENT                ≠ CAPABILITY OFFERING
CAPABILITY OFFERING                   ≠ CAPABILITY BINDING
CAPABILITY MATCH                      ≠ CAPABILITY BINDING
PROVIDER CONSTRAINT                   ≠ PROVIDER BINDING
IMPLEMENTED PROVIDER                  ≠ BUSINESS-REQUIRED PROVIDER
CAPABILITY OFFERING                   ≠ TEMPORAL ACTIVITY
N8N WORKFLOW                          ≠ DURABLE ORCHESTRATION AUTHORITY
CREDENTIAL CONTRACT                   ≠ SECRET VALUE
BUSINESS DEADLINE                     ≠ TEMPORAL TIMEOUT/RETRY POLICY
BUSINESS RECOVERY REQUIREMENT         ≠ TECHNICAL RETRY POLICY
IDEMPOTENCY REQUIREMENT               ≠ IDEMPOTENCY IMPLEMENTATION
CAPABILITY HEALTH                     ≠ IMMUTABLE CAPABILITY DEFINITION
ONE OFFERING                          may satisfy MANY requirement occurrences
SAME CAPABILITY FAMILY                ≠ SAME requirement identity
NO MATCH                              ≠ LICENSE TO INVENT PROVIDER
```

Primary law:

> TALOS first states **what capability is required**. It may then discover **which offerings could satisfy it**. Selecting/configuring one offering is a later explicit binding step, and mapping that binding to Temporal is later still.

---

# 2. CapabilityDesignRevision

Capability design is a separate immutable artifact downstream of accepted semantics.

```text
CapabilityDesignRevision
- id
- processRevisionId
- semanticFreezeRecordId
- acceptedScopeFreezeRefs[]
- designerRef
- designerVersion
- requirementRefs[]
- compatibilityAssessmentRefs[]
- unresolvedRequirementRefs[]
- designDigest
- createdAt
- supersedesDesignRevisionRef?
```

A new process/freeze/design interpretation creates a new revision. It never changes `ProcessRevision`.

---

# 3. CapabilityRequirement

One process-context occurrence of a required real-world/human/system ability.

```text
CapabilityRequirement
- id
- capabilityDesignRevisionId
- semanticScopeRef
- semanticSubjectRefs[]
- family
- operationIntent
- requirementBasis
- inputContractRef?
- outputContractRef?
- outcomeContractRef?
- constraintRefs[]
- safetyRequirementRefs[]
- actorOrResponsibilityRefs[]?
- dataObjectRefs[]?
- requirementState
- provenanceTraceRef
- notes?
```

Requirement identity is process/design-context identity, not reusable provider identity.

---

# 4. CapabilityFamily

Initial source/provider-agnostic families:

```text
HUMAN_INTERACTION
DATA_COLLECTION
COMMUNICATION
SYSTEM_OPERATION
DOCUMENT_FILE
STORAGE
EXTERNAL_WORKFLOW_INVOCATION
AI_TASK
CUSTOM_INTEGRATION
SOURCE_DEFINED
```

Channel/system/provider specificity is expressed as constraints where the accepted semantics actually require it.

Do not create families such as:

```text
GMAIL
TWILIO
N8N
TEMPORAL_ACTIVITY
```

Those are implementation/provider/execution concepts.

---

# 5. operationIntent

Provider-independent semantic intent for the required capability.

Examples:

```text
SEND_NOTIFICATION
SEND_MESSAGE
COLLECT_APPROVAL
COLLECT_DATA
READ_DATA
QUERY_DATA
CREATE_RECORD
UPDATE_RECORD
STORE_DOCUMENT
RETRIEVE_DOCUMENT
GENERATE_DOCUMENT
INVOKE_EXTERNAL_WORKFLOW
CLASSIFY_CONTENT
EXTRACT_INFORMATION
GENERATE_CONTENT
SOURCE_DEFINED
```

Vocabulary may evolve by version. Operation intent is not a provider API operation name.

---

# 6. RequirementBasis

```text
SEMANTIC_EXPLICIT
SEMANTIC_DERIVED
DESIGN_SUGGESTION
CONFIRMED_DESIGN
SOURCE_DEFINED
```

Examples:

```text
"Send confirmation email"
→ COMMUNICATION / SEND_NOTIFICATION
  channel=email constraint
  basis may be SEMANTIC_EXPLICIT

"Notify customer"
→ COMMUNICATION / SEND_NOTIFICATION
  channel remains unknown/unconstrained unless evidence/design authority decides otherwise
```

A design-derived requirement never becomes source truth.

---

# 7. RequirementState

```text
REQUIRED
OPTIONAL
SUGGESTED
UNRESOLVED
DEFERRED
SOURCE_DEFINED
```

State describes capability-design status, not source truth or execution readiness.

---

# 8. CapabilityInputContract

Logical business/process inputs, not provider payload fields.

```text
CapabilityInputContract
- id
- requirementId
- fieldRequirements[]
- schemaRef?
- semanticDataRefs[]
- requiredDataState
```

Each field requirement may reference canonical `DataObject` / `ProcessVariable` semantics.

Provider-specific transformation belongs to later binding.

---

# 9. CapabilityOutputContract

Logical outputs/evidence produced or required from the capability.

```text
CapabilityOutputContract
- id
- requirementId
- resultFieldRequirements[]
- semanticDataRefs[]
- completionEvidenceRefs[]
- outputState
```

Provider response payload shape is not the business output contract automatically.

---

# 10. CapabilityOutcomeContract

Business-observable outcomes needed by downstream semantics.

```text
CapabilityOutcomeContract
- id
- requirementId
- outcomeKinds[]
- requiredOutcomeEvidence[]
- failureOutcomeRequirements[]?
- cancellationOutcomeRequirements[]?
- notes?
```

Examples:

```text
APPROVED / REJECTED
MESSAGE_ACCEPTED / DELIVERY_CONFIRMED where business requires distinction
RECORD_CREATED
DOCUMENT_AVAILABLE
CLASSIFICATION_RESULT
SOURCE_DEFINED
```

Technical HTTP 200 does not automatically equal business success.

---

# 11. CapabilityConstraint

Property-scoped requirement constraint.

```text
CapabilityConstraint
- id
- requirementId
- constraintKind
- propertyPath
- requiredValue?
- allowedValues[]?
- forbiddenValues[]?
- basis
- semanticEvidenceRefs[]
- materiality
```

Candidate kinds:

```text
CHANNEL
SYSTEM
PROVIDER
REGION
DATA_RESIDENCY
FORMAT
ROLE
AUTHORITY
LATENCY_CLASS
BUSINESS_DEADLINE
COMPLIANCE
SOURCE_DEFINED
```

Provider constraint is allowed only when accepted semantic/business policy actually requires it.

```text
provider constraint
≠ selected provider binding
```

---

# 12. CapabilitySafetyRequirement

Business/design safety requirements independent from execution mechanism.

```text
CapabilitySafetyRequirement
- id
- requirementId
- kind
- requiredLevel?
- rationaleRefs[]
- semanticEvidenceRefs[]
```

Kinds may include:

```text
DUPLICATE_SIDE_EFFECT_PROTECTION
IDEMPOTENCY_REQUIRED
OBSERVABLE_COMPLETION_REQUIRED
COMPENSATION_REQUIRED
HUMAN_CONFIRMATION_REQUIRED
AUDIT_EVIDENCE_REQUIRED
DATA_PROTECTION_REQUIRED
SOURCE_DEFINED
```

This says what safety property is needed, not how Temporal/provider implements it.

---

# 13. CapabilityRequirementProvenanceTrace

Capability design must trace back to accepted semantic meaning.

```text
CapabilityRequirementProvenanceTrace
- id
- requirementId
- semanticFreezeRecordId
- scopeFreezeRef
- processRevisionId
- semanticSubjectRefs[]
- semanticClaimRefs[]
- validationAssessmentRefs[]
- derivationMethod
- designerVersion
- createdAt
```

Trace chain:

```text
CapabilityRequirement
← accepted scope freeze
← ProcessRevision / claims
← Provenance / evidence
← original source
```

The requirement itself remains a design artifact.

---

# 14. CapabilityOfferingDefinition

Stable registry identity for a reusable implementation offering.

```text
CapabilityOfferingDefinition
- id
- canonicalName
- owningProviderOrSystemRef?
- createdAt
- lifecycleStatus?
```

Stable identity does not contain mutable implementation details.

---

# 15. CapabilityOfferingRevision

Immutable version of what one implementation offering claims/supports.

```text
CapabilityOfferingRevision
- id
- capabilityOfferingDefinitionId
- version
- family
- supportedOperationIntents[]
- inputSchemaRef?
- outputSchemaRef?
- supportedConstraintRefs[]
- safetyProfileRef?
- authContractRef?
- implementationKind
- implementationRef
- documentationRefs[]?
- createdAt
- supersedesOfferingRevisionRef?
```

An offering revision is not a binding and does not mean it is currently healthy/available.

---

# 16. ImplementationKind

Initial implementation kinds:

```text
DIRECT_API
INTERNAL_SERVICE
MCP_TOOL
N8N_WORKFLOW
HUMAN_SERVICE
AI_SERVICE
DATABASE_ADAPTER
WEBHOOK_ENDPOINT
SOURCE_DEFINED
```

Explicitly forbidden in T4-01:

```text
TEMPORAL_ACTIVITY
TEMPORAL_WORKFLOW
TEMPORAL_SIGNAL
TEMPORAL_UPDATE
```

Those belong to Phase 5 execution mapping.

---

# 17. CapabilityOfferingSafetyProfile

Describes implementation properties available for compatibility evaluation.

```text
CapabilityOfferingSafetyProfile
- id
- offeringRevisionId
- idempotencySupport
- duplicateProtectionSupport
- completionEvidenceSupport
- compensationSupport
- auditEvidenceSupport
- dataProtectionAttributes[]
- notes?
```

This is capability-offering evidence, not a Temporal retry policy.

---

# 18. CapabilityAuthContract

Symbolic authentication/authorization requirement.

```text
CapabilityAuthContract
- id
- offeringRevisionId
- authKind
- requiredPermissionScopes[]?
- credentialClassRefs[]?
- configurationRequirementRefs[]?
```

No secret values are stored here.

Credential material/binding belongs to later secure configuration/binding architecture.

---

# 19. Capability availability / health separation

Current health/availability is mutable operational evidence and therefore not stored as truth on `CapabilityOfferingRevision`.

Use separate future/runtime evidence such as:

```text
CapabilityAvailabilityObservation
```

if needed.

```text
OFFERING CONTRACT ≠ CURRENT HEALTH
```

---

# 20. CapabilityMatchAssessment

Evaluates whether an offering revision could satisfy a requirement.

```text
CapabilityMatchAssessment
- id
- requirementId
- offeringRevisionId
- matcherVersion
- result
- satisfiedConstraintRefs[]
- unsatisfiedConstraintRefs[]
- unknownConstraintRefs[]
- inputMappingFeasibility
- outputMappingFeasibility
- outcomeCompatibility
- safetyCompatibility
- authCompatibility
- findingRefs[]
- assessedAt
```

`result`:

```text
COMPATIBLE
COMPATIBLE_WITH_DESIGN_WORK
INCOMPATIBLE
UNKNOWN
SOURCE_DEFINED
```

A match assessment is not a binding.

---

# 21. CapabilityBinding — boundary only in T4-01

T4-01 defines the boundary but T4-03 owns the full binding contract.

Conceptually:

```text
CapabilityRequirement
        ↓ explicit later decision
CapabilityBinding
        ↓
CapabilityOfferingRevision
        ↓
provider/configuration mapping
```

No matcher may create an accepted binding automatically.

---

# 22. Provider constraint vs implemented-behavior evidence

Example:

```text
SOP accepted meaning: "Send confirmation email"
existing n8n: Gmail node
```

Requirement:

```text
COMMUNICATION / SEND_NOTIFICATION
channel = EMAIL
```

The existing Gmail node is `IMPLEMENTED_BEHAVIOR` evidence and may make Gmail an offering candidate.

It does not create:

```text
provider = Gmail REQUIRED
```

unless accepted business semantics/policy explicitly require Gmail.

---

# 23. Human capability boundary

A human interaction may create a capability requirement such as:

```text
HUMAN_INTERACTION / COLLECT_APPROVAL
role constraint = Manager
outcomes = APPROVED | REJECTED
```

This does not yet define:

```text
form fields
assignment service
UI widget
durable wait implementation
Temporal Signal/Update
```

T4-02 specializes forms/human interaction.

---

# 24. AI capability boundary

AI is not assumed because an action is cognitively complex.

```text
"Classify invoice"
```

may be satisfied by human, rules or AI depending accepted semantics/design constraints.

Only explicit/confirmed AI requirement creates an `AI_TASK` family constraint/requirement.

Offering examples may later include different AI services/models without rewriting business meaning.

---

# 25. n8n boundary

An n8n workflow may be a `CapabilityOfferingRevision` with:

```text
implementationKind = N8N_WORKFLOW
```

It is not:

```text
canonical business process
future provider requirement automatically
Temporal execution plan
```

Whether TALOS later invokes it through a Temporal Activity is Phase 5.

---

# 26. Node-to-requirement cardinality

Required:

```text
one semantic node          → 0..N CapabilityRequirement
one CapabilityRequirement  → one process-context requirement identity
one offering               → may satisfy many requirements
many offerings             → may match one requirement
```

Do not reuse requirement identity merely because labels/families match.

---

# 27. Pure orchestration semantics

Some canonical semantics may need no external capability requirement:

```text
decision evaluation using already-available deterministic data
parallel split/join
pure orchestration wait semantics
process completion
```

Their execution design belongs later.

```text
PROCESS NODE ≠ CAPABILITY REQUIREMENT AUTOMATICALLY
```

---

# 28. Unresolved requirements

If accepted semantics require a capability but no compatible offering is known:

```text
CapabilityRequirement remains REQUIRED / unresolved
```

TALOS may ask for design/provider decisions later.

It must not invent a provider/binding.

---

# 29. Capability design revision history

New semantic freeze, requirement interpretation, registry version or confirmed design decision may create a new `CapabilityDesignRevision`.

Old requirement/match history remains explainable.

A capability-design change does not rewrite the frozen business semantic revision.

---

# 30. Phase boundary

T4-01 does not define:

```text
complete FormDefinition/UI contract        → T4-02
complete CapabilityBinding/provider config → T4-03
credential secret storage                  → T4-03/security implementation
Temporal Activity/retry/timeout mapping    → Phase 5
DeploymentRevision                         → Phase 5
runtime health/telemetry                    → later observability
```

---

# 31. T4-01 gate

T4-01 must prove that capability requirements and reusable offerings can be modeled independently while remaining traceable to accepted business semantics and compatible with later binding/execution design.

BUILD remains closed.
