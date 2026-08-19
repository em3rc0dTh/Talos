# TALOS — DeploymentRevision / Environment Realization Architecture v0.1

Status: **ARCHITECTURE CANDIDATE / T5-04 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

Target: `design/38-DEPLOYMENT-REVISION-ENVIRONMENT-CONTRACT-v0.1.md`

BUILD remains closed.

## 1. Entry

```text
ExecutionPlanRevision
+ TemporalMappingRevision
+ RuntimePolicyRevision
+ RuntimePolicyAssessment = READY_FOR_DEPLOYMENT_DESIGN
        ↓
DeploymentDesigner
```

## 2. Core architecture

```text
PinnedDeploymentDesignBundle
        ↓
DeploymentTargetResolver
        ↓
EnvironmentBindingRealizer
        ├── ConfigurationSlotRealization[]
        └── CredentialSlotRealization[]
        ↓
TemporalRuntimeBinder
        ├── NamespaceBinding
        ├── TaskQueueBinding[]
        ├── WorkflowTypeBinding[]
        ├── ActivityTypeBinding[]
        ├── NexusDeploymentBinding[]
        └── ScheduleDeploymentRealization[]
        ↓
WorkerArtifactBinder
        ├── WorkerArtifactBinding[]
        └── WorkerVersioningDesign[]
        ↓
DeploymentRevision
        ↓
DeploymentValidator
        ↓
DeploymentAssessment
        ↓
READY_FOR_DEPLOYMENT_ATTEMPT
```

Operational history is deliberately downstream/parallel:

```text
DeploymentRevision
        ↓
DeploymentAttempt
        ↓
DeploymentObservation[]
        ↓
DeploymentActivationDecision?
        ↓
WorkflowExecutionObservation[] later/as observed
```

## 3. PinnedDeploymentDesignBundle

Resolves exact immutable:

```text
ExecutionPlanRevision
TemporalMappingRevision
TemporalFeatureProfile
RuntimePolicyRevision
CapabilityBindingRevision(s)
ConfigurationResolutionSlot(s)
CredentialResolutionContract(s)
```

Rejects incompatible or `latest` substitution.

## 4. DeploymentTargetResolver

Resolves concrete deployment environment identity:

```text
environment class
Temporal platform/cluster/account reference
Namespace locator
region/location/security domain where applicable
platform capability profile
```

This is runtime/deployment context and is never fed backward as business semantic identity.

## 5. EnvironmentBindingRealizer

Maps Phase-4 symbolic slots/contracts into concrete environment references.

Rules:

```text
non-secret values may be stored subject to security classification
secret bytes never stored
secure-reference handles may be pinned
stable handle can point to rotated secret value without deployment-design mutation automatically
```

## 6. TemporalRuntimeBinder

Maps accepted T5-02 constructs into concrete runtime names/locations only now.

Examples:

```text
Workflow boundary mapping → WorkflowTypeBinding + TaskQueueBinding
Activity mapping unit      → ActivityTypeBinding + TaskQueueBinding
Nexus mapping unit         → Endpoint/Service/Operation deployment binding
Schedule mapping unit      → ScheduleDeploymentRealization
```

No runtime name becomes canonical/capability identity.

## 7. Task Queue architecture

Current Temporal Task Queues are Worker-polled routing infrastructure. T5-04 may choose routing topology/names, but:

```text
TaskQueueBinding != Actor
TaskQueueBinding != CapabilityRequirement
TaskQueueBinding != ExecutionRegion ownership
```

One queue name may route multiple Temporal task kinds according to target architecture; Talos preserves explicit binding kind/membership.

## 8. WorkerArtifactBinder

Pins exact executable artifact digest and registered Workflow/Activity/Nexus surface expected from a worker artifact.

Artifact changes produce new deployment history, not new business semantics.

## 9. Worker versioning design

Current Temporal Worker Versioning distinguishes:

```text
Worker Deployment
Worker Deployment Version (deployment name + Build ID)
Workflow versioning behavior (Pinned / Auto-Upgrade)
dynamic routing/operational states (Current/Ramping/Draining/...)
```

T5-04 stores design choices such as deployment/build/versioning behavior separately from observed routing state.

Dynamic states are captured through observations.

## 10. DeploymentValidator

Checks:

```text
exact upstream pinning
RuntimePolicy readiness
feature/runtime target compatibility
environment configuration realization completeness
credential secure-reference completeness without secret bytes
Namespace binding
Task Queue/type registrations
artifact digest/type support consistency
Nexus/Schedule realization where selected
Worker versioning design coherence
no mutable observed-state fields on DeploymentRevision
```

Readiness:

```text
NOT_ASSESSED
BLOCKED_BY_EXECUTION_DESIGN
INCOMPLETE_ENVIRONMENT_REALIZATION
INCOMPATIBLE_RUNTIME_TARGET
READY_FOR_DEPLOYMENT_ATTEMPT
```

## 11. DeploymentAttempt service boundary

An attempt performs or records one operational realization action against one immutable `DeploymentRevision`.

Retries create new attempts linked by `retryOfAttemptRef`.

Attempt outcome does not mutate the revision.

## 12. DeploymentObserver

Produces immutable observations from Temporal/platform/deployment-system evidence.

Examples:

```text
Worker is polling expected queue
expected Workflow Type available
Worker Deployment Version observed Current/Ramping/Draining
Schedule observed active/paused
Nexus endpoint reachable/registered
Namespace exists/configured
```

Observation freshness is explicit via `observedAt`; there is no timeless `isActive` field.

## 13. Activation/governance

Product governance may use observations and attempt results to create immutable `DeploymentActivationDecision`.

Activation is not equivalent to business semantic acceptance and does not mutate the deployment revision.

## 14. Workflow execution observation boundary

When actual executions occur, Talos may record exact Workflow ID/Run ID/version/artifact relationships as runtime observations.

A runtime instance references deployment lineage; it never becomes deployment identity.

## 15. Rotation/change isolation

```text
secret value behind stable handle rotates
→ external secret-store/runtime observation only, unless policy requires snapshot change

secure-reference handle changes
→ new environment realization / deployment history

worker artifact/build changes
→ new DeploymentRevision

Task Queue/type binding changes
→ new DeploymentRevision

Current/Ramping/Draining state changes
→ new DeploymentObservation

business semantic change
→ upstream revision path first
```

## 16. Anti-corruption

Do not:

- store secret bytes;
- equate deployment attempt success with active runtime truth;
- equate Worker Versioning current state with immutable deployment design;
- use Task Queue/Worker identities as business semantics;
- mutate upstream bindings/policies for environment change;
- infer business success from Workflow execution status;
- store `latest current deployment` as historical semantic truth.

## 17. Gate

T5-04 must pass a dedicated deployment pressure suite before freeze.
