# TALOS — Canvas Native Source Contract v0.2

Status: **DESIGN CANDIDATE / T2-01 REGRESSION TARGET**  
Date: **2026-08-19**  
Supersedes for active T2-01 design: `05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.1.md`  
Historical v0.1 remains preserved.

## Why v0.2 exists

The first T2-01 pressure test produced:

```text
C01–C20
18 PASS
 2 FAIL
```

The Canvas-specific failure was:

```text
C03 — incomplete/dangling branch intent
```

v0.1 required both relationship endpoints, which would force a user to fabricate a target merely to save an incomplete process.

That violates frozen Semantic Validation v0.2, whose purpose includes preserving incomplete meaning and producing findings/questions rather than silently repairing it.

v0.2 therefore adds first-class incomplete endpoint semantics while retaining every successful v0.1 rule.

---

# 1. Fundamental invariants

```text
TALOS CANVAS SOURCE              ≠ CANONICAL PROCESS MODEL
CANVAS ELEMENT ID                ≠ CANONICAL ELEMENT ID
CANVAS REVISION                  ≠ PROCESS REVISION AUTOMATICALLY
CANVAS SCREENSHOT                ≠ NATIVE CANVAS REPRESENTATION
CANVAS LAYOUT                    ≠ PROCESS SEMANTICS BY DEFAULT
VISUAL PROXIMITY                 ≠ RELATIONSHIP
VISUAL CONTAINMENT               ≠ OWNERSHIP UNLESS STRUCTURED
USER-SELECTED COMPONENT TYPE     = NATIVE SOURCE TRUTH
USER-ENTERED LITERAL TEXT        = NATIVE SOURCE TRUTH
MISSING VALUE                    ≠ UNKNOWN VALUE
UNKNOWN VALUE                    ≠ ERROR AUTOMATICALLY
CANVAS EDIT                      ≠ SILENT MUTATION
PRESENTATION-ONLY EDIT           ≠ SEMANTIC CHANGE AUTOMATICALLY
DANGLING RELATIONSHIP            ≠ INVALID SOURCE INPUT
INCOMPLETE SOURCE RELATIONSHIP   ≠ FABRICATED CANONICAL EDGE
```

---

# 2. Native provenance lineage

```text
SourceOrigin
  originKind = TALOS_NATIVE
  mediumKind = TALOS_CANVAS
        ↓
CanvasDefinition
        ↓
CanvasRevision
        ↓
SourceCapture(CANVAS_NATIVE)
        ↓
SourceRepresentation(NATIVE_STRUCTURED)
        ↓
SourceOccurrence / EvidenceFragment
        ↓
TalosCanvasAdapter
        ↓
SemanticClaim / ProvenanceLink
        ↓
Canonical ProcessRevision candidate
        ↓
ValidationAssessment
```

Rendered PNG/SVG/PDF representations are secondary `PREVIEW`/`DERIVATIVE` evidence.

---

# 3. CanvasDefinition

```text
CanvasDefinition
- id
- sourceOriginId
- title?
- description?
- createdAt
- createdBy?
- latestRevisionId
- lifecycleStatus?
```

Graph state lives in immutable revisions.

---

# 4. CanvasRevision

```text
CanvasRevision
- id
- canvasDefinitionId
- revisionNumber
- parentRevisionId?
- createdAt
- createdBy?
- revisionKind
- changeSetId
- elementSnapshots[]
- relationshipSnapshots[]
- containerMemberships[]
- presentationSnapshot?
- semanticDigest
- nativeRepresentationDigest
- digestAlgorithmVersion
- notes?
```

`revisionKind`:

```text
SEMANTIC
PRESENTATION
MIXED
```

A presentation-only edit creates a new source revision but need not create a new `ProcessRevision` when `semanticDigest` is unchanged.

---

# 5. Stable identity and revision-local source occurrences

```text
CanvasElementIdentity
- id
- canvasDefinitionId
- createdInRevisionId
- retiredInRevisionId?
```

```text
CanvasElementSnapshot
- snapshotId
- canvasElementId
- canvasRevisionId
- kind
- label
- description?
- propertyValues{}
- actorRefs[]
- dataRefs[]
- ruleRefs[]
- sourceMetadata?
```

