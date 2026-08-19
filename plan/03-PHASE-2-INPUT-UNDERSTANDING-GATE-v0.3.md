# TALOS — Phase 2 Input Understanding Gate v0.3

Status: **ACTIVE PHASE-2 GOVERNING GATE**  
Date: **2026-08-19**  
Supersedes: `03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.2.md`

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
IMAGE/PERCEPTION ADAPTER        🟡 NEXT
        ↓
LANGUAGE/DOCUMENT ADAPTER       ⚪ PENDING
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

## Common intake

```text
Process Source Intake v0.2      ✅
```

## Canvas native authoring

```text
20 / 20 PASS                    ✅
```

## Canvas review/projection

```text
14 / 14 PASS                    ✅
```

## BPMN external structured source

```text
20 / 20 PASS                    ✅ DESIGN/ARCH
```

BPMN proves that an external structured semantic notation can retain its own IDs/types/extensions while entering the same TALOS semantic/provenance/validation boundary.

It does not yet mean parser implementation/support exists.

---

# Next pressure direction — visual/perception

P2-03 is intentionally different from BPMN.

With BPMN:

```text
structure is supplied explicitly
```

With images:

```text
structure itself is perceived/inferred
```

Therefore P2-03 must prove the common intake architecture can represent uncertainty at the level of:

```text
artifact class
source plane
text/literal reading
node occurrence
node type
edge existence
edge endpoint
relationship role
semantic interpretation
candidate scope
```

without collapsing those into one artifact-wide confidence value.

---

# Image family governing rule

```text
PIXELS / CAPTURED BYTES
      ≠
PERCEIVED STRUCTURE
      ≠
INTERPRETED SEMANTICS
      ≠
CONFIRMED BUSINESS TRUTH
```

Perception is a transformation/evidence operation.

It never becomes source truth merely because model confidence is high.

---

# Required adversarial evidence

Use existing Mining Site evidence heavily:

```text
Q06 — reference architecture / 0..N executable slices
Q08 — ambiguous long connectors and event semantics
Q10 — authoring/collaborator overlays
Q11 — physical paper + handwriting
Q12 — screenshot of digital canvas + functional/ICOM-like relationship roles
```

These fixtures should prevent the image adapter from degenerating into generic flowchart OCR.

---

# Remaining Phase-2 closure conditions

```text
Image/perception proof            pending
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
P2-03 — IMAGE / PERCEPTION ADAPTER
DESIGN + ARCH + PRESSURE TEST
```
