# TALOS — Language / Document Adapter Contract v0.2

Status: **DESIGN CANDIDATE / P2-04 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active P2-04 design: `14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial pressure test:

```text
L01–L30
29 PASS
 1 FAIL
```

Failure:

```text
L28 — human resolution of language alternatives is historical
```

v0.1 correctly made `LanguageAlternativeSet` immutable, but did not define a source-family-independent immutable record that identifies which exact alternatives a later human/authority selected or rejected.

v0.2 adds:

```text
LanguageAlternativeDecision
```

and keeps all interpreter output immutable.

No frozen Phase-1 or common intake contract is reopened.

---

# 1. Fundamental invariants

```text
SOURCE DOCUMENT / EXPRESSION          ≠ EXTRACTED TEXT REPRESENTATION
EXTRACTED TEXT                        ≠ SOURCE BYTES AUTOMATICALLY
TEXT SPAN                             ≠ SEMANTIC CLAIM AUTOMATICALLY
SEMANTIC CLAIM                        ≠ PROCESS NODE AUTOMATICALLY
SENTENCE ORDER                        ≠ EXECUTION ORDER AUTOMATICALLY
PARAGRAPH ORDER                       ≠ EXECUTION ORDER AUTOMATICALLY
LIST ORDER                            ≠ EXECUTION ORDER AUTOMATICALLY
TABLE ROW ORDER                       ≠ EXECUTION ORDER AUTOMATICALLY
HEADING HIERARCHY                     ≠ SUBPROCESS HIERARCHY AUTOMATICALLY
GRAMMATICAL SUBJECT                   ≠ PROCESS ACTOR AUTOMATICALLY
PRONOUN / NOMINAL REFERENCE           ≠ RESOLVED ACTOR AUTOMATICALLY
MODAL MARKER                          ≠ EXECUTABLE ACTION AUTOMATICALLY
NEGATION                              ≠ ABSENCE OF PROCESS MEANING
EXAMPLE                               ≠ NORMATIVE REQUIREMENT
POLICY STATEMENT                       ≠ EXECUTABLE PROCESS AUTOMATICALLY
CROSS-REFERENCE                        ≠ RESOLVED CONTENT AUTOMATICALLY
ONE DOCUMENT                           ≠ ONE PROCESS
ONE PARAGRAPH                          may support MANY semantic claims
ONE CLAIM                              may require MANY text spans
LANGUAGE MODEL INTERPRETATION          ≠ SOURCE_TRUTH AUTOMATICALLY
MODEL PREFERENCE                       ≠ HUMAN CONFIRMATION
LANGUAGE ALTERNATIVE SET               = IMMUTABLE ATTEMPT OUTPUT
HUMAN/AUTHORITY RESOLUTION             ≠ ALTERNATIVE-SET MUTATION
NEW INTERPRETER VERSION                ≠ MUTATION OF OLD INTERPRETATION
DOCUMENT REVISION                      ≠ MUTATION OF PRIOR SOURCE REVISION
EMBEDDED IMAGE/TABLE                   ≠ SILENTLY FLATTENED TEXT
MISSING PROCESS BOUNDARY               ≠ LICENSE TO INVENT ONE
```

Primary laws:

```text
TEXT SPAN
      ≠
SEMANTIC CLAIM AUTOMATICALLY
      ≠
PROCESS NODE AUTOMATICALLY
      ≠
CONTROL FLOW AUTOMATICALLY
```

and:

```text
DOCUMENT ORDER
      ≠
PROCESS EXECUTION ORDER AUTOMATICALLY
```

---

# 2. Source provenance profiles

## Native digital document

```text
SourceOrigin(DIGITAL_NATIVE_ARTIFACT)
→ SourceCapture(DIRECT_UPLOAD | CONNECTOR_FETCH | API_IMPORT | PASTE | SOURCE_DEFINED)
→ SourceRepresentation(NATIVE_DIGITAL)
```

## Direct human text entry

```text
SourceOrigin(HUMAN_EXPRESSION / NATURAL_LANGUAGE_TEXT)
→ SourceCapture(PASTE | SOURCE_DEFINED)
→ exact submitted SourceRepresentation
```

Interpretation begins only after exact submitted content is preserved.

## Extracted text

```text
original SourceRepresentation
      ↓
