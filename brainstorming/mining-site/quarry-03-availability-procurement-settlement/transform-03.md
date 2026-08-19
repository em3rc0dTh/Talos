# Quarry 03 — Transform 03

## Objective

Interpret `source-03` without replacing its origin, normalize the visible business semantics into TALOS concepts, identify new semantic evidence relative to Quarries 01 and 02, and prepare `foundry-source-03`.

No executable code is produced here.

## 1. Trigger and main process boundary

The process starts with a message-style event labeled `Order Received`.

```text
ORDER_RECEIVED
  ↓
CHECK_AVAILABILITY
```

- `SOURCE_TRUTH`: an order-received start event exists and precedes the availability check.
- `INFERRED`: one workflow instance may correspond to one received order.
- `UNRESOLVED`: the transport, sender, payload, correlation key, and exact execution-start mechanism.

This strengthens the pattern first seen in Quarry 02: an external business message may establish the process boundary without becoming an internal business Activity.

## 2. Availability decision

```text
CHECK_AVAILABILITY
  ↓
ARTICLE_AVAILABLE?
  ├── YES → SHIP_ARTICLE
  └── NO  → PROCUREMENT
```

The decision and branch labels are `SOURCE_TRUTH`.

The source does not state whether availability is read from inventory software, decided by a person, derived from a database, or obtained from another service.

## 3. Procurement as a collapsed subprocess

`Procurement` contains the collapsed-subprocess marker.

Canonical normalization:

```text
SUBPROCESS
name: Procurement
internal definition: NOT_VISIBLE_IN_SOURCE
```

Normal completion reconnects to the main success path at `Ship Article`.

The Foundry may later consider a Child Workflow, workflow-local logic, an external orchestration, or another execution boundary. A collapsed BPMN subprocess must not automatically become a Temporal Child Workflow.

## 4. Boundary exception semantics

Two labeled events are attached directly to `Procurement`.

### Undeliverable

Visible icon: error/lightning-like boundary marker.

Visible path:

```text
PROCUREMENT
  └── Undeliverable
          ↓
      INFORM_CUSTOMER
          ↓
      REMOVE_ARTICLE_FROM_CATALOGUE
          ↓
      ARTICLE_REMOVED
```

### Late Delivery

Visible icon: escalation/triangle-like boundary marker.

Visible path:

```text
PROCUREMENT
  └── Late Delivery
          ↓
      INFORM_CUSTOMER
          ↓
      CUSTOMER_INFORMED
```

Truth discipline:

- event labels, attachment to Procurement, outgoing flows and branch endpoints = `SOURCE_TRUTH`;
- exact BPMN class (`Error Boundary Event`, `Escalation Boundary Event`) = high-confidence notation interpretation;
- interrupting versus non-interrupting behavior = `UNRESOLVED` until the source notation/definition is verified.

This is the first Mining Site quarry with explicit exception/event handling attached to a subprocess boundary.

## 5. Business exception is not automatically technical failure

The source uses exception-like process paths, but TALOS must not translate them directly into Temporal infrastructure failures.

For example:

```text
UNDELIVERABLE
```

may be a valid business outcome of procurement rather than a crashed Activity.

Likewise:

```text
LATE_DELIVERY
```

may represent a domain escalation or deadline condition rather than a retryable technical error.

Therefore the Foundry must preserve this distinction:

```text
BUSINESS OUTCOME / DOMAIN EVENT
            ≠
TEMPORAL ACTIVITY FAILURE
```

Otherwise a correct business outcome could accidentally trigger retries, incident handling, or failed workflow semantics.

## 6. Convergence after procurement

Normal Procurement completion joins the direct `Article Available = Yes` path at `Ship Article`.

Canonical normalization:

```text
ARTICLE_AVAILABLE?
  ├── YES ───────────────────────────┐
  │                                  │
  └── NO → PROCUREMENT → NORMAL ─────┘
                                     ↓
                                 SHIP_ARTICLE
```

This is another form of conditional convergence. No explicit merge gateway is drawn, so the connectivity is source truth while an explicit canonical `MERGE` is normalized semantics.

## 7. Shipping

```text
SHIP_ARTICLE
```

is an explicit business step.

The source does not establish whether it is physical human work, warehouse-system execution, carrier integration, or mixed execution.

