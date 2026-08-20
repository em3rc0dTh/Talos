# TALOS — Gated Roadmap v0.40

Status: **ACTIVE PLAN — I7A CLOSED / I7B REAL ARBITRARY-IMAGE PROVIDER OPENING**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.39.md` for active planning. Historical roadmap versions remain preserved.

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
I5C-00 downstream reference-builder audit           ✅ CLOSED
I5C-01 generic capability design                    ✅ CLOSED
I5C-02 generic ExecutionPlan draft                  ✅ CLOSED
I5C-03 capability resolution + resolved plan        ✅ CLOSED
I6 generic Temporal mapping/runtime/browser proof   ✅ CLOSED
I7A arbitrary image admission                       ✅ CLOSED
I7B real arbitrary-image interpretation provider    🟡 OPENING
```

# What I7A earned

Talos can now accept an arbitrary PNG and make a safe provider-admission decision without fixture fallback or execution escalation.

```text
ARBITRARY PNG
  ↓
EXACT SOURCE INTAKE
  ↓
PROVIDER-NEUTRAL REQUEST
  ↓
PERCEPTION RESULT
  ↓
ADMISSION DECISION
     ├─ ADMITTED_FOR_REVIEW
     ├─ SAFE_STOP_NO_RESULT
     └─ SAFE_STOP_PROVIDER_FAILURE
```

All admitted interpretation remains:

```text
semanticAuthority = NONE
```

and all automatic execution authority remains false.

# New invariant after I7A

```text
provider returned data
        ≠
provider result admitted for review
        ≠
semantic truth confirmed
        ≠
semantic freeze authorized
        ≠
execution authorized
```

This distinction is mandatory for I7B and every later provider.

# I7B — Real arbitrary-image interpretation provider

## Goal

Replace fixture-only interpretation with a production-shaped provider implementation that can inspect arbitrary process images and emit only the provider-neutral evidence contract already frozen by I1/I7A.

The provider is allowed to infer visual evidence. It is not allowed to accept business meaning on the user's behalf.

## I7B provider output contract

A real provider may produce:

```text
Visual anchors
Text/shape observations
Occurrence candidates
Relation candidates
Alternative sets
Confidence
Diagnostics
```

It must not directly produce:

```text
accepted ProcessRevision
confirmed SemanticClaim
SemanticFreezeRecord
CapabilityBindingRevision
ExecutionPlanRevision
TemporalMappingRevision
RuntimePolicyRevision
DeploymentRevision
Workflow execution
```

Those remain downstream Talos responsibilities.

## Provider truth rule

All arbitrary-image interpretation produced by I7B enters Talos as:

```text
MODEL_INFERENCE / INFERRED
```

never:

```text
SOURCE_TRUTH
CONFIRMED
EXECUTABLE
```

unless later authority-backed review changes that state through the existing immutable review flow.

## I7B implementation boundary

```text
ImagePerceptionProvider
        ↑
REAL MODEL PROVIDER ADAPTER
        ↓
provider-neutral ImagePerceptionProviderResult
        ↓
I7A admission
        ↓
common evidence / review entry
```

The real provider implementation must remain replaceable. Talos must not couple canonical semantics to one AI vendor/model.

## First I7B atomic gate

```text
I7B-01 — PROVIDER TRANSPORT + RESULT VALIDATION
```

Required behavior:

```text
arbitrary exact image source
  ↓
provider request envelope
  ↓
external/model transport boundary
  ↓
provider response
  ↓
structural validation
     ├─ valid response   → I7A admission
     └─ invalid response → safe provider failure evidence
```

The first slice does not need broad semantic accuracy. It must prove a real provider can be called and that malformed/untrusted provider output cannot bypass Talos admission rules.

## I7B-01 acceptance criteria

```text
1. provider implementation is not a Quarry digest fixture                 ✅ required
2. exact source representation identity is preserved                      ✅ required
3. provider/model/version/pipeline provenance is persisted                ✅ required
4. valid arbitrary response enters only as INFERRED review evidence       ✅ required
5. malformed response is rejected before evidence materialization         ✅ required
6. provider timeout/failure yields terminal append-only evidence          ✅ required
7. no provider response can set CONFIRMED/EXECUTABLE truth                ✅ required
8. I7A arbitrary admission regressions remain green                       ✅ required
9. Quarry-01 I6 runtime remains green                                     ✅ required
10. Quarry-02 incomplete WAIT remains mapping-blocked                     ✅ required
```

# Provider selection policy

I7B must preserve this architecture:

```text
Talos Core
  ↓
ImagePerceptionProvider interface
  ↓
Provider Adapter A / B / C
```

not:

```text
Talos Core → one hard-coded vendor SDK
```

Provider-specific credentials, endpoints and model configuration belong outside canonical/review/runtime semantics.

# Quarry-02 safety invariant remains frozen

```text
On Next Wednesday
```

continues to be insufficient for executable timer materialization.

I7B may improve visual interpretation but may not infer missing timezone/time-of-day/execution schedule truth and silently convert the WAIT into `DURABLE_TIMER`.

# Level status

```text
LEVEL 1 — METHODOLOGY / FRAMEWORK    ✅ CLOSED
LEVEL 2 — DESIGN SYSTEM              ✅ CLOSED
LEVEL 3 — AUTOMATION PLATFORM        🟡 IN PROGRESS
```

Level-3 earned:

```text
SEMANTIC FREEZE                                      ✅
GENERIC CAPABILITY DESIGN                            ✅
CAPABILITY BINDING                                   ✅
HUMAN DESIGN PATH                                    ✅
GENERIC EXECUTION PLAN                               ✅
GENERIC TEMPORAL MAPPING                             ✅
RUNTIME POLICY                                       ✅
DEPLOYMENT REALIZATION                               ✅
GENERIC TEMPORAL WORKFLOW                            ✅
REAL TEMPORAL EXECUTION                              ✅
WORKER RESTART PROOF                                 ✅
BROWSER TEST SURFACE                                 ✅
ARBITRARY SOURCE INTAKE / PERCEPTION ADMISSION       ✅
```

Next claim to earn:

```text
REAL ARBITRARY-IMAGE INTERPRETATION PROVIDER          🟡 I7B
```

Not yet claimed:

```text
ARBITRARY-PROCESS PRODUCTION AUTOMATION PLATFORM      ❌
```

# Immediate gate

```text
I7B-01

ARBITRARY IMAGE
  ↓
REAL PROVIDER ADAPTER
  ↓
UNTRUSTED PROVIDER RESPONSE
  ↓
STRUCTURAL VALIDATION
  ↓
I7A ADMISSION
  ↓
INFERRED REVIEW EVIDENCE OR SAFE STOP

NO automatic execution authority
```
