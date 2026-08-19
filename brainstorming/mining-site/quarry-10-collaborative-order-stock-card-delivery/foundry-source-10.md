# Quarry 10 — Foundry Source 10

## Status

`FOUNDRY-SOURCE-10` is the standardized semantic artifact emitted by `TRANSFORM-10`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled Mining Site handoff to the Foundry.

## Process identity

```text
process: Order / Stock / Card / Delivery Flow
quarry: quarry-10-collaborative-order-stock-card-delivery
source: source-10
transform: transform-10
foundry-source: foundry-source-10
artifact-class: COLLABORATIVE_WHITEBOARD_SCREENSHOT_WITH_PROCESS_GRAPH_AND_EDITOR_OVERLAYS
execution-readiness: NOT_READY
```

## Source planes

The Foundry Source deliberately carries two separate planes.

### A. Business graph plane

Eligible for process/execution reasoning.

### B. Source-presentation / collaboration plane

Preserved for provenance but excluded from business semantics unless independently confirmed.

Visible examples:

```text
Miro workspace chrome
board title: Launch process
collaborator/presence UI
cursor labels: Himali, Aharon, Anna, Bettany
toolbars / zoom / Share / Present
```

Foundry rule:

```text
DO NOT create actors, owners, Signals, Workflows or assignments from editor-presence overlays.
```

## Canonical business graph

```text
ENTRY_NODE
label: Order
semantic-type: UNRESOLVED
  ↓
RECEIVE_ORDER
  ↓
CHECK_STOCK
  ↓
STOCK_AVAILABLE?

  ├── NO
  │   source guard: Out of stock
  │     ↓
  │   CANCEL_ORDER
  │   normalized reason: OUT_OF_STOCK
  │     ↓
  │   completion: NOT_PROVEN
  │
  └── YES
      source guard: In stock
        ↓
      CHECK_CREDIT_CARD
        ↓
      CARD_VALID?

      ├── NO
      │   source guard: Invalid
      │     ↓
      │   CANCEL_ORDER
      │   normalized reason: CARD_INVALID
      │     ↓
      │   completion: NOT_PROVEN
      │
      └── YES
          source guard: Valid
            ↓
          PROCESS_CREDIT_CARD
            ↓
          DELIVER
            ↓
          RECEIVE_FINAL_VISIBLE_NODE
          label: Receive
          semantic-type: UNRESOLVED
            ↓
          completion: NOT_PROVEN
```

## Node inventory

```text
N10-01  Order                 style-family: yellow rounded rectangle
N10-02  Receive order         style-family: purple rounded rectangle
N10-03  Check stock           style-family: purple rounded rectangle
N10-04  In stock?             style-family: blue diamond
N10-05  Cancel order          style-family: purple rounded rectangle
N10-06  Check credit card     style-family: purple rounded rectangle
N10-07  Card valid?           style-family: blue diamond
N10-08  Process credit card   style-family: purple rounded rectangle
N10-09  Deliver               style-family: purple rounded rectangle
N10-10  Receive               style-family: yellow rounded rectangle
```

Style families are source presentation evidence, not canonical execution types.

## Decision semantics

### Stock decision

```text
question: In stock?
normalized condition: STOCK_AVAILABLE?

OUT_OF_STOCK → CANCEL_ORDER
IN_STOCK     → CHECK_CREDIT_CARD
```

### Card decision

```text
question: Card valid?
normalized condition: CARD_VALID?

INVALID → CANCEL_ORDER
VALID   → PROCESS_CREDIT_CARD
```

These are domain branches. They are not automatic technical exceptions.

## Shared cancellation semantics

Canonical shared handling:

```text
CANCEL_ORDER

origin-reason:
  OUT_OF_STOCK
  CARD_INVALID
```

The Foundry must preserve both:

```text
shared handling identity
+
path-specific cause
```

rather than reducing every cancellation to one opaque terminal result.

## Validation versus side effect

The source explicitly separates:

```text
CHECK_CREDIT_CARD
      ↓
CARD_VALID?
      ↓
PROCESS_CREDIT_CARD
```

Foundry implication:

```text
validation/eligibility work
      ≠
payment side effect
```

The exact technical boundary remains unresolved, but this distinction must survive execution design.

## External / physical work candidates

Execution type remains unresolved for:

```text
CHECK_STOCK
CHECK_CREDIT_CARD
PROCESS_CREDIT_CARD
CANCEL_ORDER
DELIVER
RECEIVE
```

Possible future boundaries may include:

- inventory service Activity;
- payment-provider validation/authorization Activity;
- payment/capture Activity;
- order-state mutation Activity;
- logistics/warehouse integration;
- human/physical delivery;
- external delivery acknowledgement via Signal/Update/event.

No option is promoted from `SUGGESTED` to `EXECUTABLE` by this quarry.

## Entry semantics

`Order` is the first visible business node, but the source does not prove its type.

Foundry candidates:

```text
external order submission that starts Workflow
business object input
business event
state/milestone
other source-specific node
```

Status:

```text
WORKFLOW_START_BOUNDARY: UNRESOLVED
```

## Completion semantics

### Cancellation path

```text
last-visible-node: CANCEL_ORDER
explicit-final-event: NONE
completion: NOT_PROVEN
```

### Successful path

