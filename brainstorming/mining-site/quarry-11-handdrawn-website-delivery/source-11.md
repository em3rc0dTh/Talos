# Quarry 11 — Source 11 — Hand-Drawn Website Delivery Process

## Source record

- Quarry: `quarry-11-handdrawn-website-delivery`
- Source ID: `source-11`
- Source type: photographed hand-drawn process sketch on graph paper
- Source origin: physical handwritten drawing
- Captured representation: user-supplied PNG photograph/image of the paper drawing
- Source language: mixed English + Spanish
- Notation class: informal/source-defined workflow notation
- Supplied by: user during TALOS Mining Site working session
- Captured image dimensions: `1293 × 1600`
- Captured image size: `1,766,110 bytes`
- Captured image SHA-256: `d8103ded8284978420bcfc39b998653e78e54e2180619df9350afc8a0f82dc62`
- Observed byte format: PNG
- Native captured representation: exact user-supplied PNG exists in the working session; repository binary attachment is pending because the current GitHub connector available to this session writes UTF-8 repository content but does not expose binary upload.

> Quarry 11 must distinguish the **physical source artifact** from the **digital capture used by TALOS**. The paper drawing is the origin; the PNG is a captured representation of that origin. TALOS must not collapse those two identities.

## Visible title

The handwritten title is strongly readable as:

```text
How to develop a website from zero
to production
```

The line break and underlining are source-presentation details. The semantic title is interpreted as:

```text
How to develop a website from zero to production
```

## Visible process topology

The source contains one start marker, two diamond-shaped decisions, several rounded/rectangular activity-like blocks, arrows, and two crossed/shaded circular terminal-like marks.

The strongest visible topology is:

```text
START
  ↓
¿Existe alguna página previa?
  ├── Sí → Tomar capturas de toda la web
  │          ↓
  │      Leer código en caso exista
  │          ↓
  │      ¿El cliente agrega ideas nuevas?
  │          ├── Sí → Recolecta ideas del cliente
  │          │          ↓
  │          │      Analizar el escenario
  │          │          ↓
  │          │      Ejecutar el diseño
  │          │          Brainst, design,
  │          │          arch, plan,
  │          │          build, test
  │          │          ↓
  │          │      Revisar Web nueva
  │          │          ↓
  │          │      Documentar
  │          │          ↓
  │          │      Hacer deploy
  │          │          ↓
  │          │      terminal-like mark
  │          │
  │          └── No → terminal-like mark
  │
  └── No → crossed/shaded terminal-like mark
```

This topology is recorded as source reading, not as a repaired or optimized process.

## Explicit / strongly readable labels

### Decision 01

The first handwritten decision is strongly interpreted as:

```text
¿Existe alguna página previa?
```

The source visibly labels outgoing branches:

```text
Sí
No
```

The `Sí` branch flows toward `Tomar capturas de toda la web`.

The `No` branch visibly reaches a crossed/shaded circular mark. The exact semantic type of that mark is not formally defined by the source.

### Activity — existing-site visual capture

```text
Tomar capturas
de toda la
web
```

Normalized reading without changing source meaning:

```text
Tomar capturas de toda la web
```

### Activity — code inspection

Strongest reading:

```text
Leer código
en caso exista
```

### Decision 02

Strongest reading:

```text
¿El cliente agrega ideas nuevas?
```

Visible branch labels:

```text
Sí
No
```

The `Sí` branch points left toward the client-idea collection activity.

The `No` branch points right toward another crossed/shaded terminal-like mark.

### Activity — client ideas

Strongest reading:

```text
Recolecta ideas
del cliente
```

The handwriting appears grammatically informal. TALOS preserves the visible wording rather than silently correcting it to another verb form.

### Activity — scenario analysis

```text
Analizar el
Escenario
```

### Activity — delivery lifecycle

The larger activity block is read as:

```text
Ejecutar el
diseño
Brainst, design,
arch, plan,
build, test
```

`Brainst` is visible shorthand/abbreviation. It is likely related to `brainstorm`, but the source itself does not spell the complete word.

### Activity — review

```text
Revisar Web
nueva
```

### Activity — documentation

```text
Documentar
```

### Activity — deployment

```text
Hacer deploy
```

## Source-level uncertainty

Quarry 11 introduces uncertainty caused by handwriting and informal diagramming rather than by formal notation complexity.

Important examples:

```text
visible text occurrence                 confidence
-------------------------------------   ----------
Documentar                              high
Hacer deploy                            high
Analizar el escenario                   high
Tomar capturas de toda la web           high
Leer código en caso exista              high/medium
¿El cliente agrega ideas nuevas?        high/medium
¿Existe alguna página previa?           medium/high
Recolecta ideas del cliente             medium
Brainst                                 medium
```

These are qualitative source-reading confidence notes only. They do not change truth class.

## Source-origin distinction

The source chain is:

```text
PHYSICAL PAPER DRAWING
        ↓ photographed / captured
PNG REPRESENTATION
        ↓ interpreted
SOURCE OCCURRENCES / TEXT / CONNECTORS
        ↓ normalized later
TALOS SEMANTICS
```

Critical provenance rule introduced by Q11:

```text
PHYSICAL ORIGINAL
      ≠
DIGITAL CAPTURE
```

The captured PNG can be hashed exactly. The physical sheet of paper cannot be claimed as byte-identical digital evidence.

## Source limitations

The source does not explicitly establish:

- a formal notation or legend;
- whether the crossed/shaded circular marks are formal end events, visual stop markers, deletion/cancel marks, or another informal convention;
- why the first `No` branch appears to stop when the title describes developing a website from zero to production;
- whether the first `No` branch is intentionally terminal or whether a continuation was omitted;
- whether the second `No` branch is intended to terminate the entire website process or only skip new-idea collection;
- whether a client with no new ideas should continue directly to `Analizar el escenario`;
- whether `Brainst` definitely expands to `brainstorm`;
- whether `Ejecutar el diseño` is one activity or a container for the listed lifecycle stages;
- whether `brainst, design, arch, plan, build, test` are strictly sequential, iterative, nested, or simply a checklist/summary;
- whether `Revisar Web nueva` can loop back to design/build when changes are required;
- whether documentation always occurs before deployment;
- any actors, owners, systems, repositories, environments, integrations, deployment platform, acceptance criteria, timing, retries, failures, approvals, or rollback behavior.

Those gaps must remain visible during transformation. Quarry 11 is intentionally useful because the drawing is understandable enough to recover a process hypothesis while still containing handwriting and topology ambiguities that TALOS must not silently repair.
