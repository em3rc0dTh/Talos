# TALOS — I7B-07 CONFIRMATION → SEMANTIC FREEZE INTEGRATION — OPENING v0.1

Status: **OPENING**  
Date: **2026-08-20**

## Goal

Connect the confirmed BPMN contract to the already-hardened semantic-freeze boundary without granting any new automatic authority.

```text
CONFIRMED BPMN REVISION
        ↓
EXACT BusinessProcessConfirmationRecord
        ↓
EXACT canonical ProcessRevision
        ↓
EXACT pinned ValidationAssessment
        ↓
READY_FOR_AUTOMATION_DESIGN ?
        │
   NO ──┴──→ STOP / NO FREEZE
        │
       YES
        ↓
EXPLICIT FREEZE AUTHORITY
        ↓
EXISTING evaluateFreeze(...)
        ↓
SemanticFreezeRecord
```

## Invariants

```text
BPMN confirmation authority  ≠ freeze authority
confirmed BPMN               ≠ validation readiness
validation readiness          ≠ freeze authority
SemanticFreezeRecord          ≠ deployment authority
```

The handoff must reject stale, revoked, digest-mismatched, canonically mismatched, validation-ineligible, authority-less, or otherwise incoherent inputs before any semantic freeze is created.

## Acceptance gate

1. Exact confirmed BPMN + exact canonical baseline + exact READY assessment + explicit freeze authority may create the existing semantic freeze.
2. Missing/revoked/stale confirmation creates no freeze.
3. BPMN XML/semantic digest mismatch creates no freeze.
4. Canonical ProcessRevision mismatch creates no freeze.
5. A different READY assessment cannot substitute for the exact pinned baseline assessment.
6. NOT_READY validation creates no freeze even when BPMN is confirmed.
7. BPMN confirmation authority does not substitute for missing freeze-command authority.
8. Freeze output still comes from the existing `evaluateFreeze` contract.
9. No capability, ExecutionPlan, Temporal, deployment, or execution artifact is created by I7B-07 itself.
10. All prior I0–I7B-06 and Temporal/restart regressions remain green.
