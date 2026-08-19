# TALOS

## Normalize and standardize business processes without erasing their origin

TALOS is a process-intelligence and durable-execution system whose central responsibility is to **normalize and standardize business processes while preserving the truth, semantics, notation, provenance, and evidence of the source from which each process originated**.

TALOS is not a BPMN converter, not a Temporal UI, and not merely a diagramming product. BPMN, UPN, UML Activity Diagrams, EPC, Petri Nets, SIPOC, Value Stream Mapping, Bizagi exports, Mermaid, draw.io, images, screenshots, physical drawings, digital canvases, natural language, existing workflow definitions, runtime observations, and the TALOS Canvas are all possible **process-expression sources**.

The system interprets those sources into a canonical TALOS Process Model, preserves exactly why each meaning is believed, validates what is complete or still missing, asks for clarification only when it matters, and only later designs capabilities and Temporal execution.

```text
ANY PROCESS REPRESENTATION
          ↓
  SOURCE-AWARE UNDERSTANDING
          ↓
 TALOS CANONICAL MODEL
          ↓
 PROVENANCE / SOURCE LINEAGE
          ↓
 SEMANTIC VALIDATION
          ↓
 AUTOMATION DESIGN
          ↓
 HUMAN-READABLE DRAFT + CANVAS
          ↓
 REVIEW / CORRECTION / CONFIRMATION
          ↓
 CAPABILITY BINDING
          ↓
 TEMPORAL EXECUTION PLAN
          ↓
 DURABLE EXECUTION + OBSERVATION
```

## Non-negotiable truth

> TALOS normalizes and standardizes the business process **without destroying or replacing its origin**.

Normalization creates common semantics. It does **not** pretend that BPMN, architecture diagrams, functional models, hand drawings, screenshots, native canvases, runtime observations or prose carry the same evidence or execution meaning.

The frozen Phase-1 contracts now establish this chain:

```text
SOURCE ORIGIN
      ↓
CAPTURE
      ↓
REPRESENTATION
      ↓
SOURCE OCCURRENCES / EVIDENCE
      ↓
SEMANTIC CLAIMS
      ↓
CANONICAL PROCESS REVISION
      ↓
SEMANTIC VALIDATION
      ↓
AUTOMATION-DESIGN READINESS
```

And the following distinctions are mandatory:

```text
SOURCE ORIGIN                    ≠ capture event
CAPTURE EVENT                    ≠ source representation
PHYSICAL DRAWING                 ≠ photograph bytes
NATIVE DIGITAL CANVAS            ≠ screenshot
DERIVATIVE                       ≠ exact source representation
SOURCE OCCURRENCE                ≠ conceptual identity
SAME LABEL                       ≠ same source node
TRUTH CLASS                      ≠ confidence
SEMANTIC VALIDITY                ≠ automation readiness
VALIDATION                       ≠ repair
QUESTION                         ≠ assumed answer
BUSINESS MODEL                   ≠ automatically one executable workflow
FUNCTIONAL DEPENDENCY            ≠ runtime sequence
BUSINESS SIDE EFFECT GAP         ≠ implementation detail to ignore
```

## Lifecycle

TALOS follows a gated repository lifecycle:

```text
brainstorming/
      ↓
design/
      ↓
arch/
      ↓
plan/
      ↓
build/
      ↓
test/
```

`test/` is also used before BUILD for semantic fixtures, pressure tests and gate evidence. Runtime/integration test implementation opens only when the corresponding build gates open.

No stage silently overwrites earlier truth. Superseded versions remain preserved.

## Repository map

- `brainstorming/` — system truth, source research, Mining Site quarries, hypotheses and discovered constraints.
- `design/` — product contracts, provenance, semantic validation, Canvas contracts and frozen design decisions.
- `arch/` — canonical model, system boundaries, capability/Temporal architecture and future compiler/runtime contracts.
- `plan/` — gated roadmap and acceptance criteria.
- `build/` — implementation only after the corresponding gate opens.
- `test/` — fixtures, semantic pressure tests, regression results and gate closure evidence.
- `deprecated/` — superseded material preserved when later versions replace earlier contracts.

## Current state

```text
SYSTEM TRUTH                         🟢 v0.1 ESTABLISHED
CANONICAL PROCESS MODEL              🟢 v0.1 FROZEN — T1-01 CLOSED
MINING SITE                          🟢 Q01–Q12 FIRST BATCH COMPLETE
PROVENANCE MODEL                     🟢 v0.3 FROZEN — T1-02 CLOSED
SEMANTIC VALIDATION                  🟢 v0.2 FROZEN — T1-03 CLOSED
PHASE 1 — CANONICAL SEMANTICS        🟢 CLOSED

TALOS CANVAS ADAPTER                 🟢 T2-01 NEXT — DESIGN FIRST
BPMN ADAPTER                         ⚪ T2-02 PENDING
IMAGE / GRAPHIC ADAPTER              ⚪ T2-03 PENDING

CAPABILITY REGISTRY                  🟡 DRAFT / LATER GATE
TEMPORAL EXECUTION MODEL             🟡 DRAFT / LATER GATE
TALOS CANVAS PRODUCT CONTRACT        🟡 EXISTING DRAFT / TO RECONCILE WITH T2-01
BUILD                                ⛔ CLOSED
TEST DESIGN / GATE EVIDENCE          🟢 ACTIVE
TEST IMPLEMENTATION                  ⛔ CLOSED
```

# Phase 1 gate evidence

## T1-01 — Canonical Process Model

Frozen:

```text
arch/01-CANONICAL-PROCESS-MODEL-v0.1.md
```

