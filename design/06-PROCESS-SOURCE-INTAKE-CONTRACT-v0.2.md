# TALOS — Process Source Intake Contract v0.2

Status: **DESIGN CANDIDATE / T2-01 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active Phase-2 design: `06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

The first T2-01 pressure test produced:

```text
C01–C20
18 PASS
 2 FAIL
```

The intake-level failure was:

```text
C20 — adapter failure after successful source preservation
```

v0.1 preserved source evidence correctly, but only modeled a successful/partial `AdapterResult`. It did not make a failed adapter execution a first-class historical object.

v0.2 adds explicit `AdapterAttempt` lineage so a failed extraction can be explained, retried and compared without re-creating or mutating the source.

It also adopts the Canvas v0.2 rule that source relationships may be incomplete/dangling while remaining valid evidence.

---

# 1. Intake pipeline

```text
RECEIVE
  ↓
PRESERVE
  ↓
CLASSIFY
  ↓
ADDRESS SOURCE EVIDENCE
  ↓
ATTEMPT EXTRACTION / INTERPRETATION
  ↓
0..N CANDIDATE SEMANTIC SCOPES
  ↓
NORMALIZE
  ↓
VALIDATE
```

A failed adapter attempt does not roll back `RECEIVE/PRESERVE`.

---

# 2. Invariants

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
DANGLING RELATIONSHIP           ≠ INTAKE FAILURE
ADAPTER FAILURE                 ≠ SOURCE LOSS
FAILED ATTEMPT                  ≠ FAILED SOURCE
RETRY ATTEMPT                   ≠ SOURCE RE-CAPTURE
UNKNOWN                         ≠ REJECTED INPUT
```

---

# 3. SourceIntakeSession

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

Channels:

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

One intake session may contain many independent artifacts/evidence perspectives.

---

# 4. Provenance first

Before adaptation, preserve/establish:

```text
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation
SourceAvailabilityRecord
```

The adapter never owns source survival.

This makes the following valid:

```text
source preserved ✅
adapter failed   ⚠
canonical output absent ✅
```

---

# 5. ArtifactClassification

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

Classes include:

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

Classification precedes process assumption.

---

# 6. SourceEvidenceGraph

```text
SourceEvidenceGraph
- id
- sourceArtifactId
- sourceRepresentationId
- adapterAttemptId
- occurrenceIds[]
- relationshipOccurrenceIds[]
- sourcePlaneIds[]
- evidenceFragmentIds[]
- sourceExtensionRefs[]
- extractionDigest?
```

The graph may be partial.

A partially extracted graph is still useful evidence when diagnostics explain the gap.

---

# 7. SourceOccurrenceDescriptor

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

Occurrences need not be executable/process nodes.

---

# 8. SourceRelationshipDescriptor

```text
SourceRelationshipDescriptor
- sourceOccurrenceId
- nativeSourceId?
- sourceRef?
- targetRef?
- sourceEndpointState?
- targetEndpointState?
- sourceAssertedRole?
- candidateRelationshipRole?
- directionEvidence?
- conditionEvidence?
- propertyEvidenceRefs[]
- sourceExtensionRefs[]
```

Endpoint state may include source-defined values such as:

```text
SET
UNKNOWN
UNCONNECTED
```

The common intake model therefore supports source relationships that cannot yet become complete canonical edges.

Candidate relationship roles remain source/notation aware:

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

---

# 9. Evidence planes

Use frozen `SourcePlane` concepts:

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

A source can preserve visible context without promoting it into process semantics.

---

# 10. ExtractionMode

```text
NATIVE_STRUCTURED
STRUCTURED_PARSE
VISUAL_PERCEPTION
TEXT_INTERPRETATION
AUTOMATION_PARSE
RUNTIME_EVENT_MAPPING
HYBRID
SOURCE_DEFINED
```

Examples:

```text
Talos Canvas → NATIVE_STRUCTURED
BPMN XML     → STRUCTURED_PARSE
paper photo  → VISUAL_PERCEPTION
SOP          → TEXT_INTERPRETATION
n8n JSON     → AUTOMATION_PARSE
```

---

# 11. AdapterAttempt — new in v0.2

Every invocation of a source adapter is a first-class immutable attempt record.

```text
AdapterAttempt
- id
- sourceIntakeSessionId
- sourceOriginId
- sourceArtifactId
- sourceRepresentationId
- adapterId
- adapterVersion
- mappingRegistryVersion?
- canonicalModelVersion?
- extractionMode
- inputFingerprint
- status
- startedAt
- completedAt?
- failureStage?
- diagnosticIds[]
- resultId?
- retryOfAttemptId?
- configurationDigest?
```

`status`:

```text
STARTED
SUCCEEDED
PARTIAL
FAILED
```

`failureStage` may include:

```text
CLASSIFICATION
SOURCE_EXTRACTION
PLANE_SEGMENTATION
RELATIONSHIP_EXTRACTION
SEMANTIC_INTERPRETATION
SCOPE_DISCOVERY
RESULT_MATERIALIZATION
SOURCE_DEFINED
```

The attempt record is immutable after completion.

A retry is a new attempt linked through `retryOfAttemptId`.

---

# 12. Input fingerprint and logical idempotency

`inputFingerprint` is deterministically derived from the semantic inputs that define one adaptation attempt, at minimum:

```text
sourceRepresentation content/native digest
adapterId + adapterVersion
mappingRegistryVersion where applicable
canonicalModelVersion where mapping depends on it
adapter configuration digest where semantic
```

