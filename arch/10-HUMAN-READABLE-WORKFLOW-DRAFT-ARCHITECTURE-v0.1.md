# TALOS — Human-Readable Workflow Draft Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T3-01 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target design:

```text
design/20-HUMAN-READABLE-WORKFLOW-DRAFT-CONTRACT-v0.1.md
```

## 1. Architecture role

T3-01 sits after semantic interpretation/validation and before human acceptance.

```text
SOURCE(S)
  ↓
ADAPTER(S)
  ↓
CLAIMS / PROVENANCE
  ↓
CANONICAL / CANDIDATE SCOPE
  ↓
SEMANTIC VALIDATION
  ↓
EXPLANATION DRAFT GENERATION
  ↓
HUMAN-READABLE RENDERING
```

It is a read/explanation architecture.

It cannot mutate source, canonical, provenance or validation history.

---

# 2. Core services

```text
ExplanationDraftGenerator
ExplanationStructureBuilder
ExplanationEvidenceIndexBuilder
ExplanationRenderer
```

All operate against immutable semantic inputs.

---

# 3. Draft generator

`ExplanationDraftGenerator` receives:

```text
primary semantic scope
ProcessRevision where available
SemanticClaim set
Provenance
one or more ValidationAssessment snapshots
source-family context
```

and emits one immutable `ExplanationDraftSnapshot`.

Scope kind determines the explanation mode.

No process-flow draft is forced for architecture/functional/policy-only scopes.

---

# 4. Structure builder

`ExplanationStructureBuilder` converts supported semantic relations into human-readable structural blocks.

Supported structures include:

```text
sequence
decision/branch
parallel region/join
wait/resume
loop
human interaction
subprocess
collaboration
outcome/completion
functional dependency
architecture context
unknown/source-only relation
```

It never derives structure from display order alone.

---

# 5. Proposition builder

Each explanatory statement is first represented as an `ExplanationProposition`.

The builder requires semantic support references before a material proposition can be emitted.

Possible support:

```text
canonical subject/property
SemanticClaim
source-only occurrence/relation
ConflictRecord
ValidationFinding
ClarificationQuestion
```

Unsupported factual wording is rejected from the semantic draft layer.

---

# 6. Rendering boundary

`ExplanationRenderer` turns propositions/blocks into prose/list presentation.

```text
semantic explanation snapshot
      ≠
locale/detail-specific rendering
```

Renderer upgrades are presentation history, not semantic revision history.

---

# 7. Review compatibility

Textual explanation and visual review share the same baseline identity.

Conceptually:

```text
ProcessRevision R
ValidationAssessment V
        ├─ ExplanationDraftSnapshot D
        └─ ReviewWorkspaceRevision W
             └─ ReviewProjectionRevision P
```

If `D` and `P` do not share compatible semantic baseline context, the product must not present them as one synchronized review state.

---

# 8. Evidence navigation

`ExplanationEvidenceIndexBuilder` creates reverse lookup from propositions/blocks to:

```text
claims
findings
provenance links
evidence fragments
source representations
```

This enables later UI evidence inspection without copying source truth into rendered prose.

---

# 9. Unknown/conflict architecture

Unknowns/conflicts remain first-class content blocks.

They may appear beside relevant process meaning and in dedicated review groups.

No placeholder canonical element is needed solely for explanation.

---

# 10. Validation integration

Validation findings/questions are read from immutable assessment snapshots.

T3-01 may group/prioritize them for human understanding but cannot mutate findings or answer questions.

---

# 11. Security boundary

The explanation layer consumes semantic/evidence references through a safe projection boundary.

Sensitive source values that are irrelevant to semantic explanation remain excluded.

Automation secrets/credentials are the primary Phase-2 regression example.

---

# 12. History boundary

New accepted semantic inputs or material reassessment create a new `ExplanationDraftSnapshot`.

Old drafts/renders remain historical.

No convenience `latestDraft` pointer becomes semantic truth.

---

# 13. Phase-3 boundaries

T3-01 does not define:

```text
Canvas interaction mechanics
review action write commands
semantic acceptance authority
capability binding
Temporal mapping
production UI
```

Those belong to T3-02/T3-03 and later phases.

---

# 14. Architecture gate

Must pass the complete T3-01 explanation pressure suite without:

```text
source laundering
uncertainty laundering
linearization of non-linear meaning
workflow-forcing non-workflow scopes
validation-as-process pollution
renderer-as-truth pollution
source-family special cores
```

BUILD remains closed.