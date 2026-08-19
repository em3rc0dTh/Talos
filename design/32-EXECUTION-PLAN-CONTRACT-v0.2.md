# TALOS — ExecutionPlan Contract v0.2

Status: **DESIGN CANDIDATE / T5-01 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T5-01 design: `32-EXECUTION-PLAN-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial pressure result:

```text
X01–X40
39 PASS / 1 FAIL
```

Failure:

```text
X38 — multi-scope execution readiness was only plan-wide
```

v0.2 introduces:

```text
ExecutionScopeAssessment
```

and makes `ExecutionPlanAssessment` an aggregate over exact scope assessments plus plan-global findings.

No Phase-1–4 contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
PLAN-WIDE READINESS                    != SCOPE-LOCAL READINESS
ONE EXECUTABLE SCOPE READY             != ALL EXECUTABLE SCOPES READY
ONE EXECUTABLE SCOPE BLOCKED           != OTHER SCOPES LOSE THEIR LOCAL STATE
CONTEXT-ONLY SCOPE                     != executable readiness target automatically
PLAN AGGREGATE                         must preserve exact scope assessment refs
SCOPE READINESS                        is immutable assessment history
```

Primary law:

> Execution-design readiness is assessed per executable semantic scope and then aggregated at plan level without flattening scope-local state.

---

# 2. All v0.1 execution structures remain

Retain:

```text
ExecutionPlanDefinition
ExecutionPlanRevision
ExecutionScopeBinding
ExecutionRegion
ExecutionElement
ExecutionRelation
CapabilityUseOccurrence
ExecutionDataDependency
ExecutionRequirement
ExecutionSemanticMappingTrace
```

All v0.1 pinning, cardinality, anti-leak, history and security rules remain active.

---

# 3. ExecutionScopeAssessment — new in v0.2

```text
ExecutionScopeAssessment
- id
- executionPlanRevisionId
- executionScopeBindingRef
- semanticScopeRef
- assessmentVersion
- findingRefs[]
- materialExecutionRequirementRefs[]
- readiness
- assessedAt
```

`readiness`:

```text
NOT_ASSESSED
NOT_EXECUTABLE_SCOPE
INCOMPLETE_UPSTREAM_PINNING
BLOCKED_BY_UPSTREAM_INCOMPATIBILITY
NEEDS_EXECUTION_DESIGN_DECISION
READY_FOR_TEMPORAL_MAPPING_DESIGN
SOURCE_DEFINED
```

Rules:

```text
scopeRole = CONTEXT_ONLY / NON_EXECUTABLE_REFERENCE
→ readiness normally = NOT_EXECUTABLE_SCOPE
→ may still carry context findings/constraints
→ never inherits sibling executable readiness
```

For executable scopes, readiness is based only on that scope's material execution design and applicable shared plan constraints.

---

# 4. ExecutionPlanRevision — revised assessment references

Retain v0.1 fields and add/clarify:

```text
ExecutionPlanRevision
- ...
- executionScopeAssessmentRefs[]
- executionAssessmentRef?
```

The revision itself does not mutate when assessed. Assessment records are immutable snapshots over the pinned revision.

---

# 5. ExecutionPlanAssessment — revised in v0.2

```text
ExecutionPlanAssessment
- id
- executionPlanRevisionId
- assessmentVersion
- executionScopeAssessmentRefs[]
- planGlobalFindingRefs[]
- planGlobalExecutionRequirementRefs[]
- readiness
- aggregationPolicyVersion
- assessedAt
```

Plan-level `readiness`:

```text
NOT_ASSESSED
INCOMPLETE_UPSTREAM_PINNING
BLOCKED_BY_UPSTREAM_INCOMPATIBILITY
NEEDS_EXECUTION_DESIGN_DECISION
READY_FOR_TEMPORAL_MAPPING_DESIGN
SOURCE_DEFINED
```

It is a derived aggregate; it is not the authority for any individual scope's local readiness.

---

# 6. Aggregation rules

Baseline precedence for executable included scopes:

```text
A1 any plan-global upstream incompatibility
→ BLOCKED_BY_UPSTREAM_INCOMPATIBILITY

A2 any executable scope = INCOMPLETE_UPSTREAM_PINNING
→ INCOMPLETE_UPSTREAM_PINNING

A3 any executable scope = BLOCKED_BY_UPSTREAM_INCOMPATIBILITY
→ BLOCKED_BY_UPSTREAM_INCOMPATIBILITY

A4 any executable scope = NEEDS_EXECUTION_DESIGN_DECISION
   or material plan-global execution requirement unresolved
→ NEEDS_EXECUTION_DESIGN_DECISION

A5 every included executable scope = READY_FOR_TEMPORAL_MAPPING_DESIGN
   and no plan-global blocker
→ READY_FOR_TEMPORAL_MAPPING_DESIGN
```

Scopes marked:

```text
CONTEXT_ONLY
NON_EXECUTABLE_REFERENCE
EXCLUDED
```

do not need `READY_FOR_TEMPORAL_MAPPING_DESIGN` for aggregate readiness unless a context constraint becomes a material plan-global blocker.

---

# 7. X38 canonical example

```text
ExecutionPlanRevision EP7

ScopeBinding S1
role = EXECUTABLE_PRIMARY

ScopeAssessment AS1
readiness = READY_FOR_TEMPORAL_MAPPING_DESIGN

ScopeBinding S2
role = EXECUTABLE_SUPPORTING

ScopeAssessment AS2
readiness = NEEDS_EXECUTION_DESIGN_DECISION
finding = execution boundary unresolved
```

Plan assessment:

```text
ExecutionPlanAssessment AP
scopeAssessmentRefs = [AS1, AS2]
readiness = NEEDS_EXECUTION_DESIGN_DECISION
```

TALOS can still answer:

```text
S1 is locally ready
S2 is not
whole plan is not yet ready
```

No state is inferred from the aggregate backward onto a scope.

---

# 8. Reassessment/history

New execution design revision:

```text
→ new scope assessments
→ new plan assessment
```

A validator/assessment-policy upgrade may create new assessments over the same immutable plan revision without mutating prior assessments.

---

# 9. Phase boundary retained

T5-01 still excludes:

```text
Temporal primitive selection
runtime retry/timeout/idempotency policies
environment realization
secure reference handles
worker/task-queue/code artifacts
DeploymentRevision
WorkflowExecution
```

---

# 10. Regression target

v0.2 must pass all X01–X40, especially:

```text
X11–X13 many-to-many semantic/execution cardinality
X14/X15 capability-use occurrence identity
X25/X26 context-only scope discipline
X28/X29 region decomposition without Temporal assumption
X34–X37 anti-leak boundaries
X38 per-scope readiness
X40 readiness != runnable/deployable
```

BUILD remains closed.
