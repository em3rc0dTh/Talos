# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a process-intelligence and durable-execution system whose central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, notation, provenance, and evidence of the source from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, and not a diagramming product. BPMN, UPN, UML Activity Diagrams, EPC, Petri Nets, SIPOC, Value Stream Mapping, Bizagi exports, Mermaid, draw.io, images, screenshots, natural language, existing workflow definitions, and the TALOS Canvas are all possible **process-expression sources**.

The system interprets those sources into a canonical TALOS Process Model, identifies missing execution semantics, designs the required human/system/AI/integration interactions, explains the proposed automation to the user, and uses Temporal as the durable execution engine after the process has been reviewed and validated.

```text
ANY PROCESS REPRESENTATION
          ↓
  PROCESS UNDERSTANDING
          ↓
 TALOS CANONICAL MODEL
          ↓
 SEMANTIC VALIDATION
          ↓
 AUTOMATION DESIGN
          ↓
 HUMAN-READABLE DRAFT + CANVAS
          ↓
 REVIEW / CORRECTION / VALIDATION
          ↓
 TEMPORAL EXECUTION PLAN
          ↓
 DURABLE EXECUTION + OBSERVATION
```

## Non-negotiable truth

> TALOS normalizes and standardizes the business process **without destroying or replacing its origin**.

Normalization means creating a common semantic representation. It does **not** mean pretending BPMN, UPN, UML, EPC, Petri Nets, SIPOC, images, functional models, physical drawings, canvases, or free-form business descriptions mean the same thing or carry the same amount of evidence.

TALOS provenance now explicitly distinguishes:

```text
SOURCE ORIGIN
      ≠
CAPTURE EVENT
      ≠
SOURCE REPRESENTATION
      ≠
SEMANTIC INTERPRETATION
```

A photograph is not the paper drawing. A screenshot is not the native canvas graph. A derivative is not the captured/native representation. A hash identifies representation bytes, not a non-byte physical origin.

The canonical/provenance model preserves, at minimum:

- source origin and source medium;
- capture method/context;
- concrete source representation and byte identity;
- source/native representation availability;
- source notation / artifact classification;
- source semantic planes;
- local evidence fragments and source occurrences;
- semantic meaning extracted from the source;
- property-scoped confidence and provenance;
- distinction between source truth, inference, suggestion, confirmation, and executable truth;
- evidence perspective, including business intent vs implemented behavior;
- source conflicts and their resolution history;
- transformation/compiler version;
- immutable process and deployment revisions.

## Lifecycle

TALOS follows a gated lifecycle:

```text
brainstorming/
      ↓
design/
      ↓
arch/
      ↓
plan/
      ↓
build/
      ↓
test/
```

`test/` is also used before BUILD for semantic fixtures, pressure tests and gate evidence. Runtime/integration test implementation opens only when the corresponding build gates open.

No stage silently overwrites the truth established by an earlier stage. Superseded artifacts are versioned and retained rather than deleted.

## Repository map

- `brainstorming/` — system truth, problem framing, research quarries, hypotheses, discovered constraints.
- `design/` — product behavior, user experience, provenance/canvas contracts and frozen design decisions.
- `arch/` — system boundaries, canonical model, compiler/runtime architecture, capability registry and Temporal mapping.
- `plan/` — gated implementation roadmap and acceptance criteria.
- `build/` — implementation artifacts only after the relevant design/architecture gates are closed.
- `test/` — semantic fixtures, pressure-test results, gate closure evidence and later compiler/runtime/integration verification.
- `deprecated/` — superseded material retained for history when future revisions replace prior contracts.

## Current state

