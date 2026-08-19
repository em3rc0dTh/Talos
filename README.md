# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, provenance, evidence and source-specific meaning of the expression from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, and not merely a diagramming product.

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
PRESENTATION EDIT                ≠ semantic edit
USER CORRECTION                  ≠ source rewrite
ADAPTER REINTERPRETATION         ≠ automatic review rebase
BPMN SOURCE MODEL                ≠ TALOS CANONICAL MODEL
BPMN TASK                        ≠ Temporal Activity
BPMN PARTICIPANT                 ≠ lane
SEQUENCE FLOW                    ≠ message flow
BPMN DI                          ≠ process semantics
BPMN isExecutable                ≠ TALOS readiness
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

## Current authoritative state

```text
PHASE 1                         ✅ CLOSED
COMMON SOURCE INTAKE            ✅ FROZEN
CANVAS AUTHORING CONTRACT       ✅ PROVEN
CANVAS REVIEW/PROJECTION        ✅ PROVEN
BPMN ADAPTER CONTRACT           ✅ DESIGN/ARCH PROVEN
IMAGE ADAPTER CONTRACT          🟡 NEXT / NOT YET PROVEN
LANGUAGE ADAPTER CONTRACT       ⚪ NOT YET PROVEN
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

Core review lineage:

```text
EXTERNAL SOURCE
      ↓
PROCESS REVISION / PROVENANCE / VALIDATION
      ↓
REVIEW WORKSPACE REVISION
      ↓
CANVAS PROJECTION
      ↓
REVIEW-AUTHORED EVIDENCE
      ↓
NEW PROCESS REVISION
      ↓
EXPLICIT BASELINE TRANSITION
      ↓
NEW REVIEW WORKSPACE REVISION
```

# BPMN structured-source proof

P2-02 is now design/architecture proven:

```text
design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md
arch/05-BPMN-STRUCTURED-ADAPTER-ARCHITECTURE-v0.1.md
```

Pressure test:

```text
test/23-BPMN-STRUCTURED-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
20 / 20 PASS
```

Freeze / closure:

```text
design/11-BPMN-STRUCTURED-ADAPTER-v0.1-FREEZE-DECLARATION.md
test/24-P2-02-BPMN-STRUCTURED-ADAPTER-GATE-CLOSURE-v0.1.md
```

This proves the architecture can preserve:

```text
native BPMN IDs
multiple process/collaboration scopes
participants vs lanes
sequence vs message flow
gateway role context
event/boundary semantics
subprocess/call distinctions
data associations
conditions/default flows
BPMN DI separation
vendor extensions
unsupported constructs
unresolved references
partial/failed parse evidence
Canvas review provenance
```

It does **not** claim parser implementation or production BPMN support yet.

# Current gate — Image / Perception

P2-03 asks:

> Can TALOS receive a visual source where structure itself must be perceived, preserve local uncertainty and source-only evidence, and prevent perception/AI output from being laundered into source truth?

Use Mining Site evidence heavily:

```text
Q06 — non-process reference architecture
Q08 — ambiguous long connectors / event topology
Q10 — collaborative editor overlays
Q11 — physical paper + handwriting
Q12 — digital-canvas screenshot + functional/ICOM-like semantics
```

The critical image law is:

```text
PIXELS / CAPTURED BYTES
      ≠
PERCEIVED STRUCTURE
      ≠
INTERPRETED SEMANTICS
      ≠
CONFIRMED BUSINESS TRUTH
```

The goal is not perfect vision. The goal is **safe, addressable, provenance-backed and reviewable uncertainty**.

# Build policy

```text
BUILD = CLOSED BY DEFAULT
```

Remaining before BUILD:

```text
Image/Perception Adapter        ⚪
Language/Document Adapter       ⚪
Existing Automation Adapter     ⚪
Cross-Adapter Conformance       ⚪
Phase-2 Design/Architecture     ⚪ CLOSE
```

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.7.md
plan/03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.3.md
```

## Immediate next move

```text
P2-03 — IMAGE / PERCEPTION ADAPTER
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves the source before interpretation, uses versioned adapters to recover only the meaning each source family can support, normalizes that meaning without erasing origin, validates what is known or missing, allows provenance-safe human review/correction, and only then permits automation and Temporal execution design.
