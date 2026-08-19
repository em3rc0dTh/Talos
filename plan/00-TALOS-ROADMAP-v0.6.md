# TALOS — Gated Roadmap v0.6

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.5.md`  
Historical v0.1–v0.5 remain preserved.

## Planning principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

Phase 2 remains **INPUT UNDERSTANDING**.

BUILD remains closed until fundamentally different source families have pressure-tested the common intake architecture and cross-adapter conformance closes.

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

---

## P2-01A — Canvas Native Authoring

Frozen/proven:

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
✅ PROVEN
```

Role:

```text
"Create my process inside Talos."
```

---

## P2-01B — Canvas Review / Projection

Purpose:

```text
"Show me what Talos understood from my imported source
and let me correct it without rewriting the source."
```

Initial v0.1 pressure test:

```text
R01–R14
12 PASS / 2 FAIL
```

Failures:

```text
R12 adapter reinterpretation / baseline stability
R14 correction → new revision → reassessment → new projection
```

Evidence-forced v0.2 additions:

```text
ReviewWorkspaceDefinition
ReviewWorkspaceRevision
BaselineTransitionCandidate
BaselineReconciliationAnalysis
BaselineTransitionDecision
```

Full regression:

```text
test/20-CANVAS-REVIEW-PROJECTION-REGRESSION-RESULT-v0.1.md
14 / 14 PASS
```

Frozen:

```text
design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.2.md
arch/04-CANVAS-REVIEW-PROJECTION-ARCHITECTURE-v0.1.md
design/09-CANVAS-REVIEW-PROJECTION-v0.2-FREEZE-DECLARATION.md
```

Gate closure:

```text
test/21-P2-01B-CANVAS-REVIEW-PROJECTION-GATE-CLOSURE-v0.1.md
```

Status:

```text
✅ PROVEN / FROZEN
```

Core laws:

```text
DISPLAYING IMPORTED MEANING
      ≠
TAKING OWNERSHIP OF ITS PROVENANCE

USER CORRECTION
      ≠
REWRITING WHAT THE ORIGINAL SOURCE SAID

ADAPTER REINTERPRETATION
      ≠
AUTOMATIC REVIEW REBASE
```

---

## P2-02 — BPMN Structured Adapter

**Status: NEXT — DESIGN / PRESSURE TEST**

Source family:

```text
EXTERNAL STRUCTURED SEMANTIC MODEL
```

Extraction mode:

```text
STRUCTURED_PARSE
```

Primary gate question:

> Can BPMN enter TALOS as an external structured source with exact native identities and notation-specific semantics while still flowing through the same source-intake, canonical, provenance and semantic-validation boundaries?

Must pressure-test at minimum:

```text
BPMN XML/native file as source representation
source element IDs
process/collaboration IDs
pools/participants
lanes vs participants
sequence flow vs message flow
exclusive/inclusive/parallel/event-based gateways
start/intermediate/end event subtypes
boundary events + attached activity relationships
interrupting vs non-interrupting semantics
subprocess/call activity distinctions
data objects/data associations
condition expressions
extension elements/vendor metadata
unsupported/unknown BPMN constructs
DI/layout vs semantic model
multiple processes/collaborations in one definitions document
0..N candidate semantic scopes
source-specific semantics that should remain extensions
incomplete/invalid BPMN preserved as evidence rather than silently repaired
```

No direct BPMN → Temporal path is allowed.

---

## P2-03 — Image / Perception Adapter

Status: **PENDING DESIGN / PRESSURE TEST**

Must challenge:

```text
physical origin vs capture
local confidence
handwriting
ambiguous edges
presentation/editor overlays
partial graph extraction
source-only review evidence
0..N semantic scopes
```

---

## P2-04 — Language / Document Adapter

Status: **PENDING DESIGN / PRESSURE TEST**

Must challenge:

```text
non-graph evidence
literal text vs interpretation
implicit ordering
actors/rules embedded in prose
multiple claims per span
missing boundaries
ambiguity and contradiction
```

---

## P2-05 — Existing Automation Adapter

Initial reference source:

```text
n8n
```

Status: **PENDING DESIGN / PRESSURE TEST**

Default evidence perspective:

```text
IMPLEMENTED_BEHAVIOR
```

Must prove:

```text
implemented behavior ≠ business intent
technical retry ≠ business policy
provider binding ≠ canonical business meaning
existing automation node ≠ automatic canonical Activity
```

---

## P2-06 — Cross-Adapter Conformance

Run shared conformance across:

```text
Canvas Native Authoring
Canvas Review / Projection
BPMN Structured
Image / Perception
Language / Document
Existing Automation
```

Required laws include:

```text
source preserved before interpretation
source/native IDs stay distinct from canonical IDs
one source may yield 0..N semantic scopes
partial/UNKNOWN evidence survives
source-specific relationship semantics survive
property/relationship provenance survives
truth/confidence/perspective stay separate
adapter failures preserve source
no adapter emits Temporal directly
same normalization/validation boundary
Canvas review does not replace imported provenance
user corrections create new lineage
adapter reinterpretation cannot silently overwrite reviewed meaning
```

Status: **PENDING**

---

# PHASE 2 DESIGN / ARCH CLOSURE

Required before BUILD:

```text
Common Source Intake            ✅
Canvas Native Authoring         ✅
Canvas Review / Projection      ✅
BPMN Adapter                    ⚪
Image / Perception Adapter      ⚪
Language / Document Adapter     ⚪
Existing Automation Adapter     ⚪
Cross-Adapter Conformance       ⚪
```

Current:

```text
PHASE 2 INPUT ARCHITECTURE      🟡 OPEN
BUILD                           ⛔ CLOSED
```

Only after all required proofs pass may the project reactivate the reference implementation plan:

```text
plan/02-T2-01-CANVAS-ADAPTER-IMPLEMENTATION-PLAN-v0.1.md
```

---

# Current authoritative state

```text
PHASE 1                         ✅ CLOSED

COMMON SOURCE INTAKE            ✅ FROZEN
CANVAS AUTHORING CONTRACT       ✅ PROVEN
CANVAS REVIEW/PROJECTION        ✅ PROVEN
BPMN ADAPTER CONTRACT           🟡 NEXT / NOT YET PROVEN
IMAGE ADAPTER CONTRACT          ⚪ NOT YET PROVEN
LANGUAGE ADAPTER CONTRACT       ⚪ NOT YET PROVEN
AUTOMATION ADAPTER CONTRACT     ⚪ NOT YET PROVEN

PHASE 2 INPUT ARCHITECTURE      🟡 OPEN
BUILD                           ⛔ CLOSED
```

## Immediate next move

```text
P2-02 — BPMN STRUCTURED ADAPTER
```

Design the BPMN adapter boundary, then pressure-test it against frozen:

```text
Canonical Process Model v0.1
Provenance Model v0.3
Semantic Validation v0.2
Process Source Intake v0.2
Canvas Review / Projection v0.2
```

Governing Phase-2 gate remains versioned separately.
