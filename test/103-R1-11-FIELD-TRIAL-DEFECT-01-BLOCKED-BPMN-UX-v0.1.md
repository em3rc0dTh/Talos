# R1-11 — Field Trial Defect 01 — Blocked Native BPMN UX

Status: **FIX IMPLEMENTED / OWNER RETEST REQUIRED**  
Observed during: **Talos 1.0 local Release Candidate field trial**  
Source used by product owner: `Car-Wash.bpmn`  
Observed mode: `DESIGN_ONLY`, image perception disabled

## Observed defect

A native BPMN source was successfully imported and preserved, but Canonical reconciliation did not produce a review binding. The product UI nevertheless attempted to open `/api/process-review` and surfaced:

```text
one-app process review context not found for this BPMN revision
ONE_APP_AUTHORITY_ORDER_VIOLATION
```

This was misleading. The authority engine was not being bypassed; the source simply had not reached a reconciled Canonical review state.

## Correct product truth

```text
BPMN SOURCE IMPORTED / PRESERVED
        ↓
Canonical reconciliation
        ↓
BLOCKED
        ↓
show exact BPMN reconciliation diagnostics
        ↓
no Canonical ProcessRevision admitted
        ↓
no business confirmation authority
        ↓
source BPMN remains editable
        ↓
semantic correction may retry reconciliation
```

## Fix

1. The product page now detects a blocked native-BPMN reconciliation before presenting it as an active process review.
2. The UI renders `RECONCILIATION BLOCKED · SOURCE PRESERVED`, shows exact diagnostic code/message/element identity, keeps confirmation disabled, and exposes the BPMN XML as a source-correction workspace.
3. `/api/bpmn/edit` now accepts a preserved DRAFT BPMN source even when no Canonical review binding exists.
4. A semantic correction that reconciles successfully creates the first real Canonical review binding without upgrading truth or authority automatically.
5. Visual/no-op source edits remain preserved but cannot manufacture Canonical review state.
6. The stale Runtime Profile sentence saying human UPDATE/SIGNAL is not executable was replaced with runtime-mode-aware product truth.

## Regression

`build/reference-vertical-slice/tests/r1-10-blocked-native-bpmn-source-correction.test.ts`

The regression proves:

- unsupported native BPMN is preserved and returns blocked reconciliation evidence;
- blocked source does not create an active process review;
- source XML remains editable;
- a semantic correction can reconcile through the source-aware reconciler;
- the corrected revision creates the first `PROCESS_REVIEW_REQUIRED` head;
- confirmation, automation and execution remain unauthorized until their explicit later gates;
- the product page renders blocked reconciliation truthfully.

## Retest instruction

Re-run the same `Car-Wash.bpmn` through the updated local RC. Expected behavior is either:

- `PROCESS_REVIEW_REQUIRED` if it reconciles, or
- `RECONCILIATION BLOCKED · SOURCE PRESERVED` with concrete BPMN diagnostics and editable XML.

The old `ONE_APP_AUTHORITY_ORDER_VIOLATION` presentation is no longer an acceptable field-trial outcome for a normal blocked import.