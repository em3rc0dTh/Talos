# Quarry 12 — Foundry Source 12

## Status

`FOUNDRY-SOURCE-12` is the standardized semantic artifact emitted by `TRANSFORM-12`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled Mining Site handoff to the Foundry.

---

# Process / model identity

```text
model: Municipal Election Functional Model
quarry: quarry-12-municipal-election-functional-model
source: source-12
transform: transform-12
foundry-source: foundry-source-12
artifact-class: FUNCTIONAL_PROCESS_MODEL_ON_DIGITAL_CANVAS
notation: IDEF0/ICOM-LIKE [INFERRED]
execution-readiness: NOT_READY
```

---

# Source representation

Available representation:

```text
PNG screenshot/capture
1790 × 757
191,811 bytes
sha256: 44c49f79e907e21810f9b379e6f378c1faca1e169cce3a5da9dafba449ad5322
```

Native structured canvas/model:

```text
NOT SUPPLIED
```

Foundry rule:

```text
SCREENSHOT OF DIGITAL CANVAS
      ≠
NATIVE CANVAS GRAPH
```

If a structured model arrives later, preserve both representations and re-evaluate graph/relationship evidence without discarding this captured version.

---

# Functional abstraction levels

The source contains a context-level function candidate:

```text
F0 — Elecciones municipales
```

and a detailed functional network candidate:

```text
F1 — Preparar elecciones
F2 — Instalar mesas de sufragio
F3 — Votación
F4 — Cierre de mesas de sufragio
F5 — Contabilizar votos
```

Relationship:

```text
F0 DECOMPOSES_TO F1..F5
```

status:

```text
STRONG INFERENCE / NOT FORMALLY PROVEN BY SOURCE LEGEND
```

Foundry must not automatically treat this hierarchy as a Parent Workflow/Child Workflow relationship.

---

# Canonical functional chain

```text
F1 PREPARAR_ELECCIONES
  output: PARTIDOS_Y_CANDIDATOS_INSCRITOS
        ↓ functional dependency

F2 INSTALAR_MESAS_DE_SUFRAGIO
  output: MESAS_DE_SUFRAGIO_INSTALADAS
        ↓ functional dependency

F3 VOTACION
  output: VOTOS_EMITIDOS
        ↓ functional dependency

F4 CIERRE_DE_MESAS_DE_SUFRAGIO
  output: MATERIAL_ELECTORAL_REUNIDO
        ↓ functional dependency

F5 CONTABILIZAR_VOTOS
  output: CANDIDATO_ELEGIDO
```

This chain is intentionally represented as:

```text
FUNCTIONAL_DEPENDENCY
```

not automatically:

```text
SEQUENCE
```

---

# Relationship-role model

Q12 requires source relationships to retain role semantics.

Initial canonical relationship vocabulary candidate:

```text
FUNCTION_INPUT
FUNCTION_CONTROL
FUNCTION_OUTPUT
FUNCTION_MECHANISM
FUNCTIONAL_DEPENDENCY
FUNCTION_DECOMPOSITION
```

These are source/model semantics. They are not Temporal constructs.

---

# F1 — Preparar elecciones

```text
function-id: F1
source-label: Preparar elecciones
```

Input candidates:

```text
Necesidad de nueva autoridad
Inscripción de partidos políticos
```

Control candidates:

```text
Registro de partidos y candidatos
Requisitos de postulación
Acreditación de personeros
```

Mechanism/resource candidates:

```text
Documentación legal
Candidatos
Personal electoral / related personnel
```

Output candidate:

```text
Partidos y candidatos inscritos
```

Execution type:

```text
UNRESOLVED
```

---

# F2 — Instalar mesas de sufragio

```text
function-id: F2
source-label: Instalar mesas de sufragio
```

Control candidates:

```text
Organización y asignación de mesas
Reglamento de colocación de mesas
Verificación del material electoral
```

Mechanism/resource candidates:

```text
Miembros de mesa
Material electoral
Personal de apoyo
```

