# TALOS — Origin, Provenance & Normalization Contract v0.3

Status: **DESIGN CANDIDATE / T1-02 REGRESSION TARGET**  
Date: **2026-08-18**  
Supersedes for active design: `01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.2.md`  
Historical v0.1 and v0.2 remain preserved.

## Why v0.3 exists

Provenance v0.2 was executed against the complete first Mining Site provenance suite P01–P28.

Result:

```text
26 PASS
 2 FAIL
```

The failures were:

```text
P17 — physical process expression captured digitally
P28 — native canvas vs screenshot representation
```

The failure was narrow and consistent:

> v0.2 could describe capture events and byte representations, but it did not explicitly model the **underlying source origin** independently from capture, nor the **availability/non-supply of source-native representations**.

v0.3 fixes that boundary without redesigning the structures that already passed.

The execution evidence is:

```text
test/05-PROVENANCE-PRESSURE-TEST-RESULT-v0.1.md
```

---

# 1. Fundamental invariants

```text
NORMALIZATION                    allowed
ORIGIN LOSS                      forbidden

SOURCE ORIGIN                    ≠ capture event
CAPTURE EVENT                    ≠ captured representation
SOURCE ORIGIN                    ≠ byte identity
PHYSICAL ORIGINAL                ≠ photograph bytes
DIGITAL NATIVE MODEL             ≠ screenshot bytes
SPOKEN EXPLANATION               ≠ transcript bytes

FILE PATH                        ≠ source identity
FILE NAME                        ≠ byte identity
FILE EXTENSION                   ≠ observed byte format
VISUAL DERIVATIVE                ≠ exact captured representation
SOURCE OCCURRENCE                ≠ conceptual identity
DISPLAY LABEL                    ≠ semantic identity
TRUTH CLASS                      ≠ confidence
TRUTH CLASS                      ≠ evidence perspective
CONFIDENCE                       ≠ execution readiness
CONFIRMATION                     ≠ deletion of prior inference
RESOLUTION                       ≠ deletion of conflict history
MISSING REPRESENTATION RECORD    ≠ proof that representation does not exist
```

Every accepted semantic revision must remain explainable in both directions:

```text
SOURCE ORIGIN / EVIDENCE
          ↓
CAPTURE / REPRESENTATION
          ↓
INTERPRETATION
          ↓
CANONICAL MEANING
```

and:

```text
CANONICAL / EXECUTION ELEMENT
          ↓
CLAIM / PROVENANCE
          ↓
EVIDENCE FRAGMENT
          ↓
REPRESENTATION
          ↓
CAPTURE
          ↓
SOURCE ORIGIN
```

---

# 2. SourceOrigin — new in v0.3

`SourceOrigin` represents the underlying thing, expression or system state from which evidence originates.

It is deliberately independent from any particular capture or byte representation.

```text
SourceOrigin
- id
- originKind
- mediumKind?
- declaredDescription?
- sourceSystem?
- sourceUri?
- suppliedBy?
- createdAt?
- observedAt?
- metadata?
```

Initial `originKind` vocabulary:

```text
PHYSICAL_ARTIFACT
DIGITAL_NATIVE_ARTIFACT
HUMAN_EXPRESSION
SYSTEM_ARTIFACT
RUNTIME_STATE
TALOS_NATIVE
SOURCE_DEFINED
UNKNOWN
```

Possible `mediumKind` values are source-descriptive rather than execution types:

```text
PAPER_DRAWING
PHYSICAL_WHITEBOARD
NOTEBOOK
BPMN_FILE
UML_MODEL
DIGITAL_CANVAS
DOCUMENT
NATURAL_LANGUAGE_TEXT
SPOKEN_EXPLANATION
AUTOMATION_DEFINITION
RUNTIME_OBSERVATION
TALOS_CANVAS
SOURCE_DEFINED
UNKNOWN
```

Examples:

## Q11

