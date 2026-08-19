# TALOS — Product Contract v0.1

Status: **DESIGN DRAFT / ACTIVE**

## Product promise

TALOS allows a user to provide or create a representation of a business process and receive a normalized, standardized, explainable automation design without losing the source from which the process originated.

The user may start from:

- image or screenshot;
- BPMN / Bizagi;
- UPN;
- UML Activity Diagram;
- EPC;
- Petri Net;
- SIPOC;
- Value Stream Mapping;
- Mermaid;
- draw.io;
- natural language;
- existing automation/workflow definitions;
- TALOS Canvas.

## Primary user loop

```text
EXPRESS
  ↓
UNDERSTAND
  ↓
NORMALIZE
  ↓
DESIGN
  ↓
EXPLAIN
  ↓
REVIEW
  ↓
CORRECT
  ↓
VALIDATE
  ↓
EXECUTE
  ↓
OBSERVE
```

## Required output before execution

Every TALOS automation draft must expose two synchronized views derived from the same canonical process revision.

### A. Human-readable workflow

A business-facing explanation containing:

- trigger;
- ordered or parallel steps;
- actors;
- decisions;
- human interactions;
- systems involved;
- waits/events;
- completion conditions;
- unresolved gaps.

### B. Visual execution canvas

A technical/operational graph containing:

- workflow boundary;
- tasks;
- human nodes;
- decisions;
- parallel branches;
- waits/timers;
- data transitions where relevant;
- integrations/capabilities;
- AI steps;
- subprocesses/child workflows;
- warnings and unresolved bindings.

Changes in either view must reconcile through the canonical model rather than creating independent process truths.

## Interpretation behavior

TALOS must distinguish:

```text
SOURCE TRUTH
INFERRED
SUGGESTED
CONFIRMED
EXECUTABLE
```

Suggested steps, inferred conditions and proposed integrations must be visually or semantically distinguishable from source-confirmed facts.

## Process-completeness behavior

TALOS must not pretend every input is executable.

For high-level sources such as SIPOC or Value Stream Maps, TALOS should produce:

1. normalized high-level process understanding;
2. candidate refinement;
3. explicit missing execution information;
4. questions or proposed resolutions;
5. execution readiness assessment.

## Example

Input:

```text
Receive invoice
  ↓
Check invoice
  ↓
Pay supplier
```

Possible TALOS interpretation:

```text
SOURCE
- Receive invoice
- Check invoice
- Pay supplier

INFERRED
- "Check invoice" is a validation step.

SUGGESTED
- Extract invoice data
- Validate supplier
- Detect duplicate
- Match purchase order
- Require approval over threshold

UNRESOLVED
- source system
- payment authority
- approval threshold
- failure handling
```

Nothing under `SUGGESTED` becomes executable truth until accepted or otherwise supported by authoritative evidence.

## Whiteboard behavior

A user with no existing source artifact may build the process inside TALOS.

The Canvas should use business-oriented components first, with technical Temporal concepts available progressively.

The product should allow a user to express:

> When this happens, do these things, ask this person, connect to this system, wait for this event, and then continue.

TALOS handles the durable orchestration design behind that expression.

## Integration behavior

TALOS may bind steps to:

- native/direct integration capabilities;
- internal services;
- MCP tools/servers;
- n8n workflows;
- SaaS APIs;
- human tasks;
- AI capabilities.

An integration binding is part of an execution plan, not part of immutable source truth unless the source explicitly defines it.

## Temporal behavior

Users are not required to design Temporal primitives directly.

TALOS can translate canonical semantics into concepts such as:

- Activities;
- Signals;
- Updates;
- durable Timers;
- Child Workflows;
- retry policies;
- cancellation;
- compensation;
- Continue-As-New where needed.

An advanced technical view may expose these mappings for developers and architects.

## Safety/product rule

TALOS must not silently convert ambiguous process intent into real-world side effects.

Execution requires a validated `DeploymentRevision` produced from a specific canonical `ProcessRevision`.
