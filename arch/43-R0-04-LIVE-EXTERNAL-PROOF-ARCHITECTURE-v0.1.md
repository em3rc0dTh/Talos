# R0-04 — Live External Provider + Integration Proof — Architecture v0.1

Status: R0-04A LIVE PROOF OBSERVED / R0-04B PENDING  
Date: 2026-08-24

## Architectural position

R0-04 adds real adapters at existing runtime boundaries. It does not change canonical semantics or the I8/I9 authority model.

```text
I8/I9 approved execution
        ↓
CompiledGenericRuntimeProgram
        ↓
TalosGenericWorkflow
        ↓
executeGenericCapability
        ↓
GenericCapabilityTransport (runtime injection)
        ↓
real external system
```

## Core vs adapter

### Generic runtime core

`generic-contracts.ts`
- Activity result may carry optional transport/effect/evidence refs.

`generic-activities.ts`
- deterministic effect identity
- in-memory duplicate/conflict protection
- optional transport interface
- evidence validation
- old ledger-only behavior when no transport is configured

`generic-worker-runtime.ts`
- optional transport dependency injected into Activity creation

These files know nothing about GitHub business meaning.

### Certification adapter

`github-issue-comment-transport.ts`
- GitHub REST request construction
- token held only in adapter options
- exact repository + issue/PR targeting
- external idempotency marker lookup
- effect creation
- concrete GitHub evidence refs

This adapter is replaceable. It is not a canonical capability family or semantic assumption.

## Retry and crash boundary

The order is deliberately:

```text
local duplicate lookup
→ external idempotent transport
→ local effect record
```

If the external call succeeds but the Worker crashes before local recording, a retry/new Worker re-enters the transport. The GitHub marker detects the already-created effect and returns `DUPLICATE_IDENTICAL`.

Therefore external correctness does not depend on the local ledger surviving the Worker process.

## Evidence boundary

External Activity result may expose:
- transport reference
- external effect reference
- repository/PR/comment identifiers
- public effect URL
- Talos effect key
- approved input digest

It must not expose:
- GitHub token
- authorization header
- provider secret

## Failure classification

Non-retryable:
- invalid capability input
- auth/scope/target rejection
- invalid provider response
- same effect key with different input digest
- missing external evidence

Retryable:
- transient network/server failures not classified above

Temporal Activity retry policy remains explicitly designed in the compiled RuntimePolicy.

## R0-04B architecture

Image inference remains on the existing image-perception provider boundary:

```text
image bytes
→ provider runtime binding
→ correlated provider transport
→ ImagePerceptionAttempt/Result
→ common source evidence
→ process review
```

R0-04B must supply a real provider implementation/configuration at that boundary; it must not route model output around the established evidence/correlation contracts.
