# Quarry 06 — Source 06 — Reference Architecture for AI

## Source record

- Quarry: `quarry-06-ai-reference-architecture`
- Source ID: `source-06`
- Source type: image / reference-architecture and service-topology diagram with workflow-like notation and metric overlays
- Supplied by: user during TALOS Mining Site working session
- Original uploaded filename: `quarry-06.ppm`
- Original image dimensions: `850 × 469`
- Original file size: `127,371 bytes`
- Original file SHA-256: `75082fb146ec62b74bc8b724314ffdf49cb798ab66f1239f15ba25005c8b00da`
- File-signature observation: the uploaded bytes begin with the PNG signature even though the filename extension is `.ppm`
- Native binary source: exact user-supplied bytes available in the working session; repository binary attachment pending

> The extension/signature mismatch is preserved as provenance. TALOS must not silently rename, transcode, or replace the source while claiming byte identity.

## Visible title and architecture bands

The diagram is titled:

```text
Reference Architecture for AI (REFAI)
```

Four horizontal architecture bands are visibly labeled:

```text
AI Application User Level Services
Predictive Modeling & Analytics
Machine Learning Models: ML, DL, RL
Categories: RAI, XAI, CAI
```

These bands visually organize capabilities. The source does not establish that they are BPMN participants, organizational owners, workers, or Temporal Workflow boundaries.

## Visible user-level decision topology

The top band shows an event-like start followed by an X-marked gateway labeled `Data Identifier`.

From that gateway, three visible branches lead to:

```text
ML Analytics
Chatbot Services
AI Decisions
```

Those branches converge before:

```text
Automated Decisions
  ↓
Human-Centered Decisions
  ↓
Decision Validation
```

`Decision Validation` is another X-marked gateway-like symbol with two visibly labeled outcomes:

```text
No  → Decisions Stopped
Yes → Approved AI Services
```

`Decisions Stopped` is shown with a red end-like event. The `Yes` path crosses into the next architecture band and reaches `Approved AI Services`.

## Visible predictive-modeling / knowledge topology

The `Predictive Modeling & Analytics` band contains these visible nodes:

```text
Approved AI Services
Knowledge Discovery
Knowledge Repository
Knowledge reuse
Ethical Agreements
Quality Requirements
Process & Data Mining Services
Message Queue management
Machine Learning Service
Predict & Forecast Decisions Using Statistical Services
```

Several of the knowledge/governance nodes contain a small plus marker. Plus-marked gateway-like symbols are also visible around this area.

The arrows form a service/knowledge network rather than a simple left-to-right sequence. In particular, visible arrows run from `Approved AI Services` toward `Knowledge Discovery`, from the knowledge area toward `Process & Data Mining Services`, and from there leftward through `Message Queue management`, `Machine Learning Service`, and `Predict & Forecast Decisions Using Statistical Services`.

The rendered image contains overlapping/looping connectors around `Knowledge Repository`, `Knowledge reuse`, `Ethical Agreements`, and `Quality Requirements`; their exact runtime ordering is not proven by the image alone.

## Visible machine-learning lifecycle topology

A downward connector from the statistical prediction area reaches:

```text
Machine Learning Models
  ↓
Feature Engineering
  ↓
Model Training
  ↓
X-marked gateway-like symbol
  ├── Model Evaluation
  └── Model Deployment & Monitoring Services
```

Both visible branches connect toward the lower AI-category area.

## Visible AI-category topology

The bottom band contains:

```text
Cognitive/Conversational AI
  → XAI
  → RAI
  → red end-like event
```

The arrows in this rendered section point from right to left.

## Metric / simulation overlays

Many nodes and connectors have small badges containing colored squares (red, olive/green, yellow/orange) and numeric/time values such as counts and values expressed with `m`.

A small colored badge is also visible at the top right of the diagram.

These overlays are `SOURCE_TRUTH` as visual annotations. Their semantic meaning, units, calculation method, whether they are simulation outputs, performance measures, queue statistics, probabilities, or something else is not defined by a visible legend in this source.

TALOS must preserve them as source metadata without converting them into business state or execution policy.

## Source limitations

The source does not explicitly establish:

- whether the entire artifact represents one process instance, several process lifecycles, or only architectural dependencies;
- whether the horizontal bands are participants, logical layers, capability groups, or deployment tiers beyond their visible labels;
- whether every rounded rectangle is a business activity, software service, capability, subsystem, resource, or process stage;
- the exact notation semantics of the X-marked and plus-marked diamonds;
- whether plus-marked rectangles are collapsed subprocesses or another modeling convention;
- the exact sequencing and interruption semantics of the knowledge/governance loops;
- the meaning of the colored metric badges;
- the identity/correlation key for any durable execution;
- ownership, actors, users, systems, or external integrations for each capability;
- retry, timeout, cancellation, compensation, idempotency, or failure semantics;
- whether `Message Queue management` represents infrastructure, a business task, or both;
- whether `Knowledge Repository` is a persistent resource, service, process stage, or all of those in different contexts;
- whether `Approved AI Services` is a catalog/state, an activity, a service collection, or a milestone;
- whether the bottom RAI/XAI/CAI chain is runtime flow, architectural classification, or capability dependency.

Those gaps must remain explicit during transformation.