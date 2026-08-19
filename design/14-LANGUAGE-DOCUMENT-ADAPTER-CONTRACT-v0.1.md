# TALOS — Language / Document Adapter Contract v0.1

Status: **DESIGN CANDIDATE / P2-04 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define how process knowledge expressed through natural language, SOPs, policies, procedure manuals, meeting notes, structured prose, lists, tables and mixed documents enters TALOS through the frozen source-agnostic intake architecture.

Language is not a hidden flowchart.

A document may state rules, examples, exceptions, responsibilities, definitions, background context and several process fragments without establishing one executable graph.

Primary law:

```text
TEXT SPAN
      ≠
SEMANTIC CLAIM AUTOMATICALLY
      ≠
PROCESS NODE AUTOMATICALLY
      ≠
CONTROL FLOW AUTOMATICALLY
```

And:

```text
DOCUMENT ORDER
      ≠
PROCESS EXECUTION ORDER AUTOMATICALLY
```

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
"MUST" / "SHALL"                     ≠ ACTION AUTOMATICALLY
"SHOULD"                              ≠ REQUIRED BUSINESS RULE AUTOMATICALLY
"MAY"                                 ≠ OPTIONAL CONTROL-FLOW BRANCH AUTOMATICALLY
NEGATION                              ≠ ABSENCE OF PROCESS MEANING
EXAMPLE                               ≠ NORMATIVE REQUIREMENT
BACKGROUND DESCRIPTION                ≠ BUSINESS RULE
POLICY STATEMENT                       ≠ EXECUTABLE PROCESS AUTOMATICALLY
CROSS-REFERENCE                        ≠ RESOLVED CONTENT AUTOMATICALLY
ONE DOCUMENT                           ≠ ONE PROCESS
ONE PARAGRAPH                          may support MANY semantic claims
ONE CLAIM                              may require MANY text spans
LANGUAGE MODEL INTERPRETATION          ≠ SOURCE_TRUTH AUTOMATICALLY
MODEL PREFERENCE                       ≠ HUMAN CONFIRMATION
NEW INTERPRETER VERSION                ≠ MUTATION OF OLD INTERPRETATION
DOCUMENT REVISION                      ≠ MUTATION OF PRIOR SOURCE REVISION
EMBEDDED IMAGE/TABLE                   ≠ SILENTLY FLATTENED TEXT
MISSING PROCESS BOUNDARY               ≠ LICENSE TO INVENT ONE
```

---

# 2. Source provenance profiles

## Native digital document

```text
SourceOrigin
  originKind = DIGITAL_NATIVE_ARTIFACT
  mediumKind = DOCUMENT | NATURAL_LANGUAGE_TEXT | SOURCE_DEFINED

SourceCapture
  captureMethod = DIRECT_UPLOAD | CONNECTOR_FETCH | API_IMPORT | PASTE | SOURCE_DEFINED

SourceRepresentation
  representationKind = NATIVE_DIGITAL
```

## Direct human text entry

```text
SourceOrigin
  originKind = HUMAN_EXPRESSION
  mediumKind = NATURAL_LANGUAGE_TEXT

SourceCapture
  captureMethod = PASTE | SOURCE_DEFINED

SourceRepresentation
  representationKind = NATIVE_DIGITAL | SOURCE_DEFINED
```

The exact submitted text must be preserved before interpretation.

## Extracted text from PDF/DOCX/scan

The original document remains the preserved source representation. Text extraction creates a derivative representation:

```text
SourceRepresentation(original document)
      ↓
TransformationRecord(TEXT_EXTRACTION / SOURCE_DEFINED)
      ↓
