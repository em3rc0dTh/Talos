# TALOS — Origin, Provenance & Normalization Contract v0.2

Status: **DESIGN DRAFT / T1-02 CANDIDATE**  
Date: **2026-08-18**  
Supersedes for active design: `01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

The first provenance draft correctly established the core rule:

> Normalization is allowed. Origin loss is not.

The first ten Mining Site quarries then exposed a deeper problem: provenance is not only a link from a normalized node to a source file.

A real source may contain:

- exact original bytes and later repository derivatives;
- a declared filename whose extension disagrees with the observed byte signature;
- editor/workspace UI that is visible but not part of the process;
- notation annotations that explain process symbols but are not process edges;
- duplicate labels representing distinct source occurrences;
- one object concept represented by multiple source object-node occurrences;
- strong evidence for a node while one of its edge endpoints remains uncertain;
- several claims about one semantic property from different evidence perspectives;
- conflicts that are resolved without deleting the original disagreement.

T1-02 must preserve all of those facts.

---

# 1. Fundamental invariants

```text
NORMALIZATION              allowed
ORIGIN LOSS                forbidden

FILE PATH                  ≠ source identity
FILE NAME                  ≠ byte identity
FILE EXTENSION             ≠ observed byte format
VISUAL DERIVATIVE          ≠ exact original
SOURCE OCCURRENCE          ≠ conceptual identity
DISPLAY LABEL              ≠ semantic identity
TRUTH CLASS                ≠ confidence
TRUTH CLASS                ≠ evidence perspective
CONFIDENCE                 ≠ execution readiness
CONFIRMATION               ≠ deletion of prior inference
RESOLUTION                 ≠ deletion of conflict history
```

Every accepted process revision must remain explainable in both directions:

```text
SOURCE → CANONICAL MEANING
```

and:

```text
CANONICAL / EXECUTION ELEMENT → SOURCE EVIDENCE
```

---

# 2. SourceCapture

`SourceCapture` represents the act/context in which source evidence entered TALOS.

```text
SourceCapture
- id
- capturedAt
- captureMethod
- suppliedBy?
- sourceSystem?
- sourceUri?
- sessionRef?
- notes?
```

Initial `captureMethod` vocabulary:

```text
UPLOAD
CONNECTOR_FETCH
API_IMPORT
CANVAS_NATIVE
PASTE
SCREENSHOT_CAPTURE
AUTOMATION_IMPORT
SYSTEM_OBSERVATION
SOURCE_DEFINED
```

A capture event is not the source bytes themselves. One capture may create one or more representations.

---

# 3. SourceArtifact

`SourceArtifact` is the logical source object whose representations and semantic evidence are preserved.

```text
SourceArtifact
- id
- artifactClass
- declaredType?
- declaredName?
- sourceSystem?
- captureId
- representationIds[]
- evidencePerspective?
- metadata?
```

Initial `artifactClass` vocabulary remains intentionally broad:

```text
PROCESS_DIAGRAM
COLLABORATION_DIAGRAM
REFERENCE_ARCHITECTURE
SERVICE_TOPOLOGY
ANNOTATED_NOTATION_EXAMPLE
WHITEBOARD_CAPTURE
PROCESS_DOCUMENT
NATURAL_LANGUAGE
EXISTING_AUTOMATION
RUNTIME_OBSERVATION
TALOS_CANVAS
SOURCE_DEFINED
UNKNOWN
```

Classification may itself be a claim with provenance and confidence.

---

# 4. SourceRepresentation — byte and rendering identity

The Mining Site proved that one source may exist in several physical/rendered forms. TALOS must not collapse them.

```text
SourceRepresentation
- id
- sourceArtifactId
- representationKind
- originalName?
- declaredExtension?
- declaredMimeType?
- observedMimeType?
- observedSignature?
- byteLength?
- hashAlgorithm?
- contentHash?
- storageRef?
- repositoryPath?
- derivedFromRepresentationId?
- derivationMethod?
- derivationVersion?
- byteIdentityStatus
- createdAt?
```

`representationKind`:

```text
ORIGINAL_BYTES
EXACT_COPY
DERIVATIVE
TRANSCODE
PREVIEW
THUMBNAIL
RECREATED
TEXT_EXTRACT
NORMALIZED_SERIALIZATION
SOURCE_DEFINED
```

`byteIdentityStatus`:

```text
EXACT_VERIFIED
CANDIDATE_UNVERIFIED
NOT_BYTE_IDENTICAL
NO_BYTES_AVAILABLE
UNKNOWN
```

## Required behavior

If a user uploads a JPG and the repository later stores an AVIF preview:

```text
JPG original
  └── DERIVED_FROM → AVIF preview
