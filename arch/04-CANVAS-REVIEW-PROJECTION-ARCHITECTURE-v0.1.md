# TALOS — Canvas Review / Projection Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / P2-01B REGRESSION TARGET**  
Date: **2026-08-19**

## Purpose

Define the system boundary that lets TALOS use the Canvas as a review/correction surface for imported processes without turning the Canvas into the original source or bypassing frozen provenance/validation contracts.

Target design:

```text
design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.2.md
```

---

# 1. Architectural statement

```text
IMPORTED SOURCE
      ↓
SOURCE ADAPTER
      ↓
SOURCE EVIDENCE / CLAIMS
      ↓
CANONICAL PROCESS REVISION
      ↓
VALIDATION ASSESSMENT
      ↓
REVIEW WORKSPACE REVISION
      ↓
PROJECTION ENGINE
      ↓
CANVAS REVIEW PROJECTION
```

The projection is read-model/UI materialization over immutable semantic/evidence state.

Semantic user edits follow a separate write path:

```text
CANVAS REVIEW ACTION
      ↓
REVIEW-AUTHORED SOURCE REVISION
      ↓
CLAIMS / CONFIRMATION / CONFLICT RESOLUTION
      ↓
NEW PROCESS REVISION
      ↓
NEW VALIDATION ASSESSMENT
      ↓
BASELINE TRANSITION CANDIDATE
      ↓
RECONCILIATION + DECISION
      ↓
NEW REVIEW WORKSPACE REVISION
      ↓
NEW PROJECTION
```

---

# 2. Read side vs write side

## Read side

```text
ReviewProjectionService
```

Consumes:

```text
ReviewWorkspaceRevision
ProcessRevision
ValidationAssessment
SemanticClaims / ProvenanceLinks
SourceOccurrences / EvidenceFragments
ReviewAuthoredSourceRevision
```

Produces:

```text
ReviewProjectionRevision
```

It has no authority to mutate source/canonical/validation records.

## Write side

```text
ReviewActionService
```

Accepts explicit semantic commands from the reviewer.

Produces:

```text
ReviewAuthoredSourceRevision
ReviewAction
```

and delegates later semantic processing through the same normalization/provenance/validation boundaries used elsewhere.

UI drag/drop/render events are not semantic commands automatically.

---

# 3. Projection is a materialized review model

The projection layer owns only:

```text
projection identity
visual grouping
layout
review badges/overlays
bindings to semantic/evidence subjects
interaction affordances
```

It does not own:

```text
source truth
canonical identity
truth class
confidence authority
validation truth
business rule authority
execution semantics
```

Those are read from upstream contracts.

---

# 4. Workspace versioning boundary

Stable identity:

```text
ReviewWorkspaceDefinition
```

Immutable context:

```text
ReviewWorkspaceRevision
```

A workspace revision pins:

```text
baseline ProcessRevision
baseline ValidationAssessment
active review-authored source revision
source/adapter context
projection revision
```

This prevents baseline mutation and gives exact historical reproducibility.

---

# 5. Projection subject abstraction

The projection engine must not assume every visible item is canonical.

Supported subject families:

```text
canonical process element
source occurrence
source relationship occurrence
semantic claim
conflict record
validation finding
candidate semantic scope
source artifact
```

This is necessary for:

```text
ambiguous image edges
notation-specific functional relationships
unresolved source evidence
conflicts
validation overlays
```

before canonicalization is safe.

---

# 6. Multi-origin bindings

`ProjectionBinding` is many-to-many.

```text
one visible review item
  ← canonical semantic subject
  ← BPMN source occurrence
  ← SOP text span
  ← runtime evidence
  ← reviewer confirmation
```

The UI may summarize this graph, but the architecture must preserve all origin references.

No `primary source` is fabricated unless an authority/resolution rule establishes one.

---

# 7. Review-authored source boundary

Review semantic commands produce a separate source lineage.

