# TALOS — Canvas Native Source Contract v0.1

Status: **DESIGN CANDIDATE / T2-01**  
Date: **2026-08-19**

## Purpose

This contract answers the first T2-01 question:

> If a user draws directly inside TALOS, what exact native structured source must the Canvas produce so that Canonical Process Model v0.1, Provenance v0.3 and Semantic Validation v0.2 work without giving TALOS' own UI any special exception?

The answer is:

> **The Canvas emits an immutable native source graph revision. It does not emit the canonical model directly, and a rendered screenshot is never the authoritative Canvas source when the native structure exists.**

The Canvas is therefore a **source producer**. `TalosCanvasAdapter` remains a real adapter boundary.

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
```

TALOS must apply the same origin/provenance discipline to its own Canvas that it applies to BPMN, photographs, external canvases and automations.

---

# 2. Native lineage

A process created in TALOS Canvas has this provenance shape:

```text
SourceOrigin
  originKind = TALOS_NATIVE
  mediumKind = TALOS_CANVAS
        ↓
CanvasDefinition
        ↓
CanvasRevision N
        ↓
SourceCapture
  captureMethod = CANVAS_NATIVE
        ↓
SourceRepresentation
  representationKind = NATIVE_STRUCTURED
        ↓
SourceOccurrence / EvidenceFragment
        ↓
TalosCanvasAdapter
        ↓
SemanticClaim / ProvenanceLink
        ↓
Canonical ProcessRevision
        ↓
ValidationAssessment
```

A PNG/SVG/PDF render may coexist as a `PREVIEW` or `DERIVATIVE`, but it never outranks the native structured representation for source identity/semantics.

---

# 3. CanvasDefinition

`CanvasDefinition` is the logical identity of one user-authored Canvas process across revisions.

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

The definition is not a mutable graph. Graph state lives in immutable revisions.

---

# 4. CanvasRevision

Every accepted Canvas change creates an immutable native source revision.

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
- notes?
```

`revisionKind`:

```text
SEMANTIC
PRESENTATION
MIXED
```

### Important revision rule

A Canvas move/resize/color change may create a new Canvas source revision while leaving the business meaning unchanged.

Therefore:

```text
CanvasRevision N
        ↓ presentation-only edit
CanvasRevision N+1

semanticDigest unchanged
```

may legitimately map to the same accepted `ProcessRevision`.

By contrast:

```text
change branch guard
add/remove process node
change actor assignment
change wait meaning
change business outcome
```

changes the semantic digest and requires adapter re-normalization and, when accepted, a new `ProcessRevision`.

This prevents visual editing from manufacturing meaningless canonical revisions while still preserving complete Canvas source history.

---

# 5. Stable element identity vs revision-local occurrence

The Canvas needs two identity levels.

## `CanvasElementIdentity`

Stable logical source identity across revisions:

```text
CanvasElementIdentity
- id
- canvasDefinitionId
- createdInRevisionId
- retiredInRevisionId?
```

If the same logical box survives an edit, its stable element identity survives.

## `CanvasElementSnapshot`

Immutable state of that element in one Canvas revision:

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

The corresponding provenance `SourceOccurrence` is revision-scoped and may point to the stable `canvasElementId` as its source element reference.

Rule:

```text
stable Canvas identity
      ≠
revision-local source occurrence
```

This allows TALOS to answer both:

- "Is this still the same box the user created earlier?"
- "What exactly did that box say in revision 12?"

---

# 6. Native element kinds

The initial controlled Canvas vocabulary is business-oriented and deliberately bounded.

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

These are **native source types**, not canonical IDs and not Temporal types.

Because the user deliberately selected a Canvas component type, the type is `SOURCE_TRUTH` for the TALOS Canvas notation.

Canonical mapping may be deterministic for the initial vocabulary, but still occurs through `TalosCanvasAdapter`.

### Why `ANNOTATION` and `GROUP` exist

Not every visible Canvas object belongs in the business-process graph.

```text
ANNOTATION
```

may carry user notes/evidence without becoming a process node.

```text
GROUP
```

is visual/organizational unless an explicit structured semantic relationship says otherwise.

