# TALOS — Canonical Process Model v0.1

Status: **FROZEN / T1-01 CLOSED**  
Freeze date: **2026-08-18**

## Purpose

The TALOS Canonical Process Model is the semantic normalization layer between heterogeneous business-process sources and later automation/execution design.

Its job is to create a shared, standardized representation of process meaning **without erasing origin, notation-specific evidence, uncertainty, conflict, or non-executable business context**.

The canonical model is not BPMN, not Temporal, not a UI graph and not an integration schema.

It is the semantic contract that allows TALOS to say:

```text
SOURCE
  ↓
SOURCE-AWARE INTERPRETATION
  ↓
CANONICAL TALOS PROCESS REVISION
  ↓
VALIDATION
  ↓
OPTIONAL AUTOMATION DESIGN
```

## Fundamental invariant

> TALOS may normalize and standardize process meaning. TALOS may not erase where that meaning came from.

A canonical element therefore has a TALOS identity while retaining provenance to one or more source artifacts and source elements/evidence.

---

# 1. Model layers

A canonical process revision is composed from six related layers:

```text
1. PROCESS IDENTITY + REVISION
2. SEMANTIC GRAPH
3. ACTORS + DATA + RULES
4. CLAIMS + PROVENANCE + CONFLICT
5. SOURCE-SPECIFIC EXTENSIONS
6. SEMANTIC / EXECUTION READINESS STATE
```

These layers are related but deliberately not collapsed into one structure.

---

# 2. Primary identities

## ProcessDefinition

Identifies the logical business process across revisions.

```text
ProcessDefinition
- id
- canonicalName
- businessPurpose?
- lifecycleStatus?
- revisionIds[]
```

## ProcessRevision

Represents one immutable semantic interpretation of a process.

```text
ProcessRevision
- id
- processDefinitionId
- revision
- createdAt
- parentRevisionIds[]
- derivationKind
- sourceArtifactIds[]
- nodes[]
- edges[]
- actors[]
- variables[]
- dataObjects[]
- rules[]
- semanticClaims[]
- conflictRecords[]
- annotations[]
- provenanceLinks[]
- sourceExtensions[]
- semanticStatus
- executionReadiness
- validationFindingRefs[]
```

`derivationKind` may include:

```text
IMPORT
NORMALIZATION
CANVAS_EDIT
SOURCE_MERGE
CONFLICT_RESOLUTION
HUMAN_CONFIRMATION
SYSTEM_DERIVATION
```

A revision is immutable after it becomes an accepted semantic artifact. New interpretation or confirmation creates another revision.

---

# 3. Semantic graph

The graph represents process meaning rather than drawing geometry or source serialization order.

## ProcessNode

```text
ProcessNode
- id
- kind
- name?
- description?
- actorRefs[]
- inputRefs[]
- outputRefs[]
- ruleRefs[]
- details?
- truthClass
- executionReadiness?
- provenanceRefs[]
- sourceExtensionRefs[]
- metadata?
```

## Node kinds

The v0.1 core supports:

```text
EVENT
ACTION
DECISION
PARALLEL_SPLIT
JOIN
WAIT
HUMAN_INTERACTION
SUBPROCESS
STATE
END
```

### EVENT

Represents something that starts, resumes, interrupts or otherwise influences a process.

Common event semantics may include:

```text
START
MESSAGE
TIMER
SIGNAL
CONDITION
EXTERNAL_EVENT
DOMAIN_EVENT
```

Event subtype remains source-aware where a notation carries richer semantics.

### ACTION

Represents business work performed by a human, system, AI capability, external party or mixed responsibility.

An `ACTION` describes **what the business process says happens**, not the concrete integration used to implement it.

### DECISION

Represents rule-controlled routing.

```text
DecisionDetails
- routingMode: EXCLUSIVE | INCLUSIVE | EVENT_BASED | SOURCE_DEFINED
- ruleRefs[]
```

Decision branches are represented by semantic edges whose conditions reference `BusinessRule` objects when possible.

### PARALLEL_SPLIT

Represents concurrent activation of multiple process branches.

