# TALOS — Phase 2 Source Intake & Canvas Adapter Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T2-01**  
Date: **2026-08-19**

## Objective

Define the Phase-2 boundary through which real process-expression sources enter TALOS, beginning with the native TALOS Canvas.

This architecture is constrained by frozen Phase-1 contracts:

```text
Canonical Process Model v0.1
Provenance Model v0.3
Semantic Validation v0.2
```

and by:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.1.md
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.1.md
```

---

# 1. Architectural statement

TALOS receives sources through an anti-corruption boundary.

```text
SOURCE SYSTEM / USER EXPRESSION
            ↓
      SOURCE INTAKE
            ↓
       SOURCE ADAPTER
            ↓
    SOURCE EVIDENCE GRAPH
            ↓
  CANDIDATE SEMANTIC SCOPE(S)
            ↓
       NORMALIZATION
            ↓
 CANONICAL PROCESS REVISION
            ↓
      PROVENANCE LINKS
            ↓
   SEMANTIC VALIDATION
```

No adapter may directly emit Temporal code or provider bindings.

---

# 2. Layer boundaries

## A. Source acquisition

Responsibilities:

```text
receive input
record intake session
establish origin/capture/representation lineage
store/access exact native/captured representation
record availability of missing native representations
```

Outputs frozen Provenance entities:

```text
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation
SourceAvailabilityRecord
```

## B. Adapter extraction

Responsibilities:

```text
classify artifact
address source occurrences
address source relationships
segment evidence planes
preserve source-specific extensions
record diagnostics
```

Output:

```text
SourceEvidenceGraph
```

## C. Semantic interpretation

Responsibilities:

```text
propose source/candidate semantic types
propose relationship roles
identify candidate semantic scopes
create property-scoped SemanticClaims
preserve truth class + confidence + perspective
```

Outputs:

```text
CandidateSemanticScope[]
InterpretationClaimSet
```

## D. Canonical normalization

Responsibilities:

```text
map supported meaning into Canonical v0.1
preserve unsupported/source-specific meaning as claims/extensions
construct candidate ProcessRevision
create ProvenanceLinks to exact source evidence
```

This layer is not source parser code and not UI code.

## E. Semantic validation

Consumes the canonical/provenance state using frozen T1-03 v0.2.

Outputs:

```text
ValidationAssessment
ValidationFinding[]
ReadinessDecision
ClarificationPlan/Questions when material
```

---

# 3. Common adapter interface

Conceptual interface:

```text
SourceAdapter
- adapterId
- adapterVersion
- supportedArtifactClasses[]
- supportedRepresentationKinds[]
- extractionMode

extract(SourceAdapterInput) -> AdapterResult
```

`SourceAdapterInput`:

```text
- sourceIntakeSessionId
- sourceOriginId
- sourceArtifactId
- sourceRepresentationId
- declaredIntent?
- adapterConfiguration?
```

`AdapterResult` follows `design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.1.md`.

Adapter implementation language/framework is deliberately not selected at this architecture gate.

---

# 4. TalosCanvasAdapter

The reference adapter for Phase 2 is:

```text
TalosCanvasAdapter
```

Input:

```text
CanvasDefinition
CanvasRevision
SourceRepresentation(kind=NATIVE_STRUCTURED)
```

Extraction mode:

```text
NATIVE_STRUCTURED
```

It does not perform OCR, vision, topology guessing or generic shape classification.

It uses the native Canvas schema as source truth.

---

# 5. Canvas intake sequence

```text
USER OPENS/CREATES CANVAS
        ↓
CanvasDefinition
        ↓
USER AUTHORS SOURCE GRAPH
        ↓
CanvasChangeSet
        ↓
CanvasRevision
        ↓
SourceOrigin(TALOS_NATIVE/TALOS_CANVAS)
        ↓
SourceCapture(CANVAS_NATIVE)
        ↓
SourceRepresentation(NATIVE_STRUCTURED)
        ↓
TalosCanvasAdapter
        ↓
SourceEvidenceGraph
        ↓
CandidateSemanticScope(PROCESS_CANDIDATE)
        ↓
CanonicalNormalizer
        ↓
ProcessRevision candidate
        ↓
ProvenanceLink / SemanticClaim
        ↓
SemanticValidator v0.2
        ↓
