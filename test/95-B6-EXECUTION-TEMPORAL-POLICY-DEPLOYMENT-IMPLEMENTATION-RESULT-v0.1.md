# TALOS — B6 Execution / Temporal Mapping / Runtime Policy / Deployment Implementation Result v0.1

Status: **B6 IMPLEMENTATION PASS / GATE CLOSURE EVIDENCE**  
Date: **2026-08-19**

## Scope

B6 implements the frozen Phase-5 design domains inside the bounded reference slice without starting Temporal runtime execution:

```text
ExecutionPlan
→ Temporal mapping design
→ Runtime safety/policy design
→ Deployment design intent
```

Authorized implementation path remains:

```text
build/reference-vertical-slice/
```

No broad product BUILD is authorized.

## Implemented packages

```text
packages/execution/
packages/temporal-design/
packages/runtime-policy/
packages/deployment/
packages/application/src/execution-design.ts
```

The domain packages contain no `@temporalio/*` imports. Temporal SDK entry remains reserved for B7 runtime boundaries.

## Reference execution handoff

The frozen PR2 / automation-design handoff produces distinct execution identities for:

```text
Request submitted          → COORDINATION_STEP
Review request              → HUMAN_COORDINATION
Approved?                   → DECISION_COORDINATION
Send confirmation email     → CAPABILITY_INVOCATION
Completed / Rejected        → COMPLETION_COORDINATION
```

`CapabilityBindingRevision` remains distinct from `CapabilityUseOccurrence`.

The B5 logical email input is carried forward without inventing a recipient value:

```text
ExecutionDataDependency
  dataRef = notificationRecipientEmail
  dataKind = EXECUTION_INPUT
  requiredness = REQUIRED
  valueState = REQUIRED_AT_EXECUTION

notificationRecipientEmail
→ CapabilityInputFieldRequirement(recipientEmail)
→ CapabilityInputMapping(recipientEmail → REFERENCE_EMAIL_SINK input.to)
```

No address or `.test` runtime value exists in B6 design artifacts.

## Reference Temporal mapping design

Explicit derived mapping:

```text
root execution scope        → one Workflow boundary candidate
start coordination          → WORKFLOW_LOGIC
human review                → UPDATE_HANDLER + WORKFLOW_CONDITION
business decision           → WORKFLOW_LOGIC
email capability occurrence → ACTIVITY
business completion         → WORKFLOW_LOGIC
```

The human mapping is reference-specific because the reference client requires tracked validation plus acknowledgement/result. It is not a universal rule that human interaction becomes a Temporal Update.

The email maps to Activity because the selected capability performs an external side effect that can fail independently, not because a canonical/business action automatically becomes an Activity.

No Child Workflow is created.

## Reference RuntimePolicy

Email Activity:

```text
RetryPolicyDesign
  retryMode = EXPLICIT_CUSTOM
  initialInterval = 250ms
  backoffCoefficient = 2.0
  maximumInterval = 1s
  maximumAttempts = 3
  INVALID_REFERENCE_REQUEST = non-retryable

TimeoutPolicyDesign
  startToClose = 5s
  scheduleToClose = 10s

IdempotencyPolicyDesign
  requirement = REQUIRED
  strategy = IDEMPOTENCY_KEY
  key contract = sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
  enforcement = REFERENCE_EMAIL_SINK_UNIQUE_EFFECT_STORE

FailureClassificationPolicy
  TRANSIENT_REFERENCE_FAILURE = retryable technical failure
  INVALID_REFERENCE_REQUEST = non-retryable technical failure
```

Workflow execution retry design is explicit:

```text
EXPLICIT_CUSTOM
maximumAttempts = 1
```

A versioned `TemporalDefaultBehaviorProfile` is preserved for explainability, while material policy uses no `TemporalDefaultAcceptance`:

```text
defaultAcceptances = []
```

## Deployment design boundary

B6 deliberately does **not** manufacture runtime realization evidence.

Desired TEST design intent:

```text
environmentClass        = TEST
desired namespace key   = talos-reference
desired Task Queue key  = talos-reference-main
desired Workflow Type   = TalosReferenceApprovalWorkflow
desired Activity Type   = sendReferenceConfirmation
desired worker logical  = talos-reference-worker
```

Actual runtime identities remain unresolved.

`TemporalNamespaceResolutionContract` records:

```text
resolutionPolicy = USE_REQUESTED_IF_AVAILABLE_ELSE_RECORD_ACTUAL_PRECREATED
resolutionState  = RESOLUTION_REQUIRED
```

B6 therefore creates no concrete:

```text
WorkerArtifactBinding
TaskQueueBinding
WorkflowTypeBinding
ActivityTypeBinding
DeploymentAttempt
DeploymentObservation
WorkflowExecutionObservation
```

Deployment assessment is intentionally:

```text
INCOMPLETE_ENVIRONMENT_REALIZATION
```

and explicitly not:

```text
READY_FOR_DEPLOYMENT_ATTEMPT
```

B7/B9 must later produce actual Worker/runtime/environment evidence and new realization/deployment history.

## Executable B6 test result

Executed locally on the pinned reference Node line:

```text
Node v22.16.0
npm 10.9.2
```

Command:

```text
node --experimental-strip-types --test \
  build/reference-vertical-slice/tests/b6-execution-temporal-deployment.test.ts
```

Result:

```text
TOTAL 14
PASS  14
FAIL   0
```

Coverage includes:

```text
cross-layer identity separation
recipient non-invention
human Update + Workflow-condition composite mapping
single external email Activity mapping
no Child Workflow
Temporal feature compatibility
exact retry / timeout policy
explicit Workflow retry policy
idempotency + failure classification
incomplete deployment realization
no fake Worker / Task Queue / type bindings
no attempt / observation / execution laundering
deterministic B6 digests / IDs
mismatched-upstream rejection
SQLite close/reopen durability
```

SQLite restart proof persisted B6 immutable artifacts, closed the database, reopened it, recovered the exact `DeploymentRevision`, and verified that no `DeploymentAttempt` record existed.

## Architecture guard

A local structural execution of the repository's declared module-boundary model passed:

```text
MODULE BOUNDARIES 16
STATUS            PASS
ERRORS            0
```

The local harness does not contain a Git checkout, so frozen Git-blob recomputation is not claimed there. The committed `verify-architecture.mjs` continues to enforce exact frozen blob SHAs in a real repository checkout.

## Prior-stage regression evidence

Previously closed B2→B5 executable evidence remains:

```text
77 / 77 PASS
```

B6 did not alter Phase-2/3/4 semantic implementation logic. The new root workspace runner now exposes:

```text
npm run b6:verify
```

which, in a real checkout, executes architecture verification plus B1→B6 test suites.

This document does not falsely claim that the earlier 77 cases were re-executed in the local non-checkout harness during this B6 run.

## Gate verdict

```text
B6 ExecutionPlan                     ✅ CLOSED
B6 Temporal mapping design           ✅ CLOSED
B6 Runtime policy design             ✅ CLOSED
B6 Deployment design intent          ✅ CLOSED

ACTUAL TEMPORAL WORKER/RUNTIME        ⛔ NOT B6
ACTUAL DEPLOYMENT ATTEMPT             ⛔ NOT CREATED
ACTUAL RUNTIME OBSERVATION            ⛔ NOT CREATED
```

**B6 PASS. Open B7 only at the bounded Temporal Worker / reference-provider runtime boundary.**
