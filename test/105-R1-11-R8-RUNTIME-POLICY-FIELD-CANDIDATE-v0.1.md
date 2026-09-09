# R1-11 — r8 RuntimePolicy Field Candidate v0.1

Status: **IMPLEMENTED / LOCAL EXECUTABLE RETEST REQUIRED**  
Purpose: verify the generic Temporal Activity/runtime-policy boundary discovered during real-user field use before resuming the product journey.

## Candidate identity

Code baseline before this receipt:

```text
2f515e5cdd33fdcd59ea0811dc8c28df6d466631
```

Launcher identity:

```text
talos-private-preview-product-v0.10
```

The launcher version was bumped only to make this field candidate distinguishable from v0.9 evidence. The version bump itself contains no lifecycle, signal, shutdown or runtime behavior change.

## Defect class under retest

The field journey exposed a generic classification mismatch:

```text
Temporal mapping contains HUMAN_COORDINATION
but
product runtime-policy proposal treats every capability use as an ACTIVITY
```

The runtime-policy domain contract already rejected that mismatch correctly. The repair is therefore presentation/request shaping at the product boundary, not relaxation of the runtime-policy engine.

Correct generic law:

```text
HUMAN_COORDINATION -> Workflow-native coordination -> no Activity RuntimePolicy
WAIT / CONDITION   -> Workflow-native coordination -> no Activity RuntimePolicy
ACTIVITY           -> exact retry + timeout + idempotency + failure policy
```

## Candidate implementation

The product now serves a domain-neutral runtime-policy boundary enhancement on every product shell, including DESIGN_ONLY sessions.

It derives Activity subjects from the approved Temporal mapping only:

```text
mapping.units
  .filter(constructKind == ACTIVITY)
  .flatMap(executionSubjectRefs)
```

When `/api/automation/runtime-policy` is submitted:

- policies for human/wait capability uses are removed;
- policies for actual mapped Activity uses are retained;
- if an actual Activity lacks its required explicit policy, the product fails closed;
- the backend RuntimePolicy engine remains unchanged and authoritative.

No process name, task label, participant label, file name, revision ID or field-trial-specific vocabulary is used to choose this behavior.

## Required local executable retest

Run from `build/reference-vertical-slice`:

```powershell
node --experimental-strip-types --test `
  ./tests/r1-11-runtime-policy-activity-boundary.test.ts `
  ./tests/r1-11-runtime-policy-product-shell.test.ts
```

Required result:

```text
2 tests
2 pass
0 fail
```

The two regressions jointly prove:

1. human-only mapping produces zero Activity policy resolutions;
2. mixed human + Activity mapping produces policy only for the actual Activity;
3. an actual Activity missing policy fails closed;
4. the product shell always serves the mapping-derived runtime-policy guard;
5. the guard is present in DESIGN_ONLY as well as executable candidates;
6. the guard contains no known field-process vocabulary.

A green result closes the code-side Defect 03 retest only. It does not close R1-11.

## Real-source inventory result

A recursive tree audit of this repository at the candidate lineage found no additional committed `.bpmn` source files that could legitimately populate the structural field matrix.

Therefore Talos will **not** manufacture convenience BPMN files and call them field evidence.

The remaining R1-11 structural cells require real non-fixture sources supplied through field use:

- human-dominant;
- system / Activity-dominant;
- mixed human + external effect;
- durable coordination / branching.

Synthetic fixtures remain appropriate for regression testing, but they cannot satisfy the real-user field-evidence gate.

## r8 field rule

Only after the two targeted local regressions pass may a fresh product field directory be used:

```text
.runtime-local-release-r8
```

The prior r7 evidence directory must remain untouched.

Expected startup identity:

```text
launcherVersion = talos-private-preview-product-v0.10
```

In DESIGN_ONLY mode, successful RuntimePolicy design may truthfully stop before deployment because Temporal execution is not configured. Full execution/recovery evidence requires a later TEMPORAL_EXECUTION field session.

## Release classification

```text
Defect 03 implementation      = BUILT
Targeted local executable test = REQUIRED
r8 real-user retest            = PENDING
R1-11 structural matrix        = OPEN
R1-12 exact-SHA certification  = OPEN
Talos 1.0 PRODUCT READY        = NOT YET
```
