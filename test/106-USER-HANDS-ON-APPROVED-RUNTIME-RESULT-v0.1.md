# TALOS — First User Hands-On Approved Runtime Result v0.1

Status: **PASS — USER-EXECUTED LOCAL WINDOWS RUN**

Date: **2026-08-19**

This evidence records the first hands-on execution of `TALOS Reference Vertical Slice v0.1` by the project owner on a local Windows machine after the automated B7/B8/B9 gates had closed.

This is not CI evidence. It is direct user-run evidence from the tryable reference version.

## Environment observed by the user

```text
OS shell: Windows PowerShell
Workspace: build/reference-vertical-slice
Temporal TypeScript SDK: 1.22.0
Temporal CLI: 1.8.2
Temporal Server: 1.31.2
Temporal UI: 2.50.1
Temporal persistence: in-memory local development environment
Reference HTTP app: http://127.0.0.1:8787
Task Queue: talos-reference-main
Namespace: talos-reference
```

Node emitted the expected local-reference warning that built-in SQLite is experimental. The local Temporal development server also generated a new cluster UUID after warning about cluster metadata. Neither warning prevented the reference Worker or HTTP app from reaching READY/RUNNING state.

## User-observed Talos semantic baseline

The browser displayed the expected real reference pipeline state:

```text
Canvas source: Review request · actor = UNKNOWN
        ↓
intake / canonical / provenance / validation
        ↓
SV-ACT-001
INSUFFICIENT_DETAIL
        ↓
explicit review correction
actor = Manager
        ↓
new source + canonical revision
        ↓
AUTOMATION_DESIGN_HANDOFF
        ↓
capability / execution / Temporal mapping
```

Observed values:

```text
initial actor       UNKNOWN
initial readiness   INSUFFICIENT_DETAIL
finding             SV-ACT-001
corrected actor     Manager
corrected readiness READY_FOR_AUTOMATION_DESIGN
freeze              AUTOMATION_DESIGN_HANDOFF / ACCEPTED
provider            REFERENCE_EMAIL_SINK
human mapping       UPDATE_HANDLER + WORKFLOW_CONDITION
Activity type       sendReferenceConfirmation
retry maximum       3
```

The browser also exposed distinct immutable IDs for Canvas source revision, initial and corrected ProcessRevisions, semantic freeze, capability design, ExecutionPlan revision, and TemporalMapping revision.

## User-executed approved path

Runtime input used:

```text
recipient: eduardo@example.test
```

Observed Workflow result:

```text
reviewOutcome       APPROVED
outcome             COMPLETED
notificationOutcome MESSAGE_ACCEPTED
Temporal status     COMPLETED
```

Server-backed Workflow history exposed by the app:

```text
eventCount          16
activityScheduled   true
activityAttempt     2
activityCompleted   true
workflowCompleted   true
```

Reference provider evidence:

```text
providerEffects     1
```

The effect was recorded for `eduardo@example.test` with the TEST_ONLY provider content:

```text
subject: Talos reference confirmation
body:    The reference request was approved.
```

No real email was sent.

## Retry evidence

The local Worker log showed the deliberate first Activity failure:

```text
activityType: sendReferenceConfirmation
attempt: 1
failure type: TRANSIENT_REFERENCE_FAILURE
nonRetryable: false
```

The browser/server-backed history subsequently reported:

```text
activityAttempt = 2
activityCompleted = true
workflowCompleted = true
```

Therefore the first user-operated run demonstrates the intended reference behavior:

```text
Activity attempt 1
→ TRANSIENT_REFERENCE_FAILURE
→ Temporal retry
→ later attempt succeeds
→ exactly one logical provider effect
→ Workflow COMPLETED
```

## Verdict

```text
LOCAL TEMPORAL SERVER START                    PASS
REFERENCE WORKER RUNNING                       PASS
TRYABLE HTTP/BROWSER APP                       PASS
SOURCE actor=UNKNOWN PRESERVED                 PASS
SEMANTIC VALIDATION GAP VISIBLE                PASS
EXPLICIT Manager CORRECTION VISIBLE            PASS
SEMANTIC FREEZE VISIBLE                        PASS
CAPABILITY / EXECUTION DESIGN VISIBLE          PASS
REAL TEMPORAL WORKFLOW START                   PASS
REAL WORKFLOW UPDATE / APPROVAL                PASS
RETRYABLE ACTIVITY FAILURE OBSERVED             PASS
TEMPORAL RETRY TO ATTEMPT 2                    PASS
ONE IDEMPOTENT PROVIDER EFFECT                 PASS
WORKFLOW COMPLETED                             PASS
```

**Result: FIRST USER HANDS-ON APPROVED PATH PASS.**

## Still required for the first hands-on observation set

The next manual observation should exercise the rejected path:

```text
start a second request
→ REJECTED
→ Workflow REJECTED
→ email Activity never scheduled
→ zero provider effects for that request
```

After the approved and rejected user-operated paths are both captured, B10 can classify hands-on observations into resilience defects, lineage gaps, usability gaps, and expected reference limitations.
