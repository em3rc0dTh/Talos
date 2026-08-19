# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its central responsibility is to **normalize and standardize business processes while preserving truth, semantics, provenance, evidence, uncertainty, conflict and source-specific meaning**.

TALOS is not a BPMN converter, generic OCR/document summarizer, n8n clone, Temporal UI, or low-code diagrammer.

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.**

## Governing architecture

```text
PROCESS EXPRESSION
        ↓
PRESERVE SOURCE + VERSIONED ADAPTER
        ↓
SOURCE EVIDENCE GRAPH / CANDIDATE SCOPE(S)
        ↓
CANONICAL MODEL + PROVENANCE + SEMANTIC VALIDATION
        ↓
HUMAN EXPLANATION + VISUAL REVIEW
        ↓
CORRECTION / CONFIRMATION / SEMANTIC FREEZE
        ↓
CAPABILITY REQUIREMENTS / HUMAN-FORM DESIGN
        ↓
EXPLICIT CAPABILITY OFFERING BINDINGS
        ↓
EXECUTION PLAN
        ↓
TEMPORAL MAPPING DESIGN
        ↓
RUNTIME SAFETY POLICY
        ↓
DEPLOYMENT REVISION / ENVIRONMENT REALIZATION
        ↓
DEPLOYMENT / RUNTIME OBSERVATION
```

Every bridge is explicit and versioned. No downstream runtime object may silently become upstream business truth.

## Core laws

```text
SOURCE TRUTH != confidence != readiness != execution
source identity != canonical identity
Canvas source != canonical process model
ProcessRevision != ExecutionPlanRevision
CapabilityRequirement != Offering != Match != Binding
CapabilityBindingRevision != CapabilityUseOccurrence
human interaction != form
form action != business outcome until mapped
ExecutionElement != Temporal primitive automatically
canonical ACTION != Temporal Activity automatically
human interaction != Signal/Update automatically
wait != Timer automatically
business loop != retry / Continue-As-New
Temporal retry != idempotency guarantee
DeploymentRevision != DeploymentAttempt
DeploymentAttempt != DeploymentObservation
DeploymentObservation != WorkflowExecution
actual runtime evidence != intended runtime configuration
```

# Design / architecture status

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

# Phase 6 — Reference Vertical Slice

Bounded BUILD authorization applies only to:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

## Reference process

Initial source:

```text
Request submitted
        ↓
Review request [actor = UNKNOWN]
        ↓
Approved?
   ├── YES → Send confirmation email → Completed
   └── NO  → Rejected
```

The initial source does not contain `Manager`.

Phase 3 explicitly introduces:

```text
actor = Manager
```

through a review command, producing new source/canonical/validation history before semantic freeze.

## Current BUILD state

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
B4 Explanation / Review / Correction / Freeze     ✅ CLOSED — 13/13
B5 Capability / Human / Form / Binding             ✅ CLOSED — 12/12
B6 Execution / Mapping / Policy / Deployment      ✅ CLOSED — 14/14 B6
B7 Temporal Worker / Reference Provider            🟡 OPEN / PARTIAL
B8 Minimal reference API / web                     ⛔ CLOSED
B9 Actual Temporal E2E + server evidence           ⛔ CLOSED
B10 Failure / retry / restart / lineage closure    ⛔ CLOSED
```

Prior B2→B5 executable evidence remains:

```text
77 / 77 PASS
```

## B5 handoff

```text
PR2 / accepted automation-design freeze
        ↓
CapabilityDesignRevision
        ├── HUMAN_INTERACTION / Manager review
        └── COMMUNICATION / SEND_NOTIFICATION / EMAIL
        ↓
HumanInteractionDesign + reusable FormRevision/FormUseBinding
        ↓
REFERENCE_EMAIL_SINK test offering
        ↓
CapabilityMatchAssessment
        ↓
explicit CapabilitySelectionDecision
        ↓
CapabilityBindingRevision
        ↓
