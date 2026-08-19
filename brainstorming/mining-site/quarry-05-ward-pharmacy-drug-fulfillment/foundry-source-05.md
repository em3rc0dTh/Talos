# Quarry 05 — Foundry Source 05

## Status

`FOUNDRY-SOURCE-05` is the standardized semantic artifact emitted by `TRANSFORM-05`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled Mining Site handoff to the Foundry.

## Process identity

```text
process: Ward / Pharmacy Drug Fulfillment Collaboration
quarry: quarry-05-ward-pharmacy-drug-fulfillment
source: source-05
transform: transform-05
foundry-source: foundry-source-05
execution-readiness: NOT_READY
```

## Participants

```text
PARTICIPANT-01  Ward
PARTICIPANT-02  Pharmacy
```

The source establishes participant boundaries and local sequence flow. It does not establish Temporal Workflow boundaries.

## Canonical collaboration

```text
WARD

DEMAND_FOR_DRUGS
  ↓
WARD_SEARCH_DRUGS
  ↓
WARD_IN_STOCK?
  ├── YES
  │     ↓
  │   WARD_RECEIVE_INTERNAL_ORDER_B
  │     ↓
  │   START_MEDICAL_TREATMENT
  │
  └── NO
        ↓
      WARD_MAKE_SEND_INTERNAL_ORDER
        ⇢ MSG_INTERNAL_ORDER_REQUEST


PHARMACY

MSG_INTERNAL_ORDER_REQUEST
        ⇢
PHARMACY_RECEIVE_INTERNAL_ORDER
  ↓
PHARMACY_CHECK_INTERNAL_ORDER
  ↓
PHARMACY_SEARCH_DRUGS
  ↓
PHARMACY_IN_STOCK?
  ├── YES
  │     ↓
  │   PHARMACY_DELIVER_DRUGS
  │     ⇢ MSG_DRUGS_DELIVERED
  │
  └── NO
        ↓
      PHARMACY_MAKE_SEND_PURCHASE_ORDER
        ↓
      PURCHASE_ORDER_PLACED
      local source end / milestone


WARD CONTINUATION AFTER PHARMACY DELIVERY

MSG_DRUGS_DELIVERED
        ⇢
WARD_RECEIVE_INTERNAL_ORDER_A
  ↓
WARD_RECEIVE_INTERNAL_ORDER_B
  ↓
START_MEDICAL_TREATMENT
```

## Canonical identity rule

The Ward visibly contains two distinct nodes with the same source label `receive internal order`.

They remain separate:

```text
WARD_RECEIVE_INTERNAL_ORDER_A
WARD_RECEIVE_INTERNAL_ORDER_B
```

Semantic difference: `UNRESOLVED`.

TALOS must preserve source-node identity independently of display text.

## Message boundaries

### `MSG_INTERNAL_ORDER_REQUEST`

Source evidence:

```text
Ward: make/send internal order
   ⇢
Pharmacy: receive internal order
```

Normalized type: cross-participant business message candidate.

Unknown:

- payload;
- correlation key;
- sender/receiver technology;
- delivery guarantees;
- acknowledgement semantics.

### `MSG_DRUGS_DELIVERED`

Source evidence:

```text
Pharmacy: deliver drugs
   ⇢
Ward: receive internal order [upper node]
```

Normalized type: cross-participant delivery/completion communication candidate.

Exact semantics remain unresolved because the receiving activity label does not explicitly say `receive drugs`.

## Repeated decision context

The source contains two different `in stock` gateways:

```text
WARD_IN_STOCK?
PHARMACY_IN_STOCK?
```

They must not be merged. They may share a generalized domain concept but have separate participant context, authority, data and provenance.

## Completion semantics

Visible outcomes / event labels:

```text
Ward     → start medical treatment
Pharmacy → Purchase order placed
```

The Pharmacy purchase-order branch does not visibly return to the Ward flow.

Therefore:

```text
PURCHASE_ORDER_PLACED
status: LOCAL_SOURCE_END_OR_MILESTONE
collaboration-complete: NOT_PROVEN
original-demand-resolved: NOT_PROVEN
```

This is a required Foundry gap, not something the transform should repair.

## Missing continuation

For the Pharmacy out-of-stock branch, the source does not show:

```text
external supplier
      ↓
wait for stock
      ↓
receive procured drugs
      ↓
resume delivery
      ↓
resume Ward demand
```

Any such continuation would be `SUGGESTED`, not source truth.

## Foundry candidate map

Two execution structures remain plausible.

### Candidate A — one durable collaboration workflow

```text
MedicationDemandWorkflow
├── Ward local availability
├── conditional Pharmacy handling
├── cross-participant fulfillment
└── treatment-ready outcome
```

### Candidate B — participant workflows connected by durable messages

```text
WardMedicationDemandWorkflow
      ⇢ InternalOrderRequest
PharmacyInternalOrderWorkflow
      ⇢ DrugsDelivered
WardMedicationDemandWorkflow resumes
```

Potential Temporal concepts later:

- Workflow start for demand/order creation;
- Activities for inventory checks, order creation, delivery or external calls when appropriate;
- Signal/Update/message-driven continuation between durable lifecycles;
- Child Workflow only if the Foundry intentionally models one participant as subordinate to another;
- durable wait/re-entry if external purchase ordering must later resume the same demand.

None is executable truth yet.

## Critical rules reinforced or introduced

```text
MESSAGE FLOW
      ≠
SEQUENCE FLOW

PARTICIPANT BOUNDARY
      ≠
AUTOMATIC TEMPORAL WORKFLOW BOUNDARY

PARTICIPANT-LOCAL END
      ≠
GLOBAL COLLABORATION COMPLETION

SAME DISPLAY LABEL
      ≠
SAME SOURCE NODE

SAME BUSINESS QUESTION
      ≠
SAME AUTHORITY / DATA CONTEXT

MISSING CONTINUATION
      ≠
IMPLICIT SUCCESS
```

## Foundry questions

Before executable Temporal design, resolve:

1. What stable identifier correlates one Ward demand with one Pharmacy internal order?
2. Are Ward and Pharmacy separate durable process instances or one orchestration boundary?
3. What exactly do the two Ward `receive internal order` nodes mean?
4. Which systems/people perform stock searches in Ward and Pharmacy?
5. What authoritative data determines each `in stock` decision?
6. What payload is sent when Ward creates the internal order?
7. What event/evidence proves Pharmacy delivery?
8. Does `deliver drugs` represent physical work, system work, or both?
9. What exactly does the upper Ward `receive internal order` observe after Pharmacy delivery?
10. What does the lower Ward `receive internal order` represent on both incoming paths?
11. Is `Purchase order placed` a terminal result for the Pharmacy process, a milestone, or a handoff to an omitted supplier process?
12. If external procurement succeeds later, how does the original demand resume?
13. Is a durable wait required for external supply, and what timeout/escalation policy applies?
14. Which business outcomes are distinct from technical failures?
15. What retry, idempotency, cancellation, compensation and audit requirements apply?

## Handoff verdict

```text
SEMANTIC NORMALIZATION              ✅
SOURCE PROVENANCE                   ✅
PARTICIPANT LOCAL FLOWS             ✅
MESSAGE BOUNDARIES                  ✅ SOURCE-LIMITED
NODE IDENTITY VS LABEL              ✅
REPEATED DECISION CONTEXT           ✅
LOCAL VS GLOBAL COMPLETION          ✅
CORRELATION SEMANTICS               🟡 MISSING
EXTERNAL PROCUREMENT CONTINUATION   🟡 MISSING
TEMPORAL CANDIDATES                 ✅ SUGGESTED
EXECUTION SEMANTICS                 🟡 INCOMPLETE
TEMPORAL CODE                       ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-05` is ready for comparison with later quarries.