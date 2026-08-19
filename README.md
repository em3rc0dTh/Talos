# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, provenance, evidence and source-specific meaning of the expression from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, not generic OCR, and not merely a diagramming product.

Its source model is intentionally heterogeneous: native TALOS Canvas, BPMN/Bizagi, images, screenshots, physical drawings, whiteboards, natural language, SOP/process documents, existing automations such as n8n, runtime observations, and later additional structured notations may all become process-expression sources.

## Governing source-agnostic principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

`source-agnostic` does not mean TALOS already understands every source type. It means one common intake architecture plus versioned source-family adapters and conformance to the frozen semantic/provenance/validation core.

## Universal intake law

```text
REAL PROCESS EXPRESSION
        ↓
RECEIVE
        ↓
PRESERVE SOURCE ORIGIN / CAPTURE / REPRESENTATION
        ↓
CLASSIFY
        ↓
VERSIONED ADAPTER ATTEMPT
        ↓
ADDRESS SOURCE EVIDENCE
        ↓
INTERPRET
        ↓
DISCOVER 0..N CANDIDATE SEMANTIC SCOPES
        ↓
NORMALIZE INTO TALOS CANONICAL MODEL
        ↓
PROVENANCE / CLAIMS
        ↓
SEMANTIC VALIDATION
        ↓
ONLY LATER: AUTOMATION DESIGN / CAPABILITIES / TEMPORAL
```

No adapter may bypass provenance or emit Temporal execution truth directly.

## Non-negotiable distinctions

```text
SOURCE ORIGIN                    ≠ capture event
CAPTURE EVENT                    ≠ source representation
PHYSICAL DRAWING                 ≠ photograph bytes
NATIVE DIGITAL CANVAS            ≠ screenshot
SOURCE OCCURRENCE                ≠ canonical identity
SOURCE INPUT                     ≠ process automatically
ONE ARTIFACT                     may produce 0..N semantic scopes
CANVAS SOURCE                    ≠ canonical process model
CANVAS REVIEW PROJECTION         ≠ original source
DISPLAY OF IMPORTED MEANING      ≠ provenance ownership transfer
USER CORRECTION                  ≠ source rewrite
ADAPTER REINTERPRETATION         ≠ automatic review rebase
BPMN SOURCE MODEL                ≠ TALOS CANONICAL MODEL
BPMN TASK                        ≠ Temporal Activity
SEQUENCE FLOW                    ≠ message flow
BPMN DI                          ≠ process semantics
PIXELS / CAPTURED BYTES          ≠ perceived structure
PERCEIVED STRUCTURE              ≠ interpreted semantics
INTERPRETED SEMANTICS            ≠ confirmed business truth
MODEL PREFERENCE                 ≠ human confirmation
VISIBLE ARROW                    ≠ sequence flow
NO DETECTED CONTINUATION         ≠ proven termination
GEOMETRY                         ≠ universal semantics
DANGLING RELATIONSHIP            ≠ invalid source
ADAPTER FAILURE                  ≠ source loss
UNKNOWN                          ≠ default
TRUTH CLASS                      ≠ confidence
EVIDENCE PERSPECTIVE             ≠ truth class
SEMANTIC VALIDITY                ≠ automation readiness
VALIDATION                       ≠ repair
IMPLEMENTED BEHAVIOR             ≠ business intent
```

# Phase 1 — Canonical Semantics

```text
T1-01 CANONICAL PROCESS MODEL    ✅ FROZEN v0.1
T1-02 PROVENANCE MODEL           ✅ FROZEN v0.3
T1-03 SEMANTIC VALIDATION        ✅ FROZEN v0.2
PHASE 1                          ✅ CLOSED
```

# Phase 2 — Input Understanding

Phase 2 is **not yet a BUILD phase**.

Current path:

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

## Current authoritative state

```text
PHASE 1                         ✅ CLOSED
COMMON SOURCE INTAKE            ✅ FROZEN
CANVAS AUTHORING CONTRACT       ✅ PROVEN
CANVAS REVIEW/PROJECTION        ✅ PROVEN
BPMN ADAPTER CONTRACT           ✅ DESIGN/ARCH PROVEN
IMAGE ADAPTER CONTRACT          ✅ DESIGN/ARCH PROVEN
LANGUAGE ADAPTER CONTRACT       🟡 NEXT / NOT YET PROVEN
AUTOMATION ADAPTER CONTRACT     ⚪ NOT YET PROVEN
CROSS-ADAPTER CONFORMANCE       ⚪ PENDING
PHASE 2 INPUT ARCHITECTURE      🟡 OPEN
BUILD                           ⛔ CLOSED
```

