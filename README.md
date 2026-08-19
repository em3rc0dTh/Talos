# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, provenance, evidence and source-specific meaning of the expression from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, not generic OCR, not generic document summarization, not an n8n clone, and not merely a diagramming product.

## Governing source-agnostic principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

`source-agnostic` does not mean TALOS magically understands every source type. It means one preserved-source intake architecture, versioned source-family adapters, and one semantic/provenance/validation core.

## Universal semantic path

```text
REAL PROCESS EXPRESSION
        ↓
PRESERVE SOURCE ORIGIN / CAPTURE / REPRESENTATION
        ↓
VERSIONED ADAPTER
        ↓
SOURCE-SPECIFIC EVIDENCE / CLAIMS
        ↓
0..N CANDIDATE SEMANTIC SCOPES
        ↓
CANONICAL MODEL WHERE SAFE
        ↓
PROVENANCE
        ↓
SEMANTIC VALIDATION
        ↓
HUMAN-READABLE EXPLANATION
        ↓
VISUAL REVIEW / CORRECTION
        ↓
ACCEPTED SEMANTIC REVISION
        ↓
LATER: CAPABILITY + EXECUTION DESIGN
```

No adapter may bypass provenance or emit Temporal execution truth directly.

## Non-negotiable distinctions

```text
SOURCE ORIGIN                    ≠ capture event
CAPTURE EVENT                    ≠ source representation
SOURCE OCCURRENCE                ≠ canonical identity
ONE ARTIFACT                     may produce 0..N semantic scopes
CANVAS REVIEW PROJECTION         ≠ original source
USER CORRECTION                  ≠ source rewrite
BPMN TASK                        ≠ Temporal Activity
PIXELS                           ≠ perceived structure
PERCEIVED STRUCTURE              ≠ interpreted semantics
TEXT SPAN                        ≠ semantic claim automatically
DOCUMENT ORDER                   ≠ process execution order
IMPLEMENTED BEHAVIOR             ≠ business intent
DEFINITION CONFIGURATION         ≠ deployment observation
DEPLOYMENT OBSERVATION           ≠ runtime execution
RUNTIME EXECUTION                ≠ business success
DERIVED EXPLANATION              ≠ source
RENDERED TEXT                    ≠ new semantic truth
PROPOSITION                      may contain multiple evidence facets
TRUTH CLASS                      ≠ confidence
TRUTH CLASS                      ≠ evidence perspective
SEMANTIC VALIDITY                ≠ automation readiness
SOURCE EXPRESSION                ≠ Temporal execution design
```

# Phase 1 — Canonical Semantics

```text
T1-01 Canonical Process Model       ✅ FROZEN v0.1
T1-02 Provenance Model              ✅ FROZEN v0.3
T1-03 Semantic Validation           ✅ FROZEN v0.2
PHASE 1                             ✅ CLOSED
```

Phase 1 answers:

```text
WHAT DOES THIS MEAN?
WHY DO WE BELIEVE IT?
IS IT COHERENT / SUFFICIENT?
WHAT IS MISSING / CONFLICTED / NEEDS CONFIRMATION?
```

# Phase 2 — Input Understanding

```text
P2-00 Common Source Intake          ✅ FROZEN v0.2
P2-01A Canvas Native Authoring      ✅ 20/20
P2-01B Canvas Review/Projection     ✅ 14/14
P2-02 BPMN Structured Adapter       ✅ 20/20
P2-03 Image/Perception Adapter      ✅ 28/28
P2-04 Language/Document Adapter     ✅ 30/30
P2-05 Existing Automation Adapter   ✅ 32/32
P2-06 Cross-Adapter Conformance     ✅ 24/24
PHASE 2                             ✅ CLOSED
```

Consolidated architecture:

```text
arch/09-PHASE-2-INPUT-ARCHITECTURE-CONSOLIDATION-v0.1.md
```

TALOS now has one design/architecture path for:

```text
Canvas       native structured expression
BPMN         external structured notation
Image        spatial/perceptual expression
Language     linguistic/distributed expression
Automation   implemented-behavior expression
```

This is architecture proof, not production adapter implementation.

# Build-opening review

Phase-2 closure did not automatically authorize BUILD.

The post-closure review found two issues:

```text
1. the old Canvas implementation plan predates the complete Phase-2 architecture;
2. immediate BUILD would skip the still-open Explanation/Review, Capability and Temporal Execution design gates from the earlier master roadmap.
```

Formal decision:

```text
BUILD OPENING REVIEW        ✅ CLOSED
DECISION                    ❌ NO-GO
BUILD                       ⛔ CLOSED
```

Evidence:

```text
test/40-REFERENCE-BUILD-OPENING-REVIEW-RESULT-v0.1.md
```

The old implementation plan is preserved as historical/future planning evidence; it is not BUILD authorization.

# Phase 3 — Explanation & Review

Phase 3 answers:

> **How does TALOS show a human what it understood, what remains uncertain/conflicted, why it believes each statement, and what must be confirmed/corrected before a semantic revision is accepted?**

## T3-01 — Human-readable Workflow Draft

```text
✅ FROZEN v0.2
30 / 30 E-fixtures PASS
```

Initial pressure test:

```text
29 PASS / 1 FAIL
```

E10 exposed a subtle explanation problem: one human sentence can combine properties with different truth/confidence/perspective states.

v0.2 introduced:

```text
ExplanationEvidenceFacet
```

so a proposition such as:

```text
The box contains "Brainst" [SOURCE_STATED],
which TALOS interprets as "brainstorm" [INFERRED].
```

can remain readable without flattening provenance.

Frozen:

```text
design/20-HUMAN-READABLE-WORKFLOW-DRAFT-CONTRACT-v0.2.md
arch/10-HUMAN-READABLE-WORKFLOW-DRAFT-ARCHITECTURE-v0.2.md
design/21-HUMAN-READABLE-WORKFLOW-DRAFT-v0.2-FREEZE-DECLARATION.md
```

## T3-02 — Visual Review Workspace Product Contract

```text
🟢 NEXT
```

Build on P2-01B and define how the user sees the same semantic baseline visually:

```text
canonical meaning
source-only evidence
truth/confidence/perspective
uncertainty
conflicts
validation findings
clarification questions
source/provenance navigation
review actions
baseline/version state
```

The Canvas remains a projection/review surface, not provenance owner.

## T3-03 — Correction / Confirmation / Freeze

```text
⚪ PENDING
```

# Later phases

```text
PHASE 4 — CAPABILITY MODEL          ⚪ PENDING
PHASE 5 — TEMPORAL EXECUTION MODEL  ⚪ PENDING
PHASE 6 — END-TO-END VERTICAL SLICE ⚪ PENDING
BUILD                               ⛔ CLOSED
```

Before eventual BUILD, the implementation plan will be reconciled again against frozen Phases 1–5 and will require a new explicit BUILD authorization.

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.13.md
plan/05-PHASE-3-EXPLANATION-REVIEW-GATE-v0.1.md
```

## Immediate next move

```text
T3-02 — VISUAL REVIEW WORKSPACE PRODUCT CONTRACT
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves source truth before interpretation, recovers only supportable meaning through versioned adapters, normalizes without erasing origin, validates uncertainty/conflict, explains that meaning to humans with provenance-safe evidence, allows controlled review/correction, and only later permits capability and durable execution design.