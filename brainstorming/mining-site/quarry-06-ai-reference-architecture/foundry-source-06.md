# Quarry 06 — Foundry Source 06

## Status

`FOUNDRY-SOURCE-06` is the standardized semantic artifact emitted by `TRANSFORM-06`.

Unlike earlier quarries, this source is not normalized as one business workflow. It is a reference-architecture topology containing several possible executable slices plus non-process architecture components.

It is not Temporal code, not a deployment revision, and not executable truth.

## Source identity

```text
artifact: Reference Architecture for AI (REFAI)
quarry: quarry-06-ai-reference-architecture
source: source-06
transform: transform-06
foundry-source: foundry-source-06
artifact-class: REFERENCE_ARCHITECTURE_TOPOLOGY
execution-readiness: NOT_READY_AS_SINGLE_WORKFLOW
```

## Architecture layers

```text
LAYER-01  AI Application User Level Services
LAYER-02  Predictive Modeling & Analytics
LAYER-03  Machine Learning Models: ML, DL, RL
LAYER-04  Categories: RAI, XAI, CAI
```

These are architecture containers. No Temporal Workflow/Task Queue/Worker ownership is implied.

## Canonical topology A — decision request / validation slice

This is the strongest candidate for a durable process lifecycle:

```text
START_LIKE_EVENT
  ↓
DATA_IDENTIFIER
  ↓
SERVICE_SELECTION / ROUTING
  ├── ML_ANALYTICS
  ├── CHATBOT_SERVICES
  └── AI_DECISIONS
        ↓ [convergence]
AUTOMATED_DECISIONS
  ↓
HUMAN_CENTERED_DECISIONS
  ↓
DECISION_VALIDATION
  ├── NO
  │     ↓
  │   COMPLETE
  │   source outcome: DECISIONS_STOPPED
  │
  └── YES
        ↓
      HANDOFF_TO_APPROVED_AI_SERVICES
```

### Truth state

- labels/topology = `SOURCE_TRUTH`
- service-selection semantics at `Data Identifier` = `INFERRED`
- one durable workflow per request/decision = `SUGGESTED`
- exact human interaction and validation implementation = `UNRESOLVED`

## Canonical topology B — approved-services / knowledge / analytics fabric

Visible architecture nodes:

```text
APPROVED_AI_SERVICES
KNOWLEDGE_DISCOVERY
KNOWLEDGE_REPOSITORY
KNOWLEDGE_REUSE
ETHICAL_AGREEMENTS
QUALITY_REQUIREMENTS
PROCESS_AND_DATA_MINING_SERVICES
MESSAGE_QUEUE_MANAGEMENT
MACHINE_LEARNING_SERVICE
PREDICT_AND_FORECAST_DECISIONS_USING_STATISTICAL_SERVICES
```

The source contains directed dependencies and loops among these nodes.

TALOS handoff classification:

```text
TOPOLOGY_TYPE: KNOWLEDGE_ANALYTICS_FEEDBACK_GRAPH
EXECUTION_ORDER: PARTIALLY_UNRESOLVED
```

The Foundry must not convert the graph into a fabricated sequence.

### Provisional node types

```text
Approved AI Services                  STATE/CATALOG/SERVICE-SET candidate
Knowledge Discovery                   CAPABILITY/PROCESS-STAGE candidate
Knowledge Repository                  RESOURCE/SERVICE candidate
Knowledge reuse                       CAPABILITY/SUBPROCESS candidate
Ethical Agreements                    GOVERNANCE WORK candidate
Quality Requirements                  GOVERNANCE WORK candidate
Process & Data Mining Services        SERVICE/CAPABILITY candidate
Message Queue management              INFRASTRUCTURE/SERVICE candidate
Machine Learning Service              SERVICE candidate
Predict & Forecast ...                SERVICE/CAPABILITY candidate
```

All types above are `INFERRED` and remain reviewable.

## Canonical topology C — model lifecycle slice

```text
MACHINE_LEARNING_MODELS
  ↓
FEATURE_ENGINEERING
  ↓
MODEL_TRAINING
  ↓
GATEWAY_LIKE_SPLIT
  ├── MODEL_EVALUATION
  └── MODEL_DEPLOYMENT_AND_MONITORING_SERVICES
        ↓ [visible downstream convergence/dependency]
COGNITIVE_CONVERSATIONAL_AI
```

This is a second executable-lifecycle candidate, but the split semantics and artifact ownership are incomplete.

Potential process meaning:

```text
model artifact
  ↓
prepare features
  ↓
train
  ↓
evaluate / deploy-monitor path
  ↓
consume/expose model through AI capability
```

This is a normalization hypothesis, not source truth.

## Canonical topology D — AI category/capability chain

```text
COGNITIVE_CONVERSATIONAL_AI
  → XAI
  → RAI
  → END_LIKE_EVENT
```

Because the source band is labeled `Categories`, the Foundry must treat this as architecture/capability topology until runtime ordering is independently confirmed.

## Source analytics overlay

Quarry 06 carries a separate overlay plane:

```text
SOURCE_ANALYTICS_OVERLAY
- colored badges
- numeric counts
- minute-like values
- per-node / per-edge placement
- semantics: UNKNOWN
```

Foundry instruction:

```text
DO NOT map overlay numbers automatically to:
- Workflow timeout
- Activity timeout
- retry interval
- SLA
- queue depth
- business KPI
- state probability
```

