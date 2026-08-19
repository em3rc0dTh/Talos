# TALOS — Reference Vertical Slice

Status: **PHASE 6 / B0 WORKSPACE FOUNDATION**

Authorized by `plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.1.md`. Broad product BUILD remains closed.

## B0 purpose

B0 creates no business implementation. It establishes the mechanical guardrails that later stages must obey:

```text
frozen contract manifest
+ exact dependency baseline
+ package/workspace boundary
+ architecture dependency matrix
+ runtime-artifact ignore rules
+ executable B0 verifier
```

The implementation path is strictly `build/reference-vertical-slice/`.

## Staged dependency-lock rule

B0's `package-lock.json` is intentionally dependency-free because B0 uses Node built-ins only. `dependencies/dependency-baseline.json` freezes the exact planned external versions. Before B1/B7 source code imports any planned package, that package must be promoted into `package.json` and the npm lockfile in the same stage. The verifier rejects unpinned/range specs.

This prevents selecting libraries merely because code already imported them.

## Workspace boundaries

Domain packages remain independent from Temporal SDK, SQLite implementation and UI framework types. Only declared boundary adapters may depend on those implementation technologies. See `architecture/module-boundaries.json`.

## Verification

Run from this directory:

```bash
npm run b0:verify
```

In a full repository checkout, the verifier recomputes `git hash-object` for every frozen contract/governance file and compares it to `contracts/frozen-contract-manifest.json`.

## Runtime state

`.runtime/` is never committed. Later stages maintain separate runtime databases:

```text
.runtime/talos-state.sqlite
.runtime/reference-email-sink.sqlite
```

## Next gate

B1 may begin only after B0 verification is green.
