# TALOS — BPMN Structured Adapter Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / P2-02 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define the architecture for importing BPMN as an external structured source without bypassing the frozen TALOS intake/provenance/canonical/validation boundaries.

Target design:

```text
design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md
```

---

# 1. Pipeline

```text
BPMN FILE / EXTERNAL BPMN SOURCE
        ↓
SourceOrigin / SourceCapture / SourceRepresentation
        ↓
AdapterAttempt(BpmnAdapter)
        ↓
XML / BPMN STRUCTURED PARSE
        ↓
BpmnSourceOccurrence + BpmnReferenceDescriptor
        ↓
SourceEvidenceGraph
        ↓
CandidateSemanticScope(s)
        ↓
BPMN Mapping Registry
        ↓
Canonical ProcessRevision candidate(s)
        ↓
Provenance / SemanticClaims / Source Extensions
        ↓
Semantic Validation
        ↓
Canvas Review Projection when requested
```

No direct parser→Temporal path exists.

---

# 2. Preservation transaction

The BPMN representation is preserved before parser success is required.

```text
source bytes preserved
      ↓ COMMIT
AdapterAttempt starts
```

Therefore:

```text
parser failure ≠ source loss
```

A later adapter version may re-run against the same immutable representation.

---

# 3. Parser boundary

Conceptual service:

```text
BpmnSourceExtractor
```

Responsibilities:

```text
read XML safely
preserve namespaces/QName literals
address BPMN semantic elements
address BPMN references
address DI/presentation elements
preserve extension elements
emit diagnostics
```

It does not decide Temporal semantics and does not directly mutate canonical records.

---

# 4. Source identity index

Conceptual source-local index:

```text
BpmnSourceIndex
```

Indexes:

```text
(native id, sourceArtifactId) → SourceOccurrence
QName/reference literal → resolution candidates
containment parent/children
process membership
collaboration membership
lane membership
DI references
```

An invalid/duplicate/unresolved source ID creates diagnostics and independent TALOS occurrence identity rather than source deletion.

---

# 5. Reference resolution stage

Conceptual service:

```text
BpmnReferenceResolver
```

Input:

```text
BpmnReferenceDescriptor(s)
imports / namespace context
available source artifacts/representations
```

Output is immutable resolution evidence:

```text
RESOLVED_LOCAL
RESOLVED_IMPORTED
UNRESOLVED
EXTERNAL_NOT_AVAILABLE
INVALID
```

Reference resolution never rewrites the literal source reference.

---

# 6. Semantic planes

The extractor separates at minimum:

```text
BUSINESS GRAPH
COLLABORATION / RESPONSIBILITY
OBJECT / DATA
EXTENSION / NOTATION-SPECIFIC SEMANTICS
BPMN DI / PRESENTATION
```

Parser tree position is not itself a semantic plane.

DI is never used to override explicit semantic refs when they exist.

---

# 7. Scope discovery

Conceptual service:

```text
BpmnScopeDiscovery
```

May produce:

```text
process scope(s)
collaboration scope(s)
participant-local scope(s)
unsupported/non-executable context scope(s)
0 scopes when no safe process scope exists
```

One definitions document is not assumed to equal one canonical ProcessDefinition.

---

# 8. Mapping registry

Conceptual versioned registry:

```text
BpmnMappingRegistry v0.x
```

Mapping decisions are explicit data/rules, not scattered parser side effects.

Inputs include:

```text
source element type
source attributes
resolved references
flow topology
context scope
source extensions
```

Outputs include:

```text
canonical candidate kind/property
truth/confidence discipline
required source extension preservation
validation prerequisites
```

---

# 9. Gateway role resolver

Gateway subtype alone is insufficient for canonical role.

Conceptual resolver:

```text
BpmnGatewayRoleResolver
```

Uses:

```text
gateway subtype
gatewayDirection attribute
resolved incoming/outgoing sequence flows
conditions/default refs
local topology
```

