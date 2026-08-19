# TALOS — System Architecture v0.1

Status: **ARCHITECTURE DRAFT / ACTIVE**

## Architectural objective

Build a system where heterogeneous business-process sources can converge into one standard semantic model **without erasing source-specific truth**, and where only validated semantic revisions can become durable execution plans.

## High-level architecture

```text
┌──────────────────────────────────────────────────────┐
│                PROCESS EXPRESSION                    │
│                                                      │
│ BPMN / UPN / UML / EPC / Petri / SIPOC / VSM       │
│ Bizagi / Mermaid / draw.io / Image / Text           │
│ Existing Workflow / TALOS Canvas                    │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│              SOURCE ADAPTER LAYER                    │
│                                                      │
│ Parser / Vision / Importer / Existing-System Adapter │
│                                                      │
│ Output: SourceArtifact + Candidate Semantic Graph    │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│            PROCESS INTELLIGENCE LAYER                │
│                                                      │
│ Semantic interpretation                              │
│ Provenance mapping                                   │
│ Confidence                                           │
│ Conflict detection                                   │
│ Gap analysis                                         │
│ Suggestions                                          │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│           TALOS CANONICAL PROCESS MODEL              │
│                                                      │
│ ProcessDefinition                                    │
│ ProcessRevision                                      │
│ Nodes / edges / actors / data / events               │
│ Source-specific semantic annotations                 │
│ Provenance + truth classes                           │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│             SEMANTIC VALIDATION                      │
│                                                      │
│ Control-flow validity                                │
│ Data requirements                                    │
│ Human/system ownership                               │
│ Unresolved ambiguity                                 │
│ Execution-readiness rules                            │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│             AUTOMATION DESIGN                        │
│                                                      │
│ Capability binding                                   │
│ Human task design                                    │
│ Forms                                                │
│ AI capabilities                                      │
│ Retry / timeout / idempotency / compensation         │
│ Temporal mapping                                     │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│               EXECUTION PLAN                         │
│                                                      │
│ Versioned + validated + explainable                  │
│ Bound to one ProcessRevision                         │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│             TEMPORAL EXECUTION                       │
│                                                      │
│ Workflows / Activities / Signals / Updates           │
│ Timers / Child Workflows / Nexus / Compensation     │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│             CAPABILITIES / REAL WORLD                │
│                                                      │
│ Humans / Forms / APIs / DB / Gmail / Drive / n8n    │
│ ERP / CRM / AI / MCP / SaaS / Internal Systems      │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│               OBSERVABILITY                          │
│                                                      │
│ Execution history / provenance / outcomes            │
│ Designed-vs-observed process evidence                │
└──────────────────────────────────────────────────────┘
```

## Boundary 1 — Source adapters

Each source type should have an independent adapter.

Examples:

```text
BpmnAdapter
ImageProcessAdapter
UpnAdapter
UmlActivityAdapter
EpcAdapter
PetriNetAdapter
SipocAdapter
VsmAdapter
MermaidAdapter
DrawIoAdapter
NaturalLanguageAdapter
StepFunctionsAdapter
N8nAdapter
TalosCanvasAdapter
```

Adapters must not directly emit Temporal code.

Their responsibility ends after producing:

1. preserved source artifact;
2. source element identities where available;
3. candidate semantic elements;
4. extraction confidence;
5. source-specific annotations.

## Boundary 2 — Canonical semantics

The canonical model is the architectural heart of TALOS.

No source format is canonical.

No runtime is canonical.

The process semantics are canonical.

This creates the required decoupling:

```text
SOURCE A ─┐
SOURCE B ─┼→ TALOS MODEL → EXECUTION TARGET A
SOURCE C ─┘              → EXECUTION TARGET B (future)
```

Temporal is the first and intended durable target, but the semantic model must not be identical to Temporal implementation details.

## Boundary 3 — Automation design

The canonical business process and the execution plan are separate.

Example business semantic:

```text
Notify customer
```

Possible bindings:

```text
Gmail.send
Twilio.sendSms
WhatsApp.sendTemplate
InternalNotification.send
n8n.invoke(notification-flow)
```

Changing a capability binding should not rewrite the historical source/process meaning unless the user intentionally edits that meaning.

## Boundary 4 — Temporal runtime

Temporal owns durable orchestration behavior after deployment.

TALOS owns:

- process truth;
- standardization;
- design;
- compilation/mapping;
- capability contracts;
- explainability;
- provenance;
- deployment lineage.

Temporal owns runtime durability, workflow history and task execution semantics.

## Boundary 5 — AI

AI may participate in:

- source perception;
- semantic interpretation;
- gap detection;
- design suggestion;
- workflow explanation.

AI must not bypass canonical validation or provenance.

## Runtime mutation rule

A running workflow must be traceable to an immutable `DeploymentRevision`.

Editing the process creates a new revision; it does not silently mutate historical runtime meaning.

## Security boundary

Secrets belong to capability/runtime configuration, not the canonical business-process source.

Process artifacts may reference required credentials symbolically, but secret values must not be embedded into process definitions or prompts by default.

## Architectural anti-corruption rule

Source-specific parser models, UI graph structures and Temporal runtime structures must not leak across boundaries as if they were the TALOS domain model.

Explicit mapping layers are required.