```text
SYSTEM TRUTH                         🟢 v0.1 ESTABLISHED
PROCESS INPUT / ORIGIN PRINCIPLE     🟢 ESTABLISHED
PRODUCT CONTRACT                     🟡 DRAFT
CANONICAL PROCESS MODEL              🟢 v0.1 FROZEN — T1-01 CLOSED
MINING SITE                          🟢 Q01–Q12 FIRST BATCH COMPLETE
PROVENANCE MODEL                     🟢 v0.3 FROZEN — T1-02 CLOSED
SEMANTIC VALIDATION                  🟢 T1-03 NEXT
CAPABILITY REGISTRY                  🟡 DRAFT / NOT FROZEN
TEMPORAL EXECUTION MODEL             🟡 DRAFT / NOT FROZEN
TALOS CANVAS                         🟡 DESIGN DRAFT / NOT FROZEN
BUILD                                ⛔ CLOSED
TEST DESIGN / GATE EVIDENCE          🟢 ACTIVE
TEST IMPLEMENTATION                  ⛔ CLOSED
```

## Gate evidence

### T1-01 — Canonical Process Model

`CANONICAL PROCESS MODEL v0.1` was pressure-tested against twelve semantic fixtures covering sequence, decisions, parallel synchronization, waits, human approval, subprocesses, source conflicts, incomplete SIPOC, Petri-Net concurrency, BPMN source IDs, TALOS Canvas origin and imported automation evidence.

```text
test/01-CANONICAL-PROCESS-MODEL-PRESSURE-TEST-v0.1.md
12 / 12 PASS
```

### Mining Site first batch

The first ten real Mining Site quarries were cross-synthesized in:

```text
brainstorming/mining-site/CROSS-QUARRY-SYNTHESIS-v0.1.md
```

Two deliberately different final quarries extended the evidence:

```text
Q11 — physical hand-drawn process captured digitally
brainstorming/mining-site/CROSS-QUARRY-Q11-ADDENDUM-v0.1.md

test/03-PHYSICAL-SOURCE-CAPTURE-FIXTURE-Q11-v0.1.md

Q12 — digital-canvas functional model with ICOM-like relationship roles
brainstorming/mining-site/CROSS-QUARRY-Q12-ADDENDUM-v0.1.md

test/04-FUNCTIONAL-MODEL-CANVAS-FIXTURE-Q12-v0.1.md
```

Together Q01–Q12 expose provenance requirements around exact bytes vs derivatives, physical origin vs captured representation, declared-vs-observed format, source presentation/annotation planes, occurrence identity, property-scoped evidence, relationship uncertainty, causality preservation, handwritten ambiguity, functional relationship roles, notation-scoped geometry, and abstraction/decomposition semantics.

### T1-02 — Provenance Model

Base pressure-test definition:

```text
test/02-PROVENANCE-PRESSURE-TEST-SPEC-v0.1.md
```

Initial execution against v0.2:

```text
test/05-PROVENANCE-PRESSURE-TEST-RESULT-v0.1.md
26 PASS / 2 FAIL
```

The two failures were Q11/Q12 origin-boundary defects:

```text
P17 physical origin vs digital capture
P28 native canvas vs screenshot representation
```

That evidence forced v0.3 to add:

```text
SourceOrigin
explicit origin → capture → representation lineage
SourceAvailabilityRecord
native/captured representation distinction
representation-scoped byte identity
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

## Current gate

```text
T1-03 — Semantic Validation
```

The provenance question is now closed for the first contract:

> Where did this meaning come from and what evidence/authority supports it?

The active question becomes:

> Given everything TALOS knows, what is structurally/semantically valid, what remains uncertain, what requires confirmation, and what specifically blocks safe execution design?

The active plan is:

```text
plan/00-TALOS-ROADMAP-v0.2.md
```

## Working definition

> **TALOS is the semantic guard between business-process intent and durable machine execution.** It accepts heterogeneous process representations, preserves their source origin and evidence lineage, normalizes them into a common semantic model, makes ambiguity and conflicting evidence visible, validates semantic readiness, designs an integrated execution plan, and only then maps validated process truth into Temporal and connected capabilities.

The Mining Site adds an operational refinement:

> Before TALOS can normalize a source, it must determine **what kind of evidence is present, where it originated, how it was captured, which semantic plane it belongs to, which relationship roles the source actually expresses, and which parts are candidates for business-process execution**.