```

The AVIF may be useful evidence for visual review, but it may not inherit the original JPG hash or claim exact identity.

If two representations have the same visible content but different bytes:

```text
visual equivalence ?
byte equivalence   NO
```

TALOS must preserve that distinction.

---

# 5. Declared format vs observed format

Q06 demonstrated that a supplied filename/extension may disagree with byte signature.

Therefore provenance stores both:

```text
declaredName
reported / declared extension
observedMimeType
observedSignature
contentHash
```

No field silently overwrites another.

Example:

```text
declaredName: quarry-06.ppm
declaredExtension: ppm
observedSignature: PNG
```

This is not a parsing inconvenience. It is source truth.

---

# 6. SourcePlane

A source may contain several evidence planes that must remain separable.

```text
SourcePlane
- id
- sourceArtifactId
- kind
- description?
- provenanceRefs[]
```

Initial `kind` vocabulary:

```text
AUTHORING_CONTEXT
COLLABORATOR_OVERLAY
NOTATION_ANNOTATION
BUSINESS_GRAPH
RESPONSIBILITY_COLLABORATION
OBJECT_DATA
ARCHITECTURE_TOPOLOGY
ANALYTIC_SIMULATION
RUNTIME_EVIDENCE
UNKNOWN
SOURCE_DEFINED
```

Example from a Miro screenshot:

```text
AUTHORING_CONTEXT
- toolbar
- share button
- zoom controls

COLLABORATOR_OVERLAY
- named cursors / presence

BUSINESS_GRAPH
- Order
- Receive order
- Check stock
- decisions
```

The collaborator overlay remains source evidence but is not promoted into actor/ownership truth without another claim.

---

# 7. EvidenceFragment

Artifact-level provenance is too coarse for image/diagram interpretation.

`EvidenceFragment` identifies the local source evidence supporting a claim.

```text
EvidenceFragment
- id
- sourceArtifactId
- representationId?
- sourcePlaneId?
- fragmentKind
- sourceElementRef?
- region?
- textAnchor?
- structuralAnchor?
- digest?
- metadata?
```

Possible `fragmentKind` values:

```text
SOURCE_ELEMENT
IMAGE_REGION
TEXT_SPAN
EDGE_REGION
LEGEND_ENTRY
ANNOTATION
OBJECT_OCCURRENCE
RUNTIME_EVENT
WHOLE_ARTIFACT
SOURCE_DEFINED
```

`region` may eventually contain normalized coordinates or another representation-safe locator.

The goal is not to force every source type into image coordinates. The goal is to make evidence addressable at the finest reliable level the source supports.

---

# 8. SourceOccurrence

The Mining Site repeatedly showed identical labels with different source identities.

```text
SourceOccurrence
- id
- sourceArtifactId
- evidenceFragmentId
- occurrenceKind
- displayLabel?
- sourceAssertedType?
- candidateSemanticType?
- sourceContextRefs[]
- canonicalRef?
```

`occurrenceKind` may include:

```text
NODE
EDGE
LANE
PARTICIPANT
OBJECT_NODE
ANNOTATION
EVENT_MARKER
STYLE_MARKER
REGION
SOURCE_DEFINED
```

Occurrence identity is preserved even when several occurrences later normalize to one conceptual business object.

---

# 9. SemanticClaim

A normalized element is not itself sufficient to explain why TALOS believes a property.

```text
SemanticClaim
- id
- subjectRef
- propertyPath
- value
- perspective
- truthClass
- confidence?
- evidenceFragmentRefs[]
- provenanceLinkRefs[]
- assertedBy?
- createdAt
- interpretationMethod?
- interpreterVersion?
- supersedesClaimRefs[]?
```

This allows property-scoped evidence.

Example:

```text
subject: event-17
property: sourceShape
value: circle
truthClass: SOURCE_TRUTH
```

while:

```text
subject: event-17
property: eventSubtype
value: END
truthClass: INFERRED
confidence: 0.61
```

and:

```text
subject: event-17
property: termination
value: UNKNOWN
```

can coexist.

---

# 10. TruthClass

```text
SOURCE_TRUTH
INFERRED
SUGGESTED
CONFIRMED
EXECUTABLE
```

Truth class describes epistemic/acceptance status.

It does not answer what kind of source produced the evidence.

Historical claims are preserved as revisions/events. Confirmation creates authoritative later meaning without rewriting the earlier inference into something it never was.

---

# 11. EvidencePerspective

```text
BUSINESS_INTENT
IMPLEMENTED_BEHAVIOR
OPERATIONAL_OBSERVATION
ANALYTIC_MODEL
DESIGN_SUGGESTION
SOURCE_DEFINED
UNKNOWN
```

Examples:

```text
existing n8n retry setting
→ IMPLEMENTED_BEHAVIOR
```

not automatically:

```text
company business policy
→ BUSINESS_INTENT
```

Likewise, an architecture or simulation source may be `ANALYTIC_MODEL` rather than business-process intent.

Perspective may be assigned at artifact, claim, or evidence-fragment level where necessary.

---

# 12. ProvenanceLink

`ProvenanceLink` binds canonical/process elements or claims to source evidence and transformation context.

```text
ProvenanceLink
- id
- targetRef
- targetPropertyPath?
- sourceArtifactId
- sourceRepresentationId?
- evidenceFragmentId?
- sourceOccurrenceId?
- evidenceType
- extractionMethod
- truthClass
- confidence?
- perspective?
- interpreterVersion?
- transformationRecordId?
- confirmedBy?
- confirmedAt?
```

A provenance link does not imply that the full target element is source truth. Property-scoped links/claims remain valid and preferred when evidence differs by property.

---

# 13. Edge / relationship provenance

Q08 proved that node certainty and edge certainty can differ.

Therefore provenance applies to relationships as first-class subjects.

Example:

```text
NODE A existence       high confidence
NODE B existence       high confidence
EDGE E existence       high confidence
EDGE E source endpoint high confidence
EDGE E target endpoint unresolved
```

TALOS must not collapse this into one confidence number for an entire graph.

Relationship claims may target:

```text
edge.kind
edge.sourceNodeId
edge.targetNodeId
edge.condition
edge.direction
edge.correlationMeaning
```

independently.

---

# 14. Conceptual identity vs occurrence identity

Q09 demonstrated that two object nodes labeled `aProposal : Proposal` may represent:

- two source occurrences of the same conceptual object;
- different snapshots/states;
- different objects with the same label;
- or an unresolved identity relationship.

TALOS therefore preserves:

```text
SourceOccurrence
    ↓ optional mapping
