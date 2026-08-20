# TALOS — BPMN PROCESS CONFIRMATION CONTRACT v0.1

Status: **DESIGN CONTRACT — IMPLEMENTATION OPEN**  
Date: **2026-08-20**

## Product decision

BPMN is the standard, user-authoritative business-process representation used by Talos before automation design.

Talos may receive different source forms, but all non-native BPMN sources converge into a BPMN review workspace before they may enter automation design.

```text
                         INPUT
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
     IMAGE               BPMN              TALOS CANVAS
       │                   │                    │
       ▼                   │                    ▼
 PERCEPTION                │              NATIVE GRAPH
       │                   │                    │
       ▼                   │                    ▼
 BPMN CANDIDATE            │              BPMN CANDIDATE
       │                   │                    │
       └───────────────────┼────────────────────┘
                           ▼
                    BPMN WORKSPACE
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      GRAPH EDIT        XML EDIT        NL EDIT
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                    BPMN REVISION
                           ↓
                SEMANTIC VALIDATION
                           ↓
             USER PROCESS CONFIRMATION
                           ↓
              CONFIRMED BPMN REVISION
                           ↓
                  CANONICAL FREEZE
                           ↓
                  CAPABILITY DESIGN
                           ↓
                  CAPABILITY BINDING
                           ↓
                   EXECUTION PLAN
                           ↓
                  TEMPORAL MAPPING
                           ↓
                   RUNTIME POLICY
                           ↓
                 DEPLOYMENT DESIGN
                           ↓
                TEMPORAL WORKFLOW
                           ↓
              AUTOMATION REVIEW CANVAS
                           ↓
                  DEPLOY / EXECUTE
```

## Core user promise

Talos must answer this question before it asks how to automate anything:

> **This is what Talos understood as your business process. Is it correct?**

A model inference, parser result, Canvas graph, or BPMN projection is not business authority by itself.

## Primary product surface

