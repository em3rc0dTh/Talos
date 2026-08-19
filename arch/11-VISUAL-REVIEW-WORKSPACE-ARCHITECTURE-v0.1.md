# TALOS — Visual Review Workspace Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T3-02 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target: `design/22-VISUAL-REVIEW-WORKSPACE-PRODUCT-CONTRACT-v0.1.md`

BUILD remains closed.

## 1. Core architecture

T3-02 is a coordinated read/review layer over frozen semantic history. It introduces no new process truth model.

```text
ProcessRevision
+ Provenance / Claims
+ ValidationAssessment(s)
+ ReviewWorkspaceRevision
+ ReviewProjectionRevision
+ ExplanationDraftSnapshot
        ↓
ReviewBaselineBundle
        ↓
ReviewExperienceAssembler
        ├── Human-readable Draft
        ├── Visual Canvas
        ├── Evidence Inspector
        ├── Findings / Questions
        └── History / Compare
```

Every material surface receives the same pinned baseline bundle. No surface may fetch or adopt a newer semantic baseline independently.

## 2. ReviewBaselineCoordinator

Conceptual service:

```text
ReviewBaselineCoordinator
```

Responsibilities:

1. resolve one immutable `ReviewWorkspaceRevision`;
2. resolve its exact `ProcessRevision`;
3. resolve compatible validation assessments;
4. resolve/generate a compatible `ReviewProjectionRevision`;
5. resolve/generate a compatible `ExplanationDraftSnapshot`;
6. verify semantic and scope compatibility;
7. emit immutable `ReviewBaselineBundle`.

Forbidden pattern:

```text
Draft pane → latest draft
Canvas pane → latest projection
Findings pane → latest assessment
```

## 3. Compatibility checker

```text
ReviewBaselineCompatibilityChecker
```

Checks at minimum:

```text
workspace baseline == ProcessRevision
projection baseline == ProcessRevision
draft baseline == ProcessRevision
assessment ProcessRevision compatibility
scope compatibility
review-authored context compatibility
source/adapter context compatibility where material
```

Results:

```text
COMPATIBLE
INCOMPATIBLE
PARTIAL_CONTEXT
```

`INCOMPATIBLE` blocks combined review rendering.

## 4. Read-model assembly

```text
ReviewBaselineBundle
        ↓
ReviewExperienceAssembler
        ├── ExplanationReadModel
        ├── VisualReviewReadModel
        ├── EvidenceReadModel
        ├── ValidationReadModel
        └── HistoryReadModel
```

Read models cannot change the baseline.

## 5. VisualReviewProjector

Consumes:

```text
ReviewProjectionRevision
ExplanationEvidenceFacet bindings
claims / provenance summaries
findings / questions
presentation policy
```

Produces product read objects:

```text
VisualReviewItem
VisualFacetIndicator
VisualValidationIndicator
ProvenanceIndicator
ReviewAffordanceDescriptor
```

These objects are presentation/read state, not source or canonical truth.

## 6. Multi-axis item state

```text
VisualReviewItem
  ├── SemanticPresence
  ├── VisualFacetIndicator[]
  ├── VisualValidationIndicator[]
  ├── ProvenanceIndicator
  └── ReviewAffordanceDescriptor[]
```

No authoritative single item status is computed.

Facet/property evidence state remains authoritative for material review.

## 7. T3-01 text ↔ visual bridge

```text
ExplanationFacetVisualBinding
- explanationFacetRef
- visualReviewItemRefs[]
- subjectRefs[]
- propertyPath?
- bindingKind
```

Binding kinds:

```text
DIRECT_SUBJECT
PROPERTY_FACET
RELATIONSHIP_FACET
CONTEXTUAL
SOURCE_DEFINED
```

This supports deterministic text-to-Canvas navigation without label or position matching.

## 8. Evidence navigation

```text
EvidenceNavigator
```

Resolves:

```text
visible item / phrase
→ facet/property
→ claim/finding/question
→ provenance
→ evidence fragment
→ source occurrence/representation
→ capture/origin
```

It may generate transient focus targets such as an image region or text span. Focus does not alter semantics.

## 9. Source-aware evidence renderers

One review architecture may have source-aware evidence viewers:

```text
CanvasEvidenceRenderer
BpmnEvidenceRenderer
ImageEvidenceRenderer
TextEvidenceRenderer
AutomationEvidenceRenderer
RuntimeEvidenceRenderer
GenericEvidenceRenderer
```

They render evidence details only and do not create separate semantic cores.

## 10. Findings / questions read model

`ValidationReadModel` can group immutable findings/questions by:

```text
subject
severity
blocker class
resolution route
scope
```

Grouping is presentation state only.

## 11. Conflict read model

```text
ConflictReviewModel
- conflictRef
- affectedSubjectRef
- propertyPath
- competingClaimSummaries[]
- sourceOriginRefs[]
- perspectives[]
- validationImpactRefs[]
- reviewAffordanceRefs[]
```

Presentation never chooses the winning claim automatically.

## 12. Provenance summary

`ProvenanceIndicator` may summarize source count, source families, perspectives and conflict/reviewer-authored presence. The evidence inspector remains the authority for detailed lineage.

## 13. Review lenses

```text
UNDERSTANDING
EVIDENCE
UNCERTAINTY
VALIDATION
PROVENANCE
SOURCE_CONTEXT
COMPARE
```

Lenses filter/emphasize one baseline; they never create alternate semantics.

## 14. Baseline transition comparison

When a P2-01B `BaselineTransitionCandidate` exists:

```text
current ReviewBaselineBundle
        ↓
HistoryReadModel
        ↓
BaselineReconciliationAnalysis
        ↓
CompareReadModel
```

Compare exposes preserved/changed/added/removed meaning, impacted review evidence and changed findings/questions. It does not adopt the candidate. T3-03 owns acceptance/rejection.

## 15. Review affordance boundary

```text
ReviewAffordanceDescriptor
- actionKind
- targetSubjectRef
- targetPropertyPath?
- baselineBundleId
- claimRefs[]
- findingRefs[]
- questionRefs[]
```

It describes an available action; it is not a `ReviewAction`.

## 16. Presentation-only state

Zoom, pan, hover, selection, lens toggles and panel arrangement are presentation state. Persisted layout may create a presentation/projection revision but not a `ProcessRevision` or semantic workspace revision.

## 17. Baseline mismatch

If draft, Canvas or findings refer to incompatible revisions:

```text
ReviewExperienceAssembler
→ BASELINE_MISMATCH
→ block presentation as one synchronized review state
```

A newer baseline may be advertised, but not silently mixed.

## 18. Scope-specific visual grammar

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

Grammar selection is presentation policy and cannot invent runtime flow.

## 19. Evidence visibility boundary

Evidence may be marked:

```text
VISIBLE
REDACTED
RESTRICTED
UNAVAILABLE
```

The product does not infer hidden values from unavailable evidence.

## 20. Auditability

For one `ReviewBaselineBundle`, TALOS must be able to explain which ProcessRevision, assessment(s), draft snapshot, projection revision and source/adapter context were reviewed and why each material visual state was shown.

## 21. Anti-goals

Do not:

- create a review-specific semantic model;
- let frontend state become baseline authority;
- fetch independent latest revisions per pane;
- flatten mixed facet states into one authoritative item state;
- create canonical elements for source-only evidence;
- auto-rebase during comparison;
- turn click/drag directly into semantic mutation;
- import capability or Temporal execution concepts into T3-02.

## 22. Gate

T3-02 passes only if the full visual-review pressure suite preserves all frozen Phase-1, Phase-2 and T3-01 contracts.

BUILD remains closed.
