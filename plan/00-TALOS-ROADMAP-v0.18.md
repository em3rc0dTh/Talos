# TALOS — Gated Roadmap v0.18

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.17.md`  
Historical roadmap versions remain preserved.

## Governing principles

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

> **TALOS closes semantic, review, capability and execution-design gates before broad implementation.**

# Closed design/architecture phases

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

## Phase-5 evidence

```text
T5-01 ExecutionPlan Contract        ✅ FROZEN v0.2 — 40/40
T5-02 Temporal Mapping Strategy     ✅ FROZEN v0.2 — 46/46
T5-03 Runtime Safety/Policy         ✅ FROZEN v0.2 — 44/44
T5-04 DeploymentRevision            ✅ FROZEN v0.2 — 48/48
```

Consolidation:

```text
arch/22-PHASE-5-TEMPORAL-EXECUTION-MODEL-CONSOLIDATION-v0.1.md
```

Formal closure:

```text
test/81-PHASE-5-TEMPORAL-EXECUTION-MODEL-GATE-CLOSURE-v0.1.md
```

# Current full architecture chain

```text
PROCESS EXPRESSION / SOURCE
        ↓
PRESERVE / VERSIONED ADAPTER
        ↓
CANONICAL + PROVENANCE + VALIDATION
        ↓
HUMAN EXPLANATION / REVIEW / FREEZE
        ↓
CAPABILITY REQUIREMENT / OFFERING / BINDING
        ↓
EXECUTION PLAN
        ↓
TEMPORAL MAPPING
        ↓
RUNTIME SAFETY POLICY
        ↓
DEPLOYMENT REVISION / ENVIRONMENT REALIZATION
        ↓
DEPLOYMENT / RUNTIME OBSERVATION
```

# PHASE 6 — REFERENCE / END-TO-END VERTICAL SLICE

**Status: BUILD-OPENING REVIEW NEXT**

Before any code is authorized, TALOS must execute:

```text
POST-PHASE-5 REFERENCE / VERTICAL-SLICE BUILD OPENING REVIEW
```

The review must:

1. recover the old T2-01 Canvas implementation plan;
2. compare it against frozen Phases 1–5;
3. define the smallest slice that proves the whole TALOS proposition rather than one subsystem;
4. define package/module boundaries that remain source-agnostic and runtime-clean;
5. define executable conformance/evidence requirements;
6. explicitly decide GO or NO-GO.

A valid reference slice should exercise, at minimum:

```text
one source input
preserved origin/provenance
canonical normalization
semantic validation
human-readable explanation
visual/review-compatible baseline
one explicit correction/confirmation
semantic freeze
one capability requirement/binding
one ExecutionPlan
one Temporal mapping
runtime safety policy
one deployment revision
one local/test execution path
backward lineage/evidence
```

The slice may deliberately use the native Talos Canvas as the first implemented source adapter while still implementing shared source/intake contracts first.

It must not pretend BPMN/image/language/automation adapters are implemented merely because their architecture is frozen.

# Current authoritative state

```text
PHASE 1                             ✅ CLOSED
PHASE 2                             ✅ CLOSED
PHASE 3                             ✅ CLOSED
PHASE 4                             ✅ CLOSED
PHASE 5                             ✅ CLOSED

VERTICAL-SLICE BUILD REVIEW         🟢 NEXT
BUILD                               ⛔ CLOSED
```

## Immediate next move

```text
POST-PHASE-5 REFERENCE / VERTICAL-SLICE BUILD OPENING REVIEW
```
