# TALOS — Gated Roadmap v0.45

Status: **ACTIVE PLAN — I7B-04 CLOSED / I7B-05 PROCESS CONFIRMATION WORKSPACE CLOSURE**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.44.md` for active planning. Historical versions remain preserved.

## Closed foundation

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
I7B-04 BPMN XML ↔ BPMN-DI round trip                    ✅ CLOSED
```

## Productization sequence

```text
I7B-05 real Process Confirmation workspace                 🟡 CLOSING
I7B-06 natural-language BPMN correction proposal workflow ⛔
I7B-07 confirmation → validate → semantic freeze           ⛔
I7B-08 browser-product consolidation / workflow review     ⛔
I7C    real arbitrary-image vision-model gateway           ⛔
I8     automation-design review + BPMN↔Temporal trace UI   ⛔
I9     one runnable Talos application / deployment gate     ⛔
```

The earlier roadmap split synchronized graph/XML editing and the browser confirmation surface into separate I7B-05 and I7B-08 slices. Implementation experience showed that synchronized editing is only defensible when exercised through the real browser/API boundary. I7B-05 therefore combines the **first real Process Confirmation workbench shell** with synchronized graph/XML editing. I7B-08 remains reserved for product consolidation and the downstream automation-review experience; history is not rewritten.

# I7B-05 — Real Process Confirmation workspace

## Goal

Replace the Quarry-only runtime demo as the user-facing entry point with a real input boundary:

```text
USER INPUT
   │
   ├── PNG IMAGE
   │      ↓
   │   EXACT SOURCE PRESERVED
   │      ↓
   │   INTERPRETATION REQUIRED
   │      ↓
   │   BPMN REVIEW CANDIDATE   [later I7C provider wiring]
   │
   └── NATIVE BPMN
          ↓
       EXACT BPMN SOURCE
          ↓
       PARSE + VALIDATE
          ↓
       BPMN REVIEW CANDIDATE
```

The workbench then exposes:

```text
ORIGINAL SOURCE
      ↕
BPMN GRAPHIC  ←→  BPMN XML
      ↓
CANONICAL RECONCILIATION
      ↓
CONFIRM PROCESS
```

## Critical truth separation

```text
SOURCE PRESERVED  ≠ PROCESS UNDERSTOOD
PROCESS UNDERSTOOD ≠ PROCESS CONFIRMED
PROCESS CONFIRMED  ≠ AUTOMATION APPROVED
AUTOMATION APPROVED ≠ DEPLOYMENT EXECUTED
```

An uploaded image alone must never produce a confirmed process or execution authority.

## Native BPMN rule

Native BPMN continues to bypass image perception:

```text
USER .BPMN
   ↓
PRESERVE XML
   ↓
PARSE / VALIDATE
   ↓
BPMN-JS WORKBENCH
```

It begins as:

```text
sourceRoute              = NATIVE_BPMN
editMode                 = NATIVE_BPMN_IMPORT
state                    = DRAFT
canonicalAlignmentStatus = REQUIRES_CANONICAL_RECONCILIATION
```

so rendering/editability never equals confirmation authority.

## Graph/XML synchronization

The browser modeler and XML editor are two editing surfaces for one revision chain.

```text
GRAPH CHANGE
   ↓ saveXML
PROPOSED BPMN XML
   ↓ server parse/round-trip
NEW BPMN REVISION
```

```text
XML CHANGE
   ↓ server parse/round-trip
NEW BPMN REVISION
   ↓ browser importXML
UPDATED GRAPH
```

Invalid XML does not replace the currently committed revision.

## Semantic-edit rule

```text
VISUAL / BPMN-DI CHANGE
      → semantic meaning unchanged
      → exact canonical pin may survive when one exists

SEMANTIC BPMN CHANGE
      → old canonical pin removed
      → REQUIRES_CANONICAL_RECONCILIATION
      → Confirm Process blocked
```

## Append-only confirmation

Confirmation is separate authority evidence. Talos must never rewrite a stored DRAFT BPMN payload merely to say it was confirmed.

```text
BpmnProcessRevision(DRAFT)       [immutable]
        +
BusinessProcessConfirmationRecord(CONFIRMED) [immutable]
        ↓
EFFECTIVE VIEW = CONFIRMED
```

This preserves the distinction between model identity and later human authority.

## Reimport rule

Repeated import of byte/semantic-equivalent native BPMN is still a separate user intake/review event. It must not collide with a historical review revision.

## I7B-05 acceptance gate

```text
1. Browser exposes explicit PNG and BPMN file inputs                     ✅ required
2. PNG upload preserves actual user-supplied bytes                       ✅ required
3. PNG upload alone produces no BpmnProcessRevision                      ✅ required
4. PNG upload grants no confirmation/execution authority                 ✅ required
5. Native BPMN parses and renders with bpmn-js                           ✅ required
6. Native BPMN opens as DRAFT / reconciliation-required                  ✅ required
7. Graph edits serialize and create a new immutable revision             ✅ required
8. XML edits parse and create a new immutable revision                   ✅ required
9. Invalid XML cannot replace the current valid revision                 ✅ required
10. semantic edits invalidate stale canonical authority                  ✅ required
11. Confirm Process is blocked before canonical reconciliation           ✅ required
12. repeated same-BPMN import creates distinct immutable review revisions ✅ required
13. confirmation persists separately without mutating BPMN payload       ✅ required
14. all previous image/runtime/restart gates remain green                 ✅ required
```

## What I7B-05 does not claim

```text
REAL ARBITRARY-IMAGE VISION               ❌
AUTOMATIC IMAGE → BPMN                    ❌
NATURAL-LANGUAGE BPMN PATCH UI            ❌
CONFIRMATION → SEMANTIC FREEZE WIRING     ❌
AUTOMATION REVIEW / TEMPORAL TRACE UI     ❌
ONE PRODUCTION-DEPLOYED TALOS APP         ❌
```

The workspace explicitly exposes image interpretation as pending until I7C is connected.

## Immediate next gate — I7B-06

Natural-language correction must obey:

```text
USER INSTRUCTION
      ↓
PROPOSED BPMN PATCH
      ↓
VISIBLE DIFF
      ↓
ACCEPT / MODIFY / REJECT
```

Never:

```text
USER TEXT → SILENT BPMN MUTATION
```

## Level status

```text
LEVEL 1 — METHODOLOGY / FRAMEWORK    ✅ CLOSED
LEVEL 2 — DESIGN SYSTEM              ✅ CLOSED
LEVEL 3 — AUTOMATION PLATFORM        🟡 IN PROGRESS
```

The runtime engine is already real. I7B-05 is the bridge from a runtime proof to an actual user-controlled Talos process-input experience.
