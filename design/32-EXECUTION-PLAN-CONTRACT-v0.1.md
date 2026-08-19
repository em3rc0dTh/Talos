# TALOS — ExecutionPlan Contract v0.1

Status: **DESIGN CANDIDATE / T5-01 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

BUILD remains closed.

## Purpose

Define the immutable execution-design layer between frozen business/capability design and later Temporal mapping.

T5-01 does **not** choose Temporal primitives, deployment environments, worker topology, Task Queues, SDK code, retry policies, timeout policies, secret handles, or runtime artifacts.

Primary question:

> How can TALOS describe what must be coordinated/executed from one pinned semantic + capability design without assuming one business node equals one runtime primitive?

---

# 1. Fundamental invariants

```text
ProcessRevision                         != ExecutionPlanRevision
Semantic scope                          != execution boundary automatically
Canonical ProcessNode                  != ExecutionElement automatically
ExecutionElement                       != Temporal Activity automatically
CapabilityBindingRevision              != execution-use occurrence
HumanInteractionDesignRevision         != Signal/Update automatically
WAIT semantic                           != Temporal Timer automatically
SUBPROCESS semantic                     != Child Workflow automatically
PARALLEL semantic                       != one concurrency implementation automatically
BUSINESS LOOP                           != retry policy
BUSINESS TIME REQUIREMENT               != runtime timeout policy
CAPABILITY TECHNICAL SUCCESS            != business outcome automatically
ExecutionPlan                           != DeploymentRevision
ExecutionPlan                           != WorkflowExecution
Execution design readiness              != deployability
```

Primary law:

> `ExecutionPlanRevision` is an immutable design interpretation of pinned upstream artifacts. It may decompose, group, contextualize or omit semantic subjects according to explicit execution-design mappings, but it may never rewrite accepted business meaning.

---

# 2. Phase-5 entry contract

Formal T5-01 design input requires compatible immutable upstream artifacts including, as applicable:

```text
ProcessRevision
SemanticFreezeRecord / ScopeFreezeRecord(s)
ValidationAssessment(s)
CapabilityDesignRevision
CapabilityRequirement(s) / Facets
HumanInteractionDesignRevision(s)
FormRevision(s) / FormUseBinding(s)
CapabilityBindingRevision(s)
CapabilityBindingAssessment(s)
ConfigurationResolutionSlot(s)
CredentialResolutionContract(s)
```

For any scope intended to become executable design:

```text
SemanticFreezeRecord.freezeKind = AUTOMATION_DESIGN_HANDOFF
ScopeFreezeRecord.disposition = ACCEPTED
compatible ValidationAssessment.executionReadiness = READY_FOR_AUTOMATION_DESIGN
required CapabilityBindingAssessment = READY_FOR_EXECUTION_DESIGN
```

Context-only semantic scopes may be referenced without being executable.

---

# 3. ExecutionPlanDefinition

Stable plan identity:

```text
ExecutionPlanDefinition
- id
- canonicalName?
- processDefinitionRef
- createdAt
- lifecycleStatus?
- initialRevisionRef
- latestRevisionRef?
```

`latestRevisionRef` is an index/convenience pointer only. Historical execution meaning always resolves through immutable revisions.

---

# 4. ExecutionPlanRevision

```text
ExecutionPlanRevision
- id
- executionPlanDefinitionId
- revisionNumber
- parentExecutionPlanRevisionRef?
- processRevisionRef
- semanticFreezeRecordRef
- capabilityDesignRevisionRef
- executionScopeBindingRefs[]
- executionRegionRefs[]
- executionElementRefs[]
- executionRelationRefs[]
- capabilityUseRefs[]
- dataDependencyRefs[]
- executionRequirementRefs[]
- mappingTraceRefs[]
- executionAssessmentRef?
- designerRef
- designerVersion
- executionDesignDigest
- createdAt
- supersedesRevisionRef?
```

