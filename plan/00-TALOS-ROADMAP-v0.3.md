# TALOS — Gated Roadmap v0.3

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.2.md`  
Historical v0.1/v0.2 remain preserved.

## Planning principle

TALOS closes semantic truth gates before broad implementation.

Phase 1 is now closed. The system has frozen contracts for:

```text
CANONICAL PROCESS MEANING
PROVENANCE / SOURCE TRUTH
SEMANTIC VALIDATION / READINESS
```

The next phase begins adapter design from the source TALOS controls most completely: the native TALOS Canvas.

---

# PHASE 0 — FOUNDATION

## T0-01 — System Truth

```text
CLOSED v0.1
```

---

# PHASE 1 — CANONICAL SEMANTICS

## T1-01 — Canonical Process Model

Frozen:

```text
arch/01-CANONICAL-PROCESS-MODEL-v0.1.md
```

Evidence:

```text
test/01-CANONICAL-PROCESS-MODEL-PRESSURE-TEST-v0.1.md
12 / 12 PASS
```

Status:

```text
CLOSED / FROZEN v0.1 — 2026-08-18
```

## T1-02 — Provenance Model

Frozen:

```text
design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.3.md
blob: 2e20a98aba744e9d719765c15429422f0e03c779
```

Regression:

```text
test/06-PROVENANCE-REGRESSION-RESULT-v0.1.md
28 / 28 PASS
```

Closure:

```text
test/07-T1-02-PROVENANCE-GATE-CLOSURE-v0.1.md
```

Status:

```text
CLOSED / FROZEN v0.3 — 2026-08-18
```

## T1-03 — Semantic Validation

Frozen:

```text
design/03-SEMANTIC-VALIDATION-CONTRACT-v0.2.md
commit: 171b1f52cda4ca8fa61c2c8c78b1edc58b901ead
blob:   2b1463a6286fd3c3edcfd0417d29a9ffef45704f
```

Pressure-test history:

```text
v0.1 → V01–V16 → 15 PASS / 1 FAIL
```

Failure:

```text
V16 — historical validation finding/question mutation ambiguity
```

Evidence-forced v0.2 additions:

```text
immutable ValidationFinding
FindingDisposition
immutable ClarificationQuestion
ClarificationResponse
one primary scope per assessment
deterministic ReadinessDecision precedence
```

Full regression:

```text
test/10-SEMANTIC-VALIDATION-REGRESSION-RESULT-v0.1.md
16 / 16 PASS
```

Closure:

```text
test/11-T1-03-SEMANTIC-VALIDATION-GATE-CLOSURE-v0.1.md
```

Status:

```text
CLOSED / FROZEN v0.2 — 2026-08-19
```

## Phase 1 gate

```text
T1-01  ✅
T1-02  ✅
T1-03  ✅

PHASE 1 — CANONICAL SEMANTICS  ✅ CLOSED
```

TALOS can now answer:

```text
WHAT DOES THIS SOURCE MEAN?
WHY DO WE BELIEVE THAT MEANING?
WHAT IS VALID / MISSING / CONFLICTED?
WHAT REQUIRES CONFIRMATION?
WHAT BLOCKS AUTOMATION DESIGN?
WHAT CAN BE DEFERRED TO LATER DESIGN?
```

---

# PHASE 2 — FIRST SOURCE ADAPTERS

## T2-01 — TALOS Canvas Adapter

**Status: NEXT**

### Why Canvas first

TALOS controls the native source structure and revision lifecycle.

This removes image/OCR/parser ambiguity from the first implementation contract and lets the adapter prove the frozen Phase-1 contracts end to end.

### Design goal

A user creates or edits a process in TALOS Canvas and the native structured source becomes:

```text
TALOS Canvas native source
        ↓
SourceOrigin
SourceCapture / native revision
SourceRepresentation
SourceOccurrence
        ↓
Canonical ProcessRevision
        ↓
ProvenanceLink / SemanticClaim
        ↓
ValidationAssessment
ValidationFinding
ClarificationQuestion(s) when required
```

### Required Canvas semantics

Initial controlled vocabulary should support at minimum:

```text
START / EVENT
ACTION
DECISION + branch guards
PARALLEL SPLIT
JOIN / synchronization
WAIT
HUMAN INTERACTION
SUBPROCESS / grouped work
STATE / MILESTONE
END / outcome
ACTOR / responsibility
DATA / business object
RULE
```

### Revision behavior

```text
Canvas revision N
   ↓
ProcessRevision N
   ↓
ValidationAssessment N

user edit / clarification
   ↓
Canvas revision N+1
   ↓
ProcessRevision N+1
   ↓
ValidationAssessment N+1
```

Prior source/canonical/validation history remains immutable.

### T2-01 gate

A native Canvas fixture set must prove:

1. one structured source element keeps stable occurrence identity;
2. edits create new native source revisions rather than rewriting history;
3. sequential actions normalize correctly;
4. exclusive decision guards normalize correctly;
5. parallel split/join semantics survive without flattening;
6. waits retain business-time/event semantics;
7. human interaction remains business semantics rather than a preselected Temporal mechanism;
8. actor/data/rule relationships retain provenance;
9. T1-03 findings are generated when native Canvas semantics are incomplete;
10. clarification/correction creates new ProcessRevision and reassessment;
11. Canvas can represent `UNKNOWN`/unresolved semantics instead of forcing fake completeness;
12. no Temporal code is generated at this gate.

### Before BUILD

T2-01 should follow the repository lifecycle:

```text
DESIGN
  ↓
