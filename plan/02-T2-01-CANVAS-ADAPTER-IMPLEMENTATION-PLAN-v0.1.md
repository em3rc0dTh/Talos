# TALOS — T2-01 Canvas Adapter Implementation Plan v0.1

Status: **IMPLEMENTATION PLAN / BUILD-OPENING CANDIDATE**  
Date: **2026-08-19**

## Objective

Implement the frozen T2-01 design/architecture as the first real TALOS source-adapter slice.

Frozen inputs:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.2.md
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.2.md
```

Gate evidence:

```text
test/14-T2-01-CANVAS-ADAPTER-REGRESSION-RESULT-v0.1.md
20 / 20 semantic/architecture fixtures PASS
```

This plan does not open BUILD by itself.

---

# 1. Reference implementation decision

Recommended first implementation:

```text
LANGUAGE: TypeScript
SERIALIZATION: deterministic versioned JSON
DOMAIN STYLE: framework-independent packages/modules
```

Why this is appropriate for the first slice:

- the native Canvas will ultimately have a browser-facing authoring surface;
- shared domain contracts can be consumed by browser/server code;
- deterministic JSON is inspectable and fixture-friendly;
- the source/intake/domain model can remain independent from whichever Canvas rendering library is selected later;
- later Temporal code may use the same language or a separate implementation without changing the frozen source contracts.

Non-negotiable:

```text
UI framework types
Temporal SDK types
ORM entity types
HTTP request DTOs
```

must not become the domain/source contract.

---

# 2. Proposed repository implementation boundary

Until the product application repository is intentionally separated, place the reference implementation under the TALOS lifecycle boundary:

```text
build/t2-01-canvas-adapter/
```

Suggested internal structure:

```text
build/t2-01-canvas-adapter/
  src/
    canvas-domain/
    intake-domain/
    provenance-domain/
    canonical-domain/
    validation-domain/
    adapters/
      talos-canvas/
    normalization/
    serialization/
    hashing/
    application/
  fixtures/
    c01-c20/
  tests/
  README.md
