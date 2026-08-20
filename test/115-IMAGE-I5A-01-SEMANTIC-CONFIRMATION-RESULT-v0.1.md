# TALOS — Image I5A-01 Semantic Confirmation Result v0.1

Status: **PASS — I5A-01 CLOSED**  
Date: **2026-08-19**

## Scope

I5A-01 proves that an image-derived I4 ProcessRevision can enter the frozen Phase-3 review workspace and receive explicit human confirmation **without mutating the image, perception history, or manufacturing a native Canvas source**.

## Confirmed path

```text
I4 image-derived ProcessRevision
truthClass = INFERRED
+ ValidationAssessment
        ↓
initializeReview(...)
        ↓
ReviewCommand
  actionKind = CONFIRM
  selectedClaimRefs = explicit reviewer selection
  authorityRef = explicit reviewer authority
        ↓
ReviewConfirmationRecord[]
ReviewAuthoredSourceRevision
        ↓
new ProcessRevision
  derivationKind = REINTERPRETATION
  parent = I4 revision
        ↓
new confirmed SemanticClaim records
        ↓
new ValidationAssessment
        ↓
accepted review baseline transition
```

## Source-family neutrality

The confirmation application uses no:

```text
CanvasDefinition
CanvasRevision
CanvasChangeSet
native source element mutation
image byte mutation
perception record mutation
new adapter attempt
```

`ReviewAuthoredSourceRevision.sourceCanvasRevisionRef` remains absent.

## Historical preservation

Executable evidence proves:

```text
I4 inferred ProcessRevision                      preserved unchanged
I4 inferred SemanticClaims                      preserved unchanged
image content hash                               unchanged
AdapterAttempt count                             unchanged
PerceptionObservation count                      unchanged
PerceptionAlternativeSet count                   unchanged
CanvasRevision count                             0
```

The new reviewer-confirmed revision is separate history.

## Epistemic behavior

Only claims explicitly named in `selectedClaimRefs` are promoted in the new active claim set:

```text
INFERRED → CONFIRMED
```

No semantic value is changed by I5A-01.

Full confirmation fixture:

```text
all active image semantic claims                 CONFIRMED
all image ProcessNode truth class                CONFIRMED
all image ProcessEdge truth class                CONFIRMED
```

Partial confirmation fixture:

```text
selected claim                                   CONFIRMED
unselected claims                                INFERRED
SV-SRC-001                                       remains
```

## Validation effect

With all active I4 inferred claims explicitly confirmed:

```text
SV-SRC-001                                       RESOLVED
```

while real missing-meaning blockers remain:

```text
SV-CMP-001                                       remains
SV-SUB-002                                       remains
SV-CFL-001                                       remains (2 branches)
semanticVerdict                                  INCOMPLETE
executionReadiness                               INSUFFICIENT_DETAIL
```

Separate `FindingDisposition` records preserve resolution history for superseded source-confirmation findings.

## Generic review defect found and fixed

I5A pressure testing exposed a Phase-3 implementation defect in `generateExplanationDraft()`.

Global validation-finding facets legitimately may have no `subjectRef`, but the explanation semantic digest serialized:

```text
subjectRef: undefined
```

which violates deterministic JSON.

The repair preserves absence as absence:

```text
subjectRef omitted when absent
propertyPath omitted when absent
literalValue omitted when absent
```

No fake subject was invented.

Frozen B4 review regression remains green after the repair.

## No downstream authorization

After I5A-01:

```text
SemanticFreezeRecord       0
CapabilityDesignRevision   0
CapabilityBindingRevision  0
ExecutionPlanRevision      0
TemporalMappingRevision    0
DeploymentRevision         0
```

## CI

Final image run:

```text
32330617225
```

Results:

```text
architecture guard                PASS
B2 source intake                  PASS — 25/25
B3 canonical/validation           PASS — 27/27
B4 review                         PASS — 13/13
I0 exact image intake             PASS
I1 perception                     PASS
I2 common evidence                PASS
I3 browser review                 PASS
I4 canonical + validation         PASS
I5A-01 claim confirmation         PASS — 5/5
```

Runtime regressions on the same commit:

```text
B7–B9 Temporal runtime/E2E        PASS
B10 restart Node 22.16            PASS
B10 restart Node 24.11            PASS
```

## Verdict

```text
IMAGE → REVIEW WORKSPACE                     PROVEN
IMAGE INFERENCE → EXPLICIT HUMAN CONFIRM     PROVEN
REVIEW CONFIRMATION WITHOUT SOURCE MUTATION  PROVEN
CONFIRMATION → NEW REVISION / ASSESSMENT     PROVEN
IMAGE → FREEZE                               STILL CLOSED
IMAGE → EXECUTION                            STILL CLOSED
IMAGE → TEMPORAL                             STILL CLOSED
```

**I5A-01 is CLOSED.**

Next: I5A-02 semantic correction/addition for the blockers that confirmation cannot resolve: explicit completion, conditional rule semantics, and subprocess boundary meaning.
