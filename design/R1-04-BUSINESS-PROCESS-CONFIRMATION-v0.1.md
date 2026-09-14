# R1-04 — Business-Process Confirmation v0.1

Status: CLOSED / CI CERTIFIED
Certified implementation head: `23d69fc0cde0505354dd9baf0558077d43932a0f`
Certification date: 2026-09-14
PR: #55

## Purpose

R1-04 turns the reviewed process produced by R1-03 into an explicit human-confirmed business-process revision without granting any later automation, deployment, or execution authority.

The product preserves the authority chain:

`SOURCE → PERCEPTION / IMPORT → REVIEWED MEANING → BUSINESS CONFIRMATION → later independent authorities`

Business confirmation means only:

> I reviewed this exact BPMN review revision and the exact Canonical ProcessRevision to which it is reconciled, and I confirm that they represent the business process Talos may use as the semantic basis for later automation design.

It does **not** mean:

- approve Automation Design;
- create a SemanticFreezeRecord automatically;
- bind capabilities;
- approve an ExecutionPlan;
- approve a Temporal mapping;
- approve deployment;
- authorize workflow execution.

## Existing authoritative backend reused

R1-04 does not introduce a second confirmation engine. The product shell calls the existing One-App authority boundary:

`POST /api/bpmn/confirm`

That backend requires:

- an exact BPMN revision;
- an exact reconciled Canonical ProcessRevision;
- explicit `confirmedBy`;
- explicit `authorityRef`;
- optional reviewer rationale;
- DRAFT state before confirmation;
- canonical alignment before confirmation.

For image-origin processes, the existing authority bridge converts the exact inferred semantic claims into a new `HUMAN_CONFIRMATION` ProcessRevision, revalidates it, aligns the same BPMN semantics to that new canonical revision, and appends a `BusinessProcessConfirmationRecord`.

For native BPMN, the confirmation record is append-only and the BPMN payload remains immutable.

## Stale-safety boundary

R1-03 owns corrected-review stale safety. When a correction creates a new review head, the previous active binding is retired. The old revision remains inspectable as history but cannot be edited or confirmed through the One-App active authority path.

R1-04 preserves that contract and creates no bypass.

A mismatched Canonical ProcessRevision is rejected as HTTP `409 Conflict`, which is the certified authority/version-conflict behavior.

## Product surface

The R1 product shell adds a dedicated `Business-process confirmation` surface after the process-review candidate exists.

The user sees:

- the authority boundary in plain language;
- a rationale field;
- a `Confirm business process` action;
- the fact that the exact BPMN review revision and exact Canonical ProcessRevision are being pinned;
- explicit notice that automation design, deployment and execution remain unauthorized.

The browser action sends:

- `revisionId`;
- `canonicalProcessRevisionId`;
- `confirmedBy`;
- `authorityRef`;
- `rationale`.

After a successful confirmation the product session locks BPMN correction controls for that confirmed revision and marks business confirmation as complete. No later authority action is invoked by the R1-04 extension.

## Non-goals

R1-04 does not implement R1-05 Automation Design Workspace. It does not create capability selections, ExecutionPlans, Temporal policies, deployments, workers or workflow starts.

## Acceptance criteria — CLOSED

1. The One-App product page visibly exposes explicit business-process confirmation. ✅
2. Confirmation calls the existing `/api/bpmn/confirm` authority boundary. ✅
3. A mismatched Canonical ProcessRevision is rejected with `409 Conflict`. ✅
4. A confirmed native BPMN revision cannot be confirmed a second time. ✅
5. Confirmation returns a `BusinessProcessConfirmationRecord` pinned to the exact BPMN and Canonical revisions. ✅
6. The response keeps `automaticAutomationDesignAuthorized=false` and `automaticExecutionAuthorized=false`. ✅
7. The R1 regression suite passes in repository CI. ✅

## Certification evidence

The exact implementation head `23d69fc0cde0505354dd9baf0558077d43932a0f` passed:

- Image vertical slice #712 — SUCCESS, including R1 product regression and the complete B2/B3/B4 + I0–I7C/current-image chain;
- B7–B9 Temporal reference runtime #921 — SUCCESS;
- B10 Restart safety #563 — SUCCESS.

R1-04 is therefore closed. The next product gate is R1-05 — Automation Design Workspace, which remains a separate authority and product stage.
