# TALOS — Image / Perception Adapter Contract v0.2

Status: **DESIGN CANDIDATE / P2-03 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active P2-03 design: `12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial P2-03 pressure test:

```text
I01–I28
27 PASS
 1 FAIL
```

Failure:

```text
I27 — human resolution of perception alternatives is historical
```

v0.1 correctly preserved competing perception alternatives but allowed mutable-looking selection state on `PerceptionAlternativeSet`.

v0.2 makes perception outputs immutable and moves all later human/authority resolution into separate immutable decision/evidence records.

No frozen common contract is reopened.

---

# 1. Fundamental invariants

```text
PIXELS / CAPTURED BYTES             ≠ PERCEIVED STRUCTURE
PERCEIVED STRUCTURE                 ≠ INTERPRETED SEMANTICS
INTERPRETED SEMANTICS               ≠ CONFIRMED BUSINESS TRUTH
PHYSICAL ORIGINAL                   ≠ PHOTO BYTES
DIGITAL NATIVE MODEL                ≠ SCREENSHOT BYTES
SCREENSHOT                          ≠ NATIVE CANVAS GRAPH
VISIBLE REGION                      ≠ PROCESS REGION AUTOMATICALLY
VISIBLE SHAPE                       ≠ ACTIVITY AUTOMATICALLY
VISIBLE DIAMOND                     ≠ DECISION AUTOMATICALLY
VISIBLE CIRCLE                      ≠ END AUTOMATICALLY
VISIBLE ARROW                       ≠ SEQUENCE FLOW AUTOMATICALLY
TEXT DETECTION                      ≠ TEXT READING
TEXT READING                        ≠ NORMALIZED MEANING
SAME OCR LABEL                      ≠ SAME SOURCE OCCURRENCE
COLOR / STYLE                       ≠ SEMANTIC TYPE WITHOUT EVIDENCE
GEOMETRY                            ≠ UNIVERSAL SEMANTICS
OUT-OF-FRAME / OCCLUDED             ≠ PROVEN ABSENCE
LOW CONFIDENCE                      ≠ SOURCE REJECTION AUTOMATICALLY
PERCEPTION MODEL VERSION            ≠ AUTHORITY
NEW PERCEPTION RUN                  ≠ MUTATION OF OLD PERCEPTION
MODEL PREFERENCE                    ≠ HUMAN CONFIRMATION
PERCEPTION ALTERNATIVE SET          = IMMUTABLE ATTEMPT OUTPUT
HUMAN RESOLUTION                    ≠ PERCEPTION RECORD MUTATION
AI INFERENCE                        ≠ SOURCE_TRUTH AUTOMATICALLY
```

---

# 2. Provenance profile

Physical source:

```text
SourceOrigin(PHYSICAL_ARTIFACT)
→ SourceCapture(PHOTO_CAPTURE | SCAN_CAPTURE)
→ SourceRepresentation(CAPTURED_BYTES)
```

Digital native source shown only as screenshot:

```text
SourceOrigin(DIGITAL_NATIVE_ARTIFACT)
→ SourceCapture(SCREENSHOT_CAPTURE)
→ SourceRepresentation(CAPTURED_BYTES)
→ SourceAvailabilityRecord(NATIVE_STRUCTURED_MODEL = NOT_SUPPLIED/UNKNOWN)
```

Direct native image artifact may use:

```text
SourceRepresentation(NATIVE_DIGITAL)
```

Actual evidence determines the profile.

---

# 3. Adapter attempt

Use frozen `AdapterAttempt`:

```text
adapterId = ImagePerceptionAdapter
adapterVersion = versioned
extractionMode = VISUAL_PERCEPTION
```

Input fingerprint includes:

```text
representation digest
adapter/version
perception pipeline version
model/version set
semantic configuration digest
canonical model version where mapping depends on it
```

A newer model/version produces a new immutable attempt/result.

---

# 4. Perception layer

```text
SourceRepresentation
        ↓
ImageCoordinateSpace
        ↓
VisualEvidenceAnchor
        ↓
PerceptionObservation
        ↓
PerceptionAlternativeSet / PerceptionRelationCandidate
        ↓
SourceOccurrenceDescriptor / SourceRelationshipDescriptor
        ↓
SemanticClaim
        ↓
