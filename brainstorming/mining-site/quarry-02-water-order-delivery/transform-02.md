# Quarry 02 — Transform 02

## Objective

Interpret `source-02` without replacing its origin, normalize the visible business semantics into TALOS concepts, identify new semantic evidence relative to Quarry 01, and prepare `foundry-source-02`.

No executable code is produced here.

## 1. Participant and role extraction

```text
PARTICIPANT-01  Customer
PARTICIPANT-02  The Aqua Distilled Water Company

ROLE / LANE
- Customer Service Assistant
- Manager
- Worker
```

Truth state: `SOURCE_TRUTH` for names and placement.

The source gives stronger evidence than Quarry 01 that TALOS should distinguish a process participant from an internal role/lane. This remains a Mining Site hypothesis until repeated evidence supports standardization.

## 2. External action and message boundary

`Place Order` is inside the Customer participant and communicates into the company process through a dashed message flow.

```text
Customer
  ↓
Place Order
  ↓ message
Company process
  ↓
Verify Customer Identity
```

- `SOURCE_TRUTH`: `Place Order` belongs to the Customer participant and communicates across the participant boundary.
- `INFERRED`: the message represents an order request entering the company process.
- `UNRESOLVED`: whether that message becomes a Temporal workflow start, Signal, Update, API command, queue message, or another intake mechanism.

The transform must not flatten `Place Order` into an internal company Activity.

## 3. Multi-channel intake evidence

Source annotation:

```text
Phone call  >90%
Email       10%
```

Canonical semantic interpretation:

```text
ORDER_REQUEST
source channels evidenced by source:
- PHONE
- EMAIL
```

This does not authorize implementation-specific adapters such as Gmail, telephony APIs, speech-to-text, or call-center software.

## 4. Identity verification and decision

```text
VERIFY_CUSTOMER_IDENTITY
owner: Customer Service Assistant

CUSTOMER_EXISTS?
├── YES → continue
└── NO  → CREATE_CUSTOMER_ACCOUNT
```

The branch that creates the account reconnects to the same downstream path as the `YES` branch.

TALOS normalization may represent this as an exclusive merge. The connectivity is source truth; the explicit named `MERGE` is normalized semantics, not a source label.

## 5. Explicit durable wait candidate

The source contains the intermediate event `On Next Wednesday`.

Canonical normalization:

```text
WAIT_UNTIL
business expression: NEXT_WEDNESDAY
```

Execution semantics are incomplete because the source does not establish:

- timezone;
- exact clock time;
- holiday / business-calendar behavior;
- whether "next Wednesday" means the immediately upcoming Wednesday or the following calendar week's Wednesday under a domain rule.

Therefore:

```text
SOURCE_TRUTH  = On Next Wednesday
NORMALIZED    = WAIT_UNTIL(NEXT_WEDNESDAY)
EXECUTABLE    = NO
```

## 6. Forward Order

```text
FORWARD_ORDER
owner: Customer Service Assistant
```

The destination, transport, system, and business state transition are not specified.

## 7. Business-object lifecycle hypothesis

Explicit artifacts:

```text
Purchase Order [Create]
Purchase Order [To be Assigned]
Purchase Order [To be Delivered]
Purchase Order [Completed]
```

The strongest useful interpretation is that they may describe successive states of one Purchase Order object:

```text
CREATED
  ↓
TO_BE_ASSIGNED
  ↓
TO_BE_DELIVERED
  ↓
COMPLETED
```

Truth discipline:

- artifact labels = `SOURCE_TRUTH`
- one-object state-machine interpretation = `INFERRED`

The transform must preserve that distinction.

## 8. Collapsed subprocess

`Arrange Delivery` includes the collapsed-subprocess marker.

Canonical meaning:

```text
SUBPROCESS
name: Arrange Delivery
owner: Manager
internal definition: NOT_VISIBLE_IN_SOURCE
```

The Foundry may later consider local workflow logic, a Child Workflow, external orchestration, or human work. None is implied automatically by the source.

## 9. Physical work boundary

`Deliver Water` belongs to the Worker lane.

```text
DELIVER_WATER
owner: Worker
```

The source proves business responsibility, not digital execution semantics. TALOS must not claim how the runtime learns that delivery started, succeeded, failed, or was evidenced.

## 10. Candidate Temporal interpretation

Advisory only:

```text
Possible durable lifecycle:
WaterOrderWorkflow

External customer action/message
        ↓
company process boundary
        ↓
verify identity
        ↓
conditional account creation
        ↓
durable wait until Wednesday
        ↓
forward order
        ↓
arrange-delivery subprocess
        ↓
coordinate / observe physical delivery
        ↓
complete
```

Possible Temporal concepts exist here, but business nodes are not automatically Temporal Activities.

## 11. Comparison with Quarry 01

Repeated evidence in Q01 + Q02:

- process trigger / start;
- sequential steps;
- responsible actor / lane;
- exclusive decision;
- conditional branches;
- terminal process state.

New semantic evidence introduced by Q02:

- external participant;
- cross-participant message boundary;
- multi-channel intake evidence;
- exclusive merge normalization;
- explicit timer / durable wait;
- business object artifacts and candidate object state;
- collapsed subprocess;
- physical human work;
- source annotation / operational evidence.

These are hypotheses for the TALOS standard language, not frozen primitives yet.

## Transform verdict

```text
SOURCE READING                  ✅
PARTICIPANTS                    ✅
ROLES / LANES                   ✅
MESSAGE BOUNDARY                ✅
MULTI-CHANNEL EVIDENCE          ✅
DECISION / MERGE                ✅
WAIT SEMANTICS                  ✅ SOURCE-LIMITED
BUSINESS OBJECT EVIDENCE        ✅
SUBPROCESS                      ✅
PHYSICAL WORK                   ✅
UNCERTAINTIES                   ✅
TEMPORAL CANDIDATES             ✅ SUGGESTED
TEMPORAL CODE                   ⛔ NOT NEEDED
```
