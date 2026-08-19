# TALOS — Language / Document Adapter v0.2 Freeze Declaration

Status: **FROZEN — P2-04 DESIGN / ARCHITECTURE**  
Date: **2026-08-19**

## Frozen contract

```text
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.2.md
blob: 5713f728ba47d7587f9d0fe0398c8bc57a55832c
```

## Frozen architecture

```text
arch/07-LANGUAGE-DOCUMENT-ADAPTER-ARCHITECTURE-v0.2.md
blob: b78431c67a87a8f375fdcdcd6898970975f9c3e2
```

These exact Git blob identities are the design/architecture bytes that passed the full P2-04 regression.

---

# Evidence chain

```text
Language / Document Adapter v0.1
        ↓
L01–L30 pressure test
        ↓
29 PASS / 1 FAIL
        ↓
L28 — alternative-resolution history defect
        ↓
Language / Document Adapter v0.2
        ↓
LanguageAlternativeDecision
        ↓
full L01–L30 regression
        ↓
30 PASS / 0 FAIL
```

Evidence:

```text
test/29-LANGUAGE-DOCUMENT-ADAPTER-PRESSURE-TEST-SPEC-v0.1.md
test/30-LANGUAGE-DOCUMENT-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
test/31-LANGUAGE-DOCUMENT-ADAPTER-REGRESSION-RESULT-v0.1.md
```

---

# Frozen language/document laws

```text
TEXT SPAN                 ≠ semantic claim automatically
SEMANTIC CLAIM            ≠ process node automatically
DOCUMENT ORDER            ≠ process execution order automatically
LIST/TABLE ORDER          ≠ control flow automatically
HEADING HIERARCHY         ≠ subprocess hierarchy automatically
PRONOUN                   ≠ resolved actor automatically
MODALITY                   ≠ executable action automatically
NEGATION                   ≠ absence of semantic meaning
EXAMPLE                    ≠ normative requirement
POLICY                     ≠ procedure automatically
ONE DOCUMENT               ≠ one process
MODEL PREFERENCE           ≠ human confirmation
LANGUAGE ALTERNATIVE SET   = immutable interpreter output
AUTHORITY RESOLUTION       = separate immutable decision history
```

---

# What is frozen

The design/architecture now requires:

```text
source document vs extracted text separation
representation-scoped text anchors
distributed multi-span evidence
actor/coreference alternatives
modality and negation interpretation
explicit-vs-inferred ordering
condition/exception/override semantics
list/table source structure preservation
cross-reference resolution states
policy/procedure/example distinctions
0..N semantic scopes
mixed-content adapter routing
partial/unsafe interpretation
interpreter-version history
Canvas review/correction lineage
LanguageAlternativeDecision history
```

---

# What is not frozen/implemented

```text
LLM/provider selection
text-extraction libraries
PDF/DOCX parser implementation
accuracy benchmark
production document support
security/redaction implementation
Temporal mapping
```

No implementation support claim is made.

---

# Change policy

Do not silently edit the frozen v0.2 files.

Future evidence-forced changes require a new version and regression against L01–L30 plus Phase-2 cross-adapter conformance where applicable.

BUILD remains closed.
