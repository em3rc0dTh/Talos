# TALOS — Canvas Review / Projection Contract v0.1

Status: **DESIGN CANDIDATE / P2-01B PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

The TALOS Canvas has two different semantic roles:

```text
ROLE 1 — NATIVE AUTHORING
"Create my process here."

ROLE 2 — REVIEW / CORRECTION
"Show me what you understood from my source and let me correct it."
```

Native authoring is already covered by:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
```

This contract defines **ROLE 2**.

The review Canvas is a projection of preserved source evidence, canonical interpretation, provenance and validation state. It is not the original source and is not allowed to mutate the original source merely because the user edits what is shown.

---

# 1. Fundamental invariants

```text
REVIEW CANVAS                    ≠ ORIGINAL SOURCE
REVIEW PROJECTION                ≠ CANONICAL PROCESS REVISION
PROJECTED ELEMENT                ≠ NEW SOURCE OCCURRENCE AUTOMATICALLY
LAYOUT CHANGE                    ≠ SEMANTIC CORRECTION
USER CONFIRMATION                ≠ SOURCE REWRITE
USER CORRECTION                  ≠ SOURCE REWRITE
USER REJECTION                   ≠ SOURCE DELETION
USER-ADDED MEANING               = NEW TALOS/HUMAN EVIDENCE
MULTIPLE SOURCE ORIGINS          ≠ ONE FABRICATED ORIGIN
INFERRED CLAIM                   ≠ SOURCE TRUTH AFTER RENDERING
SUGGESTED ELEMENT                ≠ ACCEPTED MEANING AFTER RENDERING
SOURCE-ONLY EVIDENCE             MAY BE REVIEWABLE WITHOUT CANONICAL ELEMENT
VALIDATION FINDING               MAY BE PROJECTED WITHOUT BECOMING PROCESS NODE
PROJECTION REGENERATION          ≠ HISTORICAL MUTATION
```

The core review rule is:

> TALOS may project imported interpretation into Canvas, but the projection is a **review surface**, not a provenance laundering step.

---

# 2. Review lineage

```text
EXTERNAL SOURCE ORIGIN
        ↓
SourceCapture / SourceRepresentation
        ↓
AdapterAttempt / SourceEvidenceGraph
        ↓
SemanticClaim(s)
        ↓
Canonical ProcessRevision A
        ↓
ValidationAssessment A
        ↓
ReviewProjectionRevision 1
        ↓
USER REVIEW ACTIONS
        ↓
ReviewAuthoredSourceRevision 1
        ↓
new claims / confirmations / dispositions
        ↓
Canonical ProcessRevision B
        ↓
ValidationAssessment B
        ↓
ReviewProjectionRevision 2
```

The external source lineage remains immutable throughout.

---

# 3. ReviewWorkspace

A review workspace pins one review context to immutable semantic/evidence baselines.

```text
ReviewWorkspace
- id
- projectRef?
- createdAt
- createdBy?
- baselineProcessRevisionId
- baselineValidationAssessmentId?
- sourceArtifactIds[]
- sourceRepresentationIds[]
- adapterResultIds[]
- reviewAuthoredSourceDefinitionId
- latestProjectionRevisionId
- status?
```

The baseline is explicit.

A later source re-import or adapter reinterpretation does not silently replace `baselineProcessRevisionId`.

---

# 4. ReviewProjectionRevision

A projection revision is an immutable rendering model for review.

```text
ReviewProjectionRevision
- id
- reviewWorkspaceId
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

It is not a `ProcessRevision`.

It may change because:

```text
presentation changed
validation state changed through a new assessment
new review-authored evidence was accepted into a new ProcessRevision
projection rules/version changed
```

Historical projection revisions remain preserved where retained by product policy.

---

# 5. ProjectionIdentity and ProjectionItemSnapshot

The review surface has presentation identities independent from source and canonical identities.

```text
ProjectionIdentity
- id
- reviewWorkspaceId
- createdInProjectionRevisionId
- retiredInProjectionRevisionId?
```

```text
ProjectionItemSnapshot
- snapshotId
- projectionIdentityId
- projectionRevisionId
- itemKind
- displayLabel?
- displayProperties{}
- reviewState
- editability
- presentationHints?
```

Initial `itemKind`:

```text
PROCESS_ELEMENT
SOURCE_EVIDENCE
SOURCE_RELATIONSHIP
VALIDATION_FINDING
CONFLICT
SUGGESTION
ANNOTATION
GROUP
SOURCE_DEFINED
```

`reviewState` is derived from bound claims/provenance/validation rather than becoming a new truth class.

Possible display states include:

```text
SOURCE
INFERRED
SUGGESTED
CONFIRMED
CONFLICTED
UNRESOLVED
VALIDATED
BLOCKED
```

These are UI/review states, not replacements for frozen `TruthClass` or `ExecutionReadiness`.

