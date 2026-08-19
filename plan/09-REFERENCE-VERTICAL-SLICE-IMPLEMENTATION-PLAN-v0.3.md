# TALOS — Reference Vertical Slice Implementation Plan v0.3

Status: **ACTIVE IMPLEMENTATION PLAN — B5 INPUT CLARIFICATION**  
Date: **2026-08-19**  
Supersedes for active implementation planning: `09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.2.md`  
Historical v0.2 remains preserved.

## Scope of v0.3

All v0.2 stages, constraints, policies, failure cases, provider isolation, runtime evidence requirements and non-scope remain unchanged.

v0.3 closes one planning gap discovered before B5 implementation:

```text
accepted semantic meaning
= "Send confirmation email"

REFERENCE_EMAIL_SINK provider interface
requires a destination address

v0.2 did not say how the logical destination input enters the reference design/runtime.
```

This is a planning gap, not a frozen Phase-1–5 architecture defect.

---

# 1. Recipient input law

TALOS must not invent:

```text
requesterEmail
customerEmail
employeeEmail
reviewerEmail
```

or claim that any particular process participant is the notification recipient.

The accepted semantic scope establishes only:

```text
COMMUNICATION
SEND_NOTIFICATION
channel = EMAIL
```

A capability-design consequence of selecting the EMAIL channel is that the communication capability requires a logical destination address.

B5 therefore creates:

```text
CapabilityInputContract
  field = recipientEmail
  requiredDataState = REQUIRED_AT_EXECUTION

CapabilityRequirementFacet
  facetKind = INPUT
  propertyPath = input.recipientEmail
  designBasis = SEMANTIC_DERIVED
  designState = REQUIRED
```

This facet means:

> an email send operation cannot be executed without a destination email address.

It does **not** mean:

> the source/business semantics identified who that recipient is.

No canonical `DataObject` or `ProcessVariable` is fabricated merely to host this capability-design input.

---

# 2. B5 provider mapping

The reference offering exposes a logical provider-side input:

```text
REFERENCE_EMAIL_SINK v1
input.to
```

The immutable B5 binding maps:

```text
CapabilityInputContract.recipientEmail
        ↓ RENAME
REFERENCE_EMAIL_SINK.input.to
```

This mapping is complete even though the concrete value is not stored in the binding design.

The actual email address is runtime data, not provider configuration and not a secret/configuration slot.

Therefore B5 must not place the recipient value into:

```text
ConfigurationResolutionSlot
CredentialResolutionContract
static binding constant
ProcessRevision
SemanticFreezeRecord
```

---

# 3. B6 execution data handoff

B6 must represent the unresolved-at-design value as an execution input/data dependency.

Reference execution input name:

```text
notificationRecipientEmail
```

B6 maps:

```text
Execution input notificationRecipientEmail
        ↓
CapabilityUseOccurrence logical input recipientEmail
```

This is a reference execution-design input name, not newly discovered business source truth.

The `ExecutionPlanRevision` remains traceable to the B5 logical capability input requirement.

---

# 4. B8/API runtime input

The minimal reference API/UI must require the test/operator to supply:

```text
notificationRecipientEmail
```

before starting the reference Workflow execution.

Reference tests may use an explicit `.test` address such as:

```text
recipient@example.test
```

but that value exists only as test/runtime input.

It must not appear in:

```text
initial Canvas source
ProcessRevision PR1/PR2
SemanticClaim as business source truth
SemanticFreezeRecord
CapabilityBindingRevision as static recipient
```

---

# 5. B7/B9 runtime consumption

The compiled/pinned execution snapshot supplied to the Workflow may include the runtime input contract needed for deterministic execution.

The actual runtime invocation supplies the concrete `notificationRecipientEmail` value.

The email capability/Activity receives the value through the persisted B5/B6 mapping chain:

```text
runtime input
→ execution data dependency
→ CapabilityUseOccurrence logical recipientEmail
→ CapabilityInputMapping
→ REFERENCE_EMAIL_SINK input.to
```

Worker/provider code may not contain a fallback recipient address.

Missing or invalid recipient runtime input must fail validation before the provider side effect.

---

# 6. Non-effect on business semantics

This plan clarification does not change:

```text
ProcessRevision
SemanticFreezeRecord
business actor responsibility
business outcome meaning
EMAIL channel requirement
```

It also does not authorize a source correction or business inference.

The distinction is:

```text
BUSINESS SEMANTIC:
notification is email

CAPABILITY-DESIGN REQUIREMENT:
an email destination value is required

REFERENCE EXECUTION INPUT:
notificationRecipientEmail supplies that value at runtime
```

---

# 7. V41 planning regression

v0.3 must pass focused fixture:

```text
V41 — Notification recipient input provenance
```

Pass conditions:

```text
recipientEmail exists as SEMANTIC_DERIVED capability input
no requester/customer identity is invented
B5 maps recipientEmail → provider input.to
B5 stores no concrete recipient value
B6 owns execution-input dependency
B8/B9 supply concrete .test value only at runtime
missing runtime value cannot fall back silently
```

All V01–V40 v0.2 expectations remain unchanged.

---

# 8. Active BUILD stages

The bounded authorization remains only:

```text
B0–B10
build/reference-vertical-slice/
```

No broad product scope is added.
