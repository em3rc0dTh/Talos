# Quarry 09 — Foundry Source 09

## Status

`FOUNDRY-SOURCE-09` is the standardized semantic artifact emitted by `TRANSFORM-09`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled Mining Site handoff to the Foundry.

## Process identity

```text
process: Proposal Preparation Activity Process
quarry: quarry-09-proposal-preparation-activity-process
source: source-09
transform: transform-09
foundry-source: foundry-source-09
artifact-class: ANNOTATED_UML_ACTIVITY_PROCESS_WITH_PARTITIONS_OBJECT_NODES_AND_CONCURRENCY
execution-readiness: NOT_READY
```

## Responsibility partitions

```text
ROLE-01  Customer Sales Interface
ROLE-02  Proposal Owner
ROLE-03  Quote Owner
```

These are source swimlane/partition responsibilities. No Temporal Worker, Task Queue, service, or deployment boundary is implied.

## Source-asserted notation evidence

The source explicitly annotates these notation classes:

```text
Partition
Swimlane
Control Flow
Decision Node
Initial Node
Action
Flow Node
Object Node
Join Node
Activity Final Node
```

Canonical provenance rule:

```text
source-asserted semantic type > geometry-only inference
```

when the annotation is clearly tied to the source node and does not conflict with other evidence.

The red explanatory arrows remain `NOTATION_ANNOTATION_OVERLAY`; they are not process edges.

## Canonical graph

```text
INITIAL_NODE
  ↓
INITIALIZE_CONTACT
owner: Customer Sales Interface
  ↓
INITIAL_OPPORTUNITY_WORK
owner: Customer Sales Interface
  ↓
DECISION-01
source guards:
- [accepted]
- [rejected]

├── ACCEPTED
│     ↓
│   CREATE_PROPOSAL_PROJECT_PLAN
│   owner: Proposal Owner
│     ↓
│   PARALLEL_FORK-01
│
│   ├── BRANCH-A
│   │     ANALYZE_AND_FINALIZE_PROPOSAL
│   │     owner: Proposal Owner
│   │       ↓
│   │     OBJECT_OCCURRENCE-PROPOSAL-01
│   │     label: aProposal : Proposal
│   │
│   ├── BRANCH-B
│   │     CREATE_DELIVERY_PROJECT_PLAN
│   │     owner: Proposal Owner
│   │       ↓
│   │     OBJECT_OCCURRENCE-DELIVERY-PLAN-01
│   │     label: aPlan : Delivery Project Plan
│   │
│   └── BRANCH-C
│         PREPARE_QUOTE
│         owner: Quote Owner
│           ↓
│         OBJECT_OCCURRENCE-QUOTE-01
│         label: ObjectNode : Quote
│
│   PARALLEL_JOIN-01
│   policy: ALL_VISIBLE_BRANCHES
│   waits-for:
│   - BRANCH-A complete
│   - BRANCH-B complete
│   - BRANCH-C complete
│     ↓
│   COMPILE_ADDITIONAL_INFORMATION
│   owner: Proposal Owner
│     ↓
│   OBJECT_OCCURRENCE-PROPOSAL-02
│   label: aProposal : Proposal
│     ↓
│   PREPARE_PROPOSAL
│   owner: Customer Sales Interface
│     ↓
│   OBJECT_CUSTOMER_DECISION
│   source-shape: action-like
│     ↓
│   ACTIVITY_FINAL
│
└── REJECTED
      ↓
    SEARCH_ALTERNATIVE
    owner: Customer Sales Interface
      ↓
    DECISION-02

    ├── guard: [join w. other supplier or change requirements]
    │     ↓
    │   CONTROL_FLOW_LOOP
    │   re-entry-target: INITIALIZE_CONTACT
    │
    └── guard: [rejected or redirected to other region or supplier]
          ↓
        ACTIVITY_FINAL
```

## Decision semantics

### Decision 01

```text
source node type: Decision Node
accepted guard: [accepted]
rejected guard: [rejected]
```

Normalized semantic name candidate:

```text
OPPORTUNITY_ACCEPTED?
```

The normalized question is not source text and remains `INFERRED`.

### Decision 02

```text
source node type: Decision Node
```

Visible outcomes:

```text
RE-ENTER / REWORK PATH
EXIT / REDIRECT PATH
```

The exact business conditions remain the source guard strings.

## Explicit loop / re-entry contract

```text
LOOP-01
from: DECISION-02
condition: [join w. other supplier or change requirements]
to: INITIALIZE_CONTACT
kind: BUSINESS_CONTROL_LOOP
```

Foundry instruction:

```text
DO NOT automatically map LOOP-01 to:
- Activity retry
- Workflow retry policy
- Continue-As-New
- Child Workflow restart
```

The source proves business re-entry, not implementation mechanics.

## Parallel region contract

### Fork

```text
PARALLEL_FORK-01
source annotation: Flow Node
source topology: 1 incoming / 3 outgoing
semantic subtype: PARALLEL_FORK inferred
```

### Branches

```text
BRANCH-A  Proposal analysis/finalization
BRANCH-B  Delivery project plan creation
BRANCH-C  Quote preparation
```

### Join

```text
PARALLEL_JOIN-01
source annotation: Join Node
join-policy: ALL_VISIBLE_BRANCHES
```

Required completion predicates:

```text
PROPOSAL_BRANCH_COMPLETE
DELIVERY_PLAN_BRANCH_COMPLETE
QUOTE_BRANCH_COMPLETE
```

Foundry must later define what `complete` means for each branch operationally.

## Object / artifact contract

Source object-node occurrences:

