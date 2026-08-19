# TALOS — Temporal Mapping Strategy v0.2 Freeze Declaration

Status: **FROZEN — T5-02 DESIGN / ARCHITECTURE**  
Date: **2026-08-19**

Exact tested Git blobs:

```text
design/34-TEMPORAL-MAPPING-STRATEGY-CONTRACT-v0.2.md
blob: aed10f4b0a3161ae3e36a05992fc99a38ebcfa06

arch/19-TEMPORAL-MAPPING-STRATEGY-ARCHITECTURE-v0.2.md
blob: cef6ff33622047199452270affcd41ec6e2d5278
```

Evidence:

```text
test/69-T5-02-TEMPORAL-MAPPING-PRESSURE-TEST-SPEC-v0.1.md
test/70-T5-02-TEMPORAL-MAPPING-PRESSURE-TEST-RESULT-v0.1.md
test/71-T5-02-TEMPORAL-MAPPING-REGRESSION-RESULT-v0.1.md

Y01–Y46
46 PASS / 0 FAIL
```

Frozen laws include:

```text
ExecutionElement != Temporal primitive automatically
Activity/Nexus/Signal/Update/Timer/Child/Continue-As-New require explicit mapping rationale
Timer != Schedule != Start Delay
NO_DIRECT_PRIMITIVE is valid
mapper preference != accepted decision
Temporal feature profile != deployment environment
mapping readiness != runnable/deployable
```

Future changes require a new version and regression evidence.

BUILD remains closed.
