# TALOS — Temporal Mapping Strategy Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T5-02 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target: `design/34-TEMPORAL-MAPPING-STRATEGY-CONTRACT-v0.1.md`

BUILD remains closed.

## 1. Inputs

```text
ExecutionPlanRevision
+ ExecutionScopeAssessment(s)
+ ExecutionPlanAssessment = READY_FOR_TEMPORAL_MAPPING_DESIGN
        ↓
TemporalMapper
```

The mapper never reads mutable/latest process/capability state as authority.

## 2. Core architecture

```text
ExecutionPlanRevision
        ↓
WorkflowBoundaryAnalyzer
        ↓
TemporalPatternAnalyzer
        ├── capability-call mapping
        ├── human/message mapping
        ├── time/event wait mapping
        ├── parallel/join mapping
        ├── subprocess/region mapping
        ├── lifecycle mapping
        └── cancellation/compensation placement
        ↓
TemporalAlternativeGenerator
        ↓
TemporalMappingDecision boundary
        ↓
TemporalMappingRevision
        ↓
TemporalMappingValidator
        ↓
TemporalMappingAssessment
```

## 3. WorkflowBoundaryAnalyzer

Consumes T5-01 execution regions and explicit lifecycle/isolation requirements.

Produces `TemporalWorkflowBoundaryMapping` candidates such as:

```text
ROOT_DURABLE_ORCHESTRATION
NESTED_DURABLE_ORCHESTRATION
INLINE_IN_PARENT_WORKFLOW
EXTERNAL_TEMPORAL_SERVICE_BOUNDARY
NO_TEMPORAL_BOUNDARY
```

No region becomes a Child Workflow solely because it exists as a separate business/subprocess region.

## 4. TemporalPatternAnalyzer

Builds composite `TemporalMappingGroup` patterns instead of forcing one primitive per execution element.

Examples:

```text
HUMAN_INTERACTION_PATTERN
  external task capability invocation
  + workflow state/condition
  + Signal/Update candidate
  + optional durable timing candidate

CAPABILITY_CALL_PATTERN
  Activity OR Nexus candidate
  + workflow-side result handling

PARALLEL_JOIN_PATTERN
  workflow concurrency
  + join logic
```

## 5. Activity mapper

Activity candidacy requires an external/non-deterministic/failure-prone operation appropriate to Worker Activity execution.

The mapper does not decide retry/timeout/idempotency values; it only records that T5-03 must design them.

## 6. Nexus mapper

Nexus candidacy requires deliberate Temporal application/service contract architecture.

Provider brand or generic API use is insufficient.

`Activity vs Nexus` can remain an explicit alternative set until architecture authority decides.

## 7. MessageInteractionMapper

Maps external interaction semantics to candidates:

```text
async write/no tracked response → Signal candidate
sync/tracked state-changing interaction → Update candidate
read-only state inspection → Query candidate
```

These are mapping criteria, not mandatory direct translations.

A dedicated external human-task/callback service may change the final pattern while preserving the same business interaction.

## 8. Time/Event mapper

```text
explicit durable time wait → Timer candidate
external/human event wait  → message/event pattern
both                         → composite race/deadline pattern candidate
```

Concrete timeouts/escalation policy stay in T5-03.

## 9. Child Workflow analyzer

Requires rationale such as:

```text
separate service/lifecycle
resource/entity ownership
history/workload partitioning
isolation
independent parent-close semantics
```

Code organization is not sufficient rationale.

## 10. Continue-As-New analyzer

May emit lifecycle intent only from execution lifecycle/history/versioning needs.

Business loops/recurrence do not justify it automatically.

Threshold/policy remains T5-03.

## 11. NO_DIRECT_PRIMITIVE mapper

Explicitly maps subjects that are represented through surrounding workflow logic or that are non-executable context.

This prevents dummy Activities/Workflows created only for visual/trace symmetry.

## 12. Alternative/decision boundary

```text
TemporalAlternativeGenerator
→ immutable TemporalMappingAlternativeSet
→ optional mapper preference
→ explicit TemporalMappingDecision
```

Preference never becomes accepted mapping silently.

## 13. Mapping validation

Checks:

```text
exact ExecutionPlanRevision pin
all executable mapping subjects accounted for
valid many-to-many mapping traces
no unjustified Activity/Nexus/Signal/Update/Timer/Child/Continue-As-New assumptions
required alternatives/decisions resolved or explicitly pending
NO_DIRECT_PRIMITIVE explained
no T5-03 policy values
no T5-04 environment/deployment values
```

Readiness:

```text
NOT_ASSESSED
BLOCKED_BY_EXECUTION_PLAN
NEEDS_MAPPING_DECISION
NEEDS_TEMPORAL_FEATURE_COMPATIBILITY
READY_FOR_RUNTIME_POLICY_DESIGN
```

## 14. Current Temporal documentation alignment

The architecture is intentionally aligned with current Temporal concepts:

- Activities for external/business logic execution;
- Signals/Updates/Queries with different interaction semantics;
- durable Timers;
- Child Workflow lifecycle/service/partitioning use;
- Nexus service/operation boundaries;
- Continue-As-New as fresh-history/lifecycle mechanism.

These concepts remain external runtime vocabulary, not Talos semantic authority.

## 15. Anti-corruption

T5-02 does not contain:

```text
Task Queue names
Namespace/environment identity
Workflow IDs
retry/timeout values
secret/config realization
Worker versions
artifact hashes
deployment status
```

## 16. Gate

T5-02 must pass a dedicated mapping pressure suite before freeze.
