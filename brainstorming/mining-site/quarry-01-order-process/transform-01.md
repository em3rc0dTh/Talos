# Quarry 01 — Transform 01

## Objective

Interpret `source-01` without replacing its origin, normalize the visible business semantics into TALOS concepts, expose uncertainty, and produce the handoff material required for `foundry-source-01`.

No executable code is produced in this transform.

## 1. Source reading

The source depicts a sequential order process crossing Sales, Finance, and Warehouse. It contains two explicit decision points and two terminal business outcomes.

```text
START
  ↓
Receive Order
  ↓
Check Credit
  ↓
Credit OK?
  ├── NO  → FAILED
  └── YES → Fulfill Order
                  ↓
             Fulfilled OK?
              ├── NO  → FAILED
              └── YES → Send Invoice
                              ↓
                           SUCCESS
```

## 2. Actor extraction

```text
ACTOR-01  Sales
ACTOR-02  Finance
ACTOR-03  Warehouse
```

Truth state: `SOURCE_TRUTH`.

The source proves the lane names and placement of activities. It does not prove whether the actors are people, departments, systems, or mixed responsibility boundaries.

## 3. Trigger interpretation

The diagram contains a start event labeled `Event` before `Receive Order`.

- `SOURCE_TRUTH`: a start event exists.
- `INFERRED`: the process likely begins because an order has arrived or is ready to be received.
- `UNRESOLVED`: the actual trigger mechanism is not stated.

Possible future execution mappings include a workflow start request, an external message/event, a human interaction, or an Activity. None is confirmed by the source.

## 4. Operational step extraction

```text
STEP-01
name: Receive Order
owner: Sales
truth: SOURCE_TRUTH

STEP-02
name: Check Credit
owner: Finance
truth: SOURCE_TRUTH

STEP-03
name: Fulfill Order
owner: Warehouse
truth: SOURCE_TRUTH

STEP-04
name: Send Invoice
owner: Finance
truth: SOURCE_TRUTH
```

## 5. Decision extraction

### DECISION-01 — Credit approved?

Source label: `Credit ok?`

```text
YES → continue to Fulfill Order
NO  → terminate at Order Failed
```

### DECISION-02 — Fulfillment successful?

Source label: `Fulfilled ok?`

```text
YES → continue to Send Invoice
NO  → terminate at Order Failed
```

Both decision structures are `SOURCE_TRUTH`.

## 6. Outcome normalization

The source contains one visible failure label, `Order Failed`, reachable from two different branches.

TALOS may normalize the shared terminal status while preserving distinct causal provenance:

```text
ORDER_FAILED
├── cause: CREDIT_NOT_APPROVED
└── cause: FULFILLMENT_FAILED
```

The shared `FAILED` status is a normalization of the explicit source outcome. The two cause labels are semantic normalizations derived from the specific source branches; they must retain links back to their originating decisions.

The success path normalizes to:

```text
ORDER_COMPLETE
```

from the explicit source label `Order complete`.

## 7. Integration discipline

No external integration is explicitly visible in the source.

Therefore the transform must not claim:

```text
Check Credit  → credit bureau API
Fulfill Order → warehouse API / ERP
Send Invoice  → Gmail / accounting platform / PDF service
```

Those may later become Foundry suggestions, but they are not source truth.

## 8. Candidate Temporal interpretation

This quarry is being used to learn the mapping between canonical business semantics and Temporal-compatible execution semantics. The following is a candidate handoff, not code and not executable truth.

### Candidate workflow boundary

```text
OrderWorkflow
```

One durable workflow for the lifecycle of one order is a plausible interpretation.

Truth state: `SUGGESTED`.

### Candidate Activity boundaries

```text
checkCredit
fulfillOrder
sendInvoice
```

These are plausible Activities because they represent business operations that may involve side effects, external systems, or work outside deterministic workflow logic.

Truth state: `SUGGESTED`.

### Receive Order ambiguity

`Receive Order` must remain unresolved for execution design.

Possible mappings:

1. workflow trigger / input;
2. Activity;
3. external message or signal;
4. human interaction.

The source does not distinguish them.

### Decisions

The `Credit ok?` and `Fulfilled ok?` gateways map cleanly to deterministic workflow branching once their input facts are known. The source does not yet specify where those facts come from.

## 9. Missing execution semantics

Before this process can become executable, Foundry work must resolve at least:

- exact workflow trigger;
- input / output data contract;
- whether each business step is human or system work;
- integration capability for each side-effecting step;
- credit decision authority and result contract;
- fulfillment result contract;
- retry and timeout policies;
- whether business failure differs from technical failure;
- cancellation behavior;
- idempotency / duplicate-order handling;
- observability and correlation identity.

## 10. Transform result

```text
SOURCE CAPTURE                 ✅
SOURCE INTERPRETATION          ✅
ACTORS                         ✅
BUSINESS STEPS                 ✅
DECISIONS                      ✅
SUCCESS / FAILURE              ✅
UNCERTAINTIES                  ✅
NORMALIZATION                  ✅
FOUNDRY HANDOFF READY          ✅

TEMPORAL CONCEPTUAL MAPPING    ✅ CANDIDATE ONLY
TEMPORAL CODE                  ⛔ NOT NEEDED
EXECUTION READY                ⛔ NO
```
