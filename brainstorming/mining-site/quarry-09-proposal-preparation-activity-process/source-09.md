# Quarry 09 — Source 09 — Proposal Preparation Activity Process

## Source record

- Quarry: `quarry-09-proposal-preparation-activity-process`
- Source ID: `source-09`
- Source type: image / annotated UML activity-style process with activity partitions, actions, decision nodes, fork/join nodes, object nodes, control/object flows, initial node and activity final node
- Supplied by: user during TALOS Mining Site working session
- Native uploaded filename: `quarry-09.webp`
- Original image dimensions: `878 × 955`
- Original file size: `50,842 bytes`
- Original image SHA-256: `817f2f807ea397d65a898691ca8b5abd9be0af7595cd37c57bc04b9fd6d30bd8`
- Native binary source: exact user-supplied WebP available in the working session; repository binary attachment pending

> This source is unusually valuable because the image itself contains red explanatory annotations naming notation concepts. TALOS must preserve those annotations as source evidence about notation semantics while keeping them separate from the business-process graph.

## Source-level notation annotations

The image explicitly labels these notation concepts in red:

```text
Partition
Swimlane
Control Flow
Decision Node
Initial Node
Action
Flow Node
Object Node
Join Node
Activity Final Node
```

These red dashed arrows and labels are explanatory annotation overlays. They are not business-process edges.

## Visible responsibility partitions / swimlanes

Three top-level lane labels are visible:

```text
Customer Sales Interface
Proposal Owner
Quote Owner
```

The source also labels the overall container as `Partition` and one vertical area as `Swimlane`.

The exact UML ownership semantics beyond the visible labels are not restated in the source; TALOS preserves the container/lane distinction without assuming runtime deployment boundaries.

## Visible primary flow

The top process begins in `Customer Sales Interface`:

```text
Initial Node
  ↓
Initialize Contact
  ↓
Initial Opportunity Work
  ↓
Decision Node
```

The first decision has two visible guards:

```text
[accepted]
[rejected]
```

### Accepted branch

```text
[accepted]
  ↓
Create Proposal Project Plan
  ↓
black flow bar
```

The black bar has one visible incoming edge and three outgoing branches, reaching:

```text
Analyze and Finalize Proposal       [Proposal Owner]
Create a Delivery Project Plan      [Proposal Owner]
Prepare a Quote                     [Quote Owner]
```

Each branch then visibly creates or reaches an object node:

```text
Analyze and Finalize Proposal
  ↓ create
  aProposal : Proposal

Create a Delivery Project Plan
  ↓ create
  aPlan : Delivery Project Plan

Prepare a Quote
  ↓ create
  ObjectNode : Quote
```

Those three branch results feed a black bar explicitly annotated `Join Node`.

After the join:

```text
Compile Additional Information
  ↓
aProposal : Proposal
  → Prepare Proposal
  ↓
Object Customer Decision
  ↓
Activity Final Node
```

The arrow from the later `aProposal : Proposal` node points left into `Prepare Proposal`.

### Rejected / alternative branch

The first decision's `[rejected]` path reaches:

```text
Search Alternative
```

`Search Alternative` flows left into another diamond explicitly annotated `Decision Node`.

That second decision visibly participates in two continuations:

```text
[join w. other supplier or change requirements]
  → loop/re-entry toward Initialize Contact

[rejected or redirected to other region or supplier]
  → downward path to Activity Final Node
```

The exact business meaning of `join w. other supplier` is preserved verbatim from the source; TALOS does not rewrite it into a different requirement.

## Visible object-node evidence

Distinct rectangular object nodes are visible:

```text
aProposal : Proposal                 # after Analyze and Finalize Proposal
aPlan : Delivery Project Plan        # after Create a Delivery Project Plan
ObjectNode : Quote                    # after Prepare a Quote
aProposal : Proposal                 # after Compile Additional Information
```

There are two separate source nodes labeled `aProposal : Proposal` at different graph positions. The source does not prove whether they are the same runtime object instance, different snapshots, different object-node occurrences referring to one conceptual proposal, or copies.

`Object Customer Decision` is drawn as a rounded action-like node, not as a rectangular object node, despite the word `Object` in its label.

## Source limitations

The source does not explicitly establish:

- whether `Customer Sales Interface`, `Proposal Owner`, and `Quote Owner` are humans, systems, roles, teams, or mixed responsibilities;
- whether lane boundaries imply separate applications/services/workers;
- the exact runtime meaning of the black bar annotated `Flow Node`; its one-in/three-out topology strongly suggests a fork, but the annotation itself does not say `Fork Node`;
- whether the accepted branch's three activities must all complete before the join in every runtime case, although the visible join topology strongly supports synchronization;
- whether object-node arrows are control flow, object flow, or a mixture where the source does not explicitly label every edge;
- whether the two `aProposal : Proposal` object nodes represent one logical business object instance;
- what exact data is contained in Proposal, Delivery Project Plan, Quote, or Customer Decision;
- who/what performs `Object Customer Decision`;
- whether customer decision has multiple outcomes or only records a decision;
- what happens after activity completion outside this diagram;
- retry, timeout, cancellation, compensation, correlation, idempotency, persistence, or integration semantics;
- whether repeated proposal work should be implemented as one durable loop, a subprocess, or separate workflow instances.

These gaps remain explicit for transformation and Foundry design.