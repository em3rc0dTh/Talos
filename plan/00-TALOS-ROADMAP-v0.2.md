# TALOS — Gated Roadmap v0.2

Status: **ACTIVE PLAN**  
Date: **2026-08-18**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.1.md`  
Historical v0.1 remains preserved.

## Planning principle

TALOS closes semantic gates before broad implementation.

The highest-risk problem is not drawing a polished UI or supporting many import formats. It is preserving heterogeneous business-process meaning and origin strongly enough that later automation design cannot silently invent execution truth.

---

# PHASE 0 — FOUNDATION

## T0-01 — System Truth

Goal: establish what TALOS is and is not.

Status:

```text
CLOSED v0.1
```

---

# PHASE 1 — CANONICAL SEMANTICS

## T1-01 — Canonical Process Model

Gate:

> Represent the initial semantic fixture set without source loss while separating semantic meaning from execution readiness.

Evidence:

```text
test/01-CANONICAL-PROCESS-MODEL-PRESSURE-TEST-v0.1.md
12 / 12 PASS
```

Status:

```text
CLOSED / FROZEN v0.1 — 2026-08-18
```

## T1-02 — Provenance Model

Goal:

Formalize origin, capture, representation, provenance links, semantic claims, evidence perspective, truth state, confidence, conflicts, confirmations and transformation lineage.

### Mining evidence

First batch:

```text
Q01–Q12
```

Cross-quarry evidence:

```text
brainstorming/mining-site/CROSS-QUARRY-SYNTHESIS-v0.1.md
brainstorming/mining-site/CROSS-QUARRY-Q11-ADDENDUM-v0.1.md
brainstorming/mining-site/CROSS-QUARRY-Q12-ADDENDUM-v0.1.md
```

### Pressure-test history

Initial v0.2 execution:

```text
P01–P28
26 PASS
 2 FAIL
