# TALOS — Source / Notation Semantics Map v0.1

Status: **ACTIVE BRAINSTORM / RESEARCH CONTRACT**

## Purpose

TALOS accepts heterogeneous business-process representations. This document records what each source family tends to express well, what may be missing, and what TALOS must preserve during normalization.

This is not a completeness claim for each notation. It is a guide for adapter and canonical-model design.

---

## BPMN / Bizagi-style BPMN

### Strong evidence

- start/end events;
- tasks;
- gateways;
- sequence flow;
- messages/events;
- timers;
- subprocesses;
- lanes/pools/participants;
- boundary events;
- execution-oriented branching.

### TALOS preservation needs

- original element IDs;
- gateway/event subtype;
- pool/lane ownership;
- boundary relationships;
- sequence conditions;
- subprocess boundaries;
- source extension metadata where useful.

### Risk

Do not interpret BPMN by simply reading tasks in XML order.

---

## UPN — Universal Process Notation

### Strong evidence

- readable hierarchical actions;
- roles/actors;
- business-oriented triggers/actions;
- reduced visual complexity;
- process decomposition.

### TALOS preservation needs

- hierarchy;
- actor context;
- action semantics;
- trigger/result relationships;
- source text/context.

### Likely execution gaps

- exact retry/error semantics;
- technical integration binding;
- durable wait semantics;
- machine-readable decision expressions.

---

## UML Activity Diagram

### Strong evidence

- software/process actions;
- decision/merge;
- fork/join;
- activity partitions;
- object/data flow;
- concurrency.

### TALOS preservation needs

- action identity;
- fork/join semantics;
- guards;
- partitions;
- object-flow evidence.

---

## EPC — Event-driven Process Chain

### Strong evidence

- events;
- functions;
- event/function alternation;
- enterprise-process context;
- logical connectors.

### TALOS preservation needs

- event/function distinction;
- connector semantics;
- organizational/system associations where supplied.

### Risk

Execution implementation details may be intentionally absent from the process description.

---

## Petri Nets

### Strong evidence

- concurrency;
- synchronization;
- transitions;
- places/state;
- token behavior;
- reachability/deadlock-oriented analysis.

### TALOS preservation needs

- place/transition identities;
- arcs;
- token/marking assumptions;
- split/join semantics;
- concurrency evidence.

### Key principle

Petri Net semantics must not be flattened into a sequence merely to match a workflow UI.

---

## SIPOC

### Strong evidence

- Supplier;
- Input;
- Process;
- Output;
- Customer;
- process boundary;
- high-level operational context.

### TALOS preservation needs

- supplier/input/output/customer relationships;
- high-level process steps;
- boundary intent.

### Execution readiness

SIPOC is often **not execution-ready**.

TALOS should treat it as valuable process truth and expose the missing detail needed to derive an executable workflow.

---

## Value Stream Mapping

### Strong evidence

- material/information flow;
- value vs waste context;
- waiting/lead/process times;
- handoffs;
- operational bottlenecks.

### TALOS preservation needs

- timing/value annotations;
- flow relationships;
- inventory/wait states;
- observed vs target process distinctions where present.

### Execution readiness

Not every VSM element should become a Temporal step. Some elements are analytical evidence about the process.

---

## Mermaid / generic flowcharts / draw.io

### Strong evidence

Varies significantly.

Usually useful for:

- nodes;
- labels;
- edges;
- branch shape;
- rough grouping.

### TALOS preservation needs

- original graph and labels;
- source geometry/grouping where it contributes meaning;
- unknown/ambiguous node semantics.

### Risk

A rectangle labeled "Check" does not prove whether the action is human, automated, deterministic, external, or AI-driven.

---

## Image / screenshot / photographed whiteboard

### Strong evidence

Potentially rich but uncertain.

### Required intermediate representation

```text
Image
  ↓
Detected visual elements
  ↓
Candidate graph
  ↓
Interpretation + confidence
```

### Rule

Vision output is not automatically source semantic truth. TALOS must distinguish visual evidence from semantic inference.

---

## Natural language

### Strong evidence

Can contain rich business intent, rationale, exceptions and tacit rules.

### Preservation needs

- original text spans;
- extracted actor/action/event references;
- unresolved terminology;
- ambiguous conditions;
- provenance from sentence/span to canonical element.

---

## Existing automation/workflow systems

Examples:

- n8n;
- AWS Step Functions;
- other workflow engines;
- internal orchestrators.

### Strong evidence

Often strong on implementation behavior:

- task order;
- integrations;
- conditions;
- retry/wait behavior;
- payload flow.

### Limitation

Existing automation is not automatically equivalent to authoritative business intent. It may encode technical workarounds or outdated behavior.

TALOS should preserve both:

```text
IMPLEMENTED BEHAVIOR
and
BUSINESS PROCESS TRUTH
```

and surface discrepancies when known.

---

## TALOS Canvas

### Strong evidence

TALOS controls the creation semantics and can therefore make node intent explicit from the beginning.

### Advantage

This should be the first source used to validate the canonical model because source semantics can be designed intentionally instead of reverse-engineered.

---

# Cross-source normalization rule

The target is not:

```text
EVERYTHING → BPMN
```

or:

```text
EVERYTHING → TEMPORAL
```

The target is:

```text
SOURCE
  ↓
SOURCE-AWARE INTERPRETATION
  ↓
CANONICAL TALOS SEMANTICS
  ↓
STANDARDIZED PROCESS REVISION
  ↓
OPTIONAL EXECUTION DESIGN
```

Source-specific evidence that does not map directly into execution should remain attached to the canonical process rather than be discarded.
