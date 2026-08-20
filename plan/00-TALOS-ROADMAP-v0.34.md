# TALOS — Gated Roadmap v0.34

Status: **ACTIVE PLAN — TRYABLE REFERENCE VERSION / B10 HARDENING + IMAGE SEMANTIC REVIEW NEXT**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.33.md` for active planning. Historical roadmap versions remain preserved.

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
  restart / persisted replay          ✅ CLOSED
  Node 22.16 / Node 24.11 matrix      ✅ PASS
  approved-after-restart hands-on     ✅ PASS
  shutdown warning classification     🟡 OPEN
  additional recovery cases           ⚪
  full runtime→source lineage          ⚪
```

# Image Vertical Slice

```text
I0 exact PNG intake / immutable bytes            ✅ CLOSED
I1 perception boundary / fixture provider         ✅ CLOSED
I2 common source evidence                         ✅ CLOSED
I3 browser evidence/review surface                ✅ CLOSED
I4 image-derived canonical + validation            ✅ CLOSED
I5A image semantic review / confirmation           🟢 NEXT
I5B semantic freeze + execution handoff            ⛔ CLOSED
I6 generic image → real Temporal execution         ⛔ CLOSED
```

I4 closure evidence:

```text
test/114-IMAGE-I4-CANONICAL-VALIDATION-RESULT-v0.1.md
```

# Why I5A exists

I4 correctly produces an image-derived candidate with:

```text
truth discipline      INFERRED
semanticVerdict       INCOMPLETE
executionReadiness    INSUFFICIENT_DETAIL
```

Current material findings include:

```text
SV-CMP-001   explicit completion/end unproven
SV-SUB-002   subprocess boundary unresolved
SV-CFL-001   conditional branch rule unresolved
SV-SRC-001   material inferred business meaning requires confirmation
```

Therefore:

```text
I4 ProcessRevision
      ≠
accepted business truth
      ≠
semantic freeze
      ≠
execution authorization
```

# I5A target

I5A must let a reviewer operate on image-derived semantics while preserving image/perception history.

Target loop:

```text
original image bytes
+ immutable perception history
+ I4 inferred ProcessRevision
+ ValidationAssessment
        ↓
review workspace
        ↓
confirm / reject / correct / add missing semantic meaning
        ↓
review-authored evidence
        ↓
new ProcessRevision
        ↓
new ValidationAssessment
```

Required first fixture resolutions may include:

```text
confirm or reject material inferred node/edge meanings
resolve explicit process completion
resolve conditional branch business rules
resolve subprocess boundary meaning
```

No solution may be copied silently from `source-02.md` into business truth. Source documentation may guide test expectations only where explicitly represented as a separate supplied source; otherwise the reviewer action is the authority event.

# I5A hard laws

```text
ORIGINAL IMAGE ≠ MUTATED BY REVIEW
PERCEPTION OUTPUT ≠ MUTATED BY REVIEW
MODEL PREFERENCE ≠ HUMAN CONFIRMATION
CONFIRMATION → NEW REVIEW EVIDENCE
SEMANTIC CHANGE → NEW ProcessRevision
REVALIDATION → NEW ValidationAssessment
IMAGE REVIEW ≠ SOURCE_TRUTH REWRITE
VALIDATION BLOCKER ≠ AUTO-REPAIR
I5A ≠ FREEZE
I5A ≠ EXECUTION
I5A ≠ TEMPORAL
```

# Immediate next

```text
I5A-OPEN — PRESSURE-TEST IMAGE-DERIVED SEMANTIC REVIEW AGAINST THE FROZEN PHASE-3 REVIEW CONTRACT
```

The key implementation question is whether the current review command/application machinery can operate on an image-derived ProcessRevision without requiring a native Canvas source mutation. If it is Canvas-coupled, I5A must introduce a source-agnostic review-authored semantic correction path before any freeze is authorized.
