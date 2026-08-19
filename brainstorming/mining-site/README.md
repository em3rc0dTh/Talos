# TALOS Mining Site

## Purpose

The Mining Site is TALOS's controlled experimentation area for learning how heterogeneous business-process and architecture sources can be interpreted, normalized, and handed to the Foundry without erasing their origin.

A quarry is one concrete source used as evidence. A quarry may begin from an image, BPMN/Bizagi model, whiteboard, flowchart, Mermaid/draw.io artifact, natural-language description, existing automation, reference architecture, service topology, UML activity-style model, lane-partitioned service process, annotated notation example, collaborative whiteboard screenshot, or another process/system representation.

The Mining Site does not produce executable code. Its job is to preserve source truth, perform an auditable transformation, surface uncertainty, classify the source artifact, discover executable slices when they exist, and emit a clean Foundry Source.

```text
QUARRY-NN
raw source artifact
        ↓
TRANSFORM-NN
artifact classification + agent interpretation + normalization
        ↓
FOUNDRY-SOURCE-NN
canonical semantic handoff
        ↓
FOUNDRY
execution design
        ↓
TEMPORAL MODEL(S)
```

## Standard quarry structure

```text
brainstorming/mining-site/
└── quarry-NN-<short-name>/
    ├── source-NN.<native-source-format>   # when binary/source ingestion is available
    ├── source-NN.md                       # source record + provenance + limitations
    ├── transform-NN.md                    # agent interpretation + comparison
    └── foundry-source-NN.md               # standardized semantic handoff
```

The original source artifact should be retained whenever repository ingestion supports its native format. The source record must always capture origin metadata and a stable digest so the transformation remains traceable even when the native binary has not yet been attached.

File-name/extension metadata is not sufficient to identify byte format. If the observed file signature differs from the supplied extension, preserve both facts rather than silently correcting the source.

## Truth discipline

Every quarry must distinguish:

- `SOURCE_TRUTH` — explicitly visible or supplied by the source.
- `INFERRED` — interpretation needed to make the source understandable.
- `SUGGESTED` — a possible design improvement or implementation choice.
- `CONFIRMED` — interpretation accepted through review.
- `EXECUTABLE` — semantics are sufficiently specified for execution design.

Confidence never replaces truth state.

## What TRANSFORM does

A transform may extract and normalize:

- artifact/source class before assuming workflow semantics;
- source presentation/authoring UI separately from the business graph;
- collaborator presence, cursors and editor overlays separately from business actors/ownership;
- process trigger and terminal outcomes;
- process scope and candidate executable slices;
- architecture layers/domain containers;
- participants versus internal responsibility lanes/roles;
- participant-local control flow versus cross-participant communication;
- cross-lane responsibility handoffs inside one process scope;
- source-node identity independently from display labels;
- source-asserted notation type independently from geometry-inferred type;
- notation legends/annotation overlays independently from business graph edges;
- source visual style/color independently from semantic type;
- visible task/execution markers separately from implementation semantics;
- provisional node semantic type: step/stage, capability, service, resource, repository, catalog/state, infrastructure, governance work, model/artifact;
- edge semantic type where supported: sequence, message/communication, object/data flow, dependency, handoff, feedback, association;
- decisions and branch outcomes;
- branch convergence / merge semantics;
- shared downstream handling while retaining branch-origin/cause;
- explicit parallel split/fork regions and synchronization joins;
- branch-completion predicates and join policy;
- explicit loops/back-edges, re-entry targets and exit conditions;
- waits, deadlines, callback/re-entry intent and external events;
- event identity, incoming/outgoing topology and termination evidence separately from icon shape;
- human interactions and physical work;
- subprocesses and nested work;
- boundary events and exception paths;
- business objects, object-node occurrences and state evidence;
- conceptual object identity separately from source object-node occurrence identity;
- identity/access gates and preconditions;
- business communication intent and explicit channel evidence;
- validation/check work separately from state-changing/side-effect work where the source distinguishes them;
- message/correlation requirements across participant boundaries;
- local milestones/ends versus collaboration-level completion;
- missing continuation, failure, compensation or re-entry paths;
- data, rules and explicit integrations;
- architecture/resource/infrastructure nodes that may not belong to executable control flow;
- source analytics, simulation or performance overlays separately from semantic process state;
- graph-level uncertainty, including partially legible long-edge endpoints;
- uncertainties, conflicts and missing semantics;
- candidate Temporal concepts, without pretending an implementation choice is source truth.

