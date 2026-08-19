# Quarry 10 — Transform 10

## Objective

Interpret `source-10` as a workflow-like order process captured inside a collaborative Miro authoring environment, separate editor/collaboration overlays from the business graph, preserve shared cancellation convergence and incomplete terminal semantics, and prepare `foundry-source-10` without inventing actor ownership or integration behavior.

No executable code is produced here.

## 1. Artifact classification

Canonical source class:

```text
ARTIFACT_CLASS
COLLABORATIVE_WHITEBOARD_SCREENSHOT_WITH_PROCESS_GRAPH_AND_EDITOR_OVERLAYS
```

Quarry 10 is not merely a process diagram file. It is a screenshot containing at least two semantic planes:

```text
AUTHORING / COLLABORATION PLANE
BUSINESS PROCESS PLANE
```

This is the strongest new evidence introduced by Q10.

Critical rule:

```text
EDITOR / WORKSPACE UI
      ≠
BUSINESS PROCESS GRAPH
```

## 2. Source-plane separation

### Plane A — authoring environment

Examples:

```text
Miro logo
board title: Launch process
Share / Present controls
left toolbar
zoom controls
avatar/presence UI
```

These are source provenance/context. They should normally be excluded from the canonical business graph while remaining traceable as source presentation metadata.

### Plane B — collaborator presence

Visible named cursor labels:

```text
Himali
Aharon
Anna
Bettany
```

The transform classifies these as:

```text
COLLABORATION_OVERLAY / EDITOR_PRESENCE
```

not as process roles.

New rules:

```text
COLLABORATOR CURSOR
      ≠
BUSINESS ACTOR / ROLE

CURSOR PROXIMITY TO NODE
      ≠
OWNERSHIP / ASSIGNMENT

EDITORIAL POINTER
      ≠
CONTROL-FLOW EDGE
```

This matters directly for future screenshots from Miro, FigJam, Figma, Lucid, draw.io and similar collaborative surfaces.

## 3. Process graph extraction

After removing the editor/collaboration overlays from semantic interpretation, the strongest business graph is:

```text
ORDER_NODE
  ↓
RECEIVE_ORDER
  ↓
CHECK_STOCK
  ↓
IN_STOCK?

  ├── OUT_OF_STOCK
  │      ↓
  │   CANCEL_ORDER
  │
  └── IN_STOCK
          ↓
      CHECK_CREDIT_CARD
          ↓
      CARD_VALID?

      ├── INVALID
      │      ↓
      │   CANCEL_ORDER
      │
      └── VALID
             ↓
         PROCESS_CREDIT_CARD
             ↓
           DELIVER
             ↓
           RECEIVE_NODE
```

The graph is source-supported and straightforward. The semantics of the yellow endpoint-like nodes remain unresolved.

## 4. Color/style is evidence, not ontology

The source uses yellow, purple and blue shape families.

A naive visual parser could infer:

```text
yellow = external event
purple = activity
blue = decision
```

Only the decision interpretation is strongly supported by label/topology; no source legend confirms the broader color semantics.

Therefore:

```text
VISUAL STYLE / COLOR
      ≠
CANONICAL NODE TYPE WITHOUT LEGEND OR OTHER EVIDENCE
```

TALOS should record source styling separately from semantic classification.

## 5. Decision normalization

### Decision 01 — stock

```text
CHECK_STOCK
  ↓
IN_STOCK?
  ├── OUT_OF_STOCK → CANCEL_ORDER
  └── IN_STOCK     → CHECK_CREDIT_CARD
```

Normalized domain decision candidate:

```text
STOCK_AVAILABLE?
```

No inventory implementation is source truth.

### Decision 02 — card validity

```text
CHECK_CREDIT_CARD
  ↓
CARD_VALID?
  ├── INVALID → CANCEL_ORDER
  └── VALID   → PROCESS_CREDIT_CARD
```

The source separates `Check credit card` from `Process credit card`. TALOS must preserve that separation.

This yields an important execution-design clue without deciding implementation:

```text
VALIDATION / ELIGIBILITY CHECK
      ≠
MONEY-MOVING SIDE EFFECT
```

`Check credit card` may be read-only/validation work while `Process credit card` may perform a side effect, but the exact provider/API behavior remains unresolved.

## 6. Shared cancellation handling

Two distinct business conditions converge on the same node:

```text
OUT_OF_STOCK ─────┐
                  ├── CANCEL_ORDER
CARD_INVALID ─────┘
```

This reinforces Q04's shared downstream handling pattern.

Canonical normalization:

```text
CANCEL_ORDER
reason:
  - OUT_OF_STOCK
  - CARD_INVALID
```

The reason values are inferred normalized outcome codes from source branch labels; the two origin paths remain separately traceable.

Critical rule:

```text
SHARED HANDLING NODE
      ≠
LOSS OF ORIGIN REASON
```

## 7. Cancellation is a domain path, not technical failure

Neither `Out of stock` nor `Invalid` means infrastructure failure.

They are visible domain conditions leading to cancellation.

Therefore:

```text
OUT_OF_STOCK      ≠ Activity failure / automatic retry
CARD_INVALID      ≠ Activity failure / automatic retry
CANCEL_ORDER      ≠ Workflow technical failure
```

Temporal retry behavior, if any, must be based on actual technical failures later identified by the Foundry.

## 8. Start semantics are incomplete

The source starts visually with a yellow `Order` node.

The transform must not decide that it is automatically:

```text
Temporal Workflow start
message start event
Order object
customer action
API request
```

