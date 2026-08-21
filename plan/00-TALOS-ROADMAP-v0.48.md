# TALOS — Gated Roadmap v0.48

Status: **ACTIVE PLAN — I7B-08 CLOSED / I7C REAL ARBITRARY-IMAGE VISION OPENING**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.47.md` for active planning. Historical versions remain preserved.

## Closed program status

```text
I0–I6   canonical / validation / automation / real Temporal runtime  ✅ CLOSED
I7A     arbitrary-image admission boundary                           ✅ CLOSED
I7B-01  async image provider transport                               ✅ CLOSED
I7B-02  BPMN process-confirmation contract                           ✅ CLOSED
I7B-03  canonical → BPMN review projection                           ✅ CLOSED
I7B-04  BPMN XML ↔ BPMN-DI round trip                                ✅ CLOSED
I7B-05  real Process Confirmation input/workbench                     ✅ CLOSED
I7B-06  proposal-only natural-language BPMN correction                ✅ CLOSED
I7B-07  confirmed BPMN → exact semantic freeze integration            ✅ CLOSED
I7B-08  integrated Process Confirmation product surface               ✅ CLOSED
```

## I7B-08 closure evidence

Exact proven implementation head:

```text
d3424db713678afd0a500f39e3de067d9086abc8
```

Exact CI:

```text
Image vertical slice              run 241 ✅
B7-B9 Temporal reference runtime  run 254 ✅
B10 Restart safety                run 159 ✅
```

Detailed evidence:

```text
evidence/08-IMAGE-I7B08-PROCESS-CONFIRMATION-PRODUCT-EVIDENCE-v0.1.md
```

## Product state after I7B-08

Talos now has a coherent user-facing path for **native BPMN**:

```text
USER .BPMN
    ↓
EXACT NATIVE SOURCE
    ↓
PARSE / GRAPH / XML
    ↓
DETERMINISTIC CANONICAL RECONCILIATION
    ↓
SEMANTIC VALIDATION
    ↓
GRAPH / XML / OPTIONAL NL CORRECTION
    ↓
CONFIRM PROCESS
    ↓
CONFIRMED BPMN REVISION
    ↓
SEPARATE AUTOMATION-DESIGN APPROVAL
    ↓
I7B-07 EXACT SEMANTIC FREEZE GATE
```

The two human decisions remain distinct:

```text
A. Confirm Process
   “This BPMN represents my business process.”

B. Approve for Automation Design
   “Evaluate this exact confirmed process for semantic freeze.”
```

Neither decision is deployment approval.

The image route remains deliberately incomplete:

```text
IMAGE
  ↓
EXACT SOURCE PRESERVED
  ↓
INTERPRETATION_PENDING
```

No fake BPMN is produced while real arbitrary-image vision is absent.

# I7C — Real arbitrary-image vision provider

## Product goal

Replace the current honest `INTERPRETATION_PENDING` boundary with a real provider-backed perception path for previously unseen process images, while preserving every authority boundary already closed in I7A–I7B-08.

The target is not:

```text
IMAGE → AI → EXECUTE
```

The target is:

```text
ARBITRARY PROCESS IMAGE
        ↓
EXACT SOURCE INTAKE
        ↓
REAL VISION PROVIDER
        ↓
UNTRUSTED PERCEPTION RESULT
        ↓
SOURCE-EVIDENCE MATERIALIZATION
        ↓
CANONICAL NORMALIZATION
        ↓
SEMANTIC VALIDATION
        ↓
BPMN REVIEW CANDIDATE
        ↓
I7B-08 PROCESS CONFIRMATION SURFACE
        ↓
USER CORRECTION / CONFIRMATION
```

## I7C design constraints

### 1. Exact source identity remains primary

Every provider request must pin the exact preserved representation:

```text
sourceArtifactId
sourceRepresentationId
SHA-256
media type
dimensions
exact image bytes
```

The provider cannot replace source identity.

### 2. Provider output is never source truth by itself

All model-produced perception remains:

```text
providerClass = MODEL_PROVIDER
truthClass    = INFERRED
semanticAuthority = NONE
automaticFreezeAuthorized = false
automaticExecutionAuthorized = false
```

A high-confidence model response does not become user confirmation.

### 3. Previously unseen images must be tested

I7C cannot close using only Quarry digest fixtures.

The gate must include at least one process image whose exact digest is not registered in any fixture provider and prove that its perception came through the real configured provider path.

### 4. Model response must be structurally validated before semantic materialization

Malformed, incomplete, mismatched, stale, timed-out, or provider-failed responses must safe-stop before they become source evidence or canonical meaning.

### 5. Missing meaning stays missing

The vision provider may report uncertainty or omit information. Talos must not repair missing business semantics merely to produce a complete BPMN diagram.

Examples:

```text
unreadable branch target   → unresolved relationship
unclear actor              → UNKNOWN / validation finding
ambiguous timer text       → WAIT preserved, timer semantics incomplete
unproven end state         → completion finding
```

### 6. BPMN remains a review representation, not model authority

Real image perception may eventually produce:

```text
image evidence
→ canonical candidate
→ BPMN candidate
```

but that BPMN remains a DRAFT until the I7B-08 confirmation gate is satisfied.

## I7C implementation slices

```text
I7C-01  real provider configuration + credential-safe transport        ⛔
I7C-02  provider response schema for process-diagram perception         ⛔
I7C-03  arbitrary-image perception → common source evidence             ⛔
I7C-04  source evidence → canonical validation → BPMN candidate         ⛔
I7C-05  product upload → real vision → Process Confirmation integration ⛔
I7C-06  unseen-image adversarial / failure / no-fabrication gate         ⛔
```

The provider implementation must stay replaceable; Talos contracts must not become vendor-specific.

## I7C acceptance gate

```text
1. previously unseen valid PNG reaches a real configured vision provider     ✅ required
2. exact preserved image identity/bytes are pinned to the request             ✅ required
3. provider/model/version/pipeline identity is persisted                       ✅ required
4. response schema and request correlation are validated                       ✅ required
5. malformed/timeout/HTTP/provider failures safe-stop append-only               ✅ required
6. provider output remains INFERRED with zero confirmation/execution authority  ✅ required
7. materialized source evidence retains image-region provenance                 ✅ required
8. uncertain/missing semantics remain explicit rather than fabricated           ✅ required
9. semantic validation runs before a BPMN review candidate is considered ready  ✅ required
10. image-derived BPMN enters the existing I7B-08 confirmation surface          ✅ required
11. no image-derived process can bypass user Process Confirmation               ✅ required
12. no Process Confirmation can bypass the I7B-07 semantic freeze gate          ✅ required
13. prior I7A–I7B-08 + Temporal + restart regressions remain green              ✅ required
```

## After I7C

```text
I8   automation-design review + BPMN ↔ ExecutionPlan ↔ Temporal traceability  ⛔
I9   one-app startup / deployment / complete end-to-end product gate           ⛔
```

I7C is the next critical bridge because it turns the current image input from a safe intake boundary into the first real **arbitrary-image → reviewable BPMN** path without weakening Talos' human authority model.
