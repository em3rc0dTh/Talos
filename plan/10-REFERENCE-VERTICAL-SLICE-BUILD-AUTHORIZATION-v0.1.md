# TALOS — Reference Vertical Slice BUILD Authorization v0.1

Status: **ACTIVE BOUNDED BUILD AUTHORIZATION**  
Date: **2026-08-19**

Authorization source:

```text
test/86-POST-PHASE-5-BUILD-OPENING-REVIEW-FINAL-RESULT-v0.1.md
```

Active implementation plan:

```text
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.2.md
```

## Authorized path

```text
build/reference-vertical-slice/
```

## Authorized stages

```text
B0 contract manifest / workspace / dependency boundaries
B1 IDs / deterministic JSON / SQLite repositories
B2 Canvas/source/intake + C01–C20
B3 canonical/provenance/validation
B4 explanation/review/correction/freeze
B5 capability/human/form/binding
B6 ExecutionPlan/mapping/policy/deployment domains
B7 Temporal worker/reference provider
B8 minimal reference API/web
B9 actual Temporal end-to-end runtime + evidence
B10 failure/retry/restart/lineage closure
```

Each stage must pass before progression.

## Not authorized

All scope exclusions in implementation plan v0.2 remain binding, especially other source-family implementations, real SaaS providers and production deployment.

## Stop rule

Any frozen-contract defect discovered by implementation closes the affected BUILD stage immediately until versioned design/architecture evolution and regression restore compatibility.
