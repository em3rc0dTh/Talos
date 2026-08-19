# TALOS — Gated Roadmap v0.9

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.8.md`  
Historical v0.1–v0.8 remain preserved.

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

## P2-04 — Language / Document Adapter

```text
✅ DESIGN / ARCH PROVEN v0.2
30 / 30 L-fixtures PASS
```

Initial pressure test:

```text
29 PASS / 1 FAIL
```

L28 exposed missing first-class historical resolution of language alternatives.

v0.2 established:

```text
LanguageAlternativeSet
  = immutable interpreter/model output

LanguageAlternativeDecision
  = immutable later human/authority resolution
```

Frozen:

```text
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.2.md
arch/07-LANGUAGE-DOCUMENT-ADAPTER-ARCHITECTURE-v0.2.md
design/15-LANGUAGE-DOCUMENT-ADAPTER-v0.2-FREEZE-DECLARATION.md
```

Gate evidence:

```text
test/31-LANGUAGE-DOCUMENT-ADAPTER-REGRESSION-RESULT-v0.1.md
test/32-P2-04-LANGUAGE-DOCUMENT-ADAPTER-GATE-CLOSURE-v0.1.md
```

Important:

```text
LANGUAGE/DOCUMENT DESIGN/ARCH PROVEN   ✅
PDF/DOCX/LLM IMPLEMENTED               ❌
LANGUAGE SOURCE FAMILY SUPPORTED       ❌ NOT CLAIMED YET
```

---

## P2-05 — Existing Automation Adapter

**Status: NEXT — DESIGN / PRESSURE TEST**

Initial reference source:

```text
n8n
```

Source family:

```text
EXISTING EXECUTABLE / AUTOMATION DEFINITION
```

Extraction mode:

```text
AUTOMATION_PARSE
```

Default evidence perspective:

```text
IMPLEMENTED_BEHAVIOR
```

Primary gate question:

> Can TALOS ingest an existing executable automation as evidence of implemented behavior, preserve provider/runtime-specific structure and configuration, infer only supportable business semantics, and prevent existing technical implementation from being promoted into business intent or future execution design automatically?

Must pressure-test at minimum:

```text
workflow definition bytes/config vs canonical process
provider node ≠ business Activity automatically
node label ≠ business meaning automatically
implemented behavior ≠ business intent
technical routing ≠ business decision automatically
technical retry ≠ business loop/policy
error handler ≠ business exception automatically
credentials/secrets ≠ canonical process data
provider IDs ≠ canonical identities
trigger/webhook schedule ≠ business trigger intent automatically
sub-workflow/call node ≠ canonical subprocess automatically
merge/split nodes ≠ semantic join/split without context
expressions/templates ≠ business rules automatically
API endpoint/provider binding ≠ capability contract automatically
inactive/disabled node semantics
sticky notes/editor metadata ≠ process semantics
version/history/export metadata
partial/unsupported node types
external referenced workflow unavailable
0..N candidate semantic scopes
Canvas review/correction lineage
```

No existing automation may emit Temporal design directly.

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
Language / Document Adapter     ✅
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
P2-05 — EXISTING AUTOMATION ADAPTER
```

Evidence shape changes again:

```text
BPMN        → source-defined structured semantics
IMAGE       → spatial/perceptual semantics
LANGUAGE    → linguistic/distributed semantics
AUTOMATION  → executable implemented behavior
```

The goal is not to clone n8n into TALOS.

The goal is to recover **what the automation actually implements**, preserve its technical/runtime truth, and separate that from business intent and future TALOS execution design.
