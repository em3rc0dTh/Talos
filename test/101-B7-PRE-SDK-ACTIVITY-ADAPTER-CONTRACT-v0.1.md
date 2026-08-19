# TALOS — B7 Pre-SDK Activity Adapter Contract v0.1

Status: **B7 PRE-SDK ADAPTER PASS / TEMPORAL IMPORT GATE STILL CLOSED**  
Date: **2026-08-19**

## Purpose

Reduce the future Temporal SDK wrapper to a thin realization layer by proving its Activity options, provider request and provider-failure classification before any `@temporalio/*` source import is allowed.

Implementation:

```text
build/reference-vertical-slice/workers/reference-temporal-worker/src/sdk-adapter-contract.ts
```

No Temporal package is imported.

## Activity options contract

The neutral adapter assembles the exact field shape expected by the verified Temporal TypeScript 1.22 Activity/Retry APIs:

```text
startToCloseTimeout
scheduleToCloseTimeout
retry.initialInterval
retry.backoffCoefficient
retry.maximumInterval
retry.maximumAttempts
retry.nonRetryableErrorTypes
```

Values come only from the compiled immutable B6 runtime program:

```text
startToCloseTimeout = 5000
scheduleToCloseTimeout = 10000
initialInterval = 250
backoffCoefficient = 2
maximumInterval = 1000
maximumAttempts = 3
nonRetryableErrorTypes = [INVALID_REFERENCE_REQUEST]
```

No Worker source constant independently redefines these values.

## Provider request derivation

Future Activity invocation derives exactly:

```text
referenceRequestId
capabilityUseOccurrenceId
to
```

from:

```text
Workflow runtime input.referenceRequestId
compiled program.activity.capabilityUseOccurrenceRef
Workflow runtime input.notificationRecipientEmail
```

No subject/body/timestamp or hidden business input is introduced.

## Concrete provider failure classification

Concrete provider exceptions classify as:

```text
ReferenceEmailTransientFailureError
→ TRANSIENT_REFERENCE_FAILURE
→ retryable

ReferenceEmailInvalidRequestError
→ INVALID_REFERENCE_REQUEST
→ non-retryable

ReferenceEmailIdempotencyConflictError
→ IDEMPOTENCY_CONFLICT
→ translated to INVALID_REFERENCE_REQUEST
→ non-retryable

unknown provider exception
→ UNEXPECTED_REFERENCE_PROVIDER_FAILURE
→ translated to TRANSIENT_REFERENCE_FAILURE
→ retryable under bounded reference policy
```

After the lock gate opens, the SDK wrapper may realize this neutral specification using the official Temporal `ApplicationFailure` API. It may not reinterpret the classification.

## Executable result

New adapter-contract tests:

```text
TOTAL 3
PASS  3
FAIL   0
```

Combined current B7 pre-SDK executable boundary:

```text
reference provider                 7 / 7
pre-SDK Worker/state contract     10 / 10
pre-SDK Activity adapter contract  3 / 3
────────────────────────────────────────
TOTAL                             20 / 20
FAIL                               0
```

Architecture structural check remains:

```text
16 modules
PASS
0 errors
```

## Gate state

```text
exact Temporal baseline 1.22.0      ✅
provider runtime                      ✅
compiled runtime program             ✅
deterministic human state machine    ✅
neutral Activity options contract    ✅
neutral provider request mapping     ✅
neutral failure translation          ✅
@temporalio source imports           0

trustworthy npm transitive lock      ⛔ PENDING
real Temporal Worker artifact        ⛔ NOT CREATED
server-backed runtime execution      ⛔ NOT CLAIMED
```

**B7 remains OPEN / PARTIAL.**
