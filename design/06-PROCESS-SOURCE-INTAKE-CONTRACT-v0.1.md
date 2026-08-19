# TALOS — Process Source Intake Contract v0.1

Status: **DESIGN CANDIDATE / PHASE-2 FOUNDATION**  
Date: **2026-08-19**

## Purpose

This contract teaches TALOS how to **receive real process expressions** without requiring every input to look like a workflow or to be immediately canonical/executable.

It is intentionally source-agnostic.

A user may provide:

```text
TALOS native Canvas
BPMN / Bizagi
UML Activity
UPN / EPC / Petri / SIPOC / VSM
Mermaid / draw.io
photo of paper
whiteboard/canvas screenshot
functional model
reference architecture
natural language / SOP
existing automation
runtime observation
other source-defined evidence
```

The intake boundary must preserve what arrived before asking what it means.

---

# 1. Intake principle

```text
RECEIVE
  ↓
PRESERVE
  ↓
CLASSIFY
  ↓
ADDRESS SOURCE EVIDENCE
  ↓
INTERPRET
  ↓
NORMALIZE CANDIDATE SCOPE(S)
  ↓
VALIDATE
```

Never:

```text
receive
  ↓
force into workflow boxes
  ↓
generate execution
```

---

# 2. Universal invariants

```text
SOURCE INPUT                    ≠ PROCESS AUTOMATICALLY
ARTIFACT CLASSIFICATION         ≠ EXECUTION CLASSIFICATION
SOURCE EDGE                     ≠ SEQUENCE AUTOMATICALLY
VISIBLE BOX                     ≠ ACTION AUTOMATICALLY
NATIVE SOURCE ID                ≠ CANONICAL ID
ONE ARTIFACT                    ≠ ONE PROCESS
ONE ARTIFACT                    MAY PRODUCE 0..N CANDIDATE SCOPES
ADAPTER OUTPUT                  ≠ TEMPORAL MODEL
PARSE/PERCEPTION                ≠ SOURCE TRUTH AUTOMATICALLY
MISSING SEMANTIC DETAIL         ≠ INTAKE FAILURE
UNKNOWN                         ≠ REJECTED INPUT
```

An intake succeeds when TALOS can preserve and address the source safely, even if the result is:

```text
artifact understood
process scope unresolved
execution readiness insufficient
```

---

# 3. SourceIntakeSession

A user interaction/import operation begins a source-intake session.

```text
SourceIntakeSession
- id
- startedAt
- initiatedBy?
- channel
- sourceInputRefs[]
- declaredIntent?
- notes?
```

Possible `channel` values:

```text
TALOS_CANVAS
FILE_UPLOAD
PASTE
CONNECTOR
API
SCREENSHOT
PHOTO_SCAN
NATURAL_LANGUAGE
AUTOMATION_IMPORT
RUNTIME_OBSERVATION
SOURCE_DEFINED
```

A session may contain multiple source artifacts.

Example:

```text
BPMN
+ SOP PDF
+ screenshot
+ operator explanation
```

may all belong to one intake session without being collapsed into one source.

---

# 4. Intake produces provenance objects first

Before semantic normalization, the intake layer creates/links frozen Provenance v0.3 concepts:

```text
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation
SourceAvailabilityRecord
```

This means every adapter begins from the same provenance foundation.

Examples:

```text
paper sketch → photo
```

and:

```text
native BPMN file → direct upload
```

and:

```text
Talos Canvas → native structured revision
```

all enter through different origin/capture/representation facts while preserving a common lineage model.

---

# 5. ArtifactClassification

Classification precedes workflow interpretation.

```text
ArtifactClassification
- id
- sourceArtifactId
- artifactClass
- truthClass
- confidence?
- evidenceFragmentRefs[]
- classifierRef?
- classifierVersion?
```

Initial classes may include:

```text
PROCESS_DIAGRAM
COLLABORATION_DIAGRAM
ACTIVITY_MODEL
FUNCTIONAL_MODEL
REFERENCE_ARCHITECTURE
SERVICE_TOPOLOGY
PROCESS_DOCUMENT
WHITEBOARD_CAPTURE
HAND_DRAWN_PROCESS
TALOS_CANVAS
EXISTING_AUTOMATION
RUNTIME_OBSERVATION
MIXED_ARTIFACT
SOURCE_DEFINED
UNKNOWN
```

Classification may be deterministic for native structured formats and inferred for images/text.

Rule:

```text
REFERENCE_ARCHITECTURE
      ≠
failed process import
```

It is a valid source class whose executable slices may be zero or many.

---

# 6. SourceEvidenceGraph

Every adapter should produce an addressable source-evidence graph before canonical normalization.

```text
SourceEvidenceGraph
- id
- sourceArtifactId
- sourceRepresentationId
- adapterId
- adapterVersion
- occurrenceIds[]
- relationshipOccurrenceIds[]
- sourcePlaneIds[]
- evidenceFragmentIds[]
- sourceExtensionRefs[]
- extractionDigest?
```

The graph describes what the adapter can address in the source.

It does not require every occurrence to be a process node.

---

# 7. SourceOccurrenceDescriptor

Adapters expose source occurrences through the frozen provenance model plus adapter-specific descriptors.

```text
SourceOccurrenceDescriptor
- sourceOccurrenceId
- nativeSourceId?
- occurrenceKind
- literalLabel?
- sourceAssertedType?
- candidateSemanticType?
- sourcePlaneRef
- propertyEvidenceRefs[]
- sourceExtensionRefs[]
```

Examples:

```text
BPMN Task
Miro cursor
UML Decision Node
IDEF0-like function box
paper-sketch handwritten rectangle
Petri place
SIPOC supplier cell
Talos Canvas DECISION
```

All can be source occurrences while only some belong to an executable process graph.

---

# 8. SourceRelationshipDescriptor

Edges/relationships are first-class evidence.

```text
SourceRelationshipDescriptor
- sourceOccurrenceId
- nativeSourceId?
- sourceRef?
- targetRef?
- sourceAssertedRole?
- candidateRelationshipRole?
- directionEvidence?
- conditionEvidence?
- propertyEvidenceRefs[]
- sourceExtensionRefs[]
```

Candidate roles can include notation/source-specific meaning such as:

```text
SEQUENCE_CANDIDATE
MESSAGE_CANDIDATE
CONTROL_FLOW_CANDIDATE
OBJECT_DATA_FLOW
TOKEN_FLOW
FUNCTION_INPUT
FUNCTION_CONTROL
FUNCTION_OUTPUT
FUNCTION_MECHANISM
FUNCTIONAL_DEPENDENCY
FUNCTION_DECOMPOSITION
ANNOTATION_RELATIONSHIP
AUTHORING_RELATIONSHIP
SOURCE_DEFINED
UNKNOWN
```

No global arrow semantics are assumed.

---

# 9. Evidence planes

Adapters must segment or label evidence planes when the source contains mixed meaning.

Use frozen `SourcePlane` concepts, including:

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
SOURCE_DEFINED
UNKNOWN
```

Examples:

```text
Miro toolbar
→ AUTHORING_CONTEXT

Miro cursor
→ COLLABORATOR_OVERLAY

red UML teaching arrows
→ NOTATION_ANNOTATION

