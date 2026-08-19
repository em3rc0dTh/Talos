# TALOS — System Truth v0.1

Status: **FOUNDATIONAL / ACTIVE**

## Core statement

TALOS exists to **normalize and standardize business processes without erasing the origin that gave those processes meaning**.

A business process can be expressed through many forms: BPMN, Bizagi, UPN, UML Activity Diagrams, EPC, Petri Nets, SIPOC, Value Stream Mapping, Mermaid, draw.io, images, screenshots, whiteboards, plain text, existing automation definitions, or a process created directly inside the TALOS Canvas.

Those forms are not equivalent and must not be flattened into a lowest-common-denominator representation.

TALOS must recover the semantic meaning of the source, preserve its provenance, distinguish fact from interpretation, and create a normalized representation that can later be translated into an execution design.

## Why TALOS exists

Organizations already describe their operations, but those descriptions are fragmented across tools, people and levels of formalism.

The same process may exist simultaneously as:

- an analyst's BPMN diagram;
- an operations manager's SIPOC;
- a developer's UML activity diagram;
- a whiteboard photograph;
- a Bizagi export;
- a spreadsheet checklist;
- an n8n automation;
- an AWS Step Functions state machine;
- a set of API calls known only to developers;
- natural-language instructions used by employees.

The difficulty is not merely drawing these processes. The difficulty is crossing the boundary from **human process intent** into **reliable machine execution** without silently changing what the process means.

TALOS protects that boundary.

## Meaning of the name

Talos, the bronze automaton from Greek mythology, guarded Crete. The product uses the same metaphor at the semantic boundary between process representation and execution.

TALOS is the guardian that prevents an ambiguous picture, assumption or AI inference from becoming an uncontrolled real-world action.

## TALOS is not

TALOS is not:

- a BPMN-to-code transpiler;
- a BPMN runtime;
- a replacement for Temporal;
- a replacement for n8n;
- merely a whiteboard;
- a generic diagram parser;
- an AI agent that looks at a picture and immediately performs actions;
- a system that converts every notation into BPMN and discards the original source.

## TALOS is

TALOS is:

- a process-ingestion system;
- a process-understanding system;
- a normalization and standardization layer;
- a provenance-preserving canonical process model;
- a semantic gap detector;
- an automation-design assistant;
- an integration-design system;
- a human-review surface;
- a Temporal execution-plan generator/interpreter;
- a durable process observability and evolution system.

## Product equation

```text
TALOS
=
PROCESS EXPRESSION
+ PERCEPTION
+ PROCESS INTELLIGENCE
+ CANONICAL PROCESS MODEL
+ PROVENANCE
+ SEMANTIC VALIDATION
+ AUTOMATION DESIGN
+ CAPABILITY REGISTRY
+ HUMAN INTERACTION
+ TEMPORAL DURABILITY
+ OBSERVABILITY
```

## Input principle

The input notation is not the product boundary.

```text
BPMN ───────────────┐
UPN ────────────────┤
UML ────────────────┤
EPC ────────────────┤
Petri Net ──────────┤
SIPOC ──────────────┤
VSM ────────────────┤
Bizagi ─────────────┤
Mermaid ────────────┤
draw.io ────────────┤
Image ──────────────┤
Natural Language ───┤
Existing Workflow ──┤
TALOS Canvas ───────┘
                    ↓
          TALOS PROCESS MODEL
```

Each adapter must preserve what is known from the source and explicitly represent what is not known.

## Truth classes

Every significant process element must carry a truth status.

### SOURCE_TRUTH
Explicitly present in the source artifact or directly stated by the user.

### INFERRED
Interpretation produced by TALOS from available evidence.

### SUGGESTED
A possible improvement, missing step or implementation option proposed by TALOS.

### CONFIRMED
An interpretation or suggestion explicitly accepted by an authorized user.

### EXECUTABLE
Semantics are sufficiently specified and validated for inclusion in an execution plan.

TALOS must never silently promote `INFERRED` or `SUGGESTED` information to `SOURCE_TRUTH`.

## Process transformation principle

TALOS must not perform:

```text
IMAGE → AI → TEMPORAL
```

The minimum conceptual chain is:

```text
SOURCE ARTIFACT
      ↓
PERCEPTION / PARSING
      ↓
CANDIDATE PROCESS GRAPH
      ↓
PROVENANCE + CONFIDENCE
      ↓
SEMANTIC INTERPRETATION
      ↓
GAP DETECTION
      ↓
USER / AI RESOLUTION
      ↓
CONFIRMED PROCESS REVISION
      ↓
CANONICAL TALOS MODEL
      ↓
AUTOMATION DESIGN
      ↓
TEMPORAL EXECUTION PLAN
      ↓
VALIDATION
      ↓
DEPLOYMENT / EXECUTION
```

## Source semantics must survive normalization

A Petri Net may contain strong evidence for concurrency and synchronization.

A SIPOC may provide only high-level process boundaries and supplier/input/output/customer relationships.

A BPMN diagram may contain gateways, timer events, message events and subprocess structure.

A UPN representation may provide clear hierarchical business actions but less technical execution detail.

TALOS must preserve those differences.

Normalization means **common semantics with retained provenance**, not semantic destruction.

## Dual-output principle

Before execution, TALOS should produce two synchronized representations.

### Human-readable workflow

A clear list of business steps explaining what the system believes should happen.

### Technical process canvas

A visual execution design showing human tasks, systems, integrations, conditions, waits, AI steps, forms and Temporal boundaries.

The user must be able to inspect and correct both views before execution truth is frozen.

## Temporal boundary

Temporal is TALOS' durable execution engine, not TALOS itself.

Conceptually:

```text
TALOS Service Task   → Temporal Activity / Nexus operation
TALOS Human Task     → Workflow state + Signal/Update
TALOS Wait           → Durable Timer
TALOS Decision       → Deterministic workflow logic
TALOS Parallel       → Concurrent branches
TALOS Subprocess     → Child Workflow
TALOS External Event → Signal / Update / Nexus
TALOS Compensation   → Saga / compensation strategy
```

The mapping is not authoritative until the canonical process semantics are understood.

## Integration boundary

Integrations are capabilities used by workflows.

Possible implementations include:

- direct APIs;
- Gmail;
- Google Drive;
- Google Sheets;
- Slack;
- Microsoft Teams;
- Salesforce;
- HubSpot;
- Odoo;
- SAP;
- Stripe;
- OpenAI;
- MCP;
- custom internal services;
- n8n workflows.

n8n may implement an integration capability, but it should not become the durable orchestration authority for TALOS-managed long-running processes.

## Lifecycle truth

The project follows:

```text
brainstorming → design → arch → plan → build → test
```

A build gate is not opened merely because a prototype is possible.

The current foundational priority is to close the semantic contracts that make multiple input forms converge safely into one canonical model.
