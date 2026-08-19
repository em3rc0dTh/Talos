# TALOS — Image / Perception Adapter Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / P2-03 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target design:

```text
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.1.md
```

## 1. Architectural statement

```text
SOURCE ORIGIN
      ↓
CAPTURE / IMAGE REPRESENTATION
      ↓
SOURCE PRESERVATION COMMIT
      ↓
AdapterAttempt(VISUAL_PERCEPTION)
      ↓
PERCEPTION LAYER
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
CANVAS REVIEW / CORRECTION
```

The image adapter never receives permission to write directly to Temporal or to treat model recognition as source-confirmed meaning.

---

# 2. Boundary A — source preservation

Before perception:

```text
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation
SourceAvailabilityRecord
```

are established/preserved.

Examples:

```text
paper drawing → photo
native digital canvas → screenshot
native digital image → direct upload
```

A perception exception cannot roll back preserved source evidence.

---

# 3. Boundary B — representation preprocessing

Preprocessing is explicit derivative generation, not hidden mutation.

Conceptual service:

```text
VisualRepresentationService
```

May produce:

```text
crop
rotation
deskew
perspective correction
contrast derivative
resolution derivative
```

Each output is a distinct derived `SourceRepresentation` with `RepresentationTransform` lineage.

No preprocessing step may overwrite the source representation or inherit its byte hash.

---

# 4. Boundary C — perception attempt

Conceptual adapter:

```text
ImagePerceptionAdapter
```

One invocation creates frozen common:

```text
AdapterAttempt
```

with:

```text
sourceRepresentationId
adapterVersion
perception pipeline/model configuration
inputFingerprint
status
diagnostics
```

Perception output is immutable per attempt.

A new model/version produces a new attempt.

---

# 5. Perception-domain layer

Image-specific data is held in a source-family specialization layer rather than inserted into canonical types.

Logical families:

```text
ImageCoordinateSpace
RepresentationTransform
VisualEvidenceAnchor
PerceptionObservation
PerceptionAlternativeSet
PerceptionRelationCandidate
PerceptionInterpretationDependency
VisualCorrespondenceClaim
```

These are linked into frozen common intake via `sourceExtensionRefs` and into frozen provenance via evidence fragments/claims/transformation records.

---

# 6. Observation pipeline

Conceptual stages:

```text
REGION / LAYOUT DETECTION
        ↓
TEXT / SHAPE / CONNECTOR OBSERVATION
        ↓
LOCAL ALTERNATIVES
        ↓
PLANE / ARTIFACT INTERPRETATION
        ↓
OCCURRENCE / RELATIONSHIP CANDIDATES
        ↓
SEMANTIC CLAIMS
        ↓
SCOPE DISCOVERY
```

The architecture does not require these stages to be implemented by separate models.

It requires their outputs/lineage to remain distinguishable where semantically material.

---

# 7. Addressability

Every material perception result points to:

```text
VisualEvidenceAnchor
      ↓
ImageCoordinateSpace
      ↓
SourceRepresentation
```

A local claim can therefore answer:

```text
Which representation?
Which region/polyline/mask?
Which model/version?
Which pipeline stage?
Which confidence?
Which later semantic claim depended on it?
```

---

# 8. Coordinate/transform service

Conceptual boundary:

```text
VisualAnchorResolver
```

Responsibilities:

- resolve anchor coordinates in their own representation;
- trace derivative anchors through representation-transform lineage;
- avoid pretending transformed coordinates are native coordinates;
- support review UI evidence highlighting against the correct representation.

No global coordinate system is required across unrelated representations.

---

# 9. Occurrence materialization policy

Conceptual service:

```text
PerceivedOccurrenceMaterializer
```

Consumes observations/hypotheses and creates common:

```text
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
```

when there is enough evidence to address a distinct candidate occurrence/relationship.

Important:

```text
materialization ≠ confirmation
```

Existence/type/label remain property-scoped inferred claims.

Low-confidence alternatives can remain only in the perception layer and still be reviewable.

---

# 10. Relationship architecture

A raster connector is decomposed into independent properties:

```text
stroke existence
source endpoint
target endpoint
direction
line style
guard text
relationship role
```

`PerceptionRelationCandidate` owns visual alternatives.

Common `SourceRelationshipDescriptor` receives only the safely addressable relation state plus extension refs.

Canonical edges are created only when normalization requirements are satisfied.

---

# 11. Visibility/coverage architecture

The adapter distinguishes:

```text
VISIBLE
PARTIALLY_VISIBLE
LOW_LEGIBILITY
OBSCURED
OUT_OF_FRAME_CANDIDATE
UNKNOWN
```

This prevents a common visual error:

```text
no detected continuation
→ fake END
```

The semantic validator may later report incomplete completion/topology instead.

---

# 12. Plane-segmentation architecture

Conceptual service:

```text
VisualPlaneClassifier
```

Candidates map to frozen source planes:

