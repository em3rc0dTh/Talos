# TALOS — Image I5A Semantic Review Opening Review v0.1

Status: **BOUNDED GO — I5A-01 CONFIRMATION-ONLY**  
Date: **2026-08-19**

## Baseline

I4 is closed:

```text
image bytes
→ perception/common evidence
→ INFERRED ProcessRevision
→ ValidationAssessment
```

Current Quarry-02 validation remains:

```text
semanticVerdict      INCOMPLETE
executionReadiness   INSUFFICIENT_DETAIL
```

with material classes including:

```text
SV-SRC-001   inferred meaning needs confirmation
SV-CMP-001   completion unproven
SV-CFL-001   branch rule unresolved
SV-SUB-002   subprocess boundary unresolved
```

## Review implementation audit

Already source-family neutral:

```text
initializeReview
ExplanationDraft
ReviewWorkspace / ReviewBaselineBundle
ReviewCommand
ReviewAuthoredSourceRevision model
ReviewConfirmationRecord model
createAcceptedReviewTransition
freeze evaluator
```

Still Canvas-specific:

```text
applyActorCorrection
nativeElementForCanonical
CanvasChangeSet
applyCanvasChangeSet
preserveCanvasRevision
adaptPreservedCanvas
normalizeAdapterResult(Canvas)
evaluateCorrectionDiff actor-specific expectations
```

Therefore image review must not reuse the Canvas correction application path.

## I5A-01 bounded target

Implement source-agnostic **claim confirmation** only.

Command shape:

```text
ReviewCommand.actionKind = CONFIRM
ReviewCommand.selectedClaimRefs[] = explicit inferred claims from the current ProcessRevision
```

Application behavior:

```text
current image-derived ProcessRevision
+ current ValidationAssessment
+ immutable ReviewWorkspace baseline
+ explicit reviewer command
        ↓
ReviewConfirmationRecord[]
ReviewAuthoredSourceRevision
        ↓
new ProcessRevision
  same business values / graph identity
  confirmed selected SemanticClaims
        ↓
new ValidationAssessment
        ↓
new review workspace baseline transition
```

## Required invariants

```text
IMAGE BYTES                         UNCHANGED
PERCEPTION OBSERVATIONS             UNCHANGED
PERCEPTION ALTERNATIVE SETS         UNCHANGED
ADAPTER ATTEMPT                     UNCHANGED
I4 ProcessRevision                  UNCHANGED / historical
I4 ValidationAssessment             UNCHANGED / historical
ReviewCommand                       append-only
ReviewConfirmationRecord            append-only
new ProcessRevision                 required for revised epistemic claim set
new ValidationAssessment            required
business semantic values            unchanged in I5A-01
```

Confirmation may change:

```text
SemanticClaim.truthClass
INFERRED → CONFIRMED
```

only for claims explicitly selected by the reviewer command.

It may not change claim value, node kind, relation role or process topology.

## Expected validation effect

If the reviewer explicitly confirms every material I4 inferred claim:

```text
SV-SRC-001    → resolved in new assessment
```

but:

```text
SV-CMP-001    remains
SV-CFL-001    remains
SV-SUB-002    remains
```

Therefore I5A-01 **must remain INSUFFICIENT_DETAIL** and may not freeze.

## Why new ProcessRevision is acceptable

The business meaning/value graph is unchanged, but the ProcessRevision embeds the active semantic claim set. A new revision preserves the historical I4 inferred claim state while making the new reviewer-confirmed epistemic state explicit.

Use:

```text
derivationKind = REINTERPRETATION
parentRevisionIds = [I4 revision]
```

Canonical subject identities remain stable where meaning is unchanged.

## I5A-01 acceptance

```text
1. initialize review from image I4 ProcessRevision                 PASS required
2. no Canvas/nativeSourceId requirement                            PASS required
3. explicit selectedClaimRefs required                             PASS required
4. unselected inferred claims remain INFERRED                      PASS required
5. selected claims become new CONFIRMED claims                     PASS required
6. old inferred claims remain persisted historically               PASS required
7. ReviewConfirmationRecord created for each confirmed claim       PASS required
8. ReviewAuthoredSourceRevision has no fake Canvas revision         PASS required
9. new ValidationAssessment supersedes old assessment              PASS required
10. SV-SRC-001 resolves only for fully confirmed material claims   PASS required
11. completion/branch/subprocess blockers remain                   PASS required
12. no SemanticFreezeRecord                                        PASS required
13. no Capability/Execution/Temporal artifact                      PASS required
14. Canvas B4 review regression remains green                      PASS required
15. image I0–I4 regression remains green                          PASS required
```

## Still closed

```text
I5A-02 semantic corrections/additions      ⛔ CLOSED
I5B semantic freeze/execution handoff       ⛔ CLOSED
I6 image → Temporal                         ⛔ CLOSED
```

**Verdict: I5A-01 confirmation-only BUILD is authorized.**
