# TALOS — Capability Model Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T4-01 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T4-01 architecture: `14-CAPABILITY-MODEL-ARCHITECTURE-v0.1.md`

Target: `design/26-CAPABILITY-CONTRACT-v0.2.md`

BUILD remains closed.

## Why v0.2 exists

Initial result:

```text
K01–K32
31 PASS / 1 FAIL
```

K12 proved that capability requirements need property-level design provenance just like Phase-3 explanation/review needed facet-level evidence state.

v0.2 adds `CapabilityRequirementFacet` as the authoritative design-basis/state layer.

## 1. Phase-4 entry

Formal capability design still begins from:

```text
SemanticFreezeRecord(AUTOMATION_DESIGN_HANDOFF)
+ accepted ScopeFreezeRecord
+ READY_FOR_AUTOMATION_DESIGN assessment
```

No change to Phase-3 eligibility.

## 2. End-to-end architecture

```text
Accepted semantic scope
        ↓
CapabilityRequirementDeriver
        ↓
CapabilityRequirement
  + CapabilityRequirementFacet[]
        ↓
CapabilityRegistry
  + OfferingDefinition/Revision
        ↓
CapabilityMatcher
        ↓
CapabilityMatchAssessment
        ↓
T4-03 later: explicit Binding
        ↓
Phase 5 later: execution mapping
```

## 3. CapabilityRequirementDeriver

The deriver now produces each material property with explicit facet provenance.

Examples:

```text
family
operationIntent
channel/system/provider constraint
input/output/outcome
safety requirement
actor responsibility
```

Each can have a different `designBasis` / `designState`.

## 4. RequirementFacetBuilder

Conceptual component:

```text
RequirementFacetBuilder
```

Inputs:

```text
accepted semantic subjects/claims
ScopeFreezeRecord
validation context
Phase-4 design rules
implemented-behavior evidence where relevant
explicit design authority
```

Outputs immutable `CapabilityRequirementFacet` records.

It cannot upgrade `IMPLEMENTED_BEHAVIOR_EVIDENCE` or `DESIGN_SUGGESTION` to a hard required facet without authority.

## 5. Requirement summary builder

```text
CapabilityRequirementSummaryBuilder
```

May derive:

```text
CapabilityRequirement.requirementState
optionalSummaryBasis
```

for scanning/product use.

Summaries are never matcher authority.

## 6. Pure orchestration filter

Retained:

```text
semantic node → 0..N capability requirements
```

Deterministic decision/split/join/wait/completion may produce zero external requirements.

## 7. CapabilityDesignRevision

Immutable snapshot still pins semantic freeze/process revision/designer version, requirements, assessments and unresolved requirements.

A requirement facet change creates new design history rather than mutation.

## 8. Registry boundary

Retain:

```text
CapabilityOfferingDefinition
CapabilityOfferingRevision
```

Reusable offerings remain independent from process-context requirement IDs.

## 9. Matching architecture — revised

`CapabilityMatcher` evaluates only applicable material facets:

```text
REQUIRED
CONFIRMED
```

plus contract/safety/auth requirements.

Facets with:

```text
SUGGESTED
IMPLEMENTED_BEHAVIOR_EVIDENCE basis
```

may be surfaced/ranked according to explicit matcher policy but cannot silently become hard compatibility constraints.

## 10. Match explainability

For every assessment TALOS can explain:

```text
which required facets matched
which failed
which remain unknown
which suggested/current-implementation preferences affected ranking only
```

This prevents a provider from appearing “required” because it scored highly.

## 11. Constraint alignment

`CapabilityConstraint` points to its authoritative requirement facet or carries equivalent property-level evidence.

No material constraint inherits a whole requirement's basis implicitly.

## 12. Input/output/outcome/safety alignment

Material fields inside input/output/outcome/safety contracts must also trace to requirement facets or equivalent property-scoped design evidence.

Logical business contract remains separate from provider payload schema.

## 13. Provider/current implementation path

```text
Existing automation/provider evidence
        ↓
IMPLEMENTED_BEHAVIOR evidence
        ↓
candidate CapabilityOfferingRevision / ranking context
```

It does not write required provider facets unless accepted design/business authority explicitly does so.

## 14. Offering implementation kinds

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

Temporal execution primitives remain forbidden from capability offering identity.

## 15. Safety/auth/availability boundaries

Retain:

```text
business safety need ≠ execution retry policy
auth contract ≠ secret value
offering contract ≠ current availability/health
```

## 16. Binding boundary

Matcher output remains advisory/evidence:

```text
MatchAssessment ≠ CapabilityBinding
```

T4-03 owns explicit provider/offering selection and mapping.

## 17. History

New semantic freeze/design decision/registry version produces new immutable design/match history.

No Phase-1/2/3 artifact is mutated.

## 18. Anti-goals

Do not:

- use one requirement-wide basis as property authority;
- let current Gmail/n8n use become a required constraint automatically;
- let suggestions become hard matcher filters silently;
- confuse logical capability data with provider payloads;
- auto-bind best match;
- include Temporal primitives in offering kinds;
- move T4-02/T4-03/Phase-5 decisions into T4-01.

## 19. Gate

v0.2 must pass full K01–K32 regression.

BUILD remains closed.
