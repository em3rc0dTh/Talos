# TALOS — Visual Review Workspace Product Contract v0.1

Status: **DESIGN CANDIDATE / T3-02 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define the product-level review contract that lets a human inspect the same immutable TALOS semantic baseline through coordinated text, Canvas, evidence, validation and history surfaces.

T3-02 builds on:

```text
P2-01B Canvas Review / Projection v0.2
T3-01 Human-Readable Workflow Draft v0.2
Canonical v0.1
Provenance v0.3
Semantic Validation v0.2
```

This is **not visual styling**, **not UI implementation**, and **not the correction/freeze transaction model**. T3-03 owns the complete correction / confirmation / freeze loop.

Primary gate question:

> How does TALOS visually present canonical meaning, source-only evidence, uncertainty, conflicts, validation findings, clarification questions and multi-source provenance while keeping every review surface pinned to the same immutable semantic baseline?

BUILD remains closed.

---

# 1. Fundamental invariants

```text
VISUAL REVIEW WORKSPACE              ≠ PROCESS SOURCE
CANVAS PROJECTION                    ≠ PROVENANCE OWNER
VISIBLE ITEM                         ≠ CANONICAL ELEMENT AUTOMATICALLY
SOURCE-ONLY ITEM                     ≠ CANONICAL MATERIALIZATION
ITEM-WIDE BADGE                      ≠ PROPERTY/FACET-LEVEL EVIDENCE AUTHORITY
COLOR                                ≠ SOLE SEMANTIC CARRIER
POSITION / ZOOM / LAYOUT             ≠ PROCESS SEMANTICS
CURRENT UI SELECTION                 ≠ REVIEW DECISION
DRAFT PANE                           ≠ AUTHORITATIVE PROCESS TRUTH
CANVAS PANE                          ≠ AUTHORITATIVE PROCESS TRUTH
EVIDENCE PANE                        ≠ AUTHORITATIVE PROCESS TRUTH
LATEST POINTER                       ≠ COMPATIBLE SHARED BASELINE AUTOMATICALLY
TEXT HIGHLIGHT                       ≠ CANVAS RELATIONSHIP
CANVAS HIGHLIGHT                     ≠ NEW SEMANTIC CLAIM
FINDING OVERLAY                      ≠ PROCESS NODE
QUESTION OVERLAY                     ≠ PROCESS NODE
CONFLICT MARKER                      ≠ CONFLICT RESOLUTION
REVIEW ACTION AFFORDANCE             ≠ APPLIED REVIEW ACTION
PRESENTATION STATE                   ≠ REVIEW WORKSPACE REVISION
```

Primary product law:

> Every material review surface must resolve from one explicit immutable baseline bundle. No pane may independently advance to a newer ProcessRevision, ValidationAssessment, adapter result or review-workspace revision.

---

# 2. One review baseline bundle

Introduce:

```text
ReviewBaselineBundle
- id
- reviewWorkspaceDefinitionId
- reviewWorkspaceRevisionId
- baselineProcessRevisionId
- baselineValidationAssessmentRefs[]
- reviewProjectionRevisionId
- explanationDraftSnapshotId
- activeReviewAuthoredSourceRevisionId?
- sourceContextRefs[]
- adapterResultContextRefs[]
- baselineSemanticDigest
- compatibilityDigest
- createdAt
```

The bundle is an immutable coordination record.

It does not replace any underlying contract. It pins compatible versions of already-existing artifacts so the product can render them together safely.

Required:

```text
ReviewWorkspaceRevision.baselineProcessRevisionId
        = ReviewBaselineBundle.baselineProcessRevisionId

ReviewProjectionRevision.baselineProcessRevisionId
        = ReviewBaselineBundle.baselineProcessRevisionId

ExplanationDraftSnapshot.processRevisionRef
        = ReviewBaselineBundle.baselineProcessRevisionId
```

where those references apply.

Validation assessments included in the bundle must be compatible with the same ProcessRevision/scope context.

If compatibility cannot be proven:

```text
DO NOT MIX SURFACES
```

Show baseline mismatch/reload/transition state instead.

---

# 3. Review experience snapshot

Product rendering state that matters historically may be captured as:

