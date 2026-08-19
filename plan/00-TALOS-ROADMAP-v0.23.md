# TALOS — Gated Roadmap v0.23

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes `00-TALOS-ROADMAP-v0.22.md` for active planning. Historical versions remain preserved.

## Design / architecture

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

## Phase 6 — Reference Vertical Slice

Authorized path only:

```text
build/reference-vertical-slice/
```

Broad product BUILD remains closed.

### Closed BUILD stages

```text
B0 Contract manifest / boundaries                 ✅ CLOSED
B1 IDs / deterministic JSON / SQLite              ✅ CLOSED
B2 Canvas / Source / Intake                       ✅ CLOSED — 25/25
B3 Canonical / Provenance / Validation            ✅ CLOSED — 27/27
```

Combined B2+B3 executable semantic path:

```text
52 / 52 PASS
```

Evidence:

```text
test/87-B0-CONTRACT-MANIFEST-WORKSPACE-BOUNDARY-RESULT-v0.1.md
test/88-B1-FOUNDATION-SQLITE-RESULT-v0.1.md
test/89-B2-C01-C20-STAGE-OWNERSHIP-MATRIX-v0.1.md
test/90-B2-CANVAS-SOURCE-INTAKE-IMPLEMENTATION-RESULT-v0.1.md
test/91-B3-CANONICAL-PROVENANCE-VALIDATION-IMPLEMENTATION-RESULT-v0.1.md
```

The initial reference semantic state remains:

```text
Review request.actor = UNKNOWN
SV-ACT-001 present
executionReadiness = INSUFFICIENT_DETAIL
Manager absent
```

### B4 — Explanation / Review / Correction / Freeze

```text
STATUS                              🟢 NEXT / OPEN
```

B4 must implement the frozen Phase-3 human semantic-review loop:

```text
ProcessRevision + Provenance + ValidationAssessment
        ↓
ExplanationDraftSnapshot
        ↓
ReviewBaselineBundle / ReviewWorkspaceRevision
        ↓
text + Canvas projection + evidence + findings/questions
        ↓
ReviewCommand
        ↓
stale-baseline guard + semantic-diff guard
        ↓
explicit correction actor = Manager
        ↓
new CanvasRevision
        ↓
B2/B3 pipeline
        ↓
new ProcessRevision + new ValidationAssessment
        ↓
BaselineTransitionCandidate / Decision
        ↓
new ReviewWorkspaceRevision
        ↓
SemanticFreezeRecord / ScopeFreezeRecord
```

B4 must prove that `Manager` first enters as review-authored evidence and never rewrites the original source/revision/finding.

`AUTOMATION_DESIGN_HANDOFF` may freeze only after the corrected semantic scope evaluates `READY_FOR_AUTOMATION_DESIGN`.

### Remaining authorized stages

```text
B5 capability/human/form/binding                 ⚪
B6 ExecutionPlan/mapping/policy/deployment       ⚪
B7 Temporal worker/reference provider            ⚪
B8 minimal reference API/web                     ⚪
B9 actual Temporal E2E runtime + evidence        ⚪
B10 failure/retry/restart/lineage closure        ⚪
```

## Stop-on-contract-defect rule

Any frozen-contract defect closes the affected BUILD stage until versioned DESIGN/ARCH evolution and regression restore compatibility.

## Immediate next move

```text
B4 — EXPLANATION / REVIEW / CORRECTION / FREEZE
```
