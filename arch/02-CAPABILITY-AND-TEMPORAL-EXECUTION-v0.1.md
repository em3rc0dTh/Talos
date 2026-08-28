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

## Governed AI automation designer

The automation-design stage may use an AI provider to generate a complete **proposal**, but provider output is never a binding, business truth, DeploymentRevision or execution authority.

```text
Confirmed ProcessRevision
        ↓
Generic Capability Requirements
        ↓
AI Automation Designer Provider
Gemini primary / governed local fallback
        ↓
AutomationProposal [SUGGESTED]
        ↓
Talos deterministic contract + policy validation
        ↓
Human review / adjust / approve
        ↓
Explicit capability selections
```

The generic capability designer remains conservative. When canonical semantics do not prove whether work is HUMAN, SYSTEM, AI or another execution family, the requirement stays unresolved. The AI proposal layer may propose a resolution, with rationale and uncertainty, without changing the requirement's truth state.

The provider contract is source- and domain-agnostic. No Talos rule may infer execution behavior from fixture names, industry labels or task names.

### AutomationProposal boundary

Candidate structure:

```text
AutomationProposal
- id
- processRevisionRef
- capabilityDesignRevisionRef
- providerId
- modelRef
- pipelineVersion
- state = SUGGESTED
- createsBinding = false
- grantsAuthority = false
- proposalDigest
- steps[]
- integrations[]
- humanCoordinations[]
- waits[]
- branchTreatments[]
- subprocessTreatments[]
- runtimePolicySuggestions[]
- assumptions[]
- unresolvedQuestions[]
- diagnostics[]
```

Every proposed step must trace to exact canonical semantic subjects. Talos rejects unsupported references, dropped material semantics, fabricated capability identities, unsafe side-effect policies, embedded secrets, or mappings that violate Temporal determinism.

AI may design. Talos validates and compiles. Human authority approves. Temporal executes only the approved artifact lineage.

See `design/03-AI-AUTOMATION-DESIGN-AND-PROGRESSIVE-DISCLOSURE-v0.1.md`.

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

An AI **execution capability** inside a business workflow is different from the **AI Automation Designer** used during design. Both require explicit contracts and neither receives authority merely by being model-generated.

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

`ExecutionPlan` is built only from approved design decisions and explicit bindings. An `AutomationProposal` is upstream review material and cannot be compiled as if it were already approved.

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

Users are not required to design these Temporal primitives directly. Talos derives them from an approved ExecutionPlan and exposes an advanced technical view when needed.

## Determinism rule

Temporal workflow code/interpreter must remain deterministic.

Uncontrolled external calls, random non-deterministic decisions, file reads and mutable process lookup must not occur directly inside deterministic workflow logic unless mediated through Temporal-safe mechanisms.

AI model calls must not become unrecorded non-deterministic Workflow decisions. An AI execution step runs through an approved capability boundary such as an Activity/Nexus operation and its result is handled according to the approved process/runtime contract.

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

AI-proposed side-effect behavior must satisfy the same rule before proposal approval can produce a capability binding.

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

A high-confidence AI proposal does not waive this gate.
