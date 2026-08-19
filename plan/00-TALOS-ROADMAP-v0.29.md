# TALOS — Gated Roadmap v0.29

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.28.md` for active planning. Historical versions remain preserved.

## Design / architecture

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

## Phase 6 — Reference Vertical Slice

Authorized implementation path only:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

### Closed stages

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
B4 Explanation / Review / Correction / Freeze     ✅ CLOSED — 13/13
B5 Capability / Human / Form / Binding             ✅ CLOSED — 12/12
B6 Execution / Mapping / Policy / Deployment      ✅ CLOSED — 14/14 B6
```

Prior B2→B5 evidence remains `77 / 77 PASS`.

## B7 — Temporal Worker / Reference Provider

```text
STATUS                              🟡 OPEN / PRE-SDK BOUNDARY COMPLETE
```

### Active Temporal dependency truth

Exact verified family:

```text
@temporalio/common    1.22.0
@temporalio/client    1.22.0
@temporalio/worker    1.22.0
@temporalio/workflow  1.22.0
@temporalio/activity  1.22.0
@temporalio/testing   1.22.0
```

All packages must stay on the same version.

Active dependency baseline:

```text
build/reference-vertical-slice/dependencies/dependency-baseline.json
```

Freshness correction evidence:

```text
test/97-B7-TEMPORAL-SDK-BASELINE-CORRECTION-v0.1.md
```

### Reference provider — PASS

Provider request is now exactly:

```text
referenceRequestId
capabilityUseOccurrenceId
to
```

Only `to` is the B5/B6 logical provider input. IDs are execution/idempotency context.

The TEST_ONLY provider owns fixed confirmation copy and the first-effect timestamp.

Idempotency:

```text
key = sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)

duplicate equality = same key + same logical provider request
first-effect timestamp is NOT duplicate identity
```

This allows a later identical retry after a lost completion acknowledgement to remain:

```text
DUPLICATE_IDENTICAL
logical effect rows = 1
```

Provider result:

```text
7 / 7 PASS
```

Evidence:

```text
test/99-B7-REFERENCE-PROVIDER-RETRY-IDEMPOTENCY-HARDENING-v0.1.md
```

### Pre-SDK Worker runtime program — PASS

Implemented:

```text
workers/reference-temporal-worker/
  src/contracts.ts
  src/compile-runtime-program.ts
  src/state-machine.ts
  src/sdk-adapter-contract.ts
```

No `@temporalio/*` import exists yet.

`CompiledReferenceRuntimeProgram` pins exact:

```text
ExecutionPlanRevision
TemporalMappingRevision
RuntimePolicyRevision
DeploymentRevision design intent
TemporalFeatureProfile
SDK target 1.22.0
```

It compiles—not reinvents—the B6 material policy:

```text
Activity retry: 250ms / 2.0 / 1000ms / attempts 3
nonRetryableErrorTypes: INVALID_REFERENCE_REQUEST
Activity timeouts: 5000ms / 10000ms
Workflow maximumAttempts: 1
idempotency key contract exact
idempotency enforcement ref exact
```

Runtime recipient remains outside compiled design truth:

```text
ReferenceWorkflowInput
  referenceRequestId
  notificationRecipientEmail
  program
```

Human state machine:

```text
PENDING
  ├─ APPROVED → SEND_CONFIRMATION
  └─ REJECTED → COMPLETE_REJECTED

any later duplicate/contradictory submission
→ REVIEW_ALREADY_FINALIZED
```

Worker/state tests:

```text
10 / 10 PASS
```

Evidence:

```text
test/100-B7-PRE-SDK-WORKER-CONTRACT-RESULT-v0.1.md
```

### Neutral Activity adapter contract — PASS

Without importing the SDK, the adapter proves the future Temporal Activity boundary:

```text
ActivityOptions-compatible fields
  startToCloseTimeout = 5000
  scheduleToCloseTimeout = 10000
  retry.initialInterval = 250
  retry.backoffCoefficient = 2
  retry.maximumInterval = 1000
  retry.maximumAttempts = 3
  retry.nonRetryableErrorTypes = [INVALID_REFERENCE_REQUEST]
```

Provider request derivation:

```text
Workflow referenceRequestId
+ compiled capabilityUseOccurrenceId
+ runtime notificationRecipientEmail
→ provider { referenceRequestId, capabilityUseOccurrenceId, to }
```

Provider failure translation remains bounded to:

```text
TRANSIENT_REFERENCE_FAILURE
INVALID_REFERENCE_REQUEST
```

Adapter tests:

```text
3 / 3 PASS
```

Evidence:

```text
test/101-B7-PRE-SDK-ACTIVITY-ADAPTER-CONTRACT-v0.1.md
```

### Current B7 executable result

```text
provider runtime                  7 / 7
pre-SDK Worker/state contract    10 / 10
pre-SDK Activity adapter          3 / 3
────────────────────────────────────────
TOTAL                            20 / 20
FAIL                              0

architecture module DAG          PASS — 16 modules / 0 errors
@temporalio source imports        0
```

The root workspace has:

```text
npm run b7:partial:verify
```

for this boundary. Root `npm test` intentionally remains pinned to the last fully closed stage, B6.

## Remaining hard gate

The current execution environment cannot reliably resolve `registry.npmjs.org`, therefore a trustworthy full transitive npm lock cannot be generated here.

Required before first Temporal SDK source import:

```text
exact dependency baseline                     ✅ 1.22.0
pre-SDK runtime program/adapter contract       ✅
trustworthy npm transitive lock                ⛔ PENDING
package.json @temporalio promotion             ⛔ PENDING LOCK
@temporalio/* source imports                   ⛔ CLOSED
```

No fabricated/manual incomplete lock is authorized.

## First implementation after lock gate opens

Only then may B7 add actual SDK code:

```text
defineUpdate + setHandler validator
Workflow condition
proxyActivities with compiled Activity options
ApplicationFailure translation
Worker.create
```

The actual Worker must consume the compiled immutable runtime program and may not independently redefine B6 policy constants.

Workflow code remains forbidden from direct:

```text
Talos SQLite
reference provider SQLite
filesystem
HTTP/provider calls
latest mutable Talos design
```

B9 remains the first stage that may claim Temporal-server-backed Workflow execution evidence.

## Remaining stages

```text
B7 Temporal worker/reference provider            🟡 OPEN — SDK LOCK GATE
B8 minimal reference API/web                     ⛔ CLOSED
B9 actual Temporal E2E runtime + evidence        ⛔ CLOSED
B10 failure/retry/restart/lineage closure        ⛔ CLOSED
```

## Immediate next move

```text
VERIFY B7 LOCK GATE MECHANICALLY
→ obtain trustworthy npm lock for exact Temporal 1.22.0 family in network-capable environment
→ promote exact SDK packages
→ implement actual Workflow / Activity wrapper / Worker
```
