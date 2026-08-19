# TALOS — Functional Model Canvas Fixture Q12 v0.1

Status: **TEST DESIGN / T1-02 SUPPORTING EVIDENCE**  
Date: **2026-08-18**

## Purpose

This fixture extends the T1-02 provenance pressure-test evidence with Quarry 12, a digital-canvas functional model whose arrows appear to encode distinct relationship roles rather than ordinary process sequence.

It does not close T1-02 by itself.

---

# Fixture P21 — Function box vs executable task

## Evidence

Q12 contains function boxes such as:

```text
Preparar elecciones
Instalar mesas de sufragio
Votación
Cierre de mesas de sufragio
Contabilizar votos
```

## Required model behavior

Represent the source occurrence as a function/business capability without automatically promoting it into a Temporal Activity.

The provenance model must support:

```text
source-occurrence-type = FUNCTION_BOX
candidate-semantic-type = BUSINESS_FUNCTION
execution mapping = UNRESOLVED
```

## Failure condition

FAIL if every function box becomes an executable task merely because it is a rectangle with a verb phrase.

---

# Fixture P22 — Relationship-role preservation

## Evidence

Q12 repeatedly shows arrows entering function boxes from different sides. The strongest source-aware interpretation is:

```text
left    INPUT candidate
top     CONTROL candidate
right   OUTPUT candidate
bottom  MECHANISM candidate
```

## Required model behavior

Represent relationship-role claims independently from generic edge direction or control flow.

Candidate relationship vocabulary:

```text
FUNCTION_INPUT
FUNCTION_CONTROL
FUNCTION_OUTPUT
FUNCTION_MECHANISM
```

Each role claim must retain provenance to the relevant edge/attachment geometry and remain `INFERRED` unless formally declared by the source.

## Failure conditions

FAIL if:

- every arrow becomes `SEQUENCE`;
- control and input relationships are collapsed;
- mechanism/resource edges become sequence flow;
- the ICOM-like interpretation loses its inference status.

---

# Fixture P23 — Mechanism vs runtime actor assignment

## Evidence

Q12 places labels such as:

```text
Miembros de mesa
Personero
Personal RENIEC
Votantes
```

as lower-side relationship candidates around functions.

## Required model behavior

Preserve separately:

```text
entity identity/type candidate
relationship role = MECHANISM candidate
runtime task ownership = UNRESOLVED
```

## Failure condition

FAIL if a mechanism/resource relationship automatically becomes a human task owner, workflow participant, Task Queue or integration binding.

---

# Fixture P24 — Functional decomposition vs runtime subprocess

## Evidence

Q12 shows:

```text
Elecciones municipales
```

alongside a more detailed five-function network.

This strongly suggests multiple abstraction levels and likely parent/decomposition structure.

## Required model behavior

Represent:

```text
source abstraction level
function decomposition claim
confidence/truth status
```

without creating a runtime subprocess/Child Workflow relationship.

## Failure condition

FAIL if source decomposition is automatically mapped to Temporal Child Workflow semantics.

---

# Fixture P25 — Functional dependency vs synchronous sequence

## Evidence

Visible outputs feed the next functional phase, approximately:

```text
Partidos y candidatos inscritos
→ Instalar mesas de sufragio

Mesas de sufragio instaladas
→ Votación

Votos emitidos
→ Cierre de mesas de sufragio

Material electoral reunido
→ Contabilizar votos
```

## Required model behavior

Represent the source as a functional dependency/handoff while leaving runtime timing and execution mode unresolved.

## Failure conditions

FAIL if:

- output→input dependency is automatically treated as Activity return→argument flow;
- a functional chain is automatically declared synchronous;
- durable waits, batch boundaries or external handoffs become impossible to represent later because the provenance layer already flattened them.

---

# Fixture P26 — Output role vs runtime data type

## Evidence

Q12 visibly produces concepts such as:

```text
Mesas de sufragio instaladas
Votos emitidos
Candidato elegido
```

## Required model behavior

Preserve the source relationship role (`OUTPUT`) while allowing the canonical semantic identity to remain unresolved among:

```text
STATE
MILESTONE
DATA_OBJECT
BUSINESS_OBJECT
EVENT
COLLECTION
DOMAIN_OUTCOME
SOURCE_DEFINED
```

## Failure condition

FAIL if a functional output is automatically modeled as a task return value or plain variable.

---

# Fixture P27 — Notation-scoped geometric evidence

## Evidence

Q12 uses repeated side-specific connector geometry that is semantically suggestive.

Q10, by contrast, showed editor/cursor geometry that must not become process semantics.

## Required model behavior

Support a provenance-backed claim of the form:

```text
artifact-classification + local repeated pattern + attachment-side
→ candidate relationship role
```

without creating a global rule for all sources.

## Failure conditions

FAIL if:

- geometry can never participate in semantic interpretation;
- or geometry is promoted into a universal semantic rule independent of source/notation classification.

---

# Fixture P28 — Native canvas vs screenshot representation

## Evidence

Q12 entered TALOS as a PNG screenshot of a digital canvas. The native structured model was not supplied.

Captured representation:

```text
PNG
1790 × 757
191,811 bytes
sha256: 44c49f79e907e21810f9b379e6f378c1faca1e169cce3a5da9dafba449ad5322
```

## Required model behavior

Represent:

```text
source origin = DIGITAL_CANVAS
captured representation = PNG SCREENSHOT
native structured representation = NOT_AVAILABLE
```

If the native model arrives later, both representations must coexist and remain lineage-linked.

## Failure condition

FAIL if the screenshot is treated as proof that TALOS possesses the native canvas graph.

---

# Gate contribution

Q12 extends T1-02 with eight concrete requirements:

```text
P21 function box vs executable task
P22 relationship-role preservation
P23 mechanism vs runtime actor assignment
P24 functional decomposition vs runtime subprocess
P25 functional dependency vs synchronous sequence
P26 output role vs runtime data type
P27 notation-scoped geometric evidence
P28 native canvas vs screenshot representation
```

T1-02 should not freeze unless the active provenance candidate can represent these distinctions without flattening functional-model meaning into ordinary workflow execution semantics.
