# Quarry 11 — Transform 11

## Objective

Interpret `source-11` as a photographed hand-drawn website-delivery process, preserve the distinction between physical origin and digital capture, recover the strongest source-supported control-flow graph, record handwriting uncertainty at property level, and prepare `foundry-source-11` without repairing incomplete branches or silently converting informal notation into formal BPMN semantics.

No executable code is produced here.

## 1. Artifact classification

Canonical source class:

```text
ARTIFACT_CLASS
PHOTOGRAPHED_HAND_DRAWN_PROCESS_SKETCH
```

This quarry adds a new source-origin pattern:

```text
PHYSICAL PROCESS EXPRESSION
        ↓ capture
DIGITAL VISUAL REPRESENTATION
        ↓ interpretation
CANONICAL TALOS SEMANTICS
```

Critical rule:

```text
PHYSICAL SOURCE ARTIFACT
      ≠
CAPTURED IMAGE REPRESENTATION
```

The PNG is exact digital evidence of the capture, not byte identity for the original paper sheet.

## 2. Capture/origin separation

The source should be represented conceptually as:

```text
SourceArtifact
origin-kind: PHYSICAL_HAND_DRAWN_PROCESS

SourceCapture
capture-method: PHOTO / IMAGE_UPLOAD

SourceRepresentation
kind: ORIGINAL_CAPTURED_REPRESENTATION
format: PNG
sha256: d8103ded8284978420bcfc39b998653e78e54e2180619df9350afc8a0f82dc62
```

Q11 therefore strengthens the T1-02 provenance rule that `ORIGINAL_BYTES` cannot be treated as the universal definition of original source identity.

## 3. Informal notation discipline

The drawing uses:

```text
filled/circular start-like mark
hand-drawn diamonds
rounded/rectangular activity blocks
arrows
crossed/shaded circular terminal-like marks
```

No formal notation legend is present.

Therefore:

```text
DIAMOND SHAPE
    + question text
    + labeled branches
→ strong decision candidate
```

but:

```text
CROSSED / SHADED CIRCLE
→ terminal-like source mark
≠ automatically BPMN End Event
```

Likewise, rounded rectangles are activity candidates because of their labels and topology, not because TALOS assumes one formal notation.

## 4. Handwriting interpretation must be property-scoped

Quarry 11 is semantically simple but perception-sensitive.

A source element may have:

```text
shape existence: SOURCE_TRUTH / high confidence
text existence: SOURCE_TRUTH / high confidence
exact transcription: INFERRED / medium-high confidence
semantic type: INFERRED / high confidence
normalized business meaning: INFERRED
```

Example:

```text
occurrence: lifecycle block
visible text token: Brainst
truth: SOURCE_TRUTH

claim:
Brainst likely abbreviates brainstorm
truth: INFERRED
confidence: medium
```

Critical rule:

```text
READING CONFIDENCE
      ≠
TRUTH CLASS
```

## 5. Strongest source graph

The strongest source-supported graph is:

```text
START
  ↓
PREVIOUS_PAGE_EXISTS?

  ├── YES
  │    ↓
  │  CAPTURE_EXISTING_WEB
  │    ↓
  │  READ_CODE_IF_EXISTS
  │    ↓
  │  CLIENT_ADDS_NEW_IDEAS?
  │
  │    ├── YES
  │    │    ↓
  │    │  COLLECT_CLIENT_IDEAS
  │    │    ↓
  │    │  ANALYZE_SCENARIO
  │    │    ↓
  │    │  EXECUTE_DESIGN_LIFECYCLE
  │    │    ↓
  │    │  REVIEW_NEW_WEB
  │    │    ↓
  │    │  DOCUMENT
  │    │    ↓
  │    │  DEPLOY
  │    │    ↓
  │    │  TERMINAL-LIKE MARK
  │    │
  │    └── NO
  │         ↓
  │       TERMINAL-LIKE MARK
  │
  └── NO
       ↓
     TERMINAL-LIKE MARK
```

