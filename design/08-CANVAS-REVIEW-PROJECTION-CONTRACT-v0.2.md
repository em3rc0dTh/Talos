# TALOS — Canvas Review / Projection Contract v0.2

Status: **DESIGN CANDIDATE / P2-01B REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active P2-01B design: `08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

The first P2-01B pressure test produced:

```text
R01–R14
12 PASS
 2 FAIL
```

Failures:

```text
R12 — adapter reinterpretation / baseline stability
R14 — correction → new revision → reassessment → new projection
```

v0.1 preserved imported source and review-authored evidence correctly, but stored the semantic baseline directly on `ReviewWorkspace`.

That left no immutable, deterministic history for advancing or reconciling the active review baseline.

v0.2 therefore introduces:

```text
ReviewWorkspaceDefinition
ReviewWorkspaceRevision
BaselineTransitionCandidate
BaselineReconciliationAnalysis
BaselineTransitionDecision
```

The review context now follows the same historical discipline as `ProcessRevision`, provenance and semantic validation.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
REVIEW WORKSPACE IDENTITY          ≠ REVIEW WORKSPACE STATE
REVIEW WORKSPACE REVISION          = IMMUTABLE REVIEW CONTEXT
BASELINE ADVANCE                   ≠ MUTATION
ADAPTER REINTERPRETATION           ≠ AUTOMATIC REBASE
USER CORRECTION                    ≠ AUTOMATIC SOURCE REWRITE
NEW PROCESS REVISION               ≠ ACTIVE REVIEW BASELINE UNTIL TRANSITION RECORDED
BASELINE TRANSITION CANDIDATE      ≠ ACCEPTED TRANSITION
BASELINE TRANSITION DECISION       = IMMUTABLE HISTORICAL RECORD
REBASE / RECONCILIATION            ≠ LOSS OF REVIEW-AUTHORED EVIDENCE
```

Core rule:

> A review workspace has a stable identity, but every meaningful change to the semantic baseline creates a new immutable review-workspace revision.

---

# 2. End-to-end review lineage

```text
EXTERNAL SOURCE
      ↓
Adapter / Claims / Provenance
      ↓
ProcessRevision A
ValidationAssessment A
      ↓
ReviewWorkspaceDefinition W
      ↓
ReviewWorkspaceRevision W1
baseline = ProcessRevision A
      ↓
ReviewProjectionRevision P1
      ↓
REVIEW ACTIONS
      ↓
ReviewAuthoredSourceRevision H1
      ↓
ProcessRevision B
ValidationAssessment B
      ↓
BaselineTransitionCandidate T1
      ↓
BaselineTransitionDecision ACCEPT
      ↓
ReviewWorkspaceRevision W2
baseline = ProcessRevision B
parent = W1
      ↓
ReviewProjectionRevision P2
```

Historical A/W1/P1/H1 remain explainable.

---

# 3. ReviewWorkspaceDefinition

Stable identity only.

```text
ReviewWorkspaceDefinition
- id
- projectRef?
- createdAt
- createdBy?
- sourceArtifactIds[]
- sourceRepresentationIds[]
- reviewAuthoredSourceDefinitionId
- initialWorkspaceRevisionId
- latestWorkspaceRevisionId?
- lifecycleStatus?
```

`latestWorkspaceRevisionId` is a convenience/index pointer, not historical semantic truth. Historical meaning always resolves through immutable `ReviewWorkspaceRevision` records.

---

# 4. ReviewWorkspaceRevision — new in v0.2

```text
ReviewWorkspaceRevision
- id
- reviewWorkspaceDefinitionId
- revisionNumber
- parentWorkspaceRevisionId?
- createdAt
- createdBy?
- baselineProcessRevisionId
- baselineValidationAssessmentId?
- activeReviewAuthoredSourceRevisionId?
- projectionRevisionId?
- transitionDecisionId?
- sourceContextRefs[]
- adapterResultContextRefs[]
- semanticContextDigest
- notes?
```

A workspace revision answers:

```text
What semantic revision was being reviewed?
Which assessment applied?
Which reviewer-authored evidence existed?
Which imported evidence/results were in context?
Why did this review context supersede the prior one?
```

No field on a historical workspace revision is rewritten after acceptance.

---

# 5. ReviewProjectionRevision

Retained from v0.1, now pinned to a workspace revision.

```text
ReviewProjectionRevision
- id
- reviewWorkspaceDefinitionId
- reviewWorkspaceRevisionId
- revisionNumber
- parentProjectionRevisionId?
- baselineProcessRevisionId
- baselineValidationAssessmentId?
- createdAt
- projectionItemSnapshots[]
- projectionBindingSnapshots[]
- presentationSnapshot?
- projectionDigest
- semanticBaselineDigest?
```

A presentation-only projection revision may remain under the same `ReviewWorkspaceRevision`.

A semantic baseline change requires a new `ReviewWorkspaceRevision`.

---

# 6. Projection identities, subjects and bindings