Evidence:

```text
test/01-CANONICAL-PROCESS-MODEL-PRESSURE-TEST-v0.1.md
12 / 12 PASS
```

T1-01 answers:

> What does the source mean in a common TALOS semantic model?

---

## Mining Site — first evidence batch

Real-source research:

```text
Q01–Q12
```

The first ten were cross-synthesized in:

```text
brainstorming/mining-site/CROSS-QUARRY-SYNTHESIS-v0.1.md
```

Q11 added physical-source capture evidence:

```text
brainstorming/mining-site/CROSS-QUARRY-Q11-ADDENDUM-v0.1.md
```

Q12 added functional-model / ICOM-like relationship evidence:

```text
brainstorming/mining-site/CROSS-QUARRY-Q12-ADDENDUM-v0.1.md
```

The Mining Site established that TALOS must understand source class, semantic planes, relationship roles, source occurrence identity, uncertainty, functional decomposition, collaboration, concurrency, physical capture and non-process architecture before considering execution.

---

## T1-02 — Provenance Model

Initial v0.2 pressure test:

```text
P01–P28
26 PASS / 2 FAIL
```

The Q11/Q12 failures forced explicit distinction between source origin, capture and representation.

Frozen:

```text
design/01-ORIGIN-PROVENANCE-AND-NORMALIZATION-v0.3.md

blob:
2e20a98aba744e9d719765c15429422f0e03c779
```

Full regression:

```text
test/06-PROVENANCE-REGRESSION-RESULT-v0.1.md
28 / 28 PASS
```

Gate closure:

```text
test/07-T1-02-PROVENANCE-GATE-CLOSURE-v0.1.md
```

T1-02 answers:

> Why does TALOS believe this meaning, exactly what evidence supports it, and how can every later revision trace back to its origin?

---

## T1-03 — Semantic Validation

Candidate v0.1 was pressure-tested against Q01–Q12 plus conflict, non-material inference, technical-deferral and clarification-history fixtures.

Initial result:

```text
V01–V16
15 PASS / 1 FAIL
```

The failure exposed a historical-state defect: findings/questions could appear mutable even though validation assessments are snapshots.

v0.2 added:

```text
immutable ValidationFinding
FindingDisposition
immutable ClarificationQuestion
ClarificationResponse
one primary scope per ValidationAssessment
deterministic ReadinessDecision precedence
```

Frozen:

```text
design/03-SEMANTIC-VALIDATION-CONTRACT-v0.2.md

commit:
171b1f52cda4ca8fa61c2c8c78b1edc58b901ead

blob:
2b1463a6286fd3c3edcfd0417d29a9ffef45704f
```

Full regression:

```text
test/10-SEMANTIC-VALIDATION-REGRESSION-RESULT-v0.1.md
16 / 16 PASS
```

Freeze declaration:

```text
design/04-SEMANTIC-VALIDATION-v0.2-FREEZE-DECLARATION.md
```

Gate closure:

```text
test/11-T1-03-SEMANTIC-VALIDATION-GATE-CLOSURE-v0.1.md
```

T1-03 answers separately:

```text
IS THIS MODEL COHERENT / USEFUL?
WHAT IS INCOMPLETE?
WHAT IS CONFLICTED?
WHAT NEEDS CONFIRMATION?
WHAT BLOCKS AUTOMATION DESIGN?
WHAT CAN BE DEFERRED TO T4/T5?
WHAT QUESTION HAS THE HIGHEST VALUE NEXT?
```

Readiness precedence for automation design is now frozen:

```text
material conflict
  → BLOCKED_BY_CONFLICT

else required semantics absent
  → INSUFFICIENT_DETAIL

else material candidate interpretation needs authority
  → NEEDS_CONFIRMATION

else
  → READY_FOR_AUTOMATION_DESIGN
```

This does **not** mean ready to deploy. It means Phase-1 semantic gates no longer block moving into automation design for that validated scope.

# Phase 1 closure

TALOS now has frozen answers for three foundational questions:

```text
1. WHAT DOES IT MEAN?
   Canonical Process Model v0.1

2. WHY DO WE BELIEVE IT?
   Provenance Model v0.3

3. IS IT SUFFICIENT, AND WHAT IS MISSING?
   Semantic Validation v0.2
```

Therefore:

```text
PHASE 1 — CANONICAL SEMANTICS
✅ CLOSED
```

# Current gate — T2-01 TALOS Canvas Adapter

Phase 2 begins with the source TALOS controls completely.

The next contract must answer:

> If a user draws directly inside TALOS, what exact native structured source and revision model should the Canvas emit so that Canonical v0.1, Provenance v0.3 and Semantic Validation v0.2 work without any special exception for TALOS' own UI?

Expected path:

```text
TALOS Canvas native source
        ↓
SourceOrigin / native representation
        ↓
SourceOccurrence identities
        ↓
Canonical ProcessRevision
        ↓
Provenance links / claims
        ↓
ValidationAssessment / findings
        ↓
user correction
        ↓
new Canvas revision
        ↓
new ProcessRevision + reassessment
```

BUILD remains closed. T2-01 opens with **DESIGN → ARCH → PLAN** first.

Active roadmap:

```text
plan/00-TALOS-ROADMAP-v0.3.md
```

## Working definition

> **TALOS is the semantic guard between business-process expression and durable machine execution.** It accepts heterogeneous process representations, preserves their origin and evidence, normalizes their meaning, validates what is complete or still unknown, helps the user resolve only material ambiguities, and only then designs capabilities and durable Temporal execution without rewriting the business truth that came before it.
