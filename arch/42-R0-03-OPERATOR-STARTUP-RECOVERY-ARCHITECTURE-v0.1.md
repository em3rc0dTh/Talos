# R0-03 — Operator Startup / Shutdown / Recovery — Architecture v0.1

Status: BUILDING / CERTIFICATION REQUIRED  
Date: 2026-08-24

## Position

R0-03 is an operator lifecycle layer outside R0-02 and I9.

```text
operator / shell
      ↓
private-preview-operator.ts
  ├─ runtime-dir resolution
  ├─ recovery inspection
  ├─ single-writer lock
  └─ lifecycle / signals
      ↓
private-preview-runtime.ts        R0-02
      ↓
private-preview-server.ts         R0-01/R0-02
      ↓ loopback
one-app-server.ts                 I9 authority engine
      ↓
append-only SQLite + source bytes
```

## Durable state vs routing state

Durable:
- canonical/process evidence
- confirmations/freezes
- capability/execution/Temporal designs
- approvals
- deployment attempts
- workflow execution observations

Process-memory only in v0.1:
- reconciled binding map
- automation workspace session map
- review/approval routing maps
- deployment/execution approval routing maps

R0-03 does not serialize those process-memory maps into a new authority source.

## Recovery architecture

Recovery inspection reads immutable documents using `SqliteDocumentStore.listByKind` and derives a safe summary. It does not replay commands and does not call domain mutation functions.

This gives the operator evidence of what survived without pretending the HTTP session is resumable.

## Lock architecture

The runtime directory is single-writer for the preview operator.

Acquisition:
1. atomically create lock with `wx`
2. if it already exists, parse safe metadata
3. if PID appears live, fail closed
4. if stale/unreadable, remove and atomically reacquire
5. write safe lock payload with mode `0600`

Shutdown removes the lock in `finally` after the app is closed.

## Failure behavior

- invalid R0-02 config: fail before operator start
- live lock: fail before application startup
- app startup failure: release acquired lock
- stale lock: recoverable
- rejected old session continuation: I9 409, no durable mutation

## Security boundary

No access bearer or provider bearer is included in:
- lock metadata
- recovery descriptor
- recovery digest
- startup summary

The safe R0-02 configuration fingerprint may be stored in the lock because it is derived only from non-secret fields.

## Preview limitation

`midSessionResumption = NOT_SUPPORTED_V0_1` is an architectural truth, not a transient error label.

A future resumable product may introduce a durable session/index model, but it must be designed as a routing reconstruction layer that cannot manufacture authority.