```text
SourceOrigin
  originKind = PHYSICAL_ARTIFACT
  mediumKind = PAPER_DRAWING
```

The PNG does not become the physical origin.

## Q12

```text
SourceOrigin
  originKind = DIGITAL_NATIVE_ARTIFACT
  mediumKind = DIGITAL_CANVAS
```

The screenshot does not become the native canvas graph.

## Direct BPMN upload

```text
SourceOrigin
  originKind = DIGITAL_NATIVE_ARTIFACT
  mediumKind = BPMN_FILE
```

In this case the native digital bytes supplied to Talos may directly represent the origin.

---

# 3. SourceCapture

`SourceCapture` represents one act/context by which evidence from a `SourceOrigin` became available to Talos.

```text
SourceCapture
- id
- sourceOriginId
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
DIRECT_UPLOAD
PHOTO_CAPTURE
SCAN_CAPTURE
SCREENSHOT_CAPTURE
CONNECTOR_FETCH
API_IMPORT
CANVAS_NATIVE
PASTE
TRANSCRIPTION
AUTOMATION_IMPORT
SYSTEM_OBSERVATION
SOURCE_DEFINED
UNKNOWN
```

One origin may have many captures:

```text
paper drawing
   ├── photo A
   ├── scan B
   └── later photo C
```

and:

```text
digital canvas
   ├── native model export
   ├── screenshot
   └── PDF export
```

A capture event is not byte identity and does not imply that Talos possesses every native representation of the origin.

---

# 4. SourceArtifact

`SourceArtifact` is Talos' logical evidence container for one source-origin interpretation context.

```text
SourceArtifact
- id
- sourceOriginId
- artifactClass
- declaredType?
- declaredName?
- sourceSystem?
- captureIds[]
- representationIds[]
- availabilityRecordIds[]
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
FUNCTIONAL_MODEL
PROCESS_DOCUMENT
NATURAL_LANGUAGE
EXISTING_AUTOMATION
RUNTIME_OBSERVATION
TALOS_CANVAS
SOURCE_DEFINED
UNKNOWN
```

`artifactClass` is not the same thing as `SourceOrigin.mediumKind`.

Example:

```text
origin medium: DIGITAL_CANVAS
artifact class: FUNCTIONAL_MODEL
```

Classification may itself be a `SemanticClaim` with provenance and confidence.

---

# 5. SourceRepresentation — revised in v0.3

`SourceRepresentation` represents one concrete representation available to Talos.

```text
SourceRepresentation
- id
- sourceArtifactId
- sourceOriginId
- captureId?
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

Revised `representationKind` vocabulary:

```text
NATIVE_DIGITAL
NATIVE_STRUCTURED
CAPTURED_BYTES
EXACT_COPY
DERIVATIVE
TRANSCODE
PREVIEW
THUMBNAIL
RECREATED
TEXT_EXTRACT
TRANSCRIPT
NORMALIZED_SERIALIZATION
SOURCE_DEFINED
```

The v0.2 value `ORIGINAL_BYTES` is superseded because the word `original` is ambiguous when the underlying origin is physical, spoken, remote or structured-but-unsupplied.

Use instead:

```text
NATIVE_DIGITAL
```

when the representation is the source-native digital artifact, and:

```text
CAPTURED_BYTES
```

when the bytes are a photo/scan/screenshot/transcription capture of another origin.

`byteIdentityStatus` remains representation-scoped:

```text
EXACT_VERIFIED
CANDIDATE_UNVERIFIED
NOT_BYTE_IDENTICAL
NO_BYTES_AVAILABLE
UNKNOWN
```

## Critical byte rule

A hash identifies the bytes of that representation only.

```text
SHA256(photo.png)
      ≠
identity of physical paper
```

and:

```text
SHA256(canvas-screenshot.png)
      ≠
