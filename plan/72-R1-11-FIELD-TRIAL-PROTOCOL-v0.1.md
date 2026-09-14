# R1-11 — Real Field Trial Protocol v0.1

Status: ACTIVE / EXTERNAL EVIDENCE REQUIRED
Date: 2026-09-14
Prerequisite: R1-00 through R1-10 technically closed and merged.

## Purpose

R1-11 is not another implementation test. It exists to determine whether a real operator can take a real business process through the Talos product journey and whether Talos creates useful, understandable and governable results outside the implementation team's fixture set.

No quarry, golden fixture, synthetic BPMN, CI run, developer-operated smoke test, or LLM-authored scenario counts as an R1-11 field trial by itself.

## Minimum closure rule

R1-11 requires at least **two completed field-trial receipts** whose `processFingerprint` values are different.

Every qualifying receipt must:

1. describe a real operational or customer process;
2. include a participant who is external to the Talos implementation team for that trial;
3. record the source/input kinds actually used;
4. measure reviewer effort and elapsed time to reviewed/approved state;
5. record question usefulness, correction usability, automation-suggestion quality and authority clarity;
6. record the workflow execution outcome or the explicit reason execution was intentionally not attempted;
7. record operator friction and defects without suppressing negative observations;
8. include evidence references and an attestation timestamp;
9. contain no credentials, tokens or private secrets.

Two receipts for the same process are useful regression evidence but do not satisfy the distinct-process minimum.

## Required metrics

Each receipt records:

- semantic accuracy after review (0.0–1.0);
- reviewer effort in minutes;
- question usefulness (1–5);
- correction usability (1–5);
- automation-suggestion quality (1–5);
- authority clarity (1–5);
- time to reviewed state in minutes;
- time to approved state in minutes, or `null` when not reached;
- execution outcome: `COMPLETED`, `FAILED`, `NOT_ATTEMPTED`, or `BLOCKED_BY_OPERATOR`;
- operator friction notes;
- defects found, including severity and whether each defect blocked the trial.

## Evidence location

Qualifying receipts belong under:

`evidence/field-trials/*.json`

The machine contract is `talos.r1-11.field-trial.v1` and is validated by:

`scripts/r1-11-field-trial-gate.ts`

## Truth boundary

A receipt proves only the observed trial. It does not establish product-market fit, broad commercial readiness or scale readiness.

R1-11 becomes `CLOSED / PASS` only when the validator reports PASS against real receipts and a human review confirms that the receipts correspond to actual field work.

## After R1-11

Only after R1-11 closes may R1-12 run the exact-SHA Talos 1.0 release certification. Until then the repository must not claim:

`Talos 1.0 — PRODUCT READY`