Canonical DataObject / ProcessNode
    ↓ optional equivalence relation
ConceptualBusinessObject
    ↓ later execution
RuntimeObjectIdentity
```

No stage silently collapses identities.

---

# 15. Causality preservation through normalization

Q04 and Q10 prove that multiple causes can share one downstream handler.

Normalization may produce:

```text
CancelOrder
```

while preserving causal claims such as:

```text
reason = OUT_OF_STOCK
reason = CARD_INVALID
```

or separate incoming branch identities.

A shared canonical action may never erase the source branch that activated it.

This causal lineage should remain available to later explanation, validation, execution history and analytics.

---

# 16. ConflictRecord

```text
ConflictRecord
- id
- subjectRef
- propertyPath
- claimRefs[]
- resolutionStatus
- selectedClaimRef?
- resolvedValue?
- rationale?
- resolutionAuthority?
- resolvedBy?
- resolvedAt?
- resolutionRevisionRef?
```

`resolutionStatus`:

```text
UNRESOLVED
RESOLVED
DEFERRED
```

Resolution creates new authoritative state/revision but leaves contradictory evidence preserved.

---

# 17. ConfirmationRecord

Human/system confirmation should be modeled as an event with authority context rather than a mutable boolean.

```text
ConfirmationRecord
- id
- claimRef
- decision
- authorityRef
- confirmedBy
- confirmedAt
- rationale?
- scope?
- resultingRevisionRef?
```

`decision` may include:

```text
ACCEPT
REJECT
AMEND
DEFER
```

This makes it possible to answer not merely that something is confirmed, but **who accepted which claim at which revision**.

---

# 18. TransformationRecord

Every semantic transformation must be traceable.

```text
TransformationRecord
- id
- transformationKind
- inputRefs[]
- outputRefs[]
- toolOrAgent
- version
- configurationHash?
- modelRef?
- startedAt?
- completedAt?
- notes?
```

Initial `transformationKind` values:

```text
CAPTURE
PARSE
PERCEPTION
ARTIFACT_CLASSIFICATION
PLANE_SEGMENTATION
GRAPH_EXTRACTION
SEMANTIC_TYPING
NORMALIZATION
SOURCE_MERGE
CONFLICT_RESOLUTION
HUMAN_CONFIRMATION
CANVAS_EDIT
AUTOMATION_DESIGN
COMPILATION
DEPLOYMENT
SOURCE_DEFINED
```

Lineage becomes:

```text
SourceCapture
   ↓
SourceArtifact
   ↓
SourceRepresentation
   ↓