```text
last-visible-node: Receive
explicit-final-event: NONE
completion: NOT_PROVEN
```

The Foundry must not invent `ORDER_CANCELLED_COMPLETE` or `ORDER_DELIVERED_COMPLETE` as source truth.

## Failure and compensation gap

The source stops describing failures once the card is considered valid.

Missing cases include:

```text
payment processing technical failure
payment decline during processing
stock race / reservation loss
logistics failure
delivery refusal / nonreceipt
post-payment cancellation
refund / release / compensation
```

Canonical gap record:

```text
POST_VALIDATION_FAILURE_TOPOLOGY: MISSING
COMPENSATION_REQUIREMENT: UNKNOWN
```

This gap is execution-significant but cannot be repaired by the Mining Site without new evidence.

## Temporal design candidate

Advisory only:

```text
OrderLifecycleWorkflow ?

start from order request ?
  ↓
receive order
  ↓
check stock
  ↓
stock available?
  ├── no
  │    ↓
  │  cancel order
  │  reason=OUT_OF_STOCK
  │
  └── yes
       ↓
     validate card
       ↓
     valid?
     ├── no
     │    ↓
     │  cancel order
     │  reason=CARD_INVALID
     │
     └── yes
          ↓
        process payment
          ↓
        deliver
          ↓
        receipt/acknowledgement ?
          ↓
        completion unresolved
```

Potential Temporal concepts later:

```text
Workflow            durable order lifecycle candidate
Activity            inventory/payment/logistics integrations where confirmed
Signal / Update     external delivery/receipt acknowledgement candidate
Query               order status visibility candidate
business result     cancellation reason / successful progression
compensation        only if confirmed business semantics require it
```

## Source-presentation rules carried into Foundry

```text
MIRO UI CHROME
      ≠
PROCESS NODE

COLLABORATOR NAME / CURSOR
      ≠
BUSINESS ACTOR

CURSOR NEAR ACTIVITY
      ≠
OWNER / ASSIGNEE

EDITORIAL POINTER / CURSOR TRIANGLE
      ≠
PROCESS EDGE

COLOR / SHAPE STYLE
      ≠
SEMANTIC TYPE WITHOUT LEGEND
```

## Critical process rules reinforced

```text
BUSINESS CONDITION
      ≠
TECHNICAL FAILURE

SHARED CANCELLATION NODE
      ≠
LOSS OF CANCELLATION REASON

CHECK / VALIDATE
      ≠
SIDE-EFFECT PROCESSING

LAST VISIBLE NODE
      ≠
EXPLICIT COMPLETION

MISSING POST-PAYMENT FAILURE PATH
      ≠
ASSUMED IMPOSSIBILITY OF FAILURE
```

## Foundry questions

Before executable Temporal design, resolve:

1. What exactly is the yellow `Order` node: event, object, external action, state or another notation element?
2. What starts one durable order lifecycle and what stable order identifier correlates it?
3. Who or what performs `Receive order`?
4. What inventory system/source of truth powers `Check stock`?
5. Is stock reserved after the check, and if so when/how?
6. What exact conditions map to `Out of stock` and `In stock`?
7. What does `Check credit card` actually validate?
8. Does card validity mean format validation, authorization eligibility, fraud check, provider verification, or something else?
9. What does `Process credit card` perform: authorize, capture, charge, settle, or another operation?
10. What are idempotency requirements for payment processing?
11. What business outcome follows payment decline/failure during `Process credit card`?
12. Is `Cancel order` a state transition, external API action, notification bundle, or subprocess?
13. Does cancellation require stock release or other compensation?
14. What does `Deliver` represent: warehouse action, carrier handoff, physical delivery, or logistics service?
15. What does the final yellow `Receive` mean and who/what performs it?
16. Is successful receipt asynchronous and externally reported?
17. What is the explicit cancellation terminal state?
18. What is the explicit successful terminal state?
19. What happens if delivery fails after payment succeeds?
20. Is refund/compensation required, and under which business rules?
21. What retry, timeout, cancellation and audit behavior applies once each execution boundary is confirmed?

## Handoff verdict

```text
SOURCE PROVENANCE                    ✅
NATIVE SOURCE BINARY                 🟡 REPOSITORY ATTACHMENT PENDING
ARTIFACT CLASS                       ✅
EDITOR / UI PLANE                    ✅ SEPARATED
COLLABORATOR OVERLAY                 ✅ SEPARATED
BUSINESS GRAPH                       ✅
STOCK DECISION                       ✅
CARD DECISION                        ✅
SHARED CANCELLATION                  ✅
CANCELLATION ORIGIN REASONS          ✅
VALIDATION VS SIDE EFFECT            ✅ SOURCE-SUPPORTED STRUCTURE
ENTRY TYPE                           🟡 UNRESOLVED
YELLOW NODE SEMANTICS                🟡 UNRESOLVED
CANCEL TERMINATION                   🟡 NOT PROVEN
SUCCESS TERMINATION                  🟡 NOT PROVEN
POST-PAYMENT FAILURE / COMPENSATION  🟡 SOURCE GAP
TEMPORAL CANDIDATES                  ✅ SUGGESTED
TEMPORAL CODE                        ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-10` is ready for comparison with later quarries. Its central contribution is that TALOS must filter collaborative-authoring context before assigning process semantics.