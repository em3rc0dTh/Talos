# TALOS — Gated Roadmap v0.43

Status: **ACTIVE PLAN — I7B-02 CLOSED / I7B-03 BPMN PROJECTION OPENING**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.42.md` for active planning. Historical roadmap versions remain preserved.

## Current product pipeline

```text
                         INPUT
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
     IMAGE               BPMN              TALOS CANVAS
       │                   │                    │
       ▼                   │                    ▼
 PERCEPTION                │              NATIVE GRAPH
       │                   │                    │
       ▼                   │                    ▼
 BPMN CANDIDATE            │              BPMN CANDIDATE
       │                   │                    │
       └───────────────────┼────────────────────┘
                           ▼
                    BPMN WORKSPACE
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      GRAPH EDIT        XML EDIT        NL EDIT
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                    BPMN REVISION
                           ↓
                SEMANTIC VALIDATION
                           ↓
             USER PROCESS CONFIRMATION
                           ↓
              CONFIRMED BPMN REVISION
                           ↓
                  CANONICAL FREEZE
                           ↓
                  CAPABILITY DESIGN
                           ↓
                  CAPABILITY BINDING
                           ↓
                   EXECUTION PLAN
                           ↓
                  TEMPORAL MAPPING
                           ↓
                   RUNTIME POLICY
                           ↓
                 DEPLOYMENT DESIGN
                           ↓
                TEMPORAL WORKFLOW
                           ↓
              AUTOMATION REVIEW CANVAS
                           ↓
                  DEPLOY / EXECUTE
```

## Closed status

```text
I0 exact image intake                                    ✅ CLOSED
I1 perception boundary                                  ✅ CLOSED
I2 common source evidence                               ✅ CLOSED
I3 review surface                                       ✅ CLOSED
I4 canonical + validation                               ✅ CLOSED
I5A confirmation/correction                             ✅ CLOSED
I5B semantic freeze                                     ✅ CLOSED
I5C generic capability/execution design                 ✅ CLOSED
I6 generic Temporal runtime/browser/restart proof       ✅ CLOSED
I7A arbitrary image admission                           ✅ CLOSED
I7B-01 async provider transport + validation            ✅ CLOSED
I7B-02 BPMN revision + process confirmation contract    ✅ CLOSED
```

## BPMN confirmation program

```text
I7B-03 canonical/image/canvas → BPMN projection            🟡 OPENING
I7B-04 BPMN XML + BPMN-DI round-trip workspace             ⛔
I7B-05 graph/XML synchronized editing                       ⛔
I7B-06 natural-language correction proposal workflow       ⛔
I7B-07 confirmation → semantic-freeze handoff integration  ⛔
I7B-08 Process Confirmation browser surface                ⛔
I7C    real arbitrary-image vision-model gateway           ⛔ DEFERRED UNTIL GATE
```

# I7B-03 — Canonical → BPMN projection

## Goal

Create the first deterministic BPMN candidate from Talos canonical business semantics without granting the BPMN projection independent authority and without erasing source provenance.

```text
SOURCE
  ↓
CANONICAL PROCESS REVISION
  ↓
BPMN PROJECTOR
  ↓
BPMN PROCESS MODEL + BPMN-DI CANDIDATE
  ↓
BpmnProcessRevision(DRAFT)
```

## Source-route behavior

### Image

```text
IMAGE
  ↓
perception/evidence
  ↓
canonical candidate
  ↓
BPMN projection
```

The BPMN candidate remains derived/inferred until business confirmation.

### Talos Canvas

```text
TALOS CANVAS
  ↓
structured source graph
  ↓
canonical ProcessRevision
  ↓
BPMN projection
```

Canvas origin remains traceable.

### Native BPMN

Native BPMN must not be pointlessly reconstructed through the generic projector.

```text
NATIVE BPMN XML
  ↓
preserve exact source
  ↓
parse + validate
  ↓
BpmnProcessRevision(NATIVE_BPMN_IMPORT)
```

I7B-03 may define the native-import boundary, but full XML/DI round-trip proof belongs to I7B-04.

## Required semantic mapping discipline

Projection may map canonical business constructs only when BPMN has a defensible representation.

Initial target families:

```text
START                 → startEvent
END                   → endEvent
ACTION                → task
DECISION              → exclusiveGateway when semantics support exclusivity
WAIT                   → intermediate catch event only when BPMN semantic representation is supportable
SUBPROCESS             → subProcess / collapsed representation only when canonical semantics justify it
ACTOR / participant    → participant/lane only when assignment/scope is explicit
SEQUENCE               → sequenceFlow
BUSINESS RULE          → conditionExpression / extension evidence where lossless mapping is possible
```

No projection rule may invent execution semantics.

```text
ACTION      ≠ Temporal Activity
WAIT        ≠ durable timer
SUBPROCESS  ≠ Child Workflow
ACTOR       ≠ Worker
```

## Provenance invariant

Every generated BPMN semantic element must retain a backward mapping to its canonical subject and, through canonical provenance, to source evidence.

```text
BPMN ELEMENT
    ↓
canonical subjectRef
    ↓
ProcessRevision / SemanticClaim
    ↓
SourceEvidence / SourceRepresentation
```

BPMN identity must not replace canonical identity.

## Projection result contract

I7B-03 should introduce a projection result that records at minimum:

```text
sourceRoute
source ProcessRevision
source validation assessment when available
BPMN element mappings
unprojectable semantic items
projection diagnostics
semantic digest
initial BPMN-DI/layout digest
BPMN XML digest
projector version
```

Unprojectable or ambiguous meaning must be surfaced, not silently dropped.

## Initial acceptance gate

```text
1. Quarry-01 confirmed canonical graph projects to valid BPMN candidate        ✅ required
2. BPMN start/end/task/gateway/sequence identities are deterministic           ✅ required
3. exact source/canonical provenance remains traceable                         ✅ required
4. branch BusinessRules are not reduced to label guessing                      ✅ required
5. generated BPMN remains DRAFT / non-authoritative                            ✅ required
6. projection creates no SemanticFreeze/Capability/Execution/Temporal artifact ✅ required
7. Quarry-02 WAIT incompleteness is preserved without timer fabrication         ✅ required
8. unsupported canonical meaning is reported, not silently discarded            ✅ required
9. repeated projection of same immutable semantics is deterministic              ✅ required
10. all I0–I7B-02 regression gates remain green                                ✅ required
```

## Frozen process-confirmation principle

I7B-03 output must terminate at the review boundary:

```text
BPMN CANDIDATE
     ↓
USER REVIEW / EDIT / CONFIRM
```

Never:

```text
BPMN CANDIDATE
     ↓
AUTOMATION DESIGN WITHOUT CONFIRMATION   ❌
```

# Level status

```text
LEVEL 1 — METHODOLOGY / FRAMEWORK    ✅ CLOSED
LEVEL 2 — DESIGN SYSTEM              ✅ CLOSED
LEVEL 3 — AUTOMATION PLATFORM        🟡 IN PROGRESS
```

Earned in I7B-02:

```text
USER-VERIFIABLE BPMN BUSINESS-TRUTH CONTRACT  ✅
```

Next claim:

```text
DETERMINISTIC CANONICAL → BPMN REVIEW PROJECTION  🟡 I7B-03
```
