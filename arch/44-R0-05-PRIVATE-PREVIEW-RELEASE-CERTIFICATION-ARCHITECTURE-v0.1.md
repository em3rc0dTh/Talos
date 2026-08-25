# R0-05 — Private Technical Preview Release Certification — Architecture v0.1

Status: ACTIVE  
Date: 2026-08-24

## Architectural rule

R0-05 is a certification layer over the frozen Talos engine. It may compose existing gates, but it may not manufacture new domain authority or alter canonical/runtime semantics in order to obtain a green release.

```text
R0-05 CERTIFIER
    ↓ exact SHA
┌─────────────────────────────────────────────┐
│ architecture + B1–B9                       │
│ image I0–I9 authority chain                │
│ R0-01 access                               │
│ R0-02 config/secrets                       │
│ R0-03 operator/recovery                    │
│ B10 restart                                │
│ R0-04A real external effect                │
│ R0-04B real live vision/model              │
└─────────────────────────────────────────────┘
    ↓
SECRET-SAFE / AUTHORITY-SAFE RECEIPT
    ↓
PR candidate OR merged-main certification
```

## Immutable artifact identity

`git rev-parse HEAD` must equal the workflow-selected release SHA before any release test executes and again before the final receipt is emitted.

No branch name, PR number, mutable tag, workflow run number, or documentation revision substitutes for the commit SHA.

## Two-phase release authority

### Phase A — candidate

A pull-request run proves that the R0-05 workflow and repository candidate are coherent. It cannot authorize the final release.

### Phase B — merged main

The merge produces a new immutable SHA. A `push` run of the same workflow on `refs/heads/main` must independently repeat all release proofs against that merge SHA.

Only Phase B can emit `CERTIFIED MERGED MAIN`.

## External boundaries

### R0-04A

The existing GitHub issue-comment transport remains the external capability proof. Effect identity includes the exact release SHA through the execution id. External idempotency remains enforced by effect-key + input-digest evidence.

### R0-04B

The existing loopback provider server remains a certification adapter around a pinned real SmolVLM model plus deterministic source-pixel geometry. The Talos correlation validator remains unchanged and strict.

## Authority boundary preservation

The release workflow proves existing authority tests rather than synthesizing authority records itself.

```text
RELEASE CERTIFIED
    !=
PROCESS CONFIRMED
    !=
SEMANTIC FREEZE
    !=
AUTOMATION APPROVED
    !=
DEPLOYMENT APPROVED
    !=
WORKFLOW EXECUTION APPROVED
```

A release certifies that Talos enforces these distinctions; it does not grant any of them to future process instances.

## Secret boundary

Runtime bearer material may exist only in transient environment/closure-held runtime configuration. It must not be written to repository artifacts, workflow summaries, provider logs, safe descriptors or persisted Talos evidence.

## Release scope

The architectural release scope identifier is:

```text
TALOS_V0_1_PRIVATE_TECHNICAL_PREVIEW
```

It explicitly excludes public-production and multi-tenant security claims.
