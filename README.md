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

Normalization means creating a common semantic representation. It does **not** mean pretending BPMN, UPN, UML, EPC, Petri Nets, SIPOC, images, or free-form business descriptions mean the same thing or carry the same amount of evidence.

The canonical model must preserve, at minimum:

- source artifact and source type;
- source revision/hash;
- source notation or representation;
- semantic meaning extracted from the source;
- confidence and provenance for interpreted elements;
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

No stage silently overwrites the truth established by an earlier stage. Superseded artifacts should be versioned and retained rather than deleted.

## Repository map

- `brainstorming/` — system truth, problem framing, research quarries, hypotheses, discovered constraints.
- `design/` — product behavior, user experience, process-model semantics, provenance and canvas contracts.
- `arch/` — system boundaries, canonical model, compiler/runtime architecture, capability registry and Temporal mapping.
- `plan/` — gated implementation roadmap and acceptance criteria.
- `build/` — implementation artifacts only after the relevant design/architecture gates are closed.
- `test/` — semantic fixtures, gate evidence, compiler/runtime/integration/determinism/provenance/end-to-end verification.
- `deprecated/` — superseded material retained for history when future revisions replace prior contracts.

## Current state

```text
SYSTEM TRUTH                         🟢 v0.1 ESTABLISHED
PROCESS INPUT / ORIGIN PRINCIPLE     🟢 v0.1 ESTABLISHED
PRODUCT CONTRACT                     🟡 DRAFT
CANONICAL PROCESS MODEL              🟢 v0.1 FROZEN — T1-01 CLOSED
MINING SITE                          🟢 Q01–Q12 FIRST BATCH COMPLETE
PROVENANCE MODEL                     🟡 v0.2 CANDIDATE — PRESSURE TEST NEXT
SEMANTIC VALIDATION                  ⚪ T1-03 PENDING
CAPABILITY REGISTRY                  🟡 DRAFT / NOT FROZEN
TEMPORAL EXECUTION MODEL             🟡 DRAFT / NOT FROZEN
TALOS CANVAS                         🟡 DESIGN DRAFT / NOT FROZEN
BUILD                                ⛔ CLOSED
TEST DESIGN / GATE EVIDENCE          🟢 ACTIVE
TEST IMPLEMENTATION                  ⛔ CLOSED
```

## Current gate evidence

`CANONICAL PROCESS MODEL v0.1` was pressure-tested against twelve semantic fixtures covering sequence, decisions, parallel synchronization, waits, human approval, subprocesses, source conflicts, incomplete SIPOC, Petri-Net concurrency, BPMN source IDs, TALOS Canvas origin and imported automation evidence.

The gate evidence lives in:

```text
test/01-CANONICAL-PROCESS-MODEL-PRESSURE-TEST-v0.1.md
```

The first ten real Mining Site quarries were cross-synthesized in:

```text
brainstorming/mining-site/CROSS-QUARRY-SYNTHESIS-v0.1.md
```

Two deliberately different final quarries then extended that evidence set:

```text
Q11 — physical hand-drawn process captured digitally
brainstorming/mining-site/CROSS-QUARRY-Q11-ADDENDUM-v0.1.md

test/03-PHYSICAL-SOURCE-CAPTURE-FIXTURE-Q11-v0.1.md

Q12 — digital-canvas functional model with ICOM-like relationship roles
brainstorming/mining-site/CROSS-QUARRY-Q12-ADDENDUM-v0.1.md

test/04-FUNCTIONAL-MODEL-CANVAS-FIXTURE-Q12-v0.1.md
```

Together Q01–Q12 expose provenance requirements around exact source bytes vs derivatives, physical origin vs captured representation, declared-vs-observed format, source presentation/annotation planes, occurrence identity, property-scoped evidence, relationship uncertainty, causality preservation, handwritten ambiguity, functional relationship roles, notation-scoped geometry, and abstraction/decomposition semantics.

The active provenance candidate is:

```text
design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.2.md
```

and its base gate test is defined in:

```text
test/02-PROVENANCE-PRESSURE-TEST-SPEC-v0.1.md
```

with Q11/Q12 supporting fixtures extending the gate through P28.

The next gate remains:

```text
T1-02 — Provenance Model
```

but it is now specifically **ready to pressure-test against the complete first Mining Site batch**, not ready to freeze by declaration.

## Working definition

> **TALOS is the semantic guard between business-process intent and durable machine execution.** It accepts heterogeneous process representations, preserves where each process came from, normalizes them into a common semantic model, makes ambiguity and conflicting evidence visible, designs an integrated execution plan, and only then maps validated process truth into Temporal and connected capabilities.

The Mining Site adds an important operational refinement:

> Before TALOS can normalize a source, it must first determine **what kind of evidence is present, which semantic plane it belongs to, which relationship roles the source actually expresses, and which parts are candidates for business-process execution**.
