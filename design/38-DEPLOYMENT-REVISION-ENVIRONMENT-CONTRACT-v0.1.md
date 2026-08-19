# TALOS — DeploymentRevision / Environment Realization Contract v0.1

Status: **DESIGN CANDIDATE / T5-04 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

BUILD remains closed.

## Purpose

Define the immutable deployment-design/realization layer that pins one frozen ExecutionPlan + TemporalMapping + RuntimePolicy design to one concrete runtime environment and executable artifact set, while keeping actual deployment/activation/runtime observations historically separate.

Primary question:

> What exactly was intended to be deployed, where, with which concrete runtime/configuration/credential references and artifacts—and what evidence proves what was actually activated or executed?

---

# 1. Fundamental invariants

```text
CapabilityBindingRevision               != EnvironmentBindingRealization
ExecutionPlanRevision                   != DeploymentRevision
TemporalMappingRevision                 != DeploymentRevision
RuntimePolicyRevision                   != DeploymentRevision
DeploymentRevision                      != DeploymentAttempt
DeploymentRevision                      != DeploymentObservation
DeploymentObservation                   != WorkflowExecution
Task Queue                              != business actor/responsibility
Worker Deployment                       != business capability
Worker Deployment Version              != business process revision
current/ramping/draining state          != immutable deployment-design state
secure reference handle                != secret value
secret value rotation behind same handle != DeploymentRevision change automatically
environment secure-handle change        != upstream binding/runtime-policy mutation
Workflow Execution                     != deployment proof automatically
```

Primary law:

> `DeploymentRevision` is an immutable desired runtime realization of exact upstream Talos design artifacts. Dynamic platform state and actual execution are recorded as separate immutable observations.

---

# 2. Phase-5 entry contract

T5-04 requires exact compatible:

```text
ExecutionPlanRevision
ExecutionPlanAssessment
TemporalMappingRevision
TemporalMappingAssessment
TemporalFeatureProfile
RuntimePolicyRevision
RuntimePolicyAssessment = READY_FOR_DEPLOYMENT_DESIGN
CapabilityBindingRevision(s)
ConfigurationResolutionSlot(s)
CredentialResolutionContract(s)
```

No `latest` lookup is authoritative.

---

# 3. DeploymentDefinition

Stable deployment lineage identity:

```text
DeploymentDefinition
- id
- executionPlanDefinitionRef
- canonicalName?
- createdAt
- lifecycleStatus?
- initialDeploymentRevisionRef
- latestDeploymentRevisionRef?
```

`latestDeploymentRevisionRef` is a convenience/index pointer only.

---

# 4. DeploymentRevision

```text
DeploymentRevision
- id
- deploymentDefinitionId
- revisionNumber
- parentDeploymentRevisionRef?
- executionPlanRevisionRef
- temporalMappingRevisionRef
- runtimePolicyRevisionRef
- temporalFeatureProfileRef
- deploymentTargetProfileRef
- environmentBindingRealizationRefs[]
- temporalNamespaceBindingRef
- taskQueueBindingRefs[]
- workflowTypeBindingRefs[]
- activityTypeBindingRefs[]
- nexusBindingRefs[]?
- workerArtifactBindingRefs[]
- workerVersioningDesignRefs[]?
- scheduleRealizationRefs[]?
- deploymentRequirementRefs[]
- deploymentAssessmentRef?
- deploymentDigest
- createdAt
- createdBy?
```

A revision pins exact runtime-facing design/realization references but does not claim that deployment succeeded or became active.

Forbidden mutable-looking truth fields include:

```text
isDeployed
isActive
currentVersion
rampingVersion
draining
lastStartedAt
runningWorkflowCount
```

Those belong to observations.

---

# 5. DeploymentTargetProfile

Concrete target environment identity/configuration boundary:

```text
DeploymentTargetProfile
- id
- environmentKey
- environmentClass
- temporalPlatformRef
- temporalNamespaceLocatorRef
- platformCapabilityProfileRef
- securityDomainRef?
- regionOrLocationRef?
- targetPolicyRefs[]?
- createdAt
```

`environmentClass`:

```text
DEVELOPMENT
TEST
STAGING
PRODUCTION
DISASTER_RECOVERY
SOURCE_DEFINED
```

This is deployment context, not business semantic scope.

---

# 6. EnvironmentBindingRealization

Concrete realization of T4-03 symbolic binding slots for this deployment revision:

```text
EnvironmentBindingRealization
- id
- deploymentRevisionRef
- capabilityBindingRevisionRef
- configurationRealizationRefs[]
- credentialRealizationRefs[]
- endpointRealizationRefs[]?
- realizationDigest
- createdAt
```

Same `CapabilityBindingRevision` may have different environment realizations.

---

# 7. ConfigurationSlotRealization

```text
ConfigurationSlotRealization
- id
- environmentBindingRealizationRef
- configurationResolutionSlotRef
- realizedValueRef?
- realizedNonSecretValue?
- valueFingerprint?
- sensitivityClass
- resolutionSourceRef
- realizedAt
```