---

# 7. Property values: SET vs UNKNOWN vs absent

Canvas authors must be able to say "I do not know" without TALOS silently treating that as a parse error or inventing a value.

For material semantic properties use:

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

If a property is not present at all, it means the Canvas component/schema did not supply that property.

Therefore:

```text
property absent
      ≠
property explicitly UNKNOWN
```

Examples:

```text
WAIT.timezone = UNKNOWN
```

means the user explicitly left the timezone unresolved.

```text
ACTION.timezone = absent
```

means timezone does not apply to that Action schema.

---

# 8. Element detail contracts

## TRIGGER

```text
triggerKind:
MANUAL | FORM | MESSAGE | WEBHOOK | SCHEDULE | FILE | BUSINESS_EVENT | SOURCE_DEFINED | UNKNOWN

eventDescriptor?
scheduleExpression?
actorRefs[]?
dataRefs[]?
```

A trigger type is business/source semantics. It does not select a Temporal start mechanism yet.

## ACTION

```text
actionIntent
actorRefs[]
inputRefs[]
outputRefs[]
ruleRefs[]
sideEffectClass?
```

`sideEffectClass` may be:

```text
READ_ONLY
STATE_CHANGING
EXTERNAL_SIDE_EFFECT
UNKNOWN
```

This is business/design evidence, not a concrete Activity binding.

## DECISION

```text
decisionMode:
EXCLUSIVE | INCLUSIVE | EVENT_BASED | SOURCE_DEFINED | UNKNOWN

ruleRefs[]
```

Outgoing branch meaning belongs primarily to relationships/guards.

## PARALLEL_SPLIT

Expresses intentional concurrency in the native source.

It is not inferred from several nearby arrows.

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

The Canvas may preserve incomplete waits intentionally. Validation decides whether missing fields matter.

## HUMAN_INTERACTION

```text
interactionKind:
APPROVAL | REVIEW | CORRECTION | FORM | UPLOAD | SIGNATURE | CHOICE | INFORMATION_REQUEST | SOURCE_DEFINED | UNKNOWN

actorRefs[]
requestedDataRefs[]
outcomes[]
dueConstraint?
```

No Signal/Update/Form implementation is chosen here.

## SUBPROCESS

```text
subprocessIntent
referencedCanvasDefinitionId?
referencedProcessDefinitionId?
boundaryMeaning:
EMBEDDED | REFERENCED | EXTERNAL | SOURCE_DEFINED | UNKNOWN
```

No Child Workflow implication exists at T2-01.

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

A visible end component explicitly establishes source completion intent; unlike imported graphics, Talos does not need to infer whether its own `END` component is terminal.

## ACTOR

```text
actorKind:
HUMAN_ROLE | HUMAN_PERSON | SYSTEM | ORGANIZATION | EXTERNAL_PARTY | AI | MIXED | UNKNOWN
```

## DATA_OBJECT

```text
businessMeaning?
schemaRef?
sensitivity?
identityMeaning?
```

## BUSINESS_RULE

```text
naturalLanguage
expression?
inputRefs[]
unresolvedTerms[]
```

---

# 9. Native relationships

Relationships are first-class source occurrences.

```text
CanvasRelationshipIdentity
- id
- canvasDefinitionId
- createdInRevisionId
- retiredInRevisionId?
```

```text
CanvasRelationshipSnapshot
- snapshotId
- canvasRelationshipId
- canvasRevisionId
- kind
- sourceElementId
- targetElementId
- label?
- guard?
- relationshipProperties{}
```

Initial relationship kinds:

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

Again:

```text
native relationship kind
      ≠
canonical edge kind identity
```

The adapter maps supported relationships and preserves unsupported/source-defined semantics through claims/extensions.

---

# 10. Branch guards

A branch guard is not merely display text.

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

Examples:

```text
"amount > 10,000"
```

may have both literal text and a structured rule.

```text
UNKNOWN
```

is preferable to fabricating `YES`/`NO` logic.

---

# 11. Structured membership beats geometry

Canvas layout must not be mined for semantics when TALOS already owns the structure.