Logical source profile:

```text
origin: TALOS-native/human-authored review expression
artifact: TALOS review/canvas evidence
perspective: BUSINESS_INTENT when appropriate
capture/representation: native structured review action revision
```

Authority is separate from source type.

The imported source is never updated by this write path.

---

# 8. Semantic correction processing

Conceptual pipeline:

```text
ReviewAction
      ↓
ReviewAuthoredSourceRevision
      ↓
SemanticClaim / ConfirmationRecord / Conflict resolution evidence
      ↓
Canonical normalization / merge
      ↓
ProcessRevision candidate B
      ↓
SemanticValidator
      ↓
ValidationAssessment B
```

Only then can B be proposed as the next review baseline.

No UI edit directly writes canonical nodes.

---

# 9. Baseline transition service

Conceptual boundary:

```text
ReviewBaselineService
```

Responsibilities:

1. observe a candidate ProcessRevision;
2. create `BaselineTransitionCandidate`;
3. compare it with current workspace revision;
4. create `BaselineReconciliationAnalysis`;
5. collect/record explicit transition decision;
6. create a new `ReviewWorkspaceRevision` on acceptance.

It never mutates an existing workspace revision.

---

# 10. Adapter reinterpretation

When the same source is reinterpreted by another adapter/version:

```text
preserved source
→ AdapterAttempt v2
→ candidate claims / ProcessRevision C
```

Review workspace behavior:

```text
current baseline A remains active
C becomes BaselineTransitionCandidate
```

Existing reviewer evidence is included in reconciliation analysis.

No freshness rule may silently prefer C over A or over reviewer-confirmed meaning.

---

# 11. Additional source merge

When a new source is added:

```text
SOP / BPMN / image / runtime evidence
→ independent intake/adapter lineage
→ claims
→ merge candidate
→ ProcessRevision C
→ baseline transition candidate
```

The same transition mechanism handles cross-adapter enrichment without special-case mutation.

---

# 12. Presentation transaction

Presentation-only operations remain inside projection storage/state.

Examples:

```text
MOVE_ITEM
RESIZE_ITEM
CHANGE_ZOOM
COLLAPSE_GROUP
SET_VIEWPORT
OPEN_EVIDENCE_PANEL
```

They may create a new `ReviewProjectionRevision` but do not invoke semantic normalization or validation.

---

# 13. Semantic command transaction

Semantic operations must be explicit:

```text
CONFIRM
CORRECT_PROPERTY
REJECT_INTERPRETATION
ADD_PROCESS_ELEMENT
ADD_RELATIONSHIP
MARK_UNKNOWN
RESOLVE_CONFLICT
APPLY_SUGGESTION
```

The front-end must not infer semantic commands from raw rendering-library events.

---

# 14. Failure isolation

```text
projection generation failure
→ source/canonical/provenance/validation remain valid

review action persistence failure
→ imported source remains valid

normalization failure after review action
→ review-authored source remains valid

validation blocker
→ candidate ProcessRevision remains explainable but baseline need not advance

baseline reconciliation failure
→ existing workspace revision remains active
```

Review is recoverable and non-destructive.

---

# 15. Future source-family compatibility

The projection architecture must work regardless of source adapter:

```text
TalosCanvasAdapter
BpmnAdapter
ImageProcessAdapter
LanguageDocumentAdapter
AutomationAdapter
RuntimeAdapter
```

because it consumes common:

```text
source evidence
claims/provenance
canonical semantics
validation
```

rather than adapter-private UI models.

---

# 16. P2-01B architecture gate

Pass only if R01–R14 prove:

```text
original source preservation
review projection separation
source-only reviewability
multi-source bindings
review-authored provenance
non-destructive correction/rejection
presentation/semantic split
immutable review workspace revisions
explicit adapter-reinterpretation reconciliation
new ProcessRevision + Assessment + projection lineage
```

BUILD remains closed.
