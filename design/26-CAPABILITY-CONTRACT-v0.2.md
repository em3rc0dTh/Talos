# TALOS — Capability Contract v0.2

Status: **DESIGN CANDIDATE / T4-01 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T4-01 design: `26-CAPABILITY-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial T4-01 pressure test:

```text
K01–K32
31 PASS
 1 FAIL
```

Failure:

```text
K12 — one CapabilityRequirement may contain material properties with different design/evidence bases
```

v0.1 separated requirement, offering, match and later binding correctly, but `CapabilityRequirement.requirementBasis` was one requirement-wide basis.

v0.2 introduces property/facet-level capability design provenance:

```text
CapabilityRequirementFacet
```

No frozen Phase-1/2/3 contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
ONE CAPABILITY REQUIREMENT             may contain MULTIPLE design/evidence bases
REQUIREMENT OBJECT SUMMARY             ≠ PROPERTY-LEVEL DESIGN AUTHORITY
SEMANTIC_EXPLICIT FACET                 ≠ SEMANTIC_DERIVED FACET
IMPLEMENTED-BEHAVIOR EVIDENCE           ≠ HARD REQUIREMENT AUTOMATICALLY
DESIGN SUGGESTION                       ≠ REQUIRED CONSTRAINT
MATCHER                                 must evaluate ACTIVE MATERIAL FACETS
SUMMARY STATE                           ≠ permission to flatten facet provenance
```

Primary law:

> Capability matching and later binding decisions must be explainable property by property back to accepted semantic meaning or explicit design authority.

---

# 2. CapabilityDesignRevision

Retain v0.1:

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

---

# 3. CapabilityRequirement — revised

```text
CapabilityRequirement
- id
- capabilityDesignRevisionId
- semanticScopeRef
- semanticSubjectRefs[]
- family
- operationIntent
- facetRefs[]
- inputContractRef?
- outputContractRef?
- outcomeContractRef?
- constraintRefs[]
- safetyRequirementRefs[]
- actorOrResponsibilityRefs[]?
- dataObjectRefs[]?
- requirementState
- optionalSummaryBasis?
- provenanceTraceRef
- notes?
```

Removed as authoritative:

```text
requirementBasis
```

`optionalSummaryBasis` may be derived for display only and cannot drive material matching/binding decisions.

---

# 4. CapabilityRequirementFacet — new in v0.2

```text
CapabilityRequirementFacet
- id
- requirementId
- facetKind
- propertyPath
- value?
- valueRef?
- designBasis
- designState
- semanticSubjectRefs[]
- semanticClaimRefs[]
- sourceEvidenceRefs[]?
- authorityRef?
- confidence?
- materiality
- notes?
```

`facetKind`:

```text
FAMILY
OPERATION_INTENT
INPUT
OUTPUT
OUTCOME
CONSTRAINT
SAFETY
ACTOR_RESPONSIBILITY
DATA_MEANING
SOURCE_DEFINED
```

---

# 5. DesignBasis

```text
SEMANTIC_EXPLICIT
SEMANTIC_DERIVED
IMPLEMENTED_BEHAVIOR_EVIDENCE
DESIGN_SUGGESTION
HUMAN_CONFIRMED_DESIGN
POLICY_REQUIRED
SOURCE_DEFINED
```

Rules:

```text
SEMANTIC_EXPLICIT
→ accepted semantic meaning directly states the property

SEMANTIC_DERIVED
→ required capability-design consequence derived from accepted semantics

IMPLEMENTED_BEHAVIOR_EVIDENCE
→ current/existing implementation evidence only; does not become hard requirement automatically

DESIGN_SUGGESTION
→ proposed design, not accepted requirement automatically

HUMAN_CONFIRMED_DESIGN / POLICY_REQUIRED
→ explicit Phase-4 design authority as applicable
```

---

# 6. DesignState

```text
REQUIRED
OPTIONAL
SUGGESTED
UNRESOLVED
DEFERRED
CONFIRMED
SOURCE_DEFINED
```

A facet's state is independent from its basis.

Example:

```text
provider = Gmail
basis = IMPLEMENTED_BEHAVIOR_EVIDENCE
designState = SUGGESTED
```

must not be treated as:

```text
provider constraint = REQUIRED
```

without new authority/accepted design evidence.

---

# 7. K12 canonical example

Accepted semantics:

```text
"Send confirmation email"
```

Requirement:

```text
CapabilityRequirement R
  family = COMMUNICATION
  operationIntent = SEND_NOTIFICATION
```

Facets:

```text
F1
propertyPath = family
value = COMMUNICATION
designBasis = SEMANTIC_DERIVED
designState = REQUIRED

F2
propertyPath = operationIntent
value = SEND_NOTIFICATION
designBasis = SEMANTIC_DERIVED
designState = REQUIRED

F3
propertyPath = constraints.channel
value = EMAIL
designBasis = SEMANTIC_EXPLICIT
designState = REQUIRED
```

