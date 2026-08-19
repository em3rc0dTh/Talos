# TALOS — Build

Status: **BUILD GATE CLOSED**

This directory is reserved for implementation artifacts after the relevant design and architecture contracts have been frozen.

## Rule

TALOS should not begin production implementation merely because a prototype can be written.

Before the first core build opens, at minimum these gates should be sufficiently closed:

```text
Canonical Process Model
Origin / Provenance Model
Semantic Validation Contract
ExecutionPlan boundary
Capability contract
Temporal execution strategy
```

## Why the gate exists

The principal engineering risk in TALOS is not whether Temporal can execute Activities or whether a canvas can draw boxes.

The difficult problem is preserving business meaning across heterogeneous source representations while creating an execution-safe standardized model.

If implementation begins before that semantic boundary is stable, source-specific assumptions will leak into runtime code and TALOS will collapse into a collection of converters.

## Build principles

When BUILD opens:

1. source adapters must depend on the canonical model, not Temporal directly;
2. UI graph structures must not become domain truth;
3. Temporal runtime structures must not become canonical process truth;
4. every runtime execution must pin immutable revision identities;
5. capability bindings must be explicit and versioned;
6. AI-produced semantics must preserve truth/provenance classification;
7. implementation must ship with fixtures/tests for the gate it closes.

## First expected implementation slice

The first implementation should prove the semantic pipeline rather than breadth:

```text
TALOS Canvas source
      ↓
Canonical ProcessRevision
      ↓
Semantic validation
      ↓
Human-readable explanation
      ↓
ExecutionPlan
      ↓
Small capability set
      ↓
Temporal execution
      ↓
Trace execution back to source/revision
```

After this vertical slice is trustworthy, BPMN and image adapters can be added without changing the core model.
