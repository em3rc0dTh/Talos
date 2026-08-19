# TALOS — Language / Document Adapter Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / P2-04 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active P2-04 architecture: `07-LANGUAGE-DOCUMENT-ADAPTER-ARCHITECTURE-v0.1.md`

Target design:

```text
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.2.md
```

## Why v0.2 exists

Initial pressure test:

```text
L01–L30
29 PASS / 1 FAIL
```

Failure L28 showed that language-model alternatives and later authority resolution need separate immutable history even when resolution occurs outside Canvas Review.

v0.2 adds:

```text
LanguageAlternativeSet        = immutable interpreter output
LanguageAlternativeDecision   = immutable later authority resolution
```

No frozen Phase-1/common contract is reopened.

---

# 1. End-to-end architecture

```text
SOURCE ORIGIN / DOCUMENT
      ↓
SOURCE PRESERVATION
      ↓
DOCUMENT / TEXT REPRESENTATION
      ↓
STRUCTURE + TEXT ANCHORING
      ↓
AdapterAttempt(TEXT_INTERPRETATION)
      ↓
LINGUISTIC OBSERVATIONS / ALTERNATIVES
      ↓
SOURCE EVIDENCE GRAPH
      ↓
0..N CANDIDATE SEMANTIC SCOPES
      ↓
CANONICAL NORMALIZATION WHERE SAFE
      ↓
PROVENANCE / CLAIMS
      ↓
SEMANTIC VALIDATION
      ↓
CANVAS REVIEW
```

Authority resolution is a separate write/evidence path.

---

# 2. Source preservation boundary

`DocumentSourceService` preserves:

```text
SourceOrigin
SourceCapture
SourceArtifact
SourceRepresentation
SourceAvailabilityRecord
```

before extraction or interpretation.

Original document bytes and derived text representations never collapse into one identity.

---

# 3. Representation / extraction boundary

`DocumentRepresentationService` may create explicit derivatives such as:

```text
TEXT_EXTRACT
NORMALIZED_SERIALIZATION
structured parse artifact
embedded object representations
```

Each derivative retains transformation lineage.

If OCR/perception is required, that uncertainty remains linked to Image / Perception evidence.

---

# 4. Structure / text anchoring boundary

`DocumentAnchorService` produces:

```text
DocumentStructureMap
StructuralUnit
TextEvidenceAnchor
DocumentReferenceDescriptor
```

Offsets/anchors are representation-version scoped.

Document hierarchy is never treated as workflow hierarchy by this service.

---

# 5. Language interpretation boundary

`LanguageDocumentAdapter` produces immutable attempt-scoped:

```text
LinguisticObservation
LanguageAlternativeSet
TextReferenceCandidate
TextualRelationCandidate
ArtifactClassification
CandidateSemanticScope
InterpretationClaimSet
```

No interpreter output is accepted business truth solely because confidence is high.

---

# 6. Alternative-history boundary

`LanguageAlternativeSet` records:

```text
what alternatives existed
what the model preferred
what local evidence/confidence supported each alternative
```

It has no human-selection state.

---

# 7. Authority-resolution boundary — new in v0.2

Conceptual service:

```text
LanguageResolutionService
```

Consumes:

```text
LanguageAlternativeSet
explicit authority/user decision
```

Produces immutable:

```text
LanguageAlternativeDecision
```

and when authority is sufficient:

```text
ConfirmationRecord
SemanticClaim
ReviewAuthoredSourceRevision / ReviewAction where applicable
ProcessRevision candidate
```

The service cannot update the original alternative set/adapter attempt.

It is usable from Canvas Review, API, controlled admin flows or other authority channels.

---

# 8. Historical resolution lifecycle

```text
Attempt A
  ↓
AlternativeSet S
model prefers X
  ↓
Authority chooses Y
  ↓
LanguageAlternativeDecision D1
  ↓
Confirmation / claim
  ↓
ProcessRevision B
```

Later disagreement creates new conflict/claim/decision history, never mutation of S or D1.

---

# 9. Distributed evidence architecture

Claims may be supported across:

```text
heading
paragraph span
role definition
exception clause
cross-reference
related table cell
```

