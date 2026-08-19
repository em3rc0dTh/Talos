# TALOS — Phase 3 Explanation & Review Gate v0.1

Status: **ACTIVE PHASE-3 GOVERNING GATE**  
Date: **2026-08-19**

## Purpose

Phase 1 established semantic meaning, provenance and validation.

Phase 2 established source-agnostic intake across foundational source families.

Phase 3 establishes the human-facing semantic contract between TALOS interpretation and acceptance.

Primary question:

> Can a person understand exactly what TALOS believes the process means, what remains uncertain/conflicted, why TALOS believes it, and what must be corrected/confirmed before an accepted semantic revision is frozen?

BUILD remains closed throughout Phase 3 design/architecture.

---

# Phase-3 sequence

```text
T3-01 HUMAN-READABLE WORKFLOW DRAFT     🟢 NEXT
        ↓
T3-02 VISUAL REVIEW WORKSPACE CONTRACT  ⚪ PENDING
        ↓
T3-03 CORRECTION / CONFIRMATION LOOP    ⚪ PENDING
        ↓
PHASE 3 DESIGN / ARCH GATE              ⚪ PENDING
```

---

# T3-01 — Human-readable Workflow Draft

The draft must communicate semantic meaning without laundering uncertainty.

Required distinctions:

```text
DERIVED EXPLANATION             ≠ SOURCE
EXPLANATION TEXT                ≠ NEW SEMANTIC TRUTH
LINEAR READING ORDER            ≠ PROCESS ORDER AUTOMATICALLY
INFERRED MEANING                ≠ CONFIRMED MEANING
VALIDATION FINDING              ≠ PROCESS STEP
QUESTION                        ≠ ASSUMED ANSWER
SOURCE-ONLY EVIDENCE            ≠ CANONICAL ELEMENT REQUIRED
IMPLEMENTED BEHAVIOR            ≠ BUSINESS INTENT
FUNCTIONAL DEPENDENCY           ≠ TEMPORAL SEQUENCE
```

The human-readable draft must be able to explain non-linear and non-workflow scopes without forcing them into a numbered sequence.

---

# T3-02 — Visual Review Workspace

Build on frozen P2-01B:

```text
ReviewWorkspaceDefinition
ReviewWorkspaceRevision
ReviewProjectionRevision
BaselineTransitionCandidate
BaselineReconciliationAnalysis
BaselineTransitionDecision
```

Phase 3 adds the product-level semantic review contract around those structures.

The Canvas is a projection/review surface, not provenance owner.

---

# T3-03 — Correction / Confirmation / Freeze

Must prove:

```text
review action
→ new authority/review evidence
→ new SemanticClaim / Confirmation / Conflict resolution
→ new ProcessRevision where meaning changes
→ new ValidationAssessment
→ explicit accepted semantic revision
```

No original source or historical interpretation is rewritten.

---

# Phase-3 gate

Phase 3 closes only when a user can:

```text
1. import or create a process expression;
2. read TALOS' explanation;
3. distinguish accepted / inferred / unknown / conflicted meaning;
4. inspect evidence/provenance for material statements;
5. see semantic-validation findings/questions;
6. review the same meaning visually;
7. correct/confirm without source rewrite;
8. obtain a new validated revision;
9. explicitly freeze/accept the semantic revision for later capability/execution design.
```

---

# Build policy

```text
BUILD = CLOSED
```

Phase 3 is DESIGN / ARCH / PLAN evidence only.

---

# Immediate next move

```text
T3-01 — HUMAN-READABLE WORKFLOW DRAFT CONTRACT
```