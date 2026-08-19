# TALOS — Gated Roadmap v0.5

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.4.md`  
Historical v0.1–v0.4 remain preserved.

## Planning principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

Phase 2 is therefore an **INPUT UNDERSTANDING** phase before it becomes a BUILD phase.

The project must not implement the Canvas reference adapter merely because Canvas authoring has been designed. The common intake architecture must first survive other fundamentally different source families.

---

# PHASE 1 — CANONICAL SEMANTICS

```text
T1-01 Canonical Process Model   ✅ FROZEN v0.1
T1-02 Provenance Model          ✅ FROZEN v0.3
T1-03 Semantic Validation       ✅ FROZEN v0.2

PHASE 1                         ✅ CLOSED
```

---

# PHASE 2 — INPUT UNDERSTANDING

## P2-00 — Common Source Intake

Frozen:

```text
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.2.md
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.2.md
```

Status:

```text
✅ FROZEN
```

Universal law:

```text
RECEIVE
  ↓
PRESERVE
  ↓
CLASSIFY
  ↓
ADAPTER ATTEMPT
  ↓
ADDRESS SOURCE EVIDENCE
  ↓
INTERPRET
  ↓
DISCOVER 0..N CANDIDATE SCOPES
  ↓
NORMALIZE
  ↓
VALIDATE
```

No adapter may bypass provenance or emit Temporal directly.

---

## P2-01A — Canvas Native Authoring

Frozen/proven design:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md
```

Evidence:

```text
test/14-T2-01-CANVAS-ADAPTER-REGRESSION-RESULT-v0.1.md
20 / 20 PASS
```

Status:

```text
✅ DESIGN / ARCH PROVEN
```

This proves:

```text
"Create my process inside Talos."
```

It does not yet prove imported-source review/correction.

---

## P2-01B — Canvas Review / Projection

Goal:

> Render an imported/interpreted process into the Talos Canvas for review without replacing the original source provenance, and allow user correction to create new lineage rather than mutating original evidence.

Required path:

```text
EXTERNAL SOURCE
      ↓
SOURCE ADAPTER
      ↓
CANONICAL / CLAIM INTERPRETATION
      ↓
CANVAS REVIEW PROJECTION
      ↓
USER CORRECTION / CONFIRMATION
      ↓
NEW SOURCE/CLAIM REVISION
      ↓
NEW PROCESS REVISION
```

Status:

```text
🟡 NEXT — DESIGN / PRESSURE TEST
```

---

## P2-02 — BPMN Structured Adapter

Source family:

```text
EXTERNAL STRUCTURED SEMANTIC MODEL
```

Extraction mode:

```text
STRUCTURED_PARSE
```

Must pressure-test at minimum:

```text
source IDs
gateway/event subtypes
pools/lanes
message vs sequence flow
boundary events
source-specific extensions
incomplete/unsupported BPMN semantics
```

Status: **PENDING DESIGN / PRESSURE TEST**

---

## P2-03 — Image / Perception Adapter

Source family:

```text
VISUAL / PERCEPTUAL SOURCE
```

Examples:

```text
photo of paper
whiteboard
screenshot
informal flowchart
collaborative canvas capture
functional-model screenshot
```

Extraction mode:

```text
VISUAL_PERCEPTION
```

Must pressure-test:

```text
physical origin vs digital capture
local confidence
ambiguous handwriting/text
ambiguous edges
editor/annotation planes
partial graph extraction
0..N semantic scopes
```

Status: **PENDING DESIGN / PRESSURE TEST**

---

## P2-04 — Language / Document Adapter

Source family:

```text
NATURAL LANGUAGE / PROCESS DOCUMENT
```

Examples:

```text
user description
SOP
policy/process document
structured prose
```

Extraction mode:

```text
TEXT_INTERPRETATION
```

Must pressure-test:

```text
implicit ordering
implicit/unknown actors
business rules in prose
multiple claims per paragraph
non-graph evidence addressing
literal text vs interpreted meaning
missing process boundaries
```

Status: **PENDING DESIGN / PRESSURE TEST**

---

## P2-05 — Existing Automation Adapter

Initial reference source:

```text
n8n
```

Source family:

```text
EXISTING EXECUTABLE / AUTOMATION DEFINITION
```

Extraction mode:

```text
AUTOMATION_PARSE
```

Default evidence perspective:

```text
IMPLEMENTED_BEHAVIOR
```

Must prove:

```text
implemented behavior ≠ business intent
technical retries ≠ business policy
provider bindings ≠ canonical business semantics
runtime/automation nodes ≠ automatic canonical Activities
```

Status: **PENDING DESIGN / PRESSURE TEST**

---

## P2-06 — Cross-Adapter Conformance

Run one shared suite across:

```text
Canvas Native
Canvas Review/Projection
BPMN
Image/Perception
Language/Document
Existing Automation
```

Gate requirements:

```text
source preserved before interpretation
source IDs remain distinct from canonical IDs
UNKNOWN/partial evidence survives
0..N semantic scopes work consistently
source-specific relation semantics survive
property/relationship provenance survives
truth/confidence/perspective remain separate
adapter failures preserve source
no direct Temporal output
same normalization/validation boundary
Canvas projection preserves original provenance
user correction creates new lineage
```

Status: **PENDING**

---

# PHASE 2 DESIGN / ARCH CLOSURE

Phase 2 design/architecture may close only when:

```text
Canvas Review/Projection        ✅
BPMN Adapter                    ✅
Image/Perception Adapter        ✅
Language/Document Adapter       ✅
Existing Automation Adapter     ✅
Cross-Adapter Conformance       ✅
```

Then:

```text
PHASE 2 INPUT ARCHITECTURE      ✅ CLOSED
```

Only after this gate may the project reopen:

```text
plan/02-T2-01-CANVAS-ADAPTER-IMPLEMENTATION-PLAN-v0.1.md
```

as the candidate reference BUILD plan.

---

# BUILD POLICY

Current:

```text
BUILD                           ⛔ CLOSED
```

The old v0.4 statement:

```text
T2-01 BUILD READY FOR EXPLICIT OPENING
```

is superseded by this roadmap.

No source-family implementation begins before the Phase-2 input-understanding gate closes.

---

# Later phases

After Phase 2 design/architecture closure and explicit BUILD opening:

```text
REFERENCE SOURCE ADAPTER BUILD
        ↓
EXPLANATION / REVIEW UX
        ↓
CAPABILITY MODEL
        ↓
TEMPORAL EXECUTION MODEL
        ↓
END-TO-END VERTICAL SLICE
```

No later phase may erase source/adaptor conformance requirements.

---

# Current authoritative state

```text
PHASE 1                         ✅ CLOSED

COMMON SOURCE INTAKE            ✅ FROZEN

CANVAS AUTHORING CONTRACT       ✅ PROVEN
CANVAS REVIEW/PROJECTION        🟡 NOT YET PROVEN
BPMN ADAPTER CONTRACT           ⚪ NOT YET PROVEN
IMAGE ADAPTER CONTRACT          ⚪ NOT YET PROVEN
LANGUAGE ADAPTER CONTRACT       ⚪ NOT YET PROVEN
AUTOMATION ADAPTER CONTRACT     ⚪ NOT YET PROVEN

PHASE 2 INPUT ARCHITECTURE      🟡 OPEN

BUILD                           ⛔ CLOSED
```

## Immediate next move

```text
P2-01B — CANVAS REVIEW / PROJECTION
```

Design and pressure-test the second Canvas role before moving to BPMN.

Governing gate detail:

```text
plan/03-PHASE-2-INPUT-UNDERSTANDING-GATE-v0.1.md
```
