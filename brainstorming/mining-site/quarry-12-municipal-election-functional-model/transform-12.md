# Quarry 12 — Transform 12

## Objective

Interpret `source-12` as a functional-model canvas, preserve function/relationship-role/hierarchy semantics, distinguish input-control-output-mechanism evidence from ordinary workflow sequence, and prepare `foundry-source-12` without pretending the canvas directly defines Temporal execution.

No executable code is produced here.

---

# 1. Artifact classification

Canonical source class candidate:

```text
DIGITAL_CANVAS_SCREENSHOT
  containing
FUNCTIONAL_PROCESS_MODEL
```

Notation candidate:

```text
IDEF0 / ICOM-LIKE FUNCTIONAL MODEL
```

Truth discipline:

```text
functional-model structure      SOURCE_TRUTH
IDEF0/ICOM-like notation        INFERRED
native structured canvas        NOT AVAILABLE
```

Q12 is not treated as a generic left-to-right workflow diagram.

Critical rule:

```text
FUNCTIONAL MODEL
      ≠
SEQUENCE-FLOW MODEL
```

---

# 2. Source/capture distinction

The user supplied a screenshot/image of a digital canvas.

TALOS currently possesses:

```text
CAPTURED PNG REPRESENTATION
```

but does not possess:

```text
NATIVE CANVAS GRAPH / MODEL EXPORT
```

Therefore:

```text
DIGITAL CANVAS ORIGIN
      ↓ captured as
PNG REPRESENTATION
      ↓ interpreted through
VISUAL / STRUCTURAL PERCEPTION
```

If a native structured model is supplied later, it should become a separate `SourceRepresentation` with stronger graph-level addressability; the screenshot remains preserved as historical visual evidence.

---

# 3. Functional boxes are not automatic Activities

The main visible functions are:

```text
Elecciones municipales
Preparar elecciones
Instalar mesas de sufragio
Votación
Cierre de mesas de sufragio
Contabilizar votos
```

A naive workflow parser could map each box to one Temporal Activity. Q12 rejects that shortcut.

A function box expresses a unit of business capability/work at the source abstraction level. It may later become:

- one Activity;
- several Activities;
- a human interaction;
- a subprocess/workflow;
- a mixed human/system lifecycle;
- an execution-independent business function.

Therefore:

```text
SOURCE FUNCTION BOX
      ≠
AUTOMATIC TEMPORAL ACTIVITY
```

---

# 4. Connector role must be preserved before control-flow inference

The source shows labeled arrows entering function boxes from different sides.

The strongest candidate semantics are:

```text
LEFT    INPUT
TOP     CONTROL
RIGHT   OUTPUT
BOTTOM  MECHANISM / RESOURCE
```

This is an ICOM-like interpretation and must remain notation-scoped.

Q12 establishes a critical semantic rule:

```text
ARROW
  ≠
SEQUENCE FLOW BY DEFAULT
```

and more specifically:

```text
INPUT ARROW       ≠ previous executable step
CONTROL ARROW     ≠ previous executable step
OUTPUT ARROW      ≠ next executable step automatically
MECHANISM ARROW   ≠ actor/task automatically
```

The transform must classify relationship role first, then ask whether an executable dependency exists.

---

# 5. Context-level function versus decomposed network

The left-side context box:

```text
Elecciones municipales
```

appears alongside a more detailed network:

```text
Preparar elecciones
      ↓
Instalar mesas de sufragio
      ↓
Votación
      ↓
Cierre de mesas de sufragio
      ↓
Contabilizar votos
```

This strongly suggests multiple levels of abstraction.

Canonical interpretation candidate:

```text
FUNCTIONAL_CONTEXT
  Elecciones municipales

FUNCTIONAL_DECOMPOSITION
  F1 Preparar elecciones
  F2 Instalar mesas de sufragio
  F3 Votación
  F4 Cierre de mesas de sufragio
  F5 Contabilizar votos
```

But the transform preserves:

```text
PARENT/CHILD DECOMPOSITION: STRONG INFERENCE
```

not `SOURCE_TRUTH`, because no formal decomposition identifier/legend is visible.

Critical rule:

```text
SOURCE FUNCTION DECOMPOSITION
      ≠
RUNTIME SUBPROCESS INVOCATION
```

A modeling hierarchy describes abstraction/detail. A Temporal Child Workflow describes an execution boundary. The Foundry may connect them later only with sufficient evidence.

---

# 6. Function F1 — Preparar elecciones

Source-supported function label:

```text
Preparar elecciones
```

Visible left-side inputs include:

```text
Necesidad de nueva autoridad
Inscripción de partidos políticos
```

Visible top-side constraints/controls include candidate/party registration and eligibility/governance concepts, approximately:

```text
Registro de partidos y candidatos
Requisitos de postulación
Acreditación de personeros
```

