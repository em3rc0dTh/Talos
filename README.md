# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, provenance, evidence and source-specific meaning of the expression from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, not generic OCR, not generic document summarization, not an n8n clone, and not merely a diagramming product.

Its source model is intentionally heterogeneous: native TALOS Canvas, BPMN/Bizagi, images/screenshots/physical drawings/whiteboards, natural language and SOP/process documents, existing automations such as n8n, runtime observations, and later additional structured notations may all become process-expression sources.

## Governing source-agnostic principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

`source-agnostic` does not mean TALOS magically understands every source type. It means one common intake architecture plus versioned source-family adapters and one frozen semantic/provenance/validation core.

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
CANVAS REVIEW / CORRECTION WHEN NEEDED
        ↓
ONLY LATER: CAPABILITIES / AUTOMATION DESIGN / TEMPORAL
```

No adapter may bypass provenance or emit Temporal execution truth directly.

## Non-negotiable distinctions

```text
SOURCE ORIGIN                    ≠ capture event
CAPTURE EVENT                    ≠ source representation
SOURCE OCCURRENCE                ≠ canonical identity
ONE ARTIFACT                     may produce 0..N semantic scopes
CANVAS SOURCE                    ≠ canonical process model
CANVAS REVIEW PROJECTION         ≠ original source
DISPLAY OF IMPORTED MEANING      ≠ provenance ownership transfer
USER CORRECTION                  ≠ source rewrite
BPMN SOURCE MODEL                ≠ TALOS canonical model
BPMN TASK                        ≠ Temporal Activity
PIXELS / CAPTURED BYTES          ≠ perceived structure
PERCEIVED STRUCTURE              ≠ interpreted semantics
INTERPRETED SEMANTICS            ≠ confirmed business truth
TEXT SPAN                        ≠ semantic claim automatically
DOCUMENT ORDER                   ≠ process execution order automatically
IMPLEMENTED BEHAVIOR             ≠ business intent
DEFINITION CONFIGURATION         ≠ deployment observation
DEPLOYMENT OBSERVATION           ≠ runtime execution observation
RUNTIME EXECUTION                ≠ business success
MODEL PREFERENCE                 ≠ human confirmation
ADAPTER FAILURE                  ≠ source loss
UNKNOWN                          ≠ default
TRUTH CLASS                      ≠ confidence
TRUTH CLASS                      ≠ evidence perspective
SEMANTIC VALIDITY                ≠ automation readiness
VALIDATION                       ≠ repair
SOURCE EXPRESSION                ≠ Temporal execution design
```

# Phase 1 — Canonical Semantics

```text
T1-01 CANONICAL PROCESS MODEL    ✅ FROZEN v0.1
T1-02 PROVENANCE MODEL           ✅ FROZEN v0.3
T1-03 SEMANTIC VALIDATION        ✅ FROZEN v0.2

PHASE 1                          ✅ CLOSED
```

Phase 1 answers:

```text
WHAT DOES THIS SOURCE MEAN?
WHY DO WE BELIEVE THAT MEANING?
IS THE MEANING COHERENT / SUFFICIENT?
WHAT IS MISSING / CONFLICTED / NEEDS CONFIRMATION?
```

# Phase 2 — Input Understanding / Input Architecture

```text
P2-00 Common Source Intake          ✅ FROZEN v0.2
P2-01A Canvas Native Authoring      ✅ PROVEN — 20/20
P2-01B Canvas Review/Projection     ✅ PROVEN — 14/14
P2-02 BPMN Structured Adapter       ✅ DESIGN/ARCH PROVEN — 20/20
P2-03 Image/Perception Adapter      ✅ DESIGN/ARCH PROVEN — 28/28
P2-04 Language/Document Adapter     ✅ DESIGN/ARCH PROVEN — 30/30
P2-05 Existing Automation Adapter   ✅ DESIGN/ARCH PROVEN — 32/32
P2-06 Cross-Adapter Conformance     ✅ PROVEN — 24/24

PHASE 2 INPUT ARCHITECTURE          ✅ CLOSED
```

Consolidated architecture:

```text
arch/09-PHASE-2-INPUT-ARCHITECTURE-CONSOLIDATION-v0.1.md
```

Formal closure:

```text
test/39-P2-06-CROSS-ADAPTER-CONFORMANCE-GATE-CLOSURE-v0.1.md
```

## Phase-2 source families

```text
TALOS Canvas            NATIVE_STRUCTURED
BPMN                     STRUCTURED_PARSE
Image / Photo            VISUAL_PERCEPTION
Language / Document      TEXT_INTERPRETATION
Existing Automation      AUTOMATION_PARSE
```

They are not made equivalent by pretending their evidence is the same. They are made interoperable by preserving source-specific evidence while converging on one Canonical + Provenance + Semantic Validation core.

## Canvas has two proven roles

```text
ROLE 1 — Native process authoring
"Create my process here."

ROLE 2 — Imported-source review/correction
"Show me what you understood and let me correct it."
```

For Role 2, Canvas is a projection/read surface. Reviewer corrections become new TALOS-native evidence and later ProcessRevision lineage; the imported source remains immutable and traceable.

## Existing automation law

For n8n/provider-style automation sources, TALOS now explicitly separates:

```text
AutomationDefinitionSnapshot
        ≠
AutomationDeploymentObservation
        ≠
RuntimeObservation
        ≠
Business Intent
        ≠
Future TALOS execution design
```

Existing automation is evidence of implementation, not authority over future business/process design.

## Cross-adapter law

All proven source families obey:

```text
PRESERVE BEFORE INTERPRET
SOURCE IDENTITY              ≠ CANONICAL IDENTITY
ONE SOURCE                   may yield 0..N semantic scopes
UNKNOWN/PARTIAL              remains valid evidence
SOURCE-SPECIFIC SEMANTICS    remain source-specific
NEW ADAPTER/MODEL VERSION    ≠ mutation of old interpretation
HUMAN CONFIRMATION           ≠ mutation of old inference
CANVAS DISPLAY               ≠ provenance transfer
NO ADAPTER                   may emit Temporal directly
```

# Source-family support wording

Phase-2 closure proves **design/architecture conformance**.

It does not yet mean:

```text
Canvas implementation complete
BPMN parser complete
image/OCR pipeline complete
document/LLM pipeline complete
n8n adapter complete
production source support
```

A concrete adapter becomes implementation-supported only after BUILD and executable conformance tests.

# Build policy

```text
BUILD = CLOSED
```

Phase-2 design/architecture closure does **not** open implementation automatically.

The next gate is:

```text
plan/04-REFERENCE-BUILD-OPENING-REVIEW-v0.1.md
```

Its job is to re-read the earlier reference implementation plan against the complete frozen Phase-2 architecture and decide whether the plan is still valid or requires a new version before BUILD is explicitly authorized.

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.11.md
plan/04-REFERENCE-BUILD-OPENING-REVIEW-v0.1.md
```

## Current authoritative state

```text
PHASE 1                         ✅ CLOSED
PHASE 2 INPUT ARCHITECTURE      ✅ CLOSED
BUILD OPENING REVIEW            🟢 NEXT
BUILD                           ⛔ CLOSED
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves source truth before interpretation, uses versioned adapters to recover only the meaning each source family can support, normalizes that meaning without erasing origin, validates what is known or missing, enables provenance-safe human review/correction, and only then permits capability and Temporal execution design.
