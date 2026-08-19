# Quarry 08 — Foundry Source 08

## Status

`FOUNDRY-SOURCE-08` is the standardized semantic artifact emitted by `TRANSFORM-08`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled Mining Site handoff to the Foundry.

## Process identity

```text
process: Multi-Department Call / Complaint / Service Handling
quarry: quarry-08-multi-department-call-service-handling
source: source-08
transform: transform-08
foundry-source: foundry-source-08
artifact-class: LANE_PARTITIONED_SERVICE_PROCESS_WITH_HUMAN_TASK_MARKERS_AND_CONCURRENCY
execution-readiness: NOT_READY
```

## Responsibility partitions

```text
ROLE-01  Management
ROLE-02  Scheduling
ROLE-03  Maintenance
ROLE-04  Examination
ROLE-05  Supplier
```

Source scope rule:

```text
ALL FIVE ARE DRAWN AS LANES
EXTERNAL PARTICIPANT STATUS: NOT PROVEN
```

Therefore lane crossings are normalized as internal responsibility handoffs unless later evidence proves a participant/message boundary.

## Canonical region A — initial call routing

```text
CALL_FROM_OTHER_DEPARTMENT
  ↓
INITIAL_ROUTE_GATEWAY

  ├── MANAGEMENT_PATH
  │     source branch label: Management
  │     ↓
  │   RECEIVE_CALLS
  │   owner: Management
  │     ↓
  │   CALL_BACK_MANAGEMENT
  │   owner: Management
  │     ↓
  │   ANNOUNCE
  │   owner: Management
  │     ↓
  │   EVENT-MGMT
  │   subtype: UNRESOLVED
  │
  └── DOWNWARD_PATH
        condition: UNRESOLVED
        ↓
      ANSWER_CALLS
      owner: Scheduling
```

The downward branch must not be given a fabricated guard.

## Canonical region B — Scheduling triage

```text
ANSWER_CALLS
  ↓
CAN_PROBLEM_BE_SOLVED_01?

  ├── YES
  │     ↓
  │   EVENT-SOLVED-EARLY
  │   termination-evidence: LOCAL / SOURCE-LIMITED
  │
  └── NO
        ↓
      RECORD_CONVERSATION
      owner: Scheduling
        ↓
      IS_CUSTOMER_COMPLAINT?

        ├── YES
        │     ↓
        │   HANDLE_THE_COMPLAINT
        │   owner: Scheduling
        │     ↓
        │   CAN_PROBLEM_BE_SOLVED_02?
        │     ↓
        │   continuation: PARTIAL / SOURCE-LIMITED
        │
        └── NO
              ↓
            TRANSFER_SERVICE
            owner: Scheduling
```

## Canonical region C — transferred service / supplier / closure neighborhood

Visible source nodes:

```text
TRANSFER_SERVICE
SUPPLIER_ON_SITE_SERVICE
FEED_BACK_RESULT
TERMINAL_THE_CASE
CALL_BACK_SCHEDULING
```

The raster proves that these regions participate in the broader control graph, but the exact identity of every long connector endpoint is not equally legible.

Foundry Source representation:

```text
REGION-C
nodes: PRESERVED
edge-topology: PARTIAL
missing-edge-certainty: EXPLICIT
```

TALOS must not convert this into a guaranteed linear chain without additional source evidence.

## Canonical region D — result synchronization

```text
PARALLEL_SPLIT-A

  ├── MAINTENANCE_RESULT_BRANCH
  │     ↓
  │   RESULT_IDENTIFICATION
  │   owner: Maintenance
  │   task-marker: HUMAN/USER HINT
  │
  └── EXAMINATION_RESULT_BRANCH
        ↓
      RESULT_CONFIRMATION
      owner: Examination
      task-marker: HUMAN/USER HINT

PARALLEL_JOIN-A
policy-candidate: ALL_VISIBLE_BRANCHES
  ↓
EVENT-RESULTS
subtype: UNRESOLVED
```

