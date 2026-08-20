# Talos — I7B-05 Process Confirmation Workspace Evidence v0.1

Status: **CLOSURE CANDIDATE — FINAL EXACT-HEAD CI REQUIRED**  
Date: **2026-08-20**  
Branch: `image-i7b05-process-confirmation-workspace-v0.1`  
PR: **#19 — Image I7B-05: real Process Confirmation workspace**

## Purpose

I7B-05 closes the gap exposed by the earlier Quarry-01 runtime demo: that demo proved the Temporal engine, but it loaded a repository fixture internally rather than requiring the user to submit a process through the Talos UI.

The new evidence question is therefore:

> Can a user provide a real process source to Talos, inspect/edit BPMN through synchronized graph/XML surfaces, and remain protected from premature confirmation or execution authority?

## Product boundary implemented

```text
USER
 │
 ├── uploads PNG
 │      ↓
 │   exact source bytes preserved
 │      ↓
 │   SOURCE_PRESERVED_INTERPRETATION_PENDING
 │      ↓
 │   no BPMN revision yet
 │   no confirmation authority
 │   no execution authority
 │
 └── uploads native BPMN
        ↓
     XML preserved
        ↓
     bpmn-moddle parse / round-trip
        ↓
     BpmnProcessRevision(DRAFT)
        ↓
     bpmn-js graphical workbench ↔ XML editor
        ↓
     canonical reconciliation required
        ↓
     Confirm Process only after alignment
```

## Runtime components

Implemented:

- `packages/application/src/bpmn-workspace.ts`
  - guarded image intake
  - native BPMN import
  - immutable graph/XML edit revisions
  - append-only confirmation evidence
  - effective confirmed-state derivation
  - collision-free repeated native import sequencing
- `apps/reference-api/src/workspace-server.ts`
  - real browser file inputs
  - original-source panel
  - real `bpmn-js` modeler
  - BPMN XML editor
  - graph/XML commit controls
  - confirmation gate state
- exact browser dependency `bpmn-js@18.24.0`
- `tests/image-i7b05-process-confirmation-workspace.test.ts`
- I7B-05 step in `.github/workflows/image-vslice.yml`

## User-input proof

The I7B-05 test sends the Quarry-01 PNG through the **same HTTP upload boundary used by the browser**, rather than allowing the server to fetch it as an implicit fixture.

Expected response:

```text
status                         SOURCE_PRESERVED_INTERPRETATION_PENDING
automaticConfirmationAuthorized false
automaticExecutionAuthorized    false
nextRequiredStage               IMAGE_PERCEPTION
BpmnProcessRevision             ABSENT
```

The exact uploaded source SHA remains:

`8ede24c9f1162ed83c10d8c62063d8d19813c993965378acf1a2e36113218bd9`

The digest match proves byte identity for the test input. It does **not** turn the image into source-semantic authority.

## Native BPMN proof

A user-supplied native BPMN file is admitted as:

```text
sourceRoute              NATIVE_BPMN
editMode                 NATIVE_BPMN_IMPORT
state                    DRAFT
canonicalAlignmentStatus REQUIRES_CANONICAL_RECONCILIATION
```

The model has BPMN-DI and is renderable in the browser workbench. Renderability does not authorize confirmation.

## Editing proof

### Visual-only edit

Changing only BPMN-DI coordinates yields:

```text
changeClass = VISUAL_ONLY
```

and preserves the business semantic digest.

### Semantic edit

Changing task meaning yields:

```text
changeClass                    = SEMANTIC
requiresCanonicalReconciliation = true
canonicalProcessRevisionId      = absent
```

A confirmation request against that unresolved revision returns a blocked response rather than accepting a caller-provided canonical ID as truth.

### Invalid XML

Malformed XML is rejected before a new revision is stored. A subsequent valid edit can still use the prior valid revision as its parent, demonstrating that the invalid draft never replaced committed state.

## Reimport hardening

Two separate imports of byte/semantic-equivalent native BPMN produce distinct `BpmnProcessRevision` identities and monotonically advancing workspace revision numbers.

This preserves:

```text
same BPMN content ≠ same user intake/review occurrence
```

while retaining the same XML digest where content is identical.

## Append-only confirmation hardening

The stored BPMN revision is never rewritten from DRAFT to CONFIRMED.

Instead:

```text
stored BpmnProcessRevision(DRAFT)                  immutable
BusinessProcessConfirmationRecord(CONFIRMED)       immutable
------------------------------------------------------------
effective workspace view                           CONFIRMED
```

The dedicated persistence test asserts that after confirmation:

- the original stored BPMN payload still has `state = DRAFT`;
- exactly one confirmation authority record exists;
- `workspace.getRevision(...)` exposes an effective `CONFIRMED` view;
- no replacement BPMN payload was persisted under the same ID.

## First full CI evidence

Before the final persistence hardening, the complete I7B-05 slice passed on PR head `c1128881e5545efa187d72167b72467519501f62`:

```text
Image vertical slice              run 192  ✅
B7-B9 Temporal reference runtime  run 213  ✅
B10 Restart safety                run 128  ✅
```

Image run 192 passed every historical image gate through I7B-04 and the new I7B-05 workspace gate.

The final closure requires a new exact-head run after:

- temporary dependency-sync workflow removal;
- repeated-import hardening;
- append-only confirmation persistence hardening;
- this evidence/roadmap update.

No final merge claim is made by this document until that final PR head is green.

## Safety conclusion

I7B-05 establishes the following boundary:

```text
UPLOAD          ≠ APPROVAL
PARSE           ≠ APPROVAL
RENDER          ≠ APPROVAL
EDIT            ≠ APPROVAL
AI INTERPRETATION ≠ APPROVAL
CONFIRM PROCESS  requires explicit aligned human authority
```

And still:

```text
PROCESS CONFIRMATION ≠ AUTOMATION DESIGN APPROVAL
```

The next slice is I7B-06 natural-language correction proposal/diff/decision workflow. Real arbitrary-image interpretation remains a separate I7C gateway and must not be fabricated inside I7B-05.
