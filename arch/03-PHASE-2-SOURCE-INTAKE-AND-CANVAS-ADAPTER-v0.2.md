# TALOS — Phase 2 Source Intake & Canvas Adapter Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T2-01 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active architecture: `03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

The initial C01–C20 pressure test produced:

```text
18 PASS
 2 FAIL
```

Failures:

```text
C03 incomplete/dangling native branch
C20 adapter failure after preservation
```

v0.2 closes both without reopening frozen Phase-1 contracts.

---

# 1. Architectural statement

```text
SOURCE / USER EXPRESSION
        ↓
SOURCE PRESERVATION
        ↓
ADAPTER ATTEMPT
        ↓
SOURCE EVIDENCE GRAPH
        ↓
CANDIDATE SEMANTIC SCOPE(S)
        ↓
CANONICAL NORMALIZATION
        ↓
PROVENANCE LINKS
        ↓
SEMANTIC VALIDATION
```

Source survival is upstream of adapter success.

Incomplete source evidence is allowed upstream of canonical graph completeness.

---

# 2. Layer A — acquisition/preservation

Responsibilities:

```text
receive source
record intake session
create/resolve SourceOrigin
record SourceCapture
preserve SourceRepresentation
record SourceAvailabilityRecord
```

This transaction boundary completes before adapter interpretation is required.

Therefore:

```text
adapter failure
      ≠
source rollback
```

---

# 3. Layer B — AdapterAttempt

Every adapter invocation creates an immutable attempt record before extraction starts.

Conceptual service:

```text
AdapterAttemptService
```

Sequence:

```text
preserved SourceRepresentation
        ↓
compute inputFingerprint
        ↓
create AdapterAttempt(STARTED)
        ↓
run adapter
        ↓
SUCCEEDED / PARTIAL / FAILED
```

Diagnostics and failure stage belong to the attempt.

A retry creates another attempt linked through `retryOfAttemptId`.

The same successful input fingerprint may reuse an immutable result instead of duplicating semantic output.

---

# 4. Layer C — extraction/evidence graph

Adapter responsibilities:

```text
classify artifact
address source occurrences
address source relationships
segment evidence planes
preserve source-specific extensions
record diagnostics
```

Output for successful/partial attempts:

```text
SourceEvidenceGraph
```

The graph may contain incomplete relationships.

---

# 5. Incomplete relationship architecture

Native or perceived source evidence may establish:

```text
relationship exists
source endpoint known
target endpoint unknown/unconnected
branch guard known
```

That is represented at source/evidence level.

It is not forced into frozen Canonical v0.1 `ProcessEdge` when both endpoints are required.

Pipeline:

```text
CanvasRelationshipSnapshot
  targetEndpoint = UNKNOWN
        ↓
SourceRelationshipDescriptor
  targetEndpointState = UNKNOWN
        ↓
SourceOccurrence / SemanticClaim / ProvenanceLink
        ↓
Canonical decision/node/source extension retains branch-intent evidence
        ↓
NO fabricated ProcessEdge
        ↓
SemanticValidator
SV-CFL-002 BRANCH_TARGET_UNRESOLVED
```

Later source revision:

```text
targetEndpoint = SET(CancelOrder)
```

may normalize into a complete canonical edge.

---

# 6. TalosCanvasAdapter input

```text
CanvasDefinition
CanvasRevision
SourceRepresentation(NATIVE_STRUCTURED)
```

Extraction mode:

```text
NATIVE_STRUCTURED
```

No OCR/vision/geometry inference is required for native semantics.

---

# 7. Stable identity chain

```text
CanvasElementIdentity ce-42
        ↓
CanvasElementSnapshot revision-5
        ↓
SourceOccurrence so-r5-ce42
        ↓
Canonical node cn-91
```

After edit:

```text
same CanvasElementIdentity ce-42
        ↓
new CanvasElementSnapshot revision-6
        ↓
new SourceOccurrence so-r6-ce42
        ↓
new/related canonical revision meaning if semantic digest changed
```

Source and canonical IDs never collapse.

---

# 8. Mapping registry

Conceptual versioned registry:

```text
CanvasMappingRegistry v0.x
```

Initial deterministic mappings:

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
END                 → END
```

Complete relationships:

```text
CONTROL_FLOW        → SEQUENCE
CONDITIONAL_FLOW    → CONDITIONAL
DEFAULT_FLOW        → DEFAULT
PARALLEL_FLOW       → PARALLEL
```

Incomplete relationships remain source/claim evidence until canonical requirements are satisfied.

---

# 9. Property-scoped mapping

A mapped native type does not mean complete semantics.

Example:

```text
WAIT → canonical WAIT
```

while:

```text
timezone = UNKNOWN
```

remains unresolved and T1-03 may block readiness.

Similarly:

```text
ACTION "Send invoice"
```

does not imply Gmail/n8n/Activity implementation.

---

# 10. Semantic/presentation revision split

```text
CanvasRevision
  ↓