Output candidate:

```text
Mesas de sufragio instaladas
```

Execution type:

```text
UNRESOLVED
```

---

# F3 — Votación

```text
function-id: F3
source-label: Votación
```

Input/dependency candidate:

```text
Mesas de sufragio instaladas
```

Control candidates:

```text
Lista de votantes
Verificación de identidad
Control del votante
```

Mechanism/resource candidates:

```text
Ánforas
Votantes
Cédulas de sufragio
```

Output candidate:

```text
Votos emitidos
```

Execution type:

```text
UNRESOLVED / likely mixed human + physical + system process
```

No authentication, identity-provider or voting-system implementation is source truth.

---

# F4 — Cierre de mesas de sufragio

```text
function-id: F4
source-label: Cierre de mesas de sufragio
```

Input/dependency candidate:

```text
Votos emitidos
```

Control candidates:

```text
Registro de votos
Conteo de votos
```

Mechanism/resource candidates:

```text
Miembros de mesa
Material electoral
```

Output candidate:

```text
Material electoral reunido
```

Execution type:

```text
UNRESOLVED
```

---

# F5 — Contabilizar votos

```text
function-id: F5
source-label: Contabilizar votos
```

Input/dependency candidate:

```text
Material electoral reunido
```

Control/data candidates:

```text
Acta de votos
Ficha de contabilización
```

Mechanism/resource candidates:

```text
Miembros de mesa
Personero
Personal RENIEC
```

Output candidate:

```text
Candidato elegido
```

Execution type:

```text
UNRESOLVED
```

`Candidato elegido` is a source-visible output, but the source does not prove whether it is a formal proclamation, state transition, document/result publication, or terminal process outcome.

---

# Function box semantics

Foundry invariant:

```text
FUNCTION BOX
      ≠
TEMPORAL ACTIVITY
```

A function may later map to:

```text
Activity
Human Interaction
Subprocess
Child Workflow
Several Activities
External system lifecycle
Physical/manual process
Non-executable business capability
```

No automatic mapping is authorized by this Foundry Source.

---

# Mechanism/resource semantics

Foundry invariant:

```text
FUNCTION_MECHANISM
      ≠
RUNTIME ACTOR ASSIGNMENT
```

For example:

```text
Personal RENIEC
```

is visible as a source mechanism/resource relationship around `Contabilizar votos`, but the screenshot does not identify:

- which concrete activity that personnel performs;
- whether it is a person, role, team or external institution in runtime terms;
- whether it should become a human task;
- whether it corresponds to a Task Queue or external integration.

Preserve source participation first. Resolve execution ownership later.

---

# Controls

Source controls may normalize into several different canonical concepts.

Possible later interpretations:

```text
BusinessRule
ReferenceData
Policy
AuthorizationConstraint
RequiredArtifact
ValidationRequirement
Schedule/CalendarConstraint
SourceSpecificControl
```

No global mapping is safe.

Example:

```text
Verificación de identidad
```

is source-supported as a control around `Votación`, but does not prove a concrete identity verification activity or provider.

---

# Outputs and state/readiness semantics

Several outputs look like business readiness states or material/information products:

```text
Partidos y candidatos inscritos
Mesas de sufragio instaladas
Votos emitidos
Material electoral reunido
Candidato elegido
```

Foundry should evaluate whether each is:

- a state;
- a business object/document;
- an event;
- a collection/batch;
- a milestone;
- a trigger for another durable lifecycle.

Do not force them into simple return-value semantics.

Critical rule:

```text
FUNCTION OUTPUT
      ≠
ACTIVITY RETURN VALUE AUTOMATICALLY
```

---

# Hierarchy semantics

Foundry invariant:

```text
FUNCTIONAL DECOMPOSITION
      ≠
RUNTIME SUBPROCESS
```

Possible future execution architectures include:

```text
one ElectionLifecycle Workflow
multiple phase Workflows
polling-station-level Workflows
vote-tally aggregation Workflows
human/manual external phases with only coordination in Temporal
```