A revision pins exact upstream identities. It never resolves `latest` semantic/capability/binding state at runtime.

---

# 5. ExecutionScopeBinding

One review/freeze context may contain several semantic scopes. T5-01 must distinguish which are executable and which are context only.

```text
ExecutionScopeBinding
- id
- executionPlanRevisionId
- semanticScopeRef
- scopeRole
- scopeFreezeRecordRef?
- validationAssessmentRefs[]
- capabilityBindingRefs[]
- executionRegionRefs[]
- contextConstraintRefs[]?
- scopeExecutionState
```

`scopeRole`:

```text
EXECUTABLE_PRIMARY
EXECUTABLE_SUPPORTING
CONTEXT_ONLY
NON_EXECUTABLE_REFERENCE
SOURCE_DEFINED
```

`scopeExecutionState`:

```text
INCLUDED
EXCLUDED
BLOCKED
UNRESOLVED
SOURCE_DEFINED
```

Rules:

```text
CONTEXT_ONLY / NON_EXECUTABLE_REFERENCE
→ may constrain/explain design
→ do not create execution behavior automatically
```

Architecture/policy/source-review scopes therefore remain usable without becoming fake workflow regions.

---

# 6. ExecutionRegion

Execution regions describe runtime coordination boundaries **without** choosing Temporal Workflow/Child Workflow implementation.

```text
ExecutionRegion
- id
- executionPlanRevisionId
- parentRegionRef?
- semanticScopeRefs[]
- regionKind
- ownershipIntent
- lifecycleIntent
- elementRefs[]
- entryConditionRefs[]?
- completionConditionRefs[]?
- isolationRequirementRefs[]?
- designState
```

`regionKind`:

```text
ORCHESTRATION_REGION
INLINE_COORDINATION_REGION
EXTERNAL_OWNED_REGION
HUMAN_COORDINATION_REGION
CONTEXT_REGION
SOURCE_DEFINED
```

`ownershipIntent` describes design ownership, not Task Queue/worker ownership.

One semantic process may map to one or many execution regions. One execution region may coordinate several semantic subjects.

---

# 7. ExecutionElement

An execution element is an occurrence in the execution design, not a canonical identity and not a Temporal primitive.

```text
ExecutionElement
- id
- executionPlanRevisionId
- executionRegionRef
- executionRole
- semanticSubjectRefs[]
- capabilityUseRefs[]?
- humanInteractionDesignRefs[]?
- formUseRefs[]?
- conditionRefs[]?
- completionRequirementRefs[]?
- executionRequirementRefs[]?
- designState
- notes?
```

`executionRole`:

```text
ENTRY_COORDINATION
CONTROL_STATE
CAPABILITY_INVOCATION
HUMAN_INTERACTION_COORDINATION
WAIT_COORDINATION
DECISION_COORDINATION
PARALLEL_COORDINATION
JOIN_COORDINATION
SUBPROCESS_COORDINATION
EXTERNAL_EVENT_COORDINATION
COMPLETION_COORDINATION
DATA_COORDINATION
SOURCE_DEFINED
```

Important cardinality law:

```text
one semantic subject → 0..N ExecutionElement
one ExecutionElement → 0..N semantic subjects
```

Examples:

- a pure semantic annotation/context item may create zero execution elements;
- one human interaction may need coordination + capability-use elements;
- several semantic control nodes may be represented by one coordination region/element where meaning is preserved;
- one semantic action may require several capability-use occurrences only when the accepted execution design explicitly requires them.

---

# 8. ExecutionRelation

```text
ExecutionRelation
- id
- executionPlanRevisionId
- sourceElementRef?
- targetElementRef?
- relationKind
- semanticRelationRefs[]
- conditionRefs[]?
- synchronizationRequirementRefs[]?
- designState
```

`relationKind`:

```text
SEQUENCE_DEPENDENCY
CONDITIONAL_DEPENDENCY
PARALLEL_FAN_OUT
JOIN_DEPENDENCY
EVENT_DEPENDENCY
DATA_DEPENDENCY
COMPLETION_DEPENDENCY
REGION_TRANSITION
SOURCE_DEFINED
```