A stable source element can have many immutable snapshots.

Each interpreted revision receives revision-scoped `SourceOccurrence` evidence.

```text
stable element identity
      ≠
revision-local occurrence
```

---

# 6. Native element kinds

Initial T2-01 vocabulary:

```text
TRIGGER
ACTION
DECISION
PARALLEL_SPLIT
JOIN
WAIT
HUMAN_INTERACTION
SUBPROCESS
STATE
END
ACTOR
DATA_OBJECT
BUSINESS_RULE
ANNOTATION
GROUP
```

The user selecting one of these native component types is source truth for TALOS Canvas notation.

It still maps through `TalosCanvasAdapter` to separate canonical identities.

---

# 7. Property-state model

```text
CanvasPropertyValue<T>
- state
- value?
- literalText?
- unit?
- notes?
```

`state`:

```text
SET
UNKNOWN
NOT_APPLICABLE
```

Property absence means the component schema did not supply that property.

Therefore:

```text
absent
≠ UNKNOWN
≠ NOT_APPLICABLE
```

This distinction is preserved into claims/validation where material.

---

# 8. Core element details

## TRIGGER

```text
triggerKind:
MANUAL | FORM | MESSAGE | WEBHOOK | SCHEDULE | FILE | BUSINESS_EVENT | SOURCE_DEFINED | UNKNOWN
```

## ACTION

```text
actionIntent
actorRefs[]
inputRefs[]
outputRefs[]
ruleRefs[]
sideEffectClass?: READ_ONLY | STATE_CHANGING | EXTERNAL_SIDE_EFFECT | UNKNOWN
```

## DECISION

```text
decisionMode:
EXCLUSIVE | INCLUSIVE | EVENT_BASED | SOURCE_DEFINED | UNKNOWN
ruleRefs[]
```

## JOIN

```text
joinPolicy:
ALL | ANY | N_OF_M | SOURCE_DEFINED | UNKNOWN
requiredCount?
```

## WAIT

```text
waitKind:
DURATION | DEADLINE | SCHEDULE | MESSAGE | EXTERNAL_EVENT | HUMAN_RESPONSE | CONDITION | SOURCE_DEFINED | UNKNOWN

duration?
deadline?
timezone?
eventDescriptor?
resumeCondition?
```

## HUMAN_INTERACTION

```text
interactionKind:
APPROVAL | REVIEW | CORRECTION | FORM | UPLOAD | SIGNATURE | CHOICE | INFORMATION_REQUEST | SOURCE_DEFINED | UNKNOWN

actorRefs[]
requestedDataRefs[]
outcomes[]
dueConstraint?
```

## SUBPROCESS

```text
subprocessIntent
referencedCanvasDefinitionId?
referencedProcessDefinitionId?
boundaryMeaning:
EMBEDDED | REFERENCED | EXTERNAL | SOURCE_DEFINED | UNKNOWN
```

## STATE

```text
stateKind:
BUSINESS_STATE | MILESTONE | RESOURCE_STATE | SOURCE_DEFINED | UNKNOWN
businessObjectRef?
```

## END

```text
outcomeKind:
SUCCESS | REJECTED | CANCELLED | FAILED | DOMAIN_OUTCOME | SOURCE_DEFINED | UNKNOWN

domainOutcome?
```

ACTOR, DATA_OBJECT and BUSINESS_RULE retain the v0.1 business-oriented fields and map to canonical non-process families.

No element chooses Temporal/provider implementation.

---

# 9. Relationship identity

```text
CanvasRelationshipIdentity
- id
- canvasDefinitionId
- createdInRevisionId
- retiredInRevisionId?
```

A relationship has stable native identity independent from its revision-local snapshot.

---

# 10. CanvasEndpointRef — new in v0.2

A relationship endpoint may be complete or intentionally incomplete.

```text
CanvasEndpointRef
- state
- elementId?
- notes?
```

`state`:

```text
SET
UNKNOWN
UNCONNECTED
```

Semantics:

### SET

```text
elementId required
```

The author has explicitly connected the endpoint.

### UNKNOWN

