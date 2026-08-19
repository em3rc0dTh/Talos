# TALOS — Reference Vertical Slice Plan Pressure Test Result v0.1

Status: **PLAN FAIL — EVOLUTION REQUIRED / BUILD CLOSED**  
Date: **2026-08-19**

Target:

```text
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.1.md
```

Result:

```text
V01–V40
36 PASS
4 FAIL
PASS RATE: 90%
```

## Failures

```text
V07 — initial source fixture leaks future correction value
V22 — reference runtime policy values are still placeholders
V28 — reference provider side-effect storage isolation is not explicit
V34 — Temporal runtime observation evidence can still be self-asserted by runner context
```

## V07 — correction value leakage

The v0.1 plan's process diagram says:

```text
Manager review
```

while later declaring the initial source actor/responsibility is `UNKNOWN` and the user corrects it to `Manager`.

That wording risks turning the future correction into fixture source truth.

Required repair:

```text
initial source label = Review request
actor = UNKNOWN
```

Only the explicit review command may introduce `Manager`.

## V22 — implementation would invent material policy numbers

The plan says retry/timeout values must be explicit but leaves them unspecified.

The reference BUILD therefore still has permission to invent values inside code/configuration.

Required repair: pin deterministic **reference-test policy values** in the plan/fixture, clearly labeled test design rather than business truth.

## V28 — provider effect vs Talos persistence

`REFERENCE_EMAIL_SINK` writes a durable test side effect, but v0.1 does not explicitly isolate that provider-side effect store from Talos domain persistence.

Required repair:

```text
Talos state store      != reference provider effect store
```

They may share a physical SQLite engine/process for the test only if they use explicitly separate repository/schema/database boundaries and no provider write can mutate Talos semantic/history tables.

Preferred reference: separate SQLite database files.

## V34 — runtime evidence must be observed, not asserted

v0.1 says the runner records Workflow ID / Run ID and correlates runtime context to the DeploymentRevision. That alone could merely restate what the runner intended to start.

Required acceptance evidence must query/inspect actual Temporal runtime evidence such as Workflow describe/history/result and verify expected mapping events/interaction/activity completion before creating runtime observations.

The observation should preserve source/evidence references or digests from that runtime evidence.

## Gate state

```text
REFERENCE PLAN v0.1       ❌ NOT BUILD-READY
BUILD                      ⛔ CLOSED
```

No frozen Phase-1–5 contract requires reopening.