semanticDigest comparison
```

If unchanged:

```text
new native source revision preserved
no new semantic ProcessRevision required
```

If changed:

```text
new AdapterAttempt / adaptation lineage
new ProcessRevision candidate when accepted semantics change
new validation assessment
```

A dangling relationship endpoint changing from UNKNOWN to SET is a semantic change.

---

# 11. Digest/idempotency architecture

Input fingerprint for Canvas adaptation includes at minimum:

```text
native SourceRepresentation digest
adapterId/version
mapping registry version
canonical model version
semantic adapter configuration digest if any
```

The fingerprint is recorded on `AdapterAttempt`.

Conceptual cache/replay rule:

```text
existing successful result for fingerprint
→ may reuse immutable result
```

but audit may still record a new attempt when a retry/request actually occurred.

---

# 12. Adapter failure sequence

```text
SourceRepresentation sr-12 preserved
        ↓
AdapterAttempt a1 STARTED
        ↓
extraction exception
        ↓
AdapterAttempt a1 FAILED
failureStage = SOURCE_EXTRACTION
diagnostics preserved
        ↓
no SourceEvidenceGraph required
no ProcessRevision created
source remains valid
```

Retry:

```text
AdapterAttempt a2
retryOfAttemptId = a1
same inputFingerprint
        ↓
SUCCEEDED
        ↓
AdapterResult
```

The system never asks the user to recreate the Canvas merely because interpretation failed.

---

# 13. Partial adapter sequence

For future visual/text adapters:

```text
AdapterAttempt PARTIAL
        ↓
AdapterResult exists
SourceEvidenceGraph partial
Diagnostics identify unresolved regions
CandidateSemanticScope(s) may still proceed
```

This is essential for handwritten/ambiguous real processes.

---

# 14. Structured membership beats geometry

For native Canvas:

```text
actorRefs
RESPONSIBILITY_RELATIONSHIP
SUBPROCESS_SCOPE membership
```

are semantic evidence.

Coordinates/containment are presentation unless the source schema explicitly declares semantic membership.

This rule becomes the reference behavior for later adapters.

---

# 15. Clarification write-back

```text
Assessment A
→ ClarificationQuestion
→ ClarificationResponse
→ explicit ApplyClarification command
→ CanvasChangeSet
→ CanvasRevision N+1
→ AdapterAttempt
→ ProcessRevision N+1
→ Assessment B
```

Validator does not edit source directly.

Assistant/AI suggestions become source changes only after explicit application/authorization and are recorded as authored changes.

---

# 16. Domain persistence boundaries

Logical stores:

```text
SOURCE DOMAIN
- SourceIntakeSession
- origins/captures/artifacts/representations
- CanvasDefinition/Revision/ChangeSet

ADAPTER DOMAIN
- AdapterAttempt
- AdapterDiagnostic
- AdapterResult
- SourceEvidenceGraph
- CandidateSemanticScope

PROVENANCE DOMAIN
- SourceOccurrence
- EvidenceFragment
- SemanticClaim
- ProvenanceLink
- TransformationRecord

CANONICAL DOMAIN
- ProcessDefinition/Revision

VALIDATION DOMAIN
- ValidationAssessment
- Finding
- Question/Response
- Disposition
```

Physical storage technology remains undecided.

---

# 17. Common future adapter architecture

```text
TalosCanvasAdapter      NATIVE_STRUCTURED
BpmnAdapter             STRUCTURED_PARSE
ImageProcessAdapter     VISUAL_PERCEPTION
NaturalLanguageAdapter  TEXT_INTERPRETATION
N8nAdapter              AUTOMATION_PARSE
RuntimeAdapter          RUNTIME_EVENT_MAPPING
```

All produce the same adapter-domain families.

No source gets a private path into canonical/execution truth.

---

# 18. Failure isolation

Failures are isolated by stage:

```text
SOURCE_ACQUISITION failure
→ source may not yet be safely preserved

ADAPTER failure
→ preserved source remains valid

NORMALIZATION failure
→ adapter evidence remains valid

VALIDATION blocker
→ canonical/source evidence remains valid but not ready

LATER EXECUTION DESIGN failure
→ does not rewrite earlier semantic truth
```

This gives TALOS a recoverable pipeline rather than one destructive import transaction.

---

# 19. T2-01 regression requirements

Must pass C01–C20 including:

```text
C03 incomplete relationship
C20 failed adapter attempt
```

and preserve:

```text
presentation vs semantic revision split
stable source IDs
UNKNOWN propagation
annotation exclusion
human interaction separation
native source > preview
idempotent/replayable adaptation
```

---

# 20. Architecture gate

T2-01 architecture can freeze only if TALOS can trace:

```text
Canvas source
→ exact revision
→ adapter attempt
→ exact source evidence
→ candidate semantic scope
→ canonical meaning
→ provenance
→ validation
```

and explain failed/partial paths without source loss.

BUILD remains closed until full regression and freeze evidence exist.
