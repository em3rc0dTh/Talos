# TALOS — Image / Perception Adapter Contract v0.1

Status: **DESIGN CANDIDATE / P2-03 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define how visual process-expression sources enter TALOS when structure itself must be perceived rather than parsed from native structured semantics.

Examples:

```text
photo of paper drawing
whiteboard photo
screenshot
informal flowchart
collaborative canvas screenshot
functional-model screenshot
architecture diagram
exported/rendered diagram without native structure
```

Extraction mode:

```text
VISUAL_PERCEPTION
```

The goal is not perfect OCR or perfect computer vision.

The goal is:

> **Make uncertain perception safe, local, addressable, provenance-backed, versioned and reviewable without laundering model output into source truth.**

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
VISIBLE DIAMOND                     ≠ DECISION/GATEWAY AUTOMATICALLY
VISIBLE CIRCLE                      ≠ END EVENT AUTOMATICALLY
VISIBLE ARROW                       ≠ SEQUENCE FLOW AUTOMATICALLY
ARROW DIRECTION                     ≠ RELATIONSHIP ROLE AUTOMATICALLY
TEXT DETECTION                      ≠ TEXT READING
TEXT READING                        ≠ NORMALIZED MEANING
SAME OCR LABEL                      ≠ SAME SOURCE OCCURRENCE
COLOR / STYLE                       ≠ SEMANTIC TYPE WITHOUT EVIDENCE
GEOMETRY                            ≠ UNIVERSAL SEMANTICS
CROPPED/OUT-OF-FRAME CONTINUATION   ≠ PROVEN ABSENCE
OCCLUDED ELEMENT                    ≠ NON-EXISTENT ELEMENT
LOW CONFIDENCE                      ≠ SOURCE REJECTION AUTOMATICALLY
PERCEPTION MODEL VERSION            ≠ AUTHORITY
NEW PERCEPTION RUN                  ≠ MUTATION OF OLD INTERPRETATION
AI INFERENCE                        ≠ SOURCE_TRUTH AUTOMATICALLY
```

---

# 2. Source provenance profiles

## Physical drawing / whiteboard

```text
SourceOrigin
  originKind = PHYSICAL_ARTIFACT
  mediumKind = PAPER_DRAWING | PHYSICAL_WHITEBOARD | SOURCE_DEFINED

SourceCapture
  captureMethod = PHOTO_CAPTURE | SCAN_CAPTURE

SourceRepresentation
  representationKind = CAPTURED_BYTES
```

The representation hash identifies the photo/scan bytes only.

## Screenshot of a digital native source

```text
SourceOrigin
  originKind = DIGITAL_NATIVE_ARTIFACT
  mediumKind = DIGITAL_CANVAS | SOURCE_DEFINED

SourceCapture
  captureMethod = SCREENSHOT_CAPTURE

SourceRepresentation
  representationKind = CAPTURED_BYTES
```

If the native structured model is not supplied:

```text
SourceAvailabilityRecord
  representationClass = NATIVE_STRUCTURED_MODEL
  status = NOT_SUPPLIED | NOT_AVAILABLE_TO_TALOS | UNKNOWN
```

## Rendered/exported digital image

If the image itself is the native delivered digital artifact:

```text
SourceRepresentation
  representationKind = NATIVE_DIGITAL
```

Origin/capture classification must follow actual evidence rather than filename assumptions.

---

# 3. Adapter attempt

Use frozen `AdapterAttempt`.

Recommended identity:

```text
adapterId = ImagePerceptionAdapter
adapterVersion = versioned
extractionMode = VISUAL_PERCEPTION
```

Input fingerprint must include at minimum:

```text
sourceRepresentation digest
adapter/version
perception pipeline version
model/version set
semantic configuration digest
canonical model version where mapping depends on it
```

A newer perception model creates a new attempt. It never rewrites an older attempt/result.

---

# 4. Perception is a separate evidence layer

For structured sources, native semantic elements can be addressed directly.

For images, TALOS first records **perception observations/hypotheses** over representation regions.

```text
SourceRepresentation bytes
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