Therefore it remains a semantic step with unresolved execution mapping.

## 8. Financial Settlement as a collapsed subprocess

`Financial Settlement` visibly contains the collapsed-subprocess marker.

```text
SUBPROCESS
name: Financial Settlement
internal definition: NOT_VISIBLE_IN_SOURCE
```

The visible sequence is:

```text
SHIP_ARTICLE
  ↓
FINANCIAL_SETTLEMENT
  ↓
PAYMENT_RECEIVED
```

The source proves the subprocess boundary and terminal label, but it does not prove how settlement works or whether `Payment Received` is caused internally or arrives as an external message.

## 9. Multiple terminal business outcomes

Quarry 03 contains three terminal states:

```text
PAYMENT_RECEIVED
CUSTOMER_INFORMED
ARTICLE_REMOVED
```

TALOS should not classify only one of them as a legitimate process completion.

A useful canonical pattern is:

```text
COMPLETE
  status: SUCCESS | ALTERNATE_BUSINESS_OUTCOME | ...
  outcome: PAYMENT_RECEIVED | CUSTOMER_INFORMED | ARTICLE_REMOVED
```

The exact status taxonomy is not frozen here. The important evidence is that a single business process may have multiple intentional terminal outcomes that are neither equivalent nor necessarily technical failures.

## 10. Candidate Temporal interpretation

Advisory only:

```text
Possible durable lifecycle:
OrderFulfillmentWorkflow

ORDER_RECEIVED
   ↓
check availability
   ↓
article available?
   ├── YES ───────────────────────────────┐
   │                                      │
   └── NO → procurement boundary          │
               ├── NORMAL ────────────────┘
               ├── UNDELIVERABLE → notify → remove catalogue item → complete
               └── LATE_DELIVERY → notify → complete
                                          ↓
                                      ship article
                                          ↓
                                 financial settlement boundary
                                          ↓
                                   payment received
                                          ↓
                                       complete
```

Possible Temporal concepts include:

- one durable Workflow per order;
- Activities for external/system side effects;
- a Child Workflow candidate for `Procurement`;
- a Child Workflow candidate for `Financial Settlement`;
- explicit domain-result branching for business exceptions;
- Signal / Update / Timer candidates if late delivery or payment arrives asynchronously.

None of these mappings is executable truth yet.

## 11. Comparison with Quarries 01 and 02

### Repeated across all three

- process trigger / start;
- sequential business steps;
- exclusive decision / conditional branch;
- branch convergence;
- terminal outcomes;
- unresolved human/system execution boundaries.

### Repeated from Quarry 02 into Quarry 03

- message/event process boundary;
- collapsed subprocess;
- semantics that must not automatically map one-to-one into Temporal Activities.

### New semantic evidence introduced by Quarry 03

- subprocess boundary events;
- domain exception path;
- escalation-like event path;
- normal subprocess completion plus exceptional completion alternatives;
- business exception versus technical failure distinction;
- multiple semantically different terminal outcomes;
- two collapsed subprocesses in one end-to-end flow;
- convergence from direct and procurement paths before shipping.

These are evidence-backed candidates for the TALOS standard language, not frozen primitives yet.

## Emerging Mining Site language after Q01–Q03

```text
PROCESS
PARTICIPANT
ROLE / LANE
TRIGGER / MESSAGE
STEP
DECISION
BRANCH
MERGE / CONVERGENCE
WAIT
SUBPROCESS
BOUNDARY EVENT
DOMAIN EXCEPTION / ESCALATION
BUSINESS OBJECT / STATE
OUTCOME
ANNOTATION / EVIDENCE
```

The list remains provisional.

## Transform verdict

```text
SOURCE READING                   ✅
MESSAGE START                    ✅
DECISION / BRANCH                ✅
SUBPROCESS NORMAL PATH           ✅
BOUNDARY EVENT EVIDENCE          ✅ SOURCE-LIMITED
BUSINESS EXCEPTION SEMANTICS     ✅
CONVERGENCE                      ✅
MULTIPLE TERMINAL OUTCOMES       ✅
TEMPORAL CANDIDATES              ✅ SUGGESTED
EXECUTION SEMANTICS              🟡 INCOMPLETE
TEMPORAL CODE                    ⛔ NOT NEEDED
```
