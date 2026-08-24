# R0-04 — Live External Provider + Integration Proof — Closure Plan v0.1

Status: R0-04A CERTIFICATION CANDIDATE / R0-04B ACTIVE  
Date: 2026-08-24

## Objective

Close the final external-reality gate before Talos v0.1 final Private Technical Preview certification.

## R0-04A — real external capability

```text
A1  generic Activity external transport boundary             ✅ code
A2  transport/effect/evidence refs in Workflow result        ✅ code
A3  GitHub PR comment certification adapter                  ✅ code
A4  external marker includes effect key + input digest       ✅ code
A5  exact duplicate resolves same external effect            ✅ code
A6  drifted input for same effect key fails closed           ✅ code
A7  real local Temporal Worker → GitHub REST effect          ✅ observed on PR #48
A8  fresh Worker ledger → same external effect               ✅ observed on PR #48
A9  I9-07 exact-head authority regression                    ✅ observed on candidate
A10 B7–B9 + Image frozen regressions                          ⏳ final candidate
A11 clean exact-head PR merge                                ⏳
```

Observed candidate receipt:
- PR #48
- candidate head `a6ffd80e2166326a61103a026b671f9e0885271a`
- external GitHub issue comment id `5399583362`

Later documentation moves require a final exact-head rerun before merge.

## R0-04B — real image/model provider

Required:

```text
B1  current supported provider selected                       ⏳
B2  credential-safe runtime binding                           ⏳
B3  real provider/model call with real PNG bytes              ⏳
B4  exact response correlation                                ⏳
B5  provider/model metadata in safe evidence                  ⏳
B6  provider secret absent from evidence/logs                 ⏳
B7  projection into established process-review path           ⏳
B8  exact-head live receipt                                   ⏳
```

GitHub Models is not an R0-04B candidate because that service is retired as of the current release date. A current provider must be used.

## R0-04 closure condition

R0-04 may be marked closed only when both are true:

```text
R0-04A REAL EXTERNAL CAPABILITY EFFECT   ✅
R0-04B REAL IMAGE PROVIDER INFERENCE     ✅
```

## Regression gates

For the final R0-04 head:
- architecture
- R0-01/02/03
- I9-07
- B7–B9 real Temporal
- B10 restart
- Image/current edge
- R0-04A live external effect
- R0-04B live provider proof

Unknown is not PASS.

## Next

R0-05 — one continuous final Private Technical Preview release certification and release candidate/tag/runbook closure.