Rules:

```text
non-secret environment value may be stored according to security policy
secret-derived value bytes are forbidden
sensitive values may be referenced/fingerprinted, not copied blindly
```

---

# 8. CredentialSlotRealization

```text
CredentialSlotRealization
- id
- environmentBindingRealizationRef
- credentialResolutionContractRef
- secureReferenceHandleRef
- credentialClassRef
- permissionScopeSnapshotRefs[]?
- handleProviderRef
- realizedAt
```

The handle may identify a vault/managed-identity/workload-identity reference in this environment.

Forbidden:

```text
password
access token
private key
client secret bytes
API key value
```

Secret value rotation **behind an unchanged stable handle** does not create a new deployment revision automatically.

Changing the deployment's secure-reference handle or credential resolution topology creates new realization history and, when deployment identity materially changes, a new `DeploymentRevision`.

---

# 9. TemporalNamespaceBinding

```text
TemporalNamespaceBinding
- id
- deploymentRevisionRef
- deploymentTargetProfileRef
- namespaceLocatorRef
- namespaceConfigurationSnapshotRef?
- bindingRationaleRefs[]
```

A Namespace is runtime isolation/configuration context; it never becomes process identity.

---

# 10. TaskQueueBinding

```text
TaskQueueBinding
- id
- deploymentRevisionRef
- taskQueueKey
- taskQueueKind
- temporalMappingSubjectRefs[]
- workerArtifactBindingRefs[]
- routingPurpose
- versioningDesignRef?
- createdAt
```

`taskQueueKind`:

```text
WORKFLOW
ACTIVITY
NEXUS
SHARED_NAME_MULTI_KIND
SOURCE_DEFINED
```

Task Queue naming/routing is deployment architecture, not business ownership.

---

# 11. WorkflowTypeBinding / ActivityTypeBinding

```text
WorkflowTypeBinding
- id
- deploymentRevisionRef
- temporalWorkflowBoundaryMappingRef
- workflowTypeName
- taskQueueBindingRef
- versioningBehaviorDesignRef?
- artifactRef

ActivityTypeBinding
- id
- deploymentRevisionRef
- temporalMappingUnitRef
- activityTypeName
- taskQueueBindingRef
- artifactRef
```

Type names are runtime/deployment identity, not semantic/capability identity.

---

# 12. NexusDeploymentBinding

Where T5-02 selected Nexus:

```text
NexusDeploymentBinding
- id
- deploymentRevisionRef
- nexusMappingUnitRef
- endpointRef
- serviceName
- operationName
- targetNamespaceRef?
- targetTaskQueueBindingRef?
- artifactRef?
```

It exists only for accepted Nexus mappings and remains deployment/runtime configuration.

---

# 13. WorkerArtifactBinding

```text
WorkerArtifactBinding
- id
- deploymentRevisionRef
- workerLogicalName
- executableArtifactRef
- artifactDigest
- sdkFamily
- sdkVersionRef?
- supportedWorkflowTypeBindingRefs[]
- supportedActivityTypeBindingRefs[]
- supportedNexusBindingRefs[]?
- workerDeploymentDesignRef?
```

The artifact identity/hash is pinned. A new code artifact is new deployment design history; it does not mutate process semantics.

---

# 14. WorkerVersioningDesign

Design intent aligned to current Temporal Worker Versioning concepts without storing dynamic server state:

```text
WorkerVersioningDesign
- id
- deploymentRevisionRef
- workerDeploymentName
- deploymentVersionRef
- buildIdRef
- workflowVersioningBehaviorRefs[]
- routingStrategyIntent
- compatibilityRefs[]
- createdAt
```

`WorkflowVersioningBehaviorDesign` may express:

```text
PINNED
AUTO_UPGRADE
UNVERSIONED
SOURCE_DEFINED
```

Dynamic facts such as current/ramping/draining/drained are **not** stored here as current truth.

---

# 15. ScheduleDeploymentRealization

For accepted `TEMPORAL_SCHEDULE` mapping units:

```text
ScheduleDeploymentRealization
- id
- deploymentRevisionRef
- temporalMappingUnitRef
- scheduleIdentityRef
- scheduleSpecRef
- scheduleActionBindingRef
- runtimePolicyRefs[]
- artifactOrConfigDigest
```

This is desired realized schedule configuration, not evidence it currently exists/is active.

---

# 16. DeploymentRequirement

```text
DeploymentRequirement
- id
- deploymentRevisionRef
- requirementKind
- state
- materiality
- subjectRefs[]
- rationale?
```

Kinds:

```text
ENVIRONMENT_CONFIGURATION
CREDENTIAL_REALIZATION
NAMESPACE_BINDING
TASK_QUEUE_ROUTING
WORKER_ARTIFACT
TYPE_REGISTRATION
WORKER_VERSIONING
NEXUS_ENDPOINT_REALIZATION
SCHEDULE_REALIZATION
RUNTIME_COMPATIBILITY
SOURCE_DEFINED
```

