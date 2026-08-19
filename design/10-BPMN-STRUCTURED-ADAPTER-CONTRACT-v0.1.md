# TALOS — BPMN Structured Adapter Contract v0.1

Status: **DESIGN CANDIDATE / P2-02 PRESSURE-TEST TARGET**  
Date: **2026-08-19**

## Purpose

Define how an external BPMN model enters TALOS through the frozen source-agnostic intake architecture.

BPMN is the first Phase-2 source family where:

```text
source is external
source is natively structured
source carries explicit notation semantics
source IDs are usually available
layout/DI is separately encoded
one definitions document may contain multiple semantic scopes
```

The adapter must preserve BPMN-specific truth without treating BPMN as the TALOS canonical model and without compiling directly to Temporal.

---

# 1. Fundamental invariants

```text
BPMN SOURCE MODEL                  ≠ TALOS CANONICAL MODEL
BPMN ELEMENT ID                   ≠ CANONICAL ELEMENT ID
BPMN PROCESS                      ≠ TEMPORAL WORKFLOW AUTOMATICALLY
BPMN TASK                         ≠ TEMPORAL ACTIVITY AUTOMATICALLY
BPMN SERVICE TASK                 ≠ PROVEN PROVIDER / ACTIVITY IMPLEMENTATION
BPMN USER TASK                    ≠ TEMPORAL UPDATE / SIGNAL AUTOMATICALLY
BPMN PARTICIPANT                  ≠ BPMN LANE
BPMN PARTICIPANT                  ≠ TEMPORAL WORKFLOW AUTOMATICALLY
BPMN LANE                         ≠ MESSAGE BOUNDARY
SEQUENCE FLOW                     ≠ MESSAGE FLOW
DATA ASSOCIATION                  ≠ CONTROL FLOW
BPMN DI / COORDINATES             ≠ PROCESS SEMANTICS
GATEWAY TYPE                      ≠ CANONICAL ROLE WITHOUT TOPOLOGY/CONTEXT
BOUNDARY EVENT                    ≠ FREE-STANDING EVENT
CALL ACTIVITY                     ≠ EMBEDDED SUBPROCESS
EVENT SUBPROCESS                  ≠ ORDINARY SUBPROCESS
BPMN isExecutable=true            ≠ TALOS READY_FOR_AUTOMATION_DESIGN
EXTENSION ELEMENT                 ≠ BUSINESS INTENT AUTOMATICALLY
VALID BPMN XML                    ≠ COMPLETE BUSINESS PROCESS
INVALID/INCOMPLETE BPMN           ≠ SOURCE LOSS
UNSUPPORTED BPMN CONSTRUCT        ≠ LICENSE TO DROP EVIDENCE
```

---

# 2. Source provenance profile

Recommended source profile:

```text
SourceOrigin
  originKind = DIGITAL_NATIVE_ARTIFACT
  mediumKind = BPMN_FILE

SourceCapture
  captureMethod = DIRECT_UPLOAD | CONNECTOR_FETCH | API_IMPORT | SOURCE_DEFINED

SourceArtifact
  artifactClass = PROCESS_DIAGRAM | COLLABORATION_DIAGRAM | SOURCE_DEFINED

SourceRepresentation
  representationKind = NATIVE_DIGITAL
```

Parsed structures are derived interpretation/extraction artifacts, not replacement source bytes.

Extraction mode:

```text
STRUCTURED_PARSE
```

---

# 3. BpmnAdapterAttempt

Uses frozen `AdapterAttempt`.

Recommended adapter identity:

```text
adapterId = BpmnAdapter
adapterVersion = versioned
extractionMode = STRUCTURED_PARSE
```

Input fingerprint must include:

```text
source representation digest
adapter/version
BPMN mapping registry version
canonical model version where mapping depends on it
semantic parser configuration digest
```

Parser failure never deletes or replaces preserved BPMN bytes.

---

# 4. Definitions-level source identity

One BPMN XML document is addressed as a source artifact/representation and may contain a `definitions` root with multiple semantic objects.

Preserve at minimum when supplied:

```text
definitions id?
targetNamespace
namespaces/prefix mappings
imports
exporter/exporterVersion where available
expressionLanguage/typeLanguage where supplied
root elements
BPMN DI sections
extension elements
```

Document-level metadata is source evidence, not canonical process semantics automatically.

---

# 5. BpmnSourceOccurrence

The adapter creates source occurrences for notation elements rather than mapping XML nodes directly into canonical IDs.

Conceptual specialization:

