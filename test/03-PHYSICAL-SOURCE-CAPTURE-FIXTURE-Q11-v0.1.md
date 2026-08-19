# TALOS — Physical Source Capture Fixture Q11 v0.1

Status: **TEST DESIGN / T1-02 SUPPORTING EVIDENCE**  
Date: **2026-08-18**

## Purpose

This fixture extends the T1-02 provenance pressure-test evidence with Quarry 11, a physical hand-drawn process captured as a PNG image.

It does not close T1-02 by itself.

## Fixture P17 — Physical process expression captured digitally

### Evidence

Quarry 11 originated as:

```text
physical hand-drawn process on graph paper
```

and entered the TALOS session as:

```text
PNG captured representation
1293 × 1600
1,766,110 bytes
sha256: d8103ded8284978420bcfc39b998653e78e54e2180619df9350afc8a0f82dc62
```

### Required model behavior

The provenance model must represent independently:

```text
source origin
capture event / capture method
captured representation
representation byte identity
interpretation/perception evidence
semantic claims
```

A valid model must be able to express conceptually:

```text
SourceArtifact
  originKind = PHYSICAL_HAND_DRAWN_PROCESS

SourceCapture
  captureMethod = PHOTO / IMAGE_UPLOAD

SourceRepresentation
  kind = CAPTURED_REPRESENTATION
  observedMimeType = image/png
  contentHash = d810...
```

without claiming that the PNG hash identifies the physical paper itself.

### Failure conditions

FAIL if:

- `SourceArtifact` can only mean a digital byte blob;
- the PNG is incorrectly labeled as the physical original itself;
- capture method and semantic source type are collapsed;
- the model cannot retain the fact that the physical original is unavailable to the runtime while its captured representation is available;
- a later transcoded/preview image could inherit the PNG's exact byte identity without verification.

## Fixture P18 — Property-scoped handwriting uncertainty

### Evidence

Quarry 11 contains handwritten labels with different reading difficulty.

Examples:

```text
Documentar                         clear
Hacer deploy                       clear
Analizar el escenario              clear
¿Existe alguna página previa?      moderately difficult
Recolecta ideas del cliente        moderately difficult
Brainst                            ambiguous abbreviation
```

### Required model behavior

The model must support claims such as:

```text
source occurrence exists             SOURCE_TRUTH
visible token = Brainst               SOURCE_TRUTH / local confidence
Brainst means brainstorm              INFERRED / local confidence
```

without forcing one confidence value onto the entire node/artifact.

### Failure conditions

FAIL if:

- confidence exists only at whole-artifact level;
- an inferred transcription expansion becomes `SOURCE_TRUTH`;
- uncertainty in one property downgrades unrelated properties automatically;
- TALOS cannot preserve the literal visible token separately from its interpreted meaning.

## Fixture P19 — Composite textual lifecycle inside one source shape

### Evidence

One Q11 activity-like block contains:

```text
Ejecutar el diseño
Brainst, design,
arch, plan,
build, test
```

The source does not draw six separate boxes/connectors for the listed terms.

### Required model behavior

Represent:

```text
one source occurrence
+
embedded textual detail/list
+
optional later decomposition claim
```

without immediately generating six canonical control-flow nodes.

### Failure condition

FAIL if a textual list inside one source shape is automatically promoted into separate sequential process nodes.

## Fixture P20 — Source topology that conflicts with domain expectation

### Evidence

Q11 visually shows:

```text
¿Existe alguna página previa?
  ├── Sí → existing-site recovery
  └── No → terminal-like marker
```

and:

```text
¿El cliente agrega ideas nuevas?
  ├── Sí → collect ideas → continue
  └── No → terminal-like marker
```

These branches may appear counterintuitive for a website-delivery lifecycle.

### Required model behavior

Preserve the drawn branch topology and represent the business meaning as unresolved when necessary.

### Failure conditions

FAIL if TALOS silently rewrites either `No` branch into a continuation because that seems more logical.

Critical rule:

```text
EXPECTED BUSINESS LOGIC
      ≠
SOURCE TRUTH
```

## Gate contribution

Q11 extends T1-02 with four concrete provenance requirements:

```text
P17 physical origin vs digital capture
P18 property-scoped handwriting uncertainty
P19 embedded text list vs graph decomposition
P20 source topology vs domain expectation
```

T1-02 should not freeze unless the active provenance candidate can represent all four without source loss or invented truth.