The first-class confirmation screen is:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ TALOS — PROCESS CONFIRMATION                                       │
├─────────────────────────┬───────────────────────────────────────────┤
│                         │                                           │
│ ORIGINAL SOURCE         │  BPMN — WHAT TALOS UNDERSTOOD             │
│                         │                                           │
│ [ image / preview ]     │        ○ Start                            │
│                         │        │                                  │
│                         │        ▼                                  │
│                         │   [Receive Order]                          │
│                         │        │                                  │
│                         │       ◇ Credit OK?                         │
│                         │      /          \                          │
│                         │    No            Yes                       │
│                         │                                           │
├─────────────────────────┴───────────────────────────────────────────┤
│ BPMN XML                                              [ View XML ] │
├─────────────────────────────────────────────────────────────────────┤
│ Talos found:                                                        │
│ ✅ 8 activities     ✅ 2 gateways     🟡 1 uncertain timing rule    │
│                                                                     │
│ [ Edit BPMN ]  [ Tell Talos what's wrong ]  [ Confirm Process ]    │
└─────────────────────────────────────────────────────────────────────┘
```

This layout is not decoration. It is a trust boundary:

```text
ORIGINAL SOURCE
      ↕
WHAT TALOS UNDERSTOOD
      ↕
USER AUTHORITY
```

## Input routes

### Image

Examples include screenshots, exported Visio diagrams, UML Activity diagrams, EPC diagrams, flowcharts, Miro/Lucidchart exports, whiteboard photos, or process images using an unknown visual grammar.

```text
IMAGE
  ↓
exact source preservation
  ↓
perception / interpretation
  ↓
Talos canonical candidate
  ↓
BPMN candidate
  ↓
BPMN Workspace
```

The generated BPMN remains inferred until explicit confirmation.

### Native BPMN

A native `.bpmn` input does not require image reconstruction.

```text
BPMN XML
  ↓
preserve original BPMN
  ↓
parse + validate
  ↓
render BPMN Workspace
  ↓
user confirmation
```

The confirmation is still required because the user is authorizing the exact process revision Talos may use for automation design.

### Talos Canvas

Talos Canvas is a structured authoring source.

```text
TALOS CANVAS
  ↓
native nodes / edges / actors / rules
  ↓
canonical candidate
  ↓
BPMN candidate
  ↓
BPMN Workspace
```

## One BPMN model, three editing surfaces

Talos must not maintain independent semantic truths for the graph, XML, and natural-language editor.

```text
GRAPH EDIT
     │
XML EDIT
     ├────→ SAME BPMN REVISION MODEL
NL EDIT
     │
```

### Graph edit

Direct graphical editing may add, remove, connect, rename, or move BPMN elements.

### XML edit

Advanced users may inspect or edit the BPMN XML. Invalid XML or invalid BPMN must not replace the current valid revision.

### Natural-language edit

Natural-language correction is allowed, but it is never a silent mutation.

Example:

```text
User:
"After Check Credit, the manager must approve the order.
If rejected, cancel it. If approved, continue to Fulfill Order."
```

Talos creates a proposal:

```text
PROPOSED CHANGE

+ Human Task: Manager Approval
+ Exclusive Gateway: Approved?
+ NO  → Cancel Order
+ YES → Fulfill Order
- Check Credit → Fulfill Order
```

The user must choose:

```text
[ Accept Changes ]
[ Modify Proposal ]
[ Reject Changes ]
```

The contract invariant is:

```text
NATURAL LANGUAGE
      ↓
PROPOSED BPMN REVISION
      ↓
EXPLICIT ACCEPT / REJECT
      ↓
CURRENT BPMN REVISION
```

Never:

```text
NATURAL LANGUAGE
      ↓
SILENTLY MUTATE CONFIRMED PROCESS   ❌
```

## Visual edit versus semantic edit

A layout change must not manufacture a new business meaning.

```text
move task on canvas
change x/y coordinates
resize lane
reroute connector visually
       ↓
VISUAL_ONLY
```

A business-meaning change requires revalidation and a new confirmation.

```text
rename task meaningfully
add/remove task
change gateway branch
change actor assignment
change event/timer semantics
add/remove semantic sequence flow
       ↓
SEMANTIC
```

Talos tracks separate digests:

```text
semanticDigest  = normalized BPMN business meaning
 diagramDigest  = BPMN-DI / layout state
 bpmnXmlSha256  = exact serialized BPMN revision
```

## Revision contract

Every meaningful workspace state is immutable.

```text
BPMN-REV-001   inferred from source
      ↓
BPMN-REV-002   graph correction
      ↓
BPMN-REV-003   accepted NL proposal
      ↓
BPMN-REV-004   CONFIRMED
```

Prior revisions remain historical evidence.

## BusinessProcessConfirmationRecord

A confirmation pins all of the following:

```text
exact BpmnProcessRevision
exact BPMN XML SHA-256
exact BPMN semantic digest
exact canonical ProcessRevision
authorityRef
confirmedBy
confirmedAt
```

A later semantic revision makes the old confirmation stale. A revoked confirmation removes handoff authority immediately.

## Automation handoff gate

The following is required before Talos may enter automation design:

```text
CURRENT BPMN REVISION                  = CONFIRMED
BusinessProcessConfirmationRecord      = present
confirmation BPMN revision             = current exact revision
confirmation XML digest                = current exact XML digest
confirmation semantic digest           = current exact semantic digest
confirmation ProcessRevision           = expected exact ProcessRevision
authorityRef                           = present
confirmation status                    = CONFIRMED
```

If any condition fails:

```text
AUTOMATION DESIGN HANDOFF = BLOCKED
```

The confirmation itself does **not** deploy or execute anything.

```text
PROCESS CONFIRMATION
      ≠
AUTOMATION APPROVAL
      ≠
DEPLOYMENT APPROVAL
```

## Two human trust gates

Talos now has two different questions for the user.

### Gate A — Business Process Confirmation

```text
ORIGINAL SOURCE
      ↕
CONFIRMED BPMN
```

Question:

> Did Talos understand the business process correctly?

### Gate B — Automation Design Confirmation

```text
CONFIRMED BPMN
      ↕
TEMPORAL DESIGN
```

Question:

> Did Talos design the automation correctly?

The second gate is downstream work. Gate A must exist first.

## Traceability target

The future Automation Review Canvas should make the relationship inspectable:

```text
BPMN: Send Invoice
       ↕
CapabilityBinding
       ↕
ExecutionElement
       ↕
Temporal Activity
```

This is a core Talos explainability property.

## Non-negotiable safety rule

```text
AI UNDERSTOOD IT
      ≠
USER CONFIRMED IT
```

Talos may not enter automation design merely because an image model, BPMN parser, or correction agent produced a plausible process.
