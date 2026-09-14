# TALOS — Commercial Audit: Start Here

**Date:** 2026-09-14  
**Audience:** humans and LLMs  
**Status:** documentation index; this file does not certify commercial readiness.

The commercial-audit track separates repository truth from market hypotheses and provides a clear reading order.

Before using this track, read the repository-wide authority guide:

```text
DOCUMENTATION-MAP.md
```

## 1. Current repository reconciliation

`evidence/commercial/01-CURRENT-COMMERCIAL-REPO-RECONCILIATION-2026-09-14.md`

Read this first for the delta between the historical audit source and the later R0/R1 implementation. It records that Talos has progressed into an emerging One-App product path while keeping commercial readiness unproven.

## 2. Source capture

`evidence/sources/2026-09-14-CURRENT-TALOS-AUDIT-SOURCE.md`

Records the architectural/product-readiness questions that triggered the audit. Treat it as historical source evidence, not as an automatic override of newer repository truth.

## 3. Main brainstorming and commercial audit

`brainstorming/45-BRAINSTORMING-AUDITORIA-ANALISIS-COMERCIAL-TALOS-v0.1.md`

Explains the commercial thesis, candidate buyers, process-definition→execution trust gap, product journey, pilot model, non-goals and commercial-readiness ladder.

## 4. Evidence register

Stable entry point:

`evidence/commercial/00-COMMERCIAL-AUDIT-EVIDENCE-REGISTER-v0.1.md`

Canonical analytical register:

`brainstorming/46-COMMERCIAL-AUDIT-EVIDENCE-REGISTER-v0.1.md`

It separates repository facts, internally proven behavior, external evidence, rejected claims and commercial hypotheses that still need validation.

## 5. Validation and pilot plan

`plan/12-COMMERCIAL-VALIDATION-AND-PILOT-PLAN-v0.1.md`

Defines the path from current product audit to design partner, paid pilot and repeatability proof. Feature expansion is not a goal unless it tests a specific commercial hypothesis or closes a pilot boundary.

## 6. Readiness matrix

`test/106-COMMERCIAL-READINESS-AUDIT-MATRIX-v0.1.md`

Provides a conservative status matrix across semantics, lineage, product surface, capabilities, durability, customer-access boundaries, operations and market evidence.

## Product status companion

Commercial reviewers must also read:

`plan/71-R1-CURRENT-STATUS-2026-09-14.md`

This prevents the commercial audit from treating the old `B10 — NEXT` checkpoint as current product truth. The current product program is R1, with R1-02 and R1-03 closed by commit evidence and R1-04 as the next open product gate.

## Truth boundary

```text
TECHNICAL PROOF != CUSTOMER VALUE PROOF
INTERNAL TEST != WILLINGNESS TO PAY
ONE REFERENCE VERTICAL != MARKET REPEATABILITY
ONE CUSTOMER != PRODUCT-MARKET FIT
PLAN != IMPLEMENTATION
IMPLEMENTATION != CERTIFICATION
```

## Current conservative position

```text
CR1 Framework Works            STRONG EVIDENCE
CR2 Internal Product           PARTIAL / advancing
CR3 Design Partner Ready       NOT CERTIFIED
CR4 Paid Pilot Ready           NOT CERTIFIED
CR5 Repeatable Pilot           NOT PROVEN
CR6 Commercial Product         NOT PROVEN
CR7 Scale Ready                NOT EVALUATED
```

## Commercial North Star

Prove that multiple independently sourced real-world processes can become validated executable plans **without rewriting Talos Core**, while preserving explainable source→runtime lineage and measurable customer value.

## Reading rule for humans and LLMs

Never use a commercial hypothesis to fill a missing technical fact. Never use an internal technical test to infer market demand. When a source, plan, implementation and audit differ, preserve the distinction and follow the authority rules in `DOCUMENTATION-MAP.md`.