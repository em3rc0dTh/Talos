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
CANVAS REVIEW PROJECTION         ≠ original source
DISPLAY OF IMPORTED MEANING      ≠ provenance ownership transfer
PRESENTATION EDIT                ≠ semantic edit
USER CORRECTION                  ≠ source rewrite
ADAPTER REINTERPRETATION         ≠ automatic review rebase
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
```

Mining evidence:

```text
Q01–Q12 FIRST BATCH COMPLETE
```

# Phase 2 — Input Understanding

Phase 2 is **not yet a BUILD phase**.

Its job is to pressure-test the common intake architecture against fundamentally different ways real process knowledge enters TALOS.

## Current path

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

## Current authoritative state

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

Evidence:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
test/14-T2-01-CANVAS-ADAPTER-REGRESSION-RESULT-v0.1.md
20 / 20 PASS
```

## ROLE 2 — Imported-process review/correction

```text
"Show me what you understood from my source and let me correct it."
```

In this role Canvas is a projection/read surface, not the original source.

Read path:

```text
EXTERNAL SOURCE
      ↓
SOURCE EVIDENCE / CLAIMS
      ↓
PROCESS REVISION
      ↓
REVIEW WORKSPACE REVISION
      ↓
CANVAS REVIEW PROJECTION
```

Semantic correction follows a separate write/evidence path:

```text
REVIEW ACTION
      ↓
REVIEW-AUTHORED SOURCE REVISION
      ↓
NEW CLAIM / CONFIRMATION / RESOLUTION
      ↓
NEW PROCESS REVISION
      ↓
NEW VALIDATION ASSESSMENT
      ↓
BASELINE TRANSITION CANDIDATE
      ↓
RECONCILIATION + DECISION
      ↓
NEW REVIEW WORKSPACE REVISION
      ↓
NEW PROJECTION
```

Original imported evidence remains immutable and traceable.

Pressure-test history:

```text
v0.1 → R01–R14 → 12 PASS / 2 FAIL
```

The failures exposed mutable review-baseline history. v0.2 added:

```text
ReviewWorkspaceDefinition
ReviewWorkspaceRevision
BaselineTransitionCandidate
BaselineReconciliationAnalysis
BaselineTransitionDecision
```

Full regression:

```text
test/20-CANVAS-REVIEW-PROJECTION-REGRESSION-RESULT-v0.1.md
14 / 14 PASS
```

Frozen:

```text
design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.2.md
arch/04-CANVAS-REVIEW-PROJECTION-ARCHITECTURE-v0.1.md
design/09-CANVAS-REVIEW-PROJECTION-v0.2-FREEZE-DECLARATION.md
```

Gate closure:

```text
test/21-P2-01B-CANVAS-REVIEW-PROJECTION-GATE-CLOSURE-v0.1.md
```

# Phase-2 source families

The input architecture must survive these fundamentally different evidence families before BUILD:

```text
TALOS Canvas            NATIVE_STRUCTURED        ✅ authoring + review proven
BPMN                     STRUCTURED_PARSE         🟡 next
Image / Photo            VISUAL_PERCEPTION        ⚪ pending
Language / Document      TEXT_INTERPRETATION      ⚪ pending
Existing Automation      AUTOMATION_PARSE         ⚪ pending
```

For existing automation, implemented behavior is evidence with perspective `IMPLEMENTED_BEHAVIOR`; it is not automatically business intent.

# Current gate — BPMN structured input

P2-02 asks:

> Can an external structured notation with exact native IDs and rich notation semantics enter the same TALOS intake architecture without becoming the canonical model, losing BPMN-specific truth, or bypassing provenance and semantic validation?

The BPMN proof must challenge at minimum:

```text
native BPMN IDs
process/collaboration scope
participants vs lanes
message flow vs sequence flow
gateway/event subtypes
boundary events
interrupting/non-interrupting behavior
subprocess/call activity distinctions
data associations
conditions
extension/vendor metadata
DI/layout vs semantics
unsupported/unknown constructs
invalid/incomplete BPMN
0..N candidate semantic scopes
```

No BPMN → Temporal shortcut is allowed.

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

Then TALOS may reactivate the reference Canvas adapter implementation plan and build against architecture already challenged by heterogeneous sources.

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.6.md
plan/03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.2.md
```

## Immediate next move

```text
P2-02 — BPMN STRUCTURED ADAPTER
```

Design and pressure-test the first external structured semantic source family.

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves the source before interpretation, uses versioned adapters to recover the meaning each source family can actually support, normalizes that meaning without erasing origin, validates what is known or missing, allows provenance-safe human review/correction, and only then permits automation and Temporal execution design.
