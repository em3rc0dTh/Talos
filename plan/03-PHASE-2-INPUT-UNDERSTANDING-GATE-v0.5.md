# TALOS — Phase 2 Input Understanding Gate v0.5

Status: **ACTIVE PHASE-2 GOVERNING GATE**  
Date: **2026-08-19**  
Supersedes: `03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.4.md`

## Governing principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

---

# Current mandatory path

```text
COMMON SOURCE INTAKE            ✅ FROZEN
        ↓
CANVAS NATIVE AUTHORING         ✅ PROVEN
        ↓
CANVAS REVIEW/PROJECTION        ✅ PROVEN
        ↓
BPMN STRUCTURED ADAPTER         ✅ DESIGN/ARCH PROVEN
        ↓
IMAGE/PERCEPTION ADAPTER        ✅ DESIGN/ARCH PROVEN
        ↓
LANGUAGE/DOCUMENT ADAPTER       ✅ DESIGN/ARCH PROVEN
        ↓
EXISTING AUTOMATION ADAPTER     🟡 NEXT
        ↓
CROSS-ADAPTER CONFORMANCE       ⚪ PENDING
        ↓
PHASE 2 DESIGN/ARCH GATE        ⚪ PENDING
        ↓
ONLY THEN
        ↓
REFERENCE BUILD
```

BUILD remains closed.

---

# Closed proofs

```text
Common intake                         ✅ FROZEN v0.2
Canvas native authoring              ✅ 20/20
Canvas review/projection             ✅ 14/14
BPMN external structured source      ✅ 20/20
Image/perception source family       ✅ 28/28
Language/document source family      ✅ 30/30
```

---

# Language/document laws now frozen

```text
TEXT SPAN                 ≠ semantic claim automatically
SEMANTIC CLAIM            ≠ process node automatically
DOCUMENT ORDER            ≠ process execution order automatically
LIST/TABLE ORDER          ≠ control flow automatically
PRONOUN                   ≠ resolved actor automatically
MODALITY                   ≠ executable action automatically
NEGATION                   ≠ absence of meaning
EXAMPLE                    ≠ normative requirement
POLICY                     ≠ procedure automatically
ONE DOCUMENT               ≠ one process
MODEL PREFERENCE           ≠ human confirmation
NEW INTERPRETER VERSION    ≠ mutation of prior interpretation
```

Textual uncertainty is required to be:

```text
exact-evidence-backed
span/structure-addressable
property scoped
versioned
ambiguity aware
scope aware
reviewable
```

---

# Next pressure direction — existing automation

P2-05 is different again.

With BPMN:

```text
source explicitly models semantics
```

With images:

```text
structure must be perceived
```

With language:

```text
process meaning is distributed linguistically
```

With existing automation:

```text
source describes what software currently executes
```

Therefore P2-05 must protect the distinction:

```text
IMPLEMENTED BEHAVIOR
      ≠
BUSINESS INTENT
      ≠
FUTURE TALOS EXECUTION DESIGN
```

Provider/runtime-specific structure must remain evidence, not canonical truth automatically.

---

# Existing automation governing hypothesis

Expected laws to pressure-test:

```text
AUTOMATION NODE            ≠ BUSINESS ACTIVITY AUTOMATICALLY
TECHNICAL EDGE             ≠ BUSINESS CONTROL FLOW AUTOMATICALLY
TECHNICAL RETRY            ≠ BUSINESS LOOP AUTOMATICALLY
ERROR HANDLER              ≠ BUSINESS EXCEPTION AUTOMATICALLY
PROVIDER BINDING           ≠ CANONICAL CAPABILITY AUTOMATICALLY
CREDENTIAL / SECRET        ≠ CANONICAL PROCESS DATA
WORKFLOW EXECUTABLE        ≠ BUSINESS SEMANTICALLY COMPLETE
```

Default evidence perspective:

```text
IMPLEMENTED_BEHAVIOR
```

---

# Remaining Phase-2 closure conditions

```text
Existing automation proof         pending
Cross-adapter conformance         pending
Phase-2 design/arch closure       pending
```

Until all close:

```text
BUILD = CLOSED
```

---

# Immediate next move

```text
P2-05 — EXISTING AUTOMATION ADAPTER
DESIGN + ARCH + PRESSURE TEST
```
