# TALOS — B7 Pre-SDK Worker Contract Result v0.1

Status: **B7 PRE-SDK WORKER CONTRACT PASS / SDK IMPORT GATE STILL CLOSED**  
Date: **2026-08-19**

## Purpose

Define and execute the immutable runtime-program/state-machine boundary that the future Temporal TypeScript Worker must implement, without importing Temporal before the exact npm lock gate is satisfied.

Implementation path:

```text
build/reference-vertical-slice/workers/reference-temporal-worker/
```

This is a reference-runtime contract package, not yet a Temporal Worker artifact.

## Compiled runtime program

`compileReferenceRuntimeProgram(...)` consumes exact immutable B6 artifacts:

```text
ExecutionPlanRevision
TemporalMappingRevision
RuntimePolicyRevision
DeploymentRevision design intent
Temporal SDK target
```

It rejects incompatible lineage and pins:

```text
executionPlanRevisionRef
temporalMappingRevisionRef
runtimePolicyRevisionRef
deploymentRevisionRef
temporalFeatureProfileRef
```

The compiler derives human mapping from the actual `HUMAN_COORDINATION` execution subject and requires both:

```text
UPDATE_HANDLER
WORKFLOW_CONDITION
```

It does not rely on a convenient mapping-group display name.

## Compiled material runtime policy

The program contains the exact B6 material values:

```text
Activity:
  initialIntervalMs = 250
  backoffCoefficient = 2
  maximumIntervalMs = 1000
  maximumAttempts = 3
  nonRetryableErrorTypes = [INVALID_REFERENCE_REQUEST]

Timeout:
  startToCloseMs = 5000
  scheduleToCloseMs = 10000

Idempotency:
  strategyKind = IDEMPOTENCY_KEY
  keyContract = sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
  enforcementRef = REFERENCE_EMAIL_SINK_UNIQUE_EFFECT_STORE

Workflow maximumAttempts = 1
```

No hidden runtime constants are introduced by this compiler.

## Runtime data separation

Compiled program contains no concrete email address.

Actual Workflow input is separate:

```text
referenceRequestId
notificationRecipientEmail
program = immutable compiled runtime program
```

Therefore:

```text
runtime recipient value != semantic/capability/execution-design truth
```

## Deterministic human state machine

Initial state:

```text
reviewOutcome = PENDING
```

Accepted Update outcomes:

```text
APPROVED
REJECTED
```

State transitions:

```text
PENDING + APPROVED → APPROVED → SEND_CONFIRMATION
PENDING + REJECTED → REJECTED → COMPLETE_REJECTED
```

After finalization, duplicate or contradictory review submissions are rejected with:

```text
REVIEW_ALREADY_FINALIZED
```

Invalid payload is rejected with:

```text
INVALID_REVIEW_SUBMISSION
```

This state machine is deterministic and has no database/filesystem/network access.

## Provider failure translation contract

Pre-SDK translation remains constrained to B6 failure classes:

```text
TRANSIENT_REFERENCE_FAILURE
→ ApplicationFailure type TRANSIENT_REFERENCE_FAILURE
→ nonRetryable = false

INVALID_REFERENCE_REQUEST
→ ApplicationFailure type INVALID_REFERENCE_REQUEST
→ nonRetryable = true

IDEMPOTENCY_CONFLICT
→ ApplicationFailure type INVALID_REFERENCE_REQUEST
→ nonRetryable = true

unexpected provider technical failure
→ TRANSIENT_REFERENCE_FAILURE
→ nonRetryable = false
```

The future Activity wrapper must use the official Temporal API to realize this translation after the dependency/lock gate opens.

## Deployment intent remains unresolved

Compiled program preserves:

```text
environmentClass = TEST
desiredNamespaceKey = talos-reference
desiredTaskQueueKey = talos-reference-main
desiredWorkerLogicalName = talos-reference-worker
realizationState = INCOMPLETE_ENVIRONMENT_REALIZATION
```

No actual Namespace locator, Worker artifact, TaskQueueBinding or deployment observation is invented.

## SDK boundary

The pre-SDK Worker source contains:

```text
0 @temporalio/* imports
```

This is intentional. Active dependency baseline is exact Temporal TypeScript SDK `1.22.0`, but the trustworthy transitive npm lock remains unresolved in the current environment.

## Executable result

Combined local execution:

```text
provider runtime tests          7 / 7
pre-SDK Worker contract tests  10 / 10
────────────────────────────────────
TOTAL                           17 / 17
FAIL                             0
```

Worker-contract coverage:

```text
exact B6 lineage + SDK target pinning
exact Activity/Workflow policy compilation
deployment intent without runtime fabrication
deterministic program digest
runtime recipient separation
one-way human review finalization
rejected branch/no-email action
bounded provider failure translation
zero Temporal imports before lock
mismatched lineage rejection
```

## Gate verdict

```text
B7 provider runtime                   ✅ PASS
B7 pre-SDK Worker contract            ✅ PASS
B7 exact Temporal baseline 1.22.0     ✅
B7 trustworthy npm transitive lock    ⛔ PENDING
B7 @temporalio source import          ⛔ CLOSED
B7 real Worker artifact               ⛔ NOT CREATED
B7 Temporal runtime execution         ⛔ NOT CLAIMED
```

**B7 remains OPEN / PARTIAL.**