Visible lower mechanisms/resources include legal documentation, candidates and election-related personnel. Exact wording is locally uncertainty-scoped.

Visible output toward F2:

```text
Partidos y candidatos inscritos
```

Normalization candidate:

```text
FUNCTION F1 PREPARE_ELECTIONS
inputs:
  NEED_FOR_NEW_AUTHORITY
  POLITICAL_PARTY_REGISTRATION
controls:
  CANDIDATE_PARTY_REGISTRY
  ELIGIBILITY_REQUIREMENTS
  PERSONERO_ACCREDITATION
mechanisms:
  LEGAL_DOCUMENTATION
  CANDIDATES
  ELECTION_PERSONNEL
outputs:
  REGISTERED_PARTIES_AND_CANDIDATES
```

The normalized names above are `INFERRED`; the Spanish source labels remain primary evidence.

---

# 7. Function F2 — Instalar mesas de sufragio

Function label:

```text
Instalar mesas de sufragio
```

Visible control concepts:

```text
Organización y asignación de mesas
Reglamento de colocación de mesas
Verificación del material electoral
```

Visible mechanism/resource concepts:

```text
Miembros de mesa
Material electoral
Personal de apoyo
```

Visible output:

```text
Mesas de sufragio instaladas
```

This output is then visibly connected to `Votación`.

Important distinction:

```text
MESAS_DE_SUFRAGIO_INSTALADAS
```

may represent:

- a business state;
- a completed capability result;
- a document/record;
- an event condition;
- a physical-world readiness state.

It is not automatically an Activity return value.

---

# 8. Function F3 — Votación

Function label:

```text
Votación
```

Visible incoming dependency:

```text
Mesas de sufragio instaladas
```

Visible top-side control concepts:

```text
Lista de votantes
Verificación de identidad
Control del votante
```

Visible lower mechanism/resource concepts:

```text
Ánforas
Votantes
Cédulas de sufragio
```

Visible output:

```text
Votos emitidos
```

This is an important semantic pattern:

```text
VOTANTE
```

appears as a resource/mechanism/participant in the functional model, not as a sequence step.

Likewise:

```text
VERIFICACIÓN DE IDENTIDAD
```

is shown as a controlling concept around the function. It must not be silently converted into a specific authentication implementation.

---

# 9. Function F4 — Cierre de mesas de sufragio

Function label:

```text
Cierre de mesas de sufragio
```

Visible incoming dependency:

```text
Votos emitidos
```

Visible top controls include:

```text
Registro de votos
Conteo de votos
```

Visible lower mechanisms/resources include:

```text
Miembros de mesa
Material electoral
```

Visible output toward F5 refers to gathered/assembled electoral material:

```text
Material electoral reunido
```

The exact source wording is locally compact, but the electoral-material handoff is strongly visible.

---

# 10. Function F5 — Contabilizar votos

Function label:

```text
Contabilizar votos
```

Visible top control/data concepts:

```text
Acta de votos
Ficha de contabilización
```

Visible lower mechanisms/resources:

```text
Miembros de mesa
Personero
Personal RENIEC
```

Visible final output:

```text
Candidato elegido
```

Q12 is especially useful here because the lower-side labels could be misread as activities if geometry is ignored.

Critical rule:

```text
PERSON / ORGANIZATION / RESOURCE ATTACHED AS MECHANISM
      ≠
PROCESS STEP
```

and:

```text
MECHANISM
      ≠
PROVEN RUNTIME ACTOR ASSIGNMENT
```

For example, `Personal RENIEC` may be a participating mechanism/resource in the source model, but the screenshot alone does not tell TALOS which specific runtime action, Task Queue or user task is assigned to that resource.

---

# 11. Functional dependency versus temporal sequence

There is strong evidence that outputs of earlier functions become inputs/readiness evidence for later functions:

```text
F1 → REGISTERED_PARTIES_AND_CANDIDATES → F2
F2 → POLLING_STATIONS_INSTALLED       → F3
F3 → VOTES_CAST                       → F4
F4 → ELECTORAL_MATERIAL_GATHERED      → F5
F5 → CANDIDATE_ELECTED
```

This supports:

```text
FUNCTIONAL DEPENDENCY
```

but does not by itself prove:

```text
one synchronous Temporal sequence
```

Possible execution realities include:

- long waits between phases;
- calendar/date boundaries;
- physical operations;
- human approvals;
- independent sub-lifecycles;
- multiple durable process instances;
- batch aggregation;
- external official events;
- document/material handoff.

Therefore:

```text
OUTPUT(A) → INPUT(B)
      ≠
Activity A return → Activity B argument
```

---

# 12. Control is not data dependency automatically

The source places concepts such as voter list, identity verification, regulations, registration requirements and counting records around functions.

The functional model may classify these as controls, but a future execution design must ask separately:

```text
Is this:
- a business rule?
- a reference dataset?
- a policy?
- an authorization condition?
- a required document?
- a human procedural constraint?
- an executable validation?
```

