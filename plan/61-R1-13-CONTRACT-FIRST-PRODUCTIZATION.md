# R1-13 — Contract-First Productization Plan

Contract baseline: `design/45-TALOS-PRODUCT-CONTRACT-v1.0.md`

## Objective

Convert the already-certified Talos semantic/runtime engine into the contract-defined product workspace without weakening canonical truth, confirmation or execution-authority boundaries.

## Gate A — Contract freeze and translation workspace foundation

- Freeze Product Contract v1.0 in-repository.
- Add a three-view Translation Workspace: Business Canvas / BPMN / Temporal.
- Keep current source routes intact.
- Add a visual Canvas surface over the existing structured Canvas source contract.
- Preserve the structured form as inspector/advanced structure rather than the primary visual editor.
- Add contract regression tests.

Exit:
- visual Canvas exists;
- confirmed process can be shown as Canvas and BPMN;
- Temporal is visibly a design/export destination, not synonymous with implementation.

## Gate B — Portable BPMN and Temporal outputs

BPMN:
- exact XML view;
- copy XML;
- download .bpmn;
- visual preview.

Temporal:
- deterministic source export from exact confirmed ExecutionPlan + TemporalMapping;
- workflow.ts;
- activities.ts;
- workflow.manifest.json;
- process.bpmn;
- README.md;
- source copy;
- package download;
- no credentials;
- no deployment/execution authority.

Exit:
- a user can stop after BPMN or Temporal export and retain portable artifacts.

## Gate C — Optional implementation boundary

- Replace default Run-first framing with explicit **Implement with Temporal**.
- Runtime policy, target, deployment and Worker actions remain inaccessible until implementation is chosen.
- Preserve every existing authority record and one-start boundary.
- Humanize business-facing errors.

Exit:
- Temporal export and Temporal execution are clearly different product states.

## Gate D — Product hardening

- round-trip and export/import regression;
- durable workspace recovery;
- branch/wait/human-task visual parity;
- source-route parity: Image / Native BPMN / Canvas;
- restart proof;
- field trial with non-technical users;
- exact-SHA R1-12 certification after all R1-13 contract gates are green.

## Non-negotiable invariants

1. Canonical meaning does not derive from Temporal implementation details.
2. Generated outputs do not create runtime authority.
3. Missing integrations may block execution readiness but not necessarily export readiness.
4. No credentials are included in exported source/packages.
5. Simple Mode never requires infrastructure vocabulary.
6. Technical Mode remains available for evidence and operator inspection.
