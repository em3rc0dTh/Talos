# TALOS — Gated Roadmap v0.33

Status: **ACTIVE PLAN — TRYABLE REFERENCE VERSION / B10 HARDENING + IMAGE I4**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.32.md` for active planning. Historical roadmap versions remain preserved.

# System architecture status

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

# Phase 6 — Reference Vertical Slice

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

The tryable Canvas/reference runtime remains the regression baseline.

# Image Vertical Slice

Governing image plan:

```text
plan/11-IMAGE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.1.md
```

Current active authorization:

```text
plan/14-IMAGE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.2.md
```

Opening review:

```text
plan/13-IMAGE-I4-CANONICAL-VALIDATION-OPENING-REVIEW-v0.1.md
```

## Image stage status

```text
I0 exact PNG intake / immutable bytes            ✅ CLOSED — 4/4
I1 perception boundary / fixture provider         ✅ CLOSED
I2 common source evidence                         ✅ CLOSED
I3 browser evidence/review surface                ✅ CLOSED
I4 image-derived canonical + validation            🟢 OPEN
I5 semantic freeze + execution handoff             ⛔ CLOSED
I6 generic image → real Temporal execution         ⛔ CLOSED
```

# I4 immediate implementation order

```text
I4.0 extract source-agnostic normalization profile/core
I4.1 preserve Canvas normalizer behavior/regression
I4.2 normalize image common evidence as INFERRED
I4.3 run frozen semantic validation over image ProcessRevision
I4.4 expose read-only canonical/findings in image review surface
I4.5 cross-regress I0–I3 + B2/B3 + B7–B10 relevant gates
I4.6 close only with explicit gate evidence
```

# Immutable I4 laws

```text
COMMON SOURCE EVIDENCE ≠ CANVAS NATIVE MODEL
IMAGE CANDIDATE ≠ SOURCE_TRUTH
CONFIDENCE = 1.0 ≠ SOURCE_TRUTH PROMOTION
RASTER OCCURRENCE ≠ nativeSourceId required
MISSING RESPONSIBILITY ≠ silently inferred from fixture expectation
I4 VALIDATION ≠ semantic freeze
I4 CANONICAL ≠ execution authorization
I4 ≠ image → Temporal
```

# Parallel B10 rule

B10 remains open and must not be represented as closed merely because I4 is authorized. Image I4 may proceed because it stops at Canonical/Validation and does not broaden runtime execution behavior.

# Immediate next

```text
IMAGE I4.0 — SOURCE-AGNOSTIC NORMALIZATION CORE
```
