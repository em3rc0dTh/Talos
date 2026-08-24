# R0-04 — Live External Provider + Integration Proof — Design v0.1

Status: R0-04A LIVE PROOF OBSERVED / R0-04B PENDING  
Date: 2026-08-24

## Goal

Certify that the existing Talos Temporal runtime can cross real external boundaries without creating implicit authority, losing idempotency, or exposing credentials.

## R0-04A design

The existing generic Activity remains the only workflow Activity name:

```text
executeGenericCapability
```

Its implementation now supports an optional transport boundary:

```text
GenericEffectLedger
        +
GenericCapabilityTransport (optional)
```

When no transport is configured, the frozen in-memory reference behavior remains unchanged.

When a transport is configured:

1. validate exact Activity input
2. derive deterministic effect key + input digest
3. resolve any already-recorded local identical effect
4. invoke the configured transport
5. require concrete external effect evidence
6. append the result to the local effect ledger
7. return transport/effect/evidence refs to the Workflow result

## External GitHub certification adapter

`GitHubIssueCommentCapabilityTransport` is an explicit reference adapter used to certify the external boundary.

Configuration:
- exact `owner/repo`
- exact PR/issue number
- runtime token
- optional fetch implementation/API base for tests

The token is runtime-only and is never returned as evidence.

## External idempotency

Marker form:

```text
<!-- talos-effect:<effectKey>:<inputDigest> -->
```

Before POST, the adapter lists existing comments on the exact PR/issue.

Decision:

```text
exact marker exists
    → return same externalEffectRef
    → DUPLICATE_IDENTICAL

same effect key prefix + different input digest exists
    → non-retryable idempotency conflict

no marker
    → create comment
    → require concrete GitHub comment id
```

This lets restart/retry safety survive an empty new Worker ledger.

## Live CI design

Dedicated PR workflow:

```text
architecture guard
→ I9-07 exact-head regression
→ local Temporal test environment
→ Worker #1 + GitHub transport
→ TalosGenericWorkflow
→ real GitHub PR comment
→ Worker shutdown
→ Worker #2 with fresh ledger
→ same approved Activity input
→ same external comment resolved
→ assert exactly one external marker
```

The workflow requests only repository permissions needed for reading code and writing the PR evidence comment.

## Authority invariant

```text
TRANSPORT CONFIGURED
    !=
CAPABILITY SELECTED
    !=
AUTOMATION APPROVED
    !=
WORKFLOW EXECUTION APPROVED
```

R0-04A does not bypass I9. The dedicated live workflow separately reruns I9-07 on the same candidate head.

## R0-04B design target

Use the existing `resolveImagePerceptionRuntimeBinding(...)` credential-safe provider configuration and the already-certified response correlation path.

The live provider gate must prove:

```text
real PNG bytes
→ real provider call
→ correlated provider response
→ model/provider descriptor
→ evidence projection
→ BPMN/process review candidate
```

Secret material must remain transient and absent from Talos persisted/public evidence.
