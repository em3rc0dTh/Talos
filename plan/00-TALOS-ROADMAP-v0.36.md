# TALOS — Gated Roadmap v0.36

Status: **ACTIVE PLAN — I5A-02 CLOSED / I5B OPENING REVIEW NEXT**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.35.md` for active planning. Historical roadmap versions remain preserved.

# System architecture status

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

# Reference Vertical Slice

```text
B0–B9                                ✅ CLOSED
B10 broader hardening                🟡 OPEN
```

# Image Vertical Slice

```text
I0 exact PNG intake / immutable bytes             ✅ CLOSED
I1 perception boundary / fixture provider          ✅ CLOSED
I2 common source evidence                          ✅ CLOSED
I3 browser evidence/review surface                 ✅ CLOSED
I4 image-derived Canonical + Validation             ✅ CLOSED
I5A-01 explicit semantic claim confirmation         ✅ CLOSED
I5A-02 semantic correction / addition               ✅ CLOSED
I5B semantic freeze + execution handoff              🟡 OPENING REVIEW NEXT
I6 generic image → real Temporal execution           ⛔ CLOSED
```

Closure evidence:

```text
test/114-IMAGE-I4-CANONICAL-VALIDATION-RESULT-v0.1.md
test/115-IMAGE-I5A-01-SEMANTIC-CONFIRMATION-RESULT-v0.1.md
test/116-IMAGE-I5A-02-SEMANTIC-CORRECTION-RESULT-v0.1.md
```

# Current image semantic state

The image path now supports:

```text
IMAGE
  ↓
PERCEPTION
  ↓
COMMON EVIDENCE
  ↓
INFERRED CANONICAL
  ↓
VALIDATION
  ↓
EXPLICIT HUMAN CONFIRMATION
  ↓
EXPLICIT HUMAN CORRECTION / ADDITION
  ↓
REVALIDATION
  ↓
VALID / READY_FOR_AUTOMATION_DESIGN
```

For the bounded Quarry-02 fixture the accepted reviewer-authored semantic revision now contains:

```text
explicit attached END outcome
structured BusinessRule for each conditional branch
explicit subprocess boundary meaning
```

and no longer emits:

```text
SV-SRC-001
SV-CMP-001
SV-CFL-001
SV-SUB-002
```

# Critical state distinction

```text
READY_FOR_AUTOMATION_DESIGN
      !=
SEMANTIC FREEZE
      !=
CAPABILITY DESIGN
      !=
ExecutionPlan
      !=
TemporalMapping
      !=
Temporal execution
```

No downstream automation artifact is created by I5A-02.

# I5B opening review question

I5B must not freeze merely because the current validator returns `READY_FOR_AUTOMATION_DESIGN`.

The opening review must independently pressure-test:

```text
1. Is the explicit END actually reachable from the intended successful path?
2. Do conditional branches have structurally coherent source/target/rule bindings?
3. Does each reviewer-added relation reference live canonical nodes?
4. Are there disconnected process nodes or accidental orphan semantic islands?
5. Does the subprocess boundary meaning remain business semantic meaning rather than runtime decomposition?
6. Is every active semantic meaning on the freeze candidate either source-stated or explicitly reviewer-authorized?
7. Are all review baselines/current assessments pinned and non-stale?
8. Can the frozen Phase-3 `AUTOMATION_DESIGN_HANDOFF` freeze contract accept this source-agnostic image-derived review baseline without Canvas assumptions?
9. Does freeze create no capability/provider/Temporal meaning by itself?
10. Is backward lineage from the freeze candidate still recoverable to the original image/perception evidence and reviewer-authored corrections?
```

If any structural safety condition is missing from the frozen validation/freeze implementation, I5B stays closed and the affected contract/implementation is versioned before freeze.

# Hard laws

```text
VALIDATION PASS ≠ PROOF OF ALL STRUCTURAL SAFETY
END EXISTS ≠ END REACHABLE
BUSINESS SUBPROCESS ≠ CHILD WORKFLOW
FREEZE ≠ CAPABILITY DESIGN
FREEZE ≠ EXECUTION PLAN
FREEZE ≠ TEMPORAL
IMAGE SOURCE ≠ REVIEWER-AUTHORED CORRECTION
REVIEWER-AUTHORED CORRECTION ≠ SOURCE IMAGE MUTATION
```

# Immediate next

```text
I5B-00 — OPENING REVIEW

corrected image ProcessRevision
        ↓
structural coherence pressure test
        ↓
freeze-contract compatibility pressure test
        ↓
lineage pressure test
        ↓
GO / NO-GO for bounded image semantic freeze
```

I6 remains closed.