An execution relation is derived design. It never overwrites the canonical source/control relation.

Incomplete execution design remains explicit; missing endpoints are not repaired silently.

---

# 9. CapabilityUseOccurrence

A selected `CapabilityBindingRevision` describes reusable/process-design binding. T5-01 needs an execution-use occurrence identity.

```text
CapabilityUseOccurrence
- id
- executionPlanRevisionId
- executionElementRef
- capabilityBindingRevisionRef
- capabilityRequirementRef
- invocationIntent
- inputAvailabilityRefs[]
- outputUseRefs[]
- requiredBusinessOutcomeRefs[]
- occurrenceConstraintRefs[]?
- designState
```

Rules:

```text
CapabilityBindingRevision != CapabilityUseOccurrence
```

The same exact binding may be used by multiple execution occurrences without cloning/mutating the binding revision.

`CapabilityUseOccurrence` still does not define Activity name, Task Queue, retry policy or provider environment realization.

---

# 10. Human interaction execution design

Human business interaction remains upstream truth.

T5-01 may create:

```text
HUMAN_INTERACTION_COORDINATION
```

with references to:

```text
HumanInteractionDesignRevision
FormUseBinding(s)
HumanOutcome(s)
BusinessTimingRequirement(s)
```

but cannot yet choose:

```text
Temporal Signal
Temporal Update
Task Queue
human-task service
websocket/polling
runtime assignee identity
runtime timer policy
```

Those are later mapping/runtime decisions.

---

# 11. Wait / event / loop semantics

T5-01 preserves coordination intent separately:

```text
WAIT_COORDINATION
EXTERNAL_EVENT_COORDINATION
DECISION_COORDINATION
```

Examples:

```text
business wait until Friday
→ WAIT_COORDINATION with semantic time condition
→ not Temporal Timer yet

wait for customer response
→ EXTERNAL_EVENT/HUMAN coordination intent
→ not Signal/Update yet

repeat until approved
→ business control condition
→ not Activity retry policy
```

---

# 12. ExecutionDataDependency

```text
ExecutionDataDependency
- id
- executionPlanRevisionId
- logicalDataRef
- producerElementRefs[]?
- consumerElementRefs[]
- availabilityConditionRef?
- requiredness
- transformationNeedRef?
- designState
```

Logical business/capability data remains separate from provider payloads and runtime serialization formats.

Data transformation needs may be recorded without choosing code/Activity implementation.

---

# 13. ExecutionRequirement

Explicit unresolved design need:

```text
ExecutionRequirement
- id
- executionPlanRevisionId
- semanticScopeRef?
- executionRegionRef?
- executionElementRef?
- requirementKind
- requirementState
- materiality
- sourceRefs[]
- rationale?
```

`requirementKind`:

```text
EXECUTION_BOUNDARY_DECISION
COORDINATION_DECOMPOSITION
CAPABILITY_USE_PLACEMENT
HUMAN_COMPLETION_COORDINATION
EVENT_DELIVERY_COORDINATION
DATA_AVAILABILITY
OUTCOME_OBSERVABILITY
CANCELLATION_INTENT
COMPENSATION_INTENT
LIFECYCLE_INTENT
SOURCE_DEFINED
```

T5-01 may identify that a later runtime decision is required. It does not invent the decision.

Runtime policy details such as concrete retries/timeouts belong to T5-03.

---

# 14. ExecutionSemanticMappingTrace

Every material execution-design element must be traceable upstream.

```text
ExecutionSemanticMappingTrace
- id
- executionPlanRevisionId
- executionSubjectRef
- semanticSubjectRefs[]
- capabilityRequirementRefs[]?
- capabilityBindingRefs[]?
- humanInteractionDesignRefs[]?
- formUseRefs[]?
- derivationKind
- designAuthorityRefs[]?
- notes?
```

