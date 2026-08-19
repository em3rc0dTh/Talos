# TALOS — B7 Temporal SDK Baseline Freshness Correction v0.1

Status: **DEPENDENCY GOVERNANCE CORRECTION / B7 REMAINS OPEN**  
Date: **2026-08-19**

## Trigger

The first B7 SDK verification checkpoint used a stale GitHub Releases search index that still showed:

```text
v1.21.1 = Latest
```

A second freshness check against the actual npm distribution pages and the official `temporalio/sdk-typescript` `v1.22.0` tag showed that the current published package family is:

```text
v1.22.0
```

This correction happened **before any Temporal SDK dependency was promoted into package.json, before any transitive npm lock was committed, and before any @temporalio/* source import existed**.

No runtime or Talos semantic/design code therefore depends on the mistaken intermediate 1.21.1 baseline.

---

# 1. Correct active Temporal family

Verified current distribution/tag:

```text
@temporalio/common    1.22.0
@temporalio/client    1.22.0
@temporalio/worker    1.22.0
@temporalio/workflow  1.22.0
@temporalio/activity  1.22.0
@temporalio/testing   1.22.0
```

Official `v1.22.0` package metadata also confirms the Worker/Testing packages are version `1.22.0` and require Node >= 20.3.0.

The reference runtime remains Node 22.16.x and is therefore inside the supported Node family.

---

# 2. Same-version rule

The official Temporal TypeScript SDK installation guidance requires all `@temporalio/*` packages in one project to use the same version.

Talos therefore keeps the entire promoted B7 family at exactly:

```text
1.22.0
```

No mixed Temporal SDK family is allowed.

---

# 3. Historical evidence treatment

The earlier:

```text
test/96-B7-TEMPORAL-SDK-REFERENCE-PROVIDER-PARTIAL-RESULT-v0.1.md
```

remains preserved as historical evidence of what was checked at that moment.

Its **reference-provider implementation/test evidence remains valid**.

Its dependency-version conclusion:

```text
1.21.1
```

is superseded by this correction and must not be used as active dependency truth.

---

# 4. Active dependency baseline

Corrected active file:

```text
build/reference-vertical-slice/dependencies/dependency-baseline.json
```

now pins exact `1.22.0` values.

The original B0 planned `1.22.0` values are therefore restored after current-source verification, not accepted merely because they were originally guessed/planned.

---

# 5. Source-import gate remains closed

The correction does not bypass the lock discipline.

Required before first SDK source import:

```text
exact active dependency baseline   ✅ 1.22.0
package.json promotion             ⛔ pending trustworthy lock workflow
transitive npm package-lock        ⛔ pending
@temporalio/* source imports       ⛔ closed
```

No fabricated or manually guessed transitive lock is authorized.

---

# Verdict

```text
ACTIVE TEMPORAL SDK BASELINE = 1.22.0

REFERENCE PROVIDER            ✅ VALID / 6/6
TEMPORAL SDK SOURCE IMPORT    ⛔ STILL CLOSED
B7                            🟡 OPEN / PARTIAL
```

This is a dependency freshness correction, not a frozen Talos architecture defect.