SourceRepresentation(TEXT_EXTRACT)
```

The extracted text does not replace the original document bytes.

If text comes from image perception/OCR, that lineage must remain explicit and may depend on the frozen Image / Perception adapter rather than being treated as native document text.

---

# 3. Adapter attempt

Use frozen `AdapterAttempt`:

```text
adapterId = LanguageDocumentAdapter
adapterVersion = versioned
extractionMode = TEXT_INTERPRETATION
```

Input fingerprint includes at minimum:

```text
source representation digest
text representation/extraction digest where applicable
adapter/version
language model/interpreter version set
linguistic pipeline version
mapping/semantic rule registry version
configuration digest
canonical model version where mapping depends on it
```

New interpreter/model/configuration creates a new immutable attempt.

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

No layer is silently collapsed into the next.

---

# 5. DocumentStructureMap

A document may have source-native or extracted structural organization.

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

`StructuralUnit`:

```text
- id
- unitKind
- parentUnitId?
- ordinalWithinParent?
- sourceNativeRef?
- literalHeading?
- textRepresentationRef?
- textAnchorRefs[]
- metadata?
```

Possible `unitKind` values:

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

Structural hierarchy is document evidence, not process hierarchy automatically.

---

# 6. TextEvidenceAnchor

Every material language interpretation must be addressable to exact evidence in a specific representation.

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

`locatorKind`:

```text
CHAR_RANGE
BYTE_RANGE
TOKEN_RANGE
STRUCTURAL_UNIT
TABLE_CELL
PAGE_REGION_REF
SOURCE_DEFINED
```

`quotedText` is an evidence convenience/snapshot, not a replacement for the referenced representation.

Offsets are scoped to the exact representation/version they address.

---

# 7. Text extraction vs language interpretation

Keep separate:

```text
text exists in native representation
text extracted from document
literal wording in extracted representation
normalized wording
linguistic meaning
business semantic meaning
```

If extraction itself is uncertain, the language adapter must inherit or preserve that uncertainty rather than pretending the extracted string is source-confirmed text.

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

Possible kinds:

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

Observations are immutable attempt output.

---

# 9. LanguageAlternativeSet

Competing interpretations remain first-class.

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

No mutable human-selection fields exist on the set.

Later human/authority resolution uses separate immutable review/confirmation/decision records, following the same historical discipline proven for Image / Perception and Canvas Review.

---

# 10. Actor / reference resolution

Text often refers indirectly to actors or objects.

```text
"The manager reviews the request. They then approve it."
```

TALOS may infer that `They` refers to the manager, but must preserve that as a candidate reference resolution.

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

Possible resolution state remains claim/alternative scoped rather than a mutable source fact.

Unresolved pronouns do not authorize actor invention.

---

# 11. Modality and normativity

Preserve literal modal markers separately from interpreted normative force.

Candidate normative classes:

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
must / shall       → REQUIRED candidate
must not / shall not → PROHIBITED candidate
should             → RECOMMENDED candidate
may / can          → PERMITTED/possibility candidate
normally / usually → TYPICAL_BEHAVIOR candidate
```

Language, legal drafting conventions and context may change interpretation. Literal wording remains preserved.

Normative class does not itself create a process node or edge.

---

# 12. Ordering and temporal relations

Document position is not execution order.

Represent source-supported ordering separately:

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

Candidate `relationKind` values:

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

Only source-supported temporal/control semantics may become canonical flow candidates.

---

# 13. Conditions, exceptions and overrides

Language often embeds branch semantics inside one sentence.

Example:

```text
First, managers normally review requests.
Urgent requests may instead be approved directly by the director.
```

Possible interpretation evidence includes:

```text
manager review                    = typical behavior candidate
director approval                 = permitted/alternative behavior candidate
urgent request                    = condition candidate
"instead"                         = replacement/override relation candidate
"First"                           = ordering marker scoped to its clause/context
```

Forbidden flattening:

```text
Manager Review → Director Approval
```

unless the text independently establishes sequential execution.

---

# 14. Business rule vs descriptive statement

Distinguish candidates such as:

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

This is interpretation, not source truth unless document markup/source structure explicitly declares the role.

A policy paragraph may be semantically useful without yielding an executable process node.

---

# 15. Negation / prohibition

Negative language carries meaning.

```text
"Do not send the payment before approval."
```

must not disappear because no positive action is instructed.

Potential outputs:

```text
PROHIBITED relation/rule candidate
ordering constraint candidate
business rule candidate
```

Do not fabricate a `Send Payment` activity merely because the prohibited phrase names one, unless the broader evidence establishes that action as part of process scope.

---

# 16. Lists / checklists

List structure is source evidence.

```text
1. Verify identity
2. Check address
3. Confirm account
```

does not automatically prove strict runtime sequence.

Interpretation may consider:

```text
ordered procedure candidate
unordered checklist candidate
requirements set
examples
reference list
```

based on headings, surrounding prose, numbering language and document context.

---

# 17. Tables

Preserve:

```text
table identity
row/column/cell structure
headers
merged-cell relationships where available
literal cell content
```

Table position is not process order automatically.

Possible semantic interpretations may include:

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

Interpretation is evidence-backed and may yield 0..N process claims/scopes.

---

# 18. Cross-references

Preserve literal references such as:

```text
"see section 4.2"
"as defined in Appendix B"
"follow SOP-17"
```

through:

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

