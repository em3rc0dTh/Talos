# TALOS Reference Vertical Slice v0.1 — TRY ME

Status: **TRYABLE REFERENCE VERSION**

This is the first intentionally small TALOS version that can be run by a person from browser input through a real Temporal Workflow.

It is **not** the broad TALOS product and it does not yet implement BPMN/image/language/n8n production adapters or real SaaS providers.

## What this version proves

```text
native Talos Canvas source
        ↓
actor = UNKNOWN preserved
        ↓
canonical + provenance + semantic validation
        ↓
SV-ACT-001 / INSUFFICIENT_DETAIL
        ↓
explicit review correction: actor = Manager
        ↓
new source/canonical/validation history
        ↓
AUTOMATION_DESIGN_HANDOFF semantic freeze
        ↓
capability + human/form + reference provider binding
        ↓
ExecutionPlan
        ↓
Temporal mapping
        ↓
runtime retry/timeout/idempotency policy
        ↓
deployment design
        ↓
real local Temporal server + Worker
        ↓
real Workflow Update
        ↓
real Activity
        ↓
reference provider effect
        ↓
server-backed Workflow history
```

## Requirements

- Git
- Node.js **22.16+ on Node 22** or **Node 24.x**
  - accepted engine range: `>=22.16.0 <23 || >=24.0.0 <25`
- npm 10/11
- Internet access on first setup/start

The reference app uses `@temporalio/testing` to start a local Temporal development server. On a machine that does not already have the Temporal test server cached, the first run may download the Temporal CLI/test-server binary.

Docker and Temporal Cloud credentials are **not required** for this reference version.

## Run it

From the TALOS repository root:

```bash
git pull
cd build/reference-vertical-slice
npm ci
npm run demo
```

If your PowerShell prompt already ends in:

```text
...\Talos\build\reference-vertical-slice>
```

do **not** run `cd build/reference-vertical-slice` again. Just run:

```powershell
git pull
npm ci
npm run demo
```

When the terminal prints:

```text
TALOS reference vertical slice is ready: http://127.0.0.1:8787
```

open:

```text
http://127.0.0.1:8787
```

## What to try

### 1. Inspect the Talos baseline

The left side should show that the original reference source contains:

```text
Review request
actor = UNKNOWN
```

and that validation produced the missing-responsibility finding before the explicit correction to:

```text
actor = Manager
```

The UI also shows the accepted freeze, reference provider binding, and Temporal mapping used by the runtime.

### 2. Start a request

Use any syntactically valid test address, for example:

```text
demo@example.test
```

Click **Start process**.

A real Temporal Workflow starts and waits for the manager-review Update.

### 3. Approve it

Add an optional comment and click **Approve**.

For the reference version, the provider deliberately injects one transient failure on the first email Activity attempt.

Expected behavior:

```text
Activity attempt 1
→ TRANSIENT_REFERENCE_FAILURE
→ Temporal retry
→ Activity attempt 2 succeeds
→ exactly one reference provider effect exists
→ Workflow COMPLETED
```

No real email is sent. `REFERENCE_EMAIL_SINK` is a TEST_ONLY provider that records the effect in a separate local SQLite database.

### 4. Reject another request

Start another process and click **Reject**.

Expected behavior:

```text
Workflow REJECTED
email Activity is never scheduled
provider effect count for that request = 0
```

## Local runtime files and restart behavior

The app creates local ignored runtime state under:

```text
build/reference-vertical-slice/.runtime/
```

including two physically separate databases:

```text
.runtime/talos-state.sqlite
.runtime/reference-email-sink.sqlite
```

The first stores immutable TALOS reference artifacts. The second stores only TEST_ONLY provider effects.

You may stop and restart the demo **without deleting `.runtime`**. The reference bootstrap reuses the successful source interpretation and rehydrates the historical Manager correction as an idempotent review replay instead of creating duplicate semantic history.

Deleting `.runtime/` is now only an explicit reset operation—not a restart requirement.

## Stop it

Press:

```text
Ctrl+C
```

The reference app shuts down the HTTP server, Temporal Worker, reference provider, local Temporal environment and Talos SQLite store.

The local Temporal development server may emit low-level cancellation/context-cancelled warnings while its ephemeral process is being torn down. B10 separately verifies that the Worker reaches STOPPED and that the same runtime directory can start successfully again on both Node 22.16 and Node 24.11.

## Verified gates

Current GitHub evidence:

```text
test/103-B7-B9-TEMPORAL-RUNTIME-CI-RESULT.md             PASS
test/104-B8-TRYABLE-REFERENCE-APP-CI-RESULT-v0.1.md      PASS
test/106-USER-HANDS-ON-APPROVED-RUNTIME-RESULT-v0.1.md   PASS
test/107-B10-RESTART-REPLAY-SAFETY-RESULT-v0.1.md        PASS
```

The tryable-app gate verifies approved/rejected paths against a real local Temporal server and Worker. The B10 restart matrix verifies the same persisted TALOS runtime directory can close and start again without duplicate semantic history on Node 22.16 and Node 24.11.
