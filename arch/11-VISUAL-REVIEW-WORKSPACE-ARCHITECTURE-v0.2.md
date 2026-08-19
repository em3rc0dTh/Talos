# TALOS — Visual Review Workspace Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T3-02 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T3-02 architecture: `11-VISUAL-REVIEW-WORKSPACE-ARCHITECTURE-v0.1.md`

Target: `design/22-VISUAL-REVIEW-WORKSPACE-PRODUCT-CONTRACT-v0.2.md`

BUILD remains closed.

## Why v0.2 exists

Initial result:

```text
W01–W32
31 PASS / 1 FAIL
```

W30 proved that one review workspace may contain several semantic scopes while T3-01 requires one primary scope per explanation draft.

v0.2 makes scope-bound surface coordination explicit.

## 1. Core architecture

```text
ReviewWorkspaceRevision
+ ProcessRevision
+ ReviewProjectionRevision
+ source/adapter context
        ↓
ReviewBaselineCoordinator
        ↓
ReviewBaselineBundle
        ├── ReviewScopeSurfaceBinding(S1)
        ├── ReviewScopeSurfaceBinding(S2)
        └── ReviewScopeSurfaceBinding(Sn)
                ↓
ReviewExperienceAssembler
        ├── scope-bound ExplanationReadModel(s)
        ├── shared VisualReviewReadModel
        ├── EvidenceReadModel
        ├── scope/intent-bound ValidationReadModel(s)
        └── History / Compare
```

The bundle pins one immutable semantic baseline; bindings coordinate 0..N semantic scopes inside it.

## 2. ReviewBaselineCoordinator

Responsibilities:

1. resolve one immutable `ReviewWorkspaceRevision`;
2. resolve its exact `ProcessRevision`;
3. resolve one compatible `ReviewProjectionRevision`;
4. discover reviewable semantic scopes;
5. resolve/generate one compatible `ReviewScopeSurfaceBinding` per included scope;
6. verify bundle-level and scope-level compatibility;
7. emit immutable `ReviewBaselineBundle`.

No surface may independently fetch a newer revision.

## 3. ScopeSurfaceBindingResolver

Conceptual component:

```text
ScopeSurfaceBindingResolver
```

For each semantic scope it resolves:

```text
semantic scope identity/kind
T3-01 ExplanationDraftSnapshot where applicable
compatible ValidationAssessment(s)
projection subjects/items participating in scope
scope-specific visual grammar
source/adapter context where material
```

It never invents a draft by merging unrelated scope explanations.

## 4. Two-level compatibility

```text
BundleCompatibilityChecker
ScopeSurfaceCompatibilityChecker
```

Bundle-level checks:

```text
workspace revision
ProcessRevision
projection revision
review-authored source context
```

Scope-level checks:

```text
scope exists/is valid for baseline
ExplanationDraftSnapshot.primarySemanticScopeRef == semanticScopeRef
assessment ProcessRevision == bundle ProcessRevision
assessment primary scope ==/is valid for semanticScopeRef
projection subjects valid for scope
visual grammar valid for scope kind
```

A material bundle mismatch blocks synchronized review globally.

A scope-only incompatibility blocks that scope's coordinated surface and exposes a diagnostic without invalidating unrelated scopes automatically.

## 5. ReviewExperienceAssembler

Consumes only a `ReviewBaselineBundle` plus presentation configuration.

Produces:

```text
ReviewScopeNavigator
ExplanationReadModel[]
VisualReviewReadModel
EvidenceReadModel
ValidationReadModel[]
HistoryReadModel
```

Scope focus/filter is presentation state, not a baseline change.

## 6. Shared visual projection / scope membership

The same `ReviewProjectionRevision` may include subjects participating in multiple scopes.

```text
VisualReviewItem
  primarySubjectRef
  semanticScopeRefs[]
```

One source/canonical identity is retained even if multiple scope grammars/reference views include the same subject.

## 7. Scope-specific visual grammar

`ReviewScopeSurfaceBinding.visualGrammarKind` selects one grammar per scope:

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

A mixed workspace may therefore show/process several grammar regions or scope-focused views without reinterpreting semantics.

## 8. Text ↔ Canvas bridge

```text
ExplanationFacetVisualBinding
- semanticScopeRef
- explanationFacetRef
- visualReviewItemRefs[]
- subjectRefs[]
- propertyPath?
- bindingKind
```

The scope reference is required to avoid cross-scope false highlighting when the same subject participates in several views.

## 9. Validation architecture

Validation read models are keyed by:

```text
semanticScopeRef
assessmentIntent
ValidationAssessmentRef
```

The product must never reuse one assessment verdict as another scope/intent verdict.

## 10. Multi-axis state

Retained from v0.1:

```text
SemanticPresence
Facet epistemic state
Evidence perspective
Confidence
Provenance multiplicity
Validation/blocker state
Review actionability
```

No single authoritative item status.

## 11. Evidence navigation

The trust chain becomes scope-aware:

```text
visible item / phrase
→ semantic scope
→ facet/property
→ claim/finding/question
→ provenance
→ evidence fragment
→ source representation/capture/origin
```

Scope context never changes source provenance identity.

## 12. Findings/questions/conflicts

Read models can filter/group by semantic scope while preserving immutable finding/question/conflict identities.

One question/finding may appear in several product locations without duplication of semantic identity.

## 13. Review lenses

Retain:

```text
UNDERSTANDING
EVIDENCE
UNCERTAINTY
VALIDATION
PROVENANCE
SOURCE_CONTEXT
COMPARE
```

Lenses can be applied globally or to focused scope. They never create semantic revisions.

## 14. Baseline transition compare

A candidate baseline may itself contain changed scope inventory.

`CompareReadModel` can show:

```text
scopes preserved
scopes added/removed
meaning changed within scope
cross-scope impact
changed assessments/findings
review-authored evidence impact
```

Current baseline remains active until T3-03 decision semantics.

## 15. Review affordance boundary

Affordances carry:

```text
baselineBundleId
semanticScopeRef
subject/property target
action kind
relevant claim/finding/question refs
```

They do not create `ReviewAction` history themselves.

## 16. Presentation state

Scope focus, selected draft, lenses, zoom, pan, selection and panel configuration are presentation state.

Persisted presentation may create projection/presentation history but not ProcessRevision or semantic workspace revision.

## 17. Evidence visibility

Evidence viewer may return:

```text
VISIBLE
REDACTED
RESTRICTED
UNAVAILABLE
```

No hidden values are inferred.

## 18. Auditability

Given one bundle, TALOS can explain:

```text
active ReviewWorkspaceRevision / ProcessRevision
reviewable semantic scopes
scope-specific draft/assessment/visual grammar bindings
shared projection revision
source/adapter context
facet-level evidence state
candidate baseline comparison state
```

## 19. Anti-goals

Do not:

- use one global explanation draft for multiple primary scopes;
- split one semantic baseline into unrelated workspaces merely for scope-specific presentation;
- duplicate source/canonical identity across scope views;
- apply validation verdicts across scope/intent boundaries;
- make scope switching a semantic edit;
- create a separate review semantic model;
- auto-rebase to new adapter/source results;
- introduce capability/Temporal design into T3-02.

## 20. Gate

v0.2 must pass full W01–W32 regression.

BUILD remains closed.