## What FOUNDRY-SOURCE means

A Foundry Source is not Temporal code and is not yet a deployment plan. It is the standardized semantic handoff produced by Mining Site work.

The Foundry receives this artifact and asks a different question:

> Which validated semantics are executable lifecycles, what durable boundaries should exist, and how should those lifecycles become a durable executable system?

Only the Foundry may resolve execution design such as Workflow boundaries, Activities, Signals / Updates, Timers, Child Workflows, retry policies, task queues, integration adapters, worker topology, correlation strategy, technical failure behavior, human-interaction implementation, side-effect/idempotency behavior, compensation behavior, parallel execution semantics, loop/history-management strategy, and decomposition across multiple durable workflows.

## Experimental rule

Do not standardize from one example. Each quarry must be compared against prior quarries. Repeated semantics may become TALOS primitives; one-off details remain source-specific until evidence supports generalization.

Critical rules exposed by Mining Site work:

```text
BUSINESS PROCESS NODE            ≠ automatically a Temporal Activity
BUSINESS EXCEPTION               ≠ automatically a technical failure
BUSINESS REJECTION               ≠ automatically a technical failure
BUSINESS MESSAGE                 ≠ automatically a known integration
MESSAGE FLOW                     ≠ sequence flow
OBJECT / DATA FLOW               ≠ control / sequence flow
SOURCE NOTATION                  ≠ automatically execution semantics
SOURCE-ASSERTED NODE TYPE        ≠ geometry-only inference
NOTATION ANNOTATION EDGE         ≠ process edge
AUTHORING / WORKSPACE UI         ≠ business process graph
COLLABORATOR CURSOR              ≠ business actor / role
CURSOR PROXIMITY                 ≠ ownership / assignment
EDITORIAL POINTER                ≠ process edge
VISUAL COLOR / STYLE             ≠ semantic type without evidence
IDENTITY / ACCESS GATE           ≠ automatically a known auth implementation
DATA RETENTION INTENT            ≠ automatically proven consent/compliance semantics
PARTICIPANT BOUNDARY             ≠ automatically a Temporal Workflow boundary
PARTICIPANT-LOCAL END            ≠ global collaboration completion
LANE BOUNDARY                    ≠ participant / message boundary
ROLE HANDOFF                     ≠ message flow
EXTERNAL-SOUNDING ROLE NAME      ≠ proven external participant
PERSON / USER TASK ICON          ≠ known Temporal interaction mechanism
SAME DISPLAY LABEL               ≠ same source node
SAME BUSINESS QUESTION           ≠ same authority / data context
SAME OBJECT LABEL                ≠ same source node or proven same runtime object
SYMMETRIC BRANCHES               ≠ duplicate nodes to collapse
SHARED HANDLING                  ≠ loss of branch-origin reason
MISSING CONTINUATION             ≠ implicit success
MISSING FAILURE PATH             ≠ proof that failure cannot occur
REFERENCE ARCHITECTURE           ≠ one executable Workflow
ARCHITECTURE LAYER               ≠ participant / role / Task Queue
SERVICE / CAPABILITY BOX         ≠ Temporal Activity
RESOURCE / REPOSITORY / CATALOG  ≠ process step
MESSAGE QUEUE COMPONENT          ≠ Temporal Task Queue or business message flow
ARCHITECTURE EDGE                ≠ sequence flow until proven
FEEDBACK TOPOLOGY                ≠ single process loop until instance semantics are proven
METRIC / SIMULATION OVERLAY      ≠ business state or execution policy
FILE EXTENSION                   ≠ authoritative byte-format truth
OBJECT-STATE NODE                ≠ complete state machine
OBJECT NODE OCCURRENCE           ≠ business-object instance identity
LABEL WORDING                    ≠ node type
MERGE / CONVERGENCE              ≠ JOIN / SYNCHRONIZATION
PARALLEL BRANCH                  ≠ same executor / Task Queue
CIRCULAR EVENT SYMBOL            ≠ automatic terminal outcome
CALLBACK INTENT                  ≠ explicit timer / wait
CONTROL-FLOW LOOP                ≠ technical retry or Continue-As-New
CHECK / VALIDATE WORK            ≠ state-changing side effect
DIAGRAM READING ORDER            ≠ process execution order
AMBIGUOUS LONG CONNECTOR         ≠ license to invent an edge
ACTIVITY FINAL                   ≠ automatic business success
LAST VISIBLE ACTIVITY / NODE     ≠ explicit process completion
```

