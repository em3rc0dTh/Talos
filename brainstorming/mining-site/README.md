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
    ├── source-NN.<native-source-format>   # when binary/source ingestion is available
    ├── source-NN.md                       # source record + provenance + limitations
    ├── transform-NN.md                    # agent interpretation + comparison
    └── foundry-source-NN.md               # standardized semantic handoff
```

The original source artifact should be retained whenever repository ingestion supports its native format. The source record must always capture origin metadata and a stable digest so the transformation remains traceable even when the native binary has not yet been attached.

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
- participants, actors, lanes and ownership;
- steps and activities;
- decisions and branch outcomes;
- branch convergence / merge semantics;
- parallelism and joins;
- waits, deadlines and external events;
- human interactions and physical work;
- subprocesses;
- boundary events and exception paths;
- business objects and state evidence;
- identity/access gates and preconditions;
- business communication intent and explicit channel evidence;
- data and rules;
- integrations explicitly present in the source;
- uncertainties, conflicts and missing semantics;
- candidate Temporal concepts, without pretending an implementation choice is source truth.

## What FOUNDRY-SOURCE means

A Foundry Source is not Temporal code and is not yet a deployment plan. It is the standardized semantic handoff produced by Mining Site work.

The Foundry receives this artifact and asks a different question:

> How should this validated business-process meaning become a durable executable system?

Only the Foundry may resolve execution design such as Workflow boundaries, Activities, Signals / Updates, Timers, Child Workflows, retry policies, task queues, integration adapters, worker topology and technical failure behavior.

## Experimental rule

Do not standardize from one example. Each quarry must be compared against prior quarries. Repeated semantics may become TALOS primitives; one-off details remain source-specific until evidence supports generalization.

Critical rules exposed by Mining Site work:

```text
BUSINESS PROCESS NODE            ≠ automatically a Temporal Activity
BUSINESS EXCEPTION               ≠ automatically a technical failure
BUSINESS REJECTION               ≠ automatically a technical failure
BUSINESS MESSAGE                 ≠ automatically a known integration
SOURCE NOTATION                  ≠ automatically execution semantics
IDENTITY / ACCESS GATE           ≠ automatically a known auth implementation
DATA RETENTION INTENT            ≠ automatically proven consent/compliance semantics
```

## Current evidence set

```text
QUARRY-01  Order Process
           sequence + actors + decisions + terminal failure/success

QUARRY-02  Water Order & Delivery
           participant boundary + message + wait + business objects + subprocess + physical work

QUARRY-03  Availability / Procurement / Settlement
           message start + subprocess boundary events + domain exception/escalation + multiple business outcomes

QUARRY-04  Candidate Application Lifecycle
           identity/access gateway + optional pre-processing + shared rejection handling
           + three-way domain decision + explicit SMS channel + retention intent
```

The standard language remains provisional. Each new quarry should either reinforce existing concepts, expose missing semantics, or challenge an assumption already present in the model.
