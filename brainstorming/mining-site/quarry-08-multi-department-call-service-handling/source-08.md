# Quarry 08 — Source 08 — Multi-Department Call / Complaint / Service Handling

## Source record

- Quarry: `quarry-08-multi-department-call-service-handling`
- Source ID: `source-08`
- Source type: image / BPMN-style swimlane process with human-task icons, exclusive gateways, parallel gateways, event nodes and long cross-lane control-flow connectors
- Supplied by: user during TALOS Mining Site working session
- Original uploaded filename: `quarry-08.png`
- Original image dimensions: `800 × 473`
- Original file size: `83,201 bytes`
- Original image SHA-256: `054d1b34ba39106675ebccf6ba07c58079e294aa3b208fbd5d61ece0a1c9944e`
- Native binary source: exact user-supplied PNG available in the working session; repository binary attachment pending

> The semantic record preserves the source as drawn. Where connector direction or event subtype is visually ambiguous, TALOS records the ambiguity rather than repairing the process.

## Visible responsibility lanes

The diagram contains five horizontal lanes inside one enclosing process area:

```text
Management
Scheduling
Maintenance
Examination
Supplier
```

Solid connectors visibly cross lane boundaries. The source does not show separate participant pools or dashed message-flow boundaries between these lanes.

## Visible activities by lane

### Management

```text
Receive calls
Call back
Announce
```

### Scheduling

```text
Answer calls
Record conversation
Handle the complaint
Transfer service
terminal the case
Call back
```

### Maintenance

```text
Result identification
Call back confirmation (m)
Accounting(m)
```

### Examination

```text
Result confirmation
Call back confirmation(e)
Accounting(e)
```

### Supplier

```text
Supplier on site service
Feed back result
```

Most blue activity rectangles contain a small person/user icon. The icon is visible `SOURCE_TRUTH`; its exact imported-notation task type is not asserted from the image alone.

## Visible decisions / gateways

Several X-marked diamonds are visible.

### Initial routing gateway

The process begins with an event-like circle labeled by the incoming context:

```text
Call from other department
```

followed by an X-marked gateway.

One visible outgoing branch runs right with the nearby label `Management` toward `Receive calls`. Another visible branch runs downward toward `Answer calls` in Scheduling. The exact condition on the downward branch is not labeled in the source.

### Scheduling solvability gateway 01

After `Answer calls`:

```text
can the problem be solved?
```

Visible outcomes:

```text
yes → event-like circular node
no  → Record conversation
```

### Customer-complaint gateway

After `Record conversation`:

```text
is it customer complaint?
```

Visible outcomes:

```text
yes → Handle the complaint
no  → Transfer service
```

### Scheduling solvability gateway 02

After `Handle the complaint` there is another X-marked gateway with the same visible question:

```text
can the problem be solved?
```

The source shows outgoing connector topology around this gateway, but branch labels are not clearly visible enough to assign exact `yes`/`no` semantics to every continuation from the image alone.

## Visible parallel regions

Plus-marked diamonds appear in two separate regions.

### Result-analysis / confirmation region

A plus-marked split feeds two visible branches:

```text
Maintenance: Result identification
Examination: Result confirmation
```

The branches converge through a plus-marked gateway and an event-like circular node. The exact upstream trigger and downstream event semantics are not fully legible from the source image.

### Callback-confirmation / accounting region

After the Scheduling `Call back` region, a plus-marked split visibly activates two branches:

```text
Maintenance:
Call back confirmation (m)
  ↓
Accounting(m)

Examination:
Call back confirmation(e)
  ↓
Accounting(e)
```

Both branches converge at a plus-marked gateway on the right.

The `(m)` and `(e)` suffixes are source labels and must be preserved because they distinguish two otherwise similar branch structures.

## Visible supplier / transfer path

The customer-complaint gateway has a visible `no` path to:

```text
Transfer service
```

The wider source topology also visibly includes:

```text
Supplier on site service
  ↓
Feed back result
```

and a later Scheduling region containing:

```text
terminal the case
  ↓
Call back
```

Long connectors run between these regions and across lanes. The exact complete source-to-target identity of every long connector is difficult to prove from the raster alone, so TALOS preserves the visible nodes and graph regions while marking uncertain edge endpoints explicitly in TRANSFORM-08.

## Visible management path

The initial gateway has a visible branch labeled `Management`:

```text
Receive calls
  ↓
Call back
  ↓
Announce
  ↓
event-like circular node
```

The event-like node participates in additional visible connector topology to the right/lower process region. Its exact event subtype and whether it is terminal are not asserted from shape alone.

## Repeated labels / repeated semantics

The source contains several repeated or near-repeated labels:

```text
can the problem be solved?     [two distinct gateways]
Call back                       [Management and Scheduling]
Call back confirmation (m)
Call back confirmation(e)
Accounting(m)
Accounting(e)
```

These are distinct source nodes even where their display labels are equal or structurally similar.

## Event-like circles

Multiple circular event-like symbols appear throughout the process. Some have visible incoming/outgoing connectors while others look locally terminal.

The source does not provide a legend proving exact BPMN start/intermediate/end-event subtype for each circle.

Therefore:

```text
EVENT SHAPE = SOURCE_TRUTH
EVENT SUBTYPE = SOURCE-LIMITED / UNRESOLVED
TERMINATION = determined only where visible topology proves no continuation
```

## Source limitations

The source does not explicitly establish:

- the process name;
- whether the five lanes belong to one organization or whether `Supplier` represents an external organization despite being drawn as a lane;
- exact identities/conditions for all long cross-lane connector endpoints;
- the exact semantic subtype of each circular event node;
- exact imported-notation semantics of the person icons;
- whether all plus-marked gateways use strict all-branch synchronization in every case, although the paired branch topology strongly suggests parallel fork/join behavior;
- systems or applications used by Management, Scheduling, Maintenance, Examination or Supplier;
- exact payload/state carried between lanes;
- stable process/case correlation identifier;
- timeout, retry, cancellation, escalation or compensation behavior;
- whether `terminal the case` means business closure, technical closure, administrative state mutation or another action;
- what `Accounting(m)` and `Accounting(e)` specifically record;
- what evidence proves successful completion of supplier on-site service, result identification, result confirmation, callback confirmation or accounting;
- whether the process has one global final outcome or several local completion paths.

Those gaps remain visible in the transformation.