```text
ReviewExperienceSnapshot
- id
- reviewBaselineBundleId
- productContractVersion
- presentationPolicyVersion
- activeLensSet[]
- visibleScopeRefs[]
- viewConfigurationRef?
- createdAt
```

This snapshot may preserve reproducible review presentation context.

Transient UI state such as cursor position, hover, temporary zoom or open tooltip does not become semantic/review history automatically.

---

# 4. Product workspace regions

T3-02 defines logical regions, not visual placement or styling.

Required product capabilities:

```text
BASELINE / SCOPE HEADER
HUMAN-READABLE DRAFT SURFACE
VISUAL CANVAS SURFACE
EVIDENCE / PROVENANCE INSPECTOR
FINDINGS / QUESTIONS SURFACE
HISTORY / BASELINE SURFACE
```

A product may compose these as panes, drawers, tabs or responsive surfaces, provided baseline compatibility and navigation laws remain intact.

---

# 5. Canvas visual subject model

Every visible review item resolves through an explicit subject/binding, never display text or screen position.

Possible subjects remain aligned with P2-01B:

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

Introduce product projection metadata:

```text
VisualReviewItem
- id
- reviewBaselineBundleId
- projectionItemRef
- primarySubjectRef
- semanticPresence
- facetIndicatorRefs[]
- validationIndicatorRefs[]
- provenanceIndicatorRef?
- reviewAffordanceRefs[]
- presentationRole
```

---

# 6. Separate visual axes — no giant status enum

A visible item may simultaneously be:

```text
canonical
inferred for one property
confirmed for another property
supported by 3 source origins
affected by one warning
blocked by one unresolved question
```

Therefore the product must not collapse review state into one status.

Keep at least these axes separate:

```text
A. SEMANTIC PRESENCE
B. EPISTEMIC STATE — FACET/PROPERTY SCOPED
C. EVIDENCE PERSPECTIVE
D. CONFIDENCE
E. PROVENANCE MULTIPLICITY
F. VALIDATION / BLOCKER STATE
G. REVIEW ACTIONABILITY
```

---

# 7. SemanticPresence

```text
CANONICAL
SOURCE_ONLY
REVIEW_AUTHORED
HYBRID
NON_PROCESS_CONTEXT
SOURCE_DEFINED
```

This answers what kind of material the visual item represents.

It does **not** answer whether the meaning is confirmed, inferred, conflicted or executable.

Example:

```text
ambiguous image connector
semanticPresence = SOURCE_ONLY
```

because TALOS may display the evidence without inventing a canonical edge.

---

# 8. Facet-level visual indicators

T3-02 directly adopts T3-01's property/facet epistemic discipline.

```text
VisualFacetIndicator
- id
- visualReviewItemId
- explanationFacetRef?
- subjectRef?
- propertyPath?
- claimRefs[]
- provenanceRefs[]
- epistemicState
- evidencePerspective?
- confidence?
- materiality
- displayQualifier
```

`epistemicState` uses the T3-01 vocabulary:

```text
SOURCE_STATED
INFERRED
CONFIRMED
CONFLICTED
UNKNOWN
SUGGESTED
SOURCE_DEFINED
```

A node may have several indicators.

Example:

```text
Node: Review request
  type            CONFIRMED
  literal label   SOURCE_STATED
  actor            UNKNOWN
  ordering         INFERRED
```

A summary marker may exist for scanning, but material review decisions require facet-level inspection.

---

# 9. Accessibility / redundant encoding law

No material semantic state may depend only on color.

The presentation system must support redundant encoding using at least one additional channel such as:

```text
text label
icon/glyph
border/pattern
badge
shape annotation
line treatment
explicit qualifier
```

Exact visual tokens/colors belong to later visual design/system work.

T3-02 freezes meaning, not palette.

---

# 10. Source-only evidence representation

Source-only evidence must be visually representable without becoming a fake canonical node/edge.

Examples:

```text
ambiguous image edge
unresolved BPMN external reference
textual rule with no process-node mapping
unsupported automation node
architecture context
functional relationship
```

Required product distinctions:

```text
VISIBLE IN REVIEW               ✅
TRACEABLE TO SOURCE             ✅
MAY PARTICIPATE IN QUESTIONS    ✅
CANONICAL ELEMENT REQUIRED      ❌
```

---

# 11. Conflict representation

A material conflict is not one low-confidence value.

Product must expose:

