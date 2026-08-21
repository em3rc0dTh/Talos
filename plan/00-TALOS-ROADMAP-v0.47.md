# TALOS — Gated Roadmap v0.47

Status: **ACTIVE PLAN — I7B-07 CLOSED / I7B-08 FULL PROCESS CONFIRMATION BROWSER UX OPENING**  
Date: **2026-08-20**  
Supersedes `00-TALOS-ROADMAP-v0.46.md` for active planning. Historical versions remain preserved.

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
```

## I7B-07 closure evidence

Exact proven code head:

```text
1e0550da7f2d6044281304275177eb744e235630
```

CI:

```text
Image vertical slice              run 210 ✅
B7-B9 Temporal reference runtime  run 229 ✅
B10 Restart safety                run 140 ✅
```

I7B-07 proves:

```text
BusinessProcessConfirmationRecord
        +
exact current BpmnProcessRevision
        +
exact canonical ProcessRevision
        +
exact active ReviewBaselineBundle
        +
exact pinned ValidationAssessment
        +
READY_FOR_AUTOMATION_DESIGN
        +
independent freeze authority
        ↓
existing evaluateFreeze contract
        ↓
SemanticFreezeRecord
```

No one input substitutes for another authority layer.

# I7B-08 — Full Process Confirmation browser UX

## Product goal

Turn the backend/workbench pieces already proven in I7B-02 through I7B-07 into one coherent browser experience that a user can operate without knowing Talos internals.

The browser must communicate the trust model visually:

```text
ORIGINAL SOURCE
      ↕
WHAT TALOS UNDERSTOOD
      ↕
USER AUTHORITY
```

## Required workspace

```text
┌─────────────────────────────────────────────────────────────────────┐
│ TALOS — PROCESS CONFIRMATION                                       │
├─────────────────────────┬───────────────────────────────────────────┤
│ ORIGINAL SOURCE         │ BPMN — WHAT TALOS UNDERSTOOD              │
│                         │                                           │
│ image preview /         │ editable bpmn-js modeler                  │
│ native BPMN identity    │                                           │
├─────────────────────────┴───────────────────────────────────────────┤
│ BPMN XML                                   [ View / Edit XML ]     │
├─────────────────────────────────────────────────────────────────────┤
│ VALIDATION / REVIEW STATUS                                         │
│ confirmed facts · unresolved meaning · blockers                    │
├─────────────────────────────────────────────────────────────────────┤
│ [Edit BPMN] [Tell Talos what's wrong] [Confirm Process]            │
└─────────────────────────────────────────────────────────────────────┘
```

## User paths

### Image

```text
UPLOAD IMAGE
→ preserve exact source
→ perception status
→ BPMN candidate when available
→ graphical/XML review
→ correction / confirmation
```

I7B-08 must not pretend image interpretation exists when the real vision provider has not produced a candidate.

### Native BPMN

```text
UPLOAD .bpmn
→ preserve exact source identity
→ parse/validate
→ graphical/XML workspace
→ canonical reconciliation
→ confirmation
```

### Editing

```text
GRAPH CHANGE → BPMN XML UPDATE
XML CHANGE   → GRAPH UPDATE
```

Invalid XML remains a rejected proposed edit and cannot replace the current valid revision.

### Natural-language correction

```text
USER INSTRUCTION
→ untrusted provider output
→ validated proposed BPMN revision
→ visible diff
→ ACCEPT / REJECT
```

No silent mutation.

### Confirmation

The button `Confirm Process` must be enabled only when the current BPMN revision is canonically reconciled and can produce an exact `BusinessProcessConfirmationRecord`.

Confirmation must visibly mean:

> “Yes, this BPMN represents the business process I intend Talos to use for automation design.”

It must not imply deployment approval.

### Post-confirmation handoff

After exact confirmation, the browser may present semantic-validation/freeze readiness. The transition to automation design uses the I7B-07 gate and must expose blockers instead of manufacturing readiness.

## I7B-08 acceptance gate

```text
1. blank start requires explicit user input                           ✅ required
2. image upload preserves and previews exact source                   ✅ required
3. image with no perception candidate cannot show fake BPMN           ✅ required
4. native BPMN opens directly in the real graphical modeler           ✅ required
5. graph/XML remain synchronized                                      ✅ required
6. invalid XML preserves last valid revision                          ✅ required
7. natural-language correction displays proposal + diff               ✅ required
8. accept/reject never silently mutates confirmed meaning             ✅ required
9. validation status and blockers are visible                         ✅ required
10. Confirm Process obeys exact canonical-reconciliation gate          ✅ required
11. confirmed process can invoke I7B-07 freeze readiness path          ✅ required
12. process confirmation remains distinct from deployment approval     ✅ required
13. no preloaded Quarry process masquerades as user input              ✅ required
14. all prior image/runtime/restart gates remain green                 ✅ required
```

## After I7B-08

```text
I7C  real arbitrary-image vision provider                         ⛔
I8   automation design review + BPMN↔Temporal traceability        ⛔
I9   one-app startup / deploy / complete end-to-end product gate  ⛔
```

I7B-08 is the point where Talos' existing contracts become a coherent user-facing Process Confirmation product. I7C then replaces the image-path `INTERPRETATION_PENDING` boundary with real arbitrary-image perception without weakening the confirmation gates.
