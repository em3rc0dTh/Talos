# TALOS — Build

Status: **REFERENCE VERTICAL-SLICE BUILD OPEN / BROAD PRODUCT BUILD CLOSED**

TALOS does not treat architecture completion as permission for unrestricted implementation.

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
B1 IDs / deterministic JSON / SQLite repositories            🟢 NEXT
B2 Canvas/source/intake + C01–C20                            ⚪
B3 canonical/provenance/validation                           ⚪
B4 explanation/review/correction/freeze                      ⚪
B5 capability/human/form/binding                             ⚪
B6 ExecutionPlan/mapping/policy/deployment domains           ⚪
B7 Temporal worker/reference provider                        ⚪
B8 minimal reference API/web                                 ⚪
B9 actual Temporal E2E runtime + evidence                     ⚪
B10 failure/retry/restart/lineage closure                    ⚪
```

## B0 guardrails

The reference workspace now contains:

```text
contracts/frozen-contract-manifest.json
architecture/module-boundaries.json
dependencies/dependency-baseline.json
package.json
package-lock.json
scripts/verify-b0.mjs
```

B0 prevents later code from silently changing the architecture it is supposed to prove.

## Build principles

1. Source adapters do not depend on Temporal directly.
2. UI graph structures do not become domain truth.
3. Temporal runtime structures do not become canonical process truth.
4. Runtime execution pins immutable design identities.
5. Capability bindings remain explicit and versioned.
6. AI-produced semantics preserve truth/provenance classification.
7. Implementation ships with executable evidence for the stage it closes.
8. A frozen-contract defect stops the affected BUILD stage; code never silently patches architecture.

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

The reference slice exists to prove the complete Talos lineage end to end before breadth.
