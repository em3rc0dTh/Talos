# Quarry 07 — Source 07 — Order Validation, Payment & Fulfillment

## Source record

- Quarry: `quarry-07-order-validation-payment-fulfillment`
- Source ID: `source-07`
- Source type: image / UML activity-style process diagram with activity partitions, object/state nodes, decision node, fork/join bars and start/final nodes
- Supplied by: user during TALOS Mining Site working session
- Original uploaded filename: `quarry-07(1).png`
- Original image dimensions: `453 × 441`
- Original image size: `16,355 bytes`
- Original image SHA-256: `9a448ba44b98841bee8d52ba80df6f9c842eb2bac37c0ffa21df660cf335fc91`
- Native binary source: exact user-supplied PNG is available in the working session; repository binary attachment pending

> The semantic record preserves the source exactly as observed. TALOS must not replace the diagram with a cleaned recreation and then treat the recreation as source truth.

## Visible partitions / responsibility lanes

The diagram contains three vertical partitions:

```text
Customer
Sales assistant
Stockroom personnel
```

The source visibly associates activities with those partitions.

## Visible source topology

The strongest source reading is:

```text
CUSTOMER

START
  ↓
Request service
  ⇢ Order [New]

SALES ASSISTANT

Order [New]
  ⇢ Validate order
  ↓
DECISION
  ├── [Order rejected] → FINAL-LIKE NODE
  └── [Order correct]  → FORK BAR

FORK BAR
  ├── CUSTOMER: Pay
  └── Order [Placed] ⇢ STOCKROOM: Fill order

Pay ───────────────┐
                   ├── JOIN BAR
Fill order ────────┘
                       ↓
SALES ASSISTANT: Deliver order
```

The diagram therefore visibly combines control flow, ownership partitions and order-object/state evidence.

## Explicit activities

### Customer

- `Request service`
- `Pay`

### Sales assistant

- `Validate order`
- `Deliver order`

### Stockroom personnel

- `Fill order`

## Explicit object/state nodes

Two rectangular order-object nodes are visible:

```text
Order [New]
Order [Placed]
```

The bracketed labels are preserved as visible state qualifiers.

The source supports that an `Order` concept is shown in at least two states. It does **not** by itself prove a complete state machine or persistence implementation.

## Explicit decision outcomes

After `Validate order`, a diamond-shaped decision node has two visible guards:

```text
[Order rejected]
[Order correct]
```

The rejected path runs toward the final-like node in the Customer partition.

The correct path runs into the first thick horizontal bar.

## Parallelism evidence

Two thick horizontal bars are visible.

### First bar

The first bar is reached after the `[Order correct]` branch and has two downstream paths:

```text
Pay
Order [Placed] → Fill order
```

Its topology is consistent with a fork / parallel split.

### Second bar

The second bar has incoming paths from:

```text
Pay
Fill order
```

and one outgoing path to:

```text
Deliver order
```

Its topology is consistent with an all-branches synchronization join.

The exact notation is not named by a visible legend, so `fork` and `join` are source-aware interpretations based on the rendered topology rather than claimed notation metadata.

## Start and completion evidence

The source contains:

- one solid circular start node above `Request service`;
- one activity-final-like node on the rejected branch;
- **no visible final node after `Deliver order`**.

This distinction is important.

The rejected path has explicit termination evidence. The successful path visibly ends at the `Deliver order` activity in the supplied crop/image, but the source does not prove whether that activity is the global process end or whether a final node/continuation is omitted.

## Flow-type observations

The source visually distinguishes normal control connectors from connectors around the `Order [New]` and `Order [Placed]` object/state nodes.

TALOS should therefore preserve at least two candidate edge families:

```text
CONTROL FLOW
OBJECT / DATA FLOW
```

The exact UML metamodel identity of every edge is not asserted from the image alone.

## Source limitations

The source does not explicitly establish:

- what event/request creates the initial process instance;
- whether `Request service` is part of the internal durable workflow or an external customer action that triggers it;
- the exact payload/schema of `Order`;
- whether `Order [New]` and `Order [Placed]` are persisted states, transient object-node states, document states, or modeling annotations;
- what changes the order from `[New]` to `[Placed]`;
- whether payment must succeed, merely complete, or produce another business result before the join;
- whether `Fill order` may fail, partially complete, wait for inventory, or be cancelled;
- whether the first thick bar is formally a UML fork node and the second a UML join node, although their topology strongly suggests those semantics;
- whether the join waits for **both** payment and fulfillment in all cases or whether exceptional/cancellation paths exist outside the image;
- who/what performs validation and what rule establishes `[Order correct]` versus `[Order rejected]`;
- how customer payment is initiated and digitally observed;
- how stockroom fulfillment completion is digitally observed;
- whether `Deliver order` is physical work, system work, handoff coordination, or a mixture;
- whether a successful completion event exists after `Deliver order` outside the source image;
- retry, timeout, cancellation, compensation, idempotency, correlation, data ownership or technical integration semantics.

Those gaps must remain explicit during transformation.