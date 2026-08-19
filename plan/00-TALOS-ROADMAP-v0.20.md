# TALOS — Gated Roadmap v0.20

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.19.md`  
Historical roadmap versions remain preserved.

## Governing principles

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

> **TALOS closes semantic, review, capability and execution-design gates before broad implementation.**

# Design / architecture state

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

# Phase 6 — Reference Vertical Slice

Post-Phase-5 review:

```text
REFERENCE IMPLEMENTATION PLAN       ✅ v0.2 — 40/40
BUILD OPENING REVIEW                ✅ BOUNDED GO
```

Authorized path only:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

## B0 — Contract manifest / workspace / dependency boundaries

```text
STATUS                              ✅ CLOSED
```

Evidence:

```text
test/87-B0-CONTRACT-MANIFEST-WORKSPACE-BOUNDARY-RESULT-v0.1.md
```

B0 established:

```text
17 frozen contract entries
24 total pinned architecture/governance artifacts
11 exact planned dependency pins
16 explicit module boundaries
dependency-free B0 npm lock
machine-checkable git-blob drift verifier
runtime DB/provider isolation rules
```

No business implementation was introduced in B0.

## B1 — IDs / deterministic JSON / SQLite repositories

```text
STATUS                              🟢 NEXT / OPEN
```

B1 must implement foundational mechanisms only:

```text
branded/opaque cross-layer IDs
versioned deterministic JSON serialization
stable digest helpers
repository port abstractions
Talos SQLite reference persistence
reference-email-sink SQLite persistence isolation
append-only / immutable-write guards where contracts require history
restart/reopen durability tests
```

B1 must not implement:

```text
Canvas semantics
canonical normalization
review commands
capability design
Temporal mapping/runtime
business process behavior
```

Dependencies may be promoted from the exact B0 baseline only before first use and must be locked in the npm package lock.

# Remaining authorized stages

```text
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

# Still not authorized

```text
BPMN/image/language/n8n adapter implementation
real SaaS connectors
production IAM/secrets
production Temporal deployment
multi-user collaboration
full product visual polish
broad provider/source expansion
```

# Stop-on-contract-defect rule

If implementation exposes a frozen contract defect:

```text
STOP affected BUILD stage
→ preserve implementation evidence
→ version affected DESIGN / ARCH contract
→ rerun required regression(s)
→ re-freeze
→ resume only after compatibility is restored
```

# Current authoritative state

```text
PHASE 1–5                          ✅ CLOSED
PHASE 6 REFERENCE BUILD            🟢 OPEN
B0                                 ✅ CLOSED
B1                                 🟢 NEXT / OPEN
BROAD PRODUCT BUILD                ⛔ CLOSED
```

## Immediate next move

```text
B1 — IDS / DETERMINISTIC JSON / SQLITE REPOSITORIES
```