actual process arrows
→ BUSINESS_GRAPH
```

Visible evidence is preserved even when excluded from canonical process semantics.

---

# 10. Extraction mode

Every adapter declares how evidence became addressable.

```text
ExtractionMode
- NATIVE_STRUCTURED
- STRUCTURED_PARSE
- VISUAL_PERCEPTION
- TEXT_INTERPRETATION
- AUTOMATION_PARSE
- RUNTIME_EVENT_MAPPING
- HYBRID
- SOURCE_DEFINED
```

Examples:

```text
Talos Canvas   → NATIVE_STRUCTURED
BPMN XML       → STRUCTURED_PARSE
paper photo    → VISUAL_PERCEPTION
SOP paragraph  → TEXT_INTERPRETATION
n8n JSON       → AUTOMATION_PARSE
```

Extraction mode informs provenance; it does not by itself assign truth class.

---

# 11. CandidateSemanticScope

One artifact may yield zero, one or many semantic scopes.

```text
CandidateSemanticScope
- id
- sourceArtifactId
- sourceEvidenceGraphId
- kind
- includedOccurrenceRefs[]
- excludedOccurrenceRefs[]
- parentScopeId?
- candidateName?
- purpose?
- truthClass
- confidence?
- evidenceRefs[]
```

`kind`:

```text
PROCESS_CANDIDATE
COLLABORATION
PARTICIPANT_LOCAL_PROCESS
EXECUTABLE_SLICE_CANDIDATE
FUNCTIONAL_MODEL_SCOPE
ARCHITECTURE_SCOPE
BUSINESS_OBJECT_LIFECYCLE
NON_EXECUTABLE_CONTEXT
SOURCE_DEFINED
```

Examples:

### Q06 reference architecture

```text
artifact
  ├── DecisionRequest executable-slice candidate
  ├── ModelLifecycle executable-slice candidate
  └── architecture/resource context
```

### Q05 collaboration

```text
artifact
  ├── Ward local flow
  ├── Pharmacy local flow
  └── collaboration scope
```

### Native Talos Canvas

Initial T2-01 normally emits one `PROCESS_CANDIDATE`, but the contract does not make one-process-per-artifact a universal law.

---

# 12. InterpretationClaimSet

Adapters/interpreters attach semantic claims instead of mutating source evidence.

```text
InterpretationClaimSet
- id
- sourceEvidenceGraphId
- semanticClaimRefs[]
- interpreterRef
- interpreterVersion
- configurationDigest?
```

Use frozen `SemanticClaim` fields:

```text
subjectRef
propertyPath
value
perspective
truthClass
confidence
evidenceFragmentRefs[]
interpretationMethod
interpreterVersion
```

Native structured source may generate deterministic `SOURCE_TRUTH` claims for source-defined properties.

Visual/text interpretation often yields `INFERRED` claims.

---

# 13. AdapterResult

The common source-adapter result is:

```text
AdapterResult
- sourceIntakeSessionId
- sourceOriginIds[]
- sourceArtifactIds[]
- sourceRepresentationIds[]
- artifactClassificationIds[]
- sourceEvidenceGraphIds[]
- candidateScopeIds[]
- interpretationClaimSetIds[]
- diagnostics[]
- adapterId
- adapterVersion
- completedAt
```

It does **not** contain Temporal execution primitives.

The next normalization stage consumes candidate scopes/claims and emits canonical `ProcessRevision` candidates with provenance links.

---

# 14. Adapter diagnostics

An adapter may succeed with diagnostics.

```text
AdapterDiagnostic
- code
- severity
- sourceRef?
- description
- impact
- recoverability
```

Examples:

```text
image text partially unreadable
native canvas export not supplied
BPMN extension unsupported but preserved raw
edge endpoint ambiguous
artifact classification uncertain
```

Diagnostic presence does not equal intake failure.

A hard intake failure should be reserved for cases where TALOS cannot safely preserve/address the supplied evidence at all.

---

# 15. Native vs inferred adapters

## Native / structured adapters

Examples:

```text
Talos Canvas
BPMN
Mermaid AST
n8n JSON
Step Functions definition
```

Strength:

- stable source IDs;
- explicit structure;
- exact literals;
- deterministic parsing.

Still unresolved:

- business intent;
- execution authority;
- hidden external semantics;
- whether implemented behavior is desired behavior.

## Perception / text adapters

Examples:

```text
photo
screenshot
handwriting
whiteboard
natural language
SOP
```

Additional requirements:

- local confidence;
- literal transcription separate from interpreted meaning;
- region/text-span evidence;
- explicit ambiguity;
- no automatic promotion to source-confirmed process semantics.

---

# 16. Existing automation intake

An imported automation is evidence of implementation.

Default perspective:

```text
IMPLEMENTED_BEHAVIOR
```

not automatically:

```text
BUSINESS_INTENT
```

Example:

```text
n8n node retries 5 times
```

may be parsed exactly while still remaining evidence of current implementation rather than business policy.

---

# 17. Runtime observation intake

Runtime/process-mining evidence enters as:

```text
OPERATIONAL_OBSERVATION
```

It may later disagree with designed business intent.

TALOS preserves that disagreement through claims/conflicts instead of rewriting the designed process to match observation automatically.

---

# 18. Natural-language intake

Natural language is not treated as a second-class source.

TALOS preserves:

```text
literal text span
speaker/author if known
context
interpretation claim
confidence
unresolved terms
```

Example:

```text
"If it's a big order, ask the manager."
```

preserves source truth while validation may find:

```text
"big" threshold unresolved
```

The adapter must not invent a numeric threshold.

---

# 19. Multi-source intake and merge boundary

A source intake session may contain multiple evidence artifacts for one logical process.

The adapter layer does not choose a winner.

```text
BPMN says threshold = 10,000
SOP says threshold = 5,000
```

produces two claims and a later `ConflictRecord` if they target the same semantic property.

Merge/authority resolution occurs in semantic normalization/review, not destructive import.

---

# 20. Intake to normalization

The architecture boundary is:

```text
REAL SOURCE
   ↓
