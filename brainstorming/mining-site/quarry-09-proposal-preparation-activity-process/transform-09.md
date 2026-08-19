# Quarry 09 — Transform 09

## Objective

Interpret `source-09` as an annotated UML activity-style process, preserve its notation annotations as a separate evidence layer, normalize its guarded decisions, explicit control-flow loop, fork/join concurrency, object-node occurrences and cross-lane handoffs, and prepare `foundry-source-09` without collapsing data/object semantics into executable work.

No executable code is produced here.

## 1. Artifact classification

Canonical class:

```text
ARTIFACT_CLASS
ANNOTATED_UML_ACTIVITY_PROCESS_WITH_PARTITIONS_OBJECT_NODES_AND_CONCURRENCY
```

Q09 differs from earlier quarries because the source itself teaches part of its notation through red annotations.

This introduces a new evidence plane:

```text
NOTATION_ANNOTATION_OVERLAY
```

Critical rule:

```text
ANNOTATION ARROW
      ≠
PROCESS EDGE
```

The red dashed explanatory arrows must not be inserted into the business graph.

## 2. Source-asserted semantic typing

The image explicitly names:

```text
Initial Node
Action
Decision Node
Object Node
Join Node
Activity Final Node
Control Flow
Partition
Swimlane
Flow Node
```

When a source explicitly labels its own notation, TALOS can record a stronger semantic claim than shape-only inference.

New distinction:

```text
SOURCE_ASSERTED_NOTATION_TYPE
      ≠
GEOMETRY_INFERRED_TYPE
```

This is important for provenance because the confidence/evidence basis is different.

## 3. Partition and lane semantics

Visible lanes:

```text
Customer Sales Interface
Proposal Owner
Quote Owner
```

These are responsibility partitions in one activity/process graph.

Q09 reinforces Q08:

```text
SWIMLANE CHANGE
      ≠
PARTICIPANT MESSAGE
      ≠
TEMPORAL WORKFLOW BOUNDARY
```

The accepted branch crosses from Customer Sales Interface into Proposal Owner, and later work crosses into Quote Owner. These are responsibility handoffs until another source proves stronger lifecycle separation.

## 4. Primary decision with guards

After:

```text
INITIAL_NODE
  ↓
INITIALIZE_CONTACT
  ↓
INITIAL_OPPORTUNITY_WORK
```

there is a source-annotated decision node with guards:

```text
[accepted]
[rejected]
```

Canonical normalization:

```text
OPPORTUNITY_ACCEPTED?
  ├── ACCEPTED
  └── REJECTED
```

The normalized question is `INFERRED`; the guard strings are `SOURCE_TRUTH`.

## 5. Explicit control-flow loop / back-edge

The rejected branch reaches `Search Alternative`, then another source-annotated `Decision Node`.

One visible continuation loops back toward `Initialize Contact` under:

```text
[join w. other supplier or change requirements]
```

Another continuation reaches the activity final under:

```text
[rejected or redirected to other region or supplier]
```

This is the strongest Mining Site evidence so far for an explicit business-process loop.

Canonical family:

```text
CONTROL_FLOW_LOOP
- back-edge
- re-entry target
- guard / continuation condition
- exit condition
```

New safety rule:

```text
BACK-EDGE / LOOP
      ≠
CONTINUE-AS-NEW
      ≠
RETRY
```

The Foundry may later choose ordinary Workflow looping, Continue-As-New, a Child Workflow, or another design based on duration/history/identity semantics. The source proves only the business loop.

## 6. Fork semantics from topology

After `Create Proposal Project Plan`, a black bar annotated only `Flow Node` has:

```text
1 incoming edge
3 outgoing edges
```

This supports:

```text
PARALLEL_FORK_01
```

as an `INFERRED` semantic type from topology.

Branches:

```text
BRANCH-A  Analyze and Finalize Proposal
BRANCH-B  Create a Delivery Project Plan
BRANCH-C  Prepare a Quote
```