---

# 6. ProjectionSubjectRef

A projected item may represent more than a canonical node.

```text
ProjectionSubjectRef
- subjectKind
- subjectRef
- propertyPath?
```

`subjectKind`:

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

This allows TALOS to review evidence that has not safely normalized into a canonical element.

---

# 7. ProjectionBinding

```text
ProjectionBinding
- id
- projectionRevisionId
- projectionIdentityId
- subjectRefs[]
- bindingRole
- provenanceRefs[]
- sourceOriginRefs[]
```

`bindingRole`:

```text
PRIMARY_SEMANTIC
SUPPORTING_EVIDENCE
UNRESOLVED_EVIDENCE
CONFLICTING_EVIDENCE
VALIDATION_OVERLAY
SUGGESTION_OVERLAY
SOURCE_DEFINED
```

Cardinality is intentionally many-to-many.

Examples:

```text
one canonical node
← evidence from BPMN + SOP + runtime observation
```

and:

```text
one source occurrence
→ several property-scoped claims
→ one or more review projections
```

No projection binding collapses source identities.

---

# 8. Projection of source-only evidence

A source occurrence may be important for review even when no canonical element exists.

Example:

```text
image edge detected
source endpoint known
target endpoint ambiguous
```

Review Canvas may show:

```text
SOURCE_RELATIONSHIP
state: UNRESOLVED
```

bound to the source relationship occurrence and validation finding.

It must not fabricate a canonical `ProcessEdge` merely so the UI can render it.

---

# 9. ReviewAuthoredSourceDefinition

Semantic review actions are themselves evidence.

TALOS therefore preserves them as a new TALOS-native/human-authored source lineage rather than editing the imported source.

```text
ReviewAuthoredSourceDefinition
- id
- reviewWorkspaceId
- sourceOriginId
- sourceArtifactId
- latestRevisionId
- createdAt
- createdBy?
```

Recommended provenance classification:

```text
SourceOrigin.originKind = TALOS_NATIVE or HUMAN_EXPRESSION
SourceOrigin.mediumKind = TALOS_CANVAS
SourceArtifact.artifactClass = TALOS_CANVAS
EvidencePerspective = BUSINESS_INTENT when the user is acting with business authority
```

Authority must still be recorded independently; using the Canvas does not make a user authoritative automatically.

---

# 10. ReviewAuthoredSourceRevision

```text
ReviewAuthoredSourceRevision
- id
- reviewAuthoredSourceDefinitionId
- revisionNumber
- parentRevisionId?
- createdAt
- createdBy?
- baseProjectionRevisionId
- baseProcessRevisionId
- reviewActionIds[]
- semanticDigest
```

This is a native structured record of **what the reviewer asserted/corrected**, not a copy of the imported source.

---

# 11. ReviewAction

```text
ReviewAction
- id
- reviewAuthoredSourceRevisionId
- actionKind
- targetSubjectRefs[]
- assertedPropertyPath?
- assertedValue?
- rationale?
- authorityRef?
- authoredBy?
- authoredAt
- truthIntent
```

Initial `actionKind`:

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

`truthIntent` expresses the requested semantic effect, not an automatic truth-class promotion.

The accepted result may create:

```text
SemanticClaim
ConfirmationRecord
ConflictRecord resolution
FindingDisposition
TransformationRecord(CANVAS_EDIT / HUMAN_CONFIRMATION)
new ProcessRevision
```

according to authority and frozen Phase-1 contracts.

---

# 12. Confirmation vs correction

## Confirmation

```text
external source claim: actor = Manager [INFERRED]
reviewer confirms Manager
```

Results:

```text
original inferred claim remains
new confirmation evidence is added
new accepted claim/revision may become CONFIRMED
```

The original source does not change.

## Correction

```text
external source label interpreted as "Check order"
reviewer corrects meaning to "Validate purchase order"
```

Results:

```text
original source literal remains
original interpretation claim remains
new review-authored claim asserts corrected meaning
new ProcessRevision may select corrected value
```

No history is erased.

---

# 13. Rejecting/removing imported meaning

When a user deletes/rejects a projected imported element, TALOS must not delete the underlying source occurrence.

Model it as review evidence:

```text
ReviewAction
kind = REJECT_INTERPRETATION or RETIRE_PROCESS_MEANING
```

Possible later canonical result:

```text
ProcessRevision B no longer contains/uses that canonical meaning
```

but provenance can still answer:

```text
why Revision A contained it
which source supported it
who later rejected it
why Revision B changed
```

---

# 14. Adding net-new meaning

If the reviewer adds a brand-new process element absent from imported evidence:

```text
ADD_PROCESS_ELEMENT
```

its provenance is review-authored/TALOS-native.

It must not inherit the external source's origin.

Example:

```text
uploaded BPMN contains:
Receive → Validate → Pay

reviewer adds:
Manager approval
```

Then:

```text
Receive / Validate / Pay
→ external BPMN provenance

Manager approval
→ review-authored provenance
```

A later ProcessRevision may contain all four while keeping mixed origins explicit.

---

# 15. Multi-source canonical meaning

One projected process element may have evidence from several origins.

Example:

```text
Canonical ACTION "Validate order"
  ← BPMN occurrence
  ← SOP text span
  ← runtime observation
```

Projection must surface multiple evidence origins rather than choose one merely for visual simplicity.

User confirmation adds another evidence/authority layer; it does not replace the earlier origins.

---

# 16. Conflict projection

If two sources conflict materially:

```text
BPMN: approval threshold = 10,000
SOP:  approval threshold = 5,000
```

Review Canvas may display one semantic subject with a `CONFLICT` overlay and both claim origins.

It must not preselect one value unless a frozen conflict-resolution record supports that choice.

A reviewer action may resolve the conflict only when authority rules allow it.

---

# 17. Validation projection

Validation findings may be visualized next to their affected semantic/source subjects.

Example:

```text
Decision NO branch target unresolved
```

The finding is an overlay, not a process node.

User resolution follows:

```text
Finding
→ ClarificationQuestion/ReviewAction
→ review-authored evidence
→ new ProcessRevision
→ new ValidationAssessment
```

Old findings remain historical snapshots.

---

# 18. Presentation-only review edits

A reviewer may:

```text
move nodes
zoom
collapse groups
change local layout
open/close evidence panels
```

without making a semantic assertion.

These operations create projection/presentation state only.

They do not create:

```text
ReviewAction semantic assertions
SemanticClaims
ProcessRevision
```

unless the product explicitly exposes a semantic command.

---

# 19. Projection generation boundary

Conceptual service:

```text
projectForReview(
  processRevisionId,
  validationAssessmentId?,
  sourceEvidenceRefs[],
  projectionPolicyVersion
)
```

Output:

```text
ReviewProjectionRevision
```

Projection logic may decide how to display semantics/evidence but cannot change their truth/provenance.

---

# 20. Regeneration after accepted semantic change

```text
Projection Revision 1
        ↓
ReviewAuthoredSourceRevision 1
        ↓
new ProcessRevision B
        ↓
new ValidationAssessment B
        ↓
Projection Revision 2
```

Projection Revision 2 must preserve linkage back to:

```text
ProcessRevision B
review-authored evidence
original source evidence
```

Projection 1 remains historically explainable.

---

# 21. Adapter reinterpretation boundary

A future adapter version may reinterpret the same preserved source and produce another candidate semantic revision.

This v0.1 contract requires:

```text
new adapter attempt/result
new candidate claims/revision
no mutation of existing source or historical projection
```

A review workspace remains pinned to its explicit baseline until the product deliberately chooses another baseline.

The exact reconciliation/rebase contract between an existing review workspace and a later adapter interpretation is left for pressure testing.

---

# 22. Review UX provenance requirements

For each projected semantic subject TALOS should be able to expose, when available:

```text
what TALOS currently understands
truth class
confidence
source origin(s)
source evidence fragment(s)
interpretation version
conflict state
validation finding(s)
review-authored corrections/confirmations
```

The UI need not display all metadata at once, but the information must remain addressable.

---

# 23. Imported projection anti-goals

Do not:

- copy imported canonical nodes into a new Canvas source and pretend they originated there;
- overwrite the external source when the reviewer edits a projection;
- promote `INFERRED` to `SOURCE_TRUTH` merely because it is displayed;
- delete source occurrences when the reviewer rejects their interpretation;
- force source-only ambiguous evidence into canonical nodes/edges for rendering;
- hide multi-source provenance behind one arbitrary source badge;
- convert validation findings into process nodes;
- treat presentation edits as semantic confirmations;
- silently replace a review baseline when an adapter reruns;
- generate Temporal semantics from review rendering.

---

# 24. P2-01B pressure-test target

The contract must survive at minimum:

```text
R01 imported canonical node retains source provenance
R02 inferred visual interpretation remains inferred when projected
R03 reviewer corrects projected property without source rewrite
R04 reviewer rejects/removes imported interpretation without source deletion
R05 canonical element backed by multiple sources
R06 reviewer adds net-new process element with TALOS-native provenance
R07 presentation-only edit does not change semantic revision
R08 source-only unresolved evidence can be projected
R09 dangling/ambiguous relationship remains unresolved
R10 confirmation adds authority/history without rewriting inference
R11 material source conflict remains visible until resolution
R12 adapter reinterpretation does not silently replace active review baseline
R13 functional/non-workflow source can be reviewed without forced workflow semantics
R14 correction produces new ProcessRevision + reassessment + projection
```

BUILD remains closed throughout P2-01B.
