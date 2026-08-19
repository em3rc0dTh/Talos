# TALOS — Reference Vertical Slice

Status: **PHASE 6 / B0+B1 CLOSED / B2 OPEN**

Authorized by `plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.1.md`. Broad product BUILD remains closed.

## Closed foundation

### B0

Established:

```text
frozen contract manifest
exact dependency baseline
package/workspace boundary
architecture dependency matrix
runtime-artifact ignore rules
executable contract/boundary verification
```

Evidence:

```text
test/87-B0-CONTRACT-MANIFEST-WORKSPACE-BOUNDARY-RESULT-v0.1.md
```

### B1

Implemented and tested:

```text
opaque cross-layer IDs
deterministic/versioned JSON
SHA-256 helpers
immutable repository port
file-backed append-only Talos SQLite store
restart/reopen durability
reference-email provider SQLite isolation
idempotent provider-effect persistence
ongoing import-boundary verifier
```

Evidence:

```text
test/88-B1-FOUNDATION-SQLITE-RESULT-v0.1.md
```

B1 uses Node's bounded reference runtime and promotes no external package. Planned dependencies remain frozen candidates until a later stage requires them.

## Runtime state

`.runtime/` is never committed. Later reference runtime uses separate files:

```text
.runtime/talos-state.sqlite
.runtime/reference-email-sink.sqlite
```

## Verification

From this directory:

```bash
npm run b1:verify
```

In a full repository checkout the architecture verifier also checks frozen Git blob identities.

## Current gate

```text
B2 — CANVAS / SOURCE / INTAKE      🟢 OPEN
```

B2 may implement native Canvas revision/intake/adaptation evidence only. B3 owns Canonical normalization, Provenance materialization and Semantic Validation.

The historical C01–C20 suite is reread before B2 implementation and split into B2-owned versus downstream assertions rather than fabricating B3 output early.
