# TALOS — Gated Roadmap v0.21

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.20.md`  
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

```text
REFERENCE IMPLEMENTATION PLAN       ✅ v0.2 — 40/40
BUILD OPENING REVIEW                ✅ BOUNDED GO
AUTHORIZED PATH                     build/reference-vertical-slice/
BROAD PRODUCT BUILD                 ⛔ CLOSED
```

## B0 — Contract manifest / workspace / dependency boundaries

```text
STATUS                              ✅ CLOSED
EVIDENCE                            test/87-B0-CONTRACT-MANIFEST-WORKSPACE-BOUNDARY-RESULT-v0.1.md
```

## B1 — IDs / deterministic JSON / SQLite repositories

```text
STATUS                              ✅ CLOSED
EVIDENCE                            test/88-B1-FOUNDATION-SQLITE-RESULT-v0.1.md
```

B1 proved:

```text
opaque cross-layer IDs
stable deterministic JSON + SHA-256
immutable repository port
file-backed SQLite restart durability
DB-level update/delete rejection
same-ID conflict detection
reference provider idempotency
physical Talos/provider DB separation
architecture import boundaries
zero external runtime dependencies
```

B1 intentionally did not introduce Canvas, Canonical, review, capability or Temporal business behavior.

## B2 — Canvas / Source / Intake

```text
STATUS                              🟢 NEXT / OPEN
```

B2 must implement the frozen native-source intake boundary:

```text
CanvasDefinition / immutable CanvasRevision
CanvasElementIdentity / Snapshot
CanvasRelationshipIdentity / Snapshot
CanvasEndpointRef SET / UNKNOWN / UNCONNECTED
semantic vs native representation digests
source preservation before adapter execution
AdapterAttempt STARTED/SUCCEEDED/PARTIAL/FAILED
input fingerprint + retry lineage
SourceEvidenceGraph
CandidateSemanticScope
native Canvas adapter extraction
```

B2 must preserve the Phase boundary:

```text
B2 source/intake evidence           ✅
B3 canonical normalization          ⛔ NOT YET
B3 semantic validation              ⛔ NOT YET
Temporal                            ⛔ NOT IN B2
```

C01–C20 will be reread and decomposed into B2-owned assertions versus B3-owned downstream assertions. B2 must not fabricate Canonical/Validation output simply to claim the historical whole-fixture suite early.

# Remaining authorized stages

```text
B3 canonical/provenance/validation                           ⚪
B4 explanation/review/correction/freeze                      ⚪
B5 capability/human/form/binding                             ⚪
B6 ExecutionPlan/mapping/policy/deployment domains           ⚪
B7 Temporal worker/reference provider                        ⚪
B8 minimal reference API/web                                 ⚪
B9 actual Temporal E2E runtime + evidence                     ⚪
B10 failure/retry/restart/lineage closure                    ⚪
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
B1                                 ✅ CLOSED
B2                                 🟢 NEXT / OPEN
BROAD PRODUCT BUILD                ⛔ CLOSED
```

## Immediate next move

```text
B2 — CANVAS / SOURCE / INTAKE
```
