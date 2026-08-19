# TALOS — Phase 2 Input Understanding Gate v0.4

Status: **ACTIVE PHASE-2 GOVERNING GATE**  
Date: **2026-08-19**  
Supersedes: `03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.3.md`

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
LANGUAGE/DOCUMENT ADAPTER       🟡 NEXT
        ↓
EXISTING AUTOMATION ADAPTER     ⚪ PENDING
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
```

P2-03 proved that the common intake architecture can carry uncertainty where source structure itself must be perceived.

---

# Image/perception governing laws now frozen

```text
PIXELS / CAPTURED BYTES
      ≠
PERCEIVED STRUCTURE
      ≠
INTERPRETED SEMANTICS
      ≠
CONFIRMED BUSINESS TRUTH
```

and:

```text
MODEL PREFERENCE            ≠ HUMAN CONFIRMATION
NO DETECTED CONTINUATION    ≠ PROVEN TERMINATION
VISIBLE ARROW               ≠ SEQUENCE FLOW
GEOMETRY                    ≠ UNIVERSAL SEMANTICS
NEW PERCEPTION MODEL        ≠ MUTATION OF OLD INTERPRETATION
```

Visual uncertainty is now required to be:

```text
local
addressable
property-scoped
versioned
provenance-backed
reviewable
```

---

# Next pressure direction — language / documents

P2-04 is different again.

With BPMN:

```text
structure is explicitly encoded
```

With images:

```text
structure is perceived spatially
```

With documents/prose:

```text
process structure is distributed through language
```

Therefore P2-04 must prove uncertainty/addressability at the level of:

```text
document/page/section/paragraph/span
literal wording
actor/reference resolution
normative modality
condition/exception
ordering
rule interpretation
scope/boundary
example vs requirement
policy context vs process meaning
```

without collapsing a document into one generated flowchart.

---

# Language/document governing hypothesis

Expected law to pressure-test:

```text
TEXT SPAN
      ≠
SEMANTIC CLAIM AUTOMATICALLY
      ≠
PROCESS NODE AUTOMATICALLY
      ≠
CONTROL FLOW AUTOMATICALLY
```

And:

```text
DOCUMENT ORDER
      ≠
PROCESS EXECUTION ORDER AUTOMATICALLY
```

Talos must preserve exact textual evidence and local interpretation lineage.

---

# Remaining Phase-2 closure conditions

```text
Language/document proof           pending
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
P2-04 — LANGUAGE / DOCUMENT ADAPTER
DESIGN + ARCH + PRESSURE TEST
```