The transform intentionally does **not** repair either `No` branch into a more logical website-delivery process.

## 6. Decision 01 — previous page exists

Source wording:

```text
¿Existe alguna página previa?
```

Normalized question candidate:

```text
PREVIOUS_WEB_ARTIFACT_EXISTS?
```

Visible branch labels:

```text
Sí
No
```

`Sí` continues into existing-site capture.

`No` reaches a crossed/shaded terminal-like mark.

This is source topology even though it appears counterintuitive for a process titled `from zero to production`.

Critical rule reinforced:

```text
BUSINESS-LOGIC SURPRISE
      ≠
LICENSE TO REPAIR SOURCE
```

Possible interpretations of the `No` branch include:

- true process termination;
- omitted continuation;
- informal notation meaning `skip recovery`;
- drawing error;
- another source-defined meaning.

Status:

```text
NO-BRANCH SEMANTICS: UNRESOLVED
```

## 7. Existing-site recovery pattern

The `Sí` branch contains two sequential activities:

```text
Tomar capturas de toda la web
        ↓
Leer código en caso exista
```

Canonical semantic candidates:

```text
CAPTURE_EXISTING_SITE_STATE
REVIEW_EXISTING_CODE_IF_AVAILABLE
```

This is not yet a tooling decision. The source does not state screenshot tooling, browser automation, repository access method, code language, or analysis technique.

The pattern is conceptually important:

```text
VISUAL RECOVERY
      +
TECHNICAL RECOVERY
```

before redesign/rebuild work.

## 8. Decision 02 — client adds new ideas

Source wording:

```text
¿El cliente agrega ideas nuevas?
```

Visible branches:

```text
Sí → Recolecta ideas del cliente
No → terminal-like mark
```

The source does not show a direct bypass from `No` to `Analizar el escenario`.

Therefore Talos must not normalize it as:

```text
NO → ANALYZE_SCENARIO
```

unless confirmed later.

This is another useful source-gap case because a domain expert may expect `No new ideas` to mean continue with the recovered baseline, but the drawing does not prove that behavior.

## 9. Client idea collection

Source label:

```text
Recolecta ideas del cliente
```

Canonical candidate:

```text
COLLECT_CLIENT_IDEAS
```

No actor identity is inferred beyond the source's mention of `cliente` as the origin of the ideas.

The source does not prove whether collection happens through interview, workshop, questionnaire, document, whiteboard, email, or another channel.

## 10. Scenario analysis

Source label:

```text
Analizar el escenario
```

Canonical candidate:

```text
ANALYZE_SCENARIO
```

The source does not define analysis dimensions, outputs, decision criteria, stakeholders, or artifacts.

## 11. Delivery lifecycle block

The large activity contains:

```text
Ejecutar el diseño
Brainst, design,
arch, plan,
build, test
```

This may represent:

1. one composite activity with descriptive substeps;
2. a subprocess containing ordered lifecycle stages;
3. a shorthand methodology note rather than explicit executable control-flow nodes.

The source does not provide separate boxes/arrows for the listed stages.

Therefore the safest canonical representation is initially:

```text
COMPOSITE_STAGE
label: Ejecutar el diseño
source-detail:
  Brainst
  design
  arch
  plan
  build
  test
```

and not automatically six separate canonical actions.

`Brainst → brainstorm` remains an inference, not source truth.

Critical rule introduced:

```text
TEXTUAL STEP LIST INSIDE ONE SHAPE
      ≠
PROVEN SEPARATE CONTROL-FLOW NODES
```

## 12. Review, documentation and deployment

The downstream source sequence is visually strong:

```text
Revisar Web nueva
      ↓
Documentar
      ↓
Hacer deploy
      ↓
terminal-like mark
```

Canonical candidates:

```text
REVIEW_NEW_WEBSITE
DOCUMENT_DELIVERY
DEPLOY_WEBSITE
```

The source does not show:

- an approval outcome after review;
- a correction loop;
- deployment failure handling;
- rollback;
- post-deployment verification.

