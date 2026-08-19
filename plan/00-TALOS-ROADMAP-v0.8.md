# TALOS — Gated Roadmap v0.8

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.7.md`  
Historical v0.1–v0.7 remain preserved.

## Governing principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

Phase 2 remains **INPUT UNDERSTANDING**. BUILD stays closed.

---

# PHASE 1 — CANONICAL SEMANTICS

```text
T1-01 Canonical Process Model   ✅ FROZEN v0.1
T1-02 Provenance Model          ✅ FROZEN v0.3
T1-03 Semantic Validation       ✅ FROZEN v0.2
PHASE 1                         ✅ CLOSED
```

---

# PHASE 2 — INPUT UNDERSTANDING

## P2-00 — Common Source Intake

```text
✅ FROZEN v0.2
```

## P2-01A — Canvas Native Authoring

```text
✅ PROVEN / FROZEN
20 / 20 C-fixtures PASS
```

## P2-01B — Canvas Review / Projection

```text
✅ PROVEN / FROZEN v0.2
14 / 14 R-fixtures PASS
```

## P2-02 — BPMN Structured Adapter

```text
✅ DESIGN / ARCH PROVEN v0.1
20 / 20 B-fixtures PASS
```

## P2-03 — Image / Perception Adapter

```text
✅ DESIGN / ARCH PROVEN v0.2
28 / 28 I-fixtures PASS
```

Initial pressure test:

```text
27 PASS / 1 FAIL
```

I27 exposed mutable perception-resolution history.

v0.2 established:

```text
PerceptionAlternativeSet       = immutable model/attempt output
PerceptionAlternativeDecision  = immutable later human/authority resolution
```

Frozen:

```text
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.2.md
arch/06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.2.md
design/13-IMAGE-PERCEPTION-ADAPTER-v0.2-FREEZE-DECLARATION.md
```

Gate evidence:

```text
test/27-IMAGE-PERCEPTION-ADAPTER-REGRESSION-RESULT-v0.1.md
test/28-P2-03-IMAGE-PERCEPTION-ADAPTER-GATE-CLOSURE-v0.1.md
```

Important:

```text
IMAGE DESIGN/ARCH PROVEN      ✅
VISION/OCR IMPLEMENTED        ❌
IMAGE SOURCE FAMILY SUPPORTED ❌ NOT CLAIMED YET
```

---

## P2-04 — Language / Document Adapter

**Status: NEXT — DESIGN / PRESSURE TEST**

Source family:

```text
NATURAL LANGUAGE / PROCESS DOCUMENT
```

Examples:

```text
free-form user description
SOP
policy/procedure document
process manual
meeting notes
structured prose
mixed narrative + tables/checklists
```

Extraction mode:

```text
TEXT_INTERPRETATION
```

Primary gate question:

> Can TALOS receive process knowledge expressed in prose/documents where graph structure, actors, conditions, order, scope and completion may be implicit or distributed across spans, while preserving exact textual evidence and preventing language-model interpretation from becoming source truth automatically?

Must pressure-test at minimum:

```text
source document vs extracted text
page/section/paragraph/span addressability
literal text vs interpreted meaning
implicit order vs explicit order
actor pronouns / unresolved referents
modal language: must/should/may
conditions/exceptions embedded in prose
business rule vs descriptive statement
one paragraph → multiple claims
one claim → evidence from multiple spans
headings/list hierarchy vs control flow
checklist ≠ strict sequence automatically
table row/column semantics
cross-reference / "see section" handling
missing process boundary
multiple processes in one document
policy context vs executable process
negative statements / prohibitions
examples vs normative requirements
version/revision metadata
partial extraction / unsupported embedded content
new interpreter/model version history
Canvas review/correction lineage
```

No LLM interpretation may be promoted automatically to source-confirmed truth.

---

## P2-05 — Existing Automation Adapter

Status: **PENDING**

Initial reference source:

```text
n8n
```

Extraction mode:

```text
AUTOMATION_PARSE
```

Default evidence perspective:

```text
IMPLEMENTED_BEHAVIOR
```

---

## P2-06 — Cross-Adapter Conformance

Status: **PENDING**

Shared suite across:

```text
Canvas Native
Canvas Review / Projection
BPMN
Image / Perception
Language / Document
Existing Automation
```

---

# Phase-2 design/architecture closure requirements

```text
Common Source Intake            ✅
Canvas Native Authoring         ✅
Canvas Review / Projection      ✅
BPMN Structured Adapter         ✅
Image / Perception Adapter      ✅
Language / Document Adapter     ⚪
Existing Automation Adapter     ⚪
Cross-Adapter Conformance       ⚪
```

Current:

```text
PHASE 2 INPUT ARCHITECTURE      🟡 OPEN
BUILD                           ⛔ CLOSED
```

---

# Immediate next move

```text
P2-04 — LANGUAGE / DOCUMENT ADAPTER
```

The next attack changes evidence shape again:

```text
BPMN      → explicit structured semantics
IMAGE     → spatial/perceptual semantics
TEXT      → linguistic/distributed semantics
```

The goal is not generic summarization.

The goal is to make **textual process interpretation exact-evidence-backed, ambiguity-aware, scope-aware and reviewable**.