It may return:

```text
DECISION candidate
PARALLEL_SPLIT candidate
JOIN candidate
SOURCE_DEFINED / unresolved
```

The exact BPMN gateway type remains preserved independently.

---

# 10. Event semantic resolver

Conceptual resolver:

```text
BpmnEventSemanticResolver
```

Uses:

```text
start/end/intermediate/boundary class
event definition(s)
catch/throw semantics
attachedToRef
cancelActivity
scope context
```

Outputs canonical candidates plus required source extensions.

No Temporal primitive is selected.

---

# 11. Boundary event architecture

Boundary event handling must keep a source relation:

```text
BoundaryEventOccurrence
      ─attachedToRef→ ActivityOccurrence
```

and source behavior:

```text
cancelActivity
specific event definition
```

If Canonical v0.1 cannot fully encode a BPMN nuance, retain it in:

```text
SourceSemanticExtension / SemanticClaim
```

Validation may block automation design if the missing nuance is material.

---

# 12. Activity/subprocess resolver

Preserves exact subtype and context before candidate mapping.

```text
Task subtype
SubProcess subtype
CallActivity
Transaction
Event subprocess
Loop / multi-instance characteristics
```

No adapter-private runtime class is allowed to leak into canonical meaning.

---

# 13. Data/annotation handling

Data associations and annotations are extracted into evidence/source-specific relationships rather than generic ProcessEdges.

Canonical data mapping is optional/safe only when semantics support it.

```text
textAnnotation
association
```

remain non-control evidence.

---

# 14. Extension preservation

Conceptual service:

```text
BpmnExtensionPreserver
```

Stores vendor/unknown extension fragments with:

```text
namespace
owner source occurrence
literal/structured payload where safe
source location/evidence refs
```

Provider/runtime configuration must not silently become business intent.

---

# 15. Partial/failure behavior

```text
XML parse fails completely
→ AdapterAttempt FAILED
→ preserved source remains

XML parses, some refs/constructs unsupported
→ PARTIAL
→ SourceEvidenceGraph + diagnostics + candidate scopes may still exist

BPMN well-formed and supported
→ SUCCEEDED
```

No missing process completion or broken reference is silently repaired.

---

# 16. Normalization boundary

Conceptual service:

```text
normalizeBpmnScope(candidateScopeId)
```

Creates separate canonical identities and provenance.

Source-native BPMN IDs stay in source/provenance extensions.

One source scope may result in:

```text
canonical ProcessRevision
+
source-specific BPMN semantic extensions
+
validation findings
```

or no canonical revision when safe normalization is not possible.

---

# 17. Validation integration

Semantic Validation v0.2 applies after normalization.

Likely findings include:

```text
unresolved reference
ambiguous gateway role
boundary behavior insufficiently normalized
message correlation missing
business outcome unresolved
incomplete completion topology
unsupported construct material to scope
```

Parser validity and TALOS execution readiness remain separate.

---

# 18. Canvas review integration

BPMN review uses frozen P2-01B architecture.

Projection may render:

```text
canonical elements
BPMN-specific source evidence
message flows
boundary event semantics
validation findings
vendor extensions when relevant
```

Reviewer corrections create review-authored evidence and baseline transitions, never BPMN source mutation.

---

# 19. Security/parser safety boundary

BPMN XML ingestion must eventually use safe XML parsing defaults.

At architecture level:

```text
no arbitrary external entity execution
no script/expression execution during intake
no provider connector execution
no extension code execution
```

Concrete library/runtime security configuration belongs to BUILD planning after Phase 2 closes.

---

# 20. P2-02 architecture gate

Must pass B01–B20 while preserving all frozen Phase-1 and P2-00/P2-01 contracts.

If BPMN exposes a defect in the common source-intake contract, version the common contract and rerun prior Canvas regressions before proceeding.

BUILD remains closed.
