# TALOS — Gated Roadmap v0.41

Status: **ACTIVE PLAN — I7B-01 CLOSED / I7B-02 REAL VISION-MODEL GATEWAY OPENING**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.40.md` for active planning. Historical roadmap versions remain preserved.

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
I7B-01 async provider transport + response validation ✅ CLOSED
I7B-02 real vision-model gateway                    🟡 OPENING
```

# I7B-01 closure truth

Talos now has a real asynchronous boundary for arbitrary-image model transport:

```text
PRESERVED SOURCE IMAGE
  ↓
VERIFIED CONTENT-ADDRESSED BYTES
  ↓
ASYNC HTTP PROVIDER TRANSPORT
  ↓
UNTRUSTED MODEL RESPONSE
  ↓
STRUCTURAL + CROSS-REFERENCE VALIDATION
  ↓
I7A ADMISSION
  ↓
INFERRED REVIEW EVIDENCE OR SAFE STOP
```

The provider boundary remains replaceable and vendor-neutral.

# Frozen provider authority rule

No provider or model may directly create or declare authoritative Talos business/execution truth.

```text
MODEL OUTPUT             = MODEL_INFERENCE
MODEL CONFIDENCE         ≠ SOURCE_TRUTH
MODEL PREFERENCE         ≠ HUMAN SELECTION
MODEL RESULT             ≠ CONFIRMATION
MODEL SUCCESS            ≠ FREEZE AUTHORITY
MODEL SUCCESS            ≠ EXECUTION AUTHORITY
```

All model output must pass through existing Talos review and authority gates.

# I7B-02 — Real vision-model gateway

## Goal

Provide a concrete, configurable vision-model gateway implementation that can accept the I7B-01 transport envelope, invoke a real multimodal model, and return the provider-neutral `ImagePerceptionProviderResult` contract.

This gateway belongs outside Talos Canonical/Review/Runtime semantics and remains one replaceable provider adapter among possible alternatives.

## Required shape

```text
Talos image-perception core
  ↓
I7B-01 HTTP transport
  ↓
VISION MODEL GATEWAY
  ↓
configured multimodal provider/model
  ↓
provider-neutral evidence response
  ↓
I7B-01 validation
  ↓
I7A admission
```

## Gateway responsibilities

The gateway may:

```text
send image bytes to a configured multimodal model
request structured visual/process evidence
translate provider response into provider-neutral Talos perception schema
report provider/model/version/pipeline provenance
return confidence + alternatives + diagnostics
```

The gateway must not:

```text
auto-confirm business meaning
invent unsupported branches
infer execution timing missing from the source
create SemanticFreezeRecord
select capability bindings
create ExecutionPlan authority
select Temporal primitives
start Workflow execution
```

## I7B-02 configuration boundary

Provider configuration belongs in runtime/environment configuration, not frozen semantic artifacts.

Expected configuration class:

```text
VISION_GATEWAY_PROVIDER
VISION_GATEWAY_MODEL
VISION_GATEWAY_ENDPOINT / provider-specific endpoint
VISION_GATEWAY_CREDENTIAL
VISION_GATEWAY_TIMEOUT
```

Secrets must never be persisted into:

```text
SourceRepresentation
SemanticClaim
ProcessRevision
CapabilityDesignRevision
ExecutionPlanRevision
TemporalMappingRevision
RuntimePolicyRevision
DeploymentRevision
```

## Structured inference target

The gateway should request only the provider-neutral evidence families already accepted by Talos:

```text
anchors[]
observations[]
occurrenceCandidates[]
alternativeSets[]
relationCandidates[]
diagnostics[]
```

All semantic classifications are candidates. All provider-generated meaning remains `MODEL_INFERENCE` and downstream `INFERRED` until explicit review.

## I7B-02 first acceptance gate

A real configured model call using an arbitrary non-Quarry process image must prove:

```text
1. real external/model call succeeds through I7B-01 transport       ✅ required
2. exact image byte identity remains traceable                      ✅ required
3. provider/model/version/pipeline provenance is recorded           ✅ required
4. returned schema passes I7B-01 validation                         ✅ required
5. evidence enters Talos only as INFERRED                           ✅ required
6. source image remains immutable                                   ✅ required
7. malformed/model refusal/timeout remains safe-stop capable        ✅ required
8. no automatic semantic/execution authority is granted             ✅ required
9. Quarry-01 I6 runtime remains green                               ✅ required
10. Quarry-02 incomplete WAIT remains mapping-blocked               ✅ required
```

## Quarry-02 invariant

The model may observe the literal phrase:

```text
On Next Wednesday
```

but it may not manufacture missing execution timing details.

Without explicitly accepted executable timing semantics such as required timezone/time interpretation, Talos must still refuse conversion to:

```text
DURABLE_TIMER
```

This guard is independent of model confidence.

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
ASYNC PROVIDER TRANSPORT / RESPONSE VALIDATION       ✅
```

Next claim to earn:

```text
REAL ARBITRARY-IMAGE VISION-MODEL INTERPRETATION      🟡 I7B-02
```

Not yet claimed:

```text
ARBITRARY-PROCESS PRODUCTION AUTOMATION PLATFORM      ❌
```

# Immediate gate

```text
I7B-02

ARBITRARY IMAGE
  ↓
I7B-01 VERIFIED TRANSPORT
  ↓
REAL MULTIMODAL MODEL GATEWAY
  ↓
PROVIDER-NEUTRAL EVIDENCE
  ↓
I7B-01 VALIDATION
  ↓
I7A ADMISSION
  ↓
HUMAN REVIEW

NO automatic execution authority
```
