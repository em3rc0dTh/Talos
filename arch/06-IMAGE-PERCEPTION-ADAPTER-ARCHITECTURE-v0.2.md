# TALOS — Image / Perception Adapter Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / P2-03 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active P2-03 architecture: `06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.1.md`

Target design:

```text
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.2.md
```

## Why v0.2 exists

Initial pressure test:

```text
I01–I28
27 PASS / 1 FAIL
```

Failure I27 exposed that model alternatives and later human resolution must not share mutable state.

v0.2 adds a dedicated immutable resolution boundary:

```text
PerceptionAlternativeSet
        ↓ remains immutable model output
PerceptionAlternativeDecision
        ↓
Confirmation / SemanticClaim / ReviewAction
        ↓
new ProcessRevision where meaning changes
```

---

# 1. End-to-end architecture

```text
SOURCE ORIGIN
      ↓
CAPTURE / SOURCE REPRESENTATION
      ↓
SOURCE PRESERVATION COMMIT
      ↓
OPTIONAL DERIVATIVE REPRESENTATION
      ↓
AdapterAttempt(VISUAL_PERCEPTION)
      ↓
PERCEPTION OBSERVATIONS / ALTERNATIVES
      ↓
SOURCE EVIDENCE GRAPH
      ↓
CANDIDATE SEMANTIC SCOPE(S)
      ↓
CANONICAL NORMALIZATION
      ↓
PROVENANCE / CLAIMS
      ↓
SEMANTIC VALIDATION
      ↓
CANVAS REVIEW
```

Human correction/confirmation is a separate write path.

---

# 2. Source preservation boundary

Preserve before perception:

```text
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation
SourceAvailabilityRecord
```

Perception/preprocessing failures do not roll back preserved source evidence.

---

# 3. Derived-representation boundary

Conceptual service:

```text
VisualRepresentationService
```

May create explicit derivative representations for:

```text
crop
rotation
deskew
perspective correction
contrast/resolution normalization
```

Each derivative has:

```text
RepresentationTransform
```

and new byte identity.

---

# 4. Perception attempt boundary

Conceptual adapter:

```text
ImagePerceptionAdapter
```

Every run creates one immutable common `AdapterAttempt` plus image-family observations/results.

Model/pipeline version changes create new attempts.

---

# 5. Perception-domain components

```text
ImageCoordinateSpace
VisualEvidenceAnchor
RepresentationTransform
PerceptionObservation
PerceptionAlternativeSet
PerceptionAlternativeDecision
PerceptionRelationCandidate
PerceptionInterpretationDependency
VisualCorrespondenceClaim
```

They integrate through common `sourceExtensionRefs` and provenance links.

---

# 6. Perception read history

`PerceptionAlternativeSet` is a read-only record of one attempt's alternatives and optional model preference.

It answers:

```text
What alternatives did this model/run produce?
What did the model prefer at that moment?
What local evidence/confidence supported each alternative?
```

It has no mutable human-selection state.

---

# 7. Human/authority resolution boundary — new in v0.2

Conceptual service:

```text
PerceptionResolutionService
```

Consumes:

```text
PerceptionAlternativeSet
explicit authority/user action
```

Produces immutable:

```text
PerceptionAlternativeDecision
```

and, when semantic authority is sufficient:

```text
ConfirmationRecord
SemanticClaim
ReviewAuthoredSourceRevision / ReviewAction where applicable
```

The service cannot update the perception attempt/set.

---

# 8. Historical resolution lifecycle

```text
Attempt A
  ↓
AlternativeSet S
model prefers X
  ↓
Human later confirms Y
  ↓
Decision D1(select Y)
  ↓
Confirmation / claim
  ↓
ProcessRevision B
```

Later another authority disagrees:

```text
new decision/conflict/claim history
```

not:

```text
rewrite S or D1
```

---

# 9. Addressability architecture

All material visual evidence resolves through:

```text
VisualEvidenceAnchor
→ ImageCoordinateSpace
→ SourceRepresentation
→ SourceCapture
→ SourceOrigin
```

This supports pixel-region evidence panels and exact derivative lineage.

---

# 10. Observation/materialization boundary

`PerceivedOccurrenceMaterializer` converts sufficiently addressable observations into common source occurrence/relationship descriptors.

Materialization does not imply confirmation.

Existence/type/label remain claims with truth/confidence/provenance.

---

# 11. Relationship uncertainty boundary

`PerceptionRelationCandidate` independently preserves:

```text
stroke existence
source endpoint candidates
target endpoint candidates
direction candidates
role alternatives
guard text evidence
```

No canonical edge is fabricated from unresolved visual endpoints.

---

# 12. Visibility/absence boundary

Image interpretation explicitly distinguishes:

```text
visible
partially visible
low legibility
obscured
out-of-frame candidate
unknown
```

No detected continuation does not prove process termination.

---

# 13. Plane/artifact classification

Visual plane/artifact classification remains inferred and evidence-backed.

It can preserve:

```text
BUSINESS_GRAPH
AUTHORING_CONTEXT
COLLABORATOR_OVERLAY
ARCHITECTURE_TOPOLOGY
FUNCTIONAL_MODEL
...
```

and artifact families such as:

```text
REFERENCE_ARCHITECTURE
PROCESS_DIAGRAM
FUNCTIONAL_MODEL
MIXED_ARTIFACT
UNKNOWN
```

before process-scope assumptions.

---

# 14. Conditional geometry semantics

`PerceptionInterpretationDependency` records semantic claims that depend on classification/notation hypotheses.

Q12 example:

```text
ICOM-like hypothesis + top attachment
→ FUNCTION_CONTROL candidate
```

Geometry never becomes a universal semantic rule.

---

# 15. Multi-representation boundary

Each representation is perceived independently.

Cross-representation equivalence requires explicit `VisualCorrespondenceClaim`.

No automatic source-occurrence identity collapse across photo/scan/screenshot.

---

# 16. Re-perception boundary

```text
representation R
  ├── attempt A / model v1
  └── attempt B / model v2
```

Both remain immutable.

If B proposes different accepted process meaning, frozen Canvas Review baseline reconciliation handles adoption.

---

# 17. Canvas review integration

Read side can show:

```text
canonical items
source-only visual candidates
alternative readings
model preference
human resolution records
local image regions
confidence/truth class
diagnostics/conflicts/findings
```

Write side uses ReviewAction/ReviewAuthoredSourceRevision and never edits image/perception history.

---

# 18. Failure isolation

```text
source preservation failure        → no false preserve claim
preprocessing failure              → original source survives
perception failure                 → preserved source survives
partial region failure             → partial result may survive
normalization failure              → source/perception survives
validation blocker                 → explainable, not executable
review failure                     → upstream truth survives
```

---

# 19. Common source-intake compatibility

Image specialization remains behind frozen common boundaries:

```text
AdapterAttempt
AdapterResult
ArtifactClassification
SourceEvidenceGraph
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
CandidateSemanticScope
InterpretationClaimSet
```

No private Canonical/Temporal path.

---

# 20. Architecture gate

Must pass full I01–I28 regression, especially:

```text
I27 — human resolution does not mutate perception set
I28 — reviewer correction survives later perception
```

BUILD remains closed.
