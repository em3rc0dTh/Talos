# Quarry 03 — Foundry Source 03

## Status

`FOUNDRY-SOURCE-03` is the standardized semantic artifact emitted by `TRANSFORM-03`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled handoff from Mining Site to Foundry.

## Process identity

```text
process: Availability / Procurement / Settlement
quarry: quarry-03-availability-procurement-settlement
source: source-03
transform: transform-03
foundry-source: foundry-source-03
execution-readiness: NOT_READY
```

## Trigger

```text
ORDER_RECEIVED
```

Source origin: message-style start event labeled `Order Received`.

Execution start mechanism remains unresolved.

## Canonical flow

```text
START
  ↓
ORDER_RECEIVED
  ↓
CHECK_AVAILABILITY
  ↓
DECISION: ARTICLE_AVAILABLE?

  ├── YES
  │     ↓
  │   MERGE_TO_SHIPPING
  │
  └── NO
        ↓
      PROCUREMENT
      type: SUBPROCESS
      internal_definition: NOT_VISIBLE_IN_SOURCE

        ├── NORMAL
        │     ↓
        │   MERGE_TO_SHIPPING
        │
        ├── UNDELIVERABLE
        │     ↓
        │   INFORM_CUSTOMER
        │     ↓
        │   REMOVE_ARTICLE_FROM_CATALOGUE
        │     ↓
        │   COMPLETE
        │   outcome: ARTICLE_REMOVED
        │
        └── LATE_DELIVERY
              ↓
            INFORM_CUSTOMER
              ↓
            COMPLETE
            outcome: CUSTOMER_INFORMED

MERGE_TO_SHIPPING
  ↓
SHIP_ARTICLE
  ↓
FINANCIAL_SETTLEMENT
  type: SUBPROCESS
  internal_definition: NOT_VISIBLE_IN_SOURCE
  ↓
COMPLETE
outcome: PAYMENT_RECEIVED
```

## Canonical elements

### `ORDER_RECEIVED`

- source label: `Order Received`
- source symbol: message-style start event
- semantic type: process trigger / incoming business event
- execution mapping: unresolved

### `CHECK_AVAILABILITY`

- source label: `Check Availability`
- semantic type: business step
- execution mapping: unresolved

### `ARTICLE_AVAILABLE?`

- source label: `Article Available`
- outcomes: `YES`, `NO`
- `YES` proceeds toward shipping
- `NO` enters Procurement

### `PROCUREMENT`

- source label: `Procurement`
- semantic type: collapsed subprocess
- internal definition: not visible
- normal completion: converges on `SHIP_ARTICLE`
- attached exceptional events: `Undeliverable`, `Late Delivery`

### `UNDELIVERABLE`

- source label: `Undeliverable`
- source placement: boundary of Procurement
- source icon: error/lightning-like
- normalized semantic type: domain exception candidate
- exact BPMN class / interruption behavior: unresolved pending source-definition verification

### `LATE_DELIVERY`

- source label: `Late Delivery`
- source placement: boundary of Procurement
- source icon: escalation/triangle-like
- normalized semantic type: domain escalation / deadline-event candidate
- exact BPMN class / interruption behavior: unresolved pending source-definition verification

### `SHIP_ARTICLE`

- source label: `Ship Article`
- semantic type: business step
- physical/system/human mapping: unresolved

### `FINANCIAL_SETTLEMENT`

- source label: `Financial Settlement`
- semantic type: collapsed subprocess
- internal definition: not visible

## Terminal outcomes

```text
PAYMENT_RECEIVED
CUSTOMER_INFORMED
ARTICLE_REMOVED
```

These are distinct business outcomes from the source. None should be converted automatically into a Temporal technical failure.

## Foundry candidate map

The following is advisory input only:

```text
Possible Workflow:
OrderFulfillmentWorkflow

Possible Activities / external work boundaries:
- checkAvailability
- shipArticle
- informCustomer
- removeArticleFromCatalogue

Possible Child Workflow candidates:
- Procurement
- FinancialSettlement

Possible asynchronous/event candidates:
- ORDER_RECEIVED as workflow start input
- LATE_DELIVERY as domain event / timer / signal-like condition
- PAYMENT_RECEIVED as settlement result or external event
```

The exact mapping must be designed, not guessed.

## Critical Foundry rule exposed by this quarry

```text
BUSINESS EXCEPTION
      ≠
TECHNICAL FAILURE
```

If Procurement returns `UNDELIVERABLE`, that may be correct business behavior and should not necessarily cause Activity retries or a failed Workflow.

The Foundry must first classify each condition as one of:

```text
DOMAIN_RESULT
DOMAIN_EVENT
BUSINESS_TERMINAL_OUTCOME
TECHNICAL_FAILURE
CANCELLATION
TIMEOUT / DEADLINE
```

before selecting Temporal failure, retry, timer, signal, result, or branching semantics.

## Foundry questions

Before producing an executable Temporal design, the Foundry must answer:

1. What stable order identifier becomes Workflow identity / correlation key?
2. What exactly starts one process instance when `Order Received` occurs?
3. Who or what performs `Check Availability`?
4. What evidence determines `ARTICLE_AVAILABLE`?
5. Should `Procurement` be a Child Workflow, Activity boundary, or another orchestration model?
6. What are the authoritative definitions of `Undeliverable` and `Late Delivery`?
7. Are the two Procurement boundary events interrupting or non-interrupting?
8. Can late delivery coexist with continued procurement, or does it terminate that procurement path?
9. What technical evidence proves Procurement normal completion?
10. Who or what performs `Ship Article` and how is completion observed?
11. Should `Financial Settlement` be a Child Workflow or another boundary?
12. Is `Payment Received` an internal settlement result or an asynchronous external event?
13. Which conditions are business outcomes versus retryable/non-retryable technical failures?
14. What retry, timeout, cancellation, idempotency and compensation behavior is required?

## Handoff verdict

```text
SEMANTIC NORMALIZATION             ✅
SOURCE PROVENANCE                  ✅
MESSAGE TRIGGER                    ✅ SOURCE-LIMITED
DECISION PATHS                     ✅
SUBPROCESS BOUNDARIES              ✅
BOUNDARY EVENT PATHS               ✅ SOURCE-LIMITED
BUSINESS EXCEPTION DISTINCTION     ✅
MULTIPLE TERMINAL OUTCOMES         ✅
TEMPORAL CANDIDATES                ✅ SUGGESTED
EXECUTION SEMANTICS                🟡 INCOMPLETE
TEMPORAL CODE                      ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-03` is ready for comparison with later quarries and for eventual Foundry execution design after the missing semantics are resolved.