```

If a dedicated application repository is created later, these boundaries should move as packages without semantic redesign.

---

# 3. Module boundaries

## `canvas-domain`

Implements frozen native source structures:

```text
CanvasDefinition
CanvasRevision
CanvasElementIdentity
CanvasElementSnapshot
CanvasRelationshipIdentity
CanvasRelationshipSnapshot
CanvasEndpointRef
CanvasContainerMembership
CanvasChangeSet
CanvasPropertyValue
```

No UI dependency.

## `intake-domain`

Implements:

```text
SourceIntakeSession
ArtifactClassification
SourceEvidenceGraph
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
AdapterAttempt
AdapterDiagnostic
AdapterResult
CandidateSemanticScope
InterpretationClaimSet
```

## `provenance-domain`

Reference types/logic from frozen Provenance v0.3:

```text
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation
SourceAvailabilityRecord
EvidenceFragment
SourceOccurrence
SemanticClaim
ProvenanceLink
TransformationRecord
```

Do not invent a second provenance model.

## `canonical-domain`

Reference frozen Canonical v0.1.

No Temporal concepts.

## `validation-domain`

Reference frozen Semantic Validation v0.2:

```text
ValidationAssessment
ValidationFinding
ReadinessDecision
ClarificationQuestion
ClarificationResponse
FindingDisposition
```

## `adapters/talos-canvas`

Implements native extraction/mapping preparation.

## `normalization`

Maps complete supported source semantics into Canonical v0.1 and retains incomplete/source-specific claims/extensions.

## `serialization`

Versioned deterministic native Canvas JSON representation.

## `hashing`

Computes:

```text
nativeRepresentationDigest
semanticDigest
AdapterAttempt.inputFingerprint
```

using deterministic canonical serialization rules.

---

# 4. Persistence strategy for first slice

Do not make database selection part of domain semantics.

Implement repository interfaces first:

```text
CanvasRepository
SourceRepository
AdapterAttemptRepository
ProvenanceRepository
ProcessRevisionRepository
ValidationRepository
```

First implementation may use an in-memory/file-backed fixture repository for C01–C20.

Before multi-user/product deployment, choose a durable transactional database and migration strategy explicitly.

Reason:

T2-01 first needs to prove the semantic transaction boundaries, not database scale.

---

# 5. Native revision transaction

One authoring commit must atomically produce a complete immutable Canvas revision.

Conceptual command:

```text
commitCanvasChangeSet(baseRevisionId, operations)
```

Required behavior:

1. verify base revision;
2. apply operations to create new immutable snapshot;
3. retain stable source IDs;
4. compute native digest;
5. compute semantic digest;
6. persist CanvasRevision;
7. expose NATIVE_STRUCTURED SourceRepresentation;
8. return revision identity.

No canonical adaptation must be required for source revision persistence to succeed.

---

# 6. Source preservation transaction

Canvas source revision is preserved before adapter execution.

```text
CanvasRevision
→ SourceOrigin/Artifact/Capture/Representation linkage
COMMIT
→ adapter attempt begins
```

This enforces frozen rule:

```text
ADAPTER FAILURE ≠ SOURCE LOSS
```

---

# 7. Adapter attempt execution

Conceptual application service:

```text
adaptCanvasRevision(canvasRevisionId)
```

Algorithm:

1. resolve preserved native representation;
2. compute input fingerprint;
3. search successful immutable result for same fingerprint;
4. if reusable, return/reference it according to audit policy;
5. otherwise create `AdapterAttempt(STARTED)`;
6. extract native occurrences/relationships;
7. create SourceEvidenceGraph;
8. classify artifact;
9. discover candidate scope;
10. create interpretation claims;
11. record SUCCEEDED/PARTIAL/FAILED;
12. return AdapterResult when applicable.

On exception:

```text
record FAILED attempt + diagnostic
preserve source
no fake canonical output
```

---

# 8. Canvas mapping registry implementation

Implement a versioned mapping table as data/configuration, not scattered `if` statements.

Initial mapping version:

```text
canvas-mapping-v0.1
```

Node mapping:

```text
TRIGGER             → EVENT
ACTION              → ACTION
DECISION            → DECISION
PARALLEL_SPLIT      → PARALLEL_SPLIT
JOIN                → JOIN
WAIT                → WAIT
HUMAN_INTERACTION   → HUMAN_INTERACTION
SUBPROCESS          → SUBPROCESS
STATE               → STATE
END                  → END
```

Relationship mapping:

```text
CONTROL_FLOW        → SEQUENCE
CONDITIONAL_FLOW    → CONDITIONAL
DEFAULT_FLOW        → DEFAULT
PARALLEL_FLOW       → PARALLEL
```

Incomplete endpoints never execute a complete edge mapping.

---

# 9. Canonical normalization behavior

Conceptual service:

```text
normalizeAdapterResult(adapterResultId)
```

Requirements:

- create canonical identities separately from native IDs;
- emit ProvenanceLinks per mapped element/property;
- preserve source-specific/incomplete relationships as claims/extensions;
- no placeholder process nodes to repair gaps;
- no provider/integration binding;
- no Temporal mapping.

For C03:

```text
NO relationship target UNKNOWN
```

must result in:

```text
canonical DECISION exists
YES complete edge may exist
NO source branch claim exists
NO canonical fake edge
```

---

# 10. Validation invocation

After normalization, run Semantic Validation v0.2.

Conceptual service:

```text
validateProcessRevision(processRevisionId, AUTOMATION_DESIGN_READINESS)
```

For incomplete Canvas sources, validation must generate frozen rule findings where applicable.

Example C03:

```text
SV-CFL-002 BRANCH_TARGET_UNRESOLVED
```

Example C05:

```text
SV-EVT-002 WAIT_TIME_EXPRESSION_INCOMPLETE
```

The validation engine does not mutate Canvas source.

---

# 11. Clarification application

Implement explicit command boundary:

```text
applyClarification(responseId, baseCanvasRevisionId)
```

It must:

- validate response/authority context as required;
- generate explicit CanvasChangeSet operations;
- create new CanvasRevision;
- preserve old revision;
- trigger/reuse adaptation as appropriate;
- create a new ProcessRevision when semantic digest changed;
- run a new ValidationAssessment;
- record FindingDisposition/response lineage.

No direct mutation of old finding/question/source records.

---

# 12. Deterministic serialization/hashing

Before implementation, define one deterministic field-order/normalization algorithm for source hashing.

Requirements:

```text
same native semantic/source state
→ same deterministic serialized bytes/value
→ same digest
```

Presentation changes affect native digest but not semantic digest.

Hash algorithm choice should be cryptographically stable and versioned in the record.

Tests must use golden digest fixtures.

---

# 13. Fixture implementation order

## Slice A — source fundamentals

```text
C01 simple sequence
C17 same label/distinct IDs
C18 stable identity across revisions
```

## Slice B — incomplete semantics

```text
C02 explicit decision
C03 dangling branch
C13 UNKNOWN vs absent
```

## Slice C — revision semantics

```text
C08 presentation-only edit
C09 semantic edit
C10 retirement
```

## Slice D — richer process semantics

```text
C04 parallel/join
C05 wait
C06 human approval
C07 actor/data/rule
C11 subprocess membership
C12 annotation/group
```

## Slice E — lineage/resilience

```text
C14 clarification write-back
C15 native + preview
C16 idempotent adaptation
C19 semantic defaults
C20 adapter failure/retry
```

---

# 14. Test levels

## Unit

- source schema invariants;
- ChangeSet application;
- endpoint state validation;
- deterministic serialization/digests;
- mapping registry;
- input fingerprint;
- retry linkage.

## Contract

- Canvas Native Source v0.2 fixtures;
- Process Source Intake v0.2 fixtures;
- Canonical v0.1 mapping expectations;
- Provenance v0.3 lineage expectations;
- Validation v0.2 findings/readiness.

## Integration

End-to-end local pipeline:

```text
CanvasRevision
→ AdapterAttempt
→ SourceEvidenceGraph
→ ProcessRevision
→ Provenance
→ ValidationAssessment
```

No Temporal runtime test belongs to T2-01.

---

# 15. Build acceptance criteria

T2-01 implementation can close only when executable tests prove all C01–C20.

Additionally:

```text
zero direct dependency from domain contracts to UI framework
zero Temporal SDK dependency in Canvas/intake/normalization modules
zero source loss on simulated adapter failure
zero fake canonical edges for incomplete endpoints
zero ProcessRevision creation for presentation-only edit
full backward provenance for every mapped canonical fixture element
```

---

# 16. Evidence to create during BUILD

```text
build/t2-01-canvas-adapter/README.md
build/t2-01-canvas-adapter/... source code

test/16-T2-01-IMPLEMENTATION-TEST-RESULT-v0.1.md
test/17-T2-01-GATE-CLOSURE-v0.1.md
```

If implementation exposes a contract defect, stop, version the affected design/architecture contract, rerun semantic regression, then continue.

Frozen contracts are not silently patched in code.

---

# 17. BUILD opening review

Recommended decision after this plan review:

```text
T2-01 DESIGN/ARCH        ✅ FROZEN
T2-01 IMPLEMENTATION PLAN ✅ READY
T2-01 BUILD              🟡 READY TO OPEN
```

Opening BUILD should authorize only the T2-01 reference adapter slice above.

It does not authorize:

```text
T2-02 BPMN
T2-03 image perception
capabilities/integrations
Temporal execution
production deployment
```
