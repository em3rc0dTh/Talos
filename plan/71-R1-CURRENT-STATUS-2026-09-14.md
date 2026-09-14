# TALOS — R1 CURRENT STATUS

**Status:** CURRENT_STATUS  
**Date:** 2026-09-14  
**Program:** R1 — Talos 1.0 Product Completion  
**Gate definition:** `plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md`

This document records current progress without rewriting the historical R1 gate definition.

## Current repository baseline

Latest merged product-completion milestone:

```text
19057ff91f1661cd2bc4f62e86587ab05b41b859
R1-06→R1-10 — Talos 1.0 product completion
```

PR #58 reached a green certification envelope before merge:

```text
Image vertical slice                    #744  PASS
B7-B9 Temporal reference runtime        #971  PASS
B10 Restart safety                      #591  PASS
R0 Private preview release gates        #297  PASS
```

The R1-08 live gate in that envelope exercised the complete One-App authority path through real Temporal execution into the GitHub issue-comment transport, then repeated the same approved effect with a fresh Worker and required external deduplication.

The merge itself does not claim R1-11 field-trial evidence and does not authorize `Talos 1.0 — PRODUCT READY`.

## R1 gate status

| Gate | Status | Evidence basis | Current interpretation |
|---|---|---|---|
| R1-00 Product-completion prerequisites | CLOSED / CERTIFIED | R1 prerequisite certification + regression inventory | The R1 product program starts from a certified prerequisite baseline rather than unresolved pre-R1 debt. |
| R1-01 Truthful source/perception UX | CLOSED / CERTIFIED IN R1 BASELINE | R1-01/R1-01A implementation + cumulative R1 prerequisite certification | Source/perception state is represented separately from capability availability and downstream authority. |
| R1-02 Real arbitrary-input image path in One-App | CLOSED | `81a62d395d2c6857924df543b99ecd60c1f42114` + later regressions | Real One-App product intake preserves fail-closed truth boundaries. |
| R1-03 End-user process review/correction workspace | CLOSED | `b37f754033c6252e6041d1ca25a299419320cd07` + later green cumulative regressions | Append-only correction/review path remains covered by later full R1 regressions, superseding the old hosted-Actions caveat as the strongest current evidence. |
| R1-04 Business-process confirmation | CLOSED / CERTIFIED | R1 product regression baseline before PR #58 | Confirmation pins exact BPMN/Canonical revisions and grants no automatic automation/execution authority. |
| R1-05 Automation Design Workspace | CLOSED / CERTIFIED | R1 product regression baseline before PR #58 | Requirements, suggestions and decisions remain distinct from binding/selection. |
| R1-06 ExecutionPlan review + automation approval | CLOSED / MERGED | PR #58; green Image #744 | Product surface exposes explicit capability selection/binding, user-reviewable ExecutionPlan and exact plan approval. Runtime/deploy/execute remain downstream. |
| R1-07 Runtime/deployment/execution authority | CLOSED / MERGED | PR #58; green Image #744 + I9 regressions | Eight separate product actions preserve Temporal mapping, RuntimePolicy, deployment, execution approval and single-use execution authority. |
| R1-08 Real capability execution from full product path | CLOSED / REAL EFFECT PROVEN | PR #58; R1-08 live test in Image #744 | Complete One-App → Temporal → GitHub real external effect executed; fresh Worker replay produced external deduplication rather than duplicate effect. |
| R1-09 Durability/restart/upgrade | CLOSED / MERGED | PR #58; green R1-09 + B10 | Same-runtime recovery reconstructs durable history without resurrecting consumable authority; incompatible runtime version is explicitly rejected. |
| R1-10 Product UX consolidation | CLOSED / MERGED | PR #58; green R1-10 | Primary One-App surface consolidates product stages, authority truth, recovery and history while raw JSON remains debug/evidence detail. |
| R1-11 Field trials | OPEN / EXTERNAL EVIDENCE REQUIRED | `plan/72-R1-11-FIELD-TRIAL-PROTOCOL-v0.1.md` | Requires two qualifying real field trials across two distinct process fingerprints, each involving a participant external to the Talos implementation team. |
| R1-12 Exact-SHA Talos 1.0 certification | PREPARED / BLOCKED BY R1-11 | `plan/73-R1-12-TALOS-1.0-RELEASE-CERTIFICATION-v0.1.md` | Release workflow can certify only the exact current merged-main SHA and only after R1-11 PASS. No release receipt exists yet. |