Important:

```text
PerceptionObservation
      ≠
SourceOccurrence SOURCE_TRUTH
```

A materialized source occurrence may be supported by an inferred existence/type claim whose provenance points back to the pixel region and perception run.

---

# 5. ImageCoordinateSpace

Every spatial anchor must state the coordinate space in which it is valid.

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

`orientation` may preserve source/decoder orientation information without silently rotating the provenance identity.

---

# 6. Representation transforms

Perception may use derived/preprocessed representations such as:

```text
crop
rotation
perspective correction
deskew
contrast-adjusted derivative
resolution-normalized derivative
```

These are separate `SourceRepresentation` derivatives with transformation lineage.

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

Rules:

```text
derivative pixels ≠ original/captured bytes
```

and:

```text
anchor on derivative
→ must remain traceable through transform lineage
→ to the source representation/origin
```

A derivative may improve perception without becoming the source origin.

---

# 7. VisualEvidenceAnchor

A perception result must be locally addressable.

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
POINT
BOX
POLYGON
POLYLINE
MASK
WHOLE_IMAGE
SOURCE_DEFINED
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

Important:

```text
NOT OBSERVED IN FRAME
      ≠
PROVEN ABSENT FROM SOURCE ORIGIN
```

---

# 8. PerceptionObservation

A model/tool observation over a local anchor.

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

`observationKind` examples:

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

Observations are inference records, not source-confirmed semantic facts.

---

# 9. PerceptionAlternativeSet

Visual evidence often supports more than one plausible reading.

```text
PerceptionAlternativeSet
- id
- adapterAttemptId
- subjectObservationRef?
- propertyPath
- alternatives[]
- exclusivityMode
- selectionState
- selectedAlternativeId?
- selectionAuthorityRef?
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

`selectionState`:

```text
UNRESOLVED
MODEL_PREFERRED
HUMAN_CONFIRMED
AUTHORITY_SELECTED
SOURCE_DEFINED
```

`MODEL_PREFERRED` remains `INFERRED`; it is not authority-backed confirmation.

Example Q11:

```text
literal text candidates:
- Brainst
- Brainstorm
- other partially legible reading
```

The source image does not silently change because one candidate is preferred.

---

# 10. Literal text vs interpreted meaning

For every material text region, preserve separate claims when relevant:

```text
pixel/text region existence        INFERRED from perception
literalText                        INFERRED / local confidence
normalizedText                     INFERRED
interpretedMeaning                 INFERRED
business semantic role             INFERRED
```

Human confirmation may later create `CONFIRMED` claims without deleting prior inferred readings.

Example Q11:

```text
literal candidate = "Brainst"
interpreted meaning candidate = "brainstorm"
```

These are separate properties.

---

# 11. Perceived source occurrences

A visual region may be materialized as a `SourceOccurrenceDescriptor` when the adapter has enough evidence to address it as a distinct candidate occurrence.

The occurrence itself remains source-derived/perceived.

Required provenance:

```text
SourceOccurrenceDescriptor
  ↓
existence/type/label claims
  ↓
PerceptionObservation(s)
  ↓
VisualEvidenceAnchor(s)
  ↓
EvidenceFragment(s)
  ↓
