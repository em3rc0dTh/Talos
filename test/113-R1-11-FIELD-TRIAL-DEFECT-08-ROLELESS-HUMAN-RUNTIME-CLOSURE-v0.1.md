# R1-11 Field Trial Defect 08 — Roleless Human Runtime Closure

## Status

FIX CANDIDATE — requires exact-SHA local field replay.

## Observed field failure

A real image-derived process reached the executable Temporal Run stage with:

- 8 business-work steps;
- 8 human steps;
- 0 system/integration Activities;
- 1 durable wait;
- 1 branch.

After process confirmation, AI automation approval, capability selection, ExecutionPlan compilation and Temporal target realization, Worker activation stopped with:

`TALOS_RUNTIME_HUMAN_PARTICIPANT_INCOMPLETE: <human-design-ref>`

## Root cause

Talos already supported a governed roleless human design upstream:

- `roleRefs = []`;
- `assignmentCardinality = ANY_ELIGIBLE`;
- `actorTypeConstraints = [HUMAN]`.

That means the source did not establish an organizational role and Talos deliberately did not invent one. The accepted design delegates assignment to an eligible authenticated human at runtime.

The private-preview runtime snapshot builder nevertheless rejected every human participant with `roleRefs.length === 0`, and the generic runtime compiler independently repeated the same assumption. This contradicted the frozen capability-resolution contract and made a valid roleless human process undeployable.

## Product law preserved

The correction does **not** manufacture `operator`, `manager`, `technician` or any other business role.

Roleless execution is admitted only when the frozen participant requirement explicitly proves all of:

1. participant state is `COMPLETE`;
2. `roleRefs` is empty;
3. `assignmentCardinality = ANY_ELIGIBLE`;
4. `actorTypeConstraints` contains `HUMAN`.

A roleless participant with `EXACTLY_ONE`, missing HUMAN actor constraint, unresolved participant state, or otherwise incomplete assignment still fails closed.

A role-constrained participant may not silently switch to unconstrained `ANY_ELIGIBLE`.

## Implementation closure

The runtime semantic snapshot now preserves:

- `participantRoleRefs`;
- `participantAssignmentCardinality`;
- `participantActorTypeConstraints`.

The generic compiler validates the same invariant independently before producing a Temporal runtime program.

Compatibility is retained for already-persisted role-constrained programs that predate the added optional snapshot assignment fields.

## Dedicated regression evidence

`build/reference-vertical-slice/tests/r1-11-roleless-human-runtime-closure.test.ts`

The test proves:

- roleless `ANY_ELIGIBLE + HUMAN` compiles without inventing a role;
- roleless incomplete assignment remains rejected by the snapshot builder;
- malformed roleless runtime snapshots remain rejected by the compiler.

## Field replay requirement

This defect is not closed merely because the regression test exists. R1-11 requires replay of the same real process on the exact patched SHA through:

`source → confirm → automation approval → compile → deployment approval → Worker activation → workflow start → human runtime state`

Only that replay may convert this receipt from FIX CANDIDATE to FIELD PASS.
