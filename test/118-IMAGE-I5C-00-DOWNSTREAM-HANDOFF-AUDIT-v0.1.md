# TALOS — IMAGE I5C-00 Downstream Handoff Audit v0.1

Status: **AUDIT CLOSED / NO-GO FOR REFERENCE-BUILDER REUSE**  
Date: **2026-08-20**

## Question

After I5B semantic freeze, can the existing Phase-4 / Phase-5 reference builders be reused unchanged for frozen Quarry-02 simply because the architecture contracts are source/process-agnostic?

```text
answer = NO
```

This is an implementation-boundary result, not a failure of the frozen Phase-4 / Phase-5 contracts.

## Contract review

The active Capability Contract v0.2 is intentionally provider-agnostic and explicitly preserves laws including:

```text
CapabilityRequirement ≠ Offering ≠ Match ≠ Binding
implemented behavior ≠ hard provider requirement
human requirement ≠ form/UI/runtime primitive
n8n offering ≠ durable orchestration authority
pure orchestration semantics may require zero external capability
```

Therefore the architecture permits a different process to reach capability design without inventing approval, email, Gmail, n8n, AI, forms, or provider meaning.

## Implementation audit — Phase 4 reference designer

Current function:

```text
designReferenceCapabilities(...)
```

is intentionally bound to the original approval/email reference process. It searches semantic subjects by literal names:

```text
Review request
Send confirmation email
Manager
```

and creates reference-specific design meaning including:

```text
HUMAN_INTERACTION
COLLECT_APPROVAL
APPROVED / REJECTED
approve/reject FormRevision
recipientEmail
COMMUNICATION / SEND_NOTIFICATION
channel = EMAIL
REFERENCE_EMAIL_SINK
```

Those meanings are valid for the reference approval fixture. They are not justified merely by Quarry-02's frozen business semantics.

## Implementation audit — Phase 5 reference ExecutionPlan

Current function:

```text
designReferenceExecutionPlan(...)
```

requires literal reference-process subjects:

```text
Request submitted
Review request
Approved?
Send confirmation email
Completed
Rejected
```

It additionally assumes:

```text
one HUMAN_INTERACTION capability requirement
one COMMUNICATION capability requirement
notificationRecipientEmail execution input
REFERENCE_EMAIL_SINK invocation on approved path
```

Quarry-02 does not contain those semantic subjects or accepted capability-design decisions.

## Implementation audit — Temporal mapping

Current function:

```text
designReferenceTemporalMapping(...)
```

maps the bounded reference execution shape into:

```text
HUMAN_COORDINATION
  → UPDATE_HANDLER + WORKFLOW_CONDITION

CAPABILITY_INVOCATION
  → ACTIVITY / REFERENCE_EMAIL_SIDE_EFFECT
```

The implementation itself states that the human pattern is not a universal rule. It remains appropriate for the bounded reference slice only.

## Quarry-02 accepted semantic truth

The current frozen image-derived process establishes business semantics such as:

```text
Deliver Water
  → Order fulfilled [END]

Arrange Delivery
  subprocessMode = COLLAPSED_SUBPROCESS

Customer Exist?
  ├─ NO  → Customer does not exist
  │        customerExists == false
  └─ YES → Customer exists
           customerExists == true
```

Nothing in that frozen meaning authorizes Talos to manufacture:

```text
Manager approval
approve/reject form
email recipient
email channel
REFERENCE_EMAIL_SINK
Gmail
n8n
AI
Temporal Activity
Child Workflow
```

## Decision

```text
reuse designReferenceCapabilities      NO-GO
reuse designReferenceExecutionPlan     NO-GO
reuse designReferenceTemporalMapping   NO-GO
reopen Phase-4/5 contracts             NOT REQUIRED
send Quarry-02 directly to Temporal    FORBIDDEN
```

The reference vertical slice remains valid and regression-protected. The image vertical slice must add a separate generic implementation path against the same frozen contracts.

## New gate

```text
I5C-01 — GENERIC CAPABILITY DESIGN

SemanticFreezeRecord
        ↓
accepted ScopeFreezeRecord
        ↓
frozen ProcessRevision
        ↓
semantic-subject classification
        ↓
capability requirement derivation
        ↓
property/facet-level provenance
        ↓
UNRESOLVED where semantics do not justify more
        ↓
NO provider/runtime invention
```

Required properties:

```text
1. no source-type switch for IMAGE/BPMN/Canvas/etc.
2. no literal process labels such as Review request / Send confirmation email
3. semantic meaning drives requirements, not visual origin
4. pure orchestration elements may produce no external capability requirement
5. ambiguous ACTION meaning stays unresolved rather than being guessed into a provider family
6. human/form specialization occurs only when HUMAN_INTERACTION semantics are actually frozen
7. capability provenance pins exact SemanticFreezeRecord / ScopeFreezeRecord / ProcessRevision / ValidationAssessment
8. no ExecutionPlan or Temporal artifact is created by capability derivation
```

Only after I5C-01 is accepted may Talos open a generic ExecutionPlan gate for Quarry-02.

## Audit result

**I5C-00 is CLOSED with a deliberate NO-GO for reference-builder reuse. I5C-01 is NEXT.**