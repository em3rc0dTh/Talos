# TALOS Mining Site — Quarry 12 Addendum v0.1

Status: **AUDIT / EVIDENCE ADDENDUM**  
Date: **2026-08-18**  
Scope: **Q12 relative to Q01–Q11**

## Why this addendum exists

Quarry 12 introduces a source family that the first eleven quarries did not exercise cleanly: a **digital-canvas functional model** whose arrows appear to carry different relationship roles depending on where they attach to function boxes.

The source is not safely reducible to:

```text
box → task
arrow → sequence
```

Its strongest new contribution is that TALOS must preserve **function semantics, relationship roles and abstraction/decomposition structure before execution interpretation**.

---

# New evidence introduced by Q12

## 1. Functional model ≠ sequence-flow model

Q12 visually contains functions such as:

```text
Preparar elecciones
Instalar mesas de sufragio
Votación
Cierre de mesas de sufragio
Contabilizar votos
```

with labeled arrows entering from different sides.

The repeated geometry strongly supports an ICOM-like interpretation:

```text
left    input candidate
top     control candidate
right   output candidate
bottom  mechanism/resource candidate
```

This is notation-scoped inference, not a universal canvas rule.

Critical invariant:

```text
ARROW
      ≠
SEQUENCE FLOW BY DEFAULT
```

---

# 2. Relationship role and entity type are separate dimensions

A person/organization/resource can participate in a function as a `MECHANISM` without that relationship proving a runtime task assignment.

Example:

```text
Personal RENIEC
  relationship-role: MECHANISM candidate
  entity-type: organization/personnel candidate
```

These dimensions must not be collapsed.

Critical invariant:

```text
MECHANISM RELATIONSHIP
      ≠
RUNTIME ACTOR ASSIGNMENT
```

---

# 3. Function box ≠ Temporal Activity

Q12's boxes represent source-level functions/capabilities. Their internal execution granularity is unknown.

A function may later become:

```text
one Activity
many Activities
human interaction
physical/manual work
subprocess
Workflow
non-executable business context
```

Critical invariant:

```text
FUNCTION BOX
      ≠
AUTOMATIC ACTIVITY
```

---

# 4. Functional output ≠ Activity return value

Visible outputs include:

```text
Partidos y candidatos inscritos
Mesas de sufragio instaladas
Votos emitidos
Material electoral reunido
Candidato elegido
```

These may be states, artifacts, collections, milestones or events.

Critical invariant:

```text
FUNCTION OUTPUT
      ≠
ACTIVITY RETURN VALUE AUTOMATICALLY
```

---

# 5. Output→input dependency ≠ synchronous runtime sequence

The source supports a functional progression from election preparation through tallying.

However:

```text
OUTPUT(Fn) → INPUT(Fn+1)
```

may conceal:

- durable time gaps;
- human/physical completion;
- batch aggregation;
- external authority;
- asynchronous handoffs;
- multiple process instances.

Critical invariant:

```text
FUNCTIONAL DEPENDENCY
      ≠
SYNCHRONOUS TEMPORAL SEQUENCE
```

---

# 6. Functional decomposition ≠ runtime subprocess

Q12 shows `Elecciones municipales` alongside a more detailed five-function network, strongly suggesting multiple abstraction levels.

Even if the lower network is later confirmed as formal decomposition:

```text
PARENT FUNCTION
  ↓ decomposed into
CHILD FUNCTION NETWORK
```

this does not establish:

```text
Parent Workflow
  ↓
Child Workflow
```

Critical invariant:

```text
SOURCE DECOMPOSITION
      ≠
RUNTIME SUBPROCESS
```

---

# 7. Canvas geometry can be semantic evidence — but only locally

Q10 taught TALOS that color and collaborative-editor geometry can be misleading. Q12 adds the complementary lesson: geometry sometimes genuinely encodes semantic role.

Safe rule:

```text
artifact classification
+ repeated local source pattern
+ geometry
→ semantic-role claim
```

Unsafe rule:

```text
top connector = CONTROL for every source
```

Therefore geometric semantics must always be source/notation-scoped and provenance-backed.

---

# Q11 vs Q12 — useful contrast

Q11:

```text
simple process semantics
hard handwriting / capture interpretation
```

Q12:

```text
cleaner structured visual source
richer relationship / abstraction semantics
```

This supports two independent dimensions for future validation/planning:

```text
SOURCE_INTERPRETATION_DIFFICULTY
SEMANTIC_MODEL_COMPLEXITY
```

These dimensions should not be collapsed into one generic confidence score.

---

# First Mining Site batch implication

Across Q01–Q12, TALOS now has evidence for:

```text
workflow/control-flow diagrams
collaborations/messages
human/physical work
business objects/states
exceptions/boundary behavior
architecture/service topology
parallelism and loops
annotated notation
collaborative whiteboards
physical handwritten process capture
functional ICOM-like canvas semantics
```

This is a sufficient diversity checkpoint for the first Mining Site batch.

The next architectural move should not be to collect arbitrary additional source types merely for quantity. The evidence should now be used to pressure-test and close T1-02 Provenance, then define T1-03 Semantic Validation.
