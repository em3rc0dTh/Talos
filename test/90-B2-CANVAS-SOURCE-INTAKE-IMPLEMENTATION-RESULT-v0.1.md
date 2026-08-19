# TALOS — B2 Canvas / Source / Intake Implementation Result v0.1

Status: **B2 GATE CLOSED — PASS**  
Date: **2026-08-19**

## Scope

B2 implements only the frozen native Canvas + common source-intake boundary inside:

```text
build/reference-vertical-slice/
```

B2 does **not** implement Canonical normalization, frozen Provenance materialization or Semantic Validation. Those remain B3.

Historical C01–C20 ownership was explicitly split before implementation in:

```text
test/89-B2-C01-C20-STAGE-OWNERSHIP-MATRIX-v0.1.md
```

Therefore this result uses the precise phrase:

```text
C01–C20 SOURCE / INTAKE ASSERTIONS
```

and does not claim the historical suite is end-to-end closed yet.

## Implemented packages

```text
packages/source-intake/
packages/canvas-source/
```

### Source-intake implementation

Implements reference representations for:

```text
SourceIntakeSession
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation
SourceAvailabilityRecord
ArtifactClassification
SourcePlaneDescriptor
SourcePropertyEvidenceDescriptor
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
SourceEvidenceGraph
CandidateSemanticScope
AdapterAttempt lifecycle
AdapterDiagnostic
AdapterResult
```

The implementation preserves the frozen intake law:

```text
RECEIVE / PRESERVE
        ↓ commit first
ADAPTER ATTEMPT
        ↓
EVIDENCE GRAPH / CANDIDATE SCOPE
```

### Append-only AdapterAttempt lifecycle

Because the B1 persistence layer is append-only, one logical frozen `AdapterAttempt` is implemented through immutable records:

```text
AdapterAttemptStart
        +
AdapterAttemptCompletion
        +
AdapterDiagnostic[]
        +
AdapterResult?
```

`getAttemptView()` reconstructs the contract view without updating a historical STARTED row.

This preserves:

```text
STARTED before extraction
FAILED/PARTIAL/SUCCEEDED history
retryOfAttemptId lineage
no immutable-row mutation
```

## Native Canvas implementation

Implements:

```text
CanvasDefinition
CanvasRevision
CanvasElementIdentity / Snapshot
CanvasRelationshipIdentity / Snapshot
CanvasPropertyValue
CanvasEndpointRef SET / UNKNOWN / UNCONNECTED
CanvasGuard
CanvasContainerMembership
CanvasPresentationSnapshot
CanvasChangeSet
TalosCanvasNativeSource envelope
```

### Digest separation

The native revision builder computes:

```text
semanticDigest
nativeRepresentationDigest
```

Presentation is excluded from semantic projection.

Therefore:

```text
presentation-only edit
→ native digest changes
→ semantic digest unchanged
```

while a semantic property/relationship edit changes semantic digest.

### Incomplete relationship rule

A native relationship may contain:

```text
targetEndpoint = UNKNOWN
```

or:

```text
targetEndpoint = UNCONNECTED
```

without requiring a fabricated element. The source adapter preserves that endpoint state in `SourceRelationshipDescriptor` and emits no invented target reference.

B3 will later prove that no fake Canonical `ProcessEdge` is created and that Semantic Validation can emit the relevant finding.

## Source preservation

`preserveCanvasRevision()` records before adaptation:

```text
SourceIntakeSession
SourceOrigin(TALOS_NATIVE / TALOS_CANVAS)
SourceCapture(CANVAS_NATIVE)
SourceArtifact observation
SourceRepresentation(NATIVE_STRUCTURED)
SourceAvailabilityRecord
```

An optional screenshot/render remains a secondary `PREVIEW` derived from the native representation.

The primary representation content hash fingerprints the deterministic native envelope.

## Adapter evidence

The native adapter produces source-level evidence only:

```text
property-addressable source evidence descriptors
revision-local SourceOccurrenceDescriptor(s)
SourceRelationshipDescriptor(s)
evidence-plane descriptors
ArtifactClassification = TALOS_CANVAS / SOURCE_TRUTH
SourceEvidenceGraph
PROCESS_CANDIDATE scope
AdapterResult
```

`ANNOTATION`, `GROUP` and annotation relationships are preserved as evidence while excluded from the initial process-candidate scope.

B2 does not create `SemanticClaim`, `ProvenanceLink`, `ProcessRevision` or `ValidationAssessment`; B3 owns those frozen downstream objects.

## Idempotency / failure history

Input fingerprint includes:

```text
native SourceRepresentation digest
adapter id/version
mapping registry version
canonical model version compatibility input
semantic adapter configuration digest when present
```

Rules executable in B2:

```text
same successful fingerprint
→ immutable AdapterResult may be reused
→ new requested attempt remains auditable

PARTIAL result
→ is not silently reused as SUCCEEDED

FAILED attempt
→ source remains preserved
→ retry is a new attempt
→ retry references prior attempt
→ source is not recaptured/recreated
```

## Executable result

Local execution under the pinned reference Node runtime:

```text
C01–C20 source/intake tests       20
PASS                              20
FAIL                               0

additional B2 invariants            5
PASS                                5
FAIL                                0

TOTAL B2 TESTS                     25
TOTAL PASS                         25
TOTAL FAIL                          0
```

Additional invariants cover:

```text
property-level evidence addressability
PARTIAL vs successful-result reuse discipline
native representation content hashing
presentation revision semantic-change guard
explicit relationship retirement requirement
```

## Stage boundary result

Not implemented in B2:

```text
Canonical ProcessRevision
Canonical ProcessEdge
EvidenceFragment / SemanticClaim / ProvenanceLink materialization
ValidationAssessment / Finding / Question
Capability design
Temporal mapping/runtime
```

No fake downstream object was introduced to make a source-stage test pass.

## Verdict

```text
B2 NATIVE CANVAS REVISION MODEL       ✅ PASS
B2 SOURCE PRESERVATION                ✅ PASS
B2 INCOMPLETE ENDPOINT PRESERVATION   ✅ PASS
B2 SOURCE EVIDENCE GRAPH              ✅ PASS
B2 PROPERTY EVIDENCE                  ✅ PASS
B2 ADAPTER FAILURE HISTORY            ✅ PASS
B2 PARTIAL HISTORY                    ✅ PASS
B2 RETRY / RESULT REUSE               ✅ PASS
B2 C01–C20 SOURCE ASSERTIONS          ✅ 20/20
B2 EXTRA INVARIANTS                   ✅ 5/5

B2                                  ✅ CLOSED
B3                                  🟢 NEXT
```

Broad product BUILD remains closed.
