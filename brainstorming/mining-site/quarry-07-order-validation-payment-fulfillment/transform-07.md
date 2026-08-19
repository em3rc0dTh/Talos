# Quarry 07 — Transform 07

## Objective

Interpret `source-07` without flattening its UML activity-style semantics, normalize the visible responsibilities, object-state evidence, exclusive decision and fork/join concurrency into TALOS concepts, compare the evidence against Quarries 01–06, and prepare `foundry-source-07`.

No executable code is produced here.

## 1. Artifact classification

Quarry 07 is workflow-like and materially different from Quarry 06's reference architecture.

Canonical artifact class:

```text
ARTIFACT_CLASS
ACTIVITY_PROCESS_WITH_PARTITIONS_OBJECTS_AND_CONCURRENCY
```

The source appears UML activity-style, but the image does not provide a notation legend or source-model metadata. Therefore TALOS preserves `UML activity-style` as a source-aware classification rather than claiming formal model conformance.

## 2. Responsibility partitions

Visible partitions:

```text
PARTITION-01  Customer
PARTITION-02  Sales assistant
PARTITION-03  Stockroom personnel
```

This reinforces the Q01/Q02 evidence for ownership context, but Q06 already warned that containers need semantic typing before automatic interpretation.

Here, because the labels are people/roles and activities are visibly assigned inside them, the strongest normalized type is:

```text
RESPONSIBILITY_PARTITION / ROLE-LANE
```

Still:

```text
ROLE-LANE
   ≠
TEMPORAL WORKER
   ≠
TASK QUEUE
```

## 3. Request service and workflow-entry ambiguity

The source begins in the Customer partition:

```text
START
  ↓
REQUEST_SERVICE
```

This is source truth.

But two execution interpretations remain plausible:

```text
A. Request service is inside the durable order workflow.
B. Request service is an external customer action that creates/starts the order workflow.
```

Q02 already exposed the same pattern with `Place Order`.

Therefore TALOS records:

```text
REQUEST_SERVICE
source-node-type: ACTIVITY
workflow-boundary: UNRESOLVED
```

## 4. Order object/state evidence

The source shows:

```text
Order [New]
Order [Placed]
```

This is stronger state evidence than a generic task label.

Canonical normalization:

```text
BUSINESS_OBJECT: ORDER
OBSERVED_STATE: NEW
OBSERVED_STATE: PLACED
```

But TALOS must not silently infer:

```text
NEW → PLACED → PAID → FILLED → DELIVERED
```

because only `NEW` and `PLACED` are explicit object-state labels.

New reinforced rule:

```text
OBJECT-STATE NODE
      ≠
COMPLETE BUSINESS STATE MACHINE
```

The actual mutation responsible for `NEW → PLACED` remains unresolved.

## 5. Object/data flow must remain distinct from control flow

The order-state nodes sit between activities using connectors that represent object/data movement or object-state evidence rather than ordinary control progression.

TALOS should preserve:

```text
EDGE_TYPE: OBJECT_FLOW / DATA_FLOW CANDIDATE
```

separately from:

```text
EDGE_TYPE: CONTROL_FLOW
```

This strengthens the semantic model beyond Q02's business-object lifecycle inference.

Critical rule:

```text
OBJECT / DATA FLOW
      ≠
CONTROL / SEQUENCE FLOW
```

The Foundry may later decide that an object-flow edge means workflow state mutation, Activity input/output, external database persistence, message payload, or only source-model evidence. Mining Site does not decide that.

## 6. Validation decision

The source contains:

```text
VALIDATE_ORDER
  ↓
DECISION
  ├── [Order rejected]
  └── [Order correct]
```

Canonical domain outcomes:

```text
ORDER_REJECTED
ORDER_ACCEPTED_FOR_PROCESSING
```

The second label is normalized wording; source wording remains `[Order correct]`.

Important distinction:

```text
ORDER_REJECTED
      ≠
TECHNICAL FAILURE
```

This reinforces Q03/Q04.

## 7. Rejected branch has explicit final semantics

The `[Order rejected]` branch reaches the visible activity-final-like node.

Canonical result:

```text
COMPLETE
status: REJECTED
source-termination: EXPLICIT
```

The source does not show a rejection-notification activity, refund, audit write, or reason code. TALOS must not invent them.

## 8. Correct branch introduces explicit fork semantics

The `[Order correct]` branch reaches the first thick horizontal bar.

Visible downstream branches are:

```text
BRANCH-A
Customer → PAY

BRANCH-B
ORDER [PLACED]
  → Stockroom personnel → FILL_ORDER
```

Topology strongly supports:

```text
PARALLEL_SPLIT
```

This is important because earlier quarries discussed or hinted at concurrency, but Q07 gives very clean source evidence for a split into two simultaneously enabled branches.

Canonical concurrency model:

```text
PARALLEL_REGION-01
  ├── PAYMENT_BRANCH
  └── FULFILLMENT_BRANCH
```

No execution technology is implied.

## 9. Parallel branch responsibilities differ

The two branches cross responsibility contexts:

```text
PAY
owner: Customer

FILL_ORDER
owner: Stockroom personnel
```

This demonstrates that one parallel region may contain work performed by different actors/organizational contexts.

Therefore:

```text
PARALLEL BRANCH
      ≠
SAME EXECUTOR / SAME TASK QUEUE
```

The Foundry must later decide how each branch is digitally initiated, observed and correlated.

## 10. Join is an explicit synchronization barrier

The second thick horizontal bar has two visible incoming flows:

```text
PAY ────────┐
            ├── JOIN
FILL_ORDER ─┘
```

