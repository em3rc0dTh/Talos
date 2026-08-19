# TALOS — Human-Readable Workflow Draft Contract v0.1

Status: **DESIGN CANDIDATE / T3-01 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define how TALOS explains an interpreted semantic scope to a human before that meaning is accepted for capability or execution design.

The product may call this the **Workflow Draft**, but the contract must also explain non-workflow scopes without forcing them into a fake sequence.

Primary question:

> How can TALOS say what it understands, what remains uncertain/conflicted, and why it believes each material statement without turning generated explanation text into new process truth?

BUILD remains closed.

---

# 1. Fundamental invariants

```text
DERIVED EXPLANATION                ≠ SOURCE
RENDERED TEXT                      ≠ NEW SEMANTIC TRUTH
EXPLANATION ORDER                  ≠ PROCESS EXECUTION ORDER AUTOMATICALLY
NUMBERED DISPLAY                   ≠ SEQUENCE SEMANTICS AUTOMATICALLY
VALIDATION FINDING                 ≠ PROCESS STEP
CLARIFICATION QUESTION             ≠ ASSUMED ANSWER
SOURCE-ONLY EVIDENCE               ≠ CANONICAL ELEMENT REQUIRED
INFERRED MEANING                   ≠ CONFIRMED MEANING
HIGH CONFIDENCE                    ≠ CONFIRMED MEANING
IMPLEMENTED BEHAVIOR               ≠ BUSINESS INTENT
OPERATIONAL OBSERVATION            ≠ BUSINESS SUCCESS
FUNCTIONAL DEPENDENCY              ≠ TEMPORAL SEQUENCE
ARCHITECTURE SCOPE                 ≠ ONE WORKFLOW
ONE ARTIFACT                       ≠ ONE EXPLANATION SCOPE
NEW RENDERER VERSION               ≠ NEW SEMANTIC REVISION
NEW VALIDATION ASSESSMENT          ≠ MUTATION OF OLD EXPLANATION SNAPSHOT
NEW ADAPTER INTERPRETATION         ≠ SILENT DRAFT REBASE
```

Core law:

> Every material human-readable proposition must be traceable to accepted canonical meaning, source/claim evidence, validation state, or an explicitly identified unknown/conflict/suggestion.

---

# 2. Draft kinds

A human-readable draft is scope-aware.

```text
HumanReadableDraftKind
- PROCESS_FLOW
- COLLABORATION
- PARTICIPANT_LOCAL_PROCESS
- FUNCTIONAL_MODEL
- ARCHITECTURE_SCOPE
- POLICY_PROCEDURE
- BUSINESS_OBJECT_LIFECYCLE
- EXECUTABLE_SLICE_CANDIDATE
- SOURCE_REVIEW_ONLY
- SOURCE_DEFINED
```

A source that does not establish one workflow must not be forced into `PROCESS_FLOW`.

Q06 may produce `ARCHITECTURE_SCOPE` plus 0..N `EXECUTABLE_SLICE_CANDIDATE` drafts.

Q12 may produce `FUNCTIONAL_MODEL` even when runtime sequence is not established.

---

# 3. ExplanationDraftSnapshot

Every draft is an immutable explanation snapshot.

```text
ExplanationDraftSnapshot
- id
- draftKind
- primarySemanticScopeRef
- contextSemanticScopeRefs[]
- processRevisionRef?
- sourceArtifactRefs[]
- sourceRepresentationRefs[]
- primaryValidationAssessmentRef?
- validationAssessmentRefs[]
- canonicalModelVersion
- provenanceContractVersion
- validationContractVersion
- explanationContractVersion
- generatorRef
- generatorVersion
- contentBlockRefs[]
- propositionRefs[]
- evidenceIndexRef?
- questionRefs[]
- semanticDigest
- generatedAt
- supersedesDraftRef?
```

A draft may exist for a source/candidate scope that has no complete canonical `ProcessRevision`; in that case source/claim context is mandatory.

The snapshot never mutates after generation.

---

# 4. Semantic proposition vs rendered wording

Separate what TALOS is saying from how it is worded.

```text
ExplanationProposition
- id
- draftSnapshotId
- propositionKind
- subjectRefs[]
- propertyPaths[]?
- semanticValueRefs[]?
- claimRefs[]
- provenanceRefs[]
- findingRefs[]
- questionRefs[]
- epistemicState
- evidencePerspective?
- confidence?
- materiality
- notes?
```

`epistemicState`:

```text
SOURCE_STATED
INFERRED
CONFIRMED
CONFLICTED
UNKNOWN
SUGGESTED
SOURCE_DEFINED
```

`materiality`:

```text
CONTEXT
PROCESS_MEANING
AUTOMATION_DESIGN_BLOCKER
REVIEW_REQUIRED
INFORMATIONAL
SOURCE_DEFINED
```

The proposition is the semantic explanation record.