```text
BpmnSourceOccurrence
- sourceOccurrenceId
- sourceArtifactId
- sourceRepresentationId
- nativeBpmnId?
- bpmnElementType
- namespaceUri
- localName
- parentNativeId?
- processNativeId?
- collaborationNativeId?
- participantNativeId?
- laneNativeIds[]
- sourcePlaneRef
- literalName?
- attributes{}
- referenceDescriptors[]
- extensionFragmentRefs[]
- diFragmentRefs[]
```

`nativeBpmnId` is preserved exactly where supplied.

TALOS source occurrence identity remains independently scoped even if the source is malformed or an element lacks a usable ID.

---

# 6. BPMN reference descriptors

BPMN semantics frequently use ID/QName references rather than containment alone.

```text
BpmnReferenceDescriptor
- id
- ownerSourceOccurrenceId
- propertyName
- literalReference
- referenceKind
- resolutionState
- resolvedSourceOccurrenceRef?
- externalNamespace?
- evidenceFragmentRefs[]
```

`resolutionState`:

```text
RESOLVED_LOCAL
RESOLVED_IMPORTED
UNRESOLVED
EXTERNAL_NOT_AVAILABLE
INVALID
SOURCE_DEFINED
```

Examples:

```text
participant.processRef
callActivity.calledElement
boundaryEvent.attachedToRef
messageFlow.sourceRef / targetRef
sequenceFlow.sourceRef / targetRef
lane.flowNodeRef
messageEventDefinition.messageRef
errorEventDefinition.errorRef
escalationEventDefinition.escalationRef
signalEventDefinition.signalRef
default flow refs
```

An unresolved reference remains source evidence + diagnostic; it is not silently repaired.

---

# 7. Evidence planes

Minimum separation:

```text
BUSINESS_GRAPH
RESPONSIBILITY_COLLABORATION
OBJECT_DATA
NOTATION_ANNOTATION / EXTENSION_METADATA
AUTHORING_CONTEXT where applicable
```

BPMN DI is preserved as presentation/structural visual evidence, not business flow truth.

Recommended source-specific plane:

```text
BPMN_DI_PRESENTATION
```

may remain `SOURCE_DEFINED` if the frozen common plane enum is not reopened.

---

# 8. BPMN DI

Preserve when supplied:

```text
BPMNDiagram
BPMNPlane
BPMNShape
BPMNEdge
Bounds
waypoints
labels
isHorizontal/isExpanded/participantBandKind where applicable
```

Rules:

```text
BPMNShape bounds       ≠ lane ownership by geometry
BPMNEdge waypoint      ≠ semantic edge endpoint authority when source refs exist
visual order           ≠ execution order
color/style extension  ≠ semantic type by default
```

Structured semantic references outrank DI geometry.

---

# 9. Candidate semantic scopes

One BPMN definitions document may produce 0..N candidate scopes.

Candidates may include:

```text
PROCESS_CANDIDATE per process
COLLABORATION per collaboration
PARTICIPANT_LOCAL_PROCESS per participant with processRef
EXECUTABLE_SLICE_CANDIDATE where source supports a meaningful region
NON_EXECUTABLE_CONTEXT for unsupported conversation/choreography/context regions
SOURCE_DEFINED
```

Rules:

```text
one definitions document ≠ one process
one collaboration         ≠ one workflow
one participant           ≠ one workflow automatically
```

---

# 10. Participants, pools and lanes

## Participant

Preserve:

```text
participant id/name
processRef?
participant multiplicity where supplied
collaboration membership
```

A participant may be black-box (no processRef).

Participant is a collaboration boundary candidate, not a canonical actor/workflow boundary automatically.

## Lane

Preserve:

```text
lane id/name
flowNodeRef[]
childLaneSet?
partitionElement/ref where supplied
```

Lane membership is responsibility evidence.

It does not automatically mean:

```text
participant
message boundary
system
person
Temporal Task Queue
```

---

# 11. Flow-node source typing

Preserve exact BPMN element type before canonical interpretation.

Major families include:

```text
EVENTS
ACTIVITIES
GATEWAYS
```

Source element type is `SOURCE_TRUTH` when structurally parsed from the native model.

Canonical role remains a separate interpretation/mapping decision.

---

# 12. Tasks

Preserve exact task subtype where supplied:

```text
task
userTask
manualTask
serviceTask
businessRuleTask
scriptTask
sendTask
receiveTask
```

Initial canonical candidate rules:

```text
task/businessRuleTask/serviceTask/scriptTask/sendTask/receiveTask
→ ACTION candidate with BPMN subtype extension

userTask/manualTask
→ HUMAN_INTERACTION or ACTION candidate depending source semantics
```

