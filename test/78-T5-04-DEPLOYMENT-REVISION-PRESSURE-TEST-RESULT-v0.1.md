# TALOS — T5-04 DeploymentRevision / Environment Pressure Test Result v0.1

Status: **GATE FAIL — CONTRACT EVOLUTION REQUIRED**  
Date: **2026-08-19**

Targets:

```text
design/38-DEPLOYMENT-REVISION-ENVIRONMENT-CONTRACT-v0.1.md
arch/21-DEPLOYMENT-REVISION-ENVIRONMENT-ARCHITECTURE-v0.1.md
```

Result:

```text
D01–D48
46 PASS
2 FAIL
PASS RATE: 95.8%
```

## Failures

```text
D43 — Auto-Upgrade Workflow execution lineage across multiple Worker Deployment Versions
D44 — credential/configuration reference health or permission drift observation
```

## D43 defect — execution-wide deployment reference is too coarse

v0.1 `WorkflowExecutionObservation` contains one optional:

```text
deploymentRevisionRef
observedWorkerDeploymentVersionRef
```

Current Temporal Worker Versioning permits Auto-Upgrade Workflows to move to newer Worker Deployment Versions as routing changes. Therefore one long-running Workflow Execution may be observed executing across multiple runtime code/deployment versions over time.

A single execution-wide deployment/version reference either:

- loses historical routing transitions; or
- falsely implies the whole Workflow execution used one immutable deployment revision/version.

Required repair:

```text
WorkflowExecutionRuntimeSegmentObservation
```

or equivalent time-scoped many-record lineage, with each observation segment able to reference the observed Worker Deployment Version, artifact/deployment revision, Task Queue/routing context and time interval/evidence.

`WorkflowExecutionObservation` becomes a stable execution summary/index, not one-version authority.

## D44 defect — realization drift is foundational operational evidence

v0.1 deployment observations cover Workers, queues, types, Nexus, Schedules and Namespace, but do not first-class model whether:

```text
credential secure-reference handle remains resolvable/authorized
configuration realization remains valid/current
permission scope changed
reference became unavailable/revoked
```

`SOURCE_DEFINED` could technically encode this, but credential/config realization safety is foundational to T5-04 and should not depend on an untyped extension.

Required repair:

Add first-class observation kinds/records such as:

```text
CREDENTIAL_REFERENCE_STATE
CREDENTIAL_PERMISSION_STATE
CONFIGURATION_REALIZATION_STATE
ENVIRONMENT_REALIZATION_DRIFT
```

No secret bytes may be read or stored merely to observe validity/drift.

## Gate state

```text
T5-04 v0.1    ❌ NOT FROZEN
PHASE 5       🟡 OPEN
BUILD          ⛔ CLOSED
```

No upstream frozen contract requires reopening.
