# TALOS — Gated Roadmap v0.31

Status: **ACTIVE PLAN — FIRST TRYABLE REFERENCE VERSION**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.30.md` for active planning. Historical roadmap versions remain preserved.

# System architecture status

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

The architecture-first gate is complete for the bounded reference slice.

# Phase 6 — Reference Vertical Slice

Authorized implementation scope remains only:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

## Stage status

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
B4 Explanation / Review / Correction / Freeze     ✅ CLOSED — 13/13
B5 Capability / Human / Form / Binding             ✅ CLOSED — 12/12
B6 Execution / Mapping / Policy / Deployment      ✅ CLOSED — 14/14
B7 Temporal Worker / Reference Provider            ✅ CLOSED
B8 Minimal Reference API / Browser UI              ✅ CLOSED
B9 Actual Temporal E2E / Server Evidence           ✅ CLOSED
B10 Failure / Restart / Full Lineage Hardening     🟢 NEXT
```

Prior B2→B5 executable regression remains:

```text
77 / 77 PASS
```

# First tryable version

The first user-try checkpoint is now:

> **TALOS Reference Vertical Slice v0.1**

Run guide:

```text
build/reference-vertical-slice/TRY-ME.md
```

Local command:

```bash
cd build/reference-vertical-slice
npm ci
npm run demo
```

Browser:

```text
http://127.0.0.1:8787
```

## What v0.1 actually exercises

```text
native Canvas source
actor = UNKNOWN
        ↓
source preservation / intake
        ↓
canonical + provenance + validation
        ↓
SV-ACT-001 / INSUFFICIENT_DETAIL
        ↓
explicit actor = Manager review correction
        ↓
new source + canonical + validation history
        ↓
AUTOMATION_DESIGN_HANDOFF freeze
        ↓
capability / human / form / binding
        ↓
ExecutionPlan
        ↓
Temporal mapping
        ↓
runtime policy
        ↓
deployment design
        ↓
compiled immutable runtime program
        ↓
real local Temporal server
        ↓
real Worker
        ↓
real Workflow Update
        ↓
real Activity + retry
        ↓
reference provider effect
        ↓
server-backed Workflow history
```

# Runtime truth

Current exact Temporal TypeScript SDK family:

```text
@temporalio/common    1.22.0
@temporalio/client    1.22.0
@temporalio/worker    1.22.0
@temporalio/workflow  1.22.0
@temporalio/activity  1.22.0
@temporalio/testing   1.22.0
```

The npm lock is real and contains registry `resolved` URLs and integrity metadata.

Reference Workflow:

```text
TalosReferenceApprovalWorkflow
```

Tracked human command:

```text
submitReferenceReviewDecision
```

Read-only Workflow state:

```text
getReferenceApprovalState
```

Reference Activity:

```text
sendReferenceConfirmation
```

Reference Activity policy:

```text
initialInterval      250ms
backoffCoefficient   2.0
maximumInterval      1000ms
maximumAttempts      3
startToClose         5000ms
scheduleToClose      10000ms
nonRetryable         INVALID_REFERENCE_REQUEST
```

Idempotency:

```text
sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
```

# Tryable-app gate

Authoritative CI evidence:

```text
test/103-B7-B9-TEMPORAL-RUNTIME-CI-RESULT.md            PASS
test/104-B8-TRYABLE-REFERENCE-APP-CI-RESULT-v0.1.md     PASS
test/105-B7-B8-B9-TRYABLE-REFERENCE-GATE-CLOSURE-v0.1.md
```

Current integrated CI gate proves:

```text
npm ci                         ✅
Temporal dependency lock       ✅
architecture boundaries        ✅
real SDK Activity boundary     ✅
B8 tryable app                 ✅
real local Temporal E2E        ✅
```

Approved reference path deliberately injects one transient provider failure:

```text
Activity attempt 1
→ TRANSIENT_REFERENCE_FAILURE
→ Temporal retry
→ later attempt succeeds
→ one logical provider effect
→ Workflow COMPLETED
```

Rejected path:

```text
Workflow REJECTED
→ no email Activity scheduled
→ no provider effect for that request
```

# Persistence

Local reference state is intentionally isolated:

```text
.runtime/talos-state.sqlite
.runtime/reference-email-sink.sqlite
```

The runtime directory is git-ignored.

# Still not authorized

```text
production BPMN/image/language/n8n adapter implementation
real Gmail/Drive/SaaS provider integration
production IAM/secrets
production Temporal deployment
multi-user collaboration expansion
broad provider/source expansion
full product visual polish
```

# Immediate next move

Do **not** expand the product before the first hands-on user run.

Current recommended sequence:

```text
1. Eduardo runs TALOS Reference Vertical Slice v0.1
2. capture usability/runtime observations
3. classify defects vs product gaps vs expected reference limitations
4. B10 failure/restart/full-lineage hardening
5. only after B10 decide the next bounded expansion
```

B10 is intentionally **not a prerequisite for trying v0.1**.
