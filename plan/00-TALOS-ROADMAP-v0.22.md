# TALOS — Gated Roadmap v0.22

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.21.md`  
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

## Closed BUILD stages

```text
B0 Contract manifest / workspace / dependency boundaries   ✅ CLOSED
B1 IDs / deterministic JSON / SQLite repositories           ✅ CLOSED
B2 Canvas / Source / Intake                                 ✅ CLOSED
```

Evidence:

```text
test/87-B0-CONTRACT-MANIFEST-WORKSPACE-BOUNDARY-RESULT-v0.1.md
test/88-B1-FOUNDATION-SQLITE-RESULT-v0.1.md
test/89-B2-C01-C20-STAGE-OWNERSHIP-MATRIX-v0.1.md
test/90-B2-CANVAS-SOURCE-INTAKE-IMPLEMENTATION-RESULT-v0.1.md
```

B2 executable result:

```text
C01–C20 SOURCE / INTAKE assertions   20/20
additional B2 invariants               5/5
TOTAL                                 25/25
```

The phrase `SOURCE / INTAKE assertions` is intentional. Historical C01–C20 also include downstream Canonical/Provenance/Validation assertions, which remain B3.

# B3 — Canonical / Provenance / Validation

```text
STATUS                               🟢 NEXT / OPEN
```

B3 must implement the frozen Phase-1 semantic core over preserved B2 evidence:

```text
Canonical ProcessDefinition / immutable ProcessRevision
ProcessNode / ProcessEdge
Actor / ProcessVariable / DataObject / BusinessRule
SemanticClaim / EvidenceFragment / ProvenanceLink
Conflict/confirmation-compatible provenance history
source occurrence → canonical identity mapping without ID collapse
complete Canvas relationship → eligible canonical edge
incomplete Canvas relationship → source/claim evidence only, no fake edge
Semantic Validation v0.2 assessment/finding/readiness behavior
```

B3 must prove at minimum:

```text
C03 UNKNOWN branch → NO fabricated ProcessEdge + SV-CFL-002
C05 incomplete WAIT → explicit unresolved timing finding
C07 actor/data/rule → canonical non-process families
C08 presentation-only source revision → semantic revision reuse/no new ProcessRevision
C09 semantic source revision → new ProcessRevision candidate
C12 annotation/group → no canonical business node pollution
C13 UNKNOWN vs absent preserved into validation context
C17 same label/distinct IDs → distinct canonical provenance identities
C18 stable source identity/revision occurrence history remains traceable
C20 failed adapter attempt → no ProcessRevision
```

B3 will also create the initial reference-process semantic state with:

```text
Review request.actor = UNKNOWN
```

and a material responsibility finding. `Manager` remains forbidden until B4 explicit review correction.

# Remaining authorized stages

```text
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
B2                                 ✅ CLOSED
B3                                 🟢 NEXT / OPEN
BROAD PRODUCT BUILD                ⛔ CLOSED
```

## Immediate next move

```text
B3 — CANONICAL / PROVENANCE / VALIDATION
```
