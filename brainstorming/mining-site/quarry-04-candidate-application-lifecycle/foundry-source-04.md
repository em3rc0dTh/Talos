# Quarry 04 — Foundry Source 04

## Status

`FOUNDRY-SOURCE-04` is the standardized semantic artifact emitted by `TRANSFORM-04`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled Mining Site handoff to the Foundry.

## Process identity

```text
process: Candidate Application Lifecycle
quarry: quarry-04-candidate-application-lifecycle
source: source-04
transform: transform-04
foundry-source: foundry-source-04
execution-readiness: NOT_READY
```

## Canonical flow

```text
START
  ↓
IDENTITY_GATEWAY
source label: Is anonymous
conditions: UNRESOLVED

  ├── PATH-A
  │     ↓
  │   SUBMITTING_APPLICATION
  │     ↓
  │   APPLICATION_REVIEW
  │
  └── PATH-B
        ↓
      APPLICATION_REVIEW

APPLICATION_REVIEW
  ├── REJECT
  │     ↓
  │   SHARED_REJECTION_HANDLING
  │
  └── ADVANCE_TO_INTERVIEW
        ↓
      INTERVIEW
        ↓
      FINAL_DECISION

FINAL_DECISION
  ├── ACCEPT
  │     ↓
  │   INFORM_CANDIDATES_VIA_SMS
  │     ↓
  │   COMPLETE
  │   source end: Finish 2
  │   outcome: ACCEPTED_NOTIFICATION_SENT
  │
  ├── REJECT
  │     ↓
  │   SHARED_REJECTION_HANDLING
  │
  └── KEEP_FOR_FURTHER_USE
        ↓
      SEND_MESSAGE_ABOUT_SAVING_CV
        ↓
      COMPLETE
      source end: Finish 3
      outcome: FUTURE_USE_MESSAGE_SENT

SHARED_REJECTION_HANDLING
  ↓
STATUS_REJECTED
  ↓
REJECTION_MESSAGE
  ↓
COMPLETE
source end: Finish 1
outcome: REJECTION_HANDLED
```

## Canonical elements

### `IDENTITY_GATEWAY`

- source label: `Is anonymous`
- source symbol: exclusive gateway
- outgoing conditions: unresolved
- normalized semantic role: identity/access gate candidate

### `SUBMITTING_APPLICATION`

- source label: `Submitting application`
- appears only on one gateway branch
- execution mapping: unresolved

### `APPLICATION_REVIEW`

- source label: `Application's review`
- shared convergence point
- visible outcomes: advance toward interview or reject

### `INTERVIEW`

- source label: `Interview`
- exact human/system semantics: unresolved

### `FINAL_DECISION`

Visible source outcomes:

```text
Keep for further use
Accept application
Reject
```

Normalized domain outcomes:

```text
KEEP_FOR_FURTHER_USE
ACCEPT
REJECT
```

### `SHARED_REJECTION_HANDLING`

Normalized path representing visible convergence from:

- rejection during `Application's review`;
- rejection during `Final decision`.

Visible downstream activities:

```text
Status rejected
Rejection message
```

### `INFORM_CANDIDATES_VIA_SMS`

- source explicitly names `SMS`
- integration/provider semantics: unresolved

### `SEND_MESSAGE_ABOUT_SAVING_CV`

- source explicitly communicates future CV retention/use intent
- consent, retention period, legal basis and storage semantics: unresolved

## Terminal outcomes

The source provides three separate end events:

```text
Finish 1
Finish 2
Finish 3
```

TALOS preserves those identities.

Normalized business outcomes are candidates:

```text
REJECTION_HANDLED
ACCEPTED_NOTIFICATION_SENT
FUTURE_USE_MESSAGE_SENT
```

These are normalization labels, not source labels.

## State evidence

Candidate state interpretation:

```text
APPLICATION
  → REJECTED
```

Evidence source: activity `Status rejected`.

Truth state: `INFERRED`, not confirmed.

No equivalent explicit persisted status nodes are shown for accepted or future-use branches, so TALOS must not invent them as source truth.

## Foundry candidate map

Advisory only:

```text
Possible Workflow:
CandidateApplicationWorkflow

Possible business/external work boundaries:
- submitApplication
- reviewApplication
- conductInterview
- setRejectedStatus
- sendRejectionMessage
- sendAcceptanceSms
- sendFutureUseMessage

Possible human-interaction candidates:
- application review decision
- interview completion
- final decision

Possible asynchronous interaction mechanisms:
- Signal / Update for reviewer or interviewer decisions
```

The Foundry must decide the actual boundaries.

## Critical rules reinforced by this quarry

```text
BUSINESS REJECTION
      ≠
TECHNICAL FAILURE

BUSINESS MESSAGE
      ≠
KNOWN INTEGRATION

IDENTITY GATEWAY
      ≠
KNOWN AUTH IMPLEMENTATION

FUTURE CV USE
      ≠
PROVEN CONSENT / RETENTION POLICY
```

## Foundry questions

Before executable Temporal design, resolve:

1. Which `Is anonymous` branch corresponds to which condition?
2. What does `Login` mean in the actual system?
3. What stable application/candidate identifier becomes the Workflow identity or correlation key?
4. Is application submission external to the durable workflow or part of it?
5. Who or what performs application review?
6. How does review return `INTERVIEW` versus `REJECT`?
7. Is interview a human interaction, subprocess, external system, or mixed stage?
8. How is interview completion observed?
9. Who owns the final decision?
10. Can final decision occur asynchronously after interview?
11. What exactly does `Keep for further use` mean operationally?
12. Is candidate consent required before CV retention, and where is that policy defined?
13. What system stores application status?
14. What system/provider sends SMS?
15. What channels are used for rejection and CV-saving messages?
16. Are messaging failures business-visible, retryable technical failures, or both?
17. What retry, timeout, cancellation, idempotency and audit requirements apply?

## Handoff verdict

```text
SEMANTIC NORMALIZATION              ✅
SOURCE PROVENANCE                   ✅
IDENTITY GATE                       ✅ SOURCE-LIMITED
OPTIONAL SUBMISSION PATH            ✅
REVIEW / INTERVIEW FLOW             ✅ SOURCE-LIMITED
SHARED REJECTION PATH               ✅
THREE FINAL OUTCOMES                ✅
SMS CHANNEL EVIDENCE                ✅
RETENTION INTENT                    ✅ SOURCE-LIMITED
STATE EVIDENCE                      ✅ INFERRED
TEMPORAL CANDIDATES                 ✅ SUGGESTED
EXECUTION SEMANTICS                 🟡 INCOMPLETE
TEMPORAL CODE                       ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-04` is ready for comparison with later quarries.
