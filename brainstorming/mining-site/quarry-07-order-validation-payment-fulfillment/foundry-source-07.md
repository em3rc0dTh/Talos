# Quarry 07 — Foundry Source 07

## Status

`FOUNDRY-SOURCE-07` is the standardized semantic artifact emitted by `TRANSFORM-07`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled Mining Site handoff to the Foundry.

## Process identity

```text
process: Order Validation, Payment & Fulfillment
quarry: quarry-07-order-validation-payment-fulfillment
source: source-07
transform: transform-07
foundry-source: foundry-source-07
artifact-class: ACTIVITY_PROCESS_WITH_PARTITIONS_OBJECTS_AND_CONCURRENCY
execution-readiness: NOT_READY
```

## Responsibility partitions

```text
ROLE-01  Customer
ROLE-02  Sales assistant
ROLE-03  Stockroom personnel
```

These are source responsibility partitions. They do not imply Temporal Worker or Task Queue topology.

## Canonical flow

```text
START
  ↓
REQUEST_SERVICE
owner: Customer
workflow-boundary: UNRESOLVED
  ↓
ORDER_STATE_EVIDENCE
object: Order
state: NEW
  ↓
VALIDATE_ORDER
owner: Sales assistant
  ↓
ORDER_VALID?

  ├── NO
  │     source guard: [Order rejected]
  │     ↓
  │   COMPLETE
  │   outcome: REJECTED
  │   source-termination: EXPLICIT
  │
  └── YES
        source guard: [Order correct]
        ↓
      PARALLEL_SPLIT-01

        ├── PAYMENT_BRANCH
        │     ↓
        │   PAY
        │   owner: Customer
        │   execution-type: UNRESOLVED
        │
        └── FULFILLMENT_BRANCH
              ↓
            ORDER_STATE_EVIDENCE
            object: Order
            state: PLACED
              ↓
            FILL_ORDER
            owner: Stockroom personnel
            execution-type: UNRESOLVED

      PARALLEL_JOIN-01
      policy: ALL_VISIBLE_BRANCHES
      waits-for:
      - PAYMENT_BRANCH
      - FULFILLMENT_BRANCH
        ↓
      DELIVER_ORDER
      owner: Sales assistant
        ↓
      SOURCE_CONTINUATION: NOT_SHOWN
```

## Business object evidence

Canonical business object candidate:

```text
ORDER
```

Explicit observed source states:

```text
NEW
PLACED
```

Truth discipline:

```text
Order [New]     = SOURCE_TRUTH
Order [Placed]  = SOURCE_TRUTH

ORDER state machine
NEW → PLACED    = plausible normalization relationship
complete lifecycle beyond these states = NOT_PROVEN
```

The Foundry must decide where authoritative order state lives and how any Workflow state relates to external persistence.

## Edge semantics

The source supports at least two edge families:

```text
CONTROL_FLOW
OBJECT_OR_DATA_FLOW
```

Exact imported-notation metadata is unavailable.

Foundry instruction:

```text
DO NOT flatten object/data flow into control flow.
DO NOT treat Order state nodes as executable Activities.
```

## Decision semantics

### `ORDER_VALID?`

Source guards:

```text
[Order rejected]
[Order correct]
```

Normalized domain outcomes:

```text
REJECTED
ACCEPTED_FOR_PROCESSING
```

`REJECTED` is a normal business outcome, not a technical failure.

## Parallel region

### Split

```text
PARALLEL_SPLIT-01
  ├── PAYMENT_BRANCH
  └── FULFILLMENT_BRANCH
```

The source strongly supports that both visible branches become active after the correct-order path.

### Join

```text
PARALLEL_JOIN-01
join-policy: ALL_VISIBLE_BRANCHES
```

Required branch completion predicates:

```text
PAYMENT_BRANCH_COMPLETE
FULFILLMENT_BRANCH_COMPLETE
```

Only after both are satisfied does the source continue to `DELIVER_ORDER`.

This is synchronization, not ordinary branch convergence.

## Candidate branch semantics

### Payment branch

```text
PAY
owner: Customer
```

Potential Foundry execution forms:

- external customer interaction + durable wait;
- payment-provider Activity plus callback/Signal/Update;
- human task;
- other confirmed integration.

The source does not choose among them.

### Fulfillment branch

```text
FILL_ORDER
owner: Stockroom personnel
```

Potential Foundry execution forms:

- physical human work with completion acknowledgement;
- warehouse-system Activity;
- subprocess / Child Workflow;
- mixed human/system operation.

The source does not choose among them.

## Successful completion gap

The source contains an explicit final-like node for rejection but no explicit final node after `DELIVER_ORDER`.

Therefore:

```text
REJECTED_PATH_COMPLETION
proof: EXPLICIT

SUCCESS_PATH_COMPLETION
proof: INCOMPLETE
last-visible-activity: DELIVER_ORDER
```

The Foundry must not invent a global `ORDER_COMPLETE` event unless later evidence confirms it.

## Temporal design candidate

Advisory only:

```text
OrderFulfillmentWorkflow

start / receive order request
  ↓
validate order
  ↓
validation result
  ├── rejected → return/complete REJECTED
  └── accepted
        ↓
      run/wait concurrently
      ├── payment lifecycle
      └── fulfillment lifecycle
        ↓
      synchronize ALL
        ↓
      deliver order
        ↓
      completion definition unresolved
```

Potential Temporal concepts later:

```text
Workflow               order lifecycle candidate
Activity                validation/external system work where confirmed
Signal / Update         async payment/human completion candidate
Child Workflow          fulfillment candidate only if boundary is intentional
parallel execution      payment + fulfillment
ALL join                durable synchronization before delivery
Query                    order state/status visibility candidate
```

None of these mappings is executable truth yet.

## Critical rules introduced/reinforced

```text
OBJECT / DATA FLOW
      ≠
CONTROL FLOW

OBJECT STATE NODE
      ≠
TEMPORAL ACTIVITY

OBSERVED OBJECT STATES
      ≠
COMPLETE STATE MACHINE

PARALLEL SPLIT
      ≠
EXCLUSIVE BRANCH

JOIN / SYNCHRONIZATION
      ≠
MERGE / CONVERGENCE

PARALLEL BRANCH
      ≠
SAME EXECUTOR

BRANCH COMPLETION
      ≠
TECHNICAL ACTIVITY SUCCESS UNTIL EXECUTION TYPE IS KNOWN

LAST VISIBLE ACTIVITY
      ≠
EXPLICIT PROCESS COMPLETION
```

## Foundry questions

Before executable Temporal design, resolve:

1. What external event/request creates the order lifecycle?
2. Is `Request service` outside the Workflow boundary or inside it?
3. What stable order identifier becomes the correlation / Workflow identity candidate?
4. What system/person validates the order?
5. What exact rule produces `[Order correct]` versus `[Order rejected]`?
6. What authoritative store owns Order state?
7. What event/mutation changes `Order [New]` into `Order [Placed]`?
8. Is placing the order logically before the parallel split, part of fulfillment, or only object-state evidence in the source notation?
9. What constitutes successful completion of `Pay`?
10. Can payment be declined/cancelled/time out, and what business path follows?
11. What constitutes successful completion of `Fill order`?
12. Can fulfillment fail, become unavailable, or require replenishment?
13. If one branch fails/cancels, what happens to the other concurrent branch?
14. Is compensation required, such as refund or order release?
15. Does the synchronization truly require both branches in every accepted-order case?
16. What event/evidence makes `Deliver order` executable/observable?
17. Is delivery physical work, an external logistics integration, or both?
18. What source evidence defines successful process completion after delivery?
19. What retry, timeout, cancellation, idempotency and audit rules apply to each resolved execution boundary?

## Handoff verdict

```text
SOURCE PROVENANCE                   ✅
ARTIFACT CLASS                      ✅
RESPONSIBILITY PARTITIONS           ✅
ORDER OBJECT / STATE EVIDENCE       ✅
OBJECT VS CONTROL FLOW              ✅ SOURCE-LIMITED
VALIDATION DECISION                 ✅
REJECTED TERMINAL OUTCOME           ✅ EXPLICIT
PARALLEL SPLIT                      ✅ STRONG SOURCE EVIDENCE
PARALLEL JOIN                       ✅ STRONG SOURCE EVIDENCE
JOIN POLICY                         ✅ ALL_VISIBLE_BRANCHES INFERRED
BRANCH COMPLETION PREDICATES        ✅
SUCCESS COMPLETION                  🟡 SOURCE GAP
EXECUTION TYPES                     🟡 UNRESOLVED
TEMPORAL CANDIDATES                 ✅ SUGGESTED
TEMPORAL CODE                       ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-07` is ready for comparison with later quarries.