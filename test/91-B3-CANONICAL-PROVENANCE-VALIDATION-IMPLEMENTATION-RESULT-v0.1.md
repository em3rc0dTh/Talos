# TALOS — B3 Canonical / Provenance / Validation Implementation Result v0.1

Status: **B3 GATE CLOSED — PASS**  
Date: **2026-08-19**

## Scope

B3 implements the frozen Phase-1 semantic core downstream of B2 preserved source evidence.

It does not implement Phase-3 review/correction, Capability design or Temporal runtime behavior.

## Implemented packages

```text
packages/semantic-core/
packages/application/src/normalization.ts
packages/application/src/validation-persistence.ts
```

`semantic-core` depends only on the foundation package. It does not import Canvas/source-adapter types.

The `application` normalization boundary is the explicit anti-corruption bridge from B2 evidence into Phase-1 Canonical/Provenance/Validation artifacts.

## Canonical implementation

Reference implementation covers frozen v0.1 families required by the vertical slice and C01–C20:

```text
ProcessDefinition
immutable ProcessRevision
ProcessNode / ProcessEdge
Actor
ProcessVariable
DataObject
BusinessRule
SemanticClaim
ConflictRecord
SourceSemanticExtension
```

Key rules executable in B3:

```text
source identity != canonical identity
array/source serialization order != graph execution order
complete supported relationship → eligible canonical edge
incomplete relationship → semantic extension/claim evidence, NO fake ProcessEdge
ACTOR / DATA_OBJECT / BUSINESS_RULE != ProcessNode
annotation/group source evidence != canonical business graph
presentation-only source revision != new ProcessRevision
semantic source revision → new ProcessRevision + parent lineage
same label != same canonical identity
stable source identity may retain stable canonical subject identity across semantic revisions
```

## Provenance implementation

B3 materializes:

```text
EvidenceFragment
SourceOccurrence
SemanticClaim
ProvenanceLink
TransformationRecord
```

Canonical property claims remain property-scoped and trace through:

```text
canonical subject/property
→ SemanticClaim
→ ProvenanceLink
→ EvidenceFragment / SourceOccurrence
→ SourceRepresentation
→ SourceCapture
→ SourceOrigin
```

Native Talos Canvas normalization uses:

```text
truthClass   = SOURCE_TRUTH
perspective  = BUSINESS_INTENT
```

for explicit authored semantics. Preview images never replace the native structured representation as provenance authority.

## Validation implementation

The deterministic reference validator implements the frozen v0.2 behaviors required by this slice, including:

```text
SV-CNF-001 unresolved source conflict
SV-CFL-001 unresolved conditional rule
SV-CFL-002 unresolved branch target
SV-ACT-001 missing actor/owner
SV-EVT-001 incomplete resume semantics
SV-EVT-002 incomplete wait time expression
SV-CON-001 unresolved join policy
SV-SUB-002 unresolved subprocess boundary
SV-CMP-001 explicit completion unproven
SV-SRC-001 material inferred business meaning needs confirmation
```

Readiness precedence is preserved:

```text
material conflict
→ BLOCKED_BY_CONFLICT

required semantics absent
→ INSUFFICIENT_DETAIL

only candidate interpretation requires authority confirmation
→ NEEDS_CONFIRMATION

no material T1-03 blocker
→ READY_FOR_AUTOMATION_DESIGN
```

Validation artifacts are immutable snapshot history:

```text
AssessmentScope
ValidationFinding
ClarificationQuestion / ClarificationPlan
ReadinessDecision
ValidationAssessment
```

No historical finding receives a mutable `status` field.

## Additive B1 foundation extension discovered during B3

B3 exposed one implementation-level identity omission: B1 had separate Source/Canonical/Provenance identity families but no separate Validation family.

Reusing `prc_*` for `ValidationAssessment` would violate the already-closed cross-layer identity rule.

B1 foundation was therefore additively extended with:

```text
validation → val_*
```

and the B1 identity regression was extended to require distinct:

```text
src_* != prc_* != prv_* != val_*
```

This did not reopen or change any frozen Talos DESIGN/ARCH contract.

## Historical C01–C20 completion

B2 already passed:

```text
C01–C20 SOURCE / INTAKE assertions   20/20
```

B3 now passes the downstream Canonical/Provenance/Validation assertions:

```text
C01–C20 DOWNSTREAM assertions        20/20
```

Therefore the reference implementation now has executable evidence across the full historical C01–C20 semantic path through B3.

Notable proofs:

```text
C03 UNKNOWN branch → no fake ProcessEdge + SV-CFL-002
C05 incomplete WAIT → canonical WAIT + SV-EVT-002
C07 actor/data/rule → distinct canonical families
C08 presentation-only edit → same semantic ProcessRevision
C09 semantic edit → new ProcessRevision + parent
C12 annotation/group → no canonical graph pollution
C13 UNKNOWN != absent in validation context
C17 same label/distinct source IDs → distinct canonical identities
C18 stable source identity → traceable revision-local SourceOccurrences
C20 failed adapter attempt → zero ProcessRevision
```

## Reference process PR1

The initial reference source and canonical revision preserve:

```text
Review request.actor = UNKNOWN
```

B3 proves:

```text
Manager is absent
Review request actorRefs = []
SV-ACT-001 ACTOR_OR_OWNER_MISSING present
Semantic verdict = INCOMPLETE
Execution readiness = INSUFFICIENT_DETAIL
```

B3 does not repair the missing actor.

`Manager` may enter only in B4 through the explicit review/correction command path.

## Executable result

Local Node 22.16 execution:

```text
B2 source/intake suite              25 PASS / 0 FAIL
B3 C01–C20 downstream suite         20 PASS / 0 FAIL
B3 semantic invariants               7 PASS / 0 FAIL

B2+B3 combined                      52 PASS / 0 FAIL
```

B3 semantic invariants additionally prove:

```text
reference PR1 actor remains UNKNOWN
Canonical / Provenance / Validation IDs are distinct
property-level provenance reaches native SourceRepresentation
TransformationRecord preserves source→canonical lineage
conflict readiness precedence
inferred BUSINESS_INTENT → NEEDS_CONFIRMATION
validation history remains immutable
```

During test authoring one test incorrectly assumed canonical array order represented execution order. The test—not the implementation—was corrected to assert graph semantics, preserving the frozen rule that serialization/array order is not execution order.

## Stage boundary

Still not implemented in B3:

```text
ExplanationDraftSnapshot
Visual Review Workspace
ReviewCommand / Correction / Confirmation
SemanticFreezeRecord
CapabilityRequirement / Binding
ExecutionPlan / Temporal mapping/runtime
```

## Verdict

```text
B3 CANONICAL NORMALIZATION          ✅ PASS
B3 PROVENANCE MATERIALIZATION       ✅ PASS
B3 VALIDATION SNAPSHOTS             ✅ PASS
B3 READINESS PRECEDENCE             ✅ PASS
B3 C01–C20 DOWNSTREAM               ✅ 20/20
B3 SEMANTIC INVARIANTS              ✅ 7/7
B3 REFERENCE PR1 UNKNOWN ACTOR       ✅ PRESERVED

B3                                  ✅ CLOSED
B4                                  🟢 NEXT
```

Broad product BUILD remains closed.
