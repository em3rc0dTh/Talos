# TALOS — B7 Reference Provider Retry / Idempotency Hardening v0.1

Status: **REFERENCE PROVIDER PASS / RETRY BOUNDARY HARDENED**  
Date: **2026-08-19**

## Trigger

The mapped-input correction correctly reduced the provider's business-facing request to the B5/B6 destination mapping, but an implementation-only timestamp was still caller supplied.

That was unsafe for retry identity.

If the provider effect succeeds but the Activity completion acknowledgement is lost, a later Activity retry may occur at a different wall-clock time. The same logical request must remain duplicate-identical rather than becoming an idempotency conflict merely because the retry happened later.

## Active provider request

```text
referenceRequestId
capabilityUseOccurrenceId
to
```

Meaning:

```text
to                         = B5/B6 mapped provider input
referenceRequestId         = execution/idempotency context
capabilityUseOccurrenceId  = execution/idempotency context
```

The caller no longer provides effect timestamp, subject or body.

The TEST_ONLY provider owns:

```text
first-effect timestamp
fixed reference confirmation subject/body
```

Those provider-local values are not ProcessRevision / CapabilityRequirement / business-policy truth.

## Idempotency equality

Key remains exactly:

```text
sha256(referenceRequestId + ":" + capabilityUseOccurrenceId)
```

Duplicate identity is now:

```text
same idempotency key
+ same logical provider request bytes/hash
```

and explicitly not:

```text
same first-effect timestamp
```

The append-only provider store preserves the first recorded timestamp while allowing a later identical invocation to return:

```text
DUPLICATE_IDENTICAL
```

without inserting another effect.

Changed mapped destination under the same key remains a conflict.

## Executable result

Executed locally on Node 22.16.0:

```text
build/reference-vertical-slice/tests/b7-reference-provider.test.ts

TOTAL 7
PASS  7
FAIL   0
```

Critical retry proof:

```text
first provider invocation clock  = T1
second identical invocation      = T2
T2 != T1

result = DUPLICATE_IDENTICAL
logical provider effect rows = 1
```

Other provider proofs remain:

```text
mapped request surface only
exact SHA-256 key derivation
transient failure injection
changed-destination conflict
permanent invalid request
provider DB restart durability
```

## Historical evidence

This result supersedes only the provider timestamp/request-detail portions of:

```text
test/98-B7-REFERENCE-PROVIDER-MAPPED-INPUT-CORRECTION-v0.1.md
```

The mapped-input principle and 7/7 provider pass remain valid.

## Verdict

**REFERENCE PROVIDER RETRY/IDEMPOTENCY BOUNDARY PASS. B7 remains open because no Temporal SDK Worker artifact exists yet.**
