# TALOS — Gated Roadmap v0.38

Status: **ACTIVE PLAN — I5C-02 GENERIC EXECUTION DRAFT / CI GATE**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.37.md` for active planning. Historical roadmap versions remain preserved.

# Closed architecture phases

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

The frozen contracts are source/process-agnostic. Reference implementation helpers remain bounded fixtures unless separately generalized and pressure-tested.

# Image vertical slice

```text
I0 exact image intake                                ✅ CLOSED
I1 perception boundary                              ✅ CLOSED
I2 common source evidence                           ✅ CLOSED
I3 review surface                                   ✅ CLOSED
I4 canonical + validation                           ✅ CLOSED
I5A-01 confirmation                                 ✅ CLOSED
I5A-02 semantic correction/addition                 ✅ CLOSED
I5B semantic freeze                                 ✅ CLOSED
I5C-00 downstream reference-builder audit           ✅ CLOSED — NO-GO FOR REUSE
I5C-01 generic capability design                    ✅ CLOSED
I5C-02 generic ExecutionPlan draft                  🟡 IMPLEMENTATION / CI GATE
I6 generic Temporal mapping/runtime                 ⛔ CLOSED
```

# Important correction from the I5C-02 opening review

The first opening question was too strict:

```text
UNRESOLVED CAPABILITY WORK
        ↓
NO EXECUTION PLAN AT ALL
```

That is not what the frozen ExecutionPlan Contract v0.2 says.

The contract intentionally separates:

```text
EXECUTION PLAN EXISTS
        ≠
EXECUTION PLAN IS READY FOR TEMPORAL MAPPING
```

It supports immutable scope/plan assessments such as:

```text
NEEDS_EXECUTION_DESIGN_DECISION
BLOCKED_BY_UPSTREAM_INCOMPATIBILITY
INCOMPLETE_UPSTREAM_PINNING
```

Therefore the corrected I5C-02 rule is:

> Talos may create an inspectable execution-design draft while material capability/execution decisions remain unresolved, but that draft must carry explicit blockers and must never be marked `READY_FOR_TEMPORAL_MAPPING_DESIGN` until its material requirements are resolved.

This is safer and more useful for the product experience because the user can inspect what Talos currently intends to coordinate without mistaking the draft for an executable Temporal design.

# I5C-02 input authority

The generic draft planner consumes exact:

```text
ProcessRevision
AssessmentScope
ValidationAssessment
SemanticFreezeRecord
ScopeFreezeRecord
CapabilityDesignRevision
CapabilityRequirement[]
CapabilityRequirementFacet[] / provenance context
```

Required coherence:

```text
same ProcessRevision
same semantic freeze
same accepted scope freeze
same frozen semantic scope
same pinned ValidationAssessment
same capability design revision
all capability requirements owned by that exact design
```

Substitution is rejected.

# Generic execution draft mapping v0.1

## Pure coordination

```text
DECISION        → DECISION_COORDINATION
WAIT            → WAIT_COORDINATION
END             → COMPLETION_COORDINATION
STATE           → STATE_COORDINATION
EVENT           → COORDINATION_STEP
PARALLEL_SPLIT  → COORDINATION_STEP
JOIN            → COORDINATION_STEP
```

These are execution-design coordination concepts only. They are not Temporal primitives.

## Business ACTION

```text
ACTION
  ↓
execution slot exists
  ↓
SOURCE_DEFINED / INCOMPLETE unless resolved downstream design exists
  ↓
ExecutionRequirement = UNRESOLVED
```

An ACTION does **not** become:

```text
Workflow logic
Temporal Activity
API call
email
form
n8n workflow
AI call
```

from its label.

No `CapabilityUseOccurrence` is created without a pinned `CapabilityBindingRevision`.

## HUMAN_INTERACTION

Explicit human semantics may be represented as `HUMAN_COORDINATION`, but remain `INCOMPLETE` without the required accepted human interaction design/binding. No Signal/Update/Form primitive is selected here.

## SUBPROCESS

For Quarry-02:

```text
Arrange Delivery
subprocessMode = COLLAPSED_SUBPROCESS
```

means the business source establishes a subprocess boundary. It does **not** establish:

```text
Child Workflow
Activity
same Workflow
separate worker
provider invocation
```

The generic plan therefore preserves the subprocess as an incomplete coordination boundary with a material unresolved `COORDINATION_BOUNDARY` requirement.

# Relation rules

Exact representable semantic relations:

```text
SEQUENCE     → SEQUENCE
CONDITIONAL  → CONDITIONAL
DEFAULT      → DEFAULT
PARALLEL     → PARALLEL
```

For `CONDITIONAL`:

```text
ExecutionRelation.conditionRef
  = exact canonical BusinessRule.id
```

No rule text is re-parsed and no new branch condition is manufactured.

Other accepted semantic relation kinds are preserved as:

```text
SOURCE_DEFINED / INCOMPLETE
```

with an unresolved execution coordination requirement rather than being coerced into a convenient relation type.

# Quarry-02 expected draft state

The process is semantically valid and frozen, but its capability design still contains unresolved execution-family decisions.

Expected I5C-02 state:

```text
ExecutionPlanRevision                 EXISTS
ExecutionScopeBinding                 EXISTS
ExecutionRegion                       EXISTS
ExecutionElement[]                    EXISTS
ExecutionRelation[]                   EXISTS
ExecutionRequirement[]                EXISTS
ExecutionSemanticMappingTrace[]       EXISTS

CapabilityUseOccurrence[]             EMPTY
capabilityBindingRevisionRefs[]       EMPTY
humanInteractionDesignRevisionRefs[]  EMPTY

ExecutionScopeAssessment.readiness
  = NEEDS_EXECUTION_DESIGN_DECISION

ExecutionPlanAssessment.readiness
  = NEEDS_EXECUTION_DESIGN_DECISION

ExecutionPlanRevision.readiness
  = NEEDS_EXECUTION_DESIGN_DECISION
```

Therefore:

```text
DRAFT EXISTS                         ✅
USER CAN INSPECT STRUCTURE           ✅
UNRESOLVED WORK IS VISIBLE           ✅
TEMPORAL MAPPING AUTHORIZED          ❌
```

# I5C-02 negative-space gate

The draft planner/persistence must create zero:

```text
TemporalMappingDefinition
TemporalMappingRevision
TemporalMappingUnit
RuntimePolicyRevision
DeploymentDefinition
DeploymentRevision
WorkflowExecutionObservation
```

And it must not smuggle in:

```text
Task Queue
worker
Temporal SDK
retry policy
timeout policy
Activity selection
Child Workflow selection
provider credentials
environment values
```

# Immediate gate

```text
I5C-02 GENERIC EXECUTION DRAFT

semantic freeze
  +
generic capability design
  ↓
exact lineage validation
  ↓
coordination skeleton
  +
unresolved work slots
  +
exact BusinessRule bindings
  +
explicit subprocess boundary blocker
  ↓
ExecutionPlanAssessment
  = NEEDS_EXECUTION_DESIGN_DECISION
  ↓
NO Temporal artifacts
```

Only after this gate closes do we decide the next product step. I6 remains closed.