Assessment + findings/questions
```

---

# 6. Native source graph generation

The Canvas source model contains stable source identities.

```text
CanvasElementIdentity
CanvasRelationshipIdentity
```

and revision-local immutable snapshots:

```text
CanvasElementSnapshot
CanvasRelationshipSnapshot
CanvasContainerMembership
```

TalosCanvasAdapter creates revision-scoped `SourceOccurrence` records from snapshots while preserving stable native IDs as source references.

Example:

```text
canvas element: ce-42
revision 5 snapshot: ces-5-42
       ↓
source occurrence: so-5-42
       ↓
canonical node: cn-91
```

The IDs remain related but never identical by convention.

---

# 7. Canvas mapping registry

T2-01 needs a versioned deterministic mapping registry.

Conceptually:

```text
CanvasMappingRegistry v0.1
```

Examples:

```text
TRIGGER                → EVENT
ACTION                 → ACTION
DECISION               → DECISION
PARALLEL_SPLIT         → PARALLEL_SPLIT
JOIN                   → JOIN
WAIT                   → WAIT
HUMAN_INTERACTION      → HUMAN_INTERACTION
SUBPROCESS             → SUBPROCESS
STATE                  → STATE
END                    → END
```

Relationships:

```text
CONTROL_FLOW           → SEQUENCE
CONDITIONAL_FLOW       → CONDITIONAL
DEFAULT_FLOW           → DEFAULT
PARALLEL_FLOW          → PARALLEL
MESSAGE_RELATIONSHIP   → MESSAGE candidate/claim according to scope
```

Non-process objects:

```text
ACTOR
DATA_OBJECT
BUSINESS_RULE
```

map into their canonical families rather than process nodes.

`ANNOTATION` and purely visual `GROUP` objects do not become canonical process nodes.

Every mapping operation emits/links a `TransformationRecord` and provenance.

---

# 8. Mapping is property-scoped

A deterministic type mapping does not make every property complete.

Example:

```text
Canvas WAIT component
```

maps deterministically to canonical `WAIT`, while:

```text
waitKind = SCHEDULE           SOURCE_TRUTH
business expression = next Wednesday SOURCE_TRUTH
timezone = UNKNOWN            SOURCE_TRUTH of unresolved state
exact instant                 unresolved
```

T1-03 then detects the material missing semantics.

Likewise:

```text
Canvas ACTION label = Send invoice
```

maps to canonical ACTION, but:

```text
Gmail Activity
```

is not created by the Canvas adapter.

---

# 9. Semantic vs presentation revision pipeline

A critical architecture distinction:

```text
Canvas native revision history
      ≠
canonical semantic revision history 1:1
```

Pipeline:

```text
CanvasRevision
  ↓
compare semanticDigest with prior interpreted CanvasRevision
```

If unchanged:

```text
record newer native source representation/history
reuse semantic interpretation lineage
no new ProcessRevision required
```

If changed:

```text
run adapter/normalizer
create new ProcessRevision candidate
validate
```

This protects semantic history from layout noise.

---

# 10. Digest boundary

Digest calculation must be deterministic and schema-versioned.

Conceptual services:

```text
NativeRepresentationHasher
SemanticProjectionHasher
```

The semantic projection includes only source fields eligible to influence canonical meaning.

It excludes default presentation state such as:

```text
x/y coordinates
viewport
zoom
color/style token
edge route points
selection state
```

unless a future explicit notation component declares those fields semantic.

---

# 11. Explicit unknowns

The architecture must pass native `UNKNOWN` states through without default filling.

```text
CanvasPropertyValue.UNKNOWN
       ↓
SourceOccurrence / literal source state
       ↓
SemanticClaim(value/meaning unresolved)
       ↓
Canonical field remains incomplete
       ↓
T1-03 finding if material
```

No adapter default may silently turn:

```text
UNKNOWN branch target
```

into:

```text
END
```

or:

```text
UNKNOWN join policy
```

into:

```text
ALL
```

unless the Canvas component itself has an explicit source-defined default visible to the author.

---

# 12. Source-defined defaults

If the Canvas UX offers a default that carries semantics, the source contract must store it explicitly.

Example:

```text
user inserts Parallel Join
Canvas schema default joinPolicy = ALL
```

If that default is part of the visible/documented native notation contract, it can be source truth even if the user did not manually type `ALL`.

But hidden implementation defaults are forbidden from becoming semantic truth.

Rule:

```text
UI/schema semantic default
      may be source truth

