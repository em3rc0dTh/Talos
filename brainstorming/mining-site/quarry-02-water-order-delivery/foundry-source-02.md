# Quarry 02 — Foundry Source 02

## Status

`FOUNDRY-SOURCE-02` is the standardized semantic handoff emitted by `TRANSFORM-02`.

It is not Temporal code, not a deployment plan, and not executable truth.

## Process identity

```text
process: Aqua Distilled Water Order & Delivery
quarry: quarry-02-water-order-delivery
source: source-02
transform: transform-02
foundry-source: foundry-source-02
execution-readiness: NOT_READY
```

## Participants and roles

```text
EXTERNAL PARTICIPANT
Customer

INTERNAL PARTICIPANT
The Aqua Distilled Water Company

ROLES / LANES
- Customer Service Assistant
- Manager
- Worker
```

## Source channels

```text
PHONE  >90%
EMAIL  10%
```

These are source observations, not implementation contracts.

## Canonical flow

```text
CUSTOMER

START
  ↓
PLACE_ORDER
  ↓
MESSAGE / ORDER_REQUEST
  ↓

COMPANY PROCESS

VERIFY_CUSTOMER_IDENTITY
owner: Customer Service Assistant
  ↓
CUSTOMER_EXISTS?
  ├── NO
  │     ↓
  │   CREATE_CUSTOMER_ACCOUNT
  │   owner: Customer Service Assistant
  │     ↓
  └── YES
        ↓
      EXCLUSIVE_MERGE
        ↓
      WAIT_UNTIL
      business expression: NEXT_WEDNESDAY
        ↓
      FORWARD_ORDER
      owner: Customer Service Assistant
        ↓
      ARRANGE_DELIVERY
      type: SUBPROCESS
      owner: Manager
      internal definition: UNKNOWN / COLLAPSED IN SOURCE
        ↓
      DELIVER_WATER
      owner: Worker
        ↓
      COMPLETE
```

## Business-object evidence

Explicit source artifacts:

```text
Purchase Order [Create]
Purchase Order [To be Assigned]
Purchase Order [To be Delivered]
Purchase Order [Completed]
```

Candidate normalized lifecycle:

```text
PurchaseOrder
CREATED
  ↓
TO_BE_ASSIGNED
  ↓
TO_BE_DELIVERED
  ↓
COMPLETED
```

Classification: `INFERRED`. The source does not prove that these are states of one object.

## Foundry candidate map

Advisory only:

```text
Possible Workflow:
WaterOrderWorkflow

Candidate execution concepts:
- customer message may initiate or correlate the company workflow
- Verify Customer Identity may become an Activity, Human Interaction, or mixed capability
- Create Customer Account may become an Activity or human/system interaction
- On Next Wednesday is a strong durable Timer / wait candidate
- Arrange Delivery preserves a subprocess boundary; Child Workflow is only one possible mapping
- Deliver Water is physical human work and requires a completion-observation mechanism before it can be executable
```

## Foundry questions

Before producing an executable Temporal design, the Foundry must answer at least:

1. What exact event starts one company order workflow instance?
2. What stable business identifier correlates the order request and later work?
3. How are phone and email requests normalized into one intake contract?
4. Who or what verifies customer identity?
5. What determines whether the customer exists?
6. Who or what creates the customer account?
7. What exact instant does `Next Wednesday` mean, in which timezone and calendar?
8. What does `Forward Order` change and who/what receives it?
9. What happens inside `Arrange Delivery`?
10. Should `Arrange Delivery` be local workflow logic, a Child Workflow, a human process, or an external capability?
11. How is physical delivery assigned, observed, confirmed, failed, or cancelled?
12. Are the Purchase Order artifacts states of one persisted object?
13. Which business outcomes differ from technical failures?
14. What retry, timeout, cancellation, escalation, compensation, and idempotency behavior is required?

## Handoff verdict

```text
SEMANTIC NORMALIZATION          ✅
SOURCE PROVENANCE               ✅
PARTICIPANT BOUNDARIES          ✅
ROLE OWNERSHIP                  ✅ SOURCE-LIMITED
MESSAGE BOUNDARY                ✅
DECISION / MERGE                ✅
DURABLE WAIT CANDIDATE          ✅
SUBPROCESS BOUNDARY             ✅
PHYSICAL WORK BOUNDARY          ✅
BUSINESS-OBJECT EVIDENCE        ✅
UNCERTAINTY PRESERVED           ✅
TEMPORAL CANDIDATES             ✅ SUGGESTED
EXECUTION SEMANTICS             🟡 INCOMPLETE
TEMPORAL CODE                   ⛔ NOT AUTHORIZED / NOT NEEDED
```

## Mining Site lesson

Quarry 02 strengthens a key TALOS rule:

> A business-process node is not automatically a Temporal Activity.

A source node may instead represent an external action, message boundary, business decision, durable wait, subprocess, physical human work, business-object transition, or an actual executable Activity. The Foundry must resolve that distinction explicitly.
