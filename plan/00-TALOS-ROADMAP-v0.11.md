# TALOS — Gated Roadmap v0.11

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.10.md`  
Historical v0.1–v0.10 remain preserved.

## Governing principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

---

# PHASE 1 — CANONICAL SEMANTICS

```text
T1-01 Canonical Process Model       ✅ FROZEN v0.1
T1-02 Provenance Model              ✅ FROZEN v0.3
T1-03 Semantic Validation           ✅ FROZEN v0.2
PHASE 1                             ✅ CLOSED
```

---

# PHASE 2 — INPUT UNDERSTANDING / INPUT ARCHITECTURE

```text
P2-00 Common Source Intake          ✅ FROZEN v0.2
P2-01A Canvas Native Authoring      ✅ PROVEN
P2-01B Canvas Review/Projection     ✅ PROVEN v0.2
P2-02 BPMN Structured Adapter       ✅ DESIGN/ARCH PROVEN v0.1
P2-03 Image/Perception Adapter      ✅ DESIGN/ARCH PROVEN v0.2
P2-04 Language/Document Adapter     ✅ DESIGN/ARCH PROVEN v0.2
P2-05 Existing Automation Adapter   ✅ DESIGN/ARCH PROVEN v0.2
P2-06 Cross-Adapter Conformance     ✅ 24/24 PASS

PHASE 2 INPUT ARCHITECTURE          ✅ CLOSED
```

Consolidation:

```text
arch/09-PHASE-2-INPUT-ARCHITECTURE-CONSOLIDATION-v0.1.md
```

Gate closure:

```text
test/39-P2-06-CROSS-ADAPTER-CONFORMANCE-GATE-CLOSURE-v0.1.md
```

---

# What Phase 2 closed

TALOS now has one proven source-intake architecture for foundational source families:

```text
Canvas       native structured expression
BPMN         external structured notation
Image        spatial/perceptual expression
Language     linguistic/distributed expression
Automation   implemented-behavior expression
```

All converge on one:

```text
Canonical
+ Provenance
+ Semantic Validation
+ provenance-safe Canvas Review
```

without direct Temporal compilation or source-truth laundering.

---

# Source-family support wording

Phase-2 closure proves **design/architecture conformance**.

It does not yet mean:

```text
Canvas implementation complete
BPMN parser complete
Image/OCR pipeline complete
Document/LLM pipeline complete
n8n adapter complete
production source support
```

A source family becomes implementation-supported only after its concrete adapter implementation passes its executable conformance/test suite.

---

# POST-PHASE-2 GATE — Reference Build Opening Review

Status:

```text
🟢 NEXT
```

Purpose:

> Re-read the previously drafted T2-01 reference implementation plan and reconcile it against the complete frozen Phase-2 architecture before deciding whether BUILD may open.

Must verify at minimum:

```text
native Canvas source contract
Canvas review/projection dual role
common AdapterAttempt/intake boundary
adapter-family extension strategy
immutable source/interpreter history
review baseline transitions
cross-adapter conformance
source-family perspective/truth rules
automation definition/deployment/runtime separation
no framework/runtime leakage into source-domain contracts
```

Possible outcome:

```text
PLAN STILL VALID
or
PLAN REQUIRES v0.2 EVOLUTION
```

Only after that review may BUILD be explicitly opened.

---

# Current status

```text
PHASE 1                         ✅ CLOSED
PHASE 2 INPUT ARCHITECTURE      ✅ CLOSED

BUILD OPENING REVIEW            🟢 NEXT
BUILD                           ⛔ CLOSED
```

No code implementation begins from this roadmap state.
