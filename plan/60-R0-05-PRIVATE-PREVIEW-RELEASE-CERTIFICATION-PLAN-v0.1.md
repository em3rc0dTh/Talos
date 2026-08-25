# R0-05 — Private Technical Preview Release Certification — Closure Plan v0.1

Status: ACTIVE  
Date: 2026-08-24

## Objective

Close Talos v0.1 with one evidence-backed Private Technical Preview release artifact.

## Gate checklist

```text
R5-01  exact SHA checkout asserted before testing                     ⏳
R5-02  exact npm lock + pinned Python/model runtime                   ⏳
R5-03  architecture + B1–B9 reference runtime                        ⏳
R5-04  complete image I0–I9 authority/product chain                  ⏳
R5-05  R0-01/02/03 preview shell                                     ⏳
R5-06  B10 restart/durable recovery                                  ⏳
R5-07  I9 explicit workflow-execution authority                      ⏳
R5-08  R0-04A real Temporal → GitHub effect on exact SHA             ⏳
R5-09  R0-04B real PNG → pinned model/CV → admitted review           ⏳
R5-10  provider/access secrets absent from logs/evidence              ⏳
R5-11  candidate PR run green                                        ⏳
R5-12  clean PR merge                                                ⏳
R5-13  same R0-05 workflow green on exact merged `main` SHA          ⏳
R5-14  exact merged-main release receipt                             ⏳
R5-15  release tag/notes bound to certified SHA                      ⏳
```

## Candidate rule

The PR candidate may be merged only when its exact head completes R5-01 through R5-11 and the live diff contains only R0-05 release-certification material.

A green candidate is not the final release.

## Main rule

After merge, capture the exact `main` SHA and require an R0-05 `push` workflow on that same SHA.

If any required step fails on merged `main`:

```text
UNKNOWN / FAILED
    → NO RELEASE CLAIM
    → repair through a new PR
    → merge
    → repeat exact-main certification
```

No manual interpretation may convert a failed/unknown live gate into PASS.

## Required final receipt

Receipt fields:
- scope: `TALOS_V0_1_PRIVATE_TECHNICAL_PREVIEW`
- exact merged-main SHA
- event: `push`
- ref: `refs/heads/main`
- architecture/core result
- image authority-chain result
- preview/restart result
- R0-04A real external effect result
- R0-04B real model result
- secret-safe result
- release authority: `CERTIFIED_MERGED_MAIN`

## Tag

Only after R5-13/R5-14:

```text
v0.1.0-private-preview
```

must point to the exact certified merged-main SHA. Release notes must preserve the Private Technical Preview scope and non-goals.

## Closure condition

```text
R0-01 ✅
R0-02 ✅
R0-03 ✅
R0-04A ✅
R0-04B ✅
R0-05 exact merged-main ✅
        ↓
TALOS v0.1 — PRIVATE TECHNICAL PREVIEW READY
```
