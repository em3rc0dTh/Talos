# R1-05 — Automation Design Workspace Receipt v0.1

Status: CLOSED / PASS
Date: 2026-09-14
Branch: `feat/r1-05-automation-design-workspace`
PR: #57
Certified implementation head: `60dd47fbba5c0446e1a9e248a88733c91799791b`

## Scope certified

R1-05 certifies that the One-App product can move from an exact explicit business-process confirmation into Automation Design while preserving later authority boundaries.

## Product evidence certified

- R1-04 publishes exact `revisionId`, `canonicalProcessRevisionId`, and `confirmationId` after successful human confirmation.
- R1-05 remains disabled until that confirmation context exists.
- `Open automation design` calls the existing `POST /api/bpmn/automation-design-approval` boundary.
- The exact confirmed Canonical ProcessRevision is the semantic basis pinned into the opened AutomationDesignWorkspace.
- The product renders the returned AutomationDesignWorkspace, requirements, state, and available integration suggestions.
- Suggestion decisions call the existing `POST /api/automation/suggestion/decide` route.
- ACCEPT / REPLACE / REJECT / DEFER are explicit product actions.
- New source intake or correction invalidates the local design surface and requires reconfirmation.

## Explicit non-authorities preserved

The R1-05 product extension does not call capability selection, ExecutionPlan review, automation approval, deployment, or workflow execution.

A successfully opened workspace remains:

- `createsBinding=false`;
- `capabilitySelectionCreated=false`;
- `bindingAuthorized=false`;
- `executionPlanAuthorized=false`;
- deployment unauthorized;
- execution unauthorized.

## Automated gate

`build/reference-vertical-slice/tests/r1-05-automation-design-workspace.test.ts`

Certified behaviors:

1. product shell exposes Automation Design and explicit authority-boundary language — PASS;
2. product shell contains no downstream capability-selection, ExecutionPlan-review, automation-approval, deployment, or execution route — PASS;
3. the served One-App product composes R1-04 confirmation and R1-05 Automation Design client-side — PASS;
4. opening Automation Design before exact business confirmation is rejected with HTTP `409 Conflict` — PASS;
5. exact BPMN + exact Canonical business confirmation succeeds but automatically authorizes neither Automation Design nor execution — PASS;
6. explicit Automation Design handoff succeeds and freezes the exact confirmed semantic baseline — PASS;
7. the opened workspace is pinned to the exact confirmed Canonical ProcessRevision — PASS;
8. workspace remains non-binding and creates no CapabilitySelection, ExecutionPlan, deployment, or execution authority — PASS;
9. ACCEPT / REPLACE / REJECT / DEFER remain design decisions only — PASS.

The existing `image-i8-03-automation-design-workspace.test.ts` remains the authoritative engine regression for append-only suggestion decisions, stale workspace pins, duplicate decisions, and competing accepted directions.

## CI evidence

Implementation head `60dd47fbba5c0446e1a9e248a88733c91799791b` passed:

- **Image vertical slice #724** — SUCCESS. Architecture, frozen B2/B3/B4, I0–I4, complete R1 product regression including R1-00 through R1-05, I5A/I5B/I5C, I6, I7, and current image edge I8/I9 all passed.
- **B7–B9 Temporal reference runtime #939** — SUCCESS.
- **B10 Restart safety #571** — SUCCESS.

The preceding Image run #723 failed only two newly added R1-05 test expectations: one assumed the client-side product surfaces were static HTML nodes, and one compared the workspace pin against a nonexistent response field. No product behavior or authority boundary was weakened. The assertions were corrected to certify the actual client-side composition and the exact confirmed Canonical ProcessRevision pin; #724 then passed the complete regression envelope.

## Final-head rule

This receipt records the certified functional head above. After sealing documentation, a no-behavior comment-only change in the One-App product server is used to force Image, B7–B9 and B10 to execute again on the exact final PR head. PR #57 must not merge unless that final head is also green.

## Verdict

**R1-05 CLOSED / PASS at the certified implementation level.**

The Automation Design Workspace is now a visible product stage after exact business-process confirmation. It permits explicit design exploration and append-only suggestion decisions, while capability selection, binding, ExecutionPlan authority, automation approval, deployment, and workflow execution remain separate later gates.
