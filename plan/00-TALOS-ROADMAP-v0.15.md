# TALOS — Gated Roadmap v0.15

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.14.md`  
Historical roadmap versions remain preserved.

## Governing principles

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

> **TALOS closes semantic, review, capability and execution-design gates before broad implementation.**

# Closed phases

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
```

Build-opening review after Phase 2:

```text
DECISION                            ❌ NO-GO
BUILD                               ⛔ CLOSED
```

# PHASE 4 — CAPABILITY MODEL

## T4-01 — Capability Contract

```text
✅ FROZEN v0.2
32 / 32 PASS
```

Initial result:

```text
31 PASS / 1 FAIL
```

K12 exposed requirement-wide design-provenance flattening.

v0.2 added:

```text
CapabilityRequirementFacet
DesignBasis
DesignState
```

so one requirement can preserve, for example:

```text
family = COMMUNICATION           SEMANTIC_DERIVED / REQUIRED
operation = SEND_NOTIFICATION    SEMANTIC_DERIVED / REQUIRED
channel = EMAIL                  SEMANTIC_EXPLICIT / REQUIRED
Gmail candidate                  IMPLEMENTED_BEHAVIOR / SUGGESTED
```

without making the current provider a hard business requirement.

Frozen boundary:

```text
CapabilityRequirement
  != CapabilityOfferingRevision
  != CapabilityMatchAssessment
  != CapabilityBinding
  != Temporal execution mapping
```

Frozen artifacts:

```text
design/26-CAPABILITY-CONTRACT-v0.2.md
arch/14-CAPABILITY-MODEL-ARCHITECTURE-v0.2.md
design/27-CAPABILITY-CONTRACT-v0.2-FREEZE-DECLARATION.md
test/56-T4-01-CAPABILITY-CONTRACT-GATE-CLOSURE-v0.1.md
```

## T4-02 — Forms / Human Interaction Capability

**Status: NEXT — DESIGN / ARCHITECTURE**

Primary question:

> When accepted process semantics require a person to review, approve, reject, correct, choose, sign, upload or provide data, how does TALOS describe the interaction, authority, information and business outcome contract without binding it to a form renderer, task inbox, identity provider, assignment engine or Temporal Signal/Update?

Must preserve at minimum:

```text
HUMAN INTERACTION SEMANTIC
  != HUMAN CAPABILITY REQUIREMENT
  != HUMAN INTERACTION DESIGN
  != FORM LOGICAL CONTRACT
  != FORM RENDERING / UI
  != USER ASSIGNMENT
  != IDENTITY / AUTH PROVIDER
  != DURABLE WAIT / TEMPORAL MECHANISM
```

## T4-03 — Integration Binding Model

Status: **PENDING**

Will define explicit selection/configuration/mapping of capability offerings after T4-01/T4-02 contracts are frozen.

# PHASE 5 — TEMPORAL EXECUTION MODEL

Status: **PENDING**

# PHASE 6 — REFERENCE / END-TO-END VERTICAL SLICE

Status: **PENDING**

Before BUILD, the implementation plan must be reconciled against frozen Phases 1–5 and receive new explicit authorization.

# Current authoritative state

```text
PHASE 1                             ✅ CLOSED
PHASE 2                             ✅ CLOSED
PHASE 3                             ✅ CLOSED

PHASE 4 — CAPABILITY MODEL          🟡 OPEN
T4-01 Capability Contract           ✅ FROZEN v0.2 — 32/32
T4-02 Forms/Human Interaction       🟢 NEXT
T4-03 Integration Binding           ⚪ PENDING

PHASE 5                             ⚪ PENDING
BUILD                               ⛔ CLOSED
```

## Immediate next move

```text
T4-02 — FORMS / HUMAN INTERACTION CAPABILITY
```
