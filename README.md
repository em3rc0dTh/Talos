# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its responsibility is to **normalize and standardize business processes while preserving truth, semantics, provenance, evidence, uncertainty, conflict and source-specific meaning**.

TALOS is not a BPMN converter, generic OCR/document summarizer, n8n clone, Temporal UI, or low-code diagrammer.

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.**

## Governing architecture

```text
PROCESS EXPRESSION
        ↓
PRESERVE SOURCE + VERSIONED ADAPTER
        ↓
SOURCE EVIDENCE GRAPH / CANDIDATE SCOPE(S)
        ↓
CANONICAL MODEL + PROVENANCE + SEMANTIC VALIDATION
        ↓
HUMAN EXPLANATION + VISUAL REVIEW
        ↓
CORRECTION / CONFIRMATION / SEMANTIC FREEZE
        ↓
CAPABILITY REQUIREMENTS / HUMAN-FORM DESIGN
        ↓
EXPLICIT CAPABILITY OFFERING BINDINGS
        ↓
EXECUTION PLAN
        ↓
TEMPORAL MAPPING DESIGN
        ↓
RUNTIME SAFETY POLICY
        ↓
DEPLOYMENT REVISION / ENVIRONMENT REALIZATION
        ↓
DEPLOYMENT / RUNTIME OBSERVATION
```

Every bridge is explicit and versioned. No downstream runtime object may silently become upstream business truth.

## Core laws

```text
SOURCE TRUTH != confidence != readiness != execution
source identity != canonical identity
Canvas source != canonical process model
ProcessRevision != ExecutionPlanRevision
CapabilityRequirement != Offering != Match != Binding
CapabilityBindingRevision != CapabilityUseOccurrence
human interaction != form
form action != business outcome until mapped
ExecutionElement != Temporal primitive automatically
canonical ACTION != Temporal Activity automatically
human interaction != Signal/Update automatically
wait != Timer automatically
business loop != retry / Continue-As-New
Temporal retry != idempotency guarantee
DeploymentRevision != DeploymentAttempt
DeploymentAttempt != DeploymentObservation
DeploymentObservation != WorkflowExecution
actual runtime evidence != intended runtime configuration
```

# Design / architecture status

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

# Phase 6 — Reference Vertical Slice

Bounded BUILD authorization applies only to:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

## Reference process

Initial source:

```text
Request submitted
        ↓
Review request [actor = UNKNOWN]
        ↓
Approved?
   ├── YES → Send confirmation email → Completed
   └── NO  → Rejected
```

The initial source does not contain `Manager`.

Phase 3 explicitly introduces:

```text
actor = Manager
```

through a review command, producing new source/canonical/validation history before semantic freeze.

## Current BUILD state

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
B4 Explanation / Review / Correction / Freeze     ✅ CLOSED — 13/13
B5 Capability / Human / Form / Binding             ✅ CLOSED — 12/12
B6 Execution / Mapping / Policy / Deployment      ✅ CLOSED — 14/14 B6
B7 Temporal Worker / Reference Provider            🟡 OPEN — PRE-SDK 20/20 / LOCK GATE
B8 Minimal reference API / web                     ⛔ CLOSED
B9 Actual Temporal E2E + server evidence           ⛔ CLOSED
B10 Failure / retry / restart / lineage closure    ⛔ CLOSED
```

Prior B2→B5 executable evidence remains:

```text
77 / 77 PASS
```

# B5/B6 handoff

Frozen capability handoff:

```text
PR2 / accepted automation-design freeze
        ↓
CapabilityDesignRevision
        ├── HUMAN_INTERACTION / Manager review
        └── COMMUNICATION / SEND_NOTIFICATION / EMAIL
        ↓
HumanInteractionDesign + reusable FormRevision/FormUseBinding
        ↓
REFERENCE_EMAIL_SINK test offering
        ↓
explicit CapabilityBindingRevision
        ↓
