# TALOS — Gated Roadmap v0.42

Status: **ACTIVE PLAN — BPMN PROCESS CONFIRMATION PROGRAM INSERTED**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.41.md` for active planning. Historical versions remain preserved.

## Why the roadmap changes

Talos already proved generic Temporal execution and arbitrary-image admission/transport. The next risk is not merely whether a vision model can produce a plausible interpretation. The higher-value risk is whether a business user can verify, correct, and explicitly authorize what Talos believes the process is **before** automation design begins.

Therefore the real arbitrary-image vision gateway moves behind a BPMN confirmation program.

```text
MODEL CAN INTERPRET IMAGE
          ≠
USER AGREES WITH BUSINESS PROCESS
```

## Standard representation decision

BPMN is the standard user-facing business-process representation for Talos.

```text
IMAGE ──────────────┐
                    │
NATIVE BPMN ────────┼──→ BPMN WORKSPACE → USER PROCESS CONFIRMATION
                    │
TALOS CANVAS ───────┘
```

Native BPMN does not require visual reinterpretation. Image sources require perception/projection. Talos Canvas supplies a native structured graph. All routes converge into an editable BPMN revision.

The Talos Canonical Process Model remains the internal semantic/provenance/validation model underneath the BPMN review surface.

## Closed status retained

```text
I0 exact image intake                                  ✅ CLOSED
I1 perception boundary                                ✅ CLOSED
I2 common source evidence                             ✅ CLOSED
I3 review surface                                     ✅ CLOSED
I4 canonical + validation                             ✅ CLOSED
I5A confirmation/correction                           ✅ CLOSED
I5B semantic freeze                                   ✅ CLOSED
I5C generic capability/execution design               ✅ CLOSED
I6 generic Temporal runtime/browser/restart proof     ✅ CLOSED
I7A arbitrary image admission                         ✅ CLOSED
I7B-01 async provider transport + validation          ✅ CLOSED
```

## New BPMN confirmation program

```text
I7B-02 BPMN revision + confirmation safety contract       🟡 ACTIVE
I7B-03 canonical/image/canvas → BPMN projection            ⛔ NEXT
I7B-04 BPMN XML + BPMN-DI round-trip workspace             ⛔
I7B-05 graph/XML synchronized editing                       ⛔
I7B-06 natural-language correction proposal workflow       ⛔
I7B-07 confirmation → semantic-freeze handoff integration  ⛔
I7B-08 Process Confirmation browser surface                ⛔
I7C    real arbitrary-image vision-model gateway           ⛔ DEFERRED UNTIL GATE
```

## I7B-02 — BPMN revision + confirmation safety contract

### Goal

Make the statement below executable in Talos code:

> Talos may not enter automation design unless an authority has confirmed the exact current BPMN revision representing the exact canonical ProcessRevision.

### Contract artifacts

```text
BpmnProcessRevision
NaturalLanguageBpmnCorrectionProposal
BusinessProcessConfirmationRecord
AutomationHandoffConfirmationEvaluation
```

### Required invariants

```text
1. BPMN revision is immutable and versioned                          ✅ required
2. exact BPMN XML is SHA-256 pinned                                  ✅ required
3. semantic meaning and BPMN-DI layout have separate digests         ✅ required
4. visual-only edits are distinguishable from semantic edits         ✅ required
5. natural-language corrections never auto-apply                     ✅ required
6. accepting NL correction requires explicit authority               ✅ required
7. process confirmation pins exact BPMN + exact ProcessRevision      ✅ required
8. later BPMN revision invalidates old confirmation for handoff       ✅ required
9. revoked confirmation immediately blocks handoff                    ✅ required
10. confirmation does not itself freeze/deploy/execute                ✅ required
```

## Process Confirmation product surface

The canonical UX target is:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ TALOS — PROCESS CONFIRMATION                                       │
├─────────────────────────┬───────────────────────────────────────────┤
│ ORIGINAL SOURCE         │ BPMN — WHAT TALOS UNDERSTOOD              │
│ [ image / preview ]     │ [ editable BPMN graphic ]                 │
├─────────────────────────┴───────────────────────────────────────────┤
│ BPMN XML                                              [ View XML ] │
├─────────────────────────────────────────────────────────────────────┤
│ Talos found: ✅ activities  ✅ gateways  🟡 unresolved semantics    │
│                                                                     │
│ [ Edit BPMN ] [ Tell Talos what's wrong ] [ Confirm Process ]      │
└─────────────────────────────────────────────────────────────────────┘
```

