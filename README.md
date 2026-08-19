# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its responsibility is to **normalize and standardize business processes while preserving truth, semantics, provenance, evidence, uncertainty, conflict and source-specific meaning**.

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.**

TALOS is not a BPMN converter, OCR summarizer, n8n clone, Temporal UI, or low-code diagrammer.

# Architecture

```text
PROCESS EXPRESSION
        ↓
PRESERVE SOURCE + VERSIONED ADAPTER
        ↓
CANONICAL MODEL + PROVENANCE + SEMANTIC VALIDATION
        ↓
HUMAN EXPLANATION + REVIEW
        ↓
CORRECTION / CONFIRMATION / SEMANTIC FREEZE
        ↓
CAPABILITY / HUMAN-FORM / EXPLICIT BINDING
        ↓
EXECUTION PLAN
        ↓
TEMPORAL MAPPING
        ↓
RUNTIME POLICY
        ↓
DEPLOYMENT / RUNTIME OBSERVATION
```

No downstream runtime object may silently become upstream business truth.

Core laws include:

```text
SOURCE TRUTH != confidence != readiness != execution
source identity != canonical identity
Canvas source != canonical process model
implemented behavior != business intent
review correction != source rewrite
CapabilityRequirement != Offering != Binding
human interaction != form
ExecutionElement != Temporal primitive automatically
canonical ACTION != Temporal Activity automatically
business loop != technical retry
Temporal retry != idempotency guarantee
DeploymentRevision != Attempt != Observation != WorkflowExecution
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

## Current BUILD state

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
B4 Explanation / Review / Correction / Freeze     ✅ CLOSED — 13/13
B5 Capability / Human / Form / Binding             ✅ CLOSED — 12/12
B6 Execution / Mapping / Policy / Deployment      ✅ CLOSED — 14/14
B7 Temporal Worker / Reference Provider            ✅ CLOSED
B8 Minimal Reference API / Browser UI              ✅ CLOSED
B9 Actual Temporal E2E / Server Evidence           ✅ CLOSED
B10 Failure / Restart / Full Lineage Hardening     🟢 NEXT
```

Prior B2→B5 regression remains:

```text
77 / 77 PASS
```

# First tryable version

> **TALOS Reference Vertical Slice v0.1 is now tryable.**

Run guide:

```text
build/reference-vertical-slice/TRY-ME.md
```

Quick start:

```bash
git pull
cd build/reference-vertical-slice
npm ci
npm run demo
```

Then open:

```text
http://127.0.0.1:8787
```

Requirements:

- Node.js `>=22.16.0 <23`
- npm 10.x recommended
- Internet access on first setup/start so the local Temporal test server can be obtained if not already cached

Docker and Temporal Cloud credentials are not required for this reference version.

# What v0.1 actually runs

Reference source:

```text
Request submitted
        ↓
Review request [actor = UNKNOWN]
        ↓
Approved?
   ├── YES → Send confirmation email → Completed
   └── NO  → Rejected
```

The runtime does not begin from a repaired hard-coded process. The app first exercises the Talos semantic chain:

```text
native Canvas actor=UNKNOWN
→ preserve / adapt
→ canonical / provenance / validation
→ SV-ACT-001 + INSUFFICIENT_DETAIL
→ explicit review correction actor=Manager
→ new source/canonical/validation history
→ AUTOMATION_DESIGN_HANDOFF freeze
→ capability / form / provider binding
→ ExecutionPlan
→ TemporalMapping
→ RuntimePolicy
→ Deployment design
→ compiled immutable runtime program
→ real local Temporal server + Worker
```

Human review is a real tracked Workflow Update:

```text
submitReferenceReviewDecision
```

Current state is exposed through a read-only Workflow Query:

```text
getReferenceApprovalState
```

The approved path executes the real reference Activity:

```text
sendReferenceConfirmation
```

with the frozen reference policy:

```text
initialInterval      250ms
backoffCoefficient   2.0
maximumInterval      1000ms
maximumAttempts      3
startToClose         5000ms
scheduleToClose      10000ms
INVALID_REFERENCE_REQUEST = non-retryable
```

Idempotency:

```text
sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
```

The approved demo intentionally injects one transient provider failure so Temporal must retry while the provider still records exactly one logical effect.

The rejected path schedules no email Activity.

No real email is sent: `REFERENCE_EMAIL_SINK` is TEST_ONLY.

# Exact Temporal runtime

```text
@temporalio/common    1.22.0
@temporalio/client    1.22.0
@temporalio/worker    1.22.0
@temporalio/workflow  1.22.0
@temporalio/activity  1.22.0
@temporalio/testing   1.22.0
```

The committed npm lock contains real registry resolution and integrity metadata.

# Current evidence

```text
test/103-B7-B9-TEMPORAL-RUNTIME-CI-RESULT.md                 PASS
test/104-B8-TRYABLE-REFERENCE-APP-CI-RESULT-v0.1.md          PASS
test/105-B7-B8-B9-TRYABLE-REFERENCE-GATE-CLOSURE-v0.1.md    CLOSED
```

The integrated gate proves:

```text
npm ci                         ✅
Temporal lock                  ✅
architecture boundaries        ✅
real SDK Activity boundary     ✅
tryable HTTP/browser app        ✅
real local Temporal E2E        ✅
```

# Local persistence

Two physically separate databases are used:

```text
build/reference-vertical-slice/.runtime/talos-state.sqlite
build/reference-vertical-slice/.runtime/reference-email-sink.sqlite
```

The runtime directory is git-ignored.

# Still not authorized

```text
production BPMN/image/language/n8n adapter implementation
real Gmail / Drive / SaaS provider integration
production IAM / secrets
production Temporal deployment
multi-user collaboration expansion
broad provider/source expansion
full product visual polish
```

# Active planning

```text
plan/00-TALOS-ROADMAP-v0.31.md
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.3.md
plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.2.md
```

## Next gate

```text
B10 — FAILURE / RESTART / FULL LINEAGE HARDENING
```

But B10 is **not required before the first hands-on run**. The intended next action is to try v0.1, capture what actually happens in use, and then harden the spine from evidence rather than adding more product breadth.
