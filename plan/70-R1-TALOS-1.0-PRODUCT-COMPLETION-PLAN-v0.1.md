# TALOS — R1 Product Completion Plan v0.2

Status: **R1-11 ACTIVE — DOMAIN-AGNOSTIC FIELD MATRIX / RELEASE CERTIFICATION PENDING**  
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

During R1-11 field use, the blocked-plan rebuild path exposed an immutable-definition persistence defect. The repair now preserves one stable `ExecutionPlanDefinition`, creates append-only child `ExecutionPlanRevision` lineage after changed execution-design decisions, preserves the original capability bindings, and treats an identical repeated rebuild as idempotent. Dedicated local regressions are 2/2 PASS; real-user confirmation remains part of R1-11.

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

### R1-10 — Product UX — **IMPLEMENTED; FIELD TRIAL ACTIVE**

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

### R1-11 — Field trials — **ACTIVE / DOMAIN-AGNOSTIC STRUCTURAL MATRIX**

This gate intentionally cannot be replaced by fixtures, and one successful business process is no longer sufficient evidence of product agnosticism.

Talos must be exercised against materially different execution structures. The release matrix requires evidence for:

1. human-dominant coordination;
2. straight-through system / Activity execution;
3. mixed human + external-effect execution;
4. durable wait / branching / non-trivial coordination.

A single process may cover multiple categories only when the evidence independently exercises each structural behavior. A single uploaded source cannot be the only field-trial witness for Talos 1.0.

Current field-trial evidence:

- the first genuine non-fixture BPMN remains a defect-discovery witness, not an implementation template;
- Field Defect 01 exposed misleading UX when native BPMN reconciliation was blocked; the repair preserves the source, surfaces concrete diagnostics and keeps correction available without manufacturing review/authority;
- a later journey advanced to ExecutionPlan review and exposed Field Defect 02: `Rebuild ExecutionPlan` attempted to rewrite an immutable plan definition instead of appending a child revision;
- Defect 02 repair code baseline: `ad3b67dbd3d35b81dbdb059e8ff429ec9ebf561d`;
- product-owner local executable receipt for the Defect 02 repair: **2 tests / 2 pass / 0 fail**;
- Field Defect 03 exposed a generic product-shell classification error: the RuntimePolicy preview treated all capability uses as Temporal Activities even when the approved mapping contained Workflow-native human coordination;
- Defect 03 repair derives exact Activity policy subjects from approved Temporal `ACTIVITY` mapping units, leaving human/wait coordination Workflow-native and keeping the backend fail-closed;
- the Defect 03 regression is explicitly domain-neutral and covers human-only, mixed Activity + human/wait, and missing-Activity-policy fail-closed behavior;
- repaired launcher identity remains `talos-private-preview-product-v0.9` unless a later launcher-only version receipt supersedes it.

Evidence records:

- `test/103-R1-11-FIELD-TRIAL-DEFECT-01-BLOCKED-BPMN-UX-v0.1.md`;
- `test/103-R1-11-FIELD-TRIAL-DEFECT-02-EXECUTION-PLAN-REBUILD-CLOSURE-v0.1.md`;
- `test/104-R1-11-FIELD-TRIAL-DEFECT-03-RUNTIME-POLICY-ACTIVITY-BOUNDARY-v0.1.md`;
- `test/104-R1-11-DOMAIN-AGNOSTIC-FIELD-MATRIX-v0.1.md`;
- `test/103-R1-11-R7-FIELD-TRIAL-CANDIDATE-v0.1.md`;
- `test/103-TALOS-1.0-REAL-USER-FIELD-TRIAL-RUNBOOK-v0.1.md`.

Anti-overfit rule:

```text
known process name
known task label
known actor label
fixture / revision identity
```

must never select engine/runtime behavior. Repairs are justified by generic semantic and runtime contracts and regressed with structurally different examples.

R1-11 remains open until the structural field matrix completes its supported paths without an unresolved P0/P1/P2 release blocker. A fixture or process-specific special case manufactured to pass this gate is forbidden.

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

GitHub-hosted Actions for the current R1 candidate are presently unavailable as meaningful executable evidence. The repaired RC head has no attached hosted workflow run/status that can certify the code, while earlier hosted attempts failed before repository steps executed.

This is classified as:

```text
CI INFRASTRUCTURE UNAVAILABLE / NOT EXECUTED
!= TALOS TEST FAILURE
!= TALOS TEST PASS
```

Local executable receipts may close specific defects, but they do not substitute for R1-12 exact-SHA certification.

## Completion rule

R1 is evidence-gated, not percentage-gated.

The implementation portion of R1-01 through R1-10 is complete on the active candidate branch. R1-11 is now an active domain-agnostic structural field matrix. Talos becomes **1.0 PRODUCT READY** only when both remaining external evidence gates close:

```text
R1-11 domain-agnostic structural field matrix
+
R1-12 executable exact-SHA certification
```

No new unrelated product feature is admitted before those two gates are closed.
