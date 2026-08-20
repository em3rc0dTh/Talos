# TALOS — Gated Roadmap v0.35

Status: **ACTIVE PLAN — IMAGE SEMANTIC CORRECTION OPEN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.34.md` for active planning. Historical roadmap versions remain preserved.

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
I0 exact PNG intake / immutable bytes            ✅ CLOSED
I1 perception boundary / fixture provider         ✅ CLOSED
I2 common source evidence                         ✅ CLOSED
I3 browser evidence/review surface                ✅ CLOSED
I4 image-derived Canonical + Validation            ✅ CLOSED
I5A-01 explicit semantic claim confirmation        ✅ CLOSED
I5A-02 semantic correction / addition              🟢 OPEN
I5B semantic freeze + execution handoff             ⛔ CLOSED
I6 generic image → real Temporal execution          ⛔ CLOSED
```

Closure evidence:

```text
test/114-IMAGE-I4-CANONICAL-VALIDATION-RESULT-v0.1.md
test/115-IMAGE-I5A-01-SEMANTIC-CONFIRMATION-RESULT-v0.1.md
```

Active I5A-02 plan:

```text
plan/11-IMAGE-I5A-02-SEMANTIC-CORRECTION-PLAN-v0.1.md
```

# Current semantic state

After explicit I5A-01 confirmation, `SV-SRC-001` is resolved without rewriting the image/perception history.

The current material blockers are:

```text
SV-CMP-001   explicit completion/end unproven
SV-CFL-001   conditional branch rule unresolved ×2
SV-SUB-002   subprocess boundary meaning unresolved
```

# I5A-02 target

```text
confirmed image-derived ProcessRevision
        ↓
explicit ReviewCommand + authority
        ↓
CORRECT_PROPERTY / ADD_PROCESS_ELEMENT / ADD_RELATIONSHIP
        ↓
review-authored semantic evidence
        ↓
new ProcessRevision
        ↓
new ValidationAssessment
        ↓
READY_FOR_AUTOMATION_DESIGN
```

The validator remains the judge. I5A-02 does not branch on finding codes to auto-repair the process.

# Hard laws

```text
VALIDATION FINDING ≠ REPAIR INSTRUCTION
REVIEWER CORRECTION ≠ SOURCE IMAGE MUTATION
REVIEWER CORRECTION ≠ PERCEPTION MUTATION
SEMANTIC CHANGE → NEW ProcessRevision
REVALIDATION → NEW ValidationAssessment
REVIEW AUTHORITY → EXPLICIT authorityRef
SUBPROCESS MEANING ≠ Temporal Child Workflow
END NODE ≠ permission to invent success semantics silently
I5A-02 ≠ FREEZE
I5A-02 ≠ EXECUTION
I5A-02 ≠ TEMPORAL
```

# Immediate next

```text
I5A-02-A
  align I5A-01 derivationKind with frozen Canonical enum
  implement source-agnostic semantic correction engine
  pressure-test branch rules / subprocess meaning / explicit completion
  revalidate
```

I5B remains closed until I5A-02 proves a reviewer-authored image-derived revision can legitimately reach `READY_FOR_AUTOMATION_DESIGN`.