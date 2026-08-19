# TALOS — T5-03 Runtime Safety / Policy Pressure Test Result v0.1

Status: **GATE FAIL — CONTRACT EVOLUTION REQUIRED**  
Date: **2026-08-19**

Targets:

```text
design/36-RUNTIME-SAFETY-POLICY-CONTRACT-v0.1.md
arch/20-RUNTIME-SAFETY-POLICY-ARCHITECTURE-v0.1.md
```

Result:

```text
Z01–Z44
42 PASS
2 FAIL
PASS RATE: 95.5%
```

## Failures

```text
Z42 — Activity default retry acceptance lacks a first-class immutable default-behavior snapshot/profile
Z43 — Workflow default no-retry acceptance lacks the same versioned default-behavior context
```

## Defect

v0.1 correctly requires explicit:

```text
ACCEPT_VERSIONED_TEMPORAL_DEFAULT
```

but only states that the accepted default must be explainable; it does not define the immutable artifact that says what the accepted Temporal defaults actually were for the target feature/platform/SDK compatibility context.

This leaves a hidden semantic hole:

```text
policy says "accept default"
        ↓
future Temporal/SDK behavior changes
        ↓
historical policy cannot prove what "default" meant
```

Current verified Temporal behavior includes:

```text
Activity Executions → Retry Policy by default
Workflow Executions → no Retry Policy by default
```

but these facts must be pinned as runtime-design reference data, not hard-coded as timeless Talos truth.

## Required repair

Introduce first-class immutable:

```text
TemporalDefaultBehaviorProfile
TemporalDefaultAcceptance
```

linked to the exact `TemporalFeatureProfile` / documentation or SDK reference context.

The profile may describe defaults such as retry behavior and other runtime defaults used by policy design, but must remain design/reference context—not an environment/deployment object.

No Phase-1–4, T5-01 or T5-02 contract needs reopening.

## Gate state

```text
T5-03 v0.1    ❌ NOT FROZEN
BUILD          ⛔ CLOSED
```