CapabilityBindingAssessment = READY_FOR_EXECUTION_DESIGN
```

Logical email input:

```text
recipientEmail
state = REQUIRED_AT_EXECUTION
basis = SEMANTIC_DERIVED
```

No recipient identity/address is business-semantic or binding truth.

Execution design:

```text
Request submitted          → COORDINATION_STEP
Review request              → HUMAN_COORDINATION
Approved?                   → DECISION_COORDINATION
Send confirmation email     → CAPABILITY_INVOCATION
Completed / Rejected        → COMPLETION_COORDINATION
```

Runtime data handoff:

```text
notificationRecipientEmail
→ logical recipientEmail
→ REFERENCE_EMAIL_SINK input.to
```

Reference Temporal mapping design:

```text
root scope                   → Workflow boundary candidate
human submission             → UPDATE_HANDLER
accepted outcome wait        → WORKFLOW_CONDITION
email capability occurrence  → ACTIVITY
branch/completion             → WORKFLOW_LOGIC
```

This is reference runtime design, not a universal semantic mapping rule.

Material runtime policy:

```text
Activity retry:
  initialInterval = 250ms
  backoffCoefficient = 2.0
  maximumInterval = 1s
  maximumAttempts = 3

Activity timeout:
  startToClose = 5s
  scheduleToClose = 10s

Workflow maximumAttempts = 1

Idempotency:
  sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)

