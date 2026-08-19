# TALOS — Runtime Safety / Policy Contract v0.1

Status: **DESIGN CANDIDATE / T5-03 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

BUILD remains closed.

## Purpose

Define runtime reliability/safety policy design downstream of frozen Temporal mapping and upstream of deployment realization.

T5-03 answers:

> Given accepted Temporal mapping decisions, what retry, timeout, idempotency, failure, cancellation, compensation, schedule and lifecycle policies are required, and why?

It does not change business meaning or capability requirements to fit runtime mechanics.

---

# 1. Fundamental invariants

```text
BUSINESS RETRY / LOOP                  != Temporal RetryPolicy
BUSINESS DEADLINE                      != Activity timeout automatically
CAPABILITY SAFETY REQUIREMENT          != runtime policy automatically
TEMPORAL DEFAULT                       != business requirement
TEMPORAL DEFAULT                       != accepted Talos design automatically
Activity retry                         != idempotency guarantee
technical success                      != business success
cancellation request                   != compensation
compensation                           != rollback
Workflow failure                       != Activity failure
Schedule overlap policy                != business concurrency meaning automatically
Continue-As-New                        != business recurrence/loop
runtime policy                         != deployment environment
```

Primary law:

> Every material runtime policy must be traceable to upstream semantics/capability safety, Temporal construct requirements, explicit design authority, or an explicitly accepted versioned Temporal default assumption.

---

# 2. RuntimePolicyRevision

```text
RuntimePolicyRevision
- id
- executionPlanRevisionRef
- temporalMappingRevisionRef
- temporalFeatureProfileRef
- revisionNumber
- parentRuntimePolicyRevisionRef?
- policySetRefs[]
- policyFacetRefs[]
- unresolvedPolicyRequirementRefs[]
- runtimePolicyAssessmentRef?
- designerRef
- designerVersion
- policyDigest
- createdAt
```

Exact mapping/feature profile pinning is mandatory.

---

# 3. RuntimePolicyFacet

Property-level policy authority/provenance:

```text
RuntimePolicyFacet
- id
- runtimePolicyRevisionId
- policySubjectRef
- propertyPath
- value?
- valueRef?
- policyBasis
- policyState
- upstreamSemanticRefs[]?
- capabilitySafetyRefs[]?
- temporalMappingRefs[]?
- authorityRef?
- materiality
- notes?
```

`policyBasis`:

```text
BUSINESS_SEMANTIC_REQUIREMENT
CAPABILITY_SAFETY_REQUIREMENT
PROVIDER_CONSTRAINT
TEMPORAL_PLATFORM_REQUIREMENT
TEMPORAL_DEFAULT_ACCEPTANCE
RUNTIME_DESIGN_DECISION
IMPLEMENTED_BEHAVIOR_EVIDENCE
SOURCE_DEFINED
```

`policyState`:

```text
REQUIRED
SELECTED
SUGGESTED
UNRESOLVED
NOT_APPLICABLE
CONFIRMED
SOURCE_DEFINED
```

Implemented/default behavior evidence cannot silently become REQUIRED.

---

# 4. ActivityExecutionPolicy

For accepted Activity mapping units:

```text
ActivityExecutionPolicy
- id
- runtimePolicyRevisionId
- temporalMappingUnitRef
- capabilityUseOccurrenceRef
- retryPolicyRef
- timeoutPolicyRef
- idempotencyPolicyRef
- heartbeatPolicyRef?
- failureClassificationPolicyRef?
- cancellationHandlingRef?
- policyFacetRefs[]
```

No Activity policy is synthesized for `NO_DIRECT_PRIMITIVE` or unrelated mapping units.

---

# 5. RetryPolicyDesign

```text
RetryPolicyDesign
- id
- policySubjectRef
- retryMode
- initialInterval?
- backoffCoefficient?
- maximumInterval?
- maximumAttempts?
- nonRetryableFailureClassRefs[]?
- overallRetryBoundRef?
- policyFacetRefs[]
```

`retryMode`:

```text
EXPLICIT_CUSTOM
EXPLICIT_NO_RETRY
ACCEPT_VERSIONED_TEMPORAL_DEFAULT
UNRESOLVED
SOURCE_DEFINED
```

Important:

```text
ACCEPT_VERSIONED_TEMPORAL_DEFAULT
```

must be explicit design intent and later must resolve against a pinned default-behavior context.

Business “retry” semantics remain separate and may instead require Workflow logic/another business attempt path rather than Activity retry.

---

# 6. TimeoutPolicyDesign

```text
TimeoutPolicyDesign
- id
- policySubjectRef
- startToClose?
- scheduleToClose?
- scheduleToStart?
- heartbeatTimeout?
- workflowExecutionTimeout?
- workflowRunTimeout?
- timeoutRationaleRefs[]
- policyFacetRefs[]
```

Rules:

```text
business deadline → informs policy rationale
but does not equal one timeout field automatically
```

Timeouts detect/bound technical execution conditions; business timing may require explicit Workflow timers/escalation logic in addition.

---

# 7. IdempotencyPolicyDesign

```text
IdempotencyPolicyDesign
- id
- capabilityUseOccurrenceRef
- requirement
- strategyKind
- keyDerivationContractRef?
- externalEnforcementRef?
- duplicateEffectRiskRef?
- verificationRef?
- policyFacetRefs[]
```

`strategyKind`:

```text
NATURALLY_IDEMPOTENT
IDEMPOTENCY_KEY
READ_BEFORE_WRITE
EXTERNAL_DEDUPLICATION
TRANSACTIONAL_GUARD
NO_IDEMPOTENCY_REQUIRED_WITH_RATIONALE
UNRESOLVED
SOURCE_DEFINED
```

