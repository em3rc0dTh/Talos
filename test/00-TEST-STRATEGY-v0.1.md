# TALOS — Test Strategy v0.1

Status: **TEST DESIGN / IMPLEMENTATION NOT OPEN**

## Purpose

TALOS testing must prove more than code correctness. It must prove that business meaning survives normalization and execution.

## Test layers

### 1. Source adapter tests

For each supported source:

- parsing succeeds/fails predictably;
- source identities are preserved;
- source-specific semantics are retained;
- extraction confidence is recorded where applicable;
- unknown constructs remain visible instead of silently disappearing.

### 2. Canonical semantic fixtures

Maintain representative source-independent process fixtures for:

- sequence;
- exclusive decision;
- parallel split/join;
- wait/timer;
- external event;
- human approval;
- subprocess;
- loop;
- error path;
- source conflict;
- incomplete high-level model;
- multi-source normalization.

### 3. Provenance tests

Given any canonical node/edge/rule, verify TALOS can trace:

```text
canonical element
    ↓
provenance link
    ↓
source artifact
    ↓
source element/evidence
```

Also test:

- inference does not become source truth;
- confidence is distinct from truth class;
- user confirmation creates traceable state transition;
- edits create new revisions;
- prior revisions remain immutable.

### 4. Loss tests

For every adapter define what information is:

```text
PRESERVED
NORMALIZED
SOURCE-SPECIFIC
UNSUPPORTED
AMBIGUOUS
LOST
```

Unsupported or lost semantics must produce explicit findings where they could affect process meaning.

### 5. Semantic validation tests

Verify detection of:

- unreachable nodes;
- invalid joins;
- unresolved conditions;
- missing actors;
- missing required inputs;
- unresolved conflicts;
- undefined external events;
- execution-critical ambiguity.

### 6. Explanation tests

Human-readable step output and Canvas output must describe the same canonical revision.

Changes through either surface must create consistent semantic revisions.

### 7. Capability contract tests

For each capability verify:

- input schema;
- output schema;
- timeout behavior;
- retry behavior;
- authentication contract;
- idempotency behavior;
- error mapping;
- compensation contract where required.

### 8. Temporal determinism tests

Workflow/interpreter tests must verify replay/determinism safety.

External I/O must occur through Activities/Nexus or other Temporal-safe boundaries.

### 9. Temporal execution tests

Use Temporal test environments to verify:

- activity execution;
- retry behavior;
- parallel branches;
- timers;
- signals/updates;
- child workflows;
- cancellation;
- compensation paths;
- workflow restart/recovery where appropriate.

### 10. Revision pinning tests

Start a workflow from ProcessRevision A.

Create ProcessRevision B.

Verify the running workflow remains tied to its DeploymentRevision and does not silently adopt B.

### 11. Integration tests

Test real or sandbox capability boundaries for initial integrations.

The integration layer must return normalized capability outcomes to the workflow rather than leaking provider-specific behavior throughout the domain model.

### 12. End-to-end tests

Required first end-to-end story:

```text
Source process
   ↓
SourceArtifact
   ↓
Canonical ProcessRevision
   ↓
Validation
   ↓
Human-readable draft + Canvas
   ↓
Capability bindings
   ↓
ExecutionPlan
   ↓
DeploymentRevision
   ↓
Temporal execution
   ↓
Observable result
   ↓
Trace back to original source
```

## Cross-notation semantic equivalence tests

A major TALOS capability should eventually be tested by describing the same logical process in multiple source representations.

Example:

```text
BPMN process
UPN description
UML activity diagram
TALOS Canvas
```

Expected outcome:

- canonical shared semantics converge where equivalent;
- source-specific differences remain represented;
- provenance always identifies the origin;
- TALOS does not claim equivalence where evidence differs materially.

## AI-specific tests

For perception/reasoning features verify:

- uncertain extraction remains uncertain;
- hallucinated process elements do not become source truth;
- suggestions are correctly classified;
- user rejection removes a suggestion from subsequent executable design;
- user confirmation is auditable;
- model/version lineage is recorded for interpretation artifacts.

## Gate philosophy

The critical test question is not only:

> Did the workflow execute?

It is:

> Did the workflow execute the process we can prove the user actually meant, from the exact source and revision we claim?
