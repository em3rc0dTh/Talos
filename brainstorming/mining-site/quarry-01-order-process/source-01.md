# Quarry 01 — Source 01 — Order Process Swimlane

## Source record

- Quarry: `quarry-01-order-process`
- Source ID: `source-01`
- Source type: image / swimlane business-process diagram
- Supplied by: user during TALOS working session
- Original image dimensions: `2048 × 971`
- Original image SHA-256: `100741f25704d1f311ab1d9f0d51b6aa65255ae2258387d9dd5a853471d20779`
- Native binary source: user-supplied PNG from the working session

> The repository record preserves the source identity and digest. The current GitHub connector can write UTF-8 repository content but does not expose a local-binary upload action, so the PNG itself is not silently reconstructed or substituted. A future ingestion path should attach the native source bytes under this quarry using the same digest.

## Visible source truth

The diagram is titled / framed as an `Order Process` and contains three swimlanes:

1. `Sales`
2. `Finance`
3. `Warehouse`

The visible flow is:

```text
Event
  ↓
Receive Order                     [Sales]
  ↓
Check Credit                      [Finance]
  ↓
Credit ok?
  ├── No  → Order Failed
  └── Yes → Fulfill Order         [Warehouse]
                  ↓
             Fulfilled ok?
              ├── No  → Order Failed
              └── Yes → Send invoice [Finance]
                              ↓
                         Order complete
```

## Explicit elements

### Start

- A green start event labeled `Event`.

### Activities

- `Receive Order` — Sales lane.
- `Check Credit` — Finance lane.
- `Fulfill Order` — Warehouse lane.
- `Send invoice` — Finance lane.

### Decisions

- `Credit ok?`
  - `Yes` continues to fulfillment.
  - `No` terminates at `Order Failed`.
- `Fulfilled ok?`
  - `Yes` continues to invoice.
  - `No` terminates at `Order Failed`.

### End states

- `Order Failed`.
- `Order complete`.

## Source limitations

The source does not explicitly state:

- what causes the start event;
- whether `Receive Order` is human, system, API, message or another process boundary;
- how credit is checked;
- what constitutes approved credit;
- how fulfillment occurs;
- what constitutes successful fulfillment;
- how the invoice is generated or delivered;
- retry, timeout, compensation or escalation behavior;
- data schemas;
- external systems or integrations;
- whether the lane names imply responsible humans, departments, systems, or a mix.

Those gaps must not be silently filled during source capture.
