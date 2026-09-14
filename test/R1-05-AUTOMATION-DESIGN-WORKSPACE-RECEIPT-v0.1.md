# R1-05 — Automation Design Workspace Receipt v0.1

Status: PENDING CI
Date: 2026-09-14
Branch: `feat/r1-05-automation-design-workspace`

## Scope under certification

R1-05 certifies that the One-App product can move from an exact explicit business-process confirmation into Automation Design while preserving later authority boundaries.

## Product evidence implemented

- R1-04 publishes exact `revisionId`, `canonicalProcessRevisionId`, and `confirmationId` after successful human confirmation.
- R1-05 remains disabled until that confirmation context exists.
- `Open automation design` calls the existing `POST /api/bpmn/automation-design-approval` boundary.
- The product renders the returned AutomationDesignWorkspace, requirements, state, and available integration suggestions.
- Suggestion decisions call the existing `POST /api/automation/suggestion/decide` route.
- ACCEPT / REPLACE / REJECT / DEFER are explicit product actions.
- New source intake or correction invalidates the local design surface and requires reconfirmation.

## Explicit non-authorities

The R1-05 product extension does not call capability selection, ExecutionPlan review, automation approval, deployment, or workflow execution.

A successfully opened workspace must remain:

- `createsBinding=false`;
- `capabilitySelectionCreated=false`;
- `bindingAuthorized=false`;
- `executionPlanAuthorized=false`;
- deployment unauthorized;
- execution unauthorized.

## Automated gate

`build/reference-vertical-slice/tests/r1-05-automation-design-workspace.test.ts`

The gate checks product HTML, served One-App composition, exact-confirmation ordering, opening the real backend Automation Design workspace, and downstream non-authority.

The existing `image-i8-03-automation-design-workspace.test.ts` remains the authoritative engine regression for append-only suggestion decisions, stale workspace pins, duplicate decisions, and competing accepted directions.

## Final certification condition

Do not mark R1-05 CLOSED until the final PR head is green for:

1. Image vertical slice including the R1 product regression set;
2. B7–B9 Temporal reference runtime;
3. B10 Restart safety.