until the overlay legend/semantics are confirmed.

## Foundry decomposition candidates

The Foundry should evaluate separate execution boundaries rather than one monolithic Workflow.

### Candidate 1 — `DecisionRequestWorkflow`

Possible scope:

```text
identify/rout request
  ↓
invoke selected AI capability
  ↓
automated decision
  ↓
human-centered review/decision
  ↓
validation
  ├── stopped
  └── approved/published handoff
```

Potential Temporal concepts later:

- Workflow per decision request;
- Activities for external AI/service calls where appropriate;
- Signal/Update/human-task boundary for human-centered decision;
- deterministic branch for validation result;
- domain result `DECISIONS_STOPPED`, not technical failure.

### Candidate 2 — `ModelLifecycleWorkflow`

Possible scope:

```text
model input/artifact
  ↓
feature engineering
  ↓
training
  ↓
evaluation
  ↓
deployment/monitoring transition
```

Potential Temporal concepts later:

- long-running Activities or Child Workflows for training/evaluation/deployment;
- external ML platform integrations;
- artifact/version correlation;
- monitoring as another durable lifecycle rather than a synchronous Activity.

No implementation choice is authorized yet.

### Candidate 3 — knowledge/governance orchestration

The knowledge/governance region may contain executable processes, but the source topology is too ambiguous to define one safely.

Status:

```text
KNOWLEDGE_GOVERNANCE_WORKFLOW
candidate: POSSIBLE
source support: INSUFFICIENT FOR BOUNDARY/ORDER
```

## Non-workflow architecture candidates

The Foundry should explicitly allow some source nodes to remain architecture/resources rather than Workflow nodes:

```text
Knowledge Repository
Approved AI Services
Message Queue management
Machine Learning Models
XAI / RAI category nodes
```

depending on later confirmation.

## Critical rules introduced/reinforced

```text
REFERENCE ARCHITECTURE
      ≠
ONE TEMPORAL WORKFLOW

ARCHITECTURE LAYER
      ≠
PARTICIPANT / ROLE / TASK QUEUE

SERVICE / CAPABILITY BOX
      ≠
TEMPORAL ACTIVITY

RESOURCE / REPOSITORY / CATALOG
      ≠
PROCESS STEP

MESSAGE QUEUE COMPONENT
      ≠
TEMPORAL TASK QUEUE
      ≠
BUSINESS MESSAGE FLOW

ARCHITECTURE EDGE
      ≠
SEQUENCE FLOW UNTIL PROVEN

FEEDBACK TOPOLOGY
      ≠
SINGLE PROCESS LOOP UNTIL INSTANCE SEMANTICS ARE PROVEN

METRIC / SIMULATION OVERLAY
      ≠
EXECUTION POLICY
```

## Foundry questions

Before executable Temporal design, resolve:

1. Is REFAI intended as runtime process notation, architecture dependency notation, simulation model, or a mixture?
2. What exact semantics do the X-marked and plus-marked gateways carry in this artifact?
3. What do the colored metric badges represent?
4. What event/request creates one user-level decision lifecycle?
5. What does `Data Identifier` identify and what data drives its branch selection?
6. Are `ML Analytics`, `Chatbot Services`, and `AI Decisions` mutually exclusive service routes, concurrent capabilities, or categories?
7. What evidence completes `Automated Decisions`?
8. Who performs `Human-Centered Decisions`, and how is the response observed digitally?
9. What validates a decision and what produces `YES` versus `NO`?
10. What exactly is `Approved AI Services`: state, catalog, service set, process stage, or system?
11. What are the authoritative ordering/dependency semantics among Knowledge Discovery, Knowledge Repository, Knowledge reuse, Ethical Agreements, and Quality Requirements?
12. Is `Message Queue management` an infrastructure component or executable business work?
13. What model/artifact identifier correlates feature engineering, training, evaluation, deployment and monitoring?
14. Does model evaluation precede deployment, run alternatively, or represent another architecture relation?
15. Does `Cognitive/Conversational AI → XAI → RAI` represent runtime transformation or capability classification/dependency?
16. Which candidate slices deserve independent durable Workflow identities?
17. What cross-slice events/messages/correlation keys connect those workflows?
18. What retry, timeout, cancellation, idempotency and observability semantics apply only after architecture nodes are correctly typed?

## Handoff verdict

```text
SOURCE PROVENANCE                    ✅
ARTIFACT CLASS                       ✅ REFERENCE_ARCHITECTURE_TOPOLOGY
ARCHITECTURE LAYERS                  ✅
DECISION LIFECYCLE CANDIDATE         ✅
MODEL LIFECYCLE CANDIDATE            ✅
KNOWLEDGE FEEDBACK GRAPH             ✅ SOURCE-LIMITED
NODE SEMANTIC TYPES                  🟡 PROVISIONAL
EDGE SEMANTIC TYPES                  🟡 PARTIAL
ANALYTICS OVERLAY                    ✅ PRESERVED / UNINTERPRETED
WHOLE-ARTIFACT WORKFLOW              ⛔ NOT SUPPORTED
EXECUTABLE WORKFLOW BOUNDARIES       🟡 UNRESOLVED
TEMPORAL CANDIDATES                  ✅ SUGGESTED
TEMPORAL CODE                        ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-06` is ready for comparison with later quarries. Its central contribution is that TALOS must discover executable slices inside heterogeneous architecture sources rather than assuming every source diagram is itself a workflow.