Do not infer provider/runtime mechanism merely from subtype.

Examples:

```text
serviceTask
≠ Temporal Activity automatically

userTask
≠ Signal/Update/form automatically
```

BPMN implementation/configuration attributes/extensions are preserved separately.

---

# 13. Subprocess families

Distinguish at source level:

```text
subProcess
transaction
adHocSubProcess
callActivity
```

Also preserve:

```text
triggeredByEvent
loop characteristics
multi-instance characteristics
completion conditions
ordering flags where supplied
```

Canonical `SUBPROCESS` may be a candidate, but source subtype/behavior must survive in extension semantics.

Rules:

```text
callActivity.calledElement
≠ embedded subprocess body

triggeredByEvent=true
≠ normal inline subprocess

transaction
≠ generic subprocess after normalization without preserved transaction semantics
```

---

# 14. Gateway semantics

Preserve exact gateway subtype:

```text
exclusiveGateway
inclusiveGateway
parallelGateway
eventBasedGateway
complexGateway
```

Preserve:

```text
gatewayDirection
incoming refs
outgoing refs
default flow ref where applicable
instantiate/event gateway attributes where applicable
activationCondition for complex gateway where supplied
```

Important:

```text
GATEWAY SUBTYPE
      +
GATEWAY DIRECTION / TOPOLOGY
      +
FLOW CONDITIONS
→ canonical routing/synchronization candidate
```

Do not map every gateway blindly to `DECISION`.

Examples:

```text
exclusive diverging → DECISION candidate
exclusive converging → merge/JOIN(ANY) candidate
parallel diverging  → PARALLEL_SPLIT candidate
parallel converging → JOIN(ALL) candidate
inclusive diverging → DECISION(INCLUSIVE) candidate
inclusive converging → source-aware synchronization/merge candidate
eventBasedGateway   → DECISION(EVENT_BASED) candidate
complexGateway      → SOURCE_DEFINED / preserved source extension unless safely normalized
```

Mixed/unspecified direction may require topology inference + validation.

---

# 15. Sequence flow

Preserve:

```text
id
sourceRef
targetRef
name?
conditionExpression?
isImmediate? where supplied
```

Also preserve owning gateway/task default-flow reference separately.

Candidate canonical relationships:

```text
ordinary sequenceFlow       → SEQUENCE
conditionExpression present → CONDITIONAL candidate
default referenced flow     → DEFAULT candidate
```

But malformed/unresolved refs prevent fabrication of a complete canonical edge.

Expression language/text is evidence; TALOS does not execute arbitrary expressions during intake.

---

# 16. Message flow

Preserve separately:

```text
messageFlow id/name
sourceRef
targetRef
messageRef?
collaboration context
```

Invariant:

```text
MESSAGE FLOW ≠ SEQUENCE FLOW
```

Message flow is collaboration communication evidence.

Payload/correlation/runtime delivery semantics may remain unresolved.

---

# 17. Events

Preserve event structural class:

```text
startEvent
endEvent
intermediateCatchEvent
intermediateThrowEvent
boundaryEvent
```

Preserve all event definitions supplied, including source-specific/multiple forms.

Common event-definition families may include:

```text
message
timer
error
escalation
signal
conditional
link
compensate
cancel
terminate
multiple / parallel multiple semantics
source-defined
```

Do not infer business success from `endEvent` alone.

Canonical EVENT/WAIT/END interpretation depends on event class, event definition, context and flow role.

---

# 18. Boundary events

Boundary events require first-class attachment preservation.

Preserve:

```text
boundaryEvent id/name
attachedToRef
cancelActivity
incoming/outgoing where supplied
eventDefinition(s)
```

Rules:

```text
BOUNDARY EVENT
      ≠
FREE-STANDING EVENT

cancelActivity=false
      ≠
interrupting behavior
```

Attachment semantics and interrupting/non-interrupting behavior must remain traceable even if canonical v0.1 cannot encode every BPMN nuance directly.

Use source-specific extensions/claims rather than losing semantics.

---

# 19. Start/intermediate/end interpretation discipline

Examples:

```text
message startEvent
→ EVENT START + MESSAGE source semantics candidate

timer intermediateCatchEvent
→ WAIT/TIMER candidate

message intermediateCatchEvent
→ WAIT/MESSAGE or EVENT candidate

intermediateThrowEvent
→ event emission/source semantic candidate

endEvent
→ END/termination candidate
```

Exact business outcome may remain unresolved.

BPMN event type never authorizes Temporal mapping at P2-02.

---

# 20. Data/object semantics

Preserve at minimum where supplied:

