# TALOS — Phase 2 Input Understanding Gate v0.1

Status: **ACTIVE PHASE-2 GOVERNING GATE**  
Date: **2026-08-19**

## Governing principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

This is now the governing rule for Phase 2.

`source-agnostic` does **not** mean TALOS already understands every source type.

It means:

```text
one common intake architecture
+ versioned source-family adapters
+ conformance to frozen Phase-1 contracts
```

No source family is considered supported merely because the common intake contract can represent it conceptually.

---

# 1. Phase 2 purpose

Phase 2 is not yet a BUILD phase.

Its current purpose is:

> Pressure-test the frozen common source-intake architecture against fundamentally different ways in which real process knowledge enters TALOS, before implementing the reference adapter.

The phase must prove that TALOS can receive both:

```text
CREATE INSIDE TALOS
```

and:

```text
IMPORT / UPLOAD / CONNECT EXTERNAL SOURCE
```

without privileging one evidence family or corrupting source origin.

---

# 2. Mandatory path

```text
PHASE 2 — INPUT UNDERSTANDING

COMMON SOURCE INTAKE            ✅ FROZEN
        ↓
CANVAS NATIVE AUTHORING         ✅ DESIGN/ARCH
        ↓
CANVAS REVIEW/PROJECTION        🟡 NEED TO PROVE
        ↓
BPMN STRUCTURED ADAPTER         ⚪ DESIGN/PRESSURE TEST
        ↓
IMAGE/PERCEPTION ADAPTER        ⚪ DESIGN/PRESSURE TEST
        ↓
LANGUAGE/DOCUMENT ADAPTER       ⚪ DESIGN/PRESSURE TEST
        ↓
EXISTING AUTOMATION ADAPTER     ⚪ DESIGN/PRESSURE TEST
        ↓
CROSS-ADAPTER CONFORMANCE       ⚪ PENDING
        ↓
PHASE 2 DESIGN/ARCH GATE        ⚪ PENDING
        ↓
ONLY THEN
        ↓
T2-01 REFERENCE BUILD
```

This order is deliberate.

The reference Canvas implementation must not be allowed to shape the common intake architecture before that architecture survives fundamentally different source families.

---

# 3. Current authoritative status

```text
PHASE 1                         ✅ CLOSED

COMMON SOURCE INTAKE            ✅ FROZEN

CANVAS AUTHORING CONTRACT       ✅ PROVEN
CANVAS REVIEW/PROJECTION        🟡 NOT YET PROVEN
BPMN ADAPTER CONTRACT           ⚪ NOT YET PROVEN
IMAGE ADAPTER CONTRACT          ⚪ NOT YET PROVEN
LANGUAGE ADAPTER CONTRACT       ⚪ NOT YET PROVEN
AUTOMATION ADAPTER CONTRACT     ⚪ NOT YET PROVEN

PHASE 2 INPUT ARCHITECTURE      🟡 OPEN

BUILD                           ⛔ CLOSED
```

This status supersedes any earlier planning statement that said T2-01 BUILD was ready for explicit opening.

The earlier implementation plan remains preserved as historical/preparatory material but is **not active authorization to build**.

---

# 4. Why these five source families

TALOS does not need to design every notation before BUILD.

It does need to pressure-test every fundamentally different evidence-acquisition family.

## A. Native structured authoring — TALOS Canvas

```text
extraction mode: NATIVE_STRUCTURED
```

Tests source creation where TALOS controls structure directly.

Already proven for native authoring.

## B. External structured semantic source — BPMN

```text
extraction mode: STRUCTURED_PARSE
```

Tests external IDs, notation semantics, participant/lane boundaries, gateway/event subtypes, message-vs-sequence relationships and source-specific extensions.

## C. Visual/perceptual source — image/photo/screenshot/whiteboard

```text
extraction mode: VISUAL_PERCEPTION
```

Tests physical origin vs capture, local confidence, ambiguous text/edges, presentation overlays, handwritten evidence and partial graph extraction.