CandidateSemanticScope
```

Perception is a source-family interpretation layer, not source truth.

---

# 5. ImageCoordinateSpace

```text
ImageCoordinateSpace
- id
- sourceRepresentationId
- width
- height
- orientation
- coordinateBasis
- originConvention
- transformFromParentRepresentation?
- transformVersion?
```

`coordinateBasis`:

```text
PIXEL
NORMALIZED_0_1
SOURCE_DEFINED
```

---

# 6. RepresentationTransform

```text
RepresentationTransform
- id
- parentRepresentationId
- derivedRepresentationId
- transformKind
- transformParametersDigest?
- transformMatrix?
- deterministic?
- toolRef?
- toolVersion?
- createdAt
```

Examples:

```text
CROP
ROTATE
DESKEW
PERSPECTIVE_CORRECTION
CONTRAST_DERIVATIVE
RESOLUTION_DERIVATIVE
SOURCE_DEFINED
```

Derived representations never inherit parent byte identity.

---

# 7. VisualEvidenceAnchor

```text
VisualEvidenceAnchor
- id
- sourceRepresentationId
- coordinateSpaceId
- geometryKind
- geometry
- visibilityState
- clippingState?
- occlusionState?
- anchorDigest?
- notes?
```

`geometryKind`:

```text
POINT | BOX | POLYGON | POLYLINE | MASK | WHOLE_IMAGE | SOURCE_DEFINED
```

`visibilityState`:

```text
VISIBLE
PARTIALLY_VISIBLE
LOW_LEGIBILITY
OBSCURED
OUT_OF_FRAME_CANDIDATE
UNKNOWN
```

Non-observation in one frame does not prove absence from the source origin.

---

# 8. PerceptionObservation

```text
PerceptionObservation
- id
- adapterAttemptId
- sourceRepresentationId
- anchorId
- observationKind
- observedValue?
- confidence?
- modelRef
- modelVersion
- pipelineStage
- createdAt
- evidenceFragmentRef?
- alternativeSetRef?
- parentObservationRefs[]?
- notes?
```

Kinds may include:

```text
TEXT_REGION
TEXT_LITERAL_CANDIDATE
SHAPE_REGION
SHAPE_CLASS_CANDIDATE
CONNECTOR_STROKE
ARROWHEAD
CONNECTOR_ENDPOINT
CONTAINER_REGION
ICON_REGION
COLOR_STYLE
LINE_STYLE
SPATIAL_ATTACHMENT
PLANE_REGION
ANNOTATION_REGION
EDITOR_UI_REGION
CURSOR_PRESENCE
SOURCE_DEFINED
```

Observations are immutable after the adapter attempt completes.

---

# 9. PerceptionAlternativeSet — revised in v0.2

A set is immutable output from one perception attempt.

```text
PerceptionAlternativeSet
- id
- adapterAttemptId
- subjectObservationRef?
- propertyPath
- alternatives[]
- exclusivityMode
- modelPreferredAlternativeId?
- modelPreferenceConfidence?
- createdAt
```

Each alternative:

```text
PerceptionAlternative
- id
- value
- confidence?
- evidenceAnchorRefs[]
- supportingObservationRefs[]
- interpretationNotes?
```

`exclusivityMode`:

```text
MUTUALLY_EXCLUSIVE
NON_EXCLUSIVE
SOURCE_DEFINED
```

Rules:

```text
modelPreferredAlternativeId
      = model output/history
      ≠ accepted truth
      ≠ mutable human selection
```

The fields from v0.1:

```text
selectionState
selectedAlternativeId
selectionAuthorityRef
```

are removed from the active v0.2 model.

---

# 10. PerceptionAlternativeDecision — new in v0.2

Later human/authority handling is represented separately.

```text
PerceptionAlternativeDecision
- id
- alternativeSetId
- decisionKind
- selectedAlternativeIds[]
- rejectedAlternativeIds[]?
- authorityRef?
- decidedBy?
- rationale?
- decidedAt
- confirmationRecordRefs[]?
- semanticClaimRefs[]?
- resultingProcessRevisionRef?
- reviewActionRef?
```

`decisionKind`:

```text
CONFIRM_ALTERNATIVE
SELECT_INTERPRETATION
REJECT_ALL
KEEP_UNRESOLVED
DEFER
SOURCE_DEFINED
```

The decision is immutable.

A later disagreement creates another authority/claim/review record according to frozen provenance/conflict/review rules; it never edits the original perception set or decision.

---

# 11. Resolution lineage

Example:

```text
AdapterAttempt A
  ↓
PerceptionAlternativeSet S
modelPreferred = "Brainst"
  ↓
(no mutation)
  ↓
ReviewAction / human authority
  ↓
PerceptionAlternativeDecision D
selected = "Brainstorm"
  ↓
ConfirmationRecord / SemanticClaim
  ↓
ProcessRevision B if semantic meaning changes
  ↓
ValidationAssessment B
  ↓
