# TALOS — B0 Contract Manifest / Workspace / Dependency Boundary Result v0.1

Status: **B0 GATE CLOSED — PASS**  
Date: **2026-08-19**

## Scope

Authorized BUILD scope remains only:

```text
build/reference-vertical-slice/
```

B0 creates guardrails only. It does not implement business/domain behavior.

## Evidence created

```text
build/reference-vertical-slice/README.md
build/reference-vertical-slice/.gitignore
build/reference-vertical-slice/package.json
build/reference-vertical-slice/package-lock.json
build/reference-vertical-slice/tsconfig.base.json
build/reference-vertical-slice/contracts/frozen-contract-manifest.json
build/reference-vertical-slice/dependencies/dependency-baseline.json
build/reference-vertical-slice/architecture/module-boundaries.json
build/reference-vertical-slice/scripts/verify-b0.mjs
build/reference-vertical-slice/packages/README.md
build/reference-vertical-slice/apps/README.md
build/reference-vertical-slice/workers/README.md
build/reference-vertical-slice/fixtures/README.md
build/reference-vertical-slice/tests/README.md
```

## Verification result

Structural verifier execution:

```text
status                    PASS
pinnedArtifacts           24
contractEntries           17
plannedDependencies       11
moduleBoundaries          16
implementation TS files   0
```

The local verification environment was not a checkout of the private Git repository, so its `git hash-object` loop was intentionally skipped with `TALOS_SKIP_CONTRACT_HASH=1`.

The 24 manifest blob identities were independently checked against GitHub-returned blob SHAs while B0 was assembled. In a normal repository checkout, `npm run b0:verify` enforces the hashes directly using `git hash-object` and fails on any frozen-contract drift.

## Dependency decision

B0 consumes no third-party package and therefore keeps a dependency-free npm lockfile.

Exact planned versions are frozen in:

```text
dependencies/dependency-baseline.json
```

A dependency must be promoted into `package.json` + `package-lock.json` before the first source import that consumes it.

This prevents implementation from selecting dependencies retroactively.

## Boundary decision

`architecture/module-boundaries.json` establishes distinct modules for:

```text
foundation
source-intake
canvas-source
semantic-core
review
capability
execution
temporal-design
runtime-policy
deployment
application
persistence-sqlite
reference-email-sink
reference-api
reference-web
reference-temporal-worker
```

Key enforcement:

```text
Domain packages do not own Temporal SDK types.
Temporal SDK is allowed only at declared runtime/client boundaries.
SQLite is allowed only in persistence/provider adapters.
Reference email provider persistence is isolated from Talos state.
Cross-layer IDs may not be reused as if identities were equivalent.
Workflow code may not access Talos DB/provider DB/filesystem/HTTP/latest mutable design directly.
```

## B0 verdict

```text
B0 CONTRACT MANIFEST             ✅ PASS
B0 WORKSPACE                     ✅ PASS
B0 DEPENDENCY BASELINE           ✅ PASS
B0 MODULE BOUNDARIES             ✅ PASS
B0 IMPLEMENTATION LEAKAGE        ✅ NONE

B0                              ✅ CLOSED
B1                              🟢 NEXT
```

Broad product BUILD remains closed.
