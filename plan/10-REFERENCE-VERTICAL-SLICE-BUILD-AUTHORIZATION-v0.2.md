# TALOS — Reference Vertical Slice BUILD Authorization v0.2

Status: **ACTIVE BOUNDED BUILD AUTHORIZATION**  
Date: **2026-08-19**  
Supersedes active authorization v0.1. Historical v0.1 remains preserved.

Authorization origin remains:

```text
test/86-POST-PHASE-5-BUILD-OPENING-REVIEW-FINAL-RESULT-v0.1.md
```

Active implementation plan is now:

```text
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.3.md
```

Plan-evolution evidence:

```text
test/93-REFERENCE-VERTICAL-SLICE-PLAN-v0.3-RECIPIENT-INPUT-REGRESSION-v0.1.md
```

## Authorized path

```text
build/reference-vertical-slice/
```

## Authorized stages

Unchanged:

```text
B0 contract manifest / workspace / dependency boundaries
B1 IDs / deterministic JSON / SQLite repositories
B2 Canvas/source/intake
B3 canonical/provenance/validation
B4 explanation/review/correction/freeze
B5 capability/human/form/binding
B6 ExecutionPlan/mapping/policy/deployment domains
B7 Temporal worker/reference provider
B8 minimal reference API/web
B9 actual Temporal end-to-end runtime + evidence
B10 failure/retry/restart/lineage closure
```

## v0.3 clarification authority

The authorization now explicitly permits the implementation-plan-only recipient-input distinction:

```text
business semantic: EMAIL notification
capability input: recipientEmail (SEMANTIC_DERIVED)
execution input: notificationRecipientEmail
concrete recipient value: runtime/test only
```

It does not authorize invention of requester/customer recipient semantics.

## Not authorized

All prior exclusions remain binding, especially:

```text
other source-family implementations
real SaaS providers
production IAM/secrets
production Temporal deployment
multi-user collaboration
broad product expansion
```

## Stop rule

Any frozen-contract defect closes the affected BUILD stage until versioned DESIGN/ARCH evolution and regression restore compatibility.