Canvas baseline transition if active review workspace exists
```

Talos can answer both:

```text
What did the model originally think?
What did the human later confirm?
```

---

# 12. Literal text vs interpreted meaning

Keep separate property-level claims:

```text
text-region existence
literalText
normalizedText
interpretedMeaning
business semantic role
```

Human confirmation creates new confirmed evidence/claims; old inferred readings remain visible.

---

# 13. Perceived source occurrences

A perceived region may become `SourceOccurrenceDescriptor` when it is useful to address as a distinct candidate occurrence.

Required lineage:

```text
SourceOccurrenceDescriptor
→ existence/type/label claims
→ PerceptionObservation(s)
→ VisualEvidenceAnchor(s)
→ EvidenceFragment(s)
→ SourceRepresentation
```

Raster-only sources normally have no native source ID.

Talos-assigned source-occurrence identity is not misrepresented as a native source ID.

---

# 14. Repeated labels

Distinct visual anchors remain distinct occurrences unless equivalence is separately proven.

```text
same label ≠ same occurrence
```

Q08 repeated gateways and `Call back` nodes are regression examples.

---

# 15. PerceptionRelationCandidate

```text
PerceptionRelationCandidate
- id
- adapterAttemptId
- strokeObservationRefs[]
- relationAnchorRefs[]
- existenceConfidence?
- sourceEndpointCandidates[]
- targetEndpointCandidates[]
- directionCandidates[]
- roleAlternativeSetRef?
- guardTextObservationRefs[]
- lineStyleObservationRefs[]
- notes?
```

Endpoint candidate:

```text
PerceptionEndpointCandidate
- occurrenceCandidateRef?
- anchorRef?
- endpointState
- confidence?
```

States:

```text
SET_CANDIDATE
UNKNOWN
OUT_OF_FRAME
OCCLUDED
UNRESOLVED
SOURCE_DEFINED
```

Existence/endpoints/direction/role remain independently uncertain.

---

# 16. Common relationship materialization

Map safely addressable relation state into:

```text
SourceRelationshipDescriptor
```

and retain visual alternatives through `sourceExtensionRefs`.

Do not fabricate a definite endpoint/edge when candidates remain unresolved.

---

# 17. Visibility/absence discipline

Distinguish:

```text
visible element
no detection in visible region
low legibility
obscured region
possible continuation outside frame
```

Never infer process completion merely because no outgoing connector is detected.

---

# 18. Source-plane segmentation

Candidate planes use frozen concepts:

```text
AUTHORING_CONTEXT
COLLABORATOR_OVERLAY
NOTATION_ANNOTATION
BUSINESS_GRAPH
RESPONSIBILITY_COLLABORATION
OBJECT_DATA
ARCHITECTURE_TOPOLOGY
FUNCTIONAL_MODEL
ANALYTIC_SIMULATION
SOURCE_DEFINED
UNKNOWN
```

Plane assignment remains claim/confidence scoped.

---

# 19. Collaborative/editor overlays — Q10

```text
cursor visible            = image evidence
cursor → actor            = not established
proximity → ownership     = forbidden
editor chrome → process   = forbidden
```

UI/presence regions remain authoring/collaboration overlay evidence.

---

# 20. Artifact classification before process assumption — Q06

Visual artifact classification may be:

```text
REFERENCE_ARCHITECTURE
SERVICE_TOPOLOGY
FUNCTIONAL_MODEL
PROCESS_DIAGRAM
COLLABORATION_DIAGRAM
MIXED_ARTIFACT
UNKNOWN
```

A reference architecture may yield architecture scope(s) and 0..N executable-slice candidates without a whole-artifact process candidate.

---

# 21. Notation/geometry-dependent semantics — Q12

```text
functional-model classification
+ notation-family hypothesis
+ spatial attachment observation
→ relationship-role candidate
```

Represent dependency explicitly:

```text
PerceptionInterpretationDependency
- id
- dependentClaimRef
- prerequisiteClaimRefs[]
- dependencyKind
- rationale?
```

Kinds:

```text
REQUIRES_INTERPRETATION_CONTEXT
REQUIRES_ARTIFACT_CLASS
REQUIRES_NOTATION_HYPOTHESIS
REQUIRES_PLANE_CLASSIFICATION
SOURCE_DEFINED
```

No universal geometry rule is created.

---

# 22. Functional-model discipline — Q12

```text
FUNCTION BOX             ≠ ACTION automatically
MECHANISM/RESOURCE       ≠ process step
OUTPUT→INPUT DEPENDENCY  ≠ temporal sequence automatically
SOURCE DECOMPOSITION     ≠ runtime subprocess automatically
```

---

# 23. Composite text and surprising topology — Q11

A list inside one perceived shape does not automatically create multiple nodes.

Unexpected branches are preserved rather than repaired from business expectation.

---

# 24. Ambiguous long connectors — Q08

Stroke existence, endpoint certainty, direction and semantic role remain independently claimable.

A low-confidence endpoint does not invalidate high-confidence stroke evidence.

---

# 25. Metric/style overlays — Q06

Visual badges/style/metric overlays remain annotation/source metadata unless source evidence establishes stronger meaning.

No automatic conversion to routing, retry, SLA or state.

---

# 26. Multiple representations of one origin

Perception remains representation-scoped.

Potential equivalence requires explicit:

```text
VisualCorrespondenceClaim
```

with truth class/confidence/evidence.

No automatic source-occurrence collapse across photo/scan/screenshot representations.

---

# 27. Partial / unsafe perception

Valid partial state:

```text
AdapterAttempt = PARTIAL
AdapterResult exists
SourceEvidenceGraph partial
Diagnostics explain gaps
CandidateSemanticScope(s) may exist
```

If too degraded:

```text
source preserved
UNSAFE_TO_INTERPRET allowed
no fake process output
```

---

# 28. Re-perception / model upgrades

Each new perception model/version creates new immutable AdapterAttempt/result/claims.

If a later result affects an active review workspace:

```text
candidate ProcessRevision
→ BaselineTransitionCandidate
→ BaselineReconciliationAnalysis
→ explicit decision
```

Newer-model freshness does not outrank review-confirmed business meaning.

---

# 29. Canvas review compatibility

Canvas review can display:

```text
canonical meaning
source-only perceived occurrences
ambiguous relationships
alternative text readings
model preference
human decision history
confidence/truth class
image evidence anchors
classification uncertainty
validation findings/conflicts
```

Display does not transfer provenance ownership.

User corrections create review-authored lineage.

---

# 30. Candidate semantic scopes

Images may produce 0..N:

```text
PROCESS_CANDIDATE
COLLABORATION
PARTICIPANT_LOCAL_PROCESS
FUNCTIONAL_MODEL_SCOPE
ARCHITECTURE_SCOPE
EXECUTABLE_SLICE_CANDIDATE
NON_EXECUTABLE_CONTEXT
SOURCE_DEFINED
```

---

# 31. Truth discipline

Example property ladder:

```text
representation bytes                       preserved source evidence
shape exists                               INFERRED
shape class = diamond                      INFERRED
semantic type = decision                   INFERRED
literal text = "In stock?"                INFERRED
business meaning                           INFERRED
later human confirmation                   CONFIRMED via new record/claim
```

High confidence never upgrades perception-generated semantics to `SOURCE_TRUTH` automatically.

---

# 32. Diagnostics

Examples:

```text
LOW_TEXT_LEGIBILITY
AMBIGUOUS_TEXT_READING
AMBIGUOUS_SHAPE_TYPE
AMBIGUOUS_EDGE_EXISTENCE
AMBIGUOUS_EDGE_ENDPOINT
AMBIGUOUS_DIRECTION
AMBIGUOUS_RELATIONSHIP_ROLE
POSSIBLE_OUT_OF_FRAME_CONTINUATION
POSSIBLE_OCCLUSION
ARTIFACT_CLASS_UNCERTAIN
SOURCE_PLANE_UNCERTAIN
NATIVE_STRUCTURED_SOURCE_NOT_SUPPLIED
DERIVATIVE_TRANSFORM_APPLIED
UNSAFE_TO_INTERPRET_REGION
SOURCE_DEFINED
```

Diagnostics remain locally evidence-addressable.

---

# 33. Common-contract compatibility

Image-specialized structures flow through:

```text
SourceEvidenceGraph.sourceExtensionRefs
SourceOccurrenceDescriptor.sourceExtensionRefs
SourceRelationshipDescriptor.sourceExtensionRefs
```

and common:

```text
AdapterAttempt
AdapterResult
ArtifactClassification
CandidateSemanticScope
InterpretationClaimSet
SemanticClaim
ProvenanceLink
ProcessRevision
ValidationAssessment
```

No private canonical/runtime path is created.

---

# 34. Conformance requirements

v0.2 must pass I01–I28, including the I27 historical-resolution regression.

Required outcomes include:

```text
origin/capture distinction
local visual addressability
transform lineage
alternatives preserved immutably
human resolution recorded separately
independent relationship uncertainty
visibility vs absence
plane separation
artifact classification before process assumption
0..N scopes
notation-dependent geometry
multiple representation discipline
immutable re-perception
Canvas review compatibility
source-preserving failures
no Temporal output
```

---

# 35. Anti-goals

Do not:

- select OCR/vision vendor as architecture;
- claim native IDs from pixels;
- flatten confidence into truth class;
- mutate an alternative set after human review;
- infer END from crop/non-detection;
- use color as semantics without evidence;
- turn cursors into actors;
- turn every arrow into sequence;
- repair source topology from expectation;
- discard low-confidence evidence;
- mutate earlier attempts after model upgrades;
- bypass review/provenance/validation;
- emit Temporal concepts.

---

# 36. Regression gate

```text
I01–I28
28 / 28 PASS required
```

BUILD remains closed.