```text
OBJECT_OCCURRENCE-PROPOSAL-01
  type/label: Proposal

OBJECT_OCCURRENCE-DELIVERY-PLAN-01
  type/label: Delivery Project Plan

OBJECT_OCCURRENCE-QUOTE-01
  type/label: Quote

OBJECT_OCCURRENCE-PROPOSAL-02
  type/label: Proposal
```

Important identity rule:

```text
PROPOSAL-01 and PROPOSAL-02
same conceptual type: STRONG EVIDENCE
same source node: NO
same runtime object instance: NOT_PROVEN
```

The Foundry must resolve authoritative artifact identity/versioning/persistence rather than assuming source-label equality equals object identity.

## Node-type precedence rule

`Object Customer Decision` is an action-like rounded node.

Therefore:

```text
canonical node type: WORK/ACTION CANDIDATE
```

not `OBJECT_NODE`, despite its wording.

Foundry must use source notation/shape/evidence before natural-language token guessing.

## Completion semantics

The bullseye is explicitly annotated `Activity Final Node`.

Therefore:

```text
ACTIVITY_TERMINATION: EXPLICIT
```

Both the accepted/main path and the alternative exit reach it.

Domain outcome details remain unresolved:

```text
accepted-path terminal meaning: proposal lifecycle finished candidate
alternative-path terminal meaning: rejected/redirected candidate
```

The source proves activity finalization, not a shared business success status.

## Temporal design candidate

Advisory only:

```text
ProposalPreparationWorkflow ?

initialize contact
  ↓
initial opportunity work
  ↓
accepted?
  ├── rejected
  │     ↓
  │   search alternative
  │     ↓
  │   alternative decision
  │     ├── rework → loop to initialize contact
  │     └── exit → complete
  │
  └── accepted
        ↓
      create proposal project plan
        ↓
      concurrent work
      ├── analyze/finalize proposal
      ├── create delivery plan
      └── prepare quote
        ↓
      ALL synchronization
        ↓
      compile additional information
        ↓
      prepare proposal
        ↓
      observe/record customer decision
        ↓
      complete
```

Potential Temporal concepts later:

```text
Workflow                 proposal-preparation lifecycle candidate
Activity                 external/system side-effecting work where confirmed
parallel execution       three accepted-path work branches
ALL join                 durable synchronization
Signal / Update          customer-decision interaction candidate
loop                     business re-entry in same lifecycle candidate
Continue-As-New          optional only if history/runtime needs justify it
Query                    proposal/artifact/status visibility candidate
Child Workflow           only if intentional lifecycle boundary is confirmed
```

No code or concrete SDK mapping is authorized yet.

## Foundry questions

Before execution design, resolve:

1. What external event creates one proposal-preparation lifecycle?
2. What stable opportunity/proposal identifier becomes the correlation and Workflow identity candidate?
3. Is `Customer Sales Interface` a system, role, UI boundary, or mixed responsibility?
4. What rule determines `[accepted]` versus `[rejected]`?
5. What exactly does `Search Alternative` do and what external effects does it cause?
6. What does `[join w. other supplier or change requirements]` mean operationally?
7. Can the loop execute indefinitely, and what business/time limit ends it?
8. Should loop iterations preserve one lifecycle identity?
9. What constitutes completion of each parallel branch?
10. Can any branch fail, be cancelled, skipped, or time out?
11. If one branch fails, what happens to the others?
12. Are Proposal, Delivery Project Plan and Quote persisted artifacts, transient values, or external documents?
13. Are the two `aProposal : Proposal` occurrences one proposal object with revisions or separate instances?
14. What operation produces the second proposal occurrence after `Compile Additional Information`?
15. What is `Object Customer Decision` semantically and who owns it?
16. Does customer decision require waiting for an external/human response?
17. What business outcome corresponds to the accepted-path Activity Final?
18. What business outcome corresponds to the alternative/rejected Activity Final?
19. What retry, timeout, cancellation, compensation, idempotency and audit policies apply only after execution types are confirmed?

## Critical rules introduced/reinforced

```text
NOTATION ANNOTATION EDGE
      ≠
PROCESS EDGE

SOURCE-ASSERTED NODE TYPE
      ≠
GEOMETRY-INFERRED TYPE

CONTROL-FLOW LOOP
      ≠
TECHNICAL RETRY
      ≠
CONTINUE-AS-NEW

OBJECT NODE OCCURRENCE
      ≠
BUSINESS OBJECT INSTANCE IDENTITY

SAME OBJECT LABEL
      ≠
SAME SOURCE NODE
      ≠
PROVEN SAME RUNTIME OBJECT

LABEL WORDING
      ≠
NODE TYPE

FLOW NODE WITH 1→N TOPOLOGY
      →
FORK SEMANTICS CANDIDATE

JOIN NODE
      ≠
MERGE

ACTIVITY FINAL
      ≠
AUTOMATIC BUSINESS SUCCESS
```

## Handoff verdict

```text
SOURCE PROVENANCE                    ✅
ARTIFACT CLASS                       ✅
NOTATION ANNOTATION OVERLAY          ✅
SOURCE-ASSERTED NODE TYPES           ✅
PARTITIONS / SWIMLANES               ✅
GUARDED DECISIONS                    ✅
CONTROL-FLOW LOOP                    ✅ EXPLICIT
PARALLEL FORK                        ✅ STRONG INFERENCE
PARALLEL JOIN                        ✅ SOURCE-ASSERTED
JOIN POLICY                          ✅ ALL_VISIBLE_BRANCHES INFERRED
OBJECT NODE OCCURRENCES              ✅
OBJECT INSTANCE IDENTITY             🟡 UNRESOLVED
ACTIVITY FINAL                       ✅ EXPLICIT
EXECUTION TYPES                      🟡 UNRESOLVED
TEMPORAL CANDIDATES                  ✅ SUGGESTED
TEMPORAL CODE                        ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-09` is ready for comparison with later quarries.