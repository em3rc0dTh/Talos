# TALOS — Capability Model Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T4-01 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target: `design/26-CAPABILITY-CONTRACT-v0.1.md`

BUILD remains closed.

## 1. Phase-4 entry boundary

Formal capability design starts from semantic scopes accepted for automation-design handoff:

```text
SemanticFreezeRecord(AUTOMATION_DESIGN_HANDOFF)
+ ScopeFreezeRecord(ACCEPTED)
+ ProcessRevision
+ READY_FOR_AUTOMATION_DESIGN assessment
        ↓
CapabilityDesignService
```

No unreviewed/ineligible semantic scope silently enters formal capability design.

## 2. End-to-end T4-01 architecture

```text
Accepted semantic scope
        ↓
CapabilityRequirementDeriver
        ↓
CapabilityDesignRevision
  + CapabilityRequirement[]
        ↓
CapabilityRegistry
  + CapabilityOfferingDefinition
  + CapabilityOfferingRevision
        ↓
CapabilityMatcher
        ↓
CapabilityMatchAssessment[]
        ↓
UNRESOLVED or candidate offerings
        ↓
T4-03 later: explicit CapabilityBinding
        ↓
Phase 5 later: execution/Temporal mapping
```

## 3. CapabilityRequirementDeriver

Consumes only frozen semantic/review artifacts and design rules.

It may emit:

```text
0..N requirements per semantic subject
```

It cannot create provider bindings.

It records derivation through `CapabilityRequirementProvenanceTrace`.

## 4. Pure orchestration filter

`CapabilityRequirementDeriver` must distinguish external/human/system abilities from orchestration semantics.

Examples that may emit no external capability:

```text
deterministic decision
parallel split/join
pure wait/timer semantics
completion marker
```

Temporal mapping of those semantics belongs to Phase 5.

## 5. CapabilityDesignRevision repository

Immutable design snapshots:

```text
CapabilityDesignRepository
```

Each revision pins:

```text
ProcessRevision
SemanticFreezeRecord
accepted scopes
designer/version
requirements
match assessments
unresolved requirements
```

No mutable "latest design" is semantic authority.

## 6. Capability Registry boundary

```text
CapabilityRegistry
        ├── CapabilityOfferingDefinition
        └── CapabilityOfferingRevision
```

Registry stores reusable implementation offerings, not process requirement occurrences.

Offering identity/revisions remain independent from process/canonical IDs.

## 7. Offering implementation boundary

Allowed offering implementation families may include:

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

Phase-5 execution wrappers are forbidden from T4-01 offering identity:

```text
TEMPORAL_ACTIVITY
TEMPORAL_WORKFLOW
TEMPORAL_SIGNAL
TEMPORAL_UPDATE
```

## 8. Matching boundary

```text
CapabilityMatcher(requirement, offeringRevision)
→ CapabilityMatchAssessment
```

Matcher evaluates:

```text
family/operation compatibility
constraints
logical inputs/outputs
business outcomes
safety requirements
auth compatibility
unknowns
```

It never creates a binding automatically.

## 9. Binding boundary

T4-01 exposes only the later boundary:

```text
Requirement
→ explicit T4-03 CapabilityBinding
→ OfferingRevision
```

Provider configuration/data mapping/secure credential binding belongs downstream.

## 10. Requirement provenance

Each requirement traces:

```text
CapabilityRequirement
← accepted ScopeFreezeRecord
← ProcessRevision / semantic subjects/claims
← Provenance / original evidence
```

Capability design provenance does not become source truth.

## 11. Requirement vs offering schemas

Requirement input/output contracts describe logical semantic data/outcomes.

Offering schemas describe provider/service interfaces.

Later binding performs mappings.

```text
logical input ≠ provider request body
logical output ≠ provider response body
```

## 12. Safety compatibility

Requirement-level safety needs are compared against offering safety support.

Examples:

```text
IDEMPOTENCY_REQUIRED
OBSERVABLE_COMPLETION_REQUIRED
COMPENSATION_REQUIRED
```

T4-01 does not choose Temporal retry/timeout mechanisms.

## 13. Human capability boundary

Human interactions can produce capability requirements but assignment service, forms, UI and durable wait mechanics remain separate concerns.

T4-02 specializes form/human interaction design.

## 14. Existing automation boundary

Existing n8n/provider evidence may suggest or identify available offerings.

```text
IMPLEMENTED_BEHAVIOR evidence
→ offering candidate / registry evidence
```

It cannot silently add a provider requirement to accepted business semantics.

## 15. AI boundary

AI is one possible capability family/offering class only when accepted design/semantics require it.

Complex business reasoning does not imply `AI_TASK` automatically.

## 16. Provider-required semantics

If accepted business semantics explicitly constrain system/provider/channel, that constraint can appear on `CapabilityRequirement`.

Even then:

```text
provider constraint ≠ selected offering binding
```

Binding still requires T4-03 decision.

## 17. Availability/health boundary

Offering contract revisions are immutable capability descriptions.

Current availability/health belongs to separate operational observation, not offering definition mutation.

## 18. No-match path

```text
required capability
+ zero compatible offerings
→ unresolved capability design finding
```

No provider is invented.

## 19. History

New accepted semantic revision or capability-design decision creates new `CapabilityDesignRevision` / requirement/match history.

Old design remains explainable.

## 20. Anti-goals

Do not:

- equate canonical node with one capability;
- equate requirement with reusable offering;
- auto-bind highest-ranked match;
- import provider payload schema into business semantic data contract;
- store secret material in capability contract;
- store mutable health as offering truth;
- treat existing Gmail/n8n use as business-required provider without accepted semantic evidence;
- put Temporal primitives in capability offering identity;
- choose retry/timeout execution policy in T4-01.

## 21. Gate

T4-01 passes only if requirement, offering, match and later binding boundaries survive the capability pressure suite without reopening frozen Phases 1–3.

BUILD remains closed.
