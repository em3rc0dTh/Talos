# Quarry 04 — Source 04 — Candidate Application Lifecycle

## Source record

- Quarry: `quarry-04-candidate-application-lifecycle`
- Source ID: `source-04`
- Source type: image / BPMN-style process diagram with legend
- Supplied by: user during TALOS Mining Site working session
- Original image dimensions: `1386 × 779`
- Original image SHA-256: `4128917118b04ad1eabbb899ab324f1fff97a40883c2c0dc2f026e62bfc5ca4a`
- Native binary source: user-supplied `quarry-04.png` in the working session; repository binary attachment pending

> The source record preserves the native image identity and digest. The semantic record must not substitute a recreated image for the original source. When the repository binary-ingestion path is used, attach the exact original bytes as `source-04.png` and verify the digest above.

## Visible source truth

The diagram models a candidate application lifecycle with one explicit exclusive gateway near the start, several activities, multiple branch labels, and three distinct end events.

The visible flow is:

```text
Start 1
  ↓
Is anonymous
  ├── upper path labeled `Login`
  │      ↓
  │   Submitting application
  │      ↓ `Submit application`
  │   Application's review
  │
  └── direct path
         ↓
      Application's review

Application's review
  ├── `Interview`
  │      ↓
  │   Interview
  │      ↓ `Finish interview`
  │   Final decision
  │      ├── `Keep for further use`
  │      │      ↓
  │      │   Send a message about saving CV
  │      │      ↓
  │      │   Finish 3
  │      │
  │      ├── `Accept application`
  │      │      ↓
  │      │   Inform candidates via SMS
  │      │      ↓
  │      │   Finish 2
  │      │
  │      └── `Reject`
  │             ↓
  │          Status rejected
  │             ↓
  │          Rejection message
  │             ↓
  │          Finish 1
  │
  └── `Reject`
         ↓
      Status rejected
         ↓
      Rejection message
         ↓
      Finish 1
```

## Explicit elements

### Events

- `Start 1`.
- `Finish 1`.
- `Finish 2`.
- `Finish 3`.

### Exclusive gateway

- `Is anonymous`.

The source legend explicitly identifies the diamond-with-X symbol as an `Exclusive gateway`.

### Activities

- `Submitting application`.
- `Application's review`.
- `Interview`.
- `Final decision`.
- `Status rejected`.
- `Rejection message`.
- `Inform candidates via SMS`.
- `Send a message about saving CV`.

### Labeled sequence flows / branch labels

- `Login`.
- `Submit application`.
- `Interview`.
- `Finish interview`.
- `Reject`.
- `Keep for further use`.
- `Accept application`.
- `Reject`.

### Shared downstream rejection path

Two different rejection sources converge on the same activity:

```text
Application's review --Reject--┐
                               ├── Status rejected → Rejection message → Finish 1
Final decision ------Reject----┘
```

The convergence itself is visible source topology.

## Source limitations

The source does not explicitly establish:

- what `Is anonymous` means operationally;
- which gateway branch corresponds to anonymous versus non-anonymous;
- why the branch labeled `Login` leads to `Submitting application`;
- whether the direct branch means an already-authenticated user, pre-existing application, or another condition;
- who performs each activity;
- whether `Application's review`, `Interview`, or `Final decision` are human, system, or mixed work;
- the business rules for interview selection;
- the business rules behind the three final-decision branches;
- whether `Keep for further use` implies consent, retention policy, talent-pool enrollment, or only a notification;
- what system sends SMS or the rejection/saving-CV messages;
- whether `Status rejected` is a persisted state transition or simply an activity label;
- whether `Finish 1`, `Finish 2`, and `Finish 3` are semantically named outcomes beyond their visible labels;
- retry, timeout, escalation, cancellation, idempotency, data contracts, or integrations.

Those gaps must remain explicit during transformation.