## Current evidence set

```text
QUARRY-01  Order Process
           sequence + actors + decisions + terminal failure/success

QUARRY-02  Water Order & Delivery
           participant boundary + message + wait + business objects + subprocess + physical work

QUARRY-03  Availability / Procurement / Settlement
           message start + subprocess boundary events + domain exception/escalation + multiple business outcomes

QUARRY-04  Candidate Application Lifecycle
           identity/access gateway + optional pre-processing + shared rejection handling
           + three-way domain decision + explicit SMS channel + retention intent

QUARRY-05  Ward / Pharmacy Drug Fulfillment Collaboration
           participant-local control flows + cross-participant message flows + correlation gap
           + duplicate labels/source identity + local-end-vs-global-completion + missing procurement re-entry

QUARRY-06  Reference Architecture for AI (REFAI)
           artifact-class detection + architecture layers + capability/resource/infrastructure typing
           + executable-slice discovery + feedback topology + simulation/metric overlay separation

QUARRY-07  Order Validation, Payment & Fulfillment
           responsibility partitions + Order [New]/[Placed] state evidence + object/data flow
           + exclusive rejection + explicit parallel split + all-branch synchronization join

QUARRY-08  Multi-Department Call / Complaint / Service Handling
           lane-vs-participant distinction + visible human/user-task markers + repeated decision identity
           + two departmental parallel regions + symmetric m/e branches + callback/re-entry intent
           + event-topology discipline + nonlocal/partially ambiguous cross-lane connectors

QUARRY-09  Proposal Preparation Activity Process
           source-asserted UML notation annotations + guarded decisions + explicit control-flow loop/back-edge
           + three-way parallel fork/join + object-node production + object occurrence vs runtime identity
           + explicit Activity Final evidence

QUARRY-10  Collaborative Order / Stock / Card / Delivery Flow
           Miro workspace/editor plane + collaborator/cursor overlays separated from business graph
           + stock/card guarded decisions + shared cancellation with preserved reason
           + validation-vs-side-effect separation + incomplete cancellation/success termination
           + explicit post-payment failure/compensation gap
```

## Emerging evidence after ten quarries

The Mining Site now has evidence for a broader semantic model. It remains provisional:

```text
SOURCE ARTIFACT CLASS
SOURCE PROVENANCE / BYTE IDENTITY

SOURCE PRESENTATION PLANE
  ├── AUTHORING / WORKSPACE UI
  ├── COLLABORATOR / CURSOR OVERLAY
  ├── NOTATION / ANNOTATION OVERLAY
  └── VISUAL STYLE / COLOR METADATA

SOURCE-ASSERTED SEMANTIC TYPE

PROCESS / PROCESS SCOPE
EXECUTABLE SLICE

ARCHITECTURE LAYER / DOMAIN CONTAINER
PARTICIPANT
ROLE / LANE
ROLE HANDOFF

SOURCE NODE IDENTITY
NODE SEMANTIC TYPE
  ├── STEP / STAGE
  ├── CAPABILITY / SERVICE
  ├── RESOURCE / REPOSITORY / CATALOG / STATE
  ├── INFRASTRUCTURE
  ├── GOVERNANCE WORK
  └── MODEL / BUSINESS ARTIFACT

TASK / EXECUTION HINT
  ├── HUMAN / USER MARKER
  ├── PHYSICAL WORK EVIDENCE
  └── UNKNOWN

EDGE SEMANTIC TYPE
  ├── CONTROL / SEQUENCE
  ├── MESSAGE / COMMUNICATION
  ├── OBJECT / DATA FLOW
  ├── HANDOFF / DEPENDENCY
  ├── FEEDBACK
  └── UNRESOLVED ASSOCIATION

EDGE CONFIDENCE / ENDPOINT CERTAINTY

DECISION + GUARD + BRANCH
MERGE / CONVERGENCE
SHARED HANDLING + ORIGIN REASON
PARALLEL SPLIT / FORK
JOIN / SYNCHRONIZATION
JOIN POLICY
BRANCH COMPLETION PREDICATE

CONTROL-FLOW LOOP / BACK-EDGE
RE-ENTRY TARGET
LOOP EXIT CONDITION

EVENT
  ├── SOURCE SHAPE
  ├── SOURCE-ASSERTED / INFERRED SUBTYPE
  ├── INCOMING / OUTGOING TOPOLOGY
  └── TERMINATION EVIDENCE

WAIT / DEADLINE
CALLBACK / RE-ENTRY INTENT
SUBPROCESS / NESTED WORK
BUSINESS OBJECT / STATE EVIDENCE
OBJECT NODE OCCURRENCE
CONCEPTUAL OBJECT IDENTITY
VALIDATION / CHECK SEMANTICS
SIDE-EFFECT / MUTATION SEMANTICS
BUSINESS OUTCOME
EXCEPTION / ESCALATION
IDENTITY / ACCESS CONDITION
HUMAN / PHYSICAL WORK BOUNDARY
CORRELATION REQUIREMENT
LOCAL MILESTONE VS COLLABORATION COMPLETION
MISSING CONTINUATION / RE-ENTRY
MISSING FAILURE / COMPENSATION TOPOLOGY
SOURCE ANALYTICS / SIMULATION OVERLAY
```

These are evidence-backed hypotheses, not yet a frozen TALOS standard language.

## Current transformation lesson

Q06 established that every source is not necessarily one workflow. Q07 established that workflow-like sources must preserve control/object/concurrency semantics. Q08 added independent treatment for lanes, human-task hints, events and graph uncertainty. Q09 added source-asserted notation semantics and explicit business loops/back-edges. Q10 adds another prerequisite: a captured collaborative canvas may contain **editorial/contextual overlays that look like people, arrows, controls or labels but do not belong to the business process at all**. TALOS must filter the source presentation plane before assigning actor, ownership or control-flow semantics.

```text
INPUT SOURCE
    ↓
ARTIFACT CLASSIFICATION
    ↓
SOURCE GRAPH + PROVENANCE
    ↓
SOURCE PRESENTATION / AUTHORING-LAYER SEPARATION
    ↓
NOTATION / ANNOTATION LAYER EXTRACTION
    ↓
SOURCE-ASSERTED + INFERRED NODE/EDGE TYPING
    ↓
PARTICIPANT / LANE / ROLE / COLLABORATOR CLASSIFICATION
    ↓
CONTROL / OBJECT / MESSAGE / HANDOFF DISTINCTION
    ↓
DECISION + SHARED-HANDLING + LOOP + CONCURRENCY NORMALIZATION
    ↓
EVENT + TASK-MARKER INTERPRETATION
    ↓
OBJECT OCCURRENCE / OBJECT IDENTITY SEPARATION
    ↓
VALIDATION / SIDE-EFFECT DISTINCTION
    ↓
GRAPH-LEVEL UNCERTAINTY + MISSING-FAILURE PRESERVATION
    ↓
EXECUTABLE-SLICE DISCOVERY
    ↓
FOUNDRY SOURCE
    ↓
ONE OR MORE TEMPORAL EXECUTION DESIGNS
```

The standard language remains provisional. Each new quarry should either reinforce existing concepts, expose missing semantics, or challenge an assumption already present in the model.