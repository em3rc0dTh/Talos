# TALOS — Correction / Confirmation / Freeze Loop Contract v0.1

Status: **DESIGN CANDIDATE / T3-03 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define how explicit reviewer intent becomes immutable TALOS review-authored evidence, how that evidence produces candidate semantic revisions and revalidation, how review baselines advance safely, and how a reviewed semantic baseline is explicitly accepted/frozen for later phases without rewriting source truth or bypassing Semantic Validation.

Inputs:

```text
P2-01B Canvas Review / Projection v0.2
T3-01 Human-Readable Workflow Draft v0.2
T3-02 Visual Review Workspace v0.2
Provenance v0.3
Canonical v0.1
Semantic Validation v0.2
```

BUILD remains closed.

---

# 1. Fundamental invariants

```text
REVIEW AFFORDANCE                     ≠ REVIEW COMMAND
REVIEW COMMAND                        ≠ APPLIED REVIEW ACTION
APPLIED REVIEW ACTION                 ≠ SOURCE REWRITE
CONFIRM PROPERTY                      ≠ CONFIRM WHOLE REVISION
CONFIRMATION                          ≠ SOURCE_TRUTH REWRITE
CORRECTION                            ≠ MUTATION OF OLD CLAIM
REJECTION                             ≠ DELETION OF SOURCE EVIDENCE
MARK UNKNOWN                          ≠ ERASE PRIOR INTERPRETATION
RESOLVE CONFLICT                      ≠ DELETE LOSING CLAIMS
NEW REVIEW EVIDENCE                   → NEW IMMUTABLE HISTORY
SEMANTIC CHANGE                       → NEW ProcessRevision
REVALIDATION                          → NEW ValidationAssessment
BASELINE TRANSITION CANDIDATE         ≠ BASELINE ADOPTION
EXPLICIT REVIEW COMMAND               ≠ AUTOMATIC REBASE IF COLLATERAL CHANGE EXISTS
SEMANTIC FREEZE                       ≠ ProcessRevision MUTATION
SEMANTIC FREEZE                       ≠ SOURCE_TRUTH
SEMANTIC FREEZE                       ≠ AUTOMATION READINESS
READY_FOR_AUTOMATION_DESIGN           remains Semantic Validation authority
STALE BASELINE COMMAND                ≠ SAFE TO APPLY AUTOMATICALLY
DUPLICATE CLIENT REQUEST              ≠ DUPLICATE SEMANTIC HISTORY
```

Primary law:

> Reviewer actions create new authority/evidence history. They never edit imported evidence, old claims, old ProcessRevisions, old findings/questions or old review-workspace revisions in place.

---

# 2. ReviewCommand

A user/system-authority intention to perform one review action is captured before application.

```text
ReviewCommand
- id
- clientRequestKey?
- reviewWorkspaceDefinitionId
- expectedReviewWorkspaceRevisionId
- expectedReviewBaselineBundleId
- semanticScopeRef
- actionKind
- targetSubjectRefs[]
- targetPropertyPath?
- proposedValue?
- selectedClaimRefs[]?
- rejectedClaimRefs[]?
- findingRefs[]?
- questionRefs[]?
- rationale?
- authorityRef?
- requestedBy
- requestedAt
```