Examples:

```text
actor owns action
```

must be represented through `actorRefs` / `RESPONSIBILITY_RELATIONSHIP`, not inferred because the action appears visually beneath an actor label.

```text
subprocess contains action
```

must be represented through explicit membership/relationship, not because one rectangle visually encloses another.

```text
parallel branch
```

must use explicit split/relationship semantics, not arrow fan-out geometry.

This gives the native Canvas stronger semantics than an external screenshot without giving it special provenance privileges.

---

# 12. ContainerMembership

Where the UI offers structured groups, lanes or subprocess containers, membership is stored explicitly.

```text
CanvasContainerMembership
- id
- canvasRevisionId
- containerElementId
- memberElementId
- membershipKind
```

`membershipKind`:

```text
VISUAL_GROUP
RESPONSIBILITY_SCOPE
SUBPROCESS_SCOPE
ANNOTATION_SCOPE
SOURCE_DEFINED
```

Only semantic membership kinds are eligible for canonical interpretation.

`VISUAL_GROUP` remains presentation/organization evidence.

---

# 13. Presentation plane

Presentation data is preserved as source evidence but does not become business semantics by default.

```text
CanvasPresentationSnapshot
- nodeLayouts[]
- edgeRoutes[]
- viewport?
- zoom?
- styleTokens[]?
- orderingHints[]?
```

```text
NodeLayout
- canvasElementId
- x
- y
- width
- height
- zIndex?
```

Moving a box changes presentation truth, not necessarily process meaning.

Color, proximity, left/right position and z-order are not semantic unless a future Canvas component explicitly declares a notation-specific semantic contract.

---

# 14. Authoring/collaboration plane

Editor context must remain outside the process graph.

Possible authoring evidence:

```text
comments
selection state
cursor/presence
collaborator presence
view state
undo/redo metadata
```

Rules inherited from Q10:

```text
COLLABORATOR PRESENCE   ≠ ACTOR
CURSOR PROXIMITY        ≠ OWNERSHIP
EDITOR CONTROL          ≠ PROCESS NODE
```

If comments are later promoted into semantic claims, that is an explicit transformation, not automatic Canvas behavior.

---

# 15. ChangeSet and edit history

Each Canvas revision is produced by a recorded `CanvasChangeSet`.

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

Operation kinds:

```text
ADD_ELEMENT
UPDATE_ELEMENT_PROPERTY
RETIRE_ELEMENT
ADD_RELATIONSHIP
UPDATE_RELATIONSHIP_PROPERTY
RETIRE_RELATIONSHIP
ADD_MEMBERSHIP
REMOVE_MEMBERSHIP
UPDATE_PRESENTATION
SOURCE_DEFINED
```

An operation identifies affected stable source IDs and property paths.

This becomes high-quality provenance evidence for native edits.

---

# 16. Semantic digest vs native representation digest

`nativeRepresentationDigest` fingerprints the complete structured Canvas revision, including source-significant presentation/history fields selected by serialization rules.

`semanticDigest` fingerprints only the native fields eligible to affect canonical semantics.

Therefore:

```text
move box only
nativeRepresentationDigest changes
semanticDigest unchanged
```

while:

```text
change decision guard
nativeRepresentationDigest changes
semanticDigest changes
```

The adapter may skip canonical re-materialization when the semantic digest is unchanged, while provenance can still record the newer Canvas source revision.

Digest rules must be deterministic and versioned.

---

# 17. TalosCanvasAdapter boundary

The Canvas itself does not create canonical truth.

The adapter receives:

```text
CanvasDefinition
CanvasRevision
native SourceRepresentation
```

and produces/links:

```text
SourceArtifact
SourceOccurrence(s)
EvidenceFragment(s)
SemanticClaim(s)
ProvenanceLink(s)
Canonical ProcessRevision candidate
```

Deterministic mappings are permitted where the native notation defines the meaning.

Examples:

```text
Canvas kind DECISION
→ canonical DECISION

Canvas relationship CONDITIONAL_FLOW
→ canonical CONDITIONAL

Canvas kind WAIT
→ canonical WAIT
```

