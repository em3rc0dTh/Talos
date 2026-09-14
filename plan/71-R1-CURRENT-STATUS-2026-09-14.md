# TALOS — R1 CURRENT STATUS

**Status:** CURRENT_STATUS  
**Date:** 2026-09-14  
**Program:** R1 — Talos 1.0 Product Completion  
**Gate definition:** `plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md`

This document exists because the R1 gate definition is intentionally stable while implementation has advanced beyond its original `Immediate execution order`. It records current progress without rewriting the historical plan.

## Current repository baseline

Latest product implementation milestone before the 2026-09-14 documentation-only commercial-audit commits:

```text
b37f754033c6252e6041d1ca25a299419320cd07
R1-03: add One-App process review and correction workspace
```

The 2026-09-14 commits after that milestone are documentation/reconciliation changes and do not independently prove new product behavior.

## R1 gate status

| Gate | Status | Evidence basis | Current interpretation |
|---|---|---|---|
| R1-01 Truthful source/perception UX | PARTIAL / ADVANCED | R1-01/R1-01A implementation + tests in commit history | Truthful image-stage work exists; no separate R1-01B closure commit was found in the current commit history search, so this document does not overclaim full gate closure. |
| R1-02 Real arbitrary-input image path in One-App | CLOSED BY COMMIT EVIDENCE | `81a62d395d2c6857924df543b99ecd60c1f42114` | Commit explicitly states the real One-App product intake gate was closed while preserving fail-closed truth boundaries. |
| R1-03 End-user process review/correction workspace | CLOSED BY COMMIT EVIDENCE, CI CAVEAT | `b37f754033c6252e6041d1ca25a299419320cd07` | Commit explicitly closes the review/correction gate. Its message records that hosted Actions failed before runner step 1 on the final head; prior exercised behavior is not silently upgraded to a fresh green CI claim. |
| R1-04 Business-process confirmation | NEXT OPEN PRODUCT GATE | R1 plan + no later product commit found | Confirmation must pin the exact reviewed/canonical revision and must not authorize automation automatically. |
| R1-05 Automation Design Workspace | OPEN | R1 plan | Not closed. |
| R1-06 ExecutionPlan review + automation approval | OPEN | R1 plan | Not closed. |
| R1-07 Runtime/deployment/execution authority | OPEN | R1 plan | Not closed. |
| R1-08 Real capability execution from full product path | OPEN | R1 plan | R0 proofs do not substitute for full R1 path proof. |
| R1-09 Durability/restart/upgrade | OPEN | R1 plan | Not closed for Talos 1.0. |
| R1-10 Product UX consolidation | OPEN | R1 plan | Current One-App surfaces are progress, not full 1.0 UX certification. |
| R1-11 Field trials | OPEN | No external field-trial evidence in current audit | Required before broad product claims. |
| R1-12 Exact-SHA Talos 1.0 certification | OPEN | No 1.0 release receipt | `PRODUCT READY` is forbidden until this closes. |

## Correct next execution sequence

```text
R1-04  business-process confirmation                 ← NEXT OPEN GATE
R1-05  Automation Design Workspace
R1-06  ExecutionPlan review + automation approval
R1-07  runtime / deployment / execution authority
R1-08  real capability effect from full product path
R1-09  durability / restart / upgrade behavior
R1-10  product UX consolidation
R1-11  real field trials
R1-12  exact-SHA Talos 1.0 release certification
```

R1-01 evidence should be reconciled/closed formally when the next implementation cycle touches that area; this does not block recognizing the explicit R1-02 and R1-03 closure claims already present in commit history.

## What the repository may say today

```text
Architecture foundation                   STRONG / CLOSED
R0 bounded technical preview              CERTIFIED HISTORICAL BASELINE
R1 One-App image intake                   IMPLEMENTED / GATE CLOSED BY COMMIT
R1 process review/correction              IMPLEMENTED / GATE CLOSED BY COMMIT
R1 business confirmation                  NOT CLOSED
Talos 1.0 PRODUCT READY                   NO
Design-partner ready                      NOT CERTIFIED
Paid-pilot ready                          NOT CERTIFIED
Repeatable commercial product             NOT PROVEN
```

## CI/evidence discipline

The R1-03 final commit states that hosted Actions failed before runner step 1. Current GitHub status/workflow lookup for that commit did not provide a recoverable green run. Therefore:

```text
IMPLEMENTATION COMMIT EXISTS               YES
COMMIT MESSAGE CLAIMS R1-03 GATE CLOSURE   YES
PRIOR BEHAVIOR WAS EXERCISED               CLAIMED BY COMMIT CONTEXT
FRESH GREEN HOSTED CI FOR FINAL HEAD        NOT ASSERTED HERE
```

A later certification may supersede this caveat with stronger evidence.

## Relationship to older roadmap v0.31

`plan/00-TALOS-ROADMAP-v0.31.md` is a valuable **2026-08-19 historical checkpoint** for the first tryable reference slice. Its `B10 — NEXT` statement must not be read as the current repository-wide product gate after R0/R1 work landed.

The current product completion authority is:

```text
plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md
+
this dated status document
```

## Commercial boundary

R1 progress is technical/product evidence. It does not prove customer value, willingness to pay or repeatability. Commercial readiness is tracked separately from `COMMERCIAL-AUDIT-START-HERE.md`.