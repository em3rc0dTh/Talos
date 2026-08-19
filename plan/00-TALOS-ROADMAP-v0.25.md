# TALOS — Gated Roadmap v0.25

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.24.md` for active planning. Historical versions remain preserved.

## Design / architecture

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

## Phase 6 — Reference Vertical Slice

Authorized implementation path only:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

### Closed BUILD stages

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
B4 Explanation / Review / Correction / Freeze     ✅ CLOSED — 13/13
B5 Capability / Human / Form / Binding             ✅ CLOSED — 12/12
```

Full B2→B5 local regression:

```text
77 / 77 PASS
```

B5 planning governance:

```text
active implementation plan      plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.3.md
active BUILD authorization       plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.2.md
recipient-input regression       test/93-REFERENCE-VERTICAL-SLICE-PLAN-v0.3-RECIPIENT-INPUT-REGRESSION-v0.1.md
```

B5 evidence:

```text
test/94-B5-CAPABILITY-HUMAN-FORM-BINDING-IMPLEMENTATION-RESULT-v0.1.md
```

Frozen handoff now includes:

```text
PR2 / accepted semantic freeze
        ↓
CapabilityDesignRevision
        ├── Manager HUMAN_INTERACTION requirement
        └── COMMUNICATION / SEND_NOTIFICATION / EMAIL requirement
        ↓
HumanInteractionDesign + reusable FormRevision/FormUseBinding
        ↓
REFERENCE_EMAIL_SINK test offering
        ↓
MatchAssessment
        ↓
explicit SelectionDecision
        ↓
CapabilityBindingRevision
        ↓
CapabilityBindingAssessment = READY_FOR_EXECUTION_DESIGN
```

Logical email input:

```text
recipientEmail
state = REQUIRED_AT_EXECUTION
basis = SEMANTIC_DERIVED
```

No recipient identity/value is part of semantic or binding truth.

## B6 — ExecutionPlan / Mapping / Policy / Deployment domains

```text
STATUS                              🟢 NEXT / OPEN
```

B6 must implement the frozen Phase-5 design objects without starting Temporal yet.

Reference plan must create distinct immutable identities for:

```text
ExecutionPlanRevision
ExecutionScopeBinding
ExecutionRegion
ExecutionElement(s)
ExecutionRelation(s)
CapabilityUseOccurrence(email)
ExecutionDataDependency(notificationRecipientEmail → logical recipientEmail)
ExecutionSemanticMappingTrace
ExecutionScopeAssessment / ExecutionPlanAssessment

TemporalMappingRevision
TemporalFeatureProfile
TemporalFeatureCompatibilityAssessment
mapping units / explicit decisions

RuntimePolicyRevision
TemporalDefaultBehaviorProfile
explicit reference Activity retry/timeout/idempotency/failure policy

DeploymentRevision
DeploymentAssessment
reference TEST environment / actual namespace-resolution contract
Task Queue / Workflow Type / Activity Type / worker logical bindings
```

B6 must retain the rule:

```text
execution design != actual Temporal execution
DeploymentRevision != DeploymentAttempt
READY_FOR_DEPLOYMENT_ATTEMPT != deployed/running
```

The reference recipient value remains absent. B6 may define only:

```text
execution input = notificationRecipientEmail
→ CapabilityUseOccurrence logical input recipientEmail
```

Concrete `.test` value enters later runtime/API stages.

## Remaining authorized stages

```text
B7 Temporal worker/reference provider            ⚪
B8 minimal reference API/web                     ⚪
B9 actual Temporal E2E runtime + evidence        ⚪
B10 failure/retry/restart/lineage closure        ⚪
```

## Immediate next move

```text
B6 — EXECUTION PLAN / TEMPORAL MAPPING / RUNTIME POLICY / DEPLOYMENT DESIGN
```