```

Failures:

```text
P17 physical source origin vs captured representation
P28 native digital canvas vs supplied screenshot
```

Result:

```text
test/05-PROVENANCE-PRESSURE-TEST-RESULT-v0.1.md
```

Evidence-forced evolution:

```text
Provenance v0.3
+ SourceOrigin
+ explicit origin → capture → representation lineage
+ SourceAvailabilityRecord
+ native/captured representation distinction
+ representation-scoped byte identity
```

Full regression:

```text
test/06-PROVENANCE-REGRESSION-RESULT-v0.1.md
28 / 28 PASS
```

Frozen contract:

```text
design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.3.md
blob: 2e20a98aba744e9d719765c15429422f0e03c779
```

Freeze declaration:

```text
design/02-PROVENANCE-v0.3-FREEZE-DECLARATION.md
```

Gate closure:

```text
test/07-T1-02-PROVENANCE-GATE-CLOSURE-v0.1.md
```

Status:

```text
CLOSED / FROZEN v0.3 — 2026-08-18
```

## T1-03 — Semantic Validation

**Status: NEXT**

Goal:

> Distinguish a useful provenance-safe business model from an execution-ready process, and produce explicit validation findings/questions instead of silently repairing missing semantics.

Define validation classes including at minimum:

```text
STRUCTURAL_VALIDITY
CONTROL_FLOW_VALIDITY
UNRESOLVED_CONDITION
MISSING_ACTOR_OR_RESPONSIBILITY
MISSING_REQUIRED_DATA
UNRESOLVED_SOURCE_CONFLICT
INCOMPLETE_WAIT_OR_EVENT_SEMANTICS
UNPROVEN_COMPLETION
MISSING_CORRELATION
MISSING_FAILURE_OR_COMPENSATION_POLICY
UNRESOLVED_EXECUTION_BOUNDARY
INSUFFICIENT_DETAIL_FOR_EXECUTION
```

### T1-03 gate

Talos can answer separately:

```text
IS THIS SOURCE USEFUL / UNDERSTANDABLE?
IS THE CANONICAL MODEL SEMANTICALLY VALID?
WHAT IS UNKNOWN?
WHAT REQUIRES USER CONFIRMATION?
WHAT BLOCKS EXECUTION DESIGN?
WHAT CAN SAFELY PROCEED TO FOUNDRY?
```

No validation finding may invent missing business truth.

---

# PHASE 2 — FIRST SOURCE ADAPTERS

Open only after T1-03 closes.

## T2-01 — TALOS Canvas Adapter

Start from the source Talos controls completely.

The Canvas creates canonical revisions directly while using the same frozen provenance model.

Gate:

```text
sequential process
decision
parallel branch
wait
human task
revision lineage
validation findings
```

all survive Canvas creation/editing without provenance loss.

Status: **PENDING**

## T2-02 — BPMN Adapter

Parse representative BPMN into canonical semantics while preserving source IDs, source-specific semantics and provenance.

Do not compile directly to Temporal.

Status: **PENDING**

## T2-03 — Image / Graphic Candidate Adapter

Use perception to create candidate occurrences/claims with local confidence and provenance.

This adapter must support cases like:

```text
photographed paper
whiteboard screenshot
informal flowchart
collaborative canvas screenshot
functional-model screenshot
```

without turning inference into source-confirmed execution truth.

Status: **PENDING**

---

# PHASE 3 — EXPLANATION & REVIEW

## T3-01 — Human-readable Workflow Draft
## T3-02 — Visual Review Canvas
## T3-03 — Correction Loop

Phase gate:

A user can import/create a process, understand Talos' interpretation, see provenance/uncertainty, correct it and freeze a confirmed semantic revision.

Status: **PENDING**

---

# PHASE 4 — CAPABILITY MODEL

## T4-01 — Capability Contract
## T4-02 — Forms
## T4-03 — Initial Integrations

Initial deliberately small capability families may include:

```text
HTTP / custom API
Gmail
Google Drive
n8n webhook/workflow
generic human approval
AI task
```

Status: **PENDING**

---

# PHASE 5 — TEMPORAL EXECUTION MODEL

## T5-01 — ExecutionPlan Contract
## T5-02 — Temporal Interpreter/Compiler Strategy
## T5-03 — Core Temporal mappings
## T5-04 — DeploymentRevision

Phase gate:

A validated process executes durably and every runtime/deployment element traces back through:

```text
DeploymentRevision
← ExecutionPlan
← ProcessRevision
← SemanticClaim / ProvenanceLink
← EvidenceFragment / SourceOccurrence
← SourceRepresentation
← SourceCapture
← SourceOrigin
```

Status: **PENDING**

---

# PHASE 6 — FIRST END-TO-END VERTICAL SLICE

Use a deliberately understandable process that exercises:

```text
source input
provenance
semantic validation
decision
integration
human-readable explanation
Canvas rendering
Temporal execution
runtime history
```

Gate:

Demonstrate the full TALOS proposition rather than one subsystem.

Status: **PENDING**

---

# PHASE 7 — SOURCE EXPANSION

Only after the core is stable, add adapters incrementally:

```text
UPN
UML Activity
EPC
Petri Net
SIPOC
VSM
Bizagi-specific exports
Mermaid
draw.io
natural language
existing n8n workflows
AWS Step Functions
other orchestration systems
```

Every adapter requires semantic/provenance/validation fixtures.

Status: **PENDING**

---

# PHASE 8 — OBSERVABILITY & PROCESS INTELLIGENCE

Future scope:

```text
designed vs observed comparison
execution analytics
bottleneck evidence
runtime drift
process mining inputs
improvement suggestions backed by evidence
```

Status: **FUTURE**

---

# Current project gate

```text
FOUNDATION                         ✅
SYSTEM TRUTH                       ✅ v0.1
CANONICAL MODEL                    ✅ FROZEN v0.1 — T1-01 CLOSED
MINING SITE FIRST BATCH            ✅ Q01–Q12 COMPLETE
PROVENANCE MODEL                   ✅ FROZEN v0.3 — T1-02 CLOSED
SEMANTIC VALIDATION                🟢 T1-03 NEXT
CAPABILITY CONTRACT                🟡 DRAFT / LATER GATE
TEMPORAL EXECUTION CONTRACT        🟡 DRAFT / LATER GATE
BUILD                              ⛔ CLOSED
TEST DESIGN / GATE EVIDENCE        🟢 ACTIVE
TEST IMPLEMENTATION                ⛔ CLOSED
```

## Immediate next move

Open and close:

```text
T1-03 — Semantic Validation
```

The next question is no longer:

> Where did this meaning come from?

T1-02 can now answer that.

The next question is:

> Given everything Talos knows, what is valid, what remains uncertain, what must be confirmed, and what specifically blocks safe execution design?
