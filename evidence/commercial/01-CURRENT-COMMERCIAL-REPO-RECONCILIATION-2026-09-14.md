# TALOS — CURRENT COMMERCIAL / REPOSITORY RECONCILIATION

**Date:** 2026-09-14  
**Class:** EVIDENCE + CURRENT_STATUS  
**Purpose:** Reconcile the commercial audit with the real repository state after the R0/R1 implementation work.

## Why this document exists

The preserved audit source asks whether Talos can evolve from framework to product without being rebuilt. Some of that source predates substantial repository work. This reconciliation prevents an older audit question from being mistaken for a current technical gap.

## What is now repository fact

### Architecture / semantic spine

The repository already defines and exercises the separation:

```text
source preservation
→ source-aware interpretation / evidence
→ Canonical + provenance + validation
→ human review/correction
→ semantic authority/freeze
→ capability/provider binding
→ ExecutionPlan
→ Temporal mapping/runtime
→ observation/evidence
```

The bounded reference slice remains valuable as a regression spine, not as the final product UX.

### R0

Commit history contains an exact release-certification milestone for **Talos v0.1 Private Technical Preview** (`009b266bbfc7d82218ba613bedf1ef14af0159fc`). This is a technical preview baseline, not a commercial-product certification.

### R1 productization

R1 explicitly changes the goal from reference demo to end-user product path.

Current product milestones evidenced in commit history:

```text
R1-01 / R1-01A
truthful image-stage UX and regression work

R1-02
real arbitrary-input image path connected to One-App
commit 81a62d395d2c6857924df543b99ecd60c1f42114

R1-03
One-App end-user review/correction workspace
commit b37f754033c6252e6041d1ca25a299419320cd07
```

R1-03 preserves original source evidence while corrections create governed revisions. That materially advances the product journey assumed by the commercial audit.

## What remains open technically

The current R1 plan still requires:

```text
R1-04 explicit business-process confirmation
R1-05 Automation Design Workspace
R1-06 ExecutionPlan review + automation approval
R1-07 runtime/deployment/execution authority path
R1-08 real capability effect from the full product path
R1-09 durability/restart/upgrade behavior
R1-10 product UX consolidation
R1-11 real field trials
R1-12 exact-SHA Talos 1.0 certification
```

These remain gates, not assumed capabilities.

## CI caveat preserved

The R1-03 merge commit itself records that hosted Actions were failing before runner step 1 on its final head and that the final delta from the previously exercised head was the stale-review conflict classification message. Current API lookup did not provide a recoverable green run for that final commit.

Therefore the allowed statement is:

> R1-03 is closed by repository commit evidence with an explicit final-head hosted-CI caveat.

The forbidden stronger statement is:

> The R1-03 final head has a freshly verified green hosted CI run.

## Commercial interpretation

The technical state is stronger than the original audit source alone suggests. Talos is no longer merely a semantic framework or a Temporal reference demo. It has an emerging One-App product surface for real image intake and governed review/correction.

However, the following remain **commercial hypotheses or missing external evidence**:

```text
customers materially value provenance
customers pay to reduce ambiguity before automation
Talos reduces discovery/rework cost in real engagements
multiple organizations can use the same Core without product-specific rewrites
capabilities are reusable across customers
external non-developer users can complete the journey successfully
paid-pilot willingness exists
repeatable product economics exist
```

## Conservative commercial level

```text
CR1 — Framework Works             STRONG EVIDENCE
CR2 — Internal Product            PARTIAL / ADVANCING
CR3 — Design Partner Ready        NOT CERTIFIED
CR4 — Paid Pilot Ready            NOT CERTIFIED
CR5 — Repeatable Pilot            NOT PROVEN
CR6 — Commercial Product          NOT PROVEN
CR7 — Scale Ready                 NOT EVALUATED
```

## Audit deltas

Some original audit questions have moved from "unknown" toward evidence:

| Audit concern | Current reconciliation |
|---|---|
| Source preservation | Strong internal evidence |
| Canonical/provenance/validation separation | Strong internal evidence |
| Human review/correction | Implemented in One-App R1-03 |
| Real image product intake | Implemented in One-App R1-02 |
| ExecutionPlan / Temporal separation | Strong bounded reference evidence |
| Product journey | Partial; intake + review exist, downstream product authority flow remains open |
| Full source→runtime lineage under recovery | Still requires R1-09 / later certification |
| Multi-customer isolation | Not commercially certified |
| Security/IAM for customer use | Not commercially certified |
| Market willingness-to-pay | No external proof recorded |
| Repeatability across customers | No external proof recorded |

## Correct conclusion

The repository should no longer describe **B10 from the 2026-08-19 roadmap as the current top-level next gate**. That statement belongs to the historical reference-slice checkpoint.

Current product direction is:

```text
R1 TALOS 1.0 PRODUCT COMPLETION
        ↓
R1-04 BUSINESS-PROCESS CONFIRMATION — NEXT OPEN GATE
        ↓
R1-05 ... R1-12
        ↓
TECHNICAL PRODUCT CERTIFICATION
        ↓
COMMERCIAL DESIGN-PARTNER / PAID-PILOT EVIDENCE
```

Technical product readiness and commercial readiness remain separate certifications.