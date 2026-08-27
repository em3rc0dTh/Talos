# TALOS 1.0 — Real-User Field Trial Runbook v0.1

Status: **READY TO RUN**  
Purpose: close **R1-11** without turning the product owner into a technical tester.

## What this is

This is not a unit-test checklist and not a developer certification matrix.

Use Talos normally with one real business process that was not created as a Talos fixture.

The objective is simple:

> Can a real user bring a process, understand what Talos inferred, correct it where necessary, confirm the business meaning, design the automation and reach governed execution without Talos inventing authority?

## Start the product

From the current Talos repository candidate:

```powershell
cd build\reference-vertical-slice
npm ci
npm run product
```

Use the product URL printed by the launcher.

If the configured runtime profile is `DESIGN_ONLY`, execution controls correctly remain unavailable. For the complete execution field trial, use the already-defined private-preview Temporal execution configuration for this repository.

Do not edit database evidence manually and do not delete `.runtime` just to make the trial pass.

## One normal user journey

### 1. Give Talos a real process

Use a real PNG process image or BPMN file that was not implemented as a fixture.

Expected product behavior:

- source is preserved first;
- unsupported/insufficient perception remains visibly blocked instead of creating fake meaning;
- admitted process meaning remains inferred, not automatically confirmed.

### 2. Review what Talos understood

Read the process, questions and findings.

Ask only:

- Did Talos identify the main business activities?
- Are actors/responsibilities correct?
- Are important flows/decisions missing or wrong?
- Is uncertainty visible where Talos is unsure?

If something is wrong, use the correction workspace. The correction must create a new revision; it must not rewrite the original source.

### 3. Confirm business meaning

Only confirm after the reviewed process represents the intended business meaning.

Expected:

- confirmation is explicit;
- confirmation does not automatically authorize automation.

### 4. Design the automation

Open Automation Design.

Review requirements and suggestions. Accept, replace, reject or defer where appropriate, then make explicit capability selections.

Expected:

- suggestion != binding;
- unresolved required capability remains blocking.

### 5. Review the ExecutionPlan

Build the ExecutionPlan review.

If Talos identifies an execution-design blocker, choose the explicit treatment where the UI provides one. If the blocker actually requires semantic correction, go back and correct the process instead of forcing execution.

Approve automation only after the plan is acceptable.

### 6. Review Temporal/runtime policy

Create the Temporal mapping and review visible runtime policy decisions.

Expected:

- human/wait behavior is explicit;
- retry/timeout/idempotency policy is visible;
- there is no hidden approval produced by this step.

### 7. Deploy

Design deployment, verify the configured environment, explicitly approve one deployment attempt and deploy the Worker.

Expected:

- Worker deployment creates no business workflow-start authority.

### 8. Approve and start one Workflow

Enter the intended execution facts/capability inputs.

Approve the exact Workflow start, then start it once.

Expected:

- input drift after approval is rejected;
- one approval authorizes one start;
- a long-lived process returns durable `RUNNING` start evidence instead of holding an HTTP request indefinitely;
- a short action-only process may complete immediately.

### 9. Human step, if the real process contains one

When a frozen human task appears, choose the actual allowed business outcome.

Expected:

- Talos cannot invent a new outcome;
- browser-supplied actor authority cannot impersonate another actor;
- the Workflow resumes deterministically after the accepted human outcome.

### 10. Observe terminal evidence

Expected:

- same Workflow/run is observed to completion;
- concrete external effects include durable evidence when the design contains external capability work;
- no duplicate external effect appears because of retry/replay/restart;
- execution evidence remains available after the Workflow is terminal.

## Restart check during the same trial

If the Workflow is waiting on a human step, close Talos normally and start the product again against the same runtime directory.

Expected:

- Talos rediscovers the live Temporal Workflow;
- the required Worker runtime is recovered from persisted runtime material;
- the same Workflow/run resumes;
- no second workflow-start approval is created;
- no second Workflow is started;
- the pending human task remains constrained to the same frozen outcomes.

This is a product-level restart trial, not a request to delete state or rebuild fixtures.

## What to report back

Only report what you saw as a normal user.

Useful evidence:

- source type used;
- whether Talos understood it correctly;
- corrections you needed;
- whether any instruction or authority boundary was confusing;
- whether the automation design made sense;
- whether execution completed;
- whether restart/resume worked if exercised;
- screenshots of any confusing or broken state.

No console dump is required unless something fails.

## R1-11 PASS rule

R1-11 can pass when at least one genuine non-fixture process completes the supported product journey without a release-blocking defect and without modifying the implementation to special-case that source.

A discovered issue is not hidden. Classify it:

- **P0/P1** — release blocker; fix before certification.
- **P2** — materially harms the core journey; fix or explicitly gate before certification.
- **P3** — non-blocking polish; may follow 1.0 if the product journey remains clear and safe.

## After R1-11

Only R1-12 remains: exact-SHA executable certification of the complete regression matrix on an identified working runner.

When both R1-11 and R1-12 are green, the repository may state:

> **Talos 1.0 — PRODUCT READY**
