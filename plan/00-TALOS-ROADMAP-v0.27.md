# TALOS — Gated Roadmap v0.27

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.26.md` for active planning. Historical versions remain preserved.

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

### Closed BUILD stages

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
B4 Explanation / Review / Correction / Freeze     ✅ CLOSED — 13/13
B5 Capability / Human / Form / Binding             ✅ CLOSED — 12/12
B6 Execution / Mapping / Policy / Deployment      ✅ CLOSED — 14/14 B6
```

Prior B2→B5 executable evidence remains `77 / 77 PASS`.

B6 evidence:

```text
test/95-B6-EXECUTION-TEMPORAL-POLICY-DEPLOYMENT-IMPLEMENTATION-RESULT-v0.1.md
```

## B7 — Temporal Worker / Reference Provider

```text
STATUS                              🟡 OPEN / PARTIAL
```

B7 currently has two separate lanes.

### A — Reference provider

```text
REFERENCE_EMAIL_SINK service             ✅ IMPLEMENTED
idempotency key contract                 ✅ sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
transient failure injection              ✅
permanent invalid-request failure        ✅
single-effect / duplicate protection     ✅
provider SQLite restart durability       ✅
provider executable tests                ✅ 6/6
architecture boundary                    ✅ 16 modules / 0 errors
```

Evidence:

```text
test/96-B7-TEMPORAL-SDK-REFERENCE-PROVIDER-PARTIAL-RESULT-v0.1.md
```

The concrete `receiver@example.test` fixture exists only in B7 provider tests. It does not become semantic/capability/execution-design truth.

### B — Temporal SDK / Worker

Official verification on 2026-08-19 established the current Temporal TypeScript SDK family as:

```text
@temporalio/common    1.21.1
@temporalio/client    1.21.1
@temporalio/worker    1.21.1
@temporalio/workflow  1.21.1
@temporalio/activity  1.21.1
@temporalio/testing   1.21.1
```

All Temporal packages must stay on the same version.

The old planned `1.22.0` values were never promoted and have been corrected in:

```text
build/reference-vertical-slice/dependencies/dependency-baseline.json
```

The v1.21.1 source verifies the frozen B6 Update mapping can use:

```text
defineUpdate
setHandler
```

### Current hard gate

Talos requires a trustworthy package-manager lock before first SDK source import.

The present execution environment cannot reliably reach npm to generate the full transitive lock. Therefore:

```text
package.json @temporalio/* promotion     ⛔ PENDING TRUSTWORTHY LOCK
@temporalio/* source import              ⛔ CLOSED
Workflow implementation                 ⛔ NOT STARTED
Activity Temporal wrapper               ⛔ NOT STARTED
Worker artifact                          ⛔ NOT CREATED
```

No fake/incomplete npm lock may be committed to bypass this gate.

## Next B7 implementation once lock gate is resolved

Only the frozen reference runtime may be implemented:

```text
TalosReferenceApprovalWorkflow
        ↓
tracked approve/reject Update
        ↓
Workflow condition/state wait
        ↓
YES → sendReferenceConfirmation Activity
NO  → rejected completion
```

Workflow code may not access:

```text
Talos SQLite
reference provider SQLite
filesystem
HTTP/provider calls
latest mutable Talos design
```

The Activity wrapper may call `ReferenceEmailSinkService` and translate provider-domain failures according to the pinned B6 RuntimePolicy.

B7 itself still does not authorize successful E2E/runtime claims; B9 owns server-backed runtime evidence.

## Remaining stages

```text
B7 Temporal worker/reference provider            🟡 OPEN / PARTIAL
B8 minimal reference API/web                     ⚪ CLOSED
B9 actual Temporal E2E runtime + evidence        ⚪ CLOSED
B10 failure/retry/restart/lineage closure        ⚪ CLOSED
```

## Immediate next move

```text
RESOLVE B7 TRUSTWORTHY NPM LOCK
→ PROMOTE EXACT TEMPORAL 1.21.1 DEPENDENCIES
→ IMPLEMENT REFERENCE WORKFLOW / ACTIVITY WRAPPER / WORKER
```
