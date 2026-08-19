# TALOS Mining Site

## Purpose

The Mining Site is TALOS's controlled experimentation area for learning how heterogeneous business-process sources can be interpreted, normalized, and handed to the Foundry without erasing their origin.

A quarry is one concrete process source used as evidence. A quarry may begin from an image, BPMN/Bizagi model, whiteboard, flowchart, Mermaid/draw.io artifact, natural-language description, existing automation, or another process representation.

The Mining Site does not produce executable code. Its job is to preserve source truth, perform an auditable transformation, surface uncertainty, and emit a clean Foundry Source.

```text
QUARRY-NN
raw process source
        ↓
TRANSFORM-NN
agent interpretation + normalization
        ↓
FOUNDRY-SOURCE-NN
canonical process handoff
        ↓
FOUNDRY
execution design
        ↓
TEMPORAL MODEL
```

## Standard quarry structure

```text
brainstorming/mining-site/
└── quarry-NN-<short-name>/
    ├── source-NN.md
    ├── transform-NN.md
    └── foundry-source-NN.md
```

The original source artifact should be retained whenever repository ingestion supports its native format. The source record must still capture origin metadata and a stable digest so the transformation remains traceable.

## Truth discipline

Every quarry must distinguish:

- `SOURCE_TRUTH` — explicitly visible or supplied by the source.
- `INFERRED` — interpretation needed to make the source understandable.
- `SUGGESTED` — a possible design improvement or implementation choice.
- `CONFIRMED` — interpretation accepted through review.
- `EXECUTABLE` — semantics are sufficiently specified for execution design.

Confidence never replaces truth state.

## What TRANSFORM does

A transform may extract and normalize:

- process trigger and terminal outcomes;
- actors / lanes / ownership;
- steps and activities;
- decisions and branch outcomes;
- parallelism and joins;
- waits, deadlines and external events;
- human interactions;
- subprocesses;
- data and rules;
- integrations explicitly present in the source;
- uncertainties, conflicts and missing semantics;
- candidate Temporal concepts, without pretending an implementation choice is source truth.

## What FOUNDRY-SOURCE means

A Foundry Source is not Temporal code and is not yet a deployment plan. It is the standardized semantic handoff produced by Mining Site work.

The Foundry receives this artifact and asks a different question:

> How should this validated business-process meaning become a durable executable system?

Only the Foundry may resolve execution design such as Workflow boundaries, Activities, Signals / Updates, Timers, Child Workflows, retry policies, task queues, integration adapters and worker topology.

## Experimental rule

Do not standardize from one example. Each quarry must be compared against prior quarries. Repeated semantics may become TALOS primitives; one-off details remain source-specific until evidence supports generalization.
