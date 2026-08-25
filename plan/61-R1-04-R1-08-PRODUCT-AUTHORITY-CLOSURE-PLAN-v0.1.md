# R1-04 → R1-08 — Product Authority Journey Closure Plan v0.1

## Goal

Turn the already-certified One-App authority engine into one coherent end-user product journey without collapsing any authority boundary.

## Product path

`SOURCE → REVIEW/CORRECT → BUSINESS CONFIRMATION → AUTOMATION DESIGN → EXPLICIT CAPABILITY BINDING → EXECUTIONPLAN REVIEW → AUTOMATION APPROVAL → TEMPORAL MAPPING → RUNTIME POLICY → DEPLOYMENT DESIGN → ENVIRONMENT REALIZATION → DEPLOYMENT APPROVAL → ONE DEPLOYMENT ATTEMPT → WORKFLOW-START APPROVAL → ONE REAL TEMPORAL START → DURABLE EVIDENCE`

## Closure law

`UI REACHABLE != AUTHORITY CREATED != RUNTIME EXECUTABLE != EXTERNAL EFFECT PROVEN`

Every transition that creates authority remains an explicit user action and append-only durable record.

## Gates

- R1-04 business confirmation remains separate from correction and automation handoff.
- R1-05 suggestions remain advisory; explicit capability selection/binding is separate.
- R1-06 ExecutionPlan review exposes unresolved subprocess/relation decisions instead of guessing.
- R1-07 product launcher keeps bearer material server-side, wires the trusted Temporal runtime, and proves deployment does not start business work.
- R1-08 one exact execution approval is consumed by one real Temporal start and produces durable workflow/run evidence plus capability-effect evidence.

## Current runtime support truth

The current generic runtime executes deterministic sequence/default/conditional coordination, durable timers and Activities. Human UPDATE/SIGNAL mappings and child-workflow boundaries are designable but are not yet executable by the generic runtime. They must fail early and visibly until the async human/runtime extension is certified; they may never be simulated as completed work.

## Required regression set before merge

1. all `r1-*.test.ts` product regressions;
2. complete Image Vertical Slice;
3. B7–B9 real Temporal runtime;
4. B10 restart safety;
5. R0 private-preview access/config/operator regression;
6. exact PR diff audit;
7. one stable exact head.

## User handoff

Do not ask the product owner to run technical certification. The first owner handoff happens only after the supported product path is coherent enough for a real-user field trial. The handoff instruction is intentionally simple: provide a real business process and use Talos as a normal user.