```text
subject/property affected
competing claim/value candidates
source origins / evidence perspectives
truth/confidence per claim
validation impact
available review action affordances
```

Example:

```text
SOP: manager approval required       BUSINESS_INTENT
n8n: auto-approve score > 80         IMPLEMENTED_BEHAVIOR
```

The Canvas may summarize the conflict visually, but the evidence inspector must preserve both claims.

---

# 12. Validation finding overlays

Findings remain overlays bound to semantic/source subjects.

```text
VisualValidationIndicator
- id
- visualReviewItemId?
- findingRef
- severity
- blockerClass
- resolutionRoute
- questionRef?
- targetRefs[]
```

A process region may have findings without creating synthetic nodes.

The product must distinguish at minimum:

```text
informational/warning
semantic-understanding blocker
automation-design blocker
source-acceptance blocker
```

without implying execution support before later phases.

---

# 13. Clarification questions

Questions must be placed/bound by target evidence/semantic subject where possible.

A question can appear:

```text
on/near relevant visual subject
in findings/questions queue
inside evidence inspector
in textual draft context
```

All presentations reference one immutable `ClarificationQuestion`.

The question display is not an answer and does not mutate the ProcessRevision.

T3-03 defines the answer/application lifecycle.

---

# 14. Multi-source provenance indication

One visual item may bind to multiple origins/representations/claims.

Product must support:

```text
source count / provenance indicator
source-family indication
perspective indication
open evidence inspector
navigate to each evidence fragment
```

No visual item is forced to pick a single "primary source" as semantic authority.

A primary display source may be chosen for convenience only if clearly marked as presentation choice.

---

# 15. Evidence inspector

For any material visual/textual statement TALOS must support navigation:

```text
visible item / phrase
→ facet/property
→ claim/finding/question
→ provenance link
→ evidence fragment
→ source representation
→ capture
→ source origin
```

Inspector must preserve representation-specific locators where available:

```text
Canvas element ID/revision
BPMN native ID
image region
text span/table cell
provider automation node/connection
runtime event reference
```

---

# 16. Source evidence navigation

Navigating to evidence may:

```text
highlight Canvas source occurrence
show BPMN/source details
focus image region
highlight text span
show automation provider occurrence
show runtime observation
```

Navigation/focus is transient presentation state.

It does not create semantic claims or source equivalence.

---

# 17. Text draft ↔ Canvas synchronization

T3-01 draft and T3-02 Canvas must navigate through explicit shared semantic subjects/facets.

Required:

```text
select ExplanationProposition/Facet
→ highlight bound VisualReviewItem(s)

select VisualReviewItem/facet
→ highlight relevant ExplanationProposition/Facet(s)
```

Binding uses IDs/subject references.

Forbidden:

```text
match by label text
match by position
match by rendered sentence heuristics
```

One proposition may bind to many visual items; one item may bind to many propositions/facets.

---

# 18. Baseline mismatch protection

A review experience must detect incompatible panes.

Examples:

```text
Draft generated for ProcessRevision A
Canvas projection generated for ProcessRevision B
```

or:

```text
Canvas uses ValidationAssessment A1
findings queue uses newer Assessment A2
```

Required behavior:

```text
BLOCK MIXED REVIEW STATE
```

until a compatible `ReviewBaselineBundle` is selected/generated.

The product may show a notice that a newer baseline exists, but cannot silently mix it into the current review.

---

# 19. New baseline available / comparison state

When P2-01B creates a `BaselineTransitionCandidate`, product may expose:

```text
NEW INTERPRETATION AVAILABLE
USER CORRECTION PRODUCED NEW REVISION
ADDITIONAL SOURCE AVAILABLE
CONFLICT RESOLUTION CANDIDATE
```

This does not change the active review baseline.

The history/compare surface may show:

```text
current baseline
candidate baseline
semantic differences
preserved meaning
changed/added/removed meaning
impacted reviewer evidence
new/resolved findings
```

T3-03 owns acceptance/rejection semantics.

---

# 20. Review lenses

Lenses are presentation filters over one baseline, never alternate truth models.

Initial product lens vocabulary:

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

Examples:

