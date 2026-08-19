# TALOS — Language / Document Adapter Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / P2-04 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target design:

```text
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.1.md
```

## Purpose

Define the system boundary for interpreting process knowledge from natural language and documents without collapsing document structure into workflow structure or language-model output into source truth.

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

No step has authority to mutate upstream source evidence.

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

before extraction/interpretation begins.

For a PDF/DOCX/native document, original bytes remain preserved separately from extracted text.

For direct text entry, the exact submitted text is preserved as the source representation before semantic interpretation.

---

# 3. Document representation service

`DocumentRepresentationService` may produce explicit derived representations:

```text
TEXT_EXTRACT
NORMALIZED_SERIALIZATION
embedded-object representation descriptors
source-native structural parse artifacts
```

Every derivative retains transformation lineage.

Text extraction failure does not destroy the original document.

---

# 4. Structure / anchoring boundary

`DocumentAnchorService` produces:

```text
DocumentStructureMap
StructuralUnit
TextEvidenceAnchor
DocumentReferenceDescriptor
```

Responsibilities:

- address source-native or extracted page/section/paragraph/list/table structure;
- pin text offsets to the exact representation/version;
- keep quoted text snapshots/digests as evidence aids;
- preserve unresolved cross-references;
- never treat document hierarchy as process hierarchy automatically.

---

# 5. Language interpretation boundary

Conceptual adapter:

```text
LanguageDocumentAdapter
```

Produces immutable:

```text
LinguisticObservation
LanguageAlternativeSet
TextReferenceCandidate
TextualRelationCandidate
ArtifactClassification
CandidateSemanticScope
InterpretationClaimSet
```

Interpretation is scoped to one `AdapterAttempt` and model/pipeline version set.

---

# 6. Evidence vs interpretation

Read chain:

```text
SemanticClaim
→ LinguisticObservation / relation/reference candidate
→ TextEvidenceAnchor
→ StructuralUnit
→ SourceRepresentation
→ SourceCapture
→ SourceOrigin
```

A generated semantic claim must remain traceable to one or more literal source spans or explicitly marked derived/unsupported context.

---

# 7. Distributed-evidence model

Language semantics may be distributed.

One claim may depend on:

```text
heading
paragraph sentence
exception paragraph
role definition elsewhere
cross-reference
```

Therefore interpretation/provenance uses many-to-many evidence bindings.

No architecture assumption requires one sentence → one node or one claim → one span.

---

# 8. Actor/reference resolution service

`LanguageReferenceResolver` proposes candidate referents for:

```text
pronouns
nominal references
abbreviations
role aliases
object aliases
section/document references
```

It never mutates literal text or directly assigns canonical identity.

Ambiguity remains in alternatives/claims and may become a validation finding.

---

# 9. Modality / discourse interpreter

`LanguagePolicyInterpreter` proposes:

```text
normative force
negation scope
discourse role
rule vs description
example vs requirement
normal path vs exception/override
```

These outputs are interpretation records, not source truth.

Literal markers such as `must`, `should`, `may`, `normally`, `instead`, `except` remain separately anchored.

---

# 10. Ordering / relation interpreter

`LanguageRelationInterpreter` proposes relationships only from linguistic/structural evidence.

It may emit candidates such as:

```text
BEFORE
AFTER
THEN
WHILE
CONDITIONAL_ON
EXCEPTION_TO
ALTERNATIVE_TO
REPLACES_NORMAL_PATH
DEPENDS_ON
```

Document adjacency/order is not enough by itself to emit canonical sequence.

---

# 11. List/table interpreter boundary

Lists and tables remain source structures first.

Specialized interpretation may classify them as:

```text
ordered procedure
checklist
requirements set
RACI matrix
decision table
state table
SLA matrix
reference data
```

No generic list/table layout becomes control flow by default.

---

# 12. Mixed-content routing

Documents can contain images/flowcharts/embedded files.

`MixedContentRouter` records the embedded object and can later delegate it to another proven adapter family.

```text
LANGUAGE DOCUMENT
  ├── text → LanguageDocumentAdapter
  ├── image/diagram → ImagePerceptionAdapter candidate route
  └── structured attachment → corresponding adapter candidate route
```

Delegation creates independent adapter attempts/source evidence lineage rather than laundering embedded content through text interpretation.

If delegation is unavailable, the object remains preserved with diagnostics.

---

# 13. Scope discovery

`LanguageScopeDiscoveryService` may produce 0..N candidates:

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

One document can contain many candidate scopes and shared evidence.

---

# 14. Common source-evidence materialization

Language-specialized evidence enters common structures through:

```text
SourceEvidenceGraph
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
sourceExtensionRefs
SemanticClaim
ProvenanceLink
```

Not every sentence is materialized as a source occurrence. Only useful addressable candidate semantic entities/relations are materialized.

---

# 15. Normalization boundary

`CanonicalNormalizer` consumes supported candidate semantic scope/claims.

Rules:

- preserve source IDs/anchors separately from canonical IDs;
- no canonical edge from document position alone;
- no canonical actor from unresolved pronoun alone;
- no activity created solely from a prohibited action mention;
- no process boundary invented because a document has a first/last paragraph;
- no Temporal mapping.

---

# 16. Validation boundary

Semantic Validation v0.2 evaluates the resulting candidate ProcessRevision for the requested intent.

Potential blockers/findings include:

```text
unresolved actor/object reference
ambiguous ordering
ambiguous condition/exception scope
conflicting normative rules
missing completion
unclear process boundary
unresolved external reference
```

The language adapter does not repair them silently.

---

# 17. Human resolution / Canvas Review

Canvas Review can render both canonical and source-only language evidence.

Review actions may confirm/correct:

```text
actor resolution
modality
condition
ordering
rule interpretation
scope membership
example-vs-requirement classification
```

Corrections create review-authored source/claim lineage and new semantic revisions where needed.

Original document and old interpreter attempt remain immutable.

---

# 18. Re-interpretation boundary

```text
source representation R
  ├── attempt A / model v1
  └── attempt B / model v2
```

Both remain immutable.

A newer attempt does not automatically supersede user-confirmed meaning or the active review baseline.

Frozen baseline transition/reconciliation handles adoption.

---

# 19. Failure isolation

```text
source preservation failure      → no false preservation claim
text extraction failure          → source survives
structural parse failure         → partial/raw text may survive with diagnostic
language interpretation failure  → source/extracted text survives
mixed-content delegation failure → embedded object remains preserved
normalization failure            → evidence/claims survive
validation blocker               → explainable candidate, not executable
review failure                   → upstream evidence survives
```

---

# 20. Security / sensitive text boundary

Source documents may contain PII/secrets or irrelevant sensitive material.

The adapter architecture preserves evidence without requiring every literal source span to be copied into canonical semantics.

Concrete redaction/access-control implementation remains later work.

---

# 21. Conformance gate

P2-04 passes only if the language/document contract survives adversarial tests covering:

```text
source vs extracted text
exact text anchoring
distributed claims
actor/coreference ambiguity
modality
negation
conditions/exceptions
document order vs execution order
list/table hierarchy
cross-references
examples vs requirements
policy vs procedure
multiple scopes
mixed embedded content
partial extraction
model upgrades
Canvas review correction lineage
```

BUILD remains closed.
