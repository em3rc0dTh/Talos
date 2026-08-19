# TALOS — Canonical Process Model v0.1

Status: **ARCHITECTURE DRAFT / NEXT MAJOR FREEZE GATE**

## Purpose

The TALOS Canonical Process Model is the semantic normalization layer between heterogeneous business-process sources and executable automation designs.

It must be expressive enough to preserve common process meaning while retaining source-specific semantics and provenance.

## Primary identities

```text
ProcessDefinition
 ├─ id
 ├─ name
 ├─ businessPurpose
 └─ revisions[]

ProcessRevision
 ├─ id
 ├─ processDefinitionId
 ├─ revision
 ├─ createdAt
 ├─ sourceArtifacts[]
 ├─ nodes[]
 ├─ edges[]
 ├─ actors[]
 ├─ variables[]
 ├─ dataObjects[]
 ├─ rules[]
 ├─ annotations[]
 ├─ provenanceLinks[]
 └─ semanticStatus
```

## Node families

The first model should support a small but extensible family of semantic nodes.

### Trigger/Event
Represents something that starts, resumes or influences process execution.

### Action/Task
Represents work performed by a human, system, AI capability or external participant.

### Decision
Represents mutually exclusive or rule-controlled routing.

### Parallel Split
Represents concurrent branches.

### Synchronization/Join
Represents branch coordination requirements.

### Wait
Represents a duration, deadline, external event, human response or other durable pause.

### Human Interaction
Represents review, approval, correction, form completion, upload, signature or other person-driven work.

### Subprocess
Represents a reusable/decomposed process boundary.

### End/Completion
Represents successful, cancelled, rejected, failed or domain-specific completion.

## Edge semantics

Edges must have meaning rather than merely coordinates.

Candidate fields:

```text
ProcessEdge
- id
- sourceNodeId
- targetNodeId
- kind
- condition?
- priority?
- label?
- truthClass
- provenance[]
```

Possible `kind` values include:

```text
SEQUENCE
CONDITIONAL
DEFAULT
PARALLEL
MESSAGE
ERROR
TIMEOUT
COMPENSATION
```

## Actor model

Actors are not limited to humans.

```text
Actor
- id
- kind: HUMAN_ROLE | HUMAN_PERSON | SYSTEM | ORGANIZATION | EXTERNAL_PARTY | AI
- name
- sourceReferences[]
```

## Data model

The process model must distinguish business data from runtime implementation details.

```text
ProcessVariable
- id
- name
- schema?
- sensitivity?
- source?
- producedBy?
- consumedBy[]
```

Data flow should not be represented only as the return value of one task passed to the next.

## Business rules

Conditions should be explicit semantic objects when possible.

```text
BusinessRule
- id
- expression?
- naturalLanguage
- inputs[]
- sourceReferences[]
- truthClass
- unresolvedTerms[]
```

A natural-language rule may exist before an executable expression is available.

Example:

```text
SOURCE_TRUTH:
"Manager approval is required for large invoices."

UNRESOLVED:
What value qualifies as "large"?
```

## Wait model

`Wait` must distinguish different semantics:

```text
DURATION
DEADLINE
EXTERNAL_EVENT
HUMAN_RESPONSE
MESSAGE
CONDITION
SCHEDULE
```

These distinctions later influence Temporal mapping.

## Source-specific semantic extensions

The canonical model must support retained source semantics.

Examples:

```text
PetriNetAnnotation
- place/transition identity
- token semantics
- synchronization evidence

SipocAnnotation
- supplier
- input
- output
- customer

BpmnAnnotation
- original element type/id
- gateway/event subtype
- boundary relationship

VsmAnnotation
- lead time
- process time
- waste/value classification
```

These extensions prevent normalization from destroying meaningful source evidence.

## Provenance requirements

Every node/edge/rule should be capable of carrying:

```text
truthClass
confidence?
sourceArtifactId?
sourceElementRef?
extractionMethod?
confirmedBy?
```

## Semantic status

A `ProcessRevision` may carry aggregate states such as:

```text
CAPTURED
INTERPRETED
CONFLICTED
INCOMPLETE
NORMALIZED
VALIDATED
READY_FOR_AUTOMATION_DESIGN
```

This is distinct from execution/deployment status.

## Execution separation

The canonical model should not directly contain secrets, concrete worker implementations or hard-coded Temporal task queues.

Those belong to later automation/execution models.

## First freeze gate

`CANONICAL PROCESS MODEL v0.1` should not be frozen until we can faithfully model at least these representative source cases:

1. simple sequential flow;
2. exclusive decision;
3. parallel split and join;
4. durable wait;
5. human approval;
6. subprocess;
7. source conflict;
8. SIPOC high-level process that is not executable;
9. Petri Net concurrency semantics;
10. imported BPMN with preserved source IDs;
11. TALOS Canvas-native process;
12. existing automation imported as process evidence.
