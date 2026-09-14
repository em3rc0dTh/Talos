# R1-04 — Business-Process Confirmation Receipt v0.1

Status: PENDING CI
Date: 2026-09-14
Branch: `feat/r1-04-business-process-confirmation`
PR: #55

## Scope under certification

R1-04 certifies the explicit human business-process confirmation gate in the One-App product path.

## Evidence implemented

- Product shell renders a dedicated `Business-process confirmation` surface.
- Product action calls the existing `POST /api/bpmn/confirm` authority boundary.
- Exact BPMN revision and exact Canonical ProcessRevision are submitted together.
- `confirmedBy`, `authorityRef`, and reviewer rationale are explicit.
- Product session locks correction controls after successful confirmation.
- UI states explicitly that process confirmation is not automation approval, deployment approval, or execution approval.
- R1-04 extension contains no call to Automation Design approval, automation approval, or workflow execution start routes.

## Automated gate

`build/reference-vertical-slice/tests/r1-04-business-process-confirmation.test.ts`

The test certifies:

1. product HTML includes the explicit confirmation surface and authority language;
2. the served One-App product page includes the R1-04 confirmation extension;
3. mismatched Canonical revision confirmation is rejected;
4. exact BPMN + Canonical confirmation succeeds;
5. the resulting confirmation record pins both exact revisions and the explicit authority reference;
6. automatic Automation Design authority remains false;
7. automatic execution authority remains false;
8. duplicate confirmation of the same native BPMN revision is rejected.

## Pre-existing stale safety preserved

R1-03 already retires a corrected review head from the active One-App binding map. Its regression test requires a stale confirmation attempt against that superseded revision to fail with HTTP 409. R1-04 relies on and preserves that boundary rather than introducing a parallel stale-state mechanism.

## Final certification condition

Do not mark R1-04 CLOSED until GitHub Actions reports the PR-head R1/Image Vertical Slice regression green.