v0.1 structures remain:

```text
ProjectionIdentity
ProjectionItemSnapshot
ProjectionSubjectRef
ProjectionBinding
```

Projection subjects may reference:

```text
CANONICAL_ELEMENT
SOURCE_OCCURRENCE
SOURCE_RELATIONSHIP_OCCURRENCE
SEMANTIC_CLAIM
CONFLICT_RECORD
VALIDATION_FINDING
CANDIDATE_SEMANTIC_SCOPE
SOURCE_ARTIFACT
SOURCE_DEFINED
```

Many-to-many provenance remains mandatory.

Rendering never creates new source truth by itself.

---

# 7. Source-only / unresolved evidence

Retained from v0.1.

Source evidence that cannot safely become a canonical element may still appear in review:

```text
source occurrence / relationship
+ claim / confidence
+ validation finding
→ review projection item
```

No fake canonical materialization is required.

---

# 8. Review-authored evidence

Retained from v0.1:

```text
ReviewAuthoredSourceDefinition
ReviewAuthoredSourceRevision
ReviewAction
```

Semantic review actions are new evidence/authority input, never edits to imported source evidence.

Recommended review actions:

```text
CONFIRM
REJECT_INTERPRETATION
CORRECT_PROPERTY
ADD_PROCESS_ELEMENT
ADD_RELATIONSHIP
RETIRE_PROCESS_MEANING
MARK_UNKNOWN
RESOLVE_CONFLICT
APPLY_SUGGESTION
SOURCE_DEFINED
```

Review-authored claims/confirmations retain their own origin/authority and do not inherit imported source origin.

---

# 9. BaselineTransitionCandidate — new in v0.2

Any candidate semantic baseline change is represented before adoption.

```text
BaselineTransitionCandidate
- id
- reviewWorkspaceDefinitionId
- fromWorkspaceRevisionId
- fromProcessRevisionId
- candidateProcessRevisionId
- candidateValidationAssessmentId?
- causeKind
- causeRefs[]
- candidateReviewAuthoredSourceRevisionId?
- detectedAt
- reconciliationAnalysisId?
```

`causeKind`:

```text
USER_CORRECTION
USER_CONFIRMATION
CONFLICT_RESOLUTION
SOURCE_MERGE
ADAPTER_REINTERPRETATION
ADDITIONAL_SOURCE
CANONICAL_CORRECTION
SOURCE_DEFINED
```

A candidate is immutable and does not mean the workspace has moved.

---

# 10. BaselineReconciliationAnalysis — new in v0.2

Before adopting a different semantic baseline, TALOS must be able to explain its relationship to the current review state.

```text
BaselineReconciliationAnalysis
- id
- transitionCandidateId
- fromProcessRevisionId
- candidateProcessRevisionId
- reviewAuthoredSourceRevisionId?
- semanticDifferenceRefs[]
- preservedMeaningRefs[]
- changedMeaningRefs[]
- addedMeaningRefs[]
- removedMeaningRefs[]
- impactedReviewActionRefs[]
- conflictRefs[]
- unresolvedCompatibilityRefs[]
- analysisVersion
- createdAt
```

This is especially important for adapter re-interpretation.

Example:

```text
Adapter v1 baseline A
reviewer corrected actor to Manager

Adapter v2 candidate C
actor interpreted as Supervisor
```

TALOS must not silently apply C and lose the review correction.

Reconciliation exposes the conflict/difference for explicit decision.

---

# 11. BaselineTransitionDecision — new in v0.2

```text
BaselineTransitionDecision
- id
- transitionCandidateId
- decision
- rationale?
- authorityRef?
- decidedBy?
- decidedAt
- resultingWorkspaceRevisionId?
```

`decision`:

```text
ACCEPT
REJECT
DEFER
```

The decision is immutable.

No `status` field on the candidate is rewritten.

A later decision/candidate history is represented with new records.

---

# 12. Accepted baseline transition

When accepted:

```text
WorkspaceRevision W1
baseline = ProcessRevision A
        ↓
TransitionCandidate T1
candidate = ProcessRevision B
        ↓
TransitionDecision D1 = ACCEPT
        ↓
WorkspaceRevision W2
parent = W1
baseline = ProcessRevision B
transitionDecisionId = D1
        ↓
Projection P2
```

The old baseline A remains the baseline of W1 forever.

---

# 13. Rejected/deferred transition

Adapter v2 may produce a candidate the reviewer does not want to adopt.

```text
TransitionDecision = REJECT
```

or:

```text
DEFER
```

leaves the active/latest accepted workspace revision unchanged.

The candidate interpretation and decision history remain preserved.

---

# 14. User correction lifecycle

A semantic correction is not a direct workspace mutation.

```text
WorkspaceRevision W1 / Projection P1
      ↓
ReviewAction CORRECT_PROPERTY
      ↓
ReviewAuthoredSourceRevision H1
      ↓
new claims / normalization
      ↓
ProcessRevision B
      ↓
ValidationAssessment B
      ↓
BaselineTransitionCandidate T1
causeKind = USER_CORRECTION
      ↓
BaselineTransitionDecision ACCEPT
      ↓
WorkspaceRevision W2
baseline = B
      ↓
Projection P2
```

