# TALOS — Temporal Mapping Strategy Contract v0.1

Status: **DESIGN CANDIDATE / T5-02 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

BUILD remains closed.

## Purpose

Define how a frozen `ExecutionPlanRevision` is mapped into explicit Temporal runtime structures **without** allowing Temporal primitives to become business/capability truth.

This contract defines mapping semantics and rationale. T5-03 owns concrete retry/timeout/idempotency/cancellation/compensation/lifecycle policies; T5-04 owns environment/deployment realization.

---

# 1. Fundamental invariants

```text
ExecutionPlanRevision                 != TemporalMappingRevision
ExecutionRegion                       != Workflow automatically
ExecutionElement                      != Activity automatically
CapabilityUseOccurrence               != Activity automatically
CapabilityOffering                    != Activity/Nexus automatically
Human coordination                    != Signal/Update automatically
External event                        != Signal automatically
Wait coordination                     != Timer automatically
Subprocess coordination               != Child Workflow automatically
Business loop                         != Continue-As-New
Parallel coordination                 != separate Workflow automatically
Temporal mapping                      != business truth
Temporal mapping                      != deployment
Temporal mapping                      != runtime execution history
```

Primary law:

> Temporal mappings are explicit derived runtime-design decisions over immutable `ExecutionPlanRevision` subjects. Mapping may be one-to-many, many-to-one, composite, alternative, unresolved, or intentionally `NO_DIRECT_PRIMITIVE`.

---

# 2. TemporalMappingRevision

```text
TemporalMappingRevision
- id
- executionPlanRevisionRef
- mappingRevisionNumber
- parentMappingRevisionRef?
- mapperRef
- mapperVersion
- workflowBoundaryMappingRefs[]
- mappingGroupRefs[]
- mappingUnitRefs[]
- alternativeSetRefs[]
- mappingDecisionRefs[]
- mappingRequirementRefs[]
- mappingTraceRefs[]
- mappingAssessmentRef?
- mappingDigest
- createdAt
```

No environment Namespace, Task Queue, Workflow ID, Worker version or secret/configuration realization belongs here.

---

# 3. TemporalWorkflowBoundaryMapping

Maps execution regions to candidate Temporal Workflow boundaries.

```text
TemporalWorkflowBoundaryMapping
- id
- temporalMappingRevisionId
- executionRegionRefs[]
- boundaryRole
- workflowBoundaryIntent
- parentBoundaryMappingRef?
- childBoundaryCandidateRefs[]?
- mappingState
- rationaleRefs[]
```

`boundaryRole`:

```text
ROOT_DURABLE_ORCHESTRATION
NESTED_DURABLE_ORCHESTRATION
INLINE_IN_PARENT_WORKFLOW
EXTERNAL_TEMPORAL_SERVICE_BOUNDARY
NO_TEMPORAL_BOUNDARY
SOURCE_DEFINED
```

Rules:

```text
ExecutionRegion != Temporal Workflow boundary automatically
```

A separate Child Workflow is justified only through explicit lifecycle/service/resource/partitioning/isolation rationale, never merely for code organization.

---

# 4. TemporalMappingGroup

Composite runtime design grouping:

```text
TemporalMappingGroup
- id
- temporalMappingRevisionId
- executionSubjectRefs[]
- groupKind
- mappingUnitRefs[]
- compositionRule
- rationaleRefs[]
```

`groupKind`:

```text
CAPABILITY_CALL_PATTERN
HUMAN_INTERACTION_PATTERN
EVENT_WAIT_PATTERN
TIME_WAIT_PATTERN
PARALLEL_JOIN_PATTERN
SUBPROCESS_PATTERN
CANCELLATION_PATTERN
COMPENSATION_PATTERN
LIFECYCLE_PATTERN
SOURCE_DEFINED
```

One execution subject may require several Temporal units.

---

# 5. TemporalMappingUnit

Atomic mapping decision unit:

```text
TemporalMappingUnit
- id
- temporalMappingRevisionId
- mappingGroupRef?
- executionSubjectRefs[]
- temporalConstructKind
- mappingRole
- mappingState
- rationaleRefs[]
- compatibilityRequirementRefs[]?
```

`temporalConstructKind`:

```text
WORKFLOW_LOGIC
ACTIVITY
LOCAL_ACTIVITY_CANDIDATE
NEXUS_OPERATION
CHILD_WORKFLOW
SIGNAL_HANDLER
UPDATE_HANDLER
QUERY_HANDLER
WORKFLOW_CONDITION
DURABLE_TIMER
WORKFLOW_CONCURRENCY
WORKFLOW_JOIN_LOGIC
CANCELLATION_COORDINATION
COMPENSATION_COORDINATION
CONTINUE_AS_NEW_INTENT
NO_DIRECT_PRIMITIVE
SOURCE_DEFINED
```

`LOCAL_ACTIVITY_CANDIDATE` is only a mapping candidate; runtime-policy suitability is later.

---

# 6. Mapping cardinality

```text
one ExecutionElement/Region/UseOccurrence → 0..N TemporalMappingUnit
one TemporalMappingUnit                  → 0..N execution subjects
```

Example human approval may map through a group containing:

```text
workflow state/condition
+ external human-task capability Activity/Nexus use
+ Signal OR Update handler candidate
```

The business `HUMAN_INTERACTION` is not itself any one of these.

---

# 7. Activity candidate rule

`ACTIVITY` is a candidate when external or failure-prone/non-deterministic work must be invoked from Workflow orchestration and the selected capability/runtime architecture supports Activity execution.

Mapping rationale must trace to `CapabilityUseOccurrence` and its exact `CapabilityBindingRevision`.

Forbidden inference:

```text
canonical ACTION → Activity automatically
```

A pure deterministic coordination/calculation may remain `WORKFLOW_LOGIC` or `NO_DIRECT_PRIMITIVE` when appropriate.

Concrete retry/timeout/idempotency configuration belongs to T5-03.

---

# 8. Nexus candidate rule

`NEXUS_OPERATION` is a candidate for a selected capability/service architecture that intentionally crosses or abstracts Temporal application/service boundaries through a Nexus service contract.

Nexus candidacy is an execution architecture decision, not inferred from business semantics or provider brand.

```text
provider = n8n / API / service
```

does not imply Nexus automatically.

---

# 9. Signal / Update / Query mapping

Message mapping derives from required interaction semantics.

Conceptual distinctions:

```text
SIGNAL_HANDLER
→ asynchronous state-changing message where sender does not require tracked response

UPDATE_HANDLER
→ synchronous/tracked state-changing interaction where sender requires validation/result/error semantics

QUERY_HANDLER
→ read-only state observation; does not become process execution step
```

A human approval is not automatically Signal or Update.

A source/canonical message-flow relation is not automatically a Temporal Signal.

---

# 10. Wait mapping

```text
WAIT_COORDINATION with explicit durable time condition
→ DURABLE_TIMER candidate

WAIT for human/external event
→ message/event pattern candidate
→ NOT timer merely because duration may also exist
```

Business timing and escalation may require a composite pattern:

```text
message wait + timer/deadline coordination
```

T5-03 later defines timeout/escalation policy details.

---

# 11. Parallel / join mapping

Parallel execution semantics normally remain deterministic Workflow orchestration using concurrent commands/futures/promises according to SDK strategy.

Represent abstractly as:

```text
WORKFLOW_CONCURRENCY
WORKFLOW_JOIN_LOGIC
```

Do not create Child Workflows merely because branches are parallel.

---

# 12. Child Workflow mapping

`CHILD_WORKFLOW` requires explicit rationale such as:

```text
separate durable lifecycle/service boundary
resource/entity ownership boundary
history/workload partitioning need
independent cancellation/close semantics
separate Worker/application boundary where appropriate
```

Code organization alone is insufficient.

A canonical `SUBPROCESS` or T5-01 `ExecutionRegion` is only a candidate input.

---

# 13. Continue-As-New mapping intent

`CONTINUE_AS_NEW_INTENT` represents runtime lifecycle design intent to checkpoint state into a fresh Workflow Run/Event History.

It must never be inferred from:

```text
business loop
recurring branch
retry loop
```

alone.

Concrete thresholds/triggers belong to T5-03.

---

# 14. Cancellation / compensation mapping

T5-02 may place:

```text
CANCELLATION_COORDINATION
COMPENSATION_COORDINATION
```

where the `ExecutionPlan` contains corresponding business/execution intent.

Concrete Temporal cancellation scope, Parent Close, retry/failure and compensation policy belongs to T5-03.

---

# 15. NO_DIRECT_PRIMITIVE

First-class valid mapping:

```text
NO_DIRECT_PRIMITIVE
```

Use when a semantic/execution subject:

```text
is context only
is represented implicitly by surrounding deterministic workflow logic
is a review/provenance artifact
is a data/context constraint with no independent runtime construct
```

