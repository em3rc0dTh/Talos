# R0-05 — Private Technical Preview Release Certification — Brainstorm v0.1

Status: ACTIVE  
Date: 2026-08-24

## Problem

Talos has independently closed its technical engine, private-preview boundary, operator recovery, real external capability effect, and real image/model inference. Those proofs do not by themselves identify one immutable repository artifact as a release.

```text
INDIVIDUAL GREEN GATES
    !=
CERTIFIED RELEASE ARTIFACT
```

R0-05 therefore adds no product semantics. It binds the already-proven contracts into one exact-SHA release story and refuses the v0.1 Private Technical Preview claim unless that story is green on the merged release artifact.

## Release candidate truth

The release evidence must identify:
- exact Git commit SHA
- exact Node/Python/model runtime versions used by live boundaries
- exact image fixture digest used by R0-04B
- actual R0-04A external effect execution
- actual R0-04B model/provider inference
- restart/durability regression
- explicit authority regression
- secret-safe evidence

A PR head may prove that the certification mechanism itself is valid. It is not the final release artifact. Final release authority requires the same workflow to run on the merged `main` SHA.

## Required continuous story

```text
fresh exact checkout
→ exact npm install
→ architecture verification
→ private-preview access/config/operator recovery
→ restart safety
→ explicit workflow execution authority
→ real Temporal Activity → real GitHub external effect
→ pinned real SmolVLM provider + exact PNG
→ exact response correlation
→ inferred non-executable BPMN review candidate
→ prove no automatic confirmation/freeze/execution
→ prove no bearer secret in persisted/log evidence
→ emit exact-SHA release receipt
```

The existing I8/I9 tests remain the detailed proof of review, capability choice, automation approval, deployment approval and workflow-execution authority. R0-05 does not collapse those distinct human decisions into one release switch.

## Release claim

Only after the exact merged `main` SHA passes the R0-05 workflow may Talos say:

> **Talos v0.1 — Private Technical Preview READY**

This is not a public-production, multi-tenant IAM, or unrestricted-hosting claim.
