# TALOS — Origin, Provenance & Normalization Contract v0.1

Status: **DESIGN DRAFT / CORE CONTRACT**

## Fundamental rule

> Normalization is allowed. Origin loss is not.

TALOS must create a common semantic representation while preserving enough source context to explain where every meaningful element came from and how it changed through interpretation and standardization.

## SourceArtifact

A source artifact is an immutable captured input used to derive process knowledge.

Candidate fields:

```text
SourceArtifact
- id
- type
- format
- originalName
- sourceSystem
- sourceUri?
- capturedAt
- contentHash
- rawArtifactRef
- parserVersion?
- metadata
```

Examples:

```text
IMAGE
BPMN_XML
BIZAGI_EXPORT
UPN_DOCUMENT
UML_ACTIVITY
EPC
PETRI_NET
SIPOC
VSM
MERMAID
draw.io
NATURAL_LANGUAGE
EXISTING_WORKFLOW
TALOS_CANVAS
```

## ProcessDefinition vs ProcessRevision

`ProcessDefinition` identifies the logical business process.

`ProcessRevision` is an immutable semantic revision of that process.

```text
ProcessDefinition
    └── ProcessRevision*
```

Editing a source or accepting an inference should create a new semantic revision rather than silently changing the meaning of a prior execution.

## ProvenanceLink

Every canonical element should be able to link back to one or more sources.

Conceptually:

```text
ProvenanceLink
- processElementId
- sourceArtifactId
- sourceElementRef?
- evidenceType
- extractionMethod
- confidence
- truthClass
- interpreterVersion
- confirmedBy?
- confirmedAt?
```

## Truth classes

### SOURCE_TRUTH
Directly supported by the source.

### INFERRED
Derived by parser/AI/rules from available evidence.

### SUGGESTED
Introduced as a possible refinement or implementation proposal.

### CONFIRMED
Explicitly accepted by an authorized human or authoritative system.

### EXECUTABLE
Has enough semantics and validation to participate in an approved execution plan.

These classes are not mutually equivalent.

An element may evolve:

```text
INFERRED → CONFIRMED → EXECUTABLE
```

but the historical origin must remain visible.

## Confidence is not truth

A high-confidence AI inference is still an inference.

For example:

```text
confidence: 0.99
truthClass: INFERRED
```

must not be silently relabeled as `SOURCE_TRUTH`.

## Multi-source normalization

TALOS may receive several artifacts for the same process.

Example:

```text
BPMN diagram
+ SOP document
+ screenshot
+ operator explanation
+ existing n8n workflow
```

The normalized process must support multiple provenance links and conflict detection.

When two sources disagree, TALOS should preserve the disagreement rather than arbitrarily selecting one as truth.

Possible resolution state:

```text
CONFLICT
- source A says branch is optional
- source B says branch is mandatory
- unresolved until confirmed
```

## Notation-specific semantics

Normalization must retain semantic features that may not have direct equivalents in other notations.

Examples:

### Petri Net
Preserve evidence about concurrency, places/transitions and synchronization.

### SIPOC
Preserve supplier/input/output/customer relationships even when they do not become executable nodes directly.

### BPMN
Preserve event/gateway/subprocess semantics and source element IDs.

### UPN
Preserve hierarchical action structure and role/context semantics.

### VSM
Preserve value/waste/timing observations even if only some become workflow execution steps.

Canonicalization must therefore support extensions/source annotations rather than discarding notation-specific knowledge.

## Transformation record

Each significant transformation should be traceable.

```text
SourceArtifact
    ↓ parser/perception version
CandidateModel
    ↓ semantic normalization version
ProcessRevision
    ↓ automation designer version
ExecutionPlan
    ↓ compiler version
DeploymentRevision
```

This chain should make it possible to answer:

- Which artifact introduced this step?
- Was this step inferred or explicitly drawn?
- Who confirmed the interpretation?
- Which model/compiler version produced the execution design?
- Which process revision did a running Temporal workflow originate from?

## No silent overwrites

If a user edits an imported process inside the TALOS Canvas, the original artifact must remain preserved.

The Canvas edit becomes a new process revision with provenance describing the relationship to the original.

## Design acceptance criteria

This contract is considered closed only when the canonical model can represent:

1. multiple source artifacts;
2. source-specific element references;
3. confidence separately from truth status;
4. conflicts between sources;
5. human confirmation;
6. immutable revisions;
7. compiler/transformation versions;
8. traceability from execution back to source.