`derivationKind`:

```text
DIRECT_SEMANTIC_COORDINATION
CAPABILITY_REALIZATION_USE
HUMAN_INTERACTION_COORDINATION
DERIVED_EXECUTION_COORDINATION
CONTEXT_CONSTRAINT
DESIGN_DECISION
SOURCE_DEFINED
```

No execution element exists solely because a renderer/runtime prefers it without an explicit design trace.

---

# 15. ExecutionPlanAssessment

```text
ExecutionPlanAssessment
- id
- executionPlanRevisionId
- assessmentVersion
- findingRefs[]
- readiness
- assessedAt
```

`readiness`:

```text
NOT_ASSESSED
INCOMPLETE_UPSTREAM_PINNING
BLOCKED_BY_UPSTREAM_INCOMPATIBILITY
NEEDS_EXECUTION_DESIGN_DECISION
READY_FOR_TEMPORAL_MAPPING_DESIGN
SOURCE_DEFINED
```

`READY_FOR_TEMPORAL_MAPPING_DESIGN` means only:

```text
exact upstream artifacts pinned and compatible
intended executable scopes identified
execution regions/elements/relations coherent enough for runtime mapping
required capability-use occurrences traceable to READY_FOR_EXECUTION_DESIGN bindings
material human/wait/event/data coordination intent represented
no unresolved T5-01 blocker
```

It does **not** mean:

```text
Temporal mapping chosen
retry/timeout/idempotency policy resolved
environment configuration realized
credentials resolved
worker code exists
deployment artifact exists
runnable/deployed/tested
```

---

# 16. Revision/change law

```text
semantic change
→ upstream ProcessRevision/review/freeze change
→ new compatible capability design as required
→ new ExecutionPlanRevision

capability provider/mapping design change
→ new CapabilityBindingRevision
→ new ExecutionPlanRevision or reassessment when materially used

execution decomposition/boundary change only
→ new ExecutionPlanRevision

runtime policy change later
→ T5-03/ExecutionPlan-related versioning according to that contract

environment/secret rotation
→ does not mutate ExecutionPlanRevision automatically
```

---

# 17. No `latest` rule

Execution design generation/assessment must use exact pinned IDs.

Forbidden:

```text
load latest ProcessRevision
load latest CapabilityBindingRevision
load latest form
load latest semantic freeze
```

without an explicit design transition/new revision.

---

# 18. Security boundary

ExecutionPlan may reference symbolic:

```text
ConfigurationResolutionSlot
CredentialResolutionContract
```

but not actual secret values or environment-specific secure handles.

---

# 19. Temporal anti-leak boundary

T5-01 domain must not contain authoritative fields such as:

```text
activityType
workflowType
taskQueue
signalName
updateName
workflowId
activityRetryPolicy
startToCloseTimeout
scheduleToCloseTimeout
continueAsNewThreshold
workerVersion
SDK code reference
```

Those belong to T5-02/T5-03/T5-04 as applicable.

---

# 20. Anti-goals

Do not:

- map every canonical node one-to-one into execution elements;
- map every action/capability binding to an Activity by assumption;
- turn context-only scopes into executable regions;
- duplicate capability binding identity to represent repeated execution use;
- treat business loops as retries;
- treat waits as timers without mapping analysis;
- treat forms as runtime task implementations;
- introduce deployment/environment realization;
- copy provider secrets into execution design;
- mutate upstream business truth to simplify runtime design.

---

# 21. T5-01 gate

T5-01 closes only if a pressure suite proves that the contract can represent:

```text
sequential coordination
decisions/branches
parallel/join
human interactions
business waits/events
loops
subprocess/region decomposition
capability invocation occurrences
0..N semantic→execution mapping
multi-scope context/executable separation
data dependencies
completion/outcomes
version pinning
upstream incompatibility
unresolved execution requirements
no Temporal primitive leakage
```

BUILD remains closed.