```text
dataObject / dataObjectReference
dataStoreReference
property
inputOutputSpecification
dataInput / dataOutput
dataInputAssociation / dataOutputAssociation
association
textAnnotation
```

Rules:

```text
DATA ASSOCIATION      ≠ control flow
DATA OBJECT           ≠ process action
TEXT ANNOTATION       ≠ process node
ASSOCIATION           ≠ sequence flow
```

Canonical `DataObject`, variables and source extensions may receive safe mappings without inventing runtime persistence.

---

# 21. Conditions and expressions

Preserve literal expression body, declared expression type/language and source location when available.

Do not:

```text
evaluate arbitrary script/expression during intake
convert provider expression directly to canonical executable truth
assume expression is business policy rather than implementation syntax
```

Canonical `BusinessRule` may retain natural/expression evidence with unresolved terms.

---

# 22. Extension elements / vendor metadata

Preserve extension elements as source-specific evidence.

Examples may include execution/vendor configuration, forms, connectors, job types, retries or implementation metadata.

Default interpretation discipline:

```text
extension metadata
→ source evidence
→ often IMPLEMENTED_BEHAVIOR or SOURCE_DEFINED perspective
→ not BUSINESS_INTENT automatically
```

Unsupported extensions must survive as opaque/structured source fragments where safely possible.

---

# 23. BPMN execution flags vs TALOS readiness

Preserve source attributes such as:

```text
process.isExecutable
```

but:

```text
BPMN isExecutable=true
      ≠
TALOS READY_FOR_AUTOMATION_DESIGN
```

TALOS readiness still comes from frozen Semantic Validation v0.2.

---

# 24. Unsupported BPMN semantic families

The initial adapter may encounter constructs beyond its normalized vocabulary, including choreography/conversation/global elements or vendor-specific extensions.

Rules:

```text
preserve source occurrence
preserve source type/attributes/references
classify candidate scope/context
emit diagnostic if normalization unsupported
retain source extension/claim evidence
DO NOT drop
DO NOT fabricate nearest canonical type
```

A source may therefore produce:

```text
0 canonical process scopes
+
valid preserved BPMN evidence
```

---

# 25. Invalid/incomplete BPMN

Source preservation occurs before parse/semantic success.

Possible states:

```text
well-formed + supported
well-formed + partially supported
well-formed + unresolved references
not schema/semantic valid but partially parseable
XML parse failure
```

Use `AdapterAttempt`:

```text
SUCCEEDED
PARTIAL
FAILED
```

with diagnostics.

Never silently insert missing targets, IDs, end events, message correlations or gateway branches.

---

# 26. Canonical mapping discipline

Mappings are versioned and property-scoped.

Examples:

```text
BPMN userTask
source type = SOURCE_TRUTH
canonical HUMAN_INTERACTION = candidate/normalized meaning
Temporal mechanism = unresolved
```

and:

```text
BPMN boundary timer
source attachment/type/cancelActivity = SOURCE_TRUTH
canonical WAIT/EVENT representation = mapping candidate
full boundary behavior = source extension if core cannot express it
```

Every mapping produces transformation/provenance records.

---

# 27. Canvas review compatibility

Any BPMN evidence/meaning must be projectable through frozen Canvas Review / Projection v0.2.

This includes:

```text
canonical process nodes/edges
source-only unsupported BPMN constructs
message-flow evidence
boundary-event source semantics
extension metadata
validation findings
conflicts/inferences
```

Canvas rendering must not turn BPMN-specific source semantics into TALOS-native source provenance.

Reviewer corrections create review-authored lineage as already frozen.

---

# 28. P2-02 pressure-test target

The initial BPMN adapter contract must survive at minimum:

```text
B01 exact native IDs + independent canonical IDs
B02 multiple processes in one definitions document
B03 collaboration + participant + processRef
B04 lanes vs participants
B05 sequence flow vs message flow
B06 exclusive gateway split vs merge role
B07 parallel split + synchronization
B08 event-based/inclusive/complex gateway preservation
B09 message/timer/error/escalation event semantics
B10 boundary event attachment + interrupting flag
B11 subprocess vs call activity vs event subprocess
B12 data objects/associations vs control flow
B13 condition expressions/default flows
B14 BPMN DI vs semantic graph
B15 vendor extension metadata / implemented behavior
B16 isExecutable vs TALOS readiness
B17 unsupported construct survives as evidence
B18 unresolved/cross-document references
B19 malformed/partial BPMN preserves source + diagnostics
B20 BPMN evidence projects to Canvas review without provenance transfer
```

BUILD remains closed throughout P2-02.
