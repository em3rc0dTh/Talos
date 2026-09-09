# R1-11 — Field Trial Defect 02 — ExecutionPlan Rebuild Immutable Conflict

Status: **LOCAL REGRESSION PASS / REAL-USER r7 RETEST REQUIRED**  
Date: **2026-08-27 (America/Lima)**  
Observed during: **Talos 1.0 local Release Candidate r6 field trial**  
Source used by product owner: `Car-Wash.bpmn`  
Defect class: **P1 release blocker while present**

## Observed defect

The real-user journey successfully reached ExecutionPlan review. Talos exposed explicit execution-design decisions, but after the user supplied those decisions and requested `Rebuild ExecutionPlan`, persistence attempted to append the same immutable `ExecutionPlanDefinition` identity again.

The result was an immutable SQLite document conflict instead of a new reviewed plan revision.

This was a product-journey blocker. It did not indicate that capability selection, business confirmation, Temporal authority or execution authority had been bypassed.

## Correct product truth

```text
explicit capability selection
        ↓
ExecutionPlan revision 1
        ↓
BLOCKED_EXECUTION_DESIGN
        ↓
user makes explicit execution-design decisions
        ↓
Rebuild ExecutionPlan
        ↓
SAME immutable ExecutionPlanDefinition
        +
NEW child ExecutionPlanRevision
        ↓
parentRevisionRefs = [revision 1]
        ↓
READY_FOR_AUTOMATION_APPROVAL when all blockers are resolved
```

Rebuilding the plan must not repeat capability selection and must not create downstream authority.

## Repair

The RC repair establishes two boundaries.

### Stable ExecutionPlan definition persistence

`packages/application/src/execution-design.ts`

- creates the immutable `ExecutionPlanDefinition` once;
- on later plan revisions, reuses that exact definition identity;
- validates the existing definition contract before reuse;
- persists new `ExecutionPlanRevision` evidence append-only.

### One-App plan revision lineage

`packages/application/src/one-app-automation.ts`

- a changed execution-design decision set creates a child plan revision;
- revision number increments from the previous plan revision;
- `parentRevisionRefs` pins the exact previous revision;
- the original explicit capability selection/bindings are reused, not recreated;
- submitting the same resolved decision set again is idempotent and does not manufacture another revision.

Launcher identity for the repaired field candidate is:

```text
talos-private-preview-product-v0.9
```

The launcher bump is isolated to the version string; no unrelated lifecycle behavior is part of this repair.

## Regression evidence

Dedicated regressions:

- `build/reference-vertical-slice/tests/r1-11-execution-plan-rebuild-lineage.test.ts`
- `build/reference-vertical-slice/tests/r1-11-execution-plan-rebuild-one-app.test.ts`

The product owner executed both locally from `build/reference-vertical-slice` against the repaired RC and reported:

```text
✔ R1-11 ExecutionPlan rebuild appends a child revision without rebinding capabilities or rewriting the immutable definition (2125.3161ms)
✔ R1-11 One-App rebuild endpoint persists a child ExecutionPlan revision instead of conflicting with immutable v1 (324.0807ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2443.4428
```

The Node SQLite experimental warning observed with the run is not a test failure.

Classification of this receipt:

```text
DEFECT 02 CODE REPAIR       PASS LOCALLY
REAL-USER FIELD RETEST      PENDING r7
HOSTED EXACT-SHA CI         NOT RUN / NOT AVAILABLE ON THIS RC HEAD
R1-11                       NOT YET PASS
R1-12                       NOT YET PASS
```

## Authority/non-regression assertions

The regressions prove the rebuild does not create:

- a new capability binding;
- `AutomationDesignApprovalRecord`;
- `TemporalMappingRevision`;
- `DeploymentRevision`;
- `WorkflowExecutionObservation`.

Therefore resolving an ExecutionPlan blocker remains a design revision operation, not an approval or execution operation.

## Closure rule

Defect 02 is considered **locally repaired** by the 2/2 executable regression receipt above.

It is considered **field-closed** only when the same normal non-fixture journey on r7 passes the formerly failing `Rebuild ExecutionPlan` point and continues into explicit automation approval without the immutable conflict or duplicate capability binding.

This record does not close R1-11 and does not certify Talos 1.0.