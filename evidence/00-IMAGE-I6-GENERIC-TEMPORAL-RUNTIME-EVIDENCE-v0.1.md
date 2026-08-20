# TALOS — Image I6 Generic Temporal Runtime Evidence v0.1

Status: **CLOSED — VERIFIED**  
Date: **2026-08-20**

## Purpose

Record the evidence that the first generic Level-3 Talos slice can move from a preserved image source through reviewed canonical semantics into a real Temporal execution without reusing the approval/email-specific reference runtime semantics.

## Positive proof — Quarry-01

The verified path is:

```text
Quarry-01 PNG
  ↓
exact image intake
  ↓
provider-neutral perception/common evidence
  ↓
canonical normalization + validation
  ↓
explicit human confirmation
  ↓
explicit reviewer-authored branch rules
  ↓
re-validation
  ↓
semantic freeze
  ↓
generic capability design
  ↓
explicit capability resolution/binding
  ↓
resolved generic ExecutionPlan
  ↓
generic Temporal mapping
  ↓
explicit runtime policy
  ↓
deployment design + realized worker binding
  ↓
immutable compiled runtime program
  ↓
TalosGenericWorkflow
  ↓
real local Temporal service
  ↓
generic Activities
  ↓
business completion path
```

The Workflow consumes the immutable compiled program. It does not query mutable Talos design state for a newer mapping, policy, binding, or process revision while executing.

## Runtime behavior proved

For Quarry-01 the test surface drives two explicit business facts:

```text
creditOk
fulfilledOk
```

Expected paths:

```text
creditOk = true
fulfilledOk = true

Receive Order
→ Check Credit
→ Credit ok?
→ Fulfill Order
→ Fulfilled ok?
→ Send invoice
→ Order complete
```

```text
creditOk = false

Receive Order
→ Check Credit
→ Credit ok?
→ Order Failed
```

```text
creditOk = true
fulfilledOk = false

Receive Order
→ Check Credit
→ Credit ok?
→ Fulfill Order
→ Fulfilled ok?
→ Order Failed
```

These are Temporal Workflow executions, not UI-only simulated transitions.

## Source-byte provenance correction

The current repository Quarry-01 PNG is not byte-identical to the older historical source record.

Historical source record:

```text
sha256      = 100741f25704d1f311ab1d9f0d51b6aa65255ae2258387d9dd5a853471d20779
dimensions  = 2048 × 971
```

Current repository fixture used for I6 conformance:

```text
sha256      = 8ede24c9f1162ed83c10d8c62063d8d19813c993965378acf1a2e36113218bd9
dimensions  = 3102 × 1472
```

The historical record was **not rewritten**. The I6 fixture provider is pinned separately to the exact current repository bytes. Any other digest is rejected with `NO_RESULT`.

This proves the intended Talos rule:

```text
new verified capture
  ≠
permission to rewrite historical source identity
```

## Negative proof — Quarry-02

Quarry-02 remains intentionally blocked before Temporal mapping because the accepted business meaning contains:

```text
On Next Wednesday
```

That phrase does not by itself establish a complete executable schedule/timezone contract.

Therefore Talos preserves:

```text
WAIT business semantics                         ✅
missing executable timing truth                 ✅
explicit blocker                                ✅
Temporal DURABLE_TIMER fabricated               ❌
```

This is a safety proof, not an implementation gap to bypass.

## CI evidence

Exact I6 head verified:

```text
8b87d45eeb691faf8148e939d56095a83b106516
```

Required GitHub Actions lanes on that head:

```text
Image vertical slice              ✅ SUCCESS — run 155
B7-B9 Temporal reference runtime  ✅ SUCCESS — run 179
B10 Restart safety                ✅ SUCCESS — run 114
```

The Image vertical slice includes:

```text
architecture verification         ✅
B2 source-intake regression       ✅
B3 canonical/validation regression✅
B4 review regression              ✅
I0                                 ✅
I1                                 ✅
I2                                 ✅
I3                                 ✅
I4                                 ✅
I5A-01                             ✅
I5A-02                             ✅
I5B-00                             ✅
I5C-01                             ✅
I5C-02                             ✅
I5C-03                             ✅
I6                                 ✅
```

## Browser-testable surface

The verified branch exposes:

```bash
cd build/reference-vertical-slice
npm ci
npm run demo:generic
```

Default browser endpoint:

```text
http://127.0.0.1:4317
```

The demo starts the generic Quarry-01 runtime design, a local Temporal service, the generic worker, and an HTTP surface that starts `TalosGenericWorkflow` executions.

## Level status after I6

```text
LEVEL 1 — METHODOLOGY / FRAMEWORK    ✅
LEVEL 2 — DESIGN SYSTEM              ✅
LEVEL 3 — AUTOMATION PLATFORM        🟡 FIRST GENERIC EXECUTABLE SLICE VERIFIED
```

Closed Level-3 capabilities:

```text
SEMANTIC FREEZE                 ✅
GENERIC CAPABILITY DESIGN       ✅
CAPABILITY BINDING              ✅
HUMAN DESIGN PATH               ✅
GENERIC EXECUTION PLAN          ✅
GENERIC TEMPORAL MAPPING        ✅
RUNTIME POLICY                  ✅
DEPLOYMENT REALIZATION          ✅
GENERIC TEMPORAL WORKFLOW       ✅
REAL TEMPORAL EXECUTION         ✅
WORKER RESTART PROOF            ✅
BROWSER TEST SURFACE            ✅
```

Still not claimed:

```text
ARBITRARY-PROCESS PRODUCTION AUTOMATION PLATFORM  ❌
```

## Closure decision

I6 is accepted and may merge only with all three required CI lanes green on the exact PR head. Quarry-02 remains a negative safety fixture until executable timing truth is explicitly supplied.
