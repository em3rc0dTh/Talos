# R1-11C Implementation Plan — One-App Guided Resolution + Freeze-blocker UX

Date: 2026-09-18

## Work packages

### C1 — Extend semantic resolution
- Add WAIT_SEMANTICS to the guided resolution contract.
- Support fixed duration as a business wait.
- Preserve proposal-before-acceptance authority separation.
- Revalidate the derived ProcessRevision.

### C2 — Connect One-App backend
- Add proposal/decision routes to startTalosOneApp.
- Persist the accepted ProcessRevision and ValidationAssessment.
- Realign BPMN to the new Canonical revision.
- Initialize a new review baseline.
- Return requiresProcessReconfirmation=true.
- Return no automatic downstream authority.

### C3 — Make freeze blockers actionable
- Return blocker summaries when semantic freeze cannot be created.
- Identify whether a blocker can be resolved by guided review.
- Return a next safe action instead of a generic dead-end.

### C4 — Product UX
- Add a guided clarification section before process confirmation.
- Use normal business language for branches, waits and subprocesses.
- Two explicit actions: review answers, then apply clarifications.
- Scroll the user to reconfirmation after accepted clarification.
- Replace generic Automation Design failure with guided blocker routing.

### C5 — Progressive disclosure
- Default to Simple View.
- Hide Canonical IDs, validation codes, raw XML, raw findings and durable-document internals.
- Keep Technical details available by explicit user choice.
- Simplify primary labels for source, review, confirmation and automation preparation.

### C6 — Certification
- Unit-test fixed-duration WAIT resolution.
- Test reconfirmation requirement and zero downstream authority.
- Test product-copy/simple-view contract.
- Test One-App route presence and freeze-blocker contract.
- Run image I8-02 edge tests.
- Run image vertical slice and Temporal/restart regression workflows before merge.

## Non-goals

- No automatic business confirmation.
- No automatic acceptance of Talos suggestions.
- No automatic freeze bypass.
- No automatic capability binding.
- No deployment or workflow execution change.
- No R1-11 closure claim.