identity of native canvas model
```

Likewise, an AVIF/preview may never inherit the hash of a JPG/PNG capture unless byte identity is independently verified—which in ordinary transcoding it will not be.

---

# 6. SourceAvailabilityRecord — new in v0.3

Provenance must distinguish absence from non-supply.

A missing representation row cannot answer whether the representation:

- does not exist;
- exists but was not supplied;
- exists but Talos cannot access it;
- is available;
- is not applicable;
- or is simply unknown.

`SourceAvailabilityRecord` represents that evidence explicitly.

```text
SourceAvailabilityRecord
- id
- sourceOriginId
- sourceArtifactId?
- representationClass
- status
- evidenceFragmentRefs[]?
- assertedBy?
- observedAt
- notes?
```

Initial `representationClass` values:

```text
PHYSICAL_ORIGINAL
NATIVE_DIGITAL_ARTIFACT
NATIVE_STRUCTURED_MODEL
SOURCE_FILE
CAPTURED_IMAGE
TRANSCRIPT
SOURCE_DEFINED
```

Initial `status` values:

```text
AVAILABLE_TO_TALOS
NOT_SUPPLIED
NOT_AVAILABLE_TO_TALOS
NOT_APPLICABLE
UNKNOWN
```

Important distinction:

```text
NOT_SUPPLIED
      ≠
DOES_NOT_EXIST
```

Talos should avoid asserting non-existence unless the source explicitly supports it.

## Q11 example

```text
SourceAvailabilityRecord
  representationClass = PHYSICAL_ORIGINAL
  status = NOT_AVAILABLE_TO_TALOS
```

while:

```text
PNG captured representation
  status = AVAILABLE_TO_TALOS
```

## Q12 example

```text
SourceAvailabilityRecord
  representationClass = NATIVE_STRUCTURED_MODEL
  status = NOT_SUPPLIED
```

while:

```text
PNG screenshot
  status = AVAILABLE_TO_TALOS
```

If a native canvas export arrives later, the historical `NOT_SUPPLIED` record remains evidence of the earlier state and a later availability record or revision records the new state.

---

# 7. Declared format vs observed format

Preserve independently:

```text
declaredName
declaredExtension
declaredMimeType
observedMimeType
observedSignature
contentHash
```

No field silently overwrites another.

Q06 remains the regression example:

```text
declaredName: quarry-06.ppm
declaredExtension: ppm
observedSignature: PNG
```

This is source truth, not a parsing inconvenience.

---

# 8. SourcePlane

A source may contain several evidence planes.

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
FUNCTIONAL_MODEL
ANALYTIC_SIMULATION
RUNTIME_EVIDENCE
UNKNOWN
SOURCE_DEFINED
```

Visible evidence may be preserved without being promoted into canonical process semantics.

---

# 9. EvidenceFragment

`EvidenceFragment` identifies local evidence supporting a claim.

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

`structuralAnchor` may preserve notation-local geometry such as:

```text
edge attaches to left side of function box
```

without making that geometry globally meaningful across all artifact classes.

---

# 10. SourceOccurrence

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

Initial `occurrenceKind`:

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

Notation-specific values such as a Q12 function box may be held in:

```text
sourceAssertedType / candidateSemanticType
```

without forcing every source notation into the provenance-core occurrence enum.

Occurrence identity survives normalization until equivalence is proven.

---

# 11. SemanticClaim

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

Claims are property-scoped.

This remains the mechanism for notation-specific semantics.

Example from Q12:

```text
subjectRef: edge-occurrence-42
propertyPath: relationshipRole
value: FUNCTION_CONTROL
truthClass: INFERRED
confidence: ...
evidenceFragmentRefs:
  - connector geometry
  - repeated local pattern
interpretationMethod: ICOM-like source-pattern interpretation
```

This does **not** make `FUNCTION_CONTROL` a universal edge type.

Example from Q11:

```text
subject: text-fragment-17
property: literalText
value: Brainst
truthClass: SOURCE_TRUTH
```

while:

```text
subject: text-fragment-17
property: interpretedMeaning
value: brainstorm
truthClass: INFERRED
```

can coexist.

---

# 12. TruthClass

```text
SOURCE_TRUTH
INFERRED
SUGGESTED
CONFIRMED
EXECUTABLE
```

Truth class describes epistemic/acceptance state.

It does not describe source type, confidence, perspective or execution readiness.

Confirmation does not rewrite historical inference.

---

# 13. EvidencePerspective

```text
BUSINESS_INTENT
IMPLEMENTED_BEHAVIOR
OPERATIONAL_OBSERVATION
ANALYTIC_MODEL
DESIGN_SUGGESTION
SOURCE_DEFINED
UNKNOWN
```

Perspective remains independently assignable at artifact, fragment or claim level.

---

# 14. ProvenanceLink

```text
ProvenanceLink
- id
- targetRef
- targetPropertyPath?
- sourceOriginId
- sourceArtifactId
- sourceCaptureId?
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

`sourceOriginId` is new in v0.3 and provides direct backtracking to the protected origin.

A link to captured bytes does not imply that captured bytes are the native/original source medium.

---

# 15. Relationship provenance

Relationships are first-class claim subjects.

Examples of independently claimable properties:

```text
edge.kind
edge.relationshipRole
edge.sourceNodeId
edge.targetNodeId
edge.condition
edge.direction
edge.correlationMeaning
edge.decompositionMeaning
```

This supports Q08 uncertainty and Q12 source-specific function relationships without flattening either into generic sequence.

Example:

```text
EDGE exists              SOURCE_TRUTH
attachment side          SOURCE_TRUTH / observed geometry
relationshipRole         INFERRED
runtime sequencing       UNRESOLVED
```

---

# 16. Conceptual identity vs occurrence identity

Preserve the chain:

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

# 17. Causality preservation

Normalization may share downstream handlers while preserving branch-origin evidence.

```text
CancelOrder
```

can retain:

```text
OUT_OF_STOCK
CARD_INVALID
```

as distinct causal provenance.

Shared handling never authorizes loss of reason/path identity.

---

# 18. ConflictRecord

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

Statuses:

```text
UNRESOLVED
RESOLVED
DEFERRED
```

Resolution never deletes conflicting evidence.

---

# 19. ConfirmationRecord

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

Decisions:

```text
ACCEPT
REJECT
AMEND
DEFER
```

Confirmation is historical authority evidence, not a boolean mutation.

---

# 20. TransformationRecord

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

Initial kinds:

```text
CAPTURE
PARSE
PERCEPTION
TRANSCRIPTION
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

Lineage is now explicitly:

```text
SourceOrigin
   ↓
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

with `SourceAvailabilityRecord` describing native/source representations that are not currently available to Talos.

---

# 21. ProcessDefinition vs ProcessRevision

```text
ProcessDefinition
    └── ProcessRevision*
```

A corrected interpretation, conflict resolution, Canvas edit, confirmation or materially changed source evidence creates a new accepted `ProcessRevision` when semantic truth changes.

Historical revisions retain their original provenance graph.

---

# 22. Multi-source normalization

One logical process may be supported by many origins/artifacts:

```text
BPMN
+ SOP
+ photographed whiteboard
+ operator explanation
+ existing automation
+ runtime observation
```

The model supports:

- many source origins;
- many captures per origin;
- many representations per artifact;
- availability evidence for missing/native representations;
- many claims per subject/property;
- conflicting claims;
- differing evidence perspectives;
- source authority where explicitly defined;
- unresolved conflicts where authority is absent.

A merger may not silently collapse disagreement or provenance simply because one representation is newer or cleaner.

---

# 23. Source-specific semantics remain extensions/claims

Provenance does not attempt to become a universal notation ontology.

Examples:

## BPMN

```text
source element ID/type
gateway/event subtype
pool/lane context
boundary relation
extension metadata
```

## Petri Net

```text
place / transition / arc
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

