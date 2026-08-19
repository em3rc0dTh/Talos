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

No stage silently overwrites the truth established by an earlier stage. Superseded artifacts should be versioned and retained rather than deleted.

## Repository map

- `brainstorming/` — system truth, problem framing, research quarries, hypotheses, discovered constraints.
- `design/` — product behavior, user experience, process-model semantics, provenance and canvas contracts.
- `arch/` — system boundaries, canonical model, compiler/runtime architecture, capability registry and Temporal mapping.
- `plan/` — gated implementation roadmap and acceptance criteria.
- `build/` — implementation artifacts only after the relevant design/architecture gates are closed.
- `test/` — semantic, compiler, runtime, integration, determinism, provenance and end-to-end verification.
- `deprecated/` — superseded material retained for history when future revisions replace prior contracts.

## Current state

```text
SYSTEM TRUTH                         🟢 v0.1 ESTABLISHED
PROCESS INPUT / ORIGIN PRINCIPLE     🟢 v0.1 ESTABLISHED
PRODUCT CONCEPT                      🟡 DOCUMENTING
CANONICAL PROCESS MODEL              🟡 DESIGN NEXT
PROVENANCE MODEL                     🟡 DESIGN NEXT
SEMANTIC VALIDATION                  🟡 DESIGN NEXT
CAPABILITY REGISTRY                  ⚪ NOT FROZEN
TEMPORAL EXECUTION MODEL             ⚪ NOT FROZEN
TALOS CANVAS                         ⚪ NOT FROZEN
BUILD                                ⛔ NOT OPEN
TEST                                 ⛔ WAITS FOR IMPLEMENTATION
```

## Working definition

> **TALOS is the semantic guard between business-process intent and durable machine execution.** It accepts heterogeneous process representations, preserves where each process came from, normalizes them into a common semantic model, makes ambiguity visible, designs an integrated execution plan, and only then maps validated process truth into Temporal and connected capabilities.
