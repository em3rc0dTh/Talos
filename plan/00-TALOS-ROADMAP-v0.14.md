# TALOS — Gated Roadmap v0.14

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.13.md`  
Historical roadmap versions remain preserved.

## Governing principles

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

> **TALOS closes semantic, review, capability and execution-design gates before broad implementation.**

---

# PHASE 1 — CANONICAL SEMANTICS

```text
T1-01 Canonical Process Model       ✅ FROZEN v0.1
T1-02 Provenance Model              ✅ FROZEN v0.3
T1-03 Semantic Validation           ✅ FROZEN v0.2
PHASE 1                             ✅ CLOSED
```

# PHASE 2 — INPUT UNDERSTANDING

```text
P2-00 Common Source Intake          ✅ FROZEN v0.2
P2-01A Canvas Native Authoring      ✅ PROVEN
P2-01B Canvas Review/Projection     ✅ PROVEN v0.2
P2-02 BPMN Structured Adapter       ✅ PROVEN v0.1
P2-03 Image/Perception Adapter      ✅ PROVEN v0.2
P2-04 Language/Document Adapter     ✅ PROVEN v0.2
P2-05 Existing Automation Adapter   ✅ PROVEN v0.2
P2-06 Cross-Adapter Conformance     ✅ 24/24
PHASE 2                             ✅ CLOSED
```

# BUILD OPENING REVIEW

```text
Reference Build Opening Review      ✅ CLOSED
Decision                            ❌ NO-GO
BUILD                               ⛔ CLOSED
```

The NO-GO restored the architecture-first sequence:

```text
Phase 3 Explanation & Review
→ Phase 4 Capability Model
→ Phase 5 Temporal Execution Model
→ explicit vertical-slice BUILD review
```

---

# PHASE 3 — EXPLANATION & REVIEW

## T3-01 — Human-readable Workflow Draft

```text
✅ FROZEN v0.2
30 / 30 PASS
```

Key addition:

```text
ExplanationEvidenceFacet
```

## T3-02 — Visual Review Workspace

```text
✅ FROZEN v0.2
32 / 32 PASS
```

Initial result:

```text
31 PASS / 1 FAIL
```

W30 proved that one review workspace may contain multiple semantic scopes, each requiring its own explanation/assessment/visual grammar binding.

v0.2 added:

```text
ReviewBaselineBundle
ReviewScopeSurfaceBinding
scope-aware ExplanationFacetVisualBinding
```

## T3-03 — Correction / Confirmation / Freeze

```text
✅ FROZEN v0.2
36 / 36 PASS
```

Initial result:

```text
35 PASS / 1 FAIL
```

H34 proved that one multi-scope freeze intent cannot be reconstructed safely from unrelated singular-scope commands.

v0.2 added:

```text
ReviewCommand.targetSemanticScopeRefs[]
FreezeRequestPayload
ScopeFreezeRequest
SemanticFreezeApplication
ScopeFreezeOutcome
```

## Phase-3 consolidation

```text
arch/13-PHASE-3-EXPLANATION-REVIEW-CONSOLIDATION-v0.1.md
plan/05-PHASE-3-EXPLANATION-REVIEW-GATE-v0.2.md
```

```text
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
```

---

# PHASE 4 — CAPABILITY MODEL

**Status: NEXT — DESIGN / ARCHITECTURE**

## T4-01 — Capability Contract

Primary question:

> Given a reviewed/frozen semantic scope, how does TALOS represent what kind of external, human or system capability is required without binding business meaning directly to a provider, credential, API, form widget, n8n node or Temporal Activity?

Must distinguish at minimum:

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

Capability model must support at least:

```text
human interaction
form/data collection
notification/messaging
HTTP/custom API
email
file/document/storage
workflow/orchestration invocation
AI task
system read/write/query
source-defined capability families
```

without provider lock-in.

## T4-02 — Forms / Human Interaction Capability

Status: **PENDING**

## T4-03 — Initial Integration Binding Model

Status: **PENDING**

---

# PHASE 5 — TEMPORAL EXECUTION MODEL

Status: **PENDING**

Must remain downstream of frozen business semantics + capability design.

---

# PHASE 6 — REFERENCE / END-TO-END VERTICAL SLICE

Status: **PENDING**

Before implementation, the reference plan must be reconciled again against frozen Phases 1–5 and BUILD requires a new explicit authorization.

---

# Current authoritative state

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED

PHASE 4 — CAPABILITY MODEL          🟢 NEXT
T4-01 Capability Contract           🟢 NEXT
T4-02 Forms/Human Interaction       ⚪ PENDING
T4-03 Integration Binding           ⚪ PENDING

PHASE 5                             ⚪ PENDING
BUILD                               ⛔ CLOSED
```

## Immediate next move

```text
T4-01 — CAPABILITY CONTRACT
```