The author expresses that an endpoint/business target exists conceptually but is currently unknown.

### UNCONNECTED

The relationship is visually/authorially started but not yet connected to a source element.

Neither `UNKNOWN` nor `UNCONNECTED` is an invalid source state.

---

# 11. CanvasRelationshipSnapshot — revised in v0.2

```text
CanvasRelationshipSnapshot
- snapshotId
- canvasRelationshipId
- canvasRevisionId
- kind
- sourceEndpoint
- targetEndpoint
- label?
- guard?
- relationshipProperties{}
```

where:

```text
sourceEndpoint: CanvasEndpointRef
targetEndpoint: CanvasEndpointRef
```

Initial kinds:

```text
CONTROL_FLOW
CONDITIONAL_FLOW
DEFAULT_FLOW
PARALLEL_FLOW
MESSAGE_RELATIONSHIP
DATA_ASSOCIATION
RESPONSIBILITY_RELATIONSHIP
RULE_BINDING
SUBPROCESS_RELATIONSHIP
ANNOTATION_RELATIONSHIP
SOURCE_DEFINED
```

---

# 12. Dangling branch example

A valid native Canvas revision may contain:

```text
DECISION Approved?

relationship R-YES
  sourceEndpoint = SET(Approved?)
  targetEndpoint = SET(Continue)
  guard = YES

relationship R-NO
  sourceEndpoint = SET(Approved?)
  targetEndpoint = UNKNOWN
  guard = NO
```

This is a valid source graph.

Talos has learned:

```text
NO branch exists       SOURCE_TRUTH
NO branch guard        SOURCE_TRUTH
NO target              unresolved
```

It has not learned:

```text
NO → Reject
NO → End
NO → Retry
```

---

# 13. Canonical bridge for incomplete relationships

Frozen Canonical Process Model v0.1 requires a complete `ProcessEdge` with source and target IDs.

T2-01 does not reopen that contract.

Therefore:

```text
complete native relationship
→ eligible for canonical ProcessEdge mapping
```

while:

```text
incomplete native relationship
→ preserve SourceOccurrence
→ preserve relationship SemanticClaims
→ create ProvenanceLink(s)
→ attach/source-link a source semantic extension or decision-level claim
→ DO NOT fabricate ProcessEdge
→ allow T1-03 finding SV-CFL-002 BRANCH_TARGET_UNRESOLVED
```

A validation finding can target the canonical decision/source-linked semantic subject while citing the incomplete native relationship as evidence.

When a later Canvas revision connects the relationship, the later ProcessRevision may contain the completed canonical edge.

---

# 14. Guard semantics

```text
CanvasGuard
- literalText?
- ruleRef?
- semanticState
```

`semanticState`:

```text
SET
UNKNOWN
NOT_APPLICABLE
```

An unresolved guard may coexist with complete endpoints.

An unresolved endpoint may coexist with a known guard.

Endpoint certainty and guard certainty are independent.

---

# 15. Structured membership

```text
CanvasContainerMembership
- id
- canvasRevisionId
- containerElementId
- memberElementId
- membershipKind
```

Kinds:

```text
VISUAL_GROUP
RESPONSIBILITY_SCOPE
SUBPROCESS_SCOPE
ANNOTATION_SCOPE
SOURCE_DEFINED
```

Structured membership outranks geometry.

`VISUAL_GROUP` is not process semantics.

---

# 16. Presentation and collaboration planes

Presentation remains separate:

```text
CanvasPresentationSnapshot
- nodeLayouts[]
- edgeRoutes[]
- viewport?
- zoom?
- styleTokens[]?
- orderingHints[]?
```

Editor/collaboration state may include:

```text
comments
selection
cursor/presence
view state
undo/redo metadata
```

Rules:

```text
CURSOR              ≠ ACTOR
PROXIMITY           ≠ OWNERSHIP
EDITOR CHROME       ≠ PROCESS NODE
COLOR               ≠ SEMANTIC TYPE BY DEFAULT
```

---

# 17. ChangeSet

```text
CanvasChangeSet
- id
- canvasDefinitionId
- baseRevisionId
- resultingRevisionId
- authoredBy?
- authoredAt
- operations[]
```

