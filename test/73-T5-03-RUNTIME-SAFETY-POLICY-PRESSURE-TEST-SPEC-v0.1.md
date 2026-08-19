# TALOS — T5-03 Runtime Safety / Policy Pressure Test Spec v0.1

Status: **ACTIVE PRESSURE-TEST SPEC**  
Date: **2026-08-19**

Targets:

```text
design/36-RUNTIME-SAFETY-POLICY-CONTRACT-v0.1.md
arch/20-RUNTIME-SAFETY-POLICY-ARCHITECTURE-v0.1.md
```

BUILD remains closed.

## Fixtures

```text
Z01  Activity retry policy separated from business retry loop
Z02  Workflow retry policy separated from Activity retry policy
Z03  Workflow Task retry mechanics not modeled as business/runtime RetryPolicy
Z04  explicit no-retry Activity policy
Z05  custom Activity retry policy
Z06  non-retryable permanent/invalid-input failure classification
Z07  transient failure retryability remains technical policy
Z08  maximum attempts not inferred from business attempt count automatically
Z09  retry backoff not inferred from business wait
Z10  business deadline not equal StartToClose timeout
Z11  business deadline may require Timer plus technical Activity timeout
Z12  ScheduleToClose and StartToClose remain different technical bounds
Z13  heartbeat timeout only for heartbeat-capable long-running Activity design
Z14  Workflow timeout not invented merely because business process has end date
Z15  idempotent capability may accept retries with rationale
Z16  non-idempotent charge requires explicit duplicate-effect strategy
Z17  Temporal retry does not guarantee side-effect idempotency
Z18  idempotency key strategy is explicit and traceable
Z19  external dedup strategy preserved separately from Temporal retry
Z20  provider technical success not equal business outcome success
Z21  failure class may map to business failure outcome only explicitly
Z22  cancellation request not compensation
Z23  cancellation propagation intent explicit
Z24  Child Workflow parent-close/cancellation behavior remains runtime policy
Z25  compensation requires accepted compensable effect + compensating action
Z26  compensation ordering explicit
Z27  compensation failure handling explicit
Z28  Activity failure does not create compensation automatically
Z29  human wait deadline policy does not rewrite human outcome semantics
Z30  late message handling explicit
Z31  Schedule overlap policy explicit, not business parallelism automatically
Z32  Schedule catchup policy explicit
Z33  Schedule pause-on-failure operational policy separate from business failure semantics
Z34  Continue-As-New triggered by lifecycle/history strategy, not business loop
Z35  Continue-As-New state carry-forward explicit
Z36  Continue-As-New safe checkpoint explicit
Z37  runtime policy revision exact TemporalMappingRevision pin
Z38  newer TemporalMappingRevision does not silently mutate policy
Z39  environment/secret changes do not mutate RuntimePolicyRevision
Z40  no Namespace/Task Queue/Worker/deployment values in T5-03
Z41  property-level policy bases can differ within one Activity policy
Z42  explicit acceptance of current Temporal Activity default retry behavior is pinned to a versioned default-behavior profile
Z43  explicit acceptance of current Temporal Workflow no-retry default is pinned to the same/version-compatible default-behavior profile
Z44  READY_FOR_DEPLOYMENT_DESIGN does not mean deployment-ready/runnable
```

## Pass rule

A fixture passes only if runtime policy remains explicit, immutable, traceable, default/version-aware and separate from business semantics and deployment realization.