This is a trust boundary, not merely a visualization.

## I7B-03 — BPMN projection

Prove deterministic projection contracts for:

```text
canonical ProcessRevision → BPMN semantic model
image-derived ProcessRevision → BPMN candidate
Talos Canvas ProcessRevision → BPMN candidate
native BPMN → preserved native BPMN model
```

No source origin may be erased.

## I7B-04 / I7B-05 — Round-trip workspace

Prove:

```text
BPMN XML → model → graphic
GRAPH EDIT → model → BPMN XML
XML EDIT → parse/validate → model → graphic
```

A graph and XML view must never represent different current business meanings.

Visual-only BPMN-DI edits must not trigger false semantic change.

## I7B-06 — Natural-language correction

Natural language is an assisted edit surface only.

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
USER INSTRUCTION → SILENT PROCESS MUTATION
```

## I7B-07 — Freeze integration

The existing semantic-freeze gate must be extended so `AUTOMATION_DESIGN_HANDOFF` requires a valid current `BusinessProcessConfirmationRecord`.

The intended invariant becomes:

```text
READY VALIDATION
+ EXACT REVIEW BASELINE
+ AUTHORITY
+ ACCEPTED SCOPE
+ EXACT CONFIRMED BPMN REVISION
        ↓
SEMANTIC FREEZE FOR AUTOMATION DESIGN
```

Until I7B-07 is closed, the I7B-02 confirmation evaluator is an explicit precondition contract but not yet retrofitted into every historical reference flow.

## I7B-08 — Browser proof

Build the actual Process Confirmation browser surface with:

```text
original source preview
editable BPMN graphic
BPMN XML view/editor
findings + uncertainty summary
graph edit action
natural-language correction action
Confirm Process action
revision history / diff
```

## I7C — Real vision-model gateway

Only after the user-verification boundary exists end-to-end do we resume arbitrary-image model interpretation.

The I7C model gateway remains vendor-neutral and must still obey:

```text
MODEL OUTPUT       = INFERRED
MODEL CONFIDENCE   ≠ BUSINESS TRUTH
MODEL SUCCESS      ≠ PROCESS CONFIRMATION
MODEL SUCCESS      ≠ SEMANTIC FREEZE
MODEL SUCCESS      ≠ EXECUTION AUTHORITY
```

## Two human trust gates

### Gate A — Business Process Confirmation

```text
SOURCE ↔ BPMN
```

Question: **Did Talos understand the process correctly?**

### Gate B — Automation Design Confirmation

```text
CONFIRMED BPMN ↔ TEMPORAL DESIGN
```

Question: **Did Talos automate the confirmed process correctly?**

Gate B remains downstream work. Gate A is now a prerequisite.

## Level status

```text
LEVEL 1 — METHODOLOGY / FRAMEWORK    ✅ CLOSED
LEVEL 2 — DESIGN SYSTEM              ✅ CLOSED
LEVEL 3 — AUTOMATION PLATFORM        🟡 IN PROGRESS
```

The immediate Level-3 claim being earned is now:

```text
USER-VERIFIABLE BPMN BUSINESS-TRUTH GATE   🟡 I7B
```

The claim intentionally deferred until after I7B is:

```text
REAL ARBITRARY-IMAGE VISION INTERPRETATION  ⛔ I7C
```
