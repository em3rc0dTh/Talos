# TALOS — Runtime Safety / Policy Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T5-03 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T5-03 architecture: `20-RUNTIME-SAFETY-POLICY-ARCHITECTURE-v0.1.md`

Target: `design/36-RUNTIME-SAFETY-POLICY-CONTRACT-v0.2.md`

BUILD remains closed.

## Why v0.2 exists

Initial result:

```text
Z01–Z44
42 PASS / 2 FAIL
```

Z42/Z43 proved that explicit default acceptance requires an immutable definition of what the accepted Temporal default meant.

## 1. Pipeline extension

Retain v0.1 pipeline and add:

```text
TemporalFeatureProfile
        ↓
TemporalDefaultBehaviorProfileResolver
        ↓
TemporalDefaultBehaviorProfile
        ↓
RuntimePolicyDesigner
        ↓
TemporalDefaultAcceptance[] where chosen
        ↓
RuntimePolicyRevision
        ↓
RuntimePolicyValidator
```

## 2. Default profile resolver

Resolves one immutable default-behavior reference compatible with:

```text
TemporalFeatureProfile
platform/SDK reference context where applicable
current verified Temporal documentation/reference
```

It does not inspect one concrete deployment environment.

## 3. Default acceptance validator

For every policy facet that selects platform default behavior:

```text
policy subject/property
→ exact TemporalDefaultBehaviorEntry
→ explicit TemporalDefaultAcceptance
```

Missing or incompatible entry causes:

```text
NEEDS_DEFAULT_BEHAVIOR_RESOLUTION
```

## 4. Current verified distinction

The reference architecture can preserve current Temporal behavior such as:

```text
Activity execution → retry behavior by default
Workflow execution → no Retry Policy by default
```

without hard-coding those as timeless Talos semantic facts.

## 5. Profile evolution

A newer Temporal/SDK profile can be assessed separately.

Historical runtime-policy meaning remains pinned to its original default behavior profile.

## 6. All v0.1 safety designers remain

```text
RetryPolicyDesigner
TimeoutPolicyDesigner
IdempotencyPolicyDesigner
FailurePolicyDesigner
CancellationPolicyDesigner
CompensationPolicyDesigner
SchedulePolicyDesigner
ContinueAsNewPolicyDesigner
MessageHandlingPolicyDesigner
```

## 7. Anti-corruption retained

No business semantic rewrite and no deployment/environment realization.

## 8. Gate

v0.2 must pass full Z01–Z44 regression.
