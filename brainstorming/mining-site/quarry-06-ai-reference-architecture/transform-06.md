# Quarry 06 — Transform 06

## Objective

Interpret `source-06` without forcing an architecture diagram into a single business workflow, normalize the visible topology into TALOS semantic families, compare the evidence against Quarries 01–05, and prepare `foundry-source-06`.

No executable code is produced here.

## 1. Artifact-class detection comes before workflow normalization

Quarries 01–05 were primarily process/collaboration diagrams. Quarry 06 is materially different: it is explicitly titled `Reference Architecture for AI (REFAI)` and organizes nodes into architecture bands.

Therefore TALOS must first classify the source artifact:

```text
ARTIFACT_CLASS
REFERENCE_ARCHITECTURE_TOPOLOGY
```

before asking which parts represent executable process lifecycles.

Critical rule:

```text
REFERENCE ARCHITECTURE
        ≠
ONE PROCESS INSTANCE
```

If TALOS immediately emitted one Temporal Workflow for the whole image, it would be inventing runtime semantics that the source does not prove.

## 2. Architecture band ≠ participant / role

Visible bands:

```text
AI Application User Level Services
Predictive Modeling & Analytics
Machine Learning Models: ML, DL, RL
Categories: RAI, XAI, CAI
```

They are `SOURCE_TRUTH` as labeled containers.

Canonical type:

```text
ARCHITECTURE_LAYER / DOMAIN_CONTAINER
```

The source does not prove that these are organizations, humans, worker pools, task queues, BPMN participants, or independent Temporal Workflows.

This challenges an unsafe generalization from swimlane quarries: a horizontal/vertical container cannot automatically become `PARTICIPANT` or `ROLE`.

## 3. Node semantic typing must precede Temporal mapping

The diagram mixes nodes that plausibly have different semantic classes:

```text
ML Analytics                       capability/service candidate
Chatbot Services                   capability/service candidate
AI Decisions                       capability/service candidate
Automated Decisions                decision-processing stage candidate
Human-Centered Decisions           human-in-the-loop stage candidate
Approved AI Services               catalog/state/service-set candidate
Knowledge Repository               persistent-resource/service candidate
Message Queue management           infrastructure/service candidate
Machine Learning Models            model artifact/resource family candidate
Feature Engineering                process/work stage candidate
Model Training                     process/work stage candidate
Model Evaluation                   process/work stage candidate
Model Deployment & Monitoring      process/work stage/service candidate
XAI / RAI                          capability/category candidates
```

These classifications are `INFERRED`, not source labels.

New rule:

```text
ROUNDED RECTANGLE
        ≠
BUSINESS ACTIVITY
        ≠
TEMPORAL ACTIVITY
```

TALOS therefore needs a canonical `NODE_SEMANTIC_TYPE` before Foundry execution design.

## 4. User-level decision slice is the strongest workflow candidate

The most workflow-like section is:

```text
START-LIKE EVENT
  ↓
DATA_IDENTIFIER
  ├── ML_ANALYTICS
  ├── CHATBOT_SERVICES
  └── AI_DECISIONS
        ↓ [visible convergence]
AUTOMATED_DECISIONS
  ↓
HUMAN_CENTERED_DECISIONS
  ↓
DECISION_VALIDATION
  ├── NO  → DECISIONS_STOPPED
  └── YES → APPROVED_AI_SERVICES
```

Truth discipline:

- node labels and topology = `SOURCE_TRUTH`;
- the X-marked `Data Identifier` symbol behaving as an exclusive service selector = `INFERRED` from notation/topology;
- one durable request lifecycle = `SUGGESTED` Foundry candidate;
- exact human interaction mechanism = `UNRESOLVED`.

This section reinforces Q03/Q04 evidence that business validation/rejection/stop conditions are domain outcomes, not automatically technical failures.

## 5. Human-centered decision is not automatically an Activity

`Human-Centered Decisions` sits between automated decisions and validation.

Potential Foundry mappings include:

```text
human task + durable wait
Signal / Update interaction
external decision service
Activity that records a decision already made elsewhere
```

The source cannot choose among them.

This reinforces:

```text
HUMAN-CENTERED NODE
        ≠
KNOWN DIGITAL EXECUTION MECHANISM
```

## 6. Approved AI Services may be state/catalog, not work

The `YES` outcome of `Decision Validation` reaches `Approved AI Services` in another architecture band.

The visible topology proves a handoff/dependency. It does not prove that `Approved AI Services` is an activity executed after validation.

Possible semantic interpretations:

```text
approved-service catalog
published-service state
service collection
capability boundary
process stage
```

All remain unresolved.

This gives TALOS another needed distinction:

```text
STATE / RESOURCE / CATALOG NODE
        ≠
PROCESS STEP
```

## 7. Knowledge / governance area is a feedback topology

The predictive-modeling band visibly includes:

```text
Knowledge Discovery
Knowledge Repository
Knowledge reuse
Ethical Agreements
Quality Requirements
Process & Data Mining Services
```

with plus-marked gateways and looping/overlapping connectors.

The strongest safe normalization is not a fabricated linear sequence. It is:

```text
KNOWLEDGE_GOVERNANCE_TOPOLOGY
nodes: source-preserved
edges: source-preserved where direction is visible
exact lifecycle/order: UNRESOLVED
```

This introduces a new graph-level semantic family:

```text
FEEDBACK / DEPENDENCY TOPOLOGY
```

which is different from a process sequence.

## 8. Queue/infrastructure semantics must remain separate

A node explicitly says `Message Queue management`.

That phrase suggests infrastructure, but the source does not define technology or runtime semantics.

TALOS should preserve:

```text
SOURCE LABEL: Message Queue management
INFERRED TYPE: INFRASTRUCTURE / MESSAGING CAPABILITY CANDIDATE
```

and must not automatically convert it into:

```text
Temporal Task Queue
Kafka
RabbitMQ
SQS
n8n
```

New rule:

```text
MESSAGE QUEUE COMPONENT
        ≠
TEMPORAL TASK QUEUE
        ≠
BUSINESS MESSAGE FLOW
```

## 9. ML lifecycle slice is another workflow candidate

A second strongly sequential region is:

```text
MACHINE_LEARNING_MODELS
  ↓
FEATURE_ENGINEERING
  ↓
MODEL_TRAINING
  ↓
X-MARKED GATEWAY
  ├── MODEL_EVALUATION
  └── MODEL_DEPLOYMENT_AND_MONITORING_SERVICES
        ↓
COGNITIVE_CONVERSATIONAL_AI
```

The exact meaning of the split is unresolved. It may be alternative routing, evaluation/deployment paths, or a notation artifact.

The Foundry may later decide this is one model lifecycle, several child lifecycles, or service dependencies. Quarry 06 does not authorize that decision yet.

## 10. AI-category chain may be classification, not runtime sequence

The bottom band visibly connects:

```text
Cognitive/Conversational AI → XAI → RAI → end-like event
```

But the band label contains `Categories`, which weakens any assumption that this is literal business execution order.

Therefore:

```text
EDGE_TOPOLOGY: SOURCE_TRUTH
RUNTIME_SEQUENCE: NOT_PROVEN
```

This is a direct warning against over-reading arrows in architecture sources.

## 11. Metric/simulation overlay is a separate evidence plane

Colored metric badges appear throughout the source.

Canonical representation should separate:

```text
SEMANTIC_GRAPH
        +
SOURCE_ANALYTICS_OVERLAY
```

without merging them.

The overlay may contain simulation/performance evidence, but its legend is absent.

Critical rule:

```text
VISUAL METRIC / SIMULATION BADGE
        ≠
BUSINESS STATE
        ≠
TEMPORAL TIMEOUT / RETRY POLICY
```

This is the strongest new evidence from Q06 for provenance-rich source metadata.

## 12. Foundry decomposition requirement

The whole artifact should not be handed to the Foundry as one normalized linear process.

Instead, `FOUNDRY-SOURCE-06` should expose:

```text
REFERENCE_ARCHITECTURE
  ├── topology + layers
  ├── candidate executable lifecycle A: decision request / validation
  ├── candidate executable lifecycle B: ML model lifecycle
  ├── knowledge/governance feedback topology
  ├── infrastructure/resource nodes
  └── unresolved cross-domain dependencies
```

This adds a new Mining Site transformation step:

```text
ARTIFACT CLASSIFICATION
        ↓
SEMANTIC TYPING
        ↓
EXECUTABLE-SLICE DISCOVERY
        ↓
FOUNDRY SOURCE
```

not merely `diagram → workflow`.

## 13. Comparison with Quarries 01–05

### Reinforced evidence

Q06 reinforces:

- source-node identity;
- decisions and branch outcomes;
- branch convergence;
- human interaction as unresolved execution semantics;
- cross-domain handoffs;
- subprocess/nested-work markers that must not automatically become Child Workflows;
- business stop/approval outcomes distinct from technical failure;
- source notation ≠ execution semantics.

### New / challenged evidence

Q06 introduces or sharply strengthens:

- artifact-class detection before process normalization;
- architecture layer/domain container distinct from participant/role;
- capability/service/resource/infrastructure node typing;
- graph dependency/feedback topology distinct from sequence flow;
- architecture edge distinct from process sequence/message semantics;
- executable-slice discovery inside a larger non-executable architecture;
- metric/simulation overlays as a separate evidence plane;
- file-extension versus byte-signature provenance;
- requirement to avoid one-Workflow-per-diagram assumptions.

## Transform verdict

```text
SOURCE READING                         ✅
ARTIFACT CLASSIFICATION                ✅ REFERENCE_ARCHITECTURE_TOPOLOGY
ARCHITECTURE LAYERS                    ✅
NODE SEMANTIC TYPING                   ✅ PROVISIONAL
DECISION SLICE                         ✅
ML LIFECYCLE SLICE                     ✅ SOURCE-LIMITED
KNOWLEDGE / GOVERNANCE TOPOLOGY        ✅ SOURCE-LIMITED
INFRASTRUCTURE / RESOURCE DISTINCTION  ✅ PROVISIONAL
METRIC OVERLAY SEPARATION              ✅
EXECUTABLE-SLICE DISCOVERY             ✅
WHOLE-DIAGRAM WORKFLOW MAPPING         ⛔ REJECTED AS UNSUPPORTED
TEMPORAL CANDIDATES                    ✅ SUGGESTED
TEMPORAL CODE                          ⛔ NOT NEEDED
```

Quarry 06 materially expands TALOS: the Mining Site must normalize not only business processes but also source artifacts that mix architecture, capabilities, resources, infrastructure, workflow fragments, and analytical overlays.