# R1-05 — Automation Design Workspace v0.1

Status: CLOSED / CERTIFIED
Date: 2026-09-14
Prerequisite: R1-00 cumulative certification merged at `8aee78bf5c5c035eb70a7e0d697fc3d80c4c6647`
Certified implementation head: `60dd47fbba5c0446e1a9e248a88733c91799791b`
PR: #57

## Purpose

R1-05 turns an explicitly confirmed business process into a visible Automation Design Workspace without collapsing design exploration into implementation selection or execution authority.

The product journey is now:

`SOURCE → PERCEPTION → REVIEWED MEANING → BUSINESS CONFIRMATION → AUTOMATION DESIGN`

R1-05 stops there.

It does **not** imply:

`CAPABILITY SELECTION → EXECUTION PLAN → AUTOMATION APPROVAL → DEPLOYMENT → EXECUTION`.

## Existing certified engine reused

R1-05 does not introduce a new automation-design engine. It exposes the existing I8-03 Automation Design model and the existing One-App authority routes.

### Open design boundary

The product calls:

`POST /api/bpmn/automation-design-approval`

with the exact:

- BPMN revision ID;
- BusinessProcessConfirmationRecord ID;
- approving human identity;
- authority reference.

The backend validates the confirmation, performs the explicit semantic freeze handoff, derives the generic capability design from the frozen Canonical ProcessRevision, and opens an AutomationDesignWorkspace.

The returned workspace is explicitly non-binding:

- `createsBinding = false`;
- `capabilitySelectionCreated = false`;
- `bindingAuthorized = false`;
- `executionPlanAuthorized = false`.

### Suggestion-decision boundary

R1-05 may record an append-only user decision about an integration suggestion through:

`POST /api/automation/suggestion/decide`

Supported decisions are:

- `ACCEPT` — accept a suggested implementation direction;
- `REPLACE` — record an explicit replacement direction;
- `REJECT` — reject the suggestion;
- `DEFER` — leave the implementation direction undecided.

These decisions remain design evidence only. They do not create a CapabilitySelectionDecision, CapabilityBindingRevision, or ExecutionPlan authorization.

## Product surface

After R1-04 confirms the exact business process, it publishes the exact confirmation context to the next product stage. R1-05 then enables `Open automation design`.

The workspace shows:

- workspace revision;
- workspace state;
- capability requirements;
- requirement design state;
- available integration suggestions;
- explicit ACCEPT / REPLACE / REJECT / DEFER controls where suggestions exist;
- visible badges stating that binding, capability selection and ExecutionPlan authority remain NO.

A new source import or process correction invalidates the local R1-05 product state and requires a new explicit business-process confirmation before Automation Design can reopen.

## Authority separation

The R1-05 browser extension deliberately contains no calls to:

- `/api/automation/capability/select`;
- `/api/automation/execution-plan/review`;
- `/api/automation/approve`;
- deployment actions;
- workflow-execution start actions.

Those remain later independent product gates.

## Stale-safety and append-only behavior

The backend workspace remains pinned to the exact CapabilityDesignRevision. Suggestion decisions create a new workspace revision and supersede the prior workspace revision. Duplicate decisions for the same suggestion and competing accepted directions are rejected by the existing I8-03 engine.

The product always submits the exact active `workspaceId` returned by the backend.

## Certified acceptance criteria

1. R1-00 through R1-04 continue to pass — PASS.
2. Product page exposes Automation Design only after explicit business confirmation — PASS.
3. Opening design requires the exact confirmation record — PASS.
4. Product reuses `/api/bpmn/automation-design-approval` rather than creating a parallel engine — PASS.
5. Workspace truth visibly exposes non-binding state — PASS.
6. Suggestion decisions use the existing append-only decision route — PASS.
7. R1-05 exposes no capability-selection, ExecutionPlan-review, automation-approval, deployment, or execution action — PASS.
8. Image Vertical Slice #724 — SUCCESS.
9. B7–B9 Temporal reference runtime #939 — SUCCESS.
10. B10 Restart safety #571 — SUCCESS.

## Certification truth boundary

This gate proves internal product and regression coherence for the bounded R1-05 stage. It does not certify production readiness, commercial readiness, multi-tenant isolation, external-customer validation, deployment authority, or workflow-execution authority.

After this documentation seal, all three repository workflows must run once more on the exact final PR head before merge.
