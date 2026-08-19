# TALOS — Gated Roadmap v0.10

Status: **ACTIVE PLAN**  
Date: **2026-08-19**  
Supersedes for active planning: `00-TALOS-ROADMAP-v0.9.md`  
Historical v0.1–v0.9 remain preserved.

## Governing principle

> **Talos provides a source-agnostic intake architecture that can support heterogeneous process-expression sources through versioned adapters. Each source family becomes supported only after its adapter passes canonical, provenance, and semantic-validation conformance tests.**

Phase 2 remains **INPUT UNDERSTANDING**. BUILD stays closed.

---

# PHASE 1 — CANONICAL SEMANTICS

```text
T1-01 Canonical Process Model       ✅ FROZEN v0.1
T1-02 Provenance Model              ✅ FROZEN v0.3
T1-03 Semantic Validation           ✅ FROZEN v0.2
PHASE 1                             ✅ CLOSED
```

---

# PHASE 2 — INPUT UNDERSTANDING

```text
P2-00 Common Source Intake          ✅ FROZEN v0.2
P2-01A Canvas Native Authoring      ✅ PROVEN
P2-01B Canvas Review/Projection     ✅ PROVEN v0.2
P2-02 BPMN Structured Adapter       ✅ DESIGN/ARCH PROVEN v0.1
P2-03 Image/Perception Adapter      ✅ DESIGN/ARCH PROVEN v0.2
P2-04 Language/Document Adapter     ✅ DESIGN/ARCH PROVEN v0.2
P2-05 Existing Automation Adapter   ✅ DESIGN/ARCH PROVEN v0.2
P2-06 Cross-Adapter Conformance     🟢 NEXT
```

## P2-05 closure

Initial:

```text
A01–A32
31 PASS / 1 FAIL
```

A27 exposed conflation risk between automation definition state and deployment/runtime truth.

v0.2 established:

```text
AutomationDefinitionSnapshot
        ≠
AutomationDeploymentObservation
        ≠
RuntimeObservation
```

Full regression:

```text
32 / 32 PASS
```

Frozen:

```text
design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.2.md
arch/08-EXISTING-AUTOMATION-ADAPTER-ARCHITECTURE-v0.2.md
design/17-EXISTING-AUTOMATION-ADAPTER-v0.2-FREEZE-DECLARATION.md
```

---

# P2-06 — Cross-Adapter Conformance

Primary gate question:

> Do all proven source families obey the same common intake, provenance, canonical, semantic-validation, review and immutable-history laws without requiring hidden special cases or contradictory adapter behavior?

Shared families:

```text
Canvas Native
Canvas Review / Projection
BPMN Structured
Image / Perception
Language / Document
Existing Automation
```

Must prove at minimum:

```text
source preserved before interpretation
source identity never collapses into canonical identity
0..N semantic scopes consistently supported
UNKNOWN / partial / ambiguous evidence survives
source-specific semantics survive via evidence/extensions
truth class, confidence and evidence perspective remain independent
adapter failure never destroys source
new adapter/model version never mutates old interpretation
human correction/confirmation creates new history
multi-source conflict preserves perspectives
Canvas projection never transfers provenance ownership
no adapter emits Temporal directly
all adapters converge on common normalization/validation boundaries
no source family requires privileged canonical semantics
```

If conformance exposes a common-contract defect, version the affected common contract and rerun every impacted adapter proof before closing Phase 2.

---

# Phase-2 closure gate

Current:

```text
Common Source Intake            ✅
Canvas Native Authoring         ✅
Canvas Review / Projection      ✅
BPMN Structured Adapter         ✅
Image / Perception Adapter      ✅
Language / Document Adapter     ✅
Existing Automation Adapter     ✅
Cross-Adapter Conformance       ⚪

PHASE 2 INPUT ARCHITECTURE      🟡 OPEN
BUILD                           ⛔ CLOSED
```

Only after P2-06 passes may Phase 2 design/architecture close.

Even then, BUILD requires an explicit opening decision; closure does not silently start implementation.

---

# Immediate next move

```text
P2-06 — CROSS-ADAPTER CONFORMANCE
```