SOURCE INTAKE + ADAPTER
   ↓
AdapterResult
   ↓
CandidateSemanticScope(s)
   ↓
NORMALIZATION
   ↓
Canonical ProcessRevision candidate
   ↓
ProvenanceLink(s)
   ↓
T1-03 ValidationAssessment
```

This separates:

```text
what was received
what was observed
what was interpreted
what was normalized
what was validated
```

---

# 21. Intake completion states

Suggested intake status vocabulary:

```text
RECEIVED
PRESERVED
CLASSIFIED
EXTRACTED
INTERPRETED
READY_FOR_NORMALIZATION
PARTIAL_WITH_DIAGNOSTICS
UNSAFE_TO_INTERPRET
```

`PARTIAL_WITH_DIAGNOSTICS` is a successful, useful state.

Example:

```text
handwritten graph topology mostly clear
one label unreadable
```

should not discard the whole source.

---

# 22. Security / trust boundary

Source intake may contain:

```text
credentials accidentally visible in screenshots
secret values in automation exports
PII / sensitive documents
internal URLs
```

The intake layer preserves required source evidence while security policy must prevent secrets from being copied into canonical business semantics or prompts unnecessarily.

Concrete secret-storage/redaction implementation belongs to later architecture/build, but the boundary is established now:

```text
source evidence may contain sensitive content
      ≠
canonical model should copy all source content
```

---

# 23. Phase-2 adapter rule

Every source adapter introduced after T2-01 must prove:

1. source origin/capture/representation preservation;
2. source occurrence identity where available;
3. source relationship identity/role preservation;
4. classification before process assumption;
5. evidence-plane separation when needed;
6. property-scoped claims/confidence;
7. 0..N candidate semantic scopes;
8. no direct Temporal output;
9. no silent business-truth invention;
10. successful T1-01/T1-02/T1-03 regression for representative fixtures.

---

# 24. Immediate T2-01 specialization

For native TALOS Canvas:

```text
ExtractionMode = NATIVE_STRUCTURED
origin = TALOS_NATIVE / TALOS_CANVAS
representation = NATIVE_STRUCTURED CanvasRevision
artifact class = TALOS_CANVAS / PROCESS_DIAGRAM
source IDs = stable Canvas element/relationship identities
candidate scope = PROCESS_CANDIDATE
```

No screenshot/perception step is required.

The Canvas becomes the reference adapter implementation against which BPMN and image adapters are later compared.

---

# 25. Acceptance statement

Talos has learned to receive a real process expression when it can say:

```text
I preserved what you gave me.
I know what kind of source I think it is.
I can point to the exact evidence I used.
I distinguish what the source states from what I inferred.
I have not forced non-process context into a workflow.
I can identify zero, one or several process/executable candidates.
I can normalize candidate meaning without replacing the origin.
I can tell you what remains unknown before automation design.
```

That is the Phase-2 intake boundary.
