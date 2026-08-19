# TALOS — Gated Roadmap v0.26

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.25.md` for active planning. Historical versions remain preserved.

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

Prior B2→B5 executable evidence remains:

```text
77 / 77 PASS
```

B6 executable evidence:

```text
test/95-B6-EXECUTION-TEMPORAL-POLICY-DEPLOYMENT-IMPLEMENTATION-RESULT-v0.1.md

14 / 14 PASS
16-module architecture boundary check PASS
SQLite close/reopen durability PASS
```

B6 did not claim a new same-process replay of the prior 77 cases from the local non-checkout harness. The committed workspace now exposes `npm run b6:verify` for a real checkout, executing architecture verification plus B1→B6 suites.

## Frozen B6 handoff

```text
PR2 / accepted automation-design freeze
        ↓
CapabilityBindingAssessment = READY_FOR_EXECUTION_DESIGN
        ↓
ExecutionPlanRevision
        ↓
TemporalMappingRevision
        ↓
RuntimePolicyRevision
        ↓
DeploymentRevision (DESIGN INTENT / INCOMPLETE REALIZATION)
```

Reference execution input remains:

```text
notificationRecipientEmail
→ logical recipientEmail
→ REFERENCE_EMAIL_SINK input.to
```

No concrete recipient address exists in B6 design truth.

Reference Temporal mapping design:

```text
root scope                   → Workflow boundary candidate
human submission             → Update handler
accepted human outcome wait  → Workflow condition
email capability occurrence  → Activity
branch/completion            → Workflow logic
```

This is reference execution design, not universal semantic mapping.

Reference material policy is explicit:

```text
Activity retry: 250ms / 2.0 / max 1s / maximumAttempts 3
Activity timeout: startToClose 5s / scheduleToClose 10s
Workflow maximumAttempts: 1
Idempotency: sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
TRANSIENT_REFERENCE_FAILURE: retryable
INVALID_REFERENCE_REQUEST: non-retryable
TemporalDefaultAcceptance count: 0
```

B6 deployment state remains intentionally:

```text
INCOMPLETE_ENVIRONMENT_REALIZATION
```

because B6 has no actual Worker artifact, actual Namespace, concrete TaskQueueBinding, type binding, deployment attempt, runtime observation or Workflow execution evidence.

## B7 — Temporal Worker / Reference Provider Runtime

```text
STATUS                              🟢 NEXT / OPEN
```

B7 is the first stage allowed to import the official Temporal TypeScript SDK.

Before first SDK import:

```text
1. verify current official Temporal TypeScript SDK/package versions;
2. verify Worker / Workflow / Activity / Update / testing APIs from official Temporal sources;
3. update exact dependency baseline + npm lock before source import;
4. preserve the B6 compiled design/policy as Worker input/config authority;
5. do not let Workflow code read Talos SQLite, provider SQLite, filesystem, HTTP or latest mutable Talos design.
```

B7 reference Worker must implement only the frozen reference mapping:

```text
TalosReferenceApprovalWorkflow
tracked approve/reject Update
Workflow condition/state wait
sendReferenceConfirmation Activity
```

The Activity/provider adapter may access only:

```text
.runtime/reference-email-sink.sqlite
```

Talos semantic/design repositories remain isolated in:

```text
.runtime/talos-state.sqlite
```

B7 may create a real executable Worker artifact and provider adapter. It must not yet claim successful Temporal end-to-end execution unless B9 server-backed runtime evidence exists.

## Remaining authorized stages

```text
B7 Temporal worker/reference provider            🟢 OPEN
B8 minimal reference API/web                     ⚪
B9 actual Temporal E2E runtime + evidence        ⚪
B10 failure/retry/restart/lineage closure        ⚪
```

## Immediate next move

```text
B7 — VERIFY TEMPORAL SDK → PIN DEPENDENCIES → BUILD REFERENCE WORKER/PROVIDER
```
