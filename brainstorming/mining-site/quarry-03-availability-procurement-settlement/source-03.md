# Quarry 03 — Source 03 — Availability / Procurement / Settlement

## Source record

- Quarry: `quarry-03-availability-procurement-settlement`
- Source ID: `source-03`
- Source type: image / BPMN-style process diagram
- Supplied by: user during TALOS Mining Site working session
- Original image dimensions: `755 × 337`
- Original image SHA-256: `38aa5e13ed811a50472e38abad73600b2613eb346029ea64666a6e280420d6c6`
- Native binary source: user-supplied PNG from the working session

> The source record preserves the original image identity and digest. The native PNG is not reconstructed from the diagram description; it should be attached as `source-03.png` when a binary-ingestion path is available.

## Visible source truth

The diagram shows an order-handling process beginning with a message-style start event labeled `Order Received`.

The visible main flow is:

```text
Order Received
  ↓
Check Availability
  ↓
Article Available?
  ├── Yes → Ship Article
  │           ↓
  │       Financial Settlement
  │           ↓
  │       Payment Received
  │
  └── No  → Procurement
                ├── normal completion → Ship Article → Financial Settlement → Payment Received
                ├── Undeliverable → Inform Customer → Remove Article from Catalogue → Article Removed
                └── Late Delivery → Inform Customer → Customer Informed
```

## Explicit elements

### Start event

- `Order Received` — message-style event marker is visibly present.

### Activity / task

- `Check Availability`.
- `Ship Article`.
- `Inform Customer` — appears on the `Late Delivery` branch.
- `Inform Customer` — appears on the `Undeliverable` branch.
- `Remove Article from Catalogue`.

### Decision

- `Article Available`
  - `Yes` continues directly to `Ship Article`.
  - `No` continues to `Procurement`.

### Collapsed subprocesses

The plus marker is visibly present on:

- `Procurement`.
- `Financial Settlement`.

The internal definitions of both subprocesses are not visible in the source image.

### Boundary events attached to Procurement

Two labeled events are visibly attached to the `Procurement` subprocess boundary:

- `Undeliverable` — icon is error/lightning-like.
- `Late Delivery` — icon is escalation/triangle-like.

The labels, attachment, and outgoing paths are `SOURCE_TRUTH`.

The exact BPMN event classes and interruption semantics are notation interpretations because this quarry contains only a rendered image, not the original BPMN XML or notation legend.

### End states

The source contains three distinct terminal labels:

- `Payment Received`.
- `Customer Informed`.
- `Article Removed`.

## Source limitations

The source does not explicitly establish:

- the order payload or business identifier;
- who or what performs `Check Availability`;
- what system or evidence determines availability;
- what happens inside `Procurement`;
- what exactly raises `Undeliverable`;
- what exactly raises `Late Delivery`;
- whether either Procurement boundary event is interrupting or non-interrupting;
- what happens inside `Financial Settlement`;
- whether `Payment Received` is a message, state transition, settlement result, or external confirmation;
- who or what performs shipping, customer notification, or catalogue removal;
- retry, timeout, cancellation, compensation, idempotency, or escalation policy;
- data contracts or integrations.

Those gaps must remain visible during transformation.
