# R0-03 — Operator Startup / Shutdown / Recovery — Design v0.1

Status: BUILDING / CERTIFICATION REQUIRED  
Date: 2026-08-24

## Goal

Give Talos v0.1 Private Technical Preview a single safe operator lifecycle around the R0-02 startup contract without inventing authority or overstating recovery.

## Lifecycle

```text
validated R0-02 configuration
        ↓
resolve durable runtime directory
        ↓
inspect durable evidence (read-only)
        ↓
acquire single-writer operator lock
        ↓
start R0-02 private-preview runtime
        ↓
operate Talos
        ↓
SIGINT / SIGTERM / explicit close
        ↓
close HTTP + persistence
        ↓
release operator lock
```

## Recovery inspection

`inspectTalosPrivatePreviewRecovery(runtimeDir)` is read-only. It summarizes durable aggregate kinds and derives a coarse recovery stage:

```text
EMPTY
PROCESS_EVIDENCE
AUTOMATION_EVIDENCE
DEPLOYMENT_EVIDENCE
WORKFLOW_EXECUTION_EVIDENCE
```

It reports:
- database/source-byte presence
- per-kind counts
- latest durable IDs/timestamps
- total durable document count
- workflow execution observation count
- deterministic safe recovery digest
- `authorityReplayPerformed: false`
- `startupMutationPerformed: false`
- `midSessionResumption: NOT_SUPPORTED_V0_1`
- `recoveryContract: DURABLE_EVIDENCE_ONLY`

## Single-writer lock

The operator owns one file in the runtime directory:

`.talos-private-preview.lock.json`

It contains only:
- operator schema/version
- PID
- startup timestamp
- safe R0 configuration fingerprint
- runtime directory

It contains no bearer/provider secret material.

A live PID blocks a second operator. A stale PID may be replaced. A clean shutdown removes the lock.

## Restart semantics

Restarting with the same runtime directory:
- reuses the same append-only SQLite evidence
- must not append domain/authority records merely because the server started
- exposes the pre-start recovery descriptor
- starts fresh in-memory routing indexes

Therefore an old in-progress one-app session is not resumable in v0.1. A rejected attempt to continue that session must not mutate durable evidence.

## Authority preservation

```text
RECOVERY INSPECTION
    != AUTHORITY
STARTUP
    != AUTHORITY REPLAY
DURABLE APPROVAL RECORD
    != ACTIVE IN-MEMORY SESSION
```

Every new active action remains subject to the same I8/I9 authority gates.

## Operator entrypoint

`private-preview-operator.ts` supports:
- normal start
- `--inspect` read-only recovery output
- SIGINT/SIGTERM graceful close

R0-03 DESIGN_ONLY operation is directly usable. Full TEMPORAL_EXECUTION packaging depends on the real runtime adapters that R0-04 will certify.