Rendered language is a separate derivative.

---

# 5. ExplanationRendering

```text
ExplanationRendering
- id
- draftSnapshotId
- renderingVersion
- rendererRef
- locale
- audienceProfile?
- detailLevel
- renderedSectionRefs[]
- renderingDigest
- generatedAt
```

Possible detail levels:

```text
SUMMARY
STANDARD
DETAILED
AUDIT
SOURCE_DEFINED
```

Rules:

```text
same draft snapshot
+ different locale/renderer/detail level
→ different rendering allowed
→ no new semantic proposition automatically
```

A renderer may paraphrase supported propositions but may not introduce unsupported business facts.

---

# 6. ExplanationContentBlock

The draft is not required to be one flat numbered list.

```text
ExplanationContentBlock
- id
- draftSnapshotId
- blockKind
- subjectRefs[]
- propositionRefs[]
- childBlockRefs[]
- displayOrder?
- structuralRole?
- evidenceRefs[]
- findingRefs[]
- questionRefs[]
```

`blockKind`:

```text
OVERVIEW
ENTRY
STEP
DECISION
BRANCH
PARALLEL_REGION
JOIN
WAIT
HUMAN_INTERACTION
LOOP
SUBPROCESS
COLLABORATION_REGION
DATA_OBJECT
RULE
OUTCOME
COMPLETION
FUNCTIONAL_RELATIONSHIP
ARCHITECTURE_CONTEXT
POLICY_CONTEXT
UNKNOWN_MEANING
CONFLICT
VALIDATION_FINDING_GROUP
CLARIFICATION_GROUP
SOURCE_CONTEXT
SOURCE_DEFINED
```

`displayOrder` is presentation metadata. It is not process order unless supported by semantic relations.

---

# 7. Human-readable flow structure

For `PROCESS_FLOW`, content blocks preserve canonical topology.

Example:

```text
STEP: Receive order
  ↓
STEP: Check stock
  ↓
DECISION: In stock?
  ├─ BRANCH: Out of stock
  │    ↓
  │  STEP: Cancel order
  └─ BRANCH: In stock
       ↓
     STEP: Check card
```

A branch without a proven target is rendered as unresolved, not silently attached to an end.

Parallel regions are shown as parallel, not converted into arbitrary serial numbering.

---

# 8. ExplanationRelation

Where narrative structure needs explicit relationships:

```text
ExplanationRelation
- id
- draftSnapshotId
- sourceBlockRef
- targetBlockRef?
- relationKind
- semanticRelationshipRefs[]
- claimRefs[]
- endpointState
- epistemicState
- confidence?
```

`relationKind` may include:

```text
SEQUENCE_EXPLANATION
CONDITIONAL_BRANCH
DEFAULT_BRANCH
PARALLEL_BRANCH
JOIN_RELATION
LOOP_BACK
WAIT_RESUME
MESSAGE_RELATION
FUNCTIONAL_DEPENDENCY
DECOMPOSITION
ALTERNATIVE_PATH
EXCEPTION_PATH
SOURCE_DEFINED
UNKNOWN
```

Explanation relation kind must be derived from supported semantics, not diagram/text display order.

---

# 9. Overview contract

Every draft should answer, where evidence supports it:

```text
What scope is this?
What is TALOS confident it understands?
What source(s) support it?
What is inferred or unresolved?
What conflicts exist?
What blocks acceptance / automation design?
```

For a coherent process scope, the overview may summarize:

```text
entry / trigger
major path
important decisions
actors
outcomes
```

without inventing missing details.

---

# 10. Actors and responsibility

Explain separately:

```text
actor/role identity
responsibility/ownership type
source evidence/perspective
missing/unresolved authority
```

A lane, collaborator cursor, grammatical subject or automation provider is not silently promoted to business owner.

---

# 11. Decisions / rules

A decision explanation must distinguish:

```text
decision exists
branch labels/guards
business rule meaning
source/inference status
unresolved branch target
```

Do not present a technical automation IF node as business decision intent unless supported.

---

# 12. Waits / events

Explain:

```text
what waits
what resumes it
when/timing expression
who/what observes completion
what remains unknown
```

Incomplete wait semantics remain visible as findings/questions.

---

# 13. Human interactions

A human interaction explanation may include:

```text
requested human work
assigned/expected role if known
input/context
possible outcomes
completion evidence
unresolved authority/outcome semantics
```

No UI/form/provider design is invented in T3-01.

---

# 14. Data / business objects

Explain business-relevant data/object meaning without dumping source-sensitive implementation data.

Sensitive source values remain behind provenance/security boundaries.

Credential values, secrets and unrelated PII must never be copied into the draft merely because source evidence contains them.

---

# 15. Completion / outcomes

Explain only proven completion semantics.

```text
last visible node
no detected continuation
workflow execution success
provider success flag
```

are not enough by themselves to assert business completion.