CapabilityBindingAssessment = READY_FOR_EXECUTION_DESIGN
```

Logical notification input:

```text
recipientEmail
state = REQUIRED_AT_EXECUTION
basis = SEMANTIC_DERIVED
```

No recipient identity/address is business-semantic or binding truth.

## B6 handoff

Execution design:

```text
Request submitted          → COORDINATION_STEP
Review request              → HUMAN_COORDINATION
Approved?                   → DECISION_COORDINATION
Send confirmation email     → CAPABILITY_INVOCATION
Completed / Rejected        → COMPLETION_COORDINATION
```

Execution input:

```text
notificationRecipientEmail
→ logical recipientEmail
→ REFERENCE_EMAIL_SINK input.to
```

Reference Temporal mapping design:

```text
root scope                   → Workflow boundary candidate
human submission             → UPDATE_HANDLER
accepted outcome wait        → WORKFLOW_CONDITION
email capability occurrence  → ACTIVITY
branch/completion             → WORKFLOW_LOGIC
```

This is a reference runtime-design decision, not a universal mapping rule.

Reference policy:

```text
Activity retry:
  initialInterval = 250ms
  backoffCoefficient = 2.0
  maximumInterval = 1s
  maximumAttempts = 3

Activity timeout:
  startToClose = 5s
  scheduleToClose = 10s

Workflow maximumAttempts = 1

Idempotency:
  sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)

TRANSIENT_REFERENCE_FAILURE = retryable
INVALID_REFERENCE_REQUEST = non-retryable
```

B6 deployment design deliberately remains:

```text
INCOMPLETE_ENVIRONMENT_REALIZATION
```

because B6 does not fake an actual Namespace, Worker artifact, Task Queue/type registration, deployment attempt, runtime observation, or Workflow execution.

Evidence:

```text
test/95-B6-EXECUTION-TEMPORAL-POLICY-DEPLOYMENT-IMPLEMENTATION-RESULT-v0.1.md
```

# B7 — current partial state

## Reference provider lane

Implemented:

```text
ReferenceEmailSinkService
```

Provider proof:

```text
exact B6 idempotency-key derivation     ✅
transient failure injection             ✅
permanent invalid-request failure       ✅
logical effect uniqueness               ✅
duplicate-identical handling            ✅
provider SQLite restart durability      ✅
provider executable tests               ✅ 6/6
architecture boundary                   ✅ 16 modules / 0 errors
```

The provider writes only to:

```text
.runtime/reference-email-sink.sqlite
```

and never to Talos semantic/design storage.

## Temporal SDK / Worker lane

Official verification on 2026-08-19 corrected the planned Temporal TypeScript SDK family to exact version:

```text
@temporalio/common    1.21.1
@temporalio/client    1.21.1
@temporalio/worker    1.21.1
@temporalio/workflow  1.21.1
@temporalio/activity  1.21.1
@temporalio/testing   1.21.1
```

The previous planned `1.22.0` values were never promoted into implementation code.

Current hard gate:

```text
trustworthy transitive npm lock          ⛔ REQUIRED
@temporalio/* package.json promotion     ⛔ PENDING LOCK
@temporalio/* source imports             ⛔ CLOSED
Workflow / Activity wrapper / Worker     ⛔ NOT STARTED
```

Talos will not commit a fabricated/incomplete lock merely to bypass this boundary.

Evidence:

```text
test/96-B7-TEMPORAL-SDK-REFERENCE-PROVIDER-PARTIAL-RESULT-v0.1.md
```

# Persistence isolation

Reference local runtime uses two physically separate databases:

```text
.runtime/talos-state.sqlite
.runtime/reference-email-sink.sqlite
```

Talos immutable repositories use only the first. The reference provider uses only the second.

Workflow code is forbidden from directly accessing either database, filesystem, HTTP/provider calls, or mutable/latest Talos design.

# Still not authorized

```text
BPMN/image/language/n8n production adapter implementation
real Gmail/Drive/SaaS provider integration
production IAM/secrets
production Temporal deployment
multi-user collaboration expansion
broad provider/source expansion
```

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.27.md
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.3.md
plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.2.md
```

## Immediate next move

```text
resolve trustworthy npm lock for exact Temporal 1.21.1 family
→ promote locked dependencies
→ implement TalosReferenceApprovalWorkflow
→ implement sendReferenceConfirmation Activity wrapper
→ build real reference Worker artifact
```
