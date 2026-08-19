# TALOS — Language / Document Adapter Pressure-Test Result v0.1

Status: **PRESSURE TEST EXECUTED — CONTRACT EVOLUTION REQUIRED**  
Date: **2026-08-19**

Target:

```text
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.1.md
arch/07-LANGUAGE-DOCUMENT-ADAPTER-ARCHITECTURE-v0.1.md
```

Suite:

```text
test/29-LANGUAGE-DOCUMENT-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
```

---

# Result

```text
L01–L30
29 PASS
 1 FAIL
```

Failure:

```text
L28 — human resolution of language alternatives is historical
```

BUILD remains closed.

---

# Fixture results

```text
L01 PASS  source document vs extracted text
L02 PASS  exact text-span addressability
L03 PASS  one paragraph → multiple claims
L04 PASS  one claim → multiple spans
L05 PASS  document order ≠ runtime order
L06 PASS  explicit temporal marker
L07 PASS  normal path vs urgent exception
L08 PASS  pronoun/coreference ambiguity
L09 PASS  unresolved role alias
L10 PASS  MUST modality
L11 PASS  SHOULD modality
L12 PASS  MAY modality
L13 PASS  negation/prohibition
L14 PASS  exception scope
L15 PASS  example vs requirement
L16 PASS  definition vs action
L17 PASS  ordered-list ambiguity
L18 PASS  explicitly ordered procedure list
L19 PASS  table decision semantics
L20 PASS  RACI responsibility vs flow
L21 PASS  local cross-reference
L22 PASS  unresolved external reference
L23 PASS  missing process boundary
L24 PASS  multiple processes in one manual
L25 PASS  policy-only / zero process candidate
L26 PASS  embedded diagram / adapter delegation
L27 PASS  partial extraction
L28 FAIL  human resolution of language alternatives
L29 PASS  newer interpreter version remains historical
L30 PASS  Canvas review/correction lineage
```

---

# What passed

The v0.1 design successfully protects the core language/document boundary:

```text
DOCUMENT ≠ EXTRACTED TEXT
TEXT SPAN ≠ PROCESS NODE
DOCUMENT ORDER ≠ EXECUTION ORDER
LIST/TABLE ORDER ≠ CONTROL FLOW
POLICY ≠ PROCEDURE
EXAMPLE ≠ REQUIREMENT
MODALITY ≠ ACTION
PRONOUN ≠ RESOLVED ACTOR
NEGATION ≠ NO MEANING
ONE DOCUMENT ≠ ONE PROCESS
```

It also supports exact evidence anchoring, distributed multi-span claims, partial extraction, mixed-content delegation, 0..N scopes, model-version history and Canvas review lineage.

---

# L28 failure analysis

v0.1 defines immutable:

```text
LanguageAlternativeSet
```

with model preference, and correctly forbids mutable human-selection fields.

However, it only says that later resolution should use generic review/confirmation/decision records.

That is not sufficient to guarantee a first-class, source-family-independent answer to:

```text
Which alternative set was decided?
Which exact alternative(s) were selected?
Which alternatives were rejected?
Who/what authority made the decision?
When was it made?
What claim/revision resulted?
```

A Canvas `ReviewAction` is not guaranteed to exist for API/import/other authority resolution paths, and a generic confirmation record is not guaranteed by the active language contract to preserve selected/rejected alternative IDs.

Therefore the contract has a history/addressability gap analogous to the defect previously discovered in Image / Perception.

---

# Required correction

Introduce a dedicated immutable language-alternative resolution record, for example:

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

The exact naming may be versioned in v0.2, but the invariant is mandatory:

```text
MODEL ALTERNATIVES = IMMUTABLE INTERPRETER HISTORY
HUMAN/AUTHORITY RESOLUTION = SEPARATE IMMUTABLE HISTORY
```

No frozen common contract needs reopening.

---

# Regression requirement

Create Language / Document Adapter v0.2 and rerun **all L01–L30**, not only L28.

Gate remains open until:

```text
30 PASS / 0 FAIL
```
