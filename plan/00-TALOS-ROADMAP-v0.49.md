# TALOS — Gated Roadmap v0.49

Status: **ACTIVE PLAN — I7C-01 CLOSED / I7C-02 PROCESS-DIAGRAM PERCEPTION SCHEMA OPENING**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.48.md` for active planning. Historical versions remain preserved.

## Closed status

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
I7C-01  credential-safe real vision runtime configuration             ✅ CLOSED
```

## I7C-01 exact evidence

Implementation head:

```text
e7aa5cdb8ebf7b4ab52fc8056321fb7871763d41
```

CI:

```text
Image vertical slice              run 249 ✅
B7-B9 Temporal reference runtime  run 262 ✅
B10 Restart safety                run 164 ✅
```

Evidence:

```text
evidence/09-IMAGE-I7C01-REAL-VISION-RUNTIME-CONFIG-EVIDENCE-v0.1.md
```

# I7C-02 — Process-diagram perception response schema

## Goal

Define and enforce the exact semantic boundary between a real vision model/gateway and Talos for arbitrary business-process images.

The provider must not return canonical Talos truth directly. It must return **perception candidates** anchored to image evidence.

Target:

```text
EXACT PNG
   ↓
REAL MODEL / GATEWAY
   ↓
UNTRUSTED PROCESS-DIAGRAM PERCEPTION RESPONSE
   ↓
STRICT STRUCTURAL + REFERENTIAL VALIDATION
   ↓
I7A/I7B SOURCE-EVIDENCE ADMISSION
```

## Required response layers

```text
1. visual anchors
2. observations
3. occurrence candidates
4. relation candidates
5. alternatives / ambiguity
6. diagnostics
7. provider/model/pipeline identity
8. request correlation
```

## New hardening required

I7B-01 validates provider/model/version/pipeline identity, but I7C-02 must close stronger arbitrary-image response correlation:

```text
request sourceRepresentationId
request contentSha256
request coordinate space
provider response correlation block
```

A provider response for the wrong image, stale request, wrong dimensions, or wrong digest must safe-stop before evidence materialization.

## Semantic rule

Provider output may suggest:

```text
activity candidate
gateway candidate
actor/lane candidate
connector candidate
direction candidate
text literal candidate
timer/wait text candidate
annotation candidate
```

but must not directly assert:

```text
SOURCE_TRUTH
CONFIRMED
EXECUTABLE
SemanticFreezeRecord
ExecutionPlan
Temporal command
```

## I7C-02 acceptance gate

```text
1. response includes exact request-correlation block                    required
2. wrong source representation id safe-stops                           required
3. wrong SHA safe-stops                                                 required
4. wrong coordinate-space dimensions safe-stop                         required
5. duplicate/unresolved provider keys safe-stop                         required
6. relation endpoints must reference declared candidates/anchors        required
7. alternative sets must reference declared observations/anchors        required
8. model response remains MODEL_INFERENCE / INFERRED                    required
9. malformed response creates no common evidence                        required
10. prior I7A–I7C-01 + Temporal + restart gates remain green            required
```

# Remaining product path

```text
I7C-02  process-diagram perception schema + correlation                 🟡 ACTIVE
I7C-03  arbitrary image perception → common source evidence             ⛔
I7C-04  source evidence → canonical validation → BPMN candidate         ⛔
I7C-05  product upload → real vision → Process Confirmation integration ⛔
I7C-06  unseen-image adversarial/no-fabrication gate                    ⛔
I8      automation design review + BPMN↔Temporal traceability           ⛔
I9      one-app startup/deploy/full end-to-end product gate             ⛔
```
