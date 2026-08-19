# TALOS — DeploymentRevision / Environment Realization Contract v0.2

Status: **DESIGN CANDIDATE / T5-04 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T5-04 design: `38-DEPLOYMENT-REVISION-ENVIRONMENT-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

Initial pressure result:

```text
D01–D48
46 PASS / 2 FAIL
```

Failures:

```text
D43 — Auto-Upgrade Workflow execution can traverse several Worker Deployment Versions
D44 — credential/config realization drift lacked first-class typed observation
```

v0.2 introduces:

```text
WorkflowExecutionRuntimeSegmentObservation
EnvironmentRealizationObservation
```

and makes execution/runtime lineage explicitly time-scoped.

No frozen Phase-1–4 or T5-01/T5-02/T5-03 contract is reopened.

---

# 1. Fundamental invariants

All v0.1 invariants remain, plus:

```text
ONE WORKFLOW EXECUTION                    may traverse MULTIPLE observed deployment/version segments
WORKFLOW EXECUTION IDENTITY               != ONE DEPLOYMENT VERSION
AUTO-UPGRADE POLICY                        != fixed worker artifact for lifetime
EXECUTION SUMMARY                         != runtime-segment authority
CREDENTIAL HANDLE IDENTITY                 != credential authorization state
CONFIGURATION REALIZATION                  != timeless validity
REALIZATION DRIFT                          != DeploymentRevision mutation
OBSERVING AUTH/CONFIG STATE                != reading/storing secret bytes
```

Primary law:

> Long-lived runtime lineage is represented through immutable time-scoped observations. A `WorkflowExecutionObservation` identifies the execution; segment observations explain which runtime deployment/version context was observed over time.

---

# 2. All v0.1 deployment-design structures remain

Retain:

```text
DeploymentDefinition
DeploymentRevision
DeploymentTargetProfile
EnvironmentBindingRealization
ConfigurationSlotRealization
CredentialSlotRealization
TemporalNamespaceBinding
TaskQueueBinding
WorkflowTypeBinding
ActivityTypeBinding
NexusDeploymentBinding
WorkerArtifactBinding
WorkerVersioningDesign
ScheduleDeploymentRealization
DeploymentRequirement
DeploymentAssessment
DeploymentAttempt
DeploymentObservation
DeploymentActivationDecision
WorkflowExecutionObservation
```

All v0.1 desired-design/attempt/observation/execution separations remain active.

---

# 3. WorkflowExecutionObservation — revised in v0.2

`WorkflowExecutionObservation` becomes execution identity/summary, not one-version authority:

```text
WorkflowExecutionObservation
- id
- workflowExecutionRef
- workflowIdRef
- runIdRef
- startingDeploymentRevisionRef?
- workflowTypeBindingRef?
- runtimeSegmentObservationRefs[]
- startedAt
- closedAt?
- executionStatus
- evidenceRefs[]
```

Removed as authoritative execution-wide fields:

```text
deploymentRevisionRef
observedWorkerDeploymentVersionRef
```

Those facts are time-scoped below.

---

# 4. WorkflowExecutionRuntimeSegmentObservation — new in v0.2

```text
WorkflowExecutionRuntimeSegmentObservation
- id
- workflowExecutionObservationRef
- observedFrom?
- observedUntil?
- observedAt
- observerRef
- deploymentRevisionRef?
- workerDeploymentNameRef?
- workerDeploymentVersionRef?
- buildIdRef?
- workerArtifactRef?
- taskQueueBindingRef?
- versioningBehaviorRef?
- routingStateObservationRef?
- evidenceRefs[]
- segmentDigest
```

A segment does not claim that every task in the interval necessarily used the same Worker unless the evidence supports that precision.

`observedFrom/observedUntil` are observation bounds, not invented exact transition times.

---

# 5. Auto-Upgrade canonical example

```text
WorkflowExecution W / Run R
versioning behavior = AUTO_UPGRADE

Segment S1
observed worker deployment version = billing@build-A
deployment revision = D10
observed 10:00–10:20

routing changes / current version advances

