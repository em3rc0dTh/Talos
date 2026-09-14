# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its responsibility is to **normalize and standardize business processes while preserving truth, semantics, provenance, evidence, uncertainty, conflict and source-specific meaning**.

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.**

TALOS is not a BPMN converter, OCR summarizer, n8n clone, Temporal UI, or generic low-code diagrammer.

## Start here

For the repository reading order and document authority model, read:

```text
DOCUMENTATION-MAP.md
```

For current implementation/product progress, read:

```text
plan/71-R1-CURRENT-STATUS-2026-09-14.md
```

For the commercial audit track, read:

```text
COMMERCIAL-AUDIT-START-HERE.md
```

# Architecture

```text
PROCESS EXPRESSION
        ↓
PRESERVE SOURCE + VERSIONED ADAPTER
        ↓
CANONICAL MODEL + PROVENANCE + SEMANTIC VALIDATION
        ↓
HUMAN EXPLANATION + REVIEW
        ↓
CORRECTION / CONFIRMATION / SEMANTIC FREEZE
        ↓
CAPABILITY / HUMAN-FORM / EXPLICIT BINDING
        ↓
EXECUTION PLAN
        ↓
TEMPORAL MAPPING
        ↓
RUNTIME POLICY
        ↓
DEPLOYMENT / RUNTIME OBSERVATION
```

No downstream runtime object may silently become upstream business truth.

Core laws include:

```text
SOURCE TRUTH != confidence != readiness != execution
source identity != canonical identity
Canvas source != canonical process model
implemented behavior != business intent
review correction != source rewrite
CapabilityRequirement != Offering != Binding
human interaction != form
ExecutionElement != Temporal primitive automatically
canonical ACTION != Temporal Activity automatically
business loop != technical retry
Temporal retry != idempotency guarantee
DeploymentRevision != Attempt != Observation != WorkflowExecution
```

# Current technical status — 2026-09-14

## Architecture foundation

```text
PHASE 1 — CANONICAL SEMANTICS       ✅ CLOSED
PHASE 2 — INPUT UNDERSTANDING       ✅ CLOSED
PHASE 3 — EXPLANATION & REVIEW      ✅ CLOSED
PHASE 4 — CAPABILITY MODEL          ✅ CLOSED
PHASE 5 — TEMPORAL EXECUTION MODEL  ✅ CLOSED
```

## Reference Vertical Slice — proven bounded baseline

The reference vertical slice remains a regression/proof spine under:

```text
build/reference-vertical-slice/
```

It proves the bounded chain from source/canonical review through ExecutionPlan and real local Temporal execution. Its historical B0–B9 closure and test receipts remain valid within their stated scope.

The older `plan/00-TALOS-ROADMAP-v0.31.md` is a **2026-08-19 checkpoint**. Its statement `B10 — NEXT` is not the current repository-wide product gate after later R0/R1 work.

## R0 — Private Technical Preview baseline

Commit history contains the certified Talos v0.1 Private Technical Preview milestone:

```text
009b266bbfc7d82218ba613bedf1ef14af0159fc
```

R0 is a technical-preview/release baseline, not a claim that Talos 1.0 or a commercial product is complete.

## R1 — Talos 1.0 Product Completion

The current product program is defined by:

```text
plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md
```

Current reconciled status:

```text
R1-01 Truthful source/perception UX                 PARTIAL / ADVANCED
R1-02 Real arbitrary-input image path in One-App    ✅ CLOSED BY COMMIT EVIDENCE
R1-03 Process review/correction workspace            ✅ CLOSED BY COMMIT EVIDENCE*
R1-04 Business-process confirmation                  🟢 NEXT OPEN PRODUCT GATE
R1-05 Automation Design Workspace                    ⚪ OPEN
R1-06 ExecutionPlan review + automation approval     ⚪ OPEN
R1-07 Runtime/deployment/execution authority          ⚪ OPEN
R1-08 Real capability effect from full product path  ⚪ OPEN
R1-09 Durability/restart/upgrade behavior             ⚪ OPEN
R1-10 Product UX consolidation                       ⚪ OPEN
R1-11 Real field trials                              ⚪ OPEN
R1-12 Talos 1.0 exact-SHA certification              ⚪ OPEN
```

Evidence anchors:

```text
R1-02  81a62d395d2c6857924df543b99ecd60c1f42114
R1-03  b37f754033c6252e6041d1ca25a299419320cd07
```

`*` R1-03's commit explicitly records a hosted-Actions caveat on the final head. The repository does **not** silently convert that caveat into a fresh green-CI claim. See `plan/71-R1-CURRENT-STATUS-2026-09-14.md`.

# What exists in the product path today

Current repository evidence supports an emerging One-App path with:

```text
real process image intake
→ exact source preservation
→ configured perception/evidence path
→ inferred process candidate
→ validation/questions
→ end-user review
→ governed correction/new revision
```

The downstream Talos 1.0 product path remains gated by explicit confirmation, automation approval, deployment authority and execution authority. No earlier approval substitutes for a later one.

# What is not yet allowed to claim

```text
Talos 1.0 PRODUCT READY                 NO
complete end-user source→execution UX   NO
design-partner ready                    NOT CERTIFIED
paid-pilot ready                        NOT CERTIFIED
multi-customer repeatability            NOT PROVEN
commercial product-market fit           NOT PROVEN
scale readiness                         NOT EVALUATED
```

Production/customer boundaries such as complete IAM/authorization, customer isolation, production secrets/deployment, broader provider coverage and field-trial evidence must be closed by the relevant R1/commercial gates rather than assumed from the reference slice.

# Reference version quick run

The bounded reference slice can still be run locally:

```bash
cd build/reference-vertical-slice
npm ci
npm run demo
```

Then open:

```text
http://127.0.0.1:8787
```

Reference requirements and detailed behavior remain documented in:

```text
build/reference-vertical-slice/TRY-ME.md
```

# Evidence discipline

Talos documentation uses the following non-equivalences:

```text
PLAN != IMPLEMENTATION
IMPLEMENTATION != CERTIFICATION
TECHNICAL PROOF != CUSTOMER VALUE PROOF
INTERNAL TEST != WILLINGNESS TO PAY
ONE REFERENCE VERTICAL != MARKET REPEATABILITY
ONE CUSTOMER != PRODUCT-MARKET FIT
```

Historical sources remain preserved; they do not silently override newer repository truth.

# Active documentation tracks

## Product completion

```text
plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md
plan/71-R1-CURRENT-STATUS-2026-09-14.md
```

## Commercial audit

```text
COMMERCIAL-AUDIT-START-HERE.md
brainstorming/45-BRAINSTORMING-AUDITORIA-ANALISIS-COMERCIAL-TALOS-v0.1.md
evidence/commercial/01-CURRENT-COMMERCIAL-REPO-RECONCILIATION-2026-09-14.md
plan/12-COMMERCIAL-VALIDATION-AND-PILOT-PLAN-v0.1.md
test/106-COMMERCIAL-READINESS-AUDIT-MATRIX-v0.1.md
```

The commercial track must never weaken the technical truth boundary, and the technical track must never manufacture market evidence.