No dummy Activity/Workflow is created merely for traceability.

Traceability is provided by mapping traces, not fake runtime primitives.

---

# 16. TemporalMappingAlternativeSet

When more than one valid mapping exists:

```text
TemporalMappingAlternativeSet
- id
- temporalMappingRevisionId
- executionSubjectRefs[]
- alternativeRefs[]
- mapperPreferredAlternativeRef?
- preferenceRationaleRefs[]
- createdAt
```

Alternatives are immutable proposals, not accepted runtime design.

---

# 17. TemporalMappingDecision

Explicit accepted/deferred/rejected mapping decision:

```text
TemporalMappingDecision
- id
- alternativeSetRef?
- executionSubjectRefs[]
- selectedMappingRefs[]
- decision
- rationaleRefs[]
- authorityRef?
- decidedAt
```

`decision`:

```text
ACCEPT
REJECT
DEFER
UNRESOLVED
SOURCE_DEFINED
```

Mapper preference does not mutate into authority.

---

# 18. TemporalMappingRequirement

```text
TemporalMappingRequirement
- id
- temporalMappingRevisionId
- executionSubjectRefs[]
- requirementKind
- requirementState
- materiality
- rationale?
```

`requirementKind`:

```text
WORKFLOW_BOUNDARY_CHOICE
ACTIVITY_VS_NEXUS_CHOICE
MESSAGE_INTERACTION_CHOICE
TIMER_VS_EVENT_CHOICE
CHILD_WORKFLOW_JUSTIFICATION
CONCURRENCY_MAPPING
LIFECYCLE_MAPPING
CANCELLATION_MAPPING
COMPENSATION_MAPPING
TEMPORAL_FEATURE_COMPATIBILITY
SOURCE_DEFINED
```

---

# 19. Mapping trace

```text
TemporalMappingTrace
- id
- temporalMappingRevisionId
- temporalMappingSubjectRef
- executionPlanSubjectRefs[]
- upstreamSemanticRefs[]?
- capabilityBindingRefs[]?
- mappingDecisionRefs[]?
- rationaleRefs[]
```

Trace chain:

```text
TemporalMappingUnit
← ExecutionElement/Region/CapabilityUseOccurrence
← CapabilityBinding / HumanInteractionDesign
← CapabilityRequirement
← ProcessRevision / SemanticFreeze
← source/provenance
```

---

# 20. TemporalMappingAssessment

```text
TemporalMappingAssessment
- id
- temporalMappingRevisionId
- findingRefs[]
- unresolvedRequirementRefs[]
- readiness
- assessedAt
```

`readiness`:

```text
NOT_ASSESSED
BLOCKED_BY_EXECUTION_PLAN
NEEDS_MAPPING_DECISION
NEEDS_TEMPORAL_FEATURE_COMPATIBILITY
READY_FOR_RUNTIME_POLICY_DESIGN
SOURCE_DEFINED
```

`READY_FOR_RUNTIME_POLICY_DESIGN` does not mean deployable/runnable.

---

# 21. Current Temporal semantic references

The mapping vocabulary is aligned to current Temporal concepts including:

```text
Workflow
Activity
Child Workflow
Signals / Updates / Queries
Timers
Nexus Operations
Continue-As-New
```

but Talos stores its own versioned mapping contract/rationale rather than treating Temporal documentation as business truth.

---

# 22. Phase boundaries

T5-02 excludes:

```text
Activity RetryPolicy values
Activity/Workflow timeout values
idempotency implementation
cancellation policy details
compensation sequencing policy details
Continue-As-New thresholds
environment Namespace / Task Queue
Workflow IDs
Worker/version/build artifacts
credential/config realization
DeploymentRevision
```

These belong to T5-03/T5-04.

---

# 23. Anti-goals

Do not:

- make every Action an Activity;
- make every service call Nexus;
- make every message a Signal;
- make every human approval an Update;
- make every wait a Timer;
- make every subprocess a Child Workflow;
- make every loop Continue-As-New;
- create runtime constructs for context-only subjects;
- auto-accept mapper preferences;
- mutate ExecutionPlan to fit Temporal;
- bind deployment/runtime environment in T5-02.

---

# 24. Gate

T5-02 closes only when pressure tests prove mapping rationale, alternatives, many-to-many cardinality, `NO_DIRECT_PRIMITIVE`, current Temporal feature semantics, and strict T5-03/T5-04 separation.

BUILD remains closed.
