# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, provenance, evidence and source-specific meaning of the expression from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, not generic OCR, not generic document summarization, and not merely a diagramming product.

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
VISIBLE ARROW                    ≠ sequence flow
NO DETECTED CONTINUATION         ≠ proven termination
GEOMETRY                         ≠ universal semantics
TEXT SPAN                        ≠ semantic claim automatically
SEMANTIC CLAIM                   ≠ process node automatically
DOCUMENT ORDER                   ≠ process execution order automatically
LIST / TABLE ORDER               ≠ control flow automatically
PRONOUN                          ≠ resolved actor automatically
MODALITY                         ≠ executable action automatically
EXAMPLE                          ≠ normative requirement
POLICY                           ≠ procedure automatically
MODEL PREFERENCE                 ≠ human confirmation
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
LANGUAGE/DOCUMENT ADAPTER       ✅ DESIGN/ARCH PROVEN
        ↓
EXISTING AUTOMATION ADAPTER     🟡 NEXT
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
LANGUAGE ADAPTER CONTRACT       ✅ DESIGN/ARCH PROVEN
AUTOMATION ADAPTER CONTRACT     🟡 NEXT / NOT YET PROVEN
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

```text
design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md
arch/05-BPMN-STRUCTURED-ADAPTER-ARCHITECTURE-v0.1.md
test/23-BPMN-STRUCTURED-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
20 / 20 PASS
```

This is design/architecture proof, not parser implementation or production support.

# Image / Perception proof

Initial pressure test:

```text
I01–I28
27 PASS / 1 FAIL
```

v0.2 separates:

```text
PerceptionAlternativeSet
  = immutable model/attempt output

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

# Language / Document proof

P2-04 is now design/architecture proven.

Initial pressure test:

```text
L01–L30
29 PASS / 1 FAIL
```

L28 exposed a history/addressability gap: model alternatives were immutable, but a later authority decision did not yet have a dedicated record identifying the exact selected/rejected alternatives outside Canvas-specific review flows.

v0.2 now separates:

```text
LanguageAlternativeSet
  = immutable record of what one interpreter/model proposed/preferred

LanguageAlternativeDecision
  = immutable later human/authority resolution
```

Full regression:

```text
test/31-LANGUAGE-DOCUMENT-ADAPTER-REGRESSION-RESULT-v0.1.md
30 / 30 PASS
```

Frozen:

```text
design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.2.md
arch/07-LANGUAGE-DOCUMENT-ADAPTER-ARCHITECTURE-v0.2.md
design/15-LANGUAGE-DOCUMENT-ADAPTER-v0.2-FREEZE-DECLARATION.md
```

Gate closure:

```text
test/32-P2-04-LANGUAGE-DOCUMENT-ADAPTER-GATE-CLOSURE-v0.1.md
```

P2-04 proves the architecture can preserve:

```text
source document vs extracted text
exact span/section/table evidence anchors
one paragraph → many claims
one claim → many spans
document order vs execution order
explicit ordering markers
normal path vs conditional/exception override
pronoun/coreference ambiguity
must/should/may modality
negation/prohibition
example vs requirement
definition/policy vs activity
lists/checklists without automatic sequence
tables/RACI without automatic flow
cross-reference resolution states
0..N process/policy/procedure scopes
mixed-content delegation
partial extraction
immutable interpreter/model upgrades
Canvas review/correction lineage
```

It does **not** claim PDF/DOCX/LLM implementation, extraction accuracy, production document support or Temporal execution.

# Current gate — Existing Automation

P2-05 asks:

> Can TALOS ingest an existing executable automation such as n8n as evidence of implemented behavior, preserve provider/runtime-specific structure and configuration, infer only supportable business semantics, and prevent existing technical implementation from being promoted into business intent or future execution design automatically?

The next governing distinction is:

```text
IMPLEMENTED BEHAVIOR
      ≠
BUSINESS INTENT
      ≠
FUTURE TALOS EXECUTION DESIGN
```

Expected anti-assumptions include:

```text
AUTOMATION NODE        ≠ business Activity automatically
TECHNICAL EDGE         ≠ business control flow automatically
TECHNICAL RETRY        ≠ business loop automatically
ERROR HANDLER          ≠ business exception automatically
PROVIDER BINDING       ≠ canonical capability automatically
CREDENTIAL / SECRET    ≠ canonical process data
WORKFLOW EXECUTABLE    ≠ semantically complete business process
```

The goal is not to clone n8n into TALOS. The goal is to recover **what the automation actually implements** as implementation evidence without allowing that evidence to overwrite business intent.

# Build policy

```text
BUILD = CLOSED BY DEFAULT
```

Remaining before BUILD:

```text
Existing Automation Adapter     ⚪
Cross-Adapter Conformance       ⚪
Phase-2 Design/Architecture     ⚪ CLOSE
```

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.9.md
plan/03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.5.md
```

## Immediate next move

```text
P2-05 — EXISTING AUTOMATION ADAPTER
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves the source before interpretation, uses versioned adapters to recover only the meaning each source family can support, normalizes that meaning without erasing origin, validates what is known or missing, allows provenance-safe human review/correction, and only then permits automation and Temporal execution design.
