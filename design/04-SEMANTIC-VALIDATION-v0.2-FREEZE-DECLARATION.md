# TALOS — Semantic Validation Contract v0.2 Freeze Declaration

Status: **FROZEN / T1-03 CONTRACT**  
Date: **2026-08-19**

## Frozen contract

```text
design/03-SEMANTIC-VALIDATION-CONTRACT-v0.2.md
```

Frozen Git identity:

```text
contract commit: 171b1f52cda4ca8fa61c2c8c78b1edc58b901ead
contract blob:   2b1463a6286fd3c3edcfd0417d29a9ffef45704f
```

The exact bytes identified by this blob are the bytes exercised by the full V01–V16 regression.

No post-test semantic edit is part of the frozen contract.

---

# Gate evidence

Initial v0.1 pressure test:

```text
test/09-SEMANTIC-VALIDATION-PRESSURE-TEST-RESULT-v0.1.md
15 PASS / 1 FAIL
```

Failure:

```text
V16 — clarification/revalidation history
```

Evidence-forced v0.2 changes:

```text
immutable ValidationFinding
FindingDisposition
immutable ClarificationQuestion
ClarificationResponse
one primary scope per ValidationAssessment
formal deterministic ReadinessDecision precedence
```

Full regression:

```text
test/10-SEMANTIC-VALIDATION-REGRESSION-RESULT-v0.1.md
16 PASS / 0 FAIL
```

---

# Frozen core entities

```text
ValidationAssessment
AssessmentScope
SemanticVerdict
ValidationFinding
FindingDisposition
ReadinessDecision
ClarificationQuestion
ClarificationResponse
ValidationDependency
```

The frozen contract also establishes the T1-03 semantic rule families and stable initial rule codes.

---

# Frozen readiness boundary

For `AUTOMATION_DESIGN_READINESS`, the v0.2 precedence is:

```text
material unresolved conflict
  → BLOCKED_BY_CONFLICT

else required semantics absent / missing
  → INSUFFICIENT_DETAIL

else only material candidate meanings need authority confirmation
  → NEEDS_CONFIRMATION

else no T1-03 automation-design blockers
  → READY_FOR_AUTOMATION_DESIGN
```

Later capability/provider/Temporal/deployment choices do not block `READY_FOR_AUTOMATION_DESIGN` merely because they have not yet been designed.

---

# Frozen historical behavior

```text
VALIDATION ASSESSMENT       = immutable snapshot
VALIDATION FINDING          = immutable fact of that assessment
CLARIFICATION QUESTION      = immutable issued question
LATER ANSWER                = ClarificationResponse
LATER FINDING OUTCOME       = FindingDisposition
SEMANTIC CHANGE             = new ProcessRevision
REVALIDATION                = new ValidationAssessment
```

No later answer changes what the previous assessment actually found.

---

# Frozen scope behavior

A source/model is validated according to a primary scope and intent.

Therefore:

```text
REFERENCE ARCHITECTURE
      ≠ invalid because it is not one Workflow

FUNCTIONAL MODEL
      ≠ invalid because it lacks runtime sequence

VALID AS BUSINESS/ARCHITECTURE MODEL
      can coexist with
INSUFFICIENT DETAIL FOR AUTOMATION DESIGN
```

Q06 and Q12 are canonical regression examples of this rule.

---

# Frozen user-facing principle

TALOS validation must be capable of explaining:

```text
WHAT TALOS UNDERSTANDS
WHAT IS SOURCE-SUPPORTED / CONFIRMED
WHAT IS INFERRED BUT SAFE TO CONTINUE WITH
WHAT IS MISSING / AMBIGUOUS
WHAT BLOCKS AUTOMATION DESIGN
WHAT IS DEFERRED TO LATER DESIGN
WHAT QUESTION SHOULD BE ASKED NEXT
CURRENT SEMANTIC VERDICT
CURRENT EXECUTION READINESS
```

T1-03 defines the semantics of that summary. T3 later defines its product/UI presentation.

---

# Change rule

Any future semantic modification requires:

```text
new version
+ v0.2 preserved
+ new/updated fixtures
+ full semantic-validation regression
+ explicit freeze decision
```

Do not silently change frozen v0.2.

---

# Decision

```text
SEMANTIC VALIDATION v0.2      🔒 FROZEN
V01–V16                       ✅ PASS
T1-03                         ✅ READY TO CLOSE
BUILD                         ⛔ REMAINS CLOSED
```