TransformationRecord(TEXT_EXTRACTION / SOURCE_DEFINED)
      ↓
SourceRepresentation(TEXT_EXTRACT)
```

Extracted text never replaces original bytes.

OCR/perceptual text must retain Image / Perception lineage where applicable.

---

# 3. Adapter attempt

Use frozen `AdapterAttempt`:

```text
adapterId = LanguageDocumentAdapter
adapterVersion = versioned
extractionMode = TEXT_INTERPRETATION
```

Fingerprint includes semantic inputs such as:

```text
source/text representation digest
adapter/version
interpreter/model version set
linguistic pipeline version
mapping/rule-registry version
configuration digest
canonical model version where relevant
```

Each new interpreter/model/configuration creates a new immutable attempt.

---

# 4. Language interpretation layers

```text
SOURCE ORIGIN / DOCUMENT
        ↓
SOURCE REPRESENTATION(S)
        ↓
DOCUMENT STRUCTURE / TEXT REPRESENTATION
        ↓
TEXT EVIDENCE ANCHORS
        ↓
LINGUISTIC OBSERVATIONS
        ↓
INTERPRETATION ALTERNATIVES / RELATION CANDIDATES
        ↓
SOURCE OCCURRENCES / SEMANTIC CLAIMS
        ↓
0..N CANDIDATE SEMANTIC SCOPES
        ↓
CANONICAL NORMALIZATION WHERE SAFE
        ↓
SEMANTIC VALIDATION
        ↓