It must not be interpreted as simple sequential ordering.

### JOIN

Represents synchronization or reconvergence.

```text
JoinDetails
- joinPolicy: ALL | ANY | N_OF_M | SOURCE_DEFINED
- requiredCount?
- sourceSemantics?
```

Examples:

```text
parallel synchronization → ALL
exclusive branch merge   → ANY
custom quorum            → N_OF_M
```

### WAIT

Represents an intentional durable pause in business-process semantics.

```text
WaitDetails
- waitKind
- resumeSemantics?
- duration?
- deadline?
- eventDescriptor?
- actorRefs[]?
- ruleRef?
```

`waitKind` values:

```text
DURATION
DEADLINE
EXTERNAL_EVENT
HUMAN_RESPONSE
MESSAGE
CONDITION
SCHEDULE
SOURCE_DEFINED
```

`resumeSemantics` may remain business-language or unresolved information until later validation/automation design.

### HUMAN_INTERACTION

Represents work that requires participation by a person or human role.

```text
HumanInteractionDetails
- interactionKind
- actorRefs[]
- requestedDataRefs[]
- outcomes[]
- dueConstraintRef?
```

Initial `interactionKind` vocabulary:

```text
APPROVAL
REVIEW
CORRECTION
FORM
UPLOAD
SIGNATURE
CHOICE
INFORMATION_REQUEST
SOURCE_DEFINED
```

Human interaction semantics do not imply a Temporal Signal/Update yet. That mapping belongs to the execution model.

### SUBPROCESS

Represents decomposition or invocation of another process boundary.

```text
SubprocessDetails
- subprocessMode: EMBEDDED | REFERENCED | EXTERNAL
- processDefinitionRef?
- processRevisionRef?
- sourceBoundaryRef?
```

The canonical model does not decide whether a referenced subprocess later becomes a Child Workflow, Nexus operation, API call or another implementation.

### STATE

Represents a meaningful business/process state or milestone that should not be forced into an action.

```text
StateDetails
- stateKind: BUSINESS_STATE | MILESTONE | PETRI_PLACE | RESOURCE_STATE | SOURCE_DEFINED
```

`PETRI_PLACE` exists so Petri-Net place/state semantics can survive normalization without being misrepresented as ordinary tasks.

### END

Represents a process outcome.

```text
EndDetails
- outcome: SUCCESS | REJECTED | CANCELLED | FAILED | DOMAIN_OUTCOME
- domainOutcome?
```

---

# 4. Edge semantics

Edges represent semantic relationships, not merely arrows or coordinates.

```text
ProcessEdge
- id
- sourceNodeId
- targetNodeId
- kind
- conditionRuleRef?
- priority?
- label?
- truthClass
- provenanceRefs[]
- sourceExtensionRefs[]
```

Core v0.1 edge kinds:

```text
SEQUENCE
CONDITIONAL
DEFAULT
PARALLEL
MESSAGE
ERROR
TIMEOUT
COMPENSATION
REPEAT
CANCEL
ESCALATION
TOKEN_FLOW
SOURCE_DEFINED
```

`TOKEN_FLOW` is intentionally distinct from `SEQUENCE`. It allows Petri-Net arcs to preserve token-flow meaning rather than being flattened into workflow ordering.

---

# 5. Actors

Actors are not limited to individual humans.

```text
Actor
- id
- kind
- name
- role?
- organizationRef?
- sourceReferences[]
- provenanceRefs[]
```

Actor kinds:

```text
HUMAN_ROLE
HUMAN_PERSON
SYSTEM
ORGANIZATION
EXTERNAL_PARTY
AI
MIXED
UNKNOWN
```

An unknown actor is representable. Unknown is preferable to invented responsibility.

---

# 6. Data and variables

TALOS must distinguish business data from runtime implementation details.

## ProcessVariable

```text
ProcessVariable
- id
- name
- schema?
- sensitivity?
- source?
- producedByRefs[]
- consumedByRefs[]
- provenanceRefs[]
```

## DataObject