## Functional model / Q12

```text
business function candidate
relationshipRole:
  FUNCTION_INPUT
  FUNCTION_CONTROL
  FUNCTION_OUTPUT
  FUNCTION_MECHANISM
functional dependency
abstraction/decomposition claim
```

These remain property-scoped, evidence-backed claims whose interpretation is local to the classified source/notation context.

## Hand-drawn source / Q11

```text
physical origin
captured image
handwritten literal token
interpreted text
source topology
unresolved business meaning
```

The capture medium does not change the truth class of the interpreted semantics.

---

# 24. No silent overwrites

If a user edits an imported source through Talos Canvas:

```text
SourceOrigin A
  ↓
Capture / imported representation
  ↓
Interpretation / ProcessRevision N
  ↓
Canvas edit
  ↓
Talos-native origin/artifact/revision
  ↓
ProcessRevision N+1
```

The Talos-native edit is new lineage. It does not replace the imported source origin.

If Talos redraws, screenshots, transcodes or re-renders a source, the resulting representation is classified accordingly and does not inherit native byte identity.

---

# 25. Source availability is historical evidence

Availability changes over time.

Example:

```text
T0
native canvas model: NOT_SUPPLIED
screenshot: AVAILABLE_TO_TALOS

T1
native canvas model: AVAILABLE_TO_TALOS
screenshot: AVAILABLE_TO_TALOS
```

Talos should preserve both observations/revisions.

This matters because an interpretation made at T0 may have relied only on visual evidence, while a later interpretation may use stronger structured evidence.

New evidence does not retroactively make the old interpretation source-native.

---

# 26. T1-02 acceptance criteria v0.3

The Provenance Model can freeze only if Talos can answer:

1. What underlying source origin supplied the evidence?
2. Was that origin physical, digital-native, human-expression, system/runtime or Talos-native?
3. By which capture event did the evidence become available?
4. Which concrete representation was actually interpreted?
5. Is the representation native digital, captured bytes, exact copy, derivative, preview, transcript or normalized serialization?
6. What exact bytes/hash belong to that representation, if bytes exist?
7. Can Talos avoid treating that hash as identity of a physical/non-byte origin?
8. What native/source representations are available, not supplied, unavailable, not applicable or unknown?
9. What was the declared filename/format and what format/signature was observed?
10. Which source plane contained the evidence?
11. Which exact source occurrence/region/text span/structural anchor supported the claim?
12. Which semantic property or relationship role was claimed?
13. Was the claim source truth, inferred, suggested, confirmed or executable?
14. What confidence applies to that property independently of truth class?
15. What evidence perspective applies?
16. Which parser/model/agent/transformation version produced the interpretation?
17. Did another origin/artifact/claim disagree?
18. Who/what had authority to resolve the disagreement?
19. Which confirmation/resolution produced the accepted meaning?
20. Which immutable ProcessRevision inherited that meaning?
21. Which future ExecutionPlan/DeploymentRevision derives from it?
22. Can shared normalized handling still explain its source branch/cause?
23. Can same-label occurrences remain distinct until equivalence is proven?
24. Can relationship uncertainty remain independent from node certainty?
25. Can non-process evidence remain preserved without contaminating execution semantics?
26. Can notation-local geometry support an interpretation without becoming a universal rule?
27. Can physical/canvas capture evidence be used without pretending the captured representation is the underlying origin?
28. Can later arrival of stronger/native source evidence extend lineage without rewriting what Talos previously knew?

---

# 27. Freeze boundary

This file is created as the regression target for T1-02.

It may be marked `FROZEN v0.3` only after P01–P28 are rerun and all pass without source loss, false identity, implicit source availability, or silent epistemic promotion.

Required next evidence:

```text
test/06-PROVENANCE-REGRESSION-RESULT-v0.1.md
```

Until that evidence exists:

```text
T1-02       OPEN
BUILD       CLOSED
```