## Current execution sequence

```text
R1-00 → R1-10   CLOSED / MERGED
        ↓
R1-11            REAL FIELD TRIALS  ← CURRENT BLOCKER
        ↓
R1-12            EXACT-SHA TALOS 1.0 CERTIFICATION
        ↓
Talos 1.0 — PRODUCT READY
```

No new technical product gate inside R1-01→R1-10 is currently blocking Talos 1.0. The remaining blocker is real external evidence followed by release certification.

## R1-11 closure contract

Protocol:

```text
plan/72-R1-11-FIELD-TRIAL-PROTOCOL-v0.1.md
```

Evidence location:

```text
evidence/field-trials/*.json
```

Machine validator:

```text
build/reference-vertical-slice/scripts/r1-11-field-trial-gate.ts
```

Closure requires at least two qualifying receipts and at least two distinct `processFingerprint` values. A fixture, quarry, developer-operated run, CI test or LLM-created scenario is not a qualifying field trial by itself.

## R1-12 certification contract

Prepared workflow:

```text
.github/workflows/r1-12-talos-1-release-certification.yml
```

Prepared receipt schema:

```text
talos.r1-12.release-receipt.v1
```

The workflow fails unless:

```text
checked-out HEAD == operator expected SHA == current origin/main
AND
R1-11 field-trial validator == PASS
```

It then runs clean install, architecture/frozen invariants, B1–B10, image/source/edge chains, the R1 product suite, R1-08 live external effect + replay deduplication, R1-09 restart/version behavior, and secret-safety assertions before generating a release receipt artifact.

Permanent external-effect evidence sink:

```text
GitHub issue #59
Talos 1.0 release certification external-effect sink
```

## What the repository may say today

```text
Architecture foundation                   CLOSED
R0 bounded technical preview              CERTIFIED HISTORICAL BASELINE
R1-00 → R1-10 product gates               CLOSED / MERGED
Full governed One-App → Temporal path      IMPLEMENTED / CERTIFIED INTERNALLY
Real GitHub external effect                PROVEN FROM FULL PRODUCT PATH
Restart + runtime-version behavior         CERTIFIED WITHIN R1 SCOPE
R1-11 real field trials                    NOT YET CLOSED
R1-12 exact-SHA release                    NOT YET CERTIFIED
Talos 1.0 PRODUCT READY                    NO
Design-partner ready                       NOT CERTIFIED
Paid-pilot ready                           NOT CERTIFIED
Repeatable commercial product              NOT PROVEN
```

## Evidence discipline

Current strongest technical evidence no longer depends on the old R1-03 standalone CI caveat; later cumulative product regressions exercise and preserve those earlier behaviors. The evidence hierarchy is therefore:

```text
LATEST CUMULATIVE GREEN R1 REGRESSION
        >
EARLIER INDIVIDUAL GATE COMMIT EVIDENCE
        >
HISTORICAL PLAN / CLAIM
```

This does not allow later tests to manufacture field-trial or commercial evidence.

## Relationship to older roadmap v0.31

`plan/00-TALOS-ROADMAP-v0.31.md` remains a **2026-08-19 historical checkpoint** for the first tryable reference slice. Its `B10 — NEXT` statement must not be read as current repository-wide product truth.

Current product completion authority is:

```text
plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md
+
this dated status document
+
plan/72-R1-11-FIELD-TRIAL-PROTOCOL-v0.1.md
+
plan/73-R1-12-TALOS-1.0-RELEASE-CERTIFICATION-v0.1.md
```

## Commercial boundary

R1 technical/product closure through R1-10 does not prove customer value, willingness to pay, repeatability, product-market fit or scale readiness. Those remain separate commercial evidence questions tracked from `COMMERCIAL-AUDIT-START-HERE.md`.
