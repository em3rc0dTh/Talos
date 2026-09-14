# R1-04 — Business-Process Confirmation Receipt v0.1

Status: CLOSED / PASS
Date: 2026-09-14
Branch: `feat/r1-04-business-process-confirmation`
PR: #55
Certified implementation head: `23d69fc0cde0505354dd9baf0558077d43932a0f`

## Scope certified

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

Certified behaviors:

1. product HTML includes the explicit confirmation surface and authority language — PASS;
2. the served One-App product page includes the R1-04 confirmation extension — PASS;
3. mismatched Canonical revision confirmation is rejected as HTTP `409 Conflict` — PASS;
4. exact BPMN + Canonical confirmation succeeds — PASS;
5. the resulting confirmation record pins both exact revisions and the explicit authority reference — PASS;
6. automatic Automation Design authority remains false — PASS;
7. automatic execution authority remains false — PASS;
8. duplicate confirmation of the same native BPMN revision is rejected — PASS.

## Pre-existing stale safety preserved

R1-03 retires a corrected review head from the active One-App binding map. Its regression test requires a stale confirmation attempt against that superseded revision to fail with HTTP 409. R1-04 relies on and preserves that boundary rather than introducing a parallel stale-state mechanism.

## CI evidence

The implementation head `23d69fc0cde0505354dd9baf0558077d43932a0f` was exercised by the PR workflows:

- **Image vertical slice #712** — SUCCESS. The job passed architecture verification, frozen B2/B3/B4, I0–I4, **R1 product regression**, I5A/I5B/I5C, I6, I7A, I7B, I7C and current image edge.
- **B7–B9 Temporal reference runtime #921** — SUCCESS.
- **B10 Restart safety #563** — SUCCESS.

An earlier run (#711) correctly failed the new R1-04 test because the test expected HTTP 400 for a Canonical revision mismatch while the existing One-App conflict boundary returns HTTP 409. No product behavior was weakened: the test expectation was corrected to certify the existing conflict semantics, then #712 passed the complete suite.

## Verdict

**R1-04 CLOSED.**

Business-process confirmation is now a visible, explicit, pinned human-authority operation in the One-App product path, while Automation Design, deployment and workflow execution remain independently unauthorized.
