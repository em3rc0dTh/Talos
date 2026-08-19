# TALOS — Gated Roadmap v0.13

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.12.md`  
Historical roadmap versions remain preserved.

## Governing principles

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

> **TALOS closes semantic, review, capability and execution-design gates before broad implementation.**

---

# PHASE 1 — CANONICAL SEMANTICS

```text
T1-01 Canonical Process Model       ✅ FROZEN v0.1
T1-02 Provenance Model              ✅ FROZEN v0.3
T1-03 Semantic Validation           ✅ FROZEN v0.2
PHASE 1                             ✅ CLOSED
```

# PHASE 2 — INPUT UNDERSTANDING

```text
P2-00 Common Source Intake          ✅ FROZEN v0.2
P2-01A Canvas Native Authoring      ✅ PROVEN
P2-01B Canvas Review/Projection     ✅ PROVEN v0.2
P2-02 BPMN Structured Adapter       ✅ PROVEN v0.1
P2-03 Image/Perception Adapter      ✅ PROVEN v0.2
P2-04 Language/Document Adapter     ✅ PROVEN v0.2
P2-05 Existing Automation Adapter   ✅ PROVEN v0.2
P2-06 Cross-Adapter Conformance     ✅ 24/24
PHASE 2                             ✅ CLOSED
```

# BUILD OPENING REVIEW

```text
Reference Build Opening Review      ✅ CLOSED
Decision                            ❌ NO-GO
BUILD                               ⛔ CLOSED
```

Evidence:

```text
test/40-REFERENCE-BUILD-OPENING-REVIEW-RESULT-v0.1.md
```

---

# PHASE 3 — EXPLANATION & REVIEW

## T3-01 — Human-readable Workflow Draft

```text
✅ DESIGN / ARCH FROZEN v0.2
30 / 30 E-fixtures PASS
```

Initial result:

```text
29 PASS / 1 FAIL
```

E10 exposed proposition-wide epistemic flattening.

v0.2 introduced:

```text
ExplanationEvidenceFacet
```

so one human sentence can preserve different property-level truth/confidence/perspective states.

Frozen:

```text
design/20-HUMAN-READABLE-WORKFLOW-DRAFT-CONTRACT-v0.2.md
arch/10-HUMAN-READABLE-WORKFLOW-DRAFT-ARCHITECTURE-v0.2.md
design/21-HUMAN-READABLE-WORKFLOW-DRAFT-v0.2-FREEZE-DECLARATION.md
```

## T3-02 — Visual Review Workspace Product Contract

**Status: NEXT**

Build on frozen P2-01B review/projection architecture.

Primary question:

> How does TALOS visually present the same semantic baseline as T3-01—canonical meaning, source-only evidence, uncertainty, conflicts, validation findings and provenance—while giving the user clear review actions without allowing the Canvas to become source/provenance owner?

Must define at minimum:

```text
workspace/view modes
semantic vs presentation layers
projection item visual states
truth/confidence/perspective display contract
source evidence navigation
uncertainty/conflict visualization
validation finding overlays
clarification-question placement
multi-source provenance indication
source-only elements
review action affordances
baseline/version awareness
text draft ↔ Canvas baseline compatibility
```

No UI code yet.

## T3-03 — Correction / Confirmation / Freeze Loop

Status: **PENDING**

---

# PHASE 4 — CAPABILITY MODEL

Status: **PENDING**

# PHASE 5 — TEMPORAL EXECUTION MODEL

Status: **PENDING**

# PHASE 6 — REFERENCE / END-TO-END VERTICAL SLICE

Status: **PENDING**

Before implementation, the reference plan will be reconciled again against frozen Phases 1–5 and BUILD will require a new explicit authorization.

---

# Current authoritative state

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING        ✅ CLOSED
BUILD OPENING REVIEW                ✅ NO-GO
PHASE 3 — EXPLANATION & REVIEW      🟡 OPEN
T3-01                               ✅ FROZEN v0.2
T3-02                               🟢 NEXT
T3-03                               ⚪ PENDING
PHASE 4                             ⚪ PENDING
PHASE 5                             ⚪ PENDING
BUILD                               ⛔ CLOSED
```

## Immediate next move

```text
T3-02 — VISUAL REVIEW WORKSPACE PRODUCT CONTRACT
```