Q12 does not choose among them.

---

# Functional dependency versus runtime sequencing

Source-supported dependency:

```text
registered parties/candidates
→ polling station setup
→ voting
→ station closure
→ tallying
→ elected candidate output
```

Execution semantics unresolved:

```text
synchronous?       UNKNOWN
calendar-driven?   UNKNOWN
batch?             UNKNOWN
many station instances? UNKNOWN
human confirmation? UNKNOWN
external events?   UNKNOWN
```

Therefore:

```text
FUNCTIONAL DEPENDENCY
      ≠
TEMPORAL SEQUENCE
```

---

# Native canvas provenance question

Before freezing any canonical interpretation for production use, determine whether the original digital canvas can provide:

- node IDs;
- connector IDs;
- connector attachment sides;
- text labels;
- grouping/hierarchy;
- canvas revisions;
- source application/export metadata.

If available, those structured identifiers should become stronger occurrence-level provenance than image regions alone.

---

# Foundry questions

Before executable design, resolve at least:

1. What notation/tool produced the canvas? Is it formally IDEF0, another ICOM convention, or a custom functional model?
2. Is `Elecciones municipales` formally the parent/context function of F1–F5?
3. What stable business identity represents one municipal election lifecycle?
4. Are there separate lifecycles per municipality, polling station, table/mesa, district or candidate set?
5. What events/times trigger election preparation, station installation, opening voting, closing voting and tallying?
6. Which function outputs are persisted states versus documents/materials/events?
7. What exact rules constrain candidate registration and party eligibility?
8. What does `Verificación de identidad` require operationally?
9. What system/data source owns the voter list and voter status?
10. How are ballots and physical electoral materials represented/observed digitally, if at all?
11. What does `Mesas de sufragio instaladas` mean as observable completion evidence?
12. What causes the voting phase to open and close?
13. How are votes represented and correlated to polling stations without violating required privacy/secrecy boundaries?
14. What does `Registro de votos` mean relative to `Conteo de votos`?
15. What artifacts feed `Contabilizar votos`?
16. Is tallying centralized, distributed or hierarchical?
17. What is the authoritative definition of `Candidato elegido`?
18. What happens when records disagree, are missing or challenged?
19. Are recount, invalidation, appeal or correction paths in scope?
20. Which people/organizations are mechanisms versus actual task owners?
21. Which phases, if any, should be coordinated by Temporal rather than merely observed?
22. What durable waits, external events, human confirmations and audit requirements exist?

---

# Handoff verdict

```text
SOURCE REPRESENTATION                 ✅ PNG CAPTURE
SOURCE BYTE IDENTITY                  ✅
NATIVE STRUCTURED CANVAS              ⚪ NOT SUPPLIED
ARTIFACT CLASS                        ✅ FUNCTIONAL MODEL
FORMAL NOTATION                       🟡 IDEF0/ICOM-LIKE — INFERRED
FUNCTION INVENTORY                    ✅
INPUT/CONTROL/OUTPUT/MECHANISM ROLES  ✅ STRONG INFERENCE
FUNCTIONAL DEPENDENCY                 ✅
ABSTRACTION / DECOMPOSITION           ✅ STRONG INFERENCE
FUNCTION → ACTIVITY                    🟡 NOT PROVEN
MECHANISM → RUNTIME ACTOR             🟡 NOT PROVEN
OUTPUT → TEMPORAL DATA FLOW           🟡 NOT PROVEN
FUNCTIONAL DEPENDENCY → SEQUENCE      🟡 NOT PROVEN
EXCEPTION / CORRECTION PATHS          🟡 SOURCE GAP
TEMPORAL CANDIDATES                   ✅ SUGGESTED
TEMPORAL CODE                         ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-12` is ready for comparison and T1-02/T1-03 pressure testing. Its central contribution is that TALOS must preserve **functional relationship roles and abstraction levels** before reducing any source into executable control flow.
