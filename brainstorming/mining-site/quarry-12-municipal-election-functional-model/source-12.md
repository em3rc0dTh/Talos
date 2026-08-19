# Quarry 12 — Source 12 — Municipal Election Functional Model Canvas

## Source record

- Quarry: `quarry-12-municipal-election-functional-model`
- Source ID: `source-12`
- Source type: screenshot/image of a digital canvas containing a functional process model
- Supplied by: user during TALOS Mining Site working session
- Original uploaded filename in session: generated attachment PNG
- Captured image dimensions: `1790 × 757`
- Captured image size: `191,811 bytes`
- Captured image SHA-256: `44c49f79e907e21810f9b379e6f378c1faca1e169cce3a5da9dafba449ad5322`
- Observed byte format: PNG
- Source language: Spanish
- Native structured canvas/model: not supplied in this session

> The supplied PNG is an exact captured representation of the digital canvas available to TALOS in this session. It is not evidence that TALOS possesses the native structured canvas/model. If a native canvas graph/export is supplied later, it should be preserved as a separate, stronger structured representation rather than replacing this screenshot.

## Artifact character

The source contains a functional model for municipal elections. The visual convention strongly resembles an IDEF0/ICOM-style functional model because labeled arrows enter function boxes from multiple sides in patterns consistent with inputs, controls, outputs and mechanisms/resources.

However, the screenshot does not visibly declare an `IDEF0` legend or notation name. Therefore:

```text
FUNCTIONAL MODEL                SOURCE_TRUTH
IDEF0 / ICOM-LIKE INTERPRETATION INFERRED
```

TALOS must preserve the source geometry and labels without claiming a formal notation that the screenshot does not explicitly name.

## Visible context-level function

A left-side function box is labeled:

```text
Elecciones municipales
```

Visible incoming/outgoing labels around it include:

### Left-side incoming context

```text
Partidos políticos inscritos
Necesidad de un nuevo alcalde
Ejercer derecho de voto por los ciudadanos
```

### Top-side labels

```text
Requisitos del cargo
Padrón de votantes
Verificación de identidad
```

### Bottom-side labels

The lower labels are partially rotated/compact but visibly include concepts such as:

```text
Integrantes / miembros de mesa
Ciudadanos
Personal electoral / related operating personnel
```

Exact wording for every lower label is not equally legible from the screenshot and must remain locally confidence-scoped.

### Right-side outputs

```text
Resultados de la elección
Actas de votación
```

The source therefore visibly presents `Elecciones municipales` as a broader functional/context box with several categories of surrounding information/resources.

## Visible decomposed function network

The larger canvas presents five main function boxes from left to right:

```text
Preparar elecciones
Instalar mesas de sufragio
Votación
Cierre de mesas de sufragio
Contabilizar votos
```

A final right-side output is visibly labeled:

```text
Candidato elegido
```

The strongest visible functional chain is:

```text
Preparar elecciones
  ↓ output/dependency
Instalar mesas de sufragio
  ↓ output/dependency
Votación
  ↓ output/dependency
Cierre de mesas de sufragio
  ↓ output/dependency
Contabilizar votos
  ↓
Candidato elegido
```

The arrows between boxes are visually real. Their exact semantic role must be interpreted from attachment position and labels rather than flattened into ordinary sequence flow.

## Function 01 — Preparar elecciones

Visible left-side incoming labels include:

```text
Necesidad de nueva autoridad
Inscripción de partidos políticos
```

Visible top-side labels include concepts such as:

```text
Registro de partidos y candidatos
Requisitos de postulación
Acreditación de personeros
```

Visible lower labels include concepts such as:

```text
Documentación legal
Candidatos
Personal electoral / related personnel
```

A visible right-side output toward the next function is approximately:

```text
Partidos y candidatos inscritos
```

Some small rotated labels around this function are difficult to read exactly. TALOS must preserve local uncertainty rather than silently regularize every phrase.

## Function 02 — Instalar mesas de sufragio

Visible top-side labels include concepts such as:

```text
Organización y asignación de mesas
Reglamento de colocación de mesas
Verificación del material electoral
```

Visible lower labels include concepts such as:

```text
Miembros de mesa
Material electoral
Personal de apoyo
```

The visible right-side output toward `Votación` is:

```text
Mesas de sufragio instaladas
```

## Function 03 — Votación

Visible top-side labels include:

```text
Lista de votantes
Verificación de identidad
Control del votante
```

Visible lower labels include:

```text
Ánforas
Votantes
Cédulas de sufragio
```

The visible incoming dependency from the prior function is:

```text
Mesas de sufragio instaladas
```

The visible right-side output is:

```text
Votos emitidos
```

## Function 04 — Cierre de mesas de sufragio

Visible top-side labels include:

```text
Registro de votos
Conteo de votos
```

Visible lower labels include concepts such as:

```text
Miembros de mesa
Material electoral
```

The visible incoming dependency is:

```text
Votos emitidos
```

A visible right-side output toward the final function refers to:

```text
Material electoral reunido
```

The exact phrase is slightly compact/rotated but the material-electoral handoff is visually strong.

## Function 05 — Contabilizar votos

Visible top-side labels include:

```text
Acta de votos
Ficha de contabilización
```

Visible lower labels include:

```text
Miembros de mesa
Personero
Personal RENIEC
```

The visible incoming dependency is material electoral from the prior function.

The visible final output is:

```text
Candidato elegido
```

## Geometry and relationship-role evidence

The source is important because connector attachment position appears to carry semantic information.

For an ICOM-like interpretation, the strongest candidate mapping is:

```text
left-side arrow    → INPUT candidate
top-side arrow     → CONTROL candidate
right-side arrow   → OUTPUT candidate
bottom-side arrow  → MECHANISM / RESOURCE candidate
```

This mapping is `INFERRED` from the functional-model convention and source geometry. It is not a global TALOS rule for all canvas/diagram types.

## Hierarchy / decomposition evidence

The screenshot includes both:

```text
Elecciones municipales
```

and the more detailed network:

```text
Preparar elecciones
Instalar mesas de sufragio
Votación
Cierre de mesas de sufragio
Contabilizar votos
```

This strongly suggests a context-level function plus a decomposition into lower-level functions. The screenshot does not show explicit decomposition numbering or a visible source legend proving the formal parent/child relationship.

Therefore:

```text
MULTIPLE ABSTRACTION LEVELS      SOURCE-SUPPORTED
PARENT→CHILD DECOMPOSITION       STRONG INFERENCE
RUNTIME SUBPROCESS RELATIONSHIP  NOT PROVEN
```

## Source limitations

The screenshot does not explicitly establish:

- the formal notation name (`IDEF0`, ICOM, or another functional-model convention);
- the native canvas application's identity or structured graph representation;
- exact text for every small rotated label;
- whether the context-level `Elecciones municipales` box formally decomposes into the five displayed functions or is only shown as related context;
- whether every inter-function arrow means material/information handoff, state transition, control dependency or temporal sequencing;
- whether output-to-input dependencies are synchronous, asynchronous, manual, document-based or system-mediated;
- who owns each function organizationally;
- which lower-side labels represent people, organizations, software, physical resources or mixed mechanisms;
- exact data schemas for voter lists, ballots, vote records, electoral material or counting records;
- detailed exception paths such as invalid identity, missing materials, interrupted voting, recounts, challenged votes or failed tallying;
- retry, timeout, cancellation, compensation, correlation, idempotency or technical integration semantics;
- whether `Candidato elegido` is a terminal business state, published result, formal proclamation or another downstream artifact.

Those gaps remain explicit for transformation and Foundry design.
