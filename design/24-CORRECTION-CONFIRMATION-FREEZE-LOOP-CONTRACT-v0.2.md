# TALOS — Correction / Confirmation / Freeze Loop Contract v0.2

Status: **DESIGN CANDIDATE / T3-03 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T3-03 design: `24-CORRECTION-CONFIRMATION-FREEZE-LOOP-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial T3-03 pressure test:

```text
H01–H36
35 PASS
 1 FAIL
```

Failure:

```text
H34 — one freeze request can intentionally target multiple semantic scopes
```

v0.1 correctly modeled a multi-scope `SemanticFreezeRecord`, but its initiating `ReviewCommand` carried one singular `semanticScopeRef`.

v0.2 makes command scope cardinality explicit and adds a dedicated multi-scope freeze-request payload.

No Phase-1, Phase-2, T3-01 or T3-02 contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
COMMAND SCOPE SET                    must preserve REVIEWER INTENT
MULTI-SCOPE FREEZE                   ≠ several unrelated freeze commands
FREEZE SCOPE DISPOSITION             must be explicit per requested scope
ORDINARY PROPERTY CORRECTION         defaults to one semantic scope
SCOPE TARGET CARDINALITY             is action-kind constrained
REQUEST_FREEZE TARGET SET            may contain 1..N semantic scopes
COMMAND TARGET SET                   ≠ automatic acceptance set
```

---

# 2. ReviewCommand — revised in v0.2

```text
ReviewCommand
- id
- clientRequestKey?
- reviewWorkspaceDefinitionId
- expectedReviewWorkspaceRevisionId
- expectedReviewBaselineBundleId
- primarySemanticScopeRef?
- targetSemanticScopeRefs[]
- actionKind
- targetSubjectRefs[]
- targetPropertyPath?
- proposedValue?
- actionPayloadRef?
- selectedClaimRefs[]?
- rejectedClaimRefs[]?
- findingRefs[]?
- questionRefs[]?
- rationale?
- authorityRef?
- requestedBy
- requestedAt
```

Removed:

```text
semanticScopeRef
```

The command preserves exact requested scope cardinality.

---

# 3. Action-specific scope cardinality

Default rules:

```text
CONFIRM
REJECT_INTERPRETATION
CORRECT_PROPERTY
ADD_PROCESS_ELEMENT
ADD_RELATIONSHIP
RETIRE_PROCESS_MEANING
MARK_UNKNOWN
APPLY_SUGGESTION
ANSWER_CLARIFICATION
→ normally exactly one targetSemanticScopeRef
```

`RESOLVE_CONFLICT` may reference one or more scopes only when the conflict itself is explicitly cross-scope.

```text
REQUEST_FREEZE
→ 1..N targetSemanticScopeRefs
```

`SOURCE_DEFINED` actions must declare their scope-cardinality policy.

A command failing cardinality rules is `REJECTED_INVALID` before semantic writes.

---

# 4. FreezeRequestPayload — new in v0.2

For:

```text
actionKind = REQUEST_FREEZE
```

`actionPayloadRef` points to:

```text
FreezeRequestPayload
- id
- reviewCommandId
- freezeKind
- scopeRequestRefs[]
- requestedAt
```

`freezeKind`:

```text
BUSINESS_SEMANTIC_BASELINE
AUTOMATION_DESIGN_HANDOFF
REVIEW_CHECKPOINT
SOURCE_DEFINED
```

The payload is immutable.

---

# 5. ScopeFreezeRequest — new in v0.2

```text
ScopeFreezeRequest
- id
- freezeRequestPayloadId
- semanticScopeRef
- requestedDisposition
- rationale?
- referencedValidationAssessmentRefs[]?
```

`requestedDisposition`:

```text
ACCEPTED
EXCLUDED
DEFERRED
SOURCE_DEFINED
```

Rules:

```text
set(scopeRequest.semanticScopeRef)
        =
set(ReviewCommand.targetSemanticScopeRefs)
```

for ordinary complete freeze requests.

No scope disposition is inferred from sibling scopes.

---

# 6. H34 canonical example

Workspace contains:

```text
S1 PROCESS_FLOW
S2 POLICY_PROCEDURE
S3 ARCHITECTURE_SCOPE
```

One command:

```text
ReviewCommand C
  actionKind = REQUEST_FREEZE
  primarySemanticScopeRef = S1
  targetSemanticScopeRefs = [S1, S2, S3]
  actionPayloadRef = FR1
```

with:

```text
FreezeRequestPayload FR1
  freezeKind = BUSINESS_SEMANTIC_BASELINE

ScopeFreezeRequest R1
  scope = S1
  disposition = ACCEPTED

ScopeFreezeRequest R2
  scope = S2
  disposition = ACCEPTED

ScopeFreezeRequest R3
  scope = S3
  disposition = DEFERRED
```

One later `SemanticFreezeRecord` can preserve this one governance intent faithfully.

---

# 7. ReviewCommandApplication