This is cross-lane concurrency: two branches in Proposal Owner and one in Quote Owner.

Critical rule reinforced:

```text
PARALLEL BRANCH
      ≠
SAME ROLE
      ≠
SAME WORKER / TASK QUEUE
```

## 7. Object production must remain first-class

Each branch produces/reaches an object node:

```text
BRANCH-A → aProposal : Proposal
BRANCH-B → aPlan : Delivery Project Plan
BRANCH-C → ObjectNode : Quote
```

Talos must model:

```text
WORK NODE
  ↓
OBJECT / ARTIFACT OCCURRENCE
```

without turning the object occurrence into an Activity.

This strengthens Q07's rule:

```text
OBJECT NODE
      ≠
EXECUTABLE STEP
```

and adds:

```text
OBJECT PRODUCTION
      ≠
OBJECT IDENTITY / PERSISTENCE STRATEGY
```

## 8. Join semantics

The three object-producing branches feed a black bar explicitly annotated `Join Node`.

Canonical normalization:

```text
PARALLEL_JOIN_01
policy: ALL_VISIBLE_BRANCHES
waits-for:
- PROPOSAL_BRANCH_COMPLETE
- DELIVERY_PLAN_BRANCH_COMPLETE
- QUOTE_BRANCH_COMPLETE
```

The `Join Node` type is `SOURCE_ASSERTED`; the `ALL_VISIBLE_BRANCHES` policy is strongly `INFERRED` from the one-join topology.

Q09 therefore reinforces Q07/Q08 that synchronization semantics are distinct from simple convergence.

## 9. Source-node occurrence ≠ business-object identity

There are two distinct source nodes labeled:

```text
aProposal : Proposal
```

one before the join and one after `Compile Additional Information`.

Talos must preserve:

```text
OBJECT_NODE_OCCURRENCE_01
OBJECT_NODE_OCCURRENCE_02
```

while allowing a possible relation:

```text
conceptual object type: Proposal
same runtime identity: UNRESOLVED
```

New rule:

```text
SAME OBJECT LABEL
      ≠
SAME SOURCE NODE
      ≠
PROVEN SAME OBJECT INSTANCE
```

This is more precise than the earlier `same display label ≠ same node` rule because here the labels intentionally refer to the same object type.

## 10. Node type must follow notation evidence, not words in the label

`Object Customer Decision` contains the word `Object`, but it is drawn as a rounded action-like node.

Therefore:

```text
LABEL CONTAINS "Object"
      ≠
OBJECT NODE
```

Canonical type:

```text
OBJECT_CUSTOMER_DECISION
node-type: ACTION / WORK NODE candidate
```

This is a useful anti-parser rule for Talos.

## 11. Explicit activity final semantics

The bottom bullseye node is explicitly annotated:

```text
Activity Final Node
```

This is stronger than shape-only end-event inference.

Both the main successful path and the alternative/rejected exit visually reach the same activity final.

Canonical outcome class:

```text
ACTIVITY_COMPLETE
```

but the business result can differ by path:

```text
PROPOSAL_PREPARATION_COMPLETED
ALTERNATIVE_OR_REDIRECT_EXIT
```

The exact domain outcome taxonomy remains `INFERRED`.

## 12. Accepted-path normalized flow

```text
INITIALIZE_CONTACT
  ↓
INITIAL_OPPORTUNITY_WORK
  ↓
OPPORTUNITY_ACCEPTED?
  └── ACCEPTED
        ↓
      CREATE_PROPOSAL_PROJECT_PLAN
        ↓
      PARALLEL_FORK_01
        ├── ANALYZE_AND_FINALIZE_PROPOSAL
        │      ↓
        │   PROPOSAL_OBJECT_OCCURRENCE_01
        │
        ├── CREATE_DELIVERY_PROJECT_PLAN
        │      ↓
        │   DELIVERY_PROJECT_PLAN_OBJECT
        │
        └── PREPARE_QUOTE
               ↓
            QUOTE_OBJECT

      PARALLEL_JOIN_01
        ↓
      COMPILE_ADDITIONAL_INFORMATION
        ↓
      PROPOSAL_OBJECT_OCCURRENCE_02
        ↓
      PREPARE_PROPOSAL
        ↓
      OBJECT_CUSTOMER_DECISION
        ↓
      ACTIVITY_FINAL
```

