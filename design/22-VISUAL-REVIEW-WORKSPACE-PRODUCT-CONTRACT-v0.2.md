# TALOS — Visual Review Workspace Product Contract v0.2

Status: **DESIGN CANDIDATE / T3-02 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T3-02 design: `22-VISUAL-REVIEW-WORKSPACE-PRODUCT-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial T3-02 pressure test:

```text
W01–W32
31 PASS
 1 FAIL
```

Failure:

```text
W30 — one review workspace may contain multiple semantic scopes, each requiring its own T3-01 explanation draft
```

v0.1 correctly pinned every review surface to one immutable semantic baseline, but `ReviewBaselineBundle` carried one singular `explanationDraftSnapshotId`.

T3-01 correctly gives every `ExplanationDraftSnapshot` one `primarySemanticScopeRef`. Therefore a multi-scope workspace needs explicit **scope-to-surface bindings** rather than one global draft.

v0.2 introduces:

```text
ReviewScopeSurfaceBinding
```

and makes scope-bound surface coordination first-class.

No Phase-1, Phase-2 or T3-01 contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
ONE REVIEW WORKSPACE                 may contain 0..N SEMANTIC SCOPES
ONE SEMANTIC SCOPE                   may have its own explanation/assessment context
ONE EXPLANATION DRAFT                has ONE primary semantic scope
MULTI-SCOPE REVIEW                   ≠ ONE GLOBAL DRAFT
MULTI-SCOPE REVIEW                   ≠ UNRELATED REVIEW BASELINES
SCOPE SWITCH / FILTER                ≠ BASELINE CHANGE
SCOPE-SPECIFIC VISUAL GRAMMAR        ≠ SEMANTIC REINTERPRETATION
SAME SUBJECT IN MULTIPLE SCOPES      ≠ DUPLICATE SOURCE/CANONICAL IDENTITY
```

Primary law remains:

> Every material review surface resolves from one explicit immutable review baseline, while each semantic scope binds to the explanation, validation and visual context appropriate to that scope.

---

# 2. ReviewBaselineBundle — revised in v0.2

```text
ReviewBaselineBundle
- id
- reviewWorkspaceDefinitionId
- reviewWorkspaceRevisionId
- baselineProcessRevisionId
- reviewProjectionRevisionId
- primaryReviewScopeRef?
- contextReviewScopeRefs[]
- scopeSurfaceBindingRefs[]
- activeReviewAuthoredSourceRevisionId?
- sourceContextRefs[]
- adapterResultContextRefs[]
- baselineSemanticDigest
- compatibilityDigest
- createdAt
```

Removed from v0.1:

```text
explanationDraftSnapshotId
baselineValidationAssessmentRefs[]
```

Those are now scope-bound through `ReviewScopeSurfaceBinding`.

The bundle remains an immutable coordination artifact, not a semantic authority.

---

# 3. ReviewScopeSurfaceBinding — new in v0.2

```text
ReviewScopeSurfaceBinding
- id
- reviewBaselineBundleId
- semanticScopeRef
- scopeKind
- explanationDraftSnapshotRef?
- validationAssessmentRefs[]
- projectionSubjectRefs[]
- visualGrammarKind
- sourceContextRefs[]?
- adapterResultContextRefs[]?
- scopeCompatibilityDigest
- createdAt
```

Rules:

```text
ExplanationDraftSnapshot.primarySemanticScopeRef
        = ReviewScopeSurfaceBinding.semanticScopeRef
```

when a draft is present.

Every bound validation assessment must be compatible with:

```text
baselineProcessRevisionId
+ semanticScopeRef
+ assessment intent
```

The shared `ReviewProjectionRevision` may contain items from several scopes; `projectionSubjectRefs[]` identifies which projected subjects participate in each scope.

---

# 4. Scope membership on visible items

`VisualReviewItem` is revised:

```text
VisualReviewItem
- id
- reviewBaselineBundleId
- projectionItemRef
- primarySubjectRef
- semanticScopeRefs[]
- semanticPresence
- facetIndicatorRefs[]
- validationIndicatorRefs[]
- provenanceIndicatorRef?
- reviewAffordanceRefs[]
- presentationRole
```

One visual subject may participate in multiple semantic scopes without duplicating source/canonical identity.

Example:

```text
"Manager approval"
  participates in PROCESS_FLOW S1
  and POLICY_PROCEDURE S2
```

