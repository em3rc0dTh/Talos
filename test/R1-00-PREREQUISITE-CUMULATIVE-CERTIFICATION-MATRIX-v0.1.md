# R1-00 — Prerequisite Cumulative Certification Matrix v0.1

Status: **PENDING CI**
Date: 2026-09-14

| Gate | Product truth being re-certified | Automated evidence | Pre-R1-05 verdict |
|---|---|---|---|
| R1-01 | UI stage truth reflects current-input evidence, not capability existence | `r1-01-image-stage-truth.test.ts` | PENDING |
| R1-02 | One-App preserves source, exposes inference as unconfirmed, fails closed without live perception | `r1-02-one-app-product-intake.test.ts` | PENDING |
| R1-03 | Review/correction is append-only, revalidated, lineage-preserving, stale-safe | `r1-03-one-app-process-review*.test.ts` | PENDING |
| R1-04 | Confirmation pins exact BPMN + Canonical revisions and grants no downstream automatic authority | `r1-04-business-process-confirmation.test.ts` | PENDING |
| R1-00 cumulative | The complete product authority chain remains coherent before R1-05 | `r1-00-prerequisite-cumulative-certification.test.ts` + CI workflows | PENDING |

## Required regression envelope

A PASS requires the cumulative R1 tests plus the existing B/I/Temporal/restart regressions exercised by repository CI. Historical PASS receipts are supporting evidence only; they do not replace a green run on the final certification head.