## D. Language/document source — natural language / SOP / document

```text
extraction mode: TEXT_INTERPRETATION
```

Tests non-graph evidence, implicit ordering, ambiguous actors/rules, paragraphs spanning multiple semantic claims and source-text provenance.

## E. Existing automation — n8n first

```text
extraction mode: AUTOMATION_PARSE
perspective: IMPLEMENTED_BEHAVIOR
```

Tests the crucial boundary between what a system currently does and what the business actually intends.

Together these families challenge the common intake contract from structurally different directions.

---

# 5. Canvas has two distinct roles

## ROLE 1 — Native process authoring

```text
"Create my process here."
```

The TALOS Canvas is the source producer.

```text
CanvasRevision
→ NATIVE_STRUCTURED SourceRepresentation
→ TalosCanvasAdapter
```

This role has been pressure-tested through the Canvas authoring contracts.

## ROLE 2 — Imported-process review/correction

```text
"Show me what you understood from my source and let me correct it."
```

In this role, Canvas is **not the original source**.

Required lineage:

```text
EXTERNAL SOURCE
      ↓
SOURCE ADAPTER
      ↓
CANONICAL / CLAIM INTERPRETATION
      ↓
CANVAS REVIEW PROJECTION
      ↓
USER CORRECTION / CONFIRMATION
      ↓
NEW TALOS-AUTHORED SOURCE/CLAIM REVISION
      ↓
NEW PROCESS REVISION
```

Original external evidence must remain immutable and traceable.

This role must be proven before Phase-2 BUILD can open.

---

# 6. Adapter support definition

A source family is `SUPPORTED` only when its versioned adapter passes conformance against:

```text
Canonical Process Model v0.1
Provenance Model v0.3
Semantic Validation v0.2
Process Source Intake v0.2 (or later explicitly versioned successor)
```

Support is adapter-version-specific.

Conceptual support registry:

```text
Source family           Adapter version       Status
TALOS Canvas            ...                   PROVEN / later BUILT
BPMN                    ...                   PENDING
Image/Photo             ...                   PENDING
Language/Document       ...                   PENDING
Existing Automation     ...                   PENDING
```

No unsupported adapter may claim production semantic compatibility.

---

# 7. Cross-adapter conformance gate

After the five source-family design/pressure-test tracks, run a shared conformance suite proving at minimum:

```text
1. Source is preserved before interpretation.
2. Native/source identities never collapse into canonical IDs.
3. One source may yield 0..N semantic scopes.
4. UNKNOWN / partial / ambiguous evidence survives.
5. Source-specific relationship semantics survive.
6. Provenance remains property/relationship scoped.
7. Source truth, inference, suggestion, confirmation and evidence perspective remain distinct.
8. Adapter failure never destroys preserved source.
9. No adapter emits Temporal directly.
10. All adapters can produce inputs consumable by the same normalization/validation boundaries.
11. Imported-source Canvas projection does not replace original provenance.
12. User corrections create new lineage rather than mutating source evidence.
```

If any source family breaks the common intake contract, version the contract and rerun all previously proven adapter conformance before proceeding.

---

# 8. BUILD gate

BUILD remains closed while any of the following are incomplete:

```text
Canvas review/projection proof
BPMN adapter design/pressure test
Image/perception adapter design/pressure test
Language/document adapter design/pressure test
Existing automation adapter design/pressure test
Cross-adapter conformance
Phase-2 design/architecture closure
```

Only after all pass may the project reopen the previously drafted T2-01 reference implementation plan.

```text
BUILD = CLOSED BY DEFAULT
```

No convenience, prototype momentum or framework choice overrides this gate.

---

# 9. Immediate next move

```text
CANVAS REVIEW / PROJECTION CONTRACT
```

Pressure-test imported-source projection and user correction while preserving original provenance.

Only after that closes should Phase 2 advance to the BPMN structured adapter design.