## 13. Rejected-path normalized flow

```text
OPPORTUNITY_ACCEPTED?
  └── REJECTED
        ↓
      SEARCH_ALTERNATIVE
        ↓
      ALTERNATIVE_DECISION
        ├── [join w. other supplier or change requirements]
        │      ↓
        │   LOOP_BACK_TO_INITIALIZE_CONTACT
        │
        └── [rejected or redirected to other region or supplier]
               ↓
            ACTIVITY_FINAL
```

## 14. Temporal conceptual candidates

A plausible Foundry hypothesis is one durable proposal-preparation lifecycle:

```text
ProposalPreparationWorkflow ?

initialize contact
  ↓
perform initial opportunity work
  ↓
accepted?
  ├── rejected
  │     ↓
  │   search alternative
  │     ↓
  │   loop or exit
  │
  └── accepted
        ↓
      create proposal project plan
        ↓
      run concurrently
      ├── proposal analysis/finalization
      ├── delivery project plan creation
      └── quote preparation
        ↓
      synchronize all
        ↓
      compile information
        ↓
      prepare proposal
        ↓
      observe/record customer decision
        ↓
      complete
```

Potential Temporal concepts later:

```text
Workflow              proposal lifecycle candidate
Activities            external/system work where confirmed
parallel execution    proposal + delivery plan + quote
ALL join              durable synchronization
Signal / Update        customer decision candidate if external/human
loop                   same Workflow iteration candidate
Continue-As-New        only if runtime/history requirements justify it
Query                  proposal state/artifact visibility candidate
```

None is executable truth yet.

## 15. Comparison with Quarries 01–08

### Reinforced

- responsibility lanes are not execution boundaries;
- object/data semantics are separate from control flow;
- fork/join concurrency and ALL synchronization;
- source-node identity must be preserved;
- labels alone cannot define node semantics;
- terminal semantics should use source evidence, not shape guessing.

### New / strengthened

Q09 introduces or sharply strengthens:

- source-asserted notation semantics;
- notation annotation/legend overlay separate from process graph;
- explicit business loop/back-edge and guarded re-entry;
- object-node occurrence versus business-object instance identity;
- node-type precedence over misleading label text;
- explicit activity-final proof;
- mixed control + object/artifact graph inside one workflow-like source.

## Transform verdict

```text
SOURCE READING                         ✅
ARTIFACT CLASSIFICATION                ✅
SOURCE-ASSERTED NOTATION TYPES         ✅
ANNOTATION OVERLAY SEPARATION          ✅
PARTITION / SWIMLANE RESPONSIBILITY    ✅
GUARDED DECISIONS                      ✅
EXPLICIT LOOP / BACK-EDGE              ✅
PARALLEL FORK                          ✅ STRONG INFERENCE
PARALLEL JOIN                          ✅ SOURCE-ASSERTED
JOIN POLICY                            ✅ ALL_VISIBLE_BRANCHES INFERRED
OBJECT NODE OCCURRENCES                ✅
OBJECT INSTANCE IDENTITY               🟡 UNRESOLVED
ACTIVITY FINAL                         ✅ SOURCE-ASSERTED
TEMPORAL CANDIDATES                    ✅ SUGGESTED
TEMPORAL CODE                          ⛔ NOT NEEDED
```

Quarry 09 materially improves TALOS by proving that source notation can itself carry semantic assertions and that loops, artifacts, concurrency and responsibility partitions must coexist in the canonical source graph without being flattened into a list of Activities.