Canonical status:

```text
ENTRY_NODE_LABEL: Order
ENTRY_SEMANTICS: UNRESOLVED
```

A likely Foundry question is whether an externally received order starts the durable lifecycle and `Receive order` is the first internal activity, but that is only a candidate.

## 9. Completion semantics are incomplete on both branches

The cancel branch ends visibly at `Cancel order` with no explicit final event.

The success branch ends visibly at yellow `Receive`, also with no explicit final event.

Therefore:

```text
CANCEL_PATH_LAST_VISIBLE_NODE: CANCEL_ORDER
CANCEL_PATH_TERMINATION: NOT_PROVEN

SUCCESS_PATH_LAST_VISIBLE_NODE: RECEIVE
SUCCESS_PATH_TERMINATION: NOT_PROVEN
```

This reinforces Q07/Q08:

```text
LAST VISIBLE NODE
      ≠
EXPLICIT PROCESS COMPLETION
```

## 10. `Receive` is intentionally unresolved

The yellow `Receive` node is reached after `Deliver`.

Plausible meanings include:

- customer receives order;
- delivery receipt/acknowledgement;
- terminal state/milestone;
- another action;
- output artifact.

The source does not choose among them.

Canonical representation:

```text
RECEIVE_NODE
label: Receive
semantic-type: UNRESOLVED
```

TALOS must resist completing the English sentence on behalf of the source.

## 11. Physical/external work and side effects

Several nodes are execution-sensitive:

```text
CHECK_STOCK
CHECK_CREDIT_CARD
PROCESS_CREDIT_CARD
DELIVER
CANCEL_ORDER
```

Potential Foundry types differ:

- inventory query/service;
- payment validation;
- payment side effect;
- physical/logistics work;
- cancellation state mutation / notification.

A single generic `Activity` mapping would lose relevant semantics.

## 12. Missing failure/compensation topology

The source does not show what happens if:

```text
PROCESS_CREDIT_CARD succeeds
        ↓
DELIVER fails
```

or if payment processing itself fails technically/business-wise.

TALOS must not invent refund or compensation paths.

However, the absence is execution-relevant and should be handed to the Foundry as a gap:

```text
POST_PAYMENT_FAILURE_POLICY: UNKNOWN
COMPENSATION / REFUND POLICY: UNKNOWN
```

This is a useful distinction:

```text
MISSING FAILURE PATH
      ≠
ASSUMED HAPPY-PATH GUARANTEE
```

## 13. Temporal conceptual candidate

A first Foundry hypothesis is:

```text
OrderLifecycleWorkflow ?

order received / lifecycle start ?
  ↓
receive order
  ↓
check stock
  ↓
stock available?
  ├── no  → cancel(reason=OUT_OF_STOCK)
  └── yes
        ↓
      check card validity
        ↓
      card valid?
      ├── no  → cancel(reason=CARD_INVALID)
      └── yes
            ↓
          process payment
            ↓
          deliver
            ↓
          receive/acknowledge ?
            ↓
          completion unresolved
```

Potential Temporal concepts later:

```text
Workflow                order lifecycle candidate
Activity                inventory/payment/logistics side effects where confirmed
Signal / Update         receipt/delivery acknowledgement candidate if asynchronous
business outcome        cancellation with preserved reason
compensation            only if later business evidence requires it
```

No mapping is executable truth yet.

## 14. Comparison with Quarries 01–09

### Reinforced

Q10 reinforces:

- exclusive decisions and guarded branches (Q01/Q03/Q04/Q09);
- shared downstream handling while preserving origin reason (Q04);
- business cancellation/rejection distinct from technical failure (Q03/Q04);
- physical/external work boundary (Q02/Q05/Q07);
- last-visible-node distinct from explicit completion (Q07/Q08);
- graph-first extraction rather than visual reading order (Q08/Q09).

### New / stronger evidence

Q10 introduces or strongly sharpens:

- collaborative editor/workspace UI as a separate source-presentation layer;
- collaborator presence/cursors distinct from business actors;
- cursor proximity distinct from ownership;
- canvas/editor pointer distinct from process connector;
- visual style/color distinct from semantic type without a legend;
- separate validation/check semantics from side-effect processing (`Check credit card` vs `Process credit card`);
- missing post-side-effect failure/compensation topology as an explicit Foundry gap.

## Transform verdict

```text
SOURCE READING                         ✅
ARTIFACT CLASSIFICATION                ✅
AUTHORING-UI SEPARATION                ✅
COLLABORATOR-OVERLAY SEPARATION        ✅
BUSINESS GRAPH EXTRACTION              ✅
DECISION / GUARD NORMALIZATION         ✅
SHARED CANCELLATION HANDLING           ✅
CANCELLATION ORIGIN REASONS            ✅
COLOR / STYLE SEMANTICS                🟡 UNRESOLVED BY SOURCE
ENTRY SEMANTICS                        🟡 UNRESOLVED
CANCEL COMPLETION                      🟡 NOT PROVEN
SUCCESS COMPLETION                     🟡 NOT PROVEN
POST-PAYMENT FAILURE POLICY            🟡 SOURCE GAP
COMPENSATION POLICY                    🟡 SOURCE GAP
TEMPORAL CANDIDATES                    ✅ SUGGESTED
TEMPORAL CODE                          ⛔ NOT NEEDED
```

Quarry 10 expands the Mining Site from diagram semantics into **authoring-context filtration**: TALOS must first determine what belongs to the business graph and what belongs only to the collaborative surface that captured it.