If existing automation uses Gmail:

```text
F4 (optional candidate design facet or offering evidence link)
propertyPath = candidateProvider
value = Gmail
designBasis = IMPLEMENTED_BEHAVIOR_EVIDENCE
designState = SUGGESTED
```

or preferably Gmail appears only as a candidate `CapabilityOfferingRevision` / match context.

Either way, it cannot become a hard provider requirement without explicit accepted design/business authority.

---

# 8. Requirement summary state

`CapabilityRequirement.requirementState` is a derived/process-design summary.

Material evaluation must inspect facets/constraints/safety requirements.

For example:

```text
family REQUIRED
operation REQUIRED
channel UNRESOLVED
```

may yield requirement summary:

```text
UNRESOLVED
```

without losing which property is unresolved.

---

# 9. CapabilityConstraint — aligned with facets

Retain v0.1 structure, but every material constraint must either:

```text
reference corresponding CapabilityRequirementFacet
```

or carry equivalent property-scoped basis/state/evidence fields.

Preferred active model:

```text
CapabilityConstraint
- id
- requirementId
- requirementFacetRef
- constraintKind
- propertyPath
- requiredValue?
- allowedValues[]?
- forbiddenValues[]?
- materiality
```

The facet is the authority for design basis/state/evidence.

---

# 10. Input/output/outcome/safety provenance

Material properties inside:

```text
CapabilityInputContract
CapabilityOutputContract
CapabilityOutcomeContract
CapabilitySafetyRequirement
```

must be traceable through `CapabilityRequirementFacet` or equivalent property-level evidence references.

A whole contract may not inherit one basis merely for convenience.

---

# 11. Capability families / operation intents

Retain v0.1 provider-agnostic families:

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

Provider/execution names remain excluded as families.

Operation intents remain provider-independent.

---

# 12. Offering model

Retain v0.1:

```text
CapabilityOfferingDefinition
CapabilityOfferingRevision
CapabilityOfferingSafetyProfile
CapabilityAuthContract
```

Offering revisions remain immutable reusable implementation descriptions, not bindings or current-health truth.

---

# 13. ImplementationKind

Retain:

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

Still forbidden:

```text
TEMPORAL_ACTIVITY
TEMPORAL_WORKFLOW
TEMPORAL_SIGNAL
TEMPORAL_UPDATE
```

---

# 14. CapabilityMatchAssessment — revised evaluation rule

Retain v0.1 structure.

Matcher must evaluate:

```text
all material REQUIRED/CONFIRMED facets
applicable constraints
logical input/output/outcome contracts
safety requirements
auth compatibility
```

`SUGGESTED` or `IMPLEMENTED_BEHAVIOR_EVIDENCE` facets may influence ranking/explanation only according to policy; they cannot silently become compatibility requirements.

---

# 15. Requirement/Offering/Match/Binding separation

Frozen T4-01 separation remains:

```text
CapabilityRequirement
        ≠
CapabilityOfferingRevision
        ≠
CapabilityMatchAssessment
        ≠
CapabilityBinding (T4-03)
        ≠
Temporal mapping (Phase 5)
```

---

# 16. Provider/current implementation discipline

Existing automation or source evidence may identify candidate offerings.

Example:

```text
accepted business meaning: send confirmation email
implemented behavior: Gmail node
```

T4 design:

```text
required facets:
COMMUNICATION
SEND_NOTIFICATION
channel = EMAIL

candidate offering:
Gmail send-email offering
```

not:

```text
required provider = Gmail
```

unless explicitly authorized.

---

# 17. Human / AI / n8n / pure orchestration boundaries

All v0.1 rules remain:

```text
human requirement ≠ form/UI/Signal mechanics
complex cognition ≠ AI automatically
n8n offering ≠ durable orchestration authority
pure orchestration semantics may require zero external capability
```

---

# 18. Safety / auth / health boundaries

Retain:

```text
safety requirement ≠ technical execution policy
auth contract ≠ secret value
offering contract ≠ current health/availability
```

---

# 19. No-match / history

No compatible offering leaves requirement unresolved.

New design revisions/registry revisions append history; frozen semantic meaning is not rewritten.

---

# 20. Phase boundary

T4-01 still does not define:

```text
Forms/Human Interaction specialization  → T4-02
accepted capability/provider binding     → T4-03
secret/configuration realization         → T4-03 / implementation security
Temporal execution mapping               → Phase 5
```

---

# 21. Regression target

v0.2 must pass all K01–K32, especially:

```text
K10 current implementation ≠ provider requirement
K12 property-level capability design basis
K14 business outcome ≠ technical success
K15/K16 safety requirement vs implementation policy
K24 match ≠ binding
K26 Temporal primitive exclusion
```

BUILD remains closed.
