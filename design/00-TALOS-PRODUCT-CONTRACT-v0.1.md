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

The normal product path must remain business-facing. Technical evidence, raw XML/JSON, provenance, provider diagnostics and runtime logs are available through progressive disclosure rather than being expanded by default.

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

## AI automation-design behavior

After a specific process revision has been reviewed and business-confirmed, TALOS should be able to ask a configured automation-design model to propose how that process could be implemented.

The preferred provider pattern is:

```text
Confirmed ProcessRevision
        ↓
TALOS governed design context
        ↓
Gemini primary
        ↓ insufficient/provider failure
Governed local fallback
        ↓
AutomationProposal [SUGGESTED]
```

This is different from image perception. The image model helps Talos see a source; the automation designer helps Talos propose an implementation direction after business meaning has already been confirmed.

The proposal may include:

- human coordination;
- system operations;
- direct APIs;
- internal services;
- MCP tools/servers;
- n8n workflows;
- SaaS integrations;
- database/storage actions;
- forms;
- AI execution capabilities;
- waits/timers;
- external effects;
- retry/timeout/idempotency candidates;
- compensation candidates;
- unresolved design questions.

The AI output is never an authority artifact. It must be parsed into a provider-independent Talos `AutomationProposal`, validated against exact canonical subjects and available capability contracts, and shown as `SUGGESTED` until a user explicitly reviews/adjusts/approves the design.

The user should not normally fill one integration form per business task. Manual capability fields are an advanced correction/fallback surface, not the primary design experience.

See `03-AI-AUTOMATION-DESIGN-AND-PROGRESSIVE-DISCLOSURE-v0.1.md`.

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

AI-proposed integrations remain suggestions until converted into explicit, validated capability selections by an approval decision.

## Temporal behavior

Users are not required to design Temporal primitives directly.

TALOS can translate canonical semantics and an approved automation design into concepts such as:

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

The automation-design AI does not generate authoritative Temporal workflow code. TALOS performs the deterministic mapping from an approved `ExecutionPlan` to Temporal/runtime artifacts.

## Progressive disclosure behavior

TALOS must preserve complete evidence without forcing the normal user to scroll through internal evidence volume.

### Normal view

Prioritize:

- current stage;
- source/process summary;
- visual BPMN/canvas review;
- blockers requiring user input;
- automation proposal;
- plan/runtime summaries;
- authority decisions.

### Advanced / Evidence view

Keep available but collapsed by default:

- all semantic questions;
- all validation findings;
- raw BPMN/XML;
- provenance records;
- perception diagnostics;
- runtime profile detail;
- evidence trace;
- raw execution/provider logs.

Repeated findings should be grouped in the normal view. Raw JSON or XML must not be required to complete an ordinary business-user workflow.

## Safety/product rule

TALOS must not silently convert ambiguous process intent into real-world side effects.

Execution requires a validated `DeploymentRevision` produced from a specific canonical `ProcessRevision` through approved automation design and a specific `ExecutionPlan`.
