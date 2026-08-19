# TALOS Mining Site — Quarry 11 Addendum v0.1

Status: **AUDIT / EVIDENCE ADDENDUM**  
Date: **2026-08-18**  
Scope: **Q11 compared against Q01–Q10**

## Why this addendum exists

The first ten quarries were enough to prove that TALOS must classify artifacts, separate authoring/annotation planes, preserve source occurrence identity, distinguish edge semantics and keep uncertainty visible.

Quarry 11 adds a new dimension that the Q01–Q10 synthesis did not prove strongly enough:

> A process expression may originate outside a digital file entirely.

Q11 is a hand-drawn workflow on physical paper that entered TALOS through a PNG photograph/capture. Therefore origin, capture and representation cannot be collapsed into one `source file` concept.

## New evidence chain

```text
PHYSICAL PAPER DRAWING
        ↓ capture
PNG REPRESENTATION
        ↓ perception / transcription
SOURCE OCCURRENCES
        ↓ semantic interpretation
CANONICAL TALOS MODEL
```

Critical distinction:

```text
ORIGINAL PROCESS EXPRESSION
      ≠
CAPTURE METHOD
      ≠
CAPTURED DIGITAL REPRESENTATION
      ≠
CANONICAL SEMANTICS
```

## Q11 semantic contribution

Q11 is deliberately interesting because the process graph is relatively simple while the source medium is perception-sensitive.

It contains:

```text
handwritten English + Spanish
informal diamonds and activity boxes
crossed/shaded terminal-like marks
locally difficult typography
one composite activity containing a textual lifecycle list
source topology that appears logically surprising on both `No` branches
```

This proves that TALOS must assess at least two independent dimensions:

```text
PROCESS SEMANTIC COMPLEXITY
SOURCE INTERPRETATION DIFFICULTY
```

A simple process can be difficult to capture correctly. A complex process can be easy to parse when supplied in a formal native representation.

## New provenance requirement

The Q01–Q10 synthesis emphasized source byte identity. Q11 refines that rule:

```text
ORIGINAL_BYTES
```

cannot be the universal definition of original source.

For Q11:

```text
physical paper = original process expression
PNG = captured representation
```

The PNG can have a verified digital digest:

```text
sha256: d8103ded8284978420bcfc39b998653e78e54e2180619df9350afc8a0f82dc62
```

but TALOS must not pretend that this digest identifies the physical sheet itself.

## New interpretation rule — handwriting

Q11 adds direct evidence for property-scoped transcription confidence.

Example:

```text
shape exists                        SOURCE_TRUTH / high confidence
text exists                         SOURCE_TRUTH / high confidence
exact text = "Brainst"              SOURCE_TRUTH / medium confidence
Brainst means brainstorm            INFERRED / medium confidence
activity is composite stage         INFERRED / high confidence
```

Therefore:

```text
HANDWRITING CONFIDENCE
      ≠
TRUTH CLASS
```

## New interpretation rule — embedded textual stages

The source contains one large activity-like block:

```text
Ejecutar el diseño
Brainst, design,
arch, plan,
build, test
```

This is not proof of six separately connected process nodes.

Therefore:

```text
TEXTUAL STEP LIST INSIDE ONE SHAPE
      ≠
PROVEN SEPARATE CONTROL-FLOW NODES
```

TALOS may preserve the list as source detail and later ask whether it represents a subprocess/decomposition.

## New interpretation rule — do not repair surprising topology

The first decision appears to say:

```text
¿Existe alguna página previa?
  ├── Sí → recovery flow
  └── No → terminal-like marker
```

The second decision similarly appears to stop on `No`.

That may conflict with what a domain expert expects from a `zero to production` website lifecycle, but the source must remain intact.

Therefore:

```text
BUSINESS-LOGIC SURPRISE
      ≠
LICENSE TO REPAIR SOURCE TOPOLOGY
```

TALOS should record the branch as visible, mark its business meaning unresolved, and ask for confirmation later.

## Comparison to previous quarries

Q11 reinforces prior lessons:

- ambiguous symbols are not formal event types merely because they look event-like;
- source topology must outrank expected business logic;
- confidence belongs to local evidence/properties rather than one diagram-wide score;
- missing continuation remains missing rather than implicit success.

Q11 adds new evidence for:

- physical-origin process expressions;
- capture-method provenance;
- digital representation as a secondary layer to physical origin;
- handwriting/transcription uncertainty;
- composite textual stage lists inside one drawn node;
- independent assessment of source difficulty and process complexity.

## Architectural consequence

The generalized front-end now becomes:

```text
PROCESS EXPRESSION / ORIGIN
        ↓
SOURCE CAPTURE
        ↓
CAPTURED REPRESENTATION(S)
        ↓
ARTIFACT CLASSIFICATION
        ↓
SOURCE-PLANE / GRAPH EXTRACTION
        ↓
PERCEPTION / TRANSCRIPTION
        ↓
PROPERTY-SCOPED CLAIMS + UNCERTAINTY
        ↓
CANONICAL NORMALIZATION
        ↓
FOUNDRY SOURCE
```

This is intentionally medium-agnostic.

The same architecture should eventually be pressure-tested with other origin/capture pairs such as:

```text
physical wall whiteboard → photo
native TALOS Canvas → structured graph + rendered preview
external whiteboard → native export + screenshot
spoken explanation → audio + transcript
```

Those examples are future test hypotheses; Q11 directly proves only the paper → PNG case.

## Verdict

```text
Q11 SOURCE READING                         ✅
PHYSICAL ORIGIN / DIGITAL CAPTURE SPLIT    ✅ REQUIRED
HANDWRITING LOCAL UNCERTAINTY              ✅ REQUIRED
INFORMAL NOTATION                          ✅ SUPPORTED
COMPOSITE TEXTUAL STAGE                    ✅ PRESERVE WITHOUT FORCED DECOMPOSITION
SURPRISING NO-BRANCH TOPOLOGY              ✅ PRESERVE / DO NOT REPAIR
T1-02 PROVENANCE IMPACT                    ✅ MATERIAL
BUILD IMPACT                               ⛔ NONE YET
```

Quarry 11 should therefore be used as direct gate evidence when T1-02 Provenance is pressure-tested.
