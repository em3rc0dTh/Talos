# TALOS — T2-01 Canvas Adapter Pressure Test Spec v0.1

Status: **TEST DESIGN / NOT YET CLOSED**  
Date: **2026-08-19**

## Purpose

Pressure-test the initial Phase-2 Canvas/source-intake candidates:

```text
design/05-TALOS-CANVAS-NATIVE-SOURCE-CONTRACT-v0.1.md
design/06-PROCESS-SOURCE-INTAKE-CONTRACT-v0.1.md
arch/03-PHASE-2-SOURCE-INTAKE-AND-CANVAS-ADAPTER-v0.1.md
```

against frozen:

```text
Canonical Process Model v0.1
Provenance Model v0.3
Semantic Validation v0.2
```

This is a semantic/architecture pressure test. It is not runtime/UI test implementation.

---

# Gate question

Can a native TALOS Canvas act as a real, incomplete-capable, provenance-safe source whose immutable revisions can be adapted into canonical meaning and validation findings without source mutation, geometry inference or Temporal leakage?

---

# C01 — Simple native sequence

Source:

```text
Manual Start
→ Receive request
→ Validate request
→ Complete
```

PASS if:

- Canvas stable IDs are independent from canonical IDs;
- native snapshots become source occurrences;
- mappings are deterministic and provenance-linked;
- ProcessRevision can be validated.

---

# C02 — Exclusive decision with explicit guards

Source:

```text
Approved?
├── YES → Continue
└── NO  → Reject
```

PASS if branch guards are structured/literal source truth and map without label guessing.

---

# C03 — Incomplete/dangling branch intent

User has authored:

```text
Approved?
├── YES → Continue
└── NO  → [not connected / unknown yet]
```

Required behavior:

- Canvas must preserve the existence/intention of the `NO` branch;
- branch target may remain unresolved;
- source relationship evidence must remain addressable;
- adapter must not invent `END`, `Reject` or another target;
- canonical normalization may omit a complete canonical edge if Canonical v0.1 requires both endpoints;
- T1-03 must still be able to produce a finding/question from the preserved source intent/evidence.

FAIL if the native source schema itself requires a fake target merely to save the drawing.

---

# C04 — Parallel split + ALL join

PASS if concurrency and `ALL` synchronization come from native component/relationship semantics, not geometry.

---

# C05 — Wait with incomplete business time

Source:

```text
waitKind = SCHEDULE
expression = Next Wednesday
timezone = UNKNOWN
```

PASS if WAIT normalizes while T1-03 finds the missing material timing semantics.

---

# C06 — Human approval without Temporal binding

PASS if:

```text
APPROVAL
actor = Manager
```

remains business human-interaction semantics while Signal/Update/Form/Activity remains later design.

---

# C07 — Actor/data/rule relationships

PASS if ACTOR, DATA_OBJECT and BUSINESS_RULE map to canonical families and do not become ordinary ACTION nodes.

---

# C08 — Presentation-only edit

Move/resize/recolor a node.

Required:

```text
new CanvasRevision
native digest changes
semantic digest unchanged
no new semantic ProcessRevision required
```

---

# C09 — Semantic edit

Change a decision guard or actor assignment.

Required:

```text
new CanvasRevision
semantic digest changes
new interpretation/ProcessRevision candidate
```

---

# C10 — Node retirement

Delete a node from the current Canvas.

PASS if old CanvasRevision/source occurrence/canonical provenance remains explainable.

---

# C11 — Structured subprocess membership

PASS if membership is explicit structured source evidence, not visual containment inference.

---

# C12 — Annotation and visual group

PASS if visible Canvas objects can remain source evidence while being intentionally excluded from process graph.

---

# C13 — UNKNOWN vs absent

PASS if:

```text
WAIT.timezone = UNKNOWN
```

is distinguishable from a property not applicable/not present in another component schema.

---

# C14 — Clarification write-back

Required history:

```text
CanvasRevision N
→ ProcessRevision N
→ Assessment A / Finding / Question
→ ClarificationResponse
→ explicit CanvasChangeSet
→ CanvasRevision N+1
→ ProcessRevision N+1
→ Assessment B
```

No old revision/finding/question is mutated.

---

# C15 — Native structured source + screenshot preview

PASS if:

```text
NATIVE_STRUCTURED
```

remains primary and screenshot is secondary `PREVIEW`/`DERIVATIVE` representation.

---

# C16 — Idempotent adaptation

Same immutable source representation + same adapter/mapping/canonical versions must be logically replayable without creating duplicate semantic truth.

---

# C17 — Same label / distinct native IDs

Two nodes both called:

```text
Review
```

must remain distinct through source and canonical provenance.

---

# C18 — Stable element identity across revisions

Edit `Review` label to `Review application`.

PASS if:

```text
CanvasElementIdentity same
CanvasElementSnapshot new
SourceOccurrence revision-scoped new
```

and prior evidence remains available.

---

# C19 — Semantic defaults

PASS only if the contracts distinguish:

```text
visible/schema-declared semantic default
```

from:

```text
hidden implementation convenience default
```

Only the former may become source truth.

---

# C20 — Adapter failure after successful preservation

Scenario:

```text
native Canvas revision preserved
adapter crashes/fails during extraction
```

PASS if source origin/capture/representation history remains valid and re-adaptation does not require recreating the source.

---

# Gate invariants

```text
CANVAS NATIVE SOURCE              ≠ CANONICAL MODEL
CANVAS SCREENSHOT                 ≠ NATIVE STRUCTURED SOURCE
PRESENTATION EDIT                 ≠ SEMANTIC EDIT
UNKNOWN                           ≠ DEFAULT
DANGLING/INCOMPLETE RELATIONSHIP  ≠ INVALID SOURCE INPUT
ADAPTER FAILURE                   ≠ SOURCE LOSS
SAME LABEL                        ≠ SAME SOURCE ID
CANVAS ELEMENT                    ≠ TEMPORAL ACTIVITY
HUMAN INTERACTION                 ≠ SIGNAL/UPDATE AUTOMATICALLY
```

---

# Required evidence before freeze

Create a result artifact with:

```text
C01–C20 PASS/FAIL
candidate contract element used
Phase-1 contract interaction
what is preserved
what remains unresolved
schema/architecture change required
```

Target:

```text
test/13-T2-01-CANVAS-ADAPTER-PRESSURE-TEST-RESULT-v0.1.md
```

Do not freeze T2-01 design/architecture until the full suite is executed and any failure is evolved/regressed.

BUILD remains closed.
