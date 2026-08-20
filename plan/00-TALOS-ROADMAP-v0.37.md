# TALOS — Gated Roadmap v0.37

Status: **ACTIVE PLAN — I5B CLOSED / I5C GENERIC HANDOFF ACTIVE**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.36.md` for active planning. Historical roadmap versions remain preserved.

# System architecture status

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

Frozen contracts remain source/process-agnostic. Reference vertical-slice implementations remain bounded reference implementations unless separately generalized and pressure-tested.

# Reference Vertical Slice

```text
B0–B9                                ✅ CLOSED
B10 broader hardening                🟡 OPEN
```

# Image Vertical Slice

```text
I0 exact PNG intake / immutable bytes              ✅ CLOSED
I1 perception boundary / fixture provider           ✅ CLOSED
I2 common source evidence                           ✅ CLOSED
I3 browser evidence/review surface                  ✅ CLOSED
I4 image-derived Canonical + Validation              ✅ CLOSED
I5A-01 explicit semantic claim confirmation          ✅ CLOSED
I5A-02 semantic correction / addition                ✅ CLOSED
I5B semantic freeze                                  ✅ CLOSED
I5C-00 downstream reference-builder compatibility    ✅ CLOSED — NO-GO FOR REUSE
I5C-01 generic capability design                     🟡 IMPLEMENTATION / CI GATE
I5C-02 generic ExecutionPlan                         ⛔ CLOSED
I6 generic image → real Temporal execution           ⛔ CLOSED
```

Closure / audit evidence:

```text
test/114-IMAGE-I4-CANONICAL-VALIDATION-RESULT-v0.1.md
test/115-IMAGE-I5A-01-SEMANTIC-CONFIRMATION-RESULT-v0.1.md
test/116-IMAGE-I5A-02-SEMANTIC-CORRECTION-RESULT-v0.1.md
test/117-IMAGE-I5B-SEMANTIC-FREEZE-RESULT-v0.1.md
test/118-IMAGE-I5C-00-DOWNSTREAM-HANDOFF-AUDIT-v0.1.md
```

# Current image state

```text
IMAGE
  ↓
PERCEPTION
  ↓
COMMON EVIDENCE
  ↓
CANONICAL
  ↓
VALIDATION
  ↓
HUMAN CONFIRMATION
  ↓
SEMANTIC CORRECTION / ADDITION
  ↓
REVALIDATION
  ↓
READY_FOR_AUTOMATION_DESIGN
  ↓
EXACT AUTHORITY-BACKED SEMANTIC FREEZE
  ↓
        ✅ I5B CLOSED
  ↓
GENERIC CAPABILITY DESIGN
  ↓
        🟡 I5C-01
```

# I5B closure law

The successful image freeze proves:

```text
ReviewWorkspaceRevision exact
ReviewBaselineBundle exact
ProcessRevision exact
ValidationAssessment exact
authorityRef required
ScopeFreezeRecord accepted
backward image/review lineage recoverable
```

and creates none of:

```text
CapabilityDesignRevision
ExecutionPlanRevision
TemporalMappingRevision
RuntimePolicyRevision
DeploymentRevision
WorkflowExecutionObservation
```

Therefore:

```text
READY ≠ FROZEN
FROZEN ≠ CAPABILITY DESIGN
FROZEN ≠ EXECUTION PLAN
FROZEN ≠ TEMPORAL
```

# I5C-00 audit result

The Phase-4 / Phase-5 contracts remain valid, but the existing implementation functions are explicitly reference-bound:

```text
designReferenceCapabilities
  assumes Review request / Manager / approval / email

designReferenceExecutionPlan
  assumes Request submitted / Review request / Approved? /
          Send confirmation email / Completed / Rejected

designReferenceTemporalMapping
  assumes the bounded human Update+condition pattern
  and REFERENCE_EMAIL_SIDE_EFFECT Activity
```

Quarry-02 must not pass through those functions.

# I5C-01 design law

I5C-01 introduces a separate generic capability-design path against the same frozen Phase-4 contracts.

Input authority:

```text
exact ProcessRevision
+ exact PROCESS_REVISION AssessmentScope
+ exact pinned AUTOMATION_DESIGN_READINESS ValidationAssessment
+ exact SemanticFreezeRecord
+ exact accepted ScopeFreezeRecord
```

Output boundary:

```text
CapabilityDesignRevision
CapabilityRequirement[]
CapabilityRequirementFacet[]
CapabilityRequirementProvenanceTrace[]
```

Forbidden output at I5C-01:

```text
Offering
Match
Selection
Binding
Form
ExecutionPlan
TemporalMapping
RuntimePolicy
Deployment
Runtime execution
```

Generic classification rule v0.1:

```text
DECISION / WAIT / SUBPROCESS / STATE / END / EVENT / JOIN / PARALLEL_SPLIT
  → no external capability merely because the semantic node exists

ACTION
  → preserve required business work
  → operationIntent = PERFORM_ACTION
  → family derived only from explicit accepted actor semantics
  → otherwise family/state remains UNRESOLVED

HUMAN_INTERACTION
  → HUMAN_INTERACTION family is semantic
  → interaction intent remains unresolved unless explicitly frozen
```

No lexical inference such as:

```text
"Deliver Water" → Activity
"Forward Order" → email
"Create Customer Account" → API
"Arrange Delivery" → Child Workflow
```

is permitted.

# Quarry-02 expected I5C-01 state

The image contains business ACTION work but does not yet carry enough accepted execution-design meaning to select providers or runtime mechanisms for all work.

The safe expected state is therefore:

```text
CapabilityDesignRevision.designState = NEEDS_DESIGN_DECISION
```

with unresolved capability requirements where execution family is not explicitly established.

This is progress, not failure: Talos has preserved exactly where business semantics end and automation design must begin.

# Immediate next

```text
I5C-01 — GENERIC CAPABILITY DESIGN CI GATE

freeze
  ↓
source/process-agnostic capability derivation
  ↓
no reference approval/email leakage
  ↓
exact lineage
  ↓
no downstream artifact creation
  ↓
GO / NO-GO
```

Only after I5C-01 closes may I5C-02 generic ExecutionPlan design open. I6 remains closed.