```text
BUSINESS_GRAPH
AUTHORING_CONTEXT
COLLABORATOR_OVERLAY
NOTATION_ANNOTATION
ARCHITECTURE_TOPOLOGY
FUNCTIONAL_MODEL
OBJECT_DATA
...
```

Plane classification is claim-based and confidence-scoped.

The adapter may retain overlapping hypotheses rather than forcing one plane assignment.

---

# 13. Artifact/scope discovery

Conceptual sequence:

```text
visual evidence
→ ArtifactClassification candidate(s)
→ SourceEvidenceGraph
→ CandidateSemanticScope(s)
```

This deliberately lets Q06 become:

```text
REFERENCE_ARCHITECTURE
→ ARCHITECTURE_SCOPE
→ optional 0..N executable-slice candidates
```

rather than one fabricated workflow.

---

# 14. Interpretation dependencies

Some semantic claims are conditional on other interpretations.

Q12 example:

```text
functional-model classification
+ ICOM-like notation hypothesis
+ top-side attachment observation
→ FUNCTION_CONTROL role candidate
```

`PerceptionInterpretationDependency` records this dependency.

A newer attempt may create a different dependent claim set; old dependencies remain immutable evidence.

---

# 15. Multi-representation architecture

Perception is representation-scoped.

```text
photo A → attempt A → occurrences A
scan B  → attempt B → occurrences B
```

Potential equivalence is represented by explicit `VisualCorrespondenceClaim`.

No auto-collapse based on geometry/text similarity is permitted.

Cross-representation merge remains a later claim/normalization operation with provenance.

---

# 16. Re-perception architecture

```text
same representation
  ├── adapter/model v1 → AdapterResult A
  └── adapter/model v2 → AdapterResult B
```

B is not a mutation or automatic supersession of A.

If the result is attached to an active review workspace:

```text
candidate ProcessRevision
→ Canvas Review BaselineTransitionCandidate
→ BaselineReconciliationAnalysis
→ explicit decision
```

Newer model freshness does not outrank user-confirmed business meaning.

---

# 17. Canvas review read model

The frozen review architecture can project:

```text
canonical elements
source-only perceived occurrences
ambiguous relation candidates
alternative text readings
confidence/truth class
source evidence regions
conflicts
validation findings
```

Evidence highlighting resolves back to the representation/anchor used by the perception attempt.

Canvas does not become the origin.

---

# 18. Canvas review write model

User semantic correction is not written into perception observations.

```text
ReviewAction
→ ReviewAuthoredSourceRevision
→ new claim/confirmation/resolution
→ new ProcessRevision
→ new assessment
→ explicit workspace baseline transition
```

Original perception observations and imported image bytes remain unchanged.

---

# 19. Failure isolation

```text
preprocessing failure
→ original source representation survives

perception failure
→ source survives; AdapterAttempt FAILED/PARTIAL

one-region perception failure
→ other evidence may remain useful

scope-discovery failure
→ perception/source graph may remain valid

normalization failure
→ source/perception evidence remains valid

validation blocker
→ process remains explainable but not ready

review projection failure
→ semantic/provenance state remains valid
```

---

# 20. Security/privacy boundary

Image sources may contain:

```text
PII
secrets
customer names
screenshots of private systems
```

Perception may preserve the source without copying sensitive text into canonical semantics automatically.

Specific redaction/storage policies remain later implementation concerns, but source evidence access and canonical projection are distinct boundaries.

---

# 21. Versioning boundary

Version separately:

```text
ImagePerceptionAdapter
perception pipeline
model(s)
artifact/plane classifier
image semantic mapping registry
normalization mapping where applicable
```

The `inputFingerprint` captures semantic configuration material to deterministic interpretation/replay.

---

# 22. Common-contract compatibility

Image specialization must ultimately produce/consume common families:

```text
SourceIntakeSession
AdapterAttempt
AdapterDiagnostic
AdapterResult
ArtifactClassification
SourceEvidenceGraph
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
CandidateSemanticScope
InterpretationClaimSet
SemanticClaim / ProvenanceLink
ProcessRevision
ValidationAssessment
```

This is the same boundary used by Canvas/BPMN.

---

# 23. No runtime leakage

The image/perception layer does not decide:

```text
Temporal Activity
Signal
Update
Timer implementation
Task Queue
retry policy
integration provider
n8n workflow
```

A perceived `Send email` box remains business/source meaning until later capability/execution phases.

---

# 24. P2-03 architecture gate

Pass only if the fixture suite proves:

```text
origin/capture distinction
local visual addressability
transform lineage
local confidence/alternatives
endpoint/role uncertainty
visibility vs absence
plane separation
artifact classification before process assumption
0..N scopes
notation-dependent geometry
multi-representation identity discipline
immutable re-perception
Canvas review compatibility
source preservation under failure
no Canonical/Temporal bypass
```

BUILD remains closed.