Segment S2
observed worker deployment version = billing@build-B
deployment revision = D11
observed 10:25–11:00
```

Valid history:

```text
W/R identity remains one Workflow Execution
S1 and S2 remain separate runtime observations
D10 and D11 remain immutable deployment revisions
```

Forbidden:

```text
WorkflowExecutionObservation.deploymentRevisionRef = D11
→ silently rewriting the whole historical run as D11
```

Pinned Workflows may naturally have one repeated/continuous version segment, but the same model applies.

---

# 6. EnvironmentRealizationObservation — new in v0.2

Typed operational observation over environment realization without copying secrets:

```text
EnvironmentRealizationObservation
- id
- deploymentRevisionRef?
- environmentBindingRealizationRef
- observedAt
- observerRef
- observationKind
- realizationSubjectRef
- observedState
- metadataFingerprint?
- permissionScopeSnapshotRefs[]?
- evidenceRefs[]
- diagnosticRefs[]?
```

`observationKind`:

```text
CREDENTIAL_REFERENCE_STATE
CREDENTIAL_PERMISSION_STATE
CONFIGURATION_REALIZATION_STATE
ENDPOINT_REALIZATION_STATE
ENVIRONMENT_REALIZATION_DRIFT
SOURCE_DEFINED
```

`observedState`:

```text
VALID
AVAILABLE
UNAVAILABLE
REVOKED
EXPIRED
PERMISSION_MISMATCH
CONFIGURATION_MISMATCH
DRIFT_DETECTED
UNKNOWN
SOURCE_DEFINED
```

No secret bytes are required or permitted merely to establish these states.

---

# 7. Credential drift law

A stable secure handle can remain identical while operational state changes:

```text
credential handle = PROD-M365

T1 observation → VALID / permissions [Mail.Send]
T2 observation → PERMISSION_MISMATCH / permissions changed
```

This creates new observations, not mutation of:

```text
CredentialSlotRealization
CapabilityBindingRevision
RuntimePolicyRevision
ProcessRevision
```

If governance chooses a new handle or credential-resolution topology, new realization/deployment history is created explicitly.

---

# 8. Configuration drift law

Likewise:

```text
ConfigurationSlotRealization
```

pins what was realized for the immutable deployment design, while later observed environment state may report:

```text
VALID
CONFIGURATION_MISMATCH
DRIFT_DETECTED
UNAVAILABLE
```

Observed drift does not rewrite what the deployment revision intended.

---

# 9. DeploymentObservation — aligned with typed realization observation

Retain v0.1 `DeploymentObservation` for platform/runtime subjects such as:

```text
WORKER_POLLING
TASK_QUEUE_REACHABILITY
WORKER_DEPLOYMENT_VERSION
VERSION_ROUTING_STATE
WORKFLOW_TYPE_AVAILABILITY
ACTIVITY_TYPE_AVAILABILITY
NEXUS_ENDPOINT_STATE
SCHEDULE_STATE
NAMESPACE_STATE
SOURCE_DEFINED
```

Use `EnvironmentRealizationObservation` for configuration/credential/endpoint realization safety where property-specific typed evidence is required.

Neither observation family mutates `DeploymentRevision`.

---

# 10. Runtime-segment / deployment trace

For any runtime segment TALOS can answer, when evidence permits:

```text
Which Workflow Execution / Run?
Which DeploymentRevision was associated with this observed segment?
Which Worker Deployment Version / Build ID was observed?
Which worker artifact did that version correspond to?
Which Task Queue/routing context applied?
Which versioning behavior was configured?
When was this observed?
What evidence supports it?
```

This supports Auto-Upgrade and future runtime-routing evolution without flattening history.

---

# 11. Full trace chain — revised

```text
WorkflowExecutionObservation
  ↓ runtimeSegmentObservationRefs[]
WorkflowExecutionRuntimeSegmentObservation
← Worker/version/routing evidence
← DeploymentRevision(s)
← RuntimePolicyRevision
← TemporalMappingRevision
← ExecutionPlanRevision
← CapabilityBindingRevision
← SemanticFreeze / ProcessRevision
← Provenance/source evidence
```

Environment safety trace:

```text
EnvironmentRealizationObservation
← EnvironmentBindingRealization
← ConfigurationSlotRealization / CredentialSlotRealization
← CapabilityBindingRevision resolution contracts
← CapabilityRequirement / semantic lineage
```

---

# 12. Assessment/activation discipline

A `DeploymentAssessment` can be `READY_FOR_DEPLOYMENT_ATTEMPT` before any observation exists.

Later negative realization/worker observations may block/trigger governance decisions operationally but do not mutate that historical readiness assessment or deployment revision.

New assessment/decision records preserve later knowledge.

---

# 13. All v0.1 security/change laws remain

Including:

```text
secret bytes forbidden
secret value rotation behind stable handle != design mutation automatically
secure handle change → new realization history
worker artifact/routing design change → new DeploymentRevision
Current/Ramping/Draining state → observation
successful attempt != execution/business success
```

---

# 14. Regression target

v0.2 must pass all D01–D48, especially:

```text
D43 time-scoped Auto-Upgrade runtime lineage
D44 realization drift observation without secret bytes
D47 complete backward trace
D48 architecture proof != production deployment
```

BUILD remains closed.
