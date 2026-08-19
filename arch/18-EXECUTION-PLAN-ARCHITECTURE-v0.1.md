# TALOS — ExecutionPlan Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T5-01 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target: `design/32-EXECUTION-PLAN-CONTRACT-v0.1.md`

BUILD remains closed.

## 1. Phase-5 entry

```text
ProcessRevision / SemanticFreeze / Validation
        +
CapabilityDesignRevision
        +
HumanInteractionDesign / Form use
        +
CapabilityBindingRevision(s)
        +
READY_FOR_EXECUTION_DESIGN assessments
        ↓
ExecutionPlanDesigner
        ↓
ExecutionPlanRevision
        ↓
ExecutionPlanAssessment
        ↓
READY_FOR_TEMPORAL_MAPPING_DESIGN
```

No Temporal primitive is selected in T5-01.

## 2. Core architecture

```text
PinnedUpstreamDesignBundle
        ↓
ExecutionScopePlanner
        ↓
ExecutionScopeBinding[]
        ↓
ExecutionRegionPlanner
        ↓
ExecutionRegion[]
        ↓
ExecutionDecomposer
        ├── ExecutionElement[]
        ├── ExecutionRelation[]
        ├── CapabilityUseOccurrence[]
        ├── ExecutionDataDependency[]
        └── ExecutionRequirement[]
        ↓
ExecutionTraceBuilder
        ↓
ExecutionPlanRevision
        ↓
ExecutionPlanValidator
        ↓
ExecutionPlanAssessment
```

## 3. PinnedUpstreamDesignBundle

Conceptual immutable input bundle resolves exact IDs for:

```text
ProcessRevision
SemanticFreezeRecord / ScopeFreezeRecord(s)
ValidationAssessment(s)
CapabilityDesignRevision
CapabilityBindingRevision(s)
CapabilityBindingAssessment(s)
HumanInteractionDesignRevision(s)
FormRevision(s) / FormUseBinding(s)
ConfigurationResolutionSlot(s)
CredentialResolutionContract(s)
```

The bundle resolver rejects incompatible versions rather than silently selecting `latest`.

## 4. ExecutionScopePlanner

Classifies included semantic scopes as:

```text
EXECUTABLE_PRIMARY
EXECUTABLE_SUPPORTING
CONTEXT_ONLY
NON_EXECUTABLE_REFERENCE
```

It never converts architecture/policy/source-review context into runtime behavior merely because it shares a review workspace.

## 5. ExecutionRegionPlanner

Introduces runtime-design regions without yet equating them to Temporal Workflows.

A semantic process may need one region or several; several semantic subjects may share one region.

Region decomposition can represent:

```text
orchestration ownership
external-owned boundaries
human coordination boundaries
inline coordination
context-only regions
```

but not Task Queues, worker processes or Temporal Workflow types.

## 6. ExecutionDecomposer

Creates execution occurrences based on explicit design need.

Critical cardinalities:

```text
semantic subject      → 0..N ExecutionElement
ExecutionElement      → 0..N semantic subjects
CapabilityBinding     → 0..N CapabilityUseOccurrence
```

This prevents identity reuse and one-box/one-primitive assumptions.

## 7. Capability-use architecture

```text
CapabilityBindingRevision B
        ↓
CapabilityUseOccurrence U1
CapabilityUseOccurrence U2
...
```

Repeated execution use does not clone or mutate B.

Each occurrence may have different logical input availability/output use while still referencing the same immutable binding design.

## 8. Human coordination architecture

Human interaction design is referenced as upstream meaning/design.

Execution decomposition may add coordination occurrence(s), but runtime realization is deferred:

```text
HumanInteractionDesignRevision
        ↓
HUMAN_INTERACTION_COORDINATION
        ↓
T5-02/T5-03 later decide Temporal/runtime mechanics
```

## 9. Wait/event/loop architecture

T5-01 records **coordination intent** only.

```text
business wait       → WAIT_COORDINATION
external response   → EXTERNAL_EVENT_COORDINATION
business loop       → DECISION/CONTROL coordination
```

No timer/signal/retry primitive is selected yet.

## 10. Data architecture

`ExecutionDataDependency` describes logical data availability/use between execution occurrences.

Provider payload mapping remains in Phase 4; runtime serialization/state storage remains later.

## 11. Mapping trace architecture

Every material execution occurrence/relation/region must trace to one or more of:

```text
semantic subject
capability requirement/binding
human interaction design
form use
explicit execution-design decision
```

`ExecutionSemanticMappingTrace` is many-to-many and preserves derivation kind.

## 12. ExecutionPlanValidator

Checks at least:

```text
exact upstream pinning
scope eligibility
scope role consistency
region membership consistency
element/relation coherence
capability-use binding readiness
human/wait/event coordination representation
data dependency coherence
trace completeness
unresolved material ExecutionRequirement
Temporal-field absence
secret/environment-realization absence
```

Readiness result may be:

```text
NOT_ASSESSED
INCOMPLETE_UPSTREAM_PINNING
BLOCKED_BY_UPSTREAM_INCOMPATIBILITY
NEEDS_EXECUTION_DESIGN_DECISION
READY_FOR_TEMPORAL_MAPPING_DESIGN
```

## 13. Change isolation

```text
business semantic change
→ upstream revision first

provider/binding design change
→ Phase-4 revision first

execution-region/decomposition change
→ new ExecutionPlanRevision

Temporal mapping strategy change
→ T5-02 history later

runtime safety policy change
→ T5-03 history later

environment/secret realization change
→ T5-04 history later
```

No layer silently mutates another.

## 14. Security/anti-corruption

Forbidden T5-01 domain leakage:

```text
Temporal SDK types
Activity/Workflow/Signal/Update names
Task Queues
retry/timeout runtime policy values
environment endpoints
secure-store handles
secret material
worker/code artifact IDs
```

## 15. Gate

T5-01 architecture passes only if pressure fixtures prove that `ExecutionPlanRevision` can faithfully coordinate frozen Phase-1–4 design while remaining independent from Temporal mapping and deployment realization.
