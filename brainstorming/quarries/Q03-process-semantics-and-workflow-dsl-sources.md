# QUARRY-03 — Process Semantics & Workflow DSL Sources

Status: **ACTIVE RESEARCH MAP**

This quarry groups the external projects that should inform TALOS before its canonical model and compiler contracts are frozen.

## 1. temporalio/samples-typescript — DSL Interpreter

### Why it matters

Temporal's TypeScript samples include a DSL interpreter that represents workflow structure explicitly rather than flattening a process into an ordered list.

The sample models constructs such as:

```text
Sequence
Parallel branches
Activity invocation
Arguments
Results / bindings
```

### TALOS lesson

TALOS should study recursive process interpretation as a candidate execution pattern.

The canonical model must support structural constructs before the Temporal compiler/interpreter is designed.

---

## 2. bpmn-io/bpmn-js

### Why it matters

Provides a mature browser-based BPMN modeling surface and extension model.

### TALOS lesson

Useful as one source-specific editor/import surface. It must not become the canonical TALOS representation.

---

## 3. bpmn-io/bpmn-moddle

### Why it matters

Provides BPMN XML/meta-model parsing and writing.

### TALOS lesson

Useful at the BPMN adapter boundary for loss-aware parsing of formal BPMN artifacts.

---

## 4. bpmn-io/bpmn-js-token-simulation

### Why it matters

A BPMN diagram is not an ordered set of boxes. Token-flow behavior teaches important semantics around:

- branch activation;
- parallel split;
- synchronization/join;
- process completion;
- event-driven token movement.

### TALOS lesson

Study its semantic interpretation to avoid the flat-task mistake seen in simple BPMN prototypes.

---

## 5. sartography/SpiffWorkflow

### Why it matters

Provides a mature executable interpretation of BPMN constructs including events, timers, messages, loops, subprocesses and other runtime semantics.

### TALOS lesson

Use as a semantics quarry. TALOS' durable runtime remains Temporal, but SpiffWorkflow can inform how BPMN constructs should be understood before translation.

---

## 6. Open Workflow Specification

### Why it matters

Provides a vendor-neutral workflow language and concepts such as:

- tasks;
- forks;
- events;
- HTTP/OpenAPI;
- gRPC;
- AsyncAPI;
- MCP/A2A-style capabilities;
- authentication;
- retries;
- timeouts;
- errors;
- extensions.

### TALOS lesson

Before inventing every canonical construct independently, compare TALOS' Process Model requirements with this specification and explicitly document where TALOS aligns, diverges or adds provenance/process-normalization semantics.

---

## 7. Camunda Connectors

### Why it matters

Demonstrates a separation between connector SDK, runtime, secret handling, templates, inbound/outbound behavior and validation.

### TALOS lesson

Strong reference for the future TALOS Capability Registry.

A TALOS capability should eventually have explicit contracts such as:

```text
id
version
inputSchema
outputSchema
authentication
secretReferences
timeout
retryPolicy
idempotency
compensation
implementation
testHarness
```

---

## 8. Camunda engine/platform concepts

### Why it matters

Useful as an industrial BPMN/process runtime reference for user tasks, operational process management and execution semantics.

### TALOS lesson

Study behavior and architecture, not as the chosen durable engine. Temporal remains the intended execution foundation.

---

## 9. Mermaid / draw.io ecosystem

### Why it matters

TALOS must accept informal and semi-formal diagrams, not only BPMN.

### TALOS lesson

Source adapters must be independent. Each importer should emit canonical semantic candidates plus provenance rather than forcing the source through BPMN first.

---

## 10. Process mining systems such as PM4Py

### Why it matters

Future TALOS versions may compare designed processes with observed execution/event logs.

### TALOS lesson

This belongs to later process-intelligence evolution. It must not distract from the initial canonical-model and safe-execution gates.

---

# Research rule

No external repository becomes TALOS by default.

For each quarry TALOS must record:

```text
WHAT pattern is useful?
WHY is it useful?
WHAT assumptions does it make?
WHAT does TALOS preserve?
WHAT does TALOS reject?
WHAT contract is affected?
```

The purpose of quarry work is to improve architectural judgment, not to assemble the product by copying unrelated engines.
