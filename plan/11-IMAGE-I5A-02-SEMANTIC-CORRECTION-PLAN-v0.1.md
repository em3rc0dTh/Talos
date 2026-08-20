# Talos — I5A-02 Semantic Correction / Addition Plan v0.1

Status: **AUTHORIZED BOUNDED BUILD**  
Date: **2026-08-19**

## Purpose

I5A-01 proved that image-derived `INFERRED` semantic claims can be explicitly confirmed without mutating the image, perception history, or fabricating Canvas source history.

I5A-02 addresses a different problem: **missing or incorrect business meaning cannot be solved by confirmation alone**.

The current Quarry-02 reviewer baseline still contains material automation-design blockers:

```text
SV-CMP-001   explicit process completion/end unproven
SV-CFL-001   two conditional branches lack structured BusinessRule references
SV-SUB-002   subprocess boundary meaning unresolved
```

I5A-02 MUST NOT auto-repair those findings by code. The validator remains the judge. Review commands author semantic changes; re-validation determines whether the blockers remain.

## Governing separation

```text
ValidationFinding
      !=
repair instruction
      !=
review command
      !=
reviewer authority
```

Therefore I5A-02 implements semantic operations from the frozen Phase-3 command vocabulary rather than branching on validator codes.

## Authorized action primitives

Initial bounded implementation:

```text
CORRECT_PROPERTY
ADD_PROCESS_ELEMENT
ADD_RELATIONSHIP
```

`RESOLVE_CONFLICT` remains part of the frozen review vocabulary but is not required for Quarry-02 because the current image-derived revision has no unresolved `ConflictRecord`.

## Source-agnostic review law

For image review:

```text
ORIGINAL IMAGE BYTES             immutable
PERCEPTION ATTEMPT               immutable
PERCEPTION OBSERVATIONS          immutable
COMMON EVIDENCE                  immutable
I4 / I5A-01 ProcessRevision      immutable history
REVIEW COMMAND                   new authority event
REVIEW-AUTHORED REVISION         new evidence
SEMANTIC CHANGE                  new ProcessRevision
REVALIDATION                     new ValidationAssessment
```

No I5A-02 operation may create a `CanvasRevision`.

## Reviewer-authored provenance

Each accepted correction/addition must preserve:

```text
ReviewCommand
  → authorityRef
  → requestedBy / requestedAt
  → ReviewAuthoredSourceRevision
  → ReviewConfirmationRecord(s)
  → SemanticClaim(s) truthClass = CONFIRMED
  → candidate ProcessRevision
  → superseding ValidationAssessment
```

The reviewer is the authority for the new meaning. The image/perception evidence remains historical context; it is not rewritten to appear to have stated the correction.

## Quarry-02 bounded correction scenario

The fixture will simulate explicit reviewer decisions. These values are **review inputs**, not facts silently copied from the image adapter.

### 1. Conditional branch business rules

For the decision `Customer Exist?`, the reviewer supplies structured branch meaning:

```text
NO branch:
  naturalLanguage = "Customer does not exist"
  expression      = { fact: "customerExists", operator: "EQUALS", value: false }

YES branch:
  naturalLanguage = "Customer exists"
  expression      = { fact: "customerExists", operator: "EQUALS", value: true }
```

`CORRECT_PROPERTY` targets each conditional `ProcessEdge.conditionRuleRef`. A supporting `BusinessRule` is created as review-authored semantic meaning and linked to the edge.

### 2. Subprocess boundary meaning

The reviewer explicitly confirms the perceived `Arrange Delivery` activity as:

```text
subprocessMode = "COLLAPSED_SUBPROCESS"
```

This is business/process boundary meaning only. It MUST NOT imply Temporal `CHILD_WORKFLOW`, Nexus, Activity, or any runtime primitive.

### 3. Explicit completion

The reviewer adds an explicit process outcome:

```text
END node: "Order fulfilled"
```

The `ADD_PROCESS_ELEMENT` payload must support an atomic placement/attachment contract so the new END is not introduced as disconnected semantic meaning:

```text
afterSubjectRef = Deliver Water
relationshipKind = SEQUENCE
```

This action may create the supporting relationship as part of the same reviewer intent. A separate generic `ADD_RELATIONSHIP` primitive is still implemented and pressure-tested independently.

## Mandatory preflight correction

I5A-01 currently emits `ProcessRevision.derivationKind = REINTERPRETATION`, but the frozen Canonical reference type does not contain that enum member.

That is an implementation-contract mismatch exposed during I5A-02 review.

I5A-02 MUST first align I5A-01 to an existing lawful derivation kind:

```text
HUMAN_CONFIRMATION
```

No frozen Canonical contract is changed for this fix.

## Acceptance gate

I5A-02 passes only if all of the following hold:

1. frozen B2/B3/B4 regressions remain green;
2. I0–I5A-01 regressions remain green;
3. correction commands reject stale baselines;
4. correction commands require explicit `authorityRef`;
5. unsupported target/property/action shapes are rejected rather than guessed;
6. no image/perception/source artifact history is mutated;
7. no `CanvasRevision` is created;
8. each semantic change creates a new `ProcessRevision` and new `ValidationAssessment`;
9. branch rules become first-class `BusinessRule` objects referenced by `ProcessEdge.conditionRuleRef`;
10. subprocess meaning becomes explicit without Temporal mapping;
11. explicit END is added with an attached business sequence from `Deliver Water`;
12. a generic `ADD_RELATIONSHIP` action is independently demonstrated;
13. after the full reviewer-authored correction sequence, the frozen validator returns `READY_FOR_AUTOMATION_DESIGN`;
14. I5A-02 itself creates **no** `SemanticFreezeRecord`, capability artifacts, `ExecutionPlanRevision`, `TemporalMappingRevision`, runtime policy, deployment, or Workflow execution.

## Stop condition

If the full corrected graph satisfies the current validator while still containing a structurally unsafe condition that the validator cannot detect, do **not** open I5B. Record the defect and version the affected semantic-validation implementation/contract before freeze authorization.

## Not authorized

```text
semantic freeze                    CLOSED
capability design/binding           CLOSED
ExecutionPlan                       CLOSED
Temporal mapping                    CLOSED
Temporal execution                  CLOSED
production image perception         CLOSED
arbitrary-image support             CLOSED
```

## Exit

I5A-02 may close with:

```text
IMAGE
→ INFERRED semantics
→ HUMAN CONFIRMATION
→ HUMAN SEMANTIC CORRECTIONS/ADDITIONS
→ new ProcessRevision
→ new ValidationAssessment
→ READY_FOR_AUTOMATION_DESIGN
```

Only after that result is pressure-tested may **I5B — semantic freeze + execution handoff opening review** begin.