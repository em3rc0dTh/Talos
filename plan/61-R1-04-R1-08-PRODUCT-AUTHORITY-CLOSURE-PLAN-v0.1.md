# R1-04 → R1-10 — Product Authority Journey Closure Plan v0.2

## Goal

Turn the certified One-App authority engine into one coherent end-user product journey without collapsing any authority boundary, then make long-lived Temporal execution survive Talos process/Worker restart.

## Product path

`SOURCE → REVIEW/CORRECT → BUSINESS CONFIRMATION → AUTOMATION DESIGN → EXPLICIT CAPABILITY BINDING → EXECUTIONPLAN REVIEW → AUTOMATION APPROVAL → TEMPORAL MAPPING → RUNTIME POLICY → DEPLOYMENT DESIGN → ENVIRONMENT REALIZATION → DEPLOYMENT APPROVAL → ONE DEPLOYMENT ATTEMPT → WORKFLOW-START APPROVAL → ONE REAL TEMPORAL START → HUMAN/WAIT COORDINATION WHEN REQUIRED → DURABLE TERMINAL EVIDENCE`

## Closure law

`UI REACHABLE != AUTHORITY CREATED != WORKFLOW STARTED != HUMAN OUTCOME AUTHORIZED != EXTERNAL EFFECT PROVEN`

Every transition that creates authority remains an explicit user action and append-only durable record.

## Implemented gates

- **R1-04** business confirmation remains separate from correction and automation handoff.
- **R1-05** suggestions remain advisory; explicit capability selection/binding is separate.
- **R1-06** ExecutionPlan review exposes unresolved subprocess/relation decisions instead of guessing.
- **R1-07** product launcher keeps bearer material server-side, wires the trusted Temporal runtime, and proves deployment does not create workflow-start authority.
- **R1-08** one exact execution approval is consumed by one real Temporal start; concrete capability transports return durable external-effect evidence with idempotency protection.
- **R1-08H** human coordination is Workflow-native. Frozen UPDATE/SIGNAL outcomes are validated against the approved human-interaction design; human work is not converted into Activities.
- **R1-09** long-lived execution has a split lifecycle: `WORKFLOW START → RUNNING START RECORD → HUMAN/WAIT → TERMINAL RECONCILIATION`. Talos process/Worker restart reuses the same Temporal Workflow/run and creates no new workflow-start authority.
- **R1-09** recovered and newly deployed programs share one Worker per configured Task Queue with an exact merged capability-use dispatch registry. Conflicting bindings fail closed instead of cross-dispatching.
- **R1-09** duplicate durable workflow-start approvals claiming the same `executionId` are treated as ambiguous authority and rejected before Temporal inspection.
- **R1-10** the One-App product shell exposes the whole supported path as a guided user journey, including process review/correction, business confirmation, automation design, ExecutionPlan decisions, Temporal/runtime policy, deployment, start evidence, human runtime, terminal evidence and resume/recovery.

## Current runtime support truth

The generic runtime supports deterministic sequence/default/conditional coordination, durable waits/timers, governed Activities and Workflow-native human coordination. Human outcomes remain constrained to the frozen approved design.

Separate child-workflow execution boundaries remain an explicit execution-design concept and must not be silently flattened or manufactured. Unsupported boundary semantics remain fail-closed.

## Evidence present in this branch

- `r1-07-product-temporal-runtime.test.ts` — trusted product Temporal runtime and one-start authority.
- `r1-08-human-temporal-e2e.test.ts` — real Temporal human UPDATE lifecycle.
- `r1-08-human-runtime-product-shell.test.ts` — browser human-runtime authority is start-evidence-gated and server-binds actor authority.
- `r1-09-execution-recovery.test.ts` — durable RUNNING/terminal reconciliation across Talos process restart.
- `r1-09-worker-recovery-temporal-e2e.test.ts` — real Worker death while a human Workflow is waiting, followed by recovery and completion of the same Temporal run.
- `r1-09-duplicate-execution-approval.test.ts` — ambiguous duplicate execution authority fails closed.
- `r1-09-unified-queue-worker.test.ts` — one Task Queue Worker safely serves multiple recovered runtime programs; conflicting capability-use bindings fail closed.

## GitHub Actions infrastructure incident

At the current candidate head GitHub-hosted Actions are failing before checkout/step execution. Re-runs reproduce the same condition: the workflow job has no executable steps (`steps: null`) and no usable runner assignment. This is classified as **CI infrastructure unavailable**, not a Talos test failure and not a Talos PASS.

Therefore:

- do not convert those red workflow badges into code-failure claims;
- do not convert them into PASS claims either;
- keep exact executable certification pending until an identified runner actually executes the matrix.

## Remaining gates outside implementation

### R1-11 — real-user field trial

Required because fixture/synthetic execution cannot prove product usability. The owner should receive one stable candidate and use Talos normally with a real non-fixture process. No technical test choreography is required.

### R1-12 — exact-SHA release certification

Requires one identified exact SHA and executable receipts for the full regression matrix. This is the only release-certification gate blocked by the current GitHub-hosted runner incident.

## Handoff rule

Do not ask the product owner to certify internals. The handoff is deliberately simple:

> Start the Talos product candidate, provide a real business process, review what Talos understood, correct/confirm it, design the automation, approve the exact plan/deployment/execution and observe the resulting Workflow.

A successful field trial plus executable exact-SHA certification closes Talos 1.0 PRODUCT READY.