Rules:

```text
same fingerprint
→ same logical adaptation input
```

but a retry may still create a new `AdapterAttempt` for audit purposes.

The system may reuse an existing successful immutable result for the same fingerprint rather than duplicating semantic truth.

A new adapter/version/configuration produces a new fingerprint and may generate a new interpretation candidate while historical attempts remain available.

---

# 13. AdapterDiagnostic

```text
AdapterDiagnostic
- id
- adapterAttemptId
- code
- severity
- sourceRef?
- description
- impact
- recoverability
```

Examples:

```text
handwritten label partially unreadable
native canvas export not supplied
unsupported extension preserved raw
edge endpoint ambiguous
artifact classification uncertain
parser failed at one source region
```

Diagnostics survive even when the attempt fails.

---

# 14. AdapterResult

`AdapterResult` exists for `SUCCEEDED` or `PARTIAL` attempts.

```text
AdapterResult
- id
- adapterAttemptId
- sourceOriginIds[]
- sourceArtifactIds[]
- sourceRepresentationIds[]
- artifactClassificationIds[]
- sourceEvidenceGraphIds[]
- candidateScopeIds[]
- interpretationClaimSetIds[]
- completedAt
```

A `FAILED` attempt may have no `AdapterResult`.

The attempt + diagnostics remain the complete failure evidence.

---

# 15. CandidateSemanticScope

One artifact may produce 0..N candidate scopes.

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

Kinds:

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

---

# 16. InterpretationClaimSet

```text
InterpretationClaimSet
- id
- adapterAttemptId
- sourceEvidenceGraphId
- semanticClaimRefs[]
- interpreterRef
- interpreterVersion
- configurationDigest?
```

Claims retain property-level truth/confidence/perspective from frozen Provenance v0.3.

---

# 17. Failed-attempt lifecycle

Example:

```text
CanvasRevision 12 preserved
SourceRepresentation sr-12 preserved
        ↓
AdapterAttempt a-1
status = FAILED
failureStage = SOURCE_EXTRACTION
diagnostic = adapter internal failure
        ↓
NO source deletion
NO new capture
NO fake canonical result
        ↓
AdapterAttempt a-2
retryOfAttemptId = a-1
same inputFingerprint
status = SUCCEEDED
        ↓
AdapterResult r-2
```

Talos can now answer exactly what failed and what later succeeded.

---

# 18. Partial-attempt lifecycle

For perception/text sources:

```text
most evidence extracted
one region unresolved
```

may be:

```text
status = PARTIAL
AdapterResult exists
SourceEvidenceGraph partial
Diagnostics explain gap
CandidateSemanticScope(s) may still exist
```

Partial is not failure.

---

# 19. Normalization boundary

The adapter result is not the canonical model.

```text
AdapterResult
  ↓
CandidateSemanticScope
  ↓
CanonicalNormalizer
  ↓
ProcessRevision candidate
  ↓
ProvenanceLinks
  ↓
SemanticValidator v0.2
```

An incomplete native relationship may remain in source evidence and produce a validation finding without producing a fabricated canonical edge.

---

# 20. Native, structured, perception and runtime adapters

## Native / structured

Examples:

```text
Talos Canvas
BPMN
Mermaid AST
n8n JSON
Step Functions
```

Provide stronger source IDs/structure but still do not prove desired business intent/execution.

## Perception / text

Examples:

```text
photo
screenshot
handwriting
whiteboard
natural language
SOP
```

Require local confidence and literal-vs-interpreted separation.

## Existing automation

Default perspective:

```text
IMPLEMENTED_BEHAVIOR
```

## Runtime observation

Default perspective:

```text
OPERATIONAL_OBSERVATION
```

No evidence perspective silently overwrites another.

---

# 21. Multi-source intake

Multiple artifacts may support/conflict on one process.

Adapters preserve claims independently.

Merge/authority resolution happens later through frozen conflict/confirmation contracts.

---

# 22. Intake completion states

Session/artifact processing may report:

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

AdapterAttempt status is separate from overall intake/preservation state.

---

# 23. Security boundary

Sensitive source evidence may exist without being copied into canonical semantics by default.

```text
source evidence contains secret/PII
      ≠
canonical model copies it automatically
```

Concrete redaction/storage implementation is later work.

---

# 24. Phase-2 adapter conformance

Every future adapter must prove:

1. source origin/capture/representation preservation;
2. first-class AdapterAttempt history;
3. source occurrence/relationship identity where available;
4. incomplete relationship preservation where source supports it;
5. classification before process assumption;
6. evidence-plane separation;
7. property-scoped claims/confidence;
8. 0..N semantic scopes;
9. no direct Temporal output;
10. no source loss on adapter failure;
11. deterministic/replayable input fingerprint;
12. successful Canonical/Provenance/Validation regression.

---

# 25. T2-01 specialization

For TALOS Canvas:

```text
origin = TALOS_NATIVE / TALOS_CANVAS
representation = NATIVE_STRUCTURED CanvasRevision
extractionMode = NATIVE_STRUCTURED
source IDs = stable Canvas identities + revision snapshots
candidate scope = PROCESS_CANDIDATE by initial product contract
```

Canvas v0.2 allows unresolved endpoints as valid source evidence.

---

# 26. Regression target

This contract must pass C01–C20, especially:

```text
C20 adapter failure after preservation
```

without weakening C16 idempotent/replay behavior or any frozen Phase-1 contract.

BUILD remains closed until regression and freeze.
