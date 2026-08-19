# Quarry 01 — Foundry Source 01

## Status

`FOUNDRY-SOURCE-01` is the standardized semantic artifact emitted by `TRANSFORM-01`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled handoff from Mining Site to Foundry.

## Process identity

```text
process: Order Process
quarry: quarry-01-order-process
source: source-01
transform: transform-01
foundry-source: foundry-source-01
execution-readiness: NOT_READY
```

## Actors

```text
Sales
Finance
Warehouse
```

The source establishes lane ownership / placement but not whether these actors are people, departments, systems, or mixed responsibility boundaries.

## Trigger

```text
UNSPECIFIED_START_EVENT
```

Source origin: green event labeled `Event`.

Execution mapping remains unresolved.

## Canonical flow

```text
START
  ↓
RECEIVE_ORDER
owner: Sales
  ↓
CHECK_CREDIT
owner: Finance
  ↓
DECISION: CREDIT_APPROVED?
  ├── NO
  │     ↓
  │   COMPLETE
  │   status: FAILED
  │   reason: CREDIT_NOT_APPROVED
  │
  └── YES
        ↓
      FULFILL_ORDER
      owner: Warehouse
        ↓
      DECISION: FULFILLMENT_SUCCESSFUL?
        ├── NO
        │     ↓
        │   COMPLETE
        │   status: FAILED
        │   reason: FULFILLMENT_FAILED
        │
        └── YES
              ↓
            SEND_INVOICE
            owner: Finance
              ↓
            COMPLETE
            status: SUCCESS
```

## Canonical elements

### `RECEIVE_ORDER`

- source label: `Receive Order`
- source owner: `Sales`
- semantic type: business step
- execution mapping: unresolved

### `CHECK_CREDIT`

- source label: `Check Credit`
- source owner: `Finance`
- semantic type: business step
- execution mapping: unresolved

### `CREDIT_APPROVED?`

- source label: `Credit ok?`
- outcomes: `YES`, `NO`
- `NO` outcome maps to normalized terminal failure reason `CREDIT_NOT_APPROVED`

### `FULFILL_ORDER`

- source label: `Fulfill Order`
- source owner: `Warehouse`
- semantic type: business step
- execution mapping: unresolved

### `FULFILLMENT_SUCCESSFUL?`

- source label: `Fulfilled ok?`
- outcomes: `YES`, `NO`
- `NO` outcome maps to normalized terminal failure reason `FULFILLMENT_FAILED`

### `SEND_INVOICE`

- source label: `Send invoice`
- source owner: `Finance`
- semantic type: business step
- execution mapping: unresolved

## Terminal outcomes

```text
FAILED
├── CREDIT_NOT_APPROVED
└── FULFILLMENT_FAILED

SUCCESS
└── ORDER_COMPLETE
```

The normalized causes preserve branch-specific provenance even though the original diagram uses the same visible `Order Failed` end label for both paths.

## Foundry candidate map

The following is advisory input only:

```text
Possible Workflow:
OrderWorkflow

Possible Activities:
- checkCredit
- fulfillOrder
- sendInvoice

Unresolved:
- Receive Order mapping
- exact trigger
- human/system boundaries
- integrations
- retries / timeouts
- technical failure policy
- cancellation
- idempotency
- data contracts
```

## Foundry questions

The Foundry must answer these before producing an executable Temporal design:

1. What starts one order workflow instance?
2. What stable business identifier becomes the workflow identity / correlation key?
3. Is `Receive Order` the workflow boundary or work performed after workflow start?
4. Who or what executes `Check Credit`?
5. What data proves `CREDIT_APPROVED` or rejection?
6. Who or what executes `Fulfill Order`?
7. What data proves fulfillment success or failure?
8. How is the invoice produced and delivered?
9. Which failures are business outcomes versus technical failures?
10. What retry, timeout, cancellation and idempotency behavior is required?

## Handoff verdict

```text
SEMANTIC NORMALIZATION          ✅
SOURCE PROVENANCE               ✅
BUSINESS FLOW                   ✅
ACTOR OWNERSHIP                 ✅ SOURCE-LIMITED
DECISION PATHS                  ✅
TERMINAL OUTCOMES               ✅
UNCERTAINTY PRESERVED           ✅
TEMPORAL CANDIDATES             ✅ SUGGESTED
EXECUTION SEMANTICS             🟡 INCOMPLETE
TEMPORAL CODE                   ⛔ NOT AUTHORIZED / NOT NEEDED
```

This artifact is ready to be compared with later quarries. Only repeated, semantically stable patterns should graduate into the TALOS standard language.
