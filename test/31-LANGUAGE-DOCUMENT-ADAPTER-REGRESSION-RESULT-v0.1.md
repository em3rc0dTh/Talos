# TALOS — Language / Document Adapter Regression Result v0.1

Status: **REGRESSION PASS**  
Date: **2026-08-19**

Target:

```text
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.2.md
arch/07-LANGUAGE-DOCUMENT-ADAPTER-ARCHITECTURE-v0.2.md
```

Suite:

```text
test/29-LANGUAGE-DOCUMENT-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
```

---

# Result

```text
L01–L30
30 PASS
 0 FAIL
```

BUILD remains closed.

---

# Full regression matrix

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
L28 PASS  human resolution is separate immutable history
L29 PASS  newer interpreter version remains historical
L30 PASS  Canvas review/correction lineage
```

---

# L28 regression

v0.2 now explicitly provides:

```text
LanguageAlternativeSet
        = immutable interpreter/model output
```

and separately:

```text
LanguageAlternativeDecision
        = immutable human/authority resolution
```

The decision records exact selected/rejected alternatives and may link to confirmation/claims/resulting ProcessRevision without requiring mutation of the original attempt or a Canvas-specific action.

Therefore TALOS can answer:

```text
what the source text literally said
what the interpreter proposed
what the model preferred
what an authority later accepted/rejected
what semantic revision resulted
```

without rewriting history.

---

# Conformance result

The candidate remains compatible at DESIGN/ARCH level with:

```text
Canonical Process Model v0.1           PASS
Provenance Model v0.3                  PASS
Semantic Validation v0.2               PASS
Process Source Intake v0.2             PASS
Canvas Review / Projection v0.2        PASS
Image historical-resolution discipline PASS
```

No frozen common contract required versioning.

---

# P2-04 gate recommendation

```text
LANGUAGE / DOCUMENT ADAPTER DESIGN    READY TO FREEZE v0.2
LANGUAGE / DOCUMENT ADAPTER ARCH      READY TO FREEZE v0.2
IMPLEMENTATION                         NOT AUTHORIZED
BUILD                                  CLOSED
```