The visible object may remain one item with scope-aware facets/context.

---

# 5. Scope-aware text ↔ Canvas bindings

`ExplanationFacetVisualBinding` must include scope context:

```text
ExplanationFacetVisualBinding
- semanticScopeRef
- explanationFacetRef
- visualReviewItemRefs[]
- subjectRefs[]
- propertyPath?
- bindingKind
```

This prevents a facet from one scope being highlighted as if it belonged to another merely because subject IDs overlap.

---

# 6. Multi-scope review example

One uploaded manual produces:

```text
Scope S1 = PROCESS_FLOW
Scope S2 = POLICY_PROCEDURE
Scope S3 = ARCHITECTURE_SCOPE
```

Valid bundle:

```text
ReviewBaselineBundle B
  baselineProcessRevision = PR7
  reviewProjectionRevision = P4
  primaryReviewScope = S1
  contextReviewScopes = [S2, S3]

Binding BS1
  scope = S1
  draft = Draft-Process-PR7
  assessments = [A-S1]
  visualGrammar = PROCESS_GRAPH

Binding BS2
  scope = S2
  draft = Draft-Policy-PR7
  assessments = [A-S2]
  visualGrammar = POLICY_RULE_VIEW

Binding BS3
  scope = S3
  draft = Draft-Architecture-PR7
  assessments = [A-S3]
  visualGrammar = ARCHITECTURE_TOPOLOGY
```

All three remain part of one immutable review context.

---

# 7. Scope navigation

Product may let the reviewer:

```text
focus primary scope
show/hide context scopes
switch active explanatory draft
filter findings/questions by scope
show cross-scope subjects
```

These are presentation operations over the same `ReviewBaselineBundle`.

They do not create a new `ReviewWorkspaceRevision` or `ProcessRevision`.

---

# 8. Shared baseline compatibility

Compatibility is checked at two levels:

```text
BUNDLE LEVEL
- one ReviewWorkspaceRevision
- one baseline ProcessRevision
- one compatible ReviewProjectionRevision

SCOPE LEVEL
- semantic scope exists in/for baseline context
- explanation draft primary scope matches binding
- assessments match ProcessRevision + scope
- projection subjects are valid for binding
```

A failure in one scope binding may block that scope surface without pretending the entire source is invalid. Material bundle-level mismatch blocks synchronized review globally.

---

# 9. Multiple validation intents

A scope may have multiple compatible assessments, for example:

```text
BUSINESS_MODEL_UNDERSTANDING
SOURCE_REVIEW
AUTOMATION_DESIGN_READINESS
```

The product must display the assessment intent with findings/readiness so one verdict is not misapplied to another intent.

No product badge may collapse:

```text
VALID for business understanding
```

into:

```text
READY FOR AUTOMATION DESIGN
```

---

# 10. All v0.1 visual axes remain

Keep separately:

```text
A. SEMANTIC PRESENCE
B. FACET/PROPERTY EPISTEMIC STATE
C. EVIDENCE PERSPECTIVE
D. CONFIDENCE
E. PROVENANCE MULTIPLICITY
F. VALIDATION / BLOCKER STATE
G. REVIEW ACTIONABILITY
```

No giant item status is introduced.

---

# 11. SemanticPresence

Retained:

```text
CANONICAL
SOURCE_ONLY
REVIEW_AUTHORED
HYBRID
NON_PROCESS_CONTEXT
SOURCE_DEFINED
```

`SOURCE_ONLY` remains orthogonal to epistemic state.

---

# 12. Facet-level visual indicators

Retain `VisualFacetIndicator` and T3-01 states:

```text
SOURCE_STATED
INFERRED
CONFIRMED
CONFLICTED
UNKNOWN
SUGGESTED
SOURCE_DEFINED
```

Property/facet state remains authoritative for material review.

---

# 13. Redundant encoding / accessibility

Material states may not rely on color alone. Product presentation must support at least one additional channel such as text, icon, border/pattern, badge, line treatment or explicit qualifier.

T3-02 freezes semantic display obligations, not palette or visual style.

---

# 14. Source-only evidence

Retained from v0.1:

```text
VISIBLE IN REVIEW               ✅
TRACEABLE TO SOURCE             ✅
MAY PARTICIPATE IN QUESTIONS    ✅
CANONICAL ELEMENT REQUIRED      ❌
```

Source-only items may belong to one or more review scopes.

---

# 15. Conflicts

Conflict presentation retains:

```text
subject/property
competing claims/values
source origins
perspectives
truth/confidence
validation impact
review affordances
```

Scope context must be shown where the conflict's materiality differs by scope.

---

# 16. Findings and questions

Findings/questions remain immutable overlays, not process nodes.

T3-02 must surface their:

```text
scope
assessment intent
severity/blocker class
resolution route
target subject/property
```

One `ClarificationQuestion` may appear in multiple product locations while retaining one identity.

---

# 17. Multi-source provenance

One visible item may bind to many source origins/representations/perspectives. Product may summarize but may not force one source to become semantic authority for UI convenience.

---

# 18. Evidence inspector and navigation

Retain the trust chain:

```text
visible item / phrase
→ scope + facet/property
→ claim/finding/question
→ provenance
→ evidence fragment
→ representation
→ capture
→ origin
```

Source-specific locators remain supported.

---

# 19. Text draft ↔ Canvas synchronization

Navigation is ID/scope/facet based, never label/position heuristic based.

A scope switch changes which draft/bindings are emphasized, not the semantic baseline.

---

# 20. Baseline mismatch protection

Retain v0.1:

```text
INCOMPATIBLE BUNDLE OR SCOPE BINDING
→ do not silently mix surfaces
```

A newer baseline may be advertised, not automatically adopted.

---

# 21. Compare / history

Retain comparison of:

```text
preserved meaning
changed meaning
added meaning
removed meaning
impacted reviewer evidence
changed findings/questions
```

Comparison may be scope-filtered but cannot adopt the candidate baseline. T3-03 owns decisions.

---

# 22. Review lenses

Retain:

```text
UNDERSTANDING
EVIDENCE
UNCERTAINTY
VALIDATION
PROVENANCE
SOURCE_CONTEXT
COMPARE
SOURCE_DEFINED
```

Lenses operate over one baseline and may be scope-filtered.

---

# 23. Review action affordances

Retain P2-01B action kinds as discoverable affordances. An affordance must carry the current baseline bundle and semantic scope/subject/property context.

It is not an applied `ReviewAction`.

T3-03 owns command/application semantics.

---

# 24. Source-family behavior

Retain one review product contract across:

```text
Canvas native
BPMN
Image/perception
Language/document
Existing automation
Runtime observation
```

Source-family evidence remains distinct while surface coordination is common.

---

# 25. Scope-aware visual grammar

`visualGrammarKind` is now bound per `ReviewScopeSurfaceBinding`.

Initial kinds:

```text
PROCESS_GRAPH
COLLABORATION_GRAPH
FUNCTIONAL_MODEL
ARCHITECTURE_TOPOLOGY
POLICY_RULE_VIEW
OBJECT_LIFECYCLE
SOURCE_REVIEW_VIEW
SOURCE_DEFINED
```

No global grammar may force all scopes into one flowchart.

---

# 26. Readiness wording

Phase 3 may display frozen Semantic Validation outcomes but may not imply capability binding, deployment or Temporal execution.

Allowed examples:

```text
needs confirmation
insufficient detail
blocked by conflict
ready for automation design
```

Forbidden premature claims include:

```text
ready to run
deployable
Temporal ready
execution verified
```

---

# 27. Evidence visibility

Review may show evidence visibility states:

```text
VISIBLE
REDACTED
RESTRICTED
UNAVAILABLE
```

No hidden value is inferred from restricted/unavailable evidence.

---

# 28. Auditability

For any review state TALOS can answer:

```text
Which workspace revision and ProcessRevision are active?
Which semantic scope is in focus?
Which draft/assessment/visual grammar belongs to that scope?
Why is each visual facet shown with its state?
Which sources support/disagree?
Which findings/questions apply?
Which candidate baseline, if any, is being compared?
```

---

# 29. Anti-goals

All v0.1 anti-goals remain, plus:

- do not force a multi-scope workspace into one explanation draft;
- do not create unrelated baseline bundles just to show different scopes from the same review context;
- do not apply one scope's validation verdict to another scope;
- do not duplicate source/canonical identity because one subject participates in multiple scopes;
- do not make scope switching a semantic revision.

---

# 30. Regression target

v0.2 must pass all W01–W32, especially:

```text
W16/W17 baseline compatibility
W18/W19 no auto-rebase
W29 non-process grammar
W30 multi-scope workspace with separate scope-bound drafts
W32 compare without adoption
```

BUILD remains closed.
