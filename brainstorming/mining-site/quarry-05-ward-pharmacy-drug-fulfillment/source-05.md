# Quarry 05 — Source 05 — Ward / Pharmacy Drug Fulfillment Collaboration

## Source record

- Quarry: `quarry-05-ward-pharmacy-drug-fulfillment`
- Source ID: `source-05`
- Source type: image / BPMN-style collaboration with two participants
- Supplied by: user during TALOS Mining Site working session
- Original image dimensions: `1280 × 768`
- Original image size: `99,875 bytes`
- Original image SHA-256: `d9e2a2c8d6ab705db679dd8e6de9a192209c65e2d382ece81d6ef5422c8d3127`
- Native binary source: user-supplied `quarry-05.jpg` in the working session; repository binary attachment pending

> This source record preserves the exact image identity and digest. The semantic documents must not substitute a recreated diagram for the original source.

## Visible source truth

The diagram contains two separate participant areas:

```text
Pharmacy
Ward
```

Each participant has its own solid sequence flow. Dashed cross-participant flows connect Ward to Pharmacy and Pharmacy back to Ward.

### Ward flow

The visible Ward process begins at an arrow-marked event labeled `demand for drugs`:

```text
demand for drugs
  ↓
search drugs
  ↓
in stock?
  ├── yes → receive internal order [lower Ward activity]
  │           ↓
  │        start medical treatment
  │
  └── no  → make/send internal order
                ⇢ dashed cross-participant flow to Pharmacy
```

The Ward also contains another activity with the exact same visible label `receive internal order` above the lower one. It is reached by the dashed flow from Pharmacy `deliver drugs`, then continues by solid sequence flow into the lower `receive internal order` activity.

Therefore the source visibly contains **two distinct Ward nodes with the same label**.

### Pharmacy flow

The Pharmacy process receives the dashed flow from Ward at `receive internal order` and continues:

```text
receive internal order
  ↓
check internal order
  ↓
search drugs
  ↓
in stock?
  ├── yes → deliver drugs
  │            ⇢ dashed cross-participant flow to Ward
  │
  └── no  → make/send purchase order
                 ↓
              Purchase order placed
```

### Cross-participant flows

Two dashed flows are explicitly visible:

```text
Ward: make/send internal order
    ⇢ Pharmacy: receive internal order

Pharmacy: deliver drugs
    ⇢ Ward: receive internal order [upper Ward node]
```

The dashed style and participant crossing are source truth. The exact message payload, transport, correlation identifier and delivery guarantees are not visible.

### Decision points

Two separate `in stock` gateways are visible:

- one in Ward;
- one in Pharmacy.

Both have `yes` and `no` branches, but they belong to different participant contexts and must not be collapsed merely because their labels match.

### Visible terminal / event labels

- Pharmacy: `Purchase order placed`.
- Ward: `start medical treatment`.

Both use arrow-marked circular event symbols in the rendered source. The exact BPMN event class is not asserted from the image alone.

## Source limitations

The source does not explicitly establish:

- the exact BPMN event class of `demand for drugs`, `Purchase order placed`, or `start medical treatment`;
- whether the two participant processes are independent process instances, one collaboration instance, or views of a larger process;
- the identity / correlation key shared between Ward and Pharmacy;
- the exact payload sent in the internal-order message;
- the exact payload or evidence sent when drugs are delivered;
- why the Ward contains two consecutive/distinct nodes both labeled `receive internal order`;
- whether either duplicate label is a modeling error, shorthand, or intentionally different operation;
- how stock is searched or proven in either participant;
- who or what performs any activity;
- what happens after Pharmacy places an external purchase order;
- how the original Ward demand resumes after the Pharmacy out-of-stock branch;
- whether an external supplier exists as an omitted participant;
- retries, timeouts, cancellation, compensation, escalation, data contracts, service-level rules, or technical integrations.

Those gaps must remain visible during transformation.