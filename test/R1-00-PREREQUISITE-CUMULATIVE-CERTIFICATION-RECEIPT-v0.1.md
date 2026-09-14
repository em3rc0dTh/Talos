# R1-00 — Prerequisite Cumulative Certification Receipt v0.1

Status: **PENDING CI**
Date: 2026-09-14
Base main head: `a9d80bd978bdc75f199323b395f4d6527b0abf36`
Branch: `cert/r1-prerequisites-before-r1-05`

## Purpose

This gate exists solely to re-certify all product prerequisites that must remain true before R1-05 Automation Design Workspace is allowed to advance.

It does not add product behavior and it does not authorize automation, deployment, or execution.

## Product prerequisites under cumulative certification

### R1-01 — Image Stage Truth

Talos must distinguish capability availability from truth about the current uploaded source. Stage indicators may only report PASS when the current input has actually produced that evidence.

### R1-02 — One-App Product Intake

The product must preserve the source before interpretation, use the One-App image boundary, keep inference visibly unconfirmed, and fail closed when live perception is not configured.

### R1-03 — One-App Process Review and Correction

The inferred process must be reviewable and correctable append-only. Corrections must create a new BPMN revision and a new reconciled Canonical ProcessRevision, preserve source lineage, require reconfirmation, and retire stale review authority.

### R1-04 — Explicit Business-Process Confirmation

Human business-process confirmation must pin the exact BPMN review revision and exact Canonical ProcessRevision. It must not automatically authorize Automation Design, semantic freeze, capability binding, ExecutionPlan approval, deployment, or execution.

## Technical prerequisite chain also required

The certifying PR must keep the repository-wide regression chain green, including:

- architecture verification;
- frozen B2 source intake;
- frozen B3 canonical/validation;
- frozen B4 review/freeze behavior;
- I0–I4 source/perception/evidence/review/canonical stages;
- R1 product regression glob, including this cumulative gate and R1-01 through R1-04;
- I5A/I5B/I5C authority, freeze, capability and ExecutionPlan foundations;
- I6 real Temporal runtime integration;
- I7 source/BPMN/correlation/security boundaries;
- current image edge, including I8 and I9 product/runtime regressions;
- B7–B9 Temporal reference runtime workflow;
- B10 restart safety workflow.

## Truth boundary

A green cumulative certification means only that the currently implemented prerequisites remain internally coherent and regression-safe on the certified repository head.

It does **not** mean:

- production readiness;
- commercial readiness;
- multi-tenant certification;
- real-customer validation;
- authorization to skip R1-05 review/authority boundaries;
- authorization to deploy or execute workflows automatically.

## Closure condition

Mark this receipt **CLOSED / PASS** only when the final PR head reports green for:

1. Image vertical slice, including `Run R1 product regression gates`;
2. B7–B9 Temporal reference runtime;
3. B10 Restart safety.

After closure, R1-05 may begin from the certified `main` head.
