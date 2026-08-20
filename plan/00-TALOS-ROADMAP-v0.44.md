# TALOS — Gated Roadmap v0.44

Status: **ACTIVE PLAN — I7B-03 CLOSED / I7B-04 BPMN ROUND-TRIP OPENING**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.43.md` for active planning. Historical versions remain preserved.

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
I7B-03 canonical → BPMN review projection               ✅ CLOSED
```

## BPMN confirmation program

```text
I7B-04 BPMN XML + BPMN-DI round-trip workspace             🟡 OPENING
I7B-05 graph/XML synchronized editing                       ⛔
I7B-06 natural-language correction proposal workflow       ⛔
I7B-07 confirmation → semantic-freeze handoff integration  ⛔
I7B-08 Process Confirmation browser surface                ⛔
I7C    real arbitrary-image vision-model gateway           ⛔ DEFERRED UNTIL GATE
```

# I7B-04 — BPMN XML + BPMN-DI round-trip workspace

## Goal

Make BPMN XML and BPMN diagram state two synchronized representations of the **same immutable BPMN revision**.

```text
BPMN XML
   ↓ parse / validate
BPMN MODEL
   ↓
BPMN-DI GRAPHIC
```

and:

```text
BPMN-DI / GRAPH CHANGE
   ↓
BPMN MODEL
   ↓ serialize
BPMN XML
```

No Talos workspace state may claim:

```text
GRAPH = process A
XML   = process B
```

## Native BPMN import

Native `.bpmn` input must take the direct path:

```text
EXACT BPMN SOURCE BYTES
      ↓
PRESERVE SOURCE IDENTITY
      ↓
PARSE + VALIDATE
      ↓
BpmnProcessRevision(
  sourceRoute = NATIVE_BPMN,
  editMode    = NATIVE_BPMN_IMPORT
)
      ↓
RENDER WORKSPACE
```

Native BPMN must not be unnecessarily reconstructed by the canonical projector.

## Round-trip invariants

### Semantic round trip

```text
XML A
  ↓ parse
model A
  ↓ serialize
XML B
```

`XML A` and `XML B` need not be byte-identical if the serializer normalizes formatting, namespace ordering, or equivalent XML form. They must be semantically equivalent under the Talos BPMN semantic digest.

### Diagram round trip

BPMN-DI positions, sizes, and waypoints must remain represented in the diagram digest and survive parse/serialize.

### Visual-only mutation

A graphical movement that changes only BPMN-DI must produce:

```text
semanticDigest  SAME
 diagramDigest  CHANGED
classification  VISUAL_ONLY
```

### Semantic mutation

Changing a task, flow, gateway, event meaning, or other business semantic must produce:

```text
semanticDigest  CHANGED
classification  SEMANTIC
```

and the BPMN revision must require semantic validation / confirmation again.

## Parser safety

Invalid or unsupported XML must never replace the last valid BPMN revision.

```text
XML EDIT
  ↓
PARSE / VALIDATION FAILURE
  ↓
REJECT PROPOSED REVISION
  ↓
CURRENT VALID REVISION UNCHANGED
```

Unknown BPMN extension elements must be preserved when technically safe or explicitly diagnosed if preservation cannot be guaranteed.

## Authority rule

Round-trip success does not confer business authority.

```text
VALID BPMN XML             ≠ CONFIRMED BUSINESS PROCESS
RENDERABLE BPMN            ≠ CONFIRMED BUSINESS PROCESS
ROUND-TRIP SUCCESS         ≠ AUTOMATION AUTHORITY
```

I7B-02 `BusinessProcessConfirmationRecord` remains mandatory.

## First acceptance gate

```text
1. I7B-03-generated BPMN parses successfully                         ✅ required
2. parsed model serializes back to semantically equivalent BPMN      ✅ required
3. exact native BPMN source identity remains preserved               ✅ required
4. BPMN-DI bounds/waypoints survive round trip                        ✅ required
5. visual-only DI mutation keeps semantic digest stable               ✅ required
6. semantic mutation changes semantic digest                          ✅ required
7. invalid XML cannot replace current valid revision                  ✅ required
8. native BPMN import creates DRAFT/NATIVE_BPMN_IMPORT revision       ✅ required
9. round-trip/import creates no freeze/execution/deployment authority ✅ required
10. all I0–I7B-03 regression gates remain green                       ✅ required
```

## Product surface enabled by this gate

I7B-04 is the foundation for the screen:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ TALOS — PROCESS CONFIRMATION                                       │
├─────────────────────────┬───────────────────────────────────────────┤
│ ORIGINAL SOURCE         │ BPMN — WHAT TALOS UNDERSTOOD              │
│ [source preview]        │ [rendered BPMN from same XML/model]       │
├─────────────────────────┴───────────────────────────────────────────┤
│ BPMN XML                                      [View / Edit XML]    │
└─────────────────────────────────────────────────────────────────────┘
```

I7B-05 will then expose synchronized graph/XML editing; I7B-08 will make the full confirmation surface browser-usable.

## Level status

```text
LEVEL 1 — METHODOLOGY / FRAMEWORK    ✅ CLOSED
LEVEL 2 — DESIGN SYSTEM              ✅ CLOSED
LEVEL 3 — AUTOMATION PLATFORM        🟡 IN PROGRESS
```

Earned:

```text
BPMN PROCESS CONFIRMATION CONTRACT       ✅
CANONICAL → BPMN REVIEW PROJECTION       ✅
```

Next claim:

```text
BPMN XML ↔ BPMN-DI ROUND-TRIP MODEL      🟡 I7B-04
```
