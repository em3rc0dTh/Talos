# TALOS — Human-Readable Workflow Draft Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T3-01 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T3-01 architecture: `10-HUMAN-READABLE-WORKFLOW-DRAFT-ARCHITECTURE-v0.1.md`

Target:

```text
design/20-HUMAN-READABLE-WORKFLOW-DRAFT-CONTRACT-v0.2.md
```

## Why v0.2 exists

Initial T3-01 result:

```text
29 PASS / 1 FAIL
```

E10 proved the explanation layer needs property/facet-scoped epistemic state.

---

# 1. End-to-end read architecture

```text
SOURCE / ADAPTER EVIDENCE
        ↓
CLAIMS + PROVENANCE
        ↓
CANONICAL / CANDIDATE SCOPE
        ↓
SEMANTIC VALIDATION
        ↓
ExplanationDraftGenerator
        ↓
ExplanationProposition
        ↓
ExplanationEvidenceFacet(s)
        ↓
ExplanationContentBlock / Relation
        ↓
ExplanationRenderer
```

No write path to source/canonical/validation exists in T3-01.

---

# 2. Facet builder

New conceptual component:

```text
ExplanationFacetBuilder
```

It binds each material property/fact to its own:

```text
claim refs
provenance refs
evidence refs
epistemic state
perspective
confidence
finding/question refs
```

A proposition may group several facets for readability.

---

# 3. Proposition builder

`ExplanationPropositionBuilder` forms rhetorical statements from compatible facets.

It may not replace facet-level state with a proposition-wide truth badge.

Mixed-state proposition example:

```text
"Brainst" [SOURCE_STATED]
interpreted as brainstorm [INFERRED]
```

---

# 4. Renderer

The renderer consumes semantic propositions/facets.

For material mixed-state content it must preserve an inspectable distinction between facets.

Renderer version/locale/detail changes remain derivative presentation history.

---

# 5. Scope-aware structure

All v0.1 scope/structure behavior remains:

```text
process flow
collaboration
functional model
architecture scope
policy/procedure
source review
```

Non-workflow scopes are not linearized into workflow steps.

---

# 6. Validation and review compatibility

Drafts remain pinned to explicit semantic/assessment context and compatible with:

```text
ReviewWorkspaceRevision
ReviewProjectionRevision
```

Textual and visual review may render differently but must share compatible baseline semantics.

---

# 7. Evidence navigation

Required reverse chain:

```text
rendered phrase
→ proposition
→ facet
→ claim/finding/question
→ provenance
→ evidence fragment
→ source representation
→ capture
→ origin
```

---

# 8. Failure isolation

```text
renderer failure        → draft snapshot survives
one unsupported facet   → supported facets survive
missing source-only map → finding/unknown remains; no fake canonical item
new assessment          → old draft remains historical
new adapter result      → no silent draft rebase
```

---

# 9. Architecture gate

Must pass E01–E30 with property-scoped explanation state preserved.

BUILD remains closed.