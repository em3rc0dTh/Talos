# R0-04 — Live External Provider + Integration Proof — Brainstorm v0.1

Status: R0-04A LIVE PROOF OBSERVED / R0-04B PENDING  
Date: 2026-08-24

## Problem

I9 proves Talos can execute a real Temporal workflow under explicit authority. R0-01 through R0-03 make that engine privately accessible, fail-closed, secret-safe, and operable across durable runtime restarts.

The remaining engineering release gap is external reality.

A reference Activity that only records an in-memory effect does not prove Talos can safely cross a real provider/system boundary.

## R0-04 decomposition

```text
R0-04A  REAL EXTERNAL CAPABILITY EFFECT
R0-04B  REAL IMAGE / MODEL PROVIDER INFERENCE
```

Both are required before R0-04 is closed.

## R0-04A law

```text
CAPABILITY BOUND
    !=
TEMPORAL ACTIVITY RAN
    !=
EXTERNAL SYSTEM CALLED
    !=
EXTERNAL EFFECT OBSERVED
    !=
EXTERNAL EFFECT IDEMPOTENT
```

The certification integration is GitHub PR issue comments because GitHub Actions can provide a repository-scoped runtime credential without placing a long-lived secret in the repository or chat.

GitHub is a certification adapter, not canonical process meaning and not a Talos product default.

## Required R0-04A path

```text
TalosGenericWorkflow
    ↓
executeGenericCapability
    ↓
GenericCapabilityTransport
    ↓
GitHubIssueCommentCapabilityTransport
    ↓
GitHub REST
    ↓
real PR comment
    ↓
external evidence refs
```

## Idempotency requirement

Temporal retry/restart safety must survive loss of the in-memory Worker ledger.

The external GitHub comment therefore carries a non-secret marker containing:

- deterministic Talos effect key
- approved capability input digest

```text
same effect key + same input digest
    → DUPLICATE_IDENTICAL

same effect key + different input digest
    → FAIL CLOSED / IDEMPOTENCY CONFLICT
```

## Observed candidate evidence

On PR #48, exact head `a6ffd80e2166326a61103a026b671f9e0885271a` produced GitHub issue comment `5399583362` from the real Temporal Activity path.

A second Worker lifecycle with a fresh local ledger resolved to that same external comment and created no second comment.

This observation is not the final merge certificate because later documentation commits will move the candidate head and require exact-head rerun.

## R0-04B

R0-04B must use the existing credential-safe image perception contract with a real currently supported model/provider.

Requirements:
- real image bytes
- real network inference
- provider/model identity
- exact response correlation
- structured process evidence
- no provider secret persistence or response exposure
- continuation into the existing process-review path

A fixture, deterministic fake, retired provider, or manually fabricated provider receipt is not sufficient.

## Non-goals

R0-04 does not make GitHub mandatory for Talos, add generic webhooks without explicit binding, or weaken I8/I9 authority gates.
