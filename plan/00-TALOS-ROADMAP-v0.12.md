# TALOS — Gated Roadmap v0.12

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.11.md`  
Historical roadmap versions remain preserved.

## Governing principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

And:

> **TALOS closes semantic, review, capability and execution-design gates before broad implementation.**

---

# PHASE 1 — CANONICAL SEMANTICS

```text
T1-01 Canonical Process Model       ✅ FROZEN v0.1
T1-02 Provenance Model              ✅ FROZEN v0.3
T1-03 Semantic Validation           ✅ FROZEN v0.2
PHASE 1                             ✅ CLOSED
```

---

# PHASE 2 — INPUT UNDERSTANDING / INPUT ARCHITECTURE

```text
P2-00 Common Source Intake          ✅ FROZEN v0.2
P2-01A Canvas Native Authoring      ✅ PROVEN
P2-01B Canvas Review/Projection     ✅ PROVEN v0.2
P2-02 BPMN Structured Adapter       ✅ DESIGN/ARCH PROVEN v0.1
P2-03 Image/Perception Adapter      ✅ DESIGN/ARCH PROVEN v0.2
P2-04 Language/Document Adapter     ✅ DESIGN/ARCH PROVEN v0.2
P2-05 Existing Automation Adapter   ✅ DESIGN/ARCH PROVEN v0.2
P2-06 Cross-Adapter Conformance     ✅ 24/24
PHASE 2 INPUT ARCHITECTURE          ✅ CLOSED
```

Phase-2 consolidation:

```text
arch/09-PHASE-2-INPUT-ARCHITECTURE-CONSOLIDATION-v0.1.md
```

---

# POST-PHASE-2 BUILD OPENING REVIEW

Result:

```text
BUILD OPENING REVIEW                ✅ CLOSED
DECISION                            ❌ NO-GO
BUILD                               ⛔ CLOSED
```

Evidence:

```text
test/40-REFERENCE-BUILD-OPENING-REVIEW-RESULT-v0.1.md
```

Reason:

The earlier Canvas implementation plan remains useful but predates the complete Phase-2 architecture, and immediate BUILD would skip still-open Explanation/Review, Capability and Temporal Execution design gates.

`plan/02-T2-01-CANVAS-ADAPTER-IMPLEMENTATION-PLAN-v0.1.md` remains preserved as historical/future reference planning; it is not current BUILD authorization.

---

# PHASE 3 — EXPLANATION & REVIEW

**Status: NEXT**

Phase 3 answers:

> How does TALOS present what it understood, what it did not understand, why it believes each interpretation, and what a human must confirm/correct before a semantic revision is accepted?

## T3-01 — Human-readable Workflow Draft Contract

Define the source-agnostic explanation model for:

```text
process summary
ordered/branched human-readable steps
actors/responsibilities
conditions/rules
waits/events
business objects/data
subprocess/scope
outcomes/completion
uncertainties
conflicts
validation findings
clarification questions
provenance/evidence references
```

The draft must distinguish accepted meaning from source-only/inferred/unknown meaning.

## T3-02 — Visual Review Workspace Product Contract

Build on frozen P2-01B Canvas Review/Projection architecture and define the complete review experience contract:

```text
canonical projection
source-only evidence overlays
confidence/truth/perspective indicators
validation findings
local evidence navigation
multi-source conflicts
review actions
baseline revisions/transitions
```

No code yet.

## T3-03 — Correction / Confirmation / Freeze Loop

Define how user/business authority actions produce:

```text
ReviewAction / authority evidence
      ↓
new claims / confirmations / resolutions
      ↓
new ProcessRevision where meaning changes
      ↓
new ValidationAssessment
      ↓
explicit accepted semantic revision
```

Phase-3 gate:

```text
A user can import/create a process,
understand TALOS interpretation,
see provenance/uncertainty/conflicts,
correct or confirm meaning,
and freeze an accepted semantic revision
without source rewrite.
```

---

# PHASE 4 — CAPABILITY MODEL

Status: **PENDING**

## T4-01 — Capability Contract
## T4-02 — Human Interaction / Forms Contract
## T4-03 — Integration Binding Contract

Initial capability families may include:

```text
HTTP / custom API
Gmail
Google Drive
n8n webhook/workflow
generic human approval/form
AI task
```

Core law:

```text
BUSINESS ACTION ≠ PROVIDER IMPLEMENTATION
CAPABILITY      ≠ CURRENT AUTOMATION NODE
```

---

# PHASE 5 — TEMPORAL EXECUTION MODEL

Status: **PENDING**

## T5-01 — ExecutionPlan Contract
## T5-02 — Temporal Interpreter / Compiler Strategy
## T5-03 — Core Semantic → Temporal Mapping Contracts
## T5-04 — DeploymentRevision Contract

Phase gate:

A validated/accepted process plus bound capabilities can produce a deterministic execution design whose every runtime element traces back to accepted process semantics and provenance.

Core law:

```text
BUSINESS PROCESS NODE ≠ Temporal Activity
SOURCE EXPRESSION      ≠ Temporal execution design
```

---

# PHASE 6 — REFERENCE / END-TO-END VERTICAL SLICE

Status: **PENDING**

Before BUILD:

```text
reconcile implementation plan against frozen Phases 1–5
pressure-test plan
explicit BUILD opening decision
```

Then implement a deliberately small vertical slice exercising:

```text
source intake
canonical/provenance/validation
human-readable explanation
Canvas review/correction
accepted semantic revision
capability binding
Temporal ExecutionPlan
runtime/deployment lineage
```

---

# PHASE 7 — SOURCE / CAPABILITY EXPANSION

Status: **FUTURE**

Additional adapters/capabilities are added incrementally and must pass the same conformance laws.

---

# PHASE 8 — OBSERVABILITY & PROCESS INTELLIGENCE

Status: **FUTURE**

Examples:

```text
designed vs observed comparison
runtime drift
process mining
bottleneck evidence
improvement suggestions
```

---

# Current authoritative state

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT ARCHITECTURE        ✅ CLOSED
BUILD OPENING REVIEW                ✅ CLOSED — NO-GO
PHASE 3 — EXPLANATION & REVIEW      🟢 NEXT
PHASE 4 — CAPABILITY MODEL          ⚪ PENDING
PHASE 5 — TEMPORAL EXECUTION        ⚪ PENDING
PHASE 6 — VERTICAL SLICE            ⚪ PENDING
BUILD                               ⛔ CLOSED
```

## Immediate next move

```text
T3-01 — HUMAN-READABLE WORKFLOW DRAFT CONTRACT
```

Do not implement UI/code yet.