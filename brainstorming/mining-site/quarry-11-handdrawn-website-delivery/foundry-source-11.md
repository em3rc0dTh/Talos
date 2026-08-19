# Quarry 11 — Foundry Source 11

## Status

`FOUNDRY-SOURCE-11` is the standardized semantic artifact emitted by `TRANSFORM-11`.

It is not Temporal code, not a deployment revision, and not executable truth. It is the controlled Mining Site handoff to the Foundry.

## Process identity

```text
process: Website Delivery from Zero to Production
quarry: quarry-11-handdrawn-website-delivery
source: source-11
transform: transform-11
foundry-source: foundry-source-11
artifact-class: PHOTOGRAPHED_HAND_DRAWN_PROCESS_SKETCH
execution-readiness: NOT_READY
```

## Source origin and capture

```text
origin:
  PHYSICAL HAND-DRAWN PROCESS SKETCH

captured representation:
  PNG PHOTO / IMAGE
  dimensions: 1293 × 1600
  sha256: d8103ded8284978420bcfc39b998653e78e54e2180619df9350afc8a0f82dc62
```

Foundry provenance rule:

```text
PHYSICAL PROCESS EXPRESSION
      ≠
DIGITAL CAPTURE REPRESENTATION
```

The captured PNG is exact evidence of the digital capture. It is not byte identity for the physical paper sheet.

## Source-reading confidence

The source is structurally simple but perception-sensitive because of handwriting.

The Foundry Source carries local uncertainty instead of one artifact-wide confidence number.

Examples:

```text
Documentar                         high text confidence
Hacer deploy                       high
Analizar el escenario              high
Tomar capturas de toda la web      high
Leer código en caso exista         high/medium
¿Existe alguna página previa?      medium/high
Recolecta ideas del cliente        medium
Brainst                            medium
```

These confidence notes do not change truth class.

## Canonical business graph

```text
START_MARKER
  ↓
D11-01 PREVIOUS_PAGE_EXISTS?
source label: ¿Existe alguna página previa?

  ├── YES
  │     ↓
  │   A11-01 CAPTURE_EXISTING_WEB
  │   source label: Tomar capturas de toda la web
  │     ↓
  │   A11-02 READ_CODE_IF_EXISTS
  │   source label: Leer código en caso exista
  │     ↓
  │   D11-02 CLIENT_ADDS_NEW_IDEAS?
  │   source label: ¿El cliente agrega ideas nuevas?
  │
  │     ├── YES
  │     │     ↓
  │     │   A11-03 COLLECT_CLIENT_IDEAS
  │     │   source label: Recolecta ideas del cliente
  │     │     ↓
  │     │   A11-04 ANALYZE_SCENARIO
  │     │   source label: Analizar el escenario
  │     │     ↓
  │     │   A11-05 EXECUTE_DESIGN_LIFECYCLE
  │     │   source label: Ejecutar el diseño
  │     │   source detail: Brainst, design, arch, plan, build, test
  │     │     ↓
  │     │   A11-06 REVIEW_NEW_WEBSITE
  │     │   source label: Revisar Web nueva
  │     │     ↓
  │     │   A11-07 DOCUMENT
  │     │   source label: Documentar
  │     │     ↓
  │     │   A11-08 DEPLOY
  │     │   source label: Hacer deploy
  │     │     ↓
  │     │   T11-03 SOURCE_TERMINAL_MARKER
  │     │
  │     └── NO
  │           ↓
  │         T11-02 SOURCE_TERMINAL_MARKER
  │
  └── NO
        ↓
      T11-01 SOURCE_TERMINAL_MARKER
```

## Node inventory

```text
S11-01  START_MARKER
D11-01  ¿Existe alguna página previa?
A11-01  Tomar capturas de toda la web
A11-02  Leer código en caso exista
D11-02  ¿El cliente agrega ideas nuevas?
A11-03  Recolecta ideas del cliente
A11-04  Analizar el escenario
A11-05  Ejecutar el diseño
         detail: Brainst, design, arch, plan, build, test
A11-06  Revisar Web nueva
A11-07  Documentar
A11-08  Hacer deploy
T11-01  crossed/shaded terminal-like mark
T11-02  crossed/shaded terminal-like mark
T11-03  crossed/shaded terminal-like mark
```

## Decision semantics

### Previous-page decision

```text
question: ¿Existe alguna página previa?
normalized candidate: PREVIOUS_WEB_ARTIFACT_EXISTS?

YES → CAPTURE_EXISTING_WEB
NO  → SOURCE_TERMINAL_MARKER
```

The `NO` path is intentionally preserved as drawn.

Foundry warning:

```text
DO NOT infer:
NO → skip recovery → continue to ideation
```

That behavior may be sensible, but the source does not prove it.

### Client-new-ideas decision

```text
question: ¿El cliente agrega ideas nuevas?
normalized candidate: CLIENT_ADDS_NEW_IDEAS?

YES → COLLECT_CLIENT_IDEAS
NO  → SOURCE_TERMINAL_MARKER
```

Again, the source does not prove a bypass to scenario analysis.

## Recovery semantics

The first positive branch provides explicit recovery work:

```text
VISUAL RECOVERY
Tomar capturas de toda la web

TECHNICAL RECOVERY
Leer código en caso exista
```

The Foundry may later design capabilities for screenshot capture, source-code access, repository analysis or technical discovery, but none are source truth yet.

## Client-input semantics

`Recolecta ideas del cliente` establishes client-originated idea collection.

It does not establish:

```text
meeting
form
email
whiteboard
chat
voice call
AI interview
```

Any of those would be later capability choices.

## Composite lifecycle block

The source places these terms inside one drawn activity-like block:

```text
Ejecutar el diseño
Brainst, design,
arch, plan,
build, test
```