CANVAS REVIEW
```

No layer silently becomes the next.

---

# 5. Document structure

```text
DocumentStructureMap
- id
- adapterAttemptId
- sourceRepresentationId
- structureSource
- structuralUnitIds[]
- extractionVersion?
- confidence?
- createdAt
```

`structureSource`:

```text
SOURCE_NATIVE
PARSED
EXTRACTED
INFERRED
SOURCE_DEFINED
UNKNOWN
```

`StructuralUnit` may represent:

```text
DOCUMENT
PAGE
SECTION
SUBSECTION
PARAGRAPH
SENTENCE
LIST
LIST_ITEM
TABLE
TABLE_ROW
TABLE_COLUMN
TABLE_CELL
FOOTNOTE
ENDNOTE
CAPTION
BLOCKQUOTE
EXAMPLE_BLOCK
CODE_BLOCK
EMBEDDED_OBJECT
SOURCE_DEFINED
```

Document hierarchy remains source/document structure, not process hierarchy automatically.

---

# 6. TextEvidenceAnchor

```text
TextEvidenceAnchor
- id
- sourceRepresentationId
- structuralUnitId?
- locatorKind
- start?
- end?
- pageRef?
- structuralPath?
- quotedText?
- quotedTextDigest?
- normalizationApplied?
- anchorVersion
- notes?
```

Locator kinds:

```text
CHAR_RANGE
BYTE_RANGE
TOKEN_RANGE
STRUCTURAL_UNIT
TABLE_CELL
PAGE_REGION_REF
SOURCE_DEFINED
```

Offsets are scoped to one exact representation/version.

One claim may reference many anchors; one anchor may support many claims.

---

# 7. Literal text vs extracted/normalized/interpreted text

Preserve separately where applicable:

```text
native text evidence
extracted text evidence
literal wording
normalized wording
linguistic interpretation
business semantic interpretation
```

Extraction uncertainty propagates; it is not erased by later confident interpretation.

---

# 8. LinguisticObservation

```text
LinguisticObservation
- id
- adapterAttemptId
- sourceRepresentationId
- textAnchorRefs[]
- observationKind
- observedValue?
- confidence?
- interpreterRef
- interpreterVersion
- pipelineStage
- alternativeSetRef?
- supportingObservationRefs[]?
- createdAt
```

Kinds may include:

```text
ENTITY_MENTION
ACTOR_MENTION
ACTION_PHRASE
STATE_PHRASE
OBJECT_MENTION
TEMPORAL_MARKER
CONDITION_PHRASE
EXCEPTION_PHRASE
NEGATION
MODAL_MARKER
REFERENCE_MENTION
COREFERENCE_CANDIDATE
DISCOURSE_ROLE
LIST_RELATION
TABLE_RELATION
DEFINITION_STATEMENT
RULE_STATEMENT
EXAMPLE_SIGNAL
PROCESS_BOUNDARY_SIGNAL
SOURCE_DEFINED
```

Observations remain immutable attempt history.

---

# 9. LanguageAlternativeSet

```text
LanguageAlternativeSet
- id
- adapterAttemptId
- subjectObservationRef?
- propertyPath
- alternatives[]
- exclusivityMode
- modelPreferredAlternativeId?
- modelPreferenceConfidence?
- createdAt
```

Each alternative:

```text
LanguageAlternative
- id
- value
- confidence?
- evidenceAnchorRefs[]
- supportingObservationRefs[]
- interpretationNotes?
```

`exclusivityMode`:

```text
MUTUALLY_EXCLUSIVE
NON_EXCLUSIVE
SOURCE_DEFINED
```

`modelPreferredAlternativeId` is immutable model output/history. It is not accepted truth.

No human-selection state is stored on the alternative set.

---

# 10. LanguageAlternativeDecision — new in v0.2

Later human/authority handling is represented separately:

```text
LanguageAlternativeDecision
- id
- alternativeSetId
- decisionKind
- selectedAlternativeIds[]
- rejectedAlternativeIds[]?
- authorityRef?
- decidedBy?
- rationale?
- decidedAt
- confirmationRecordRefs[]?
- semanticClaimRefs[]?
- resultingProcessRevisionRef?
- reviewActionRef?
```

`decisionKind`:

```text
CONFIRM_ALTERNATIVE
SELECT_INTERPRETATION
REJECT_ALL
KEEP_UNRESOLVED
DEFER
SOURCE_DEFINED
```

The decision is immutable.

It may be created through Canvas Review, API, controlled administrative action or another authority path; it does not require a Canvas-specific `ReviewAction` to exist.

A later disagreement creates new claim/conflict/decision history according to frozen provenance rules; it never edits the old alternative set or decision.

---

# 11. Resolution lineage

```text
AdapterAttempt A
  ↓
LanguageAlternativeSet S
model prefers interpretation X
  ↓
(no mutation)
  ↓
Human/authority decides Y
  ↓
LanguageAlternativeDecision D
selected = Y
  ↓
ConfirmationRecord / SemanticClaim
  ↓
ProcessRevision B if semantic meaning changes
  ↓
ValidationAssessment B
  ↓
