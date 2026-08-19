# TALOS — Gated Roadmap v0.19

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.18.md`  
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

Phase-5 evidence:

```text
T5-01 ExecutionPlan              40/40 PASS
T5-02 Temporal Mapping           46/46 PASS
T5-03 Runtime Safety/Policy      44/44 PASS
T5-04 Deployment/Environment     48/48 PASS
```

# Post-Phase-5 BUILD review

Historical Canvas-only plan:

```text
❌ insufficient for full Talos vertical slice
```

Cross-phase implementation plan:

```text
plan/09-REFERENCE-VERTICAL-SLICE-IMPLEMENTATION-PLAN-v0.2.md
```

Plan pressure history:

```text
v0.1 36/40
v0.2 40/40
```

Final decision:

```text
BUILD OPENING REVIEW                ✅ BOUNDED GO
```

Evidence:

```text
test/86-POST-PHASE-5-BUILD-OPENING-REVIEW-FINAL-RESULT-v0.1.md
```

Authorization:

```text
plan/10-REFERENCE-VERTICAL-SLICE-BUILD-AUTHORIZATION-v0.1.md
```

# PHASE 6 — REFERENCE VERTICAL SLICE

```text
REFERENCE VERTICAL-SLICE BUILD      🟢 OPEN
BROAD PRODUCT BUILD                 ⛔ CLOSED
```

Authorized implementation path only:

```text
build/reference-vertical-slice/
```

Reference process:

```text
Request submitted
        ↓
Review request [actor initially UNKNOWN]
        ↓
Approved?
   ├── YES → Send confirmation email → Completed
   └── NO  → Rejected
```

Design/review path:

```text
UNKNOWN actor
→ validation finding
→ human review correction actor=Manager
→ new ProcessRevision
→ revalidation
→ semantic freeze / automation handoff
→ capability design/binding
→ execution plan
→ Temporal mapping
→ runtime policy
→ deployment revision
→ actual local/test Temporal execution
→ runtime observation
→ backward source lineage
```

## Build stages

```text
B0 contract manifest / workspace / dependency boundaries    🟢 NEXT
B1 IDs / deterministic JSON / SQLite repositories            ⚪
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

## Build constraints

Still not authorized:

```text
BPMN/image/language/n8n adapter implementation
real SaaS connectors
production deployment/IAM/secrets
multi-user collaboration
visual polish/broad product expansion
```

Any frozen-contract defect discovered during implementation closes the affected stage and returns to versioned design/architecture before BUILD resumes.

# Current authoritative state

```text
PHASE 1–5                          ✅ CLOSED
REFERENCE IMPLEMENTATION PLAN      ✅ v0.2 — 40/40
BOUNDED BUILD REVIEW               ✅ GO

PHASE 6 REFERENCE BUILD            🟢 OPEN
B0                                 🟢 NEXT
BROAD PRODUCT BUILD                ⛔ CLOSED
```

## Immediate next move

```text
B0 — CONTRACT MANIFEST / WORKSPACE / DEPENDENCY BOUNDARIES
```
