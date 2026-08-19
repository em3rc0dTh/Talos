# TALOS — Gated Roadmap v0.16

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.15.md`  
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

Build-opening review after Phase 2:

```text
DECISION                            ❌ NO-GO
BUILD                               ⛔ CLOSED
```

# Phase 4 evidence

```text
T4-01 Capability Contract              ✅ FROZEN v0.2 — 32/32
T4-02 Forms/Human Interaction          ✅ FROZEN v0.2 — 36/36
T4-03 Integration/Capability Binding   ✅ FROZEN v0.2 — 36/36
```

Consolidation:

```text
arch/17-PHASE-4-CAPABILITY-MODEL-CONSOLIDATION-v0.1.md
plan/06-PHASE-4-CAPABILITY-MODEL-GATE-v0.1.md
```

Frozen Phase-4 handoff:

```text
accepted business semantic scope
        ↓
CapabilityRequirement / property facets
        ↓
CapabilityOffering candidates + MatchAssessment
        ↓
HumanInteractionDesign / FormRevision where required
        ↓
explicit CapabilitySelectionDecision
        ↓
CapabilityBindingRevision
        ↓
logical/provider I/O + business outcome mappings
        ↓
ConfigurationResolutionSlot / CredentialResolutionContract
        ↓
CapabilityBindingAssessment = READY_FOR_EXECUTION_DESIGN
```

None of this means runnable/deployed.

# PHASE 5 — TEMPORAL EXECUTION MODEL

**Status: NEXT — DESIGN / ARCHITECTURE**

## T5-01 — ExecutionPlan Contract

**Status: NEXT**

Primary question:

> How does TALOS represent one immutable execution design derived from pinned semantic + capability + binding artifacts without treating every process node as a Temporal Activity or allowing runtime mechanics to rewrite business truth?

Must distinguish at minimum:

```text
ProcessRevision
        !=
CapabilityDesignRevision
        !=
CapabilityBindingRevision
        !=
ExecutionPlan
        !=
TemporalMapping
        !=
DeploymentRevision
        !=
WorkflowExecution
```

T5-01 must define execution-design identity, pinning, scope, executable elements, unresolved execution requirements and execution-design readiness without yet choosing code/runtime deployment details beyond what the contract requires.

## T5-02 — Temporal Mapping / Interpreter Strategy

Status: **PENDING**

Must define when canonical/execution semantics justify:

```text
Workflow state
Activity / Nexus operation
Signal / Update
Durable Timer
Child Workflow
concurrent branches / join
cancellation / compensation
Continue-As-New
```

No one-to-one node mapping assumptions.

## T5-03 — Runtime Safety / Policy Mapping

Status: **PENDING**

Will separate business safety requirements from concrete retry/timeout/idempotency/cancellation/runtime policies.

## T5-04 — DeploymentRevision / Environment Realization

Status: **PENDING**

Will bind concrete environment configuration/credential handles/runtime artifacts to one immutable execution design without rewriting Phase-4 binding design.

# PHASE 6 — REFERENCE / END-TO-END VERTICAL SLICE

Status: **PENDING**

Before implementation, all frozen Phases 1–5 will be re-audited and BUILD requires a new explicit authorization.

# Current authoritative state

```text
PHASE 1                             ✅ CLOSED
PHASE 2                             ✅ CLOSED
PHASE 3                             ✅ CLOSED
PHASE 4                             ✅ CLOSED

PHASE 5 — TEMPORAL EXECUTION MODEL  🟢 NEXT
T5-01 ExecutionPlan Contract        🟢 NEXT
T5-02 Temporal Mapping Strategy     ⚪ PENDING
T5-03 Runtime Safety/Policy         ⚪ PENDING
T5-04 DeploymentRevision            ⚪ PENDING

BUILD                               ⛔ CLOSED
```

## Immediate next move

```text
T5-01 — EXECUTION PLAN CONTRACT
```
