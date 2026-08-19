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
- Node.js **22.16.x** (the reference workspace accepts `>=22.16.0 <23`)
- npm 10.x recommended
- Internet access on first setup/start

The reference app uses `@temporalio/testing` to start a local Temporal development server. On a machine that does not already have the Temporal test server cached, the first run may download the Temporal CLI/test-server binary.

Docker and Temporal Cloud credentials are **not required** for this reference version.

## Run it

From your local TALOS repository:

```bash
git pull
cd build/reference-vertical-slice
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

## Local runtime files

The app creates only local ignored runtime state under:

```text
build/reference-vertical-slice/.runtime/
```

including two physically separate databases:

```text
.runtime/talos-state.sqlite
.runtime/reference-email-sink.sqlite
```

The first stores immutable TALOS reference artifacts. The second stores only TEST_ONLY provider effects.

To reset the local reference state, stop the app and delete:

```text
build/reference-vertical-slice/.runtime/
```

## Stop it

Press:

```text
Ctrl+C
```

The reference app shuts down the HTTP server, Temporal Worker, reference provider, local Temporal environment and Talos SQLite store.

## Verified gate

Current GitHub CI evidence:

```text
test/103-B7-B9-TEMPORAL-RUNTIME-CI-RESULT.md      PASS
test/104-B8-TRYABLE-REFERENCE-APP-CI-RESULT-v0.1.md PASS
```

The tryable-app smoke gate verifies both approved and rejected browser/API paths against a real local Temporal server and Worker.
