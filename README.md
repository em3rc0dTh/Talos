# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, provenance, evidence and source-specific meaning of the expression from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, not generic OCR, not generic document summarization, not an n8n clone, and not merely a diagramming product.

## Governing source-agnostic principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

## Universal semantic path

```text
REAL PROCESS EXPRESSION
        ↓
PRESERVE SOURCE / VERSIONED ADAPTER
        ↓
SOURCE-SPECIFIC EVIDENCE / CLAIMS
        ↓
0..N SEMANTIC SCOPES
        ↓
CANONICAL + PROVENANCE + VALIDATION
        ↓
HUMAN EXPLANATION / VISUAL REVIEW
        ↓
CORRECTION / CONFIRMATION / SEMANTIC FREEZE
        ↓
CAPABILITY DESIGN
        ↓
LATER: TEMPORAL EXECUTION DESIGN
```

No adapter may bypass provenance or emit Temporal execution truth directly.

## Core distinctions

```text
SOURCE IDENTITY                    != CANONICAL IDENTITY
USER CORRECTION                    != SOURCE REWRITE
IMPLEMENTED BEHAVIOR               != BUSINESS INTENT
SEMANTIC FREEZE                    != ProcessRevision MUTATION
BUSINESS SEMANTIC FREEZE           != AUTOMATION READINESS
AUTOMATION DESIGN HANDOFF          requires READY_FOR_AUTOMATION_DESIGN

CapabilityRequirement              != CapabilityOfferingRevision
CapabilityOfferingRevision         != CapabilityMatchAssessment
CapabilityMatchAssessment          != CapabilityBinding
CapabilityBinding                  != Temporal execution mapping

CURRENT IMPLEMENTATION             != REQUIRED PROVIDER
LOGICAL BUSINESS INPUT/OUTPUT      != PROVIDER PAYLOAD
BUSINESS OUTCOME                   != TECHNICAL SUCCESS
SAFETY REQUIREMENT                 != TEMPORAL RETRY POLICY
AUTH CONTRACT                      != SECRET VALUE
OFFERING CONTRACT                  != CURRENT HEALTH
TEMPORAL ACTIVITY                  != REAL-WORLD CAPABILITY OFFERING
```

# Phase 1 — Canonical Semantics

```text
T1-01 Canonical Process Model       ✅ FROZEN v0.1
T1-02 Provenance Model              ✅ FROZEN v0.3
T1-03 Semantic Validation           ✅ FROZEN v0.2
PHASE 1                             ✅ CLOSED
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

# Build-opening review

```text
BUILD OPENING REVIEW                ✅ CLOSED
DECISION                            ❌ NO-GO
BUILD                               ⛔ CLOSED
```

The NO-GO restored the architecture-first sequence:

```text
Explanation & Review
→ Capability Model
→ Temporal Execution Model
→ explicit end-to-end BUILD review
```

# Phase 3 — Explanation & Review

```text
T3-01 Human-readable Workflow Draft      ✅ FROZEN v0.2 — 30/30
T3-02 Visual Review Workspace            ✅ FROZEN v0.2 — 32/32
T3-03 Correction/Confirmation/Freeze     ✅ FROZEN v0.2 — 36/36
PHASE 3                                  ✅ CLOSED
```

Key Phase-3 laws:

```text
one human sentence may have many evidence facets
text / Canvas / findings / evidence share one pinned review baseline
one review workspace may contain multiple semantic scopes
review actions create new immutable evidence/history
stale commands cannot overwrite newer baselines
collateral semantic changes cannot piggyback on reviewer authority
AUTOMATION_DESIGN_HANDOFF requires READY_FOR_AUTOMATION_DESIGN
```

Consolidation:

```text
arch/13-PHASE-3-EXPLANATION-REVIEW-CONSOLIDATION-v0.1.md
```

# Phase 4 — Capability Model

## T4-01 — Capability Contract

```text
✅ FROZEN v0.2
32 / 32 K-fixtures PASS
```

Initial candidate produced:

```text
31 PASS / 1 FAIL
```

K12 exposed requirement-wide design-provenance flattening. v0.2 introduced:

```text
CapabilityRequirementFacet
```

so family, operation, channel, provider suggestion, outcome and safety properties may retain different design bases/states.

Formal boundary:

```text
CapabilityRequirement
        !=
CapabilityOfferingRevision
        !=
CapabilityMatchAssessment
        !=
CapabilityBinding (T4-03)
        !=
Temporal execution mapping (Phase 5)
```

Artifacts:

```text
design/26-CAPABILITY-CONTRACT-v0.2.md
arch/14-CAPABILITY-MODEL-ARCHITECTURE-v0.2.md
design/27-CAPABILITY-CONTRACT-v0.2-FREEZE-DECLARATION.md
test/56-T4-01-CAPABILITY-CONTRACT-GATE-CLOSURE-v0.1.md
```

## T4-02 — Forms / Human Interaction

```text
🟢 NEXT
```

T4-02 asks:

> **When accepted process semantics require a person to review, approve, reject, correct, choose, sign, upload or provide information, how does TALOS describe that interaction and its information/outcome/authority contract without confusing it with a specific form renderer, task inbox, assignment engine, identity provider or Temporal mechanism?**

Required distinction:

```text
HUMAN INTERACTION SEMANTIC
        != HUMAN CAPABILITY REQUIREMENT
        != HUMAN INTERACTION DESIGN
        != FORM LOGICAL CONTRACT
        != FORM UI / RENDERER
        != USER ASSIGNMENT
        != IDENTITY PROVIDER
        != TEMPORAL SIGNAL / UPDATE / WAIT
```

## T4-03 — Integration Binding

```text
⚪ PENDING
```

# Later phases

```text
PHASE 5 — TEMPORAL EXECUTION MODEL  ⚪ PENDING
PHASE 6 — END-TO-END VERTICAL SLICE ⚪ PENDING
BUILD                               ⛔ CLOSED
```

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.15.md
```

## Immediate next move

```text
T4-02 — FORMS / HUMAN INTERACTION CAPABILITY
```

## Working definition

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.** It preserves source truth before interpretation, normalizes without erasing origin, validates uncertainty/conflict, explains and reviews semantics with humans, freezes accepted scopes, designs required capabilities independently from concrete providers, and only later designs durable execution.