Retain v0.1 fields and semantics.

Application additionally records scope/payload validation diagnostics when command cardinality or freeze-request scope sets are invalid.

No semantic write occurs before scope/payload validation passes.

---

# 8. Idempotency

Retain v0.1.

The idempotency fingerprint includes:

```text
scope target set
action kind
action payload
subject/property targets
proposed/selected/rejected values
```

Reordering a set-valued scope list does not create a semantically different command when canonical request serialization defines order-insensitive set fields.

---

# 9. Review-authored evidence and action semantics

All v0.1 rules remain for:

```text
CONFIRM
CORRECT_PROPERTY
REJECT_INTERPRETATION
MARK_UNKNOWN
ADD / RETIRE
RESOLVE_CONFLICT
ANSWER_CLARIFICATION
```

Every semantic change creates new review-authored evidence and, where applicable, a new ProcessRevision/reassessment.

---

# 10. Candidate semantic revision / diff guard

Retain:

```text
ReviewCommand
→ ReviewCommandApplication
→ ReviewAuthoredSourceRevision
→ claims / confirmations / resolution
→ Candidate ProcessRevision
→ ValidationAssessment(s)
→ SemanticDiffGuard
→ BaselineTransitionCandidate
```

Unexpected collateral semantic changes never piggyback on explicit reviewer authority.

---

# 11. Baseline transition policy

Retain v0.1.

A same-transaction ACCEPT is allowed only when:

```text
SemanticDiffGuard = WITHIN_INTENT
+ authority/product policy permits
```

All candidate/decision/workspace records remain distinct immutable history.

---

# 12. Stale baseline / concurrency

Retain v0.1.

All commands—including freeze requests—are evaluated against exact:

```text
expectedReviewWorkspaceRevisionId
expectedReviewBaselineBundleId
```

A stale freeze request cannot freeze a newer baseline silently.

---

# 13. SemanticFreezeRecord

Retain v0.1:

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

A successful freeze created from `REQUEST_FREEZE` must trace back to the originating `ReviewCommand` / `FreezeRequestPayload` through application history.

---

# 14. ScopeFreezeRecord

Retain:

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

The resulting disposition must be compatible with the requested disposition and freeze eligibility outcome.

A rejected eligibility check may prevent an `ACCEPTED` request from becoming an accepted `ScopeFreezeRecord`; the mismatch is recorded in the freeze application result rather than silently changing request intent.

---

# 15. BUSINESS_SEMANTIC_BASELINE eligibility

Retain v0.1.

Explicit authority can accept reviewed business meaning while pinning documented non-material/deferred findings.

This does not create automation readiness.

---

# 16. AUTOMATION_DESIGN_HANDOFF eligibility

Retain mandatory requirement per accepted scope:

```text
assessmentIntent = AUTOMATION_DESIGN_READINESS
executionReadiness = READY_FOR_AUTOMATION_DESIGN
```

T3-03 cannot override readiness.

If one requested scope fails eligibility while others pass, the application may produce a partial-scope freeze outcome only if product/governance policy permits and every final scope disposition is explicit.

---

# 17. Freeze application result

Introduce/clarify:

```text
SemanticFreezeApplication
- id
- reviewCommandApplicationId
- freezeRequestPayloadId
- result
- resultingSemanticFreezeRecordRef?
- scopeOutcomeRefs[]
- evaluatedAt
```

`result`:

```text
FROZEN
PARTIAL_SCOPE_FREEZE
REJECTED_STALE
REJECTED_VALIDATION_GATE
REJECTED_AUTHORITY
REJECTED_INVALID_SCOPE_SET
FAILED
SOURCE_DEFINED
```

`ScopeFreezeOutcome`:

```text
- semanticScopeRef
- requestedDisposition
- resultingDisposition?
- eligibilityResult
- validationAssessmentRefs[]
- diagnosticRefs[]?
```

This preserves requested intent separately from resulting governance outcome.

---

# 18. Freeze/history supersession

Retain v0.1.

A new freeze after later semantic change creates a new record and never mutates the predecessor.

---

# 19. Source-only review / presentation separation

All v0.1 rules remain.

Source-only evidence can be corrected/confirmed without fake canonicalization, and presentation-only edits do not become semantic commands.

---

# 20. Authority / security / audit

All v0.1 authority, evidence-visibility and audit rules remain.

For multi-scope freeze TALOS can answer:

```text
Which scopes were requested together?
What disposition was requested for each?
Which validation assessments were evaluated?
Which scopes actually froze and why?
Which were deferred/excluded/rejected?
Who authorized the operation?
Which exact ProcessRevision/review baseline was frozen?
```

---

# 21. Regression target

v0.2 must pass all H01–H36, especially:

```text
H18 collateral change protection
H21/H22 idempotency
H23/H24 stale baseline/concurrency
H28–H31 freeze/readiness separation
H34 multi-scope freeze command intent
H35/H36 explicit per-scope dispositions
```

BUILD remains closed.
