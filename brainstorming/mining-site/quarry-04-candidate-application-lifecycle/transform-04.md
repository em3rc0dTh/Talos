# Quarry 04 — Transform 04

## Objective

Interpret `source-04` without replacing its origin, normalize the visible candidate-application semantics into TALOS concepts, compare the evidence against Quarries 01–03, and prepare `foundry-source-04`.

No executable code is produced here.

## 1. Identity / access branch

The process begins:

```text
START
  ↓
EXCLUSIVE GATEWAY: Is anonymous
```

One outgoing path is labeled `Login` and continues through `Submitting application` before reaching `Application's review`. The second outgoing path reaches `Application's review` directly.

Truth discipline:

- `SOURCE_TRUTH`: the gateway, both outgoing paths, the `Login` label, and the visible topology.
- `UNRESOLVED`: which path semantically means anonymous and which means non-anonymous.
- `INFERRED`: the gateway likely controls an identity/access precondition before application review.

TALOS must not silently assign `YES/NO` conditions because the image does not show them.

This introduces a useful semantic category:

```text
IDENTITY / ACCESS CONDITION
```

but it remains provisional until reinforced by later quarries.

## 2. Conditional pre-processing before a shared stage

The upper path contains:

```text
Login
  ↓
Submitting application
  ↓
Submit application
  ↓
Application's review
```

The direct path bypasses those activities and converges at `Application's review`.

Canonical topology:

```text
IDENTITY_GATEWAY
  ├── PATH-A → SUBMITTING_APPLICATION ─┐
  └── PATH-B ──────────────────────────┤
                                      ↓
                              APPLICATION_REVIEW
```

The named merge is normalization; the convergence is source truth.

This strengthens the Q02 evidence that branch convergence may exist even when the source does not draw a separate merge gateway.

## 3. Review stage with early rejection

`Application's review` has at least two visible outgoing outcomes:

```text
INTERVIEW
REJECT
```

Canonical normalization:

```text
APPLICATION_REVIEW
  ├── ADVANCE_TO_INTERVIEW
  └── REJECT
```

`ADVANCE_TO_INTERVIEW` is normalized wording for the flow labeled `Interview`; it is not a source label.

Important distinction:

```text
REVIEW RESULT
      ≠ automatically a technical failure
```

A rejected candidate is a legitimate business result.

## 4. Interview stage

The source shows:

```text
Application's review
  ↓ `Interview`
Interview
  ↓ `Finish interview`
Final decision
```

The diagram does not establish whether `Interview` is a human meeting, automated assessment, scheduling subprocess, or a broader stage.

Therefore:

```text
INTERVIEW
semantic type: business activity / stage
execution mapping: UNRESOLVED
```

This reinforces the Mining Site rule that business activities do not automatically map to Temporal Activities.

## 5. Final decision with three business outcomes

`Final decision` has three explicit outgoing paths:

```text
KEEP_FOR_FURTHER_USE
ACCEPT_APPLICATION
REJECT
```

The source labels are:

- `Keep for further use`
- `Accept application`
- `Reject`

These are three distinct domain outcomes.

Canonical candidate result:

```text
FINAL_DECISION
  ├── ACCEPT
  ├── REJECT
  └── KEEP_FOR_FURTHER_USE
```

The normalized constants are semantic aliases; original labels remain linked by provenance.

## 6. Shared rejection handling

Two different stages can reject:

```text
Application's review
Final decision
```

Both converge on:

```text
Status rejected
  ↓
Rejection message
  ↓
Finish 1
```

This is stronger evidence than previous quarries for a reusable downstream handling path reached from multiple decision points.

Potential TALOS semantic pattern:

```text
MULTI-SOURCE CONVERGENCE
        ↓
SHARED BUSINESS HANDLING
```

The Foundry may later decide whether this becomes one shared function, workflow-local branch, child workflow, or state handler. Mining Site does not decide that.

## 7. Explicit communication channels

The source explicitly names one channel:

```text
Inform candidates via SMS
```

Therefore:

- `SOURCE_TRUTH`: SMS is part of the accepted-application communication activity.
- `UNRESOLVED`: SMS provider, template, phone source, delivery confirmation, retry policy, and fallback behavior.

Other communication nodes are generic:

```text
Rejection message
Send a message about saving CV
```

TALOS must not infer email, SMS, WhatsApp, push, or another channel for those generic messages.

This strengthens the distinction:

```text
BUSINESS COMMUNICATION INTENT
        ≠
INTEGRATION IMPLEMENTATION
```

## 8. Candidate retention / future-use outcome

The `Keep for further use` branch leads to:

```text
Send a message about saving CV
  ↓
Finish 3
```

The source proves the business intent to communicate about saving the CV for future use.

It does **not** prove:

- candidate consent;
- legal retention basis;
- storage duration;
- jurisdiction;
- data deletion policy;
- talent-pool enrollment mechanics.

Therefore TALOS records the branch but must not invent compliance semantics.

## 9. State-transition evidence

The node `Status rejected` strongly suggests an application status transition, but the source only gives an activity label.

Truth discipline:

- `SOURCE_TRUTH`: an activity named `Status rejected` exists.
- `INFERRED`: the application may enter a persisted `REJECTED` state.
- `UNRESOLVED`: where that state is stored and whether the node represents mutation, display, or another operation.

This reinforces the business-object/state evidence first surfaced in Quarry 02.

## 10. Candidate Temporal interpretation

Advisory only:

```text
Possible Workflow:
CandidateApplicationWorkflow

START
  ↓
identity/access branch
  ↓
optional application submission
  ↓
application review
  ├── rejected → shared rejection handling → complete
  └── advance → interview
                  ↓
               final decision
                  ├── accept → SMS notification → complete
                  ├── reject → shared rejection handling → complete
                  └── keep for future use → retention-message action → complete
```

Possible Temporal concepts:

- one Workflow per application/candidacy;
- Activities or human-interaction boundaries for review, interview, messaging and state mutation;
- Updates/Signals if human decisions arrive asynchronously;
- shared deterministic branch for rejection handling.

None of these are executable truth yet.

## 11. Comparison with Quarries 01–03

### Reinforced evidence

Q04 reinforces:

- start/end events;
- exclusive branching;
- branch convergence;
- multiple terminal business outcomes;
- business rejection as domain result rather than technical failure;
- explicit communication activity;
- state-transition evidence;
- business node ≠ automatic Temporal Activity.

### New semantic evidence

Q04 newly introduces or strongly sharpens:

- identity/access gating before the core process;
- optional pre-processing before a shared downstream stage;
- early-stage and late-stage rejection converging on shared handling;
- three-way final business decision;
- explicit communication channel (`SMS`) on one branch while other message channels remain unspecified;
- future-retention intent with unresolved privacy/compliance semantics.

## Transform verdict

```text
SOURCE READING                     ✅
IDENTITY / ACCESS GATE             ✅ SOURCE-LIMITED
OPTIONAL PRE-PROCESSING            ✅
BRANCH CONVERGENCE                 ✅
EARLY + LATE REJECTION             ✅
SHARED REJECTION HANDLING          ✅
THREE-WAY DOMAIN DECISION          ✅
COMMUNICATION CHANNEL EVIDENCE     ✅
STATE EVIDENCE                     ✅ SOURCE-LIMITED
RETENTION INTENT                   ✅ SOURCE-LIMITED
UNCERTAINTIES                      ✅
TEMPORAL CANDIDATES                ✅ SUGGESTED
TEMPORAL CODE                      ⛔ NOT NEEDED
```
