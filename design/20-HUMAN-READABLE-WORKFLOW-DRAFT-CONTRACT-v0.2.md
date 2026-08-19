# TALOS — Human-Readable Workflow Draft Contract v0.2

Status: **DESIGN CANDIDATE / T3-01 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T3-01 design: `20-HUMAN-READABLE-WORKFLOW-DRAFT-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial T3-01 pressure test:

```text
E01–E30
29 PASS
 1 FAIL
```

Failure:

```text
E10 — one human proposition may combine properties with different truth/confidence/perspective states
```

v0.1 allowed one proposition to reference many properties/claims but exposed one proposition-wide epistemic state/confidence/perspective.

That could flatten property-scoped Provenance v0.3 evidence.

v0.2 introduces:

```text
ExplanationEvidenceFacet
```

and makes facet-level state authoritative.

No frozen Phase-1 or Phase-2 contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
ONE HUMAN SENTENCE                 may express MULTIPLE semantic facets
PROPOSITION RHETORICAL UNITY       ≠ ONE EPISTEMIC STATE
PROPERTY-SCOPED CLAIM STATE        must remain PROPERTY/FACET-SCOPED in explanation
PROPOSITION SUMMARY BADGE          ≠ evidence authority
RENDERER CONVENIENCE               ≠ permission to flatten provenance
```

Primary law:

> Human-readable explanation may combine related facts for readability, but TALOS must preserve the independent epistemic state, confidence, perspective and evidence lineage of each material fact/property.

---

# 2. Scope-aware draft kinds

Retain v0.1:

```text
PROCESS_FLOW
COLLABORATION
PARTICIPANT_LOCAL_PROCESS
FUNCTIONAL_MODEL
ARCHITECTURE_SCOPE
POLICY_PROCEDURE
BUSINESS_OBJECT_LIFECYCLE
EXECUTABLE_SLICE_CANDIDATE
SOURCE_REVIEW_ONLY
SOURCE_DEFINED
```

No non-workflow scope is forced into a numbered workflow.

---

# 3. ExplanationDraftSnapshot

Retain immutable snapshot contract:

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

Draft snapshots never mutate.

---

# 4. ExplanationProposition — revised

A proposition is a rhetorical/human-readable grouping, not the authority for property-level evidence state.

```text
ExplanationProposition
- id
- draftSnapshotId
- propositionKind
- subjectRefs[]
- facetRefs[]
- findingRefs[]
- questionRefs[]
- materiality
- optionalSummaryState?
- notes?
```

Removed as authoritative proposition-wide fields from v0.1:

```text
epistemicState
evidencePerspective
confidence
```

`optionalSummaryState` may be a derived UI convenience only and must never replace facet inspection for material review/acceptance decisions.

---

# 5. ExplanationEvidenceFacet — new in v0.2

```text
ExplanationEvidenceFacet
- id
- propositionId
- facetKind
- subjectRef?
- propertyPath?
- semanticValueRef?
- literalValue?
- claimRefs[]
- provenanceRefs[]
- evidenceRefs[]
- findingRefs[]
- questionRefs[]
- epistemicState
- evidencePerspective?
- confidence?
- materiality
- notes?
```

`facetKind` may include:

```text
IDENTITY
TYPE
LITERAL_LABEL
INTERPRETED_MEANING
ACTOR
RESPONSIBILITY
RELATIONSHIP_EXISTENCE
RELATIONSHIP_ROLE
CONDITION
ORDERING
TIMING
OUTCOME
COMPLETION
DATA_MEANING
MODALITY
IMPLEMENTATION_STATE
DEPLOYMENT_STATE
RUNTIME_OBSERVATION
SOURCE_DEFINED
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

Facet state derives from the underlying property-scoped claims/evidence and never silently upgrades them.

---

# 6. E10 canonical example

Q11 evidence:

```text
Facet F1
propertyPath = literalText
literalValue = "Brainst"
epistemicState = SOURCE_STATED
claim = SOURCE_TRUTH

Facet F2
propertyPath = interpretedMeaning
semanticValue = brainstorm
epistemicState = INFERRED
claim = INFERRED
```

Both may belong to one proposition:

```text
The box contains "Brainst", which TALOS interprets as "brainstorm".
```

The renderer may combine them because each facet remains independently inspectable.

Forbidden:

```text
one proposition badge = CONFIRMED/SOURCE_STATED
→ applied to both facts
```

---

# 7. ExplanationRendering

Retain v0.1 rendering separation:

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

Renderer output may combine facets linguistically but must preserve access to facet-level evidence/status.

For material mixed-state propositions, the rendering contract must support one or more of:

```text
inline qualifier
facet badge/marker
expandable evidence detail
explicit wording such as "TALOS interprets..."
```

Presentation mechanics are T3-02; semantic distinction is mandatory here.

---

# 8. Content blocks / relations

All v0.1 block/relation rules remain:

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
```

and relationship kinds remain semantic/context aware.

Display order never creates runtime order.

---

# 9. Validation / questions / conflicts

Retain v0.1:

```text
finding ≠ process step
question ≠ answer
conflict ≠ summarized-away disagreement
```

Material finding/question/conflict references may attach at proposition, facet and content-block level.

Facet-level attachment is preferred when only one property is affected.

---

# 10. Source-family discipline

All v0.1 source-family rules remain:

```text
Canvas       exact native authored structure
BPMN         source-notation semantics
Image        inferred perception
Language     linguistic interpretation
Automation   IMPLEMENTED_BEHAVIOR
Runtime      OPERATIONAL_OBSERVATION
```

No source family gets privileged explanation truth.

---

# 11. Completion / functional / architecture discipline

Retain:

```text
last visible node            ≠ completion
functional dependency        ≠ runtime sequence
architecture scope           ≠ one workflow
technical execution success  ≠ business success
```

Unknowns remain explicit.

---

# 12. Draft generation architecture contract

`ExplanationDraftGenerator` must produce:

```text
ExplanationDraftSnapshot
ExplanationProposition
ExplanationEvidenceFacet
ExplanationContentBlock
ExplanationRelation
```

from immutable semantic/provenance/validation inputs.

No generated proposition/facet writes upstream truth.

---

# 13. Baseline/history compatibility

Draft snapshot remains pinned to compatible:

```text
ProcessRevision / CandidateSemanticScope
ValidationAssessment(s)
source/adaptation context
```

New material interpretation/reassessment/review correction creates a new snapshot where explanation state changes.

Renderer-only change does not create ProcessRevision.

---

# 14. Evidence navigation

Material explanation can trace:

```text
rendered phrase
→ proposition
→ facet
→ claim/finding/question
→ provenance
→ evidence fragment
→ source representation/capture/origin
```

This is the Phase-3 human trust chain.

---

# 15. Security boundary

Sensitive source values not required for semantic explanation remain excluded.

No credential/secret value is copied into explanation simply because an adapter can access it.

---

# 16. Regression target

v0.2 must pass full E01–E30, especially:

```text
E10 mixed property-level epistemic state
E22 renderer history
E23 validation reassessment
E24 adapter reinterpretation
E30 textual/Canvas baseline compatibility
```

BUILD remains closed.