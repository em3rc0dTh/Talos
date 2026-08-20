# TALOS — Gated Roadmap v0.37

Status: **ACTIVE PLAN — I5C-01 CLOSED / I5C-02 OPENING REVIEW NEXT**  
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
I5C-01 generic capability design                     ✅ CLOSED
I5C-02 generic ExecutionPlan                         🟡 OPENING REVIEW NEXT
I6 generic image → real Temporal execution           ⛔ CLOSED
```

Closure / audit evidence:

```text
test/114-IMAGE-I4-CANONICAL-VALIDATION-RESULT-v0.1.md
test/115-IMAGE-I5A-01-SEMANTIC-CONFIRMATION-RESULT-v0.1.md
test/116-IMAGE-I5A-02-SEMANTIC-CORRECTION-RESULT-v0.1.md
test/117-IMAGE-I5B-SEMANTIC-FREEZE-RESULT-v0.1.md
test/118-IMAGE-I5C-00-DOWNSTREAM-HANDOFF-AUDIT-v0.1.md
test/119-IMAGE-I5C-01-GENERIC-CAPABILITY-RESULT-v0.1.md
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
GENERIC CAPABILITY DESIGN
  ↓
NEEDS_DESIGN_DECISION where execution family is not established
  ↓
        ✅ I5C-01 CLOSED
  ↓
I5C-02 GENERIC EXECUTION PLAN OPENING REVIEW
```

# I5B closure law

The successful image freeze requires exact workspace/baseline/process/assessment identity plus explicit authority and accepted scope freeze. It preserves backward image/review lineage and creates no capability, execution, Temporal, policy, deployment, or runtime artifact.

```text
READY ≠ FROZEN
FROZEN ≠ CAPABILITY DESIGN
FROZEN ≠ EXECUTION PLAN
FROZEN ≠ TEMPORAL
```

# I5C-00 audit result

The existing Phase-4 / Phase-5 reference implementations remain intentionally bound to the original approval/email fixture:

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

# I5C-01 closed design law

The new generic path consumes only:

```text
exact ProcessRevision
+ exact PROCESS_REVISION AssessmentScope
+ exact pinned AUTOMATION_DESIGN_READINESS ValidationAssessment
+ exact authority-backed SemanticFreezeRecord
+ exact accepted ScopeFreezeRecord
```

It creates only:

```text
CapabilityDesignRevision
CapabilityRequirement[]
CapabilityRequirementFacet[]
CapabilityRequirementProvenanceTrace[]
```

and creates no offering, match, selection, binding, form, ExecutionPlan, TemporalMapping, RuntimePolicy, DeploymentRevision, or runtime execution artifact.

Generic classification v0.1:

```text
ACTION
  → business work must be implemented
  → operationIntent = PERFORM_ACTION
  → family derived only from explicit accepted actor semantics
  → otherwise SOURCE_DEFINED / UNRESOLVED

HUMAN_INTERACTION
  → HUMAN_INTERACTION family is semantic
  → interaction intent remains unresolved unless explicitly frozen

DECISION / WAIT / SUBPROCESS / STATE / END / EVENT / JOIN / PARALLEL_SPLIT
  → no external capability merely because the semantic node exists
```

No action-label lexical inference is allowed:

```text
"Deliver Water" → Activity              ❌
"Forward Order" → email                 ❌
"Create Customer Account" → API         ❌
"Arrange Delivery" → Child Workflow     ❌
```

# Quarry-02 capability state

The accepted process contains frozen business work but does not establish an execution family for every action. The correct I5C-01 result is therefore:

```text
CapabilityDesignRevision.designState = NEEDS_DESIGN_DECISION
```

This preserves the boundary:

```text
BUSINESS WORK EXISTS
        ≠
WE KNOW HOW IT SHOULD EXECUTE
```

# I5C-02 opening review question

A generic ExecutionPlan must not become a mechanism for bypassing unresolved capability design.

Pressure-test before implementation:

```text
1. Can an ExecutionPlan be created while material CapabilityRequirements remain UNRESOLVED? It must not.
2. Does every executable work element pin either resolved capability/human design or an explicitly accepted pure-coordination classification?
3. Are DECISION / WAIT / END representable as coordination without inventing external capability?
4. Is SUBPROCESS preserved as business decomposition unless explicit execution-boundary authority exists?
5. Are conditional BusinessRule bindings preserved exactly into execution relations?
6. Can generic ACTION ever silently become Workflow logic? It must not.
7. Can generic ACTION ever silently become Temporal Activity? It must not.
8. Is execution readiness computed from the generic capability design instead of inherited from semantic readiness?
9. Does the ExecutionPlan retain exact freeze / capability-design / semantic lineage?
10. Does I5C-02 still create zero TemporalMapping / RuntimePolicy / Deployment / execution artifacts?
```

# Immediate next

```text
I5C-02 — GENERIC EXECUTION PLAN OPENING REVIEW

frozen ProcessRevision
        +
generic CapabilityDesignRevision
        ↓
unresolved-work gate
        ↓
coordination-vs-capability classification audit
        ↓
conditional-rule preservation audit
        ↓
lineage audit
        ↓
GO / NO-GO for generic ExecutionPlan implementation
```

I6 remains closed.