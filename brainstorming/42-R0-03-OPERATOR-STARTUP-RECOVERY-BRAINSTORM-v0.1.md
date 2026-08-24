# R0-03 — Operator Startup / Shutdown / Recovery — Brainstorm v0.1

Status: BUILDING / CERTIFICATION REQUIRED  
Date: 2026-08-24

## Problem

R0-02 proves Talos private-preview configuration is explicit and fail-closed. It does not yet prove that a tester can operate one durable runtime directory safely across process lifecycle events.

The existing I9 one-app server persists immutable domain evidence in SQLite, but several routing/session indexes are process-memory maps. A process restart therefore must not be described as transparent mid-session resumption.

## Operator law

```text
PROCESS RESTART
    != AUTHORITY REPLAY
    != MID-SESSION RESUMPTION

DURABLE DOMAIN EVIDENCE
    → SAFE RECOVERY INSPECTION
    → FRESH SERVER START
```

## Preview recovery truth

For v0.1 Private Technical Preview:

```text
completed / persisted evidence     RECOVERABLE + INSPECTABLE
runtime directory                  REUSABLE
startup                            IDEMPOTENT WITH RESPECT TO DOMAIN EVIDENCE
single-writer protection           REQUIRED
mid-session routing state          NOT_SUPPORTED_V0_1
replaying authority commands       FORBIDDEN
```

If a tester stops Talos after process confirmation but before automation-design completion, the persisted confirmation remains evidence. The restarted one-app shell does not silently reconstruct the prior in-memory session. The tester starts a fresh active session rather than Talos fabricating continuation authority.

## Threats to pressure-test

```text
two operators opening one runtime directory
stale lock blocking all future startup
secret material written into lock metadata
startup appending duplicate authority/domain records
restart mutating recovery evidence
recovery code replaying confirmation/approval actions
operator claiming mid-session resumption when maps are empty
shutdown leaving a live lock behind
```

## Required operator surface

A preview operator needs:
- one required durable runtime directory
- one single-writer lock
- safe startup summary
- safe recovery inspection command
- graceful SIGINT/SIGTERM shutdown
- explicit recovery stage/evidence counts
- explicit mid-session limitation

## Non-goals

R0-03 does not build:
- distributed locking
- multi-instance high availability
- session reconstruction from every immutable aggregate
- Temporal Worker production deployment packaging
- live external integration adapters

Those belong after the Private Technical Preview boundary or in R0-04 where real external runtime adapters are certified.
