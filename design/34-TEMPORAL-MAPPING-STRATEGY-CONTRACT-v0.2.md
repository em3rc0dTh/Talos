# TALOS — Temporal Mapping Strategy Contract v0.2

Status: **DESIGN CANDIDATE / T5-02 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T5-02 design: `34-TEMPORAL-MAPPING-STRATEGY-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial T5-02 result:

```text
Y01–Y46
43 PASS / 3 FAIL
```

Failures:

```text
Y43 recurring scheduled start
Y44 one-time future start
Y45 Temporal feature/version compatibility context
```

v0.2 adds:

```text
TEMPORAL_SCHEDULE
START_DELAY
TemporalFeatureProfile
TemporalFeatureCompatibilityAssessment
```

No frozen Phase-1–4 or T5-01 contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
IN-WORKFLOW TIMER                     != WORKFLOW START SCHEDULE
RECURRING SCHEDULED START              != ONE-TIME START DELAY
TEMPORAL FEATURE PROFILE               != DEPLOYMENT ENVIRONMENT
FEATURE SUPPORT ASSUMPTION             != RUNTIME AVAILABILITY PROOF
MAPPING REVISION                       must pin its feature-compatibility context
NEW TEMPORAL FEATURE                   != silent mutation of old mapping revision
```

---

# 2. TemporalMappingRevision — revised

Retain v0.1 and add:

```text
TemporalMappingRevision
- ...
- temporalFeatureProfileRef
- featureCompatibilityAssessmentRef?
```

A mapping revision is evaluated against one exact immutable feature profile.

---

# 3. TemporalFeatureProfile — new in v0.2

Design-time Temporal capability vocabulary/profile:

```text
TemporalFeatureProfile
- id
- profileVersion
- temporalDocumentationReferenceRef?
- platformFamily
- sdkFamily?
- supportedConstructKinds[]
- supportedFeatureRefs[]
- previewOrConditionalFeatureRefs[]?
- compatibilityConstraintRefs[]?
- createdAt
```

`platformFamily` may describe a compatibility target such as:

```text
TEMPORAL_PLATFORM_GENERIC
TEMPORAL_CLOUD_CAPABILITY_PROFILE
SELF_HOSTED_CAPABILITY_PROFILE
SOURCE_DEFINED
```

but the profile must not contain concrete:

```text
Namespace
Task Queue
endpoint
credential
Worker deployment
region/account
secret/configuration value
```

Those remain T5-04 concerns.

The profile records **what runtime feature vocabulary the mapping assumes**, not proof that one deployment is healthy/configured.

---

# 4. Temporal construct vocabulary — revised

All v0.1 kinds remain and add:

```text
TEMPORAL_SCHEDULE
START_DELAY
```

Current foundational vocabulary therefore includes:

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
TEMPORAL_SCHEDULE
START_DELAY
WORKFLOW_CONCURRENCY
WORKFLOW_JOIN_LOGIC
CANCELLATION_COORDINATION
COMPENSATION_COORDINATION
CONTINUE_AS_NEW_INTENT
NO_DIRECT_PRIMITIVE
SOURCE_DEFINED
```

`SOURCE_DEFINED` remains mandatory for future/optional Temporal constructs not yet promoted into the foundational vocabulary.

---

# 5. Start-time mapping law

Three distinct time constructs:

```text
A. running Workflow must wait for time condition
→ DURABLE_TIMER candidate

B. recurring/calendar/interval process trigger starts Workflow executions
→ TEMPORAL_SCHEDULE candidate

C. one initial Workflow execution should start after one future delay
→ START_DELAY candidate
```

No mapping is accepted from wording alone; it must trace to the execution entry/timing semantics.

A business recurrence may still need additional design decisions around overlap/catchup/business policy; T5-03 owns concrete runtime policy where applicable.

---

# 6. TemporalFeatureCompatibilityAssessment — new in v0.2

```text
TemporalFeatureCompatibilityAssessment
- id
- temporalMappingRevisionId
- temporalFeatureProfileRef
- mappingUnitCompatibilityRefs[]
- findingRefs[]
- result
- assessedAt
```

`result`:

```text
COMPATIBLE
COMPATIBLE_WITH_CONDITIONS
INCOMPATIBLE
UNKNOWN
SOURCE_DEFINED
```

Per-unit compatibility:

```text
TemporalMappingUnitCompatibility
- temporalMappingUnitRef
- requiredConstructKind
- requiredFeatureRefs[]?
- result
- conditionRefs[]?
- findingRefs[]?
```

---

# 7. Feature-profile change law

If Talos wants to evaluate an existing mapping against a newer/different Temporal feature profile:

```text
old TemporalMappingRevision remains immutable
→ new compatibility assessment may be created when semantically valid
→ if mapping decisions/constructs change, create new TemporalMappingRevision
```

A newer feature is never injected into historical mapping truth.

---

# 8. Current Temporal-reference discipline

T5-02's foundational vocabulary was verified against current Temporal documentation concepts including:

```text
Activities
Child Workflows
Signals / Queries / Updates
Timers / Start Delay
Schedules
Nexus
Continue-As-New
```

Temporal documentation may evolve. The `TemporalFeatureProfile` and `SOURCE_DEFINED` extension path prevent that evolution from requiring silent mutation of frozen Talos mapping history.

---

# 9. TemporalMappingAssessment — revised readiness

Retain v0.1 readiness:

```text
NOT_ASSESSED
BLOCKED_BY_EXECUTION_PLAN
NEEDS_MAPPING_DECISION
NEEDS_TEMPORAL_FEATURE_COMPATIBILITY
READY_FOR_RUNTIME_POLICY_DESIGN
SOURCE_DEFINED
```

`READY_FOR_RUNTIME_POLICY_DESIGN` additionally requires:

```text
featureCompatibilityAssessment result = COMPATIBLE
or COMPATIBLE_WITH_CONDITIONS with no unresolved material blocker
```

It still does not mean runnable/deployable.

---

# 10. All v0.1 mapping boundaries remain

Including:

```text
many-to-many execution→Temporal mapping
Activity/Nexus explicit rationale
Signal/Update/Query semantic distinction
wait/event/timer distinction
Child Workflow justification
business loop != Continue-As-New
NO_DIRECT_PRIMITIVE
immutable alternatives/decisions
T5-03 policy separation
T5-04 deployment/environment separation
```

---

# 11. Regression target

v0.2 must pass all Y01–Y46, especially:

```text
Y43 Schedule vs Timer
Y44 Start Delay vs Timer
Y45 feature-profile compatibility
Y46 mapping readiness != deployability
```

BUILD remains closed.
