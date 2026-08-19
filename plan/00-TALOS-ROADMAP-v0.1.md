# TALOS — Gated Roadmap v0.1

Status: **ACTIVE PLAN**

## Planning principle

TALOS should not begin by building many importers or drawing a polished UI.

The highest-risk problem is semantic: can heterogeneous process representations converge into one standardized model without losing their origin or inventing execution truth?

The roadmap therefore closes semantic gates before opening broad implementation.

---

# PHASE 0 — FOUNDATION

## T0-01 — System Truth

**Goal:** Establish what TALOS is and is not.

Deliverables:

- System Truth v0.1
- Product hypothesis
- origin-preservation principle
- truth classes
- Temporal boundary

Gate:

```text
TALOS = normalization + standardization + provenance + automation design + durable execution
```

Status: **CLOSED v0.1**

---

# PHASE 1 — CANONICAL SEMANTICS

## T1-01 — Canonical Process Model

Define and test the minimal canonical vocabulary:

- process definition/revision;
- event/trigger;
- action/task;
- decision;
- sequence;
- parallel split;
- synchronization;
- wait;
- human interaction;
- subprocess;
- state;
- completion;
- actors;
- variables/data;
- rules;
- claims/conflicts;
- source-specific annotations;
- semantic vs execution readiness.

### Gate

The model must represent all initial semantic fixtures without source loss.

### Gate evidence

```text
test/01-CANONICAL-PROCESS-MODEL-PRESSURE-TEST-v0.1.md
```

Pressure-tested fixtures:

```text
01 Simple sequence                         PASS
02 Exclusive decision                      PASS
03 Parallel split + join                   PASS
04 Durable wait                            PASS
05 Human approval                          PASS
06 Subprocess                              PASS
07 Source conflict                         PASS
08 SIPOC incomplete process                PASS
09 Petri Net concurrency                   PASS
10 BPMN source-ID preservation             PASS
11 Native TALOS Canvas                     PASS
12 Existing automation evidence            PASS
```

Status: **CLOSED / FROZEN v0.1 — 2026-08-18**

## T1-02 — Provenance Model

Formalize:

- SourceArtifact;
- ProvenanceLink;
- SemanticClaim;
- evidence perspective;
- truth class;
- confidence;
- conflicts;
- confirmation;
- transformation lineage.

### Gate

For every canonical element TALOS can answer:

> Where did this come from, what kind of evidence is it, how was it interpreted, where did sources disagree, and who/what confirmed the current meaning?

Status: **NEXT**

## T1-03 — Semantic Validation

Define validation classes:

- structural validity;
- control-flow validity;
- unresolved condition;
- missing actor;
- missing data;
- unresolved source conflict;
- incomplete wait/event semantics;
- insufficient detail for execution.

### Gate

TALOS can distinguish a useful business model from an execution-ready process.

Status: **PENDING**

---

# PHASE 2 — FIRST SOURCE ADAPTERS

## T2-01 — TALOS Canvas Adapter

Start from a source TALOS fully controls.

The Canvas should create canonical process revisions directly while still using the same provenance model.

### Gate

A user can create a sequential process, condition, parallel branch, wait and human task and obtain a valid canonical revision.

Status: **PENDING**

## T2-02 — BPMN Adapter

Use `bpmn-moddle`/equivalent parsing and map BPMN elements to canonical semantics while preserving original IDs and BPMN-specific annotations.

Do not compile directly to Temporal.

### Gate

Representative BPMN fixtures survive round-trip interpretation into the canonical model without flattening gateways/events.

Status: **PENDING**

## T2-03 — Image / Graphic Candidate Adapter

Use perception to produce a candidate graph with confidence/provenance.

### Gate

No inferred image element is treated as source-confirmed execution truth without an explicit interpretation/confirmation path.

Status: **PENDING**

---

# PHASE 3 — EXPLANATION & REVIEW

## T3-01 — Human-readable Workflow Draft

