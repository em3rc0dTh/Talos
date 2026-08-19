# TALOS — Capability Registry & Temporal Execution v0.1

Status: **ARCHITECTURE DRAFT / ACTIVE**

## Purpose

Separate business-process meaning from implementation bindings and durable runtime details.

A process step such as:

```text
Send confirmation
```

must not be permanently equivalent to:

```text
Gmail API call
```

The business semantic is stable. The implementation capability can change.

## Capability Registry

Candidate capability identity:

```text
TalosCapability
- id
- version
- displayName
- category
- description
- inputSchema
- outputSchema
- authenticationContract
- secretReferences
- timeoutPolicy
- retryPolicy
- idempotencyContract
- compensationContract?
- implementationKind
- implementationRef
- health/status?
- testHarness
- metadata
```

Possible implementation kinds:

```text
DIRECT_API
INTERNAL_SERVICE
TEMPORAL_ACTIVITY
TEMPORAL_NEXUS
MCP
N8N
HUMAN_TASK
AI_PROVIDER
DATABASE
WEBHOOK
```

## Capability binding

The automation design binds a canonical task to a capability.

```text
Process Task
"Send confirmation"
        ↓
Capability Binding
notification.email.send@2
        ↓
Implementation
Gmail / Microsoft 365 / internal service
```

A binding must be versioned and traceable.

## Human capabilities

Humans are also process capabilities.

Examples:

```text
human.approval.manager
human.review.invoice
human.input.customer-correction
```

Human tasks may require forms, assignments, escalation rules and durable waits.

## Forms

Forms should have explicit schemas and revisions.

```text
FormDefinition
- id
- version
- schema
- uiSchema?
- validationRules
- outputContract
```

Forms may act as:

- workflow triggers;
- human-task interfaces;
- missing-information capture;
- approval/rejection surfaces.

## AI capabilities

AI actions must have explicit contracts and should not be hidden inside generic workflow code.

Example:

```text
ai.document.extract
ai.process.interpret
ai.classify.invoice
ai.generate.response
```

Execution-critical AI outputs may require validation or human confirmation depending on risk and process semantics.

## n8n boundary

n8n is an integration capability, not the durable orchestration authority.

Allowed pattern:

```text
Temporal Workflow
    ↓
Activity/Capability
    ↓
n8n workflow
    ↓
External systems
    ↓
Result
    ↓
Temporal
```

TALOS retains process ownership and durable state.

## ExecutionPlan

The canonical process is transformed into a separate execution design.

Candidate structure:

```text
ExecutionPlan
- id
- processRevisionId
- designerVersion
- nodes[]
- capabilityBindings[]
- humanTaskBindings[]
- formBindings[]
- temporalMappings[]
- retryPolicies[]
- timeoutPolicies[]
- compensationPolicies[]
- validationResults[]
- unresolvedRequirements[]
- status
```

## Temporal mapping

Possible semantic mappings:

```text
Canonical Action
    → Temporal Activity or Nexus operation

Human Interaction
    → Workflow state + Update/Signal + form/task service

Wait(duration/deadline)
    → Durable Timer

External Event
    → Signal / Update / Nexus callback

Exclusive Decision
    → Deterministic workflow branch

Parallel Split/Join
    → Concurrent branches + join

Subprocess
    → Child Workflow where appropriate

Compensation
    → Saga/compensation stack

Long history / recurring lifecycle
    → Continue-As-New when appropriate
```

## Determinism rule

Temporal workflow code/interpreter must remain deterministic.

Uncontrolled external calls, random non-deterministic decisions, file reads and mutable process lookup must not occur directly inside deterministic workflow logic unless mediated through Temporal-safe mechanisms.

## Process revision pinning

A running workflow must not query "the latest process" and silently adopt new semantics.

Execution starts with a pinned immutable deployment revision:

```text
ProcessRevision
    ↓
ExecutionPlan
    ↓
DeploymentRevision
    ↓
WorkflowExecution
```

## DeploymentRevision

Candidate fields:

```text
DeploymentRevision
- id
- executionPlanId
- compilerVersion
- deployedAt
- capabilityVersions
- worker/runtimeVersion
- artifactHash
- status
```

## Idempotency

External side-effect Activities must document retry safety.

Examples:

- create invoice;
- charge payment;
- send notification;
- provision account;
- modify ERP state.

TALOS should not assume Temporal retries make side effects safe. The capability contract must describe idempotency strategy or expose the risk as a validation blocker.

## Compensation

Some actions cannot simply be rolled back.

The process designer must be able to specify compensating behavior where business semantics require it.

Example:

```text
Reserve inventory
Charge payment
Create shipment

Failure after charge:
    cancel reservation
    refund payment
```

## Execution gate

No `ExecutionPlan` becomes deployable while it contains execution-critical unresolved semantics.

Examples:

- undefined condition;
- missing capability;
- missing required credentials contract;
- ambiguous human owner;
- unsafe retry behavior;
- unresolved source conflict affecting execution;
- missing timeout where process semantics require one.
