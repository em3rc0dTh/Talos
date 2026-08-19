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
SEMANTIC FREEZE / AUTOMATION-DESIGN HANDOFF WHEN ELIGIBLE
        ↓
LATER: CAPABILITY DESIGN
        ↓
LATER: TEMPORAL EXECUTION DESIGN
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
ONE VISIBLE REVIEW ITEM          may contain multiple evidence states
SCOPE SWITCH                     ≠ semantic revision
REVIEW ACTION                    ≠ source rewrite
STALE REVIEW COMMAND             ≠ safe write
SEMANTIC FREEZE                  ≠ ProcessRevision mutation
BUSINESS SEMANTIC FREEZE         ≠ automation readiness
AUTOMATION DESIGN HANDOFF        requires READY_FOR_AUTOMATION_DESIGN
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

Consolidation:

```text
arch/09-PHASE-2-INPUT-ARCHITECTURE-CONSOLIDATION-v0.1.md
```

TALOS now has one architecture path for native Canvas, BPMN, images, language/documents and existing automation while preserving each source family's evidence differences.

This is architecture proof, not production adapter implementation.

# Build-opening review

Phase-2 closure did not authorize BUILD.

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

The NO-GO restored the architecture-first sequence:

```text
Phase 3 Explanation & Review
→ Phase 4 Capability Model
→ Phase 5 Temporal Execution Model
→ explicit vertical-slice BUILD review
```

# Phase 3 — Explanation & Review

Phase 3 answers:

> **How does TALOS show a human what it understood, preserve evidence/uncertainty/conflict in that explanation, allow explicit correction/confirmation without rewriting history, and freeze reviewed semantic scopes safely?**

## T3-01 — Human-readable Workflow Draft

```text
✅ FROZEN v0.2
30 / 30 PASS
```

Key structure:

```text
ExplanationEvidenceFacet
```

One readable proposition may contain multiple property-level epistemic states without flattening Provenance.

## T3-02 — Visual Review Workspace

```text
✅ FROZEN v0.2
32 / 32 PASS
```

Initial result:

```text
31 PASS / 1 FAIL
```

W30 exposed that one review workspace may contain multiple semantic scopes, each with its own explanation/assessment/visual grammar.

v0.2 introduced:

```text
ReviewBaselineBundle
ReviewScopeSurfaceBinding
scope-aware ExplanationFacetVisualBinding
```

Core visual-review law:

```text
TEXT DRAFT
CANVAS
EVIDENCE
FINDINGS / QUESTIONS
HISTORY / COMPARE
```

must all resolve from one pinned review baseline rather than independent `latest` state.

## T3-03 — Correction / Confirmation / Freeze

```text
✅ FROZEN v0.2
36 / 36 PASS
```

Initial result:

```text
35 PASS / 1 FAIL
```

H34 exposed that a multi-scope freeze intent cannot be safely reconstructed from unrelated singular-scope commands.

v0.2 introduced:

```text
ReviewCommand.targetSemanticScopeRefs[]
FreezeRequestPayload
ScopeFreezeRequest
SemanticFreezeApplication
ScopeFreezeOutcome
```

Core correction/freeze law:

```text
explicit review action
→ new review-authored evidence
→ new ProcessRevision when meaning changes
→ new ValidationAssessment
→ explicit baseline transition
→ SemanticFreezeRecord / ScopeFreezeRecord
```

Old source, interpretation, revision and validation history remain immutable.

For:

```text
AUTOMATION_DESIGN_HANDOFF
```

an accepted scope must already have:

```text
assessmentIntent = AUTOMATION_DESIGN_READINESS
executionReadiness = READY_FOR_AUTOMATION_DESIGN
```

Phase 3 cannot manufacture readiness.

## Phase-3 consolidation

```text
arch/13-PHASE-3-EXPLANATION-REVIEW-CONSOLIDATION-v0.1.md
plan/05-PHASE-3-EXPLANATION-REVIEW-GATE-v0.2.md
```

```text
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
```

# Phase 4 — Capability Model

```text
T4-01 Capability Contract           🟢 NEXT
T4-02 Forms / Human Interaction     ⚪ PENDING
T4-03 Integration Binding Model     ⚪ PENDING
PHASE 4                             🟡 OPEN / NEXT
```

Phase-4 governing question:

> **Given an accepted semantic scope, what capability does the process require from the world, and how does TALOS represent that requirement independently from any concrete provider, credential, API, n8n node, UI widget or Temporal Activity?**

Required distinction:

```text
BUSINESS ACTION / HUMAN INTERACTION
        ≠
CAPABILITY REQUIREMENT
        ≠
CAPABILITY OFFERING / IMPLEMENTATION
        ≠
PROVIDER BINDING
        ≠
CREDENTIAL / SECRET
        ≠
TEMPORAL ACTIVITY
```

# Later phases

```text
PHASE 5 — TEMPORAL EXECUTION MODEL  ⚪ PENDING
PHASE 6 — END-TO-END VERTICAL SLICE ⚪ PENDING
BUILD                               ⛔ CLOSED
```

Before eventual BUILD, the implementation plan will be reconciled again against frozen Phases 1–5 and will require a new explicit BUILD authorization.

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.14.md
plan/05-PHASE-3-EXPLANATION-REVIEW-GATE-v0.2.md
```

## Immediate next move

```text
T4-01 — CAPABILITY CONTRACT
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves source truth before interpretation, recovers only supportable meaning through versioned adapters, normalizes without erasing origin, validates uncertainty/conflict, explains that meaning to humans with provenance-safe evidence, allows immutable review/correction/freeze, and only then permits capability design followed by durable execution design.