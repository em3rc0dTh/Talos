# TALOS — B7 Temporal Dependency Lock Gate Result v0.1

Status: **LOCK GATE SAFE-PENDING / SDK IMPORT NOT AUTHORIZED**  
Date: **2026-08-19**

## Purpose

Make the remaining B7 dependency boundary mechanically enforceable rather than relying on documentation alone.

Verifier:

```text
build/reference-vertical-slice/scripts/verify-b7-temporal-lock.mjs
```

Workspace commands:

```text
npm run b7:lock:status
npm run b7:lock:verify
```

## Required family

The verifier reads the active dependency baseline and requires exactly six Temporal packages on one exact family:

```text
@temporalio/common
@temporalio/client
@temporalio/worker
@temporalio/workflow
@temporalio/activity
@temporalio/testing

version = 1.22.0 for all
```

A partial promotion or mixed version set is `FAIL`.

## PENDING_SAFE state

The current bounded repository state is expected to be:

```text
Temporal package.json promotions = 0
Temporal source imports           = 0
Temporal external lock entries    = 0
```

Verifier result in the local reference harness:

```json
{
  "status": "PENDING_SAFE",
  "expectedTemporalVersion": "1.22.0",
  "promotedPackages": [],
  "temporalImportFiles": [],
  "lockReady": false,
  "errors": []
}
```

This state is safe but does not authorize SDK source imports.

## READY state requirements

The verifier will return `READY` only when:

```text
all six exact packages are promoted
package.json versions exactly match baseline
package-lock root declarations exactly match
package-lock node_modules entries exist for each Temporal package
entry.version = 1.22.0
entry.resolved is present
entry.integrity is present
entry is not a workspace link
```

If Temporal source imports appear before `READY`, the verifier returns `FAIL`.

## Required-ready behavior

Current invocation:

```text
node scripts/verify-b7-temporal-lock.mjs --require-ready
```

returns exit code:

```text
2
```

because the repository is safely pending rather than ready.

Exit code `1` is reserved for an invalid/broken gate state such as mixed versions, partial promotion or premature source import.

## Workspace integration

Current partial B7 verifier now includes:

```text
architecture:verify
b7:lock:status
b7:provider:test
b7:contract:test
```

Root `npm test` remains pinned to B6 because B7 is not closed.

## Verdict

```text
B7 dependency gate safety        ✅
B7 exact baseline                ✅ 1.22.0
B7 pre-SDK code may remain       ✅
B7 SDK source import             ⛔
B7 real Worker artifact          ⛔
```

**Current state: `PENDING_SAFE`. The next network-capable dependency run must make this verifier return `READY` before any `@temporalio/*` import is committed.**