Required completion predicates if the Foundry confirms an all-branch synchronization:

```text
RESULT_IDENTIFICATION_COMPLETE
RESULT_CONFIRMATION_COMPLETE
```

## Canonical region E — callback confirmation + accounting synchronization

```text
CALL_BACK_SCHEDULING
  ↓
PARALLEL_SPLIT-B

  ├── MAINTENANCE_CALLBACK_BRANCH
  │     ↓
  │   CALL_BACK_CONFIRMATION_M
  │   owner: Maintenance
  │     ↓
  │   ACCOUNTING_M
  │   owner: Maintenance
  │
  └── EXAMINATION_CALLBACK_BRANCH
        ↓
      CALL_BACK_CONFIRMATION_E
      owner: Examination
        ↓
      ACCOUNTING_E
      owner: Examination

PARALLEL_JOIN-B
policy-candidate: ALL_VISIBLE_BRANCHES
  ↓
continuation/event topology: SOURCE-LIMITED
```

The `(m)` and `(e)` suffixes are preserved source distinctions.

## Human/user-task evidence

Many activities visibly contain a person icon.

Canonical representation:

```text
task.executionHint = HUMAN_OR_USER_TASK
truthState = INFERRED_FROM_VISIBLE_MARKER
```

Foundry restriction:

```text
DO NOT assume:
- Temporal Activity
- Temporal Update
- Temporal Signal
- specific form/UI
- manual-only execution
- specific worker queue
```

until interaction semantics are confirmed.

## Repeated-source-node identity

Distinct canonical IDs are required for repeated labels:

```text
CAN_PROBLEM_BE_SOLVED_01
CAN_PROBLEM_BE_SOLVED_02

CALL_BACK_MANAGEMENT
CALL_BACK_SCHEDULING

CALL_BACK_CONFIRMATION_M
CALL_BACK_CONFIRMATION_E

ACCOUNTING_M
ACCOUNTING_E
```

This prevents semantic collapse during normalization.

## Event model

The Foundry Source preserves event identity separately from terminal outcome.

```text
EVENT-MGMT
EVENT-SOLVED-EARLY
EVENT-RESULTS
```

For each event:

```text
source shape: preserved
subtype: unresolved unless topology proves it
incoming/outgoing edge evidence: preserved
terminal status: not inferred from circle shape alone
```

## Lane-handoff semantics

Canonical rule:

```text
Scheduling → Maintenance
Scheduling → Examination
Scheduling → Supplier
Maintenance/Examination → Scheduling/Management area
```

are responsibility transitions inside one visible process scope.

They are not automatically:

```text
MESSAGE
SIGNAL
CHILD WORKFLOW
SEPARATE TEMPORAL WORKFLOW
```

## Callback semantics

The source explicitly contains callback behavior:

```text
Call back
Call back confirmation (m)
Call back confirmation(e)
```

Canonical interpretation:

```text
COMMUNICATION / RE-ENTRY INTENT: PRESENT
EXPLICIT TIMER: ABSENT
EXPLICIT WAIT EVENT: ABSENT
```

Foundry may later design durable waiting/human interaction, but Mining Site does not invent it.

## Temporal design candidate

Advisory only:

```text
ServiceCaseWorkflow ?

start from departmental call
  ↓
rout responsibility
  ↓
answer / triage
  ↓
problem solved?
  ├── yes → close/local outcome
  └── no
       ↓
     record conversation
       ↓
     complaint?
       ├── yes → complaint handling / resolution path
       └── no  → transfer / supplier service path

additional process regions may require:
- parallel result identification + result confirmation
- case termination and callback
- parallel Maintenance/Examination confirmation + accounting
```

Potential Temporal concepts later:

```text
Workflow             one service/case lifecycle candidate
Activity             side-effecting system integrations when confirmed
Update / Signal      human response/callback candidate
parallel execution   Maintenance + Examination branch regions
ALL join             synchronization candidate
Child Workflow       supplier/subprocess only if independently durable
Query                case-status visibility candidate
```

No mapping is executable truth yet.

## Critical rules introduced/reinforced

```text
LANE BOUNDARY
      ≠
PARTICIPANT / MESSAGE BOUNDARY

ROLE HANDOFF
      ≠
MESSAGE FLOW

EXTERNAL-SOUNDING ROLE NAME
      ≠
PROVEN EXTERNAL PARTICIPANT

PERSON / USER TASK ICON
      ≠
KNOWN TEMPORAL INTERACTION MECHANISM

SAME DISPLAY LABEL
      ≠
SAME SOURCE NODE

SYMMETRIC BRANCHES
      ≠
DUPLICATE NODES TO COLLAPSE

CIRCULAR EVENT SYMBOL
      ≠
AUTOMATIC TERMINAL OUTCOME

CALLBACK INTENT
      ≠
EXPLICIT TIMER / WAIT

DIAGRAM READING ORDER
      ≠
PROCESS EXECUTION ORDER

AMBIGUOUS LONG CONNECTOR
      ≠
LICENSE TO INVENT AN EDGE
```

## Foundry questions

Before executable Temporal design, resolve:

1. What business entity/case identifier correlates the whole process?
2. Does the first gateway truly select Management versus Scheduling, and what is the condition for the downward branch?
3. What exact event starts the case: an incoming call, a ticket, another department request, or something else?
4. What is the semantic subtype of each circular event node?
5. Is `EVENT-SOLVED-EARLY` a true process end or a local stage completion?
6. What exact guards leave `CAN_PROBLEM_BE_SOLVED_02`?
7. What are the precise long-edge endpoints connecting complaint, transfer, result, supplier, closure and callback regions?
8. Is Supplier really internal responsibility or an external participant modeled as a lane?
9. What exactly happens in `Transfer service`?
10. What proves `Supplier on site service` completed?
11. What does `Feed back result` contain and who consumes it?
12. Do `Result identification` and `Result confirmation` always run together?
13. Does `PARALLEL_JOIN-A` require both branches in every applicable case?
14. What is the event after `PARALLEL_JOIN-A`?
15. What business state change is represented by `terminal the case`?
16. What triggers Scheduling `Call back` and how is callback completion observed?
17. Do Maintenance and Examination callback/accounting branches always both run?
18. What do `(m)` and `(e)` mean operationally?
19. What does `Accounting(m/e)` record and in which system?
20. Does `PARALLEL_JOIN-B` complete the process, feed a management announcement, or another event?
21. Which person-icon tasks are truly human tasks versus system-assisted/user tasks?
22. What timeouts, escalations, cancellations, retries, compensation and idempotency rules apply after interaction types are resolved?

## Handoff verdict

```text
SOURCE PROVENANCE                    ✅
ARTIFACT CLASS                       ✅
LANE / ROLE MODEL                    ✅
LANE VS PARTICIPANT DISTINCTION      ✅
HUMAN TASK MARKER                    ✅ SOURCE-LIMITED
INITIAL ROUTING                      ✅ SOURCE-LIMITED
TRIAGE DECISIONS                     ✅
REPEATED NODE IDENTITY               ✅
PARALLEL REGION A                    ✅ STRONG
PARALLEL REGION B                    ✅ STRONG
JOIN POLICY                          🟡 ALL_VISIBLE_BRANCHES CANDIDATE
EVENT SUBTYPES                       🟡 UNRESOLVED
LONG-EDGE TOPOLOGY                   🟡 PARTIAL
CALLBACK / RE-ENTRY INTENT           ✅
EXECUTION MECHANISMS                 🟡 UNRESOLVED
TEMPORAL CANDIDATES                  ✅ SUGGESTED
TEMPORAL CODE                        ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-08` is ready for comparison with later quarries.