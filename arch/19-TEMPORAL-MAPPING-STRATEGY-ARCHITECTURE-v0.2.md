# TALOS — Temporal Mapping Strategy Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T5-02 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T5-02 architecture: `19-TEMPORAL-MAPPING-STRATEGY-ARCHITECTURE-v0.1.md`

Target: `design/34-TEMPORAL-MAPPING-STRATEGY-CONTRACT-v0.2.md`

BUILD remains closed.

## Why v0.2 exists

Initial T5-02 result:

```text
Y01–Y46
43 PASS / 3 FAIL
```

Y43/Y44 exposed missing start-time constructs; Y45 exposed missing feature-profile pinning.

## 1. Core pipeline retained

```text
ExecutionPlanRevision
        ↓
WorkflowBoundaryAnalyzer
        ↓
TemporalPatternAnalyzer
        ↓
TemporalAlternativeGenerator
        ↓
TemporalMappingDecision boundary
        ↓
TemporalMappingRevision
        ↓
TemporalFeatureCompatibilityEvaluator
        ↓
TemporalMappingValidator
        ↓
TemporalMappingAssessment
```

## 2. TemporalFeatureProfileResolver

Before mapping assessment, resolves one immutable design-time feature profile containing:

```text
supported construct kinds
supported feature refs
platform/sdk compatibility assumptions
preview/conditional features where applicable
```

It never resolves concrete Namespace, Task Queue, endpoint, credentials, environment or Worker deployment.

## 3. StartTimeMapper

Separates three design paths:

```text
in-workflow durable time wait
→ DURABLE_TIMER

recurring/calendar/interval Workflow start
→ TEMPORAL_SCHEDULE

one-time future initial Workflow start
→ START_DELAY
```

Schedule overlap/catchup/operational policy belongs to later policy design when material.

## 4. Feature compatibility evaluator

For every accepted mapping unit:

```text
TemporalMappingUnit
+ required construct/features
+ TemporalFeatureProfile
        ↓
TemporalMappingUnitCompatibility
```

Aggregate result becomes `TemporalFeatureCompatibilityAssessment`.

Unsupported or unknown constructs do not silently downgrade to a different primitive.

## 5. Feature evolution

New Temporal capabilities may be represented through:

```text
SOURCE_DEFINED mapping construct
+ newer TemporalFeatureProfile
```

until Talos promotes them into a future explicit contract version.

Historical mapping revisions remain pinned to their original profile.

## 6. All v0.1 mapping analyzers remain

Including:

```text
Activity mapper
Nexus mapper
MessageInteractionMapper
Time/Event mapper
Child Workflow analyzer
Continue-As-New analyzer
NO_DIRECT_PRIMITIVE mapper
Alternative/Decision boundary
```

## 7. Validation order

```text
ExecutionPlan eligibility
→ mapping completeness/rationale
→ explicit decisions
→ feature compatibility
→ T5-02 readiness
```

Readiness cannot become `READY_FOR_RUNTIME_POLICY_DESIGN` while material feature compatibility is unresolved.

## 8. Anti-corruption retained

No:

```text
retry/timeout concrete policy
Task Queue/Namespace/Workflow IDs
Worker/version/deployment coordinates
environment configuration values
credential handles/secrets
```

## 9. Gate

v0.2 must pass full Y01–Y46 regression.
