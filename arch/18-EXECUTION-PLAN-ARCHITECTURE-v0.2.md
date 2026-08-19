# TALOS — ExecutionPlan Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T5-01 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T5-01 architecture: `18-EXECUTION-PLAN-ARCHITECTURE-v0.1.md`

Target: `design/32-EXECUTION-PLAN-CONTRACT-v0.2.md`

BUILD remains closed.

## Why v0.2 exists

Initial result:

```text
X01–X40
39 PASS / 1 FAIL
```

X38 proved that plan-wide readiness alone cannot preserve multi-scope execution-design state.

v0.2 introduces scope-local immutable assessment and plan-level aggregation.

## 1. Core architecture retained

```text
PinnedUpstreamDesignBundle
        ↓
ExecutionScopePlanner
        ↓
ExecutionRegionPlanner
        ↓
ExecutionDecomposer
        ↓
ExecutionTraceBuilder
        ↓
ExecutionPlanRevision
```

Then assessment becomes explicitly two-level:

```text
ExecutionPlanRevision
        ↓
ExecutionScopeValidator
        ├── ScopeAssessment S1
        ├── ScopeAssessment S2
        └── ScopeAssessment Sn
        ↓
ExecutionPlanAssessmentAggregator
        ↓
ExecutionPlanAssessment
```

## 2. ExecutionScopeValidator

For each `ExecutionScopeBinding`, evaluates:

```text
scope role / inclusion state
upstream semantic/freeze eligibility
applicable binding readiness
region/element/relation coherence
capability-use placement
human/wait/event/data coordination completeness
material ExecutionRequirement records
mapping-trace completeness
```

Outputs immutable `ExecutionScopeAssessment`.

For context-only/non-executable scopes, normally emits:

```text
NOT_EXECUTABLE_SCOPE
```

plus any relevant context diagnostics.

## 3. Plan assessment aggregator

Consumes exact:

```text
ExecutionScopeAssessment[]
plan-global findings
plan-global execution requirements
aggregationPolicyVersion
```

and produces one plan aggregate without rewriting or back-propagating state onto scopes.

## 4. Shared/global blocker discipline

A truly global incompatibility may block the plan, for example:

```text
ProcessRevision pin incompatible with SemanticFreezeRecord
CapabilityDesignRevision does not correspond to pinned semantic freeze
material cross-scope coordination boundary unresolved
```

A local scope decision does not automatically invalidate unrelated local scope state.

## 5. Partial local readiness

TALOS may display/inspect:

```text
S1 READY_FOR_TEMPORAL_MAPPING_DESIGN
S2 NEEDS_EXECUTION_DESIGN_DECISION
PLAN NEEDS_EXECUTION_DESIGN_DECISION
```

T5-02 cannot silently map only S1 as if the whole plan were approved unless later scope-selection/mapping policy explicitly permits that operation.

## 6. Reassessment history

Assessment-policy evolution creates new immutable scope/plan assessments over the same `ExecutionPlanRevision`.

Execution-design changes create a new `ExecutionPlanRevision` and new assessments.

## 7. All v0.1 architecture boundaries remain

Including:

```text
semantic subject → 0..N execution elements
CapabilityBindingRevision != CapabilityUseOccurrence
context scope != executable behavior
business wait != timer primitive
business loop != retry
human interaction != Signal/Update
region != Temporal Workflow automatically
no Task Queue / worker / SDK / environment / secret leakage
```

## 8. Gate

v0.2 must pass full X01–X40 regression.

BUILD remains closed.