and one outgoing flow:

```text
JOIN → DELIVER_ORDER
```

This is the strongest evidence so far for a synchronization barrier.

Canonical normalization:

```text
JOIN-01
join-policy: ALL_VISIBLE_BRANCHES
waits-for:
- PAYMENT_BRANCH completion
- FULFILLMENT_BRANCH completion
```

Truth discipline:

- two incoming branches + one outgoing path = `SOURCE_TRUTH`;
- `ALL_VISIBLE_BRANCHES` = `INFERRED` from fork/join topology;
- exact exceptional/cancellation semantics = `UNRESOLVED`.

This directly reinforces the Canonical Process Model's need for explicit join semantics rather than a generic merge.

## 11. Parallel join is different from branch convergence

Earlier quarries gave us merges/convergence such as:

```text
optional branch → common stage
multiple rejection sources → shared rejection handling
```

Q07 clarifies a different semantic class:

```text
MERGE / CONVERGENCE
may accept one active upstream path

JOIN / SYNCHRONIZATION
waits for multiple active upstream branches
```

Critical Talos distinction:

```text
MERGE
   ≠
JOIN
```

This is one of Q07's most valuable contributions.

## 12. Pay and Fill order are completion predicates, not yet Temporal Activities

It would be easy to map:

```text
Pay        → Activity
Fill order → Activity
```

but the source only proves business work.

`Pay` may involve:

- an external payment provider;
- a human customer action;
- a payment authorization and callback;
- a long-lived wait;
- a mixed interaction.

`Fill order` may involve:

- physical stockroom work;
- an ERP/WMS operation;
- human confirmation;
- a subprocess;
- another durable workflow.

Therefore:

```text
PAY
execution-type: UNRESOLVED

FILL_ORDER
execution-type: UNRESOLVED
```

For the Foundry, what matters first is the branch completion predicate:

```text
payment branch complete?
fulfillment branch complete?
```

not a premature Activity mapping.

## 13. Successful path has no explicit final node

After the join:

```text
JOIN
  ↓
DELIVER_ORDER
```

The image ends without another visible final node.

Therefore:

```text
DELIVER_ORDER
source-terminal-position: YES IN RENDERED FLOW
explicit-final-event-after: NO
```

TALOS must preserve the difference between:

```text
LAST VISIBLE ACTIVITY
      ≠
EXPLICIT PROCESS COMPLETION
```

This parallels Q05's lesson that local/end evidence must not be overgeneralized.

## 14. Candidate Foundry/Temporal interpretation

The cleanest current hypothesis is one durable order lifecycle with a parallel region:

```text
OrderFulfillmentWorkflow ?

START / external request
  ↓
request service
  ↓
validate order
  ↓
order correct?
  ├── NO → complete: REJECTED
  └── YES
        ↓
      PARALLEL
      ├── payment branch
      │      ↓
      │   wait/perform/observe payment
      │
      └── fulfillment branch
             ↓
          order placed evidence/state
             ↓
          fill order

      JOIN: wait for both
        ↓
      deliver order
        ↓
      completion semantics unresolved
```

Potential Temporal concepts later:

- one Workflow per order if a stable order identity exists;
- deterministic exclusive branch for validation result;
- parallel branch execution/waiting for payment and fulfillment;
- durable external interaction for customer payment if asynchronous;
- Activity/human-work adapter/child workflow candidate for stockroom fulfillment;
- explicit `ALL` synchronization before delivery;
- business-object state stored in Workflow state and/or external durable system only after authority is resolved.

None of these are executable truth yet.

## 15. Comparison with Quarries 01–06

### Reinforced evidence

Q07 reinforces:

- start events;
- role/lane ownership;
- exclusive decision guards;
- business rejection as domain outcome;
- business-object state evidence;
- human/physical work boundaries;
- source node ≠ automatic Temporal Activity;
- source notation ≠ execution semantics;
- last visible node ≠ proven final completion.

### New / sharply strengthened evidence

Q07 introduces or strongly sharpens:

- explicit forked parallel region;
- explicit all-branches join/synchronization barrier;
- `MERGE ≠ JOIN`;
- branch-completion predicates as first-class semantics;
- object/data flow distinct from control flow;
- order object observed in named states inside the control-flow model;
- concurrency spanning multiple responsibility partitions;
- successful path lacking explicit final-event evidence while rejection has explicit termination.

## Transform verdict

```text
SOURCE READING                         ✅
ARTIFACT CLASSIFICATION                ✅ ACTIVITY_PROCESS
ROLE / RESPONSIBILITY PARTITIONS       ✅
OBJECT / STATE EVIDENCE                ✅
OBJECT FLOW VS CONTROL FLOW            ✅ SOURCE-LIMITED
EXCLUSIVE DECISION                     ✅
REJECTED TERMINAL OUTCOME              ✅ EXPLICIT
PARALLEL SPLIT                         ✅ STRONG SOURCE EVIDENCE
PARALLEL BRANCH OWNERSHIP              ✅
ALL-BRANCH JOIN                        ✅ STRONG INFERENCE
MERGE VS JOIN DISTINCTION              ✅
SUCCESSFUL FINAL EVENT                 🟡 NOT SHOWN
TEMPORAL CANDIDATES                    ✅ SUGGESTED
TEMPORAL CODE                          ⛔ NOT NEEDED
```

Quarry 07 is particularly valuable because it gives TALOS a clean concurrency fixture: **validate once, fork payment and fulfillment, synchronize both, then continue delivery**—while still preserving that the business work itself may be human, physical, external-system or mixed.