`actionKind`:

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
ANSWER_CLARIFICATION
REQUEST_FREEZE
SOURCE_DEFINED
```

A command is immutable once accepted for processing.

---

# 3. Optimistic baseline precondition

Before semantic application, TALOS verifies:

```text
expectedReviewWorkspaceRevisionId
expectedReviewBaselineBundleId
```

against the active selected review context.

Possible result:

```text
MATCH
STALE_BASELINE
INVALID_CONTEXT
```

For `STALE_BASELINE`:

```text
no semantic write occurs automatically
```

The product must reconcile/reissue against a current baseline or explicitly invoke a controlled merge/review path.

---

# 4. ReviewCommandApplication

Application history is explicit:

```text
ReviewCommandApplication
- id
- reviewCommandId
- applicationStatus
- baseReviewWorkspaceRevisionId
- baseProcessRevisionId
- reviewAuthoredSourceRevisionRef?
- emittedReviewActionRefs[]
- emittedClaimRefs[]
- emittedConfirmationRefs[]
- emittedConflictResolutionRefs[]
- candidateProcessRevisionRef?
- candidateValidationAssessmentRefs[]
- baselineTransitionCandidateRef?
- baselineTransitionDecisionRef?
- resultingReviewWorkspaceRevisionRef?
- semanticDiffGuardRef?
- appliedAt?
- failureDiagnosticRefs[]?
```

`applicationStatus`:

```text
APPLIED
REJECTED_STALE
REJECTED_INVALID
NO_SEMANTIC_CHANGE
PARTIAL_REVIEW_REQUIRED
FAILED
SOURCE_DEFINED
```

The application record is immutable.

---

# 5. Idempotency

If `clientRequestKey` is supplied, repeated equivalent submissions within the same command scope must resolve to the same command/application history according to application policy.

At minimum:

```text
same clientRequestKey
+ same reviewer/workspace context
→ no duplicate semantic write
```

A changed command payload under the same key is rejected as an idempotency conflict.

---

# 6. Review-authored source history

Semantic review actions produce/append to:

```text
ReviewAuthoredSourceDefinition
ReviewAuthoredSourceRevision
```

The review-authored source carries TALOS/user authority provenance distinct from imported sources.

Examples:

```text
"actor is Manager" confirmed by reviewer
"NO branch leads to Manual Review" corrected by reviewer
new step added by reviewer
imported inferred interpretation explicitly rejected
```

Imported source history remains untouched.

---

# 7. Action semantics

## CONFIRM

Confirms an existing candidate property/meaning via new `ConfirmationRecord` / claim history.

It does not convert the historical inferred/source claim in place.

## CORRECT_PROPERTY

Creates new review-authored evidence for the corrected property value.

Old value/claim remains traceable.

## REJECT_INTERPRETATION

Records reviewer rejection of an interpretation while retaining source evidence and prior inference.

## MARK_UNKNOWN

Records explicit reviewer authority that accepted meaning remains unresolved at this time.

It does not erase candidate interpretations.

## ADD / RETIRE

Creates new review-authored source occurrences/claims or retirement/rejection semantics. It never fabricates imported origin.

## RESOLVE_CONFLICT

Creates authority-backed resolution history referencing competing claims. Unselected claims remain historical evidence.

## ANSWER_CLARIFICATION

Creates immutable `ClarificationResponse`, review-authored/confirmed claim evidence as appropriate, and later semantic revision/revalidation.

---

# 8. Candidate semantic revision pipeline

For semantic-changing actions:

```text
ReviewCommand
        ↓
ReviewCommandApplication
        ↓
ReviewAuthoredSourceRevision
        ↓
SemanticClaim / Confirmation / resolution records
        ↓
Canonical normalization
        ↓
Candidate ProcessRevision B
        ↓
ValidationAssessment(s) B
        ↓
BaselineTransitionCandidate
        ↓
BaselineReconciliationAnalysis
```

No old `ProcessRevision` or assessment mutates.

---

# 9. SemanticDiffGuard

The explicit reviewer command may intend a narrow change, but normalization/reconciliation can reveal wider differences.

```text
SemanticDiffGuard
- id
- reviewCommandApplicationId
- intendedTargetRefs[]
- intendedPropertyPaths[]
- expectedChangeKinds[]
- actualSemanticDifferenceRefs[]
- collateralChangeRefs[]
- guardResult
- analysisVersion
- createdAt
```

`guardResult`:

```text
WITHIN_INTENT
COLLATERAL_CHANGES
NO_SEMANTIC_CHANGE
UNSAFE_TO_AUTO_ACCEPT
SOURCE_DEFINED
```

Rule:

```text
explicit command authority
        does not automatically authorize unexpected collateral semantic changes
