# TALOS — Gated Roadmap v0.7

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.6.md`  
Historical v0.1–v0.6 remain preserved.

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

Core law:

```text
DISPLAY OF IMPORTED MEANING ≠ PROVENANCE OWNERSHIP TRANSFER
USER CORRECTION             ≠ ORIGINAL SOURCE REWRITE
```

## P2-02 — BPMN Structured Adapter

```text
✅ DESIGN / ARCH PROVEN v0.1
20 / 20 B-fixtures PASS
```

Frozen:

```text
design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md
arch/05-BPMN-STRUCTURED-ADAPTER-ARCHITECTURE-v0.1.md
design/11-BPMN-STRUCTURED-ADAPTER-v0.1-FREEZE-DECLARATION.md
```

Gate evidence:

```text
test/23-BPMN-STRUCTURED-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
test/24-P2-02-BPMN-STRUCTURED-ADAPTER-GATE-CLOSURE-v0.1.md
```

Important:

```text
BPMN DESIGN/ARCH PROVEN      ✅
BPMN IMPLEMENTED             ❌
BPMN SOURCE FAMILY SUPPORTED ❌ NOT CLAIMED YET
```

---

## P2-03 — Image / Perception Adapter

**Status: NEXT — DESIGN / PRESSURE TEST**

Source family:

```text
VISUAL / PERCEPTUAL SOURCE
```

Examples:

```text
photo of paper drawing
whiteboard photo
screenshot
informal flowchart
collaborative canvas capture
functional-model screenshot
architecture diagram
```

Extraction mode:

```text
VISUAL_PERCEPTION
```

Primary gate question:

> Can TALOS receive a visual source where the source structure itself must be perceived, preserve local uncertainty and evidence fragments, discover the actual artifact/semantic scopes present, and prevent AI/perception output from becoming source truth automatically?

Must pressure-test at minimum:

```text
physical origin vs captured image
native digital origin vs screenshot
image-region evidence addressing
literal text vs interpreted text
local text confidence
node/type confidence
edge existence confidence
edge endpoint confidence
relationship-role confidence
artifact-class confidence
source-plane segmentation
editor/collaborator overlays
annotation vs process graph
same label vs same occurrence
ambiguous/dangling relationships
partial extraction
0..N candidate semantic scopes
reference architecture vs process artifact
functional model roles
handwriting
rotation/crop/derivative representations
perception model/version lineage
re-perception by a newer model
Canvas review projection of uncertain/source-only evidence
```

No OCR/vision inference may be promoted automatically to source-confirmed truth.

---

## P2-04 — Language / Document Adapter

Status: **PENDING**

## P2-05 — Existing Automation Adapter

Status: **PENDING**

## P2-06 — Cross-Adapter Conformance

Status: **PENDING**

---

# Phase-2 design/architecture closure requirements

```text
Common Source Intake            ✅
Canvas Native Authoring         ✅
Canvas Review / Projection      ✅
BPMN Structured Adapter         ✅
Image / Perception Adapter      ⚪
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
P2-03 — IMAGE / PERCEPTION ADAPTER
```

Use Mining Site Q06/Q08/Q10/Q11/Q12 especially as adversarial evidence:

```text
Q06 non-process reference architecture
Q08 ambiguous long-edge/event topology
Q10 collaborative UI overlays
Q11 physical handwritten source
Q12 digital-canvas functional model / notation-scoped geometry
```

The goal is not to make vision perfect.

The goal is to make **uncertain perception safe, addressable, provenance-backed and reviewable**.