ARCH
  ↓
PLAN
  ↓
GATE REVIEW
  ↓
BUILD — only after explicit opening
```

Current T2-01 BUILD:

```text
⛔ CLOSED
```

---

## T2-02 — BPMN Adapter

After T2-01 foundation is proven, parse representative BPMN into canonical semantics while preserving:

```text
source IDs
gateway/event subtypes
pool/lane context
boundary events
message vs sequence flow
source-specific extensions
provenance
validation findings
```

Do not compile directly to Temporal.

Status: **PENDING**

---

## T2-03 — Image / Graphic Candidate Adapter

After native and structured adapters clarify the target contracts, perception may produce candidate source occurrences/claims from:

```text
photographed paper
whiteboard
informal flowchart
collaborative-canvas screenshot
functional-model screenshot
other graphics
```

Perception output must remain candidate/inferred until source evidence or user confirmation supports stronger truth.

Status: **PENDING**

---

# PHASE 3 — EXPLANATION & REVIEW

## T3-01 — Human-readable Workflow Draft
## T3-02 — Visual Review Canvas
## T3-03 — Correction Loop

Phase goal:

A user can see:

```text
what TALOS understood
what is proven
what is inferred
what is missing
what blocks automation
what question matters next
```

and corrections create preserved new revisions.

Status: **PENDING**

---

# PHASE 4 — CAPABILITY MODEL

## T4-01 — Capability Contract
## T4-02 — Forms
## T4-03 — Initial Integrations

Initial capability families may include:

```text
HTTP / custom API
Gmail
Google Drive
n8n webhook/workflow
generic human approval
AI task
```

Phase goal:

Business actions bind to versioned capabilities without changing their canonical meaning.

Status: **PENDING**

---

# PHASE 5 — TEMPORAL EXECUTION MODEL

## T5-01 — ExecutionPlan Contract
## T5-02 — Temporal Interpreter/Compiler Strategy
## T5-03 — Core Temporal mappings
## T5-04 — DeploymentRevision

Traceability gate:

```text
DeploymentRevision
← ExecutionPlan
← validated ProcessRevision
← SemanticClaim / ValidationAssessment
← ProvenanceLink
← SourceOccurrence / EvidenceFragment
← SourceRepresentation
← SourceCapture
← SourceOrigin
```

Status: **PENDING**

---

# PHASE 6 — FIRST END-TO-END VERTICAL SLICE

The slice should prove the complete proposition:

```text
source input
→ canonical meaning
→ provenance
→ semantic validation
→ correction
→ automation design
→ capability binding
→ human-readable explanation
→ Canvas visualization
→ Temporal execution
→ runtime history
```

Status: **PENDING**

---

# PHASE 7 — SOURCE EXPANSION

Only after the core is stable:

```text
UPN
UML Activity
EPC
Petri Net
SIPOC
VSM
Bizagi exports
Mermaid
draw.io
natural language
existing n8n workflows
AWS Step Functions
other orchestration systems
```

Every adapter requires provenance + canonical + validation regression fixtures.

Status: **PENDING**

---

# PHASE 8 — OBSERVABILITY & PROCESS INTELLIGENCE

Future:

```text
designed vs observed process comparison
execution analytics
bottleneck evidence
runtime drift
process mining
improvement suggestions backed by evidence
```

Status: **FUTURE**

---

# Current project gate

```text
FOUNDATION                         ✅
SYSTEM TRUTH                       ✅ v0.1
CANONICAL MODEL                    ✅ FROZEN v0.1 — T1-01
MINING SITE FIRST BATCH            ✅ Q01–Q12
PROVENANCE MODEL                   ✅ FROZEN v0.3 — T1-02
SEMANTIC VALIDATION                ✅ FROZEN v0.2 — T1-03
PHASE 1                            ✅ CLOSED

TALOS CANVAS ADAPTER               🟢 T2-01 NEXT
BPMN ADAPTER                       ⚪ T2-02 PENDING
IMAGE/GRAPHIC ADAPTER              ⚪ T2-03 PENDING

CAPABILITY CONTRACT                🟡 DRAFT / LATER GATE
TEMPORAL EXECUTION CONTRACT        🟡 DRAFT / LATER GATE
BUILD                              ⛔ CLOSED
TEST DESIGN / GATE EVIDENCE        🟢 ACTIVE
TEST IMPLEMENTATION                ⛔ CLOSED
```

## Immediate next move

Open T2-01 with **DESIGN first**:

```text
TALOS CANVAS NATIVE SOURCE CONTRACT
```

The next question is:

> If the user draws directly inside TALOS, what exact native source graph/revision contract should be produced so that Canonical v0.1, Provenance v0.3 and Semantic Validation v0.2 work without any special exception for our own Canvas?