Operations:

```text
ADD_ELEMENT
UPDATE_ELEMENT_PROPERTY
RETIRE_ELEMENT
ADD_RELATIONSHIP
UPDATE_RELATIONSHIP_PROPERTY
RETIRE_RELATIONSHIP
CONNECT_RELATIONSHIP_ENDPOINT
DISCONNECT_RELATIONSHIP_ENDPOINT
MARK_ENDPOINT_UNKNOWN
ADD_MEMBERSHIP
REMOVE_MEMBERSHIP
UPDATE_PRESENTATION
SOURCE_DEFINED
```

v0.2 explicitly records endpoint completion/uncertainty changes as source edits.

---

# 18. Semantic digest

```text
nativeRepresentationDigest
```

fingerprints the full deterministic native representation.

```text
semanticDigest
```

fingerprints only fields eligible to affect canonical meaning.

A dangling relationship is semantic and contributes to `semanticDigest` even though it cannot yet become a complete canonical edge.

Example:

```text
R-NO target UNKNOWN
```

becoming:

```text
R-NO target SET(Cancel order)
```

changes the semantic digest.

---

# 19. Deterministic Canvas mapping

Initial native kinds map through a versioned mapping registry:

```text
TRIGGER             → EVENT
ACTION              → ACTION
DECISION            → DECISION
PARALLEL_SPLIT      → PARALLEL_SPLIT
JOIN                → JOIN
WAIT                → WAIT
HUMAN_INTERACTION   → HUMAN_INTERACTION
SUBPROCESS          → SUBPROCESS
STATE               → STATE
END                 → END
```

Relationships map when semantically complete:

```text
CONTROL_FLOW        → SEQUENCE
CONDITIONAL_FLOW    → CONDITIONAL
DEFAULT_FLOW        → DEFAULT
PARALLEL_FLOW       → PARALLEL
```

Every mapping has transformation/provenance records.

---

# 20. Semantic vs presentation revisions

```text
CanvasRevision N
  ↓ presentation-only
CanvasRevision N+1
semanticDigest unchanged
```

may reuse the same accepted ProcessRevision semantic lineage.

```text
CanvasRevision N
  ↓ semantic edit
CanvasRevision N+1
semanticDigest changed
```

requires re-adaptation and a new ProcessRevision candidate when accepted semantics change.

---

# 21. Clarification lifecycle

```text
CanvasRevision 4
NO target = UNKNOWN
        ↓
ProcessRevision 7
        ↓
Assessment A
SV-CFL-002
        ↓
Question: What happens on NO?
        ↓
ClarificationResponse: Cancel order
        ↓
explicit application command
        ↓
CanvasChangeSet
CONNECT_RELATIONSHIP_ENDPOINT(R-NO, CancelOrder)
        ↓
CanvasRevision 5
        ↓
ProcessRevision 8
        ↓
Assessment B
```

Nothing in revision/assessment A is mutated.

---

# 22. Retirement

Deleting from the current view retires the stable identity in a later revision.

Historical snapshots/source occurrences remain available.

Historical provenance must never depend on what is currently visible.

---

# 23. Native serialization envelope

```text
TalosCanvasNativeSource
- schemaVersion
- canvasDefinition
- canvasRevision
- elements[]
- relationships[]
- containerMemberships[]
- semanticDigestAlgorithmVersion
- nativeDigestAlgorithmVersion
```

Wire format remains a later implementation decision.

---

# 24. T2-01 anti-goals

Do not:

- use UI-library nodes as the domain/source schema;
- use canonical IDs as native Canvas IDs;
- require complete relationships before saving;
- manufacture placeholder END nodes;
- interpret coordinates when explicit structure exists;
- generate Temporal primitives;
- make presentation-only edits semantic;
- erase retired nodes/edges from history;
- convert `UNKNOWN` into defaults;
- treat screenshot preview as native source.

---

# 25. Regression target

v0.2 must pass the full C01–C20 suite, especially:

```text
C03 dangling branch intent
```

while preserving all prior passes.

T2-01 BUILD remains closed until full regression succeeds and the tested contracts are frozen.