---

# 17. DeploymentAssessment

```text
DeploymentAssessment
- id
- deploymentRevisionRef
- findingRefs[]
- unresolvedRequirementRefs[]
- readiness
- assessedAt
```

`readiness`:

```text
NOT_ASSESSED
BLOCKED_BY_EXECUTION_DESIGN
INCOMPLETE_ENVIRONMENT_REALIZATION
INCOMPATIBLE_RUNTIME_TARGET
READY_FOR_DEPLOYMENT_ATTEMPT
SOURCE_DEFINED
```

`READY_FOR_DEPLOYMENT_ATTEMPT` means the immutable desired deployment is sufficiently specified to attempt activation. It does not mean deployed/active/running.

---

# 18. DeploymentAttempt

Every attempt to realize/activate a `DeploymentRevision` is immutable operational history:

```text
DeploymentAttempt
- id
- deploymentRevisionRef
- targetProfileRef
- attemptNumber
- startedAt
- completedAt?
- result
- diagnosticRefs[]
- orchestratorRef?
- retryOfAttemptRef?
```

`result`:

```text
STARTED
SUCCEEDED
PARTIAL
FAILED
CANCELLED
SOURCE_DEFINED
```

Attempt success means the deployment operation reported success; it still does not prove all desired runtime state or business execution.

---

# 19. DeploymentObservation

Observed Temporal/environment state at a point/interval in time:

```text
DeploymentObservation
- id
- deploymentRevisionRef?
- deploymentAttemptRef?
- targetProfileRef
- observedAt
- observerRef
- observationKind
- observedSubjectRefs[]
- observedState
- evidenceRefs[]
- observationDigest
```

`observationKind` may include:

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

Dynamic states such as:

```text
CURRENT
RAMPING
INACTIVE
ACTIVE
DRAINING
DRAINED
```

belong to observations/platform operational records when applicable, never as mutable fields on historical deployment design.

---

# 20. DeploymentActivationDecision

If product/governance needs to distinguish an attempt from accepted activation:

```text
DeploymentActivationDecision
- id
- deploymentRevisionRef
- deploymentAttemptRef?
- observationRefs[]
- decision
- authorityRef?
- rationale?
- decidedAt
```

`decision`:

```text
ACCEPT_ACTIVE
REJECT_ACTIVATION
DEFER
ROLLBACK_REQUESTED
SOURCE_DEFINED
```

This does not mutate `DeploymentRevision`.

---

# 21. WorkflowExecutionObservation

A runtime process instance is separate:

```text
WorkflowExecutionObservation
- id
- deploymentRevisionRef?
- workflowExecutionRef
- workflowIdRef
- runIdRef
- workflowTypeBindingRef?
- observedWorkerDeploymentVersionRef?
- startedAt
- closedAt?
- executionStatus
- evidenceRefs[]
```

Actual execution proves operational occurrence, not that every deployment subject or business outcome is correct.

Detailed process observability is later scope; T5-04 only preserves the identity separation.

---

# 22. Change/rotation law

```text
business semantic change
→ upstream semantic/capability/execution redesign

Temporal mapping/runtime policy change
→ upstream T5 revision before deployment revision

worker code/artifact change
→ new DeploymentRevision

Task Queue/WorkflowType/ActivityType routing design change
→ new DeploymentRevision

environment config value/secure-handle binding change
→ new environment realization/deployment history as policy requires

secret value rotation behind same stable secure handle
→ does not require DeploymentRevision change automatically

current/ramping/draining operational state change
→ new DeploymentObservation, not DeploymentRevision mutation
```

---

# 23. No runtime state laundering

Forbidden:

```text
DeploymentRevision.status = DEPLOYED/ACTIVE
```

as authoritative mutable operational truth.

Use assessment, attempts, observations and activation decisions separately.

---

# 24. Full trace chain

Talos must be able to trace:

```text
WorkflowExecutionObservation
← DeploymentObservation / DeploymentAttempt
← DeploymentRevision
← RuntimePolicyRevision
← TemporalMappingRevision
← ExecutionPlanRevision
← CapabilityBindingRevision
← CapabilityRequirement / DesignRevision
← SemanticFreeze / ProcessRevision
← Provenance / source evidence
```

---

# 25. Anti-goals

Do not:

- store actual secret bytes;
- use runtime Task Queues as business roles;
- use Worker Deployment Version as ProcessRevision;
- mutate deployment design when Current/Ramping/Draining state changes;
- treat successful deployment attempt as proof of workflow execution/business success;
- treat Workflow execution as proof all deployment configuration is correct;
- let environment realization rewrite Phase-4 bindings;
- resolve `latest` upstream versions silently;
- make operational observations mutable status fields on `DeploymentRevision`.

---

# 26. Gate

T5-04 closes only when pressure tests prove immutable desired deployment, environment realization, safe credential/config references, runtime-routing/artifact pinning, actual-state observation separation, and complete upstream traceability.

BUILD remains closed.