But the identities remain separate and every mapping has provenance.

---

# 18. Native-source truth and inference

Because TALOS controls its Canvas notation:

```text
user selected DECISION component
→ sourceAssertedType = DECISION / SOURCE_TRUTH
```

But:

```text
user labels ACTION "Verify customer"
→ action label = SOURCE_TRUTH
→ means external API call = NOT PROVEN
```

Likewise:

```text
actor = Finance
→ actor label/source assignment may be SOURCE_TRUTH
→ Finance is a human team / service / Task Queue = NOT PROVEN unless explicitly typed
```

The Canvas removes parser/perception uncertainty. It does **not** remove business ambiguity.

---

# 19. Incomplete native processes are valid source input

The Canvas must allow a user to stop at:

```text
START
  ↓
Check order
  ↓
Approved?
  ├── YES → Send order
  └── NO  → UNKNOWN
```

without forcing a fake target for `NO`.

The native source may store an unresolved relationship/branch property and T1-03 produces a finding/question.

The Canvas is therefore an expression surface, not a completeness gate.

---

# 20. Correction / clarification lifecycle

Example:

```text
CanvasRevision 4
Decision NO branch = UNKNOWN
        ↓
TalosCanvasAdapter
        ↓
ProcessRevision 7
        ↓
ValidationAssessment A
Finding: branch target unresolved
Question: what happens when rejected?
        ↓
user answers: Cancel order
        ↓
ClarificationResponse
ConfirmationRecord / new SemanticClaim
        ↓
CanvasChangeSet adds Cancel order + relationship
        ↓
CanvasRevision 5
        ↓
ProcessRevision 8
        ↓
ValidationAssessment B
```

Nothing in Assessment A or CanvasRevision 4 is rewritten.

---

# 21. Deletion means retirement, not historical erasure

When a user deletes a node from the current Canvas view:

```text
CanvasElementIdentity.retiredInRevisionId = ...
```

The element disappears from the new snapshot but remains addressable in prior revisions/provenance.

A source element that participated in an old ProcessRevision must never become impossible to explain because the current Canvas no longer displays it.

---

# 22. Native Canvas representation serialization

The native structured representation must have a deterministic versioned serialization contract.

Minimum envelope:

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

The exact wire format (JSON/Protobuf/etc.) is a later architecture/build decision.

At T2-01 design gate the important requirement is semantic determinism and immutable revision identity, not language/framework selection.

---

# 23. Adapter output expectations

For a complete native Canvas revision TALOS should be able to answer:

1. What is the source origin?
2. What exact Canvas revision was interpreted?
3. Which native element/relationship supplied each canonical element/property?
4. Which properties were explicitly set, unknown or not applicable?
5. Which user-entered values are literal source truth?
6. Which adapter mappings are deterministic versus inferred?
7. Did the change alter semantics or only presentation?
8. Which canonical revision resulted from the semantic source state?
9. What validation findings remain?
10. Which later clarification created the next source/process revision?

---

# 24. T2-01 anti-goals

Do not:

- make React Flow / Konva / another UI-library node shape the TALOS source contract;
- store only a screenshot;
- use canonical IDs as Canvas IDs;
- directly generate Temporal primitives from native Canvas elements;
- infer semantics from coordinates when explicit structured fields exist;
- make every Canvas edit a semantic ProcessRevision automatically;
- require completion before accepting a Canvas source;
- erase deleted elements from historical source revisions;
- convert `UNKNOWN` into guessed defaults;
- make integration/provider binding part of native business truth unless the user explicitly modeled it as source evidence.

---

# 25. Candidate acceptance boundary

This contract is ready for T2-01 design pressure testing when the following can be represented without special cases:

```text
simple sequence
decision with explicit guards
decision with unresolved guard/target
parallel split + ALL join
durable wait with missing timezone
human approval with unresolved completion mechanism
actor/data/rule associations
semantic vs presentation-only edit
node retirement/history
clarification creating new source + process revision
Canvas screenshot coexisting with native structured source
```

T2-01 BUILD remains closed until this contract and its architecture/plan pass the design gate.