SourceRepresentation
```

`nativeSourceId` is normally absent for raster-only sources.

TALOS assigns its own source-occurrence identity and must not pretend it came from the pixels as a native ID.

---

# 12. Same label vs same occurrence

Repeated labels do not collapse.

Example Q08:

```text
can the problem be solved?  [gateway occurrence 1]
can the problem be solved?  [gateway occurrence 2]
```

Example Q08:

```text
Call back  [Management]
Call back  [Scheduling]
```

Distinct spatial anchors → distinct source-occurrence candidates unless equivalence is separately supported.

---

# 13. PerceptionRelationCandidate

Image relationships require independent uncertainty for existence, endpoints, direction and role.

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

`endpointState`:

```text
SET_CANDIDATE
UNKNOWN
OUT_OF_FRAME
OCCLUDED
UNRESOLVED
SOURCE_DEFINED
```

A preferred endpoint is not automatically source truth.

---

# 14. SourceRelationshipDescriptor materialization

When enough relationship evidence exists, map into the common descriptor:

```text
SourceRelationshipDescriptor
```

while preserving visual alternatives in `sourceExtensionRefs`.

Rules:

```text
ambiguous endpoint set
→ do not fabricate one definite complete edge

known stroke + unknown target
→ preserve relationship existence candidate
→ target endpoint UNKNOWN / OUT_OF_FRAME / UNRESOLVED

visible arrowhead
→ direction evidence
→ not relationship-role authority
```

---

# 15. Visual coverage / absence discipline

The adapter must distinguish:

```text
OBSERVED VISIBLE ELEMENT
NO ELEMENT DETECTED IN A VISIBLE REGION
REGION NOT LEGIBLE
REGION OBSCURED
SOURCE MAY CONTINUE OUTSIDE FRAME
```

It must never infer:

```text
no outgoing connector detected
      ⇒ process terminates
```

without independent support.

This protects Q08/Q10/Q11 and cropped screenshots.

---

# 16. Source-plane segmentation

Image segmentation produces candidate planes/regions, not source truth automatically.

Candidate plane families use frozen concepts:

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

Plane membership claims retain confidence/provenance.

One visual region may support multiple plane hypotheses until resolved.

---

# 17. Collaborative/editor overlays — Q10

Miro/editor UI, collaborator names, cursors and presence indicators are preserved as visible evidence.

They do not become business actors/process nodes automatically.

```text
CURSOR VISIBLE            SOURCE-IMAGE EVIDENCE
CURSOR → BUSINESS ACTOR   NOT ESTABLISHED
PROXIMITY → OWNERSHIP     FORBIDDEN
EDITOR TOOLBAR            ≠ PROCESS NODE
```

Segmentation may classify these regions as:

```text
AUTHORING_CONTEXT
COLLABORATOR_OVERLAY
```

with local confidence.

---

# 18. Artifact classification before process assumption — Q06

The adapter must be able to classify a visual artifact as:

```text
REFERENCE_ARCHITECTURE
SERVICE_TOPOLOGY
FUNCTIONAL_MODEL
PROCESS_DIAGRAM
COLLABORATION_DIAGRAM
MIXED_ARTIFACT
UNKNOWN
```

with claim-level evidence/confidence.

A reference architecture may produce:

```text
ARCHITECTURE_SCOPE
0 process candidates
or
0..N executable-slice candidates
```

It must not be flattened into one process because arrows/boxes exist.

---

# 19. Notation / geometry-dependent semantics — Q12

Geometry can become semantic evidence only within an interpretation context that supports such meaning.

Example candidate chain:

```text
artifactClass = FUNCTIONAL_MODEL                  inferred
notationFamily = ICOM/IDEF0-like                  inferred
connector attaches to top side                    observed/perceived
therefore relationshipRole = FUNCTION_CONTROL     inferred
```

The role claim must preserve its dependency on the notation/classification context.

```text
PerceptionInterpretationDependency
- id
- dependentClaimRef
- prerequisiteClaimRefs[]
- dependencyKind
- rationale?
```

`dependencyKind`:

```text
REQUIRES_INTERPRETATION_CONTEXT
REQUIRES_ARTIFACT_CLASS
REQUIRES_NOTATION_HYPOTHESIS
REQUIRES_PLANE_CLASSIFICATION
SOURCE_DEFINED
```

If the prerequisite interpretation changes, TALOS re-evaluates the dependent claim in a new adapter attempt/result rather than mutating the old claim.

---

# 20. Function/resource discipline — Q12

Even where a visual function box is strongly recognized:

```text
FUNCTION BOX              ≠ canonical ACTION automatically
MECHANISM/RESOURCE ARROW  ≠ process step
OUTPUT→INPUT DEPENDENCY   ≠ temporal sequence automatically
SOURCE DECOMPOSITION      ≠ runtime subprocess automatically
```

The image adapter preserves the functional relationship semantics/uncertainty and lets normalization/validation decide what can safely map.

---

# 21. Composite text inside one shape — Q11

A list inside one perceived source shape does not automatically create multiple graph nodes.

Example:

```text
Ejecutar el diseño
Brainst, design, arch, plan, build, test
```

The adapter may preserve:

```text
one shape occurrence
multiple internal text spans
candidate semantic interpretation(s)
```

without manufacturing six process nodes.

---

# 22. Domain expectation must not repair source — Q11

If a branch appears to terminate in a way that looks logically surprising:

```text
visible source topology
      ≠