code convenience default
      ≠ source truth
```

---

# 13. Clarification write-back

T1-03 may ask a question, but the validator does not mutate the Canvas itself.

Flow:

```text
ValidationAssessment
  ↓
ClarificationQuestion
  ↓
user answer
  ↓
ClarificationResponse
  ↓
explicit application command
  ↓
CanvasChangeSet
  ↓
new CanvasRevision
  ↓
new semantic adaptation/revision
```

The application command may be human-driven or user-approved assistant action, but it is recorded as a source edit.

---

# 14. Imported source later edited in Canvas

T2-01 primarily covers native creation, but architecture must not preclude Phase 3 correction behavior.

Future imported-source flow:

```text
External SourceOrigin
      ↓
ProcessRevision N
      ↓
user opens editable TALOS Canvas projection
      ↓
Talos-native CanvasDefinition derived from ProcessRevision N
      ↓
Canvas edit
      ↓
new TALOS_NATIVE SourceOrigin / lineage relation
      ↓
ProcessRevision N+1
```

The Canvas edit does not overwrite the external source artifact.

The precise derivation contract belongs to later correction-loop design, but T2-01 source identities must support it.

---

# 15. Persistence boundaries

Logical persistence domains should remain distinct even if one physical database is used later.

```text
SOURCE STORE
- origins
- captures
- representations
- source artifacts
- Canvas definitions/revisions/change sets

EVIDENCE / PROVENANCE STORE
- source occurrences
- evidence fragments
- claims
- provenance links
- transformations

CANONICAL STORE
- process definitions/revisions

VALIDATION STORE
- assessments
- findings
- questions/responses
- dispositions
```

This is a domain boundary, not a database technology decision.

---

# 16. Idempotent adaptation

Reprocessing the same immutable Canvas revision with the same adapter/mapping version must be logically idempotent.

Input identity:

```text
sourceRepresentation digest
+ adapterVersion
+ mappingRegistryVersion
+ canonicalModelVersion
```

should identify one interpretation attempt/result lineage.

A new adapter version may intentionally create a new interpretation candidate without modifying the historical one.

---

# 17. Failure behavior

Adapter failure must not corrupt source preservation.

```text
source capture preserved ✅
native representation preserved ✅
adapter extraction failed ⚠
canonical revision absent ✅ acceptable
```

Diagnostics are stored against the adapter result/attempt.

Retrying an adapter is not equivalent to re-uploading/re-authoring the source.

---

# 18. Future adapter comparison

T2-02 BPMN:

```text
native/external structured representation
→ STRUCTURED_PARSE
```

T2-03 image:

```text
captured bytes
→ VISUAL_PERCEPTION
```

Both must produce the same architectural families:

```text
SourceEvidenceGraph
CandidateSemanticScope[]
InterpretationClaimSet
AdapterResult
```

The difference is evidence quality/extraction method, not a different downstream TALOS core.

---

# 19. Architecture gate risks

T2-01 must pressure-test at least:

```text
stable source IDs across edits
revision-local occurrence identity
semantic vs presentation revision split
explicit UNKNOWN propagation
structured membership vs geometry
annotation exclusion
actor/data/rule mapping
parallel split/join mapping
wait incompleteness detection
human interaction without Temporal binding
clarification write-back history
idempotent re-adaptation
native source + preview coexistence
```

---

# 20. T2-01 architecture boundary

T2-01 closes architecture only when TALOS can trace conceptually:

```text
CanvasDefinition
  ↓
CanvasRevision
  ↓
SourceRepresentation(NATIVE_STRUCTURED)
  ↓
SourceOccurrence
  ↓
SemanticClaim
  ↓
Canonical ProcessRevision
  ↓
ValidationAssessment
```

and backwards:

```text
ValidationFinding
  ↓
canonical target/property
  ↓
ProvenanceLink
  ↓
Canvas source occurrence/property
  ↓
exact CanvasRevision
  ↓
CanvasDefinition / SourceOrigin
```

without using screenshot geometry or Temporal implementation as a shortcut.

BUILD remains closed until the T2-01 design/architecture/plan pressure gate closes.
