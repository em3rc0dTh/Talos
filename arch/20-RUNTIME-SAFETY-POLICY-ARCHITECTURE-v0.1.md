# TALOS — Runtime Safety / Policy Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T5-03 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target: `design/36-RUNTIME-SAFETY-POLICY-CONTRACT-v0.1.md`

BUILD remains closed.

## 1. Entry

```text
TemporalMappingRevision
+ TemporalMappingAssessment = READY_FOR_RUNTIME_POLICY_DESIGN
+ Capability safety / business timing requirements
        ↓
RuntimePolicyDesigner
```

## 2. Core architecture

```text
PinnedExecutionMappingBundle
        ↓
PolicyRequirementDeriver
        ↓
RuntimePolicyFacetBuilder
        ↓
Policy Designers
        ├── RetryPolicyDesigner
        ├── TimeoutPolicyDesigner
        ├── IdempotencyPolicyDesigner
        ├── FailurePolicyDesigner
        ├── CancellationPolicyDesigner
        ├── CompensationPolicyDesigner
        ├── SchedulePolicyDesigner
        ├── ContinueAsNewPolicyDesigner
        └── MessageHandlingPolicyDesigner
        ↓
RuntimePolicyRevision
        ↓
RuntimePolicyValidator
        ↓
RuntimePolicyAssessment
```

## 3. PinnedExecutionMappingBundle

Resolves exact:

```text
ExecutionPlanRevision
TemporalMappingRevision
TemporalFeatureProfile
CapabilityUseOccurrence(s)
CapabilityBindingRevision(s)
CapabilitySafetyRequirement(s)
Human/business timing requirements
```

No `latest` resolution.

## 4. Policy requirement derivation

Derives runtime-policy needs from explicit upstream evidence.

Examples:

```text
Activity mapping
→ retry/timeout/idempotency/failure policy requirements

human wait + deadline mapping
→ message/timing handling requirement

compensation intent
→ compensation policy requirement

Schedule mapping
→ overlap/catchup policy review

Continue-As-New mapping
→ lifecycle trigger/checkpoint policy
```

It does not invent business semantics.

## 5. Property-level policy provenance

`RuntimePolicyFacet` records each material policy property's basis separately.

A single Activity policy may contain:

```text
idempotency REQUIRED by capability safety
maximum attempts selected by runtime design
non-retryable validation error derived from provider/business contract
other retry fields accepting versioned Temporal defaults
```

No one object-wide basis is sufficient.

## 6. Retry architecture

Separates:

```text
business attempt/loop semantics
Activity RetryPolicy
Workflow retry policy
Workflow Task retry mechanics
```

T5-03 only configures applicable accepted Temporal mapping subjects.

## 7. Timeout architecture

Separates technical failure-detection/attempt bounds from business deadlines.

Business deadlines may require:

```text
Workflow Timer / event race
+ Activity timeout policy
```

rather than one timeout field.

## 8. Idempotency architecture

`IdempotencyPolicyDesigner` consumes capability side-effect semantics and retry exposure.

It cannot treat Temporal retry success as duplicate-effect safety.

## 9. Cancellation / compensation architecture

Cancellation and compensation are separate designers.

```text
cancel outstanding work
```

does not automatically mean:

```text
reverse completed business effects
```

Compensation ordering/failure policy remains explicit.

## 10. Schedule / lifecycle architecture

Schedule operational behavior and Continue-As-New lifecycle strategy are designed only for accepted corresponding mapping units.

They do not redefine business recurrence/loops.

## 11. Default behavior boundary

When a policy explicitly chooses to accept a Temporal default, the validator requires a resolvable, versioned default-behavior context.

An omitted property is not treated as timeless accepted policy.

## 12. Validation

Checks:

```text
exact mapping pin
policy requirement coverage
property-level rationale
idempotency for retry-exposed side effects
failure classification coherence
cancellation/compensation separation
schedule/lifecycle policy coverage
explicit default acceptance resolution
no deployment/environment values
```

Readiness:

```text
NOT_ASSESSED
BLOCKED_BY_TEMPORAL_MAPPING
NEEDS_RUNTIME_POLICY_DECISION
NEEDS_DEFAULT_BEHAVIOR_RESOLUTION
READY_FOR_DEPLOYMENT_DESIGN
```

## 13. Anti-corruption

No:

```text
business semantic rewrite
provider binding rewrite
Namespace / Task Queue concrete values
secret handles
environment endpoints
Worker/build artifact IDs
deployment state
```

## 14. Gate

T5-03 must pass a dedicated policy pressure suite before freeze.
