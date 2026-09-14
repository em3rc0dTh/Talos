# TALOS — DOCUMENTATION MAP

**Status:** CURRENT REPOSITORY READING GUIDE  
**Updated:** 2026-09-14  
**Audience:** humans and LLMs

This file explains how to read Talos without confusing historical brainstorming, frozen architecture, implementation evidence, active plans or commercial hypotheses.

## Authority ladder

When two documents appear to disagree, use this order:

1. **Current implementation + current test/evidence receipts** — what the repository can actually demonstrate.
2. **Frozen architecture/contracts** under `arch/` and `design/` — invariants that implementation must respect unless explicitly superseded.
3. **Current status documents** — dated status/reconciliation files that describe where execution currently stands.
4. **Active gated plans** under `plan/` — intended work and acceptance conditions; a plan does not prove implementation.
5. **Evidence** under `evidence/` and certification receipts under `test/` — proof with the scope stated by each artifact.
6. **Brainstorming** under `brainstorming/` — hypotheses, exploration and decision context; not automatic system truth.
7. **Historical roadmaps / old versions** — valid as history, not as current status unless explicitly reactivated.
8. **`deprecated/`** — never use as current authority.

A newer date alone does not allow a lower-authority document to rewrite proven technical truth.

## Document classes

```text
FACT_REPO       observed repository fact
CONTRACT        architectural/product invariant
ACTIVE_PLAN     accepted future gate sequence
CURRENT_STATUS  dated reconciliation of actual progress
EVIDENCE        proof for a bounded claim
HYPOTHESIS      proposition that still requires validation
HISTORICAL      preserved prior state or source
DEPRECATED      explicitly superseded; not current truth
```

## Start here by role

### Product / engineering reviewer

1. `README.md`
2. `plan/71-R1-CURRENT-STATUS-2026-09-14.md`
3. `plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md`
4. Relevant `arch/`, `design/` and `test/` evidence for the gate being reviewed.

### Architect / implementer

1. `README.md`
2. `arch/`
3. `design/`
4. `plan/70-R1-TALOS-1.0-PRODUCT-COMPLETION-PLAN-v0.1.md`
5. `build/reference-vertical-slice/` and the current One-App implementation
6. `test/`

### Commercial / business reviewer

1. `COMMERCIAL-AUDIT-START-HERE.md`
2. `evidence/commercial/01-CURRENT-COMMERCIAL-REPO-RECONCILIATION-2026-09-14.md`
3. `brainstorming/45-BRAINSTORMING-AUDITORIA-ANALISIS-COMERCIAL-TALOS-v0.1.md`
4. `brainstorming/46-COMMERCIAL-AUDIT-EVIDENCE-REGISTER-v0.1.md`
5. `plan/12-COMMERCIAL-VALIDATION-AND-PILOT-PLAN-v0.1.md`
6. `test/106-COMMERCIAL-READINESS-AUDIT-MATRIX-v0.1.md`

### LLM / automated reviewer

Read metadata and authority before summarizing. Never promote `HYPOTHESIS`, `ACTIVE_PLAN`, `UNKNOWN` or a historical source into current repository truth. Preserve exact distinctions such as:

```text
SOURCE TRUTH != PERCEPTION EVIDENCE
PERCEPTION EVIDENCE != INFERRED BUSINESS MEANING
INFERRED BUSINESS MEANING != HUMAN-CONFIRMED PROCESS
PROCESS CONFIRMATION != AUTOMATION APPROVAL
AUTOMATION APPROVAL != DEPLOYMENT AUTHORITY
DEPLOYMENT AUTHORITY != EXECUTION AUTHORITY
TECHNICAL PROOF != CUSTOMER VALUE PROOF
```

## Current high-level timeline

```text
Architecture / semantic phases 1–5          CLOSED
Reference Vertical Slice                     PROVEN BOUNDED BASELINE
R0 Private Technical Preview                 CERTIFIED (historical release baseline)
R1 Talos 1.0 Product Completion              ACTIVE PROGRAM
R1-02 One-App real image intake              CLOSED BY COMMIT EVIDENCE
R1-03 One-App review/correction              CLOSED BY COMMIT EVIDENCE
R1-04 Business-process confirmation          NEXT OPEN PRODUCT GATE
Commercial design-partner / paid-pilot proof NOT CERTIFIED
```

For exact evidence and caveats, use `plan/71-R1-CURRENT-STATUS-2026-09-14.md` rather than inferring status from old roadmap headings.

## Repository structure

```text
brainstorming/   exploration, hypotheses, quarries, commercial reasoning
arch/            architecture and frozen semantic contracts
design/          product/design contracts and authority boundaries
plan/            gated work definitions and current status
evidence/        preserved sources and bounded evidence registers
test/            test strategy, certification receipts and audit matrices
build/           authorized implementations/reference slices
deprecated/      superseded material only
```

## Non-negotiable reading rule

A README is an entry point, not the entire knowledge base. Talos documentation is intentionally distributed across **source → contract → plan → implementation → evidence → audit** so both humans and machines can reconstruct not only *what* Talos says, but *why* the claim is allowed.