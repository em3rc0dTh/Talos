# TALOS — R1 Product Completion Plan v0.2

Status: **IMPLEMENTATION FIELD-TRIAL READY — RELEASE CERTIFICATION PENDING**  
Target: **TALOS 1.0 PRODUCT READY**  
Started: **2026-08-25**  
Base release: `009b266bbfc7d82218ba613bedf1ef14af0159fc` — Talos v0.1 Private Technical Preview certification

## Goal

R1 converts the certified Talos architecture into the complete end-user product path.

The R0 reference approval demo is not the product target. It remains a regression spine for Canvas → Canonical → review → freeze → Temporal execution. R1 converges on One-App and makes that path usable from supported source input through durable observed execution.

```text
SOURCE
  image / BPMN / supported authored input
    ↓
exact source preservation
    ↓
source-aware perception / parsing
    ↓
common evidence
    ↓
INFERRED canonical process
    ↓
validation + uncertainty
    ↓
human review / correction / confirmation
    ↓
confirmed Canonical ProcessRevision
    ↓
automation-design handoff
    ↓
Automation Design Workspace
    ↓
explicit capability/integration decisions
    ↓
ExecutionPlan review
    ↓
explicit automation approval
    ↓
Temporal mapping
    ↓
explicit runtime policy
    ↓
deployment design + environment realization
    ↓
explicit deployment approval + attempt
    ↓
explicit workflow execution approval
    ↓
Temporal execution
    ↓
human/wait coordination when required
    ↓
real external effect
    ↓
durable evidence / lineage / restart recovery
```

## Product-complete invariant

Talos 1.0 never collapses these states:

```text
SOURCE TRUTH
!=
PERCEPTION EVIDENCE
!=
INFERRED BUSINESS MEANING
!=
HUMAN-CONFIRMED BUSINESS PROCESS
!=
AUTOMATION APPROVAL
!=
DEPLOYMENT AUTHORITY
!=
EXECUTION AUTHORITY
```

Confidence never upgrades truth class or authority.

## R1 gate status

### R1-01 — Truthful source and perception UX — **IMPLEMENTED**

The UI reports the actual source/perception path instead of capability availability. A `NO_RESULT` perception cannot display later semantic stages as successful.

### R1-02 — Real arbitrary-input image path in One-App — **IMPLEMENTED**

One-App preserves exact PNG source bytes before provider use, binds configured live perception, requires correlated evidence, and fails closed when evidence/provider state is insufficient.

### R1-03 — End-user process review and correction workspace — **IMPLEMENTED**

The product exposes source-derived process meaning, validation questions/findings, BPMN correction, revisioned review and provenance-preserving correction behavior.

### R1-04 — Business-process confirmation — **IMPLEMENTED**

Confirmation pins the exact reconciled BPMN/Canonical revision. Stale or mismatched authority fails closed. Confirmation creates no automation/deployment/execution authority.

### R1-05 — Automation Design Workspace product path — **IMPLEMENTED**

Requirements, suggestions, accept/replace/reject/defer decisions and explicit capability selection are separate product actions. Suggestions never become bindings implicitly.

### R1-06 — ExecutionPlan review and automation approval — **IMPLEMENTED**

ExecutionPlan blockers are visible. Subprocess/relation treatment requires explicit decisions. Automation approval pins the reviewed plan.

### R1-07 — Runtime / deployment / execution authority — **IMPLEMENTED**

One-App exposes and enforces:

```text
approved Temporal mapping
→ explicit runtime policy
→ deployment design
→ environment realization
→ explicit deployment approval
→ deployment attempt
→ explicit workflow execution approval
→ workflow execution
```

No earlier approval substitutes for a later authority.

### R1-08 — Real capability + human execution — **IMPLEMENTED**

The trusted product runtime executes production-representative capability transports through Temporal with concrete external-effect evidence and idempotency protection. Workflow-native human coordination validates frozen UPDATE/SIGNAL outcomes and never converts human work into Activities.

### R1-09 — Durability, restart and recovery — **IMPLEMENTED; EXECUTABLE CERTIFICATION PENDING**

Implemented behavior:

- same runtime evidence remains append-only/durable;
- Workflow start is separated from terminal observation for long-lived human/wait processes;
- a `WorkflowExecutionStartRecord` represents the exact RUNNING Temporal identity;
- terminal state is reconciled later from Temporal truth;
- Talos process restart can rediscover RUNNING/terminal executions;
- Worker death while a human Workflow is waiting can recover the same Temporal Workflow/run;
- recovery creates no new workflow-start authority;
- duplicate durable approvals claiming one execution ID fail closed;
- one configured Task Queue owns one Worker with a merged exact capability-use dispatch registry;
- multiple recovered programs cannot cross-dispatch through deployment-specific Workers;
- conflicting bindings for one capability-use ID fail closed;
- concrete external transports retain restart-safe idempotency evidence independently from the in-memory ledger.

### R1-10 — Product UX — **IMPLEMENTED; FIELD TRIAL PENDING**

The guided One-App product surface covers:

- source intake;
- process understanding/review;
- correction/confirmation;
- automation design;
- integration/capability decisions;
- ExecutionPlan review;
- explicit authority gates;
- Temporal/runtime/deployment decisions;
- running Workflow status;
- Workflow-native human outcomes;
- durable execution evidence;
- recover/resume existing execution.

Raw evidence remains available as detail rather than replacing the normal guided product interaction.

### R1-11 — Field trials — **NEXT / USER PRODUCT GATE**

This gate intentionally cannot be replaced by fixtures. Use at least one real non-fixture business process through the normal product journey and capture any usability/semantic defects.

A fixture manufactured to pass this gate is forbidden.

### R1-12 — Talos 1.0 release certification — **PENDING EXECUTABLE EXACT-SHA RECEIPT**

The final gate runs against one exact candidate/merged-main SHA and proves:

- clean install/build;
- architecture/frozen invariants;
- all semantic/source/review/automation/authority tests;
- arbitrary-input positive and fail-closed cases;
- same-build restart;
- runtime recovery behavior;
- real One-App input → review → confirmation → automation → deployment → execution;
- real external effect and durable evidence;
- no duplicate effect on replay/retry/restart;
- secret-safe evidence;
- exact-SHA release receipt.

## CI infrastructure status

GitHub-hosted Actions for the current R1 candidate are presently failing before any workflow step executes. Re-runs reproduce jobs with no executed steps (`steps: null`) and no usable hosted runner assignment.

This is classified as:

```text
CI INFRASTRUCTURE UNAVAILABLE
!= TALOS TEST FAILURE
!= TALOS TEST PASS
```

The red badges therefore do not invalidate the implementation, but they also cannot satisfy R1-12.

## Completion rule

R1 is evidence-gated, not percentage-gated.

The implementation portion of R1-01 through R1-10 is complete on the active candidate branch. Talos becomes **1.0 PRODUCT READY** only when both remaining external evidence gates close:

```text
R1-11 real-user non-fixture field trial
+
R1-12 executable exact-SHA certification
```

No new unrelated product feature is admitted before those two gates are closed.