Generate a clear step list from the canonical process model.

## T3-02 — Visual Review Canvas

Render imported/normalized processes with truth/provenance states.

## T3-03 — Correction Loop

Allow user edits to create new revisions and preserve the original source.

### Phase gate

A user can import/create a process, understand TALOS' interpretation, see uncertainty, correct it and freeze a confirmed semantic revision.

---

# PHASE 4 — CAPABILITY MODEL

## T4-01 — Capability Contract

Define:

- identity/version;
- input/output schemas;
- authentication/secret requirements;
- retry policy;
- timeout;
- idempotency;
- compensation;
- implementation kind.

## T4-02 — Forms

Forms become first-class capabilities for process starts and human tasks.

## T4-03 — Initial Integrations

Choose a deliberately small initial capability set, for example:

- HTTP/custom API;
- Gmail;
- Google Drive;
- n8n webhook/workflow;
- generic human approval;
- AI task.

### Phase gate

Canonical tasks can be bound to explicit versioned capabilities without changing their underlying business meaning.

---

# PHASE 5 — TEMPORAL EXECUTION MODEL

## T5-01 — ExecutionPlan Contract

Transform a validated ProcessRevision into a separate versioned execution design.

## T5-02 — Temporal Interpreter/Compiler Strategy

Evaluate and choose deliberately between:

- generic recursive interpreter workflow;
- generated workflow code;
- hybrid templates/compiled structures.

Use official Temporal DSL patterns as a research reference.

## T5-03 — Core Temporal mappings

Initial support:

- action → Activity;
- decision → deterministic branch;
- parallel → concurrent branches;
- wait → durable Timer / event wait strategy;
- human task → persistent state + Signal/Update;
- subprocess → Child Workflow / selected execution boundary.

## T5-04 — DeploymentRevision

Pin compiler, process, execution plan and capability versions.

### Phase gate

A validated process can execute durably and the runtime instance can be traced back to its exact source/revision lineage.

---

# PHASE 6 — FIRST END-TO-END VERTICAL SLICE

Use a deliberately understandable business process, for example:

```text
Service request
  ↓
Resolve customer
  ↓
Existing?
 /       \
yes      no → Create customer
 \       /
  Create appointment
        ↓
 Send confirmation
        ↓
 Human/internal notification
```

The slice should exercise:

- source input;
- provenance;
- decision;
- integration;
- human-readable explanation;
- Canvas rendering;
- Temporal execution;
- runtime history.

### Gate

The system demonstrates the complete TALOS proposition rather than only one subsystem.

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

Each adapter requires semantic fixtures and loss/provenance tests.

---

# PHASE 8 — OBSERVABILITY & PROCESS INTELLIGENCE

Future scope:

- designed vs observed process comparison;
- process execution analytics;
- bottleneck evidence;
- runtime drift;
- process mining inputs;
- improvement suggestions backed by execution data.

This phase must not contaminate the initial execution model with premature complexity.

---

# Current project gate

```text
FOUNDATION                         ✅
SYSTEM TRUTH                       ✅ v0.1
PRODUCT CONTRACT                   ✅ draft
ORIGIN / PROVENANCE CONTRACT       🟡 draft — NEXT FREEZE
SYSTEM ARCHITECTURE                ✅ draft
CANONICAL MODEL                    ✅ FROZEN v0.1
SEMANTIC VALIDATION                ⚪ pending
CAPABILITY CONTRACT                🟡 draft
TEMPORAL EXECUTION CONTRACT        🟡 draft
BUILD                              ⛔ CLOSED
TEST IMPLEMENTATION                ⛔ CLOSED
```

## Immediate next move

Close **T1-02 — Provenance Model v0.1**.

T1-01 proved that provenance is not merely metadata. The next contract must formalize source artifacts, claims, evidence perspectives, conflicts, confirmations and transformation lineage strongly enough that any canonical or future execution element can be traced back to the origin TALOS is protecting.