These are gaps, not implied success behavior.

## 13. Terminal-like marks

Three crossed/shaded circular marks appear in the graph:

```text
Decision 01 / No branch
Decision 02 / No branch
post-deploy path
```

The post-deploy mark has the strongest local terminal interpretation because it follows the final visible activity.

The two decision-branch marks may also be termination, but their exact source convention is unknown.

Represent them as:

```text
SOURCE_TERMINAL_MARKER
semantic subtype: UNRESOLVED
```

until confirmed.

## 14. Temporal conceptual candidate

Only advisory:

```text
WebsiteDeliveryLifecycle ?

start
  ↓
previous site exists?
  ├── yes
  │    ↓
  │  capture current web
  │    ↓
  │  review code if available
  │    ↓
  │  client adds ideas?
  │    ├── yes
  │    │    ↓
  │    │  collect ideas
  │    │    ↓
  │    │  analyze scenario
  │    │    ↓
  │    │  execute delivery lifecycle
  │    │    ↓
  │    │  review
  │    │    ↓
  │    │  document
  │    │    ↓
  │    │  deploy
  │    │    ↓
  │    │  completion marker ?
  │    └── no → unresolved terminal/bypass semantics
  └── no → unresolved terminal/bypass semantics
```

Potential later concepts:

```text
Workflow            website-delivery case candidate
Human interactions  client idea collection / review candidate
Activities           screenshot capture / code analysis / deployment where automated
Subprocess           lifecycle block candidate
business decisions   existing site? / new ideas?
```

No mapping is executable truth.

## 15. Comparison with Quarries 01–10

### Reinforced

Q11 reinforces:

- ambiguous symbol subtype must remain unresolved (Q03/Q05/Q08/Q10);
- branch topology must not be repaired from domain expectations (Q08/Q10);
- same artifact can contain high- and medium-confidence properties (Q08);
- textual labels do not automatically establish implementation semantics;
- last visible marker and process completion semantics must remain evidence-driven.

### New / stronger evidence

Q11 introduces or sharpens:

- physical source origin distinct from digital captured representation;
- photographed paper as a first-class process-expression source;
- handwriting/transcription uncertainty at element/property level;
- informal/source-defined notation without a formal legend;
- a textual lifecycle list inside one drawn activity shape that must not automatically become separate control-flow nodes;
- logically surprising branches as source truth that must remain unrepaired;
- source-medium quality and process-semantic complexity as independent dimensions.

Important new observation:

```text
SIMPLE PROCESS
      +
DIFFICULT CAPTURE / TYPOGRAPHY
```

is different from:

```text
COMPLEX PROCESS
      +
CLEAN FORMAL SOURCE
```

TALOS must assess semantic complexity and source-perception difficulty independently.

## Transform verdict

```text
PHYSICAL ORIGIN CLASSIFICATION          ✅
DIGITAL CAPTURE REPRESENTATION          ✅
HANDWRITING TRANSCRIPTION               ✅ WITH LOCAL UNCERTAINTY
INFORMAL NOTATION CLASSIFICATION        ✅
PRIMARY GRAPH EXTRACTION                ✅
DECISION BRANCHES                       ✅ SOURCE-SUPPORTED
NO-BRANCH BUSINESS MEANING              🟡 UNRESOLVED
LIFECYCLE BLOCK DECOMPOSITION           🟡 NOT PROVEN
TERMINAL MARKER SUBTYPE                 🟡 UNRESOLVED
ACTOR / OWNERSHIP                       🟡 NOT PROVIDED
REVIEW LOOP                             🟡 NOT PROVIDED
DEPLOY FAILURE / ROLLBACK               🟡 NOT PROVIDED
TEMPORAL CANDIDATES                     ✅ SUGGESTED
TEMPORAL CODE                           ⛔ NOT NEEDED
```

Quarry 11 expands the Mining Site from digital/diagram capture semantics into **physical-origin process evidence**: Talos must preserve how a process was expressed and captured without confusing the medium, the capture, and the process meaning itself.