```text
UNDERSTANDING  → emphasize canonical accepted/candidate meaning
EVIDENCE       → emphasize source bindings and evidence anchors
UNCERTAINTY    → emphasize inferred/unknown/conflicted facets
VALIDATION     → emphasize findings/questions/blockers
PROVENANCE     → emphasize origins/perspectives/multi-source support
COMPARE        → emphasize baseline transition differences
```

Turning a lens on/off does not change the baseline or semantic digest.

---

# 21. Default review experience

Default presentation should make the process understandable without hiding material uncertainty.

Required balance:

```text
clean enough to understand
honest enough to review
traceable enough to trust
```

The product may progressively disclose evidence detail, but material blockers/conflicts/unknowns cannot be hidden behind a mode the user is never informed about.

---

# 22. Review action affordances

T3-02 defines discoverability/targeting of review actions, not their final transaction semantics.

Possible affordances map to P2-01B actions:

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
```

An affordance must identify:

```text
target subject/property
current baseline bundle
relevant evidence/claims/findings
intended action kind
```

Clicking/editing the visual representation alone must not mutate semantic truth.

---

# 23. Source-family product behavior

## Canvas native

Can display source-authored structure with exact native provenance.

## BPMN

Can expose native IDs/types/DI separately from canonical interpretation.

## Image

Can expose image region evidence, perception alternatives and confidence.

## Language/document

Can expose exact text spans, modality/coreference/order interpretations.

## Existing automation

Can expose definition configuration separately from deployment/runtime observations and business intent.

All appear through one review product contract without pretending their evidence is identical.

---

# 24. Scope-aware visual review

Not every review scope is a flowchart.

T3-02 must support visual review of:

```text
PROCESS_FLOW
COLLABORATION
PARTICIPANT_LOCAL_PROCESS
FUNCTIONAL_MODEL
ARCHITECTURE_SCOPE
POLICY_PROCEDURE
BUSINESS_OBJECT_LIFECYCLE
EXECUTABLE_SLICE_CANDIDATE
SOURCE_REVIEW_ONLY
```

Visual grammar may differ by scope kind.

Forbidden:

```text
reference architecture → forced process flow
functional model → forced runtime sequence
policy scope → fake activity graph
```

---

# 25. Execution/readiness language

Phase 3 may show frozen Semantic Validation readiness/status, but must not imply capabilities or Temporal execution exist.

Allowed wording follows frozen readiness concepts such as:

```text
needs confirmation
insufficient detail
blocked by conflict
ready for automation design
```

Forbidden premature product wording:

```text
READY TO RUN
DEPLOYABLE
TEMPORAL READY
EXECUTION VERIFIED
```

unless later contracts actually establish those states.

---

# 26. Security / sensitive evidence

The review product must respect source security boundaries.

Credential/secret values and sensitive source material are not displayed merely because they exist in an adapter record.

Evidence navigation may indicate:

```text
REDACTED
RESTRICTED
NOT AVAILABLE TO THIS VIEWER
```

without fabricating semantic meaning.

---

# 27. Audit / explainability

For a material visual state TALOS must be able to answer:

```text
What am I looking at?
Which semantic baseline is this?
Why is this item shown?
Is it canonical, source-only or review-authored?
Which property is inferred/confirmed/conflicted/unknown?
Which sources support/disagree?
Which finding/question applies?
What review action would create new evidence?
Has a newer baseline been proposed?
```

---

# 28. Anti-goals

Do not:

- turn provenance into decorative badges with no evidence navigation;
- give one item one flattened truth state when its facets differ;
- rely only on color for uncertainty/conflict;
- render source-only evidence as canonical merely to simplify the graph;
- hide findings/questions by default when they materially block understanding;
- silently advance any pane to a newer baseline;
- let text and Canvas resolve independent "latest" revisions;
- treat editor layout changes as semantic changes;
- make review actions direct mutations of source/canonical history;
- expose credentials/secrets through review convenience;
- imply Temporal/execution readiness before later gates.

---

# 29. T3-02 pressure-test target

T3-02 must pressure-test at minimum:

```text
mixed facet states on one item
source-only ambiguous relation
material conflict across source perspectives
finding + question on one property
multi-source provenance
text ↔ Canvas cross-navigation
baseline mismatch protection
new baseline available without auto-rebase
presentation-only lens/layout changes
non-process scopes
security/redaction
review actions as affordances not mutations
```

BUILD remains closed.
