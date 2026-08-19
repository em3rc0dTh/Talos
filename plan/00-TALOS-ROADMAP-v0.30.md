# TALOS — Gated Roadmap v0.30

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.29.md` for active planning. Historical versions remain preserved.

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

# B7 — Temporal Worker / Reference Provider

```text
STATUS                              🟡 OPEN / SDK LOCK GATE
PRE-SDK BOUNDARY                    ✅ COMPLETE
```

## Exact Temporal dependency baseline

Active family:

```text
@temporalio/common    1.22.0
@temporalio/client    1.22.0
@temporalio/worker    1.22.0
@temporalio/workflow  1.22.0
@temporalio/activity  1.22.0
@temporalio/testing   1.22.0
```

All packages must remain on the same exact version.

Active baseline:

```text
build/reference-vertical-slice/dependencies/dependency-baseline.json
```

Freshness correction:

```text
test/97-B7-TEMPORAL-SDK-BASELINE-CORRECTION-v0.1.md
```

## Reference provider — PASS

Current provider request:

```text
referenceRequestId
capabilityUseOccurrenceId
to
```

`to` is the only B5/B6 mapped provider business input. IDs are runtime/idempotency context.

Provider owns TEST_ONLY confirmation copy and first-effect timestamp.

Idempotency:

```text
sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
```

Duplicate equality ignores later invocation timestamps and compares the logical request. This preserves one logical effect when an Activity is retried after a lost completion acknowledgement.

Provider executable result:

```text
7 / 7 PASS
```

Evidence:

```text
test/99-B7-REFERENCE-PROVIDER-RETRY-IDEMPOTENCY-HARDENING-v0.1.md
```

## Compiled pre-SDK Worker contract — PASS

Package:

```text
workers/reference-temporal-worker/
```

The package currently contains **no Temporal SDK imports**.

It compiles exact B6 artifacts into:

```text
CompiledReferenceRuntimeProgram
```

Pinned lineage:

```text
ExecutionPlanRevision
TemporalMappingRevision
RuntimePolicyRevision
DeploymentRevision design intent
TemporalFeatureProfile
Temporal SDK target = 1.22.0
```

Pinned material policy:

```text
Activity retry      250ms / 2.0 / 1000ms / attempts 3
Activity timeouts   5000ms / 10000ms
non-retryable type  INVALID_REFERENCE_REQUEST
Workflow attempts   1
idempotency key     exact B6 SHA-256 contract
provider enforcement REFERENCE_EMAIL_SINK_UNIQUE_EFFECT_STORE
```

Runtime value separation:

```text
ReferenceWorkflowInput
  referenceRequestId
  notificationRecipientEmail
  immutable compiled program
```

Concrete recipient is runtime input only and never enters the compiled design digest.

Human state machine:

```text
PENDING
  ├─ APPROVED → SEND_CONFIRMATION
  └─ REJECTED → COMPLETE_REJECTED

post-finalization Update
→ REVIEW_ALREADY_FINALIZED
```

Worker/state contract result:

```text
10 / 10 PASS
```

Evidence:

```text
test/100-B7-PRE-SDK-WORKER-CONTRACT-RESULT-v0.1.md
```

## Neutral Activity adapter — PASS

`src/sdk-adapter-contract.ts` proves the future SDK boundary without importing Temporal.

Activity options contract:

```text
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
→ { referenceRequestId, capabilityUseOccurrenceId, to }
```

Concrete provider errors are classified into the frozen B6 failure vocabulary before the future Temporal `ApplicationFailure` realization.

Adapter tests:

```text
3 / 3 PASS
```

Evidence:

```text
test/101-B7-PRE-SDK-ACTIVITY-ADAPTER-CONTRACT-v0.1.md
```

## B7 pre-SDK executable total

```text
reference provider                  7 / 7
Worker/state contract              10 / 10
Activity adapter contract           3 / 3
────────────────────────────────────────
TOTAL                              20 / 20
FAIL                                0

architecture DAG                   PASS — 16 modules / 0 errors
@temporalio source imports          0
```

Root partial verifier:

```text
npm run b7:partial:verify
```

Root `npm test` remains intentionally pinned to B6 until B7 actually closes.

# Mechanical Temporal lock gate

Verifier:

```text
scripts/verify-b7-temporal-lock.mjs
```

Commands:

```text
npm run b7:lock:status
npm run b7:lock:verify
```

Current machine state:

```text
PENDING_SAFE
```

Meaning:

```text
exact 1.22.0 baseline          ✅
Temporal package promotions    0
Temporal source imports        0
lockReady                      false
errors                         0
```

`b7:lock:verify` intentionally exits `2` while safely pending.

The gate becomes `READY` only when all six exact packages are promoted and the full package lock contains matching version/resolved/integrity entries.

Any partial promotion, mixed version or Temporal import before a trustworthy lock is `FAIL`.

Evidence:

```text
test/102-B7-TEMPORAL-LOCK-GATE-RESULT-v0.1.md
```

# Remaining hard blocker

The current execution environment cannot reliably resolve `registry.npmjs.org`. Therefore a trustworthy transitive npm lock cannot be generated here.

Talos will not fabricate one.

Required before first actual SDK source import:

```text
b7:lock:verify → READY
```

Only after that may B7 implement:

```text
defineUpdate + setHandler validator
Workflow condition
proxyActivities with compiled options
ApplicationFailure realization
Worker.create
```

The actual Worker must consume the compiled runtime program; it may not redefine B6 policy constants.

Workflow code remains forbidden from direct access to:

```text
Talos SQLite
reference provider SQLite
filesystem
HTTP/provider calls
latest mutable Talos design
```

B9 remains the first stage allowed to claim Temporal-server-backed Workflow execution evidence.

## Remaining stages

```text
B7 Temporal worker/reference provider            🟡 OPEN — LOCK GATE
B8 minimal reference API/web                     ⛔ CLOSED
B9 actual Temporal E2E runtime + evidence        ⛔ CLOSED
B10 failure/retry/restart/lineage closure        ⛔ CLOSED
```

## Immediate next move

```text
NETWORK-CAPABLE B7 DEPENDENCY RUN
→ generate trustworthy npm lock for exact Temporal 1.22.0 family
→ b7:lock:verify = READY
→ promote/commit SDK dependency lock
→ implement actual Workflow / Activity wrapper / Worker
```
