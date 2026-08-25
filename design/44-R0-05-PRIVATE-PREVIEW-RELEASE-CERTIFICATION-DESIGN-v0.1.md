# R0-05 — Private Technical Preview Release Certification — Design v0.1

Status: ACTIVE  
Date: 2026-08-24

## Goal

Certify one immutable Talos repository artifact as the v0.1 Private Technical Preview without adding new product semantics or collapsing any human authority boundary.

## Release distinction

```text
PR CANDIDATE GREEN
    !=
MERGED MAIN RELEASE AUTHORITY
```

The pull-request run validates the release mechanism on an exact candidate SHA. The final release claim is authorized only by the same R0-05 workflow completing successfully on the exact SHA produced by a push to `main`.

## Certification composition

The release job uses one exact checkout and one exact dependency lock, then proves:

1. architecture/module boundaries
2. core B1–B9 reference runtime
3. complete image I0–I9 authority chain
4. private-preview access/config/operator recovery
5. restart-safe durable state
6. explicit workflow-execution authority
7. real R0-04A Temporal Activity → GitHub external effect
8. real R0-04B PNG → pinned SmolVLM/CV provider → exact correlated evidence
9. no automatic business confirmation, semantic freeze, deployment or execution from image inference
10. no provider/access bearer material in safe/persisted evidence
11. final exact-SHA release receipt

## External effect sink

PR #50 is the release-certification evidence sink. R0-04A derives its effect identity from the exact release SHA, so:

- candidate PR SHA creates at most one idempotent candidate effect
- merged `main` SHA creates a distinct at-most-one release effect
- a Worker restart must resolve the same external effect instead of duplicating it

The PR may already be merged when the `main` push run executes; GitHub issue-comment semantics still provide the external evidence boundary.

## Live vision proof

R0-05 reuses the exact merged R0-04B runtime:

- `HuggingFaceTB/SmolVLM-500M-Instruct`
- revision `a7da5b986cb59b408707209984f360a5f4ad7e47`
- pipeline `talos-r0-04b-smolvlm-500m-cv-http-v0.7`
- exact PNG fixture SHA-256 `550de02e9647681bb271fa437b2822598ad0438cf4efa8481def38f67ff9d784`
- provider timeout remains 120000 ms

No R0-05 fallback graph or model bypass is permitted.

## Receipt semantics

The workflow summary must state the exact Git SHA and event type.

For `pull_request`:

```text
release authority: CANDIDATE ONLY
```

For successful `push` on `refs/heads/main`:

```text
release authority: CERTIFIED MERGED MAIN
scope: PRIVATE_TECHNICAL_PREVIEW
```

## Non-goals

R0-05 does not claim:
- public production readiness
- multi-tenant IAM
- unrestricted internet exposure
- broad provider/vendor certification
- autonomous business authority
- automatic deployment or execution authority
