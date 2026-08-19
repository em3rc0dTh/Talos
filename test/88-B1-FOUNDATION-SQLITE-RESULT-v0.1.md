# TALOS — B1 Foundation / Deterministic JSON / SQLite Result v0.1

Status: **B1 GATE CLOSED — PASS**  
Date: **2026-08-19**

## Scope

B1 implements foundational mechanics only inside the authorized reference slice:

```text
build/reference-vertical-slice/
```

It does not implement Canvas semantics, Canonical normalization, review commands, capability design or Temporal runtime behavior.

## Implemented foundation

```text
packages/foundation/src/ids.ts
packages/foundation/src/deterministic-json.ts
packages/foundation/src/digest.ts
packages/foundation/src/repository.ts
```

B1 establishes:

```text
branded/opaque cross-layer identity families
deterministic SHA-256 derived test identities
deterministic object-key serialization
array-order preservation
versioned JSON envelope support
SHA-256 helpers
immutable-document repository port
```

Cross-layer identity uses different prefixes and different hash input namespaces. The same deterministic seed therefore cannot silently produce an equal Source and Canonical identity.

## Talos reference persistence

```text
packages/persistence-sqlite/src/sqlite-document-store.ts
```

The reference implementation uses a real file-backed SQLite database with an append-only `immutable_documents` table.

Properties proven:

```text
same immutable document / same ID       → idempotent EXISTS_IDENTICAL
same ID / different document            → conflict
UPDATE                                   → database trigger rejects
DELETE                                   → database trigger rejects
close + reopen                           → history preserved
```

The database schema remains an adapter concern and is not a Talos domain contract.

## Reference provider isolation

```text
packages/reference-email-sink/src/email-sink-store.ts
```

The reference provider uses its own physical SQLite database and owns only:

```text
reference_email_effects
```

Talos state owns only its Talos persistence tables. The provider cannot persist semantic/review/capability/execution state through shared tables.

Provider idempotency behavior proven:

```text
same idempotency key + same request      → DUPLICATE_IDENTICAL
same idempotency key + different request → conflict
logical effect rows after duplicate      → 1
```

## Runtime/dependency selection

B1 records its runtime choice in:

```text
dependencies/b1-runtime-selection.json
```

For this bounded reference stage:

```text
Node target                    22.16.x
SQLite adapter                 node:sqlite / DatabaseSync
TypeScript execution           Node erasable type stripping
external dependencies promoted 0
```

The B0 candidates remain candidates until a later stage actually requires promotion. No dependency range or unpinned external library entered B1.

## Executable verification

Local executable command:

```text
TALOS_SKIP_CONTRACT_HASH=1 npm run b1:verify
```

Result:

```text
architecture verifier          PASS
module boundaries checked      16
pinned artifacts represented   24

Node tests                     6
PASS                           6
FAIL                           0
```

The local execution environment was not a checkout of the private repository, so contract hash recomputation was skipped locally. The committed verifier enforces Git blob identities in a real checkout, and the B0 manifest entries were assembled from GitHub-returned exact blob SHAs.

Committed B1 workspace/package topology is present in the repository. The package lock contains only local workspace links for:

```text
@talos/foundation
@talos/persistence-sqlite
@talos/reference-email-sink
```

and no external package installation.

## Architecture constraints retained

```text
SQLite implementation types do not become domain types.
Temporal SDK is absent from B1.
Canvas/Canonical identities are not reused across layers.
Reference provider persistence is physically isolated.
Immutable history has no update/delete application API and is also DB-guarded.
Deterministic JSON rejects values that would silently lose/alter information.
```

## Verdict

```text
B1 OPAQUE IDS                    ✅ PASS
B1 DETERMINISTIC JSON/DIGEST     ✅ PASS
B1 REPOSITORY PORT               ✅ PASS
B1 SQLITE DURABILITY             ✅ PASS
B1 APPEND-ONLY GUARDS            ✅ PASS
B1 PROVIDER DB ISOLATION         ✅ PASS
B1 ARCHITECTURE BOUNDARIES       ✅ PASS
B1 EXTERNAL DEPENDENCY LEAKAGE   ✅ NONE

B1                              ✅ CLOSED
B2                              🟢 NEXT
```

Broad product BUILD remains closed.
