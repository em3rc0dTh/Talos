# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a source-aware process-intelligence and durable-execution system. Its responsibility is to **normalize and standardize business processes while preserving truth, semantics, provenance, evidence, uncertainty, conflict and source-specific meaning**.

> **TALOS is the semantic guard between heterogeneous business-process expression and durable machine execution.**

TALOS is not a BPMN converter, OCR summarizer, n8n clone, Temporal UI, or generic low-code diagrammer.

## Start here

Repository reading order and document authority:

```text
DOCUMENTATION-MAP.md
```

Current product progress:

```text
plan/71-R1-CURRENT-STATUS-2026-09-14.md
```

Commercial audit track:

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

The reference vertical slice remains the regression/proof spine under:

```text
build/reference-vertical-slice/
```

It preserves the source/canonical/review/ExecutionPlan/Temporal proof chain and remains a bounded regression baseline rather than the product definition itself.

The older `plan/00-TALOS-ROADMAP-v0.31.md` is a **2026-08-19 historical checkpoint**. Its `B10 — NEXT` statement is not current repository-wide product truth.

## R0 — Private Technical Preview baseline

Certified historical baseline:

```text
009b266bbfc7d82218ba613bedf1ef14af0159fc
Talos v0.1 Private Technical Preview
```

R0 remains a technical-preview baseline, not a Talos 1.0 commercial-readiness claim.

## R1 — Talos 1.0 Product Completion

Gate definition:

```text
plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md
```

Latest merged product-completion milestone:

```text
19057ff91f1661cd2bc4f62e86587ab05b41b859
R1-06→R1-10 — Talos 1.0 product completion
```

The merge follows a green PR-head/merge-state envelope for Image, B7–B9, B10 and the R0 release regressions. R1-08 also executed the complete One-App → Temporal → real GitHub external-effect path and proved fresh-Worker deduplication rather than duplicate effect creation.

Current R1 truth:

```text
R1-00 Prerequisite/product baseline                     ✅ CERTIFIED
R1-01 Truthful source/perception UX                    ✅ CERTIFIED IN R1 BASELINE
R1-02 Real arbitrary-input image path in One-App       ✅ CLOSED
R1-03 Process review/correction workspace               ✅ CLOSED
R1-04 Business-process confirmation                     ✅ CLOSED
R1-05 Automation Design Workspace                       ✅ CLOSED
R1-06 ExecutionPlan review + automation approval        ✅ CLOSED / MERGED
R1-07 Runtime/deployment/execution authority             ✅ CLOSED / MERGED
R1-08 Real capability effect from full product path     ✅ CLOSED / REAL EFFECT PROVEN
R1-09 Durability/restart/upgrade behavior                ✅ CLOSED / MERGED
R1-10 Product UX consolidation                          ✅ CLOSED / MERGED
R1-11 Real field trials                                 ⛔ EXTERNAL EVIDENCE REQUIRED
R1-12 Talos 1.0 exact-SHA certification                 ⛔ BLOCKED BY R1-11
```

The remaining Talos 1.0 blocker is no longer an unimplemented product path. It is the evidence requirement defined by:

```text
plan/72-R1-11-FIELD-TRIAL-PROTOCOL-v0.1.md
evidence/field-trials/README.md
```

R1-11 requires two qualifying field trials across two distinct real processes with a participant external to the Talos implementation team for each trial. Fixtures, quarries, CI, developer smoke tests and LLM-authored substitutes do not count.

The final release gate is prepared by:

```text
plan/73-R1-12-TALOS-1.0-RELEASE-CERTIFICATION-v0.1.md
.github/workflows/r1-12-talos-1-release-certification.yml
```

R1-12 refuses to certify unless the checked-out SHA is exactly the current merged `main` SHA and R1-11 already reports PASS.

# Product path now implemented

The One-App product path now reaches the complete governed execution chain:

```text
real source input
→ exact source preservation
→ source-aware perception / parsing
→ common evidence
→ inferred Canonical process
→ validation / uncertainty
→ human review / correction
→ explicit business-process confirmation
→ automation-design handoff
→ capability/integration decisions
→ explicit selection + binding
→ ExecutionPlan review
→ explicit automation approval
→ Temporal mapping
→ explicit RuntimePolicy
→ deployment design
→ environment realization
→ explicit deployment approval
→ deployment attempt
→ explicit workflow execution approval
→ Temporal execution
→ real external effect
→ durable execution evidence
→ restart/recovery history
```

No earlier authority substitutes for a later one. Restart recovery reconstructs durable evidence but does not resurrect consumed or memory-only authority automatically.

# What is not yet allowed to claim

Until R1-11 and R1-12 close:

```text
Talos 1.0 PRODUCT READY                 NO
design-partner ready                    NOT CERTIFIED
paid-pilot ready                        NOT CERTIFIED
multi-customer repeatability            NOT PROVEN
commercial product-market fit           NOT PROVEN
scale readiness                         NOT EVALUATED
```

The product-completion proof also does not automatically certify complete enterprise IAM, all customer-isolation models, every production secret/deployment topology, every provider, or every possible external integration. Those claims require their own evidence.

# Run locally

```bash
cd build/reference-vertical-slice
npm ci
npm run demo
```

Then open:

```text
http://127.0.0.1:8787
```

Reference behavior remains documented in:

```text
build/reference-vertical-slice/TRY-ME.md
```

# Evidence discipline

Talos documentation uses these non-equivalences:

```text
PLAN != IMPLEMENTATION
IMPLEMENTATION != CERTIFICATION
TECHNICAL PROOF != CUSTOMER VALUE PROOF
INTERNAL TEST != FIELD TRIAL
FIELD TRIAL != PRODUCT-MARKET FIT
ONE REFERENCE VERTICAL != MARKET REPEATABILITY
ONE CUSTOMER != PRODUCT-MARKET FIT
```

Historical sources remain preserved; they do not silently override newer repository truth.

# Active documentation tracks

## Product completion

```text
plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md
plan/71-R1-CURRENT-STATUS-2026-09-14.md
plan/72-R1-11-FIELD-TRIAL-PROTOCOL-v0.1.md
plan/73-R1-12-TALOS-1.0-RELEASE-CERTIFICATION-v0.1.md
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