EvidenceFragment / SourceOccurrence
   ↓
SemanticClaim
   ↓
Canonical ProcessRevision
   ↓
ExecutionPlan
   ↓
DeploymentRevision
```

Every hop is versioned/traceable.

---

# 19. ProcessDefinition vs ProcessRevision

`ProcessDefinition` remains logical identity across revisions.

`ProcessRevision` remains an immutable accepted semantic snapshot.

```text
ProcessDefinition
    └── ProcessRevision*
```

A source update, corrected interpretation, conflict resolution, Canvas edit or confirmation creates a new revision when accepted semantics change.

Historical process revisions retain their original provenance graph.

---

# 20. Multi-source normalization

TALOS may receive:

```text
BPMN
+ SOP
+ screenshot
+ operator explanation
+ existing automation
+ runtime observation
```

for one logical process.

The normalized process must support:

- many artifacts;
- many representations per artifact;
- many claims per subject/property;
- conflicting claims;
- differing evidence perspectives;
- explicit source authority where defined;
- unresolved conflicts where authority is absent.

A merger is not allowed to collapse disagreement simply because one source is newer or visually cleaner.

---

# 21. Source-specific semantics and planes

Normalization preserves source-specific meaning through extensions and evidence planes.

Examples:

## BPMN

```text
source element ID/type
gateway subtype
event subtype
pool/lane context
boundary-event relation
extension metadata
```

## Petri Net

```text
place / transition / arc identity
marking
token semantics
synchronization evidence
```

## SIPOC

```text
supplier
input
process
output
customer
boundary context
```

## VSM

```text
lead/process/wait time
inventory
value/waste classification
observed vs target context
```

## Annotated UML / notation teaching image

```text
notation annotation plane
annotation arrows
source-asserted node labels/types
business graph kept separate
```

## Collaborative whiteboard

```text
authoring UI
collaborator presence
cursor/pointer overlay
business graph
style metadata
```

The source-specific evidence may be relevant to interpretation without becoming executable semantics.

---

# 22. Repository/source integrity status

The provenance model must support a repository containing a derivative while the original source bytes are missing.

The ten-quarry audit currently shows all of these real states:

```text
EXACT ORIGINAL PRESENT
DERIVATIVE PRESENT / ORIGINAL MISSING
CANDIDATE ORIGINAL PRESENT BUT NOT REVERIFIED
DECLARED EXTENSION / OBSERVED SIGNATURE MISMATCH
```

Therefore a future source-ingestion gate must verify and store source representations explicitly, not infer identity from repository path.

---

# 23. No silent overwrites

If a user edits a source in TALOS Canvas:

```text
Original source representation
       ↓
Imported candidate interpretation
       ↓
Canvas edit
       ↓
New ProcessRevision
```

The edited Canvas is a new source/revision lineage element. It does not replace the imported artifact.

If TALOS redraws or re-renders an imported diagram, the redraw is `RECREATED`/`DERIVATIVE`, not the original.

---

# 24. T1-02 acceptance criteria candidate

The Provenance Model can be frozen only when TALOS can represent and answer all of the following:

1. Which logical artifact supplied the evidence?
2. Which physical representation was used?
3. Are those bytes original, exact-copy, derivative, preview or missing?
4. What was the declared filename/format and what byte format was actually observed?
5. Which source plane did the evidence belong to?
6. Which exact source occurrence/region/text span supported the claim?
7. What property/relationship was claimed?
8. Was the claim source truth, inferred, suggested, confirmed or executable?
9. What evidence perspective did it represent?
10. What confidence was assigned, independently of truth class?
11. Which parser/model/agent/transformation version created the interpretation?
12. Did another source disagree?
13. Who/what had authority to resolve the conflict?
14. Which confirmation/resolution created the accepted meaning?
15. Which immutable ProcessRevision inherited that meaning?
16. Which future ExecutionPlan/DeploymentRevision came from that process revision?
17. Can shared normalized handling still explain the original branch/cause that activated it?
18. Can distinct same-label source occurrences remain distinct until equivalence is proven?
19. Can edge/relationship uncertainty be preserved independently from node certainty?
20. Can non-process source evidence remain preserved without contaminating the executable graph?

---

# 25. Freeze boundary

This v0.2 document is a **candidate design contract**, not yet frozen.

It should be pressure-tested before T1-02 closes.

The companion gate design is:

```text
test/02-PROVENANCE-PRESSURE-TEST-SPEC-v0.1.md
```

The intended next move is not BUILD.

It is to prove that this provenance model can survive the Mining Site's real evidence without either losing origin or turning contextual/derived evidence into false source truth.