Canvas baseline transition if review workspace exists
```

Talos can answer separately:

```text
What did the interpreter originally propose?
What did the model prefer?
What did the authority later accept/reject?
```

---

# 12. Actor / reference resolution

```text
TextReferenceCandidate
- id
- mentionAnchorRefs[]
- mentionLiteral?
- candidateTargetRefs[]
- candidateExternalRefs[]
- resolutionConfidence?
- resolutionBasis
- interpretationRef
```

Pronouns, aliases and nominal references may remain unresolved or have alternatives.

No candidate referent automatically becomes canonical identity.

---

# 13. Modality / normative force

Literal marker and interpreted force remain separate.

Candidate classes:

```text
REQUIRED
PROHIBITED
RECOMMENDED
PERMITTED
CONDITIONAL_REQUIREMENT
DESCRIPTIVE
TYPICAL_BEHAVIOR
UNKNOWN
SOURCE_DEFINED
```

Examples:

```text
must/shall       → REQUIRED candidate
must not         → PROHIBITED candidate
should           → RECOMMENDED candidate
may/can          → PERMITTED/possibility candidate
normally/usually → TYPICAL_BEHAVIOR candidate
```

Context/language may create alternatives.

Normativity alone does not create process topology.

---

# 14. Ordering / textual relations

```text
TextualRelationCandidate
- id
- adapterAttemptId
- relationKind
- subjectRefs[]
- objectRefs[]
- evidenceAnchorRefs[]
- explicitness
- confidence?
- alternativeSetRef?
- notes?
```

Candidate relation kinds:

```text
BEFORE
AFTER
THEN
UNTIL
WHILE
CONCURRENT_WITH
TRIGGERS
CONDITIONAL_ON
EXCEPTION_TO
ALTERNATIVE_TO
REPLACES_NORMAL_PATH
DEPENDS_ON
APPLIES_TO
REFERS_TO
DEFINES
PROHIBITS
SOURCE_DEFINED
UNKNOWN
```

`explicitness`:

```text
EXPLICIT_TEXT
STRUCTURAL_CANDIDATE
DISCOURSE_INFERENCE
INFERRED
UNKNOWN
```

Document adjacency alone does not create canonical sequence.

---

# 15. Normal path / exception example

For:

```text
First, managers normally review requests.
Urgent requests may instead be approved directly by the director.
```

valid candidate interpretation includes:

```text
manager review      → TYPICAL_BEHAVIOR
director approval   → PERMITTED / ALTERNATIVE
urgent              → CONDITION
instead             → REPLACES_NORMAL_PATH / EXCEPTION relation
First               → local ordering marker
```

Forbidden automatic flattening:

```text
Manager Review → Director Approval
```

---

# 16. Negation / prohibition

Negative language remains semantic evidence.

```text
Do not release payment before approval.
```

may support prohibition/order constraints without requiring a positive `Release Payment` activity unless broader evidence establishes that action in process scope.

---

# 17. Discourse role

Candidate roles:

```text
RULE_STATEMENT
DESCRIPTION
DEFINITION
RATIONALE
EXAMPLE
BACKGROUND_CONTEXT
OBSERVATION
SOURCE_DEFINED
UNKNOWN
```

Example/background/policy text can be useful without becoming executable topology.

---

# 18. Lists / checklists

List numbering/order is source evidence.

Interpretation may distinguish:

```text
explicitly ordered procedure
checklist
requirements set
reference list
examples
```

Strict flow requires contextual/literal support, not numbering alone.

---

# 19. Tables

Preserve source table structure before interpretation.

Candidate table meanings include:

```text
RACI/responsibility matrix
condition/action decision table
SLA matrix
status transition table
input/output catalog
reference data
checklist
SOURCE_DEFINED
```

Row/column order is not sequence automatically.

---

# 20. Cross-references

```text
DocumentReferenceDescriptor
- id
- sourceAnchorRefs[]
- literalReference
- referenceKind
- resolutionState
- resolvedArtifactRef?
- resolvedStructuralUnitRef?
- externalLocator?
- evidenceRefs[]
```

Resolution states:

```text
RESOLVED_LOCAL
RESOLVED_EXTERNAL_AVAILABLE
EXTERNAL_NOT_AVAILABLE
UNRESOLVED
INVALID
SOURCE_DEFINED
```

Unresolved references remain gaps/evidence; missing external content is not invented.

---

# 21. Process / semantic scope discovery

Candidate scopes may include:

```text
PROCESS_CANDIDATE
BUSINESS_OBJECT_LIFECYCLE
POLICY_SCOPE
PROCEDURE_SCOPE
RULE_SET_SCOPE
ROLE_RESPONSIBILITY_SCOPE
EXECUTABLE_SLICE_CANDIDATE
NON_EXECUTABLE_CONTEXT
SOURCE_DEFINED
```

One document may produce 0..N process candidates.

Shared evidence may support multiple scopes.

---

# 22. Version/revision metadata

Document versions/revisions are preserved as source evidence.

A newer document revision does not rewrite old source representations or automatically supersede all prior semantic claims without authority/evidence.

---

# 23. Embedded / mixed content

```text
EMBEDDED CONTENT ≠ SILENTLY FLATTENED TEXT
```

Embedded diagrams/images/attachments remain distinct evidence and may be delegated to another proven adapter family.

Failure/unavailability of delegation produces diagnostics, not invented text semantics.

---

# 24. Partial / unsafe interpretation

Valid partial state:

```text
AdapterAttempt = PARTIAL
interpretable text evidence retained
unsupported/embedded regions retained with diagnostics
0..N candidate scopes may still exist
```

Unsafe input may produce no process output while preserved source remains valid.

---

# 25. Re-interpretation / model upgrades

Each interpreter/model version creates a new immutable AdapterAttempt/result/claims.

Newer freshness does not outrank confirmed business meaning.

If adoption changes an active review baseline, use frozen reconciliation/transition rules.

---

# 26. Canvas review compatibility

Canvas may show:

```text
canonical meaning
source-only text evidence
literal spans
reference alternatives
modality alternatives
ordering/exception candidates
policy/non-process context
model preference
LanguageAlternativeDecision history
validation findings/conflicts
```

Display does not transfer provenance ownership.

Review corrections create new review-authored evidence rather than editing source/interpreter history.

---

# 27. Common intake compatibility

Language-specialized structures integrate through:

```text
AdapterAttempt
AdapterResult
ArtifactClassification
SourceEvidenceGraph
SourceOccurrenceDescriptor
SourceRelationshipDescriptor
CandidateSemanticScope
InterpretationClaimSet
SemanticClaim
ProvenanceLink
```

No private canonical or Temporal path is created.

---

# 28. Canonical mapping discipline

Safe mapping is property/claim scoped.

Examples:

```text
"The manager reviews the request"
→ ACTION candidate + actor candidate
```

while:

```text
"Managers should review unusual requests"
→ recommended policy/rule candidate; activity not guaranteed
```

and:

```text
"If payment is rejected, notify Finance"
→ condition/action candidates; full topology/completion may remain unknown
```

No text-derived interpretation compiles directly to Temporal.

---

# 29. Validation integration

Potential language-derived blockers/findings include:

```text
unresolved actor/object reference
ambiguous ordering
ambiguous exception/condition scope
conflicting normative rules
missing process completion
unclear process boundary
unresolved external reference
```

Validation explains gaps; it does not repair them.

---

# 30. Diagnostics

```text
TEXT_EXTRACTION_UNCERTAIN
TEXT_ANCHOR_UNAVAILABLE
AMBIGUOUS_ACTOR_REFERENCE
AMBIGUOUS_OBJECT_REFERENCE
AMBIGUOUS_MODALITY
AMBIGUOUS_ORDERING
AMBIGUOUS_EXCEPTION_SCOPE
NEGATION_SCOPE_UNCERTAIN
EXAMPLE_VS_REQUIREMENT_UNCERTAIN
DOCUMENT_SCOPE_UNCERTAIN
CROSS_REFERENCE_UNRESOLVED
TABLE_SEMANTICS_UNCERTAIN
LIST_ORDER_SEMANTICS_UNCERTAIN
EMBEDDED_CONTENT_NOT_INTERPRETED
PARTIAL_DOCUMENT_EXTRACTION
UNSAFE_TO_INTERPRET_REGION
SOURCE_DEFINED
```

Diagnostics remain evidence-addressable where possible.

---

# 31. P2-04 regression target

v0.2 must pass **all L01–L30**, especially:

```text
L28 — alternative resolution remains separate immutable history
```

Conformance targets:

```text
Canonical Process Model v0.1
Provenance Model v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Review / Projection v0.2
Image / Perception historical-resolution discipline
```

BUILD remains closed.