States:

```text
RESOLVED_LOCAL
RESOLVED_EXTERNAL_AVAILABLE
EXTERNAL_NOT_AVAILABLE
UNRESOLVED
INVALID
SOURCE_DEFINED
```

Unresolved references remain explicit. TALOS does not invent the missing referenced rule/process.

---

# 19. Examples vs normative requirements

Example signals such as:

```text
for example
for instance
e.g.
example:
```

support discourse-role interpretation.

An example can illustrate a rule without becoming an additional required branch or mandatory activity.

If the distinction is unclear, preserve competing alternatives.

---

# 20. Process boundary / scope discovery

A document may contain:

```text
policy context
one or more procedures
definitions
roles
exceptions
appendices
reference material
```

Candidate semantic scopes may therefore include:

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

One document may yield 0..N process candidates.

A missing title/start/end does not authorize a whole-document process assumption.

---

# 21. Multiple processes in one document

Separate candidate scopes by evidence, not by convenience.

One SOP manual may describe:

```text
customer onboarding
refund handling
account closure
```

Each remains a candidate scope with included/excluded textual evidence.

Shared policy paragraphs may support multiple scopes without duplication or source loss.

---

# 22. Version/revision metadata

Document version, effective date, revision notes and approval metadata are source evidence.

They do not mutate older source representations.

A later document revision is a new source representation/artifact revision context with explicit lineage where known.

Do not assume a later document revision semantically supersedes all prior claims without source/authority evidence.

---

# 23. Embedded / mixed content

Documents may contain:

```text
images
screenshots
flowcharts
tables
attachments
embedded objects
handwritten scans
```

Rules:

```text
EMBEDDED CONTENT ≠ SILENTLY FLATTENED TEXT
```

Preserve embedded-object identity/anchor and either:

- route/delegate to an appropriate source-family adapter when supported;
- preserve as unprocessed/partial evidence with diagnostic;
- or interpret only the textual metadata/caption actually available.

The language adapter must not claim visual semantics it did not perceive.

---

# 24. Partial extraction / unsupported content

Valid states include:

```text
AdapterAttempt = PARTIAL
textual sections interpreted
embedded/unsupported regions preserved with diagnostics
candidate scopes still possible
```

If source text cannot be safely extracted/interpreted:

```text
source preserved
UNSAFE_TO_INTERPRET allowed
no fake process graph
```

---

# 25. Interpretation alternatives and human review

Canvas Review may display:

```text
literal evidence spans
interpreted actions/actors/rules
reference/coreference alternatives
modality interpretation
ordering alternatives
process-scope candidates
policy/non-process context
validation findings
```

Human correction/confirmation creates new review-authored evidence and later ProcessRevision/ValidationAssessment lineage.

It never edits the source document or old interpreter attempt.

---

# 26. Re-interpretation / model upgrades

```text
same source representation
  ├── adapter/model v1 attempt
  └── adapter/model v2 attempt
```

Both remain immutable.

A newer interpretation does not automatically replace an active review baseline or user-confirmed meaning.

Use frozen Canvas Review baseline transition/reconciliation if adoption is proposed.

---

# 27. Common-contract materialization

Language-specialized evidence connects through common:

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

Source occurrences may represent language-addressable candidate actions, actors, rules, objects, events or source-defined semantic units.

Do not materialize every sentence as a source process node.

---

# 28. Canonical mapping discipline

Safe mapping is claim/property scoped.

Examples:

```text
"The manager reviews the request"
→ ACTION candidate: review request
→ Actor candidate: manager
```

but:

```text
"Managers should review requests"
```

may be a recommended policy/rule rather than a guaranteed process activity.

And:

```text
"If the payment is rejected, notify Finance"
```

may support condition/action semantics while completion, ordering and downstream topology remain incomplete.

No text-derived claim maps directly to Temporal.

---

# 29. Validation integration

Semantic Validation determines whether recovered language meaning is coherent/sufficient for the requested intent.

Common blockers may include:

```text
unresolved actor reference
ambiguous branch condition
missing completion semantics
conflicting normative statements
unresolved external reference
insufficient process boundary
ambiguous ordering where material
```

Language ambiguity is not silently repaired.

---

# 30. Diagnostics

Examples:

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

Diagnostics are evidence-addressable where possible.

---

# 31. Conformance target

P2-04 must prove compatibility with:

```text
Canonical Process Model v0.1
Provenance Model v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Review / Projection v0.2
```

No private canonical/runtime path is allowed.

BUILD remains closed.
