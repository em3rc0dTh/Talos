# TALOS — B7 Reference Provider Mapped-Input Correction v0.1

Status: **B7 PROVIDER PASS / IMPLEMENTATION BOUNDARY REPAIRED**  
Date: **2026-08-19**

## Trigger

The first B7 provider service request accepted:

```text
referenceRequestId
capabilityUseOccurrenceId
to
subject
body
effectCreatedAt
```

B5/B6, however, explicitly froze only one logical provider input mapping:

```text
notificationRecipientEmail
→ CapabilityInputFieldRequirement(recipientEmail)
→ CapabilityInputMapping(recipientEmail → input.to)
```

No upstream capability/binding artifact mapped caller-supplied provider `subject` or `body`.

Allowing the future Activity wrapper to supply them would therefore create unmapped implementation inputs and risk presenting reference fixture copy as accepted business meaning.

---

# 1. Repair

The provider request surface is now:

```text
referenceRequestId
capabilityUseOccurrenceId
to
effectCreatedAt
```

Only:

```text
to
```

is a capability/provider business-input mapping.

The other fields are execution/idempotency/audit context.

The test provider owns fixed test-only confirmation content internally:

```text
REFERENCE_CONFIRMATION_SUBJECT
REFERENCE_CONFIRMATION_BODY
```

These constants are provider behavior for the bounded test offering. They are not:

```text
ProcessRevision truth
CapabilityRequirement input
business rule
email-template business policy
runtime user input
```

---

# 2. Provider identity / idempotency unchanged

The frozen key contract remains:

```text
sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
```

The provider still writes through the isolated append-only `reference_email_effects` store.

Same key + same mapped request:

```text
DUPLICATE_IDENTICAL
```

Same key + changed `to` destination:

```text
ReferenceEmailIdempotencyConflictError
```

---

# 3. Failure classes unchanged

```text
TRANSIENT_REFERENCE_FAILURE
→ transient provider-domain failure

INVALID_REFERENCE_REQUEST
→ permanent provider-domain failure
```

Temporal failure translation remains pending the SDK import gate.

---

# 4. Executable result

Command:

```text
node --experimental-strip-types --test \
  build/reference-vertical-slice/tests/b7-reference-provider.test.ts
```

Result:

```text
TOTAL 7
PASS  7
FAIL   0
```

New first assertion explicitly verifies the provider request surface matches the B5/B6 mapped-input boundary.

Other coverage retains:

```text
idempotency derivation
transient failure injection
one logical effect after re-invocation
duplicate-identical handling
changed-destination conflict
permanent invalid request
provider DB restart durability
```

---

# Historical evidence

`test/96-B7-TEMPORAL-SDK-REFERENCE-PROVIDER-PARTIAL-RESULT-v0.1.md` remains preserved.

This result supersedes its provider **request-shape** description and 6/6 count.

Active provider evidence is now:

```text
7 / 7 PASS
```

The Temporal SDK dependency-version correction remains independently governed by:

```text
test/97-B7-TEMPORAL-SDK-BASELINE-CORRECTION-v0.1.md
```

## Verdict

**REFERENCE PROVIDER BOUNDARY PASS. B7 itself remains OPEN because the Temporal Worker import/lock gate is unresolved.**
