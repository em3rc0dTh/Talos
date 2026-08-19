# TALOS — Phase 2 Input Architecture Consolidation v0.1

Status: **ARCHITECTURE CONSOLIDATION / PHASE-2 CLOSURE CANDIDATE**  
Date: **2026-08-19**

## Purpose

Consolidate the complete Phase-2 input architecture after all five source-family proofs and cross-adapter conformance.

This document does not replace the frozen source-family contracts. It records how they fit together as one architecture.

---

# 1. Phase-2 architectural statement

> TALOS receives heterogeneous process expressions through one preserved-source intake architecture and versioned source-family adapters. Each adapter preserves the semantics its source can actually support, emits evidence/claims rather than privileged canonical truth, and converges on one Canonical + Provenance + Semantic Validation core.

```text
                         HETEROGENEOUS SOURCE WORLD

      TALOS Canvas        BPMN        Image       Language      Automation
           │               │            │             │             │
           ▼               ▼            ▼             ▼             ▼
      NATIVE_STRUCTURED  STRUCTURED   VISUAL        TEXT          AUTOMATION
                         PARSE        PERCEPTION    INTERPRET     PARSE
           │               │            │             │             │
           └───────────────┴────────────┴─────────────┴─────────────┘
                                   │
                                   ▼
                         PROCESS SOURCE INTAKE
                                   │
                                   ▼
                          PRESERVED SOURCE EVIDENCE
                                   │
                                   ▼
                        0..N CANDIDATE SEMANTIC SCOPES
                                   │
                                   ▼
                       SEMANTIC CLAIMS + PROVENANCE
                                   │
                                   ▼
                         CANONICAL PROCESS MODEL
                                   │
                                   ▼
                          SEMANTIC VALIDATION
                                   │
                                   ▼
                      CANVAS REVIEW / CORRECTION
                                   │
                                   ▼
                     LATER CAPABILITY / EXECUTION DESIGN
```

Temporal is not part of Phase-2 source adaptation.

---

# 2. Frozen source-family architecture

```text
P2-00 Common Source Intake
  design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.2.md

P2-01A Canvas Native
  design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.2.md

P2-01B Canvas Review / Projection
  design/08-CANVAS-REVIEW-PROJECTION-CONTRACT-v0.2.md
  arch/04-CANVAS-REVIEW-PROJECTION-ARCHITECTURE-v0.1.md

P2-02 BPMN
  design/10-BPMN-STRUCTURED-ADAPTER-CONTRACT-v0.1.md
  arch/05-BPMN-STRUCTURED-ADAPTER-ARCHITECTURE-v0.1.md

P2-03 Image / Perception
  design/12-IMAGE-PERCEPTION-ADAPTER-CONTRACT-v0.2.md
  arch/06-IMAGE-PERCEPTION-ADAPTER-ARCHITECTURE-v0.2.md

P2-04 Language / Document
  design/14-LANGUAGE-DOCUMENT-ADAPTER-CONTRACT-v0.2.md
  arch/07-LANGUAGE-DOCUMENT-ADAPTER-ARCHITECTURE-v0.2.md

P2-05 Existing Automation
  design/16-EXISTING-AUTOMATION-ADAPTER-CONTRACT-v0.2.md
  arch/08-EXISTING-AUTOMATION-ADAPTER-ARCHITECTURE-v0.2.md

P2-06 Cross-Adapter Conformance
  design/18-CROSS-ADAPTER-CONFORMANCE-CONTRACT-v0.1.md
```

---

# 3. Shared epistemic law

Different source families have different strongest evidence:

```text
Canvas       → exact native authored structure
BPMN         → exact external structured notation
Image        → preserved pixels + inferred perception
Language     → preserved wording + linguistic interpretation
Automation   → implementation configuration / behavior evidence
Runtime      → operational observation
```

They are not made equal by pretending their evidence is identical.

They are made interoperable by preserving the distinction between:

```text
SOURCE
INTERPRETATION
CLAIM
TRUTH CLASS
CONFIDENCE
EVIDENCE PERSPECTIVE
CANONICAL MEANING
VALIDATION
```

---

# 4. Shared immutable-history law

Across Phase 2:

```text
SOURCE REVISION                ≠ mutation
ADAPTER/MODEL UPGRADE          ≠ mutation
HUMAN CONFIRMATION             ≠ mutation of old inference
REVIEW CORRECTION              ≠ source rewrite
DEPLOYMENT CHANGE              ≠ definition rewrite
RUNTIME OBSERVATION            ≠ definition rewrite
```

New evidence creates new immutable history and, when accepted semantics change, a new `ProcessRevision` / `ValidationAssessment` / review baseline transition.

---

# 5. Shared source-agnostic support rule

Design/architecture proof means:

> the source family can be represented coherently by the common Talos architecture.

It does **not** mean:

```text
parser implemented
vision/OCR implemented
LLM pipeline implemented
n8n connector implemented
production source support
```

Production support remains adapter-version implementation/test evidence.

---

# 6. Phase-2 conformance evidence

```text
Canvas native                  20/20 PASS
Canvas review                  14/14 PASS
BPMN                           20/20 PASS
Image/perception               28/28 PASS
Language/document              30/30 PASS
Existing automation            32/32 PASS
Cross-adapter                  24/24 PASS
```

No cross-adapter fixture required a frozen common/source-family contract amendment.

---

# 7. Core laws carried forward

```text
PRESERVE BEFORE INTERPRET
SOURCE IDENTITY                ≠ CANONICAL IDENTITY
ONE ARTIFACT                   MAY YIELD 0..N SCOPES
UNKNOWN/PARTIAL                ≠ INVALID AUTOMATICALLY
SOURCE-SPECIFIC SEMANTICS      ≠ CANONICAL POLLUTION
TRUTH CLASS                    ≠ CONFIDENCE
TRUTH CLASS                    ≠ EVIDENCE PERSPECTIVE
CANVAS DISPLAY                 ≠ PROVENANCE TRANSFER
USER CORRECTION                ≠ SOURCE REWRITE
NEW INTERPRETER                ≠ OLD INTERPRETATION MUTATION
IMPLEMENTED BEHAVIOR           ≠ BUSINESS INTENT
RUNTIME OBSERVATION            ≠ IMPLEMENTATION DEFINITION
SOURCE EXPRESSION              ≠ TEMPORAL EXECUTION DESIGN
```

---

# 8. Phase-2 closure criterion

All required design/architecture gates are satisfied:

```text
Common Source Intake            ✅
Canvas Native Authoring         ✅
Canvas Review / Projection      ✅
BPMN Structured Adapter         ✅
Image / Perception Adapter      ✅
Language / Document Adapter     ✅
Existing Automation Adapter     ✅
Cross-Adapter Conformance       ✅
```

Therefore:

```text
PHASE 2 INPUT ARCHITECTURE      ✅ ELIGIBLE TO CLOSE
```

But:

```text
BUILD                           ⛔ REMAINS CLOSED
```

Build opening requires a separate explicit decision after revalidating the reference implementation plan against the complete frozen Phase-2 architecture.