expected business continuation
```

Talos preserves the observed/perceived topology and emits uncertainty/validation rather than inventing the expected path.

---

# 23. Ambiguous long connectors — Q08

For a long/overlapping raster connector:

```text
stroke existence may be high confidence
source endpoint may be high confidence
target endpoint may be low confidence
direction may be medium confidence
semantic role may be unknown
```

These properties remain independent.

A low-confidence endpoint does not invalidate a high-confidence stroke observation.

---

# 24. Metric/style overlays — Q06

Metric badges, colors, iconography, simulation overlays and style elements may be perceived and preserved as annotations/source metadata.

They must not become:

```text
business state
routing rule
retry policy
probability
SLA
```

unless supported by source evidence/legend or later confirmation.

---

# 25. Multiple representations of one origin

One physical/digital origin may have multiple image representations:

```text
photo A
scan B
screenshot C
```

Perception attempts run against representations independently unless a deliberate fusion operation is recorded.

No occurrence identities are automatically merged across representations merely because regions look similar.

Potential correspondence is represented explicitly:

```text
VisualCorrespondenceClaim
- id
- sourceOriginId
- representationOccurrenceRefs[]
- equivalenceKind
- truthClass
- confidence?
- evidenceRefs[]
- createdByAttemptRef?
```

`equivalenceKind`:

```text
SAME_PHYSICAL_MARK_CANDIDATE
SAME_LOGICAL_SOURCE_ELEMENT_CANDIDATE
SAME_TEXT_OCCURRENCE_CANDIDATE
SOURCE_DEFINED
```

---

# 26. Partial perception

An image may be only partially interpretable.

Examples:

```text
most nodes readable, one label illegible
nodes readable, long edge endpoints uncertain
business graph visible, editor chrome mixed in
artifact class uncertain
native model unavailable
```

Valid adapter state:

```text
AdapterAttempt = PARTIAL
AdapterResult exists
SourceEvidenceGraph is partial
Diagnostics identify gaps
CandidateSemanticScope(s) may still exist
```

Partial is not failure.

---

# 27. Unsafe-to-interpret threshold

If the representation is too degraded/occluded/ambiguous for meaningful semantic extraction:

```text
source remains PRESERVED
AdapterAttempt may be PARTIAL or FAILED
intake state may be UNSAFE_TO_INTERPRET
```

No fake process is emitted to satisfy product UX.

Talos may request a better capture/native source while preserving the current evidence.

---

# 28. Re-perception / model upgrades

A later model/version may produce a different interpretation of the same preserved image.

```text
same SourceRepresentation
AdapterAttempt A / model v1
AdapterResult A