TRANSIENT_REFERENCE_FAILURE = retryable
INVALID_REFERENCE_REQUEST = non-retryable
```

B6 deployment design remains intentionally:

```text
INCOMPLETE_ENVIRONMENT_REALIZATION
```

because B6 does not fake an actual Namespace, Worker artifact, Task Queue/type registration, deployment attempt, runtime observation or Workflow execution.

Evidence:

```text
test/95-B6-EXECUTION-TEMPORAL-POLICY-DEPLOYMENT-IMPLEMENTATION-RESULT-v0.1.md
```

# B7 — current state

## Exact Temporal dependency baseline

Current verified family:

```text
@temporalio/common    1.22.0
@temporalio/client    1.22.0
@temporalio/worker    1.22.0
@temporalio/workflow  1.22.0
@temporalio/activity  1.22.0
@temporalio/testing   1.22.0
```

All Temporal packages must remain on the same exact version.

Active baseline:

```text
build/reference-vertical-slice/dependencies/dependency-baseline.json
```

Dependency freshness evidence:

```text
test/97-B7-TEMPORAL-SDK-BASELINE-CORRECTION-v0.1.md
```

## Reference provider

Active provider request:

```text
referenceRequestId
capabilityUseOccurrenceId
to
```

Only `to` is a mapped provider business input. The IDs are runtime/idempotency context.

The TEST_ONLY provider owns its fixed confirmation copy and first-effect timestamp.

Duplicate identity is:

```text
same idempotency key
+ same logical provider request
```

not wall-clock equality. A later identical retry therefore remains `DUPLICATE_IDENTICAL` and keeps one effect row.

Provider result:

```text
7 / 7 PASS
```

Evidence:

```text
test/99-B7-REFERENCE-PROVIDER-RETRY-IDEMPOTENCY-HARDENING-v0.1.md
```

## Pre-SDK Worker runtime program

Package:

```text
workers/reference-temporal-worker/
```

Current source has **zero `@temporalio/*` imports**.

`CompiledReferenceRuntimeProgram` pins exact B6 lineage and material policy instead of letting the future Worker load `latest` Talos state or redefine constants.

Runtime input remains separate:

```text
ReferenceWorkflowInput
  referenceRequestId
  notificationRecipientEmail
  immutable compiled program
```

Human state machine:

```text
PENDING
  ├─ APPROVED → SEND_CONFIRMATION
  └─ REJECTED → COMPLETE_REJECTED

post-finalization submission
→ REVIEW_ALREADY_FINALIZED
```

Worker/state result:

```text
10 / 10 PASS
```

Evidence:

```text
test/100-B7-PRE-SDK-WORKER-CONTRACT-RESULT-v0.1.md
```

## Neutral Activity adapter

Without importing Temporal, Talos already proves the future SDK boundary:

```text
startToCloseTimeout = 5000
scheduleToCloseTimeout = 10000
retry.initialInterval = 250
retry.backoffCoefficient = 2
retry.maximumInterval = 1000
retry.maximumAttempts = 3
retry.nonRetryableErrorTypes = [INVALID_REFERENCE_REQUEST]
```

Provider request derivation remains exactly:

```text
{ referenceRequestId, capabilityUseOccurrenceId, to }
```

Concrete provider exceptions are classified into the frozen B6 failure vocabulary before the future SDK wrapper creates Temporal application failures.

Adapter result:

```text
3 / 3 PASS
```

Evidence:

```text
test/101-B7-PRE-SDK-ACTIVITY-ADAPTER-CONTRACT-v0.1.md
```

## Current B7 executable total

```text
reference provider                  7 / 7
pre-SDK Worker/state contract      10 / 10
pre-SDK Activity adapter            3 / 3
────────────────────────────────────────
TOTAL                              20 / 20
FAIL                                0

architecture DAG                   PASS — 16 modules / 0 errors
@temporalio source imports          0
```

Partial verifier:

```text
npm run b7:partial:verify
```

Root `npm test` intentionally remains pinned to B6 because B7 is not closed.

# Mechanical B7 lock gate

Verifier:

```text
scripts/verify-b7-temporal-lock.mjs
```

Commands:

```text
npm run b7:lock:status
npm run b7:lock:verify
```

Current state:

```text
PENDING_SAFE
```

Meaning:

```text
exact Temporal baseline          ✅ 1.22.0
Temporal package promotions      0
Temporal source imports          0
lockReady                        false
errors                           0
```

The gate returns `READY` only after all six exact packages are promoted and the real package lock carries matching version/resolved/integrity entries.

Partial promotion, mixed versions, or an SDK import before a trustworthy lock is `FAIL`.

Evidence:

```text
test/102-B7-TEMPORAL-LOCK-GATE-RESULT-v0.1.md
```

# Current hard blocker

The present execution environment cannot reliably resolve `registry.npmjs.org`, so it cannot generate the trustworthy full transitive npm lock required by Talos BUILD governance.

Talos will not fabricate that lock.

Before first real SDK source import:

```text
npm run b7:lock:verify
→ READY
```

Only then may B7 implement the actual official Temporal SDK layer:

```text
defineUpdate + setHandler validator
Workflow condition
proxyActivities with compiled options
ApplicationFailure realization
Worker.create
```

Workflow code remains forbidden from direct access to:

```text
Talos SQLite
reference provider SQLite
filesystem
HTTP/provider calls
latest mutable Talos design
```

B9 remains the first stage allowed to claim Temporal-server-backed Workflow execution evidence.

# Persistence isolation

```text
.runtime/talos-state.sqlite
.runtime/reference-email-sink.sqlite
```

Talos immutable repositories use only the first. The reference provider uses only the second. The future Workflow accesses neither directly.

# Still not authorized

```text
BPMN/image/language/n8n production adapter implementation
real Gmail/Drive/SaaS provider integration
production IAM/secrets
production Temporal deployment
multi-user collaboration expansion
broad provider/source expansion
```

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.30.md
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.3.md
plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.2.md
```

## Immediate next move

```text
run B7 in a network-capable dependency environment
→ generate trustworthy npm lock for exact Temporal 1.22.0 family
→ b7:lock:verify = READY
→ promote/commit locked SDK dependencies
→ implement actual TalosReferenceApprovalWorkflow
→ implement sendReferenceConfirmation Temporal Activity wrapper
→ build real reference Worker artifact
```
