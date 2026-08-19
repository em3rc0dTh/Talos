# QUARRY-01 — bitovi/temporal-bpmn-tool

Status: **RESEARCH SOURCE / DO NOT ADOPT AS FOUNDATION**

Source: `bitovi/temporal-bpmn-tool`

## Why this quarry matters

This repository demonstrates a small but relevant proof: an external BPMN definition can influence the sequence of Temporal Activities without generating a separate workflow source file for each process definition.

Its conceptual flow is:

```text
bpmn-js editor
    ↓
BPMN XML
    ↓
bpmn-moddle parser
    ↓
activity names
    ↓
Temporal Workflow
    ↓
dynamic Activity invocation
```

## Useful patterns

### Visual BPMN editing

The repository uses `bpmn-js` as the browser modeler and persists BPMN XML through a small API.

### Separation between workflow and activities

Temporal Activities are registered separately from workflow orchestration.

### Dynamic workflow behavior

The workflow asks for an Activity sequence and invokes Activities by name. This proves a process definition can drive Temporal execution dynamically.

## Critical limitations

The BPMN parser filters `flowElements` for `bpmn:Task` elements and returns their names. It does not perform a real traversal of BPMN execution semantics.

Therefore the pattern can represent simple sequences but does not correctly model the complete semantics needed by TALOS:

- exclusive gateways;
- parallel gateways;
- joins;
- timers;
- message events;
- signal events;
- human/user tasks;
- loops;
- subprocesses;
- boundary events;
- compensation;
- multi-instance behavior;
- correlation;
- error handling.

The workflow also passes the result of one Activity directly as the argument of the next, which is too implicit for TALOS' typed process-variable model.

## Repository maturity warning

The repository behaves as a short-lived proof of concept rather than a production foundation. The committed tests reference starter workflow/activity names that no longer exist in the current implementation.

The repository should therefore be mined for ideas, not copied as TALOS architecture.

## TALOS extraction

Keep:

- external process definitions can drive durable workflow behavior;
- visual modeling can be decoupled from execution;
- Activities can remain reusable implementation capabilities;
- Temporal can execute a process model interpreted at runtime.

Reject:

- flattening BPMN into `Task[]`;
- assuming XML element order equals execution order;
- implicit one-result-to-next-step data passing;
- mutable filesystem definitions as process identity;
- execution without semantic validation;
- treating BPMN as TALOS' canonical representation.

## Resulting TALOS principle

> TALOS may interpret a process definition dynamically, but the input must first become a validated canonical process model with explicit control-flow, data-flow, provenance and execution semantics.
