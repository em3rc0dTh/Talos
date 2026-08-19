# TALOS — Runtime Safety / Policy Contract v0.2

Status: **DESIGN CANDIDATE / T5-03 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T5-03 design: `36-RUNTIME-SAFETY-POLICY-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial result:

```text
Z01–Z44
42 PASS / 2 FAIL
```

Failures:

```text
Z42 Activity default retry acceptance
Z43 Workflow default no-retry acceptance
```

v0.2 introduces first-class immutable default reference/acceptance artifacts:

```text
TemporalDefaultBehaviorProfile
TemporalDefaultAcceptance
```

No frozen upstream contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
TEMPORAL DEFAULT BEHAVIOR               != TIMELESS TALOS TRUTH
ACCEPT DEFAULT                           != OMIT POLICY SILENTLY
DEFAULT REFERENCE PROFILE                != DEPLOYMENT ENVIRONMENT
DEFAULT PROFILE CHANGE                   != MUTATE HISTORICAL POLICY
DEFAULT ACCEPTANCE                       = EXPLICIT VERSIONED DESIGN DECISION
```

---

# 2. RuntimePolicyRevision — revised

Retain v0.1 and add:

```text
RuntimePolicyRevision
- ...
- temporalDefaultBehaviorProfileRef
- temporalDefaultAcceptanceRefs[]
```

The default profile must be compatible with the pinned `TemporalFeatureProfile` used by the accepted `TemporalMappingRevision`.

---

# 3. TemporalDefaultBehaviorProfile — new in v0.2

```text
TemporalDefaultBehaviorProfile
- id
- profileVersion
- temporalFeatureProfileRef
- platformReferenceRef?
- sdkFamily?
- sdkReferenceRef?
- documentationReferenceRef?
- defaultBehaviorEntryRefs[]
- createdAt
```

It is immutable reference/design context.

It contains no concrete:

```text
Namespace
Task Queue
environment endpoint
Worker deployment
credential
secret/configuration value
```

---

# 4. TemporalDefaultBehaviorEntry

```text
TemporalDefaultBehaviorEntry
- id
- temporalDefaultBehaviorProfileRef
- subjectKind
- propertyPath
- defaultValue?
- defaultValueRef?
- applicabilityConditionRefs[]?
- referenceRefs[]
- notes?
```

`subjectKind` may include:

```text
ACTIVITY_EXECUTION
WORKFLOW_EXECUTION
WORKFLOW_TASK_EXECUTION
SCHEDULE
NEXUS_OPERATION
SOURCE_DEFINED
```

A profile can therefore record defaults relevant to the policy contract without hard-coding them forever into the Talos domain vocabulary.

---

# 5. TemporalDefaultAcceptance — new in v0.2

```text
TemporalDefaultAcceptance
- id
- runtimePolicyRevisionId
- policySubjectRef
- policyPropertyPath
- temporalDefaultBehaviorEntryRef
- acceptanceState
- rationaleRefs[]
- authorityRef?
- acceptedAt
```

`acceptanceState`:

```text
ACCEPTED
REJECTED_USE_EXPLICIT_POLICY
DEFERRED
SOURCE_DEFINED
```

Rules:

```text
RetryPolicyDesign.retryMode = ACCEPT_VERSIONED_TEMPORAL_DEFAULT
→ matching TemporalDefaultAcceptance = ACCEPTED required
→ exact default entry required
```

An absent retry/timeout/etc. field is not enough.

---

# 6. Current canonical default examples

For the currently verified Temporal reference profile, default entries may state facts such as:

```text
Activity Execution
→ associated with retry behavior by default

Workflow Execution
→ no Retry Policy by default
```

Exact values/details belong to the referenced immutable profile entries, not to business semantics and not to timeless enum logic.

---

# 7. Default-profile evolution

If Temporal defaults change or Talos targets a different SDK/platform compatibility profile:

```text
old TemporalDefaultBehaviorProfile remains immutable
old RuntimePolicyRevision remains immutable
        ↓
new default profile
        ↓
new assessment and/or RuntimePolicyRevision when accepted runtime behavior changes
```

No historical `ACCEPT_VERSIONED_TEMPORAL_DEFAULT` decision is reinterpreted against a newer default automatically.

---

# 8. RuntimePolicyAssessment — revised

`READY_FOR_DEPLOYMENT_DESIGN` requires every material default-dependent policy to have:

```text
compatible TemporalDefaultBehaviorProfile
+ explicit TemporalDefaultAcceptance
+ no unresolved default behavior finding
```

Otherwise:

```text
NEEDS_DEFAULT_BEHAVIOR_RESOLUTION
```

---

# 9. All v0.1 policy contracts remain

Including:

```text
RuntimePolicyFacet
ActivityExecutionPolicy
RetryPolicyDesign
TimeoutPolicyDesign
IdempotencyPolicyDesign
FailureClassificationPolicy
CancellationPolicyDesign
CompensationPolicyDesign
ScheduleRuntimePolicyDesign
ContinueAsNewPolicyDesign
RuntimePolicyRequirement
```

and all business/runtime/deployment separations.

---

# 10. Regression target

v0.2 must pass all Z01–Z44, especially:

```text
Z42 versioned Activity default acceptance
Z43 versioned Workflow default acceptance
Z44 policy readiness != deployment/runnable state
```

BUILD remains closed.
