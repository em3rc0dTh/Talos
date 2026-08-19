# TALOS — Gated Roadmap v0.4

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.3.md`  
Historical v0.1–v0.3 remain preserved.

## Planning principle

TALOS now has a frozen semantic core and a frozen Phase-2 source-intake architecture.

The project may begin implementing the first reference source adapter only after the implementation-plan review opens BUILD for T2-01 specifically.

---

# PHASE 1 — CANONICAL SEMANTICS

```text
T1-01 Canonical Process Model   ✅ FROZEN v0.1
T1-02 Provenance Model          ✅ FROZEN v0.3
T1-03 Semantic Validation       ✅ FROZEN v0.2

PHASE 1                         ✅ CLOSED
```

---

# PHASE 2 — SOURCE ADAPTERS

## T2-01 — TALOS Canvas Adapter

### Design/architecture evidence

Initial candidates:

```text
Canvas Native Source v0.1
Process Source Intake v0.1
Source Intake / Canvas Adapter Architecture v0.1
```

Initial pressure test:

```text
C01–C20
18 PASS / 2 FAIL
```

Failures:

```text
C03 incomplete/dangling relationship
C20 adapter failure after source preservation
```

Evidence-forced v0.2:

```text
CanvasEndpointRef
SET / UNKNOWN / UNCONNECTED endpoint states
incomplete relationship → source evidence, not fake canonical edge

AdapterAttempt
failure stage + diagnostics
retry lineage
input fingerprint / idempotent replay
adapter failure ≠ source loss
```

Full regression:

```text
test/14-T2-01-CANVAS-ADAPTER-REGRESSION-RESULT-v0.1.md
20 / 20 PASS
```

Frozen contracts:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.2.md
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.2.md
```

Freeze declaration:

```text
design/07-T2-01-CANVAS-AND-INTAKE-v0.2-FREEZE-DECLARATION.md
```

Design/architecture closure:

```text
test/15-T2-01-DESIGN-ARCH-GATE-CLOSURE-v0.1.md
```

Implementation plan:

```text
plan/02-T2-01-CANVAS-ADAPTER-IMPLEMENTATION-PLAN-v0.1.md
```

Current status:

```text
T2-01 DESIGN             ✅ FROZEN v0.2
T2-01 ARCHITECTURE       ✅ FROZEN v0.2
T2-01 IMPLEMENTATION PLAN ✅ READY
T2-01 BUILD              🟡 READY FOR EXPLICIT OPENING
T2-01 RUNTIME TESTS      ⛔ NOT STARTED
```

### T2-01 implementation gate

Build only the reference intake slice:

```text
CanvasDefinition / CanvasRevision
→ native SourceRepresentation
→ AdapterAttempt
→ SourceEvidenceGraph
→ CandidateSemanticScope
→ canonical ProcessRevision
→ provenance
→ Semantic Validation
```

Executable implementation fixtures must reproduce C01–C20.

T2-01 closes only after implementation evidence passes.

---

## T2-02 — BPMN Adapter

Status: **PENDING**

Begins only after T2-01 establishes the reference adapter implementation.

BPMN must use the same frozen source-intake boundary rather than a private parser→canonical shortcut.

---

## T2-03 — Image / Graphic Candidate Adapter

Status: **PENDING**

Must use:

```text
SourceOrigin / Capture / Representation
AdapterAttempt(VISUAL_PERCEPTION)
EvidenceFragment / SourceOccurrence
local confidence
CandidateSemanticScope(s)
```

and never treat perception as source-confirmed execution truth automatically.

---

# PHASE 3 — EXPLANATION & REVIEW

```text
T3-01 Human-readable Workflow Draft  ⚪
T3-02 Visual Review Canvas           ⚪
T3-03 Correction Loop                ⚪
```

The source/revision architecture established in T2-01 becomes the basis of later correction behavior.

---

# PHASE 4 — CAPABILITIES

```text
T4-01 Capability Contract  ⚪
T4-02 Forms                ⚪
T4-03 Initial Integrations ⚪
```

---

# PHASE 5 — TEMPORAL EXECUTION

```text
T5-01 ExecutionPlan Contract        ⚪
T5-02 Compiler/Interpreter Strategy ⚪
T5-03 Core Temporal Mappings        ⚪
T5-04 DeploymentRevision            ⚪
```

No Temporal implementation is authorized by T2-01.

---

# Current project state

```text
FOUNDATION                          ✅
PHASE 1 CANONICAL SEMANTICS         ✅ CLOSED
MINING SITE Q01–Q12                 ✅ FIRST BATCH COMPLETE

PROCESS SOURCE INTAKE CONTRACT      ✅ FROZEN v0.2
TALOS CANVAS NATIVE SOURCE          ✅ FROZEN v0.2
PHASE-2 ADAPTER ARCHITECTURE        ✅ FROZEN v0.2

T2-01 IMPLEMENTATION PLAN           ✅ READY
T2-01 BUILD                         🟡 READY FOR EXPLICIT OPENING
T2-02 BPMN                          ⚪ PENDING
T2-03 IMAGE/GRAPHIC                 ⚪ PENDING

CAPABILITIES                        ⚪ LATER
TEMPORAL EXECUTION                  ⚪ LATER
```

## Immediate next move

Perform the explicit T2-01 BUILD-opening review and, if approved, implement:

```text
build/t2-01-canvas-adapter/
```

with executable C01–C20 tests.