If completion is unproven, the draft explicitly says so and links the validation finding/question.

---

# 16. Unknowns and source-only evidence

Unknown/source-only material is first-class explanation content.

Example:

```text
TALOS sees a NO branch from "Approved?", but its destination is unresolved.
```

This can exist without a fake canonical edge.

---

# 17. Conflicts

Material conflicts are not silently summarized away.

Example:

```text
Business-intent source:
manager approval required

Existing automation:
auto-approval above threshold
```

The draft presents the disagreement, perspectives and current resolution state.

No source wins solely because it is structured, executable, recent or high-confidence.

---

# 18. Validation findings

Validation findings appear in a separate review layer/group from process steps.

For each material finding expose:

```text
what is wrong/missing
why it matters
which semantic scope/element it affects
which evidence supports the finding
whether it blocks automation design
what resolution route applies
```

Do not convert findings into process nodes.

---

# 19. Clarification questions

Questions are linked to the exact finding/semantic subject they address.

A question does not contain or imply an assumed answer.

Questions should be grouped/prioritized by materiality and dependency rather than by source appearance order alone.

---

# 20. Functional models

For a functional model such as Q12, valid draft behavior includes:

```text
FUNCTION: Votación
INPUT candidate: Mesas instaladas
OUTPUT candidate: Votos emitidos
CONTROL candidate: Verificación de identidad
MECHANISM candidate: Votantes / material
```

while explicitly stating that functional dependency is not proven runtime sequence.

Do not output a fake numbered workflow unless an executable slice is separately established.

---

# 21. Architecture/reference models

For Q06-style architecture:

```text
artifact/scope classification
major capability/topology regions
known dependencies
candidate executable slices
unknown runtime boundaries
```

are explainable.

The whole artifact is not called invalid merely because it is not one workflow.

---

# 22. Language/document semantics

Text-derived process meaning keeps linguistic distinctions visible where material:

```text
required vs recommended vs permitted
typical path vs exception/alternative
explicit order vs discourse inference
unresolved actor/coreference
policy/example/context vs process action
```

Document order is not reused as draft process order without semantic support.

---

# 23. Existing automation semantics

Automation-derived explanation must label implementation evidence appropriately.

Example:

```text
Implemented behavior:
workflow calls Stripe charge endpoint

Business intent:
not established by this source alone
```

Definition configuration, deployment observation and runtime execution remain distinct when displayed.

---

# 24. Multi-source drafts

One explanation scope may use evidence from many source artifacts.

The draft preserves per-proposition provenance/perspective and exposes material conflict.

No single `sourceName` field may imply one-origin ownership of merged meaning.

---

# 25. Draft generation boundary

Conceptual service:

```text
ExplanationDraftGenerator
```

Consumes:

```text
CandidateSemanticScope / ProcessRevision
SemanticClaims / Provenance
ValidationAssessment(s)
source context
```

Produces immutable:

```text
ExplanationDraftSnapshot
ExplanationPropositions
ExplanationContentBlocks
ExplanationRelations
```

It does not write source, canonical or validation truth.

---

# 26. Rendering boundary

Conceptual service:

```text
ExplanationRenderer
```

Consumes one immutable draft snapshot and produces locale/detail-specific `ExplanationRendering`.

Renderer output is derivative presentation.

---

# 27. Re-generation / baseline history

New semantic inputs create a new draft snapshot.

Examples:

```text
new ProcessRevision
new material source interpretation adopted
new ValidationAssessment/ruleset affecting visible findings
review correction accepted
```

Old draft snapshots remain explainable.

A new renderer wording over the same semantic draft does not create a new ProcessRevision.

---

# 28. Canvas review integration

T3-01 and P2-01B share one semantic baseline.

```text
ExplanationDraftSnapshot
ReviewWorkspaceRevision
ReviewProjectionRevision
```

must be pinned to compatible ProcessRevision / assessment context.

The textual draft and visual Canvas may differ in presentation but must not contradict the semantic baseline silently.

---

# 29. Evidence navigation

Material propositions should allow reverse navigation conceptually:

```text
human statement
→ ExplanationProposition
→ SemanticClaim / canonical subject / finding
→ ProvenanceLink
→ EvidenceFragment
→ SourceRepresentation
→ SourceCapture
→ SourceOrigin
```

T3-01 defines the contract; UI behavior is later.

---

# 30. T3-01 pass condition

The contract must survive an explanation pressure suite including:

```text
simple sequence
decision / branch
parallel structure
unknown/dangling branch
Q06 architecture scope
Q12 functional model
Q11 surprising handwritten topology
source-only evidence
multi-source conflict
truth/confidence/perspective separation
validation finding/question separation
language exception semantics
automation implemented-behavior labeling
completion uncertainty
renderer/version history
validation reassessment
review correction/new revision
0..N process scopes
sensitive-source exclusion
```

No BUILD opens from T3-01.