Foundry rule:

```text
TEXT LIST INSIDE ONE SOURCE SHAPE
      ≠
PROVEN SIX SEPARATE PROCESS NODES
```

Initial canonical treatment:

```text
A11-05 EXECUTE_DESIGN_LIFECYCLE

source-detail:
  Brainst
  design
  arch
  plan
  build
  test
```

Possible future decomposition is allowed only after confirmation or stronger source evidence.

`Brainst → brainstorm` remains an inference.

## Review/document/deploy sequence

Source-supported downstream sequence:

```text
REVIEW_NEW_WEBSITE
      ↓
DOCUMENT
      ↓
DEPLOY
```

The source does not show:

- review result;
- approval/rejection;
- correction loop;
- staging/production environments;
- deployment failure;
- rollback;
- post-deploy verification.

These remain Foundry questions.

## Terminal-marker semantics

The three crossed/shaded circular marks are represented as:

```text
SOURCE_TERMINAL_MARKER
semantic-subtype: UNRESOLVED
```

They are not promoted to BPMN end events or successful completion states.

The post-deploy marker has the strongest contextual case for completion, but its exact meaning remains source-defined.

## Source-origin rule carried into Foundry

Q11 adds a provenance requirement that applies beyond paper sketches:

```text
ORIGIN OF PROCESS EXPRESSION
      ≠
CAPTURE METHOD
      ≠
CAPTURED REPRESENTATION
      ≠
CANONICAL PROCESS SEMANTICS
```

Examples that should remain distinguishable later:

```text
paper drawing → photo
wall whiteboard → camera image
native Talos Canvas → structured graph + optional rendered preview
external canvas → native export + screenshot
spoken process explanation → audio + transcript
```

Only Q11 itself proves the paper/photo case; the others are architectural analogies for later validation.

## Temporal design candidate

Advisory only:

```text
WebsiteDeliveryLifecycle ?

start
  ↓
previous web exists?
  ├── yes
  │    ↓
  │  capture current site
  │    ↓
  │  inspect code if available
  │    ↓
  │  client adds ideas?
  │    ├── yes
  │    │    ↓
  │    │  collect ideas
  │    │    ↓
  │    │  analyze scenario
  │    │    ↓
  │    │  execute design/delivery lifecycle
  │    │    ↓
  │    │  review website
  │    │    ↓
  │    │  document
  │    │    ↓
  │    │  deploy
  │    │    ↓
  │    │  completion ?
  │    └── no → unresolved branch semantics
  └── no → unresolved branch semantics
```

Potential later concepts:

```text
Workflow              project/delivery lifecycle candidate
Human Interaction     client idea collection / review candidate
Activity              capture / code analysis / deployment if automated
Subprocess             design lifecycle block candidate
Decision               previous site? / new ideas?
```

No option is promoted to `EXECUTABLE` by Q11.

## Foundry questions

Before any executable design, resolve:

1. What exactly does `página previa` mean: full website, landing page, previous version, or any web artifact?
2. What should happen when no previous page exists?
3. Is the `No` branch intentionally terminal, a skip-recovery marker, or an omitted continuation?
4. What type of capture is required when a previous website exists: screenshots only, crawl, content inventory, DOM snapshot, analytics, or something else?
5. Where does existing code come from and when is code unavailable?
6. Does `Leer código en caso exista` mean manual review, automated analysis, repository recovery, or mixed work?
7. What should happen when the client has no new ideas?
8. Is idea collection a required human interaction?
9. What output must `Analizar el escenario` produce?
10. Does `Brainst` mean `brainstorm`?
11. Are `Brainst, design, arch, plan, build, test` sequential stages, iterative stages, repository lifecycle categories, or descriptive notes?
12. Should the lifecycle block become a subprocess or remain one composite stage?
13. What does `Revisar Web nueva` validate and who approves it?
14. If review fails, where does the process re-enter?
15. What documentation is required before deployment?
16. What exactly does `Hacer deploy` mean: staging, production, both, or another environment?
17. What failure/rollback behavior is required for deployment?
18. Is post-deployment verification required?
19. What do the three terminal-like marks mean?
20. Which terminal outcome, if any, represents successful production completion?

## Handoff verdict

```text
PHYSICAL SOURCE ORIGIN                 ✅
CAPTURED PNG REPRESENTATION            ✅ IDENTIFIED / HASHED
CAPTURED PNG IN REPOSITORY             🟡 BINARY ATTACHMENT PENDING
INFORMAL NOTATION                      ✅
HANDWRITING INTERPRETATION             ✅ WITH LOCAL UNCERTAINTY
PRIMARY GRAPH                          ✅
PREVIOUS-PAGE DECISION                 ✅
CLIENT-IDEAS DECISION                  ✅
RECOVERY SEQUENCE                      ✅
LIFECYCLE BLOCK                        ✅ AS COMPOSITE SOURCE STAGE
LIFECYCLE SUBSTEP DECOMPOSITION        🟡 NOT PROVEN
NO-BRANCH MEANING                      🟡 UNRESOLVED
TERMINAL MARKER TYPE                   🟡 UNRESOLVED
ACTOR / OWNERSHIP                      🟡 NOT PROVIDED
REVIEW LOOP                            🟡 NOT PROVIDED
DEPLOY FAILURE / ROLLBACK              🟡 NOT PROVIDED
TEMPORAL CANDIDATES                    ✅ SUGGESTED
TEMPORAL CODE                          ⛔ NOT AUTHORIZED / NOT NEEDED
```

`FOUNDRY-SOURCE-11` is ready for comparison with later quarries. Its central contribution is that TALOS must treat **physical origin, capture representation, perception difficulty, and process semantics as separate dimensions**.