Q12 therefore prevents TALOS from flattening every control into either task input or branch condition.

---

# 13. Mechanism/resource semantics

The source contains people, organizational roles and physical resources around functions.

Potential canonical categories include:

```text
HUMAN_ROLE
ORGANIZATION
PHYSICAL_RESOURCE
DOCUMENT / MATERIAL
SYSTEM / AUTHORITY
UNKNOWN
```

But `mechanism` is a source-role relationship, not necessarily the intrinsic type of the referenced thing.

Example:

```text
Personero
```

may be a human role participating as a mechanism for `Contabilizar votos`.

Thus TALOS may need to preserve both:

```text
entity type: HUMAN_ROLE candidate
relationship role: MECHANISM
```

rather than using one field for both concepts.

---

# 14. Canvas geometry as notation-scoped evidence

Q12 introduces a strong new pattern:

```text
GEOMETRIC ATTACHMENT SIDE
```

can be semantically meaningful.

But only under notation/source context.

Safe rule:

```text
geometry
  + artifact classification
  + repeated local pattern
  → semantic-role inference
```

Unsafe rule:

```text
top arrow = CONTROL globally
```

The latter would corrupt BPMN, UML, whiteboard and arbitrary flowchart sources.

---

# 15. Semantic complexity versus source interpretation difficulty

Q11 demonstrated a simple process with difficult handwriting. Q12 demonstrates a visually clean/structured canvas whose semantic relationships are richer than ordinary workflow ordering.

This supports two independent assessment dimensions:

```text
SOURCE_INTERPRETATION_DIFFICULTY
SEMANTIC_MODEL_COMPLEXITY
```

Q12 has relatively readable text/geometry but high semantic-model complexity because relationship roles and abstraction levels matter.

---

# 16. Temporal conceptual candidate

The Foundry may eventually discover one or more durable lifecycles such as:

```text
ElectionLifecycleWorkflow ?
  ├── ElectionPreparationLifecycle ?
  ├── PollingStationSetupLifecycle ?
  ├── VotingWindowLifecycle ?
  ├── PollClosureLifecycle ?
  └── VoteTallyLifecycle ?
```

or a different decomposition entirely.

The source does not decide:

- Workflow count;
- child-workflow boundaries;
- Activity boundaries;
- timers/election-day scheduling;
- correlation across polling stations;
- aggregation strategy;
- human interaction implementation;
- retry/failure policy.

Those are Foundry concerns.

No Temporal mapping is executable truth yet.

---

# 17. Comparison with Quarries 01–11

## Reinforced

Q12 reinforces:

- source classification before workflow interpretation (Q06/Q10);
- geometry/style is evidence only in source context (Q10);
- actor/resource evidence does not directly define runtime implementation (Q02/Q05/Q07/Q08);
- graph/relationship semantics must survive normalization (Q07/Q09/Q10);
- captured representation is distinct from source origin/native structure (Q11).

## New / stronger evidence

Q12 introduces or sharply strengthens:

- functional-process modeling distinct from sequence-flow modeling;
- explicit relationship roles: input/control/output/mechanism;
- function box distinct from automatic executable task;
- mechanism/resource relationship distinct from actor assignment;
- functional hierarchy/decomposition distinct from runtime subprocess;
- output→input functional dependency distinct from synchronous sequence;
- connector attachment side as notation-scoped semantic evidence;
- multiple abstraction levels on one canvas/source family.

---

# Transform verdict

```text
SOURCE CAPTURE / BYTE IDENTITY          ✅
ARTIFACT CLASSIFICATION                 ✅ FUNCTIONAL MODEL
FORMAL NOTATION NAME                    🟡 IDEF0/ICOM-LIKE — INFERRED
FUNCTION INVENTORY                      ✅
ICOM-LIKE RELATIONSHIP ROLES            ✅ STRONG INFERENCE
CONTEXT VS DECOMPOSITION LEVEL          ✅ STRONG INFERENCE
FUNCTIONAL DEPENDENCY CHAIN             ✅
TEMPORAL SEQUENCE                       🟡 NOT PROVEN
MECHANISM → ACTOR ASSIGNMENT            🟡 NOT PROVEN
FUNCTION → ACTIVITY MAPPING              🟡 NOT PROVEN
NATIVE CANVAS GRAPH                     ⚪ NOT SUPPLIED
EXCEPTION / FAILURE TOPOLOGY            🟡 SOURCE GAP
TEMPORAL CANDIDATES                     ✅ SUGGESTED
TEMPORAL CODE                           ⛔ NOT NEEDED
```

Quarry 12 closes an important gap in the first Mining Site batch: TALOS must preserve **functional semantics and abstraction structure**, not only workflow control flow. A clean canvas can be semantically richer than a traditional process diagram, and normalization must not destroy that richness for the sake of producing a simpler execution graph.