Temporal retries do not prove side-effect idempotency.

---

# 8. FailureClassificationPolicy

```text
FailureClassificationPolicy
- id
- policySubjectRef
- failureClassRefs[]
- retryabilityDecisionRefs[]
- businessFailureMappingRefs[]?
- escalationRefs[]?
- policyFacetRefs[]
```

Technical errors and business outcomes remain distinct.

Permanent/invalid-input failure may justify non-retryability, but mapping must be explicit and traceable.

---

# 9. CancellationPolicyDesign

```text
CancellationPolicyDesign
- id
- policySubjectRef
- cancellationSourceRefs[]
- propagationIntent
- cleanupRequirementRefs[]?
- childBoundaryHandlingRefs[]?
- activityCancellationRequirementRefs[]?
- policyFacetRefs[]
```

Cancellation policy does not imply compensation or business reversal.

Concrete Parent Close / Activity cancellation options may be selected only when supported by the accepted mapping and feature profile.

---

# 10. CompensationPolicyDesign

```text
CompensationPolicyDesign
- id
- runtimePolicyRevisionId
- compensationTriggerRefs[]
- compensableEffectRefs[]
- compensationActionRefs[]
- orderingRuleRefs[]
- failureHandlingRefs[]
- authorityRefs[]?
- policyFacetRefs[]
```

Compensation must trace to accepted business/capability semantics or explicit design authority.

Do not generate “undo” actions automatically merely because an Activity can fail.

---

# 11. Human/event wait policy

T5-03 may define technical handling for accepted T5-02 human/event patterns:

```text
message acceptance constraints
business deadline/timer coordination
late-message handling
cancellation interaction
unfinished-message handling where feature requires
```

It never changes the human/business outcome contract.

---

# 12. ScheduleRuntimePolicyDesign

For `TEMPORAL_SCHEDULE` mappings:

```text
ScheduleRuntimePolicyDesign
- id
- temporalMappingUnitRef
- overlapPolicyIntent
- catchupPolicyIntent?
- pauseOnFailureIntent?
- jitterIntent?
- businessCalendarConstraintRefs[]?
- policyFacetRefs[]
```

Temporal Schedule operational policy must be derived explicitly from business/runtime design needs.

No default overlap/catchup behavior becomes business meaning automatically.

---

# 13. ContinueAsNewPolicyDesign

```text
ContinueAsNewPolicyDesign
- id
- temporalMappingUnitRef
- triggerStrategy
- stateCarryForwardContractRef
- safeCheckpointConditionRefs[]
- lifecycleRationaleRefs[]
- policyFacetRefs[]
```

`triggerStrategy`:

```text
TEMPORAL_SUGGESTED_SIGNAL
HISTORY_SIZE_HEURISTIC
WORKLOAD_COUNT_HEURISTIC
VERSION_LIFECYCLE_HEURISTIC
EXPLICIT_SAFE_CHECKPOINT
UNRESOLVED
SOURCE_DEFINED
```

A business loop is not a trigger strategy by itself.

---

# 14. RuntimePolicyRequirement

```text
RuntimePolicyRequirement
- id
- runtimePolicyRevisionId
- temporalMappingRef?
- capabilityUseOccurrenceRef?
- requirementKind
- state
- materiality
- rationale?
```

Kinds:

```text
RETRY_POLICY
TIMEOUT_POLICY
IDEMPOTENCY_STRATEGY
FAILURE_CLASSIFICATION
CANCELLATION_POLICY
COMPENSATION_POLICY
SCHEDULE_POLICY
CONTINUE_AS_NEW_POLICY
MESSAGE_HANDLING_POLICY
SOURCE_DEFINED
```

---

# 15. RuntimePolicyAssessment

```text
RuntimePolicyAssessment
- id
- runtimePolicyRevisionId
- findingRefs[]
- unresolvedRequirementRefs[]
- readiness
- assessedAt
```

`readiness`:

```text
NOT_ASSESSED
BLOCKED_BY_TEMPORAL_MAPPING
NEEDS_RUNTIME_POLICY_DECISION
NEEDS_DEFAULT_BEHAVIOR_RESOLUTION
READY_FOR_DEPLOYMENT_DESIGN
SOURCE_DEFINED
```

`READY_FOR_DEPLOYMENT_DESIGN` does not mean deployed/runnable.

---

# 16. Default behavior rule

Where a policy chooses:

```text
ACCEPT_VERSIONED_TEMPORAL_DEFAULT
```

Talos must be able to explain which Temporal default behavior/version/profile is being accepted.

An absent field cannot be treated as timeless policy authority.

---

# 17. Change/history law

```text
business/capability safety change
→ upstream revision first

Temporal mapping change
→ new TemporalMappingRevision first

runtime policy decision change
→ new RuntimePolicyRevision

Temporal default profile changes
→ reassess / create new policy revision if accepted behavior changes

environment/credential change
→ T5-04 only; does not mutate RuntimePolicyRevision automatically
```

---

# 18. Security/deployment boundary

T5-03 contains no:

```text
Namespace/Task Queue concrete values
environment endpoints
secure reference handles
Worker/build artifact IDs
deployment status
```

---

# 19. Gate

Pressure tests must cover Activity vs Workflow retry, timeout/business-deadline separation, idempotency, failure classification, cancellation vs compensation, schedule policy, Continue-As-New lifecycle, explicit default acceptance and T5-04 separation.

BUILD remains closed.