If product policy treats the explicit user apply/correction command as sufficient transition authority, the decision may be created as part of the same application transaction—but it remains a distinct historical record.

---

# 15. User confirmation lifecycle

```text
inferred claim
      ↓
CONFIRM review action
      ↓
ConfirmationRecord / review-authored evidence
      ↓
ProcessRevision B
      ↓
TransitionCandidate(USER_CONFIRMATION)
      ↓
TransitionDecision
      ↓
WorkspaceRevision W2 if accepted
```

Prior inference is preserved.

---

# 16. Reviewer rejection/removal

Retained from v0.1.

Deleting a projected imported meaning creates review-authored rejection/retirement semantics; it does not delete source evidence.

If accepted into a later ProcessRevision, the baseline transition is recorded through the same candidate/decision/workspace-revision mechanism.

---

# 17. Net-new user meaning

Retained from v0.1.

New user-authored elements/relationships carry review-authored/TALOS-native provenance and may coexist with imported source provenance in a later ProcessRevision.

They never inherit imported origin merely because they appear on the same Canvas.

---

# 18. Multi-source and conflict projection

Retained from v0.1.

Projection may bind one visible semantic element to several source origins/claims/perspectives.

Material conflicts remain visible until authority-backed resolution creates new lineage.

---

# 19. Validation projection

Retained from v0.1.

Findings/questions are overlays, not process nodes.

Resolution creates review evidence, a new ProcessRevision/Assessment where semantic meaning changes, and then an explicit baseline transition.

---

# 20. Presentation-only review revisions

Presentation-only changes may create:

```text
new ReviewProjectionRevision
```

while remaining under the same:

```text
ReviewWorkspaceRevision
ProcessRevision
ValidationAssessment
```

No semantic transition candidate is created.

---

# 21. Adapter reinterpretation / explicit rebase

Example:

```text
WorkspaceRevision W3
baseline = ProcessRevision A
review-authored overlay = H2

same source
Adapter v2
→ ProcessRevision candidate C
```

Required behavior:

```text
C does not replace A
```

Instead:

```text
BaselineTransitionCandidate
causeKind = ADAPTER_REINTERPRETATION
from = A
candidate = C
review overlay = H2
        ↓
BaselineReconciliationAnalysis
        ↓
TransitionDecision
```

If accepted, a **new** workspace revision is created.

If C conflicts with H2, TALOS exposes the conflict and does not silently discard the review-authored evidence.

---

# 22. Additional-source / merge transition

The same mechanism applies if a new SOP/BPMN/image/runtime source is added to an existing review workspace.

```text
additional source
→ new independent source claims
→ source merge/candidate ProcessRevision
→ BaselineTransitionCandidate(ADDITIONAL_SOURCE or SOURCE_MERGE)
→ reconciliation
→ decision
→ new workspace revision if accepted
```

This prepares the review model for later cross-adapter use.

---

# 23. Projection generation

Conceptual service:

```text
projectForReview(reviewWorkspaceRevisionId, projectionPolicyVersion)
```

The workspace revision resolves the exact:

```text
ProcessRevision
ValidationAssessment
review-authored source revision
source/adapter context
```

that the projection is allowed to display.

The projection engine cannot choose a newer semantic baseline by itself.

---

# 24. Historical explainability

For any projected item in any projection revision TALOS must be able to answer:

```text
Which review-workspace revision was active?
Which ProcessRevision was its semantic baseline?
Which imported source evidence supported it?
Which claims were inferred/confirmed/conflicted?
Which review-authored actions existed?
Which baseline transition introduced this version?
Which validation assessment/findings applied?
```

---

# 25. Review UX provenance requirements

Retained from v0.1:

```text
current interpreted meaning
truth class
confidence
source origin(s)
evidence fragments
interpretation/adapter version
conflicts
validation findings
review corrections/confirmations
```

Additionally v0.2 must surface, when relevant:

```text
new interpretation available
baseline comparison/reconciliation
review corrections impacted by proposed rebase
```

---

# 26. Anti-goals

All v0.1 anti-goals remain, plus:

- do not store active semantic baseline as mutable workspace truth;
- do not auto-rebase a review workspace to a new adapter result;
- do not discard review-authored evidence during rebase;
- do not mutate transition candidates after a decision;
- do not treat adapter-version freshness as authority over user-confirmed business meaning;
- do not regenerate a projection from a different ProcessRevision without a corresponding workspace revision/transition history.

---

# 27. P2-01B regression target

v0.2 must pass the full R01–R14 suite.

The failure regressions are:

```text
R12 — adapter reinterpretation / baseline stability
R14 — correction → new baseline review revision
```

Full regression is required; no earlier pass may be assumed.

BUILD remains closed.