same SourceRepresentation
AdapterAttempt B / model v2
AdapterResult B
```

A never mutates into B.

If a later candidate affects an active review workspace, frozen Canvas Review / Projection v0.2 baseline reconciliation applies.

```text
new perception result
→ candidate ProcessRevision
→ BaselineTransitionCandidate
→ reconciliation
→ explicit decision
```

User-confirmed review evidence is not silently overwritten by a newer model.

---

# 29. Canvas review compatibility

The review Canvas must be able to display:

```text
canonical interpreted nodes/edges
source-only visual occurrence candidates
ambiguous relationship candidates
alternative text readings
confidence / truth class
source image region/evidence
artifact/plane classification uncertainty
validation findings
conflicts
```

Rendering uncertain image evidence does not transfer provenance ownership to Canvas.

User corrections create review-authored lineage through frozen P2-01B contracts.

---

# 30. Candidate semantic scopes

Images may produce:

```text
0..N
```

candidate scopes, including:

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

Artifact classification and scope discovery remain uncertainty-aware.

Q06 may validly yield architecture scope(s) without a whole-artifact process candidate.

---

# 31. Mapping/truth discipline

Property-specific examples:

```text
pixels in region                          SOURCE REPRESENTATION TRUTH
shape exists                             INFERRED
shape class = diamond                    INFERRED
semantic type = decision                 INFERRED
label literal = "In stock?"             INFERRED
business question meaning                INFERRED
user confirmation                        CONFIRMED on later claim
```

The image adapter never marks perception-generated semantics `SOURCE_TRUTH` merely because confidence is high.

`SOURCE_TRUTH` may apply to facts directly supplied/declared by the source context, but not to model-generated recognition of pixels without explicit authority.

---

# 32. Diagnostics

Image-specific diagnostics may include:

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

Diagnostics cite local anchors/evidence.

---

# 33. No common-contract bypass

Image-specific structures are carried through common adapter extension references:

```text
SourceEvidenceGraph.sourceExtensionRefs
SourceOccurrenceDescriptor.sourceExtensionRefs
SourceRelationshipDescriptor.sourceExtensionRefs
```

The frozen Process Source Intake v0.2 remains the common boundary.

Image specialization does not create a private path to Canonical or Temporal.

---

# 34. P2-03 conformance requirements

The image adapter design must prove:

1. physical origin vs image capture distinction;
2. native digital origin vs screenshot distinction;
3. local addressable visual evidence;
4. derivative/crop/rotation transform lineage;
5. literal text vs interpreted meaning;
6. alternative reading preservation;
7. occurrence existence/type confidence separation;
8. independent relationship existence/endpoint/direction/role uncertainty;
9. visibility/out-of-frame vs absence discipline;
10. source-plane/editor-overlay separation;
11. repeated labels remain distinct occurrences;
12. partial extraction remains useful;
13. artifact classification precedes process assumption;
14. 0..N semantic scope discovery;
15. notation-dependent geometry remains conditional evidence;
16. functional resource/control/output roles do not become sequence automatically;
17. multiple representations do not auto-collapse identities;
18. re-perception is immutable/versioned;
19. Canvas review preserves visual provenance/uncertainty;
20. no direct Temporal output;
21. common Canonical/Provenance/Validation boundaries remain intact.

---

# 35. Anti-goals

Do not:

- implement OCR/vision technology in P2-03 design;
- declare one perception model/vendor as architectural truth;
- create native IDs from guessed pixels and call them source IDs;
- flatten confidence into truth class;
- infer process termination from a cropped image edge;
- use color as semantic type without evidence;
- turn collaborator cursors into actors;
- convert every arrow into sequence flow;
- convert every box into an action;
- repair surprising topology from domain expectation;
- discard low-confidence evidence;
- mutate prior perception after a model upgrade;
- bypass Canvas review lineage;
- emit Temporal concepts.

---

# 36. Gate target

Pressure-test this contract against the P2-03 image suite using especially:

```text
Q06
Q08
Q10
Q11
Q12
```

plus synthetic derivative/re-perception/occlusion fixtures.

BUILD remains closed.
