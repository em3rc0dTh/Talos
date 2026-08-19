# TALOS — DeploymentRevision / Environment Realization Architecture v0.2

Status: **ARCHITECTURE CANDIDATE / T5-04 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T5-04 architecture: `21-DEPLOYMENT-REVISION-ENVIRONMENT-ARCHITECTURE-v0.1.md`

Target: `design/38-DEPLOYMENT-REVISION-ENVIRONMENT-CONTRACT-v0.2.md`

BUILD remains closed.

## Why v0.2 exists

Initial result:

```text
D01–D48
46 PASS / 2 FAIL
```

D43 proved that long-running Auto-Upgrade executions need time-scoped runtime-version lineage. D44 proved that credential/config realization safety needs first-class typed observation.

## 1. Desired deployment pipeline retained

```text
PinnedDeploymentDesignBundle
        ↓
DeploymentTargetResolver
        ↓
EnvironmentBindingRealizer
        ↓
TemporalRuntimeBinder
        ↓
WorkerArtifactBinder
        ↓
DeploymentRevision
        ↓
DeploymentValidator
        ↓
DeploymentAssessment
```

No change to immutable desired deployment design.

## 2. Runtime observation architecture — revised

```text
DeploymentRevision
        ↓
DeploymentAttempt(s)
        ↓
DeploymentObserver
        ├── DeploymentObservation[]
        └── EnvironmentRealizationObservation[]

Workflow execution observed
        ↓
WorkflowExecutionObserver
        ↓
WorkflowExecutionObservation
        └── WorkflowExecutionRuntimeSegmentObservation[]
```

Operational facts are append-only observations.

## 3. WorkflowExecutionObserver

Creates/updates history through **new immutable records**, not by rewriting an execution-wide version field.

Inputs may include:

```text
Workflow ID / Run ID
Workflow Type
Task Queue evidence
Worker Deployment Version / Build ID evidence
worker artifact correlation
routing/versioning evidence
time/freshness
```

Outputs one or more `WorkflowExecutionRuntimeSegmentObservation` records.

## 4. Segment correlation

The correlator may associate an observed runtime segment with a `DeploymentRevision` only when evidence supports the relationship.

Unknown correlation remains unknown.

It must not infer:

```text
latest deployment revision = deployment used by historical execution
```

For Auto-Upgrade Workflows, several segment observations may reference several deployment revisions/worker versions over one Workflow Run.

## 5. Versioning history compatibility

Current Temporal Worker Versioning semantics allow Auto-Upgrade Workflows to move to newer Worker Deployment Versions while pinned Workflows remain tied to a version under applicable rules.

Talos therefore models:

```text
versioning behavior design
        !=
observed version-routing segment
```

The same model survives future version-routing evolution because observed segments are source/runtime evidence, not business semantics.

## 6. EnvironmentRealizationObserver

Observes validity/drift of:

```text
CredentialSlotRealization
ConfigurationSlotRealization
endpoint realization
permission scopes/reference metadata
```

without retrieving/storing secret bytes.

Possible evidence sources:

```text
secret manager metadata
identity/permission introspection
configuration management state
provider health/authorization checks
runtime connection diagnostics
```

The contract stores only permitted metadata/evidence references.

## 7. Drift handling

```text
realization observation = DRIFT_DETECTED / PERMISSION_MISMATCH / UNAVAILABLE
        ↓
new operational finding / governance action
        ↓
possibly new realization / DeploymentRevision if design changes
```

No upstream revision is silently mutated.

## 8. Activation/rollback governance

Activation and rollback decisions may consume:

```text
DeploymentAttempt
DeploymentObservation
EnvironmentRealizationObservation
WorkflowExecutionRuntimeSegmentObservation where relevant
```

but remain separate immutable decisions.

## 9. Trace architecture

Runtime execution trace can cross deployment revisions:

```text
WorkflowExecution W/R
  ├── Segment S1 → DeploymentRevision D10 → Build A
  └── Segment S2 → DeploymentRevision D11 → Build B
```

Both D10/D11 retain their own full upstream semantic/capability/execution lineage.

## 10. Validation additions

T5-04 validation now also checks that:

```text
WorkflowExecutionObservation does not claim one lifetime deployment/version authority
Auto-Upgrade execution lineage can be represented as 0..N segments
credential/config drift is observable without secret bytes
observation timestamps/evidence are explicit
unknown deployment correlation remains unknown
```

## 11. Anti-corruption retained

Do not:

- rewrite Workflow execution history when a newer Worker version appears;
- infer deployment revision from `latest`;
- inspect/copy secret bytes just to establish credential health;
- mutate DeploymentRevision due to operational drift;
- treat runtime version routing as process semantics.

## 12. Gate

v0.2 must pass full D01–D48 regression.

BUILD remains closed.
