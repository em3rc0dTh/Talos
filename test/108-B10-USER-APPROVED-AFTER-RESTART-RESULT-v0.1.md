# TALOS — B10 User Approved-After-Restart Result v0.1

Status: **PASS — USER-EXECUTED WINDOWS RUN**

Date: **2026-08-19**

## Scenario

The user restarted `TALOS Reference Vertical Slice v0.1` against the same persisted `.runtime` directory after the B10 restart/replay fix, then executed a new approved request through the browser.

Environment observed by the user:

```text
Windows PowerShell
Node 24.11.1
Temporal SDK 1.22.0
Temporal CLI 1.8.2
Temporal Server 1.31.2
Task Queue talos-reference-main
Namespace talos-reference
```

The restarted app reached:

```text
Worker state = RUNNING
TALOS reference vertical slice is ready: http://127.0.0.1:8787
```

No `EBADENGINE` warning occurred and the historical `IDEMPOTENT_REPLAY` condition did not crash startup.

## Approved request

```text
referenceRequestId = REQ-a3049e30-2af0-4d4a-a0c7-2462a968977f
workflowId = talos-reference-REQ-a3049e30-2af0-4d4a-a0c7-2462a968977f
reviewOutcome = APPROVED
comment = "Hi bro"
recipient = eduardo.farid@thradex.com
```

Browser result:

```text
result.outcome = COMPLETED
result.reviewOutcome = APPROVED
result.notificationOutcome = MESSAGE_ACCEPTED
Temporal descriptionStatus = COMPLETED
history.eventCount = 16
history.activityScheduled = true
history.activityAttempt = 2
history.activityCompleted = true
history.workflowCompleted = true
providerEffects = 1
```

Provider effect:

```text
subject = Talos reference confirmation
body = The reference request was approved.
to = eduardo.farid@thradex.com
```

The terminal independently showed the intentionally injected first Activity failure:

```text
attempt = 1
activityType = sendReferenceConfirmation
failure type = TRANSIENT_REFERENCE_FAILURE
nonRetryable = false
```

The browser history then proved the same Activity reached attempt 2 and completed.

## Proven chain

```text
persisted Talos history
→ app restart
→ historical review replay handled safely
→ Worker RUNNING
→ new Workflow started
→ manager Update APPROVED
→ sendReferenceConfirmation scheduled
→ attempt 1 TRANSIENT_REFERENCE_FAILURE
→ Temporal retry
→ attempt 2 success
→ exactly one idempotent provider effect
→ Workflow COMPLETED
```

## Verdict

```text
WINDOWS RESTART AFTER B10 FIX          PASS
NODE 24 ENGINE SUPPORT                 PASS
PERSISTED TALOS HISTORY REUSE          PASS
APPROVED WORKFLOW                      PASS
TEMPORAL RETRY TO ATTEMPT 2            PASS
ACTIVITY COMPLETION                    PASS
WORKFLOW COMPLETION                    PASS
IDEMPOTENT PROVIDER EFFECT COUNT = 1   PASS
```

**Approved-after-restart hands-on subgate: CLOSED.**

The remaining manual hands-on branch for the first validation set is the rejected path, which must prove no email Activity scheduling and zero provider effects for that request.