All evidence bindings remain many-to-many and property scoped.

No one-sentence/one-node architectural assumption is allowed.

---

# 10. Actor/reference resolution

`LanguageReferenceResolver` proposes referents for pronouns, aliases, roles, objects and document references.

Outputs remain alternatives/candidates until confirmed.

No resolver writes canonical actor IDs directly.

---

# 11. Modality/discourse interpretation

`LanguagePolicyInterpreter` proposes:

```text
normative force
negation scope
rule vs description
example vs requirement
normal vs exceptional behavior
```

Literal markers remain independently anchored.

---

# 12. Ordering/relation interpretation

`LanguageRelationInterpreter` may produce source-supported candidates:

```text
BEFORE / AFTER / THEN / WHILE
CONDITIONAL_ON
EXCEPTION_TO
ALTERNATIVE_TO
REPLACES_NORMAL_PATH
DEPENDS_ON
```

Document adjacency/order alone is insufficient for canonical sequence.

---

# 13. Lists / tables

Specialized interpretation preserves structure first and may classify as procedure/checklist/decision table/RACI/state table/etc.

Row/list order does not become execution order without textual/contextual evidence.

---

# 14. Mixed-content routing

`MixedContentRouter` keeps embedded images/diagrams/attachments as separate evidence and can delegate to the appropriate adapter family.

```text
Document
  ├── text → LanguageDocumentAdapter
  ├── image/diagram → ImagePerceptionAdapter
  └── structured attachment → corresponding adapter
```

Unavailable delegation produces diagnostics, not invented semantics.

---

# 15. Scope discovery

`LanguageScopeDiscoveryService` may produce 0..N:

```text
PROCESS_CANDIDATE
PROCEDURE_SCOPE
POLICY_SCOPE
RULE_SET_SCOPE
ROLE_RESPONSIBILITY_SCOPE
BUSINESS_OBJECT_LIFECYCLE
EXECUTABLE_SLICE_CANDIDATE
NON_EXECUTABLE_CONTEXT
SOURCE_DEFINED
```

Shared evidence can support multiple scopes.

---

# 16. Common intake materialization

Language specialization flows into common:

```text
SourceEvidenceGraph
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
ArtifactClassification
CandidateSemanticScope
InterpretationClaimSet
SemanticClaim
ProvenanceLink
```

Not every sentence becomes a source occurrence/process node.

---

# 17. Normalization boundary

`CanonicalNormalizer` may map supported candidate meaning but must not:

```text
infer sequence from document order alone
resolve actors from ambiguous pronouns alone
create positive actions solely from prohibitions
invent process boundaries
flatten policies/examples into workflow steps
emit Temporal mappings
```

---

# 18. Semantic validation

Semantic Validation v0.2 handles material gaps such as:

```text
unresolved actor/object reference
ambiguous condition/exception
ambiguous ordering
conflicting normative rules
unresolved external reference
missing completion/process boundary
```

Validation explains; it does not repair.

---

# 19. Canvas Review integration

Read side may show:

```text
literal spans
canonical/source-only candidates
modality/reference/order alternatives
model preference
LanguageAlternativeDecision history
policy/non-process context
findings/conflicts
```

Write side creates review-authored evidence/new revisions without editing source or interpreter history.

---

# 20. Re-interpretation boundary

New model/interpreter versions create new immutable attempts/results.

A newer result does not auto-rebase accepted meaning.

Frozen review reconciliation/transition handles proposed adoption.

---

# 21. Failure isolation

```text
source preservation failure      → no false preserve claim
text extraction failure          → source survives
structural parse failure         → partial/raw evidence may survive
language interpretation failure  → preserved source/text survives
mixed-content route failure      → object remains preserved
resolution failure               → alternative set remains valid/history intact
normalization failure            → language evidence/claims survive
validation blocker               → explainable candidate only
review failure                   → upstream evidence survives
```

---

# 22. Architecture gate

v0.2 must pass full L01–L30 regression, especially:

```text
L28 — human/authority resolution is separate immutable history
```

Conformance remains against frozen:

```text
Canonical v0.1
Provenance v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Review v0.2
```

BUILD remains closed.