```

---

# 10. Baseline transition policy

If:

```text
SemanticDiffGuard = WITHIN_INTENT
```

and authority/product policy permits the user's explicit action to authorize the resulting exact change, TALOS may create, in one application transaction:

```text
BaselineTransitionCandidate
+ BaselineTransitionDecision(ACCEPT)
+ new ReviewWorkspaceRevision
```

All remain distinct immutable records.

If:

```text
COLLATERAL_CHANGES
UNSAFE_TO_AUTO_ACCEPT
```

then:

```text
BaselineTransitionCandidate exists
ReviewWorkspaceRevision remains on old baseline
explicit comparison/decision required
```

No silent adoption.

---

# 11. No-semantic-change actions

Some commands may produce review/audit evidence without changing canonical semantics.

Examples may include a confirmation already represented by an equivalent accepted semantic value, depending on truth-state policy.

Possible result:

```text
applicationStatus = NO_SEMANTIC_CHANGE
```

The authority/evidence record may still exist if semantically meaningful, but no fake `ProcessRevision` is created solely to satisfy UI expectations.

---

# 12. Revalidation

Every new ProcessRevision produced by review must receive new applicable `ValidationAssessment` records.

The review application cannot reuse an old assessment as if it applied to the new revision.

Questions/findings on the old assessment remain historically true.

New assessments may:

```text
remove a blocker
introduce a blocker
change readiness
retain unresolved findings
```

---

# 13. Finding/question historical disposition

When a later revision addresses an old finding/question:

```text
old Finding / Question remains immutable
        ↓
FindingDisposition / ClarificationResponse / new claims
        ↓
new ProcessRevision / Assessment
```

T3-03 never changes old finding/question status in place.

---

# 14. Semantic acceptance vs semantic freeze

Introduce immutable:

```text
SemanticFreezeRecord
```

It records authority acceptance of an exact reviewed semantic baseline/scope set for a declared use.

It does not mutate `ProcessRevision`.

---

# 15. SemanticFreezeRecord

```text
SemanticFreezeRecord
- id
- reviewWorkspaceDefinitionId
- reviewWorkspaceRevisionId
- reviewBaselineBundleId
- processRevisionId
- freezeKind
- scopeFreezeRefs[]
- acceptedBy
- authorityRef?
- rationale?
- frozenAt
- canonicalModelVersion
- provenanceContractVersion
- validationContractVersion
- reviewContractVersion
- freezeDigest
- supersedesFreezeRef?
```

`freezeKind`:

```text
BUSINESS_SEMANTIC_BASELINE
AUTOMATION_DESIGN_HANDOFF
REVIEW_CHECKPOINT
SOURCE_DEFINED
```

A later freeze creates a new record. Old freeze history remains.

---

# 16. ScopeFreezeRecord

Multi-scope acceptance is explicit:

```text
ScopeFreezeRecord
- id
- semanticFreezeRecordId
- semanticScopeRef
- disposition
- validationAssessmentRefs[]
- explanationDraftSnapshotRef?
- visualScopeBindingRef?
- unresolvedAcceptedFindingRefs[]?
- notes?
```

`disposition`:

```text
ACCEPTED
EXCLUDED
DEFERRED
SOURCE_DEFINED
```

No scope is implicitly accepted merely because another scope in the same workspace is frozen.

---

# 17. Freeze eligibility — BUSINESS_SEMANTIC_BASELINE

A business semantic baseline may be frozen when explicit authority accepts the reviewed scope for the declared business-understanding purpose.

It may still contain documented non-material/deferred findings when policy allows.

The freeze must pin the exact relevant ValidationAssessment(s) and unresolved accepted findings.

Freeze is not a statement of execution readiness.

---

# 18. Freeze eligibility — AUTOMATION_DESIGN_HANDOFF

For a scope to be accepted under:

```text
freezeKind = AUTOMATION_DESIGN_HANDOFF
```

required:

```text
compatible ValidationAssessment
assessmentIntent = AUTOMATION_DESIGN_READINESS
executionReadiness = READY_FOR_AUTOMATION_DESIGN
```

plus explicit reviewer/authority acceptance.

T3-03 cannot manufacture readiness.

If readiness is:

```text
NEEDS_CONFIRMATION
INSUFFICIENT_DETAIL
BLOCKED_BY_CONFLICT
NOT_ASSESSED
```

that scope cannot receive `AUTOMATION_DESIGN_HANDOFF` disposition `ACCEPTED`.

---

# 19. Freeze request

`REQUEST_FREEZE` is itself a command/intention.

Freeze evaluation must re-resolve the exact pinned review baseline and assessments. It must not freeze an independently fetched newer revision.

Possible result:

```text
FROZEN
REJECTED_STALE
REJECTED_VALIDATION_GATE
REJECTED_AUTHORITY
PARTIAL_SCOPE_FREEZE
SOURCE_DEFINED
```

---

# 20. Freeze does not erase unresolved truth

For `BUSINESS_SEMANTIC_BASELINE`, explicit accepted unknowns/non-material findings may remain referenced.

For `AUTOMATION_DESIGN_HANDOFF`, frozen Semantic Validation rules determine whether unresolved meaning blocks handoff.

```text
FREEZE
        ≠
