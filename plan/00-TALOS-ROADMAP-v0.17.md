# TALOS — Gated Roadmap v0.17

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.16.md`  
Historical roadmap versions remain preserved.

## Governing principles

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

> **TALOS closes semantic, review, capability and execution-design gates before broad implementation.**

# Closed phases

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
```

BUILD remains closed after the earlier explicit NO-GO review.

# PHASE 5 — TEMPORAL EXECUTION MODEL

## T5-01 — ExecutionPlan Contract

```text
✅ FROZEN v0.2
40 / 40 PASS
```

Initial result:

```text
39 PASS / 1 FAIL
```

X38 exposed plan-wide-only readiness in a multi-scope execution design.

v0.2 introduced:

```text
ExecutionScopeAssessment
ExecutionPlanAssessment aggregation over exact scope assessments
```

Core laws:

```text
semantic subject != ExecutionElement
CapabilityBindingRevision != CapabilityUseOccurrence
context semantic scope != executable scope
ExecutionRegion != Temporal Workflow automatically
business wait != Temporal Timer automatically
human interaction != Signal/Update automatically
business loop != retry policy
scope-local readiness != plan-wide aggregate readiness
```

Frozen:

```text
design/32-EXECUTION-PLAN-CONTRACT-v0.2.md
arch/18-EXECUTION-PLAN-ARCHITECTURE-v0.2.md
design/33-EXECUTION-PLAN-v0.2-FREEZE-DECLARATION.md
```

## T5-02 — Temporal Mapping / Interpreter Strategy

**Status: NEXT**

Primary question:

> Given a frozen `ExecutionPlanRevision`, how does TALOS explicitly map coordination intentions into Temporal structures/primitives without assuming one-to-one mappings, and how does it preserve alternatives/unresolved choices and mapping rationale?

Must consider at minimum:

```text
Workflow state / orchestration boundary
Activity / Nexus operation
Signal / Update
Durable Timer
Child Workflow
parallel/concurrent branches + join
cancellation
compensation
Continue-As-New
```

and prove when **no direct Temporal primitive** is required.

## T5-03 — Runtime Safety / Policy Mapping

Status: **PENDING**

Will define concrete retry/timeout/idempotency/cancellation/compensation/lifecycle policy design separately from business semantics/capability safety requirements.

## T5-04 — DeploymentRevision / Environment Realization

Status: **PENDING**

Will bind concrete environment values, secure-reference handles, runtime artifacts and deployment coordinates to one immutable execution/mapping/policy design.

# Phase-5 governing gate

```text
plan/07-PHASE-5-TEMPORAL-EXECUTION-MODEL-GATE-v0.1.md
```

# PHASE 6 — REFERENCE / END-TO-END VERTICAL SLICE

Status: **PENDING**

Before implementation, frozen Phases 1–5 will be re-audited and BUILD will require a new explicit authorization.

# Current authoritative state

```text
PHASE 1                             ✅ CLOSED
PHASE 2                             ✅ CLOSED
PHASE 3                             ✅ CLOSED
PHASE 4                             ✅ CLOSED

PHASE 5                             🟡 OPEN
T5-01 ExecutionPlan Contract        ✅ FROZEN v0.2 — 40/40
T5-02 Temporal Mapping Strategy     🟢 NEXT
T5-03 Runtime Safety/Policy         ⚪ PENDING
T5-04 DeploymentRevision            ⚪ PENDING

BUILD                               ⛔ CLOSED
```

## Immediate next move

```text
T5-02 — TEMPORAL MAPPING / INTERPRETER STRATEGY
```
