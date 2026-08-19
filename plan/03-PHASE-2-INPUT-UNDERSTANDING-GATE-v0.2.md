# TALOS — Phase 2 Input Understanding Gate v0.2

Status: **ACTIVE PHASE-2 GOVERNING GATE**  
Date: **2026-08-19**  
Supersedes: `03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.1.md`

## Governing principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

Phase 2 remains an input-understanding/design-architecture phase.

BUILD remains closed.

---

# 1. Mandatory path

```text
COMMON SOURCE INTAKE            ✅ FROZEN
        ↓
CANVAS NATIVE AUTHORING         ✅ PROVEN
        ↓
CANVAS REVIEW/PROJECTION        ✅ PROVEN
        ↓
BPMN STRUCTURED ADAPTER         🟡 NEXT
        ↓
IMAGE/PERCEPTION ADAPTER        ⚪ PENDING
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

---

# 2. Closed Canvas dual-role proof

Canvas now has two proven architectural roles.

## Native authoring

```text
"Create my process inside Talos."
```

Evidence:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
test/14-T2-01-CANVAS-ADAPTER-REGRESSION-RESULT-v0.1.md
20 / 20 PASS
```

## Imported-source review/correction

```text
"Show me what Talos understood from my source and let me correct it."
```

Evidence:

```text
design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.2.md
arch/04-CANVAS-REVIEW-PROJECTION-ARCHITECTURE-v0.1.md
test/20-CANVAS-REVIEW-PROJECTION-REGRESSION-RESULT-v0.1.md
14 / 14 PASS
```

Frozen law:

```text
CANVAS DISPLAY OF IMPORTED MEANING
      ≠
CANVAS OWNERSHIP OF IMPORTED PROVENANCE
```

and:

```text
USER CORRECTION
      ≠
REWRITING ORIGINAL SOURCE HISTORY
```

---

# 3. Current authoritative status

```text
PHASE 1                         ✅ CLOSED
COMMON SOURCE INTAKE            ✅ FROZEN
CANVAS AUTHORING CONTRACT       ✅ PROVEN
CANVAS REVIEW/PROJECTION        ✅ PROVEN
BPMN ADAPTER CONTRACT           🟡 NEXT / NOT YET PROVEN
IMAGE ADAPTER CONTRACT          ⚪ NOT YET PROVEN
LANGUAGE ADAPTER CONTRACT       ⚪ NOT YET PROVEN
AUTOMATION ADAPTER CONTRACT     ⚪ NOT YET PROVEN
CROSS-ADAPTER CONFORMANCE       ⚪ PENDING
PHASE 2 INPUT ARCHITECTURE      🟡 OPEN
BUILD                           ⛔ CLOSED
```

---

# 4. BPMN is the next source-family attack

BPMN is deliberately next because it is the first **external structured semantic model**.

Unlike Canvas, TALOS does not control the notation/source authoring system.

Unlike images, TALOS can usually access stable structured identities and explicit notation types.

This makes BPMN the right pressure test for the boundary between:

```text
SOURCE-NATIVE STRUCTURED SEMANTICS
        ≠
TALOS CANONICAL SEMANTICS
```

P2-02 must prove at minimum:

```text
native BPMN IDs preserved
BPMN XML/definitions preserved
process/collaboration scope discovery
participant ≠ lane
message flow ≠ sequence flow
gateway subtype preserved
event subtype preserved
boundary-event attachment preserved
interrupting/non-interrupting semantics preserved
subprocess/call activity distinctions preserved
data associations not flattened into control flow
condition expressions preserved
extension/vendor metadata preserved
DI/layout separated from semantic model
unsupported/unknown constructs retained as source-specific evidence
invalid/incomplete BPMN preserved rather than silently repaired
0..N candidate scopes supported
no direct Temporal mapping
```

---

# 5. Source family support rule

BPMN does not become `SUPPORTED` merely because TALOS can parse XML.

Its adapter must pass conformance against:

```text
Canonical Process Model v0.1
Provenance Model v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Review / Projection v0.2
```

This same rule will later apply to image, language and automation families.

---

# 6. Cross-adapter closure remains mandatory

Even after every individual family passes, Phase 2 remains open until one shared suite proves that all adapters obey the same intake laws.

If BPMN or any later family breaks a frozen common contract:

```text
version affected contract
→ rerun prior source-family regressions
→ rerun review/projection regressions if relevant
→ only then continue
```

No silent patching.

---

# 7. BUILD gate

Current:

```text
BUILD = CLOSED
```

Opening conditions remain:

```text
BPMN adapter proof                pending
Image/perception proof            pending
Language/document proof           pending
Existing automation proof         pending
Cross-adapter conformance         pending
Phase-2 design/arch closure       pending
```

The existing T2-01 implementation plan remains preparatory material only.

---

# 8. Immediate next move

```text
P2-02 — BPMN STRUCTURED ADAPTER
```

Start with DESIGN + ARCH + pressure-test fixtures.

Do not build parser/runtime code yet.