pretend every property is known
```

---

# 21. Freeze and later change

After a freeze:

```text
new source arrives
reviewer edits meaning
adapter reinterpretation occurs
```

no frozen record mutates.

Instead:

```text
new ProcessRevision / workspace revision
new review cycle
new SemanticFreezeRecord if later accepted
```

Old freeze remains historical evidence of what was accepted at that time.

---

# 22. Multi-source conflict resolution

Conflict resolution command must identify:

```text
conflictRef
selected/accepted claim/value or new resolved value
resolution authority
rationale
```

Resolution produces new history and, where meaning changes, a new ProcessRevision/reassessment.

Executable/current source does not win automatically.

---

# 23. Source-only review actions

A reviewer may confirm/reject/correct a source-only candidate without first forcing it into canonical form.

Accepted meaning may later normalize into canonical semantics if the frozen model supports it.

A source-only relation with unresolved endpoint may remain unresolved and receive a clarification response without a fake edge.

---

# 24. Presentation edits

Canvas layout, zoom, lens selection, panel state and other presentation-only changes do not enter the semantic correction pipeline.

A semantic drag/drop operation must be represented as an explicit semantic `ReviewCommand`, not inferred from pixel movement alone.

---

# 25. Concurrency / stale reviewer actions

Two reviewers may act from the same baseline.

Example:

```text
Reviewer A confirms actor = Manager
→ baseline B

Reviewer B, still on baseline A, corrects actor = Supervisor
```

Reviewer B's stale command cannot silently overwrite B.

It becomes:

```text
REJECTED_STALE
```

or enters an explicit conflict/reconciliation workflow.

---

# 26. Authority boundaries

A command may require authority appropriate to its effect.

Examples:

```text
confirm source interpretation
resolve material business conflict
accept business semantic baseline
accept automation-design handoff
```

T3-03 records authority references but does not define organization-specific IAM implementation.

---

# 27. Security / evidence boundaries

Reviewer corrections/confirmations may reference restricted evidence without copying hidden values into review-authored claims.

No sensitive provider value becomes canonical/review truth merely because a reviewer had access to the source system.

---

# 28. Audit chain

For a frozen semantic scope TALOS can answer:

```text
Which source evidence existed?
What did TALOS initially interpret?
Which questions/findings applied?
Which reviewer commands/actions occurred?
Which claims were confirmed/corrected/rejected?
Which ProcessRevision resulted?
Which validation assessment applied?
How was the review baseline transitioned?
Who accepted/froze the scope and for what purpose?
Was it only business-semantic accepted or ready for automation design?
```

---

# 29. Phase-3 gate target

T3-03 must prove:

```text
explicit review actions are immutable/history-safe
stale commands do not overwrite newer meaning
review corrections create new ProcessRevision/revalidation
unexpected collateral changes do not auto-accept
multi-scope freeze is explicit
business semantic freeze ≠ automation handoff
AUTOMATION_DESIGN_HANDOFF requires READY_FOR_AUTOMATION_DESIGN
freeze never rewrites source/provenance/old revisions
```

BUILD remains closed.
