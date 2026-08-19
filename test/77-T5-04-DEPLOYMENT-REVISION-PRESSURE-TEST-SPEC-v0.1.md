# TALOS — T5-04 DeploymentRevision / Environment Pressure Test Spec v0.1

Status: **ACTIVE PRESSURE-TEST SPEC**  
Date: **2026-08-19**

Targets:

```text
design/38-DEPLOYMENT-REVISION-ENVIRONMENT-CONTRACT-v0.1.md
arch/21-DEPLOYMENT-REVISION-ENVIRONMENT-ARCHITECTURE-v0.1.md
```

BUILD remains closed.

## Fixtures

```text
D01 exact ExecutionPlanRevision pin
D02 exact TemporalMappingRevision pin
D03 exact RuntimePolicyRevision pin
D04 newer upstream revision never silently replaces pinned deployment design
D05 concrete development target profile
D06 concrete production target profile distinct from development
D07 same CapabilityBindingRevision realized differently in DEV/PROD
D08 non-secret environment configuration value realization
D09 sensitive/secret-derived config bytes not copied into DeploymentRevision
D10 credential secure-reference handle allowed without secret bytes
D11 password/API-key/token/private-key bytes forbidden
D12 secret value rotation behind same stable secure handle does not mutate upstream design
D13 secure-reference handle change creates new realization/deployment history
D14 Namespace binding is runtime isolation, not process identity
D15 Task Queue binding is runtime routing, not actor/business owner
D16 Workflow Task Queue binding
D17 Activity Task Queue binding
D18 Nexus Task Queue/endpoint binding only for accepted Nexus mapping
D19 Workflow type name is runtime identity, not canonical node identity
D20 Activity type name is runtime identity, not CapabilityBinding identity
D21 exact worker executable artifact digest pin
D22 worker artifact change creates new DeploymentRevision
D23 worker registration surface compatible with queue/type bindings
D24 Worker Deployment name + Build ID represented as runtime deployment design
D25 Pinned Workflow versioning behavior represented
D26 Auto-Upgrade Workflow versioning behavior represented
D27 Current/Ramping state not stored as immutable DeploymentRevision truth
D28 Draining/Drained state recorded as observation, not revision mutation
D29 Task Queue reachability recorded as observation
D30 Worker polling recorded as observation
D31 Workflow/Activity type availability recorded as observation
D32 Schedule desired realization distinct from observed active/paused state
D33 Nexus desired realization distinct from observed endpoint state
D34 DeploymentAssessment READY_FOR_DEPLOYMENT_ATTEMPT != deployed
D35 DeploymentAttempt STARTED/SUCCEEDED/FAILED is immutable attempt history
D36 successful DeploymentAttempt != proof of active workers
D37 successful DeploymentAttempt != proof of Workflow execution
D38 DeploymentObservation may support activation decision without mutating revision
D39 rollback request/decision remains governance/operational history
D40 WorkflowExecutionObservation separated from DeploymentObservation
D41 Workflow execution success != business outcome success
D42 exact WorkflowId/RunId observation does not become process/deployment identity
D43 Auto-Upgrade Workflow execution can preserve time-scoped lineage across multiple Worker Deployment Versions / deployment revisions rather than one execution-wide deployment ref
D44 credential/configuration reference health or permission drift can be observed without secret bytes and without mutating DeploymentRevision
D45 actual current/ramping routing change creates new observation, not new business semantic revision
D46 environment-only routing/config change does not rewrite Phase-4 CapabilityBindingRevision
D47 full backward trace from observed execution/deployment to source semantics remains possible
D48 BUILD remains closed; deployment architecture proof != production deployment
```

## Pass rule

A fixture passes only when desired design, environment realization, operational attempt, observed runtime state and Workflow execution identity remain explicit, immutable and separately traceable.
