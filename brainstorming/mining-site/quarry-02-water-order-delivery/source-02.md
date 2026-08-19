# Quarry 02 — Source 02 — Aqua Distilled Water Order & Delivery

## Source record

- Quarry: `quarry-02-water-order-delivery`
- Source ID: `source-02`
- Source type: image / BPMN-style collaboration + swimlane process diagram
- Native source: `source-02.png`
- Image dimensions: `791 × 451`
- SHA-256: `6b57667aeee62a7fe47d79a4533787f5922d59e5f52dedede2751e910df755ee`
- Supplied by: user during TALOS Mining Site session

## Visible source truth

The source shows two participants:

1. `Customer`
2. `The Aqua Distilled Water Company`

The company participant contains three lanes / responsibility areas:

- `Customer Service Assistant`
- `Manager`
- `Worker`

The visible process is:

```text
CUSTOMER
START
  ↓
Place Order
  ↓ message boundary

COMPANY
Verify Customer Identity
  ↓
Customer Exist?
  ├── No  → Create Customer Account ─┐
  └── Yes ────────────────────────────┤
                                     ↓
                             On Next Wednesday
                                     ↓
                                Forward Order
                                     ↓
                               Arrange Delivery
                                     ↓
                                 Deliver Water
                                     ↓
                                    END
```

## Explicit source annotation

The source states:

> Over 90% of requests are made by phone call, 10% by email.

This statement is preserved as-is. TALOS does not silently reconcile the approximate percentages.

## Explicit business/data artifacts

The diagram contains the following labeled Purchase Order artifacts:

- `Purchase Order [Create]`
- `Purchase Order [To be Assigned]`
- `Purchase Order [To be Delivered]`
- `Purchase Order [Completed]`

## Explicit special semantics

- A cross-participant message interaction connects `Place Order` to `Verify Customer Identity`.
- `Customer Exist?` is an exclusive decision with `Yes` / `No` branches.
- `On Next Wednesday` is an explicit time-based intermediate event.
- `Arrange Delivery` is shown as a collapsed subprocess.
- `Deliver Water` is placed in the Worker lane.

## Source limitations

The source does not explicitly establish:

- how phone/email intake is implemented;
- whether the company process begins directly from the customer message or after another intake step;
- whether identity verification is human, automated, or mixed;
- the customer existence rule;
- the exact Wednesday time, timezone, business calendar, or holiday policy;
- who receives the forwarded order or by what mechanism;
- the internal steps of `Arrange Delivery`;
- how physical delivery is observed digitally;
- whether the Purchase Order artifacts are one object changing state or separate documents;
- retry, timeout, cancellation, compensation, escalation, or idempotency rules;
- implementation systems or integrations.

Those gaps must remain unresolved during source capture.
