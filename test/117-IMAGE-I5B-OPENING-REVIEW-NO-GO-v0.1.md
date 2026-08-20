# Talos — I5B Opening Review NO-GO v0.1

Status: **NO-GO — I5B FREEZE REMAINS CLOSED**  
Date: **2026-08-19**

## Question under review

After I5A-02, the bounded Quarry-02 image-derived semantic revision receives:

```text
semanticVerdict     = VALID
executionReadiness  = READY_FOR_AUTOMATION_DESIGN
```

The I5B opening review asked whether that state is sufficient evidence to authorize semantic freeze and downstream execution handoff.

## Verdict

**No.**

The current BUILD reference validator is not yet conformant with all material frozen Semantic Validation v0.2 rules demonstrated by the original V01–V16 pressure suite.

Therefore the current Quarry-02 readiness result is a **reference-implementation false positive**, not permission to freeze.

## Frozen contract evidence

Frozen contract:

```text
design/03-SEMANTIC-VALIDATION-CONTRACT-v0.2.md
```

The frozen rule catalog includes, among others:

```text
SV-STR-001  UNRESOLVED_ENTRY_SEMANTICS
SV-HUM-001  HUMAN_COMPLETION_OBSERVATION_UNRESOLVED
SV-EVT-002  WAIT_TIME_EXPRESSION_INCOMPLETE
SV-COR-001  CORRELATION_IDENTITY_UNRESOLVED
SV-SUB-001  SUBPROCESS_INTERNAL_SEMANTICS_MISSING
```

The v0.2 readiness contract explicitly states that missing required semantics such as unresolved correlation or material subprocess internals produce:

```text
INSUFFICIENT_DETAIL
```

not `READY_FOR_AUTOMATION_DESIGN`.

## Frozen regression evidence

The frozen T1-03 full-suite regression is:

```text
test/10-SEMANTIC-VALIDATION-REGRESSION-RESULT-v0.1.md
V01–V16 = 16 / 16 PASS
```

For V02 / Quarry-02 it explicitly records:

```text
semanticVerdict: VALID_WITH_FINDINGS
executionReadiness: INSUFFICIENT_DETAIL

wait/subprocess/physical completion findings remain blocking
```

The V02 pressure spec requires:

```text
SV-EVT-002 WAIT_TIME_EXPRESSION_INCOMPLETE
SV-SUB-001 SUBPROCESS_INTERNAL_SEMANTICS_MISSING
SV-HUM-001 HUMAN_COMPLETION_OBSERVATION_UNRESOLVED
SV-COR-001 CORRELATION_IDENTITY_UNRESOLVED
```

## Quarry-02 Foundry evidence

The standardized Quarry source handoff remains explicitly `NOT_READY` and asks, before executable design:

```text
1. What exact event starts one company order workflow instance?
2. What stable business identifier correlates the order request and later work?
7. What exact instant does Next Wednesday mean, in which timezone and calendar?
9. What happens inside Arrange Delivery?
11. How is physical delivery assigned, observed, confirmed, failed, or cancelled?
```

It also states:

```text
ARRANGE_DELIVERY
internal definition: UNKNOWN / COLLAPSED IN SOURCE
```

and:

```text
Deliver Water is physical human work and requires a completion-observation mechanism before it can be executable
```

Therefore I5A-02's explicit END, branch rules, and subprocess boundary label do not resolve all frozen automation-readiness semantics.

## BUILD implementation defect

Current reference implementation:

```text
build/reference-vertical-slice/packages/semantic-core/src/validation.ts
```

already lists many of these rule codes in the readiness-blocker set, but `collectFindings()` does not implement several corresponding predicates.

The implementation currently lacks sufficient emission logic for material v0.2 cases including:

```text
SV-STR-001
SV-HUM-001
SV-COR-001
SV-SUB-001
```

and only emits `SV-EVT-002` when a WAIT has already been classified as `SCHEDULE`/`DEADLINE`; Quarry-02's image-derived WAIT does not currently carry enough accepted timing semantics to trigger that path reliably.

This means:

```text
no emitted blocker
      ↓
readiness algorithm sees no blocker
      ↓
READY_FOR_AUTOMATION_DESIGN
```

which is not conformance with the frozen v0.2 contract/regression evidence.

## Freeze implementation audit

The frozen Phase-3 freeze evaluator itself is source-family neutral.

It consumes pinned review/validation state and does not require a Canvas revision.

Therefore:

```text
FREEZE CONTRACT DEFECT       not established
VALIDATOR IMPLEMENTATION GAP established
```

## ExecutionPlan audit

The existing reference ExecutionPlan builder is intentionally fixture-specific and hard-coded to the Canvas approval example (`Request submitted`, `Review request`, `Approved?`, etc.).

Therefore it cannot lawfully be reused for Quarry-02.

This is not a frozen Phase-5 architecture defect. It simply means a future Quarry execution handoff must implement the frozen generic ExecutionPlan contracts rather than masquerading the Canvas reference builder as generic.

## Required recovery path

```text
I5A-02 corrected Quarry
        ↓
CURRENT REFERENCE VALIDATOR
        ↓
false READY
        ✕
        ↓
STOP I5B
        ↓
REFERENCE VALIDATOR CONFORMANCE HARDENING
        ↓
revalidate Quarry
        ↓
new explicit findings
        ↓
minimum reviewer clarification/correction
        ↓
revalidate again
        ↓
true readiness
        ↓
I5B opening review rerun
```

## Governance decision

```text
Semantic Validation contract v0.2     ✅ REMAINS FROZEN
Reference validator implementation    🔴 MUST BE HARDENED
I5B semantic freeze                   ⛔ CLOSED
Capability handoff                    ⛔ CLOSED
ExecutionPlan                         ⛔ CLOSED
Temporal mapping/execution            ⛔ CLOSED
```

## Immediate authorized work

Dedicated branch:

```text
image-i5b-validation-conformance-v0.1
```

Authorized scope:

1. version the reference validator implementation;
2. implement missing frozen-v0.2 finding predicates only where the Canonical model/evidence can support them without guessing;
3. emit explicit missing-semantics findings where the frozen contract requires absence itself to block readiness;
4. make corrected Quarry-02 fail readiness for the correct reasons;
5. add regression coverage proving the false-positive is closed;
6. preserve B2/B3/B4/I0–I5A-02 regressions;
7. make no freeze, capability, execution, mapping, runtime-policy, deployment, or Temporal changes.

I5B may be reconsidered only after this conformance gate closes.