```text
DataObject
- id
- name
- kind?
- schema?
- businessMeaning?
- sourceReferences[]
- provenanceRefs[]
```

Data flow must not depend on the simplistic pattern:

```text
return value of Task A → argument of Task B
```

because business processes may contain parallelism, human input, messages, shared state and external events.

---

# 7. Business rules

A business rule may be known semantically before it is executable.

```text
BusinessRule
- id
- naturalLanguage
- expression?
- inputs[]
- outputs[]?
- truthClass
- unresolvedTerms[]
- provenanceRefs[]
```

Example:

```text
SOURCE_TRUTH:
"Manager approval is required for large invoices."

UNRESOLVED:
What value qualifies as "large"?
```

TALOS must preserve the rule without inventing a threshold.

---

# 8. Semantic claims

Process sources may make statements about the same semantic subject from different perspectives.

A first-class claim model is therefore required.

```text
SemanticClaim
- id
- subjectRef
- propertyPath
- value
- perspective
- truthClass
- confidence?
- provenanceRefs[]
- supersedesClaimRefs[]?
```

## Evidence perspective

`perspective` answers **what kind of evidence this source provides**, independently of truth class.

```text
BUSINESS_INTENT
IMPLEMENTED_BEHAVIOR
OPERATIONAL_OBSERVATION
ANALYTIC_MODEL
DESIGN_SUGGESTION
SOURCE_DEFINED
```

This distinction is critical when importing existing automations.

For example:

```text
perspective: IMPLEMENTED_BEHAVIOR
value: "retry five times"
```

must not silently become:

```text
perspective: BUSINESS_INTENT
value: "policy requires five retries"
```

---

# 9. Conflict records

Contradictory source evidence must be represented explicitly.

```text
ConflictRecord
- id
- subjectRef
- propertyPath
- claimRefs[]
- resolutionStatus
- selectedClaimRef?
- resolvedValue?
- rationale?
- resolvedBy?
- resolvedAt?
```

`resolutionStatus`:

```text
UNRESOLVED
RESOLVED
DEFERRED
```

Example:

```text
Source A → approval threshold = 10000
Source B → approval threshold = 5000
```

Both source claims remain preserved even after a later human-authorized resolution.

Conflict resolution must never erase contradictory historical evidence.

---

# 10. Provenance

Every meaningful canonical element must be capable of tracing back to evidence.

`ProvenanceLink` is formalized in the provenance contract, but the canonical model requires at least:

```text
ProvenanceLink
- id
- processElementRef
- sourceArtifactId
- sourceElementRef?
- evidenceType
- extractionMethod
- confidence?
- truthClass
- perspective?
- interpreterVersion?
- confirmedBy?
- confirmedAt?
```

## Truth classes

```text
SOURCE_TRUTH
INFERRED
SUGGESTED
CONFIRMED
EXECUTABLE
```

Truth class is not confidence.

Truth class is not execution readiness.

Evidence perspective is not truth class.

These dimensions must remain distinct.

---

# 11. Source-specific extensions

Normalization is not allowed to destroy meaningful source semantics that do not safely map into the shared vocabulary.

```text
SourceSemanticExtension
- id
- notation
- extensionType
- sourceArtifactId
- sourceElementRefs[]
- payload
- preservationClass
```

Possible `preservationClass` values:

```text
SEMANTIC
ANALYTIC
VISUAL_CONTEXT
EXECUTION_EVIDENCE
UNKNOWN
```

## BPMN extension examples

Preserve where supplied:

```text
original BPMN element ID/type
gateway subtype
event subtype
pool/lane ownership
boundary-event relationship
extension metadata
```

## Petri Net extension examples

Preserve:

```text
place identity
transition identity
arc identity
initial marking
token assumptions
synchronization evidence
```

Canonical shared meaning may use `STATE(PETRI_PLACE)` and `TOKEN_FLOW`, while the full notation-specific evidence remains in the extension.

## SIPOC extension examples

Preserve:

```text
supplier
input
process
output
customer
process boundary context
```

Not every SIPOC element must become an executable graph node.

## VSM extension examples

Preserve:

```text
lead time
process time
waiting/inventory
value/waste classification
observed vs target process context
```

## UPN extension examples

Preserve:

```text
hierarchical action structure
actor/context wording
trigger/result relationship
source text hierarchy
```

---

# 12. Semantic status vs execution readiness

A useful business-process model may be valid and truthful while still not containing enough information for automation.

These concepts therefore remain separate.

## SemanticStatus

```text
CAPTURED
INTERPRETED
CONFLICTED
INCOMPLETE
NORMALIZED
VALIDATED
```

## ExecutionReadiness

```text
NOT_ASSESSED
INSUFFICIENT_DETAIL
BLOCKED_BY_CONFLICT
NEEDS_CONFIRMATION
SEMANTICALLY_COMPLETE
READY_FOR_AUTOMATION_DESIGN
```

Examples:

```text
truthClass: SOURCE_TRUTH
semanticStatus: NORMALIZED
executionReadiness: INSUFFICIENT_DETAIL
```

is valid for a high-level SIPOC model.

Likewise:

```text
truthClass: INFERRED
confidence: 0.98
executionReadiness: NEEDS_CONFIRMATION
```

is valid for an AI interpretation.

No dimension silently promotes another.

---

# 13. Validation findings boundary

The canonical model may reference semantic validation findings:

```text
validationFindingRefs[]
```

but v0.1 does not define the complete validation engine.

That belongs to T1-03.

The canonical model only guarantees that findings can point to stable process elements, rules, claims, conflicts and source evidence.

---

# 14. Execution separation

The canonical process model must not directly contain:

- secrets;
- provider credentials;
- concrete Temporal task queues;
- worker implementation code;
- provider SDK clients;
- hard-coded Gmail/n8n/Drive bindings;
- Temporal retry configuration merely because an existing automation happens to use it.

Those belong to later `Capability`, `ExecutionPlan` and `DeploymentRevision` contracts.

Example:

```text
CANONICAL ACTION
"Send customer confirmation"
```

may later bind to:

```text
Gmail
n8n
internal notification service
custom API
```

without changing the underlying business-process meaning.

---

# 15. Canonical identity vs source identity

Canonical identity and source identity are intentionally separate.

Example:

```text
canonical node id:
node-72f...

source:
BPMN element Activity_0ugvqse
```

The TALOS node may participate in standardized semantics while provenance still answers exactly where it originated.

This rule applies equally to native TALOS Canvas elements.

TALOS does not exempt its own UI from source/revision discipline.

---

# 16. Freeze evidence

The model was pressure-tested against the twelve T1-01 fixtures documented in:

```text
test/01-CANONICAL-PROCESS-MODEL-PRESSURE-TEST-v0.1.md
```

Gate results:

```text
01 Simple sequence                         PASS
02 Exclusive decision                      PASS
03 Parallel split + join                   PASS
04 Durable wait                            PASS
05 Human approval                          PASS
06 Subprocess                              PASS
07 Source conflict                         PASS
08 SIPOC incomplete process                PASS
09 Petri Net concurrency                   PASS
10 BPMN source-ID preservation             PASS
11 Native TALOS Canvas                     PASS
12 Existing automation evidence            PASS
```

The pressure test resulted in explicit additions for:

- join policy;
- structured wait semantics;
- human interaction details;
- subprocess modes;
- SemanticClaim;
- evidence perspective;
- ConflictRecord;
- execution readiness;
- STATE/PETRI_PLACE;
- TOKEN_FLOW.

---

# 17. v0.1 freeze boundary

`CANONICAL PROCESS MODEL v0.1` is now **FROZEN**.

Frozen does not mean universal or complete.

It means:

> This is the minimum canonical semantic contract proven against the initial twelve fixtures. Future semantics discovered by adapters or real process evidence must be introduced through an explicit new version rather than silently changing v0.1.

The next gate is:

```text
T1-02 — Provenance Model
```

That gate must fully formalize `SourceArtifact`, `ProvenanceLink`, `SemanticClaim`, evidence perspective, conflicts, human confirmation and transformation lineage.

**BUILD remains closed.**
