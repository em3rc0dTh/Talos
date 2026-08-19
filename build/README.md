# TALOS — Build

Status: **REFERENCE VERTICAL-SLICE BUILD OPEN / BROAD PRODUCT BUILD CLOSED**

The only authorized implementation scope is:

```text
build/reference-vertical-slice/
```

Authorization:

```text
plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.1.md
```

Active implementation plan:

```text
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.2.md
```

## Current BUILD state

```text
B0 contract manifest / workspace / dependency boundaries    ✅ CLOSED
B1 IDs / deterministic JSON / SQLite repositories            ✅ CLOSED
B2 Canvas/source/intake + C01–C20                            🟢 NEXT / OPEN
B3 canonical/provenance/validation                           ⚪
B4 explanation/review/correction/freeze                      ⚪
B5 capability/human/form/binding                             ⚪
B6 ExecutionPlan/mapping/policy/deployment domains           ⚪
B7 Temporal worker/reference provider                        ⚪
B8 minimal reference API/web                                 ⚪
B9 actual Temporal E2E runtime + evidence                     ⚪
B10 failure/retry/restart/lineage closure                    ⚪
```

## Closed BUILD evidence

```text
test/87-B0-CONTRACT-MANIFEST-WORKSPACE-BOUNDARY-RESULT-v0.1.md
test/88-B1-FOUNDATION-SQLITE-RESULT-v0.1.md
```

B1 now provides the reference foundation:

```text
opaque cross-layer IDs
deterministic JSON + SHA-256
append-only immutable Talos SQLite repository
restart/reopen durability
reference provider SQLite isolation
idempotent provider-effect store
ongoing architecture dependency verifier
```

## Build principles

1. Source adapters do not depend on Temporal directly.
2. UI graph structures do not become domain truth.
3. Temporal runtime structures do not become canonical process truth.
4. Runtime execution pins immutable design identities.
5. Capability bindings remain explicit and versioned.
6. AI-produced semantics preserve truth/provenance classification.
7. Implementation ships with executable evidence for the stage it closes.
8. A frozen-contract defect stops the affected BUILD stage; code never silently patches architecture.
9. A downstream test is not pulled into an earlier stage by fabricating the downstream object it expects.

## B2 boundary

B2 owns native Canvas/source/intake mechanics. Canonical normalization and semantic validation remain B3.

Historical C01–C20 fixtures will therefore be decomposed into stage-owned assertions rather than falsely marked end-to-end before B3 exists.

## Still not authorized

```text
BPMN/image/language/n8n adapter implementation
real SaaS connectors
production IAM/secrets
production Temporal deployment
multi-user collaboration
full product visual polish
broad provider/source expansion
```
