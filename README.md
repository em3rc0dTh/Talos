# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, provenance, evidence and source-specific meaning of the expression from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, and not merely a diagramming product.

Its source model is intentionally heterogeneous: native TALOS Canvas, BPMN/Bizagi, images, screenshots, physical drawings, whiteboards, natural language, SOP/process documents, existing automations such as n8n, runtime observations, and later additional structured notations may all become process-expression sources.

## Governing source-agnostic principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

`source-agnostic` does not mean TALOS already understands every source type.

It means:

```text
COMMON INTAKE ARCHITECTURE
        +
VERSIONED SOURCE-FAMILY ADAPTER
        +
CANONICAL CONFORMANCE
        +
PROVENANCE CONFORMANCE
        +
SEMANTIC-VALIDATION CONFORMANCE
        =
SUPPORTED SOURCE FAMILY
```

## Universal intake law

Every source family must follow:

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
PRESENTATION EDIT                ≠ semantic edit
DANGLING RELATIONSHIP            ≠ invalid source
INCOMPLETE RELATIONSHIP          ≠ fabricated canonical edge
ADAPTER FAILURE                  ≠ source loss
UNKNOWN                          ≠ default
TRUTH CLASS                      ≠ confidence
EVIDENCE PERSPECTIVE             ≠ truth class
SEMANTIC VALIDITY                ≠ automation readiness
VALIDATION                       ≠ repair
HUMAN INTERACTION                ≠ Temporal mechanism
FUNCTIONAL DEPENDENCY            ≠ runtime sequence
IMPLEMENTED BEHAVIOR             ≠ business intent
```

# Phase 1 — Canonical Semantics

```text
T1-01 CANONICAL PROCESS MODEL    ✅ FROZEN v0.1
T1-02 PROVENANCE MODEL           ✅ FROZEN v0.3
T1-03 SEMANTIC VALIDATION        ✅ FROZEN v0.2

PHASE 1                          ✅ CLOSED
```

Phase 1 gives TALOS frozen answers to:

```text
WHAT DOES THE SOURCE MEAN?
WHY DO WE BELIEVE THAT MEANING?
IS THE MEANING COHERENT / SUFFICIENT?
WHAT IS MISSING / CONFLICTED / NEEDS CONFIRMATION?
```

Primary evidence:

```text
arch/01-CANONICAL-PROCESS-MODEL-v0.1.md
design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.3.md
design/03-SEMANTIC-VALIDATION-CONTRACT-v0.2.md

test/01-CANONICAL-PROCESS-MODEL-PRESSURE-TEST-v0.1.md
test/06-PROVENANCE-REGRESSION-RESULT-v0.1.md
test/10-SEMANTIC-VALIDATION-REGRESSION-RESULT-v0.1.md
```

Mining evidence:

```text
Q01–Q12 FIRST BATCH COMPLETE
```

# Phase 2 — Input Understanding

Phase 2 is currently **not a BUILD phase**.

Its job is to pressure-test the common intake architecture against fundamentally different ways real process knowledge enters TALOS.

## Authoritative path

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

## Current authoritative state

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

This status supersedes earlier planning that marked the T2-01 reference build as ready for opening.

The existing implementation plan remains preserved as preparatory/historical material, but it is **not active authorization to build**.

# The two Canvas roles

## ROLE 1 — Native process authoring

```text
"Create my process here."
```

The Canvas is the source producer:

```text
CanvasRevision
→ NATIVE_STRUCTURED SourceRepresentation
→ TalosCanvasAdapter
→ common intake
```

This role has been designed/pressure-tested.

## ROLE 2 — Imported-process review/correction

```text
"Show me what you understood from my source and let me correct it."
```

In this role Canvas is not the original source.

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

The original imported evidence remains immutable and traceable.

This is the immediate next proof.

# Phase-2 source families

The initial architecture must survive these fundamentally different evidence families before BUILD:

```text
TALOS Canvas            NATIVE_STRUCTURED
BPMN                     STRUCTURED_PARSE
Image / Photo            VISUAL_PERCEPTION
Language / Document      TEXT_INTERPRETATION
Existing Automation      AUTOMATION_PARSE
```

For existing automation, implemented behavior is evidence with perspective `IMPLEMENTED_BEHAVIOR`; it is not automatically business intent.

# Build policy

```text
BUILD = CLOSED BY DEFAULT
```

BUILD may open only after:

```text
Canvas Review/Projection        ✅
BPMN Adapter                    ✅
Image/Perception Adapter        ✅
Language/Document Adapter       ✅
Existing Automation Adapter     ✅
Cross-Adapter Conformance       ✅
Phase-2 Design/Architecture     ✅ CLOSED
```

Then TALOS may reopen the reference Canvas adapter implementation plan and build against architecture already challenged by heterogeneous sources.

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.5.md
plan/03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.1.md
```

## Immediate next move

```text
P2-01B — CANVAS REVIEW / PROJECTION CONTRACT
```

Design and pressure-test imported-source projection and user correction without replacing original provenance.

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves the source before interpretation, uses versioned adapters to recover the meaning each source family can actually support, normalizes that meaning without erasing origin, validates what is known or missing, and only then allows automation and Temporal execution design.