# Canvas dual-role proof

Native authoring:

```text
"Create my process here."
```

Evidence:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
test/14-T2-01-CANVAS-ADAPTER-REGRESSION-RESULT-v0.1.md
20 / 20 PASS
```

Imported-source review/correction:

```text
"Show me what you understood from my source and let me correct it."
```

Evidence:

```text
design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.2.md
arch/04-CANVAS-REVIEW-PROJECTION-ARCHITECTURE-v0.1.md
test/20-CANVAS-REVIEW-PROJECTION-REGRESSION-RESULT-v0.1.md
14 / 14 PASS
```

# BPMN structured-source proof

P2-02:

```text
design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md
arch/05-BPMN-STRUCTURED-ADAPTER-ARCHITECTURE-v0.1.md

test/23-BPMN-STRUCTURED-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
20 / 20 PASS
```

This is design/architecture proof, not parser implementation or production support.

# Image / Perception proof

P2-03 is now design/architecture proven.

Initial candidate:

```text
I01–I28
27 PASS / 1 FAIL
```

The failure exposed a historical-state defect:

```text
PerceptionAlternativeSet
```

could appear to change from model preference to human confirmation in place.

v0.2 now separates:

```text
PerceptionAlternativeSet
  = immutable record of what one model/attempt observed/preferred

PerceptionAlternativeDecision
  = immutable later human/authority resolution
```

Full regression:

```text
test/27-IMAGE-PERCEPTION-ADAPTER-REGRESSION-RESULT-v0.1.md
28 / 28 PASS
```

Frozen:

```text
design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.2.md
arch/06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.2.md
design/13-IMAGE-PERCEPTION-ADAPTER-v0.2-FREEZE-DECLARATION.md
```

Gate closure:

```text
test/28-P2-03-IMAGE-PERCEPTION-ADAPTER-GATE-CLOSURE-v0.1.md
```

P2-03 proves the architecture can preserve:

```text
physical origin vs photo capture
native digital source vs screenshot
local image-region evidence
crop/rotation/deskew transform lineage
literal text vs interpreted meaning
competing perception alternatives
shape/type confidence separation
edge existence/endpoint/direction/role uncertainty
out-of-frame/occlusion vs absence
editor/collaborator overlays
same label vs same occurrence
reference architecture vs process scope
functional-model / notation-dependent geometry
multiple representation identity discipline
partial perception
immutable re-perception
Canvas review of uncertain/source-only evidence
```

It does **not** claim OCR/vision implementation, accuracy benchmarks, model selection, or production image support.

# Current gate — Language / Document

P2-04 asks:

> Can TALOS receive process knowledge expressed in prose/documents where graph structure, actors, conditions, order, scope and completion may be implicit or distributed across spans, while preserving exact textual evidence and preventing language-model interpretation from becoming source truth automatically?

The next governing distinction is expected to be:

```text
TEXT SPAN
      ≠
SEMANTIC CLAIM AUTOMATICALLY
      ≠
PROCESS NODE AUTOMATICALLY
      ≠
CONTROL FLOW AUTOMATICALLY
```

and:

```text
DOCUMENT ORDER
      ≠
PROCESS EXECUTION ORDER AUTOMATICALLY
```

The goal is not generic summarization. The goal is **exact-evidence-backed, ambiguity-aware, scope-aware and reviewable process interpretation from language/documents**.

# Build policy

```text
BUILD = CLOSED BY DEFAULT
```

Remaining before BUILD:

```text
Language/Document Adapter       ⚪
Existing Automation Adapter     ⚪
Cross-Adapter Conformance       ⚪
Phase-2 Design/Architecture     ⚪ CLOSE
```

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.8.md
plan/03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.4.md
```

## Immediate next move

```text
P2-04 — LANGUAGE / DOCUMENT ADAPTER
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves the source before interpretation, uses versioned adapters to recover only the meaning each source family can support, normalizes that meaning without erasing origin, validates what is known or missing, allows provenance-safe human review/correction, and only then permits automation and Temporal execution design.
