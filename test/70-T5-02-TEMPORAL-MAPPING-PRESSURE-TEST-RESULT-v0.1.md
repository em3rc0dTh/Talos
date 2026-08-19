# TALOS — T5-02 Temporal Mapping Pressure Test Result v0.1

Status: **GATE FAIL — CONTRACT EVOLUTION REQUIRED**  
Date: **2026-08-19**

Targets:

```text
design/34-TEMPORAL-MAPPING-STRATEGY-CONTRACT-v0.1.md
arch/19-TEMPORAL-MAPPING-STRATEGY-ARCHITECTURE-v0.1.md
```

Result:

```text
Y01–Y46
43 PASS
3 FAIL
PASS RATE: 93.5%
```

## Failures

```text
Y43 — recurring scheduled Workflow start lacks first-class Temporal Schedule mapping vocabulary
Y44 — one-time future Workflow start lacks first-class Start Delay mapping vocabulary
Y45 — mapping feature/version assumptions are not first-class pinned context
```

## Y43/Y44 defect

v0.1 models in-workflow `DURABLE_TIMER` but does not distinguish external Workflow-start timing constructs.

Current Temporal semantics distinguish:

```text
Schedule
→ independent instructions that start Workflow Executions at specified/recurring times

Start Delay
→ one-time delay before initial Workflow execution starts

Timer
→ durable time wait inside a running Workflow
```

Using `SOURCE_DEFINED` alone would preserve extensibility but would not give the foundational mapping contract an explicit, reviewable distinction for a common process trigger.

## Y45 defect

v0.1 can emit `TEMPORAL_FEATURE_COMPATIBILITY` requirements but has no immutable object declaring the feature/platform assumptions against which a `TemporalMappingRevision` was designed.

This matters because the available/appropriate Temporal construct set evolves and may vary by target platform/version/capability profile.

Required repair:

```text
TemporalFeatureProfile
TemporalFeatureCompatibilityAssessment
```

with a pinned feature-profile reference on `TemporalMappingRevision`.

The feature profile is **design compatibility context**, not a deployment environment: it must not contain Namespace, Task Queue, credentials, endpoints or concrete worker/deployment coordinates.

No Phase-1–4 or T5-01 contract needs reopening.

## Gate state

```text
T5-02 v0.1    ❌ NOT FROZEN
BUILD          ⛔ CLOSED
```
