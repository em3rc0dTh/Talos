# TALOS — Gated Roadmap v0.39

Status: **ACTIVE PLAN — I6 CLOSED / I7 ARBITRARY-PROCESS INTAKE OPENING**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.38.md` for active planning. Historical roadmap versions remain preserved.

# Closed architecture phases

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

# Image vertical slice status

```text
I0 exact image intake                                ✅ CLOSED
I1 perception boundary                              ✅ CLOSED
I2 common source evidence                           ✅ CLOSED
I3 review surface                                   ✅ CLOSED
I4 canonical + validation                           ✅ CLOSED
I5A-01 confirmation                                 ✅ CLOSED
I5A-02 semantic correction/addition                 ✅ CLOSED
I5B semantic freeze                                 ✅ CLOSED
I5C-00 downstream reference-builder audit           ✅ CLOSED — REUSE NO-GO
I5C-01 generic capability design                    ✅ CLOSED
I5C-02 generic ExecutionPlan draft                  ✅ CLOSED
I5C-03 capability resolution + resolved plan        ✅ CLOSED
I6 generic Temporal mapping/runtime/browser proof   ✅ CLOSED
I7 arbitrary-process production intake              🟡 OPENING
```

# I6 closure truth

I6 proved the first real generic executable Talos path from a preserved user-supplied process image into Temporal:

```text
SOURCE IMAGE
  ↓
SOURCE-AWARE PERCEPTION
  ↓
COMMON EVIDENCE
  ↓
CANONICAL PROCESS
  ↓
VALIDATION
  ↓
HUMAN CONFIRMATION/CORRECTION
  ↓
SEMANTIC FREEZE
  ↓
GENERIC CAPABILITY DESIGN
  ↓
EXPLICIT CAPABILITY BINDING
  ↓
GENERIC EXECUTION PLAN
  ↓
GENERIC TEMPORAL MAPPING
  ↓
RUNTIME POLICY
  ↓
DEPLOYMENT REALIZATION
  ↓
IMMUTABLE COMPILED PROGRAM
  ↓
TalosGenericWorkflow
  ↓
REAL TEMPORAL EXECUTION
```

This is a real Level-3 slice, but it is not yet an arbitrary-process production automation platform.

# Preserved separations after I6

```text
SOURCE TRUTH          ≠ INFERENCE
INFERENCE             ≠ CONFIRMATION
SEMANTIC READY        ≠ FROZEN
FROZEN                ≠ CAPABILITY DESIGNED
CAPABILITY DESIGNED   ≠ CAPABILITY BOUND
EXECUTION PLAN        ≠ TEMPORAL MAPPING
TEMPORAL MAPPING      ≠ RUNTIME POLICY
RUNTIME POLICY        ≠ DEPLOYMENT
DEPLOYMENT INTENT     ≠ DEPLOYMENT REALIZATION
RUNTIME EXECUTION     ≠ SOURCE REWRITE
```

# Quarry-02 remains a negative safety fixture

Accepted business meaning contains:

```text
On Next Wednesday
```

Talos must continue to refuse durable timer materialization while executable time semantics remain incomplete.

Therefore:

```text
WAIT preserved                           ✅
missing timing truth exposed             ✅
Temporal mapping blocked                 ✅
DURABLE_TIMER fabricated                 ❌
```

No I7 work may weaken this guard.

# I7 — Arbitrary-process production intake

## Goal

Move from a deterministic conformance fixture to a production-shaped boundary where Talos can accept an arbitrary uploaded process artifact, preserve its identity, obtain provider-neutral interpretation evidence, and either:

```text
A. advance into canonical/review flow with explicit uncertainty
```

or:

```text
B. stop safely with inspectable NO_RESULT / NEEDS_REVIEW / unsupported evidence
```

without manufacturing business semantics.

## First atomic I7 slice

```text
I7A — ARBITRARY IMAGE INTAKE + PERCEPTION ADMISSION CONTRACT
```

Required behavior:

```text
arbitrary PNG upload
  ↓
exact byte preservation
  ↓
verified SHA-256 + dimensions
  ↓
provider-neutral perception request
  ↓
provider result admission
     ├─ SUCCEEDED/PARTIAL → persist evidence with confidence/truth separation
     ├─ NO_RESULT         → preserve source + diagnostics, stop safely
     └─ provider failure  → append attempt evidence, never invent result
```

I7A explicitly does **not** authorize:

```text
auto-confirmation
semantic freeze
auto-capability binding
auto-Temporal mapping
auto-deployment
```

## I7A acceptance gate

A second arbitrary PNG fixture that is not Quarry-01 or Quarry-02 must prove:

```text
1. distinct source/upload identity                              ✅ required
2. exact bytes/digest/dimensions preserved                     ✅ required
3. provider interface receives only preserved source identity  ✅ required
4. unsupported digest cannot fall through to Quarry fixture    ✅ required
5. no fabricated semantic candidate on NO_RESULT               ✅ required
6. repeated provider attempts remain append-only                ✅ required
7. current Quarry-01 I6 path remains green                     ✅ required
8. Quarry-02 WAIT negative proof remains green                 ✅ required
```

Only after I7A closes may Talos open an arbitrary-process interpretation/provider implementation slice.

# Level status

```text
LEVEL 1 — METHODOLOGY / FRAMEWORK    ✅ CLOSED
LEVEL 2 — DESIGN SYSTEM              ✅ CLOSED
LEVEL 3 — AUTOMATION PLATFORM        🟡 IN PROGRESS
```

Level-3 proven:

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

Level-3 next claim to earn:

```text
ARBITRARY-PROCESS PRODUCTION INTAKE / ADMISSION  🟡 I7A
```

Not yet claimed:

```text
ARBITRARY-PROCESS PRODUCTION AUTOMATION PLATFORM  ❌
```

# Immediate gate

```text
I7A

ARBITRARY PNG
  ↓
EXACT SOURCE INTAKE
  ↓
PROVIDER-NEUTRAL REQUEST
  ↓
ADMISSION / DIAGNOSTICS
  ↓
APPEND-ONLY EVIDENCE
  ↓
SAFE STOP OR REVIEW ENTRY

NO automatic execution authority
```

I7A is the next atomic move after I6 merge.