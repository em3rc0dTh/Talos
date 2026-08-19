# TALOS — Gated Roadmap v0.28

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.27.md` for active planning. Historical versions remain preserved.

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

Prior B2→B5 executable evidence remains `77 / 77 PASS`.

## B7 — Temporal Worker / Reference Provider

```text
STATUS                              🟡 OPEN / PARTIAL
```

### Provider lane

```text
ReferenceEmailSinkService                  ✅
idempotency contract                       ✅
transient/permanent provider failures       ✅
single-effect protection                    ✅
provider SQLite restart durability          ✅
provider executable tests                   ✅ 6/6
architecture boundary                       ✅ 16 modules / 0 errors
```

Provider evidence remains:

```text
test/96-B7-TEMPORAL-SDK-REFERENCE-PROVIDER-PARTIAL-RESULT-v0.1.md
```

### Temporal dependency lane — active truth

A freshness correction found that a stale GitHub Releases search index had incorrectly led the first B7 checkpoint to treat 1.21.1 as current.

Current npm distribution pages plus the official `temporalio/sdk-typescript` `v1.22.0` tag establish the active family as:

```text
@temporalio/common    1.22.0
@temporalio/client    1.22.0
@temporalio/worker    1.22.0
@temporalio/workflow  1.22.0
@temporalio/activity  1.22.0
@temporalio/testing   1.22.0
```

All Temporal packages must use the same version.

Correction evidence:

```text
test/97-B7-TEMPORAL-SDK-BASELINE-CORRECTION-v0.1.md
```

The dependency-version conclusion in test/96 is superseded by test/97. Its provider evidence remains valid.

Active dependency baseline:

```text
build/reference-vertical-slice/dependencies/dependency-baseline.json
→ exact 1.22.0 family
```

### Current source-import gate

Required:

```text
exact baseline                     ✅ 1.22.0
trustworthy transitive npm lock    ⛔ PENDING
package.json SDK promotion         ⛔ PENDING LOCK
@temporalio/* source imports       ⛔ CLOSED
```

The current local execution environment cannot resolve `registry.npmjs.org`, so Talos will not fabricate the lock.

### Allowed preparatory B7 work while lock is pending

May continue without SDK imports:

```text
reference-provider runtime              ✅
compiled Worker input contract          🟢
Workflow state machine contract         🟢
Update request/result contract          🟢
Activity request/result contract        🟢
provider→Temporal failure mapping spec  🟢
Worker artifact/deployment realization rules
```

These artifacts may describe the frozen B6 implementation boundary but may not import or impersonate Temporal SDK types.

### Worker implementation after lock gate

```text
TalosReferenceApprovalWorkflow
  ↓ tracked approve/reject Update
  ↓ deterministic Workflow state + condition
  ├─ APPROVED → sendReferenceConfirmation Activity
  └─ REJECTED → rejected completion
```

Workflow code is forbidden from directly accessing:

```text
Talos SQLite
reference provider SQLite
filesystem
HTTP/provider calls
latest mutable Talos design
```

The Activity wrapper may call the reference provider and translate provider-domain failures according to the pinned B6 RuntimePolicy.

B9 remains the first stage allowed to claim actual server-backed Workflow execution evidence.

## Remaining stages

```text
B7 Temporal worker/reference provider            🟡 OPEN / PARTIAL
B8 minimal reference API/web                     ⛔ CLOSED
B9 actual Temporal E2E runtime + evidence        ⛔ CLOSED
B10 failure/retry/restart/lineage closure        ⛔ CLOSED
```

## Immediate next move

```text
finish B7 pre-SDK Worker/failure contracts
+ obtain trustworthy npm 1.22.0 lock when networked environment is available
→ then open first @temporalio/* source import
```
