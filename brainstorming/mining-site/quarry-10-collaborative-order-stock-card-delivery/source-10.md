# Quarry 10 — Source 10 — Collaborative Order / Stock / Card / Delivery Flow

## Source record

- Quarry: `quarry-10-collaborative-order-stock-card-delivery`
- Source ID: `source-10`
- Source type: screenshot of a collaborative Miro whiteboard containing a workflow-like order process plus live-editor/UI overlays
- Supplied by: user during TALOS Mining Site working session
- Native uploaded filename: `quarry-10.webp`
- Original image dimensions: `1600 × 1200`
- Original file size: `53,188 bytes`
- Original image SHA-256: `45b86b98445fb18059f286a549f39deb47d7adae7ca067c6d6da74db0842b396`
- Observed byte format: WebP (`RIFF ... WEBP` signature)
- Native binary source: exact user-supplied WebP is retained in this quarry as `quarry-10.webp`

> Quarry 10 is valuable because the process is embedded inside an active collaborative-authoring interface. TALOS must separate the business graph from Miro chrome, collaborator presence and cursor overlays before process normalization.

## Visible authoring-environment layer

The screenshot visibly contains Miro workspace/editor UI, including examples such as:

```text
miro
Launch process
Present
Share
left-side tool palette
zoom controls
collaborator avatars / presence indicators
```

These elements are `SOURCE_TRUTH` about the captured source environment. They are not automatically part of the business process.

## Visible collaborator / cursor overlay

Four named collaborator labels with pointer/cursor markers are visible near the canvas:

```text
Himali
Aharon
Anna
Bettany
```

Their spatial proximity to process nodes is source evidence about editor presence in the screenshot only. The source does not state that these people are process actors, owners, assignees, approvers, customers, workers, or Temporal operators.

## Visible process-like nodes

The business-looking canvas contains these labeled shapes:

```text
Order
Receive order
Check stock
In stock?
Check credit card
Card valid?
Cancel order
Process credit card
Deliver
Receive
```

The source uses at least three visible style families:

```text
yellow rounded rectangles     Order / Receive
purple rounded rectangles     Receive order / Check stock / Check credit card / Cancel order / Process credit card / Deliver
blue diamonds                 In stock? / Card valid?
```

No legend is visible that defines the semantic meaning of the colors or yellow-vs-purple rounded rectangles. TALOS must preserve style as source metadata without turning color into semantic type.

## Visible control topology

The strongest readable process topology is:

```text
Order
  ↓
Receive order
  ↓
Check stock
  ↓
In stock?

  ├── Out of stock
  │       ↓
  │   Cancel order
  │
  └── In stock
          ↓
      Check credit card
          ↓
      Card valid?

      ├── Invalid
      │      ↓
      │   Cancel order
      │
      └── Valid
             ↓
         Process credit card
             ↓
           Deliver
             ↓
           Receive
```

The two negative conditions converge on the same visible `Cancel order` node.

## Explicit branch labels

Visible branch labels are:

```text
Out of stock
In stock
Invalid
Valid
```

These are source conditions/guards associated with the visible decision topology.

## Start / completion evidence

There is no explicit BPMN/UML-style start event visible.

`Order` is the visually first process-like node and has an outgoing arrow to `Receive order`, but the source does not state whether `Order` is:

- a trigger/event;
- a business object/artifact;
- an external action/request;
- a process state;
- or simply a styled first node.

Likewise, no explicit end/final event is visible after either `Cancel order` or `Receive`.

Therefore:

```text
PROCESS ENTRY: visually begins at Order; exact trigger semantics UNKNOWN
CANCEL PATH TERMINATION: not explicitly proven
SUCCESS PATH TERMINATION: not explicitly proven
```

## Source limitations

The screenshot does not explicitly establish:

- a notation legend;
- actor/role ownership for any business node;
- whether named collaborator cursors are related to business responsibilities;
- whether yellow node style means event, object, external party action, state, start/end, or something else;
- whether purple nodes are activities in a formal notation;
- whether blue diamonds are formally exclusive gateways, although their labels/topology strongly suggest decisions;
- whether `Cancel order` itself completes the process or triggers more work;
- whether `Receive` means customer receipt, warehouse receipt, acknowledgement, process completion, or another concept;
- what system owns inventory truth;
- what performs card validation;
- whether card validation and card processing use the same provider/system;
- what happens if credit-card processing fails after a card is deemed valid;
- what happens if delivery fails after payment processing;
- whether refund/compensation is required after post-payment failure;
- retry, timeout, cancellation, idempotency, correlation or audit semantics;
- whether stock is reserved between `Check stock` and `Deliver`;
- any external integration implementation.

Those gaps remain explicit for Transform/Foundry work.