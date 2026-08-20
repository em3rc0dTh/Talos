# TALOS — Gated Roadmap v0.37

Status: **ACTIVE PLAN — I5B BLOCKED / VALIDATOR CONFORMANCE HARDENING OPEN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.36.md` for active planning. Historical roadmap versions remain preserved.

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
I5B-00 opening review                               🔴 NO-GO
I5B semantic freeze + execution handoff              ⛔ CLOSED
I6 generic image → real Temporal execution           ⛔ CLOSED
```

I5B NO-GO evidence:

```text
test/117-IMAGE-I5B-OPENING-REVIEW-NO-GO-v0.1.md
```

# Why I5B is blocked

The corrected Quarry-02 reference currently receives:

```text
VALID / READY_FOR_AUTOMATION_DESIGN
```

but the frozen Semantic Validation v0.2 contract and its V01–V16 regression require Quarry-02 to remain `INSUFFICIENT_DETAIL` while material semantics such as wait timing, subprocess internals, physical completion observation and correlation identity remain unresolved.

The defect is in the BUILD reference validator implementation, not in the frozen contract.

```text
frozen ruleset v0.2                  ✅ keep
reference validator implementation   🔴 harden
```

# Active bounded gate

```text
VCON-01 — REFERENCE VALIDATOR v0.3 CONFORMANCE HARDENING
```

Dedicated branch:

```text
image-i5b-validation-conformance-v0.1
```

## VCON-01 target

```text
frozen Semantic Validation v0.2
          ↓
reference implementation v0.3
          ↓
material predicate coverage
          ↓
corrected Quarry-02 revalidation
          ↓
INSUFFICIENT_DETAIL with explicit findings
```

Initial frozen rule targets include:

```text
SV-STR-001  unresolved entry semantics
SV-EVT-002  incomplete business wait time
SV-SUB-001  material subprocess internals missing
SV-HUM-001  human/physical completion observation unresolved
SV-COR-001  collaboration correlation identity unresolved
```

Only predicates supported by Canonical/evidence state may be asserted. When the contract requires absence itself to block readiness, absence is preserved as missing semantics rather than filled by inference.

# Hard laws

```text
FROZEN CONTRACT ≠ BUILD IMPLEMENTATION
NO FINDING EMITTED ≠ SEMANTICALLY COMPLETE
ZERO-INCOMING NODE ≠ PROVEN BUSINESS START
VISIBLE WAIT LABEL ≠ COMPLETE BUSINESS TIME CONTRACT
COLLAPSED SUBPROCESS ≠ KNOWN INTERNAL SEMANTICS
PHYSICAL WORK VISIBLE ≠ COMPLETION OBSERVABLE
MESSAGE CONNECTION ≠ CORRELATION CONTRACT
VALIDATION ≠ REPAIR
FALSE READY ≠ PERMISSION TO FREEZE
```

# Expected follow-on

The hardened validator is expected to expose additional reviewer questions. If so, the lawful path is:

```text
VCON-01 validator hardening
        ↓
Quarry findings
        ↓
I5A-03 minimum semantic clarification/correction
        ↓
revalidation
        ↓
I5B opening review rerun
```

I5A-03 is not pre-authorized to invent values. It may open only around findings actually emitted by the hardened frozen-v0.2 validator.

# Immediate next

1. implement validator v0.3 against frozen ruleset v0.2;
2. add direct false-readiness regression for corrected Quarry-02;
3. preserve B3/B4 and image I0–I5A-02 regression behavior except where prior tests incorrectly expected false readiness;
4. run existing Temporal/runtime/restart regressions to prove isolation;
5. close VCON-01 only after corrected Quarry is no longer falsely `READY_FOR_AUTOMATION_DESIGN`.
