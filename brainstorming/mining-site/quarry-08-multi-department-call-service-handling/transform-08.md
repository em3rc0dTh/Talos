# Quarry 08 — Transform 08

## Objective

Interpret `source-08` as a lane-partitioned human service process without collapsing role handoffs into participant messaging, preserve repeated decision/node identities, normalize its repeated parallel regions, and prepare `foundry-source-08` without inventing ambiguous long-edge semantics.

No executable code is produced here.

## 1. Artifact classification

Quarry 08 is workflow-like and substantially more operational than Q06.

Canonical class:

```text
ARTIFACT_CLASS
LANE_PARTITIONED_SERVICE_PROCESS_WITH_HUMAN_TASK_MARKERS_AND_CONCURRENCY
```

It contains one visible enclosing process area with five internal lanes.

This immediately sharpens a distinction learned in Q05:

```text
LANE BOUNDARY
      ≠
PARTICIPANT / MESSAGE BOUNDARY
```

The solid sequence-like connectors cross lanes directly. TALOS must preserve those as responsibility handoffs inside one process graph unless later evidence proves separate participants.

## 2. Responsibility model

Canonical responsibilities:

```text
ROLE-01  Management
ROLE-02  Scheduling
ROLE-03  Maintenance
ROLE-04  Examination
ROLE-05  Supplier
```

`Supplier` sounds externally organizational, but the source draws it as an internal lane, not a separate participant pool. TALOS therefore must not infer an external participant merely from the label.

New safety rule:

```text
ROLE NAME THAT SOUNDS EXTERNAL
      ≠
PROVEN EXTERNAL PARTICIPANT
```

## 3. Human-task execution hints

Most activities include a small person icon.

Canonical evidence:

```text
TASK_MARKER
person/user icon present
```

Provisional interpretation:

```text
HUMAN_OR_USER_TASK_HINT
```

But the Foundry cannot yet decide whether execution is:

- a human task completed through a UI;
- a human action reported through Signal/Update;
- an Activity that creates/updates a ticket for a human;
- an external workforce/work-order system;
- or a mixture.

Therefore:

```text
HUMAN TASK MARKER
      ≠
KNOWN TEMPORAL HUMAN-INTERACTION IMPLEMENTATION
```

## 4. Initial routing region

Visible source topology:

```text
CALL_FROM_OTHER_DEPARTMENT
  ↓
ROUTE_INITIAL_CALL
  ├── branch label: Management
  │     ↓
  │   RECEIVE_CALLS
  │     ↓
  │   CALL_BACK_MANAGEMENT
  │     ↓
  │   ANNOUNCE
  │     ↓
  │   EVENT-MGMT
  │
  └── unlabeled/downward branch
        ↓
      ANSWER_CALLS
```

The source does not label the downward branch condition. TALOS preserves it as an unresolved route rather than calling it `Scheduling` by assumption.

## 5. Scheduling triage region

Canonical reading:

```text
ANSWER_CALLS
  ↓
CAN_PROBLEM_BE_SOLVED_01?
  ├── YES → EVENT-SOLVED-EARLY
  └── NO
        ↓
      RECORD_CONVERSATION
        ↓
      IS_CUSTOMER_COMPLAINT?
        ├── YES
        │     ↓
        │   HANDLE_THE_COMPLAINT
        │     ↓
        │   CAN_PROBLEM_BE_SOLVED_02?
        │     ↓
        │   continuation: SOURCE-LIMITED
        │
        └── NO
              ↓
            TRANSFER_SERVICE
```

Two distinct gateways have the same question `can the problem be solved?`.

They remain separate canonical nodes:

```text
CAN_PROBLEM_BE_SOLVED_01
CAN_PROBLEM_BE_SOLVED_02
```

This strongly reinforces Q05/Q07:

```text
SAME DISPLAY LABEL
      ≠
SAME SOURCE NODE
      ≠
SAME DECISION CONTEXT
```

## 6. Transfer / supplier / case-close region

Visible nodes include:

```text
TRANSFER_SERVICE
SUPPLIER_ON_SITE_SERVICE
FEED_BACK_RESULT
TERMINAL_THE_CASE
CALL_BACK_SCHEDULING
```

The source visually connects these areas through long, nonlocal lane-crossing connectors. The exact endpoint semantics of every connector are not equally legible in the raster.

Therefore the transform records:

```text
REGION TOPOLOGY: PRESENT
COMPLETE EDGE MAP: PARTIAL / SOURCE-LIMITED
```

TALOS does not repair the uncertain portions into a fabricated linear path.

However, the source clearly establishes that service transfer/supplier work, feedback, case termination and callback belong to the same broader process neighborhood.

## 7. Parallel region A — result identification + result confirmation

Visible plus gateways define a parallel-looking region:

```text
PARALLEL_SPLIT-A
  ├── Maintenance → RESULT_IDENTIFICATION
  └── Examination → RESULT_CONFIRMATION

PARALLEL_JOIN-A
  ↓
EVENT-RESULTS
```

The two branches are distinct departmental responsibilities.

Canonical join candidate:

```text
policy: ALL_VISIBLE_BRANCHES
```

This is strong but remains `INFERRED` because the source provides no notation legend.

Required completion predicates later:

```text
RESULT_IDENTIFICATION_COMPLETE
RESULT_CONFIRMATION_COMPLETE
```

## 8. Parallel region B — callback confirmation + accounting

This region is even clearer:

```text
PARALLEL_SPLIT-B

  ├── Maintenance branch
  │     CALL_BACK_CONFIRMATION_M
  │       ↓
  │     ACCOUNTING_M
  │
  └── Examination branch
        CALL_BACK_CONFIRMATION_E
          ↓
        ACCOUNTING_E

PARALLEL_JOIN-B
```

The `(m)` and `(e)` suffixes preserve branch identity.

TALOS must not deduplicate the two structurally similar branches.

New rule:

```text
SYMMETRIC / TEMPLATE-LIKE BRANCHES
      ≠
DUPLICATE NODES TO COLLAPSE
```

The correct normalization is shared structure + distinct branch identity.

## 9. Cross-lane sequence handoff

Quarry 08 gives especially strong evidence for:

```text
ROLE HANDOFF
      ≠
MESSAGE FLOW
```

An activity can hand control directly from Scheduling to Maintenance, Examination or Supplier while remaining inside one process scope.

This distinction matters for Temporal because a lane change alone does not justify:

```text
Signal
external message
Child Workflow
separate Workflow
```

Execution boundaries must come from lifecycle/ownership semantics, not merely lane geometry.

## 10. Layout direction is not execution direction

The source contains connectors that travel:

- left-to-right;
- top-to-bottom;
- bottom-to-top;
- right-to-left/nonlocal across lanes.

Therefore:

```text
DIAGRAM READING ORDER
      ≠
PROCESS EXECUTION ORDER
```

TALOS must parse a graph, not read the image as rows of prose.

This is a major reinforcement for the source-graph-first model introduced by Q06.

## 11. Event semantics require topology, not icon shape alone

Several white circular event-like nodes appear.

Some seem locally terminal; others participate in additional connector topology.

Therefore:

```text
CIRCULAR EVENT SYMBOL
      ≠
AUTOMATIC PROCESS END
```

The transform keeps canonical IDs such as:

```text
EVENT-MGMT
EVENT-SOLVED-EARLY
EVENT-RESULTS
```

while leaving event subtype unresolved unless visible topology proves it.

This adds a useful primitive requirement:

```text
EVENT
- source identity
- subtype: known/unknown
- incoming edges
- outgoing edges
- termination evidence
```

## 12. Re-entry / callback as lifecycle behavior

The source repeatedly uses `Call back` and callback-confirmation steps.

That suggests the process is not merely a synchronous request/response chain. It includes delayed/re-entering human communication.

But no explicit wait/timer event is shown.

Therefore:

```text
CALLBACK INTENT: SOURCE_TRUTH
DURABLE WAIT / TIMER: NOT PROVEN
ASYNC HUMAN EVENT: SUGGESTED CANDIDATE
```

This prevents the Foundry from inventing a timer simply because a callback exists.

## 13. Temporal conceptual candidates

A plausible Foundry hypothesis is one durable service/case lifecycle:

```text
ServiceCaseWorkflow ?

receive/rout call
  ↓
triage
  ↓
resolve immediately?
  ├── yes → local outcome
  └── no
       ↓
     record conversation
       ↓
     complaint?
       ├── complaint handling path
       └── transfer/supplier path

selected paths may involve:
- result identification + confirmation in parallel
- supplier service + feedback
- case termination + callback
- callback confirmation/accounting in parallel
```

Potential Temporal concepts later:

```text
Workflow                service/case lifecycle candidate
Activity                external/system side effects where confirmed
Update / Signal         human call/callback completion candidate
parallel execution      Maintenance + Examination regions
ALL join                result/accounting synchronization candidate
Child Workflow          supplier or departmental lifecycle only if independently durable
Query                    case status visibility candidate
```

None is executable truth yet.

## 14. Comparison with Quarries 01–07

### Reinforced evidence

Q08 reinforces:

- roles/lanes as responsibility partitions;
- exclusive decisions;
- repeated source labels requiring unique node identity;
- parallel split/join semantics;
- human work boundaries;
- nonterminal business outcomes distinct from technical failure;
- graph topology over visual reading order;
- source ambiguity must survive normalization.

### New / sharpened evidence

Q08 newly introduces or sharply strengthens:

- lane crossing as internal control-flow handoff rather than message flow;
- human/user-task marker as an execution-modality hint;
- external-sounding lane name not proving external participant status;
- repeated symmetric branch templates with distinct branch identity;
- event subtype/termination determined from topology, not shape alone;
- explicit nonlocal/backward connectors as first-class graph evidence;
- callback intent without automatic timer/wait inference;
- partial-edge-confidence at the graph level when raster routing is ambiguous.

## Transform verdict

```text
SOURCE READING                         ✅
ARTIFACT CLASSIFICATION                ✅
RESPONSIBILITY LANES                   ✅
LANE VS PARTICIPANT DISTINCTION        ✅
HUMAN TASK MARKER EVIDENCE             ✅ SOURCE-LIMITED
REPEATED DECISION IDENTITY             ✅
PARALLEL REGION A                      ✅ STRONG
PARALLEL REGION B                      ✅ STRONG
SYMMETRIC BRANCH IDENTITY              ✅
NONLOCAL GRAPH CONNECTORS              ✅
EVENT TERMINATION SEMANTICS            ✅ SOURCE-LIMITED
CALLBACK / RE-ENTRY INTENT              ✅
COMPLETE LONG-EDGE MAP                 🟡 PARTIAL
TEMPORAL CANDIDATES                    ✅ SUGGESTED
TEMPORAL CODE                          ⛔ NOT NEEDED
```

Quarry 08 strengthens TALOS's requirement to understand a process as a provenance-rich graph of responsibilities, work modalities, decisions, events and synchronization—not as a sequence of boxes read left-to-right.